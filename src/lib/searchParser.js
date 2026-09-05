export function normalizeSearch(value = '') {
  return String(value || '')
    .toLocaleLowerCase()
    .normalize('NFC')
    .replace(/[\u200c\u200d\ufeff]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Phonetic normalizer for Tanglish (Tamil written in English script).
 * Normalizes common variations such as th/t, dh/d, ee/i, oo/u, aa/a, w/v, etc.
 */
export function phoneticTanglish(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/w/g, 'v')
    .replace(/z/g, 's')
    .replace(/sh/g, 's')
    .replace(/[\s\-_.]/g, '');
}

/**
 * Matches a book string (Tamil, English, or Tanglish) against booksMeta.
 */
export function matchBookQuery(bookPart = '', booksMeta = []) {
  if (!bookPart || !booksMeta.length) return null;
  const normalizedBook = normalizeSearch(bookPart);
  const ptBook = phoneticTanglish(bookPart);

  // 1. Exact normalized match on code, name, english, or aliases
  let matched = booksMeta.find((b) => {
    if (normalizeSearch(b.code) === normalizedBook) return true;
    if (normalizeSearch(b.name) === normalizedBook) return true;
    if (normalizeSearch(b.english) === normalizedBook) return true;
    return (b.aliases || []).some((alias) => normalizeSearch(alias) === normalizedBook);
  });
  if (matched) return matched;

  // 2. Phonetic Tanglish match (e.g. yovan -> yovaan, sangeetham -> sangitham)
  matched = booksMeta.find((b) => {
    if (phoneticTanglish(b.code) === ptBook) return true;
    if (phoneticTanglish(b.english) === ptBook) return true;
    return (b.aliases || []).some((alias) => phoneticTanglish(alias) === ptBook);
  });
  if (matched) return matched;

  // 3. Starts-with / prefix match
  matched = booksMeta.find((b) => {
    if (normalizeSearch(b.code).startsWith(normalizedBook)) return true;
    if (normalizeSearch(b.english).startsWith(normalizedBook)) return true;
    if (normalizeSearch(b.name).startsWith(normalizedBook)) return true;
    return (b.aliases || []).some((alias) => {
      const na = normalizeSearch(alias);
      return na.startsWith(normalizedBook) || (ptBook.length >= 2 && phoneticTanglish(alias).startsWith(ptBook));
    });
  });
  return matched || null;
}

/**
 * Filters all books in booksMeta matching a query in Tamil, English, or Tanglish.
 */
export function filterBooksByQuery(query = '', booksMeta = [], maxResults = 6) {
  if (!query || !booksMeta.length) return [];
  const needle = normalizeSearch(query);
  const ptNeedle = phoneticTanglish(query);
  if (!needle && !ptNeedle) return [];

  const results = [];
  for (const b of booksMeta) {
    const codeNorm = normalizeSearch(b.code);
    const engNorm = normalizeSearch(b.english);
    const nameNorm = normalizeSearch(b.name);
    const ptEng = phoneticTanglish(b.english);

    const isMatch =
      codeNorm.includes(needle) ||
      engNorm.includes(needle) ||
      nameNorm.includes(needle) ||
      (ptNeedle.length >= 2 && ptEng.includes(ptNeedle)) ||
      (b.aliases || []).some((a) => {
        const na = normalizeSearch(a);
        const pa = phoneticTanglish(a);
        return na.includes(needle) || (ptNeedle.length >= 2 && pa.includes(ptNeedle));
      });

    if (isMatch) {
      results.push(b);
      if (results.length >= maxResults) break;
    }
  }
  return results;
}

/**
 * Parses queries like:
 * "John 3:16" -> { book: 'John', chapter: 3, verse: 16 }
 * "yovan 3:16" -> { book: 'யோவான்', chapter: 3, verse: 16 }
 * "யோவான் 3:16" -> { book: 'யோவான்', chapter: 3, verse: 16 }
 * "1 samuel 2:3" -> { book: '1 samuel', chapter: 2, verse: 3 }
 * "சங்கீதம் 23" -> { book: 'சங்கீதம்', chapter: 23, verse: 1 }
 * "san 2.1" -> { book: 'சங்கீதம்', chapter: 2, verse: 1 }
 * "p 683" or "page 683" or "பக்கம் 683" -> { type: 'page', page: 683 }
 */
export function parseReferenceQuery(query, booksMeta = []) {
  if (!query || typeof query !== 'string') return null;
  const raw = query.trim();

  // 1. Check for page query
  const pageMatch = raw.match(/^(?:page|p|பக்கம்|பக்)[.\s:]*(\d+)$/i);
  if (pageMatch) {
    return {
      type: 'page',
      page: parseInt(pageMatch[1], 10)
    };
  }

  // 2. Reference format: [Book Name] [Chapter]:[Verse] or [Book Name] [Chapter]
  // Handles prefixes with numbers like "1 John 2:3" or "1 யோவான் 2:3", dot separator like "san 2.1"
  const refMatch = raw.match(/^([1-3]?\s*[\p{L}\p{M}\s]+?)\s*(\d+)(?:[:.\s](\d+))?$/u);
  if (!refMatch) return null;

  const bookPart = refMatch[1].trim();
  const chapter = parseInt(refMatch[2], 10);
  const verse = refMatch[3] ? parseInt(refMatch[3], 10) : 1;

  // Match bookPart against booksMeta with Tamil, English, and phonetic Tanglish
  const matchedBook = matchBookQuery(bookPart, booksMeta);

  if (matchedBook) {
    return {
      type: 'reference',
      book: matchedBook,
      chapter,
      verse
    };
  }

  return null;
}
