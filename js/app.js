'use strict';
/* Saved progress, levels, badges, the daily mission and every screen. */

const KEY = 'learnplay.v3';
let S = null;

function freshState() {
  const prog = {};
  CATS.forEach(c => { prog[c.id] = {}; [1, 2, 3].forEach(l => { prog[c.id][l] = { n: 0, sets: 0 }; }); });
  return { v: 3, streak: 0, lastDay: '', missions: 0, stickers: [], badges: {}, prog,
           opts: { unlockAll: false, trace: true, setSize: 5, lens: [], fams: [] } };
}
function load() {
  S = freshState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const r = JSON.parse(raw); Object.assign(S, r); S.opts = Object.assign(freshState().opts, r.opts || {}); }
    else {                                     // carry over the old version's streak and stickers
      const old = JSON.parse(localStorage.getItem('learnplay.v1') || 'null');
      if (old) { S.streak = old.streak || 0; S.lastDay = old.lastDay || ''; S.stickers = old.stickers || []; }
    }
  } catch (e) {}
  const base = freshState().prog;
  S.prog = S.prog || {};
  CATS.forEach(c => { S.prog[c.id] = S.prog[c.id] || {}; [1, 2, 3].forEach(l => { S.prog[c.id][l] = Object.assign({}, base[c.id][l], S.prog[c.id][l]); }); });
  if (![3, 5, 8].includes(S.opts.setSize)) S.opts.setSize = 5;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------------- levels & badges ---------------- */
const sets = (c, l) => S.prog[c][l].sets;
const unlocked = (c, l) => S.opts.unlockAll || l === 1 || sets(c, l - 1) > 0;
const curLevel = c => { for (let l = 1; l <= 3; l++) if (sets(c, l) === 0) return l; return 3; };
function award(id) {
  if (S.badges[id]) return null;
  S.badges[id] = Date.now(); save();
  return BADGES.find(b => b.id === id) || null;
}
function completeSet(cat, lvl) { S.prog[cat][lvl].sets++; const b = award(`${cat}-${lvl}`); save(); return b; }

/* ---------------- choosing and running questions ---------------- */
const Run = {
  last: {},
  pick(cat, lvl) {
    const list = GEN[cat][lvl], key = cat + lvl, r = this.last[key] || (this.last[key] = []);
    let c = list.filter(g => !r.includes(g.id)); if (!c.length) c = list;
    const g = rand(c); r.push(g.id); while (r.length > Math.min(2, list.length - 1)) r.shift();
    return g;
  },
  async question(T, cat, lvl) {
    for (let tries = 0; tries < 4; tries++) {
      const g = this.pick(cat, lvl);
      try { await g.fn(T, Q, { cat, lvl }); return; }
      catch (e) { if (e === ABORT) throw e; console.error('question failed:', cat, lvl, g.id, e); }
    }
  },
};

async function playSet(T, cat, lvl) {
  const total = S.opts.setSize; Q.dots = { n: 0, total };
  for (let i = 0; i < total; i++) { await Run.question(T, cat, lvl); Q.dots.n = i + 1; }
  Q.dots = { n: 0, total: 0 };
  const b = completeSet(cat, lvl); UI.stats();
  return b;
}
function badgeHTML(b, big) { return `<div class="badge ${big ? 'big new' : ''}"><span class="medal">${b.icon}</span>${b.tag ? `<span class="tag">${b.tag}</span>` : ''}</div>`; }

async function setEnd(T, cat, lvl, badge) {
  const C = CATS.find(c => c.id === cat), L = LEVELS[lvl - 1], canNext = lvl < 3 && unlocked(cat, lvl + 1);
  UI.show(`<div class="q card"><div class="prompt">${badge ? 'You earned a new badge!' : 'Set complete!'}</div>
    ${badgeHTML({ icon: L.medal, tag: C.icon }, true)}<div class="prompt">${C.label} · ${L.name}</div>
    <div class="row">${canNext ? `<button class="bigbtn" data-a="next">Level ${lvl + 1} ➡</button>` : ''}
    <button class="bigbtn alt" data-a="again">🔁 Again</button><button class="bigbtn alt" data-a="home">🏠 Home</button></div></div>`);
  const at = performance.now() + 900 * TIME;
  Q.say(badge ? `Hooray! You earned the ${C.label} ${L.name} badge!` : 'Well done! You finished the set!');
  celebrate($('.badge', UI.scr), 'big');
  return T.defer(resolve => {
    const bs = $$('[data-a]', UI.scr);
    Q.cur = { kind: 'card', root: UI.scr, solve: () => { if (performance.now() < at) return false; bs[0].click(); return true; } };
    bs.forEach(b => b.addEventListener('click', () => { if (performance.now() >= at) { UI.lock(); resolve(b.dataset.a); } }));
  });
}
async function practice(T, cat, lvl) {
  UI.homeBtn(true);
  for (;;) {
    const b = await playSet(T, cat, lvl);
    const a = await setEnd(T, cat, lvl, b);
    if (a === 'home') return go.home();
    if (a === 'next') lvl++;
  }
}

