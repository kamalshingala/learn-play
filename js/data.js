'use strict';
/* Content. To add words or pictures, just edit the lists below. */

// Letters in a Jolly-Phonics-style order. items = [word, picture]. say = sound hint for speech.
const LETTERS = [
  { l: 's', say: 'sss', items: [['snake', '🐍'], ['sun', '☀️'], ['sock', '🧦']] },
  { l: 'a', say: 'aah', items: [['apple', '🍎'], ['ant', '🐜'], ['astronaut', '🧑‍🚀']] },
  { l: 't', say: 'tuh', items: [['tiger', '🐯'], ['tree', '🌳'], ['train', '🚂']] },
  { l: 'i', say: 'ih',  items: [['insect', '🐛'], ['iguana', '🦎'], ['ink', '🖋️']] },
  { l: 'p', say: 'puh', items: [['penguin', '🐧'], ['pizza', '🍕'], ['pig', '🐷']] },
  { l: 'n', say: 'nnn', items: [['nose', '👃'], ['nut', '🥜'], ['net', '🥅']] },
  { l: 'c', say: 'kuh', items: [['cat', '🐱'], ['cow', '🐮'], ['cake', '🎂']] },
  { l: 'k', say: 'kuh', items: [['kite', '🪁'], ['key', '🔑'], ['koala', '🐨']] },
  { l: 'e', say: 'eh',  items: [['egg', '🥚'], ['elephant', '🐘'], ['elf', '🧝']] },
  { l: 'h', say: 'huh', items: [['hat', '🎩'], ['horse', '🐴'], ['house', '🏠']] },
  { l: 'r', say: 'rrr', items: [['rainbow', '🌈'], ['rabbit', '🐰'], ['robot', '🤖']] },
  { l: 'm', say: 'mmm', items: [['moon', '🌙'], ['monkey', '🐵'], ['mouse', '🐭']] },
  { l: 'd', say: 'duh', items: [['dog', '🐶'], ['duck', '🦆'], ['drum', '🥁']] },
  { l: 'g', say: 'guh', items: [['goat', '🐐'], ['grapes', '🍇'], ['guitar', '🎸']] },
  { l: 'o', say: 'aw',  items: [['octopus', '🐙'], ['orange', '🍊'], ['otter', '🦦']] },
  { l: 'u', say: 'uh',  items: [['umbrella', '☂️'], ['up', '⬆️']] },
  { l: 'l', say: 'lll', items: [['lion', '🦁'], ['lemon', '🍋'], ['leaf', '🍃']] },
  { l: 'f', say: 'fff', items: [['fish', '🐟'], ['frog', '🐸'], ['fire', '🔥']] },
  { l: 'b', say: 'buh', items: [['bee', '🐝'], ['ball', '⚽'], ['banana', '🍌']] },
  { l: 'j', say: 'juh', items: [['juice', '🧃'], ['jet', '✈️']] },
  { l: 'z', say: 'zzz', items: [['zebra', '🦓'], ['zip', '🤐']] },
  { l: 'w', say: 'wuh', items: [['watermelon', '🍉'], ['web', '🕸️'], ['wolf', '🐺']] },
  { l: 'v', say: 'vvv', items: [['violin', '🎻'], ['van', '🚐'], ['volcano', '🌋']] },
  { l: 'y', say: 'yuh', items: [['yo-yo', '🪀'], ['yacht', '⛵']] },
];
// Letters that look alike, used for harder questions
const LOOKALIKES = [['b', 'd'], ['p', 'b'], ['m', 'n'], ['t', 'f'], ['u', 'n'], ['w', 'v'], ['c', 'e'], ['a', 'o'], ['i', 'l'], ['h', 'n'], ['g', 'p'], ['k', 'h']];

// Word families (rhyming sets). A token is a word followed by an optional picture.
const FAM_DATA = {
  at: 'cat🐱 hat🎩 bat🦇 rat🐀 mat sat fat pat',
  an: 'can pan🍳 man👨 van🚐 fan ran tan',
  ap: 'cap🧢 map🗺️ tap🚰 nap😴 lap gap zap⚡',
  ag: 'bag👜 tag🏷️ rag wag',
  am: 'ham🍖 jam ram🐏 yam🍠 dam',
  ad: 'dad sad😢 mad😡 bad pad had',
  it: 'sit🪑 bit hit pit fit kit',
  in: 'pin📌 bin🗑️ tin🥫 win🏆 fin🦈',
  ig: 'pig🐷 dig⛏️ big wig jig',
  ip: 'lip👄 zip🤐 tip hip sip',
  ot: 'pot🍲 dot hot🔥 cot lot not',
  op: 'top🔝 hop🐇 mop🧹 pop🍿 cop',
  og: 'dog🐶 log🪵 fog🌫️ hog🐗 jog🏃',
  ug: 'bug🐛 hug🤗 mug☕ rug dug tug jug',
  un: 'sun☀️ fun🎉 bun run nun',
  ut: 'cut✂️ nut🥜 hut🛖 but',
  en: 'hen🐔 pen🖊️ ten🔟 men den',
  et: 'net🥅 pet🐕 wet💧 jet✈️ get set bet',
  ed: 'bed🛏️ red🔴 fed led wed',
  eg: 'leg🦵 peg beg',
  ell: 'bell🔔 shell🐚 well tell sell fell',
  all: 'ball⚽ tall wall fall call small hall',
  ing: 'ring💍 king🤴 sing wing bring thing swing',
  ake: 'cake🎂 lake make take bake snake🐍',
  ay: 'hay🌾 day may say pay way play stay tray',
  ee: 'bee🐝 see👀 tree🌳 three',
  ar: 'car🚗 star⭐ far bar jar',
  ook: 'book📖 look cook hook took',
  ish: 'fish🐟 dish wish',
  oat: 'boat⛵ coat🧥 goat🐐 float',
  ain: 'rain🌧️ train🚂 chain brain',
  ip2: 'ship🚢 chip🍟 trip skip',
  op2: 'stop🛑 shop🏪 drop💧 frog🐸',
  at2: 'flat chat that flag🚩',
  o2: 'go no so',
  e2: 'me we he be',
  sight: 'the and you was are said have they come like little',
  pics5: 'apple🍎 tiger🐯 horse🐴 mouse🐭 house🏠 plane✈️ clock🕐 chair🪑 bread🍞 cloud☁️ sheep🐑 plant🌱 truck🚚 whale🐳 zebra🦓 smile😊',
};
const FAM_LABEL = { ip2: '-ip (blends)', op2: '-op (blends)', at2: '-at (blends)', o2: '-o', e2: '-e', sight: 'sight words', pics5: 'picture words' };
const famLabel = f => FAM_LABEL[f] || '-' + f;

