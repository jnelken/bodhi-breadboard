/* ============================================================================
   BBKit.tuner — the "for the grown-up" live-tuning panel on docs/binoculars.html.

   Talks Web Serial directly to FirstDistance.ino's wire protocol (see the
   comment at the top of that sketch):
     GET               -> board replies  CFG FAST_MS=.. SLOW_MS=.. FAR_CM=..
     FAST_MS=<n>       -> board applies + persists, then replies with the same
     (also SLOW_MS=, FAR_CM=)  CFG line

   Sliders start disabled and only take their real range from the board's own
   CFG reply on connect — the board's persisted values may already differ
   from firmware defaults, and guessing would desync the display from reality.
   ========================================================================= */

window.BBKit = window.BBKit || {};

(function (BBKit) {
  'use strict';

  var BAUD = 115200;

  var FIELDS = [
    { key: 'FAST_MS', label: 'Fastest blink (up close)', min: 10, max: 300, step: 5, unit: 'ms' },
    { key: 'SLOW_MS', label: 'Slowest blink (far away)', min: 200, max: 2000, step: 10, unit: 'ms' },
    { key: 'FAR_CM', label: 'Reference distance', min: 10, max: 200, step: 1, unit: 'cm' }
  ];

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  // "CFG FAST_MS=35 SLOW_MS=700 FAR_CM=60" -> {FAST_MS: 35, SLOW_MS: 700, FAR_CM: 60}
  function parseCfgLine(line) {
    if (line.indexOf('CFG ') !== 0) return null;
    var cfg = {};
    line.slice(4).trim().split(/\s+/).forEach(function (pair) {
      var eq = pair.indexOf('=');
      if (eq < 0) return;
      cfg[pair.slice(0, eq)] = Number(pair.slice(eq + 1));
    });
    return cfg;
  }

  function mount(root) {
    if (!root) throw new Error('BBKit.tuner.mount: no root element');

    if (!('serial' in navigator)) {
      root.textContent = 'This browser can’t talk to the board directly — try Chrome or Edge.';
      return;
    }

    var port = null, reader = null, writer = null, lineBuf = '';
    var sliders = {};

    var status = el('p');
    status.textContent = 'Not connected.';

    var connectBtn = el('button', 'ghost', { type: 'button' });
    connectBtn.textContent = 'Connect';

    var slidersBox = el('div', 'varnote');
    FIELDS.forEach(function (f) {
      var row = el('div');
      var lab = el('label');
      lab.textContent = f.label + ' ';
      var input = el('input', null, {
        type: 'range', min: f.min, max: f.max, step: f.step, disabled: 'disabled'
      });
      var out = el('span');
      input.addEventListener('input', function () { out.textContent = ' ' + input.value + f.unit; });
      input.addEventListener('change', function () { send(f.key + '=' + input.value); });
      lab.appendChild(input);
      lab.appendChild(out);
      row.appendChild(lab);
      slidersBox.appendChild(row);
      sliders[f.key] = { input: input, out: out, unit: f.unit };
    });

    root.appendChild(status);
    root.appendChild(connectBtn);
    root.appendChild(slidersBox);

    function applyConfig(cfg) {
      Object.keys(cfg).forEach(function (key) {
        var s = sliders[key];
        if (!s) return;
        s.input.value = cfg[key];
        s.input.disabled = false;
        s.out.textContent = ' ' + cfg[key] + s.unit;
      });
      status.textContent = 'Connected — live.';
    }

    async function readLoop() {
      var decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable).catch(function () {});
      reader = decoder.readable.getReader();
      try {
        for (;;) {
          var chunk = await reader.read();
          if (chunk.done) break;
          lineBuf += chunk.value;
          var lines = lineBuf.split('\n');
          lineBuf = lines.pop();
          lines.forEach(function (line) {
            var cfg = parseCfgLine(line.trim());
            if (cfg) applyConfig(cfg);
          });
        }
      } catch (e) {
        // Port went away (unplugged, etc.) — disconnect() below resets the UI.
      } finally {
        reader.releaseLock();
      }
    }

    async function send(line) {
      if (!writer) return;
      await writer.write(new TextEncoder().encode(line + '\n'));
    }

    async function connect() {
      try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: BAUD });
        writer = port.writable.getWriter();
        status.textContent = 'Connected — syncing…';
        connectBtn.textContent = 'Disconnect';
        readLoop();
        await send('GET');
      } catch (e) {
        status.textContent = 'Could not connect: ' + e.message;
        port = null;
      }
    }

    async function disconnect() {
      if (reader) { try { await reader.cancel(); } catch (e) { /* already gone */ } }
      if (writer) { try { writer.releaseLock(); } catch (e) { /* already gone */ } }
      if (port) { try { await port.close(); } catch (e) { /* already gone */ } }
      port = null; writer = null; reader = null;
      status.textContent = 'Not connected.';
      connectBtn.textContent = 'Connect';
      FIELDS.forEach(function (f) { sliders[f.key].input.disabled = true; });
    }

    connectBtn.addEventListener('click', function () {
      if (port) disconnect(); else connect();
    });

    return { disconnect: disconnect };
  }

  BBKit.tuner = { mount: mount };
})(window.BBKit);
