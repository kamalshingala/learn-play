'use strict';
/* Question engine: every kind of interaction lives here, so every lesson gets the same
   safety rules: a speaker button, locked input during celebrations, no double-handling. */

const Q = {
  dots: { n: 0, total: 0 }, cur: null, rec: {}, armedAt: 0,

  armed() { return performance.now() >= this.armedAt; },      // ignores taps carried over from the previous screen

  /* Pick from pool avoiding the last few picks, so rounds don't repeat straight away. */
  recent(pool, key, keyFn, keep = 3) {
    const r = this.rec[key] || (this.rec[key] = []);
    let c = pool.filter(x => !r.includes(keyFn(x)));
    if (!c.length) c = pool;
    const x = rand(c);
    r.push(keyFn(x)); while (r.length > Math.min(keep, Math.max(1, pool.length - 1))) r.shift();
    return x;
  },

  /* Speak and register as the speaker-button action. Never rejects. */
  say(text) {                                                // text, or a function(ok) that may say several things in a row
    const run = () => {
      const my = ++Sound.chain, ok = () => my === Sound.chain;   // a newer sound cancels an older sequence, so voices never overlap
      try { return Promise.resolve(typeof text === 'function' ? text(ok) : Sound.speak(text)); } catch (e) { return Promise.resolve(); }
    };
    UI.setReplay(run);
    return run();
  },

  dotsHTML() {
    const { n, total } = this.dots; if (!total) return '';
    return `<div class="dots">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
  },

  /* Standard question screen. `say` is REQUIRED: it is spoken now and by the speaker button. */
  frame(T, { say, prompt, visual = '', body = '', cls = '' }) {
    if (!say) throw new Error('question without speech');
    UI.show(`<div class="q ${cls}">${this.dotsHTML()}<div class="prompt">${prompt}</div>${visual ? `<div class="visual">${visual}</div>` : ''}${body}</div>`);
    this.armedAt = performance.now() + 260 * TIME;
    UI.bubble('Have a go! 🌟');
    this.say(say);
  },

  async win(T, el, size = 'normal') {
    UI.lock();
    celebrate(el, size);
    await T.sleep({ small: 420, normal: 650, big: 1500 }[size]);
  },

  /* Pick one of several options. Returns true if right first time. */
  async choice(T, { say, prompt, visual, opts, layout = '', hint = '', cls = '' }) {
    const html = `<div class="opts ${layout}">${opts.map((o, i) => `<button class="opt ${o.cls || ''}" data-i="${i}">${o.html}</button>`).join('')}</div>`;
    this.frame(T, { say, prompt, visual, body: html, cls });
    const els = $$('.opt', UI.scr), okEl = els[opts.findIndex(o => o.ok)];
    if (!okEl) throw new Error('no correct option');
    const res = await T.defer(resolve => {
      let wrong = 0, done = false;
      this.cur = { kind: 'choice', root: UI.scr, els, okEl, solve: () => { if (!this.armed()) return false; okEl.click(); return true; } };
      els.forEach(el => el.addEventListener('click', () => {
        if (done || el.disabled || !this.armed()) return;
        if (el === okEl) { done = true; UI.lock(); el.classList.add('right'); resolve({ first: wrong === 0, el }); }
        else {
          wrong++; el.disabled = true; el.classList.add('wrong'); Sound.bad(); UI.mascot('🤔', 900); UI.bubble('Try again! 💪');
          if (wrong === 2) { okEl.classList.add('hint'); if (hint) Sound.speak(hint); }
        }
      }));
    });
    await this.win(T, res.el);
    return res.first;
  },

  /* Put tiles in order (spell a word, order numbers, build a sentence). */
  async seq(T, { say, prompt, visual, tokens, extra = [], onTile, cls = '' }) {
    const tiles = shuffle([...tokens, ...extra]);
    const body = `<div class="slots">${tokens.map(() => '<div class="slot"></div>').join('')}</div>
                  <div class="tiles">${tiles.map(t => `<button class="tile" data-t="${t}">${t}</button>`).join('')}</div>`;
    this.frame(T, { say, prompt, visual, body, cls: 'seq ' + cls });
    const slots = $$('.slot', UI.scr), tl = $$('.tile', UI.scr);
    let wrong = 0;
    await T.defer(resolve => {
      let i = 0, done = false;
      this.cur = { kind: 'seq', root: UI.scr, solve: () => { if (!this.armed()) return false; const t = tl.find(x => !x.classList.contains('used') && x.dataset.t === tokens[i]); if (t) t.click(); return !!t; } };
      tl.forEach(t => t.addEventListener('click', () => {
        if (done || t.classList.contains('used') || !this.armed()) return;
        if (t.dataset.t === tokens[i]) {
          t.classList.add('used'); slots[i].textContent = t.dataset.t; slots[i].classList.add('filled'); Sound.pop();
          if (onTile) onTile(t.dataset.t); i++;
          if (i === tokens.length) { done = true; UI.lock(); resolve(); }
        } else {
          wrong++; Sound.bad(); t.classList.add('shake'); setTimeout(() => t.classList.remove('shake'), 450);
        }
      }));
    });
    await this.win(T, $('.slots', UI.scr));
    return wrong === 0;
  },

  /* Tap each object to count it out loud. */
  async count(T, { emoji, n, prompt = 'Tap each one and count!' }) {
    const fs = n <= 5 ? 100 : n <= 10 ? 80 : n <= 15 ? 66 : 56;
    const body = `<div class="objs" style="font-size:${fs}px">${Array.from({ length: n }, () => `<button class="obj">${emoji}<i></i></button>`).join('')}</div>`;
    this.frame(T, { say: 'Tap each one and count!', prompt, body });
    const els = $$('.obj', UI.scr);
    await T.defer(resolve => {
      let c = 0;
      this.cur = { kind: 'count', root: UI.scr, solve: () => { if (!this.armed()) return false; const e = els.find(x => !x.classList.contains('done')); if (e) e.click(); return !!e; } };
      els.forEach(b => b.addEventListener('click', () => {
        if (!this.armed() || b.classList.contains('done')) return;
        b.classList.add('done'); c++; b.querySelector('i').textContent = c; Sound.pop(); Sound.speak(String(c), { rate: 0.9 });
        if (c === n) { UI.lock(); setTimeout(resolve, 450 * TIME); }
      }));
    });
  },
  staticObjs(emoji, n) {
    const fs = n <= 5 ? 90 : n <= 10 ? 70 : n <= 15 ? 58 : 50;
    return `<div class="objs static" style="font-size:${fs}px">${Array.from({ length: n }, () => `<span class="obj">${emoji}</span>`).join('')}</div>`;
  },

  /* "Give me 4 apples": tap exactly n objects out of a pile. */
  async tapN(T, { obj, total, n }) {
    const fs = total <= 8 ? 84 : total <= 12 ? 70 : 58;
    const body = `<div class="objs" style="font-size:${fs}px">${Array.from({ length: total }, () => `<button class="obj">${obj.e}<i></i></button>`).join('')}</div>`;
    this.frame(T, { say: `Tap ${n} ${n === 1 ? obj.n : obj.p}`, prompt: `Tap ${n} ${n === 1 ? obj.n : obj.p}`, body });
    const els = $$('.obj', UI.scr);
    await T.defer(resolve => {
      let c = 0;
      this.cur = { kind: 'tapn', root: UI.scr, solve: () => { if (!this.armed()) return false; const e = els.find(x => !x.classList.contains('done')); if (e) e.click(); return !!e; } };
      els.forEach(b => b.addEventListener('click', () => {
        if (!this.armed() || b.classList.contains('done') || c >= n) return;
        b.classList.add('done'); c++; b.querySelector('i').textContent = c; Sound.pop(); Sound.speak(String(c), { rate: 0.9 });
        if (c === n) { UI.lock(); setTimeout(resolve, 350 * TIME); }
      }));
    });
    await this.win(T, $('.objs', UI.scr));
  },

  /* Trace text with a finger. Done when about 70% is covered; a skip arrow appears if the child is stuck. */
  async trace(T, { say, prompt, text, W = 600, H = 600, brush = 34 }) {
    this.frame(T, { say, prompt, body: '<div id="tbox"></div>', cls: 'tracing' });
    const box = $('#tbox', UI.scr);
    await T.defer(resolve => {
      const c = document.createElement('canvas'); c.width = W; c.height = H; box.appendChild(c);
      const ctx = c.getContext('2d');
      const font = '"Arial Rounded MT Bold","Helvetica Neue",Arial,sans-serif';
      ctx.font = `bold 100px ${font}`;
      const m = ctx.measureText(text);
      const h = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) || 70, w = m.width || 60;
      const size = Math.floor(100 * Math.min((H * 0.7) / h, (W * 0.8) / w));
      ctx.font = `bold ${size}px ${font}`;
      const m2 = ctx.measureText(text);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const x = W / 2, y = H / 2 + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2;
      const mask = document.createElement('canvas'); mask.width = W; mask.height = H;
      const mc = mask.getContext('2d'); mc.font = ctx.font; mc.textAlign = 'center'; mc.fillText(text, x, y);
      const d = mc.getImageData(0, 0, W, H).data, pts = [], step = Math.max(10, Math.round(brush * 0.45));
      for (let py = 0; py < H; py += step) for (let px = 0; px < W; px += step) if (d[(py * W + px) * 4 + 3] > 128) pts.push({ x: px, y: py, hit: false });
      ctx.fillStyle = '#ffe9a8'; ctx.fillText(text, x, y);
      ctx.lineWidth = 6; ctx.setLineDash([14, 12]); ctx.strokeStyle = '#e0a100'; ctx.strokeText(text, x, y); ctx.setLineDash([]);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = brush; ctx.strokeStyle = '#ff6b6b';

      let last = null, done = false, hits = 0;
      const finish = () => { if (done) return; done = true; UI.lock(); setTimeout(resolve, 150 * TIME); };
      this.cur = { kind: 'trace', root: UI.scr, solve: () => { finish(); return true; } };
      if (pts.length < 5) { finish(); return; }                   // font failed to draw: never trap the child
      const pos = e => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
      const mark = p => { const R = brush * 0.9; for (const q of pts) if (!q.hit && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < R * R) { q.hit = true; hits++; } };
      c.addEventListener('pointerdown', e => {
        if (done) return;
        try { c.setPointerCapture(e.pointerId); } catch (err) {}
        last = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(last.x + 0.1, last.y); ctx.stroke(); mark(last); e.preventDefault();
      });
      c.addEventListener('pointermove', e => {
        if (!last || done) return;
        const p = pos(e);
        ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        const n = Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 8);
        for (let i = 1; i <= n; i++) mark({ x: last.x + (p.x - last.x) * i / n, y: last.y + (p.y - last.y) * i / n });
        last = p; if (hits / pts.length >= 0.7) finish(); e.preventDefault();
      });
      ['pointerup', 'pointercancel'].forEach(t => c.addEventListener(t, () => { last = null; }));
      setTimeout(() => {                                          // gentle escape hatch
        if (done || !box.isConnected) return;
        const b = document.createElement('button'); b.className = 'skip'; b.textContent = '➡'; b.setAttribute('aria-label', 'Skip');
        b.onclick = finish; box.appendChild(b);
      }, 10000 * TIME);
    });
    await this.win(T, box, 'small');
  },

  /* A simple screen with a button. Taps in the first moments are ignored so a double-tap can't skip it. */
  async card(T, { say, html, button = 'Next ➡', cls = '', size = 'normal', burst = false }) {
    UI.show(`<div class="q card ${cls}">${html}<button class="bigbtn" id="cardBtn">${button}</button></div>`);
    const at = performance.now() + 600 * TIME;
    UI.bubble('🌟');
    if (say) this.say(say);
    if (burst) celebrate($('.q', UI.scr), size);
    await T.defer(resolve => {
      const b = $('#cardBtn');
      this.cur = { kind: 'card', root: UI.scr, solve: () => { if (performance.now() < at) return false; b.click(); return true; } };
      b.addEventListener('click', () => { if (performance.now() >= at) { UI.lock(); resolve(); } });
    });
  },
};
