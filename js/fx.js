'use strict';
/* Celebration effects: hearts, sparkles, stars and confetti drawn on one canvas. */
const FX = {
  cv: null, ctx: null, parts: [], raf: 0, dpr: 1, timers: [],
  COLORS: ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#9775fa', '#ff8787', '#ffa94d'],
  init() {
    this.cv = $('#fx'); this.ctx = this.cv.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
  },
  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = innerWidth, h = innerHeight;
    this.cv.width = Math.round(w * this.dpr); this.cv.height = Math.round(h * this.dpr);
    this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
  },
  add(p) {
    if (this.parts.length > 280) this.parts.shift();
    p.t = 0; this.parts.push(p);
    if (!this.raf) this.raf = requestAnimationFrame(() => this.loop());
  },
  burst(x, y, n = 36, power = 1) {              // hearts, sparkles and stars exploding from a point
    const chars = ['💖', '💗', '✨', '⭐', '💛', '🌟', '💕', '✨'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (2 + Math.random() * 6) * power;
      this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.5 * power, g: 0.13, drag: 0.985,
                 max: 60 + Math.random() * 50, size: 18 + Math.random() * 26, rot: 0, vr: (Math.random() - 0.5) * 0.2, ch: rand(chars) });
    }
  },
  hearts(x, y, n = 10) {                        // hearts that float gently upwards
    for (let i = 0; i < n; i++) {
      this.add({ x: x + (Math.random() - 0.5) * 140, y: y + Math.random() * 30, vx: (Math.random() - 0.5) * 1.2, vy: -(1.4 + Math.random() * 2.4),
                 g: -0.01, drag: 0.995, max: 90 + Math.random() * 60, size: 22 + Math.random() * 24, rot: 0, vr: 0,
                 ch: rand(['💖', '💗', '💕', '❤️', '💝']), sway: Math.random() * 6 });
    }
  },
  confetti(n = 60) {
    for (let i = 0; i < n; i++) {
      this.add({ x: Math.random() * innerWidth, y: -20 - Math.random() * 120, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3.5,
                 g: 0.04, drag: 0.998, max: 150 + Math.random() * 60, size: 8 + Math.random() * 8, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
                 col: rand(this.COLORS), sway: Math.random() * 6 });
    }
  },
  fireworks() {                                  // a few bursts around the screen
    [0, 260, 520, 800, 1100].forEach(d => {
      this.timers.push(setTimeout(() => this.burst(innerWidth * (0.15 + Math.random() * 0.7), innerHeight * (0.15 + Math.random() * 0.4), 34, 1.3), d * TIME));
    });
  },
  loop() {
    const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, innerWidth, innerHeight);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const live = [];
    for (const p of this.parts) {
      p.t++; if (p.t > p.max) continue;
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx + (p.sway ? Math.sin(p.t / 9 + p.sway) * 0.8 : 0); p.y += p.vy; p.rot += p.vr;
      const k = p.t / p.max;
      c.globalAlpha = k > 0.7 ? Math.max(0, (1 - k) / 0.3) : 1;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      if (p.ch) { const s = p.size * (k < 0.15 ? 0.5 + k / 0.3 : 1); c.font = `${s}px serif`; c.fillText(p.ch, 0, 0); }
      else { c.fillStyle = p.col; c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
      c.restore();
      live.push(p);
    }
    c.globalAlpha = 1; this.parts = live;
    this.raf = live.length ? requestAnimationFrame(() => this.loop()) : 0;
  },
  clear() {
    this.timers.forEach(clearTimeout); this.timers = []; this.parts = [];
    if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0;
    if (this.ctx) this.ctx.clearRect(0, 0, innerWidth, innerHeight);
  },
};

const CHEERS = ['Great job!', 'You did it!', 'Amazing!', 'Super star!', 'Wow, well done!', 'Brilliant!'];

/* One call for every "right answer" moment. size: small | normal | big */
function celebrate(el, size = 'normal') {
  let x = innerWidth / 2, y = innerHeight / 2;
  if (el && el.getBoundingClientRect) { const r = el.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
  if (size === 'small') { FX.burst(x, y, 18, 0.8); FX.hearts(x, y, 6); }
  else if (size === 'big') { FX.burst(x, y, 60, 1.3); FX.hearts(x, y, 24); FX.confetti(120); FX.fireworks(); }
  else { FX.burst(x, y, 38, 1); FX.hearts(x, y, 14); FX.confetti(55); }
  Sound.yay(size);
  if (size !== 'small') Sound.cheer();
  UI.mascot('🥳', 1300);
  UI.bubble(rand(CHEERS));
}
