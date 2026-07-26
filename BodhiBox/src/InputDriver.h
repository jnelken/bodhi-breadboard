#pragma once
#include "Signal.h"

// One driver per module. To support another of the kit's sensors, write one
// .cpp implementing this and add one line to kDrivers[] in BodhiBox.ino.
//
// Do NOT teach a game about a sensor. If a game seems to need changing to fit
// a new module, the abstraction is being bypassed — the fix belongs in the
// driver or in Gate, not in the game.
class InputDriver {
 public:
  virtual ~InputDriver() {}

  // Shown on serial and the display.
  virtual const char* name() const = 0;

  // What this module can tell us, which decides which game it gets.
  virtual SignalKind kind() const = 0;

  // Is this module plugged into the port right now? Called repeatedly, so it
  // must be quick and must not disturb whatever else might be attached.
  virtual bool detect() = 0;

  // Called once when this driver becomes the active one.
  virtual void begin() = 0;

  // Fill `out`. Set out.valid = false when the module stops answering; that is
  // what triggers a re-detect and makes hot-swapping work.
  virtual void read(Signal& out, uint32_t nowMs) = 0;

  // True if this driver can tell when its module has been unplugged (its lines
  // go quiet), so the box can simply wait for out.valid to drop.
  //
  // False for modules whose idle state is indistinguishable from an empty port
  // — an idle PIR looks exactly like nothing at all through the divider. Those
  // get a periodic re-detect sweep instead. The sweep is only safe for these
  // drivers precisely because nothing else can false-positive against them:
  // with a PIR attached S2 is unconnected, so neither the ultrasonic's active
  // probe nor the joystick and light checks can fire.
  virtual bool selfReleases() const { return true; }
};

// Each driver hands back a pointer to its own singleton.
InputDriver* ultrasonicDriver();
InputDriver* joystickDriver();
InputDriver* lightDriver();
InputDriver* motionDriver();
InputDriver* noneDriver();
