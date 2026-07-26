# Freenove ESP32 GPIO Extension Board — reference

Transcribed from a photo of Jake's actual board (2026-07-25). This is the
authoritative pin map for this project: it replaces any guessing about the
WROVER module's own header order, because every GPIO is printed on the
extension board's silkscreen next to the breadboard hole it lands in.

## How it mounts

- The **ESP32-WROVER CAM board plugs into the extension board's headers**, not
  into the breadboard. It sits above/behind the extension board, USB-C facing
  out.
- The **extension board straddles the breadboard's centre channel**. Its two pin
  rows land in columns **`d` and `g`** — a 0.5″ span, so the body physically
  covers `d` through `g`.
- That leaves **three usable tie-points per GPIO**: `a`, `b`, `c` for the `d`-side
  pins and `h`, `i`, `j` for the `g`-side pins. **`e` and `f` are electrically
  live but sit under the board body**, so nothing can be plugged into them.
- The board's silkscreen labels are printed between the two pin rows: the
  **left-hand label column belongs to the `d` pins**, the **right-hand label
  column to the `g` pins**.

In the reference photo the breadboard is stood on end, so positions run top to
bottom and `a`–`j` run left to right. Orientation is arbitrary.

### Physical footprint — bigger than the pin spine

**This is the part that is easy to get wrong.** The pins occupy positions 13–32,
but the PCB itself covers considerably more of the breadboard:

| Region | What's covered |
|---|---|
| **Positions 1–12** | **Everything** — all ten rows *and* both power rails. Completely unusable. |
| **Positions 13–16** | Both power rails, under the screw-terminal blocks. |
| **Position 17** | Rails only just reachable past the terminal blocks — treat as unusable. |
| **Positions 13–32** | Columns `d`–`g` (the pin spine). Rows `a`–`c` and `h`–`j` stay clear. |

So the genuinely free breadboard is:

- **positions 18–63 on the power rails**
- **positions 13–32 in rows `a`–`c` and `h`–`j`**
- **positions 33–63 in every row**

Positions 1–12 are **not** spare space. They look inviting on a diagram and are
physically under the board — a layout that parks a component there cannot be
built.

## Pin map

Position = the breadboard's printed column number. Column `d` is reachable from
`a`–`c`; column `g` from `h`–`j`.

| Position | Column `d` (left labels) | Column `g` (right labels) |
|---:|---|---|
| 13 | 3.3V | GND |
| 14 | EN | **GPIO 23** |
| 15 | GPIO 36 / VP | **GPIO 22** |
| 16 | GPIO 39 / VN | GPIO 1 / TX |
| 17 | GPIO 34 | GPIO 3 / RX |
| 18 | GPIO 35 | **GPIO 21** |
| 19 | **GPIO 32** | GND |
| 20 | **GPIO 33** | **GPIO 19** |
| 21 | GPIO 25 | **GPIO 18** |
| 22 | GPIO 26 | GPIO 5 |
| 23 | GPIO 27 | *17 / 16 — see below* |
| 24 | GPIO 14 | **GPIO 4** |
| 25 | **GPIO 12** | GPIO 0 |
| 26 | GND | GPIO 2 |
| 27 | **GPIO 13** | GPIO 15 |
| 28 | 3.3V | GND |
| 29 | 3.3V | GND |
| 30 | 3.3V | GND |
| 31 | 5V | GND |
| 32 | 5V | GND |

**Bold** = used by this project.

### How the position numbers were derived

The silkscreen labels themselves are unambiguous — those are read directly. The
*position numbers* come from aligning the breadboard's own printed ruler against
the label rows in the photo, which lines up in four independent places:

- ruler **15** ↔ `36/VP` (left) and `22` (right)
- ruler **20** ↔ `33` (left) and `19` (right)
- ruler **25** ↔ `12` (left) and `0` (right)
- ruler **30** ↔ `3.3V` (left) and `GND` (right)

