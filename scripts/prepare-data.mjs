import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const LUMINA_DIR = path.resolve(ROOT, '..', 'church-projection');
const COMPANION_DIR = path.resolve(ROOT, '..', 'lumina-companion');

const PUBLIC_DATA = path.resolve(ROOT, 'public', 'data');
const TAOVBSI_DIR = path.resolve(PUBLIC_DATA, 'bible', 'taovbsi');
const KJV_DIR = path.resolve(PUBLIC_DATA, 'bible', 'kjv');
const SONGS_DIR = path.resolve(PUBLIC_DATA, 'songs');
const SONGS_CHUNKS_DIR = path.resolve(SONGS_DIR, 'chunks');

fs.mkdirSync(TAOVBSI_DIR, { recursive: true });
fs.mkdirSync(KJV_DIR, { recursive: true });
fs.mkdirSync(SONGS_CHUNKS_DIR, { recursive: true });

console.log('--- Preparing Bible Data ---');

const TAOVBSI_BOOK_START_PAGES = {
  GEN: 1, EXO: 69, LEV: 125, NUM: 165, DEU: 222, JOS: 269, JDG: 301, RUT: 334,
  '1SA': 339, '2SA': 384, '1KI': 421, '2KI': 464, '1CH': 505, '2CH': 543, EZR: 589,
  NEH: 603, EST: 623, JOB: 634, PSA: 671, PRO: 763, ECC: 791, SNG: 801, ISA: 806,
  JER: 873, LAM: 952, EZK: 958, DAN: 1028, HOS: 1049, JOL: 1059, AMO: 1063,
  OBA: 1071, JON: 1072, MIC: 1075, NAM: 1081, HAB: 1083, ZEP: 1086, HAG: 1089,
  ZEC: 1092, MAL: 1103,
  MAT: 3, MRK: 47, LUK: 75, JHN: 124, ACT: 160, ROM: 207, '1CO': 226, '2CO': 245,
  GAL: 257, EPH: 263, PHP: 270, COL: 274, '1TH': 279, '2TH': 283, '1TI': 285,
  '2TI': 291, TIT: 294, PHM: 297, HEB: 298, JAS: 312, '1PE': 317, '2PE': 322,
  '1JN': 325, '2JN': 330, '3JN': 331, JUD: 332, REV: 333
};

