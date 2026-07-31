/* ============================================================================
   Lesson — Bodhi's first circuits.

   Data only. Nothing here knows how a resistor is drawn or how the narrator
   works; it says which piece goes in which hole and what to say about it.

   Two audiences, kept strictly apart:

     say / check          the child. Short, concrete, about what he can see.
     why / coach          the grown-up. Never rendered on the interactive page —
                          docs/teaching-notes.html is where these show up.

   A build marked `audience: 'grown-up'` is skipped by the viewer entirely.

   The sequence is designed so something observable happens as early and as
   often as possible. That is the one place circuits are worse than LEGO by
   default: a half-built castle looks like a half-built castle, but a half-built
   circuit does nothing, which to a five-year-old is indistinguishable from
   broken. Reasoning in docs/teaching-plan.md.
   ========================================================================= */

window.BBKit = window.BBKit || {};
window.BBKit.lessons = window.BBKit.lessons || {};

window.BBKit.lessons['first-circuits'] = {
  title: "Bodhi's first circuits",

  /* The whole breadboard, end to end. Showing only the working area meant the
     extension board ran off the edge, which made it read as a floating label
     box rather than a real part sitting in real holes. */
  board: { pitch: 22, cols: 63, pad: 46 },
  viewBox: '0 0 1480 470',
  overlay: 'freenove-ext',

  /* Extension board pins to pick out in gold. The board powers the two long
     rails itself, so builds 0-3 never touch a named pin — only build 4 does.
     Named per spine: position 27 carries GPIO 13 on the d side and GPIO 15 on
     the g side, and only the first is his target. */
  hot: {
    prep: {}, pieces: {}, rows: {}, light: {}, two: {}, knob: {},
    code: { d: [27] }
  },

  parts: [
    { k: 'r', n: 4, bands: '220', label: 'resistor' },
    { k: 'led', n: 1, tone: '#D94F3D', label: 'red light' },
    { k: 'led', n: 1, tone: '#E0A32E', label: 'yellow light' },
    { k: 'led', n: 1, tone: '#3E9E5A', label: 'green light' },
    { k: 'led', n: 1, tone: '#3F7FD0', label: 'blue light' },
    { k: 'pot', n: 1, label: 'knob' },
    { k: 'w', n: 1, tone: 'var(--w-5v)', label: 'red wire' },
    { k: 'w', n: 4, tone: 'var(--w-gnd)', label: 'black wire' },
    { k: 'w', n: 1, tone: 'var(--w-s1)', label: 'yellow wire' }
  ],

  builds: [
    {
      id: 'prep', tab: 'Board prep', cum: false, audience: 'grown-up',
      why: 'Ten minutes on your own before he sits down. An empty, broken-in board and a pile of the right parts is the difference between a build that flows and one that stalls on a stiff hole.',
      steps: [
        { k: 'zone', p0: 18, p1: 63, r0: 'J', r1: 'Pbn',
          say: 'Take everything else off the board.',
          coach: 'Leave only the extension board. Leftover parts invite him to poke at things that are not part of the lesson.' },
        { k: 'zone', p0: 26, p1: 51, r0: 'C', r1: 'Pbn',
          say: 'Push a wire in and out of every hole here.',
          coach: 'Break the board in yourself. A fresh breadboard is stiff, and small hands pushing an LED leg into an unyielding hole is the fastest way for him to decide he is bad at this.' }
      ]
    },
    {
      id: 'pieces', tab: 'Your pieces', cum: false,
      why: 'The page a LEGO booklet opens on. He can gather everything himself from the pictures without being able to read a word of it.',
      steps: [
        { k: 'parts',
          say: 'Find these pieces.',
          coach: 'All five builds use only this. Builds 0–3 need no laptop at all — the extension board already powers the two long rails, so it just wants USB power. A phone charger is enough.' }
      ]
    },
    {
      id: 'rows', tab: '0 · Secret rows', cum: false,
      why: 'No parts. The point is that a breadboard has connections you cannot see — until that lands, every later step is just copying pictures. Do the wire-moving discovery first, then use these three reveals to confirm what he found.',
      steps: [
        { k: 'reveal', what: 'cols', say: 'Every five holes going down are joined together inside.' },
        { k: 'reveal', what: 'channel', say: 'The ditch down the middle splits them. Top five, bottom five.' },
        { k: 'reveal', what: 'rails', say: 'These long lines run the whole way across. They carry the power.',
          check: '<b>Try it.</b> Move one leg of a light to a different group. It goes dark.',
          coach: 'Run the discovery before you open this build: wire one LED so it is lit, then let him move one leg around and watch when it survives and when it dies. He finds the rows himself; these three reveals only confirm it. That session is worth more than three builds done by rote.' }
      ]
    },
    {
      id: 'light', tab: '1 · Make a light', cum: true,
      why: 'Three placements and it lights, with no laptop involved. The extension board already powers the two long rails, so there is nothing to hook up first.',
      steps: [
        { k: 'r', a: ['Pb', 38], b: ['B', 38], v: '220Ω', say: 'A resistor, so the light does not get too much.' },
        { k: 'led', row: 'C', a: 38, b: 39, tone: '#D94F3D', say: 'The light! Long leg on the left.' },
        { k: 'w', a: ['B', 39], b: ['Pbn', 39], c: 'gnd', say: 'Last wire. This closes the loop.',
          check: '<b>It should be lit.</b> If not, turn the light around — the legs are the wrong way.',
          coach: 'Resist helping. If the LED is backwards, let him discover that turning it around fixes it — polarity is a great early concept precisely because it is discoverable.' }
      ]
    },
    {
      id: 'two', tab: '2 · Two lights', cum: true,
      why: 'Deliberately the same three pieces again. That repetition is the first real structural idea.',
      steps: [
        { k: 'r', a: ['Pb', 42], b: ['B', 42], v: '220Ω', say: 'Another resistor, just like before.' },
        { k: 'led', row: 'C', a: 42, b: 43, tone: '#E0A32E', say: 'A yellow light this time.' },
        { k: 'w', a: ['B', 43], b: ['Pbn', 43], c: 'gnd', say: 'And back to the black line.',
          check: '<b>Two lights.</b> You built the same thing twice.',
          coach: 'Say it out loud, and ask him what he did differently. Nothing — he built the same thing twice. That is the lesson.' }
      ]
    },
    {
      id: 'knob', tab: '3 · A knob', cum: true,
      why: 'First idea beyond on/off. The knob is in the path of only the third light, so the contrast with the other two is doing the teaching.',
      steps: [
        { k: 'pot', row: 'C', p: 46, say: 'A knob. Its three legs go in a row.' },
        { k: 'w', a: ['B', 46], b: ['Pb', 46], c: 'v5', say: 'Power into one side of the knob.' },
        { k: 'r', a: ['B', 47], b: ['B', 50], v: '220Ω', say: 'Out of the middle leg, through a resistor.' },
        { k: 'led', row: 'C', a: 50, b: 51, tone: '#3E9E5A', say: 'A green light.' },
        { k: 'w', a: ['B', 51], b: ['Pbn', 51], c: 'gnd', say: 'Back to the black line again.',
          check: '<b>Turn the knob.</b> This one gets brighter and dimmer. The other two do not care.' }
      ]
    },
    {
      id: 'code', tab: '4 · The computer', cum: true,
      why: 'The hinge. This light is wired to a pin the ESP32 controls, so it stays dark no matter how carefully he builds it — until code arrives. That is the moment programming becomes worth caring about.',
      steps: [
        { k: 'w', a: ['A', 27], b: ['A', 34], c: 's1', say: 'This one does not go to the power line. It goes to the computer.' },
        { k: 'r', a: ['B', 34], b: ['B', 36], v: '220Ω', say: 'A resistor, same as always.' },
        { k: 'led', row: 'C', a: 36, b: 37, tone: '#3F7FD0', say: 'A blue light.' },
        { k: 'w', a: ['B', 37], b: ['Pbn', 37], c: 'gnd', say: 'And back to the black line.',
          check: '<b>Nothing happens — and that is right.</b> This light is waiting to be told what to do.',
          coach: 'Now upload it in front of him: <code>./flash.sh FirstLight</code>. The light blinks. Let him change ON_MS and OFF_MS and predict what will happen before you upload again.' }
      ]
    }
  ]
};
