# noble_base
Typescript compatible Noble base class for manipulating BLE peripheral devices

## Install
```
npm install noble_base
```

## Usage
Take a look at the `src/examples`. Basic pattern is as follows:
1. Extend `NobleBase.Base` class
    ```typescript
    class ExamplePeripheral extends NobleBase.Base {
      public is(peripheral: Noble.Peripheral): boolean {
          //return true if you want connect to this peripheral
      }

      protected async onConnectAndSetupDone() {
          //do something when peripheral is connected
      }
    }
    ```
1. Implement `is()` and `onConnectAndSetupDone()` methods
1. In your application code instantiate ScanHelper for your child class
    ```typescript
    let scanHelper = new NobleBase.ScanHelper<ExamplePeripheral>(ExamplePeripheral);
    ```
1. Start scanning
    ```typescript
    scanHelper.discoverAll();
    ```
1. Done!
