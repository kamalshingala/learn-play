'use strict';
/* Letter-sound questions. GEN[category][level] = list of {id, fn(T, Q, ctx)}. */
const GEN = { sounds: {}, counting: {}, maths: {}, words: {} };

const POOL_SIZE = [0, 6, 12, 24];                       // letters in play at each level
const LP = lvl => LETTERS.slice(0, POOL_SIZE[lvl]);
const up = l => l.toUpperCase();
const itemOf = L => rand(L.items);
const sameSound = (a, b) => a.l === b.l || a.say === b.say;
const mainWord = L => L.items[0];

/* Letters that could be mistaken for L: look-alikes first, then others of a different sound */
function others(L, pool, k, tricky) {
  const pals = tricky ? LOOKALIKES.filter(p => p.includes(L.l)).map(p => p.find(x => x !== L.l)) : [];
  const first = pool.filter(x => pals.includes(x.l) && !sameSound(x, L));
  const rest = shuffle(pool.filter(x => !sameSound(x, L) && !first.includes(x)));
  return [...shuffle(first), ...rest].slice(0, k);
}
const letterOpts = (L, pool, n, tricky, lower = true) =>
  shuffle([{ html: O.letter(lower ? L.l : up(L.l)), ok: true }, ...others(L, pool, n - 1, tricky).map(x => ({ html: O.letter(lower ? x.l : up(x.l)), ok: false }))]);
const picOpts = (L, pool, n) => {
  const it = itemOf(L);
  return { it, opts: shuffle([{ html: O.pic(it[1], it[0]), ok: true }, ...others(L, pool, n - 1, false).map(x => { const w = itemOf(x); return { html: O.pic(w[1], w[0]), ok: false }; })]) };
};
const pickL = (pool) => Q.recent(pool, 'L' + pool.length, x => x.l, 4);

