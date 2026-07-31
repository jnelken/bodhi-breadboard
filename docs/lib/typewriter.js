/* ============================================================================
   BBKit.typewriter — types an instruction out one letter at a time.

   Why typed at all, on a page for someone who cannot read: the words arrive at
   the speed they would be spoken, with Pac-Man's mouth moving and a tap per
   letter. A child watching words appear as they are said is getting the
   earliest useful reading exposure there is, and it costs the page nothing.

       var tw = BBKit.typewriter({ el: span, narrator: nar });
       tw.type('A resistor, so the light does not get too much.');

   reactbits.dev's TextType does this as a React component needing React and
   gsap. This page is one self-contained file with no bundler, so neither can
   load; the settings below mirror TextType's prop names deliberately. gsap was
   only driving the cursor blink there — here Pac-Man's mouth is the cursor.
   ========================================================================= */

window.BBKit = window.BBKit || {};

(function (BBKit) {
  'use strict';

  var DEFAULTS = {
    typingSpeed: 48,
    initialDelay: 140,
    variableSpeed: { min: 36, max: 66 }   // human-feeling jitter
  };

  /**
   * @param {{el: HTMLElement, narrator?: object, typingSpeed?: number,
   *          initialDelay?: number, variableSpeed?: {min:number,max:number}|null}} opts
   */
  function typewriter(opts) {
    var cfg = Object.assign({}, DEFAULTS, opts);
    var el = cfg.el;
    var nar = cfg.narrator;
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null;
    var current = '';

    function speed() {
      return cfg.variableSpeed
        ? cfg.variableSpeed.min + Math.random() * (cfg.variableSpeed.max - cfg.variableSpeed.min)
        : cfg.typingSpeed;
    }

    function cancel() {
      clearTimeout(timer);
      timer = null;
    }

    /** Show the whole line now and stop the mouth — used by reduced motion. */
    function finish() {
      cancel();
      el.textContent = current;
      if (nar) nar.rest();
    }

    function type(text) {
      cancel();
      current = text || '';

      if (reduceMotion) { finish(); return; }

      el.textContent = '';
      var i = 0;
      if (nar) nar.talk();

      var tick = function () {
        if (i >= current.length) { if (nar) nar.rest(); return; }
        var ch = current[i++];
        el.textContent += ch;
        // Spaces stay silent, which is what gives the run of taps its rhythm.
        if (ch !== ' ' && nar) nar.tap();
        timer = setTimeout(tick, speed());
      };
      timer = setTimeout(tick, cfg.initialDelay);
    }

    return { type: type, finish: finish, cancel: cancel };
  }

  BBKit.typewriter = typewriter;
})(window.BBKit);
