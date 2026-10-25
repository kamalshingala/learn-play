'use strict';
/* Word questions: spelling, reading, rhyming, missing letters, sentences. */

/* The words in play. A filter set in Grown-ups corner (lengths / rhyming families) overrides the level. */
function wordPool(lvl) {
  const { lens, fams } = S.opts;
  if (lens.length || fams.length) {
    const p = WORDS.filter(x => (!lens.length || lens.includes(x.w.length)) && (!fams.length || fams.includes(x.f)));
    if (p.length >= 4) return p;
  }
  return WORDS.filter(x => x.lvl === lvl);
}
const withPic = p => p.filter(x => x.pic);
const pickW = (pool, key = 'W') => Q.recent(pool, key, x => x.w, 5);
const ABC = LETTERS.map(l => l.l);

/* Distractor words: similar ones first (same length), then anything */
function similar(W, n, needPic, pool) {
  const seen = new Set([W.w]), picSeen = new Set([W.pic]), out = [];
  const tiers = [pool.filter(x => x.w.length === W.w.length), pool, WORDS.filter(x => x.w.length === W.w.length), WORDS];
  for (const tier of tiers) for (const x of shuffle(tier)) {
    if (out.length >= n) return out;
    if (seen.has(x.w) || (needPic && (!x.pic || picSeen.has(x.pic)))) continue;
    seen.add(x.w); if (x.pic) picSeen.add(x.pic); out.push(x);
  }
  return out;
}
/* Look-alike words: same first letter or same ending */
function lookalike(W, n, pool) {
  const near = shuffle(pool.filter(x => x.w !== W.w && x.w.length === W.w.length && (x.w[0] === W.w[0] || x.w.slice(1) === W.w.slice(1) || x.w.slice(-1) === W.w.slice(-1))));
  const seen = new Set([W.w]), out = [];
  for (const x of [...near, ...similar(W, n, false, pool)]) { if (out.length >= n) break; if (!seen.has(x.w)) { seen.add(x.w); out.push(x); } }
  return out;
}

