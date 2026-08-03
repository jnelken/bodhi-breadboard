# Photoresistor module (light sensor)

**Not yet confirmed** against the physical part.

| Leg order (as inserted, left → right) | VCC | GND | AO | (DO) |
|---|---|---|---|---|
| Signal | power in | ground | analog, varies with light | digital, trips at a trimmer threshold |

Three-pin and four-pin versions both exist. The four-pin adds `DO`, a comparator
output with its own trimmer — **the projects here use `AO` and ignore `DO`**,
because a threshold set with a screwdriver is exactly the judgement the software
should be making instead.

## Which way round is it?

Depends on the module. On some, covering the sensor makes `AO` go **up**; on
others, **down**. The bare photoresistor's resistance rises in darkness, and
which way that moves the divider output depends on whether it sits on the top or
the bottom leg.

Neither project hard-codes a direction: `DriverLight.cpp` watches the range it
actually sees and stretches it, so it adapts to the module *and* to the room.
That is also why it needs a moment of both light and shade before the meter
feels right.

## Electrically

- 3.3 V or 5 V.
- `AO` is just a divider output, so it swings to whatever `VCC` is — through the
  Signal Box port's 10 k/20 k divider that lands safely inside the ADC range
  either way.

## How it is told apart from a joystick

Both drive an analog line. The photoresistor drives **only S2** and leaves S3
alone, while a joystick drives both and rests both near mid-scale. That
asymmetry is the whole detection test.

## Used by

- `BodhiBox/src/DriverLight.cpp` — `AO → S2`
- `FirstBrightness/FirstBrightness.ino`
- `docs/lessons/shadowlight.js`
