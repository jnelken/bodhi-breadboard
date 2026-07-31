/* ============================================================================
   Lesson — The shadow light (photoresistor / light-sensor module).

   The third sensor sitting. Where the motion sensor only ever says
   yes-or-no, this one answers with a number — how bright the room is right
   now — so the light it drives climbs and falls smoothly, closer in spirit to
   the joystick's stick than the motion sensor's wave. It is also the closest
   thing in this project to first-circuits build 3, the knob: same idea, a
   part whose whole job is "how much", just lit by the room instead of turned
   by a thumb.

   Wiring facts this depends on, from docs/extension-board.md and README.md:
     - the extension board powers the rails itself. The bottom pair is 5V/GND.
     - GPIO 32 is position 19 (S2), GPIO 33 is position 20 (S3), both in
       column d, tapped from rows a-c.
     - the real Signal Box wires the module's AO -> S2 (docs/breadboard-layouts.html
       and BodhiBox/src/DriverLight.cpp).

   AO is a 5V-ish analog output, so it goes through the same 10k/20k divider as
   every other sensor here before it can touch a 3.3V pin. Which way the light
   responds to a covered sensor depends on how the module wires its own onboard
   divider — some brighten when covered, some dim. Both are correct; the coach
   note on the payoff step says so, and BodhiBox/src/DriverLight.cpp carries
   the same caveat as `kCoveringRaises`.
   ========================================================================= */

window.BBKit = window.BBKit || {};
window.BBKit.lessons = window.BBKit.lessons || {};

window.BBKit.lessons['shadowlight'] = {
  title: 'The shadow light',

  board: { pitch: 22, cols: 63, pad: 46 },
  viewBox: '0 0 1480 470',
  overlay: 'freenove-ext',

  hot: {
    prep: {}, pieces: {},
    light: { d: [20] },
    shadow: { d: [19, 20] }
  },

  parts: [
    { k: 'module', n: 1, label: 'the light sensor' },
    { k: 'r', n: 1, bands: '10k', label: 'big resistor' },
    { k: 'r', n: 1, bands: '20k', label: 'biggest resistor' },
    { k: 'r', n: 1, bands: '220', label: 'resistor' },
    { k: 'led', n: 1, tone: '#3E9E5A', label: 'green light' },
    { k: 'w', n: 1, tone: 'var(--w-5v)', label: 'red wire' },
    { k: 'w', n: 2, tone: 'var(--w-gnd)', label: 'black wire' },
    { k: 'w', n: 1, tone: 'var(--w-s2)', label: 'blue wire' },
    { k: 'w', n: 1, tone: 'var(--w-s3)', label: 'green wire' }
  ],

  builds: [
    {
      id: 'prep', tab: 'Board prep', cum: false, audience: 'grown-up',
      why: 'Same ten minutes as always. Three legs to break in, same as the motion sensor.',
      steps: [
        { k: 'zone', p0: 18, p1: 63, r0: 'J', r1: 'Pbn',
          say: 'Clear the board back to the extension board.',
          coach: 'Everything from the previous sitting comes off too.' },
        { k: 'zone', p0: 42, p1: 60, r0: 'E', r1: 'Pbn',
          say: 'Break in the holes here.',
          coach: 'Seat and unseat the module yourself first, same as every other sitting.' }
      ]
    },
    {
      id: 'pieces', tab: 'Your pieces', cum: false,
      why: 'The same 10k/20k pair as every other sensor, plus the always-there 220. Point at colour bands, never at ohms.',
      steps: [
        { k: 'parts', say: 'Find these pieces.',
          coach: 'If you have no 20 kΩ, two 10 kΩ in series is the documented substitute.' }
      ]
    },
    {
      id: 'light', tab: '1 · A light that waits', cum: true,
      why: 'The same shape every sensor sitting opens with — a light already wired to a computer pin, dark until code arrives.',
      steps: [
        { k: 'w', a: ['A', 20], b: ['A', 53], c: 's3', lane: 368,
          say: 'A green wire. It comes from the little computer.' },
        { k: 'r', a: ['B', 53], b: ['B', 55], v: '220Ω',
          say: 'A resistor, so the light does not get too much.' },
        { k: 'led', row: 'C', a: 55, b: 56, tone: '#3E9E5A',
          say: 'A green light. Long leg on the left.' },
        { k: 'w', a: ['B', 56], b: ['Pbn', 56], c: 'gnd',
          say: 'And back to the black line.',
          check: '<b>It blinks, slow and steady.</b> If it stays dark, turn the light around.',
          coach: 'Upload in front of him: <code>./flash.sh FirstBrightness</code>. With nothing plugged in the pin it watches reads near zero, so it falls back to the same slow blink as the other builds.' }
      ]
    },
    {
      id: 'shadow', tab: '2 · Give it a shadow', cum: true,
      why: 'The one sensor sitting where "how much" comes from the room instead of his hand directly on a part — cupping a hand over it is the whole trick, and it echoes first-circuits build 3, the knob, more than either of the other two sensors.',
      steps: [
        { k: 'module', row: 'E', p0: 44, n: 3, pins: ['VCC', 'GND', 'AO'],
          say: 'The light sensor! Push all three legs in.',
          coach: 'Pin order varies between modules — check the labels printed on yours before trusting this picture.' },
        { k: 'w', a: ['B', 44], b: ['Pb', 44], c: 'v5',
          say: 'Red wire. This one gives it power.' },
        { k: 'w', a: ['B', 45], b: ['Pbn', 45], c: 'gnd',
          say: 'Black wire. The way back.' },
        { k: 'r', a: ['C', 46], b: ['C', 50], v: '10kΩ',
          say: "A big resistor on the sensor's last leg." },
        { k: 'r', a: ['B', 50], b: ['Pbn', 50], v: '20kΩ',
          say: 'And the biggest one, down to the black line.',
          coach: 'The same divider as every sensor here: it keeps the sensor\'s answer a safe margin below what the ESP32\'s pins can take.' },
        { k: 'w', a: ['A', 50], b: ['A', 19], c: 's2',
          say: 'A blue wire. Now the computer can feel the light.',
          check: '<b>Cover the sensor with your hand.</b> The light answers — try covering and uncovering it a few times to see which way it goes.',
          coach: 'Upload <code>./flash.sh FirstBrightness</code> now if you have not already. Whether covering it speeds the blink up or slows it down depends on how this particular module wires its own divider — either is correct, and it is worth letting him discover which way his does it rather than telling him in advance.' }
      ]
    }
  ]
};
