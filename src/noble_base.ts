import * as Noble from 'noble';
import * as Events from 'events';

/** Noble peripheral base class, extend this to create BLE peripherals */
export abstract class Base extends Events.EventEmitter {

    protected peripheral: Noble.Peripheral;
    protected servicesMap: Map<string, Noble.Service>;
    protected characteristicMap: Map<string, Map<string, Noble.Characteristic>>;

    private onBaseConnect(error: string) {
        this.emit('connect', error);
    }

    private onBaseDisconnect(error: string) {
        this.characteristicMap = new Map<string, Map<string, Noble.Characteristic>>();
        this.servicesMap = new Map<string, Noble.Service>();
        this.emit('disconnect', error);
    }

    /** Called after BLE connection is estabilished and Services are enumerated. Override this to provide custom setup function */
    protected abstract onConnectAndSetupDone(): void;

    /** Returns true if we should connect to this peripheral */
    public abstract is(peripheral: Noble.Peripheral): boolean;

    constructor() {
        super();
        this.characteristicMap = new Map<string, Map<string, Noble.Characteristic>>();
        this.servicesMap = new Map<string, Noble.Service>();

        this.once("connectAndSetupDone", this.onConnectAndSetupDone.bind(this));
    }

    /** Add Noble peripheral instance for this device.
     *  This should be done before any other operations are performed, typically from generator class like ScanHelper instance. 
     * */
    public attachPeripheral(peripheral: Noble.Peripheral) {
        this.peripheral = peripheral;
        this.peripheral.once("connect", this.onBaseConnect.bind(this));
        this.peripheral.once("disconnect", this.onBaseDisconnect.bind(this));
    }

