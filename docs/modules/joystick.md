# Joystick module (5-pin, dual-axis + click)

**Confirmed 2026-08-01** against the physical module used for `FirstJoystick`
and `docs/lessons/joystick.js`.

| Leg order (as inserted, left → right) | SW | VRy | VRx | +5V | GND |
|---|---|---|---|---|---|
| Signal | switch to GND, click | Y-axis pot wiper | X-axis pot wiper | power in | ground |

This is **not** the order those files originally assumed
(`+5V, GND, SW, VRx, VRy`, the more commonly documented layout for this style of
module). That mismatch caused the click to never latch solid and the idle blink
to look erratic, since +5V and GND landed on the SW and VRy legs instead of on
the module's real power pins.

If a future joystick reads differently, don't edit this table — add a new one
noting the distinguishing feature of that unit (colour, seller, silkscreen text)
so both are on record.

## Electrically

Two 10 kΩ potentiometers and a momentary switch to ground. The pots are wired as
dividers across the supply, so each wiper outputs 0 V to whatever you feed the
`+5V` leg. The switch needs a pull-up; both boards use the ESP32's internal one.

**A pot does not rest at exactly half scale**, and no two units are off by the
same amount, so both projects measure the resting position at startup rather
than assuming it, and map each half of the travel separately.

## Wired two different ways, on purpose

| | Signal Box (starter board) | The console (OLED board) |
|---|---|---|
| `+5V` leg fed from | 5 V | **3.3 V** |
| Wipers reach the ESP32 through | 10 k/20 k divider | straight through |
| Why | the port must survive *any* module a child pushes into it, including 5 V ones | the joystick is wired in permanently, so there is nothing to protect against |

The divider costs range: it loads the 10 kΩ pot enough to pull the resting
centre down to about 45 % of full scale. That is the right trade on a port meant
to be child-proof and the wrong one on a fixed build — **don't copy the divider
across to the console.**

## Used by

- `BodhiBox/src/DriverJoystick.cpp` — `SW → S1`, `VRx → S2`, `VRy → S3`
- `FirstJoystick/FirstJoystick.ino`
- `docs/lessons/joystick.js`
- `../../bodhi-oled-board/MiniGames/` — `VRy → 32`, `VRx → 33`, `SW → 25`
