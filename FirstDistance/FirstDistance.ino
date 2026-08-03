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
//
// FAST_MS/SLOW_MS/FAR_CM are live-tunable from the "for the grown-up" panel on
// docs/binoculars.html once the lesson is complete, over Web Serial:
//   GET              -> board replies  CFG FAST_MS=.. SLOW_MS=.. FAR_CM=..
//   FAST_MS=<n>       (also SLOW_MS=, FAR_CM=) applies the value immediately,
//                      persists it to NVS, and replies with the same CFG line.
// The CFG prefix keeps that reply distinguishable from the per-toggle
// narration line ("35 cm -> 120 ms") sharing the same serial stream.

#include <Preferences.h>

const int PIN_TRIG = 13;
const int PIN_ECHO = 32;
const int PIN_LIGHT = 33;

// Fallbacks for a board that has never been tuned — first boot, or after
// nvs_flash_erase. Once tuned, the values in NVS win; see loadTuning().
const int DEFAULT_FAR_CM = 60;
const int DEFAULT_FAST_MS = 35;
const int DEFAULT_SLOW_MS = 700;

// The blink interval scales directly with distance — twice as far blinks
// roughly twice as slow. FAR_CM is the reference distance where that scaling
// reaches SLOW_MS; FAST_MS/SLOW_MS still clamp the extremes so a hand pressed
// right against the sensor, or nothing nearby at all, still looks intentional
// rather than broken. No longer const: the tuner panel adjusts these live.
int farCm, fastMs, slowMs;

Preferences prefs;

// With nothing in range the sensor returns no echo at all. That is not an error
// worth showing a five-year-old, so it falls back to the slow blink — the same
// thing an empty room looks like.
const int IDLE_MS = 900;

const unsigned long ECHO_TIMEOUT_US = 30000UL;  // ~5 m, well past useful range

void loadTuning() {
  prefs.begin("tuning", true);
  farCm = prefs.getInt("far_cm", DEFAULT_FAR_CM);
  fastMs = prefs.getInt("fast_ms", DEFAULT_FAST_MS);
  slowMs = prefs.getInt("slow_ms", DEFAULT_SLOW_MS);
  prefs.end();
}

void printConfig() {
  Serial.printf("CFG FAST_MS=%d SLOW_MS=%d FAR_CM=%d\n", fastMs, slowMs, farCm);
}

// One line per command, terminated with '\n' — see the wire protocol note up top.
void handleSerial() {
  while (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    if (line == "GET") { printConfig(); continue; }

    int eq = line.indexOf('=');
    if (eq < 0) continue;
    String key = line.substring(0, eq);
    int value = line.substring(eq + 1).toInt();

    const char *nvsKey;
    if (key == "FAST_MS") { fastMs = value; nvsKey = "fast_ms"; }
    else if (key == "SLOW_MS") { slowMs = value; nvsKey = "slow_ms"; }
    else if (key == "FAR_CM") { farCm = value; nvsKey = "far_cm"; }
    else continue;

    prefs.begin("tuning", false);
    prefs.putInt(nvsKey, value);
    prefs.end();
    printConfig();
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LIGHT, OUTPUT);
  digitalWrite(PIN_TRIG, LOW);
  loadTuning();
  Serial.println("FirstDistance: wave a hand at the binoculars.");
  printConfig();
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
  long denom = farCm > 0 ? farCm : 1;   // a stray FAR_CM=0 from the tuner shouldn't divide by zero
  long ms = cm * (long)slowMs / denom;  // interval scales directly with distance
  return constrain((int)ms, fastMs, slowMs);
}

unsigned long lastToggle = 0;
bool ledOn = false;
int currentInterval = IDLE_MS;

void loop() {
  // Checked every pass, not just once per blink toggle — a tuning tweak sent
  // right after the LED turns on would otherwise wait up to slowMs to be seen.
  handleSerial();

  unsigned long now = millis();
  if (now - lastToggle < (unsigned long)currentInterval) return;

  long cm = readCm();
  currentInterval = blinkInterval(cm);
  ledOn = !ledOn;
  digitalWrite(PIN_LIGHT, ledOn ? HIGH : LOW);
  lastToggle = now;

  // Serial is the primary debugging surface in this project, so narrate.
  if (cm < 0) Serial.printf("nothing in range -> %d ms\n", currentInterval);
  else Serial.printf("%ld cm -> %d ms\n", cm, currentInterval);
}

// Things worth changing together, in roughly increasing order of difficulty:
//   - swap FAST_MS and SLOW_MS, so far away is the frantic one
//   - drop FAR_CM to 25, so he has to get much closer before anything happens
//   - make the light stay ON below NEAR_CM instead of blinking, so "very close"
//     is its own state rather than just faster
// Let him predict what each change will do before you upload it.
