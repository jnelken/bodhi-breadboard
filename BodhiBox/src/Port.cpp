#include "Port.h"

namespace Port {

int readAnalog(int pin, int pullMode) {
  pinMode(pin, pullMode);
  // The divider is ~7k source impedance so the node itself settles fast, but
  // the internal pull resistor (30-80k, wide part-to-part tolerance) needs a
  // moment to win against it.
  delay(3);
  int sum = 0;
  for (int i = 0; i < 8; i++) sum += analogRead(pin);
  return sum / 8;
}

float readLevel(int pin, int pullMode) {
  return readAnalog(pin, pullMode) / (float)ADC_MAX;
}

int sample(int pin) {
  int sum = 0;
  for (int i = 0; i < 4; i++) sum += analogRead(pin);
  return sum / 4;
}

unsigned long ping() {
  // S1 carries a 1k series resistor, so driving it is safe even when the
  // module on the port answers with a switch to ground (the joystick's SW).
  pinMode(PIN_S1, OUTPUT);
  digitalWrite(PIN_S1, LOW);
  delayMicroseconds(4);
  digitalWrite(PIN_S1, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_S1, LOW);

  pinMode(PIN_S2, INPUT);
  // Echo arrives at 3.33V through the divider, a clean digital HIGH.
  // 30 ms of timeout is about 5 m — well past anything a child will do.
  return pulseIn(PIN_S2, HIGH, 30000UL);
}

bool s1Pressed() {
  pinMode(PIN_S1, INPUT_PULLUP);
  delayMicroseconds(50);
  return digitalRead(PIN_S1) == LOW;
}

void release() {
  pinMode(PIN_S1, INPUT);
  pinMode(PIN_S2, INPUT);
  pinMode(PIN_S3, INPUT);
}

}  // namespace Port
