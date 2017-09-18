import * as Noble from 'noble';
import * as Events from 'events';
import * as NobleBase from './noble_base';

/** Heart rate measurement result */
export class HeartRateResult {

    /** Heart rate in bpm */
    public readonly heartRate: number;

    /** Sensor contact status */
    public readonly sensorContact: HeartRateService.SensorContact;

    /** Energy expended in Joules */
    public readonly energyExpended: number;

    /** RR (beat to beat) interval in 1/1024s units */
    public readonly rrInterval: Array<number>;

    constructor(data: Buffer) {
        const is16bit = this.is16bitValue(data);
        const hasRRInt = this.rrIntervalPresent(data);
        const hasEE = this.energyExpandedPresent(data);
        this.sensorContact = this.decodeSensorContact(data);

        //start at byte 1 - first byte of HR value
        let currByte = 1;

        //decode HR value
        if (is16bit) {
            this.heartRate = data.readUInt16LE(currByte);
            currByte += 2;
        }
        else {
            this.heartRate = data.readUInt8(currByte);
            currByte += 1;
        }

        //decode energy expanded field if present
        if (hasEE) {
            this.energyExpended = data.readUInt16LE(currByte);
            currByte += 2;
        }

        if (!hasRRInt) return;

        this.rrInterval = new Array<number>();
        for (; currByte < data.length; currByte += 2) {
            this.rrInterval.push(data.readUInt16LE(currByte));
        }
    }

    private is16bitValue(data: Buffer): boolean {
        return (data[0] & 0x01) == 1;
    }

    private decodeSensorContact(data: Buffer): HeartRateService.SensorContact {
        return (data[0] >> 1) & 0x03;
    }

    private energyExpandedPresent(data: Buffer): boolean {
        return ((data[0] >> 3) & 0x01) == 1;
    }

    private rrIntervalPresent(data: Buffer): boolean {
        return ((data[0] >> 4) & 0x01) == 1;
    }
}

/** BLE Heart rate Measurement Service */
export class HeartRateService extends Events.EventEmitter {
    /** Service UUID table */
    public static readonly UUIDS = {
        Service: '180d',
        HeartRate: '2a37',
        SensorLocation: '2a38',
        ControlPoint: '2a39'
    }

    constructor(private readonly baseDevice: NobleBase.Base) {
        super();
    }

    public readHeartRate(): Promise<number> {
        return this.baseDevice.readUInt8Characterisitc(HeartRateService.UUIDS.Service, HeartRateService.UUIDS.HeartRate);
    }

    public readSensorLocation(): Promise<HeartRateService.SensorLocation> {
        return this.baseDevice.readUInt8Characterisitc(HeartRateService.UUIDS.Service, HeartRateService.UUIDS.SensorLocation);
    }

    public resetEnergyExpended(): Promise<void> {
        return this.baseDevice.writeUInt8Characterisitc(HeartRateService.UUIDS.Service, HeartRateService.UUIDS.ControlPoint, 1);
    }

    private onHeartRateNotification = (data: Buffer) => {
        return this.emit('heartRate', new HeartRateResult(data));
    }

    public subscribeHeartRate(): Promise<void> {
        return this.baseDevice.subscribeCharacteristic(HeartRateService.UUIDS.Service, HeartRateService.UUIDS.HeartRate, this.onHeartRateNotification);
    }

    public unsubscribeHeartRate(): Promise<void> {
        return this.baseDevice.unsubscribeCharacteristic(HeartRateService.UUIDS.Service, HeartRateService.UUIDS.HeartRate, this.onHeartRateNotification);
    }

    /** Returns true if service is present in underlying peripheral */
    public present(): boolean {
        return this.baseDevice.hasService(HeartRateService.UUIDS.Service);
    }

    public on(event: "heartRate", listener: (heartRateResult: HeartRateResult) => void) {
        return super.on(event, listener);
    }
}

export module HeartRateService {

    /** Body sensor loacation as per BLE spec. */
    export enum SensorLocation {
        Other = 0,
        Chest = 1,
        Wrist = 2,
        Finger = 3,
        Hand = 4,
        EarLobe = 5,
        Foot = 6
    }

    /** Body sensor contact status as per BLE spec. */
    export enum SensorContact {
        NotSupported = 0,
        NotSupported2 = 1,
        NotDetected = 2,
        Detected = 3
    }
}