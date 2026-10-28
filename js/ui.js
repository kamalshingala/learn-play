'use strict';
/* Screen helpers, the always-present speaker (replay) button, and option builders. */

const UI = {
  scr: null, replayFn: null, idleT: 0, idleN: 0, mascotT: 0,
  init() {
    this.scr = $('#screen');
    $('#replay').addEventListener('click', () => this.replay());
    this.scr.addEventListener('pointerdown', () => this.arm());
    this.scr.addEventListener('click', e => {
      const w = e.target.closest('[data-say]');                 // any word or sentence marked data-say reads itself aloud
      if (w) { Sound.chain++; Sound.speak(w.dataset.say, { rate: 0.8 }); w.classList.remove('said'); void w.offsetWidth; w.classList.add('said'); return; }
      if (e.target.closest('.prompt')) this.replay();           // tapping the question text asks it again
    });
  },
  reset() {                                   // called whenever a new flow begins
    document.body.classList.remove('locked');
    this.setReplay(null);
    Q.cur = null;
  },
  show(html, cls = '') {
    this.scr.onclick = null;
    this.scr.className = cls + ' enter';
    this.scr.innerHTML = html;
    this.scr.scrollTop = 0;
    document.body.classList.remove('locked');
    Q.cur = null;
  },
  lock()   { document.body.classList.add('locked'); },    // ignore taps while a celebration plays
  unlock() { document.body.classList.remove('locked'); },
  bubble(t) { const b = $('#bubble'); if (b) b.textContent = t; },
  mascot(e, ms = 1200) {
    const m = $('#mascot'); if (!m) return;
    m.innerHTML = e; clearTimeout(this.mascotT);
    this.mascotT = setTimeout(() => { m.innerHTML = Theme.mascotHTML(); }, ms * TIME);
  },
  homeBtn(show) { $('#homeBtn').style.visibility = show ? 'visible' : 'hidden'; },
  stats() { const n = Object.keys(S.badges).length; $('#stats').textContent = `🔥 ${S.streak}  🏅 ${n}`; },

  /* Every question registers what the speaker button should say. */
  setReplay(fn) {
    this.replayFn = fn; this.idleN = 0;
    const b = $('#replay'); b.hidden = !fn; b.classList.remove('pulse');
    this.arm();
  },
  replay() {
    if (!this.replayFn || document.body.classList.contains('locked')) return;
    const b = $('#replay'); b.classList.remove('tap'); void b.offsetWidth; b.classList.add('tap');
    try { this.replayFn(); } catch (e) { console.error(e); }
    this.arm();
  },
  arm() {                                      // if the child goes quiet, read the question again (up to 3 times)
    clearTimeout(this.idleT);
    if (!this.replayFn || this.idleN >= 3) return;
    this.idleT = setTimeout(() => {
      if (!this.replayFn) return;
      if (!document.body.classList.contains('locked')) {
        this.idleN++;
        const b = $('#replay'); b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 2600 * TIME);
        try { this.replayFn(); } catch (e) {}
      }
      this.arm();
    }, 14000 * TIME);
  },
  fatal() {
    this.show(`<div class="prompt">Oops, let's start again!</div><button class="bigbtn" id="fatalHome">🏠 Home</button>`);
    $('#fatalHome').onclick = () => go.home();
  },
};

/* Option content builders */
const O = {
  pic:    (e, label) => `<span class="pic">${e}</span>${label ? `<small>${label}</small>` : ''}`,
  num:    n => `<span class="num">${n}</span>`,
  word:   w => `<span class="wd">${w}</span>`,
  letter: l => `<span class="lt">${l}</span>`,
  eq:     t => `<span class="eq">${t}</span>`,
  group:  (e, n) => `<span class="grp">${Array.from({ length: n }, () => `<i>${e}</i>`).join('')}</span>`,
  big:    t => `<div class="bigtxt">${t}</div>`,
  speaker: '<div class="bigtxt">🔊</div>',
};

/* Build a shuffled option list: one correct + (n-1) unique wrong ones taken from `pool`. */
function pickOpts(correct, pool, n, key, render) {
  const seen = new Set([key(correct)]), wrong = [];
  for (const x of shuffle(pool)) {
    if (wrong.length >= n - 1) break;
    const k = key(x); if (seen.has(k)) continue;
    seen.add(k); wrong.push(x);
  }
  const out = shuffle([{ html: render(correct), ok: true }, ...wrong.map(x => ({ html: render(x), ok: false }))]);
  if (out.length < 2) throw new Error('not enough options');
  return out;
}
/* Wrong numbers near the right one */
function numPool(n, lo, hi) {
  const out = [];
  for (let d = 1; d <= 4; d++) { if (n - d >= lo) out.push(n - d); if (n + d <= hi) out.push(n + d); }
  return out;
}
