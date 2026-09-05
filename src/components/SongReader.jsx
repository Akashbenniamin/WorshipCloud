import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Music, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Copy, 
  Check, 
  Star, 
  FileDown, 
  Presentation, 
  Trash2, 
  Plus, 
  X,
  MoreVertical,
  Sliders,
  LayoutGrid
} from 'lucide-react';
import { normalizeSongSearch, splitSongSections, rankSongResults } from '../lib/songParser';
import { exportSongToPdf, exportSongToPptx } from '../lib/exportTools';
import { translations } from '../lib/i18n';

const chunkCache = new Map();

export function SongReader({
  songsIndex,
  fontSize,
  setFontSize,
  selectedSongInit,
  uiLang = 'ta',
  userSongs = [],
  onOpenAddSong,
  onDeleteSong,
  user,
  onOpenAuth,
  theme,
  setTheme
}) {
  const t = translations[uiLang] || translations.ta;

  // Responsive mobile view state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [mobileTab, setMobileTab] = useState(() => (typeof window !== 'undefined' && window.innerWidth <= 768) ? 'list' : 'lyrics');

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

  // Mobile Song Sheet & Customization States
  const [isMobileSongSheetOpen, setIsMobileSongSheetOpen] = useState(false);
  const [isSongCustomizationOpen, setIsSongCustomizationOpen] = useState(false);
  const [fullscreenSlideStanza, setFullscreenSlideStanza] = useState(null); // { stanzaIndex: number }
  const [isStanzaNavModalOpen, setIsStanzaNavModalOpen] = useState(false);

  // Swipe gesture detection for fullscreen stanza slide
  const songTouchStartY = useRef(null);
  const songTouchStartX = useRef(null);

  const handleSongSlideTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      songTouchStartY.current = e.touches[0].clientY;
      songTouchStartX.current = e.touches[0].clientX;
    }
  };

  const handleSongSlideTouchEnd = (e) => {
    if (songTouchStartY.current === null || songTouchStartX.current === null) return;
    const deltaY = e.changedTouches[0].clientY - songTouchStartY.current;
    const deltaX = e.changedTouches[0].clientX - songTouchStartX.current;
    songTouchStartY.current = null;
    songTouchStartX.current = null;

    // Swiping up or down jumps to the first slide / stanza
    if (Math.abs(deltaY) > 40 && Math.abs(deltaY) > Math.abs(deltaX)) {
      setFullscreenSlideStanza((prev) => (prev ? { ...prev, stanzaIndex: 0 } : null));
    }
  };

  // Fullscreen and Orientation helpers for mobile slide mode
  const exitFullscreenSlide = () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (e) {}
    try {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    } catch (e) {}
  };

  const enterFullscreenSlide = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen({ navigationUI: 'hide' });
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      }
    } catch (e) {}
    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (e) {}
  };

  // Hardware back button to exit fullscreen slide mode
  useEffect(() => {
    const handlePopState = () => {
      if (fullscreenSlideStanza) {
        setFullscreenSlideStanza(null);
        setIsStanzaNavModalOpen(false);
        exitFullscreenSlide();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fullscreenSlideStanza]);

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('worship_cloud_song_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Select first song or initial song (on mobile, stays on list unless selectedSongInit provided)
  useEffect(() => {
    if (selectedSongInit) {
      setSelectedSong(selectedSongInit);
      if (isMobile) setMobileTab('lyrics');
    } else if (!isMobile && !selectedSong && songsIndex && songsIndex.length > 0) {
      setSelectedSong(songsIndex[0]);
    }
  }, [selectedSongInit, songsIndex, selectedSong, isMobile]);

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

  const songStanzas = useMemo(() => {
    if (songDetails?.sections && songDetails.sections.length > 0) {
      const parsed = songDetails.sections
        .map((s) => (typeof s === 'string' ? s : s.content || s.text || ''))
        .filter((s) => s.trim().length > 0);
      if (parsed.length > 0) return parsed;
    }
    if (!cleanLyrics) return [];
    return cleanLyrics.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  }, [songDetails, cleanLyrics]);

  const handleNextStanza = () => {
    if (!fullscreenSlideStanza) return;
    const cur = fullscreenSlideStanza.stanzaIndex;
    if (cur < songStanzas.length - 1) {
      setFullscreenSlideStanza({ stanzaIndex: cur + 1 });
    }
  };

  const handlePrevStanza = () => {
    if (!fullscreenSlideStanza) return;
    const cur = fullscreenSlideStanza.stanzaIndex;
    if (cur > 0) {
      setFullscreenSlideStanza({ stanzaIndex: cur - 1 });
    }
  };

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
      padding: isMobile ? '8px 0.5rem 0.5rem 0.5rem' : '0 1.5rem 0.5rem 1.5rem',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  {/* Tappable Title Card: Hybrid Dropdown Opener on Mobile */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isMobile) setIsMobileSongSheetOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: isMobile ? 'pointer' : 'default',
                      textAlign: 'left',
                      minWidth: 0,
                      flex: 1
                    }}
                    title={isMobile ? (uiLang === 'ta' ? 'பாடலை மாற்ற கிளிக் செய்க' : 'Click to switch song') : undefined}
                  >
                    <Music size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <h1 style={{
                      fontSize: isMobile ? '1.18rem' : '1.45rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.25,
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {selectedSong.t}
                    </h1>
                    {isMobile && <ChevronDown size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                  </button>
                </div>

              {/* Action Buttons: Desktop: PDF -> PPTX -> Copy -> Star; Mobile: Star + 3-Dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {!isMobile ? (
                  <>
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
                  </>
                ) : (
                  <>
                    {/* Mobile: Star / Favorite */}
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
                        cursor: 'pointer'
                      }}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star size={17} fill={isFav ? 'currentColor' : 'none'} />
                    </button>

                    {/* Mobile: 3-Dot Customization & Download Menu */}
                    <button
                      type="button"
                      onClick={() => setIsSongCustomizationOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                      title={uiLang === 'ta' ? 'அமைப்புகள் & பதிவிறக்கம்' : 'Options & Downloads'}
                    >
                      <MoreVertical size={17} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Lyrics Reading Area: INDEPENDENTLY SCROLLABLE, CLEAN FLOW */}
            {loadingSong ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                பாடல் வரிகள் ஏற்றப்படுகின்றன...
              </div>
            ) : (
              <div style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: isMobile ? '0.85rem 0.65rem 76px 0.65rem' : '1.75rem 2.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {isMobile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {songStanzas.map((stanza, sIdx) => (
                      <div
                        key={sIdx}
                        onClick={() => {
                          setFullscreenSlideStanza({ stanzaIndex: sIdx });
                          window.history.pushState({ modal: 'fullscreen_song_stanza' }, '');
                          enterFullscreenSlide();
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-canvas)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <div style={{
                          fontSize: '0.70rem',
                          fontWeight: 800,
                          color: 'var(--accent)',
                          marginBottom: '4px'
                        }}>
                          {uiLang === 'ta' ? `பத்தி ${sIdx + 1}` : `Stanza ${sIdx + 1}`}
                        </div>
                        <div style={{
                          fontSize: `${fontSize}px`,
                          lineHeight: 1.85,
                          color: 'var(--text-primary)',
                          whiteSpace: 'pre-line',
                          fontFamily: 'var(--font-tamil)',
                          fontWeight: 450
                        }}>
                          {stanza}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
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

        {/* Search Bar with Embedded Add Song Button (No entire row wasted) */}
        <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0 8px 0 12px',
            minHeight: '42px',
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

            {/* Embedded Add Song button */}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.76rem',
                fontWeight: 750,
                cursor: 'pointer',
                flexShrink: 0
              }}
              title={t.addSong}
            >
              <Plus size={15} />
              {!isMobile && <span>{t.addSong}</span>}
            </button>
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

      {/* 1. Mobile Song Picker / Hybrid Dropdown Modal (Opens when tapping song title) */}
      {isMobile && isMobileSongSheetOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'var(--bg-canvas)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Modal Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music size={18} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {uiLang === 'ta' ? 'பாடலைத் தேர்ந்தெடுக்கவும்' : 'Select Song'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSongSheetOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Search Bar with Embedded Add Button */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0 8px 0 12px',
              minHeight: '42px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Search size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder={t.searchSongs}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
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
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsMobileSongSheetOpen(false);
                  if (!user && onOpenAuth) {
                    onOpenAuth();
                  } else if (onOpenAddSong) {
                    onOpenAddSong();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title={t.addSong}
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setSidebarTab('all')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 750,
                  backgroundColor: sidebarTab === 'all' ? 'var(--accent)' : 'var(--bg-canvas)',
                  color: sidebarTab === 'all' ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${sidebarTab === 'all' ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer'
                }}
              >
                {t.songs}
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('favorites')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 750,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  backgroundColor: sidebarTab === 'favorites' ? 'var(--accent)' : 'var(--bg-canvas)',
                  color: sidebarTab === 'favorites' ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${sidebarTab === 'favorites' ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer'
                }}
              >
                <Star size={13} fill={sidebarTab === 'favorites' ? 'currentColor' : 'none'} />
                <span>{t.favorites} ({favorites.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('my')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 750,
                  backgroundColor: sidebarTab === 'my' ? 'var(--accent)' : 'var(--bg-canvas)',
                  color: sidebarTab === 'my' ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${sidebarTab === 'my' ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer'
                }}
              >
                {t.mySongs} ({userSongs.length})
              </button>
            </div>
          </div>

          {/* Songs List inside Modal */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {filteredSongs.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.84rem' }}>
                {sidebarTab === 'favorites' ? 'இன்னும் விருப்பமான பாடல்கள் சேர்க்கப்படவில்லை.' : t.noSongsFound}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {filteredSongs.map((s) => {
                  const isSelected = selectedSong?.id === s.id;
                  const isItemFav = favorites.some((f) => f.id === s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSong(s);
                        setMobileTab('lyrics');
                        setIsMobileSongSheetOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-surface)',
                        border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        gap: '8px'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontWeight: isSelected ? 800 : 650,
                          fontSize: '0.88rem',
                          color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {s.t || s.title}
                        </div>
                        {(s.ro || s.englishTitle) && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.ro || s.englishTitle}
                          </div>
                        )}
                      </div>

                      {/* Favorite Toggle inside dropdown/modal */}
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
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isItemFav ? 'var(--accent)' : 'var(--text-tertiary)'
                        }}
                        title={isItemFav ? 'Remove favorite' : 'Add favorite'}
                      >
                        <Star size={17} fill={isItemFav ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Song 3-Dot Customization & Actions Bottom Sheet */}
      {isMobile && isSongCustomizationOpen && (
        <div
          onClick={() => setIsSongCustomizationOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--bg-surface)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '1.25rem 1.25rem 2rem 1.25rem',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            {/* Sheet Handle & Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {uiLang === 'ta' ? 'அமைப்புகள் & பதிவிறக்கம்' : 'Options & Downloads'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSongCustomizationOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions (PDF, PPTX, Copy Lyrics) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                {uiLang === 'ta' ? 'செயல்கள் & பதிவிறக்கம்' : 'Actions & Downloads'}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPdf();
                    setIsSongCustomizationOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontWeight: 750,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <FileDown size={16} style={{ color: 'var(--accent)' }} />
                  <span>PDF பதிவிறக்கம்</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPptx();
                    setIsSongCustomizationOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontWeight: 750,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Presentation size={16} style={{ color: '#059669' }} />
                  <span>PPTX ஸ்லைடு</span>
                </button>
              </div>

              <button
                type="button"
                onClick={copySongLyrics}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: copiedId === 'full' ? 'var(--accent-light)' : 'var(--bg-canvas)',
                  border: `1px solid ${copiedId === 'full' ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  color: copiedId === 'full' ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: 750,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {copiedId === 'full' ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedId === 'full' ? (uiLang === 'ta' ? 'வரிகள் நகலெடுக்கப்பட்டது!' : 'Copied!') : (uiLang === 'ta' ? 'பாடல் வரிகளை நகலெடு' : 'Copy Lyrics')}</span>
              </button>
            </div>

            {/* Font Size Adjuster */}
            {setFontSize && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                    {uiLang === 'ta' ? 'எழுத்து அளவு' : 'Font Size'}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 800 }}>
                    {fontSize}px
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    A-
                  </button>
                  <input
                    type="range"
                    min="14"
                    max="34"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.min(34, s + 1))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    A+
                  </button>
                </div>
              </div>
            )}

            {/* Theme Switcher */}
            {setTheme && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                  {uiLang === 'ta' ? 'வண்ணத் தோற்றம்' : 'Color Theme'}
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'parchment', name: 'Parchment', bg: '#fbf7ee', border: '#e6dfd1' },
                    { id: 'ivory', name: 'Ivory Light', bg: '#fafafa', border: '#e5e7eb' },
                    { id: 'night', name: 'Night Dark', bg: '#0d1117', border: '#30363d' }
                  ].map((tItem) => (
                    <button
                      key={tItem.id}
                      type="button"
                      onClick={() => {
                        setTheme(tItem.id);
                        try { localStorage.setItem('ortho_theme', tItem.id); } catch {}
                      }}
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        border: theme === tItem.id ? '2px solid var(--accent)' : `1px solid ${tItem.border}`,
                        backgroundColor: tItem.bg,
                        color: tItem.id === 'night' ? '#ffffff' : '#111827',
                        fontSize: '0.78rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                        textAlign: 'center',
                        boxShadow: theme === tItem.id ? '0 0 0 2px var(--accent-light)' : 'none'
                      }}
                    >
                      {tItem.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Mobile Fullscreen Landscape Stanza Slide Mode */}
      {fullscreenSlideStanza && (
        <div
          className="song-landscape-wrapper"
          onTouchStart={handleSongSlideTouchStart}
          onTouchEnd={handleSongSlideTouchEnd}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#000000',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.5rem 3rem',
            boxSizing: 'border-box',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'pan-y',
            overflow: 'hidden'
          }}
        >
          {/* Orientation handling stylesheet to guarantee Landscape-only presentation */}
          <style>{`
            @media (max-width: 768px) and (orientation: portrait) {
              .song-landscape-wrapper {
                width: 100vh !important;
                height: 100vw !important;
                transform: rotate(90deg) translate(0, -100vw) !important;
                transform-origin: top left !important;
              }
            }
            @media (max-width: 768px) and (orientation: landscape) {
              .song-landscape-wrapper {
                width: 100vw !important;
                height: 100vh !important;
                transform: none !important;
              }
            }
          `}</style>

          {/* Left Half Click Zone -> Prev Stanza */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handlePrevStanza();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '45%',
              cursor: 'pointer',
              zIndex: 10
            }}
          />

          {/* Right Half Click Zone -> Next Stanza */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNextStanza();
            }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '45%',
              cursor: 'pointer',
              zIndex: 10
            }}
          />

          {/* Top Right Floating Buttons: Slide Switcher + Exit Fullscreen Button */}
          <div style={{
            position: 'absolute',
            top: 'max(14px, env(safe-area-inset-top, 14px))',
            right: 'max(14px, env(safe-area-inset-right, 14px))',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {/* Slide Switcher Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsStanzaNavModalOpen(true);
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                opacity: 0.7,
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)'
              }}
              title="Slide Switcher"
            >
              <LayoutGrid size={20} />
            </button>

            {/* Exit Fullscreen Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenSlideStanza(null);
                setIsStanzaNavModalOpen(false);
                exitFullscreenSlide();
                try {
                  if (window.history.state?.modal === 'fullscreen_song_stanza') {
                    window.history.back();
                  }
                } catch (err) {}
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                opacity: 0.7,
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)'
              }}
              title="Exit Fullscreen"
            >
              <X size={20} />
            </button>
          </div>

          {/* Slide Content: Centered stanza presentation with dynamic font scaling */}
          {(() => {
            const rawStanza = songStanzas[fullscreenSlideStanza.stanzaIndex] || '';
            const lineCount = rawStanza.split('\n').length;
            const charCount = rawStanza.length;

            let fontClamp = 'clamp(1.3rem, 5.8vh, 2.3rem)';
            let lineH = 1.7;

            if (lineCount > 6 || charCount > 200) {
              fontClamp = 'clamp(0.95rem, 4.2vh, 1.35rem)';
              lineH = 1.4;
            } else if (lineCount > 4 || charCount > 120) {
              fontClamp = 'clamp(1.1rem, 4.8vh, 1.65rem)';
              lineH = 1.5;
            } else if (lineCount > 3 || charCount > 70) {
              fontClamp = 'clamp(1.2rem, 5.2vh, 1.95rem)';
              lineH = 1.6;
            }

            return (
              <div style={{
                zIndex: 5,
                maxWidth: 'min(940px, 92vw)',
                maxHeight: '92vh',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
                paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
                paddingLeft: 'max(24px, env(safe-area-inset-left, 24px))',
                paddingRight: 'max(24px, env(safe-area-inset-right, 24px))',
                boxSizing: 'border-box',
                overflowY: 'auto'
              }}>
                <div style={{
                  fontSize: fontClamp,
                  lineHeight: lineH,
                  color: '#ffffff',
                  fontFamily: 'var(--font-tamil)',
                  fontWeight: 550,
                  whiteSpace: 'pre-line',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                }}>
                  {rawStanza}
                </div>
              </div>
            );
          })()}

          {/* 4. Fullscreen Slide Switcher Modal (Inside wrapper to keep landscape orientation) */}
          {isStanzaNavModalOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                boxSizing: 'border-box'
              }}
              onClick={() => setIsStanzaNavModalOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  width: '100%',
                  maxWidth: '480px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  maxHeight: '80vh'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {uiLang === 'ta' ? 'பத்திகள் / ஸ்லைடுகள்' : 'Stanzas / Slides'} ({songStanzas.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsStanzaNavModalOpen(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '10px',
                  overflowY: 'auto',
                  padding: '4px'
                }}>
                  {songStanzas.map((_, idx) => {
                    const isCurrent = fullscreenSlideStanza?.stanzaIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFullscreenSlideStanza({ stanzaIndex: idx });
                          setIsStanzaNavModalOpen(false);
                        }}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '10px',
                          backgroundColor: isCurrent ? 'var(--accent)' : 'var(--bg-canvas)',
                          color: isCurrent ? 'var(--accent-contrast)' : 'var(--text-primary)',
                          border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                          fontWeight: 800,
                          fontSize: '1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.12s ease'
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
