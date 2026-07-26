# Bodhi's Signal Box

Plug in one sensor. The box figures out what it is and starts a game that fits it.

Built for a 5-year-old and a Freenove Ultimate Starter Kit for ESP32 (FNK0047).
No code changes, no reflashing, no grown-up needed — swap the module and play.

## How to play

1. Push a module into the **PORT**.
2. Wait for the jingle. Each sensor has its own tune.
3. Play.

| Plug in this | You get | How to play |
|---|---|---|
| **Ultrasonic** (the "binoculars") | Reach the Target | Move your hand closer to the sensor to make the lights climb. Match the lights it shows you and hold still. |
| **Joystick** | Reach the Target | Push the stick up and down to make the lights climb. |
| **Photoresistor** | Reach the Target | Cover the sensor with your hand to make the lights climb. |
| **Motion sensor** (the white dome) | Wave on Green | Wait for the lights to count down, then wave your hand as fast as you can. |
| *(nothing plugged in)* | Sleepy lights | The box hums to itself until you plug something in. |

Nothing can be lost and nothing can go wrong — a wrong move gets a friendly boop.

## Wiring

**Unplug the camera module first.** It needs 14 of the board's GPIOs and this
project needs those pins. It clips back in whenever you want it.

The WROVER module is mounted on the **Freenove GPIO Extension Board**, which
straddles the breadboard channel at positions 13–32 with its pins in columns `d`
and `g`. Every GPIO is printed next to the hole it lands in — see
`docs/extension-board.md` for the full map, and `docs/breadboard-layouts.html`
for hole-by-hole layouts of all four sensor variations. The tables below give
the same wiring as a schematic.

### Lights and sound (leave these permanently on the breadboard)

| Part | Wiring |
|---|---|
| LED 1 | GPIO **23** → LED anode (long leg), cathode → 220 Ω → GND |
| LED 2 | GPIO **19** → LED anode, cathode → 220 Ω → GND |
| LED 3 | GPIO **18** → LED anode, cathode → 220 Ω → GND |
| LED 4 | GPIO **4** → LED anode, cathode → 220 Ω → GND |
| Buzzer | GPIO **12** → 1 kΩ → S8050 base. Emitter → GND. Collector → buzzer → 5 V |

Use the **passive** buzzer (the one with the open bottom). The active buzzer can
only make one pitch and can't play the tunes.

### The port (this is the bit Bodhi plugs into)

Six breadboard rows, labelled. Two of them have resistors:

```
  5V   ────────────────────────────────  5V rail
  3V3  ────────────────────────────────  3V3 rail
  GND  ────────────────────────────────  GND rail

  S1   ──── 1kΩ ─────────────────────── GPIO 13

  S2   ──── 10kΩ ──┬── GPIO 32
                   └── 20kΩ ── GND

  S3   ──── 10kΩ ──┬── GPIO 33
                   └── 20kΩ ── GND
```

No 20 kΩ in the kit? Two 10 kΩ in series is the same thing.

Those resistors are what make the port child-proof. **Don't skip them:**

- The **10 k/20 k dividers** on S2 and S3 mean any kit module, 3.3 V or 5 V,
  lands safely inside the ESP32's input range. Don't substitute 1 kΩ/2 kΩ —
  that loads the joystick's pot too heavily for the box to recognise it.
- The **1 kΩ on S1** matters because S1 is sometimes an output (the ultrasonic's
  trigger) and sometimes an input (the joystick's click, which is a switch to
  ground). It limits the current if those ever overlap, so no combination of
  plugging things in can hurt the board.

### Module pigtails

Make one bundled cable per module so there's a single connector to push in,
rather than five loose wires:

| Module | 5V | GND | S1 | S2 | S3 |
|---|---|---|---|---|---|
| HC-SR04 ultrasonic | VCC | GND | Trig | Echo | — |
| Joystick | +5V | GND | SW | VRx | VRy |
| HC-SR501 motion | VCC | GND | — | — | OUT |
| Photoresistor module | VCC | GND | — | AO | — |

## Flashing

```sh
./flash.sh                # the game
./flash.sh PortScanner    # the diagnostic sketch
./monitor.sh              # watch the serial output
```

Needs [`arduino-cli`](https://arduino.github.io/arduino-cli/) with the `esp32`
core installed. `flash.sh` retries at a lower baud automatically if the upload
stalls.

## When something doesn't work

Flash `PortScanner`, plug the module in, and run `./monitor.sh`. It prints what
it sees on every port pin and what it thinks is attached — that will show whether
the problem is wiring or software.

If the board won't boot at all with a module plugged in, that's a pin conflict,
not a loose wire. Check the camera is unplugged.

## Layout

- `BodhiBox/` — the game
- `BodhiBox/src/` — signal abstraction, sensor drivers, games, LED/sound output
- `PortScanner/` — diagnostic sketch
- `CLAUDE.md` — pin map rationale and architecture notes
