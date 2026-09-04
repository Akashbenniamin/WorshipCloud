const sectionPattern = /^(?:(pallavi|chorus|refrain|bridge|intro|verse|stanza|charanam|பல்லவி|சரணம்|கோரஸ்|அனுபல்லவி|இடைச்சரணம்|முகப்புரை)\s*(\d+)?|(?:verse|charanam|சரணம்)\s*[-:.]?\s*(\d+))\s*[:.)\-–—]*\s*$/i;
const numberedPattern = /^\s*(\d+)\s*[.)-]\s*(.*)$/;

export function normalizeSongSearch(value = '') {
  return String(value || '')
    .normalize('NFC')
    .toLocaleLowerCase('ta')
    .replace(/[\u200b\u200c\u200d]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function formatSectionLabel(rawLabel = '', fallbackIndex = 0) {
  const compact = String(rawLabel || '').trim();
  if (!compact) return fallbackIndex === 0 ? 'பல்லவி' : `சரணம் ${fallbackIndex}`;
  const match = compact.match(sectionPattern);
  if (!match) return compact;
  const key = String(match[1] || '').toLocaleLowerCase('ta');
  const number = match[2] || match[3] || '';
  const labels = {
    pallavi: 'பல்லவி',
    chorus: 'கோரஸ்',
    refrain: 'பல்லவி',
    bridge: 'இடைக்கண்ணி',
    intro: 'முகப்புரை',
    verse: 'சரணம்',
    stanza: 'சரணம்',
    charanam: 'சரணம்',
    'பல்லவி': 'பல்லவி',
    'சரணம்': 'சரணம்',
    'கோரஸ்': 'கோரஸ்',
    'அனுபல்லவி': 'அனுபல்லவி',
    'இடைச்சரணம்': 'இடைச்சரணம்',
    'முகப்புரை': 'முகப்புரை'
  };
  return `${labels[key] || compact}${number ? ` ${number}` : ''}`;
}

export function splitSongSections(lyrics = '') {
  const lines = String(lyrics || '').replace(/\r/g, '').split('\n').map((line) => line.trimEnd());
  const sections = [];
  let current = { label: '', lines: [] };

  const flush = () => {
    const filtered = current.lines.map((l) => l.trim()).filter(Boolean);
    if (filtered.length) {
      sections.push({
        id: `section-${sections.length + 1}`,
        label: formatSectionLabel(current.label, sections.length),
        lines: filtered,
        text: filtered.join('\n')
      });
    }
    current = { label: '', lines: [] };
  };

  for (const original of lines) {
    const line = original.trim();
    const heading = line.match(sectionPattern);
    if (heading) {
      flush();
      current.label = line;
      continue;
    }
    const numbered = line.match(numberedPattern);
    if (numbered && current.lines.length && !current.label) {
      flush();
      current.label = `சரணம் ${numbered[1]}`;
      if (numbered[2]) current.lines.push(numbered[2]);
      continue;
    }
    if (!line && current.lines.length) {
      flush();
      continue;
    }
    if (line) current.lines.push(line);
  }
  flush();

  if (!sections.length && String(lyrics || '').trim()) {
    const fallbackLines = String(lyrics).split('\n').map((l) => l.trim()).filter(Boolean);
    sections.push({
      id: 'section-1',
      label: 'பாடல்',
      lines: fallbackLines,
      text: fallbackLines.join('\n')
    });
  }

  return sections;
}

const TAMIL_TO_RO = {
  'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo',
  'எ': 'e', 'ஏ': 'ae', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'oo', 'ஔ': 'au',
  'க': 'k', 'ங': 'ng', 'ச': 's', 'ஞ': 'nj', 'ட': 't', 'ண': 'n',
  'த': 'th', 'ந': 'n', 'ப': 'p', 'ம': 'm', 'ய': 'y', 'ர': 'r',
  'ல': 'l', 'வ': 'v', 'ழ': 'zh', 'ள': 'l', 'ற': 'r', 'ன': 'n',
  'ஜ': 'j', 'ஷ': 'sh', 'ஸ': 's', 'ஹ': 'h'
};

const VOWEL_SIGNS = {
  '\u0BBE': 'aa', '\u0BBF': 'i', '\u0BC0': 'ee', '\u0BC1': 'u',
  '\u0BC2': 'oo', '\u0BC6': 'e', '\u0BC7': 'ae', '\u0BC8': 'ai',
  '\u0BCA': 'o', '\u0BCB': 'oo', '\u0BCC': 'au', '\u0BCD': ''
};

export function transliterateTamilToRoman(str = '') {
  let out = '';
  const s = String(str || '').normalize('NFC');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];
    if (TAMIL_TO_RO[ch]) {
      const base = TAMIL_TO_RO[ch];
      if (next && VOWEL_SIGNS[next] !== undefined) {
        out += base + VOWEL_SIGNS[next];
        i++;
      } else if (next === '\u0BCD') {
        out += base;
        i++;
      } else if (['க','ங','ச','ஞ','ட','ண','த','ந','ப','ம','ய','ர','ல','வ','ழ','ள','ற','ன','ஜ','ஷ','ஸ','ஹ'].includes(ch)) {
        out += base + 'a';
      } else {
        out += base;
      }
    } else {
      out += ch;
    }
  }
  return out.toLowerCase();
}

