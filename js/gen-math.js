'use strict';
/* Counting and maths questions. */

const RANGE = [0, [1, 5], [3, 10], [8, 20]];             // counting range per level
const nameOf = (o, n) => (n === 1 ? o.n : o.p);
const numOpts = (n, lo, hi, k = 3) => pickOpts(n, numPool(n, lo, hi), k, x => x, x => O.num(x));

/* ---------- COUNTING ---------- */
async function countTap(T, Q, c) {
  const [lo, hi] = RANGE[c.lvl], n = Math.random() < 0.4 ? hi : ri(lo, hi), ob = rand(OBJECTS);
  await Q.count(T, { emoji: ob.e, n });
  const first = await Q.choice(T, { say: 'How many are there?', prompt: 'How many are there?', visual: Q.staticObjs(ob.e, n), opts: numOpts(n, 1, Math.max(hi, n) + 2), layout: 'nums' });
  if (c.lvl === 1 && S.opts.trace && n <= 9 && Math.random() < 0.6)
    await Q.trace(T, { say: `Trace the number ${n}`, prompt: `Trace the number ${n}`, text: String(n) });
  return first;
}
async function giveN(T, Q, c) {
  const [lo, hi] = RANGE[c.lvl], n = ri(Math.max(1, lo), hi), ob = rand(OBJECTS);
  await Q.tapN(T, { obj: ob, total: Math.min(20, n + ri(2, 5)), n });
}
async function numToGroup(T, Q, c) {
  const [lo, hi] = RANGE[c.lvl], n = ri(Math.max(1, lo), Math.min(hi, 12)), ob = rand(OBJECTS);
  const opts = pickOpts(n, numPool(n, 1, Math.min(hi, 12) + 2), 3, x => x, x => O.group(ob.e, x));
  await Q.choice(T, { say: `Which group has ${n}?`, prompt: `Which group has <b>${n}</b>?`, visual: O.big(n), opts, layout: 'groups' });
}
async function whatsNext(T, Q, c) {
  const hi = RANGE[c.lvl][1], n = ri(1, hi - 1);
  await Q.choice(T, { say: `What comes after ${n}?`, prompt: `What comes after <b>${n}</b>?`, visual: O.big(`${n} <span class="blank">?</span>`),
    opts: numOpts(n + 1, 1, hi + 2), layout: 'nums' });
}
async function beforeAfter(T, Q, c) {
  const hi = RANGE[c.lvl][1], after = Math.random() < 0.5, n = after ? ri(1, hi - 1) : ri(2, hi), ans = after ? n + 1 : n - 1;
  const w = after ? 'after' : 'before';
  await Q.choice(T, { say: `What comes ${w} ${n}?`, prompt: `What comes <b>${w}</b> <b>${n}</b>?`, visual: O.big(n), opts: numOpts(ans, 0, hi + 2), layout: 'nums' });
}
async function moreFewer(T, Q, c) {
  const hi = Math.min(RANGE[c.lvl][1], 10), a = ri(1, hi), ob = rand(OBJECTS);
  let b = ri(1, hi); if (b === a) b = a === hi ? a - 1 : a + 1;
  const more = Math.random() < 0.5, ans = more ? Math.max(a, b) : Math.min(a, b);
  const opts = shuffle([{ html: O.group(ob.e, a), ok: a === ans }, { html: O.group(ob.e, b), ok: b === ans }]);
  await Q.choice(T, { say: `Which group has ${more ? 'more' : 'fewer'}?`, prompt: `Which group has <b>${more ? 'MORE' : 'FEWER'}</b>?`, opts, layout: 'groups' });
}
async function missingSeq(T, Q, c) {
  const hi = RANGE[c.lvl][1], len = 4, s = ri(1, Math.max(1, hi - len)), at = ri(1, len - 2);
  const seq = Array.from({ length: len }, (_, i) => s + i), ans = seq[at];
  const shown = seq.map((v, i) => (i === at ? '<span class="blank">?</span>' : v)).join(' ');
  await Q.choice(T, { say: 'What number is missing?', prompt: 'What number is missing?', visual: O.big(shown), opts: numOpts(ans, 1, hi + 2), layout: 'nums' });
}
async function skipCount(T, Q, c) {
  const step = rand([2, 5, 10]), start = step * ri(0, 2), seq = Array.from({ length: 4 }, (_, i) => start + step * (i + 1)), at = ri(1, 2), ans = seq[at];
  const shown = seq.map((v, i) => (i === at ? '<span class="blank">?</span>' : v)).join('  ');
  const pool = [ans + step, ans - step, ans + 1, ans - 1, ans + 2].filter(x => x > 0 && x !== ans);
  await Q.choice(T, { say: `Count by ${step === 10 ? 'tens' : step === 5 ? 'fives' : 'twos'}. What number is missing?`, prompt: `Count by <b>${step}s</b>. What is missing?`, visual: O.big(shown),
    opts: pickOpts(ans, pool, 3, x => x, x => O.num(x)), layout: 'nums' });
}
async function orderNums(T, Q, c) {
  const k = 4, set = new Set(); while (set.size < k) set.add(ri(1, 20));
  const sorted = [...set].sort((a, b) => a - b).map(String);
  await Q.seq(T, { say: 'Put the numbers in order, smallest first', prompt: 'Put the numbers in order, <b>smallest first</b>', tokens: sorted, onTile: t => Sound.speak(t, { rate: 0.9 }) });
}
async function biggerSmaller(T, Q, c) {
  const a = ri(1, 20); let b = ri(1, 20); while (b === a) b = ri(1, 20);
  let d = ri(1, 20); while (d === a || d === b) d = ri(1, 20);
  const big = Math.random() < 0.5, nums = [a, b, d], ans = big ? Math.max(...nums) : Math.min(...nums);
  await Q.choice(T, { say: `Which number is ${big ? 'biggest' : 'smallest'}?`, prompt: `Which number is the <b>${big ? 'BIGGEST' : 'SMALLEST'}</b>?`,
    opts: shuffle(nums.map(x => ({ html: O.num(x), ok: x === ans }))), layout: 'nums' });
}
async function traceNum(T, Q, c) {
  const n = c.lvl === 3 ? ri(10, 20) : ri(1, 9);
  await Q.trace(T, { say: `Trace the number ${n}`, prompt: `Trace the number ${n}`, text: String(n), W: n >= 10 ? 900 : 600, H: n >= 10 ? 500 : 600 });
}