const TANGLISH_ALIASES = {
  GEN: ['genesis', 'aathiyagamam', 'aadhiyagamam', 'aathiyagamam', 'gen'],
  EXO: ['exodus', 'yaathiragamam', 'yathiragamam', 'exo'],
  LEV: ['leviticus', 'leviyaragamam', 'leviyaraagamam', 'lev'],
  NUM: ['numbers', 'ennagamam', 'ennagaamam', 'num'],
  DEU: ['deuteronomy', 'ubagamam', 'ubaagamam', 'deu'],
  JOS: ['joshua', 'yosuvaa', 'yosuva', 'jos'],
  JDG: ['judges', 'niyayadhibathigal', 'niyayadhipathigal', 'jdg'],
  RUT: ['ruth', 'rooth', 'ruththu', 'rut'],
  '1SA': ['1 samuel', 'first samuel', 'mudhal saamuel', 'mudhal samuel', '1sa'],
  '2SA': ['2 samuel', 'second samuel', 'irandaam saamuel', 'irandaam samuel', '2sa'],
  '1KI': ['1 kings', 'first kings', 'mudhal raajaakkal', 'mudhal rajakkal', '1ki'],
  '2KI': ['2 kings', 'second kings', 'irandaam raajaakkal', 'irandaam rajakkal', '2ki'],
  '1CH': ['1 chronicles', 'first chronicles', 'mudhal naalaagamam', '1ch'],
  '2CH': ['2 chronicles', 'second chronicles', 'irandaam naalaagamam', '2ch'],
  EZR: ['ezra', 'esraa', 'ezr'],
  NEH: ['nehemiah', 'nehemiya', 'nehemiyaa', 'neh'],
  EST: ['esther', 'esthar', 'est'],
  JOB: ['job', 'yobu', 'job'],
  PSA: ['psalms', 'psalm', 'sangeetham', 'sangeedham', 'sangeethangal', 'keerthanai', 'psa'],
  PRO: ['proverbs', 'neethimozhigal', 'neethi mozhigal', 'gnana mozhigal', 'pro'],
  ECC: ['ecclesiastes', 'prasangi', 'prasanggi', 'ecc'],
  SNG: ['song of songs', 'song of solomon', 'unnathappaattu', 'unnatha paattu', 'sng', 'sos'],
  ISA: ['isaiah', 'yesaaya', 'esaaya', 'esaayaa', 'isa'],
  JER: ['jeremiah', 'eremiya', 'eremiyaa', 'jer'],
  LAM: ['lamentations', 'pulambal', 'pulambalgal', 'lam'],
  EZK: ['ezekiel', 'esechiyel', 'yesekkiyel', 'ezk'],
  DAN: ['daniel', 'thaaniyel', 'dhaniel', 'dan'],
  HOS: ['hosea', 'oseya', 'hoseyaa', 'hos'],
  JOL: ['joel', 'yovel', 'yoel', 'jol'],
  AMO: ['amos', 'aamos', 'amo'],
  OBA: ['obadiah', 'obadhiya', 'obathiya', 'oba'],
  JON: ['jonah', 'yona', 'yonah', 'jon'],
  MIC: ['micah', 'meekaa', 'mika', 'mic'],
  NAM: ['nahum', 'naahum', 'naagum', 'nam'],
  HAB: ['habakkuk', 'aabakkuk', 'abakuk', 'hab'],
  ZEP: ['zephaniah', 'seppaniya', 'seppaniyaa', 'zep'],
  HAG: ['haggai', 'aagaai', 'aagai', 'hag'],
  ZEC: ['zechariah', 'sagariya', 'sagariya', 'zec'],
  MAL: ['malachi', 'malaki', 'malachiya', 'mal'],
  MAT: ['matthew', 'matthaaeyu', 'mattheyu', 'maththai', 'mat'],
  MRK: ['mark', 'maarku', 'maark', 'marku', 'mrk'],
  LUK: ['luke', 'lookkaa', 'luka', 'luk'],
  JHN: ['john', 'yovaan', 'yohannaan', 'yohannan', 'jhn'],
  ACT: ['acts', 'apposthalar', 'apposthalargal', 'seyalgal', 'act'],
  ROM: ['romans', 'romar', 'rom'],
  '1CO': ['1 corinthians', 'first corinthians', 'mudhal korindhiyar', '1co'],
  '2CO': ['2 corinthians', 'second corinthians', 'irandaam korindhiyar', '2co'],
  GAL: ['galatians', 'galathiyar', 'gal'],
  EPH: ['ephesians', 'ebesiyar', 'eph'],
  PHP: ['philippians', 'pilippiyar', 'php'],
  COL: ['colossians', 'koloseyar', 'col'],
  '1TH': ['1 thessalonians', 'first thessalonians', 'mudhal thesalonikkayar', '1th'],
  '2TH': ['2 thessalonians', 'second thessalonians', 'irandaam thesalonikkayar', '2th'],
  '1TI': ['1 timothy', 'first timothy', 'mudhal theemothi', '1ti'],
  '2TI': ['2 timothy', 'second timothy', 'irandaam theemothi', '2ti'],
  TIT: ['titus', 'theethu', 'theeththu', 'tit'],
  PHM: ['philemon', 'pilemon', 'philemon', 'phm'],
  HEB: ['hebrews', 'ebireyar', 'heb'],
  JAS: ['james', 'yaakkobu', 'yaakobu', 'jas'],
  '1PE': ['1 peter', 'first peter', 'mudhal peter', 'mudhal pedhuru', '1pe'],
  '2PE': ['2 peter', 'second peter', 'irandaam peter', 'irandaam pedhuru', '2pe'],
  '1JN': ['1 john', 'first john', 'mudhal yovaan', '1jn'],
  '2JN': ['2 john', 'second john', 'irandaam yovaan', '2jn'],
  '3JN': ['3 john', 'third john', 'moondraam yovaan', '3jn'],
  JUD: ['jude', 'yoodhaa', 'yootha', 'jud'],
  REV: ['revelation', 'velippaduthal', 'velippaduthina visesham', 'velippaduthal visesham', 'rev']
};

