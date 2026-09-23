## QtPi App Classification

This folder is now split by board generation and maintenance status.

### Current ESP32

Use the current ESP32 test and reference apps generated from the live QtPi ESP32/App Inventor stack:

- [/Users/nemmart/antony/qtpi/repos/code2play/QtPiFirmata/appinventor_test/generated](/Users/nemmart/antony/qtpi/repos/code2play/QtPiFirmata/appinventor_test/generated)
- [/Users/nemmart/antony/qtpi/repos/code2play/QtPiFirmata/appinventor_test/generated/veda-esp32](/Users/nemmart/antony/qtpi/repos/code2play/QtPiFirmata/appinventor_test/generated/veda-esp32)

These are the current apps for:
- `veda-esp32`
- current QtPi Firmata contracts
- current App Inventor component versions

### Legacy ATmega Era

Older shared `.aia` files have been moved under:

- [legacy/veda-atmega](/Users/nemmart/antony/qtpi/repos/code2play/qtpi-shared/apks/legacy/veda-atmega)
- [legacy/rio-atmega](/Users/nemmart/antony/qtpi/repos/code2play/qtpi-shared/apks/legacy/rio-atmega)

Important:
- The legacy apps use an older App Inventor project format.
- Most of them are `YaVersion=208` / `Form $Version=27`.
- They should be treated as reference/inspiration first, not as the current ESP32 test baseline.

### Classification Rule

- `current-esp32`
  current-generated QtPi test/reference apps for ESP32
- `legacy/veda-atmega`
  older QtPi shared apps inferred to be from the pre-ESP32 Veda/ATmega era
- `legacy/rio-atmega`
  reserved for Rio/ATmega legacy apps when they are identified with confidence

See also:

- [/Users/nemmart/antony/qtpi/repos/code2play/QtPiFirmata/appinventor_test/APP_CATALOG.md](/Users/nemmart/antony/qtpi/repos/code2play/QtPiFirmata/appinventor_test/APP_CATALOG.md)
