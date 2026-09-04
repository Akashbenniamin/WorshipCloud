export function normalizeSearch(value = '') {
  return String(value || '')
    .toLocaleLowerCase()
    .normalize('NFC')
    .replace(/[\u200c\u200d\ufeff]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Parses queries like:
 * "John 3:16" -> { book: 'John', chapter: 3, verse: 16 }
 * "யோவான் 3:16" -> { book: 'யோவான்', chapter: 3, verse: 16 }
 * "1 samuel 2:3" -> { book: '1 samuel', chapter: 2, verse: 3 }
 * "சங்கீதம் 23" -> { book: 'சங்கீதம்', chapter: 23, verse: 1 }
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
  // Handles prefixes with numbers like "1 John 2:3" or "1 யோவான் 2:3"
  const refMatch = raw.match(/^([1-3]?\s*[\p{L}\s]+?)\s*(\d+)(?:[:.\s](\d+))?$/u);
  if (!refMatch) return null;

  const bookPart = refMatch[1].trim();
  const chapter = parseInt(refMatch[2], 10);
  const verse = refMatch[3] ? parseInt(refMatch[3], 10) : 1;

  // Match bookPart against booksMeta
  const normalizedBook = normalizeSearch(bookPart);
  const matchedBook = booksMeta.find((b) => {
    if (normalizeSearch(b.code) === normalizedBook) return true;
    if (normalizeSearch(b.name) === normalizedBook) return true;
    if (normalizeSearch(b.english) === normalizedBook) return true;
    return (b.aliases || []).some((alias) => normalizeSearch(alias) === normalizedBook);
  });

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
