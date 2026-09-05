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
  Languages,
  LayoutGrid,
  MoreVertical,
  Sliders
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
  uiLang = 'ta',
  theme,
  setTheme
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

  // Mobile Long-Press Verse Action Menu State
  const [mobileActiveVerseMenu, setMobileActiveVerseMenu] = useState(null); // { verse, kjvVerse, isBookmarked }
  const longPressTimerRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileSelectedBookCode(currentBookCode);
  }, [currentBookCode]);

  // Mobile Fullscreen Landscape Verse Slide Reader State
  const [fullscreenSlideVerse, setFullscreenSlideVerse] = useState(null); // { bookCode, chapter, verseNum, text }
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [isBibleCustomizationOpen, setIsBibleCustomizationOpen] = useState(false);
  const [navModalTab, setNavModalTab] = useState('verse'); // 'book' | 'chapter' | 'verse'
  const [navModalBook, setNavModalBook] = useState(currentBookCode);
  const [navModalChapter, setNavModalChapter] = useState(currentChapter);
  const [navModalVerse, setNavModalVerse] = useState(1);
  const [modalBookData, setModalBookData] = useState(null);

  // Swipe detection for fullscreen slide
  const slideTouchStartY = useRef(null);
  const slideTouchStartX = useRef(null);

  const handleSlideTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      slideTouchStartY.current = e.touches[0].clientY;
      slideTouchStartX.current = e.touches[0].clientX;
    }
  };

  const handleSlideTouchEnd = (e) => {
    if (slideTouchStartY.current === null || slideTouchStartX.current === null) return;
    const deltaY = e.changedTouches[0].clientY - slideTouchStartY.current;
    const deltaX = e.changedTouches[0].clientX - slideTouchStartX.current;
    slideTouchStartY.current = null;
    slideTouchStartX.current = null;

    // Swiping up or down jumps to the first verse of current book and chapter
    if (Math.abs(deltaY) > 40 && Math.abs(deltaY) > Math.abs(deltaX)) {
      setFullscreenSlideVerse((prev) => (prev ? { ...prev, verseNum: 1 } : null));
      setNavModalVerse(1);
    }
  };

  // Sync navigator modal values when slide verse changes
  useEffect(() => {
    if (fullscreenSlideVerse) {
      setNavModalBook(fullscreenSlideVerse.bookCode);
      setNavModalChapter(fullscreenSlideVerse.chapter);
      setNavModalVerse(fullscreenSlideVerse.verseNum);
    }
  }, [fullscreenSlideVerse]);

  // Load modal book data when user selects a different book in the navigator modal
  useEffect(() => {
    if (navModalBook === currentBookCode && taovbsiBook) {
      setModalBookData(taovbsiBook);
      return;
    }
    let active = true;
    fetch(`./data/bible/taovbsi/${navModalBook}.json`)
      .then((r) => r.json())
      .then((data) => {
        if (active) setModalBookData(data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [navModalBook, currentBookCode, taovbsiBook]);

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

  // Device Hardware Back Button Listener to exit fullscreen slide mode
  useEffect(() => {
    const handlePopState = () => {
      if (fullscreenSlideVerse) {
        setFullscreenSlideVerse(null);
        setIsNavModalOpen(false);
        exitFullscreenSlide();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fullscreenSlideVerse]);

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

  useEffect(() => {
    const handleBookmarkSync = () => {
      try {
        const saved = localStorage.getItem('worship_cloud_bible_bookmarks');
        setBookmarks(saved ? JSON.parse(saved) : []);
      } catch {}
    };
    window.addEventListener('storage', handleBookmarkSync);
    window.addEventListener('worship_cloud_bible_bookmarks_updated', handleBookmarkSync);
    return () => {
      window.removeEventListener('storage', handleBookmarkSync);
      window.removeEventListener('worship_cloud_bible_bookmarks_updated', handleBookmarkSync);
    };
  }, []);

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
        window.dispatchEvent(new CustomEvent('worship_cloud_bible_bookmarks_updated', { detail: updated }));
      } catch {}
      return updated;
    });
  };

  const removeBookmark = (id) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem('worship_cloud_bible_bookmarks', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('worship_cloud_bible_bookmarks_updated', { detail: updated }));
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

  // Fullscreen Slide verse resolution & handlers
  const currentSlideVerseText = useMemo(() => {
    if (!fullscreenSlideVerse) return '';
    const vNum = fullscreenSlideVerse.verseNum;
    const tamilV = currentTamilChapter?.verses?.find((v) => v.number === vNum);
    const kjvV = currentKjvChapter?.verses?.find((v) => v.number === vNum);
    if (parallelMode && kjvV) return kjvV.text;
    return tamilV?.text || fullscreenSlideVerse.text || '';
  }, [fullscreenSlideVerse, currentTamilChapter, currentKjvChapter, parallelMode]);

  const currentSlideBookMeta = useMemo(() => {
    if (!fullscreenSlideVerse) return currentMeta;
    return booksMeta.find((b) => b.code === fullscreenSlideVerse.bookCode) || currentMeta;
  }, [fullscreenSlideVerse, booksMeta, currentMeta]);

  const modalBookMeta = useMemo(() => {
    return booksMeta.find((b) => b.code === navModalBook) || currentMeta;
  }, [booksMeta, navModalBook, currentMeta]);

  const modalSelectedChapterData = useMemo(() => {
    return modalBookData?.chapters?.find((c) => c.number === navModalChapter);
  }, [modalBookData, navModalChapter]);

  const modalTotalVerses = modalSelectedChapterData?.verses?.length || 31;

  const handleSlideNextVerse = () => {
    if (!fullscreenSlideVerse) return;
    const currentVerses = currentTamilChapter?.verses || [];
    const currentTotal = currentVerses.length || 30;
    const currentVNum = fullscreenSlideVerse.verseNum;

    if (currentVNum < currentTotal) {
      setFullscreenSlideVerse({
        ...fullscreenSlideVerse,
        verseNum: currentVNum + 1
      });
    } else {
      const currentMetaItem = booksMeta.find((b) => b.code === currentBookCode);
      const maxChapters = currentMetaItem?.chapters || 1;
      if (currentChapter < maxChapters) {
        onSelectBookChapter(currentBookCode, currentChapter + 1);
        setFullscreenSlideVerse({
          bookCode: currentBookCode,
          chapter: currentChapter + 1,
          verseNum: 1
        });
      } else {
        const bIdx = booksMeta.findIndex((b) => b.code === currentBookCode);
        if (bIdx < booksMeta.length - 1) {
          const nextBook = booksMeta[bIdx + 1];
          onSelectBookChapter(nextBook.code, 1);
          setFullscreenSlideVerse({
            bookCode: nextBook.code,
            chapter: 1,
            verseNum: 1
          });
        }
      }
    }
  };

  const handleSlidePrevVerse = () => {
    if (!fullscreenSlideVerse) return;
    const currentVNum = fullscreenSlideVerse.verseNum;

    if (currentVNum > 1) {
      setFullscreenSlideVerse({
        ...fullscreenSlideVerse,
        verseNum: currentVNum - 1
      });
    } else {
      if (currentChapter > 1) {
        const prevCh = currentChapter - 1;
        const prevChData = taovbsiBook?.chapters?.find((c) => c.number === prevCh);
        const lastVNum = prevChData?.verses?.length || 25;
        onSelectBookChapter(currentBookCode, prevCh);
        setFullscreenSlideVerse({
          bookCode: currentBookCode,
          chapter: prevCh,
          verseNum: lastVNum
        });
      } else {
        const bIdx = booksMeta.findIndex((b) => b.code === currentBookCode);
        if (bIdx > 0) {
          const prevBook = booksMeta[bIdx - 1];
          onSelectBookChapter(prevBook.code, prevBook.chapters);
          setFullscreenSlideVerse({
            bookCode: prevBook.code,
            chapter: prevBook.chapters,
            verseNum: 1
          });
        }
      }
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
      padding: isMobile ? '8px 8px 0.5rem 8px' : '0 1.5rem 0.5rem 1.5rem',
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
            padding: '0.65rem 0.85rem',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '0.45rem',
            boxShadow: 'var(--shadow-sm)',
            gap: '8px'
          }}>
            {/* Tappable Title Area for Book & Chapter Drawer Sheet */}
            <button
              type="button"
              onClick={() => {
                setMobileSelectedBookCode(currentBookCode);
                setIsMobileSheetOpen(true);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                minWidth: 0,
                flex: 1
              }}
              title={uiLang === 'ta' ? 'புத்தகத்தை மாற்ற கிளிக் செய்க' : 'Click to select book & chapter'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', maxWidth: '100%' }}>
                <h1 style={{
                  fontSize: '1.22rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {parallelMode ? currentMeta?.english : currentMeta?.name} {currentChapter}
                </h1>
                <ChevronDown size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: '0.70rem', color: 'var(--text-tertiary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {parallelMode ? currentMeta?.name : currentMeta?.english} · {currentTamilChapter?.verses?.length || 0} {t.verses}
              </div>
            </button>

            {/* Compact Action Icons: Prev Chapter, Next Chapter, Language Toggle, Jump */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              {/* Prev Chapter */}
              <button
                type="button"
                onClick={handlePrevChapter}
                title={t.prevChapter}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <ChevronLeft size={17} />
              </button>

              {/* Next Chapter */}
              <button
                type="button"
                onClick={handleNextChapter}
                title={t.nextChapter}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <ChevronRight size={17} />
              </button>

              {/* Language Toggle: Icon only */}
              <button
                type="button"
                onClick={() => setParallelMode(!parallelMode)}
                title={parallelMode ? 'Switch to Tamil' : 'Switch to English (KJV)'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '7px',
                  backgroundColor: parallelMode ? 'var(--accent-light)' : 'var(--bg-canvas)',
                  border: `1px solid ${parallelMode ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  color: parallelMode ? 'var(--accent)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <Languages size={16} />
              </button>

              {/* Jump Button: Icon only */}
              <button
                type="button"
                onClick={() => {
                  setMobileJumpInput('');
                  setIsJumpModalOpen(true);
                }}
                title="Jump to verse"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <Hash size={16} />
              </button>

              {/* 3-Dot Customization Button: Font size, themes, options */}
              <button
                type="button"
                onClick={() => setIsBibleCustomizationOpen(true)}
                title={uiLang === 'ta' ? 'வேதாகம அமைப்புகள் (3-dot)' : 'Bible Customization & Options'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <MoreVertical size={16} />
              </button>
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
            paddingRight: isMobile ? '0' : '6px',
            paddingBottom: isMobile ? '76px' : '0',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '0.35rem' : '0.75rem'
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
                  onClick={() => {
                    if (isMobile) {
                      if (isLongPressTriggeredRef.current) {
                        isLongPressTriggeredRef.current = false;
                        return;
                      }
                      setFullscreenSlideVerse({
                        bookCode: currentBookCode,
                        chapter: currentChapter,
                        verseNum: verse.number,
                        text: parallelMode && kjvVerse ? kjvVerse.text : verse.text
                      });
                      window.history.pushState({ modal: 'fullscreen_verse' }, '');
                      enterFullscreenSlide();
                    }
                  }}
                  onTouchStart={(e) => {
                    if (!isMobile) return;
                    isLongPressTriggeredRef.current = false;
                    const touch = e.touches[0];
                    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = setTimeout(() => {
                      isLongPressTriggeredRef.current = true;
                      try {
                        if (navigator.vibrate) navigator.vibrate(35);
                      } catch (err) {}
                      setMobileActiveVerseMenu({
                        verse,
                        kjvVerse,
                        isBookmarked
                      });
                    }, 480);
                  }}
                  onTouchMove={(e) => {
                    if (!isMobile || !longPressTimerRef.current) return;
                    const touch = e.touches[0];
                    const diffX = Math.abs(touch.clientX - touchStartPosRef.current.x);
                    const diffY = Math.abs(touch.clientY - touchStartPosRef.current.y);
                    if (diffX > 10 || diffY > 10) {
                      clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }
                  }}
                  onTouchEnd={() => {
                    if (longPressTimerRef.current) {
                      clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }
                  }}
                  onTouchCancel={() => {
                    if (longPressTimerRef.current) {
                      clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }
                  }}
                  onContextMenu={(e) => {
                    if (isMobile) {
                      e.preventDefault();
                      setMobileActiveVerseMenu({
                        verse,
                        kjvVerse,
                        isBookmarked
                      });
                    }
                  }}
                  style={{
                    display: isMobile ? 'flex' : 'grid',
                    flexDirection: isMobile ? 'row' : undefined,
                    gridTemplateColumns: isMobile ? undefined : '38px 1fr auto',
                    gap: isMobile ? '6px' : '12px',
                    padding: isMobile ? '7px 6px' : '14px 18px',
                    borderRadius: isMobile ? '6px' : '8px',
                    backgroundColor: isBookmarked ? 'var(--accent-light)' : 'var(--bg-surface)',
                    border: isBookmarked ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease',
                    alignItems: 'baseline',
                    cursor: isMobile ? 'pointer' : 'default',
                    WebkitTouchCallout: isMobile ? 'none' : undefined,
                    userSelect: isMobile ? 'none' : undefined
                  }}
                  onMouseEnter={(e) => {
                    if (!isBookmarked && !isMobile) e.currentTarget.style.borderColor = 'var(--border-strong)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isBookmarked && !isMobile) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  {/* Verse Number: Ultra-compact, inline baseline aligned on mobile */}
                  <span style={{
                    fontSize: isMobile ? '0.82rem' : '0.92rem',
                    fontWeight: 800,
                    color: 'var(--accent)',
                    flexShrink: 0,
                    userSelect: 'none',
                    lineHeight: 1.4,
                    minWidth: isMobile ? '18px' : '38px',
                    textAlign: isMobile ? 'left' : 'center'
                  }}>
                    {verse.number}
                  </span>

                  {/* Verse Content: Expanded to use 100% available horizontal space on mobile */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: isMobile ? 1.55 : 1.8,
                      color: 'var(--text-primary)',
                      fontFamily: parallelMode ? 'var(--font-serif), Georgia, serif' : 'var(--font-tamil)',
                      fontWeight: parallelMode ? 400 : 450,
                      margin: 0,
                      padding: 0
                    }}>
                      {parallelMode && kjvVerse ? kjvVerse.text : verse.text}
                    </p>
                  </div>

                  {/* Actions on Verse: Rendered on Desktop ONLY (Mobile uses Long-Press Menu) */}
                  {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(verse);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          copyVerseText(verse);
                        }}
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
                  )}
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
      {/* MOBILE FULLSCREEN BOOK & CHAPTER SELECTOR                             */}
      {/* ===================================================================== */}
      {isMobile && isMobileSheetOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-surface)',
            zIndex: 300,
            display: 'flex',
            flexDirection: 'column',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Header: Title + Close Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} style={{ color: 'var(--accent)' }} />
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {uiLang === 'ta' ? 'புத்தகம் & அதிகாரம்' : 'Books & Chapters'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSheetOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Search Input (No OT/NT toggle bar at all - always shows all 66 books) */}
          <div style={{ padding: '0.65rem 1rem', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0 10px',
              minHeight: '42px'
            }}>
              <Search size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder={uiLang === 'ta' ? 'புத்தகம் (பெயர் அல்லது எண் 1-66)...' : 'Book name or serial 1-66...'}
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
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
              {bookSearch && (
               <button
                 type="button"
                 onClick={() => setBookSearch('')}
                 style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
               >
                 <X size={16} />
               </button>
              )}
            </div>
          </div>

          {/* Selected Book's Chapters Grid (Prominently displayed) */}
          {(() => {
            const activeMeta = booksMeta.find((b) => b.code === mobileSelectedBookCode) || currentMeta;
            return (
              <div style={{
                backgroundColor: 'var(--bg-canvas)',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {parallelMode ? activeMeta?.english : activeMeta?.name} ({activeMeta?.chapters} {t.chapters})
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    {uiLang === 'ta' ? 'அதிகாரத்தைத் தொடவும்' : 'Tap chapter to open'}
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  gap: '5px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  padding: '2px'
                }}>
                  {Array.from({ length: activeMeta?.chapters || 1 }, (_, i) => i + 1).map((ch) => {
                    const isCurrent = activeMeta.code === currentBookCode && ch === currentChapter;
                    return (
                      <button
                        key={ch}
                        type="button"
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
                          fontWeight: isCurrent ? 800 : 700,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
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

          {/* Scrollable List of ALL 66 Books (Always shows all 66 books, no OT/NT filter) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.65rem 1rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {booksMeta
              .filter((b) => {
                if (!bookSearch.trim()) return true;
                const q = bookSearch.trim().toLowerCase();
                const num = parseInt(q, 10);
                if (!isNaN(num)) {
                  const bIdx = booksMeta.indexOf(b) + 1;
                  return bIdx === num;
                }
                return (
                  b.name?.toLowerCase().includes(q) ||
                  b.english?.toLowerCase().includes(q) ||
                  b.code?.toLowerCase().includes(q)
                );
              })
              .map((b) => {
                const isSelected = b.code === mobileSelectedBookCode;
                return (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => setMobileSelectedBookCode(b.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-canvas)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                      fontWeight: isSelected ? 800 : 650,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)',
                        width: '24px',
                        textAlign: 'center'
                      }}>
                        {booksMeta.indexOf(b) + 1}
                      </span>
                      <span>{parallelMode ? b.english : b.name}</span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
                        ({parallelMode ? b.name : b.english})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      {b.chapters} ch
                    </span>
                  </button>
                );
              })}
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

      {/* ===================================================================== */}
      {/* MOBILE FULLSCREEN LANDSCAPE VERSE SLIDE READER                        */}
      {/* ===================================================================== */}
      {fullscreenSlideVerse && (
        <div
          className="verse-landscape-wrapper"
          onTouchStart={handleSlideTouchStart}
          onTouchEnd={handleSlideTouchEnd}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#0a0f1d',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'pan-y'
          }}
        >
          {/* Orientation handling stylesheet */}
          <style>{`
            @media (max-width: 768px) and (orientation: portrait) {
              .verse-landscape-wrapper {
                width: 100vh !important;
                height: 100vw !important;
                transform: rotate(90deg) translate(0, -100vw) !important;
                transform-origin: top left !important;
              }
            }
            @media (max-width: 768px) and (orientation: landscape) {
              .verse-landscape-wrapper {
                width: 100vw !important;
                height: 100vh !important;
                transform: none !important;
              }
            }
          `}</style>

          {/* Ambient Slide Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(180, 83, 9, 0.12) 0%, rgba(10, 15, 29, 0.98) 75%)',
            pointerEvents: 'none'
          }} />

          {/* Top Bar Floating Buttons: Navigator Grid + Close Exit Button */}
          <div style={{
            position: 'absolute',
            top: 'max(14px, env(safe-area-inset-top, 14px))',
            right: 'max(14px, env(safe-area-inset-right, 14px))',
            zIndex: 520,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {/* Grid Button: Opens Navigator Modal */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNavModalTab('verse');
                setIsNavModalOpen(true);
              }}
              style={{
                opacity: 0.7,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '10px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)'
              }}
              title={uiLang === 'ta' ? 'புத்தகம், அதிகாரம், வசனம் மாற்ற' : 'Select Book, Chapter, Verse'}
            >
              <LayoutGrid size={20} />
            </button>

            {/* Close Button: Exits Fullscreen Slide */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenSlideVerse(null);
                setIsNavModalOpen(false);
                exitFullscreenSlide();
                try {
                  if (window.history.state?.modal === 'fullscreen_verse') {
                    window.history.back();
                  }
                } catch (err) {}
              }}
              style={{
                opacity: 0.7,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '10px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)'
              }}
              title={uiLang === 'ta' ? 'வெளியேறு' : 'Exit Fullscreen'}
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Slide Reading Area: Pure Verse Text + Reference */}
          <div
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
              paddingLeft: 'max(24px, env(safe-area-inset-left, 24px))',
              paddingRight: 'max(24px, env(safe-area-inset-right, 24px))',
              boxSizing: 'border-box',
              position: 'relative',
              zIndex: 505
            }}
          >
            {/* Left Invisible Tap Zone for Previous Verse */}
            <div
              onClick={handleSlidePrevVerse}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '45%',
                height: '100%',
                cursor: 'pointer',
                zIndex: 506
              }}
              title="Previous Verse"
            />

            {/* Right Invisible Tap Zone for Next Verse */}
            <div
              onClick={handleSlideNextVerse}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '45%',
                height: '100%',
                cursor: 'pointer',
                zIndex: 506
              }}
              title="Next Verse"
            />

            {/* Centered Verse Content: Guaranteed to never cut off */}
            {(() => {
              const textLen = (currentSlideVerseText || '').length;
              // Dynamic font calculation to guarantee text fits landscape heights without truncating
              let fontClamp = 'clamp(1.3rem, 5.8vh, 1.95rem)';
              let lineH = 1.6;
              if (textLen > 180) {
                fontClamp = 'clamp(0.95rem, 4.2vh, 1.35rem)';
                lineH = 1.42;
              } else if (textLen > 110) {
                fontClamp = 'clamp(1.1rem, 4.8vh, 1.55rem)';
                lineH = 1.48;
              } else if (textLen > 65) {
                fontClamp = 'clamp(1.2rem, 5.3vh, 1.75rem)';
                lineH = 1.52;
              }

              return (
                <div style={{
                  maxWidth: 'min(920px, 92vw)',
                  maxHeight: '92vh',
                  textAlign: 'center',
                  zIndex: 507,
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'clamp(6px, 1.8vh, 14px)',
                  overflowY: 'auto'
                }}>
                  <p style={{
                    fontSize: fontClamp,
                    lineHeight: lineH,
                    fontWeight: 600,
                    color: '#f8fafc',
                    margin: 0,
                    fontFamily: parallelMode ? 'var(--font-serif), Georgia, serif' : 'var(--font-tamil)',
                    letterSpacing: '0.01em',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)'
                  }}>
                    {currentSlideVerseText}
                  </p>

                  {/* Clean Reference Tag */}
                  <div style={{
                    fontSize: 'clamp(0.85rem, 3.2vh, 1.05rem)',
                    fontWeight: 800,
                    color: 'var(--accent)',
                    letterSpacing: '0.04em',
                    opacity: 0.95,
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    {parallelMode ? currentSlideBookMeta?.english : currentSlideBookMeta?.name} {fullscreenSlideVerse.chapter}:{fullscreenSlideVerse.verseNum}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* =================================================================== */}
          {/* THE NAVIGATOR MODAL (Matching the 3 Provided Designs)               */}
          {/* =================================================================== */}
          {isNavModalOpen && (
            <div
              onClick={() => setIsNavModalOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.68)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                animation: 'fadeIn 0.15s ease'
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '92%',
                  maxWidth: '740px',
                  maxHeight: '88vh',
                  backgroundColor: '#ffffff',
                  borderRadius: '22px',
                  boxShadow: '0 24px 50px rgba(0, 0, 0, 0.45)',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Header Breadcrumbs: BOOK > CHAPTER > VERSE + [X] */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '14px',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                    {/* 1. BOOK BUTTON */}
                    <button
                      type="button"
                      onClick={() => setNavModalTab('book')}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '6px 12px',
                        borderRadius: '12px',
                        backgroundColor: navModalTab === 'book' ? 'var(--accent)' : '#ffffff',
                        border: navModalTab === 'book' ? 'none' : '1px solid #e5e7eb',
                        color: navModalTab === 'book' ? '#ffffff' : '#111827',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        color: navModalTab === 'book' ? 'rgba(255,255,255,0.85)' : '#6b7280',
                        textTransform: 'uppercase'
                      }}>
                        BOOK
                      </span>
                      <span style={{
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%'
                      }}>
                        {parallelMode ? modalBookMeta?.english : modalBookMeta?.name}
                      </span>
                    </button>

                    <ChevronRight size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />

                    {/* 2. CHAPTER BUTTON */}
                    <button
                      type="button"
                      onClick={() => setNavModalTab('chapter')}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '6px 12px',
                        borderRadius: '12px',
                        backgroundColor: navModalTab === 'chapter' ? 'var(--accent)' : '#ffffff',
                        border: navModalTab === 'chapter' ? 'none' : '1px solid #e5e7eb',
                        color: navModalTab === 'chapter' ? '#ffffff' : '#111827',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        color: navModalTab === 'chapter' ? 'rgba(255,255,255,0.85)' : '#6b7280',
                        textTransform: 'uppercase'
                      }}>
                        CHAPTER
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>
                        {navModalChapter}
                      </span>
                    </button>

                    <ChevronRight size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />

                    {/* 3. VERSE BUTTON */}
                    <button
                      type="button"
                      onClick={() => setNavModalTab('verse')}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '6px 12px',
                        borderRadius: '12px',
                        backgroundColor: navModalTab === 'verse' ? 'var(--accent)' : '#ffffff',
                        border: navModalTab === 'verse' ? 'none' : '1px solid #e5e7eb',
                        color: navModalTab === 'verse' ? '#ffffff' : '#111827',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        color: navModalTab === 'verse' ? 'rgba(255,255,255,0.85)' : '#6b7280',
                        textTransform: 'uppercase'
                      }}>
                        VERSE
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>
                        {navModalVerse}
                      </span>
                    </button>
                  </div>

                  {/* Close [X] Button */}
                  <button
                    type="button"
                    onClick={() => setIsNavModalOpen(false)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* MODAL GRID CONTENT: Exactly 10 columns for numbers */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 2px' }}>
                  {/* TAB 1: BOOK SELECTION */}
                  {navModalTab === 'book' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(10, 1fr)',
                      gap: '6px'
                    }}>
                      {booksMeta.map((b) => {
                        const isSelected = b.code === navModalBook;
                        return (
                          <button
                            key={b.code}
                            type="button"
                            onClick={() => {
                              setNavModalBook(b.code);
                              setNavModalChapter(1);
                              setNavModalVerse(1);
                              setNavModalTab('chapter');
                            }}
                            style={{
                              height: '42px',
                              padding: '0 2px',
                              borderRadius: '12px',
                              border: isSelected ? '1.5px solid var(--accent)' : '1px solid #e5e7eb',
                              backgroundColor: isSelected ? '#ffedd5' : '#ffffff',
                              color: isSelected ? 'var(--accent)' : '#111827',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              transition: 'all 0.12s ease'
                            }}
                            title={parallelMode ? b.english : b.name}
                          >
                            <span style={{
                              width: '100%',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                              fontSize: '0.67rem',
                              fontWeight: isSelected ? 800 : 650,
                              lineHeight: 1.2
                            }}>
                              {parallelMode ? b.english : b.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 2: CHAPTER SELECTION (EXACTLY 10 COLUMNS) */}
                  {navModalTab === 'chapter' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(10, 1fr)',
                      gap: '6px'
                    }}>
                      {Array.from({ length: modalBookMeta?.chapters || 1 }, (_, i) => i + 1).map((chNum) => {
                        const totalCh = modalBookMeta?.chapters || 1;
                        const isSelected = chNum === navModalChapter;
                        const isSingleLast = (totalCh % 10 === 1) && (chNum === totalCh);
                        return (
                          <button
                            key={chNum}
                            type="button"
                            onClick={() => {
                              setNavModalChapter(chNum);
                              setNavModalVerse(1);
                              setNavModalTab('verse');
                            }}
                            style={{
                              height: '42px',
                              borderRadius: '12px',
                              border: isSelected ? 'none' : '1px solid #e5e7eb',
                              backgroundColor: isSelected ? 'var(--accent)' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#111827',
                              fontSize: '0.94rem',
                              fontWeight: isSelected ? 800 : 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gridColumn: isSingleLast ? '1 / -1' : undefined,
                              transition: 'all 0.12s ease'
                            }}
                          >
                            {chNum}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 3: VERSE SELECTION (EXACTLY 10 COLUMNS) */}
                  {navModalTab === 'verse' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(10, 1fr)',
                      gap: '6px'
                    }}>
                      {Array.from({ length: modalTotalVerses }, (_, i) => i + 1).map((vNum) => {
                        const isSelected = vNum === navModalVerse;
                        const isSingleLast = (modalTotalVerses % 10 === 1) && (vNum === modalTotalVerses);
                        return (
                          <button
                            key={vNum}
                            type="button"
                            onClick={() => {
                              setNavModalVerse(vNum);
                              if (navModalBook !== currentBookCode || navModalChapter !== currentChapter) {
                                onSelectBookChapter(navModalBook, navModalChapter);
                              }
                              setFullscreenSlideVerse({
                                bookCode: navModalBook,
                                chapter: navModalChapter,
                                verseNum: vNum
                              });
                              setIsNavModalOpen(false);
                            }}
                            style={{
                              height: '42px',
                              borderRadius: '12px',
                              border: isSelected ? 'none' : '1px solid #e5e7eb',
                              backgroundColor: isSelected ? 'var(--accent)' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#111827',
                              fontSize: '0.94rem',
                              fontWeight: isSelected ? 800 : 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gridColumn: isSingleLast ? '1 / -1' : undefined,
                              transition: 'all 0.12s ease'
                            }}
                          >
                            {vNum}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* BIBLE CUSTOMIZATION BOTTOM SHEET (3-DOT OPTIONS)                      */}
      {/* ===================================================================== */}
      {isBibleCustomizationOpen && (
        <div
          onClick={() => setIsBibleCustomizationOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 400,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'var(--bg-surface)',
              borderTopLeftRadius: '22px',
              borderTopRightRadius: '22px',
              border: '1px solid var(--border-subtle)',
              padding: '1.2rem 1.25rem 1.8rem 1.25rem',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxSizing: 'border-box'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {uiLang === 'ta' ? 'வேதாகம அமைப்புகள்' : 'Bible Customization'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBibleCustomizationOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
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

            {/* 1. Font Size Adjuster */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                  {uiLang === 'ta' ? 'எழுத்து அளவு' : 'Font Size'}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent)' }}>
                  {fontSize}px
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

            {/* 2. Theme Switcher */}
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

            {/* 3. Reading Language Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                {uiLang === 'ta' ? 'வாசிக்கும் மொழி' : 'Reading Language'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setParallelMode(false)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: '8px',
                    border: !parallelMode ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                    backgroundColor: !parallelMode ? 'var(--accent-light)' : 'var(--bg-canvas)',
                    color: !parallelMode ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  தமிழ் (BSI New Ortho)
                </button>
                <button
                  type="button"
                  onClick={() => setParallelMode(true)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: '8px',
                    border: parallelMode ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                    backgroundColor: parallelMode ? 'var(--accent-light)' : 'var(--bg-canvas)',
                    color: parallelMode ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  English (KJV)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE LONG-PRESS VERSE ACTION MENU (BOTTOM SHEET / POPUP) */}
      {mobileActiveVerseMenu && (
        <div
          onClick={() => setMobileActiveVerseMenu(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderTopLeftRadius: '18px',
              borderTopRightRadius: '18px',
              borderTop: '1px solid var(--border-subtle)',
              boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.35)',
              padding: '16px 18px 28px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Grab handle indicator */}
            <div style={{
              width: '36px',
              height: '4px',
              backgroundColor: 'var(--border-strong)',
              borderRadius: '2px',
              alignSelf: 'center',
              opacity: 0.7,
              marginBottom: '2px'
            }} />

            {/* Verse Header Reference & Close */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  letterSpacing: '-0.01em'
                }}>
                  {parallelMode ? currentMeta?.english : currentMeta?.name} {currentChapter}:{mobileActiveVerseMenu.verse.number}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  marginTop: '1px'
                }}>
                  {parallelMode ? 'English (KJV)' : 'தமிழ் (BSI New Ortho)'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileActiveVerseMenu(null)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'var(--bg-canvas)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Snippet Preview of the Selected Verse */}
            <div style={{
              fontSize: '0.84rem',
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              fontFamily: parallelMode ? 'var(--font-serif), Georgia, serif' : 'var(--font-tamil)',
              maxHeight: '75px',
              overflowY: 'auto',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontStyle: 'italic',
              opacity: 0.92
            }}>
              "{parallelMode && mobileActiveVerseMenu.kjvVerse ? mobileActiveVerseMenu.kjvVerse.text : mobileActiveVerseMenu.verse.text}"
            </div>

            {/* Action Buttons: Bookmark & Copy */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Bookmark Toggle */}
              <button
                type="button"
                onClick={() => {
                  const targetVerse = mobileActiveVerseMenu.verse;
                  toggleBookmark(targetVerse);
                  setMobileActiveVerseMenu(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: mobileActiveVerseMenu.isBookmarked ? 'var(--accent-light)' : 'var(--bg-canvas)',
                  border: `1px solid ${mobileActiveVerseMenu.isBookmarked ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  color: mobileActiveVerseMenu.isBookmarked ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: 750,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                {mobileActiveVerseMenu.isBookmarked ? (
                  <>
                    <BookmarkCheck size={18} style={{ color: 'var(--accent)' }} />
                    <span>{uiLang === 'ta' ? 'நீக்குக' : 'Bookmarked'}</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={18} />
                    <span>{uiLang === 'ta' ? 'புக்மார்க்' : 'Bookmark'}</span>
                  </>
                )}
              </button>

              {/* Copy Verse */}
              <button
                type="button"
                onClick={() => {
                  const targetVerse = mobileActiveVerseMenu.verse;
                  copyVerseText(targetVerse);
                  setMobileActiveVerseMenu(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: copiedVerseNum === mobileActiveVerseMenu.verse.number ? 'var(--accent)' : 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: copiedVerseNum === mobileActiveVerseMenu.verse.number ? 'var(--accent-contrast)' : 'var(--text-primary)',
                  fontWeight: 750,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                {copiedVerseNum === mobileActiveVerseMenu.verse.number ? (
                  <>
                    <Check size={18} />
                    <span>{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>{t.copy}</span>
                  </>
                )}
              </button>
            </div>

            {/* Read in Slide Mode Button */}
            <button
              type="button"
              onClick={() => {
                const targetVerse = mobileActiveVerseMenu.verse;
                const kjvV = mobileActiveVerseMenu.kjvVerse;
                setFullscreenSlideVerse({
                  bookCode: currentBookCode,
                  chapter: currentChapter,
                  verseNum: targetVerse.number,
                  text: parallelMode && kjvV ? kjvV.text : targetVerse.text
                });
                window.history.pushState({ modal: 'fullscreen_verse' }, '');
                enterFullscreenSlide();
                setMobileActiveVerseMenu(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontWeight: 750,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <BookOpen size={16} />
              <span>{uiLang === 'ta' ? 'ஸ்லைடு வடிவில் வாசிக்க' : 'Open in Slide Mode'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
