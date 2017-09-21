import * as Noble from 'noble';
import * as NobleBase from "../index";

class HeartRatePeripheral extends NobleBase.Base {

	public readonly heartRateService: NobleBase.HeartRateService = new NobleBase.HeartRateService(this);
	public readonly batteryService: NobleBase.BatteryService = new NobleBase.BatteryService(this);

	protected async onConnectAndSetupDone() {

		try {
			if (this.heartRateService.present()) await this.heartRateService.subscribeHeartRate();
			if (this.batteryService.present()) await this.batteryService.subscribeBatteryLevel();
		} catch (error) {
			console.log(error);
		}
	}

	//connect only to devices advertising battery service
	public is(peripheral: Noble.Peripheral): boolean {
		return peripheral.advertisement.serviceUuids.indexOf(NobleBase.HeartRateService.UUIDS.Service) >= 0;
	}
}

class Application {
	public static main(): void {
		let deviceDiscoveredCallback = (peripheral: HeartRatePeripheral) => {
			peripheral.batteryService.on("batteryLevel", (level) => {
				console.log(peripheral.getDeviceId() + " battery level update: " + level.toString() + "%");
			});

			peripheral.heartRateService.on("heartRate", (result) => {
				console.log(peripheral.getDeviceId() + " HR update: " + result.heartRate.toString() + " bpm");
				console.log("\tcontact status:" + NobleBase.HeartRateService.SensorContact[result.sensorContact]);

				if (!(result.energyExpended === undefined)) {
					console.log("\tEnergy expended:" + result.energyExpended);
				}

				if (result.rrInterval.length > 0) {
					process.stdout.write("\tRR interval data: ");
					for (let i = 0; i < result.rrInterval.length; i++) {
						process.stdout.write(result.rrInterval[i].toString());
						if (i != result.rrInterval.length - 1) process.stdout.write(", ");
					}
					process.stdout.write("\n");
				}
			})
		}
		let scanHelper = new NobleBase.ScanHelper<HeartRatePeripheral>(HeartRatePeripheral, deviceDiscoveredCallback);
		scanHelper.discoverAll();
	}
}

Application.main();