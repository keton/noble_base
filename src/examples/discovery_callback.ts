import * as Noble from 'noble';
import * as NobleBase from "../index";

class SimplePeripheral extends NobleBase.Base {

    //example service definition
    public readonly genericAccessService: NobleBase.GenericAccessService = new NobleBase.GenericAccessService(this);

    /** Automatically called when peripheral is connected and services are enumerated */
    protected async onConnectAndSetupDone() {

        try {

            const deviceName = await this.genericAccessService.readDeviceName();
            const apperance = await this.genericAccessService.readApperance();
            console.log("Device: " + deviceName + " apperance: " + NobleBase.GenericAccessService.Apperance[apperance]);

        } catch (error) {
            console.log(error);
        }

    }

    /** Returns true if we should connect to this peripheral */
    public is(peripheral: Noble.Peripheral): boolean {
        //accept all peripherals
        return true;
    }
}

class Application {
    public static main(): void {

        //called each time new SimplePeripheral is connected
        const deviceDiscoveredCallback = (peripheral: SimplePeripheral) => {
            console.log("New device discovered: " + peripheral.getDeviceId() + " - " + peripheral.getDeviceName());
        }

        let scanHelper = new NobleBase.ScanHelper<SimplePeripheral>(SimplePeripheral, deviceDiscoveredCallback);
        scanHelper.discoverAll();
    }
}

Application.main();