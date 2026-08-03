# Bodhi's Signal Box

A plug-and-play ESP32 game box for a 5-year-old. He plugs in **one** sensor module,
the box works out what it is, and starts a game that suits it. No code edits, no
reflashing, no adult required.

## Hardware

**Board:** Freenove ESP32-WROVER CAM, from the Freenove Ultimate Starter Kit for
ESP32 (FNK0047). Verified over serial: ESP32-D0WD-V3 rev 3.1, 4 MB flash.

**The module is mounted on the Freenove ESP32 GPIO Extension Board**, which
straddles the breadboard channel at positions 13–32 and prints every GPIO next to
the hole it lands in. `docs/extension-board.md` has the full pin map — use it
rather than reasoning about the WROVER module's own header order. The build
occupies positions 33–63.

**Breakout modules (joystick, etc.) don't standardize pin order** — the same
part from different sellers can print its legs in a different sequence.
`docs/modules/` has one file per module, recording the order confirmed against
each physical part actually in use, so wiring diagrams don't have to guess.
Check it (and add to it) before wiring a new module in from a diagram. Entries
marked *not yet confirmed* are what the datasheet says, not what anyone has
checked — don't treat them as verified.

**The camera module must stay unplugged.** The OV2640 claims 14 GPIOs
(4, 5, 18, 19, 21, 22, 23, 25, 26, 27, 34, 35, 36, 39). With those gone, plus
PSRAM (16/17), flash (6–11), the microSD slot (2/14/15) and the programming UART
(1/3), only GPIO 12, 13, 32, 33 remain — not enough for this project. The board's
silkscreen marks them: `-` camera, `~` SD card, `*` PSRAM.

The sensor port and buzzer are deliberately on **camera-free** pins, so if the
camera is ever reinstalled it costs the LEDs and display, not the plug-and-play port.

### Pin map

| Function | GPIO | Camera-free? |
|---|---|---|
| Sensor port **S1** — ESP32→module (Trig), or pulled-up input (joystick button), via 1 kΩ | 13 | yes |
| Sensor port **S2** — module→ESP32, via divider | 32 | yes |
| Sensor port **S3** — module→ESP32, via divider | 33 | yes |
| Passive buzzer (via S8050 NPN + 1 kΩ base) | 12 | yes |
| LEDs 1–4 (anode→pin, 220 Ω→GND) | 23, 19, 18, 4 | no |
| I²C display, optional (SDA / SCL) | 21 / 22 | no |

**Never use:** 6–11 (flash), 16/17 (PSRAM), 2/14/15 (SD slot), 1/3 (UART),
0/5 (boot strapping — a module holding one stops the board booting).

GPIO 12 is also a strapping pin (MTDI must be LOW at boot). It is safe here
*because* a transistor base only pulls it gently low. Do not put a signal line there.

### The divider convention

**S2 and S3 each have a permanent 10 kΩ (port→GPIO) / 20 kΩ (GPIO→GND) divider.**
This is load-bearing, not decoration:

- It makes the port accept any 0–5 V module output, so there is no way for a
  child to damage the board by plugging something in.
- Ratio is 2/3: a 5 V HC-SR04 Echo arrives at 3.33 V (a clean digital HIGH),
  a 5 V joystick axis spans the full ADC range, a 3.3 V PIR output arrives at 2.2 V.
- 2.2 V is *below* the ESP32's ~2.48 V digital-HIGH threshold, which is why
  **S2/S3 are always read as analog and thresholded in software** — never
  `digitalRead`, except for `pulseIn` on the ultrasonic Echo which arrives at 3.33 V.
- Values matter: at 1 kΩ/2 kΩ the 3 kΩ load drags the joystick's 10 kΩ pot centre
  down to ~27 % of full scale and breaks mid-scale detection. At 30 kΩ it sits near
  46 %. Use two 10 kΩ in series if you have no 20 kΩ.

**S1 carries a 1 kΩ series resistor.** S1 is an output for the ultrasonic's Trig
but an input for the joystick's switch-to-ground SW. The detection sweep drives
Trig while it does not yet know what is attached, so the resistor is what makes
that safe — without it, probing a joystick with its button held down would be a
direct short from a driven pin to ground.

GPIO 32/33 are ADC1, which keeps working if WiFi is ever added. ADC2 does not.

### Buzzer

Use the kit's **passive** buzzer. The active one has a fixed internal oscillator,
can only beep at one pitch, and cannot play the per-module jingles or target tones.

## Architecture

The whole point is that **games never know which sensor is attached.**

