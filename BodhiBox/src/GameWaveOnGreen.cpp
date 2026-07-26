#include "Game.h"
#include "Pins.h"
#include "Show.h"

// Wave on Green — for any source that can only say on/off.
//
// A PIR cannot report "how much", so magnitude games are meaningless with one.
// Instead the box counts down on the LEDs, goes green, and times how fast Bodhi
// waves. Waving early gets a friendly boop and a fresh countdown, never a loss.
//
// The one hardware fact this game has to respect: an HC-SR501 latches its
// output high for its retrigger period (seconds, and adjustable by the trimmer
// on the module). So after a wave we wait for the signal to actually fall
// before starting the next countdown — otherwise every following round would
// instantly "detect" the wave that already happened.

namespace {

constexpr uint32_t kStepMs = 420;      // per LED of countdown
constexpr uint32_t kResultMs = 1800;
constexpr uint32_t kFastMs = 400;      // this fast lights the whole bar
constexpr uint32_t kSlowMs = 2500;     // slower than this lights one
constexpr uint32_t kGiveUpMs = 8000;   // nobody waved; just go round again

class WaveOnGreen : public Game {
 public:
  const char* name() const override { return "Wave on Green"; }
  SignalKind wants() const override { return kTrigger; }

  void begin() override {
    phase_ = kSettling;
    phaseSince_ = millis();
    Show::allOff();
    Show::say("Wave on green", "get ready");
  }

  // Never let a detection sweep interrupt the countdown or the timed wave —
  // a 250 ms stall would show up directly in the reaction time.
  bool busy() const override { return phase_ == kCountdown || phase_ == kGo; }

  void tick(const Signal& sig, uint32_t nowMs) override {
    switch (phase_) {
      case kSettling: settling(sig, nowMs); break;
      case kCountdown: countdown(sig, nowMs); break;
      case kGo: go(sig, nowMs); break;
      case kResult: result(nowMs); break;
    }
  }

 private:
  enum Phase { kSettling, kCountdown, kGo, kResult };

  // Wait for the sensor to go quiet before arming, so a latched-high PIR
  // doesn't start the round already triggered.
  void settling(const Signal& sig, uint32_t nowMs) {
    // A slow shimmer, so it's obvious the box is alive but not yet asking
    // for anything.
    Show::mask(1 << (((nowMs - phaseSince_) / 260) % LED_COUNT));
    if (!sig.active) {
      phase_ = kCountdown;
      phaseSince_ = nowMs;
      step_ = 0;
    }
  }

  void countdown(const Signal& sig, uint32_t nowMs) {
    if (sig.pressed) {  // jumped the gun
      Show::boop();
      Show::say("Not yet!", "wait for green");
      phase_ = kSettling;
      phaseSince_ = nowMs;
      return;
    }

    uint32_t want = (nowMs - phaseSince_) / kStepMs;
    while (step_ < want && step_ < (uint32_t)LED_COUNT) {
      Show::bar(++step_);
      Show::note(392, 90);
    }

    if (want >= (uint32_t)LED_COUNT) {
      phase_ = kGo;
      phaseSince_ = nowMs;
      Show::bar(LED_COUNT);
      Show::note(1047, 260);
      Show::say("GO!", "wave now");
    }
  }

  void go(const Signal& sig, uint32_t nowMs) {
    if (sig.pressed) {
      uint32_t reaction = nowMs - phaseSince_;
      // Faster = more lights. Always at least one, so every try is a win.
      float t = 1.0f - (float)(constrain(reaction, kFastMs, kSlowMs) - kFastMs) /
                           (float)(kSlowMs - kFastMs);
      lit_ = 1 + (int)(t * (LED_COUNT - 1) + 0.5f);
      Show::celebrate();

      char line[17];
      snprintf(line, sizeof(line), "%lu ms!", (unsigned long)reaction);
      Show::say("Nice wave!", line);

      phase_ = kResult;
      phaseSince_ = nowMs;
      return;
    }

    if (nowMs - phaseSince_ >= kGiveUpMs) {
      phase_ = kSettling;
      phaseSince_ = nowMs;
      Show::allOff();
    }
  }

  void result(uint32_t nowMs) {
    bool on = ((nowMs - phaseSince_) / 150) % 2 == 0;
    Show::bar(on ? lit_ : 0);
    if (nowMs - phaseSince_ >= kResultMs) {
      phase_ = kSettling;  // waits for the PIR to drop before re-arming
      phaseSince_ = nowMs;
    }
  }

  Phase phase_ = kSettling;
  uint32_t phaseSince_ = 0;
  uint32_t step_ = 0;
  int lit_ = 1;
};

}  // namespace

Game* waveOnGreenGame() {
  static WaveOnGreen g;
  return &g;
}
