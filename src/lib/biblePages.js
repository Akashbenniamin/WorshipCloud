// Approximate printed-page index for BSI Tamil O.V. (New Ortho) copy.
export const TAOVBSI_BOOK_START_PAGES = {
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

const TAOVBSI_OLD_CODES = new Set([
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'
]);

const taovbsiAnchors = Object.entries(TAOVBSI_BOOK_START_PAGES).sort((a, b) => a[1] - b[1]);
const TAOVBSI_SECTION_END = { old: 1110, new: 355 };

const pageInterpolation = (position, points) => {
  if (position <= points[0].position) return points[0].page;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1];
    const right = points[index];
    if (position <= right.position) {
      const span = right.position - left.position || 1;
      return left.page + ((position - left.position) / span) * (right.page - left.page);
    }
  }
  return points[points.length - 1].page;
};

export function getApproximateVersePage(bookMeta, chapters, chapterNumber, verseNumber = 1) {
  if (!bookMeta?.code || !TAOVBSI_BOOK_START_PAGES[bookMeta.code]) return null;
  const code = bookMeta.code;
  const start = TAOVBSI_BOOK_START_PAGES[code];
  const isOld = TAOVBSI_OLD_CODES.has(code);

  const index = taovbsiAnchors.findIndex(([item]) => item === code);
  const next = index >= 0 ? taovbsiAnchors.slice(index + 1).find(([item]) => TAOVBSI_OLD_CODES.has(item) === isOld) : null;
  const end = next ? next[1] - 1 : (isOld ? TAOVBSI_SECTION_END.old : TAOVBSI_SECTION_END.new);

  if (!chapters || !chapters.length) return start;

  const totalVerses = chapters.reduce((sum, item) => sum + (item.verses ? item.verses.length : 0), 0) || 1;
  let beforeChapter = 0;
  for (const item of chapters) {
    if (item.number < Number(chapterNumber)) {
      beforeChapter += (item.verses ? item.verses.length : 0);
    }
  }

  const currentChapter = chapters.find((item) => item.number === Number(chapterNumber));
  const verseIndex = beforeChapter + Math.max(0, currentChapter && currentChapter.verses ? currentChapter.verses.findIndex((v) => v.number === Number(verseNumber)) : 0);
  const position = verseIndex / totalVerses;

  if (code === 'PSA') {
    const psalmChapterStart = (chNum) => {
      let count = 0;
      for (const item of chapters) {
        if (item.number >= chNum) break;
        count += (item.verses ? item.verses.length : 0);
      }
      return count;
    };
    const psalm23 = psalmChapterStart(23);
    const psalm119 = psalmChapterStart(119);
    const calibratedPoints = [
      { position: 0, page: start },
      { position: psalm23 / totalVerses, page: 683 },
      { position: psalm119 / totalVerses, page: 745 },
      { position: 1, page: end }
    ];
    return Math.round(pageInterpolation(position, calibratedPoints));
  }

  return Math.round(start + position * Math.max(0, end - start));
}
