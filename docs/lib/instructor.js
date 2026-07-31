/* ============================================================================
   BBKit.instructor — the step machine that binds the three core parts.

       BBKit.instructor.mount(document.getElementById('kit'),
                              BBKit.lessons['first-circuits']);

   It builds the whole viewer, so a lesson page is a masthead, some prose and
   one call. What it enforces is the LEGO reading of a build:

     one step is one piece · everything already placed is dimmed to grey ·
     the new piece is haloed · a big Next button · no reading required

   The last point is why the narrator and the typewriter are wired in here
   rather than being optional extras: a step that cannot say itself out loud is
   no use to someone who cannot read it.
   ========================================================================= */

window.BBKit = window.BBKit || {};
window.BBKit.lessons = window.BBKit.lessons || {};

(function (BBKit) {
  'use strict';

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  /* Stands in for the masthead. A chip with a lit pin, drawn from the same
     --ink/--glow tokens as the rest of the kit so it never needs its own
     theming. Sits to the left of the build tabs rather than above them, since
     nothing here is meant to be read. Wrapped in a link back to the lesson
     picker — the one "go home" affordance a page with no words can offer. */
  var LOGO_SVG =
    '<a class="logo-link" href="index.html" aria-label="Back to lesson picker">' +
    '<svg class="logo" viewBox="0 0 40 40" role="img" aria-label="Bodhi\'s Breadboard">' +
    '<rect x="9" y="9" width="22" height="22" rx="4" fill="none" stroke="var(--ink)" stroke-width="2"/>' +
    '<circle cx="20" cy="20" r="5" fill="var(--glow)"/>' +
    '<line x1="9" y1="15" x2="3" y2="15" stroke="var(--ink)" stroke-width="2"/>' +
    '<line x1="9" y1="20" x2="3" y2="20" stroke="var(--ink)" stroke-width="2"/>' +
    '<line x1="9" y1="25" x2="3" y2="25" stroke="var(--ink)" stroke-width="2"/>' +
    '<line x1="31" y1="15" x2="37" y2="15" stroke="var(--ink)" stroke-width="2"/>' +
    '<line x1="31" y1="20" x2="37" y2="20" stroke="var(--ink)" stroke-width="2"/>' +
    '<line x1="31" y1="25" x2="37" y2="25" stroke="var(--ink)" stroke-width="2"/>' +
    '</svg>' +
    '</a>';

  /** The viewer's markup, built here so a lesson page stays a thin shell. */
  function scaffold(root, lesson) {
    var ui = {};

    var topbar = el('div', 'topbar');
    topbar.innerHTML = LOGO_SVG;
    ui.builds = el('div', 'builds');
    topbar.appendChild(ui.builds);
    root.appendChild(topbar);

    var viewer = el('div', 'viewer');

    var stage = el('div', 'stage');
    ui.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ui.svg.setAttribute('viewBox', lesson.viewBox || '0 0 1480 470');
    ui.svg.setAttribute('role', 'img');
    ui.svg.setAttribute('aria-label', lesson.ariaLabel || 'Breadboard build step');
    stage.appendChild(ui.svg);
    viewer.appendChild(stage);

    /* Everything below the board — the line he's read to, the big buttons and
       the quiet progress dots — stacks in one column so it can sit beside
       Pac-Man instead of spanning under him. */
    var readout = el('div', 'readout');
    var text = el('div', 'readout-text');

    var msg = el('div', 'msg');
    ui.say = el('p', 'say');
    ui.sayText = el('span');
    ui.say.appendChild(ui.sayText);
    ui.check = el('div', 'check', { hidden: 'hidden' });
    msg.appendChild(ui.say);
    msg.appendChild(ui.check);
    text.appendChild(msg);

    var nav = el('div', 'nav');
    ui.prev = el('button', 'ghost', { type: 'button' });
    ui.prev.textContent = 'Back';
    ui.next = el('button', null, { type: 'button' });
    ui.next.textContent = 'Next piece';
    nav.appendChild(ui.prev);
    nav.appendChild(ui.next);
    text.appendChild(nav);

    var bar = el('div', 'stepbar');
    ui.stepnum = el('span', 'stepnum');
    ui.dots = el('span', 'dots');
    bar.appendChild(ui.stepnum);
    bar.appendChild(ui.dots);
    text.appendChild(bar);

    ui.pac = el('div', 'pac', { 'aria-hidden': 'true' });
    readout.appendChild(text);
    readout.appendChild(ui.pac);
    viewer.appendChild(readout);

    root.appendChild(viewer);
    return ui;
  }

  /**
   * @param {HTMLElement} root
   * @param {object} lesson see docs/lib/README.md for the document shape
   */
  function mount(root, lesson) {
    if (!root) throw new Error('BBKit.instructor.mount: no root element');
    if (!lesson) throw new Error('BBKit.instructor.mount: no lesson');

    var ui = scaffold(root, lesson);
    var board = BBKit.board(lesson.board);
    var overlay = lesson.overlay ? BBKit.overlays[lesson.overlay] : null;
    if (lesson.overlay && !overlay) {
      throw new Error('BBKit.instructor.mount: unknown overlay "' + lesson.overlay + '"');
    }

    var narrator = BBKit.narrator(ui.pac, lesson.narrator);
    var typer = BBKit.typewriter(Object.assign({ el: ui.sayText, narrator: narrator }, lesson.typing));

    /* Only what the child is meant to see. Builds marked for the grown-up (board
       prep, anything that is really an adult's job) stay in the lesson file but
       never appear here — docs/teaching-notes.html renders those instead. The
       interactive page is one instruction and one button, nothing else. */
    var builds = lesson.builds.filter(function (b) { return b.audience !== 'grown-up'; });
    if (!builds.length) throw new Error('BBKit.instructor.mount: lesson has no child-facing builds');
    var bi = 0, si = 0;

    /* Cumulative builds show everything from every earlier cumulative build, so
       build 3 stands on the two lights built in 1 and 2. A non-cumulative build
       (the parts inventory, the reveals) shows nothing but itself. */
    function priorSteps(i) {
      return builds.slice(0, i)
        .filter(function (b) { return b.cum && builds[i].cum; })
        .reduce(function (all, b) { return all.concat(b.steps); }, []);
    }

    function render() {
      var b = builds[bi];
      var hot = (lesson.hot && lesson.hot[b.id]) || [];

      var svg = board.svg();
      if (overlay) svg += overlay(board, hot, lesson.overlayOpts);

      var doneSvg = '', nowSvg = '', halo = '';
      priorSteps(bi).forEach(function (st) { doneSvg += BBKit.draw(board, st, lesson).svg; });
      b.steps.forEach(function (st, i) {
        if (i > si) return;
        var d = BBKit.draw(board, st, lesson);
        if (i < si) { doneSvg += d.svg; return; }
        nowSvg = d.svg;
        if (d.at) {
          halo = '<circle class="halo" cx="' + d.at.x.toFixed(1) + '" cy="' +
            d.at.y.toFixed(1) + '" r="' + d.r + '"/>';
        }
      });

      ui.svg.innerHTML = svg + '<g class="done">' + doneSvg + '</g>' + nowSvg + halo;

      var st = b.steps[si];
      ui.stepnum.textContent = (b.cum ? 'Step ' : 'Look ') + (si + 1) + ' of ' + b.steps.length;
      typer.type(st.say);

      /* `check` is what the child can look at and act on. A step's `coach` note
         is for the grown-up and is deliberately not rendered here. */
      if (st.check) { ui.check.innerHTML = st.check; ui.check.hidden = false; }
      else ui.check.hidden = true;

      ui.dots.innerHTML = b.steps.map(function (_, i) {
        return '<i class="' + (i < si ? 'done' : i === si ? 'now' : '') + '"></i>';
      }).join('');

      ui.prev.disabled = (si === 0 && bi === 0);
      var lastStep = si === b.steps.length - 1;
      var lastBuild = bi === builds.length - 1;
      ui.next.textContent = lastStep
        ? (lastBuild ? 'All done' : 'Next build →')
        : (b.cum ? 'Next piece' : 'Next');
      ui.next.disabled = (lastBuild && lastStep);

      Array.prototype.forEach.call(ui.builds.children, function (node, j) {
        node.setAttribute('aria-pressed', String(j === bi));
      });
    }

    function step(d) {
      var b = builds[bi];
      if (d > 0) {
        if (si < b.steps.length - 1) si++;
        else if (bi < builds.length - 1) { bi++; si = 0; }
      } else {
        if (si > 0) si--;
        else if (bi > 0) { bi--; si = builds[bi].steps.length - 1; }
      }
      render();
    }

    function go(buildIndex, stepIndex) {
      bi = Math.max(0, Math.min(builds.length - 1, buildIndex));
      si = Math.max(0, Math.min(builds[bi].steps.length - 1, stepIndex || 0));
      render();
    }

    builds.forEach(function (b, i) {
      var node = el('button', null, { type: 'button', 'aria-pressed': 'false' });
      node.textContent = b.tab;
      node.addEventListener('click', function () { go(i, 0); });
      ui.builds.appendChild(node);
    });

    ui.next.addEventListener('click', function () { step(1); });
    ui.prev.addEventListener('click', function () { step(-1); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });

    render();

    return { render: render, step: step, go: go, board: board, narrator: narrator, ui: ui };
  }

  BBKit.instructor = { mount: mount };
})(window.BBKit);
