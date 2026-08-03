# 10-segment LED bar graph

**Not yet confirmed** against the physical part. This one has no silkscreen
labels at all, so it has to be checked electrically.

## Which side is which

Twenty legs in two rows of ten: ten anodes along one edge, ten cathodes along
the other. **There is no marking that reliably tells you which**, and half the
units in circulation are printed the other way up from the other half.

Find it the same way you would with a single LED: one segment, a resistor, and
3.3 V. If it lights, the leg on the positive side is that segment's anode; if
not, turn the part around. Once one segment is known the whole row follows.

Some units have a bevelled corner or a small notch — treat it as a hint about
orientation, not as an answer.

## Wiring

Each segment is an ordinary LED and **needs its own current-limiting resistor**
— 220 Ω is right for 3.3 V. Ten segments, ten resistors. One shared resistor on
the common side does not work: the segments would dim as more of them light.

## Why it is worth the trouble

`../teaching-plan.md` argues it should probably replace the four separate LEDs
as the Signal Box's meter — one part instead of eight legs to wrangle, far less
fiddly for small hands, and "how many bars light up" is a very legible idea to a
five-year-old.

The cost is pins: ten segments is ten GPIOs, which the WROVER board does not
have spare. Driving it through a [74HC595](74hc595.md) brings that down to three
at the price of one chip and a lot of little wires.

## Used by

Nothing yet — it sits on the breadboard from an earlier build. See
`../breadboard-layouts.html`.