const SIMPLE_FAMS = new Set(['at', 'an', 'ap', 'ag', 'am', 'ad', 'it', 'in', 'ig', 'ip', 'ot', 'op', 'og', 'ug', 'un', 'ut', 'en', 'et', 'ed', 'eg']);
const BLEND = /^(sh|ch|th|wh|bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr|tw)/;

const WORDS = [];
for (const [f, s] of Object.entries(FAM_DATA)) {
  s.trim().split(/\s+/).forEach(t => { const m = t.match(/^([a-z]+)(.*)$/); WORDS.push({ w: m[1], pic: m[2] || '', f }); });
}
// 1 = simple 3-letter words, 2 = sight words / other 3-letter / 4-letter, 3 = blends, digraphs, 5+ letters
function wordLevel(x) {
  const n = x.w.length;
  if (n === 3 && SIMPLE_FAMS.has(x.f)) return 1;
  if (n <= 3) return 2;
  if (n === 4) return BLEND.test(x.w) ? 3 : 2;
  return 3;
}
WORDS.forEach(x => { x.lvl = wordLevel(x); });

// Sentences for Level 3 (picture strings help the child check their reading)
const SENTENCES = [
  ['The cat sat on a mat', '🐱🪑'], ['A big pig can dig', '🐷⛏️'], ['I see a red hen', '🐔🔴'], ['The sun is hot', '☀️🔥'],
  ['My dog can run', '🐶🏃'], ['The frog sat on a log', '🐸🪵'], ['A bug is on the rug', '🐛🟫'], ['We can play in the rain', '🌧️☔'],
  ['The ship is big', '🚢'], ['A fish can swim', '🐟🏊'], ['The bee is on the tree', '🐝🌳'], ['I can see a star', '⭐👀'],
  ['Dad has a red car', '👨🚗'], ['The boat is on the lake', '⛵🏞️'], ['The hen is in the bed', '🐔🛏️'], ['I like to read a book', '📖👀'],
].map(([s, pics]) => ({ s, pics, tokens: s.split(' ') }));

// Things to count (name used in "Tap 3 apples")
const OBJECTS = [
  { e: '🍎', n: 'apple', p: 'apples' }, { e: '⭐', n: 'star', p: 'stars' }, { e: '🐟', n: 'fish', p: 'fish' },
  { e: '🎈', n: 'balloon', p: 'balloons' }, { e: '🚗', n: 'car', p: 'cars' }, { e: '🐥', n: 'chick', p: 'chicks' },
  { e: '🍪', n: 'cookie', p: 'cookies' }, { e: '🦋', n: 'butterfly', p: 'butterflies' }, { e: '🍓', n: 'strawberry', p: 'strawberries' },
  { e: '🐞', n: 'ladybird', p: 'ladybirds' }, { e: '🌼', n: 'flower', p: 'flowers' }, { e: '🍩', n: 'donut', p: 'donuts' },
];

const STICKERS = ['🦄', '🐶', '🐱', '🐼', '🦊', '🐸', '🐙', '🦋', '🐢', '🦁', '🐬', '🦖', '🐝', '🐞', '🚀', '🌈', '🐧', '🦉', '🐳', '🦒', '🐘', '🦜', '🐠', '🚒', '🎠', '🛸', '🐨', '🦩'];

const CATS = [
  { id: 'sounds',   label: 'Sounds',   icon: '🔤', color: '#ff6b6b' },
  { id: 'counting', label: 'Counting', icon: '🔢', color: '#4dabf7' },
  { id: 'maths',    label: 'Maths',    icon: '➕', color: '#51cf66' },
  { id: 'words',    label: 'Words',    icon: '📖', color: '#9775fa' },
];
const LEVELS = [
  { n: 1, name: 'Easy',      medal: '🥉' },
  { n: 2, name: 'Medium',    medal: '🥈' },
  { n: 3, name: 'Challenge', medal: '🥇' },
];
const BADGES = [
  ...CATS.flatMap(c => LEVELS.map(l => ({ id: `${c.id}-${l.n}`, icon: l.medal, tag: c.icon, title: `${c.label} ${l.name}`, how: `Finish a ${c.label} Level ${l.n} set` }))),
  { id: 'first',     icon: '🎒', tag: '', title: 'First mission', how: 'Finish a daily mission' },
  { id: 'streak-3',  icon: '🔥', tag: '', title: '3 days in a row', how: 'Play 3 days in a row' },
  { id: 'streak-7',  icon: '🚀', tag: '', title: '7 days in a row', how: 'Play 7 days in a row' },
  { id: 'streak-14', icon: '👑', tag: '', title: '14 days in a row', how: 'Play 14 days in a row' },
];
