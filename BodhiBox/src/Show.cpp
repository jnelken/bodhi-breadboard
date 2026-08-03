#include "Show.h"

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#include "Pins.h"

namespace {

// --- LEDs ---------------------------------------------------------------
// Driven through LEDC so the idle "sleepy" breathing can fade rather than
// blink. tone() also uses LEDC, but on its own pin and its own channel.
constexpr uint32_t kLedFreq = 5000;
constexpr uint8_t kLedBits = 8;

// --- Display ------------------------------------------------------------
// Two kinds turn up in these kits. Whichever answers on I2C gets used; if
// neither does, the box runs on lights and sound alone and nothing changes.
enum DisplayKind { kNoDisplay, kOled, kLcd };
DisplayKind gDisplay = kNoDisplay;
uint8_t gLcdAddr = 0x27;

Adafruit_SSD1306 gOled(128, 64, &Wire, -1);

bool i2cPresent(uint8_t addr) {
  Wire.beginTransmission(addr);
  return Wire.endTransmission() == 0;
}

// --- HD44780 over a PCF8574 backpack ------------------------------------
// The usual LiquidCrystal_I2C library is AVR-only, and the protocol is small
// enough to just do here: P0=RS, P1=RW, P2=EN, P3=backlight, P4-P7=D4-D7.
constexpr uint8_t kRs = 0x01;
constexpr uint8_t kEn = 0x04;
constexpr uint8_t kBacklight = 0x08;

void lcdRaw(uint8_t data) {
  Wire.beginTransmission(gLcdAddr);
  Wire.write(data | kBacklight);
  Wire.endTransmission();
}

void lcdPulse(uint8_t data) {
  lcdRaw(data | kEn);
  delayMicroseconds(1);
  lcdRaw(data & ~kEn);
  delayMicroseconds(50);
}

void lcdSend(uint8_t value, bool isData) {
  uint8_t rs = isData ? kRs : 0;
  lcdPulse((value & 0xF0) | rs);
  lcdPulse(((value << 4) & 0xF0) | rs);
}

void lcdCommand(uint8_t c) { lcdSend(c, false); }

void lcdInit() {
  delay(50);
  // Coax the controller into 4-bit mode from an unknown starting state.
  lcdPulse(0x30); delay(5);
  lcdPulse(0x30); delayMicroseconds(150);
  lcdPulse(0x30); delayMicroseconds(150);
  lcdPulse(0x20); delayMicroseconds(150);

  lcdCommand(0x28);  // 4-bit, 2 lines, 5x8
  lcdCommand(0x08);  // display off
  lcdCommand(0x01);  // clear
  delay(2);
  lcdCommand(0x06);  // entry mode: advance right
  lcdCommand(0x0C);  // display on, no cursor
  delay(2);
}

void lcdLine(uint8_t row, const char* text) {
  lcdCommand(row == 0 ? 0x80 : 0xC0);
  for (uint8_t i = 0; i < 16; i++) {
    char c = text && text[i] ? text[i] : ' ';
    lcdSend((uint8_t)c, true);
    if (text && !text[i]) {
      // pad the rest of the line with spaces
      for (uint8_t j = i + 1; j < 16; j++) lcdSend(' ', true);
      break;
    }
  }
}

// --- Sound --------------------------------------------------------------
// ESP32's tone() starts a note and returns immediately, and a second call
// replaces whatever was sounding. Playing a tune therefore means holding the
// remaining notes somewhere and starting each one when the last is due to end,
// which is what this queue does — off the main loop, so nothing blocks.
//
// Notes are started with their duration, so the hardware ends each one on time
// even if update() is late (a detection sweep stalls the loop ~250 ms). A late
// update() costs a gap between notes, never a note that drones on.
using Show::Note;

constexpr uint8_t kQueueMax = 12;
constexpr uint16_t kGapMs = 12;  // rest at the end of each note, so two of the
                                 // same pitch in a row are heard as two

Note gQueue[kQueueMax];
uint8_t gQueued = 0;      // notes still waiting behind the one sounding
uint8_t gQueueNext = 0;
uint32_t gNoteDueAt = 0;  // when the sounding note's slot ends
bool gSounding = false;

void startNote(const Note& n, uint32_t nowMs) {
  if (n.hz > 0 && n.ms > kGapMs) {
    tone(PIN_BUZZER, n.hz, n.ms - kGapMs);
  } else if (n.hz > 0) {
    tone(PIN_BUZZER, n.hz, n.ms);
  } else {
    noTone(PIN_BUZZER);
  }
  gNoteDueAt = nowMs + n.ms;
  gSounding = true;
}

// --- Jingles ------------------------------------------------------------
// One per registry slot, so each module announces itself with its own tune and
// Bodhi learns them by ear.
const Note kJingle0[] = {{880, 90}, {1175, 90}, {1568, 140}};              // ultrasonic: rising
const Note kJingle1[] = {{1047, 80}, {784, 80}, {1047, 80}, {1319, 140}};  // joystick: bouncy
const Note kJingle2[] = {{1319, 70}, {1319, 70}, {1568, 160}};             // light: chirpy
const Note kJingle3[] = {{523, 110}, {784, 110}, {659, 180}};              // motion: alert
const Note kJingle4[] = {{392, 200}, {330, 260}};                          // nothing: sleepy

struct JingleDef { const Note* notes; uint8_t count; };
const JingleDef kJingles[] = {
    {kJingle0, 3}, {kJingle1, 4}, {kJingle2, 3}, {kJingle3, 3}, {kJingle4, 2},
};
constexpr int kJingleCount = sizeof(kJingles) / sizeof(kJingles[0]);

}  // namespace

