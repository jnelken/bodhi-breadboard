#pragma once
#include <Arduino.h>

// Everything the box can do to get Bodhi's attention: four LEDs, a buzzer, and
// a display if one happens to be connected.
namespace Show {

void begin();

// --- Lights ---
void bar(int lit);                       // meter style: light the bottom `lit` LEDs
void barSmooth(float level);             // 0..1, with the top LED part-lit
void mask(uint8_t bits);                 // arbitrary pattern, bit 0 = LED 1
void brightness(int index, uint8_t pct); // 0..100 for one LED
void allOff();

// --- Sound ---
// Notes are queued and played by a background task, so none of this blocks.
void note(uint16_t hz, uint16_t ms);
void silence();

void jingle(int index);  // a different signature tune per module
void celebrate();        // you did it
void boop();             // not yet — friendly, never a penalty

// --- Display (optional; every call is a no-op when nothing is connected) ---
bool hasDisplay();
const char* displayName();
void say(const char* line1, const char* line2 = "");

}  // namespace Show
