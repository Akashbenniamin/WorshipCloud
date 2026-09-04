import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck,
  Search, 
  Columns2,
  Trash2,
  ChevronDown,
  X,
  Hash,
  CornerDownLeft,
  Languages
} from 'lucide-react';
import { getApproximateVersePage } from '../lib/biblePages';
import { normalizeSearch } from '../lib/searchParser';
import { translations } from '../lib/i18n';

export function BibleReader({
  booksMeta,
  currentBookCode,
  currentChapter,
  onSelectBookChapter,
  parallelMode,
  setParallelMode,
  fontSize,
  setFontSize,
  targetVerse,
  setTargetVerse,
  uiLang = 'ta'
}) {
  const t = translations[uiLang] || translations.ta;

  const [taovbsiBook, setTaovbsiBook] = useState(null);
  const [kjvBook, setKjvBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedVerseNum, setCopiedVerseNum] = useState(null);

  // Mobile state & responsive detection
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [mobileSelectedBookCode, setMobileSelectedBookCode] = useState(currentBookCode);
  const [mobileJumpInput, setMobileJumpInput] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileSelectedBookCode(currentBookCode);
  }, [currentBookCode]);

  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState('books'); // 'books' | 'bookmarks'
  const [bookFilterTab, setBookFilterTab] = useState('all'); // 'all' | 'OT' | 'NT'
  const [bookSearch, setBookSearch] = useState('');
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [jumpQuery, setJumpQuery] = useState('');
  const bookDropdownRef = useRef(null);
  const bookDropdownMenuRef = useRef(null);
  const jumpInputRef = useRef(null);

  // Reset highlight to first result whenever search text or tab changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [bookSearch, bookFilterTab]);

  // Close book dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(e.target)) {
        setIsBookDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto close dropdown when scrolling anywhere outside the dropdown menu
  useEffect(() => {
    if (!isBookDropdownOpen) return;

    const handleScrollOutside = (e) => {
      if (bookDropdownMenuRef.current && !bookDropdownMenuRef.current.contains(e.target)) {
        setIsBookDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOutside, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOutside, { capture: true });
    };
  }, [isBookDropdownOpen]);

  // Bookmarks state (persisted)
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('worship_cloud_bible_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const verseRefs = useRef({});
  const currentMeta = booksMeta.find((b) => b.code === currentBookCode) || booksMeta[0];

  const toggleBookmark = (verse) => {
    setBookmarks((prev) => {
      const id = `${currentBookCode}-${currentChapter}-${verse.number}`;
      const exists = prev.some((b) => b.id === id);
      let updated;
      if (exists) {
        updated = prev.filter((b) => b.id !== id);
      } else {
        const item = {
          id,
          bookCode: currentBookCode,
          bookName: currentMeta.name,
          englishBookName: currentMeta.english,
          chapter: currentChapter,
          verseNumber: verse.number,
          text: verse.text,
          date: new Date().toLocaleDateString(uiLang === 'ta' ? 'ta-IN' : 'en-US')
        };
        updated = [item, ...prev];
      }
      try {
        localStorage.setItem('worship_cloud_bible_bookmarks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeBookmark = (id) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem('worship_cloud_bible_bookmarks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Load Book JSON on demand
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`./data/bible/taovbsi/${currentBookCode}.json`).then((r) => r.json()),
      fetch(`./data/bible/kjv/${currentBookCode}.json`).then((r) => r.json()).catch(() => null)
    ])
      .then(([taovbsiRes, kjvRes]) => {
        if (!isCancelled) {
          setTaovbsiBook(taovbsiRes);
          setKjvBook(kjvRes);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load Bible book:', err);
        if (!isCancelled) setLoading(false);
      });

    return () => { isCancelled = true; };
  }, [currentBookCode]);

  // Scroll to target verse
  useEffect(() => {
    if (targetVerse && verseRefs.current[targetVerse]) {
      setTimeout(() => {
        verseRefs.current[targetVerse]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
  }, [targetVerse, currentChapter, taovbsiBook]);

  const currentTamilChapter = taovbsiBook?.chapters?.find((ch) => ch.number === currentChapter);
  const currentKjvChapter = kjvBook?.chapters?.find((ch) => ch.number === currentChapter);

  const printPage = currentMeta && taovbsiBook?.chapters
    ? getApproximateVersePage(currentMeta, taovbsiBook.chapters, currentChapter, 1)
    : currentMeta?.startPage;

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      onSelectBookChapter(currentBookCode, currentChapter - 1);
    } else {
      const idx = booksMeta.findIndex((b) => b.code === currentBookCode);
      if (idx > 0) {
        const prevBook = booksMeta[idx - 1];
        onSelectBookChapter(prevBook.code, prevBook.chapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (currentMeta && currentChapter < currentMeta.chapters) {
      onSelectBookChapter(currentBookCode, currentChapter + 1);
    } else {
      const idx = booksMeta.findIndex((b) => b.code === currentBookCode);
      if (idx >= 0 && idx < booksMeta.length - 1) {
        const nextBook = booksMeta[idx + 1];
        onSelectBookChapter(nextBook.code, 1);
      }
    }
  };

  const copyVerseText = (verse) => {
    const kjvVerse = currentKjvChapter?.verses?.find((v) => v.number === verse.number);
    const activeText = parallelMode && kjvVerse ? kjvVerse.text : verse.text;
    const bookTitle = parallelMode ? currentMeta.english : currentMeta.name;
    const citation = `${bookTitle} ${currentChapter}:${verse.number}`;
    const full = `"${activeText}" — ${citation}`;
    navigator.clipboard.writeText(full);
    setCopiedVerseNum(verse.number);
    setTimeout(() => setCopiedVerseNum(null), 2000);
  };

  // Jump to specific chapter and verse
  const jumpToVerse = (ch, vs) => {
    if (currentMeta && ch >= 1 && ch <= currentMeta.chapters) {
      onSelectBookChapter(currentBookCode, ch);
      if (setTargetVerse) {
        setTargetVerse(vs);
      }
      setTimeout(() => {
        if (verseRefs.current[vs]) {
          verseRefs.current[vs]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Handle Jump Input submit (Enter or button click)
  const handleJumpSubmit = (val) => {
    const raw = (val || '').trim();
    if (!raw) return;
    // Format: 1.15, 1,15, 1 15, 1:15
    const cvMatch = raw.match(/^(\d+)[.,:\s]+(\d+)$/);
    if (cvMatch) {
      const ch = parseInt(cvMatch[1], 10);
      const vs = parseInt(cvMatch[2], 10);
      jumpToVerse(ch, vs);
      return;
    }
    // Single number (chapter only)
    const chMatch = raw.match(/^(\d+)$/);
    if (chMatch) {
      const ch = parseInt(chMatch[1], 10);
      jumpToVerse(ch, 1);
    }
  };

  // Live input handler for Jump Box
  const handleJumpInput = (val) => {
    setJumpQuery(val);
    const cvMatch = val.trim().match(/^(\d+)[.,:\s]+(\d+)$/);
    if (cvMatch) {
      const ch = parseInt(cvMatch[1], 10);
      const vs = parseInt(cvMatch[2], 10);
      jumpToVerse(ch, vs);
    }
  };

  const handleJumpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJumpSubmit(jumpQuery);
    }
  };

  // Select a book from dropdown/search and auto-focus the Jump Box
  const selectBookAndFocusJump = (bookCode) => {
    onSelectBookChapter(bookCode, 1);
    setIsBookDropdownOpen(false);
    setBookSearch('');
    setJumpQuery('');
    setTimeout(() => {
      jumpInputRef.current?.focus();
      jumpInputRef.current?.select();
    }, 60);
  };

  // Filter books list (supports Tamil name, English name, code, aliases, AND serial number 1-66)
  const filteredBooks = useMemo(() => {
    let list = booksMeta;
    if (bookFilterTab === 'OT') list = list.filter((b) => b.testament === 'OT');
    if (bookFilterTab === 'NT') list = list.filter((b) => b.testament === 'NT');

    if (!bookSearch.trim()) return list;
    const raw = bookSearch.trim();
    const needle = normalizeSearch(raw);
    const numQuery = parseInt(raw, 10);

    return list.filter((b) => {
      const serialNum = b.index !== undefined ? b.index + 1 : (booksMeta.indexOf(b) + 1);

      // Match by serial number (exact match or startsWith)
      if (!isNaN(numQuery)) {
        if (serialNum === numQuery) return true;
        if (String(serialNum).startsWith(raw)) return true;
      }

      if (normalizeSearch(b.name).includes(needle)) return true;
      if (normalizeSearch(b.english).includes(needle)) return true;
      if (normalizeSearch(b.code).includes(needle)) return true;
      return (b.aliases || []).some((a) => normalizeSearch(a).includes(needle));
    });
  }, [booksMeta, bookFilterTab, bookSearch]);

  // Keyboard navigation for hybrid book search input
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isBookDropdownOpen) {
        setIsBookDropdownOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredBooks.length));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isBookDropdownOpen) {
        setIsBookDropdownOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev - 1 + filteredBooks.length) % Math.max(1, filteredBooks.length));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredBooks.length > 0) {
        const target = filteredBooks[highlightedIndex] || filteredBooks[0];
        selectBookAndFocusJump(target.code);
      }
    } else if (e.key === 'Escape') {
      setIsBookDropdownOpen(false);
    }
  };

  return (
    <div style={{
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : undefined,
      gridTemplateColumns: isMobile ? undefined : '1fr 390px',
      gap: isMobile ? '0' : '1.25rem',
      padding: isMobile ? '0 0.5rem 0.5rem 0.5rem' : '0 1.5rem 0.5rem 1.5rem',
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* LEFT COLUMN: Main Scripture Reader (Fixed Header + Independently Scrollable Verses) */}
      <section style={{
        minWidth: 0,
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Book Name Title Card Header: Compact on Mobile, Full Banner on Desktop */}
        {isMobile ? (
          <div style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.95rem',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '0.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  margin: 0
                }}>
                  {parallelMode ? currentMeta?.english : currentMeta?.name} {currentChapter}
                </h1>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {parallelMode ? currentMeta?.name : currentMeta?.english} · {currentTamilChapter?.verses?.length || 0} {t.verses}
              </div>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent)',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              {parallelMode ? 'KJV & BSI' : 'BSI Ortho'}
            </div>
          </div>
        ) : (
          <div style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-sm)',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}>
                  {parallelMode ? currentMeta?.english : currentMeta?.name} {currentChapter}
                </h1>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {parallelMode ? currentMeta?.name : currentMeta?.english} Chapter {currentChapter} · {currentTamilChapter?.verses?.length || 0} {t.verses} · {parallelMode ? 'KJV & BSI New Ortho' : 'BSI New Ortho'}
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Language Toggle Button: English / Tamil */}
              <button
                onClick={() => setParallelMode(!parallelMode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  borderRadius: '8px',
                  backgroundColor: parallelMode ? 'var(--accent-light)' : 'var(--bg-canvas)',
                  border: `1px solid ${parallelMode ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  color: parallelMode ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={parallelMode ? 'Switch to Tamil (தமிழ்)' : 'Switch to English (KJV)'}
              >
                <Languages size={15} style={{ color: 'var(--accent)' }} />
                <span>{parallelMode ? 'English' : 'தமிழ்'}</span>
              </button>

              <button
                onClick={handlePrevChapter}
                title={t.prevChapter}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontWeight: 650,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} />
                <span>{t.prevChapter}</span>
              </button>

              <button
                onClick={handleNextChapter}
                title={t.nextChapter}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  fontWeight: 650,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <span>{t.nextChapter}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Verses Reading List (ONLY THIS CONTAINER SCROLLS) */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            அதிகாரம் ஏற்றப்படுகிறது...
          </div>
        ) : (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '6px',
            paddingBottom: isMobile ? '76px' : '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {currentTamilChapter?.verses?.map((verse) => {
              const kjvVerse = currentKjvChapter?.verses?.find((v) => v.number === verse.number);
              const isBookmarked = bookmarks.some(
                (b) => b.id === `${currentBookCode}-${currentChapter}-${verse.number}`
              );

              return (
                <div
                  key={verse.number}
                  ref={(el) => (verseRefs.current[verse.number] = el)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '38px 1fr auto',
                    gap: '12px',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    backgroundColor: isBookmarked ? 'var(--accent-light)' : 'var(--bg-surface)',
                    border: isBookmarked ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease',
                    alignItems: 'start'
                  }}
                  onMouseEnter={(e) => {
                    if (!isBookmarked) e.currentTarget.style.borderColor = 'var(--border-strong)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isBookmarked) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  {/* Verse Number */}
                  <span style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: 'var(--accent)',
                    paddingTop: '2px',
                    userSelect: 'none'
                  }}>
                    {verse.number}
                  </span>

                  {/* Verse Content: Replaces text with English when parallelMode is active */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.8,
                      color: 'var(--text-primary)',
                      fontFamily: parallelMode ? 'var(--font-serif), Georgia, serif' : 'var(--font-tamil)',
                      fontWeight: parallelMode ? 400 : 450
                    }}>
                      {parallelMode && kjvVerse ? kjvVerse.text : verse.text}
                    </p>
                  </div>

                  {/* Actions on Verse */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => toggleBookmark(verse)}
                      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        color: isBookmarked ? 'var(--accent)' : 'var(--text-tertiary)'
                      }}
                    >
                      {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>

                    <button
                      onClick={() => copyVerseText(verse)}
                      title={t.copy}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        color: copiedVerseNum === verse.number ? 'var(--accent)' : 'var(--text-tertiary)'
                      }}
                    >
                      {copiedVerseNum === verse.number ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* RIGHT SIDEBAR: 100% FIXED / DOES NOT SCROLL WITH PAGE (Desktop only) */}
      {!isMobile && (
        <aside style={{
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Sidebar Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-canvas)'
        }}>
          <button
            onClick={() => setSidebarTab('books')}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: sidebarTab === 'books' ? 'var(--accent)' : 'var(--text-tertiary)',
              borderBottom: sidebarTab === 'books' ? '2px solid var(--accent)' : 'none'
            }}
          >
            <BookOpen size={16} />
            <span>{t.books}</span>
          </button>

          <button
            onClick={() => setSidebarTab('bookmarks')}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: sidebarTab === 'bookmarks' ? 'var(--accent)' : 'var(--text-tertiary)',
              borderBottom: sidebarTab === 'bookmarks' ? '2px solid var(--accent)' : 'none'
            }}
          >
            <Bookmark size={16} />
            <span>{t.bookmarks} ({bookmarks.length})</span>
          </button>
        </div>

        {/* TAB 1: Books & Chapter Selector */}
        {sidebarTab === 'books' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* HYBRID DROPDOWN + SEARCH BAR (Slightly increased height: 44px) */}
            <div 
              ref={bookDropdownRef}
              style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid var(--border-subtle)',
                position: 'relative',
                zIndex: 40
              }}
            >
              {/* Filter Tabs: All, OT, NT */}
              <div style={{
                display: 'flex',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: '6px',
                padding: '2px',
                marginBottom: '0.6rem'
              }}>
                <button
                  onClick={() => setBookFilterTab('all')}
                  style={{
                    flex: 1,
                    padding: '5px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    color: bookFilterTab === 'all' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                    backgroundColor: bookFilterTab === 'all' ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {t.allBooks}
                </button>
                <button
                  onClick={() => setBookFilterTab('OT')}
                  style={{
                    flex: 1,
                    padding: '5px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    color: bookFilterTab === 'OT' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                    backgroundColor: bookFilterTab === 'OT' ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {t.oldTestament} (39)
                </button>
                <button
                  onClick={() => setBookFilterTab('NT')}
                  style={{
                    flex: 1,
                    padding: '5px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    color: bookFilterTab === 'NT' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                    backgroundColor: bookFilterTab === 'NT' ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {t.newTestament} (27)
                </button>
              </div>

              {/* Hybrid Dropdown Bar Input */}
              <div
                onClick={() => {
                  if (!isBookDropdownOpen) setIsBookDropdownOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: `1px solid ${isBookDropdownOpen ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  borderRadius: '8px',
                  padding: '0 8px 0 12px',
                  minHeight: '44px',
                  cursor: 'pointer',
                  boxShadow: isBookDropdownOpen ? '0 0 0 2px var(--accent-light)' : 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Search size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={uiLang === 'ta' ? 'புத்தகம் (பெயர் அல்லது எண் 1-66)...' : 'Book name or serial (1-66)...'}
                  value={isBookDropdownOpen ? bookSearch : (parallelMode ? currentMeta?.english : currentMeta?.name)}
                  onChange={(e) => {
                    setBookSearch(e.target.value);
                    if (!isBookDropdownOpen) setIsBookDropdownOpen(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => setIsBookDropdownOpen(true)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.88rem',
                    fontWeight: isBookDropdownOpen && bookSearch ? 500 : 700,
                    color: 'var(--text-primary)',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                />
                {isBookDropdownOpen && bookSearch ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBookSearch('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-tertiary)'
                    }}
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsBookDropdownOpen((prev) => !prev);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-tertiary)'
                    }}
                    title={isBookDropdownOpen ? 'Close list' : 'Open list'}
                  >
                    <ChevronDown
                      size={16}
                      style={{
                        transform: isBookDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </button>
                )}
              </div>

              {/* SECOND INPUT BOX: JUMP TO CHAPTER & VERSE (Auto-highlighted on click or book selection) */}
              <div style={{
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0 12px',
                minHeight: '40px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <Hash size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <input
                  ref={jumpInputRef}
                  type="text"
                  placeholder={uiLang === 'ta' ? 'அதிகாரம்.வசனம் (எ.கா: 1.15 அல்லது 1 15)' : 'Chapter.Verse (e.g: 1.15 or 1 15)'}
                  value={jumpQuery}
                  onChange={(e) => handleJumpInput(e.target.value)}
                  onKeyDown={handleJumpKeyDown}
                  onClick={(e) => e.target.select()}
                  onFocus={(e) => e.target.select()}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.86rem',
                    color: 'var(--text-primary)',
                    width: '100%',
                    fontWeight: 650
                  }}
                />
                {jumpQuery && (
                  <button
                    onClick={() => handleJumpSubmit(jumpQuery)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none'
                    }}
                    title="Jump to verse"
                  >
                    <span>Go</span>
                    <CornerDownLeft size={12} />
                  </button>
                )}
              </div>

              {/* HYBRID DROPDOWN MENU (Opens smoothly on click, scrolling outside auto-closes, expanded height: 480px) */}
              {isBookDropdownOpen && (
                <div 
                  ref={bookDropdownMenuRef}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: '0.75rem',
                    right: '0.75rem',
                    maxHeight: '480px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '10px',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22), var(--shadow-lg)',
                    zIndex: 100,
                    padding: '6px'
                  }}
                >
                  {filteredBooks.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
                      புத்தகம் எதுவும் கிடைக்கவில்லை
                    </div>
                  ) : (
                    filteredBooks.map((b, idx) => {
                      const isCurrent = b.code === currentBookCode;
                      const isHighlighted = idx === highlightedIndex;
                      const serialNum = b.index !== undefined ? b.index + 1 : (booksMeta.indexOf(b) + 1);

                      return (
                        <button
                          key={b.code}
                          onClick={() => selectBookAndFocusJump(b.code)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            backgroundColor: isHighlighted ? 'var(--accent-light)' : (isCurrent ? 'rgba(var(--bg-surface-hover), 0.5)' : 'transparent'),
                            border: isHighlighted ? '1px solid var(--accent)' : '1px solid transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            marginBottom: '2px',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* SERIAL NUMBER BADGE (e.g. 1 to 66) */}
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: isHighlighted ? 'var(--accent)' : 'var(--text-tertiary)',
                              backgroundColor: 'var(--bg-canvas)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-subtle)',
                              minWidth: '22px',
                              textAlign: 'center'
                            }}>
                              {serialNum}
                            </span>

                            <div>
                              {/* TAMIL BOOK NAME AS MAIN TEXT WHILE TAMIL BIBLE IS ACTIVE */}
                              <div style={{
                                fontWeight: isHighlighted || isCurrent ? 800 : 700,
                                fontSize: '0.9rem',
                                color: isHighlighted ? 'var(--accent)' : 'var(--text-primary)',
                                lineHeight: 1.25
                              }}>
                                {parallelMode ? b.english : b.name}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                {parallelMode ? b.name : b.english} · {b.chapters} {uiLang === 'ta' ? 'அதிகாரங்கள்' : 'chs'}
                              </div>
                            </div>
                          </div>

                          {isCurrent && (
                            <Check size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* EXPANDED CHAPTER GRID (Full remaining height with generous space) */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-canvas)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  {parallelMode ? currentMeta?.english : currentMeta?.name} · {currentMeta?.chapters} {t.chapters}
                </span>
              </div>

              <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '6px',
                overflowY: 'auto',
                paddingRight: '4px',
                alignContent: 'start'
              }}>
                {Array.from({ length: currentMeta?.chapters || 1 }, (_, i) => i + 1).map((chNum) => {
                  const isCurrent = currentChapter === chNum;
                  return (
                    <button
                      key={chNum}
                      onClick={() => onSelectBookChapter(currentBookCode, chNum)}
                      style={{
                        aspectRatio: '1 / 1',
                        width: '100%',
                        padding: 0,
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        fontWeight: isCurrent ? 800 : 700,
                        lineHeight: 1,
                        backgroundColor: isCurrent ? 'var(--accent)' : 'var(--bg-surface)',
                        color: isCurrent ? 'var(--accent-contrast)' : 'var(--text-primary)',
                        border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.borderColor = 'var(--accent)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-canvas)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                        }
                      }}
                    >
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        transform: 'translateY(-0.5px)'
                      }}>
                        {chNum}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Bookmarks */}
        {sidebarTab === 'bookmarks' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {bookmarks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-tertiary)',
                fontSize: '0.82rem'
              }}>
                <Bookmark size={26} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                {t.noBookmarks}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button
                        onClick={() => onSelectBookChapter(bm.bookCode, bm.chapter)}
                        style={{
                          fontWeight: 750,
                          fontSize: '0.86rem',
                          color: 'var(--accent)',
                          textAlign: 'left'
                        }}
                      >
                        {bm.bookName} {bm.chapter}:{bm.verseNumber}
                      </button>
                      <button
                        onClick={() => removeBookmark(bm.id)}
                        title="Remove bookmark"
                        style={{ color: 'var(--text-tertiary)', padding: '2px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {bm.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
      )}

      {/* ===================================================================== */}
      {/* MOBILE COMPANION ANIMATED BOTTOM BAR                                  */}
      {/* ===================================================================== */}
      {isMobile && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '58px',
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-subtle)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          zIndex: 80,
          gap: '6px'
        }}>
          {/* Prev Chapter */}
          <button
            onClick={handlePrevChapter}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title={t.prevChapter}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Book Name & Chapter Button (Prominent Center Action) */}
          <button
            onClick={() => {
              setMobileSelectedBookCode(currentBookCode);
              setIsMobileSheetOpen(true);
            }}
            style={{
              flex: 1,
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-light)',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              fontWeight: 800,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              padding: '0 8px',
              overflow: 'hidden'
            }}
          >
            <BookOpen size={16} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {parallelMode ? currentMeta?.english : currentMeta?.name} {currentChapter}
            </span>
            <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
          </button>

          {/* Next Chapter */}
          <button
            onClick={handleNextChapter}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title={t.nextChapter}
          >
            <ChevronRight size={20} />
          </button>

          {/* Language Toggle (EN / தமிழ்) */}
          <button
            onClick={() => setParallelMode(!parallelMode)}
            style={{
              height: '38px',
              padding: '0 8px',
              borderRadius: '8px',
              backgroundColor: parallelMode ? 'var(--accent)' : 'var(--bg-canvas)',
              border: `1px solid ${parallelMode ? 'var(--accent)' : 'var(--border-subtle)'}`,
              color: parallelMode ? 'var(--accent-contrast)' : 'var(--text-primary)',
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title={parallelMode ? 'Switch to Tamil' : 'Switch to English (KJV)'}
          >
            <Languages size={15} />
            <span>{parallelMode ? 'EN' : 'தமிழ்'}</span>
          </button>

          {/* Jump Button */}
          <button
            onClick={() => {
              setMobileJumpInput('');
              setIsJumpModalOpen(true);
            }}
            style={{
              height: '38px',
              padding: '0 9px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontWeight: 750,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Jump to verse"
          >
            <Hash size={14} style={{ color: 'var(--accent)' }} />
            <span>Jump</span>
          </button>
        </nav>
      )}

      {/* ===================================================================== */}
      {/* MOBILE BOOK & CHAPTER BOTTOM SHEET DRAWER                             */}
      {/* ===================================================================== */}
      {isMobile && isMobileSheetOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={() => setIsMobileSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderTopLeftRadius: '18px',
              borderTopRightRadius: '18px',
              maxHeight: '86vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
              borderTop: '1px solid var(--border-strong)',
              overflow: 'hidden'
            }}
          >
            {/* Sheet Handle Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px 0' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-strong)' }} />
            </div>

            {/* Header: Title + Close Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 1rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {uiLang === 'ta' ? 'புத்தகம் & அதிகாரம்' : 'Books & Chapters'}
                </h3>
              </div>
              <button
                onClick={() => setIsMobileSheetOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-tabs: Books vs Bookmarks */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
              <button
                onClick={() => setSidebarTab('books')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 750,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: sidebarTab === 'books' ? 'var(--accent)' : 'var(--text-tertiary)',
                  borderBottom: sidebarTab === 'books' ? '2px solid var(--accent)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {t.books}
              </button>
              <button
                onClick={() => setSidebarTab('bookmarks')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 750,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: sidebarTab === 'bookmarks' ? 'var(--accent)' : 'var(--text-tertiary)',
                  borderBottom: sidebarTab === 'bookmarks' ? '2px solid var(--accent)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {t.bookmarks} ({bookmarks.length})
              </button>
            </div>

            {/* TAB CONTENT: BOOKS */}
            {sidebarTab === 'books' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '0.75rem', gap: '10px' }}>
                {/* Search Bar + Testament Filter */}
                <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-canvas)', borderRadius: '6px', padding: '3px' }}>
                  <button
                    onClick={() => setBookFilterTab('all')}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: 'none',
                      color: bookFilterTab === 'all' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                      backgroundColor: bookFilterTab === 'all' ? 'var(--accent)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {t.all} (66)
                  </button>
                  <button
                    onClick={() => setBookFilterTab('OT')}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: 'none',
                      color: bookFilterTab === 'OT' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                      backgroundColor: bookFilterTab === 'OT' ? 'var(--accent)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {t.oldTestament} (39)
                  </button>
                  <button
                    onClick={() => setBookFilterTab('NT')}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: 'none',
                      color: bookFilterTab === 'NT' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                      backgroundColor: bookFilterTab === 'NT' ? 'var(--accent)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {t.newTestament} (27)
                  </button>
                </div>

                {/* Search Input */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0 10px',
                  minHeight: '40px'
                }}>
                  <Search size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder={uiLang === 'ta' ? 'புத்தகம் (பெயர் அல்லது எண் 1-66)...' : 'Book name or serial 1-66...'}
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      width: '100%'
                    }}
                  />
                  {bookSearch && (
                    <button
                      onClick={() => setBookSearch('')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* ACTIVE SELECTED BOOK & CHAPTERS GRID */}
                {(() => {
                  const activeMeta = booksMeta.find((b) => b.code === mobileSelectedBookCode) || currentMeta;
                  return (
                    <div style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: '10px',
                      border: '1px solid var(--accent)',
                      padding: '0.65rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--accent)' }}>
                          {parallelMode ? activeMeta?.english : activeMeta?.name} ({activeMeta?.chapters} {t.chapters})
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                          {uiLang === 'ta' ? 'அதிகாரம் தொடவும்' : 'Tap chapter'}
                        </span>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
                        gap: '5px',
                        maxHeight: '140px',
                        overflowY: 'auto',
                        padding: '2px'
                      }}>
                        {Array.from({ length: activeMeta?.chapters || 1 }, (_, i) => i + 1).map((ch) => {
                          const isCurrent = activeMeta.code === currentBookCode && ch === currentChapter;
                          return (
                            <button
                              key={ch}
                              onClick={() => {
                                onSelectBookChapter(activeMeta.code, ch);
                                setIsMobileSheetOpen(false);
                              }}
                              style={{
                                height: '34px',
                                borderRadius: '6px',
                                border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border-subtle)'}`,
                                backgroundColor: isCurrent ? 'var(--accent)' : 'var(--bg-surface)',
                                color: isCurrent ? 'var(--accent-contrast)' : 'var(--text-primary)',
                                fontWeight: isCurrent ? 800 : 600,
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                              }}
                            >
                              {ch}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* SCROLLABLE LIST OF ALL BOOKS */}
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredBooks.map((b) => {
                    const isSelected = b.code === mobileSelectedBookCode;
                    return (
                      <button
                        key={b.code}
                        onClick={() => setMobileSelectedBookCode(b.code)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-canvas)',
                          border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                          color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', width: '22px' }}>
                            {b.index !== undefined ? b.index + 1 : (booksMeta.indexOf(b) + 1)}
                          </span>
                          <span>{parallelMode ? b.english : b.name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                            ({parallelMode ? b.name : b.english})
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          {b.chapters} ch
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: BOOKMARKS */}
            {sidebarTab === 'bookmarks' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', maxHeight: '350px' }}>
                {bookmarks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
                    <Bookmark size={24} style={{ margin: '0 auto 6px auto', opacity: 0.5 }} />
                    {t.noBookmarks}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {bookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-canvas)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px'
                        }}
                      >
                        <button
                          onClick={() => {
                            onSelectBookChapter(bm.bookCode, bm.chapter);
                            if (setTargetVerse) setTargetVerse(bm.verseNumber);
                            setIsMobileSheetOpen(false);
                          }}
                          style={{
                            fontWeight: 750,
                            fontSize: '0.82rem',
                            color: 'var(--accent)',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {bm.bookName} {bm.chapter}:{bm.verseNumber}
                        </button>
                        <button
                          onClick={() => removeBookmark(bm.id)}
                          style={{ color: 'var(--text-tertiary)', background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MOBILE JUMP DIALOG MODAL                                              */}
      {/* ===================================================================== */}
      {isMobile && isJumpModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.15s ease'
        }}
        onClick={() => setIsJumpModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              padding: '1.25rem',
              width: '100%',
              maxWidth: '320px',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {uiLang === 'ta' ? 'வசனத்துக்கு தாவுக' : 'Jump to Verse'}
                </h3>
              </div>
              <button
                onClick={() => setIsJumpModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {uiLang === 'ta'
                ? 'அதிகாரம்:வசனம் (எ.கா: 3:16) அல்லது வசன எண் உள்ளிடவும்'
                : 'Enter chapter:verse (e.g. 3:16) or verse number'}
            </div>

            <input
              type="text"
              autoFocus
              placeholder="e.g. 3:16 or 14"
              value={mobileJumpInput}
              onChange={(e) => setMobileJumpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleJumpSubmit(mobileJumpInput);
                  setIsJumpModalOpen(false);
                }
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--accent)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: 700,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsJumpModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontWeight: 650,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {t.cancel || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  handleJumpSubmit(mobileJumpInput);
                  setIsJumpModalOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {uiLang === 'ta' ? 'தாவுக' : 'Jump'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