namespace Show {

void begin() {
  for (int i = 0; i < LED_COUNT; i++) {
    ledcAttach(PIN_LED[i], kLedFreq, kLedBits);
    ledcWrite(PIN_LED[i], 0);
  }

  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  Wire.begin(PIN_SDA, PIN_SCL);
  if (i2cPresent(0x3C) && gOled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    gDisplay = kOled;
    gOled.clearDisplay();
    gOled.setTextColor(SSD1306_WHITE);
    gOled.display();
  } else if (i2cPresent(0x27) || i2cPresent(0x3F)) {
    gLcdAddr = i2cPresent(0x27) ? 0x27 : 0x3F;
    gDisplay = kLcd;
    lcdInit();
  }
}

void brightness(int index, uint8_t pct) {
  if (index < 0 || index >= LED_COUNT) return;
  ledcWrite(PIN_LED[index], (uint32_t)constrain(pct, 0, 100) * 255 / 100);
}

void bar(int lit) {
  for (int i = 0; i < LED_COUNT; i++) brightness(i, i < lit ? 100 : 0);
}

void barSmooth(float level) {
  level = constrain(level, 0.0f, 1.0f);
  float exact = level * LED_COUNT;
  int whole = (int)exact;
  for (int i = 0; i < LED_COUNT; i++) {
    if (i < whole) {
      brightness(i, 100);
    } else if (i == whole) {
      brightness(i, (uint8_t)((exact - whole) * 100));
    } else {
      brightness(i, 0);
    }
  }
}

void mask(uint8_t bits) {
  for (int i = 0; i < LED_COUNT; i++) brightness(i, (bits >> i) & 1 ? 100 : 0);
}

void allOff() { mask(0); }

void update(uint32_t nowMs) {
  if (!gSounding || (int32_t)(nowMs - gNoteDueAt) < 0) return;
  if (gQueued > 0) {
    startNote(gQueue[gQueueNext++], nowMs);
    gQueued--;
  } else {
    gSounding = false;
  }
}

void wait(uint32_t ms) {
  uint32_t until = millis() + ms;
  while ((int32_t)(millis() - until) < 0) {
    update(millis());
    delay(2);
  }
}

void note(uint16_t hz, uint16_t ms) {
  gQueued = gQueueNext = 0;  // an immediate note wins over anything queued
  startNote({hz, ms}, millis());
}

void play(const Note* notes, uint8_t count) {
  if (!notes || count == 0) return;
  count = min(count, (uint8_t)(kQueueMax + 1));
  gQueued = count - 1;
  gQueueNext = 0;
  for (uint8_t i = 0; i < gQueued; i++) gQueue[i] = notes[i + 1];
  startNote(notes[0], millis());
}

void silence() {
  gQueued = gQueueNext = 0;
  gSounding = false;
  noTone(PIN_BUZZER);
}

void jingle(int index) {
  if (index < 0 || index >= kJingleCount) index = kJingleCount - 1;
  play(kJingles[index].notes, kJingles[index].count);
}

void celebrate() {
  static const Note up[] = {
      {523, 90}, {659, 90}, {784, 90}, {1047, 90}, {1319, 90}};
  play(up, 5);
}

void boop() { note(330, 70); }

bool hasDisplay() { return gDisplay != kNoDisplay; }

const char* displayName() {
  switch (gDisplay) {
    case kOled: return "SSD1306 OLED";
    case kLcd: return "LCD1602";
    default: return "none";
  }
}

void say(const char* line1, const char* line2) {
  switch (gDisplay) {
    case kOled:
      gOled.clearDisplay();
      gOled.setTextSize(1);
      gOled.setCursor(0, 8);
      gOled.println(line1 ? line1 : "");
      gOled.setCursor(0, 28);
      gOled.println(line2 ? line2 : "");
      gOled.display();
      break;
    case kLcd:
      lcdLine(0, line1);
      lcdLine(1, line2);
      break;
    default:
      break;
  }
}

}  // namespace Show
