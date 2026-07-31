// FirstMotion — the sketch for docs/nightlight.html.
//
// FirstDistance and FirstJoystick answered something continuous — closer,
// higher. A PIR only ever says one thing: something moved. This sketch is the
// simplest of the three because of that: the light goes solid when the sensor
// fires, and drops back to its slow waiting blink once it settles.
//
// Wiring (docs/nightlight.html draws it hole by hole):
//   Motion sensor in row e, positions 44-46:  VCC  OUT  GND
//   (b,44) -> bottom + rail   5 V
//   (b,46) -> bottom - rail   ground
//   10k from (c,45) to (c,49) OUT into the divider
//   20k from (b,49) to bottom - rail
//   (a,49) -> (a,20)          divided OUT, GPIO 33
//   blue wire (a,19) -> (a,52), 220 ohm to (b,54), LED (c,54)-(c,55),
//   (b,55) -> bottom - rail   the light, GPIO 32
//
// A fresh HC-SR501 takes a few seconds to settle after power-up and holds its
// answer high for several seconds once triggered — both are the sensor being
// itself, not a wiring fault. Give it a moment before deciding something is
// wrong.
//
//   ./flash.sh FirstMotion

const int PIN_MOTION = 33;
const int PIN_LIGHT = 32;

const int SLOW_MS = 700;          // the waiting blink, same rhythm as the other builds
const int TRIGGER_COUNTS = 1500;  // 3.3V-ish through the divider lands near 2730

void setup() {
  Serial.begin(115200);
  pinMode(PIN_MOTION, INPUT);
  pinMode(PIN_LIGHT, OUTPUT);
  Serial.println("FirstMotion: wave a hand at the sensor.");
}

unsigned long lastToggle = 0;
bool lit = false;

void loop() {
  bool triggered = analogRead(PIN_MOTION) > TRIGGER_COUNTS;

  if (triggered) {
    digitalWrite(PIN_LIGHT, HIGH);
    lastToggle = millis();  // so the blink resumes cleanly once it settles
    return;
  }

  if (millis() - lastToggle >= SLOW_MS) {
    lastToggle = millis();
    lit = !lit;
    digitalWrite(PIN_LIGHT, lit);
  }
}
