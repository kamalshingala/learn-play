'use strict';
/* Visual themes: a painted background, a colour palette, a mascot and themed sparkles.
   All scenery is drawn here as simple SVG, so there are no image files to load.
   "My pictures": put your own theme/background.jpg and/or theme/mascot.png in the repo and a
   extra theme appears for them. */

const svg = inner => `<svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const cloud = (x, y, s = 1, o = 0.92) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity="${o}"><circle cx="40" cy="44" r="28"/><circle cx="78" cy="30" r="36"/><circle cx="118" cy="46" r="26"/><rect x="30" y="46" width="104" height="26" rx="13"/></g>`;
const flower = (x, y, c) => `<g><path d="M${x} ${y} v28" stroke="#3f9f45" stroke-width="4"/><circle cx="${x}" cy="${y}" r="10" fill="${c}"/><circle cx="${x}" cy="${y}" r="4.5" fill="#ffd43b"/></g>`;
const fish = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse rx="40" ry="24" fill="${c}"/><polygon points="-34,0 -72,-24 -72,24" fill="${c}"/><circle cx="20" cy="-6" r="5" fill="#fff"/><circle cx="21" cy="-6" r="2.5" fill="#333"/></g>`;
const leaf = (x, y, a) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M0 0 q-70 -10 -100 40 q60 -10 100 -40z" fill="#2fa84f"/>`;
function stars(n, seed, maxY = 780) {              // the same twinkles every time
  let s = seed, out = '';
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) out += `<circle cx="${(r() * 1200) | 0}" cy="${(r() * maxY) | 0}" r="${(1.5 + r() * 3).toFixed(1)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
  return out;
}

const THEMES = [
  { id: 'meadow', name: 'Sunny Meadow', icon: '🌻', mascot: '🐥', fx: ['💖', '✨', '🌼', '🌟', '💛', '🦋'],
    bg: ['#bfe8ff', '#eaf9d6'], pal: { coral: '#ff6b6b', sky: '#4dabf7', mint: '#40c057', grape: '#9775fa' },
    scene: () => svg(`<defs><radialGradient id="sg"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#fff3a0" stop-opacity="0"/></radialGradient></defs>
      <circle cx="1030" cy="130" r="170" fill="url(#sg)"/><circle cx="1030" cy="130" r="60" fill="#ffd43b"/>
      <path d="M0 640 Q250 500 520 620 T1200 580 V800 H0Z" fill="#a8e58a"/>
      <g transform="translate(120 548)"><rect width="130" height="96" fill="#e8504f"/><path d="M-12 0 L65 -56 L142 0Z" fill="#b83a3a"/><rect x="45" y="36" width="40" height="60" fill="#fff" opacity=".92"/><path d="M45 36 L85 96 M85 36 L45 96" stroke="#e8504f" stroke-width="4"/></g>
      <path d="M0 710 Q300 580 640 700 T1200 670 V800 H0Z" fill="#74d46a"/>
      <path d="M0 770 Q350 690 700 760 T1200 740 V800 H0Z" fill="#52c25e"/>
      ${flower(330, 735, '#ff8fab')}${flower(420, 752, '#ffffff')}${flower(780, 740, '#ffa94d')}${flower(880, 758, '#ff8fab')}${flower(1090, 725, '#ffffff')}${flower(90, 760, '#ffa94d')}`),
    sky: () => svg(cloud(100, 110, 1.1) + cloud(520, 50, 0.8) + cloud(840, 250, 1)) },

  { id: 'ocean', name: 'Under the Sea', icon: '🐠', mascot: '🐙', fx: ['💙', '✨', '💧', '⭐', '🐠', '🐚'],
    bg: ['#c2f0ff', '#6cc6e6'], pal: { coral: '#ff7b54', sky: '#2f9fd8', mint: '#2fbf8f', grape: '#7b6cf6' },
    scene: () => svg(`<g fill="#fff" opacity=".14"><polygon points="190,0 330,0 530,800 270,800"/><polygon points="560,0 650,0 820,800 600,800"/><polygon points="900,0 1010,0 1110,800 880,800"/></g>
      <path d="M0 650 Q150 610 300 650 T600 650 T900 650 T1200 650 V800 H0Z" fill="#1c94c8" opacity=".35"/>
      <path d="M0 700 Q150 665 300 700 T600 700 T900 700 T1200 700 V800 H0Z" fill="#1c94c8" opacity=".4"/>
      <path d="M0 745 Q300 705 600 740 T1200 725 V800 H0Z" fill="#f4dc9a"/>
      <g fill="none" stroke="#2fbf71" stroke-width="14" stroke-linecap="round"><path d="M110 750 q-28 -50 0 -95 q28 -45 0 -92"/><path d="M150 752 q24 -40 0 -78 q-22 -34 0 -70"/><path d="M1070 750 q-28 -50 0 -95 q28 -45 0 -92"/></g>
      <polygon points="900,712 912,740 944,742 920,762 928,792 900,776 872,792 880,762 856,742 888,740" fill="#ff9f43"/>
      ${fish(260, 400, 1, '#ff9f43')}${fish(930, 290, 0.8, '#ff6b9d')}${fish(1010, 520, 1.2, '#ffd43b')}`),
    sky: () => svg(`<g fill="none" stroke="#fff" stroke-width="3" opacity=".75"><circle cx="160" cy="620" r="16"/><circle cx="195" cy="540" r="9"/><circle cx="140" cy="470" r="12"/><circle cx="720" cy="600" r="14"/><circle cx="750" cy="500" r="8"/><circle cx="1110" cy="610" r="18"/><circle cx="1085" cy="520" r="10"/><circle cx="430" cy="300" r="10"/></g>`) },

  { id: 'space', name: 'Space Adventure', icon: '🚀', mascot: '👽', fx: ['✨', '⭐', '🌟', '💫', '🪐', '💜'],
    bg: ['#aebcff', '#e9d8ff'], pal: { coral: '#ff5d8f', sky: '#5b7cfa', mint: '#2fc58a', grape: '#8a5cf5' },
    scene: () => svg(`${stars(46, 7)}
      <g transform="translate(170 190)"><circle r="64" fill="#ff9a76"/><circle cx="-18" cy="-14" r="14" fill="#f4805a"/><ellipse rx="112" ry="22" fill="none" stroke="#ffe2b8" stroke-width="10" transform="rotate(-18)"/></g>
      <g transform="translate(1030 640)"><circle r="96" fill="#7fd6c2"/><circle cx="-30" cy="-20" r="20" fill="#5fc1ab"/><circle cx="34" cy="30" r="14" fill="#5fc1ab"/></g>
      <path d="M1000 80 a62 62 0 1 0 0 124 a50 50 0 1 1 0 -124z" fill="#fff6c9"/>
      <g transform="translate(310 600) rotate(32)"><path d="M0 -90 q38 40 30 120 h-60 q-8 -80 30 -120z" fill="#fff"/><circle cy="-20" r="15" fill="#4dabf7"/><path d="M-30 30 l-26 34 l26 -8z M30 30 l26 34 l-26 -8z" fill="#ff5d8f"/><path d="M-14 36 q14 46 28 0z" fill="#ffb84d"/></g>`),
    sky: () => svg(stars(24, 31, 500)) },

  { id: 'dino', name: 'Dino Land', icon: '🦖', mascot: '🦖', fx: ['🌟', '✨', '🦕', '🍃', '💚', '⭐'],
    bg: ['#ffe6a6', '#d9f6bc'], pal: { coral: '#f2683c', sky: '#3fa7d6', mint: '#3bb54a', grape: '#9b6bd6' },
    scene: () => svg(`<circle cx="150" cy="130" r="58" fill="#ffb347"/><circle cx="150" cy="130" r="86" fill="#ffb347" opacity=".25"/>
      <path d="M770 800 L930 350 L1020 350 L1190 800Z" fill="#a8704a"/><path d="M930 350 q45 -34 90 0 q-24 28 -44 14 q-22 14 -46 -14z" fill="#ff6a3d"/>
      <path d="M958 364 q-8 60 -30 110" stroke="#ff6a3d" stroke-width="10" fill="none" stroke-linecap="round"/>
      <g fill="#c9c9c9" opacity=".6"><circle cx="975" cy="300" r="26"/><circle cx="1010" cy="262" r="34"/><circle cx="1060" cy="222" r="26"/></g>
      <path d="M0 650 Q300 550 620 660 T1200 650 V800 H0Z" fill="#9edb62"/>
      <g transform="translate(150 700)"><path d="M0 0 V-120" stroke="#7a5230" stroke-width="12"/>${leaf(0, -120, 0)}${leaf(0, -120, 40)}<path transform="translate(0 -120) scale(-1 1)" d="M0 0 q-70 -10 -100 40 q60 -10 100 -40z" fill="#2fa84f"/></g>
      <path d="M0 735 Q400 655 800 745 T1200 725 V800 H0Z" fill="#62bd4c"/>
      <g fill="#fff8e6" stroke="#e6d6a8" stroke-width="3"><ellipse cx="520" cy="760" rx="34" ry="42"/><ellipse cx="600" cy="772" rx="28" ry="36"/></g><g fill="#7fd06a"><circle cx="510" cy="752" r="7"/><circle cx="532" cy="772" r="6"/><circle cx="598" cy="766" r="6"/></g>`),
    sky: () => svg(cloud(380, 90, 1) + cloud(700, 200, 0.8)) },

  { id: 'candy', name: 'Rainbow Sky', icon: '🌈', mascot: '🦄', fx: ['💖', '🌈', '✨', '🍭', '💜', '⭐'],
    bg: ['#ffd9ee', '#d9ecff'], pal: { coral: '#ff6fa5', sky: '#6aa8ff', mint: '#4cd0a0', grape: '#b57bff' },
    scene: () => svg(`${['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'].map((c, i) => { const r = 520 - i * 30; return `<path d="M${600 - r} 800 A${r} ${r} 0 0 1 ${600 + r} 800" stroke="${c}" stroke-width="30" fill="none" opacity=".7"/>`; }).join('')}
      <path d="M0 700 Q300 620 620 700 T1200 690 V800 H0Z" fill="#ffc9e3"/><path d="M0 760 Q400 690 800 760 T1200 745 V800 H0Z" fill="#bfe6ff"/>
      <g><path d="M120 560 v170" stroke="#fff" stroke-width="8"/><circle cx="120" cy="540" r="44" fill="#ff8fc0"/><path d="M120 540 m-24 0 a24 24 0 1 1 24 24 a12 12 0 1 1 -12 -12" stroke="#fff" stroke-width="7" fill="none"/></g>
      <g><path d="M1090 590 v140" stroke="#fff" stroke-width="8"/><circle cx="1090" cy="570" r="38" fill="#9ad0ff"/><path d="M1090 570 m-20 0 a20 20 0 1 1 20 20 a10 10 0 1 1 -10 -10" stroke="#fff" stroke-width="6" fill="none"/></g>`),
    sky: () => svg(cloud(80, 140, 1) + cloud(850, 90, 1.1) + cloud(480, 230, 0.7)) },

  { id: 'classic', name: 'Teddy Day', icon: '🐻', mascot: '🐻', fx: ['💖', '✨', '⭐', '💛', '🌟', '💕'],
    bg: ['#c4e9ff', '#fff8e1'], pal: { coral: '#ff6b6b', sky: '#4dabf7', mint: '#40c057', grape: '#9775fa' },
    scene: () => '', sky: null },

  // shown only when you add your own theme/background.jpg or theme/mascot.png
  { id: 'mine', name: 'My Pictures', icon: '📷', mascot: '🐻', fx: ['💖', '✨', '⭐', '💛', '🌟', '💕'],
    bg: ['#c4e9ff', '#fff8e1'], pal: { coral: '#ff6b6b', sky: '#4dabf7', mint: '#40c057', grape: '#9775fa' },
    scene: () => '', sky: null },
];

function shade(hex, amt) {                          // a darker (or lighter) version of a colour, for button edges
  const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * (1 + amt))));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join('');
}

const Theme = {
  id: 'meadow', custom: { bg: false, mascot: false },
  list() { return THEMES.filter(t => t.id !== 'mine' || this.custom.bg || this.custom.mascot); },
  get() { return THEMES.find(t => t.id === this.id) || THEMES[0]; },
  mascotHTML() { return this.id === 'mine' && this.custom.mascot ? '<img src="theme/mascot.png" alt="">' : this.get().mascot; },
  apply(id) {
    let t = THEMES.find(x => x.id === id) || THEMES[0];
    if (t.id === 'mine' && !(this.custom.bg || this.custom.mascot)) t = THEMES[0];
    this.id = t.id;
    const r = document.documentElement.style;
    r.setProperty('--bg1', t.bg[0]); r.setProperty('--bg2', t.bg[1]);
    Object.entries(t.pal).forEach(([k, v]) => r.setProperty('--' + k, v));
    r.setProperty('--coral-d', shade(t.pal.coral, -0.22)); r.setProperty('--sky-d', shade(t.pal.sky, -0.22));
    document.body.dataset.theme = t.id;
    const sc = $('#scene'), sk = $('#sky');
    sc.innerHTML = t.scene(); sk.innerHTML = t.sky ? `<div class="drift">${t.sky()}</div>` : '';
    sc.style.backgroundImage = t.id === 'mine' && this.custom.bg ? 'url(theme/background.jpg)' : '';
    FX.EMOJI = t.fx;
    const m = $('#mascot'); if (m) m.innerHTML = this.mascotHTML();
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = t.bg[0];
  },
  probe(then) {                                     // is there a theme/background.jpg or theme/mascot.png?
    const test = (src, key) => { const im = new Image(); im.onload = () => { this.custom[key] = true; then && then(); }; im.src = src; };
    test('theme/background.jpg', 'bg'); test('theme/mascot.png', 'mascot');
  },
};
