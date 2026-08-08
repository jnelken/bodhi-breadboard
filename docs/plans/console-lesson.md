# Build lesson — Bodhi's Console

> **Suggested execution:** Opus 4.7 with high reasoning — the overlay is SVG geometry transcribed from a photograph where a one-position error puts every wire in the lesson in the wrong hole, and the step copy has to work for a child who cannot read. Step down to Sonnet 4.6 once the overlay is drawn and verified against the physical board, since the lesson document is then filling in a known schema; Haiku 4.5 only for the `docs/index.html` card.

## Context

The console (`../bodhi-oled-board/MiniGames/`) is built and flashing, but it was
assembled by an adult. Every other build in this kit has a lesson that lets Bodhi
put it together himself — `first-circuits`, `binoculars`, `joystick`,
`nightlight`, `shadowlight` — and the console is the most rewarding thing on the
bench with no lesson attached.

This adds one: `console.html`, in the same booklet, sharing the same renderer.

It is the first lesson for the **other board**. Everything so far sits on the
Freenove ESP32-WROVER CAM with its GPIO Extension Board; the console is a plain
ESP32 DevKit. The renderer was written to make that a one-file change — "a
project on different hardware writes one overlay and changes nothing else"
(`docs/lib/README.md`) — and this is the first time that claim gets tested.

## Blocked on one thing

**A photo of the console breadboard, taken straight down, with the DevKit's
silkscreen legible.**

The lesson format places every wire at a named hole (`{ k: 'w', a: ['A', 19],
b: ['A', 55] }`), so the overlay needs real pin positions, not assumed ones.
Two facts in particular cannot be guessed:

- **Which position the board starts and ends at.** `freenove-ext` spans 13–32;
  the DevKit will span something else entirely, and its 30-pin and 38-pin
  variants are not the same board with extra pins on the end.
- **Which GPIO is printed next to which hole, on both spines.** This is the
  whole content of the overlay.

