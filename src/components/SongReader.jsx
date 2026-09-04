import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Music, 
  Search, 
  ChevronRight, 
  Copy, 
  Check, 
  Star, 
  FileDown, 
  Presentation,
  Trash2,
  X
} from 'lucide-react';
import { normalizeSongSearch, splitSongSections, rankSongResults } from '../lib/songParser';
import { exportSongToPdf, exportSongToPptx } from '../lib/exportTools';
import { translations } from '../lib/i18n';

const chunkCache = new Map();

export function SongReader({
  songsIndex,
  fontSize,
  selectedSongInit,
  uiLang = 'ta'
}) {
  const t = translations[uiLang] || translations.ta;

  const [query, setQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [songDetails, setSongDetails] = useState(null);
  const [loadingSong, setLoadingSong] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('all'); // 'all' | 'favorites'

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('worship_cloud_song_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Select first song or initial song
  useEffect(() => {
    if (selectedSongInit) {
      setSelectedSong(selectedSongInit);
    } else if (!selectedSong && songsIndex && songsIndex.length > 0) {
      setSelectedSong(songsIndex[0]);
    }
  }, [selectedSongInit, songsIndex, selectedSong]);

  // Load selected song lyrics
  useEffect(() => {
    if (!selectedSong) {
      setSongDetails(null);
      return;
    }

    let isCancelled = false;
    setLoadingSong(true);

    const chunkId = String(selectedSong.c).padStart(2, '0');
    const chunkUrl = `./data/songs/chunks/chunk-${chunkId}.json`;

    const fetchChunk = async () => {
      try {
        let chunkData;
        if (chunkCache.has(chunkUrl)) {
          chunkData = chunkCache.get(chunkUrl);
        } else {
          const res = await fetch(chunkUrl);
          chunkData = await res.json();
          chunkCache.set(chunkUrl, chunkData);
        }

        if (!isCancelled && chunkData?.songs) {
          const content = chunkData.songs[selectedSong.id];
          if (content) {
            const sections = splitSongSections(content.lyrics);
            setSongDetails({
              ...content,
              sections
            });
          }
        }
      } catch (err) {
        console.error('Failed to load song chunk:', err);
      } finally {
        if (!isCancelled) setLoadingSong(false);
      }
    };

    fetchChunk();
    return () => { isCancelled = true; };
  }, [selectedSong]);

  const toggleFavorite = (song) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      let updated;
      if (exists) {
        updated = prev.filter((s) => s.id !== song.id);
      } else {
        updated = [song, ...prev];
      }
      try {
        localStorage.setItem('worship_cloud_song_favorites', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isFav = selectedSong && favorites.some((s) => s.id === selectedSong.id);

  const [displayCount, setDisplayCount] = useState(150);

  // Reset displayCount on query or tab change
  useEffect(() => {
    setDisplayCount(150);
  }, [query, sidebarTab]);

  const filteredSongs = useMemo(() => {
    const sourceList = sidebarTab === 'favorites' ? favorites : (songsIndex || []);
    if (!query.trim()) return sourceList.slice(0, displayCount);

    return rankSongResults(sourceList, query).slice(0, displayCount);
  }, [songsIndex, favorites, sidebarTab, query, displayCount]);

  const handleSongListScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      setDisplayCount((prev) => prev + 100);
    }
  };

  // Clean lyrics: remove standalone "பல்லவி", "சரணம்", "Chorus", "Verse" titles
  const cleanLyrics = useMemo(() => {
    if (!songDetails?.lyrics) return '';
    const lines = String(songDetails.lyrics).replace(/\r/g, '').split('\n');
    const cleaned = lines.filter((line) => {
      const trimmed = line.trim();
      if (/^(?:பல்லவி|சரணம்|கோரஸ்|அனுபல்லவி|இடைச்சரணம்|chorus|verse|refrain|stanza|bridge)\s*\d*[:.-]?$/i.test(trimmed)) {
        return false;
      }
      return true;
    });
    return cleaned.join('\n').trim();
  }, [songDetails]);

  const copySongLyrics = () => {
    if (!selectedSong || !cleanLyrics) return;
    navigator.clipboard.writeText(`${selectedSong.t}\n\n${cleanLyrics}`);
    setCopiedId('full');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPdf = () => {
    if (!selectedSong || !cleanLyrics) return;
    exportSongToPdf(selectedSong.t, cleanLyrics, 'Worship Cloud');
  };

  const handleDownloadPptx = () => {
    if (!selectedSong || !cleanLyrics) return;
    exportSongToPptx(selectedSong.t, cleanLyrics, { theme: 'dark' });
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 390px',
      gap: '1.25rem',
      padding: '0 1.5rem 0.5rem 1.5rem',
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* LEFT COLUMN: Song Lyrics Reader (Independently scrollable lyrics, matching Bible section) */}
      <section style={{
        minWidth: 0,
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {selectedSong ? (
          <div style={{
            height: '100%',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* FIXED Header Banner (Matches Bible section) */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              padding: '0.9rem 1.25rem',
              marginBottom: '0.75rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              flexShrink: 0
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Music size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {selectedSong.t}
                  </h1>
                </div>
              </div>

              {/* Action Buttons: Order: PDF -> PPTX -> Copy (icon only) -> Star/Fav (icon only) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* 1. PDF */}
                <button
                  onClick={handleDownloadPdf}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Download PDF song sheet"
                >
                  <FileDown size={15} style={{ color: 'var(--accent)' }} />
                  <span>PDF</span>
                </button>

                {/* 2. PPTX */}
                <button
                  onClick={handleDownloadPptx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Download PowerPoint presentation"
                >
                  <Presentation size={15} style={{ color: '#059669' }} />
                  <span>PPTX</span>
                </button>

                {/* 3. Copy (Icon Only) */}
                <button
                  onClick={copySongLyrics}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    color: copiedId === 'full' ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={copiedId === 'full' ? t.copied : t.copy}
                >
                  {copiedId === 'full' ? <Check size={16} /> : <Copy size={16} />}
                </button>

                {/* 4. Star / Favorite (Icon Only) */}
                <button
                  onClick={() => toggleFavorite(selectedSong)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: isFav ? 'var(--accent-light)' : 'var(--bg-canvas)',
                    border: `1px solid ${isFav ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    color: isFav ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Lyrics Reading Area: INDEPENDENTLY SCROLLABLE, CLEAN FLOW, NO BOXES, NO TITLES */}
            {loadingSong ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                பாடல் வரிகள் ஏற்றப்படுகின்றன...
              </div>
            ) : (
              <div style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '1.75rem 2.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: 2.1,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-line',
                  fontFamily: 'var(--font-tamil)',
                  fontWeight: 450,
                  maxWidth: '820px'
                }}>
                  {cleanLyrics}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '5rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            பக்கவாட்டுப் பட்டியலில் இருந்து ஒரு பாடலைத் தேர்ந்தெடுக்கவும்.
          </div>
        )}
      </section>

      {/* RIGHT SIDEBAR: 100% FIXED / DOES NOT SCROLL WITH PAGE */}
      <aside style={{
        minWidth: 0,
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        boxSizing: 'border-box'
      }}>
        {/* Sidebar Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-canvas)',
          flexShrink: 0
        }}>
          <button
            onClick={() => setSidebarTab('all')}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: sidebarTab === 'all' ? 'var(--accent)' : 'var(--text-tertiary)',
              borderBottom: sidebarTab === 'all' ? '2px solid var(--accent)' : 'none',
              cursor: 'pointer'
            }}
          >
            <Music size={16} />
            <span>{t.songs}</span>
          </button>

          <button
            onClick={() => setSidebarTab('favorites')}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: sidebarTab === 'favorites' ? 'var(--accent)' : 'var(--text-tertiary)',
              borderBottom: sidebarTab === 'favorites' ? '2px solid var(--accent)' : 'none',
              cursor: 'pointer'
            }}
          >
            <Star size={16} fill={sidebarTab === 'favorites' ? 'currentColor' : 'none'} />
            <span>{t.favorites} ({favorites.length})</span>
          </button>
        </div>

        {/* Search Bar (Identical size and styling as Bible Book search bar) */}
        <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0 12px',
            minHeight: '44px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s ease'
          }}>
            <Search size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={t.searchSongs}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.target.select()}
              onFocus={(e) => e.target.select()}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.88rem',
                color: 'var(--text-primary)',
                width: '100%',
                fontWeight: 650
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-tertiary)'
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Songs List: Scrollable with dynamic load-more */}
        <div 
          onScroll={handleSongListScroll}
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.5rem' }}
        >
          {filteredSongs.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
              {sidebarTab === 'favorites' ? 'இன்னும் விருப்பமான பாடல்கள் சேர்க்கப்படவில்லை.' : t.noSongsFound}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredSongs.map((s) => {
                const isSelected = selectedSong?.id === s.id;
                const isItemFav = favorites.some((f) => f.id === s.id);

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSong(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      gap: '8px'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontWeight: isSelected ? 800 : 650,
                        fontSize: '0.86rem',
                        color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {s.t}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {/* 1-Click Toggle Favorite Directly from List */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(s);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isItemFav ? 'var(--accent)' : 'var(--text-tertiary)',
                          borderRadius: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title={isItemFav ? 'Remove from favorites' : 'Add to favorites'}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--accent)';
                          e.currentTarget.style.transform = 'scale(1.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = isItemFav ? 'var(--accent)' : 'var(--text-tertiary)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Star size={15} fill={isItemFav ? 'currentColor' : 'none'} />
                      </button>

                      <ChevronRight size={14} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
