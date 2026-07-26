#include "InputDriver.h"
#include "Port.h"

// HC-SR04 ultrasonic rangefinder — the "binoculars".
// Hand closer = meter higher, which is the intuitive direction for a child
// trying to push the lights up.

namespace {

constexpr unsigned long kMinEchoUs = 150;    // ~2.5 cm, below the sensor's floor
constexpr unsigned long kMaxEchoUs = 25000;  // ~4.3 m
constexpr float kNearCm = 4.0f;              // hand this close = full meter
constexpr float kFarCm = 40.0f;              // hand this far = empty meter
constexpr uint32_t kPingIntervalMs = 60;     // HC-SR04 needs ~60 ms between pings

// A timeout means "nothing in range", which is perfectly normal — a child
// steps back, or the sensor faces open air. Only treat a very long run of them
// as "the module has been unplugged", so walking away doesn't end the game.
constexpr int kMaxMisses = 100;  // ~6 seconds

class Ultrasonic : public InputDriver {
 public:
  const char* name() const override { return "Ultrasonic"; }
  SignalKind kind() const override { return kLevel; }

  bool detect() override {
    int hits = 0;
    for (int i = 0; i < 4; i++) {
      unsigned long us = Port::ping();
      if (us >= kMinEchoUs && us <= kMaxEchoUs) hits++;
      delay(kPingIntervalMs);
    }
    return hits >= 2;
  }

  void begin() override {
    gate_.configure(0.35f, 0.55f, 0.45f, 0.01f, 40);
    gate_.reset();
    misses_ = 0;
    lastPing_ = 0;
    level_ = 0.0f;
  }

  void read(Signal& out, uint32_t nowMs) override {
    if (nowMs - lastPing_ >= kPingIntervalMs) {
      lastPing_ = nowMs;
      unsigned long us = Port::ping();
      if (us >= kMinEchoUs && us <= kMaxEchoUs) {
        float cm = us / 58.0f;
        level_ = constrain((kFarCm - cm) / (kFarCm - kNearCm), 0.0f, 1.0f);
        misses_ = 0;
      } else {
        level_ = 0.0f;
        if (misses_ < kMaxMisses) misses_++;
      }
    }
    gate_.feedLevel(out, level_, misses_ < kMaxMisses, nowMs);
    out.level2 = 0.5f;
  }

 private:
  Gate gate_;
  uint32_t lastPing_ = 0;
  float level_ = 0.0f;
  int misses_ = 0;
};

}  // namespace

InputDriver* ultrasonicDriver() {
  static Ultrasonic d;
  return &d;
}