`docs/breadboard-layouts.html` records how the Freenove map was made — labels
read off a photograph, then one pin confirmed by eye against the printed ruler
("GPIO 13 should sit two positions below GPIO 12; if that holds, the whole map
holds"). Do the same here, and write the equivalent confirmation sentence into
`docs/modules/esp32-devkit.md`, which currently says *not yet confirmed*.

**Also worth measuring from the photo:** the DevKit is wide enough to cover the
channel and most of the rows either side, leaving perhaps two or three usable
holes per row. That is a much tighter routing budget than the Freenove board's
three-per-side, and it may be the thing that decides whether the build uses one
breadboard or two. Do not design the step layout before this is known.

## What gets built

### 1. `docs/lib/overlays/esp32-devkit.js`

One function, `(board, hot, opts) → svgString`, registered as
`BBKit.overlays['esp32-devkit']`. Model it on `overlays/freenove-ext.js` — same
shape, same CSS classes (`extbody`, `extpad`, `extlbl`, `exttxt`), same
`b.X(pos)` / `b.Y(row)` / `b.scale` geometry, same `BBKit.esc` on every label.

**It is simpler than the Freenove overlay, not harder.** That one draws a
silhouette covering both power rails, two screw-terminal blocks, and redrawn
position numbers, because the carrier board covers half the breadboard. The
DevKit only straddles the channel: a body rect from `X(FROM)` to `X(TO)`
spanning `Y('G')` to `Y('D')`, two rows of rotated labels, and the pads. Expect
roughly half of freenove-ext's 155 lines.

Keep the same `hot` contract, including the per-spine `{ d: [...], g: [...] }`
form — `docs/lib/README.md` is explicit that a flat list lights the label on
both spines, which is wrong whenever only one side of a position is in use.
Export `from`, `to`, `dLabels`, `gLabels` on the function the way freenove-ext
does, so `breadboard-layouts.html` can reuse them later.

### 2. A `button` step kind in `docs/lib/parts.js`

The kit draws `w / r / led / pot / npn / module / block / zone / reveal / parts`.
A tactile switch is none of them.

`module` is the near miss and worth understanding before reaching for it: it
draws one body above a single row with one leg per hole. A tactile switch has
**two pairs of legs that straddle the channel**, and that geometry is the entire
point of the part — the pair that runs across the body is permanently joined,
which is exactly the thing that makes a button appear dead when it is turned 90°
(see `docs/modules/push-button.md`).

So: a new `button(b, st)` returning the standard `{ svg, at, r }`, taking
`{ p, rowTop, rowBot }`, drawing the body over the channel with four legs and —
importantly — showing the joined pairs, because the drawing is where that gets
taught. Register it in the `KIND` table (`parts.js:333`) and export it on
`BBKit.parts` (`parts.js:348`).

The OLED (4 pins) and the joystick (5 pins) both fit `module` as-is. The buzzer
fits `module` with two pins, or `block` if it reads better.

### 3. `ConsoleCheck/` — a sketch the lesson can build against

**This is the part that makes the lesson work, and it does not exist yet.**

The kit's rule is "make something happen early and often — a half-built circuit
does nothing, which to a five-year-old is indistinguishable from broken." Every
existing lesson is paired with a `First*` sketch that does the minimum at that
stage. `MiniGames` cannot play that role: until all four buttons are in, the
menu cannot be driven.

But the console already contains exactly the right screen — the controls
self-test reached by holding all four buttons on the menu, which draws the stick
as a dot in a box and each button as a square that fills when held.

So add `../bodhi-oled-board/ConsoleCheck/`: a small sketch that boots straight
into that self-test and plays a scale on startup. Then every build in the lesson
ends with something visibly happening:

| Build | It's flashed once, before build 1 — and then |
|---|---|
| 1 · The screen | it says hello |
| 2 · A button | that square fills when he presses it |
| 3 · Three more | all four do |
| 4 · The stick | the dot follows his thumb |
| 5 · A voice | it plays a little tune |

Factor the self-test drawing out of `MiniGames.ino` so both sketches render the
identical screen rather than two that drift apart.

### 4. `docs/lessons/console.js` and `docs/console.html`

`console.html` is the ~24-line loader every other lesson page uses — the same
script list, with `overlays/esp32-devkit.js` swapped in for `freenove-ext.js`.

`console.js` follows `docs/lessons/joystick.js` most closely, since that one also
places a multi-pin module and its wires. Builds:

- `prep` — `audience: 'grown-up'`. Clearing the board and breaking in the holes.
  The DevKit's pin rows are stiff and seating it is a harder push than anything
  in the kit so far; that belongs here, not on a page he is driving.
- `pieces` — the inventory panel from `lesson.parts`.
- `1 · The screen` → `5 · A voice`, as above, all `cum: true`.

**The two-audience rule is not negotiable.** `say` and `check` are the only
things a child sees. Upload commands, the reasoning behind a step, and anything
of the form "ask him…" or "resist helping" are `coach` notes. `docs/lib/README.md`
states this at length and `teaching-notes.html` renders the adult half from the
same file, so there is no reason to leak any of it onto the build page.

Per-build `hot` in the per-spine form, lighting only the GPIO actually being
wired in that step.

### 5. A card in `docs/index.html`

An `<a class="lesson-card">` with a 64×64 inline SVG icon, matching the five
already there. The icon should read as a little screen with a stick.

## Also worth doing while here

- **`publish-firmware.sh` hardcodes `FQBN="esp32:esp32:esp32wrover"`.** Make it a
  parameter and the console lesson can end with a browser flash button for
  `ConsoleCheck`, the way `binoculars.html` already does with
  `<esp-web-install-button>`. That is a real payoff for a grown-up with no
  toolchain installed, and most of the plumbing exists.
- **Confirm `docs/modules/esp32-devkit.md` and `ssd1306-oled.md`** off the same
  photo session, and flip their ⬜ to ✅ in `docs/modules/README.md`. The whole
  value of that folder is the distinction between checked and assumed.

## Verification

1. `python3 -m http.server 8000 --directory docs`, then walk every build and step
   of `/console.html` — the narrator, the typewriter and the build picker all
   come free from `mount()`, so what is being checked is that each piece lands in
   the hole the text names.
2. **Check the render did not regress elsewhere.** `parts.js` is shared by every
   lesson, so adding a step kind touches all of them. `docs/lib/README.md`
   describes the method: serve `docs/`, walk every build and step on
   `first-circuits.html`, and hash the SVG geometry before and after. Unchanged
   hashes mean an unchanged render.
3. `/teaching-notes.html` should pick the new lesson up automatically —
   `notes.js` renders whatever is registered — and show `why` and `coach` for
   every build. Confirm nothing adult leaked onto `/console.html` itself.
4. `/breadboard-layouts.html` still renders; it imports `parts.js` and the
   Freenove overlay directly.
5. Deep links: `console.html#stick/2` should land on that step, and a nonsense
   hash should fall back to the first step rather than erroring.
6. Open it from **disk** as well as over the server. These pages are meant to
   work off Dropbox on an iPad with no server and no build step, which is why
   everything is a classic script hanging off `window.BBKit` — an accidental
   `import` breaks that silently on `file://`.
7. **The real test:** hand Bodhi the parts and the page, and see whether he gets
   to a screen that says hello without being told anything that is not on it.

## Sequence

1. Photo → read the silkscreen → `esp32-devkit.js` overlay → confirm one pin by
   eye against the board before trusting the rest.
2. `button` primitive in `parts.js`, with the regression hash check.
3. `ConsoleCheck` sketch, with the self-test extracted so it cannot drift.
4. `console.js` + `console.html` + the index card.
5. `publish-firmware.sh` parameterised, and the module files confirmed.