const TAMIL_CONSONANT_MAP = {
  'k': ['க'], 'ka': ['க'],
  'kar': ['கர', 'கர்', 'கார்', 'கற்'], 'car': ['கர', 'கர்', 'கார்', 'கற்'], 'gar': ['கர', 'கர்', 'கார்'],
  'kan': ['கண்', 'கன்'], 'kal': ['கல்', 'கால்'], 'kam': ['கம்', 'காம்'],
  'kri': ['கிறி', 'கிரு'], 'chris': ['கிறி'],
  's': ['ச'], 'sa': ['ச'], 'cha': ['ச'], 'sar': ['சர', 'சர்'],
  'th': ['த'], 'tha': ['த'], 'ta': ['த', 'ட'], 'thar': ['தர்', 'தர'],
  'p': ['ப'], 'pa': ['ப'], 'ba': ['ப'], 'par': ['பர', 'பர்'],
  'm': ['ம'], 'ma': ['ம'], 'mar': ['மர', 'மர்'],
  'y': ['ய'], 'ya': ['ய'],
  'r': ['ர', 'ற'], 'ra': ['ர', 'ற'],
  'l': ['ல', 'ள', 'ழ'], 'la': ['ல', 'ள'],
  'v': ['வ'], 'va': ['வ'], 'w': ['வ'], 'var': ['வர', 'வர்'],
  'n': ['ந', 'ன', 'ண'], 'na': ['ந', 'ன'],
  'a': ['அ', 'ஆ'], 'aa': ['ஆ'], 'i': ['இ'], 'ee': ['ஈ'], 'u': ['உ'], 'oo': ['ஊ'],
  'e': ['எ', 'ஏ'], 'ae': ['ஏ'], 'ai': ['ஐ'], 'o': ['ஒ', 'ஓ']
};

function getQueryTokens(raw = '') {
  const q = raw.trim().toLowerCase();
  const isTamil = /[\u0B80-\u0BFF]/.test(q);
  const romanTokens = new Set();
  const tamilTokens = new Set();

  if (isTamil) {
    tamilTokens.add(q);
    if (q === 'அ') { romanTokens.add('a'); }
    else if (q === 'ஆ') { romanTokens.add('aa'); romanTokens.add('a'); }
    else if (q === 'க') { romanTokens.add('k'); romanTokens.add('ka'); }
    else if (q === 'கர' || q === 'கர்' || q === 'கார்') { romanTokens.add('kar'); romanTokens.add('car'); romanTokens.add('gar'); }
    else if (q === 'ச') { romanTokens.add('s'); romanTokens.add('sa'); }
    else if (q === 'த') { romanTokens.add('th'); romanTokens.add('tha'); }
    else if (q === 'ப') { romanTokens.add('p'); romanTokens.add('pa'); }
    else if (q === 'ம') { romanTokens.add('m'); romanTokens.add('ma'); }
    else if (q === 'ய') { romanTokens.add('y'); romanTokens.add('ya'); }
    else if (q === 'ர') { romanTokens.add('r'); romanTokens.add('ra'); }
    else if (q === 'வ') { romanTokens.add('v'); romanTokens.add('va'); }
    const ro = transliterateTamilToRoman(q);
    if (ro) romanTokens.add(ro);
  } else {
    romanTokens.add(q);
    if (TAMIL_CONSONANT_MAP[q]) {
      TAMIL_CONSONANT_MAP[q].forEach(t => tamilTokens.add(t));
    }
  }
  return { roman: Array.from(romanTokens), tamil: Array.from(tamilTokens) };
}

/**
 * Enhanced song ranking matching exact user specification:
 * - Word 0 starts with query appears first (rank 0)
 * - Word 1 starts with query appears next (rank 1)
 * - Word i starts with query appears next (rank i)
 * - If none of the words start with it, words containing it appear (rank 100 + i)
 * - If still none, words containing characters in scrambled / out of order form appear (rank 200 + i)
 * - Multi-word phrase search: matches sequence of words or all query words in title
 * - Search text / lyrics matches appear after title matches (rank 500+)
 */
