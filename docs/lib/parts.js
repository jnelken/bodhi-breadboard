/* ============================================================================
   BBKit.parts — the drawable primitives.

   Every primitive takes (board, step) and returns a record:

       { svg: string, at: {x,y}|null, r: number }

   `at` and `r` are where the halo goes, which is how a step points at the piece
   the child is about to place. Records rather than pre-concatenated strings: an
   editor will eventually want React reconciling individual parts, and that
   needs the pieces to stay addressable. Costs nothing to keep them that way.

   Sizes are written at pitch 22 — the booklet's size — and multiplied by
   board.scale, so the same primitive works on a denser reference diagram.
   ========================================================================= */

window.BBKit = window.BBKit || {};

(function (BBKit) {
  'use strict';

  var esc = BBKit.esc;

  /** Wire colours by role. Games and lessons name the role, never the hex. */
  var COLOR = {
    v5: 'var(--w-5v)', v3: 'var(--w-3v3)', gnd: 'var(--w-gnd)',
    s1: 'var(--w-s1)', s2: 'var(--w-s2)', s3: 'var(--w-s3)', sig: 'var(--w-sig)'
  };

  var NONE = { svg: '', at: null, r: 0 };

  /** A jumper drawn through arbitrary pixel points, casing and core. */
  function rawWire(b, points, color) {
    var d = points.map(function (q, i) {
      return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
    }).join(' ');
    return '<path class="wire-out" d="' + d + '" stroke-width="' + (8 * b.scale).toFixed(1) + '"/>' +
      '<path class="wire-in" d="' + d + '" stroke="' + color +
      '" stroke-width="' + (5.4 * b.scale).toFixed(1) + '"/>';
  }

  /**
   * A jumper between two holes. Same-column runs go straight; anything else
   * arcs over the top so it reads as a wire lying on the board rather than a
   * line drawn through it. `via` overrides the routing with explicit lanes.
   */
  function wire(b, st) {
    var a = b.pt(st.a), z = b.pt(st.b);
    var mid, focus;
    if (st.via) {
      mid = st.via;
    } else if (st.lane !== undefined) {
      // An explicit routing lane, so several long parallel runs can share a
      // stretch of board without drawing on top of each other.
      mid = [{ x: a.x, y: st.lane }, { x: z.x, y: st.lane }];
      focus = { x: (a.x + z.x) / 2, y: st.lane };
    } else if (a.x === z.x) {
      mid = [];
    } else {
      var over = Math.min(a.y, z.y) - 16 * b.scale;
      mid = [{ x: a.x, y: over }, { x: z.x, y: over }];
    }
    return {
      svg: rawWire(b, [a].concat(mid, [z]), COLOR[st.c] || st.c),
      at: focus || { x: (a.x + z.x) / 2, y: (a.y + z.y) / 2 },
      /* Capped: a run the width of the board would otherwise get a halo the
         width of the board, which points at everything and so at nothing. */
      r: Math.max(30 * b.scale,
                  Math.min(100 * b.scale, Math.abs(a.x - z.x) / 2 + 14 * b.scale))
    };
  }

  /** A resistor lying between two holes, with its value beside it. */
  function resistor(b, st) {
    var a = b.pt(st.a), z = b.pt(st.b);
    var dx = z.x - a.x, dy = z.y - a.y, len = Math.hypot(dx, dy);
    var ang = Math.atan2(dy, dx) * 180 / Math.PI;
    var mx = (a.x + z.x) / 2, my = (a.y + z.y) / 2;
    var bw = Math.max(24 * b.scale, Math.min(44 * b.scale, len - 16 * b.scale));
    var bh = 14 * b.scale;
    var perp = { x: -dy / len, y: dx / len };
    var off = 18 * b.scale;
    return {
      svg: '<line class="lead" x1="' + a.x + '" y1="' + a.y + '" x2="' + z.x + '" y2="' + z.y + '"/>' +
        '<g transform="translate(' + mx.toFixed(1) + ' ' + my.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')">' +
        '<rect class="rbody" x="' + (-bw / 2).toFixed(1) + '" y="' + (-bh / 2).toFixed(1) +
        '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="' + (3 * b.scale).toFixed(1) + '"/></g>' +
        '<text class="tval" x="' + (mx + perp.x * off).toFixed(1) + '" y="' +
        (my + perp.y * off + 4).toFixed(1) + '">' + esc(st.v) + '</text>',
      at: { x: mx, y: my }, r: Math.max(30 * b.scale, len / 2 + 12 * b.scale)
    };
  }

  /** An LED straddling two holes in one row, anode marked. */
  function led(b, st) {
    var a = b.pt([st.row, st.a]), k = b.pt([st.row, st.b]);
    var cx = (a.x + k.x) / 2, cy = a.y - 17 * b.scale;
    return {
      svg: '<line class="lead" x1="' + a.x + '" y1="' + a.y + '" x2="' + cx + '" y2="' + cy + '"/>' +
        '<line class="lead" x1="' + k.x + '" y1="' + k.y + '" x2="' + cx + '" y2="' + cy + '"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (11 * b.scale).toFixed(1) +
        '" fill="' + st.tone + '" stroke="var(--ink)" stroke-width="1.6"/>' +
        '<text class="tpin" x="' + (a.x - 13 * b.scale) + '" y="' + (a.y + 5) + '">+</text>',
      at: { x: cx, y: cy + 6 * b.scale }, r: 34 * b.scale
    };
  }

  /** A potentiometer: three legs in a row, knob above the board. */
  function pot(b, st) {
    var a = b.pt([st.row, st.p]), c = b.pt([st.row, st.p + 2]);
    var cx = (a.x + c.x) / 2, top = a.y - 46 * b.scale;
    var s = '';
    for (var i = 0; i < 3; i++) {
      var lx = b.X(st.p + i);
      s += '<line class="lead" x1="' + lx + '" y1="' + a.y + '" x2="' + lx + '" y2="' + (top + 26 * b.scale) + '"/>';
    }
    s += '<rect class="part" x="' + (a.x - 13 * b.scale) + '" y="' + top +
      '" width="' + (c.x - a.x + 26 * b.scale) + '" height="' + (28 * b.scale) +
      '" rx="' + (4 * b.scale) + '"/>';
    s += '<circle cx="' + cx + '" cy="' + (top + 14 * b.scale) + '" r="' + (10 * b.scale) +
      '" fill="var(--surface-2)" stroke="var(--ink)" stroke-width="1.6"/>';
    s += '<line class="lead" x1="' + cx + '" y1="' + (top + 14 * b.scale) +
      '" x2="' + (cx + 7 * b.scale) + '" y2="' + (top + 7 * b.scale) + '"/>';
    return { svg: s, at: { x: cx, y: top + 14 * b.scale }, r: 40 * b.scale };
  }

  /** An NPN transistor in three adjacent holes — emitter, base, collector. */
  function transistor(b, st) {
    var e = b.pt([st.row, st.e]), ba = b.pt([st.row, st.b]), c = b.pt([st.row, st.c]);
    var cy = ba.y + 12 * b.scale;
    var r = 11 * b.scale;
    return {
      svg: '<line class="lead" x1="' + e.x + '" y1="' + e.y + '" x2="' + (ba.x - 4 * b.scale) + '" y2="' + cy + '"/>' +
        '<line class="lead" x1="' + ba.x + '" y1="' + ba.y + '" x2="' + ba.x + '" y2="' + cy + '"/>' +
        '<line class="lead" x1="' + c.x + '" y1="' + c.y + '" x2="' + (ba.x + 4 * b.scale) + '" y2="' + cy + '"/>' +
        '<path class="part" d="M' + (ba.x - r) + ' ' + cy + ' a' + r + ' ' + r + ' 0 0 0 ' + (2 * r) + ' 0 z"/>' +
        '<text class="tpin" x="' + ba.x + '" y="' + (cy + 20 * b.scale) + '">' +
        esc(st.label || 'S8050 · E B C') + '</text>',
      at: { x: ba.x, y: cy }, r: 34 * b.scale
    };
  }

  /**
   * A labelled box, positioned in pixels rather than holes — for the parts that
   * genuinely are not on the board, like a sensor module on the end of a plug.
   */
  function block(b, st) {
    return {
      svg: '<rect class="part" x="' + st.x + '" y="' + st.y + '" width="' + st.w +
        '" height="' + st.h + '" rx="4"/>' +
        '<text class="tmod tlab-mid" x="' + (st.x + st.w / 2) + '" y="' + (st.y + 19) + '">' +
        esc(st.title) + '</text>' +
        (st.sub ? '<text class="tpin" x="' + (st.x + st.w / 2) + '" y="' + (st.y + 33) + '">' +
          esc(st.sub) + '</text>' : ''),
      at: { x: st.x + st.w / 2, y: st.y + st.h / 2 }, r: Math.max(st.w, st.h) / 2 + 10
    };
  }

  /**
   * A sensor module plugged straight into the board: a body sitting above the
   * row with one leg down into each hole, and its pin names printed beside the
   * legs. `eyes` draws the HC-SR04's two transducers, which is the whole reason
   * a five-year-old calls it the binoculars.
   *
   * st: { row, p0, n, title, pins: string[], eyes?: boolean }
   */
  function sensorModule(b, st) {
    var k = b.scale;
    var n = st.n || (st.pins || []).length;
    var first = b.pt([st.row, st.p0]);
    var last = b.pt([st.row, st.p0 + n - 1]);
    var legTop = first.y - 42 * k;
    var bh = 46 * k;
    var x0 = first.x - b.pitch * 0.6, x1 = last.x + b.pitch * 0.6;

    var s = '';
    for (var i = 0; i < n; i++) {
      var lx = b.X(st.p0 + i);
      s += '<line class="lead" x1="' + lx + '" y1="' + first.y + '" x2="' + lx + '" y2="' + legTop + '"/>';
      if (st.pins && st.pins[i]) {
        s += '<text class="tpin" transform="translate(' + (lx + 4 * k) + ' ' +
          (first.y - 5 * k) + ') rotate(-90)" text-anchor="start">' + esc(st.pins[i]) + '</text>';
      }
    }
    s += '<rect class="part" x="' + x0 + '" y="' + (legTop - bh) + '" width="' + (x1 - x0) +
      '" height="' + bh + '" rx="' + (5 * k) + '"/>';

    if (st.eyes) {
      var ey = legTop - bh / 2;
      var er = 13 * k;
      [0.3, 0.7].forEach(function (f) {
        var ex = x0 + (x1 - x0) * f;
        s += '<circle cx="' + ex + '" cy="' + ey + '" r="' + er +
          '" fill="var(--surface-2)" stroke="var(--ink)" stroke-width="1.6"/>';
        s += '<circle cx="' + ex + '" cy="' + ey + '" r="' + (er * 0.45) +
          '" fill="var(--ink-3)" opacity="0.5"/>';
      });
    } else if (st.title) {
      s += '<text class="tmod" x="' + ((x0 + x1) / 2) + '" y="' + (legTop - bh / 2 + 5 * k) +
        '" text-anchor="middle">' + esc(st.title) + '</text>';
    }

    return {
      svg: s,
      at: { x: (x0 + x1) / 2, y: legTop - bh / 2 },
      r: Math.max((x1 - x0) / 2, bh / 2) + 12 * k
    };
  }

  /** A dashed region — "take everything off the board here". */
  function zone(b, st) {
    var inset = 13 * b.scale;
    var x1 = b.X(st.p0) - inset, x2 = b.X(st.p1) + inset;
    var y1 = b.Y(st.r0) - inset, y2 = b.Y(st.r1) + inset;
    return {
      svg: '<rect class="zone" x="' + x1 + '" y="' + y1 + '" width="' + (x2 - x1) +
        '" height="' + (y2 - y1) + '" rx="12"/>',
      at: null, r: 0
    };
  }

  /**
   * The three reveals that teach lesson zero: a breadboard's connections are
   * invisible. Tints the groups he has just discovered by moving a wire around.
   */
  function reveal(b, st) {
    var s = '';
    var inset = 9 * b.scale;
    var right = b.X(b.cols) + 30;
    if (st.what === 'cols') {
      for (var p = 1; p <= b.cols; p++) {
        s += '<rect class="tintfill" x="' + (b.X(p) - inset) + '" y="' + (b.Y('J') - inset) +
          '" width="' + (2 * inset) + '" height="' + (b.Y('F') - b.Y('J') + 2 * inset) + '" rx="' + inset + '"/>';
        s += '<rect class="tintfill" x="' + (b.X(p) - inset) + '" y="' + (b.Y('E') - inset) +
          '" width="' + (2 * inset) + '" height="' + (b.Y('A') - b.Y('E') + 2 * inset) + '" rx="' + inset + '"/>';
      }
    } else if (st.what === 'channel') {
      var left = b.chrome.left;
      s += '<rect class="tintfill" x="' + left + '" y="' + b.chanTop +
        '" width="' + (b.X(b.cols) - left + 30) + '" height="' + (b.chanBottom - b.chanTop) + '"/>';
      var mid = (b.chanTop + b.chanBottom) / 2;
      s += '<line class="tintline" x1="' + left + '" y1="' + mid + '" x2="' + right + '" y2="' + mid + '"/>';
    } else {
      BBKit.rowNames.RAILS.forEach(function (r) {
        s += '<rect class="tintfill" x="' + (b.chrome.left + 4) + '" y="' + (b.Y(r) - inset) +
          '" width="' + (b.X(b.cols) - b.chrome.left - 4 + 30) + '" height="' + (2 * inset) +
          '" rx="' + inset + '"/>';
      });
    }
    return { svg: s, at: null, r: 0 };
  }

  /* ---- the parts inventory ------------------------------------------------
     A LEGO booklet opens on a picture of every piece with a count beside it, so
     a child who cannot read can still gather his own parts. Same idea. */

  /** Colour codes, so the inventory shows the resistor he is actually hunting for. */
  var BANDS = {
    '220': ['#C0392B', '#C0392B', '#7B4A21'],
    '1k': ['#7B4A21', '#111111', '#C0392B'],
    '10k': ['#7B4A21', '#111111', '#D97B2A'],
    '20k': ['#C0392B', '#111111', '#D97B2A']
  };

  function partIcon(p, cx, cy) {
    if (p.k === 'r') {
      var s = '<line class="lead" x1="' + (cx - 46) + '" y1="' + cy + '" x2="' + (cx + 46) + '" y2="' + cy + '"/>';
      s += '<rect class="rbody" x="' + (cx - 27) + '" y="' + (cy - 11) + '" width="54" height="22" rx="4"/>';
      (BANDS[p.bands] || BANDS['220']).forEach(function (c, i) {
        s += '<rect x="' + (cx - 17 + i * 13) + '" y="' + (cy - 11) + '" width="6" height="22" fill="' + c + '"/>';
      });
      return s;
    }
    if (p.k === 'module') {
      var t = '<rect class="part" x="' + (cx - 44) + '" y="' + (cy - 22) + '" width="88" height="44" rx="5"/>';
      [-20, 20].forEach(function (dx) {
        t += '<circle cx="' + (cx + dx) + '" cy="' + cy + '" r="14" fill="var(--surface-2)" stroke="var(--ink)" stroke-width="1.8"/>';
        t += '<circle cx="' + (cx + dx) + '" cy="' + cy + '" r="6" fill="var(--ink-3)" opacity="0.5"/>';
      });
      [-16, -5, 6, 17].forEach(function (dx) {
        t += '<line class="lead" x1="' + (cx + dx) + '" y1="' + (cy + 22) + '" x2="' + (cx + dx) + '" y2="' + (cy + 38) + '"/>';
      });
      return t;
    }
    if (p.k === 'led') {
      return '<line class="lead" x1="' + (cx - 7) + '" y1="' + (cy + 6) + '" x2="' + (cx - 7) + '" y2="' + (cy + 30) + '"/>' +
        '<line class="lead" x1="' + (cx + 7) + '" y1="' + (cy + 6) + '" x2="' + (cx + 7) + '" y2="' + (cy + 22) + '"/>' +
        '<circle cx="' + cx + '" cy="' + (cy - 2) + '" r="17" fill="' + p.tone + '" stroke="var(--ink)" stroke-width="1.8"/>';
    }
    if (p.k === 'pot') {
      var t = '<circle cx="' + cx + '" cy="' + (cy - 4) + '" r="20" fill="var(--surface-2)" stroke="var(--ink)" stroke-width="1.8"/>';
      t += '<line class="lead" x1="' + cx + '" y1="' + (cy - 4) + '" x2="' + (cx + 11) + '" y2="' + (cy - 15) + '"/>';
      [-13, 0, 13].forEach(function (dx) {
        t += '<line class="lead" x1="' + (cx + dx) + '" y1="' + (cy + 16) + '" x2="' + (cx + dx) + '" y2="' + (cy + 32) + '"/>';
      });
      return t;
    }
    // jumper wire
    return '<path class="wire-out" d="M' + (cx - 46) + ' ' + (cy + 12) + ' Q' + cx + ' ' + (cy - 26) +
      ' ' + (cx + 46) + ' ' + (cy + 12) + '" stroke-width="11" fill="none"/>' +
      '<path class="wire-in" d="M' + (cx - 46) + ' ' + (cy + 12) + ' Q' + cx + ' ' + (cy - 26) +
      ' ' + (cx + 46) + ' ' + (cy + 12) + '" stroke="' + p.tone + '" stroke-width="7" fill="none"/>';
  }

  /**
   * @param {object} b board
   * @param {object} st step
   * @param {{parts?: Array, panel?: object}} [ctx] the lesson
   */
  function partsPanel(b, st, ctx) {
    var list = (ctx && ctx.parts) || [];
    var L = Object.assign({
      x: 54, y: 34, w: 1372, h: 400, rx: 12,
      title: 'Find these pieces', titleX: 740, titleY: 84,
      cols: 5, cw: 262, x0: 190, rows: [206, 338]
    }, (ctx && ctx.panel) || {}, st.panel || {});

    var s = '<rect class="panel" x="' + L.x + '" y="' + L.y + '" width="' + L.w +
      '" height="' + L.h + '" rx="' + L.rx + '"/>';
    s += '<text class="ptitle" x="' + L.titleX + '" y="' + L.titleY + '">' + esc(L.title) + '</text>';
    list.forEach(function (p, i) {
      var cx = L.x0 + (i % L.cols) * L.cw;
      var cy = L.rows[Math.floor(i / L.cols)];
      s += partIcon(p, cx, cy);
      s += '<text class="pcount" x="' + cx + '" y="' + (cy + 62) + '">×' + p.n + '</text>';
      s += '<text class="plabel" x="' + cx + '" y="' + (cy + 82) + '">' + esc(p.label) + '</text>';
    });
    return { svg: s, at: null, r: 0 };
  }

  /** Step kind -> primitive. A lesson only ever names these short keys. */
  var KIND = {
    w: wire, r: resistor, led: led, pot: pot, npn: transistor,
    module: sensorModule, block: block, zone: zone, reveal: reveal, parts: partsPanel
  };

  /**
   * Draw one step.
   * @returns {{svg: string, at: {x:number,y:number}|null, r: number}}
   */
  function draw(b, st, ctx) {
    var fn = KIND[st.k];
    return fn ? fn(b, st, ctx) : NONE;
  }

  BBKit.COLOR = COLOR;
  BBKit.draw = draw;
  BBKit.parts = {
    wire: wire, resistor: resistor, led: led, pot: pot, transistor: transistor,
    sensorModule: sensorModule, block: block, zone: zone, reveal: reveal,
    partsPanel: partsPanel, rawWire: rawWire, partIcon: partIcon,
    bands: BANDS, kinds: KIND
  };
})(window.BBKit);
