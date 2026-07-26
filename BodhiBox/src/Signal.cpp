#include "Signal.h"

void Gate::configure(float smoothing, float onAt, float offAt, float deadband,
                     uint32_t debounceMs) {
  smoothing_ = constrain(smoothing, 0.01f, 1.0f);
  onAt_ = onAt;
  offAt_ = offAt;
  deadband_ = deadband;
  debounceMs_ = debounceMs;
}

void Gate::reset() {
  started_ = false;
  smoothed_ = 0.0f;
  reported_ = 0.0f;
  active_ = false;
  candidate_ = false;
  candidateSince_ = 0;
}

float Gate::smooth(float rawLevel) {
  rawLevel = constrain(rawLevel, 0.0f, 1.0f);
  if (!started_) {
    // Jump straight to the first sample rather than easing up from zero,
    // so the meter doesn't sweep across the room on power-up.
    smoothed_ = rawLevel;
    reported_ = rawLevel;
    started_ = true;
    return reported_;
  }
  smoothed_ += (rawLevel - smoothed_) * smoothing_;
  if (fabsf(smoothed_ - reported_) >= deadband_) reported_ = smoothed_;
  return reported_;
}

void Gate::applyActive(Signal& out, bool want, uint32_t nowMs) {
  if (want != candidate_) {
    candidate_ = want;
    candidateSince_ = nowMs;
  }
  bool settled = (nowMs - candidateSince_) >= debounceMs_;
  bool next = settled ? candidate_ : active_;

  out.pressed = next && !active_;
  out.released = !next && active_;
  active_ = next;
  out.active = active_;
}

void Gate::feedLevel(Signal& out, float rawLevel, bool valid, uint32_t nowMs) {
  out.valid = valid;
  out.level = smooth(rawLevel);
  // Hysteresis: needs to climb past onAt to switch on, but fall below offAt to
  // switch off, so a signal hovering at the threshold doesn't chatter.
  bool want = active_ ? (out.level > offAt_) : (out.level > onAt_);
  applyActive(out, want, nowMs);
}

void Gate::feedBool(Signal& out, bool rawOn, float rawLevel, bool valid,
                    uint32_t nowMs) {
  out.valid = valid;
  out.level = smooth(rawLevel);
  applyActive(out, rawOn, nowMs);
}
