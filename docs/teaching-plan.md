# Teaching plan — getting Bodhi into circuits

Notes for the grown-up. The kid-facing material is
`docs/first-circuits.html` (step-through builds) and `FirstLight/`.

## The problem with the Signal Box as a starting point

The Signal Box is built around a plug-and-play port whose entire purpose is to
**hide the wiring**. That is a good property for a toy and the wrong property for
teaching. If Bodhi only ever swaps sensor modules, what he learns is "different
modules make different games" — a software lesson, not a circuits lesson. He
never sees a circuit, because the design's whole job is to make sure he doesn't
have to.

Nothing is wrong with the Signal Box. It is just the **finale**, not the
introduction. Keep it as the thing he graduates to: *you built every part of
this.*

## What actually makes LEGO instructions work

Worth being precise, because it isn't the 3D:

1. **One step = one piece.** Atomic and unambiguous.
2. **The new piece is visually distinct** from what's already built.
3. **No text.** He can't read, and he doesn't need to.
4. **Every step is verifiable.** He can compare his model to the picture.
5. **He does all of it.** Not helping — his build.

Point 4 is where circuits are *worse* than LEGO by default. A half-built castle
looks like a half-built castle; a half-built circuit does nothing, which to a
five-year-old is indistinguishable from broken. The fix is to sequence so that
**something observable happens as early and as often as possible**.

## Why 3D animation isn't the thing to chase

LEGO needs rotation because bricks occlude each other. A breadboard is flat —
the top-down view *is* the clearest view. What's worth copying from the LEGO app
is the interaction model, not the rendering:

- one step at a time
- everything already placed dimmed to grey
- the new part highlighted, pointing at the exact hole
- a big next button, no reading required

All of that is 2D, and it's the part that carries the learning.
`docs/first-circuits.html` does exactly this and runs in Safari on the iPad.

Higher value than any animation: **photograph each finished step** on your actual
board and show it beside the diagram. Matching a photo to the real thing is the
LEGO verification loop, and it costs an afternoon.

## The sequence

Each build is one sitting, roughly 10–15 minutes, and ends with something
happening.

| # | Build | Pieces | Payoff |
|---|---|---|---|
| 0 | The secret rows | none | He discovers the hidden connections himself |
| 1 | Make a light | 3 | It lights up — **no code needed** |
| 2 | Two lights | 3 | Same pattern twice; branches are a repeatable idea |
| 3 | A knob that dims | 5 | Not everything is on/off |
| 4 | The computer takes over | 4 | First LED that needs a program |

Builds 1–3 run entirely off the breadboard rails, which the extension board
powers on its own — so there is nothing to hook up before the first build, and
the board only wants USB *power*. A phone charger is enough. That is deliberate:
a working circuit shouldn't depend on a laptop being open, and it keeps the
first three sessions free of any software.

Build 1 is only three placements — resistor, light, wire — because of this.
Getting to the first lit LED fast matters more than anything else in the
sequence.

Build 4 is the hinge — an LED that stays stubbornly dark until `FirstLight` is
uploaded. That's the moment code becomes worth caring about.

After that, sensors and eventually the Signal Box.

## Lesson zero is the important one

The hardest concept isn't electricity, it's that **a breadboard has invisible
connections**. LEGO's connections are visible and tactile; a breadboard's rows
are hidden magic, and nothing else makes sense until that lands.

Do this before any build: wire one LED so it's lit, then have him move one leg
around the board and watch when it stays on and when it dies. He finds the rows
himself. Build 0 in the step-through tints the groups afterwards to confirm what
he just discovered. That session is worth more than three builds done by rote.

## Two practical warnings

**Finger strength is a real obstacle.** A fresh breadboard is stiff. Five-year-old
hands pushing solid-core wire and bendy LED legs into 0.1″ holes is genuinely
hard. Break the board in yourself first — seat and unseat a wire in every hole
you plan to use — and use pre-formed jumpers rather than cutting your own. If a
step is physically too hard, he'll conclude he is bad at this, which is the exact
opposite of the goal.

**Don't fix his mistakes.** A dead LED because it's in backwards is the best
teaching moment in the kit, as long as he gets to find it. Polarity is a great
early concept precisely because it's discoverable: turn it around, it works.

## Things to say

Short, concrete, and about what he can see:

- "Electricity needs a way out **and** a way back. If the loop is broken, nothing."
- "The resistor is like a narrow gate — it slows the electricity down so the light
  doesn't burn out."
- "That light only goes one way. Turn it around and see."
- "You built that exact same thing twice — that's why there are two lights."

Avoid: volts, current, Ohm's law, anything with a number in it. He needs the
loop, the one-way light, and the hidden rows. That's the whole curriculum for now.

## One substitution worth considering

The kit's **10-segment LED bar graph** may be a better early centrepiece than four
separate LEDs — one part instead of eight legs to wrangle, far less fiddly for
small hands, and "how many bars light up" is a very legible idea. Worth trying if
the individual LEDs turn out to be a fight.
