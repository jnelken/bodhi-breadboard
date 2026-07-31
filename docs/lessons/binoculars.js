/* ============================================================================
   Lesson — The binoculars (HC-SR04 ultrasonic distance sensor).

   The sitting after first-circuits. Build 4 there ended with a light that only
   the computer could switch on; this one gives the computer something to look
   at, so the light answers a hand instead of a program.

   Wiring facts this depends on, from docs/extension-board.md:
     - the extension board powers the rails itself. The BOTTOM pair is 5 V and
       GND, which is what an HC-SR04 needs — no supply wire to run.
     - GPIO 13 is position 27, GPIO 32 is position 19, GPIO 33 is position 20,
       all in column d, all tapped from rows a-c.

   Echo is a 5 V output and the ESP32 is a 3.3 V part, so it goes through a
   10 k / 20 k divider before touching a pin — the same 2/3 ratio the Signal
   Box's port uses permanently. That is the one non-negotiable part of this
   build, and it is why steps 5 and 6 exist.
   ========================================================================= */

window.BBKit = window.BBKit || {};
window.BBKit.lessons = window.BBKit.lessons || {};

window.BBKit.lessons['binoculars'] = {
  title: 'The binoculars',

  board: { pitch: 22, cols: 63, pad: 46 },
  viewBox: '0 0 1480 470',
  overlay: 'freenove-ext',

  /* Per-spine, so only the labels he actually needs light up. A bare list would
     also flag the g-side pin sharing each position — GND, 19 and 15 here, none
     of which this build touches. */
  hot: {
    prep: {}, pieces: {},
    light: { d: [20] },
    eyes: { d: [19, 20, 27] }
  },

  parts: [
    { k: 'module', n: 1, label: 'the binoculars' },
    { k: 'r', n: 1, bands: '220', label: 'resistor' },
    { k: 'r', n: 1, bands: '10k', label: 'big resistor' },
    { k: 'r', n: 1, bands: '20k', label: 'biggest resistor' },
    { k: 'led', n: 1, tone: '#3F7FD0', label: 'blue light' },
    { k: 'w', n: 1, tone: 'var(--w-5v)', label: 'red wire' },
    { k: 'w', n: 2, tone: 'var(--w-gnd)', label: 'black wire' },
    { k: 'w', n: 1, tone: 'var(--w-s1)', label: 'yellow wire' },
    { k: 'w', n: 1, tone: 'var(--w-s2)', label: 'blue wire' },
    { k: 'w', n: 1, tone: 'var(--w-s3)', label: 'green wire' }
  ],

  builds: [
    {
      id: 'prep', tab: 'Board prep', cum: false, audience: 'grown-up',
      why: 'Same ten minutes as last time. This build reaches further along the board than the first-circuits ladder did, so clear all the way to position 60.',
      steps: [
        { k: 'zone', p0: 18, p1: 63, r0: 'J', r1: 'Pbn',
          say: 'Clear the board back to the extension board.',
          coach: 'The three lights from first-circuits come off too. This lesson rebuilds one light on a computer-controlled pin, and leftover rail-powered LEDs sitting on beside it muddle the idea that this one is different.' },
        { k: 'zone', p0: 42, p1: 58, r0: 'E', r1: 'Pbn',
          say: 'Break in the holes here.',
          coach: 'The sensor needs four stiff holes in a row and small hands cannot manage that cold. Seat and unseat the module yourself first — an HC-SR04 takes more force than an LED leg.' }
      ]
    },
    {
      id: 'pieces', tab: 'Your pieces', cum: false,
      why: 'Three resistors that look almost identical, which is new. The colour bands in the picture are the only way to tell them apart, so this panel is doing real work — point at the stripes rather than naming ohms.',
      steps: [
        { k: 'parts',
          say: 'Find these pieces.',
          coach: 'The two big resistors are 10 kΩ (brown-black-orange) and 20 kΩ (red-black-orange). If you have no 20 kΩ, two 10 kΩ in series is the documented substitute.' }
      ]
    },
    {
      id: 'light', tab: '1 · A light that waits', cum: true,
      why: 'Deliberately the same shape as build 4 of first-circuits: a light on a computer pin that does nothing until code arrives. Rebuilding it from memory is the point — he has done this exact thing before, and knowing that is worth more than the four minutes it costs.',
      steps: [
        { k: 'w', a: ['A', 20], b: ['A', 52], c: 's3', lane: 368,
          say: 'A green wire. It comes from the little computer.' },
        { k: 'r', a: ['B', 52], b: ['B', 54], v: '220Ω',
          say: 'A resistor, so the light does not get too much.' },
        { k: 'led', row: 'C', a: 54, b: 55, tone: '#3F7FD0',
          say: 'A blue light. Long leg on the left.' },
        { k: 'w', a: ['B', 55], b: ['Pbn', 55], c: 'gnd',
          say: 'And back to the black line.',
          check: '<b>It blinks, slow and steady.</b> If it stays dark, turn the light around.',
          coach: 'Upload in front of him now: <code>./flash.sh FirstDistance</code>. With no sensor attached yet the sketch cannot get a reading, so it falls back to a slow blink — that is deliberate, and it means this build has its own payoff before the sensor arrives.' }
      ]
    },
    {
      id: 'eyes', tab: '2 · Give it eyes', cum: true,
      why: 'The payoff sitting. Seven pieces, but only two ideas: the sensor needs power like everything else, and it needs two wires to the computer — one to ask, one to answer. The two big resistors are the only genuinely opaque part; see the note on that step.',
      steps: [
        { k: 'module', row: 'E', p0: 44, n: 4, eyes: true,
          pins: ['VCC', 'Trig', 'Echo', 'GND'],
          say: 'The binoculars! Push all four legs in.',
          coach: 'Orientation matters and the pin names are printed on the back of the module. VCC goes on the left at position 44. If he puts it in backwards nothing is damaged — the sketch simply never gets a reading and the light keeps its slow blink.' },
        { k: 'w', a: ['B', 44], b: ['Pb', 44], c: 'v5',
          say: 'Red wire. This one gives it power.' },
        { k: 'w', a: ['B', 47], b: ['Pbn', 47], c: 'gnd',
          say: 'Black wire. The way back.' },
        { k: 'w', a: ['A', 27], b: ['A', 45], c: 's1', lane: 352,
          say: 'A yellow wire to the computer. This is how it says "look now".' },
        { k: 'r', a: ['C', 46], b: ['C', 50], v: '10kΩ',
          say: 'A big resistor on the next leg along.' },
        { k: 'r', a: ['B', 50], b: ['Pbn', 50], v: '20kΩ',
          say: 'And the biggest one, down to the black line.',
          coach: 'These two are a voltage divider. The sensor answers at 5 V and the ESP32 can only take 3.3 V, so the pair cuts the answer to two thirds before it reaches the pin. Skipping them will eventually damage the board. For him: "the binoculars shout, and these two make it quiet enough to listen to."' },
        { k: 'w', a: ['A', 50], b: ['A', 19], c: 's2', lane: 360,
          say: 'A blue wire. Now the computer can hear the answer.',
          check: '<b>Wave your hand in front of the binoculars.</b> Close up it blinks fast. Far away it goes slow.',
          coach: 'Aim it across the table rather than into open air — with nothing in range the sketch falls back to its slow blink and it reads as broken. If the blink never changes, check the yellow wire is on position 27 and the blue one on 19; those two are easy to swap.' }
      ]
    }
  ]
};
