# HC-SR04 ultrasonic rangefinder ("the binoculars")

**Not yet confirmed** against the physical part, though this module's pin order
is one of the most consistent in the hobby world.

| Leg order (as inserted, left → right) | VCC | Trig | Echo | GND |
|---|---|---|---|---|
| Signal | 5 V in | pulse in, ≥10 µs | pulse out, width = time of flight | ground |

Read the silkscreen anyway. Four-pin variants exist with `GND` and `VCC`
swapped, and a five-pin `HC-SR04+` puts an extra `OUT` in the middle.

## Electrically

- **Needs 5 V.** It does not work reliably at 3.3 V.
- `Echo` therefore answers at **5 V**, which is why the Signal Box port's
  10 k/20 k divider exists: it lands at 3.33 V, still a clean digital HIGH for
  the ESP32 but no longer a hazard.
- Range roughly 2 cm to 4 m. Closer than about 2 cm it cannot hear its own echo
  and reports nonsense.

## How the distance comes out

Send a 10 µs pulse on `Trig`; the module chirps and then holds `Echo` high for
as long as the sound takes to come back. Distance in cm is
`echo_microseconds / 58`.

**A missing object gives no echo at all**, not a large reading — so the timeout
is the "nothing there" signal, and the driver has to treat it as such rather
than waiting forever.

## Why it is detected first

It is the only module in the kit that answers an *active* probe: the box sends a
trigger and something comes back. Nothing else can imitate that, so it sits at
the top of `kDrivers[]` and everything else is checked after it.

## Used by

- `BodhiBox/src/DriverUltrasonic.cpp` — `Trig → S1`, `Echo → S2`
- `FirstDistance/FirstDistance.ino`
- `docs/lessons/binoculars.js`
