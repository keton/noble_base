import * as Noble from 'noble';
import * as NobleBase from "../index";

class ScannerPeripheral extends NobleBase.Base {

	protected onConnectAndSetupDone() {
		console.log("Device id:" + this.getDeviceId() + " name:" + this.getDeviceName());
	}

	public is(peripheral: Noble.Peripheral): boolean {
		//accept all devices
		return true;
	}
}

class Application {
	public static main(): void {

		let scanHelper = new NobleBase.ScanHelper<ScannerPeripheral>(ScannerPeripheral);
		scanHelper.discoverAll();
	}
}

Application.main();