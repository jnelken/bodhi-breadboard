// FirstLight — the first sketch Bodhi's own circuit needs.
//
// Builds 1 to 3 in docs/first-circuits.html light up with no code at all: the
// LEDs are wired straight to the 3.3 V rail, so plugging in USB is enough. That
// is deliberate — a working circuit should not depend on a laptop.
//
// Build 4 adds one LED wired to GPIO 13 instead of the rail. It stays dark
// until this is uploaded, which is the whole point: it is the first time the
// computer has anything to say about what the circuit does.
//
// Wiring for that one LED:
//   extension board GPIO 13 (position 27, column d)  ->  row a, position 34
//   220 ohm from (b,34) to (b,36)
//   LED anode (c,36), cathode (c,37)
//   (b,37) -> bottom ground rail
//
//   arduino-cli compile --fqbn esp32:esp32:esp32wrover FirstLight
//   arduino-cli upload -p /dev/cu.usbserial-210 --fqbn esp32:esp32:esp32wrover FirstLight
// or just: ./flash.sh FirstLight

const int PIN_LIGHT = 13;

// Slow enough that a five-year-old can count along with it out loud.
const int ON_MS = 700;
const int OFF_MS = 700;

void setup() {
  pinMode(PIN_LIGHT, OUTPUT);
}

void loop() {
  digitalWrite(PIN_LIGHT, HIGH);
  delay(ON_MS);
  digitalWrite(PIN_LIGHT, LOW);
  delay(OFF_MS);
}

// Things worth changing together, in roughly increasing order of difficulty:
//   - make ON_MS and OFF_MS different, so it winks
//   - make them both 60, so it flickers
//   - make them both 3000, so it is almost boring
// Let him pick the numbers and predict what will happen before uploading.