export function rankSongResults(results = [], query = '') {
  const raw = String(query || '').trim().toLowerCase();
  if (!raw || !results || !results.length) return results || [];

  const queryWords = raw.split(/\s+/).filter(Boolean);
  const isMultiWord = queryWords.length > 1;
  const wordTokens = isMultiWord ? queryWords.map(w => getQueryTokens(w)) : [];
  const fullTokens = getQueryTokens(raw);

  const scored = [];

  for (let sIdx = 0; sIdx < results.length; sIdx++) {
    const song = results[sIdx];
    const cleanTitle = (song.t || '').replace(/^[\s\d.\-–—|/()\[\]{}]+/, '').trim().toLowerCase();
    const tWords = cleanTitle.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
    const tWordsRoman = tWords.map(w => transliterateTamilToRoman(w));

    let bestScore = 999999;

    if (isMultiWord) {
      // 1. Check if cleanTitle directly contains the entire raw query
      if (cleanTitle.startsWith(raw)) {
        bestScore = 0;
      } else if (cleanTitle.includes(raw)) {
        bestScore = 20;
      } else {
        // Check if query words match in sequence starting at word i
        for (let i = 0; i <= tWords.length - queryWords.length; i++) {
          let seqMatch = true;
          for (let qwIdx = 0; qwIdx < queryWords.length; qwIdx++) {
            const tw = tWords[i + qwIdx];
            const twr = tWordsRoman[i + qwIdx];
            const tok = wordTokens[qwIdx];
            const wordMatch = tok.tamil.some(t => tw && tw.startsWith(t)) ||
                              tok.roman.some(r => (twr && twr.startsWith(r)) || (tw && tw.startsWith(r)));
            if (!wordMatch) {
              seqMatch = false;
              break;
            }
          }
          if (seqMatch) {
            bestScore = i;
            break;
          }
        }

        // Check if all query words exist anywhere in title
        if (bestScore >= 100) {
          const allFound = wordTokens.every(tok => {
            return tWords.some((tw, idx) => {
              const twr = tWordsRoman[idx];
              return tok.tamil.some(t => tw && tw.includes(t)) ||
                     tok.roman.some(r => (twr && twr.includes(r)) || (tw && tw.includes(r)));
            });
          });
          if (allFound) {
            bestScore = 100;
          }
        }

        // Check song.q
        if (bestScore >= 500) {
          const fullQ = (song.q || '').toLowerCase();
          if (fullQ.includes(raw)) {
            bestScore = 500;
          } else if (queryWords.every(qw => fullQ.includes(qw))) {
            bestScore = 550;
          }
        }
      }
    } else {
      // Single word query
      // 1. Direct TITLE word starts with query (0 for 1st word, 1 for 2nd word, etc.)
      for (let i = 0; i < tWords.length; i++) {
        const tw = tWords[i];
        const twr = tWordsRoman[i];
        let matched = false;
        for (const t of fullTokens.tamil) {
          if (tw && tw.startsWith(t)) { matched = true; break; }
        }
        if (!matched) {
          for (const r of fullTokens.roman) {
            if ((twr && twr.startsWith(r)) || (tw && tw.startsWith(r))) { matched = true; break; }
          }
        }
        if (matched) {
          bestScore = i;
          break;
        }
      }

      // 2. Direct TITLE word contains query as contiguous substring
      if (bestScore >= 100) {
        for (let i = 0; i < tWords.length; i++) {
          const tw = tWords[i];
          const twr = tWordsRoman[i];
          let matched = false;
          for (const t of fullTokens.tamil) {
            if (tw && tw.includes(t)) { matched = true; break; }
          }
          if (!matched) {
            for (const r of fullTokens.roman) {
              if ((twr && twr.includes(r)) || (tw && tw.includes(r))) { matched = true; break; }
            }
          }
          if (matched) {
            bestScore = Math.min(bestScore, 100 + i);
            break;
          }
        }
      }

      // 3. Direct TITLE word contains scrambled characters of query
      if (bestScore >= 200) {
        for (let i = 0; i < tWords.length; i++) {
          const tw = tWords[i];
          const twr = tWordsRoman[i];
          let matched = false;
          for (const t of fullTokens.tamil) {
            if (tw && t.length > 1 && Array.from(t).every(c => tw.includes(c))) { matched = true; break; }
          }
          if (!matched) {
            for (const r of fullTokens.roman) {
              if (twr && r.length > 1 && Array.from(r).every(c => twr.includes(c))) { matched = true; break; }
            }
          }
          if (matched) {
            bestScore = Math.min(bestScore, 200 + i);
            break;
          }
        }
      }

      // 4. Fallback to cleanTitle substring
      if (bestScore >= 250 && cleanTitle.includes(raw)) {
        bestScore = 250;
      }

      // 5. song.q words or text fallback
      if (bestScore >= 500) {
        const engMatch = (song.q || '').match(/[a-zA-Z].*$/);
        const qWords = engMatch ? engMatch[0].toLowerCase().split(/[^a-z0-9]+/).filter(Boolean) : [];
        for (let i = 0; i < qWords.length; i++) {
          for (const r of fullTokens.roman) {
            if (qWords[i].startsWith(r)) { bestScore = Math.min(bestScore, 500 + i); break; }
          }
          if (bestScore < 999999) break;
        }
        if (bestScore >= 600) {
          const fullQ = (song.q || '').toLowerCase();
          for (const r of fullTokens.roman) {
            if (fullQ.includes(r)) { bestScore = 600; break; }
          }
          for (const t of fullTokens.tamil) {
            if (fullQ.includes(t)) { bestScore = 600; break; }
          }
        }
      }
    }

    if (bestScore < 999999) {
      scored.push({ song, score: bestScore, originalIndex: sIdx });
    }
  }

  scored.sort((a, b) => a.score - b.score || a.originalIndex - b.originalIndex);
  return scored.map(item => item.song);
}
