#include "InputDriver.h"
#include "Port.h"

// HC-SR501 PIR motion sensor — the white faceted dome. OUT -> S3.
//
// Detecting an *idle* PIR through the divider is genuinely unreliable: the
// ESP32's internal pull-up is only specified to 30-80k, and across that
// tolerance "empty port, pulled up" and "PIR holding the line low" overlap.
// So we do not depend on it. The guaranteed detection is the sensor's own
// output going high, which means:
//
//     the first wave IS the detection.
//
// Bodhi plugs the dome in, waves at it, and the box says "oh! motion sensor!".
// That is better UX than a reset button anyway, and it cannot false-positive
// on an empty port. The pull-up probe stays as a fast path, set conservatively
// enough that it never fires on an empty port.

namespace {

constexpr int kHighCounts = 1500;  // 3.3V through the divider lands near 2730
constexpr int kHeldLowCounts = 400;  // clearly driven, well under any empty-port reading

class Motion : public InputDriver {
 public:
  const char* name() const override { return "Motion sensor"; }
  SignalKind kind() const override { return kTrigger; }
  // An idle PIR is indistinguishable from an empty port, so this driver can
  // never announce its own removal — the box polls for other modules instead.
  bool selfReleases() const override { return false; }

  bool detect() override {
    // Fast path: output currently high. A HC-SR501 holds its output up for
    // seconds after it fires, so any wave is caught easily.
    bool found = Port::readAnalog(PIN_S3, INPUT) > kHighCounts;
    if (!found) {
      // Slow path: something is actively holding the line down.
      found = Port::readAnalog(PIN_S3, INPUT_PULLUP) < kHeldLowCounts;
      // Leave the pin neutral again — a pull-up left engaged would bias every
      // later reading, including this driver's own.
      pinMode(PIN_S3, INPUT);
      delay(3);
    }
    return found;
  }

  void begin() override {
    // A PIR's output is already clean and stays put for seconds, so barely any
    // debounce is needed — but the gate still gives us tidy pressed/released.
    gate_.configure(0.5f, 0.6f, 0.4f, 0.02f, 20);
    gate_.reset();
    pinMode(PIN_S3, INPUT);
    delay(3);
  }

  void read(Signal& out, uint32_t nowMs) override {
    int raw = Port::sample(PIN_S3);
    bool on = raw > kHighCounts;
    // Always valid: an unplugged port and an idle PIR look identical here, so
    // switching away happens when a different module is detected instead.
    gate_.feedBool(out, on, on ? 1.0f : 0.0f, true, nowMs);
    out.level2 = 0.5f;
  }

 private:
  Gate gate_;
};

}  // namespace

InputDriver* motionDriver() {
  static Motion d;
  return &d;
}
