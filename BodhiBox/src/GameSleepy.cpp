#include "Game.h"
#include "Pins.h"
#include "Show.h"

// Sleepy lights — what the box does with nothing plugged in.
//
// Not an error state: it breathes gently and hums now and then, so an empty
// port still looks like a working toy waiting for a part, rather than a broken
// one. Plugging any module in ends it.

namespace {

constexpr uint32_t kBreathMs = 2600;
constexpr uint32_t kHumEveryMs = 9000;

class Sleepy : public Game {
 public:
  const char* name() const override { return "Sleepy lights"; }
  SignalKind wants() const override { return kTrigger; }

  void begin() override {
    lastHum_ = millis();
    Show::say("Plug something in", "and let's play");
  }

  void tick(const Signal& sig, uint32_t nowMs) override {
    (void)sig;
    // A slow wave travelling along the bar, each LED trailing the one before.
    float phase = (nowMs % kBreathMs) / (float)kBreathMs;
    for (int i = 0; i < LED_COUNT; i++) {
      float p = phase - i * 0.12f;
      if (p < 0) p += 1.0f;
      float glow = 0.5f * (1.0f - cosf(p * 2.0f * PI));
      Show::brightness(i, (uint8_t)(glow * glow * 45));
    }

    if (nowMs - lastHum_ >= kHumEveryMs) {
      lastHum_ = nowMs;
      Show::note(330, 180);
      Show::note(262, 240);
    }
  }

 private:
  uint32_t lastHum_ = 0;
};

}  // namespace

Game* sleepyGame() {
  static Sleepy g;
  return &g;
}
