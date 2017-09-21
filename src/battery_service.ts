import * as Noble from 'noble';
import * as Events from 'events';
import * as NobleBase from './noble_base';

export class BatteryService extends Events.EventEmitter {
	/** Service UUID table */
	public static readonly UUIDS = {
		Service: '180f',
		BatteryLevel: '2a19'
	}

	constructor(private readonly baseDevice: NobleBase.Base) {
		super();
	}

	public readBatteryLevel(): Promise<number> {
		return this.baseDevice.readUInt8Characterisitc(BatteryService.UUIDS.Service, BatteryService.UUIDS.BatteryLevel);
	}

	private onBatteryLevelNotification = (data: Buffer) => {
		return this.emit('batteryLevel', data.readUInt8(0));
	}

	public subscribeBatteryLevel(): Promise<void> {
		return this.baseDevice.subscribeCharacteristic(BatteryService.UUIDS.Service, BatteryService.UUIDS.BatteryLevel, this.onBatteryLevelNotification);
	}

	public unsubscribeBatteryLevel(): Promise<void> {
		return this.baseDevice.unsubscribeCharacteristic(BatteryService.UUIDS.Service, BatteryService.UUIDS.BatteryLevel, this.onBatteryLevelNotification);
	}

	/** Returns true if Battery service is present in underlying peripheral */
	public present(): boolean {
		return this.baseDevice.hasService(BatteryService.UUIDS.Service);
	}

	public on(event: "batteryLevel", listener: (batteryLevel: number) => void) {
		return super.on(event, listener);
	}

}