async function mission(T) {
  UI.homeBtn(true);
  const ids = CATS.map(c => c.id), order = [...shuffle(ids), ...shuffle(ids)], earned = [];
  Q.dots = { n: 0, total: order.length };
  for (let i = 0; i < order.length; i++) {
    const cat = order[i], lvl = curLevel(cat);
    await Run.question(T, cat, lvl);
    Q.dots.n = i + 1;
    const p = S.prog[cat][lvl]; p.n++;
    if (p.n >= S.opts.setSize) { p.n = 0; const b = completeSet(cat, lvl); if (b) earned.push(b); }
    save();
  }
  Q.dots = { n: 0, total: 0 };
  const t = today();
  if (S.lastDay !== t) {
    const y = new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
    S.streak = S.lastDay === y ? S.streak + 1 : 1; S.lastDay = t;
  }
  S.missions++;
  [['first', 0], ['streak-3', 3], ['streak-7', 7], ['streak-14', 14]].forEach(([id, n]) => { if (id === 'first' || S.streak >= n) { const b = award(id); if (b) earned.push(b); } });
  const st = STICKERS[S.stickers.length % STICKERS.length]; S.stickers.push(st); save(); UI.stats();
  for (const b of earned)
    await Q.card(T, { say: `You earned a new badge! ${b.title}`, burst: true, size: 'big', button: 'Yay! ➡',
      html: `<div class="prompt">New badge!</div>${badgeHTML(b, true)}<div class="prompt">${b.title}</div>` });
  await Q.card(T, { say: 'Mission complete! You earned a new sticker!', burst: true, size: 'big', button: 'Yay! ➡',
    html: `<div class="prompt">Mission complete! 🎉</div><div class="pic huge bounce">${st}</div><div class="prompt">New sticker! &nbsp; 🔥 ${S.streak} day${S.streak === 1 ? '' : 's'}</div>` });
  go.home();
}

/* ---------------- screens ---------------- */
function onTap(el, fn, delay = 400) {          // taps in the first moments are ignored, so a double-tap can't jump screens
  const at = performance.now() + delay * TIME;
  el.addEventListener('click', e => { if (performance.now() >= at) fn(e); });
}

