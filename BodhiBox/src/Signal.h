#pragma once
#include <Arduino.h>

// What sort of information a source can give, and a game can use.
enum SignalKind : uint8_t {
  kLevel,    // a magnitude: distance, joystick axis, brightness
  kTrigger,  // on/off only: motion detected, button pressed
};

// The one thing every game consumes. No game ever learns which sensor produced it.
struct Signal {
  float level = 0.0f;    // 0..1 primary magnitude
  float level2 = 0.5f;   // 0..1 second axis if the module has one, else 0.5
  bool active = false;   // gated boolean: is the signal "on" right now
  bool pressed = false;  // rising edge this tick
  bool released = false; // falling edge this tick
  bool valid = false;    // module present and answering
};

// Gate turns whatever raw numbers a driver produces into clean, identical
// semantics for every game — so a bouncing switch, a jittery ADC and a noisy
// ultrasonic ping all feel the same by the time a game sees them.
//
// This is the "gated signal" layer: it is why no game contains sensor-specific
// code, and why adding a sensor never means touching a game.
class Gate {
 public:
  // smoothing: EMA weight for new samples (lower = smoother, slower)
  // onAt/offAt: hysteresis thresholds for `active` (onAt must exceed offAt)
  // deadband: ignore level changes smaller than this, to stop the meter flickering
  // debounceMs: a boolean must hold its new state this long before it counts
  void configure(float smoothing, float onAt, float offAt, float deadband,
                 uint32_t debounceMs);
  void reset();

  // For level sources: `active` is derived from the level crossing the
  // hysteresis thresholds.
  void feedLevel(Signal& out, float rawLevel, bool valid, uint32_t nowMs);

  // For trigger sources: `active` comes from the driver's own boolean,
  // debounced. rawLevel still flows through so meters have something to show.
  void feedBool(Signal& out, bool rawOn, float rawLevel, bool valid,
                uint32_t nowMs);

 private:
  float smooth(float rawLevel);
  void applyActive(Signal& out, bool want, uint32_t nowMs);

  float smoothing_ = 0.25f;
  float onAt_ = 0.60f;
  float offAt_ = 0.40f;
  float deadband_ = 0.02f;
  uint32_t debounceMs_ = 30;

  bool started_ = false;
  float smoothed_ = 0.0f;
  float reported_ = 0.0f;

  bool active_ = false;
  bool candidate_ = false;
  uint32_t candidateSince_ = 0;
};