GEN.counting[1] = [
  { id: 'count',     fn: countTap },
  { id: 'give',      fn: giveN },
  { id: 'num-group', fn: numToGroup },
  { id: 'next',      fn: whatsNext },
  { id: 'trace',     fn: traceNum },
];
GEN.counting[2] = [
  { id: 'count',     fn: countTap },
  { id: 'give',      fn: giveN },
  { id: 'more',      fn: moreFewer },
  { id: 'before',    fn: beforeAfter },
  { id: 'missing',   fn: missingSeq },
  { id: 'num-group', fn: numToGroup },
];
GEN.counting[3] = [
  { id: 'count',   fn: countTap },
  { id: 'order',   fn: orderNums },
  { id: 'skip',    fn: skipCount },
  { id: 'bigger',  fn: biggerSmaller },
  { id: 'give',    fn: giveN },
  { id: 'before',  fn: beforeAfter },
  { id: 'trace',   fn: traceNum },
];

/* ---------- MATHS ---------- */
const MAX = [0, 5, 10, 20];
const groupsHTML = (e, a, b, gone = 0, op = '+') => op === '+'
  ? `<div class="eqrow"><div class="grp box">${Array.from({ length: a }, () => `<i>${e}</i>`).join('')}</div><span class="opr">+</span><div class="grp box">${Array.from({ length: b }, () => `<i>${e}</i>`).join('')}</div></div>`
  : `<div class="eqrow"><div class="grp box">${Array.from({ length: a }, (_, i) => `<i class="${i >= a - gone ? 'gone' : ''}">${e}</i>`).join('')}</div></div>`;
const sayEq = (a, op, b, r) => `${a} ${op === '+' ? 'plus' : 'take away'} ${b} equals ${r}`;
const revealEq = async (a, op, b, r) => { Sound.speak(sayEq(a, op, b, r)); };