const go = {
  home() {
    Flow.begin(); UI.homeBtn(false); UI.stats();
    const played = S.lastDay === today();
    UI.bubble(played ? 'Welcome back! 🎉' : 'Hi! Ready to play?');
    UI.show(`<div class="home">
      <button class="bigbtn pulse" id="mission">${played ? '▶ Play again' : '▶ Today’s mission'}</button>
      <div class="cats">${CATS.map(c => `<button class="cat" data-c="${c.id}" style="--c:${c.color}"><span class="ci">${c.icon}</span><b>${c.label}</b>
        <span class="stars">${LEVELS.map(l => (sets(c.id, l.n) ? `<span>${l.medal}</span>` : '<span class="off">○</span>')).join('')}</span></button>`).join('')}</div>
      <button class="mini wide" id="book">🏅 My badges &amp; stickers</button>
      <button id="gear" aria-label="Grown-ups: press and hold">⚙️</button></div>`);
    onTap($('#mission'), () => { Sound.unlock(); Flow.run(T => mission(T)); });
    $$('.cat').forEach(b => onTap(b, () => go.levels(b.dataset.c)));
    onTap($('#book'), () => go.book());
    let tm = 0; const g = $('#gear');
    g.onpointerdown = () => { tm = setTimeout(() => go.parent(), 1500); };
    ['onpointerup', 'onpointerleave', 'onpointercancel'].forEach(ev => { g[ev] = () => clearTimeout(tm); });
  },

  levels(cat) {
    Flow.begin(); UI.homeBtn(true);
    const C = CATS.find(c => c.id === cat);
    UI.bubble('Pick a level');
    UI.show(`<div class="q"><div class="prompt">${C.icon} ${C.label}</div><div class="lvls">${LEVELS.map(L => {
      const ok = unlocked(cat, L.n), p = S.prog[cat][L.n];
      return `<button class="lvl ${ok ? '' : 'locked'}" data-l="${L.n}" ${ok ? '' : 'disabled'}><span class="medal">${p.sets ? L.medal : ok ? '⭐' : '🔒'}</span><b>Level ${L.n}</b><small>${L.name}</small>
        <small>${p.sets ? `Sets done: ${p.sets}` : ok ? 'Not played yet' : `Finish level ${L.n - 1} first`}</small>
        <span class="bar"><i style="width:${Math.min(100, p.n / S.opts.setSize * 100)}%"></i></span></button>`;
    }).join('')}</div></div>`);
    $$('.lvl').forEach(b => onTap(b, () => { Sound.unlock(); Flow.run(T => practice(T, cat, +b.dataset.l)); }));
  },

  book() {
    Flow.begin(); UI.homeBtn(true); UI.stats();
    const got = Object.keys(S.badges).length;
    UI.bubble('Look what you won!');
    UI.show(`<div class="book"><h2>My badges <small>${got} of ${BADGES.length}</small></h2>
      <div class="badges">${BADGES.map(b => `<button class="bdg ${S.badges[b.id] ? 'got' : ''}" data-id="${b.id}"><span class="medal">${b.icon}</span>${b.tag ? `<span class="tag">${b.tag}</span>` : ''}<small>${b.title}</small></button>`).join('')}</div>
      <h2>My stickers <small>${S.stickers.length}</small></h2>
      <div class="stickers">${S.stickers.length ? S.stickers.map(s => `<span>${s}</span>`).join('') : '<p>Finish today’s mission to win your first sticker!</p>'}</div></div>`, 'top');
    $$('.bdg').forEach(b => b.addEventListener('click', () => {
      const x = BADGES.find(y => y.id === b.dataset.id);
      Sound.speak(S.badges[x.id] ? `${x.title}. You earned this!` : `${x.title}. ${x.how}`);
    }));
  },

  parent() {
    Flow.begin(); UI.homeBtn(true); UI.bubble('Grown-ups corner');
    const o = S.opts, chip = (on, a, v, label) => `<button class="chip${on ? ' on' : ''}" data-a="${a}"${v === undefined ? '' : ` data-v="${v}"`}>${label}</button>`;
    const famList = Object.keys(FAM_DATA).filter(f => WORDS.some(x => x.f === f && (!o.lens.length || o.lens.includes(x.w.length))));
    const filtered = o.lens.length || o.fams.length;
    const pool = filtered ? WORDS.filter(x => (!o.lens.length || o.lens.includes(x.w.length)) && (!o.fams.length || o.fams.includes(x.f))) : [];
    const st = UI.scr.scrollTop;
    UI.show(`<div class="pnl">
      <section><h3>Levels</h3><div class="chips">${chip(o.unlockAll, 'unlock', undefined, '🔓 Unlock all levels')}</div>
        <div class="hint">Otherwise each level unlocks when the one before it is finished.</div></section>
      <section><h3>Questions in a set</h3><div class="chips">${[3, 5, 8].map(n => chip(o.setSize === n, 'size', n, n)).join('')}</div></section>
      <section><h3>Word practice <small>(optional filter)</small></h3>
        <div class="hint">Word length (none = follow the level):</div>
        <div class="chips">${[2, 3, 4, 5].map(n => chip(o.lens.includes(n), 'len', n, n + ' letters')).join('')}</div>
        <div class="hint">Rhyming families (none = all):</div>
        <div class="chips">${famList.map(f => chip(o.fams.includes(f), 'fam', f, famLabel(f))).join('')}</div>
        <div class="hint">${filtered ? `<b>${pool.length} words:</b> ${pool.slice(0, 70).map(x => x.w).join(', ')}${pool.length > 70 ? ' …' : ''}` : 'No filter: words follow the level.'}</div></section>
      <section><h3>Other</h3><div class="chips">${chip(o.trace, 'trace', undefined, '✏️ Tracing')}${chip(!Sound.muted, 'sound', undefined, '🔊 Sound')}</div></section>
      <section><div class="chips">${chip(false, 'reset', undefined, '🗑 Reset all progress')}</div></section></div>`, 'top');
    UI.scr.scrollTop = st;
    UI.scr.onclick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a, v = b.dataset.v;
      if (a === 'unlock') o.unlockAll = !o.unlockAll;
      else if (a === 'size') o.setSize = +v;
      else if (a === 'trace') o.trace = !o.trace;
      else if (a === 'sound') Sound.setMuted(!Sound.muted), syncMute();
      else if (a === 'len') { const n = +v; o.lens = (o.lens.includes(n) ? o.lens.filter(x => x !== n) : [...o.lens, n]).sort(); o.fams = o.fams.filter(f => WORDS.some(x => x.f === f && (!o.lens.length || o.lens.includes(x.w.length)))); }
      else if (a === 'fam') o.fams = o.fams.includes(v) ? o.fams.filter(f => f !== v) : [...o.fams, v];
      else if (a === 'reset') { if (confirm('Reset all progress and settings?')) { try { localStorage.removeItem(KEY); localStorage.removeItem('learnplay.v1'); } catch (err) {} location.reload(); } return; }
      save(); go.parent();
    };
  },
};

function syncMute() { const m = $('#mute'); m.textContent = Sound.muted ? '🔇' : '🔈'; m.setAttribute('aria-pressed', String(Sound.muted)); }

/* ---------------- start ---------------- */
function boot() {
  try { load(); } catch (e) { console.error(e); S = freshState(); }
  try { Sound.init(); } catch (e) { console.error(e); }
  try { FX.init(); } catch (e) { console.error(e); }
  UI.init(); syncMute();
  $('#homeBtn').addEventListener('click', () => go.home());
  $('#mute').addEventListener('click', () => { Sound.setMuted(!Sound.muted); syncMute(); });
  window.addEventListener('unhandledrejection', e => { if (e.reason === ABORT) e.preventDefault(); });
  if ('serviceWorker' in navigator && !TEST) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (TEST) window.__lp = { Q, Flow, UI, Sound, FX, S: () => S, go, GEN, Run, ABORT, mission, practice, playSet, curLevel, sets, save, load };
  go.home();
}
boot();
