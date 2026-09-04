import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Music, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Copy, 
  Check, 
  Star, 
  FileDown, 
  Presentation, 
  Trash2, 
  Plus, 
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
  uiLang = 'ta',
  userSongs = [],
  onOpenAddSong,
  onDeleteSong,
  user,
  onOpenAuth
}) {
  const t = translations[uiLang] || translations.ta;

  // Responsive mobile view state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [mobileTab, setMobileTab] = useState('lyrics'); // 'lyrics' | 'list'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    if (selectedSong.custom) {
      const sections = splitSongSections(selectedSong.lyrics);
      setSongDetails({
        ...selectedSong,
        sections
      });
      setLoadingSong(false);
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
    let sourceList = songsIndex || [];
    if (sidebarTab === 'favorites') sourceList = favorites;
    if (sidebarTab === 'my') sourceList = userSongs;
    if (!query.trim()) return sourceList.slice(0, displayCount);

    return rankSongResults(sourceList, query).slice(0, displayCount);
  }, [songsIndex, favorites, userSongs, sidebarTab, query, displayCount]);

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
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : undefined,
      gridTemplateColumns: isMobile ? undefined : '1fr 390px',
      gap: isMobile ? 0 : '1.25rem',
      padding: isMobile ? '0 0.5rem 0.5rem 0.5rem' : '0 1.5rem 0.5rem 1.5rem',
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* LEFT COLUMN: Song Lyrics Reader (Independently scrollable lyrics, matching Bible section) */}
      {(!isMobile || mobileTab === 'lyrics') && (
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
                padding: isMobile ? '0.65rem 0.9rem' : '0.9rem 1.25rem',
                marginBottom: '0.75rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isMobile && (
                    <button
                      onClick={() => setMobileTab('list')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title="Back to song list"
                    >
                      <ChevronLeft size={16} />
                      <span>{uiLang === 'ta' ? 'பட்டியல்' : 'List'}</span>
                    </button>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Music size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <h1 style={{ fontSize: isMobile ? '1.15rem' : '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25, margin: 0 }}>
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
      )}

      {/* RIGHT SIDEBAR: 100% FIXED / DOES NOT SCROLL WITH PAGE */}
      {(!isMobile || mobileTab === 'list') && (
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
          {/* Quick bar on mobile to jump back to lyrics if a song is already loaded */}
          {isMobile && selectedSong && (
            <div style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--accent-light)',
              borderBottom: '1px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 750, color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📖 {selectedSong.t}
              </div>
              <button
                onClick={() => setMobileTab('lyrics')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {uiLang === 'ta' ? 'வரிகள் →' : 'Lyrics →'}
              </button>
            </div>
          )}

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
              padding: '10px 8px',
              fontSize: '0.80rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: sidebarTab === 'favorites' ? 'var(--accent)' : 'var(--text-tertiary)',
              borderBottom: sidebarTab === 'favorites' ? '2px solid var(--accent)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Star size={15} fill={sidebarTab === 'favorites' ? 'currentColor' : 'none'} />
            <span>{t.favorites} ({favorites.length})</span>
          </button>

          <button
            onClick={() => setSidebarTab('my')}
            style={{
              flex: 1,
              padding: '10px 8px',
              fontSize: '0.80rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: sidebarTab === 'my' ? 'var(--accent)' : 'var(--text-tertiary)',
              borderBottom: sidebarTab === 'my' ? '2px solid var(--accent)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Music size={15} />
            <span>{t.mySongs} ({userSongs.length})</span>
          </button>
        </div>

        {/* Action Button & Search Bar */}
        <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              if (!user && onOpenAuth) {
                onOpenAuth();
              } else if (onOpenAddSong) {
                onOpenAddSong();
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 750,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <Plus size={15} />
            <span>{t.addSong}</span>
          </button>
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
                    onClick={() => {
                      setSelectedSong(s);
                      if (isMobile) setMobileTab('lyrics');
                    }}
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
                        {s.t || s.title}
                      </div>
                      {(s.ro || s.englishTitle) && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.ro || s.englishTitle}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {/* Delete Custom Song Button */}
                      {s.custom && onDeleteSong && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(t.confirmDeleteSong || 'Are you sure you want to delete this song?')) {
                              onDeleteSong(s.id);
                              if (selectedSong?.id === s.id) setSelectedSong(null);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444',
                            borderRadius: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title={t.deleteSong || 'Delete Song'}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}

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
      )}

      {/* Floating mobile button to switch to search songs */}
      {isMobile && mobileTab === 'lyrics' && (
        <div style={{
          position: 'fixed',
          bottom: '18px',
          right: '18px',
          zIndex: 60
        }}>
          <button
            onClick={() => setMobileTab('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '24px',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontWeight: 800,
              fontSize: '0.84rem',
              border: 'none',
              boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
              cursor: 'pointer'
            }}
          >
            <Search size={15} />
            <span>{uiLang === 'ta' ? 'பாடல்கள் தேடல்' : 'Search Songs'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