async function addPic(T, Q, c) {
  const max = Math.min(MAX[c.lvl], 10), ans = ri(2, max), a = ri(1, ans - 1), b = ans - a, ob = rand(OBJECTS);
  await Q.choice(T, { say: `${a} plus ${b}. How many altogether?`, prompt: 'How many altogether?', visual: groupsHTML(ob.e, a, b) + O.eq(`${a} + ${b} = ?`), opts: numOpts(ans, 0, max + 2), layout: 'nums' });
  revealEq(a, '+', b, ans);
}
async function subPic(T, Q, c) {
  const max = Math.min(MAX[c.lvl], 10), a = ri(2, max), b = ri(1, a - 1), ans = a - b, ob = rand(OBJECTS);
  await Q.choice(T, { say: `${a} take away ${b}. How many are left?`, prompt: 'How many are left?', visual: groupsHTML(ob.e, a, 0, b, '-') + O.eq(`${a} − ${b} = ?`), opts: numOpts(ans, 0, max + 2), layout: 'nums' });
  revealEq(a, '-', b, ans);
}
async function story(T, Q, c) {
  const max = Math.min(MAX[c.lvl], 10), ob = rand(OBJECTS), name = rand(['Mia', 'Sam', 'Zoe', 'Leo', 'Ava', 'Ben']), add = Math.random() < 0.5;
  if (add) {
    const ans = ri(2, max), a = ri(1, ans - 1), b = ans - a;
    await Q.choice(T, { say: `${name} has ${a} ${nameOf(ob, a)}. Then ${name} gets ${b} more. How many now?`, prompt: `${name} has ${a}, then gets ${b} more. How many now?`,
      visual: groupsHTML(ob.e, a, b), opts: numOpts(ans, 0, max + 2), layout: 'nums' });
  } else {
    const a = ri(2, max), b = ri(1, a - 1), ans = a - b;
    await Q.choice(T, { say: `${name} has ${a} ${nameOf(ob, a)}. ${name} gives away ${b}. How many are left?`, prompt: `${name} has ${a}, gives away ${b}. How many are left?`,
      visual: groupsHTML(ob.e, a, 0, b, '-'), opts: numOpts(ans, 0, max + 2), layout: 'nums' });
  }
}
async function missingAddend(T, Q, c) {
  const max = MAX[c.lvl], total = ri(3, max), a = ri(1, total - 1), b = total - a, ob = rand(OBJECTS);
  await Q.choice(T, { say: `${a} plus how many makes ${total}?`, prompt: `${a} + <span class="blank">?</span> = ${total}`, visual: total <= 10 ? Q.staticObjs(ob.e, total) : '', opts: numOpts(b, 0, max + 1), layout: 'nums' });
}
async function bond(T, Q, c) {
  const target = c.lvl === 3 && Math.random() < 0.5 ? 20 : 10, a = ri(1, target - 1), b = target - a;
  await Q.choice(T, { say: `${a} and how many make ${target}?`, prompt: `${a} and <span class="blank">?</span> make <b>${target}</b>`, opts: numOpts(b, 0, target), layout: 'nums' });
}
async function eqAdd(T, Q, c) {
  const max = MAX[c.lvl], ans = ri(3, max), a = ri(1, ans - 1), b = ans - a;
  await Q.choice(T, { say: `What is ${a} plus ${b}?`, prompt: `${a} + ${b} = <span class="blank">?</span>`, opts: numOpts(ans, 0, max + 2), layout: 'nums' });
  revealEq(a, '+', b, ans);
}
async function eqSub(T, Q, c) {
  const max = MAX[c.lvl], a = ri(3, max), b = ri(1, a - 1), ans = a - b;
  await Q.choice(T, { say: `What is ${a} take away ${b}?`, prompt: `${a} − ${b} = <span class="blank">?</span>`, opts: numOpts(ans, 0, max + 2), layout: 'nums' });
  revealEq(a, '-', b, ans);
}
async function doubles(T, Q, c) {
  const a = ri(2, 10), ob = rand(OBJECTS);
  await Q.choice(T, { say: `What is ${a} plus ${a}?`, prompt: `${a} + ${a} = <span class="blank">?</span>`, visual: a <= 6 ? groupsHTML(ob.e, a, a) : '', opts: numOpts(a * 2, 0, 22), layout: 'nums' });
}
async function missingFirst(T, Q, c) {
  const total = ri(6, 20), b = ri(1, total - 2), a = total - b;
  await Q.choice(T, { say: `How many plus ${b} makes ${total}?`, prompt: `<span class="blank">?</span> + ${b} = ${total}`, opts: numOpts(a, 0, 20), layout: 'nums' });
}
async function trueEq(T, Q, c) {
  const max = MAX[c.lvl], a = ri(2, max - 1), b = ri(1, max - a), r = a + b;
  const fake = shuffle([r - 2, r - 1, r + 1, r + 2].filter(x => x >= 0)).slice(0, 2);
  const opts = shuffle([{ html: O.eq(`${a} + ${b} = ${r}`), ok: true }, ...fake.map(f => ({ html: O.eq(`${a} + ${b} = ${f}`), ok: false }))]);
  await Q.choice(T, { say: 'Which sum is true?', prompt: 'Which sum is <b>true</b>?', opts, layout: 'eqs' });
}
async function addThree(T, Q, c) {
  const a = ri(1, 6), b = ri(1, 6), d = ri(1, 6), ans = a + b + d;
  await Q.choice(T, { say: `What is ${a} plus ${b} plus ${d}?`, prompt: `${a} + ${b} + ${d} = <span class="blank">?</span>`, opts: numOpts(ans, 3, 20), layout: 'nums' });
}

GEN.maths[1] = [
  { id: 'add-pic', fn: addPic }, { id: 'sub-pic', fn: subPic }, { id: 'story', fn: story }, { id: 'missing', fn: missingAddend },
];
GEN.maths[2] = [
  { id: 'add-pic', fn: addPic }, { id: 'sub-pic', fn: subPic }, { id: 'story', fn: story }, { id: 'missing', fn: missingAddend },
  { id: 'bond10', fn: bond }, { id: 'eq-add', fn: eqAdd }, { id: 'eq-sub', fn: eqSub }, { id: 'true', fn: trueEq },
];
GEN.maths[3] = [
  { id: 'eq-add', fn: eqAdd }, { id: 'eq-sub', fn: eqSub }, { id: 'doubles', fn: doubles }, { id: 'missing-first', fn: missingFirst },
  { id: 'bond', fn: bond }, { id: 'true', fn: trueEq }, { id: 'add3', fn: addThree }, { id: 'missing', fn: missingAddend },
];
