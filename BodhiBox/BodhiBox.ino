// Bodhi's Signal Box
//
// Plug in one sensor. The box works out what it is and starts a game that fits
// it. Swap the sensor and it changes over on its own — no reset, no reflash,
// no grown-up.
//
// The shape of it:
//
//     module -> InputDriver -> Gate -> Signal -> Game
//
// Drivers know about sensors. Games know about Signal. Nothing knows about
// both. To add another of the kit's modules, write one driver and add one line
// to kDrivers[] below — do not teach a game about a sensor.
//
// See CLAUDE.md for the pin map and why each pin was chosen, and README.md for
// wiring and how to play.

#include "src/Game.h"
#include "src/InputDriver.h"
#include "src/Pins.h"
#include "src/Port.h"
#include "src/Show.h"
#include "src/Signal.h"

// Detection order is priority order: most specific first, fallback last.
// The ultrasonic goes first because it answers an active probe, which no other
// module can imitate. "Nothing plugged in" is last and always matches, so the
// box can never fail to boot into something playable.
InputDriver* const kDrivers[] = {
    ultrasonicDriver(),
    joystickDriver(),
    lightDriver(),
    motionDriver(),
    noneDriver(),
};
constexpr int kDriverCount = sizeof(kDrivers) / sizeof(kDrivers[0]);

constexpr uint32_t kSweepEveryMs = 2500;  // how often to look for a new module
constexpr uint32_t kTickMs = 20;

InputDriver* gDriver = nullptr;
Game* gGame = nullptr;
int gDriverIndex = -1;
uint32_t gLastSweep = 0;
Signal gSignal;

Game* gameFor(InputDriver* driver) {
  if (driver == noneDriver()) return sleepyGame();
  return driver->kind() == kLevel ? reachTargetGame() : waveOnGreenGame();
}

// Walk the registry and take the first module that answers.
int detectDriver() {
  for (int i = 0; i < kDriverCount; i++) {
    if (kDrivers[i]->detect()) return i;
  }
  return kDriverCount - 1;  // noneDriver, which always matches anyway
}

void activate(int index) {
  gDriverIndex = index;
  gDriver = kDrivers[index];
  gDriver->begin();

  gSignal = Signal();
  gGame = gameFor(gDriver);
  gGame->begin();

  Serial.printf("[port] %s  ->  %s\n", gDriver->name(), gGame->name());

  // Announce it three ways: a light sweep, a signature jingle, and the display.
  // Bodhi learns which module is which by the tune long before he can read.
  for (int i = 0; i < LED_COUNT; i++) {
    Show::bar(i + 1);
    delay(60);
  }
  Show::allOff();
  Show::jingle(index);
  Show::say(gDriver->name(), gGame->name());
  delay(400);
}

void setup() {
  Serial.begin(115200);
  delay(300);
  randomSeed(esp_random());

  Show::begin();
  Port::release();

  Serial.println();
  Serial.println(F("Bodhi's Signal Box"));
  Serial.printf("display: %s\n", Show::displayName());
  Serial.println(F("plug a module into the port; it will announce itself"));

  activate(detectDriver());
  gLastSweep = millis();
}

void loop() {
  uint32_t nowMs = millis();

  gDriver->read(gSignal, nowMs);

  if (!gSignal.valid) {
    // The module stopped answering — it has been unplugged. Find out what
    // replaced it, if anything.
    Serial.printf("[port] %s stopped answering\n", gDriver->name());
    Show::allOff();
    activate(detectDriver());
    gLastSweep = millis();
    return;
  }

  // Some modules cannot report their own removal: an idle PIR looks exactly
  // like an empty port through the divider, and an empty port obviously can't
  // announce anything. Those get polled instead. It is safe to poll here
  // precisely because nothing can false-positive against them — with a PIR
  // attached, S2 is unconnected, so neither the ultrasonic's active probe nor
  // the joystick and light checks can fire.
  if (!gDriver->selfReleases() && !gGame->busy() &&
      nowMs - gLastSweep >= kSweepEveryMs) {
    gLastSweep = nowMs;
    int found = detectDriver();
    if (found != gDriverIndex) {
      Show::allOff();
      activate(found);
      gLastSweep = millis();
      return;
    }
  }

  gGame->tick(gSignal, nowMs);
  delay(kTickMs);
}
