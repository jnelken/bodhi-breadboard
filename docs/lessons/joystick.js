/* ============================================================================
   Lesson — The joystick (dual-axis + click).

   The sitting after the binoculars. Same shape — a light that already waits on
   a computer pin, then a module that gives it something to answer to — but
   this part folds two ideas he already has into one: build 3 of first-circuits
   taught a knob that dims, and a click is just the switch he has closed with
   every wire on this board. The joystick is that knob and that switch, riding
   on one stick.

   Wiring facts this depends on, from docs/extension-board.md and README.md:
     - the extension board powers the rails itself. The bottom pair is 5V/GND.
     - GPIO 13 is position 27 (S1), GPIO 32 is position 19 (S2), GPIO 33 is
       position 20 (S3), all in column d, tapped from rows a-c.
     - the real Signal Box wires the joystick SW -> S1, VRx -> S2, VRy -> S3
       (docs/breadboard-layouts.html). This build only wires the click and one
       axis — VRy, the one the box's own driver uses to drive a meter — to keep
       a single sitting to four resistors instead of six identical-looking
       ones. VRx still gets a leg in the board; it just never gets a wire.

   VRy is a 5V-ish output like the ultrasonic's Echo, so it goes through the
   same 10k/20k divider before it can touch a 3.3V pin. The click is a switch
   to ground, same as every other button in this project, and needs no divider
   — it is only ever read, never driven, in this standalone build.
   ========================================================================= */

window.BBKit = window.BBKit || {};
window.BBKit.lessons = window.BBKit.lessons || {};

