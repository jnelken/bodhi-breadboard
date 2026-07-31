/* ============================================================================
   Lesson — The night light (HC-SR501 PIR motion sensor).

   The simplest of the three sittings after the binoculars, because a PIR only
   ever says one thing — something moved — instead of answering with a
   distance or a position. That makes it a good second sensor: same shape as
   the binoculars (a light that waits, then a module that wakes it), one fewer
   idea to hold in his head.

   Wiring facts this depends on, from docs/extension-board.md and README.md:
     - the extension board powers the rails itself. The bottom pair is 5V/GND.
     - GPIO 32 is position 19 (S2), GPIO 33 is position 20 (S3), both in
       column d, tapped from rows a-c.
     - the real Signal Box wires the PIR's OUT -> S3 (docs/breadboard-layouts.html
       and BodhiBox/src/DriverMotion.cpp). No S1, no click — three wires only.

   OUT idles low and jumps to a clean high once triggered, but it is still a
   5V-ish logic level like the ultrasonic's Echo, so it goes through the same
   10k/20k divider before it can touch a 3.3V pin.

   A fresh HC-SR501 needs a few seconds after power to settle, and once it
   fires it holds its answer high for several seconds — both are the sensor
   doing what it always does, not a wiring fault. Give it a moment.
   ========================================================================= */

window.BBKit = window.BBKit || {};
window.BBKit.lessons = window.BBKit.lessons || {};

window.BBKit.lessons['nightlight'] = {
  title: 'The night light',

  board: { pitch: 22, cols: 63, pad: 46 },
  viewBox: '0 0 1480 470',
  overlay: 'freenove-ext',

  hot: {
    prep: {}, pieces: {},
    light: { d: [19] },
    sense: { d: [19, 20] }
  },

  parts: [
    { k: 'module', n: 1, label: 'the motion sensor' },
    { k: 'r', n: 1, bands: '10k', label: 'big resistor' },
    { k: 'r', n: 1, bands: '20k', label: 'biggest resistor' },
    { k: 'r', n: 1, bands: '220', label: 'resistor' },
    { k: 'led', n: 1, tone: '#E0A32E', label: 'yellow light' },
    { k: 'w', n: 1, tone: 'var(--w-5v)', label: 'red wire' },
    { k: 'w', n: 2, tone: 'var(--w-gnd)', label: 'black wire' },
    { k: 'w', n: 1, tone: 'var(--w-s2)', label: 'blue wire' },
    { k: 'w', n: 1, tone: 'var(--w-s3)', label: 'green wire' }
  ],

  builds: [
    {
      id: 'prep', tab: 'Board prep', cum: false, audience: 'grown-up',
      why: 'Same ten minutes as always. Only three legs to break in this time — the easiest module fitting of the four sittings.',
      steps: [
        { k: 'zone', p0: 18, p1: 63, r0: 'J', r1: 'Pbn',
          say: 'Clear the board back to the extension board.',
          coach: 'Everything from the previous sitting comes off too.' },
        { k: 'zone', p0: 42, p1: 60, r0: 'E', r1: 'Pbn',
          say: 'Break in the holes here.',
          coach: 'Only three legs, but they are stiff — seat and unseat the module yourself first.' }
      ]
    },
    {
      id: 'pieces', tab: 'Your pieces', cum: false,
      why: 'The same 10k/20k pair as the binoculars, plus the always-there 220. Point at colour bands, never at ohms.',
      steps: [
        { k: 'parts', say: 'Find these pieces.',
          coach: 'If you have no 20 kΩ, two 10 kΩ in series is the documented substitute.' }
      ]
    },
    {
      id: 'light', tab: '1 · A light that waits', cum: true,
      why: 'The same shape every sensor sitting opens with — a light already wired to a computer pin, dark until code arrives.',
      steps: [
        { k: 'w', a: ['A', 19], b: ['A', 52], c: 's2', lane: 368,
          say: 'A blue wire. It comes from the little computer.' },
        { k: 'r', a: ['B', 52], b: ['B', 54], v: '220Ω',
          say: 'A resistor, so the light does not get too much.' },
        { k: 'led', row: 'C', a: 54, b: 55, tone: '#E0A32E',
          say: 'A yellow light. Long leg on the left.' },
        { k: 'w', a: ['B', 55], b: ['Pbn', 55], c: 'gnd',
          say: 'And back to the black line.',
          check: '<b>It blinks, slow and steady.</b> If it stays dark, turn the light around.',
          coach: 'Upload in front of him: <code>./flash.sh FirstMotion</code>. With nothing plugged in the pin it watches reads near zero, so it falls back to the same slow blink as the other builds.' }
      ]
    },
    {
      id: 'sense', tab: '2 · Give it a sense', cum: true,
      why: 'The simplest payoff of the three sensor sittings: no knob, no click, just yes-or-no. That contrast is worth naming out loud once he has built the other two.',
      steps: [
        { k: 'module', row: 'E', p0: 44, n: 3, pins: ['VCC', 'OUT', 'GND'],
          say: 'The motion sensor! Push all three legs in.',
          coach: 'Pin order varies between HC-SR501 boards — check the labels printed on yours before trusting this picture.' },
        { k: 'w', a: ['B', 44], b: ['Pb', 44], c: 'v5',
          say: 'Red wire. This one gives it power.' },
        { k: 'w', a: ['B', 46], b: ['Pbn', 46], c: 'gnd',
          say: 'Black wire. The way back.' },
        { k: 'r', a: ['C', 45], b: ['C', 49], v: '10kΩ',
          say: "A big resistor on the sensor's middle leg." },
        { k: 'r', a: ['B', 49], b: ['Pbn', 49], v: '20kΩ',
          say: 'And the biggest one, down to the black line.',
          coach: 'The same divider as every sensor here: it keeps the sensor\'s answer a safe margin below what the ESP32\'s pins can take.' },
        { k: 'w', a: ['A', 49], b: ['A', 20], c: 's3',
          say: 'A green wire. Now the computer can feel it sense something.',
          check: '<b>Wave your hand in front of the sensor.</b> The light turns solid, then goes back to its slow blink once it stops seeing you.',
          coach: 'Upload <code>./flash.sh FirstMotion</code> now if you have not already. A fresh sensor takes a few seconds to settle after power — if the first wave does nothing, wait and try again. It also holds its answer for several seconds after firing, so do not expect an instant switch-off.' }
      ]
    }
  ]
};
