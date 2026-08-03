# Buzzer — passive and active

**Not yet confirmed** against the physical parts. The kit contains **both** and
they look nearly identical, which matters more than any pin order here.

## Telling them apart

| | Passive | Active |
|---|---|---|
| Underside | **open** — you can see the disc | **sealed**, usually with a sticker |
| Given a steady DC voltage | clicks once, then silence | drones at one fixed pitch |
| Can play a tune | **yes** | no |

**Both projects need the passive one.** The active buzzer has its own internal
oscillator at a fixed frequency, so it cannot play the module jingles, the
target tones, or anything in Copy Me — it can only be on or off.

If the box makes exactly one pitch no matter what is happening, the active
buzzer got swapped in.

## Legs

Two. The longer leg is **+**; there is usually a `+` on the top face as well.

## Driven two different ways

**The console** drives it straight from a GPIO through a 100 Ω resistor. Simple,
and loud enough across a table.

**The Signal Box** drives it through an S8050 NPN transistor: GPIO → 1 kΩ →
base, emitter → GND, collector → buzzer → 5 V. Louder, because the buzzer gets
the full 5 V rail instead of the GPIO's 3.3 V and the GPIO only has to supply
base current.

That transistor is also *why* the Signal Box can use GPIO 12 for sound at all —
12 is a strapping pin that must be LOW at boot, and a transistor base only pulls
it gently low. A signal line there would not be safe.

## In software

ESP32's `tone(pin, hz, ms)` starts a note and **returns immediately**; a second
call replaces the note already sounding. It does not queue. Playing a tune means
holding the remaining notes and starting each one as the last is due to end —
which is what `Sound::play()` (console) and `Show::play()` (Signal Box) do, both
paced from the main loop so nothing blocks.

## Used by

- `../../bodhi-oled-board/MiniGames/src/Sound.cpp` — GPIO 4, direct
- `BodhiBox/src/Show.cpp` — GPIO 12, through the transistor
