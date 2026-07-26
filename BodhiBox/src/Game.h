#pragma once
#include "Signal.h"

// A game consumes a Signal and nothing else. It never learns which sensor
// produced it — that is the whole point of the Gate layer, and it is what lets
// a module be swapped without a line of game code changing.
class Game {
 public:
  virtual ~Game() {}
  virtual const char* name() const = 0;

  // What sort of source this game needs. The box matches games to whatever got
  // plugged in: a magnitude game for a rangefinder, a timing game for a PIR.
  virtual SignalKind wants() const = 0;

  virtual void begin() = 0;
  virtual void tick(const Signal& sig, uint32_t nowMs) = 0;

  // True while a pause would spoil the moment. Detection sweeps stall the loop
  // for a couple of hundred milliseconds (the ultrasonic probe has to wait for
  // echoes), which is invisible most of the time but would wreck a countdown or
  // a reaction-time measurement. The box holds off sweeping while this is true.
  virtual bool busy() const { return false; }
};

Game* reachTargetGame();
Game* waveOnGreenGame();
Game* sleepyGame();
