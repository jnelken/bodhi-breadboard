/* ============================================================================
   BBKit.board — breadboard geometry and the board's own chrome.

   Everything is addressed by hole, never by pixel: `['C', 38]` means row c,
   position 38. That is the one decision the whole kit rests on, because it is
   what lets a lesson be data and what will later let connectivity be derived
   (holes in a five-hole group are one electrical node).

   Framework-free on purpose. `svg()` and the parts in parts.js return SVG
   strings, so this is consumable by vanilla, by React through
   dangerouslySetInnerHTML, by Next SSR, or by a Node script writing PNGs.
   Classic script, not an ES module: Chrome and Safari block `type="module"`
   over file://, and these pages must open straight off disk on an iPad.
   ========================================================================= */

window.BBKit = window.BBKit || {};

(function (BBKit) {
  'use strict';

  /** Rows top to bottom: four rails, then j-f, the channel, then e-a. */
  var TOP = ['J', 'I', 'H', 'G', 'F'];
  var BOT = ['E', 'D', 'C', 'B', 'A'];
  var RAILS = ['Pt', 'Ptn', 'Pb', 'Pbn'];
  var HOLES = TOP.concat(BOT);

  /** @param {string|number} s */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Vertical positions of every row, derived from pitch.
   *
   * These were hand-tuned as a literal table before being generalised; at
   * pitch 22 this function reproduces that table exactly, which is what keeps
   * the booklet's render unchanged. Pass `rows` to board() to override.
   *
   * @param {number} pitch
   * @returns {Record<string, number>}
   */
  function deriveRows(pitch) {
    var railGap = 2 * pitch + 4;   // rail pair to the nearest lettered row
    var channelGap = 3 * pitch;    // f to e, across the ditch
    var r = {};
    r.Pt = pitch + 4;
    r.Ptn = r.Pt + pitch;
    TOP.forEach(function (name, i) { r[name] = r.Ptn + railGap + i * pitch; });
    BOT.forEach(function (name, i) { r[name] = r.F + channelGap + i * pitch; });
    r.Pb = r.A + railGap;
    r.Pbn = r.Pb + pitch;
    return r;
  }

  /**
   * @param {{pitch?: number, cols?: number, pad?: number,
   *          rows?: Record<string, number>, chrome?: object}} [spec]
   */
  function board(spec) {
    spec = spec || {};
    var pitch = spec.pitch || 22;
    var cols = spec.cols || 63;
    var pad = spec.pad === undefined ? 46 : spec.pad;
    var rows = spec.rows || deriveRows(pitch);

    /** Everything drawn scales off pitch 22, the size the booklet uses. */
    var scale = pitch / 22;

    var X = function (p) { return pad + (p - 1) * pitch; };
    var Y = function (r) { return rows[r]; };
    var pt = function (ref) { return { x: X(ref[1]), y: Y(ref[0]) }; };

    // The board rect is wider than the holes it contains. Kept as the original
    // expression rather than a tidier one so the render does not move.
    var span = X(cols) - X(1) + pad * 1.4;

    var C = Object.assign({
      left: 10,
      boardW: span + 24,
      rx: 7,
      top: Y('Pt') - pitch / 2 - 3,
      bottom: Y('Pbn') + pitch / 2 + 5,
      chanInset: 6 * scale,
      holeR: 4 * scale,
      railSkipEvery: 6,       // the gap punched in every rail run
      railInset: 12 * scale,  // rail line offset from its hole centres
      posEvery: 5,
      posDyUp: 12 * scale,
      posDyDown: 18 * scale,
      rowLabelX: null,        // defaults to left + 12
      rowLabelXRight: null    // reference docs letter both edges
    }, spec.chrome);

    if (C.rowLabelX === null) C.rowLabelX = C.left + 12;
    var railX0 = C.railX0 === undefined ? C.left + 8 : C.railX0;
    var railX1 = C.railX1 === undefined ? C.left + C.boardW - 6 : C.railX1;
    var chanTop = C.chanTop === undefined ? Y('F') + C.chanInset : C.chanTop;
    var chanBottom = C.chanBottom === undefined ? Y('E') - C.chanInset : C.chanBottom;

    /** The board itself: body, channel, rail lines, holes, printed labels. */
    function svg() {
      var s = '<rect class="bb-body" x="' + C.left + '" y="' + C.top +
        '" width="' + C.boardW + '" height="' + (C.bottom - C.top) + '" rx="' + C.rx + '"/>';
      s += '<rect class="bb-channel" x="' + C.left + '" y="' + chanTop +
        '" width="' + C.boardW + '" height="' + (chanBottom - chanTop) + '"/>';

      [['rail-pos', 'Pt', -1], ['rail-neg', 'Ptn', 1],
       ['rail-pos', 'Pb', -1], ['rail-neg', 'Pbn', 1]].forEach(function (spec2) {
        var y = Y(spec2[1]) + spec2[2] * C.railInset;
        s += '<line class="' + spec2[0] + '" x1="' + railX0 + '" y1="' + y +
          '" x2="' + railX1 + '" y2="' + y + '"/>';
      });

      for (var p = 1; p <= cols; p++) {
        HOLES.forEach(function (r) {
          s += '<circle class="bb-hole" cx="' + X(p) + '" cy="' + Y(r) + '" r="' + C.holeR + '"/>';
        });
        // Rails are broken into runs; the gap is where the break is printed.
        if (p % C.railSkipEvery !== 0) {
          RAILS.forEach(function (r) {
            s += '<circle class="bb-hole" cx="' + X(p) + '" cy="' + Y(r) + '" r="' + C.holeR + '"/>';
          });
        }
        if (p % C.posEvery === 0) {
          s += '<text class="bb-lbl" x="' + X(p) + '" y="' + (Y('J') - C.posDyUp) +
            '" text-anchor="middle">' + p + '</text>';
          s += '<text class="bb-lbl" x="' + X(p) + '" y="' + (Y('A') + C.posDyDown) +
            '" text-anchor="middle">' + p + '</text>';
        }
      }

      HOLES.forEach(function (r) {
        var letter = r.toLowerCase();
        s += '<text class="bb-lbl" x="' + C.rowLabelX + '" y="' + (Y(r) + 4) + '">' + letter + '</text>';
        if (C.rowLabelXRight !== null) {
          s += '<text class="bb-lbl" x="' + C.rowLabelXRight + '" y="' + (Y(r) + 4) + '">' + letter + '</text>';
        }
      });
      return s;
    }

    return {
      pitch: pitch, cols: cols, pad: pad, rows: rows, scale: scale,
      X: X, Y: Y, pt: pt, svg: svg,
      chrome: C, railX0: railX0, railX1: railX1,
      chanTop: chanTop, chanBottom: chanBottom,
      /** Convenience for a page that wants the whole board to fit. */
      viewBox: function (h) { return '0 0 ' + Math.ceil(C.left + C.boardW + 18) + ' ' + h; }
    };
  }

  BBKit.esc = esc;
  BBKit.board = board;
  BBKit.deriveRows = deriveRows;
  BBKit.rowNames = { TOP: TOP, BOT: BOT, RAILS: RAILS, HOLES: HOLES };
})(window.BBKit);
