# Push button (tactile switch, 4 legs)

**Not yet confirmed** against the physical part — but this one you can check
without any labels at all, and should.

## The thing that catches everyone

A 4-leg tactile switch is really **two pairs of legs that are permanently joined
to each other**, and the button connects the pairs. The pairs run across the
narrow direction of the body, not the long one — so two legs that look like a
sensible pair often turn out to be the *same* electrical point, and the button
appears to do nothing.

```
   1 ●───────● 2      1 and 2 are ALWAYS connected
     │  ┌─┐  │
     │  └─┘  │        pressing joins the top pair to the bottom pair
   3 ●───────● 4      3 and 4 are ALWAYS connected
```

Wire one leg from the top pair and one from the bottom pair. **Turning the
button 90° swaps which is which**, which is why a button that works can stop
working after being pulled out and pushed back in.

Check with a multimeter on continuity: the pair that beeps *without* pressing is
the pair you must not use both of.

## Wiring in these projects

One leg to the GPIO, the other to **GND**, and the pin set to `INPUT_PULLUP`.
Pressed reads **LOW**. No resistor needed — the ESP32 supplies the pull-up
internally.

The exception is GPIO **34, 35, 36, 39**, which have no internal pull-up. A
button there needs an external 10 kΩ from the pin to 3.3 V.

## Bounce

The contacts chatter for a few milliseconds on every press. Both projects ignore
further changes for **30 ms** after an edge, which swallows the chatter without
eating a deliberate fast double-tap.

## Used by

- `../../bodhi-oled-board/MiniGames/src/Controls.cpp` — four of them on GPIO
  12, 14, 27, 26, plus the joystick's own click on 25
- `BodhiBox` reads the joystick's click the same way, through `Port::s1Pressed()`
