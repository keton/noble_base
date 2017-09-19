import * as Noble from 'noble';
import * as Events from 'events';
import * as NobleBase from './noble_base';

/** Generator class for children of Base */
export class ScanHelper<T extends NobleBase.Base> extends Events.EventEmitter {

    //private readonly autoConnectAndSetup: boolean;
    private shouldStartScan: boolean = false;
    private shouldDiscoverDevices: boolean = false;
    private allowScanDuplicates: boolean = true;

    private readonly defaultScanFilter: (peripheral: Noble.Peripheral) => boolean = (peripheral: Noble.Peripheral) => { return true };
    private scanFilter: (peripheral: Noble.Peripheral) => boolean = this.defaultScanFilter;

    /**
     * @constructor
     * @param deviceType Same type as generic passed to constructor
     * @param deviceDiscoveredCallback optionall function called when connectAndSetup() is complete
     * @param autoConnectAndSetup automatically perform connectAndSetup() of underlying peripheral
     */
    constructor(private deviceType: new () => T, deviceDiscoveredCallback?: (peripheral: T) => void, private readonly autoConnectAndSetup: boolean = true) {

        super();

        Noble.on("discover", this.onDiscover.bind(this));
        Noble.on("stateChange", this.onNobleStateChange.bind(this));
        Noble.on("scanStop", this.onScanStop.bind(this));

        if (deviceDiscoveredCallback) this.on('discoveredDevice', deviceDiscoveredCallback);
    }

    /** Instantiates underlying peripheral */
    private createDeviceInstance(): T {
        return new this.deviceType();
    }

    private async onDiscover(peripheral: Noble.Peripheral) {

        //bail out if device discovery is disabled
        if (!this.shouldDiscoverDevices || !this.scanFilter(peripheral)) return;

        //bail out if discovered peripheral is not connectable
        if (peripheral.state != 'disconnected') {
            return;
        }

        const device: T = this.createDeviceInstance();
        if (device.is(peripheral)) {

            device.attachPeripheral(peripheral);

            if (this.autoConnectAndSetup) {
                try {
                    //execute connectAndSetup() for the device before emiting 'discoveredDevice' event
                    await device.connectAndSetup();
                    this.emit('discoveredDevice', device);
                } catch (error) {
                    console.log("error");
                }
            } 
            else {
                //just emit 'discoveredDevice' event
                this.emit('discoveredDevice', device);
            }
        }
    }

    private onNobleStateChange(state: string) {
        //start scan if requested
        if (state == "poweredOn" && this.shouldStartScan) {
            this.shouldStartScan = false;
            Noble.startScanning([], this.allowScanDuplicates);
        }
    }

    private onScanStop() {
        //restart scanning if device discovery is in progress
        if (this.shouldDiscoverDevices) this.scanStart();
    }

    /**
     * Start BLE scan
     * @param allowDuplicates allow duplicate scan results
     */
    public scanStart(allowDuplicates: boolean = true): void {
        this.allowScanDuplicates = allowDuplicates;

        //if BLE adapter is ready start scan
        if (Noble.state == "poweredOn") Noble.startScanning([], this.allowScanDuplicates);
        //request scan when adapter will be ready
        else this.shouldStartScan = true;

        this.shouldDiscoverDevices = true;
    }

    /** Stop BLE scan */
    public scanStop(): void {
        this.shouldDiscoverDevices = false;
        this.shouldStartScan = false;

        if (Noble.state == "poweredOn") {
            Noble.stopScanning()
        }
    }

    private disableDiscoveryCallback() {
        this.shouldDiscoverDevices = false;
    }

    private removeDisableDiscoveryCallback() {
        this.removeListener('discoveredDevice', this.disableDiscoveryCallback);
    }

    /** Discover single BLE device that corresponds to underlying peripheral class */
    public discoverOnce(): void {
        this.once('discoveredDevice', this.disableDiscoveryCallback.bind(this));
        this.scanStart();
    }

    /** Start continous discovery of BLE devices that correspond to underlying peripheral class */
    public discoverAll() {
        this.removeDisableDiscoveryCallback();
        this.scanStart();
    }

    /** Stop BLE device discovery */
    public stopDiscovery(stopScanning: boolean = true) {
        this.shouldDiscoverDevices = false;
        if (stopScanning) this.scanStop();
    }

    /** Set scan filter applied on top of Base.is() results */
    public setScanFilter(scanFilter: (peripheral: Noble.Peripheral) => boolean) {
        this.scanFilter = scanFilter;
    }

    /** Remove scan filter */
    public removeScanFilter() {
        this.scanFilter = this.defaultScanFilter;
    }

    public on(event: 'discoveredDevice', listener: ((device: T) => void)) {
        return super.on(event, listener);
    }
}