const OLD_TESTAMENT_CODES = new Set([
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'
]);

// 1. Read New Ortho Tamil Bible
const taovbsiRaw = JSON.parse(fs.readFileSync(path.resolve(LUMINA_DIR, 'src', 'data', 'tamilBibleTaovbsi.json'), 'utf-8'));
// 2. Read English KJV Bible
const kjvRaw = JSON.parse(fs.readFileSync(path.resolve(LUMINA_DIR, 'src', 'data', 'luminaKjvEnglish.json'), 'utf-8'));

const kjvMap = new Map();
kjvRaw.books.forEach((b) => {
  kjvMap.set(b.code, b);
});

const bibleMeta = [];

taovbsiRaw.books.forEach((book, idx) => {
  const code = book.code || book.id;
  const englishBook = kjvMap.get(code);
  const englishName = englishBook ? englishBook.name : code;
  const isOld = OLD_TESTAMENT_CODES.has(code);
  const testament = isOld ? 'OT' : 'NT';
  const startPage = TAOVBSI_BOOK_START_PAGES[code] || 1;
  const aliases = Array.from(new Set([
    book.name,
    code,
    englishName,
    ...(TANGLISH_ALIASES[code] || [])
  ]));

  const chapterCounts = book.chapters.length;
  const verseCounts = book.chapters.reduce((sum, ch) => sum + (ch.verses ? ch.verses.length : 0), 0);

  bibleMeta.push({
    index: idx,
    code,
    id: code,
    name: book.name,
    english: englishName,
    testament,
    chapters: chapterCounts,
    verseCount: verseCounts,
    startPage,
    aliases
  });

  // Write taovbsi book
  fs.writeFileSync(
    path.resolve(TAOVBSI_DIR, `${code}.json`),
    JSON.stringify({
      code,
      name: book.name,
      english: englishName,
      chapters: book.chapters
    })
  );

  // Write kjv book
  if (englishBook) {
    fs.writeFileSync(
      path.resolve(KJV_DIR, `${code}.json`),
      JSON.stringify({
        code,
        name: englishBook.name,
        chapters: englishBook.chapters
      })
    );
  }
});

fs.writeFileSync(path.resolve(PUBLIC_DATA, 'bible-meta.json'), JSON.stringify(bibleMeta, null, 2));
console.log(`Saved ${bibleMeta.length} Bible books metadata & individual chapter files.`);

console.log('--- Preparing Song Data ---');

const songIndexSource = path.resolve(COMPANION_DIR, 'assets', 'data', 'offlineSongIndex.json');
const songIndexRaw = JSON.parse(fs.readFileSync(songIndexSource, 'utf-8'));

console.log(`Processing ${songIndexRaw.songs.length} songs from index...`);

// Clean up searchable to avoid duplicate phrases and save space
const cleanedSongs = songIndexRaw.songs.map((s) => {
  let search = s.searchable || '';
  // Dedup words in search string to save memory
  const uniqueWords = Array.from(new Set(search.split(/\s+/).filter(Boolean))).slice(0, 35).join(' ');
  return {
    id: s.id,
    t: s.title,
    s: s.subtitle || '',
    n: s.titleNormalized || '',
    q: uniqueWords,
    c: s.contentChunk
  };
});

fs.writeFileSync(path.resolve(SONGS_DIR, 'songs-index.json'), JSON.stringify(cleanedSongs));
console.log(`Saved optimized songs-index.json (${cleanedSongs.length} entries).`);

// Copy chunks
const chunksSourceDir = path.resolve(COMPANION_DIR, 'assets', 'data', 'offline-song-content');
const chunkFiles = fs.readdirSync(chunksSourceDir).filter((f) => f.endsWith('.json'));

chunkFiles.forEach((file) => {
  fs.copyFileSync(
    path.resolve(chunksSourceDir, file),
    path.resolve(SONGS_CHUNKS_DIR, file)
  );
});

console.log(`Copied ${chunkFiles.length} song chunks to ${SONGS_CHUNKS_DIR}.`);
console.log('All data prepared successfully!');
