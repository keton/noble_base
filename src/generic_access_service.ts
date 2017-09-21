import * as Noble from 'noble';
import * as Events from 'events';
import * as NobleBase from './noble_base';

/** BLE mandatory GAP service class */
export class GenericAccessService {

	public static readonly UUIDS = {
		Service: '1800',
		DeviceName: '2a00',
		Apperance: '2a01'
	}

	constructor(private readonly baseDevice: NobleBase.Base) {
	}

	public readDeviceName(): Promise<string> {
		return this.baseDevice.readStringCharacterisitc(GenericAccessService.UUIDS.Service, GenericAccessService.UUIDS.DeviceName);
	}

	public readApperance(): Promise<GenericAccessService.Apperance> {
		return new Promise<GenericAccessService.Apperance>(async (resolve, reject) => {
			try {
				var apperanceId = await this.baseDevice.readUInt16LECharacterisitc(GenericAccessService.UUIDS.Service, GenericAccessService.UUIDS.Apperance);
				resolve(apperanceId);
			}
			catch (error) {
				reject(error);
			}
		});
	}
}

export module GenericAccessService {
	/** GAP apperance types */
	export enum Apperance {
		Unknown = 0,
		GenericPhone = 64,
		GenericComputer = 128,
		GenericWatch = 192,
		WatchSportsWatch = 193,
		GenericClock = 256,
		GenericDisplay = 320,
		GenericRemoteControl = 384,
		GenericEyeglasses = 448,
		GenericTag = 512,
		GenericKeyring = 576,
		GenericMediaPlayer = 640,
		GenericBarcodeScanner = 704,
		GenericThermometer = 768,
		ThermometerEar = 769,
		GenericHeartrateSensor = 832,
		HeartRateSensorHeartRateBelt = 833,
		GenericBloodPressure = 896,
		BloodPressureArm = 897,
		BloodPressureWrist = 898,
		HumanInterfaceDevice = 960,
		Keyboard = 961,
		Mouse = 962,
		Joystick = 963,
		Gamepad = 964,
		DigitizerTablet = 965,
		CardReader = 966,
		DigitalPen = 967,
		BarcodeScanner = 968,
		GenericGlucoseMeter = 1024,
		GenericRunningWalkingSensor = 1088,
		RunningWalkingSensorInShoe = 1089,
		RunningWalkingSensorOnShoe = 1090,
		RunningWalkingSensorOnHip = 1091,
		GenericCycling = 1152,
		CyclingCyclingComputer = 1153,
		CyclingSpeedSensor = 1154,
		CyclingCadenceSensor = 1155,
		CyclingPowerSensor = 1156,
		CyclingSpeedandCadenceSensor = 1157,
		GenericControlDevice = 1216,
		Switch = 1217,
		Multiswitch = 1218,
		Button = 1219,
		Slider = 1220,
		Rotary = 1221,
		Touchpanel = 1222,
		GenericNetworkDevice = 1280,
		AccessPoint = 1281,
		GenericSensor = 1344,
		MotionSensor = 1345,
		AirQualitySensor = 1346,
		TemperatureSensor = 1347,
		HumiditySensor = 1348,
		LeakSensor = 1349,
		SmokeSensor = 1350,
		OccupancySensor = 1351,
		ContactSensor = 1352,
		CarbonMonoxideSensor = 1353,
		CarbonDioxideSensor = 1354,
		AmbientLightSensor = 1355,
		EnergySensor = 1356,
		ColorLightSensor = 1357,
		RainSensor = 1358,
		FireSensor = 1359,
		WindSensor = 1360,
		ProximitySensor = 1361,
		MultiSensor = 1362,
		GenericLightFixtures = 1408,
		WallLight = 1409,
		CeilingLight = 1410,
		FloorLight = 1411,
		CabinetLight = 1412,
		DeskLight = 1413,
		TrofferLight = 1414,
		PendantLight = 1415,
		IngroundLight = 1416,
		FloodLight = 1417,
		UnderwaterLight = 1418,
		BollardwithLight = 1419,
		PathwayLight = 1420,
		GardenLight = 1421,
		PoletopLight = 1422,
		Spotlight = 1423,
		LinearLight = 1424,
		StreetLight = 1425,
		ShelvesLight = 1426,
		HighbayLowbayLight = 1427,
		EmergencyExitLight = 1428,
		GenericFan = 1472,
		CeilingFan = 1473,
		AxialFan = 1474,
		ExhaustFan = 1475,
		PedestalFan = 1476,
		DeskFan = 1477,
		WallFan = 1478,
		GenericHVAC = 1536,
		Thermostat = 1537,
		GenericAirConditioning = 1600,
		GenericHumidifier = 1664,
		GenericHeating = 1728,
		Radiator = 1729,
		Boiler = 1730,
		HeatPump = 1731,
		InfraredHeater = 1732,
		RadiantPanelHeater = 1733,
		FanHeater = 1734,
		AirCurtain = 1735,
		GenericAccessControl = 1792,
		AccessDoor = 1793,
		GarageDoor = 1794,
		EmergencyExitDoor = 1795,
		AccessLock = 1796,
		Elevator = 1797,
		Window = 1798,
		EntranceGate = 1799,
		GenericMotorizedDevice = 1856,
		MotorizedGate = 1857,
		Awning = 1858,
		BlindsorShades = 1859,
		Curtains = 1860,
		Screen = 1861,
		GenericPowerDevice = 1920,
		PowerOutlet = 1921,
		PowerStrip = 1922,
		Plug = 1923,
		PowerSupply = 1924,
		LEDDriver = 1925,
		FluorescentLampGear = 1926,
		HIDLampGear = 1927,
		GenericLightSource = 1984,
		IncandescentLightBulb = 1985,
		LEDBulb = 1986,
		HIDLamp = 1987,
		FluorescentLamp = 1988,
		LEDArray = 1989,
		MultiColorLEDArray = 1990,
		GenericPulseOximeter = 3136,
		Fingertip = 3137,
		WristWorn = 3138,
		GenericWeightScale = 3200,
		GenericPersonalMobilityDevice = 3264,
		PoweredWheelchair = 3265,
		MobilityScooter = 3266,
		GenericContinuousGlucoseMonitor = 3328,
		GenericOutdoorSportsActivity = 5184,
		LocationDisplayDevice = 5185,
		LocationandNavigationDisplayDevice = 5186,
		LocationPod = 5187,
		LocationandNavigationPod = 5188,
	}
}