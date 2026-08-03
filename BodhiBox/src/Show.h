#pragma once
#include <Arduino.h>

// Everything the box can do to get Bodhi's attention: four LEDs, a buzzer, and
// a display if one happens to be connected.
namespace Show {

void begin();

// Advances the note queue. Call it every loop tick — without it, a queued
// sequence stops after its first note.
void update(uint32_t nowMs);

// A delay that keeps the queue moving, for the few places that must block.
void wait(uint32_t ms);

// --- Lights ---
void bar(int lit);                       // meter style: light the bottom `lit` LEDs
void barSmooth(float level);             // 0..1, with the top LED part-lit
void mask(uint8_t bits);                 // arbitrary pattern, bit 0 = LED 1
void brightness(int index, uint8_t pct); // 0..100 for one LED
void allOff();

// --- Sound ---
// Nothing here blocks. `tone()` itself neither blocks nor queues — a second
// call replaces the note already sounding — so sequences are paced one note at
// a time by update(), off the main loop.
struct Note { uint16_t hz; uint16_t ms; };

// Starts now, cancelling anything queued. This is what a pitch that tracks a
// control wants: a queue would make it lag behind the player's hand.
void note(uint16_t hz, uint16_t ms);

// Queues a sequence to play back to back. This is what a tune wants.
void play(const Note* notes, uint8_t count);

void silence();

void jingle(int index);  // a different signature tune per module
void celebrate();        // you did it
void boop();             // not yet — friendly, never a penalty

// --- Display (optional; every call is a no-op when nothing is connected) ---
bool hasDisplay();
const char* displayName();
void say(const char* line1, const char* line2 = "");

}  // namespace Show
