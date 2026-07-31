// FirstDistance — the sketch for docs/binoculars.html.
//
// FirstLight made one LED blink on a fixed rhythm. This one makes the same LED
// blink at a rhythm the world decides: put a hand near the HC-SR04 and it
// speeds up, take it away and it slows down. That is the first time Bodhi's
// circuit reacts to him rather than to a number in a file.
//
// Wiring (docs/binoculars.html draws it hole by hole):
//   HC-SR04 in row e, positions 44-47:  VCC  Trig  Echo  GND
//   (b,44) -> bottom + rail   5 V, which the extension board already supplies
//   (b,47) -> bottom - rail   ground
//   (a,45) -> (a,27)          Trig, GPIO 13
//   10k from (c,46) to (c,50) Echo into the divider
//   20k from (b,50) to bottom - rail
//   (a,50) -> (a,19)          divided Echo, GPIO 32
//   green wire (a,20) -> (a,52), 220 ohm to (b,54), LED (c,54)-(c,55),
//   (b,55) -> bottom - rail   the light, GPIO 33
//
// The divider is not optional. Echo idles at 5 V and the ESP32's pins are 3.3 V
// parts; 10k/20k lands it at 3.3 V, which is still a clean digital HIGH. This is
// the one place in the project pulseIn is used on a divided line rather than an
// analog read, and it works precisely because 3.3 V clears the threshold.
//
//   ./flash.sh FirstDistance

const int PIN_TRIG = 13;
const int PIN_ECHO = 32;
const int PIN_LIGHT = 33;

// The band that maps to a blink rate. Closer than NEAR_CM is simply "fastest" —
// no dead zone, because a hand pressed right against the sensor should still do
// something rather than look broken.
const int NEAR_CM = 10;
const int FAR_CM = 60;

const int FAST_MS = 70;
const int SLOW_MS = 700;

// With nothing in range the sensor returns no echo at all. That is not an error
// worth showing a five-year-old, so it falls back to the slow blink — the same
// thing an empty room looks like.
const int IDLE_MS = 900;

const unsigned long ECHO_TIMEOUT_US = 30000UL;  // ~5 m, well past useful range

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LIGHT, OUTPUT);
  digitalWrite(PIN_TRIG, LOW);
  Serial.println("FirstDistance: wave a hand at the binoculars.");
}

// Returns centimetres, or -1 when nothing answered.
long readCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(3);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  unsigned long us = pulseIn(PIN_ECHO, HIGH, ECHO_TIMEOUT_US);
  if (us == 0) return -1;
  return (long)(us / 58);   // sound covers 1 cm out-and-back in ~58 us
}

int blinkInterval(long cm) {
  if (cm < 0) return IDLE_MS;
  if (cm <= NEAR_CM) return FAST_MS;
  if (cm >= FAR_CM) return SLOW_MS;
  // Linear across the band, which is close enough and easy to reason about.
  long span = FAR_CM - NEAR_CM;
  return FAST_MS + (int)((cm - NEAR_CM) * (SLOW_MS - FAST_MS) / span);
}

void loop() {
  long cm = readCm();
  int ms = blinkInterval(cm);

  // Serial is the primary debugging surface in this project, so narrate.
  if (cm < 0) Serial.printf("nothing in range -> %d ms\n", ms);
  else Serial.printf("%ld cm -> %d ms\n", cm, ms);

  digitalWrite(PIN_LIGHT, HIGH);
  delay(ms);
  digitalWrite(PIN_LIGHT, LOW);
  delay(ms);
}

// Things worth changing together, in roughly increasing order of difficulty:
//   - swap FAST_MS and SLOW_MS, so far away is the frantic one
//   - drop FAR_CM to 25, so he has to get much closer before anything happens
//   - make the light stay ON below NEAR_CM instead of blinking, so "very close"
//     is its own state rather than just faster
// Let him predict what each change will do before you upload it.
