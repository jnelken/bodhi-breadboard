#pragma once
#include <Arduino.h>

// Every pin number lives here. See CLAUDE.md for why each one was chosen and
// which ones must never be used.

// --- Sensor port (camera-free pins, so a future camera reinstall doesn't
//     cost us the plug-and-play port) ---
constexpr int PIN_S1 = 13;  // ESP32 -> module (Trig), or pulled-up input (joystick SW)
constexpr int PIN_S2 = 32;  // module -> ESP32, via 10k/20k divider
constexpr int PIN_S3 = 33;  // module -> ESP32, via 10k/20k divider

// --- Buzzer (camera-free). Passive buzzer via S8050 NPN + 1k base resistor. ---
constexpr int PIN_BUZZER = 12;

// --- LEDs (camera pins — fine while the camera is unplugged) ---
constexpr int LED_COUNT = 4;
constexpr int PIN_LED[LED_COUNT] = {23, 19, 18, 4};

// --- Optional I2C display (camera pins) ---
constexpr int PIN_SDA = 21;
constexpr int PIN_SCL = 22;

constexpr int ADC_MAX = 4095;
