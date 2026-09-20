# QtPi Firmware Release Catalog & Consumer Guide

This guide documents the latest official firmware releases, manifest endpoints, flash configurations, and consumer integration workflows for the QtPi hardware platform.

---

## 1. Catalog & Manifest Endpoints

All manifests are hosted in the [`qtpi-shared`](https://github.com/QtLearnCodeLab/qtpi-shared) repository and mirrored through GitHub Pages with CORS enabled (`Access-Control-Allow-Origin: *`):

| Manifest / Resource | Schema | Primary CDN (GitHub Pages / CORS) | Raw GitHub Fallback |
| :--- | :---: | :--- | :--- |
| **Manifest v2** *(Recommended)* | `v2` | `https://qtlearncodelab.github.io/qtpi-shared/firmware/manifest-v2.json` | `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/manifest-v2.json` |
| **Manifest v1** *(Legacy)* | `v1` | `https://qtlearncodelab.github.io/qtpi-shared/firmware/manifest.json` | `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/manifest.json` |
| **Firmata Latest Pointer** | `v1` | `https://qtlearncodelab.github.io/qtpi-shared/firmware/veda-esp32/firmata-dual/latest.json` | `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/veda-esp32/firmata-dual/latest.json` |
| **MicroPython Latest Pointer** | `v1` | `https://qtlearncodelab.github.io/qtpi-shared/firmware/veda-esp32/micropython/latest.json` | `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/veda-esp32/micropython/latest.json` |

---

## 2. Latest Firmware Releases

### Summary Matrix

| Board ID | Flavor ID | Version | MCU / Protocol | Format | Flash Offset | Binary Size | SHA-256 Digest |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **`qtpi-veda-esp32`** | `firmata-dual` | **`1.0.6`** | ESP32 (`esptool`) | `bin` (merged) | `0x0000` | 1,334,272 B | `7367e6f2a1d2af6ab283ed0a9d2cd183b443b3fe5d83422f08478021fde6621c` |
| **`qtpi-veda-esp32`** | `micropython` | **`1.1.0`** | ESP32 (`esptool`) | `bin` (merged) | `0x0000` | 15,794,176 B | `25fa11e07f90cfe3cad24e0714e3b7765b766f3c8191a48495fc77a5aadc2df4` |
| **`qtpi-veda-2560`** | `firmata` | **`1.0.4`** | ATmega2560 (`stk500v2`) | `hex` | — | 96,985 B | `0af74c81c01e26e569583db5f54b8b992b2be90fd65ce4c2dc48130a28bda1b0` |
| **`qtpi-rio-328p`** | `firmata` | **`1.0.2`** | ATmega328P (`stk500v1`) | `hex` | — | 77,344 B | `4108937093e5d7d43741ad5f0a382adcca4153e0f50fea4ad448a06817d2ba49` |

---

## 3. Firmware Details & Direct Download Links

### 1. QtPi Veda ESP32 — Firmata Dual-Mode (`v1.0.6`)
- **Board / Flavor**: `qtpi-veda-esp32` / `firmata-dual`
- **Purpose**: Simultaneous BLE GATT, Bluetooth SPP, and USB Firmata for Code2Play / App Inventor.
- **Direct Download URL**:
  `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/veda-esp32/firmata-dual/v1.0.6/qtpi-esp32-firmata-v1.0.6.bin`
- **Release Descriptor URL**:
  `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/veda-esp32/firmata-dual/v1.0.6/release.json`
- **Flash Configuration**:
  - Offset: `0x0000` (factory bootloader + partition table + app image merged)
  - Mode: `dio`, Frequency: `40m`, Flash size: `16MB`
  - Default baud: `921600` (fallback `115200`)
- **Flashing with `esptool.py`**:
  ```bash
  esptool.py --chip esp32 --port <PORT> --baud 921600 write_flash 0x0000 qtpi-esp32-firmata-v1.0.6.bin
  ```

---

### 2. QtPi Veda ESP32 — MicroPython Runtime (`v1.1.0`)
- **Board / Flavor**: `qtpi-veda-esp32` / `micropython`
- **Purpose**: Official QtPi MicroPython v1.27.0-preview runtime bundled with frozen `uqtpy` 1.1.0 and pre-populated LittleFS storage for QtBlocks / Python mode.
- **Direct Download URL**:
  `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/veda-esp32/micropython/v1.1.0/qtpi-esp32-micropython-v1.1.0.bin`
- **Release Descriptor URL**:
  `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/veda-esp32/micropython/v1.1.0/release.json`
- **Flash Configuration**:
  - Offset: `0x0000` (16MB single merged image containing bootloader, partition table, MicroPython app at `0x1000`, and LittleFS at `0x610000`)
  - Mode: `dio`, Frequency: `80m`, Flash size: `16MB`
  - Default baud: `921600` (fallback `115200`)
- **Flashing with `esptool.py`**:
  ```bash
  esptool.py --chip esp32 --port <PORT> --baud 921600 write_flash 0x0000 qtpi-esp32-micropython-v1.1.0.bin
  ```

---

### 3. QtPi Veda 2560 (ATmega2560) — Firmata (`v1.0.4`)
- **Board / Flavor**: `qtpi-veda-2560` / `firmata`
- **Purpose**: High-pinout robotics firmware for QtPi Veda 2560.
- **Direct Download URL**:
  `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/mega2560/firmata/v1.0.4/QtPiFirmataVeda.ino.hex`
- **Flashing with `avrdude`**:
  - Protocol: `stk500v2`, MCU: `atmega2560`, Baud: `115200`
  ```bash
  avrdude -C avrdude.conf -v -p m2560 -c stk500v2 -P <PORT> -b 115200 -D -U flash:w:QtPiFirmataVeda.ino.hex:i
  ```

---

### 4. QtPi Rio 328P (ATmega328P) — Firmata (`v1.0.2`)
- **Board / Flavor**: `qtpi-rio-328p` / `firmata`
- **Purpose**: Standard robotics Firmata for QtPi Rio.
- **Direct Download URL**:
  `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/rio/firmata/v1.0.2/QtPiFirmataRio.hex`
- **Flashing with `avrdude`**:
  - Protocol: `stk500v1`, MCU: `atmega328p`, Baud: `115200`
  ```bash
  avrdude -C avrdude.conf -v -p m328p -c arduino -P <PORT> -b 115200 -D -U flash:w:QtPiFirmataRio.hex:i
  ```

---

## 4. Hardware Port Detection (USB VID / PID)

Downstream tools matching USB serial ports to boards should match these IDs:

| Board | Chipset | VID | PID | Description |
| :--- | :--- | :---: | :---: | :--- |
| `qtpi-veda-esp32` | CP2102 | `0x10C4` | `0xEA60` | Silicon Labs CP210x USB to UART Bridge |
| `qtpi-veda-esp32` | CH340 | `0x1A86` | `0x7523` | QinHeng Electronics CH340 serial converter |
| `qtpi-veda-esp32` | ESP32-S3 | `0x303A` | `0x1001` | Espressif USB-JTAG/serial debug unit |
| `qtpi-veda-2560` | Mega 2560 | `0x2341` | `0x0042` | Arduino Mega 2560 USB |
| `qtpi-veda-2560` | CH340 | `0x1A86` | `0x7523` | Clone Mega CH340 |
| `qtpi-rio-328p` | Arduino Uno | `0x2341` | `0x0043` | Arduino Uno 16u2 USB |
| `qtpi-rio-328p` | FTDI | `0x0403` | `0x6001` | FTDI FT232R USB UART |

---

## 5. Consumer Integration Pattern (TypeScript / JavaScript)

When building an in-browser Web Serial flasher or desktop updater, use the following pattern:

```typescript
// 1. Fetch Manifest v2
const manifestResponse = await fetch("https://qtlearncodelab.github.io/qtpi-shared/firmware/manifest-v2.json");
const manifest = await manifestResponse.json();

// 2. Select Board & Flavor
const board = manifest.boards.find(b => b.boardId === "qtpi-veda-esp32");
const flavor = board.flavors.find(f => f.flavorId === "micropython"); // or "firmata-dual"

// 3. Resolve the latest/default version
const currentVersion = flavor.versions.find(v => v.version === flavor.defaultVersion);

// 4. Download and verify binary
for (const img of currentVersion.images) {
  const binaryResponse = await fetch(img.downloadUrl);
  const buffer = await binaryResponse.arrayBuffer();

  // Verify SHA-256 checksum
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  if (hashHex !== img.sha256) {
    throw new Error(`Checksum mismatch for ${img.downloadUrl}: expected ${img.sha256}, got ${hashHex}`);
  }

  // 5. Flash image to offset (e.g. img.offset: "0x0000")
  await flasher.writeFlash(parseInt(img.offset, 16), new Uint8Array(buffer));
}
```

---

## 6. Catalog Validation

The catalog schema and binary hashes can be verified locally at any time:

```bash
python3 tools/firmware/validate_catalog.py
```
