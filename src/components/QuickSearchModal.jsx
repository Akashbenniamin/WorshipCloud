import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Music, FileText, ArrowRight, CornerDownLeft } from 'lucide-react';
import { parseReferenceQuery, normalizeSearch } from '../lib/searchParser';
import { rankSongResults } from '../lib/songParser';

export function QuickSearchModal({
  isOpen,
  onClose,
  booksMeta,
  onSelectBibleReference,
  onSelectPage,
  onSelectSong,
  songsIndex
}) {
  const [query, setQuery] = useState('');
  const [songResults, setSongResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSongResults([]);
    }
  }, [isOpen]);

  // Handle reference parsing
  const parsedRef = parseReferenceQuery(query, booksMeta);

  // Search songs when query has at least 2 characters using Windows app ranking
  useEffect(() => {
    if (!songsIndex || !query.trim() || query.trim().length < 2) {
      setSongResults([]);
      return;
    }
    const needle = normalizeSearch(query);
    const matches = [];
    for (const song of songsIndex) {
      if (song.q && song.q.includes(needle)) {
        matches.push(song);
        if (matches.length >= 80) break;
      }
    }
    setSongResults(rankSongResults(matches, query).slice(0, 8));
  }, [query, songsIndex]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter') {
      if (parsedRef) {
        if (parsedRef.type === 'page') {
          onSelectPage(parsedRef.page);
        } else {
          onSelectBibleReference(parsedRef.book.code, parsedRef.chapter, parsedRef.verse);
        }
        onClose();
      } else if (songResults.length > 0) {
        onSelectSong(songResults[0]);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 110,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '12vh',
      paddingLeft: '1rem',
      paddingRight: '1rem'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--bg-canvas)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '620px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <Search size={20} style={{ color: 'var(--accent)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="வேத வசனம் (John 3:16, யோவான் 3:16), பக்கம் (p 683), அல்லது பாடல்..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '1.05rem',
              color: 'var(--text-primary)'
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--text-tertiary)' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div style={{ maxHeight: '55vh', overflowY: 'auto', padding: '0.75rem' }}>
          {/* Direct Bible Jump Card */}
          {parsedRef && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px', paddingLeft: '8px' }}>
                நேரடி வேத வாசிப்பு (Direct Scripture Jump)
              </div>
              {parsedRef.type === 'page' ? (
                <button
                  onClick={() => {
                    onSelectPage(parsedRef.page);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--accent-light)',
                    border: '1px solid var(--accent)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.98rem' }}>
                        அச்சுப் பக்கம் {parsedRef.page} க்குச் செல்லவும்
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Jump to printed Bible page {parsedRef.page}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span>திறக்க</span>
                    <CornerDownLeft size={16} />
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onSelectBibleReference(parsedRef.book.code, parsedRef.chapter, parsedRef.verse);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--accent-light)',
                    border: '1px solid var(--accent)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.98rem' }}>
                        {parsedRef.book.name} {parsedRef.chapter}:{parsedRef.verse}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {parsedRef.book.english} {parsedRef.chapter}:{parsedRef.verse}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span>திறக்க</span>
                    <CornerDownLeft size={16} />
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Song Search Results */}
          {songResults.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px', paddingLeft: '8px' }}>
                பாடல்கள் ({songResults.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {songResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSong(s);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      transition: 'all 0.1s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Music size={16} style={{ color: 'var(--accent)' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {s.t}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                          {uiLang === 'ta' ? 'தமிழ் கிறிஸ்தவப் பாடல்' : 'Christian Song'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!parsedRef && songResults.length === 0 && query.trim().length >= 2 && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              எந்தப் பொருத்தமும் கிடைக்கவில்லை. தயவுசெய்து வேறு வார்த்தையைத் தேடவும்.
            </div>
          )}

          {!query.trim() && (
            <div style={{ padding: '1rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                எடுத்துக்காட்டு தேடல்கள்:
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
                <li>📖 <strong>யோவான் 3:16</strong> அல்லது <strong>John 3:16</strong> (வசனத்திற்கு நேராகச் செல்ல)</li>
                <li>📄 <strong>பக் 683</strong> அல்லது <strong>p 683</strong> (சங்கீதம் 23 அச்சுப் பக்கத்திற்கு)</li>
                <li>🎵 <strong>ஆவியானவரே</strong> (பாடலைத் தேட)</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
