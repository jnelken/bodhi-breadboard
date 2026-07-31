// FirstBrightness — the sketch for docs/shadowlight.html.
//
// FirstMotion only ever says yes-or-no. This sensor answers with a number —
// how much light is falling on it right now — so the light it drives climbs
// and falls smoothly, closer in spirit to FirstJoystick's stick than
// FirstMotion's wave.
//
// Wiring (docs/shadowlight.html draws it hole by hole):
//   Light sensor in row e, positions 44-46:  VCC  GND  AO
//   (b,44) -> bottom + rail   5 V
//   (b,45) -> bottom - rail   ground
//   10k from (c,46) to (c,50) AO into the divider
//   20k from (b,50) to bottom - rail
//   (a,50) -> (a,19)          divided AO, GPIO 32
//   green wire (a,20) -> (a,53), 220 ohm to (b,55), LED (c,55)-(c,56),
//   (b,56) -> bottom - rail   the light, GPIO 33
//
// Rooms vary hugely in brightness, so this watches the range it actually sees
// and stretches that to the light's full blink range rather than using a
// fixed threshold — the same idea BodhiBox's own DriverLight.cpp uses,
// simplified for a first sketch.
//
// Which way the light responds to a covered sensor depends on how your
// particular module wires its own onboard divider. If cupping a hand over it
// speeds the blink up instead of slowing it down, that's a different module,
// not a mistake — flip COVERING_SLOWS below.
//
//   ./flash.sh FirstBrightness

const bool COVERING_SLOWS = true;  // flip if covering the sensor speeds it up

const int PIN_LIGHT_SENSOR = 32;
const int PIN_LIGHT = 33;

const int FAST_MS = 70;
const int SLOW_MS = 700;
const int MIN_SPAN = 300;  // don't stretch noise into a full sweep

int lo = 4095, hi = 0;
unsigned long lastToggle = 0;
bool lit = false;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LIGHT_SENSOR, INPUT);
  pinMode(PIN_LIGHT, OUTPUT);
  Serial.println("FirstBrightness: cover the sensor and see what happens.");
}

void loop() {
  int raw = analogRead(PIN_LIGHT_SENSOR);
  if (raw < lo) lo = raw;
  if (raw > hi) hi = raw;

  int interval = SLOW_MS;
  if (hi - lo >= MIN_SPAN) {
    float t = (raw - lo) / (float)(hi - lo);
    if (COVERING_SLOWS) t = 1.0f - t;
    interval = SLOW_MS + (int)(t * (FAST_MS - SLOW_MS));
  }

  if (millis() - lastToggle >= (unsigned long)interval) {
    lastToggle = millis();
    lit = !lit;
    digitalWrite(PIN_LIGHT, lit);
  }
}
