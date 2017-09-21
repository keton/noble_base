import * as Noble from 'noble';
import * as NobleBase from "../index";

class SimplePeripheral extends NobleBase.Base {

	public readonly genericAccessService: NobleBase.GenericAccessService = new NobleBase.GenericAccessService(this);

	protected async onConnectAndSetupDone() {

		try {

			const deviceName = await this.genericAccessService.readDeviceName();
			const apperance = await this.genericAccessService.readApperance();
			console.log("Mac: " + this.getDeviceId() + " Name: " + deviceName + " apperance: " + NobleBase.GenericAccessService.Apperance[apperance]);

		} catch (error) {
			console.log(error);
		}

	}

	public is(peripheral: Noble.Peripheral): boolean {
		return true;
	}
}

class Application {
	public static main(): void {

		let scanHelper = new NobleBase.ScanHelper<SimplePeripheral>(SimplePeripheral);
		scanHelper.discoverAll();
	}
}

Application.main();