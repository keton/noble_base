import * as Noble from 'noble';
import * as Events from 'events';
import * as NobleBase from './noble_base';

/** BLE Device Information Service class */
export class DeviceInformationService {

    /** Service UUID table */
    public static readonly UUIDS = {
        Service: '180a',
        SystemId: '2a23',
        ModelNumber: '2a24',
        SerialNumber: '2a25',
        FirmwareRevision: '2a26',
        HardwareRevision: '2a27',
        SoftwareRevision: '2a28',
        ManufacturerName: '2a29',
    }

    constructor(private readonly baseDevice: NobleBase.Base) {
    }

    public readSystemId(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                const data = await this.baseDevice.readDataCharacterisitc(DeviceInformationService.UUIDS.Service, DeviceInformationService.UUIDS.SystemId);
                let systemIdRegExp = data.toString('hex').match(/.{1,2}/g);
                if (!systemIdRegExp) reject('malformed systemId: ' + data.toString('hex'));
                else resolve(systemIdRegExp.reverse().join(':'));
            }
            catch (error) {
                reject(error);
            }
        });
    }

    public readModelNumber(): Promise<string> {
        return this.baseDevice.readStringCharacterisitc(DeviceInformationService.UUIDS.Service, DeviceInformationService.UUIDS.ModelNumber);
    }

    public readSerialNumber(): Promise<string> {
        return this.baseDevice.readStringCharacterisitc(DeviceInformationService.UUIDS.Service, DeviceInformationService.UUIDS.SerialNumber);
    }

    public readFirmwareRevision(): Promise<string> {
        return this.baseDevice.readStringCharacterisitc(DeviceInformationService.UUIDS.Service, DeviceInformationService.UUIDS.FirmwareRevision);
    }

    public readHardwareRevision(): Promise<string> {
        return this.baseDevice.readStringCharacterisitc(DeviceInformationService.UUIDS.Service, DeviceInformationService.UUIDS.HardwareRevision);
    }

    public readSoftwareRevision(): Promise<string> {
        return this.baseDevice.readStringCharacterisitc(DeviceInformationService.UUIDS.Service, DeviceInformationService.UUIDS.SoftwareRevision);
    }

    public readManufacturerName(): Promise<string> {
        return this.baseDevice.readStringCharacterisitc(DeviceInformationService.UUIDS.Service, DeviceInformationService.UUIDS.SoftwareRevision);
    }

    /** Returns true if Device Information service is present in underlying peripheral */
    public present(): boolean {
        return this.baseDevice.hasService(DeviceInformationService.UUIDS.Service);
    }
}