#include "InputDriver.h"
#include "Port.h"

// Photoresistor / potentiometer / any single-line analog module. AO -> S2.
//
// Rooms vary enormously in brightness, so the driver watches the range it
// actually sees and stretches that to a full 0..1 sweep — no calibration step,
// and it works the same in a bright kitchen or a dim bedroom.
//
// Which way the module's output moves when you cover it depends on how its
// onboard divider is wired. If covering the sensor makes the meter fall instead
// of rise, flip kCoveringRaises below — that is the whole fix.

namespace {

constexpr bool kCoveringRaises = true;  // flip if covering the sensor empties the meter

constexpr int kQuiet = 250;         // below this, nothing is driving the line
constexpr int kMinSpan = 300;       // don't amplify noise before real range is seen
constexpr uint32_t kDecayMs = 4000; // how often the observed range relaxes inward

class Light : public InputDriver {
 public:
  const char* name() const override { return "Light sensor"; }
  SignalKind kind() const override { return kLevel; }

  bool detect() override {
    // One analog line alive, the other quiet. A joystick drives both; a
    // triggered PIR drives S3, not S2.
    int s2 = Port::readAnalog(PIN_S2, INPUT);
    int s3 = Port::readAnalog(PIN_S3, INPUT);
    return s2 > kQuiet && s2 < ADC_MAX - 100 && s3 < kQuiet;
  }

  void begin() override {
    gate_.configure(0.2f, 0.6f, 0.4f, 0.02f, 60);
    gate_.reset();
    pinMode(PIN_S2, INPUT);
    delay(3);
    int seed = Port::sample(PIN_S2);
    lo_ = seed;
    hi_ = seed;
    lastDecay_ = 0;
  }

  void read(Signal& out, uint32_t nowMs) override {
    int raw = Port::sample(PIN_S2);

    if (raw < lo_) lo_ = raw;
    if (raw > hi_) hi_ = raw;

    // Let the range creep back in slowly, so one stray reading doesn't flatten
    // the meter for the rest of the afternoon.
    if (nowMs - lastDecay_ >= kDecayMs) {
      lastDecay_ = nowMs;
      int span = hi_ - lo_;
      if (span > kMinSpan) {
        lo_ += span / 40;
        hi_ -= span / 40;
      }
    }

    float level = 0.0f;
    int span = hi_ - lo_;
    if (span >= kMinSpan) {
      float t = (raw - lo_) / (float)span;
      level = constrain(kCoveringRaises ? 1.0f - t : t, 0.0f, 1.0f);
    }
    gate_.feedLevel(out, level, raw > kQuiet, nowMs);
    out.level2 = 0.5f;
  }

 private:
  Gate gate_;
  int lo_ = 0;
  int hi_ = ADC_MAX;
  uint32_t lastDecay_ = 0;
};

}  // namespace

InputDriver* lightDriver() {
  static Light d;
  return &d;
}
