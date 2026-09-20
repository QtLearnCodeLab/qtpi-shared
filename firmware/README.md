# QtPi Firmware Release Catalog & Flasher Guide

This guide documents the official firmware releases, manifest endpoints, flash partition memory layouts, and integration workflows for web flashers, desktop suites, IDEs, and CLI tools.

---

## 1. Catalog & Manifest Endpoints

All manifests and firmware artifacts are hosted in [`qtpi-shared`](https://github.com/QtLearnCodeLab/qtpi-shared) and mirrored via GitHub Pages with CORS enabled (`Access-Control-Allow-Origin: *`):

| Manifest / Resource | Schema | Primary CDN (GitHub Pages / CORS) | Raw GitHub Fallback |
| :--- | :---: | :--- | :--- |
| **Manifest v2** *(Recommended)* | `v2` | `https://qtlearncodelab.github.io/qtpi-shared/firmware/manifest-v2.json` | `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/manifest-v2.json` |
| **Manifest v1** *(Legacy)* | `v1` | `https://qtlearncodelab.github.io/qtpi-shared/firmware/manifest.json` | `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/manifest.json` |
| **Firmata Latest Pointer** | `v1` | `https://qtlearncodelab.github.io/qtpi-shared/firmware/veda-esp32/firmata-dual/latest.json` | `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/veda-esp32/firmata-dual/latest.json` |
| **MicroPython Latest Pointer** | `v1` | `https://qtlearncodelab.github.io/qtpi-shared/firmware/veda-esp32/micropython/latest.json` | `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/veda-esp32/micropython/latest.json` |

---

## 2. Latest Firmware Releases Matrix

| Board ID | Flavor ID | Version | Protocol | Primary Flash Offset | Binary File | Size (Bytes) | SHA-256 Digest |
| :--- | :--- | :---: | :--- | :---: | :--- | :---: | :--- |
| **`qtpi-veda-esp32`** | `firmata-dual` | **`1.0.6`** | `esptool` | `0x0000` | `qtpi-esp32-firmata-v1.0.6.bin` | 1,334,272 | `7367e6f2a1d2af6ab283ed0a9d2cd183b443b3fe5d83422f08478021fde6621c` |
| **`qtpi-veda-esp32`** | `micropython` | **`1.1.0`** | `esptool` | `0x0000` | `qtpi-esp32-micropython-v1.1.0.bin` | 15,794,176 | `25fa11e07f90cfe3cad24e0714e3b7765b766f3c8191a48495fc77a5aadc2df4` |
| **`qtpi-veda-2560`** | `firmata` | **`1.0.4`** | `stk500v2` | — | `QtPiFirmataVeda.ino.hex` | 96,985 | `0af74c81c01e26e569583db5f54b8b992b2be90fd65ce4c2dc48130a28bda1b0` |
| **`qtpi-rio-328p`** | `firmata` | **`1.0.2`** | `stk500v1` | — | `QtPiFirmataRio.hex` | 77,344 | `4108937093e5d7d43741ad5f0a382adcca4153e0f50fea4ad448a06817d2ba49` |

---

## 3. QtPi Veda ESP32 MicroPython — Partition Layout & Artifacts

QtPi MicroPython builds for the Veda ESP32 using a custom 16MB OTA partition scheme (`partitions-ota-qtpy-16.csv`). All standalone partition binaries are published in the version directory alongside the merged factory image:

```text
firmware/veda-esp32/micropython/v1.1.0/
├── qtpi-esp32-micropython-v1.1.0.bin  (0x0000  - 16MB full factory merged image)
├── firmware.bin                       (0x1000  - Bootloader + Partitions + OTA Data + App)
├── qtpi_lfs.bin                       (0x610000- 9MB LittleFS filesystem with QtPi scripts)
├── micropython.bin                    (0x10000 - MicroPython app slot only)
├── ota_data_initial.bin               (0xd000  - OTA boot slot selector)
├── bootloader.bin                     (0x1000  - 2nd stage bootloader)
├── partition-table.bin                (0x8000  - Partition table index)
├── release.json                       (Immutable release descriptor)
└── SHA256SUMS                         (Checksums for all artifacts)
```

### 16MB Memory Map & Binary Details

| Partition / Role | Type | SubType | Flash Offset | Binary File | Size (Bytes) | SHA-256 Digest |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **Complete Factory** | — | — | `0x0000` | `qtpi-esp32-micropython-v1.1.0.bin` | 15,794,176 | `25fa11e07f90cfe3cad24e0714e3b7765b766f3c8191a48495fc77a5aadc2df4` |
| **Core Firmware** | — | — | `0x1000` | `firmware.bin` | 1,912,064 | `92d249b2a4233452eaf838e5e2fdec478c42fe17772e7fcac4ad8a7e11b053f8` |
| **Bootloader** | — | — | `0x1000` | `bootloader.bin` | 24,320 | `66a86e79298d12647debab38175105fe727d43674a51fd9a709bd6d7c72774c8` |
| **Partitions** | — | — | `0x8000` | `partition-table.bin` | 3,072 | `bd84ce25a5eced1c114ab591b97b22b90ff9c793d7cc683e7de3f3ebf32c54d0` |
| **NVS** | `data` | `nvs` | `0x9000` | *(runtime)* | 16,384 | — |
| **OTA Data** | `data` | `ota` | `0xd000` | `ota_data_initial.bin` | 8,192 | `7d2c7ac4888bfd75cd5f56e8d61f69595121183afc81556c876732fd3782c62f` |
| **PHY Init** | `data` | `phy` | `0xf000` | *(runtime)* | 4,096 | — |
| **App Slot 0 (`ota_0`)** | `app` | `ota_0` | `0x10000` | `micropython.bin` | 1,850,624 | `c8674b53c24fb31fb9f193db0cdf02dc5152eb3035ea3294bcc7a0ab76e8ee72` |
| **App Slot 1 (`ota_1`)** | `app` | `ota_1` | `0x310000` | *(reserved)* | 3,145,728 | — |
| **LittleFS (`vfs`)** | `data` | `littlefs`| `0x610000` | `qtpi_lfs.bin` | 9,437,184 | `1185bafd606dbd9af75e74ce27d8f5d9637358d9f1582855002e9080b1360c9c` |
| **Extended NVS** | `data` | `nvs` | `0xf10000` | *(runtime)* | 917,504 | — |

---

## 4. Flashing Modes & Commands

Downstream flashers (e.g., Web Serial, `esptool-js`, or CLI `esptool.py`) can choose between full factory deployment or selective partition updating:

### Mode A: Full Factory Flash (`0x0000`)
Flashes the complete 16MB image containing bootloader, partition table, otadata, MicroPython runtime, and initial LittleFS content:
```bash
esptool.py --chip esp32 --port <PORT> --baud 921600 write_flash 0x0000 qtpi-esp32-micropython-v1.1.0.bin
```

### Mode B: Firmware-Only Update (`0x1000` or `0x10000` — Preserves User Files)
Updates the firmware without touching or wiping user scripts, offline assets, or configuration saved on the LittleFS partition:
- **Option 1 (Complete firmware stack: bootloader + partition table + app at `0x1000`)**:
  ```bash
  esptool.py --chip esp32 --port <PORT> --baud 921600 write_flash \
      --flash_mode dio --flash_freq 80m --flash_size 16MB \
      0x1000 firmware.bin
  ```
- **Option 2 (Application binary only at `0x10000`)**:
  ```bash
  esptool.py --chip esp32 --port <PORT> --baud 921600 write_flash \
      --flash_mode dio --flash_freq 80m --flash_size 16MB \
      0x10000 micropython.bin
  ```

### Mode C: Filesystem-Only Update (`0x610000` — Preserves Firmware)
Updates the 9MB LittleFS filesystem with default QtPi libraries and example scripts without reflashing or resetting the MicroPython runtime:
```bash
esptool.py --chip esp32 --port <PORT> --baud 921600 write_flash \
    --flash_mode dio --flash_freq 80m --flash_size 16MB \
    0x610000 qtpi_lfs.bin
```

### Mode D: OTA Boot Selector Initialization (`0xd000`)
Resets the active OTA slot selector:
```bash
esptool.py --chip esp32 --port <PORT> --baud 921600 write_flash \
    --flash_mode dio --flash_freq 80m --flash_size 16MB \
    0xd000 ota_data_initial.bin
```

---

## 5. Other Boards: Veda 2560 & Rio 328P

### QtPi Veda 2560 (ATmega2560)
- **Direct Download URL**: `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/mega2560/firmata/v1.0.4/QtPiFirmataVeda.ino.hex`
- **Flashing with `avrdude`**:
  ```bash
  avrdude -C avrdude.conf -v -p m2560 -c stk500v2 -P <PORT> -b 115200 -D -U flash:w:QtPiFirmataVeda.ino.hex:i
  ```

### QtPi Rio 328P (ATmega328P)
- **Direct Download URL**: `https://raw.githubusercontent.com/QtLearnCodeLab/qtpi-shared/main/firmware/rio/firmata/v1.0.2/QtPiFirmataRio.hex`
- **Flashing with `avrdude`**:
  ```bash
  avrdude -C avrdude.conf -v -p m328p -c arduino -P <PORT> -b 115200 -D -U flash:w:QtPiFirmataRio.hex:i
  ```

---

## 6. Hardware Port Detection (USB VID / PID)

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

## 7. Web Flasher Consumer Integration Pattern (TypeScript / JavaScript)

When implementing an in-browser Web Serial flasher (e.g. using `esptool-js`), the flasher can read `manifest-v2.json` and select either the full image or specific partitions based on user preference:

```typescript
interface FirmwareImage {
  role: string;
  downloadUrl: string;
  offset: string;
  sha256: string;
  sizeBytes: number;
  contains?: Array<{
    role: string;
    downloadUrl: string;
    offset: string;
    sha256: string;
    sizeBytes: number;
  }>;
}

// 1. Fetch manifest-v2.json
const response = await fetch("https://qtlearncodelab.github.io/qtpi-shared/firmware/manifest-v2.json");
const manifest = await response.json();

const board = manifest.boards.find((b: any) => b.boardId === "qtpi-veda-esp32");
const flavor = board.flavors.find((f: any) => f.flavorId === "micropython");
const release = flavor.versions.find((v: any) => v.version === flavor.defaultVersion);

const completeImage: FirmwareImage = release.images[0];

// 2. Choose flashing strategy:
// Option A: Full Factory Flash (Erase / Reinstall everything)
const imagesToFlash: Array<{ offset: number; url: string; expectedSha: string }> = [];

if (userSelectedMode === "factory-reset") {
  imagesToFlash.push({
    offset: parseInt(completeImage.offset, 16), // 0x0000
    url: completeImage.downloadUrl,
    expectedSha: completeImage.sha256
  });
} else if (userSelectedMode === "update-firmware-only") {
  // Option B: Update only the firmware partition (preserves LittleFS files)
  const fwPart = completeImage.contains?.find(c => c.role === "firmware");
  if (fwPart) {
    imagesToFlash.push({
      offset: parseInt(fwPart.offset, 16), // 0x1000
      url: fwPart.downloadUrl,
      expectedSha: fwPart.sha256
    });
  }
} else if (userSelectedMode === "update-scripts-only") {
  // Option C: Update only the LittleFS filesystem partition
  const fsPart = completeImage.contains?.find(c => c.role === "littlefs");
  if (fsPart) {
    imagesToFlash.push({
      offset: parseInt(fsPart.offset, 16), // 0x610000
      url: fsPart.downloadUrl,
      expectedSha: fsPart.sha256
    });
  }
}

// 3. Download, verify SHA-256, and flash each targeted partition
for (const target of imagesToFlash) {
  const binaryRes = await fetch(target.url);
  const buffer = await binaryRes.arrayBuffer();

  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const actualSha = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (actualSha !== target.expectedSha) {
    throw new Error(`Checksum mismatch for ${target.url}: expected ${target.expectedSha}, got ${actualSha}`);
  }

  // Flash binary to specified offset via esptool-js / Web Serial
  await espTool.writeFlash(target.offset, new Uint8Array(buffer));
}
```

---

## 8. Catalog Validation

Validate schemas, binary digests, and offset non-overlapping rules at any time:

```bash
python3 tools/firmware/validate_catalog.py
```
