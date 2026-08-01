# Module pinouts — reference

Cheap breakout modules print pin names on the silkscreen, but the *order* those
pins run in is not standardized — two joysticks that look identical can read
`+5V, GND, SW, VRx, VRy` on one and `SW, VRy, VRx, +5V, GND` on the other.
Wiring diagrams that assume an order without checking are a common source of
wiring bugs that look electrical (erratic readings, a switch that never
triggers) but are actually just power, ground, and signal landing on the wrong
legs.

**Before wiring any module from this list, read the labels printed on the
back of the physical part and confirm they match the order recorded here.**
If they don't, this file is wrong for your unit — update it, don't just work
around it in one project.

Each entry records what was physically confirmed, on which unit, and when —
same spirit as `docs/extension-board.md`. Don't trust an entry you can't
re-derive from the part in your hand.

## Joystick module (5-pin, dual-axis + click)

| Leg order (as inserted, left → right) | SW | VRy | VRx | +5V | GND |
|---|---|---|---|---|---|
| Signal | switch to GND, click | Y-axis pot wiper | X-axis pot wiper (unused in FirstJoystick) | power in | ground |

Confirmed 2026-08-01 against the physical module used for `FirstJoystick` and
`docs/lessons/joystick.js`. This is **not** the order those files originally
assumed (`+5V, GND, SW, VRx, VRy`, the more commonly documented layout for this
style of module) — that mismatch caused the click to never latch solid and the
idle blink to look erratic, since +5V and GND landed on the SW and VRy legs
instead of on the module's real power pins.

If a future joystick reads differently, don't edit this row — add a new one
noting the distinguishing feature of that unit (color, seller, silkscreen
text) so both are on record.

## Adding a module

1. Read the module's own silkscreen labels against the physical legs, in the
   order they'll actually be inserted into the breadboard.
2. Record that order here before wiring from a diagram, not after debugging
   one that doesn't work.
3. Note the date and which build/lesson it was confirmed against.
