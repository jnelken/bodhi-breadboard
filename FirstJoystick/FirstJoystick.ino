// FirstJoystick — the sketch for docs/joystick.html.
//
// FirstDistance made an LED answer a hand held near a sensor. This one answers
// two different motions on the same part: push the stick up or down and the
// blink speeds up or slows down; hold the click and the light goes solid.
//
// Wiring (docs/joystick.html draws it hole by hole):
//   Joystick in row e, positions 44-48:  SW  VRy  VRx  +5V  GND
//   (Pin order varies by module — read the labels printed on the back of
//   yours before trusting this. This is the order for the one this build
//   was wired against, not a universal default.)
//   (b,47) -> bottom + rail   5 V, which the extension board already supplies
//   (b,48) -> bottom - rail   ground
//   (a,27) -> (a,44)          SW, GPIO 13, read with the internal pull-up
//   10k from (c,45) to (c,52) VRy into the divider
//   20k from (b,52) to bottom - rail
//   (a,52) -> (a,20)          divided VRy, GPIO 33
//   blue wire (a,19) -> (a,55), 220 ohm to (b,57), LED (c,57)-(c,58),
//   (b,58) -> bottom - rail   the light, GPIO 32
//
// VRx gets a leg in the board but no wire — one axis is enough for a first
// sitting. The click (SW) is a plain switch to ground read with the internal
// pull-up; unlike the Signal Box's own port, this pin is never also driven as
// an output here, so it needs no series resistor to stay safe.
//
//   ./flash.sh FirstJoystick

const int PIN_SW = 13;
const int PIN_STICK = 33;  // divided VRy
const int PIN_LIGHT = 32;

const int FAST_MS = 70;
const int SLOW_MS = 700;
const int STICK_MAX = 2730;  // ~5V through the divider, same ceiling as Echo

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SW, INPUT_PULLUP);
  pinMode(PIN_STICK, INPUT);
  pinMode(PIN_LIGHT, OUTPUT);
  Serial.println("FirstJoystick: push the stick, or click it.");
}

unsigned long lastToggle = 0;
bool lit = false;

void loop() {
  bool clicked = digitalRead(PIN_SW) == LOW;

  if (clicked) {
    digitalWrite(PIN_LIGHT, HIGH);
    lit = true;
    lastToggle = millis();  // so the blink resumes smoothly on release
    return;
  }

  // Pushed up reads high, pushed down reads low, and an unplugged stick reads
  // near zero through the divider's own pull to ground — which lands here
  // exactly where "all the way down" would, the same slow blink FirstDistance
  // falls back to with nothing in range. If your stick answers backwards,
  // that is a different joystick, not a mistake — swap FAST_MS and SLOW_MS.
  int raw = analogRead(PIN_STICK);
  int interval = map(constrain(raw, 0, STICK_MAX), 0, STICK_MAX, SLOW_MS, FAST_MS);

  if (millis() - lastToggle >= (unsigned long)interval) {
    lastToggle = millis();
    lit = !lit;
    digitalWrite(PIN_LIGHT, lit);
  }
}