```
module → InputDriver (raw numbers) → Gate (smooth/deadband/hysteresis/debounce) → Signal → Game
```

- `src/Signal.h` — `Signal` struct (`level`, `level2`, `active`, `pressed`,
  `released`, `valid`) and `Gate`, which turns raw driver numbers into clean,
  identical semantics no matter how noisy or bouncy the source was.
- `src/InputDriver.h` — the driver contract and the registry array.
- `src/Game.h` — the game contract. Games declare `SignalKind` (`kLevel` or
  `kTrigger`); the box picks a game matching whatever got plugged in.

**To add one of the kit's other modules, write one `.cpp` implementing
`InputDriver` and add one line to `kDrivers[]` in `BodhiBox.ino`. Do not edit a
game to accommodate a sensor** — if a game needs changing to fit a new sensor,
the abstraction is being bypassed.

Detection runs at boot and again whenever the active module stops answering for
2 s, which is what makes hot-swapping work without a reset.

## Build & flash

```sh
./flash.sh                # compile + upload BodhiBox
./flash.sh PortScanner    # compile + upload the diagnostic sketch
./monitor.sh              # serial monitor at 115200
```

Underneath:

```sh
arduino-cli compile --fqbn esp32:esp32:esp32wrover BodhiBox
arduino-cli upload -p /dev/cu.usbserial-210 --fqbn esp32:esp32:esp32wrover BodhiBox
```

If an upload dies partway with "the chip stopped responding", the USB-serial
adapter can't sustain the default 921600 baud — retry at 115200:

```sh
arduino-cli upload -p /dev/cu.usbserial-210 \
  --fqbn "esp32:esp32:esp32wrover:UploadSpeed=115200" BodhiBox
```

`flash.sh` already falls back to 115200 automatically.

`arduino-cli` compiles `.cpp`/`.h` under a sketch's `src/` recursively, which is
why the modules live in `BodhiBox/src/`.

`./flash.sh FirstDistance --publish` also runs `./publish-firmware.sh`, which
rebuilds the sketch and copies flashable binaries + a manifest into
`docs/firmware/FirstDistance/` for the Web Serial installer embedded in
`docs/binoculars.html` (a "for the grown-up" panel that appears once the
lesson is complete). Those binaries are committed to git on purpose — GitHub
Pages serves `docs/` with no build step, so re-run the publish step (and
commit) whenever `FirstDistance.ino` changes, or the web installer silently
serves stale firmware.

That same panel live-tunes `FAST_MS`/`SLOW_MS`/`FAR_CM` over serial without a
reflash: the sketch persists them to NVS (`Preferences`) and speaks a small
line-based protocol alongside its usual narration —
`GET` asks for the current values, `FAST_MS=<n>` (also `SLOW_MS=`, `FAR_CM=`)
applies and persists one, and the board replies to either with
`CFG FAST_MS=.. SLOW_MS=.. FAR_CM=..`. Any future sketch that wants the same
live-tuning panel should reuse this protocol shape rather than inventing a new
one.

## Diagnostics

`PortScanner/` is the tool for any "why isn't it detecting?" question. Flash it,
plug a module in, and read the serial output: it prints the raw analog values on
S2/S3 under pull-down and pull-up, the ultrasonic ping result, the S1 button
state, and its own guess at what's attached. **Calibrate detection thresholds
against its output rather than against theory.**

## Git workflow

**Commit and push every completed change without asking first.** This is a
standing authorization for this repo specifically — it overrides the default
"only commit when explicitly asked" behavior. Applies once a change is
actually complete (compiles/builds, matches what was asked); don't commit
half-finished work just to check a box. Still pause and confirm before
anything destructive (`reset --hard`, rewriting history) — this authorization
covers plain commit + push only.

If a push to `main` is rejected as non-fast-forward (local diverged from
origin, e.g. after a rebase), use `git push --force-with-lease` without
asking — the lease refuses to overwrite if origin moved since the last fetch,
so it can't clobber work it hasn't seen. A raw `--force` (no lease) still
requires confirmation.

## Conventions

- Sketch per folder, matching the sibling project `../bodhi-oled-board` (the
  OLED console — a plain ESP32 DevKit, `esp32:esp32:esp32` on
  `/dev/cu.usbserial-10`; do not cross its FQBN or port with this board's).
- No-fail game design: no timers, no losing, no game-over. Mistakes get a
  cheerful noise, not a penalty.
- Serial is 115200 and always narrates what the box is doing — it is the primary
  debugging surface, since the display is optional.
