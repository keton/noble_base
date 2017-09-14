import * as Noble from 'noble';
import * as NobleBase from "../index";
import * as Process from 'process';

class SimplePeripheral extends NobleBase.Base {

    //example service definition
    public readonly genericAccessService: NobleBase.GenericAccessService = new NobleBase.GenericAccessService(this);

    /** Automatically called when peripheral is connected and services are enumerated */
    protected async onConnectAndSetupDone() {

        try {

            const deviceName = await this.genericAccessService.readDeviceName();
            const apperance = await this.genericAccessService.readApperance();
            console.log("Mac: " + this.getDeviceId() + " Name: " + deviceName + " apperance: " + NobleBase.GenericAccessService.Apperance[apperance]);

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
    public static main(argv: string[]): void {

        let scanHelper = new NobleBase.ScanHelper<SimplePeripheral>(SimplePeripheral);

        if (argv.length != 2) {
            console.log("Usage: node " + argv[0] + " <BLE peripheral MAC address of local name>");
            Process.exit(-1);
        }

        //scan filter applied on SimplePeripheral.is
        scanHelper.setScanFilter((peripheral) => {
            //connect only to device specified as commandline parameter
            return peripheral.id == argv[1].toLowerCase() || peripheral.advertisement.localName == argv[1];
        });

        scanHelper.discoverAll();
    }
}

Application.main(Process.argv.slice(1));