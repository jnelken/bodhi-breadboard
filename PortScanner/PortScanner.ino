// PortScanner — "what is plugged into the port?"
//
// Flash this, plug a module into the sensor port, and run ./monitor.sh.
// It prints the raw numbers every port pin is showing, plus its own guess at
// what's attached. Use these numbers to calibrate the detection thresholds in
// BodhiBox/src/Driver*.cpp — measure, don't theorise.
//
// Port wiring (see README.md):
//   S1 = GPIO 13, direct
//   S2 = GPIO 32, via 10k/20k divider to GND
//   S3 = GPIO 33, via 10k/20k divider to GND

#include <Arduino.h>

const int PIN_S1 = 13;
const int PIN_S2 = 32;
const int PIN_S3 = 33;

const int ADC_MAX = 4095;

// Read an analog pin with a given pull mode, after letting the node settle.
// The divider is ~7k source impedance, so settling is fast, but the internal
// pull resistor (30-80k, wide tolerance) needs a moment to win.
int readWith(int pin, int mode) {
  pinMode(pin, mode);
  delay(5);
  int sum = 0;
  for (int i = 0; i < 8; i++) sum += analogRead(pin);
  return sum / 8;
}

// Fire the ultrasonic trigger on S1 and time the echo on S2.
// Returns echo width in microseconds, or 0 for no answer.
unsigned long pingEcho() {
  pinMode(PIN_S1, OUTPUT);
  digitalWrite(PIN_S1, LOW);
  delayMicroseconds(4);
  digitalWrite(PIN_S1, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_S1, LOW);

  pinMode(PIN_S2, INPUT);
  return pulseIn(PIN_S2, HIGH, 30000UL);  // 30 ms ~= 5 m, generous
}

float toVolts(int counts) { return counts * 3.3f / ADC_MAX; }

const char* guess(unsigned long echoUs, int s2_pd, int s3_pd, int s2_pu, int s3_pu);

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println(F("PortScanner — plug a module into the port and watch."));
  Serial.println(F("Columns: analog counts (0-4095). 'pd' = internal pull-down,"));
  Serial.println(F("'pu' = internal pull-up. An empty port reads ~0 with pull-down,"));
  Serial.println(F("because the external 20k to GND holds it there."));
  Serial.println();
}

void loop() {
  // --- Active probe: does anything answer an ultrasonic trigger? ---
  unsigned long echoUs = pingEcho();

  // --- Passive probes on the two divider lines ---
  int s2_pd = readWith(PIN_S2, INPUT_PULLDOWN);
  int s3_pd = readWith(PIN_S3, INPUT_PULLDOWN);
  int s2_pu = readWith(PIN_S2, INPUT_PULLUP);
  int s3_pu = readWith(PIN_S3, INPUT_PULLUP);

  // --- S1 as a button line (joystick SW is a switch to GND) ---
  pinMode(PIN_S1, INPUT_PULLUP);
  delay(5);
  bool s1Low = (digitalRead(PIN_S1) == LOW);

  Serial.printf(
      "S2 pd=%4d (%.2fV) pu=%4d | S3 pd=%4d (%.2fV) pu=%4d | S1=%s | echo=%5lu us",
      s2_pd, toVolts(s2_pd), s2_pu,
      s3_pd, toVolts(s3_pd), s3_pu,
      s1Low ? "LOW " : "high",
      echoUs);

  if (echoUs > 0) Serial.printf(" (%.1f cm)", echoUs / 58.0f);

  Serial.print(F("   -> "));
  Serial.println(guess(echoUs, s2_pd, s3_pd, s2_pu, s3_pu));

  delay(400);
}

// Best-effort interpretation. This mirrors the detection order used by
// BodhiBox, so if the guess here is wrong, the game will be wrong too —
// fix the thresholds here first, then copy them across.
const char* guess(unsigned long echoUs, int s2_pd, int s3_pd, int s2_pu, int s3_pu) {
  const int kMid = ADC_MAX / 2;
  const int kMidBand = ADC_MAX * 35 / 100;  // +/-35% counts as "centred"
  const int kQuiet = 250;                   // below this = nothing driving the line

  // 1. Ultrasonic answers an active probe — unambiguous.
  if (echoUs > 100) return "ULTRASONIC (HC-SR04)";

  // 2. Joystick idles near mid-scale on BOTH axes.
  //    Loaded by the 30k divider, centre lands around 45% of full scale.
  if (abs(s2_pd - kMid) < kMidBand && abs(s3_pd - kMid) < kMidBand &&
      s2_pd > kQuiet && s3_pd > kQuiet)
    return "JOYSTICK";

  // 3. Photoresistor / potentiometer: one analog line live, the other quiet.
  if (s2_pd > kQuiet && s3_pd < kQuiet) return "LIGHT / ANALOG (on S2)";

  // 4. PIR currently triggered: 3.3V out arrives at ~2.2V through the divider.
  if (s3_pd > 1500) return "MOTION (HC-SR501), currently TRIGGERED";

  // 5. PIR idle is genuinely hard to tell from an empty port through a
  //    divider, because the internal pull-up tolerance (30-80k) overlaps the
  //    two cases. Only claim it when the line is clearly being held down.
  if (s3_pu < 400) return "MOTION (HC-SR501), idle — line held low";

  return "nothing detected (if this is the PIR, wave at it)";
}
