#pragma once
#include <Arduino.h>
#include "Pins.h"

// Shared low-level access to the sensor port. Drivers go through this rather
// than touching pins directly, so the divider convention and the settling
// delays live in exactly one place.
namespace Port {

// Averaged analog read with a chosen pull mode, after letting the node settle.
// pullMode is INPUT, INPUT_PULLUP or INPUT_PULLDOWN.
int readAnalog(int pin, int pullMode);

// Same, as a 0..1 fraction of full scale.
float readLevel(int pin, int pullMode);

// Averaged read with no pin-mode change and no settling delay — for the hot
// path, once a driver has already put the pin in the mode it wants.
int sample(int pin);

// Fire the ultrasonic trigger on S1 and time the echo on S2.
// Returns echo width in microseconds, or 0 if nothing answered.
unsigned long ping();

// Read S1 as a switch-to-GND (joystick SW). True when pressed.
bool s1Pressed();

// Park the port in a harmless state: everything an input, nothing driven.
void release();

}  // namespace Port
