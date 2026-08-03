# HC-SR501 motion sensor (the white dome)

**Not yet confirmed** against the physical part. This one genuinely varies —
check the silkscreen under the dome.

| Leg order (as inserted, left → right) | VCC | OUT | GND |
|---|---|---|---|
| Signal | 5 V in | HIGH while triggered | ground |

Some units read `GND, OUT, VCC` — the exact reverse. The labels are printed on
the board beneath the white lens; lift or peer under it rather than guessing.

## Electrically

- 4.5–20 V in on `VCC`. It has its own regulator.
- `OUT` swings **3.3 V**, not 5 V, on nearly every unit.
- Through the Signal Box port's 10 k/20 k divider that arrives at about
  **2.2 V** — which is *below* the ESP32's ~2.48 V digital-HIGH threshold. This
  is exactly why S2/S3 are read as analog and thresholded in software rather
  than with `digitalRead`.

## The two trimmers

- **Sensitivity** — range, roughly 3 m to 7 m.
- **Time delay** — how long `OUT` stays HIGH after motion, from a few seconds to
  several minutes. **Turn this fully down.** At its default the sensor latches
  high for so long that a game waiting for the signal to drop appears frozen.

## The jumper

- **H (repeat)** — stays HIGH while motion continues, re-triggering.
- **L (single)** — one fixed pulse per event.

`H` is what the box expects.

## It cannot report its own removal

An idle PIR and an empty port look identical through the divider, so unplugging
it announces nothing. That is why its driver returns `selfReleases() == false`
and the box polls for a change every 2.5 s instead of waiting to be told.

## Warm-up

It needs roughly 30–60 s after power-on to settle, and will fire spuriously
during that time. Not a fault.

## Used by

- `BodhiBox/src/DriverMotion.cpp` — `OUT → S3`
- `FirstMotion/FirstMotion.ino`
- `docs/lessons/nightlight.js`
