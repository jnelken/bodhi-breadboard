# BBKit — the breadboard instruction kit

A reusable LEGO-style instruction booklet for breadboard circuits. One step is
one piece, everything already placed dims to grey, the new piece is haloed, and
a Pac-Man narrator types the instruction out loud so a child who cannot read can
still follow it.

**A new project is a new lesson file, not a new fork of the renderer.**

Consumers so far:

| Page | Audience | Uses |
|---|---|---|
| `docs/first-circuits.html` | the child | the whole kit — board, narrator, typed instructions |
| `docs/binoculars.html` | the child | same, plus the HC-SR04 sensor module |
| `docs/joystick.html` | the child | same, plus the dual-axis joystick module |
| `docs/nightlight.html` | the child | same, plus the HC-SR501 PIR motion sensor |
| `docs/shadowlight.html` | the child | same, plus the photoresistor / light-sensor module |
| `docs/teaching-notes.html` | the grown-up | `notes.js` over the same lesson files |
| `docs/breadboard-layouts.html` | the grown-up | board, parts and overlay only, no narrator |

## Two audiences, one lesson file

This is the rule that keeps the build pages usable by someone who cannot read:

| Field | Who | Where it shows |
|---|---|---|
| `say` | the child | typed out, spoken by Pac-Man |
| `check` | the child | the "you should see this" note under the instruction |
| `why` | the grown-up | `teaching-notes.html` only |
| `coach` | the grown-up | `teaching-notes.html` only |
| `audience: 'grown-up'` on a build | the grown-up | the viewer skips it entirely |

**Nothing addressed to an adult belongs on a build page.** No lede explaining the
lesson, no prep instructions, no "grown-up note" disclosure, no upload commands.
A five-year-old driving the page should see one picture, one sentence and one big
button. Board prep is a build marked `audience: 'grown-up'`; upload commands and
the reasoning behind a step are `coach` notes. `teaching-notes.html` renders all
of it from the same files, so the notes cannot drift from the builds.

Write `check` so the child can act on it — "It should be lit. If not, turn the
light around." Anything of the form "ask him…", "resist helping", "break the
board in first" is a `coach` note, not a `check`.

## The three core parts

- **`breadboard.js`** — geometry. Everything is addressed by hole (`['C', 38]`
  is row c, position 38), never by pixel.
- **`narrator.js`** — the Pac-Man talking head. Chomps while words appear, rests
  with his mouth open, owns the synthesised tap and the mute button.
- **`typewriter.js`** — types the instruction one letter at a time and drives the
  narrator's mouth. Neither knows about the other; `instructor.js` joins them.

Plus `parts.js` (the drawable primitives), `overlays/` (carrier boards),
`instructor.js` (the step machine) and `kit.css`.

## Writing a lesson

Two files. First the lesson document, `docs/lessons/my-lesson.js`:

```js
window.BBKit = window.BBKit || {};
window.BBKit.lessons = window.BBKit.lessons || {};

window.BBKit.lessons['my-lesson'] = {
  board:   { pitch: 22, cols: 63, pad: 46 },
  viewBox: '0 0 1480 470',
  overlay: 'freenove-ext',          // omit for a bare breadboard
  hot:     { buzzer: [25] },         // per-build: GPIO labels to pick out in gold
  parts:   [ { k: 'r', n: 2, label: 'resistor' } ],
  builds: [
    {
      id: 'buzzer', tab: '1 · A noise', cum: true,
      why: 'Notes for the grown-up. Shown under "Grown-up note".',
      steps: [
        { k: 'r', a: ['Pb', 38], b: ['B', 38], v: '220Ω',
          say: 'A resistor first.' },
        { k: 'led', row: 'C', a: 38, b: 39, tone: '#D94F3D',
          say: 'Now the light. Long leg on the left.',
          check: '<b>It should be lit.</b> If not, turn it around.' }
      ]
    }
  ]
};
```

Then the page, `docs/my-lesson.html`:

```html
<title>My lesson</title>
<link rel="stylesheet" href="lib/kit.css">
<div class="page">
  <header class="masthead"><h1>My lesson</h1></header>
  <section><div id="kit"></div></section>
</div>
<script src="lib/breadboard.js"></script>
<script src="lib/parts.js"></script>
<script src="lib/narrator.js"></script>
<script src="lib/typewriter.js"></script>
<script src="lib/overlays/freenove-ext.js"></script>
<script src="lib/instructor.js"></script>
<script src="lessons/my-lesson.js"></script>
<script>
  BBKit.instructor.mount(document.getElementById('kit'),
                         BBKit.lessons['my-lesson']);
</script>
```

### Build fields