Four consistent hits across a 20-row span is convincing, but it is still a
derivation from a photograph. **Eyeball one pin before committing a build** —
easiest check is that GPIO 13 sits two rows below GPIO 12 on the left column.

The `d`/`g` pin columns are confirmed by Jake against the physical board.

### The 17 / 16 position

Position 23 on the `f` side carries a boxed label reading `17`, `GND`, `16` with
`WROOM` and `WROVER` printed vertically beside it. That is the board telling you
the pin differs by module:

- On a **WROOM** module these are usable GPIO 17 and 16.
- On a **WROVER** — which is what this board has — those pins are consumed by the
  PSRAM, so the extension board grounds them.

This is physical confirmation of the constraint already recorded in `CLAUDE.md`:
never use GPIO 16 or 17 on this hardware.

## Power

- **On the breadboard:** 5V at positions 31–32 (column `d`), 3.3V at 13 and
  28–30 (column `d`), and GND at position 26 (column `d`) plus 13, 19 and 28–32
  (column `g`). Plenty of both rails without running long jumpers.
- **Screw terminals**, one pair over each power rail, reaching from position 13
  out to about 16. With the board laid out horizontally and the extension board
  on the left: **`EXT-3.3V` / `GND` is the top pair, `5V` / `GND` is the bottom
  pair.** (Confirmed against the physical board — the diagrams originally had
  these reversed.) They exist for powering the rig from something other than USB.

## What this changes for this project

1. **Pin positions are now known.** Earlier diagrams had to say "match the
   silkscreen, not the drawing." That caveat is retired — every wire can be drawn
   to a real hole.
2. **The rail-bridging jumper is unnecessary.** 5V, 3.3V and GND all surface in
   the middle of the board on the `e`/`f` columns, so power is a short hop rather
   than a run down the free edge.
3. **The build has to move.** The extension board occupies positions 13–32, so
   the lights, buzzer and the six port columns all live in **positions 33–63**,
   with 1–12 spare.
4. **Camera pins still apply.** GPIO 4, 18, 19, 21, 22, 23 are broken out here and
   used by this project, but they are camera pins — the camera stays unplugged.

## Where our signals land

| Signal | GPIO | Position | Pin column | Tap from |
|---|---:|---:|---|---|
| Port S1 (Trig / joystick SW) | 13 | 27 | `d` | `a`–`c` |
| Port S2 (divided input) | 32 | 19 | `d` | `a`–`c` |
| Port S3 (divided input) | 33 | 20 | `d` | `a`–`c` |
| Buzzer | 12 | 25 | `d` | `a`–`c` |
| LED 1 | 23 | 14 | `g` | `h`–`j` |
| LED 2 | 19 | 20 | `g` | `h`–`j` |
| LED 3 | 18 | 21 | `g` | `h`–`j` |
| LED 4 | 4 | 24 | `g` | `h`–`j` |
| Display SDA (optional) | 21 | 18 | `g` | `h`–`j` |
| Display SCL (optional) | 22 | 15 | `g` | `h`–`j` |

Convenient accident: every port signal and the buzzer are on the `d` side, and
every LED is on the `g` side. The two halves of the build don't cross the channel.

Because only three rows are reachable per side, jumpers back to the extension
board have to start in `a`/`b`/`c` (or `h`/`i`/`j`) — there is no fourth row to
fall back on, which is what drives the routing in the layout diagrams.

## WROVER module header (secondary)

Not needed while the extension board is fitted, recorded only in case the module
is ever used bare. Transcribed from the same photo and **less carefully verified
than the table above** — check against the module before relying on it.

- One long edge: `5V 5V 3.3V 3.3V 13 GND 12 14 27 26 25 33 32 35 34 VN VP EN 3.3V`
- Other long edge: `GND GND 15 2 0 4 GND 5 18 19 GND 21 RX TX 22 23 GND`