/* Introduce a letter, then trace it */
async function teachTrace(T, Q, c) {
  const pool = LP(c.lvl);
  const L = Math.random() < 0.4 ? pool[pool.length - 1] : pickL(pool);
  const [w, p] = mainWord(L);
  await Q.card(T, {
    say: async () => { await Sound.letter(L); await Sound.speak(`${up(L.l)} is for ${w}`); },
    html: `<div class="prompt">Meet the letter</div><div class="letters">${up(L.l)}${L.l}</div><div class="pic huge">${p}</div><div class="prompt">${up(L.l)} is for ${w}</div>`,
    button: 'Trace it ✏️',
  });
  await Q.trace(T, { say: () => Sound.letter(L), prompt: `Trace the letter ${L.l}`, text: L.l });
}
async function soundToPic(T, Q, c) {
  const pool = LP(c.lvl), L = pickL(pool), { opts } = picOpts(L, pool, 3);
  await Q.choice(T, { say: () => Sound.letter(L), prompt: 'Which one starts with this sound?', visual: c.lvl === 1 ? O.big(`${up(L.l)}${L.l}`) : O.speaker, opts,
    hint: `${up(L.l)} is for ${mainWord(L)[0]}` });
}
async function picToLetter(T, Q, c) {
  const pool = LP(c.lvl), L = pickL(pool), it = itemOf(L);
  await Q.choice(T, { say: `What letter does ${it[0]} start with?`, prompt: `What letter does <b>${it[0]}</b> start with?`, visual: O.big(it[1]),
    opts: letterOpts(L, pool, c.lvl === 3 ? 4 : 3, c.lvl === 3), layout: 'letters' });
  Sound.speak(`${up(L.l)} is for ${it[0]}`);
}
async function letterToPic(T, Q, c) {
  const pool = LP(c.lvl), L = pickL(pool), { opts } = picOpts(L, pool, c.lvl === 3 ? 4 : 3);
  await Q.choice(T, { say: `Which one starts with the letter ${up(L.l)}?`, prompt: `Which one starts with <b>${up(L.l)}</b>?`, visual: O.big(`${up(L.l)}${L.l}`), opts });
}
async function upperLower(T, Q, c) {
  const pool = LP(c.lvl), L = pickL(pool);
  await Q.choice(T, { say: `Find the little letter that matches ${up(L.l)}`, prompt: 'Find the matching little letter', visual: O.big(up(L.l)),
    opts: letterOpts(L, pool, 3, c.lvl >= 2), layout: 'letters' });
}
async function soundToLetter(T, Q, c) {
  const pool = LP(c.lvl), L = pickL(pool);
  await Q.choice(T, { say: () => Sound.letter(L), prompt: 'Which letter makes this sound?', visual: O.speaker,
    opts: letterOpts(L, pool, c.lvl === 3 ? 4 : 3, c.lvl === 3), layout: 'letters' });
}
async function oddOne(T, Q, c) {
  const pool = LP(c.lvl), L = pickL(pool);
  const mates = shuffle(L.items).slice(0, 2);
  if (mates.length < 2) mates.push(L.items[0]);
  const odd = others(L, pool, 1, c.lvl === 3)[0]; if (!odd) throw new Error('no odd letter');
  const oi = itemOf(odd);
  const mk = (it, ok) => ({ html: O.pic(it[1], it[0]), ok });
  const opts = shuffle([mk(oi, true), mk(mates[0], false), mk(mates[1] === mates[0] ? [mates[0][0] + ' ', mates[0][1]] : mates[1], false)]);
  await Q.choice(T, { say: `Which one does NOT start with ${up(L.l)}?`, prompt: `Which one does <b>not</b> start with <b>${up(L.l)}</b>?`, visual: O.big(`${up(L.l)}${L.l}`), opts });
}
async function sameStart(T, Q, c) {
  const pool = LP(c.lvl), L = pickL(pool), a = itemOf(L);
  const b = L.items.filter(x => x !== a);
  if (!b.length) throw new Error('need second word');
  const right = rand(b), wrong = others(L, pool, 2, false).map(x => itemOf(x));
  const opts = shuffle([{ html: O.pic(right[1], right[0]), ok: true }, ...wrong.map(w => ({ html: O.pic(w[1], w[0]), ok: false }))]);
  await Q.choice(T, { say: `Which word starts with the same sound as ${a[0]}?`, prompt: `Which starts with the same sound as <b>${a[0]}</b>?`, visual: O.big(a[1]), opts });
}
async function endSound(T, Q, c) {
  const W = Q.recent(WORDS.filter(x => x.lvl === 1 && x.pic), 'endw', x => x.w, 5);
  const last = W.w[W.w.length - 1], L = LETTERS.find(x => x.l === last);
  const opts = letterOpts(L, LETTERS.slice(0, 16), 3, false);
  await Q.choice(T, { say: `What sound does ${W.w} end with?`, prompt: `What does <b>${W.w}</b> end with?`, visual: O.big(`${W.pic}<div class="cap">${W.w}</div>`), opts, layout: 'letters' });
}

GEN.sounds[1] = [
  { id: 'teach',      fn: teachTrace },
  { id: 'sound-pic',  fn: soundToPic },
  { id: 'pic-letter', fn: picToLetter },
  { id: 'letter-pic', fn: letterToPic },
  { id: 'up-low',     fn: upperLower },
];
GEN.sounds[2] = [
  { id: 'teach',        fn: teachTrace },
  { id: 'sound-letter', fn: soundToLetter },
  { id: 'pic-letter',   fn: picToLetter },
  { id: 'letter-pic',   fn: letterToPic },
  { id: 'odd-one',      fn: oddOne },
  { id: 'same-start',   fn: sameStart },
];
GEN.sounds[3] = [
  { id: 'sound-letter', fn: soundToLetter },
  { id: 'pic-letter',   fn: picToLetter },
  { id: 'odd-one',      fn: oddOne },
  { id: 'same-start',   fn: sameStart },
  { id: 'up-low',       fn: upperLower },
  { id: 'end-sound',    fn: endSound },
  { id: 'teach',        fn: teachTrace },
];
