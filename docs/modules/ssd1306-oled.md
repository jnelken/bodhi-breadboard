# SSD1306 OLED, 128×64, I²C

**Not yet confirmed** against the physical part. Read the four labels printed
along its header before wiring — the two orders below are both common and they
put power where the other puts signal.

| Common order A | GND | VCC | SCL | SDA |
|---|---|---|---|---|
| **Common order B** | **VCC** | **GND** | **SCL** | **SDA** |

`SCL` and `SDA` are reliably the last two, in that order, on both. It is the
**first two that swap**, which is the pair that matters — getting them backwards
puts the supply across the panel the wrong way.

## Electrically

- 3.3 V or 5 V on `VCC` (the module carries its own regulator and level shifting;
  the bare panel does not). Both projects run it from **3.3 V**.
- I²C address **`0x3C`**. A few boards are strapped to `0x3D` — if the screen
  stays dark but the wiring is right, that is the next thing to try.
- Monochrome, 128×64, no backlight — an OLED lights its own pixels, so a black
  pixel draws nothing and costs nothing.

## Speed

`Wire.setClock(400000)`. At the default 100 kHz a full 128×64 frame takes long
enough that games visibly stutter. Both projects set 400 kHz immediately after
`Wire.begin()`.

## Used by

- `../../bodhi-oled-board/MiniGames/src/Screen.cpp` — `SDA → 21`, `SCL → 22`,
  always present
- `BodhiBox/src/Show.cpp` — same pins, but **optional**: the box probes for it
  at boot and runs on lights and sound alone if nothing answers
