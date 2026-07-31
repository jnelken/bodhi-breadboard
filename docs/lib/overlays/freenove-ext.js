/* ============================================================================
   BBKit.overlays['freenove-ext'] — the Freenove ESP32 GPIO Extension Board.

   Board-specific, so it lives out here rather than in the core: another project
   on another carrier board writes its own overlay and changes nothing else.

   The silkscreen below was transcribed from the board itself — see
   docs/extension-board.md, which also records the one derived fact (the
   position numbers were lined up against the breadboard's printed ruler from a
   photograph, and agree in four places).

   Its real footprint is much more than the pin spine: the PCB covers the whole
   left end of the breadboard including both power rails at positions 1-12, and
   the terminal blocks reach out to 16 — which leaves position 17 on the rails
   only just reachable. Drawn as one path so the whole silhouette casts a single
   shadow and reads as one solid object covering those holes.
   ========================================================================= */

window.BBKit = window.BBKit || {};
window.BBKit.overlays = window.BBKit.overlays || {};

(function (BBKit) {
  'use strict';

  var esc = BBKit.esc;

  var FROM = 13, TO = 32;

  /** Row d — the lower pin spine. */
  var D_LAB = {
    13: '3.3V', 14: 'EN', 15: '36', 16: '39', 17: '34', 18: '35', 19: '32', 20: '33',
    21: '25', 22: '26', 23: '27', 24: '14', 25: '12', 26: 'GND', 27: '13',
    28: '3.3V', 29: '3.3V', 30: '3.3V', 31: '5V', 32: '5V'
  };
  /** Row g — the upper pin spine. */
  var G_LAB = {
    13: 'GND', 14: '23', 15: '22', 16: 'TX', 17: 'RX', 18: '21', 19: 'GND', 20: '19',
    21: '18', 22: '5', 23: 'GND', 24: '4', 25: '0', 26: '2', 27: '15',
    28: 'GND', 29: 'GND', 30: 'GND', 31: 'GND', 32: 'GND'
  };

  /**
   * @param {object} b board from BBKit.board()
   * @param {Set<number>|Array<number>|{d: Array<number>, g: Array<number>}} [hot]
   *   Positions to pick out in gold. A flat list lights the label on both
   *   spines; `{d, g}` lights each spine separately, which is what a reference
   *   diagram wants when only one side of a position is actually in use.
   * @param {{pads?: boolean, shadow?: boolean, caption?: string,
   *          terminals?: boolean, tightMarks?: boolean,
   *          redrawPositions?: Array<number>}} [opts]
   */
  function freenoveExt(b, hot, opts) {
    var o = Object.assign({
      pads: true,
      shadow: true,
      caption: 'the little computer',
      terminals: true,
      tightMarks: true,
      redrawPositions: [5, 10]
    }, opts);

    var toSet = function (v) { return v instanceof Set ? v : new Set(v || []); };
    var hotD, hotG;
    // A plain object means per-spine. Tested by shape, not by truthiness, so
    // that {d: [], g: []} is an empty highlight rather than a crash.
    var perSpine = hot && typeof hot === 'object' &&
      !(hot instanceof Set) && !Array.isArray(hot);
    if (perSpine) {
      hotD = toSet(hot.d); hotG = toSet(hot.g);
    } else {
      hotD = hotG = toSet(hot);
    }
    var k = b.scale;
    var X = b.X, Y = b.Y;

    var xA = X(1) - 14 * k;          // left edge, just inside the breadboard
    var xB = X(12) + 11 * k;         // end of the full-width block
    var xC = X(16) + 11 * k;         // end of the power-rail covers
    var xD = X(TO) + 11 * k;         // end of the pin spine
    var yT = b.chrome.top + 4 * k;
    var yB = b.chrome.bottom - 4 * k;
    var railT = Y('Ptn') + 14 * k;
    var railB = Y('Pb') - 14 * k;
    var spineT = Y('G') - 8 * k;
    var spineB = Y('D') + 8 * k;

    var s = '';
    if (o.shadow) {
      s += '<defs><filter id="bbkit-extshade" x="-8%" y="-8%" width="124%" height="128%">' +
        '<feDropShadow dx="3" dy="6" stdDeviation="4.5" flood-color="#000" flood-opacity="0.5"/>' +
        '</filter></defs>';
    }

    var d = ['M' + xA + ' ' + yT, 'H' + xC, 'V' + railT, 'H' + xB, 'V' + spineT, 'H' + xD,
      'V' + spineB, 'H' + xB, 'V' + railB, 'H' + xC, 'V' + yB, 'H' + xA, 'Z'].join(' ');
    s += '<path class="extbody" d="' + d + '"' +
      (o.shadow ? ' filter="url(#bbkit-extshade)"' : '') + '/>';

    // Screw terminals, sitting over the rails. 3.3 V is the top pair, 5 V the
    // bottom pair — confirmed against the board.
    if (o.terminals) {
      var tw = X(16) - X(13) + 10 * k, th = 30 * k, tx = X(13) - 5 * k;
      var topY = Y('Pt') - 4 * k, botY = Y('Pb') - 6 * k;
      s += '<rect class="extbody" x="' + tx + '" y="' + topY + '" width="' + tw + '" height="' + th + '" rx="2"/>';
      s += '<text class="exttxt" x="' + ((X(13) + X(16)) / 2) + '" y="' + (topY + 19 * k) + '">3V3 GND</text>';
      s += '<rect class="extbody" x="' + tx + '" y="' + botY + '" width="' + tw + '" height="' + th + '" rx="2"/>';
      s += '<text class="exttxt" x="' + ((X(13) + X(16)) / 2) + '" y="' + (botY + 19 * k) + '">5V GND</text>';
    }

    // The pin rows: this is where it actually plugs in — columns d and g.
    var gLabelY = b.chanTop + 20 * k;
    var dLabelY = Y('D') - 4 * k;
    for (var p = FROM; p <= TO; p++) {
      if (o.pads) {
        s += '<circle class="extpad" cx="' + X(p) + '" cy="' + Y('G') + '" r="' + (3.2 * k) + '"/>';
        s += '<circle class="extpad" cx="' + X(p) + '" cy="' + Y('D') + '" r="' + (3.2 * k) + '"/>';
      }
      s += '<text class="extlbl' + (hotG.has(p) ? ' on' : '') + '" transform="translate(' +
        (X(p) + 4 * k) + ' ' + gLabelY + ') rotate(-90)">' + esc(G_LAB[p]) + '</text>';
      s += '<text class="extlbl' + (hotD.has(p) ? ' on' : '') + '" transform="translate(' +
        (X(p) + 4 * k) + ' ' + dLabelY + ') rotate(-90)">' + esc(D_LAB[p]) + '</text>';
    }

    if (o.caption) {
      s += '<text class="exttxt" x="' + ((xA + xB) / 2) + '" y="' +
        ((b.chanTop + b.chanBottom) / 2 + 1) + '">' + esc(o.caption) + '</text>';
    }

    // Position numbers the board would otherwise hide, redrawn on top so he can
    // still count along the row.
    (o.redrawPositions || []).forEach(function (q) {
      s += '<text class="extlbl" x="' + X(q) + '" y="' + (Y('J') - b.chrome.posDyUp) +
        '" text-anchor="middle">' + q + '</text>';
      s += '<text class="extlbl" x="' + X(q) + '" y="' + (Y('A') + b.chrome.posDyDown) +
        '" text-anchor="middle">' + q + '</text>';
    });

    // Rail position 17 is only just reachable past the terminal blocks.
    if (o.tightMarks) {
      BBKit.rowNames.RAILS.forEach(function (r) {
        s += '<circle class="exttight" cx="' + X(17) + '" cy="' + Y(r) + '" r="' + (6.5 * k) + '"/>';
      });
    }
    return s;
  }

  freenoveExt.from = FROM;
  freenoveExt.to = TO;
  freenoveExt.dLabels = D_LAB;
  freenoveExt.gLabels = G_LAB;

  BBKit.overlays['freenove-ext'] = freenoveExt;
})(window.BBKit);