async function buildWord(T, Q, c) {
  const pool = wordPool(c.lvl), W = pickW(c.lvl === 1 ? (withPic(pool).length > 3 ? withPic(pool) : pool) : pool);
  const extra = shuffle(ABC.filter(ch => !W.w.includes(ch))).slice(0, c.lvl === 1 ? 2 : 3);
  const say = W.pic ? `Can you spell ${W.w}?` : `Listen and spell the word ${W.w}`;
  await Q.seq(T, { say, prompt: W.pic ? 'Spell the word' : 'Listen and spell the word', visual: W.pic ? O.big(W.pic) : O.speaker, tokens: [...W.w], extra,
    onTile: t => { const L = LETTERS.find(x => x.l === t); if (L) Sound.speak(L.say, { rate: 0.7 }); } });
  Sound.speak(`${[...W.w].join(', ')}. ${W.w}!`, { rate: 0.7 });
  if (S.opts.trace && c.lvl === 1 && W.w.length <= 3 && Math.random() < 0.5)
    await Q.trace(T, { say: `Trace the word ${W.w}`, prompt: `Trace the word <b>${W.w}</b>`, text: W.w, W: 900, H: 420, brush: 30 });
}
async function readPick(T, Q, c) {
  const pool = wordPool(c.lvl), pics = withPic(pool.length > 3 ? pool : WORDS), W = pickW(pics, 'WR');
  const opts = pickOpts(W, similar(W, 6, true, pics), 3, x => x.pic, x => O.pic(x.pic));
  await Q.choice(T, { say: 'Which picture matches this word? Tap the word to hear it.', prompt: 'Which picture matches this word?',
    visual: `<button class="speakword" data-say="${W.w}"><span class="bigword">${W.w}</span><small>👆 tap to hear</small></button>`, opts, hint: W.w });
}
async function hearPick(T, Q, c) {
  const pool = wordPool(c.lvl), W = pickW(pool, 'WH');
  const near = c.lvl === 1 ? similar(W, 6, false, pool) : lookalike(W, 6, pool);
  const opts = pickOpts(W, near, c.lvl === 3 ? 4 : 3, x => x.w, x => O.word(x.w));
  await Q.choice(T, { say: `Find the word ${W.w}`, prompt: 'Find the word you hear', visual: O.speaker, opts, layout: 'words' });
}
async function rhyme(T, Q, c) {
  const pool = wordPool(c.lvl), fams = {};
  withPic(WORDS).forEach(x => { (fams[x.f] = fams[x.f] || []).push(x); });
  const usable = withPic(pool).filter(x => fams[x.f].length >= 2 && !['sight', 'pics5', 'o2', 'e2'].includes(x.f));
  const W = pickW(usable.length ? usable : withPic(WORDS), 'WRH');
  const mate = rand(fams[W.f].filter(x => x.w !== W.w));
  const wrong = shuffle(withPic(WORDS).filter(x => x.f !== W.f && x.w[x.w.length - 1] !== W.w[W.w.length - 1])).slice(0, 2);
  const opts = shuffle([mate, ...wrong].map(x => ({ html: O.pic(x.pic, x.w), ok: x === mate })));
  await Q.choice(T, { say: `Which one rhymes with ${W.w}?`, prompt: `Which one rhymes with <b>${W.w}</b>?`, visual: O.big(`${W.pic}<div class="cap">${W.w}</div>`), opts, hint: `${W.w} and ${mate.w} rhyme` });
}
async function missingLetter(T, Q, c) {
  const pool = wordPool(c.lvl).filter(x => x.w.length >= 3 && x.w.length <= 5), W = pickW(pool.length ? pool : WORDS.filter(x => x.w.length === 3), 'WM');
  const idx = c.lvl === 1 ? 1 : c.lvl === 2 ? ri(1, W.w.length - 1) : ri(0, W.w.length - 1), ch = W.w[idx];
  const shown = [...W.w].map((x, i) => (i === idx ? '<span class="blank">_</span>' : x)).join(' ');
  const pools = 'aeiou'.includes(ch) ? ['a', 'e', 'i', 'o', 'u'] : ABC;
  const L = { l: ch };
  const opts = pickOpts(ch, pools, 3, x => x, x => O.letter(x));
  await Q.choice(T, { say: W.pic ? `What letter is missing from ${W.w}?` : `The word is ${W.w}. What letter is missing?`, prompt: 'What letter is missing?',
    visual: `${W.pic ? O.big(W.pic) : ''}<div class="bigword">${shown}</div>`, opts, layout: 'letters' });
  Sound.speak(`${W.w}`);
}
async function sightFind(T, Q, c) {
  const sight = WORDS.filter(x => x.f === 'sight'), W = pickW(sight, 'WS');
  const opts = pickOpts(W, sight, 4, x => x.w, x => O.word(x.w));
  await Q.choice(T, { say: `Find the word ${W.w}`, prompt: `Find the word <b>${W.w}</b>`, visual: O.speaker, opts, layout: 'words' });
}
async function digraph(T, Q, c) {
  const pool = WORDS.filter(x => x.pic && /^(sh|ch|th)/.test(x.w)), W = pickW(pool, 'WD');
  const start = W.w.slice(0, 2), rest = W.w.slice(2);
  const opts = pickOpts(start, ['sh', 'ch', 'th'], 3, x => x, x => O.word(x));
  await Q.choice(T, { say: `Which letters start ${W.w}?`, prompt: 'Which letters start this word?', visual: `${O.big(W.pic)}<div class="bigword"><span class="blank">__</span>${rest}</div>`, opts, layout: 'words' });
  Sound.speak(W.w);
}
async function sentenceBuild(T, Q, c) {
  const S1 = Q.recent(SENTENCES, 'SB', x => x.s, 5);
  await Q.seq(T, { say: `Build the sentence. ${S1.s}`, prompt: 'Build the sentence', visual: O.big(S1.pics), tokens: S1.tokens, onTile: t => Sound.speak(t, { rate: 0.9 }) });
  Sound.speak(S1.s);
}
async function sentenceRead(T, Q, c) {
  const S1 = Q.recent(SENTENCES, 'SR', x => x.s, 5);
  const opts = pickOpts(S1, SENTENCES, 3, x => x.pics, x => O.pic(x.pics));
  await Q.choice(T, { say: `Which picture matches this sentence? ${S1.s}`, prompt: 'Which picture matches this sentence?',
    visual: `<button class="speakword" data-say="${S1.s}"><span class="sentence">${S1.s}.</span><small>👆 tap to hear</small></button>`, opts, hint: S1.s });
}

GEN.words[1] = [
  { id: 'build', fn: buildWord }, { id: 'read', fn: readPick }, { id: 'hear', fn: hearPick },
  { id: 'rhyme', fn: rhyme }, { id: 'missing', fn: missingLetter },
];
GEN.words[2] = [
  { id: 'build', fn: buildWord }, { id: 'read', fn: readPick }, { id: 'hear', fn: hearPick },
  { id: 'rhyme', fn: rhyme }, { id: 'missing', fn: missingLetter }, { id: 'sight', fn: sightFind },
];
GEN.words[3] = [
  { id: 'build', fn: buildWord }, { id: 'sentence-build', fn: sentenceBuild }, { id: 'sentence-read', fn: sentenceRead },
  { id: 'hear', fn: hearPick }, { id: 'digraph', fn: digraph }, { id: 'missing', fn: missingLetter }, { id: 'rhyme', fn: rhyme },
];
