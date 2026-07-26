#include "InputDriver.h"
#include "Port.h"

// Nothing plugged in. Always last in the registry, always detects, so the box
// can never fail to boot into *something* — it just hums to itself and waits.

namespace {

class None : public InputDriver {
 public:
  const char* name() const override { return "Nothing plugged in"; }
  SignalKind kind() const override { return kTrigger; }
  bool selfReleases() const override { return false; }  // poll for a module arriving

  bool detect() override { return true; }

  void begin() override { Port::release(); }

  void read(Signal& out, uint32_t nowMs) override {
    (void)nowMs;
    out.level = 0.0f;
    out.level2 = 0.5f;
    out.active = false;
    out.pressed = false;
    out.released = false;
    out.valid = true;
  }
};

}  // namespace

InputDriver* noneDriver() {
  static None d;
  return &d;
}