window.BBKit.lessons['joystick'] = {
  title: 'The joystick',

  board: { pitch: 22, cols: 63, pad: 46 },
  viewBox: '0 0 1480 470',
  overlay: 'freenove-ext',

  hot: {
    prep: {}, pieces: {},
    light: { d: [19] },
    thumb: { d: [19, 20, 27] }
  },

  parts: [
    { k: 'module', n: 1, label: 'the joystick' },
    { k: 'r', n: 1, bands: '10k', label: 'big resistor' },
    { k: 'r', n: 1, bands: '20k', label: 'biggest resistor' },
    { k: 'r', n: 1, bands: '220', label: 'resistor' },
    { k: 'led', n: 1, tone: '#F2EEDF', label: 'white light' },
    { k: 'w', n: 1, tone: 'var(--w-5v)', label: 'red wire' },
    { k: 'w', n: 2, tone: 'var(--w-gnd)', label: 'black wire' },
    { k: 'w', n: 1, tone: 'var(--w-s1)', label: 'yellow wire' },
    { k: 'w', n: 1, tone: 'var(--w-s2)', label: 'blue wire' },
    { k: 'w', n: 1, tone: 'var(--w-s3)', label: 'green wire' }
  ],

  builds: [
    {
      id: 'prep', tab: 'Board prep', cum: false, audience: 'grown-up',
      why: 'Same ten minutes as before. The stick itself needs five stiff holes in a tight row, which is a harder push than anything so far.',
      steps: [
        { k: 'zone', p0: 18, p1: 63, r0: 'J', r1: 'Pbn',
          say: 'Clear the board back to the extension board.',
          coach: 'Everything from the binoculars sitting comes off too — this build rebuilds its own "light that waits" from scratch.' },
        { k: 'zone', p0: 42, p1: 60, r0: 'E', r1: 'Pbn',
          say: 'Break in the holes here.',
          coach: 'Five legs in a tight row is more force than the sensor module needed. Seat and unseat the joystick yourself first, or it becomes a fight before the lesson even starts.' }
      ]
    },
    {
      id: 'pieces', tab: 'Your pieces', cum: false,
      why: 'Three resistor values again, in the same two pairs he has already met plus the always-there 220. Point at colour bands, never at ohms.',
      steps: [
        { k: 'parts', say: 'Find these pieces.',
          coach: 'The two big resistors are 10 kΩ and 20 kΩ, the same pair as the binoculars. If you have no 20 kΩ, two 10 kΩ in series is the documented substitute.' }
      ]
    },
    {
      id: 'light', tab: '1 · A light that waits', cum: true,
      why: 'The same shape as build 1 of the binoculars, on purpose — a light already wired to a computer pin, dark until code arrives. Rebuilding a familiar shape from memory matters more than the few minutes it costs.',
      steps: [
        { k: 'w', a: ['A', 19], b: ['A', 55], c: 's2', lane: 368,
          say: 'A blue wire. It comes from the little computer.' },
        { k: 'r', a: ['B', 55], b: ['B', 57], v: '220Ω',
          say: 'A resistor, so the light does not get too much.' },
        { k: 'led', row: 'C', a: 57, b: 58, tone: '#F2EEDF',
          say: 'A white light. Long leg on the left.' },
        { k: 'w', a: ['B', 58], b: ['Pbn', 58], c: 'gnd',
          say: 'And back to the black line.',
          check: '<b>It blinks, slow and steady.</b> If it stays dark, turn the light around.',
          coach: 'Upload in front of him: <code>./flash.sh FirstJoystick</code>. With no stick attached the pin it watches reads near zero, so it falls back to the same slow blink FirstDistance uses with nothing in range.' }
      ]
    },
    {
      id: 'thumb', tab: '2 · Give it a thumb', cum: true,
      why: 'Two ideas, not five: a switch he already knows from every wire he has closed, and a knob like build 3 of first-circuits — just riding on the same stick. Skipping the second axis keeps this to four resistors instead of six that all look alike.',
      steps: [
        { k: 'module', row: 'E', p0: 44, n: 5, pins: ['SW', 'VRy', 'VRx', '+5V', 'GND'],
          say: 'The joystick! Push all five legs in.',
          coach: 'Pin names are printed on the back of the module — check them before trusting this order. This is the order for the module this build was wired against; a different unit may read +5V, GND, SW, VRx, VRy instead, and every wire below would need to shift with it. VRx gets a leg but no wire; it is simply not used in this build.' },
        { k: 'w', a: ['B', 47], b: ['Pb', 47], c: 'v5',
          say: 'Red wire. This one gives it power.' },
        { k: 'w', a: ['B', 48], b: ['Pbn', 48], c: 'gnd',
          say: 'Black wire. The way back.' },
        { k: 'w', a: ['A', 27], b: ['A', 44], c: 's1', lane: 352,
          say: 'A yellow wire to the computer. This is the click.' },
        { k: 'r', a: ['C', 45], b: ['C', 52], v: '10kΩ',
          say: "A big resistor on the stick's last leg." },
        { k: 'r', a: ['B', 52], b: ['Pbn', 52], v: '20kΩ',
          say: 'And the biggest one, down to the black line.',
          coach: 'The same divider as the binoculars: the stick answers at up to 5V and the ESP32 only takes 3.3V, so this pair cuts it down before it reaches the pin.' },
        { k: 'w', a: ['A', 52], b: ['A', 20], c: 's3',
          say: 'A green wire. Now the computer can feel the stick.',
          check: '<b>Push the stick up and down.</b> The light blinks faster and slower. Hold the click down and it turns solid.',
          coach: 'Upload <code>./flash.sh FirstJoystick</code> now if you have not already. If pushing the stick does nothing, check the green wire is on position 20 and the yellow one on 27 — those two are easy to swap. If the click never goes solid and the blink looks erratic even before touching the stick, recheck the module\'s pin labels against the diagram first — a mismatched pin order (this build\'s module reads SW, VRy, VRx, +5V, GND rather than the more common +5V, GND, SW, VRx, VRy) will misroute power and ground into the wrong legs entirely. If up makes it slow down instead of speed up, that is just how this particular stick is wired, not a mistake.' }
      ]
    }
  ]
};
