'use strict';
/* Utilities, flow control and sound.
   Flow: every screen/lesson runs inside a "flow". Pressing Home (or starting anything new)
   cancels the old flow, so an old lesson can never wake up later and draw over a new screen. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const rand = a => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const today = () => new Date().toLocaleDateString('en-CA');
const TEST = /[?&]test\b/.test(location.search);
const TIME = TEST && !/[?&]realtime\b/.test(location.search) ? 0.06 : 1;   // automated tests use the same code with shorter pauses
const wait = ms => new Promise(r => setTimeout(r, ms * TIME));

const ABORT = Object.freeze({ abort: true });
const hasTTS = () => { try { return !!(window.speechSynthesis && window.SpeechSynthesisUtterance); } catch (e) { return false; } };

const Flow = {
  id: 0,
  cancelers: new Set(),
  begin() {                                   // start a fresh flow; everything older is cancelled
    this.id++;
    this.cancelers.forEach(c => c());
    this.cancelers.clear();
    Sound.stop(); FX.clear(); UI.reset();
    return this.make(this.id);
  },
  make(id) {
    const T = { id, alive: () => Flow.id === id };
    T.g = p => Promise.resolve(p).then(v => { if (!T.alive()) throw ABORT; return v; });
    T.sleep = ms => T.g(wait(ms));
    T.defer = fn => T.g(new Promise((res, rej) => {     // wait for something (a tap) but die with the flow
      const c = () => rej(ABORT);
      Flow.cancelers.add(c);
      fn(v => { Flow.cancelers.delete(c); res(v); });
    }));
    return T;
  },
  run(fn) {
    const T = this.begin();
    fn(T).catch(e => { if (e !== ABORT) { console.error(e); UI.fatal(); } });
    return T;
  },
};

/* ---------------- Sound ---------------- */
const Sound = {
  muted: false, voice: null, sid: 0, ttsOK: true, started: false, fails: 0,
  ac: null, unlocked: false, audioOK: {}, el: null, noiseBuf: null,

  init() {
    try { this.muted = localStorage.getItem('lp.muted') === '1'; } catch (e) {}
    if (hasTTS()) {
      try { speechSynthesis.onvoiceschanged = () => this.pickVoice(); } catch (e) {}
      this.pickVoice();
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.stop(); });
    // iPad Safari only allows speech/audio once it has been "unlocked" by a real tap.
    const un = () => this.unlock();
    ['pointerdown', 'touchstart', 'click'].forEach(t => document.addEventListener(t, un, { capture: true, passive: true }));
  },
  pickVoice() {
    let vs = [];
    try { vs = speechSynthesis.getVoices() || []; } catch (e) {}
    const ok = v => !/(compact|novelty|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|organ|trinoids|whisper|zarvox|albert|jester|superstar|wobble|fred|junior|ralph)/i.test(v.name);
    this.voice = vs.find(v => v.lang === 'en-AU' && ok(v)) ||
                 vs.find(v => /^en[-_](GB|US|IE|NZ|ZA)/.test(v.lang) && ok(v)) ||
                 vs.find(v => v.lang.startsWith('en')) || null;
  },
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this._ctx();
    try {
      if (hasTTS()) {
        const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u);
      }
    } catch (e) {}
  },
  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('lp.muted', m ? '1' : '0'); } catch (e) {}
    if (m) this.stop();
  },
  stop() {
    this.sid++;
    try { if (hasTTS()) speechSynthesis.cancel(); } catch (e) {}
    try { if (this.el) { this.el.pause(); this.el = null; } } catch (e) {}
  },

  /* Speak text. The promise ALWAYS resolves (never hangs, never rejects). */
  speak(text, o = {}) {
    const my = ++this.sid;
    return new Promise(res => {
      if (this.muted || !text || !hasTTS()) return res();
      const rate = o.rate || 0.85;
      const est = Math.min(8000, 700 + text.length * 80 / rate);
      if (!this.ttsOK) return void setTimeout(res, est * 0.3 * TIME);
      try { speechSynthesis.cancel(); } catch (e) {}
      setTimeout(() => {                          // iOS drops speech started in the same tick as cancel()
        if (my !== this.sid) return res();
        let done = false, began = false, tm = 0;
        const fin = () => {
          if (done) return; done = true; clearTimeout(tm);
          if (!began && my === this.sid && !this.started && ++this.fails >= 3) this.ttsOK = false;
          res();
        };
        tm = setTimeout(fin, (est + 1500) * TIME);
        try {
          const u = new SpeechSynthesisUtterance(text);
          if (this.voice) u.voice = this.voice;
          u.lang = this.voice ? this.voice.lang : 'en-AU';
          u.rate = rate; u.pitch = o.pitch || 1.1; u.volume = 1;
          u.onstart = () => { began = true; this.started = true; this.fails = 0; };
          u.onend = fin; u.onerror = fin;
          speechSynthesis.speak(u);
        } catch (e) { fin(); }
      }, 60);
    });
  },

  /* Play a short recorded file; resolves true if it played, false on any problem. */
  playFile(src) {
    return new Promise(res => {
      if (this.muted) return res(true);
      let done = false;
      const fin = ok => { if (done) return; done = true; clearTimeout(tm); res(ok); };
      const tm = setTimeout(() => fin(false), 4000 * TIME);
      try {
        const a = new Audio(src); this.el = a;
        a.onended = () => fin(true); a.onerror = () => fin(false);
        const p = a.play(); if (p && p.catch) p.catch(() => fin(false));
      } catch (e) { fin(false); }
    });
  },
  /* Letter sound: uses audio/<letter>.mp3 if you add recordings, otherwise speech. */
  async letter(L) {
    this.sid++;
    if (this.audioOK[L.l] !== false) {
      const ok = await this.playFile(`audio/${L.l}.mp3`);
      if (ok) { this.audioOK[L.l] = true; return; }
      this.audioOK[L.l] = false;
    }
    return this.speak(L.say, { rate: 0.6 });
  },
  cheer() { this.speak(rand(['Yay!', 'Hooray!', 'Well done!', 'Super job!', 'Fantastic!', 'You did it!']), { rate: 0.95, pitch: 1.3 }); },

  /* Synthesised effects (no files needed) */
  _ctx() {
    try {
      if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ac.state === 'suspended') this.ac.resume();
      return this.ac;
    } catch (e) { return null; }
  },
  note(f, t, d, { type = 'sine', vol = 0.15, to = 0 } = {}) {
    const ac = this._ctx(); if (!ac || this.muted) return;
    try {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  },
  noise(t, d, vol) {
    const ac = this._ctx(); if (!ac || this.muted) return;
    try {
      if (!this.noiseBuf) { const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; this.noiseBuf = b; }
      const s = ac.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 0.5;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + d * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t); s.stop(t + d + 0.05);
    } catch (e) {}
  },
  pop()  { const ac = this._ctx(); if (ac) this.note(880, ac.currentTime, 0.08, { vol: 0.12 }); },
  bad()  { const ac = this._ctx(); if (ac) { this.note(330, ac.currentTime, 0.16, { type: 'triangle', vol: 0.1 }); this.note(262, ac.currentTime + 0.14, 0.22, { type: 'triangle', vol: 0.1 }); } },
  good() { const ac = this._ctx(); if (ac) [523, 659, 784].forEach((f, i) => this.note(f, ac.currentTime + i * 0.09, 0.25, { type: 'triangle', vol: 0.14 })); },
  yay(size = 'normal') {                       // fanfare + sparkle + crowd cheer
    const ac = this._ctx(); if (!ac) return; const t = ac.currentTime;
    const ns = size === 'small' ? [523, 659, 784] : [523, 659, 784, 1047, 1319];
    ns.forEach((f, i) => this.note(f, t + i * 0.09, 0.3, { type: 'triangle', vol: 0.15 }));
    if (size !== 'small') {
      [1568, 1976, 2349, 2637].forEach((f, i) => this.note(f, t + 0.45 + i * 0.07, 0.22, { vol: 0.06 }));
      this.note(300, t + 0.02, 0.5, { type: 'sine', vol: 0.12, to: 900 });
      this.noise(t + 0.05, size === 'big' ? 1.7 : 0.95, 0.09);
    }
  },
};
