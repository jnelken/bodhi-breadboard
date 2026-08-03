# ESP32 DevKit (the console's brain)

**Not yet confirmed** against the physical board. The pin *labels* are printed
along both edges — read them rather than counting positions, because the 30-pin
and 38-pin variants are not the same board with extra pins on the end.

This is the plain ESP32 dev board used by `../../bodhi-oled-board`. It is **not**
the Freenove ESP32-WROVER CAM used by everything else here; that one has its own
map in [`../extension-board.md`](../extension-board.md) and a far tighter pin
budget.

## Why it has room and the other board doesn't

| | ESP32 DevKit | Freenove WROVER CAM |
|---|---|---|
| Camera | none | OV2640 claims 14 GPIOs unless unplugged |
| PSRAM | none — **16/17 are free** | yes — 16/17 gone |
| microSD | none — **2/14/15 are free** | slot claims 2/14/15 |
| FQBN | `esp32:esp32:esp32` | `esp32:esp32:esp32wrover` |

Still off limits on both: **6–11** (SPI flash) and **1/3** (the programming
UART).

## Strapping pins

`0`, `2`, `5`, `12` and `15` are read at boot to decide how the chip starts. Of
these, **GPIO 12 (MTDI) must be LOW at boot** — it selects the flash voltage.

The console puts button **A** on GPIO 12 with an internal pull-up, which holds
it HIGH. That works on this particular board, but it is the first thing to
suspect if it ever stops booting; GPIO 18, 19 and 23 are free and have no such
condition.

## Input-only pins

**34, 35, 36, 39** can read but cannot drive, and have **no internal pull-up** —
a button on one of them needs an external 10 kΩ resistor. They are ADC1, which
keeps working when WiFi is on; ADC2 pins do not.

## It straddles the breadboard

The board is wide enough to cover the centre channel and most of the rows either
side, leaving only two or three usable holes per row. Plan any breadboard layout
against the physical board rather than assuming a standard five.

## Used by

- `../../bodhi-oled-board/MiniGames/` — see `MiniGames/src/Pins.h` for the map
