/* ============================================================================
   BBKit.narrator — the Pac-Man talking head.

   He is the reason a non-reader can follow a step: something alive is saying
   the instruction, and his mouth moves in time with the words appearing. He
   owns his own sound, so the typewriter can ask for a tap without knowing
   anything about WebAudio.

       var nar = BBKit.narrator(el);
       nar.talk();   // chomping
       nar.rest();   // mouth open, waiting
       nar.tap();    // one click

   Two frames only, swapped by toggling a class — see the .pac rules in kit.css
   for why there is no transition between them.
   ========================================================================= */

window.BBKit = window.BBKit || {};

(function (BBKit) {
  'use strict';

  var DEFAULTS = {
    /* The chomp runs on its own slow cadence rather than once per character.
       At this size, a letter-by-letter mouth would swap about 20 times a
       second — too fast to read as chewing, and a large shape flickering that
       quickly is worth avoiding on a page built for a child. */
    chompEveryMs: 250
  };

  /**
   * @param {HTMLElement} el the .pac element
   * @param {{chompEveryMs?: number}} [opts]
   */
  function narrator(el, opts) {
    var cfg = Object.assign({}, DEFAULTS, opts);
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var chompTimer = null;
    var muted = false;

    /* --- the tap ---
       Synthesised rather than loaded: a short click costs nothing to generate
       and needs no file alongside the page, which keeps the booklet openable
       from disk. Browsers refuse to start audio before a user gesture, so the
       very first step types silently and every step after it taps. */
    var actx = null;

    function unlock() {
      if (!actx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) actx = new AC();
      }
      if (actx && actx.state === 'suspended') actx.resume();
    }

    function tap() {
      if (muted || !actx || actx.state !== 'running') return;
      var t = actx.currentTime;
      var osc = actx.createOscillator(), gain = actx.createGain();
      osc.type = 'square';
      // Vary the pitch so a run of them reads as taps, not one buzz.
      osc.frequency.setValueAtTime(1400 + Math.random() * 500, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.05, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(t); osc.stop(t + 0.045);
    }

    function talk() {
      clearInterval(chompTimer);
      if (reduceMotion || !el) return;
      chompTimer = setInterval(function () { el.classList.toggle('chomp'); }, cfg.chompEveryMs);
    }

    function rest() {
      clearInterval(chompTimer);
      if (el) el.classList.remove('chomp');   // rests with his mouth open
    }

    function setMuted(v) {
      muted = !!v;
      if (!muted) unlock();
      return muted;
    }

    /**
     * Wire a button to mute. Kept here rather than in the viewer so the glyph,
     * the aria state and the audio unlock cannot drift apart.
     */
    function bindMuteButton(btn) {
      if (!btn) return;
      var paint = function () {
        btn.textContent = muted ? '🔇' : '🔊';
        btn.setAttribute('aria-pressed', String(muted));
      };
      btn.addEventListener('click', function () { setMuted(!muted); paint(); });
      paint();
    }

    /* Audio can only start from a real interaction, so take the first one going. */
    ['pointerdown', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, unlock, { once: true });
    });

    return {
      element: el,
      talk: talk, rest: rest, tap: tap, unlock: unlock,
      setMuted: setMuted,
      isMuted: function () { return muted; },
      bindMuteButton: bindMuteButton,
      reduceMotion: reduceMotion
    };
  }

  BBKit.narrator = narrator;
})(window.BBKit);
