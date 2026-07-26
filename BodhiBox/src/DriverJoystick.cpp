#include "InputDriver.h"
#include "Port.h"

// Dual-axis joystick module. SW -> S1, VRx -> S2, VRy -> S3 (see README).
// VRy drives the meter, because "push up to make it go up" is what a child
// expects; VRx rides along as the second axis for any game that wants it.
//
// The port's 30k divider loads the joystick's 10k pot, so its centre does not
// sit at half scale — it lands nearer 45%, and the travel either side of centre
// is not symmetric. Rather than hard-code that, we measure the resting centre
// when the driver starts and map each half of the travel separately. That also
// absorbs the part-to-part variation between joysticks.

namespace {

constexpr int kQuiet = 250;                      // below this, nothing is driving the line
constexpr int kMidBand = ADC_MAX * 35 / 100;     // how far off centre still counts as centred
constexpr int kStableSpread = 350;               // max jitter across detect() samples
constexpr int kMinHalfTravel = 400;              // guard against a divide-by-nothing

class Joystick : public InputDriver {
 public:
  const char* name() const override { return "Joystick"; }
  SignalKind kind() const override { return kLevel; }

  bool detect() override {
    // An empty port reads ~0 here: the external 20k to GND holds both lines
    // down, so there is no floating-pin ambiguity to worry about.
    int yMin = ADC_MAX, yMax = 0, xMin = ADC_MAX, xMax = 0;
    Port::readAnalog(PIN_S2, INPUT);
    Port::readAnalog(PIN_S3, INPUT);
    for (int i = 0; i < 5; i++) {
      int y = Port::sample(PIN_S3);
      int x = Port::sample(PIN_S2);
      yMin = min(yMin, y); yMax = max(yMax, y);
      xMin = min(xMin, x); xMax = max(xMax, x);
      delay(4);
    }
    // Both axes alive, both near centre, and both steady. A light sensor drives
    // only one line; a triggered PIR drives S3 hard to one end.
    return yMin > kQuiet && xMin > kQuiet &&
           (yMax - yMin) < kStableSpread && (xMax - xMin) < kStableSpread &&
           abs((yMin + yMax) / 2 - ADC_MAX / 2) < kMidBand &&
           abs((xMin + xMax) / 2 - ADC_MAX / 2) < kMidBand;
  }

  void begin() override {
    gate_.configure(0.4f, 0.55f, 0.45f, 0.015f, 25);
    gate_.reset();
    pinMode(PIN_S2, INPUT);
    pinMode(PIN_S3, INPUT);
    delay(5);
    // Whatever it reads at rest is centre.
    long ySum = 0, xSum = 0;
    for (int i = 0; i < 16; i++) {
      ySum += Port::sample(PIN_S3);
      xSum += Port::sample(PIN_S2);
      delay(4);
    }
    yCentre_ = ySum / 16;
    xCentre_ = xSum / 16;
  }

  void read(Signal& out, uint32_t nowMs) override {
    int y = Port::sample(PIN_S3);
    int x = Port::sample(PIN_S2);
    bool alive = (y > kQuiet) || (x > kQuiet);

    // The stick's click is the natural "active" for a joystick, so it goes
    // through the gate as the boolean and gets proper debounced edges. It is a
    // switch to ground on S1, which only touches S1's pin mode.
    bool clicked = Port::s1Pressed();

    gate_.feedBool(out, clicked, normalise(y, yCentre_), alive, nowMs);
    out.level2 = normalise(x, xCentre_);
  }

 private:
  // Map each half of the travel separately, so an off-centre resting point
  // still gives a full 0..1 sweep in both directions.
  float normalise(int raw, int centre) const {
    if (raw >= centre) {
      int span = max(ADC_MAX - centre, kMinHalfTravel);
      return constrain(0.5f + 0.5f * (raw - centre) / (float)span, 0.0f, 1.0f);
    }
    int span = max(centre, kMinHalfTravel);
    return constrain(0.5f * raw / (float)span, 0.0f, 1.0f);
  }

  Gate gate_;
  int yCentre_ = ADC_MAX / 2;
  int xCentre_ = ADC_MAX / 2;
};

}  // namespace

InputDriver* joystickDriver() {
  static Joystick d;
  return &d;
}
