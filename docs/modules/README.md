# Module details — index

Cheap breakout modules print pin names on the silkscreen, but the *order* those
pins run in is not standardized — two joysticks that look identical can read
`+5V, GND, SW, VRx, VRy` on one and `SW, VRy, VRx, +5V, GND` on the other.
Wiring diagrams that assume an order without checking are a common source of
wiring bugs that look electrical (erratic readings, a switch that never
triggers) but are actually just power, ground, and signal landing on the wrong
legs.

**Before wiring any module in this folder, read the labels printed on the back
of the physical part and confirm they match the order recorded here.** If they
don't, the file is wrong for your unit — update it, don't just work around it
in one project.

Each entry records what was physically confirmed, on which unit, and when —
same spirit as [`../extension-board.md`](../extension-board.md). **Don't trust
an entry you can't re-derive from the part in your hand**, and entries marked
*not yet confirmed* are exactly that: what the datasheet or the seller's
diagram says, not what anyone here has checked.

## The modules

| Module | Used by | Confirmed? |
|---|---|---|
| [Joystick](joystick.md) | Signal Box port, `FirstJoystick`, the console | ✅ 2026-08-01 |
| [ESP32 DevKit](esp32-devkit.md) | the console's brain | ⬜ not yet |
| [SSD1306 OLED](ssd1306-oled.md) | the console's screen, Signal Box display | ⬜ not yet |
| [Push button](push-button.md) | the console's four buttons | ⬜ not yet |
| [Buzzer](buzzer.md) | both boards | ⬜ not yet |
| [HC-SR04 ultrasonic](hc-sr04.md) | Signal Box "binoculars", `FirstDistance` | ⬜ not yet |
| [HC-SR501 motion](hc-sr501.md) | Signal Box night light, `FirstMotion` | ⬜ not yet |
| [Photoresistor](photoresistor.md) | Signal Box shadow light, `FirstBrightness` | ⬜ not yet |
| [LED bar graph](led-bar-graph.md) | candidate meter, see `../teaching-plan.md` | ⬜ not yet |
| [74HC595 shift register](74hc595.md) | drives the bar graph from 3 pins | ⬜ not yet |

The Freenove GPIO Extension Board is not a module and has its own, much longer
map: [`../extension-board.md`](../extension-board.md).

## Adding a module

1. Read the module's own silkscreen labels against the physical legs, in the
   order they'll actually be inserted into the breadboard.
2. Record that order here before wiring from a diagram, not after debugging
   one that doesn't work.
3. Note the date and which build/lesson it was confirmed against.
4. Add a row to the table above.

## Confirming one that's marked ⬜

Flip the part over, read the legs left to right as they will go into the board,
and compare against the file. If it matches, change its **Confirmed** line to
say so and date it. If it doesn't, correct the file — and then check whether any
build was wired from the wrong version.
