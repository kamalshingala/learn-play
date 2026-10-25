'use strict';
/* Celebration effects. Kept deliberately light: a handful of pre-drawn sprites on a standard-resolution
   canvas, time-based motion, and nothing drawn when nothing is moving. */
const FX = {
  cv: null, ctx: null, parts: [], raf: 0, last: 0, timers: [], sprites: {},
  EMOJI: ['💖', '💗', '✨', '⭐', '💛', '🌟', '💕'],
  COLORS: ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#9775fa', '#ffa94d'],
  MAX: 60,

  init() {
    this.cv = $('#fx'); this.ctx = this.cv.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
    setTimeout(() => { try { this.EMOJI.forEach(e => [30, 44].forEach(s => this.sprite(e, s))); } catch (err) {} }, 400);   // warm the cache while idle
  },
  resize() {                                   // 1 canvas pixel = 1 CSS pixel: 4x cheaper than retina, and these are small shapes anyway
    const w = innerWidth, h = innerHeight;
    this.cv.width = w; this.cv.height = h; this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
  },
  sprite(ch, size) {                           // draw each emoji once, then just copy the picture
    const k = ch + size;
    if (!this.sprites[k]) {
      const c = document.createElement('canvas'), n = Math.round(size * 1.4); c.width = c.height = n;
      const x = c.getContext('2d'); x.font = `${size}px serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, n / 2, n / 2 + size * 0.05);
      this.sprites[k] = c;
    }
    return this.sprites[k];
  },
  add(p) {
    if (this.parts.length >= this.MAX) this.parts.shift();
    p.t = 0; this.parts.push(p);
    if (!this.raf) { this.last = 0; this.raf = requestAnimationFrame(t => this.loop(t)); }
  },
  burst(x, y, n = 9, power = 1) {              // hearts and sparkles popping out of a point
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, sp = (3 + Math.random() * 4) * power;
      this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, g: 0.2, drag: 0.96, max: 34 + Math.random() * 12, spr: this.sprite(rand(this.EMOJI), Math.random() < 0.5 ? 30 : 44) });
    }
  },
  hearts(x, y, n = 5) {                        // hearts drifting upwards
    for (let i = 0; i < n; i++)
      this.add({ x: x + (Math.random() - 0.5) * 120, y: y + Math.random() * 20, vx: (Math.random() - 0.5) * 1.2, vy: -(2 + Math.random() * 2), g: -0.01, drag: 0.99, max: 44 + Math.random() * 14,
                 spr: this.sprite(rand(['💖', '💗', '💕']), 30) });
  },
  confetti(n = 8) {                            // just a few coloured flecks
    for (let i = 0; i < n; i++)
      this.add({ x: Math.random() * innerWidth, y: -10, vx: (Math.random() - 0.5) * 2, vy: 4 + Math.random() * 3, g: 0.1, drag: 0.99, max: 70 + Math.random() * 20,
                 w: 12, h: 7, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, col: rand(this.COLORS) });
  },
  fireworks() {                                // three small bursts (set / badge complete only)
    [0, 280, 560].forEach(d => this.timers.push(setTimeout(() => this.burst(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.2 + Math.random() * 0.35), 10, 1.2), d * TIME)));
  },
  loop(now) {
    const c = this.ctx, dt = this.last ? Math.min(2.5, (now - this.last) / 16.7) : 1;   // time-based, so a slow device just sees fewer frames
    this.last = now;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height);
    const live = [];
    for (const p of this.parts) {
      p.t += dt; if (p.t > p.max) continue;
      p.vx *= Math.pow(p.drag, dt); p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const k = p.t / p.max;
      c.globalAlpha = k > 0.6 ? Math.max(0, (1 - k) / 0.4) : 1;
      if (p.spr) { c.setTransform(1, 0, 0, 1, p.x, p.y); c.drawImage(p.spr, -p.spr.width / 2, -p.spr.height / 2); }
      else { p.rot += p.vr * dt; const cs = Math.cos(p.rot), sn = Math.sin(p.rot); c.setTransform(cs, sn, -sn, cs, p.x, p.y); c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      live.push(p);
    }
    c.globalAlpha = 1; this.parts = live;
    if (live.length) this.raf = requestAnimationFrame(t => this.loop(t));
    else { this.raf = 0; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height); }
  },
  clear() {
    this.timers.forEach(clearTimeout); this.timers = []; this.parts = [];
    if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0;
    if (this.ctx) { this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.clearRect(0, 0, this.cv.width, this.cv.height); }
  },
};

const CHEERS = ['Great job!', 'You did it!', 'Amazing!', 'Super star!', 'Wow, well done!', 'Brilliant!'];

/* One call for every "right answer" moment. size: small | normal | big */
function celebrate(el, size = 'normal') {
  let x = innerWidth / 2, y = innerHeight / 2;
  if (el && el.getBoundingClientRect) { const r = el.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
  if (size === 'small') FX.burst(x, y, 6, 0.8);
  else if (size === 'big') { FX.burst(x, y, 12, 1.2); FX.hearts(x, y, 6); FX.confetti(14); FX.fireworks(); }
  else { FX.burst(x, y, 9, 1); FX.hearts(x, y, 4); FX.confetti(6); }
  Sound.yay(size);
  if (size !== 'small') Sound.cheer();
  UI.mascot('🥳', 1000);
  UI.bubble(rand(CHEERS));
}
