import * as Noble from 'noble';
import * as NobleBase from "../index";

class BatteryPeripheral extends NobleBase.Base {

	public readonly batteryService: NobleBase.BatteryService = new NobleBase.BatteryService(this);

	protected async onConnectAndSetupDone() {

		try {
			await this.batteryService.subscribeBatteryLevel();
		} catch (error) {
			console.log(error);
		}
	}

	//connect only to devices advertising battery service
	public is(peripheral: Noble.Peripheral): boolean {
		return peripheral.advertisement.serviceUuids.indexOf(NobleBase.BatteryService.UUIDS.Service) >= 0;
	}
}

class Application {
	public static main(): void {
		let deviceDiscoveredCallback = (peripheral: BatteryPeripheral) => {
			peripheral.batteryService.on("batteryLevel", (level) => {
				console.log(peripheral.getDeviceName() + " battery level update: " + level.toString() + "%");
			});
		}
		let scanHelper = new NobleBase.ScanHelper<BatteryPeripheral>(BatteryPeripheral, deviceDiscoveredCallback);
		scanHelper.discoverAll();
	}
}

Application.main();