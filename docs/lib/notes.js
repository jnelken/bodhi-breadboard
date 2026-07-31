/* ============================================================================
   BBKit.notes — the grown-up side of a lesson.

   Every lesson document carries two audiences: `say` and `check` for the child,
   `why` and `coach` for the adult. The interactive page renders only the first
   pair. This renders only the second, so the notes cannot drift out of step
   with the build they describe — there is one source of truth and two views
   of it.

       BBKit.notes.render(el, ['first-circuits', 'binoculars']);
   ========================================================================= */

window.BBKit = window.BBKit || {};

(function (BBKit) {
  'use strict';

  var esc = BBKit.esc;

  function stepLabel(st, i) {
    return (st.k === 'parts' ? 'Parts' : 'Step ' + (i + 1));
  }

  function renderLesson(id) {
    var lesson = BBKit.lessons[id];
    if (!lesson) return '<p>Missing lesson: <code>' + esc(id) + '</code></p>';

    var s = '<section class="notes-lesson">';
    s += '<div class="eyebrow">' + esc(id) + '.html</div>';
    s += '<h2>' + esc(lesson.title || id) + '</h2>';

    lesson.builds.forEach(function (b) {
      var grown = b.audience === 'grown-up';
      s += '<div class="notes-build' + (grown ? ' grown-only' : '') + '">';
      s += '<h3>' + esc(b.tab) + (grown ? ' <span class="tag">your job, not his</span>' : '') + '</h3>';
      if (b.why) s += '<p class="why">' + esc(b.why) + '</p>';

      var rows = b.steps.map(function (st, i) {
        if (!st.coach && !grown) return '';
        return '<tr><td class="n">' + stepLabel(st, i) + '</td>' +
          '<td class="said">' + esc(st.say || '') + '</td>' +
          '<td class="coach">' + (st.coach || '<span class="none">—</span>') + '</td></tr>';
      }).filter(Boolean).join('');

      if (rows) {
        s += '<table class="notes-table"><thead><tr>' +
          '<th></th><th>He hears</th><th>You do</th></tr></thead><tbody>' +
          rows + '</tbody></table>';
      }
      s += '</div>';
    });

    s += '</section>';
    return s;
  }

  /**
   * @param {HTMLElement} el
   * @param {string[]} ids lesson keys, in teaching order
   */
  function render(el, ids) {
    el.innerHTML = ids.map(renderLesson).join('');
  }

  BBKit.notes = { render: render, renderLesson: renderLesson };
})(window.BBKit);