| Field | Meaning |
|---|---|
| `id` | keys into `lesson.hot` |
| `tab` | button label in the build picker |
| `cum` | `true` shows every earlier cumulative build, dimmed. `false` stands alone — use it for a parts inventory or a set of reveals |
| `audience` | `'grown-up'` keeps the build off the interactive page entirely |
| `why` | one paragraph for the grown-up, rendered only in the notes |
| `steps` | one entry per piece |

`lesson.hot` maps a build id to the extension-board labels to pick out in gold.
Prefer the per-spine form — `{ d: [27] }` — because a bare `[27]` lights the
label on *both* pin rows, and each position carries a different GPIO on each
side (27 is GPIO 13 on `d` and GPIO 15 on `g`).

### Step kinds

| `k` | Fields | Draws |
|---|---|---|
| `w` | `a`, `b`, `c`, optional `lane` or `via` | a jumper. `c` is a role: `v5` `v3` `gnd` `s1` `s2` `s3` `sig`. Same-column runs go straight, others arc over the top. `lane: 360` routes it along that y — use it when several long runs would otherwise overlap. `via: []` forces straight; `via: [{x,y}…]` sets waypoints by hand |
| `r` | `a`, `b`, `v` | a resistor with its value beside it |
| `led` | `row`, `a`, `b`, `tone` | an LED straddling two holes, anode marked |
| `pot` | `row`, `p` | a potentiometer, three legs from `p` |
| `npn` | `row`, `e`, `b`, `c`, optional `label` | a transistor |
| `module` | `row`, `p0`, `n`, `pins[]`, optional `title`, `eyes` | a sensor module plugged into `n` holes from `p0`, pin names beside the legs. `eyes: true` draws the HC-SR04's two transducers |
| `block` | `x`, `y`, `w`, `h`, `title`, `sub` | a labelled box in **pixels** — for parts genuinely not in any hole, like a module on a plug |
| `zone` | `p0`, `p1`, `r0`, `r1` | a dashed region ("clear this area") |
| `reveal` | `what`: `cols` \| `channel` \| `rails` | tints the invisible connections |
| `parts` | — | the inventory panel, from `lesson.parts` |

Every step also takes `say` (spoken and typed), optional `check` (HTML, the
"you should see this" note for the child) and optional `coach` (HTML, for the
grown-up, never rendered on the build page).

The inventory panel takes `bands` on a resistor — `'220'`, `'1k'`, `'10k'`,
`'20k'` — so the picture shows the colour code of the one he is hunting for.
That matters as soon as a lesson uses more than one value.

## Rules worth keeping

- **One step, one piece.** If a step needs the word "and", it is two steps.
- **Say what he can see.** No volts, no current, no numbers. "Electricity needs
  a way out and a way back" beats anything with a unit in it.
- **Make something happen early and often.** A half-built castle looks like a
  half-built castle; a half-built circuit does nothing, which to a five-year-old
  is indistinguishable from broken. Sequence so each build ends with a light.
- **Let mistakes stand.** A dead LED that is in backwards is the best teaching
  moment in the kit, as long as he finds it. `check` should hint, not fix.

Fuller reasoning in `docs/teaching-plan.md`.

## Constraints

**Classic scripts, not ES modules.** Chrome and Safari block
`<script type="module">` over `file://` as a CORS violation. These pages must
open straight off disk and Dropbox on an iPad, with no server and no build step,
so everything hangs off a `window.BBKit` global and loads in dependency order.

**Plain JS with JSDoc, not TypeScript.** Same reason: no build step between you
and a file that opens from disk. Typecheck with `npx tsc --checkJs --noEmit` if
you want it.

**Framework-free renderer, permanently.** `parts.js` returns
`{ svg, at, r }` records and the board returns SVG strings, so the same renderer
is consumable by vanilla, by React through `dangerouslySetInnerHTML`, by Next
SSR, or by a Node script writing print-ready PNGs. When the authoring app gets
built in React, it imports this; it does not reimplement it.

## Adding a carrier board

`overlays/freenove-ext.js` is the model. An overlay is one function,
`(board, hot, opts) → svgString`, registered as
`BBKit.overlays['my-board']`. Nothing in the core knows about any particular
board, so a project on different hardware writes one overlay and changes nothing
else.

## Verifying a change

The booklet's render is regression-testable. Serve `docs/` and compare a
normalised per-step signature before and after:

```sh
python3 -m http.server 8765 --directory docs
```

Then in the browser console on `first-circuits.html`, walk every build and step
and hash the SVG geometry. If the hashes are unchanged, the render is unchanged —
that is how this extraction was verified against the pre-extraction page, across
all 21 build/step combinations.