    /** Connect to this device */
    public connect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.peripheral) {
                reject("Peripheral not attached!");
                return;
            }
            this.peripheral.connect((error?: string) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    /** Perform BLE device disconnect */
    public disconnect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.peripheral) {
                reject("Peripheral not attached!");
                return;
            }
            this.peripheral.disconnect(() => {
                resolve();
            });
        });
    }

    /** Enumerate GATT tree of underlying BLE peripheral */
    protected discoverServicesAndCharacteristics(): Promise<Noble.Service[]> {
        return new Promise<Noble.Service[]>((resolve, reject) => {
            if (!this.peripheral) {
                reject("Peripheral not attached!");
                return;
            }
            this.peripheral.discoverAllServicesAndCharacteristics((error: string, services: Noble.Service[], characteristics: Noble.Characteristic[]) => {
                if (error) reject(error);
                else resolve(services);
            });
        });
    }

    /** Store services and characteristics objects for furher lookup */
    private parseServices(services: Noble.Service[]): void {
        this.servicesMap = new Map();
        this.characteristicMap = new Map();

        for (let service of services) {
            this.servicesMap.set(service.uuid, service);

            let charMap: Map<string, Noble.Characteristic> = new Map();

            for (let characteristic of service.characteristics) {
                charMap.set(characteristic.uuid, characteristic);
            }
            this.characteristicMap.set(service.uuid, charMap);
        }
    }

    /** Connect, enumerate services and call onConnectAndSetupDone() from the child class */
    public async connectAndSetup() {
        try {
            await this.connect();
            let services = await this.discoverServicesAndCharacteristics();
            this.parseServices(services);
            this.emit('connectAndSetupDone');

            return Promise.resolve();
        }
        catch (error) {
            console.log("connectAndSetup error:%s", error);
            
            return Promise.reject(error);
        }
    }

    /** Returns true if connected BLE device has service with specified UUID */
    public hasService(serviceUUID: string): boolean {
        return this.servicesMap.has(serviceUUID);
    }

    /** Returns true if connected BLE device has characteristic with specified UUID */
    public hasCharacteristic(serviceUUID: string, characteristicUUID: string): boolean {
        if (!this.characteristicMap.has(serviceUUID) || !this.hasService(serviceUUID)) return false;

        const serviceMap = this.characteristicMap.get(serviceUUID);
        if (!serviceMap) return false;
        return serviceMap.has(characteristicUUID);
    }

    protected getCharacteristic(serviceUUID: string, characteristicUUID: string): Noble.Characteristic | undefined {
        if (!this.hasService(serviceUUID)) {
            console.error("service %s not found!", serviceUUID);
            return undefined;
        }
        if (!this.hasCharacteristic(serviceUUID, characteristicUUID)) {
            console.error("service %s doesn't have characteristic %s", serviceUUID, characteristicUUID);
            return undefined;
        }

        const serviceMap = this.characteristicMap.get(serviceUUID);
        if (!serviceMap) {
            console.error("characteristicMap doesn't have service %s!", serviceUUID);
            return undefined;
        }

        const characteristic = serviceMap.get(characteristicUUID);
        if (!characteristic) {
            console.error("serviceMap %s doesn't have characteristic %s!", serviceUUID, characteristicUUID);
            return undefined;
        }
        return characteristic;
    }

    /** Read characteristic data as Buffer */
    public readDataCharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {

            const characteristic = this.getCharacteristic(serviceUUID, characteristicUUID);
            if (!characteristic) {
                reject("serviceMap " + serviceUUID + " doesn't have characteristic " + characteristicUUID + "!");
                return;
            }

            characteristic.read((error: string, data: Buffer) => {
                if (error) reject(error);
                else resolve(data);
            });
        });
    }

    /** Write Buffer to characteristic */
    public writeDataCharacterisitc(serviceUUID: string, characteristicUUID: string, data: Buffer): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            const characteristic = this.getCharacteristic(serviceUUID, characteristicUUID);
            if (!characteristic) {
                reject("serviceMap " + serviceUUID + " doesn't have characteristic " + characteristicUUID + "!");
                return;
            }

            var withoutResponse = (characteristic.properties.indexOf('writeWithoutResponse') !== -1) &&
                (characteristic.properties.indexOf('write') === -1);

            characteristic.write(data, withoutResponse, (error: string) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    /** Enable characterisitc notification and attach listener */
    public subscribeCharacteristic(serviceUUID: string, characteristicUUID: string, listener: (data: Buffer) => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            const characteristic = this.getCharacteristic(serviceUUID, characteristicUUID);
            if (!characteristic) {
                reject("serviceMap " + serviceUUID + " doesn't have characteristic " + characteristicUUID + "!");
                return;
            }

            characteristic.subscribe((error: string) => {
                if (error) {
                    reject(error);
                    return;
                }
                characteristic.addListener("data", listener);
                resolve();
            });
        });
    }

    /** Disable characterisitc notification and detach listener */
    public unsubscribeCharacteristic(serviceUUID: string, characteristicUUID: string, listener: (data: Buffer) => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            const characteristic = this.getCharacteristic(serviceUUID, characteristicUUID);
            if (!characteristic) {
                reject("serviceMap " + serviceUUID + " doesn't have characteristic " + characteristicUUID + "!");
                return;
            }

            characteristic.unsubscribe((error: string) => {
                if (error) {
                    reject(error);
                    return;
                }
                characteristic.removeListener("data", listener);
                resolve();
            });
        });
    }

    public readStringCharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.toString());
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readUInt8Characterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readUInt8(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readInt8Characterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readInt8(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readUInt16LECharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readUInt16LE(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readUInt16BECharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readUInt16BE(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readUInt32LECharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readUInt32LE(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readUInt32BECharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readUInt32BE(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readInt16LECharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readInt16LE(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readInt16BECharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readInt16BE(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    /** Read characteristic data as UInt32 Little Endian */
    public readInt32LECharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readInt32LE(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    /** Read characteristic data as UInt32 Big Endian */
    public readInt32BECharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readInt32BE(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readFloatLECharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readFloatLE(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readFloatBECharacterisitc(serviceUUID: string, characteristicUUID: string): Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            try {
                const data: Buffer = await this.readDataCharacterisitc(serviceUUID, characteristicUUID);
                resolve(data.readFloatBE(0));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeStringCharacterisitc(serviceUUID: string, characteristicUUID: string, data: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, new Buffer(data));
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeUInt8Characterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(1);
                buffer.writeUInt8(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeInt8Characterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(1);
                buffer.writeInt8(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeUInt16LECharacterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(2);
                buffer.writeUInt16LE(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeUInt16BECharacterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(2);
                buffer.writeUInt16BE(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeInt16LECharacterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(2);
                buffer.writeInt16LE(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeInt16BECharacterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(2);
                buffer.writeInt16BE(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeUInt32LECharacterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(4);
                buffer.writeUInt32LE(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeUInt32BECharacterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(4);
                buffer.writeUInt32BE(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeInt32LECharacterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(4);
                buffer.writeInt32LE(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeInt32BECharacterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(4);
                buffer.writeInt32BE(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeFloatLECharacterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(4);
                buffer.writeFloatLE(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public writeFloatBECharacterisitc(serviceUUID: string, characteristicUUID: string, data: number): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let buffer = new Buffer(4);
                buffer.writeFloatBE(data, 0);
                await this.writeDataCharacterisitc(serviceUUID, characteristicUUID, buffer);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }

    /** Get device MAC address as hex string */
    public getDeviceId(): string {
        if (!this.peripheral) return "";
        return this.peripheral.id;
    }

    /** Get device advertised local name */
    public getDeviceName(): string {
        if (!this.peripheral) return "";
        return this.peripheral.advertisement.localName;
    }

    public on(event: "connect" | "disconnect" | "connectAndSetupDone", listener: ((error: string) => void)) {
        return super.on(event, listener);
    }
};