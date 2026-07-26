#include "Game.h"
#include "Pins.h"
#include "Show.h"

// Reach the Target — for any source that reports a magnitude.
//
// The box shows a target on the LEDs and plays that target's note. Bodhi moves
// his hand (or pushes the stick, or covers the sensor) until the meter matches,
// and holds it still for a moment to score.
//
// The meter also sings: the pitch tracks the level continuously, so he can hunt
// for the target by ear as well as by eye. That turns out to be the part small
// children actually latch onto.
//
// Nothing here knows what a sensor is.

namespace {

constexpr int kRoundsPerGame = 5;
constexpr uint32_t kShowTargetMs = 1300;
constexpr uint32_t kHoldToScoreMs = 900;
constexpr uint32_t kScoredMs = 1000;
constexpr uint32_t kSingEveryMs = 150;

// Roughly C4 to C6 across the meter's travel.
uint16_t pitchFor(float level) {
  return (uint16_t)(262.0f * powf(2.0f, constrain(level, 0.0f, 1.0f) * 2.0f));
}

class ReachTarget : public Game {
 public:
  const char* name() const override { return "Reach the Target"; }
  SignalKind wants() const override { return kLevel; }

  void begin() override {
    round_ = 1;
    phase_ = kShowing;
    phaseSince_ = millis();
    pickTarget();
    Show::say("Reach the target", "watch the lights");
  }

  void tick(const Signal& sig, uint32_t nowMs) override {
    switch (phase_) {
      case kShowing: showing(nowMs); break;
      case kPlaying: playing(sig, nowMs); break;
      case kScored:  scored(nowMs);  break;
    }
  }

 private:
  enum Phase { kShowing, kPlaying, kScored };

  void pickTarget() {
    int next;
    do {
      next = random(1, LED_COUNT + 1);
    } while (next == target_ && LED_COUNT > 1);  // never ask for the same one twice
    target_ = next;
    announced_ = false;
  }

  void showing(uint32_t nowMs) {
    if (!announced_) {
      announced_ = true;
      Show::note(pitchFor(target_ / (float)LED_COUNT), 400);
    }
    // Blink the goal so it reads as an instruction, not as the current meter.
    bool on = ((nowMs - phaseSince_) / 220) % 2 == 0;
    Show::bar(on ? target_ : 0);

    if (nowMs - phaseSince_ >= kShowTargetMs) {
      phase_ = kPlaying;
      phaseSince_ = nowMs;
      heldSince_ = 0;
      lastSang_ = 0;
    }
  }

  void playing(const Signal& sig, uint32_t nowMs) {
    Show::barSmooth(sig.level);

    if (nowMs - lastSang_ >= kSingEveryMs) {
      lastSang_ = nowMs;
      Show::note(pitchFor(sig.level), kSingEveryMs);
    }

    int bucket = (int)roundf(sig.level * LED_COUNT);
    if (bucket == target_) {
      if (heldSince_ == 0) heldSince_ = nowMs;
      if (nowMs - heldSince_ >= kHoldToScoreMs) {
        phase_ = kScored;
        phaseSince_ = nowMs;
        Show::celebrate();
      }
    } else {
      heldSince_ = 0;
    }
  }

  void scored(uint32_t nowMs) {
    // Flash everything while the celebration plays.
    bool on = ((nowMs - phaseSince_) / 110) % 2 == 0;
    Show::bar(on ? LED_COUNT : 0);

    if (nowMs - phaseSince_ < kScoredMs) return;

    if (++round_ > kRoundsPerGame) {
      round_ = 1;
      Show::say("You did it!", "again?");
      Show::celebrate();
    }
    pickTarget();
    phase_ = kShowing;
    phaseSince_ = nowMs;
  }

  Phase phase_ = kShowing;
  uint32_t phaseSince_ = 0;
  uint32_t heldSince_ = 0;
  uint32_t lastSang_ = 0;
  int target_ = 0;
  int round_ = 1;
  bool announced_ = false;
};

}  // namespace

Game* reachTargetGame() {
  static ReachTarget g;
  return &g;
}
