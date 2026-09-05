import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Tv, 
  BookOpen, 
  Music, 
  Highlighter, 
  Eraser, 
  ExternalLink, 
  Search, 
  X,
  Palette,
  EyeOff,
  FolderPlus,
  Plus,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  SlidersHorizontal,
  Trash2,
  Monitor,
  MonitorOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  FileImage,
  Upload,
  ArrowDownAZ,
  Radio,
  Cast,
  Check,
  Star,
  Hash,
  CornerDownLeft,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Loader2,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { getApproximateVersePage } from '../lib/biblePages';
import { normalizeSearch } from '../lib/searchParser';
import { normalizeSongSearch, splitSongSections, rankSongResults } from '../lib/songParser';
import { renderHighlightedContent } from '../lib/highlightRenderer';
import { AutoFitSlideContent } from './AutoFitSlideContent';
import { translations } from '../lib/i18n';
import { SLIDE_TEXTURES } from '../lib/presentationThemes';
import { parseImagesToSlides, parsePdfToSlides, parsePptxToSlides } from '../lib/mediaParser';
import { NewYearCounterView } from './NewYearCounterView';
import { ChurchClockView } from './ChurchClockView';

const chunkCache = new Map();

// Helper to compute contrast text color
const getContrastTextColor = (hexColor) => {
  const hex = (hexColor || '#0c1322').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0a0f1d' : '#ffffff';
};

const DEFAULT_MEDIA_DOCUMENTS = [
  {
    id: 'doc-report',
    title: 'Bulk Production Report 2026 08 25',
    badge: 'DOCUMENT',
    kind: 'media',
    subtitle: 'PDF · 5 slides',
    slides: [
      {
        id: 'slide-1',
        title: 'Slide 1',
        body: 'உங்கள் செய்தியை இங்கே எழுதுங்கள்',
        reference: '',
        fontSize: 42,
        align: 'center',
        fontFamily: 'Noto Sans Tamil',
        backgroundColor: '#0c1322',
        textColor: '#ffffff',
        accent: '#e5b965',
        highlights: []
      },
      {
        id: 'slide-2',
        title: 'Slide 2',
        body: 'கர்த்தர் என் வெளிச்சமும் என் இரட்சிப்புமானவர்\nயாருக்கு அஞ்சுவேன்?',
        reference: '',
        fontSize: 38,
        align: 'center',
        fontFamily: 'Noto Sans Tamil',
        backgroundColor: '#0c1322',
        textColor: '#ffffff',
        accent: '#e5b965',
        highlights: []
      },
      {
        id: 'slide-3',
        title: 'Slide 3',
        body: 'PADMASUDHA\nReport\n\nProduction Summary &\nKey Updates',
        reference: '',
        fontSize: 34,
        align: 'center',
        fontFamily: 'Noto Sans Tamil',
        backgroundColor: '#0c1322',
        textColor: '#f8fafc',
        accent: '#38bdf8',
        highlights: []
      },
      {
        id: 'slide-4',
        title: 'Slide 4',
        body: 'SPECTRUM\n\nWeekly Church Assembly\nSunday Morning Service',
        reference: '',
        fontSize: 36,
        align: 'center',
        fontFamily: 'Noto Sans Tamil',
        backgroundColor: '#0c1322',
        textColor: '#ffffff',
        accent: '#e5b965',
        highlights: []
      },
      {
        id: 'slide-5',
        title: 'Slide 5',
        body: 'ஆராதனை வேளை\n\nபரிசுத்த அலங்காரத்துடனே\nகர்த்தரைத் தொழுதுகொள்ளுங்கள்',
        reference: '',
        fontSize: 40,
        align: 'center',
        fontFamily: 'Noto Sans Tamil',
        backgroundColor: '#0c1322',
        textColor: '#ffffff',
        accent: '#e5b965',
        highlights: []
      }
    ]
  },
  {
    id: 'doc-announcements',
    title: 'Sunday Service Announcements',
    badge: 'SLIDES',
    kind: 'media',
    subtitle: 'PowerPoint · 3 slides',
    slides: [
      {
        id: 'ann-1',
        title: 'Welcome',
        body: 'கிறிஸ்துவுக்குள் அன்பான வாழ்த்துகள்\nஇன்றைய ஆராதனைக்கு உங்களை அன்போடு வரவேற்கிறோம்',
        reference: '',
        fontSize: 38,
        align: 'center',
        fontFamily: 'Noto Sans Tamil',
        backgroundColor: '#0c1322',
        textColor: '#ffffff',
        accent: '#e5b965',
        highlights: []
      },
      {
        id: 'ann-2',
        title: 'Fast Prayer',
        body: 'உபவாச ஜெபம்\nவெள்ளிக்கிழமை காலை 10:00 மணி\nஎல்லோரும் தவறாமல் கலந்துகொள்ளவும்',
        reference: '',
        fontSize: 36,
        align: 'center',
        fontFamily: 'Noto Sans Tamil',
        backgroundColor: '#0c1322',
        textColor: '#ffffff',
        accent: '#e5b965',
        highlights: []
      },
      {
        id: 'ann-3',
        title: 'Benediction',
        body: 'நம்முடைய கர்த்தராகிய இயேசுகிறிஸ்துவின் கிருபையும்\nபிதாவாகிய தேவனுடைய அன்பும்\nபரிசுத்த ஆவியானவரின் ஐக்கியமும்\nநம் அனைவரோடுங்கூட இருப்பதாக. ஆமென்.',
        reference: '',
        fontSize: 34,
        align: 'center',
        fontFamily: 'Noto Sans Tamil',
        backgroundColor: '#0c1322',
        textColor: '#ffffff',
        accent: '#e5b965',
        highlights: []
      }
    ]
  }
];

export function ProjectorConsole({
  booksMeta = [],
  songsIndex = [],
  projector,
  uiLang = 'ta',
  userSongs = [],
  onOpenAddSong,
  onDeleteSong,
  user,
  onOpenAuth
}) {
  const t = translations[uiLang] || translations.ta;

  // Responsive mobile presenter state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [isFullscreenMobilePresenter, setIsFullscreenMobilePresenter] = useState(false);
  const [mobileSongViewMode, setMobileSongViewMode] = useState('list'); // 'list' | 'stanzas'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 3-way Left Sidebar Mode: 'media' | 'bible' | 'songs'
  const [leftTab, setLeftTab] = useState('bible');

  // Force non-media tab on mobile
  useEffect(() => {
    if (isMobile && leftTab === 'media') {
      setLeftTab('bible');
    }
  }, [isMobile, leftTab]);

  // Media state
  const [mediaDocs, setMediaDocs] = useState(() => {
    try {
      const saved = localStorage.getItem('worship_cloud_media_docs_v4');
      return saved ? JSON.parse(saved) : DEFAULT_MEDIA_DOCUMENTS;
    } catch {
      return DEFAULT_MEDIA_DOCUMENTS;
    }
  });
  const [selectedMediaDocId, setSelectedMediaDocId] = useState(() => mediaDocs[0]?.id || 'doc-report');

  // Bible state
  const [bibleBookCode, setBibleBookCode] = useState('GEN');
  const [bibleChapterNum, setBibleChapterNum] = useState(1);
  const [bibleBookData, setBibleBookData] = useState(null);
  const [loadingBible, setLoadingBible] = useState(false);
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [highlightedBookIndex, setHighlightedBookIndex] = useState(0);
  const [jumpQuery, setJumpQuery] = useState('');
  const bookDropdownRef = useRef(null);
  const bookSearchInputRef = useRef(null);
  const jumpInputRef = useRef(null);

  const handleOpenBookSearch = () => {
    setIsBookDropdownOpen(true);
    setTimeout(() => {
      bookSearchInputRef.current?.focus();
      bookSearchInputRef.current?.select();
    }, 20);
  };

  // Bible Bookmarks state (live synced with localStorage & BibleReader)
  const [bibleBookmarks, setBibleBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('worship_cloud_bible_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [bibleLeftSubTab, setBibleLeftSubTab] = useState('chapters'); // 'chapters' | 'bookmarks'
  const [slideContextMenu, setSlideContextMenu] = useState({ visible: false, x: 0, y: 0, slide: null });

  // Cross-tab and cross-component sync
  useEffect(() => {
    const handleBookmarkSync = () => {
      try {
        const saved = localStorage.getItem('worship_cloud_bible_bookmarks');
        setBibleBookmarks(saved ? JSON.parse(saved) : []);
      } catch {}
    };
    window.addEventListener('storage', handleBookmarkSync);
    window.addEventListener('worship_cloud_bible_bookmarks_updated', handleBookmarkSync);
    return () => {
      window.removeEventListener('storage', handleBookmarkSync);
      window.removeEventListener('worship_cloud_bible_bookmarks_updated', handleBookmarkSync);
    };
  }, []);

  // Dismiss context menu on click outside or escape
  useEffect(() => {
    const handleDismiss = () => {
      setSlideContextMenu((prev) => (prev.visible ? { visible: false, x: 0, y: 0, slide: null } : prev));
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('click', handleDismiss);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleDismiss);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isSlideBookmarked = (slide) => {
    if (!slide?.id) return false;
    const match = slide.id.match(/^bible-([^-]+)-(\d+)-(\d+)$/);
    if (!match) return false;
    const bmId = `${match[1]}-${match[2]}-${match[3]}`;
    return bibleBookmarks.some((b) => b.id === bmId);
  };

  const toggleBookmarkFromSlide = (slide) => {
    if (!slide?.id) return;
    const match = slide.id.match(/^bible-([^-]+)-(\d+)-(\d+)$/);
    if (!match) return;
    const bookCode = match[1];
    const chapter = parseInt(match[2], 10);
    const verseNumber = parseInt(match[3], 10);
    const bmId = `${bookCode}-${chapter}-${verseNumber}`;
    const targetMeta = booksMeta.find((b) => b.code === bookCode) || { name: bookCode, english: bookCode };

    setBibleBookmarks((prev) => {
      const exists = prev.some((b) => b.id === bmId);
      let updated;
      if (exists) {
        updated = prev.filter((b) => b.id !== bmId);
      } else {
        const item = {
          id: bmId,
          bookCode,
          bookName: targetMeta.name || bookCode,
          englishBookName: targetMeta.english || bookCode,
          chapter,
          verseNumber,
          text: slide.body || '',
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

  const removeBibleBookmark = (id) => {
    setBibleBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem('worship_cloud_bible_bookmarks', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('worship_cloud_bible_bookmarks_updated', { detail: updated }));
      } catch {}
      return updated;
    });
  };

  const handleSelectBookmark = (bm) => {
    if (!bm) return;
    if (leftTab !== 'bible') {
      setLeftTab('bible');
    }
    if (bibleBookCode !== bm.bookCode) {
      setBibleBookCode(bm.bookCode);
    }
    setBibleChapterNum(bm.chapter);

    const targetSlideId = `bible-${bm.bookCode}-${bm.chapter}-${bm.verseNumber}`;
    setSelectedSlideId(targetSlideId);
    setTimeout(() => {
      const el = document.getElementById(`slide-card-${targetSlideId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 180);
  };

  const handleSlideContextMenu = (e, slide) => {
    if (activePresentation?.kind !== 'bible' && !slide?.id?.startsWith('bible-')) return;
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 210;
    const menuHeight = 130;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);
    setSlideContextMenu({
      visible: true,
      x: Math.max(10, x),
      y: Math.max(10, y),
      slide
    });
  };

  // Songs state
  const [songQuery, setSongQuery] = useState('');
  const [selectedSongMeta, setSelectedSongMeta] = useState(null);
  const [songDetails, setSongDetails] = useState(null);
  const [loadingSong, setLoadingSong] = useState(false);
  const [songFavorites, setSongFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('worship_cloud_song_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [songFilterTab, setSongFilterTab] = useState('all'); // 'all' | 'fav'
  const [songDisplayCount, setSongDisplayCount] = useState(80);

  // Global Active Presentation Workspace Space
  const [activePresentation, setActivePresentation] = useState({
    title: 'ஆதியாகமம் 1',
    badge: 'BIBLE',
    kind: 'bible',
    slides: []
  });

  const [selectedSlideId, setSelectedSlideId] = useState(null);

  // Styling & Live Controller States (Separate settings for Bible, Songs, Media)
  const [bibleStyle, setBibleStyle] = useState({
    backgroundColor: '#0c1322',
    textColor: '#ffffff',
    referenceColor: '#e5b965',
    autoContrast: true,
    fontSize: 44,
    referenceSize: 24,
    fontFamily: 'Noto Sans Tamil',
    align: 'center',
    bgType: 'solid', // 'solid' | 'texture'
    selectedTextureId: 'sunbeams',
    textureSrc: './images/card-backgrounds/sunbeams.jpg',
    bgOverlayOpacity: 0.70,
    customBgImage: null
  });

  const [songStyle, setSongStyle] = useState({
    backgroundColor: '#0c1322',
    textColor: '#ffffff',
    referenceColor: '#e5b965',
    autoContrast: true,
    fontSize: 40,
    referenceSize: 22,
    fontFamily: 'Noto Sans Tamil',
    align: 'center',
    altLineColorEnabled: false,
    altLineColor: '#38bdf8',
    bgType: 'solid', // 'solid' | 'texture'
    selectedTextureId: 'sunbeams',
    textureSrc: './images/card-backgrounds/sunbeams.jpg',
    bgOverlayOpacity: 0.70,
    customBgImage: null
  });

  const [autoContrast, setAutoContrast] = useState(true);
  const [quickLive, setQuickLive] = useState(true); // Turned ON by default
  const [frozen, setFrozen] = useState(false);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);

  // Media importing indicator
  const [isImportingMedia, setIsImportingMedia] = useState(false);
  const [importStatusText, setImportStatusText] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Bible Live Highlighter State (Strictly only for Bible in Live/Projector)
  const [bibleHighlights, setBibleHighlights] = useState([]);
  const bibleHighlightsRef = useRef([]);
  bibleHighlightsRef.current = bibleHighlights;

  const [activeHighlightColor, setActiveHighlightColor] = useState('#f6d365');
  const [highlightInput, setHighlightInput] = useState('');
  const [floatingHighlightPos, setFloatingHighlightPos] = useState(null);

  const fileInputRef = useRef(null);
  const customTextureInputRef = useRef(null);
  const fontDropdownRef = useRef(null);
  const stageCanvasRef = useRef(null);

  const handleAddBibleHighlight = (text, color = activeHighlightColor) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;

    const currentList = bibleHighlightsRef.current || [];
    const already = currentList.some((h) => h.text.toLowerCase() === trimmed.toLowerCase());
    const nextHighlights = already ? currentList : [...currentList, { text: trimmed, color }];

    bibleHighlightsRef.current = nextHighlights;
    setBibleHighlights(nextHighlights);

    if (projector?.setHighlights) {
      projector.setHighlights(nextHighlights);
    } else if (projector?.addHighlight) {
      projector.addHighlight(trimmed, color);
    }

    // Auto-update live projection activeSlide if applicable
    if (projector.activeSlide && (projector.activeSlide.id === selectedSlide?.id || quickLive)) {
      projector.projectSlide({
        ...projector.activeSlide,
        highlights: nextHighlights
      });
    }
  };

  const handleRemoveBibleHighlight = (text) => {
    const currentList = bibleHighlightsRef.current || [];
    const nextHighlights = currentList.filter((h) => h.text.toLowerCase() !== String(text).toLowerCase());

    bibleHighlightsRef.current = nextHighlights;
    setBibleHighlights(nextHighlights);

    if (projector?.setHighlights) {
      projector.setHighlights(nextHighlights);
    } else if (projector?.removeHighlight) {
      projector.removeHighlight(text);
    }

    if (projector.activeSlide && (projector.activeSlide.id === selectedSlide?.id || quickLive)) {
      projector.projectSlide({
        ...projector.activeSlide,
        highlights: nextHighlights
      });
    }
  };

  const handleClearBibleHighlights = () => {
    bibleHighlightsRef.current = [];
    setBibleHighlights([]);

    if (projector?.setHighlights) {
      projector.setHighlights([]);
    } else if (projector?.clearHighlights) {
      projector.clearHighlights();
    }

    if (projector.activeSlide && (projector.activeSlide.id === selectedSlide?.id || quickLive)) {
      projector.projectSlide({
        ...projector.activeSlide,
        highlights: []
      });
    }
  };

  const handleStageMouseUp = () => {
    if (leftTab !== 'bible') {
      setFloatingHighlightPos(null);
      return;
    }
    const sel = window.getSelection();
    const text = sel?.toString()?.trim();
    if (text && text.length > 0 && text.length < 120 && stageCanvasRef.current) {
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = stageCanvasRef.current.getBoundingClientRect();
        setFloatingHighlightPos({
          text,
          top: Math.max(8, rect.top - containerRect.top - 34),
          left: Math.max(8, Math.min(containerRect.width - 120, rect.left - containerRect.left + (rect.width / 2) - 45))
        });
        setHighlightInput(text);
      } catch {
        setFloatingHighlightPos(null);
      }
    } else {
      setFloatingHighlightPos(null);
    }
  };

  // Close font dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target)) {
        setIsFontDropdownOpen(false);
      }
    };
    if (isFontDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isFontDropdownOpen]);

  // Save media docs
  useEffect(() => {
    try {
      localStorage.setItem('worship_cloud_media_docs_v4', JSON.stringify(mediaDocs));
    } catch {}
  }, [mediaDocs]);

  // Click outside to close hybrid book dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(e.target)) {
        setIsBookDropdownOpen(false);
      }
    };
    if (isBookDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('scroll', handleOutsideClick, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('scroll', handleOutsideClick, true);
    };
  }, [isBookDropdownOpen]);

  // Load Bible book data
  useEffect(() => {
    let isCancelled = false;
    setLoadingBible(true);

    fetch(`./data/bible/taovbsi/${bibleBookCode}.json`)
      .then((r) => r.json())
      .then((data) => {
        if (!isCancelled) {
          setBibleBookData(data);
          setLoadingBible(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load Bible book:', err);
        if (!isCancelled) setLoadingBible(false);
      });

    return () => { isCancelled = true; };
  }, [bibleBookCode]);

  // Current selected slide or default
  const selectedSlide = useMemo(() => {
    return activePresentation.slides.find((s) => s.id === selectedSlideId) || activePresentation.slides[0] || null;
  }, [activePresentation, selectedSlideId]);

  // Effective Style Settings for Active Section
  const effectiveAutoContrast = leftTab === 'bible' 
    ? bibleStyle.autoContrast 
    : (leftTab === 'songs' ? songStyle.autoContrast : autoContrast);

  const effectiveBg = leftTab === 'bible' 
    ? bibleStyle.backgroundColor 
    : (leftTab === 'songs' ? songStyle.backgroundColor : (selectedSlide?.backgroundColor || '#0c1322'));

  const effectiveBgType = leftTab === 'bible'
    ? (bibleStyle.bgType || 'solid')
    : (leftTab === 'songs' ? (songStyle.bgType || 'solid') : (selectedSlide?.bgType || 'solid'));

  const effectiveSelectedTextureId = leftTab === 'bible'
    ? (bibleStyle.selectedTextureId || 'sunbeams')
    : (leftTab === 'songs' ? (songStyle.selectedTextureId || 'sunbeams') : (selectedSlide?.selectedTextureId || 'sunbeams'));

  const effectiveTextureSrc = leftTab === 'bible'
    ? ((bibleStyle.selectedTextureId === 'custom' && bibleStyle.customBgImage) ? bibleStyle.customBgImage : (SLIDE_TEXTURES.find(t => t.id === bibleStyle.selectedTextureId)?.src || bibleStyle.textureSrc || SLIDE_TEXTURES[0].src))
    : (leftTab === 'songs' ? ((songStyle.selectedTextureId === 'custom' && songStyle.customBgImage) ? songStyle.customBgImage : (SLIDE_TEXTURES.find(t => t.id === songStyle.selectedTextureId)?.src || songStyle.textureSrc || SLIDE_TEXTURES[0].src)) : (selectedSlide?.textureSrc || SLIDE_TEXTURES[0].src));

  const effectiveBgOverlayOpacity = leftTab === 'bible'
    ? (bibleStyle.bgOverlayOpacity ?? 0.70)
    : (leftTab === 'songs' ? (songStyle.bgOverlayOpacity ?? 0.70) : (selectedSlide?.bgOverlayOpacity ?? 0.70));

  const effectiveTextColor = leftTab === 'bible' 
    ? bibleStyle.textColor 
    : (leftTab === 'songs' ? songStyle.textColor : (selectedSlide?.textColor || '#ffffff'));

  const effectiveFontSize = leftTab === 'bible'
    ? bibleStyle.fontSize
    : (leftTab === 'songs' ? songStyle.fontSize : (selectedSlide?.fontSize || 42));

  const effectiveRefSize = leftTab === 'bible'
    ? bibleStyle.referenceSize
    : (leftTab === 'songs' ? songStyle.referenceSize : (selectedSlide?.referenceSize || 24));

  const effectiveRefColor = leftTab === 'bible'
    ? (bibleStyle.referenceColor || '#e5b965')
    : (leftTab === 'songs' ? (songStyle.referenceColor || '#e5b965') : (selectedSlide?.referenceColor || selectedSlide?.accent || '#e5b965'));

  const effectiveFontFamily = leftTab === 'bible'
    ? bibleStyle.fontFamily
    : (leftTab === 'songs' ? songStyle.fontFamily : (selectedSlide?.fontFamily || 'Noto Sans Tamil'));

  const effectiveAlign = leftTab === 'bible'
    ? bibleStyle.align
    : (leftTab === 'songs' ? songStyle.align : (selectedSlide?.align || 'center'));

  // When Bible chapter changes, populate presentation editor with verses as 16:9 slides using bibleStyle
  const loadBibleChapterSlides = (bookCode, chNum, data) => {
    const bookMeta = booksMeta.find((b) => b.code === bookCode) || booksMeta[0];
    const targetBookData = data || bibleBookData;
    const chapterObj = targetBookData?.chapters?.find((ch) => ch.number === chNum);
    const verses = chapterObj?.verses || [];

    if (!verses.length) {
      setActivePresentation({
        title: `${bookMeta.name} ${chNum}`,
        badge: 'BIBLE',
        kind: 'bible',
        slides: []
      });
      setSelectedSlideId(null);
      return;
    }

    const fontSize = bibleStyle.fontSize;
    const referenceSize = bibleStyle.referenceSize;
    const fontFamily = bibleStyle.fontFamily;
    const backgroundColor = bibleStyle.backgroundColor;
    const textColor = bibleStyle.autoContrast ? getContrastTextColor(backgroundColor) : bibleStyle.textColor;
    const referenceColor = bibleStyle.referenceColor || '#e5b965';
    const align = bibleStyle.align;
    const bgType = bibleStyle.bgType || 'solid';
    const textureSrc = (bibleStyle.selectedTextureId === 'custom' && bibleStyle.customBgImage)
      ? bibleStyle.customBgImage
      : (SLIDE_TEXTURES.find(t => t.id === bibleStyle.selectedTextureId)?.src || bibleStyle.textureSrc || SLIDE_TEXTURES[0].src);
    const bgOverlayOpacity = bibleStyle.bgOverlayOpacity ?? 0.70;

    const slides = verses.map((v) => ({
      id: `bible-${bookCode}-${chNum}-${v.number}`,
      title: `${bookMeta.name} ${chNum}:${v.number}`,
      body: v.text,
      reference: `${bookMeta.name} ${chNum}:${v.number}`,
      fontSize,
      referenceSize,
      align,
      fontFamily,
      backgroundColor,
      textColor,
      referenceColor,
      accent: referenceColor,
      highlights: [],
      bgType,
      textureSrc,
      bgOverlayOpacity
    }));

    setActivePresentation({
      title: `${bookMeta.name} ${chNum}`,
      badge: 'BIBLE',
      kind: 'bible',
      slides
    });
    setSelectedSlideId(slides[0]?.id || null);
  };

  // Dedicated helper to populate Song slides using songStyle (STRICTLY removes Pallavi & Saranam text)
  const loadSongSlides = (songMeta, details, styleOverride) => {
    if (!songMeta || !details) return;
    const style = styleOverride || songStyle;
    const textColor = style.autoContrast ? getContrastTextColor(style.backgroundColor) : style.textColor;
    const referenceColor = style.referenceColor || '#e5b965';
    const bgType = style.bgType || 'solid';
    const textureSrc = (style.selectedTextureId === 'custom' && style.customBgImage)
      ? style.customBgImage
      : (SLIDE_TEXTURES.find(t => t.id === style.selectedTextureId)?.src || style.textureSrc || SLIDE_TEXTURES[0].src);
    const bgOverlayOpacity = style.bgOverlayOpacity ?? 0.70;

    const headingPattern = /^(?:pallavi|chorus|refrain|bridge|intro|verse|stanza|charanam|பல்லவி|சரணம்|கோரஸ்|அனுபல்லவி|இடைச்சரணம்|முகப்புரை)\s*(\d+)?\s*[:.)\-–—]*\s*$/i;

    const songSlides = details.sections.map((sec, idx) => {
      const cleanLines = (sec.lines || []).filter((line) => !headingPattern.test(line.trim()));
      return {
        id: `song-${songMeta.id}-${sec.id || idx}`,
        title: `${songMeta.t} (${idx + 1})`,
        body: cleanLines.join('\n'),
        reference: '', // Strictly removed Pallavi & Saranam references from slides
        fontSize: style.fontSize,
        referenceSize: style.referenceSize,
        align: style.align,
        fontFamily: style.fontFamily,
        backgroundColor: style.backgroundColor,
        textColor,
        referenceColor,
        accent: referenceColor,
        highlights: [],
        altLineColorEnabled: style.altLineColorEnabled || false,
        altLineColor: style.altLineColor || '#38bdf8',
        bgType,
        textureSrc,
        bgOverlayOpacity
      };
    });

    setActivePresentation({
      title: songMeta.t,
      badge: 'SONG',
      kind: 'song',
      slides: songSlides
    });
    setSelectedSlideId(songSlides[0]?.id || null);
  };

  // Watch bibleBookData change to populate chapter
  useEffect(() => {
    if (leftTab === 'bible' && bibleBookData) {
      loadBibleChapterSlides(bibleBookCode, bibleChapterNum, bibleBookData);
    }
  }, [bibleBookData, bibleChapterNum]);

  // Load Song data when selected
  useEffect(() => {
    if (!selectedSongMeta) {
      setSongDetails(null);
      return;
    }

    if (selectedSongMeta.custom) {
      const sections = splitSongSections(selectedSongMeta.lyrics);
      const details = {
        title: selectedSongMeta.title,
        englishTitle: selectedSongMeta.englishTitle || '',
        lyrics: selectedSongMeta.lyrics,
        sections
      };
      setSongDetails(details);
      loadSongSlides(selectedSongMeta, details, songStyle);
      setLoadingSong(false);
      return;
    }

    let isCancelled = false;
    setLoadingSong(true);

    const chunkId = String(selectedSongMeta.c).padStart(2, '0');
    const chunkUrl = `./data/songs/chunks/chunk-${chunkId}.json`;

    const fetchSong = async () => {
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
          const content = chunkData.songs[selectedSongMeta.id];
          if (content) {
            const sections = splitSongSections(content.lyrics);
            const details = { ...content, sections };
            setSongDetails(details);
            loadSongSlides(selectedSongMeta, details, songStyle);
          }
        }
      } catch (err) {
        console.error('Failed to load song stanzas:', err);
      } finally {
        if (!isCancelled) setLoadingSong(false);
      }
    };

    fetchSong();
    return () => { isCancelled = true; };
  }, [selectedSongMeta]);

  // Update active slide property and propagate to all slides in current section
  const updateActiveSlide = (patch) => {
    let finalPatch = { ...patch };

    // SECTION 1: BIBLE MODE (Updates bibleStyle and ALL slides in current Bible chapter)
    if (leftTab === 'bible') {
      const newAutoContrast = patch.autoContrast !== undefined ? patch.autoContrast : bibleStyle.autoContrast;
      const newBg = patch.backgroundColor || bibleStyle.backgroundColor;
      let newTextColor = patch.textColor !== undefined ? patch.textColor : bibleStyle.textColor;

      if (newAutoContrast && (patch.backgroundColor || patch.autoContrast !== undefined)) {
        newTextColor = getContrastTextColor(newBg);
      }
      finalPatch.textColor = newTextColor;

      const updatedStyle = {
        ...bibleStyle,
        ...finalPatch,
        autoContrast: newAutoContrast,
        textColor: newTextColor
      };
      setBibleStyle(updatedStyle);

      setActivePresentation((prev) => {
        const updatedSlides = (prev.slides || []).map((s) => ({
          ...s,
          ...finalPatch,
          textColor: newTextColor
        }));

        if (projector.activeSlide) {
          projector.projectSlide({
            ...projector.activeSlide,
            ...finalPatch,
            textColor: newTextColor
          });
        }

        return { ...prev, slides: updatedSlides };
      });
      return;
    }

    // SECTION 2: SONGS MODE (Updates songStyle and ALL slides in current Song)
    if (leftTab === 'songs') {
      const newAutoContrast = patch.autoContrast !== undefined ? patch.autoContrast : songStyle.autoContrast;
      const newBg = patch.backgroundColor || songStyle.backgroundColor;
      let newTextColor = patch.textColor !== undefined ? patch.textColor : songStyle.textColor;

      if (newAutoContrast && (patch.backgroundColor || patch.autoContrast !== undefined)) {
        newTextColor = getContrastTextColor(newBg);
      }
      finalPatch.textColor = newTextColor;

      const updatedStyle = {
        ...songStyle,
        ...finalPatch,
        autoContrast: newAutoContrast,
        textColor: newTextColor
      };
      setSongStyle(updatedStyle);

      setActivePresentation((prev) => {
        const updatedSlides = (prev.slides || []).map((s) => ({
          ...s,
          ...finalPatch,
          textColor: newTextColor
        }));

        if (projector.activeSlide) {
          projector.projectSlide({
            ...projector.activeSlide,
            ...finalPatch,
            textColor: newTextColor
          });
        }

        return { ...prev, slides: updatedSlides };
      });
      return;
    }

    // SECTION 3: MEDIA MODE (Updates selected slide or document)
    if (patch.backgroundColor && autoContrast) {
      finalPatch.textColor = getContrastTextColor(patch.backgroundColor);
    }

    setActivePresentation((prev) => {
      const updatedSlides = (prev.slides || []).map((s) => {
        if (s.id === selectedSlide?.id) {
          return { ...s, ...finalPatch };
        }
        return s;
      });

      if (projector.activeSlide && projector.activeSlide.id === selectedSlide?.id) {
        projector.projectSlide({
          ...projector.activeSlide,
          ...finalPatch
        });
      }

      return { ...prev, slides: updatedSlides };
    });
  };

  // Toggle Auto Contrast
  const handleToggleAutoContrast = () => {
    if (leftTab === 'bible') {
      const next = !bibleStyle.autoContrast;
      updateActiveSlide({ autoContrast: next });
    } else if (leftTab === 'songs') {
      const next = !songStyle.autoContrast;
      updateActiveSlide({ autoContrast: next });
    } else {
      setAutoContrast((prev) => {
        const next = !prev;
        if (next && selectedSlide) {
          const highContrastText = getContrastTextColor(selectedSlide.backgroundColor);
          updateActiveSlide({ textColor: highContrastText });
        }
        return next;
      });
    }
  };

  // Send slide live to output (WITHOUT generic 'Slide X' or Pallavi/Saranam reference)
  const handleGoLive = (slide) => {
    if (!slide) return;
    const isBible = leftTab === 'bible' || activePresentation.kind === 'bible' || slide.id?.startsWith('bible-');
    const isSong = leftTab === 'songs' || activePresentation.kind === 'song' || slide.id?.startsWith('song-');

    let cleanRef = slide.reference && !/^slide\s*\d+$/i.test(slide.reference.trim()) 
      ? slide.reference 
      : '';
    if (isSong) {
      cleanRef = '';
    }

    let slideText = slide.body || slide.text || slide.title || '';
    if (isSong) {
      const headingPattern = /^(?:pallavi|chorus|refrain|bridge|intro|verse|stanza|charanam|பல்லவி|சரணம்|கோரஸ்|அனுபல்லவி|இடைச்சரணம்|முகப்புரை)\s*(\d+)?\s*[:.)\-–—]*\s*$/i;
      slideText = slideText.split('\n').filter((l) => !headingPattern.test(l.trim())).join('\n');
    }

    projector.projectSlide({
      ...slide,
      text: slideText,
      reference: cleanRef,
      fontSize: slide.fontSize || 42,
      referenceSize: slide.referenceSize || 24,
      fontFamily: slide.fontFamily || 'Noto Sans Tamil',
      backgroundColor: slide.backgroundColor || '#0c1322',
      textColor: slide.textColor || '#ffffff',
      referenceColor: slide.referenceColor || slide.accent || effectiveRefColor,
      accent: slide.referenceColor || slide.accent || effectiveRefColor,
      align: slide.align || 'center',
      kind: isBible ? 'bible' : (isSong ? 'song' : (activePresentation.kind || 'custom')),
      type: isBible ? 'bible' : (isSong ? 'song' : (activePresentation.kind || 'custom')),
      highlights: isBible ? (bibleHighlightsRef.current || bibleHighlights) : [],
      altLineColorEnabled: isSong ? (slide.altLineColorEnabled || songStyle.altLineColorEnabled || false) : false,
      altLineColor: isSong ? (slide.altLineColor || songStyle.altLineColor || '#38bdf8') : undefined,
      presentationSlides: activePresentation.slides
    });

    if (isBible) {
      const activeBibleHighlights = bibleHighlightsRef.current || bibleHighlights;
      if (projector?.setHighlights) {
        projector.setHighlights(activeBibleHighlights);
      } else if (projector?.addHighlight) {
        activeBibleHighlights.forEach((h) => projector.addHighlight(h.text, h.color));
      }
    } else {
      if (projector?.setHighlights) {
        projector.setHighlights([]);
      } else if (projector?.clearHighlights) {
        projector.clearHighlights();
      }
    }
  };

  // Sync selected slide when projector.activeSlide changes (e.g. from projection window arrow keys)
  useEffect(() => {
    if (projector?.activeSlide?.id && projector.activeSlide.id !== selectedSlideId) {
      const match = activePresentation.slides?.find((s) => s.id === projector.activeSlide.id);
      if (match) {
        setSelectedSlideId(projector.activeSlide.id);
      }
    }
  }, [projector?.activeSlide?.id, activePresentation.slides, selectedSlideId]);

  // Keyboard navigation for slides (Arrow keys / Space) in operator console
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        const slides = activePresentation.slides || [];
        const idx = slides.findIndex((s) => s.id === selectedSlideId);
        if (idx >= 0 && idx < slides.length - 1) {
          handleSelectSlide(slides[idx + 1]);
        }
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        const slides = activePresentation.slides || [];
        const idx = slides.findIndex((s) => s.id === selectedSlideId);
        if (idx > 0) {
          handleSelectSlide(slides[idx - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePresentation.slides, selectedSlideId, quickLive]);

  // Handle slide selection
  const handleSelectSlide = (slide) => {
    setSelectedSlideId(slide.id);
    if (quickLive || isMobile) {
      handleGoLive(slide);
    }
  };

  // Mobile touch & tap slide navigation helpers
  const touchStartPos = useRef({ x: 0, y: 0, time: 0 });

  const handleMobileNext = (e) => {
    if (e) e.stopPropagation();
    const slides = activePresentation?.slides || [];
    const currentIdx = slides.findIndex((s) => s.id === (selectedSlideId || selectedSlide?.id));
    const safeIdx = currentIdx >= 0 ? currentIdx : 0;
    if (safeIdx < slides.length - 1) {
      const next = slides[safeIdx + 1];
      handleSelectSlide(next);
      handleGoLive(next);
    }
  };

  const handleMobilePrev = (e) => {
    if (e) e.stopPropagation();
    const slides = activePresentation?.slides || [];
    const currentIdx = slides.findIndex((s) => s.id === (selectedSlideId || selectedSlide?.id));
    const safeIdx = currentIdx >= 0 ? currentIdx : 0;
    if (safeIdx > 0) {
      const prev = slides[safeIdx - 1];
      handleSelectSlide(prev);
      handleGoLive(prev);
    }
  };

  const handleMobileFirst = () => {
    const slides = activePresentation?.slides || [];
    if (slides.length > 0) {
      handleSelectSlide(slides[0]);
      handleGoLive(slides[0]);
    }
  };

  const handleTouchStart = (e) => {
    if (!e.touches?.[0]) return;
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches?.[0]) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const slides = activePresentation?.slides || [];
    const currentIdx = slides.findIndex((s) => s.id === (selectedSlideId || selectedSlide?.id));
    const safeIdx = currentIdx >= 0 ? currentIdx : 0;

    // SWIPE UP OR DOWN (vertical swipe > 45px) -> Jump to first slide!
    if (absY > 45 && absY > absX) {
      handleMobileFirst();
      return;
    }

    // TAP (minimal displacement)
    if (absX < 20 && absY < 20) {
      if (touch.clientX > window.innerWidth * 0.5) {
        // Right side 50% tap -> next slide
        if (safeIdx < slides.length - 1) {
          const next = slides[safeIdx + 1];
          handleSelectSlide(next);
          handleGoLive(next);
        }
      } else {
        // Left side 50% tap -> previous slide
        if (safeIdx > 0) {
          const prev = slides[safeIdx - 1];
          handleSelectSlide(prev);
          handleGoLive(prev);
        }
      }
    }
  };

  // Add new slide
  const handleAddSlide = () => {
    const newSlideId = `slide-${Date.now()}`;
    const newSlide = {
      id: newSlideId,
      title: `Slide ${(activePresentation.slides.length || 0) + 1}`,
      body: 'உங்கள் செய்தியை இங்கே எழுதுங்கள்',
      reference: '',
      fontSize: selectedSlide?.fontSize || 42,
      align: selectedSlide?.align || 'center',
      fontFamily: selectedSlide?.fontFamily || 'Noto Sans Tamil',
      backgroundColor: selectedSlide?.backgroundColor || '#0c1322',
      textColor: selectedSlide?.textColor || '#ffffff',
      accent: selectedSlide?.accent || '#e5b965',
      highlights: []
    };

    setActivePresentation((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
    setSelectedSlideId(newSlideId);
  };

  // Clear all slides
  const handleClearAllSlides = () => {
    if (window.confirm('Clear all slides in this view?')) {
      setActivePresentation((prev) => ({ ...prev, slides: [] }));
      setSelectedSlideId(null);
    }
  };

  // Delete an imported media document
  const deleteMediaDoc = (id) => {
    setMediaDocs((prev) => {
      const remaining = prev.filter((d) => d.id !== id);
      if (activePresentation.id === id && remaining.length) {
        setActivePresentation(remaining[0]);
        setSelectedSlideId(remaining[0].slides[0]?.id || null);
      }
      return remaining;
    });
  };

  // Handle file import for Media (Multiple Images, PDFs, PPTX, Text)
  const processMediaFiles = async (filesList) => {
    const rawFiles = Array.from(filesList || []);
    if (!rawFiles.length) return;

    setIsImportingMedia(true);
    setImportStatusText('கோப்புகள் ஏற்றப்படுகின்றன... (Importing files...)');

    try {
      const newDocs = [];
      const imageFiles = [];

      for (let i = 0; i < rawFiles.length; i++) {
        const file = rawFiles[i];
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
          setImportStatusText(`PDF "${file.name}" மாற்றப்படுகிறது... (${i + 1}/${rawFiles.length})`);
          const slides = await parsePdfToSlides(file, (curr, total) => {
            setImportStatusText(`PDF "${file.name}" பக்கம் ${curr}/${total}...`);
          });
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          newDocs.push({
            id: `media-pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: baseName,
            badge: 'PDF',
            kind: 'media',
            subtitle: `PDF · ${slides.length} slides`,
            slides
          });
        } else if (file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.ppt')) {
          setImportStatusText(`PowerPoint "${file.name}" பிரிக்கப்படுகிறது... (${i + 1}/${rawFiles.length})`);
          const slides = await parsePptxToSlides(file);
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          newDocs.push({
            id: `media-pptx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: baseName,
            badge: 'PPTX',
            kind: 'media',
            subtitle: `PowerPoint · ${slides.length} slides`,
            slides
          });
        } else {
          // Text document (.txt, lyrics, etc.)
          setImportStatusText(`ஆவணம் "${file.name}" ஏற்றப்படுகிறது... (${i + 1}/${rawFiles.length})`);
          const text = await file.text();
          const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
          const slides = (paragraphs.length ? paragraphs : [text]).map((body, sIdx) => ({
            id: `txt-slide-${Date.now()}-${sIdx + 1}`,
            title: `Slide ${sIdx + 1}`,
            body,
            reference: '',
            fontSize: 36,
            align: 'center',
            fontFamily: 'Noto Sans Tamil',
            backgroundColor: '#0c1322',
            textColor: '#ffffff',
            accent: '#e5b965',
            highlights: []
          }));
          newDocs.push({
            id: `media-txt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            badge: 'DOCUMENT',
            kind: 'media',
            subtitle: `Text Document · ${slides.length} slides`,
            slides
          });
        }
      }

      // If any image files were in the selection, process them into an image set
      if (imageFiles.length > 0) {
        setImportStatusText(`படங்கள் செயலாக்கப்படுகின்றன... (${imageFiles.length} images)`);
        const imgSlides = await parseImagesToSlides(imageFiles);
        const docTitle = imageFiles.length === 1 
          ? imageFiles[0].name.replace(/\.[^/.]+$/, '') 
          : `படத் தொகுப்பு (${imageFiles.length} படங்கள்)`;

        newDocs.unshift({
          id: `media-img-${Date.now()}`,
          title: docTitle,
          badge: 'IMAGE',
          kind: 'media',
          subtitle: `Image Slides · ${imgSlides.length} slides`,
          slides: imgSlides
        });
      }

      if (newDocs.length > 0) {
        setMediaDocs((prev) => [...newDocs, ...prev]);
        setSelectedMediaDocId(newDocs[0].id);
        setActivePresentation(newDocs[0]);
        setSelectedSlideId(newDocs[0].slides[0]?.id || null);
        setLeftTab('media');
      }
    } catch (err) {
      console.error('Failed to import media file:', err);
      alert('Failed to import media: ' + (err.message || 'Unknown error'));
    } finally {
      setIsImportingMedia(false);
      setImportStatusText('');
    }
  };

  const handleImportMedia = async (e) => {
    const files = e.target.files;
    await processMediaFiles(files);
    if (e.target) e.target.value = '';
  };

  // Drag and Drop handlers for entire Projector Console
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processMediaFiles(e.dataTransfer.files);
    }
  };

  // Hybrid Book Search Filter
  const filteredBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return booksMeta;
    const q = bookSearchQuery.trim();
    const isNum = /^\d+$/.test(q);
    if (isNum) {
      const num = parseInt(q, 10);
      if (num >= 1 && num <= booksMeta.length) {
        return [booksMeta[num - 1]];
      }
    }
    const needle = normalizeSearch(q);
    return booksMeta.filter((b, idx) => {
      if ((idx + 1).toString() === q) return true;
      if (normalizeSearch(b.name).includes(needle)) return true;
      if (normalizeSearch(b.english).includes(needle)) return true;
      if (normalizeSearch(b.code).includes(needle)) return true;
      return (b.aliases || []).some((a) => normalizeSearch(a).includes(needle));
    });
  }, [booksMeta, bookSearchQuery]);

  useEffect(() => {
    setHighlightedBookIndex(0);
  }, [bookSearchQuery]);

  const selectBookAndFocusJump = (code) => {
    setBibleBookCode(code);
    setBibleChapterNum(1);
    setIsBookDropdownOpen(false);
    setBookSearchQuery('');
    setTimeout(() => {
      jumpInputRef.current?.focus();
      jumpInputRef.current?.select();
    }, 80);
  };

  const handleBookSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedBookIndex((prev) => Math.min(prev + 1, filteredBooks.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedBookIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredBooks.length > 0) {
        selectBookAndFocusJump(filteredBooks[highlightedBookIndex]?.code || filteredBooks[0]?.code);
      }
    } else if (e.key === 'Escape') {
      setIsBookDropdownOpen(false);
    }
  };

  // Verse Jump Parser (supports 1.15, 1,15, 1 15, 1:15, or 15)
  const handleJumpSubmit = (val) => {
    const raw = String(val || '').trim();
    if (!raw) return;

    let targetCh = bibleChapterNum;
    let targetVerseNum = null;

    const fullMatch = raw.match(/^(\d+)[.:,\s]+(\d+)$/);
    if (fullMatch) {
      targetCh = parseInt(fullMatch[1], 10);
      targetVerseNum = parseInt(fullMatch[2], 10);
    } else {
      const singleNum = parseInt(raw, 10);
      if (!isNaN(singleNum)) {
        if (singleNum <= (currentBookMeta?.chapters || 1)) {
          targetCh = singleNum;
        } else {
          targetVerseNum = singleNum;
        }
      }
    }

    if (targetCh !== bibleChapterNum) {
      setBibleChapterNum(targetCh);
    }

    if (targetVerseNum) {
      const targetSlideId = `bible-${bibleBookCode}-${targetCh}-${targetVerseNum}`;
      setTimeout(() => {
        setSelectedSlideId(targetSlideId);
        const verseObj = bibleBookData?.chapters?.find((ch) => ch.number === targetCh)?.verses?.find((v) => v.number === targetVerseNum);
        if (verseObj && quickLive) {
          handleGoLive({
            id: targetSlideId,
            title: `${currentBookMeta.name} ${targetCh}:${targetVerseNum}`,
            body: verseObj.text,
            reference: `${currentBookMeta.name} ${targetCh}:${targetVerseNum}`
          });
        }
      }, 100);
    }
  };

  const handleJumpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJumpSubmit(jumpQuery);
    }
  };

  const currentBookMeta = booksMeta.find((b) => b.code === bibleBookCode) || booksMeta[0];

  // Filter songs for Songs Tab using advanced word-priority ranking
  const filteredSongs = useMemo(() => {
    let sourceList = songsIndex || [];
    if (songFilterTab === 'fav') sourceList = songFavorites;
    if (songFilterTab === 'my') sourceList = userSongs;
    if (!songQuery.trim()) return sourceList;

    return rankSongResults(sourceList, songQuery);
  }, [songsIndex, songFavorites, userSongs, songFilterTab, songQuery]);

  // Reset display count on query or tab change
  useEffect(() => {
    setSongDisplayCount(80);
  }, [songQuery, songFilterTab]);

  const visibleSongs = useMemo(() => {
    return filteredSongs.slice(0, songDisplayCount);
  }, [filteredSongs, songDisplayCount]);

  const handleSongListScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 220) {
      setSongDisplayCount((prev) => Math.min(prev + 60, filteredSongs.length));
    }
  };

  const toggleSongFavorite = (song) => {
    setSongFavorites((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      const updated = exists ? prev.filter((s) => s.id !== song.id) : [...prev, song];
      try {
        localStorage.setItem('worship_cloud_song_favorites', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Curated Tamil Reading & Projection Fonts with Extra Bold options
  const tamilReadingFonts = [
    { id: 'Noto Sans Tamil', label: 'Noto Sans Tamil', desc: 'Default · Clean Sans', sample: 'அ ஆ இ' },
    { id: 'Baloo Thambi 2', label: 'Baloo Thambi 2', desc: 'Ultra Bold Display · தடித்த எழுத்து', sample: 'அ ஆ இ' },
    { id: 'Anek Tamil', label: 'Anek Tamil', desc: 'Extra Bold Modern · அடர்ந்த எழுத்து', sample: 'அ ஆ இ' },
    { id: 'Mukta Malar', label: 'Mukta Malar', desc: 'Bold Rounded', sample: 'அ ஆ இ' },
    { id: 'Catamaran', label: 'Catamaran', desc: 'Heavy Geometric', sample: 'அ ஆ இ' },
    { id: 'Noto Serif Tamil', label: 'Noto Serif Tamil', desc: 'Traditional Scripture', sample: 'அ ஆ இ' },
    { id: 'Arima Madurai', label: 'Arima Madurai', desc: 'Elegant Display', sample: 'அ ஆ இ' },
    { id: 'Kavivanar', label: 'Kavivanar', desc: 'Warm Calligraphic', sample: 'அ ஆ இ' },
    // Tamil Unicode Font (from X:\Fonts\Tamil Unicode Fonts)
    { id: 'TAMIL-UNI031', label: 'Tamil Unicode 31', desc: 'DTP Tamil Font', sample: 'அ ஆ இ' }
  ];

  // Presets for Background Color
  const bgPresets = [
    { hex: '#0c1322', label: 'Deep Midnight' },
    { hex: '#000000', label: 'Pure Black' },
    { hex: '#0f172a', label: 'Cathedral Slate' },
    { hex: '#1c1917', label: 'Warm Dark' },
    { hex: '#ffffff', label: 'Pure White' },
    { hex: '#e2d9cc', label: 'Warm Cream' }
  ];

  // Presets for Text Color
  const textPresets = [
    { hex: '#ffffff', label: 'Pure White' },
    { hex: '#fef7ee', label: 'Warm Ivory' },
    { hex: '#e5b965', label: 'Royal Gold' },
    { hex: '#38bdf8', label: 'Sky Blue' },
    { hex: '#000000', label: 'Pure Black' },
    { hex: '#1e293b', label: 'Dark Slate' }
  ];

  // Presets for Reference Color
  const refPresets = [
    { hex: '#e5b965', label: 'Royal Gold' },
    { hex: '#ffffff', label: 'Pure White' },
    { hex: '#38bdf8', label: 'Sky Blue' },
    { hex: '#f472b6', label: 'Rose Pink' },
    { hex: '#86efac', label: 'Soft Emerald' },
    { hex: '#cbd5e1', label: 'Muted Slate' }
  ];

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        padding: isMobile ? '0 0.4rem 0.4rem 0.4rem' : '0 0.5rem 0.4rem 0.5rem',
        boxSizing: 'border-box',
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        gridTemplateColumns: isMobile ? undefined : '290px 1fr 270px',
        gap: isMobile ? 0 : '0.65rem',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-canvas)',
        position: 'relative'
      }}
    >
      {/* Visual Drag and Drop Import Overlay */}
      {isDraggingOver && (
        <div style={{
          position: 'absolute',
          inset: '8px',
          zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.93)',
          backdropFilter: 'blur(8px)',
          border: '3px dashed var(--accent)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: '#ffffff',
          pointerEvents: 'none',
          boxShadow: '0 0 40px rgba(229, 185, 101, 0.4)'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}>
            <Upload size={32} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
            கோப்புகளை இங்கே விடவும் (Drop files here to import)
          </div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
            Supports Multiple Images, Multi-Page PDFs, PowerPoint Presentations (.pptx), Text Files
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportMedia} 
        accept="image/*,.txt,.pdf,.pptx,.ppt" 
        multiple
        style={{ display: 'none' }} 
      />
      <input
        type="file"
        ref={customTextureInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result;
            if (dataUrl) {
              if (leftTab === 'bible') {
                setBibleStyle(prev => ({ ...prev, customBgImage: dataUrl, selectedTextureId: 'custom', bgType: 'texture', textureSrc: dataUrl }));
              } else if (leftTab === 'songs') {
                setSongStyle(prev => ({ ...prev, customBgImage: dataUrl, selectedTextureId: 'custom', bgType: 'texture', textureSrc: dataUrl }));
              }
              updateActiveSlide({ customBgImage: dataUrl, selectedTextureId: 'custom', textureSrc: dataUrl, bgType: 'texture' });
            }
          };
          reader.readAsDataURL(file);
          if (e.target) e.target.value = '';
        }}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* ========================================================================= */}
      {/* COLUMN 1: LEFT SIDEBAR - 3-WAY TOGGLER: Media | Bible | Songs            */}
      {/* ========================================================================= */}
      <aside style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        flex: isMobile ? 1 : undefined,
        minHeight: 0
      }}>
        {/* Sleek Toggler: Media (Desktop only) | Bible | Songs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
          gap: '4px',
          padding: '4px',
          backgroundColor: 'var(--bg-canvas)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          margin: '0.5rem 0.5rem 0.35rem 0.5rem',
          flexShrink: 0
        }}>
          {!isMobile && (
            <button
              onClick={() => {
                setLeftTab('media');
                if (projector?.clearHighlights) projector.clearHighlights();
                const currentDoc = mediaDocs.find((d) => d.id === selectedMediaDocId) || mediaDocs[0];
                if (currentDoc) {
                  setActivePresentation(currentDoc);
                  setSelectedSlideId(currentDoc.slides[0]?.id || null);
                } else {
                  setActivePresentation({
                    title: 'மீடியா கோப்புகள் / Media',
                    badge: 'MEDIA',
                    kind: 'media',
                    slides: []
                  });
                  setSelectedSlideId(null);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '6px 0',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: leftTab === 'media' ? 'var(--accent)' : 'transparent',
                color: leftTab === 'media' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ImageIcon size={14} />
              <span>Media</span>
            </button>
          )}

          <button
            onClick={() => {
              setLeftTab('bible');
              const activeBibleHighlights = bibleHighlightsRef.current || bibleHighlights;
              if (activeBibleHighlights.length > 0) {
                if (projector?.setHighlights) {
                  projector.setHighlights(activeBibleHighlights);
                } else if (projector?.addHighlight) {
                  activeBibleHighlights.forEach((h) => projector.addHighlight(h.text, h.color));
                }
              }
              if (bibleBookData) {
                loadBibleChapterSlides(bibleBookCode, bibleChapterNum, bibleBookData);
              } else {
                setActivePresentation({
                  title: 'வேத வாசிப்பு / Bible',
                  badge: 'BIBLE',
                  kind: 'bible',
                  slides: []
                });
                setSelectedSlideId(null);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '6px 0',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: leftTab === 'bible' ? 'var(--accent)' : 'transparent',
              color: leftTab === 'bible' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <BookOpen size={14} />
            <span>Bible</span>
          </button>

          <button
            onClick={() => {
              setLeftTab('songs');
              if (projector?.clearHighlights) projector.clearHighlights();
              if (selectedSongMeta && songDetails) {
                loadSongSlides(selectedSongMeta, songDetails);
              } else {
                setActivePresentation({
                  title: 'பாடல் வரிகள் / Songs',
                  badge: 'SONG',
                  kind: 'song',
                  slides: []
                });
                setSelectedSlideId(null);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '6px 0',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: leftTab === 'songs' ? 'var(--accent)' : 'transparent',
              color: leftTab === 'songs' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Music size={14} />
            <span>Songs</span>
          </button>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* TAB 1: MEDIA SECTION (Import & project Images, PDFs, PPTX with Delete) */}
        {/* --------------------------------------------------------------------- */}
        {leftTab === 'media' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Action Bar: [+ Import media] */}
            <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <button
                disabled={isImportingMedia}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 0',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent-light)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  fontSize: '0.78rem',
                  fontWeight: 750,
                  cursor: isImportingMedia ? 'wait' : 'pointer',
                  opacity: isImportingMedia ? 0.7 : 1
                }}
              >
                {isImportingMedia ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                <span>{isImportingMedia ? 'Importing Media...' : 'Import Images, PDFs, PPTX'}</span>
              </button>

              {isImportingMedia && (
                <div style={{
                  marginTop: '6px',
                  padding: '5px 8px',
                  borderRadius: '5px',
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{importStatusText || 'Processing files...'}</span>
                </div>
              )}
            </div>

            {/* Media Documents List with Delete Button */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {mediaDocs.map((doc) => {
                  const isActive = doc.id === activePresentation.id || doc.id === selectedMediaDocId;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedMediaDocId(doc.id);
                        setActivePresentation(doc);
                        setSelectedSlideId(doc.slides[0]?.id || null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                        border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px',
                          backgroundColor: '#0c141d',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: isActive ? 'var(--accent)' : 'var(--text-tertiary)'
                        }}>
                          {doc.badge === 'IMAGE' ? <ImageIcon size={16} /> : <FileText size={16} />}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: '0.82rem',
                            fontWeight: isActive ? 800 : 650,
                            color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {doc.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {doc.subtitle}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMediaDoc(doc.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: 'var(--text-tertiary)',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete imported asset"
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}

                {mediaDocs.length === 0 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      marginTop: '1rem',
                      padding: '1.75rem 1rem',
                      border: '2px dashed var(--border-strong)',
                      borderRadius: '8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text-tertiary)',
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-strong)';
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                    }}
                  >
                    <Upload size={24} style={{ color: 'var(--accent)' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                      கோப்புகளை இங்கே இழுத்துப் போடவும்
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      Drag & drop images, PDFs, PPTX or click to browse
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB 2: BIBLE SECTION (Hybrid Book Search + Verse Jump + Chapter Grid) */}
        {/* --------------------------------------------------------------------- */}
        {leftTab === 'bible' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '0.5rem 0.75rem', position: 'relative' }}>
            {/* HYBRID BOOK SEARCH & DROPDOWN (44px Height) */}
            <div ref={bookDropdownRef} style={{ position: 'relative', width: '100%' }}>
              <div
                onClick={handleOpenBookSearch}
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
                  ref={bookSearchInputRef}
                  type="text"
                  placeholder={uiLang === 'ta' ? 'புத்தகம் (பெயர் அல்லது எண் 1-66)...' : 'Book name or serial (1-66)...'}
                  value={isBookDropdownOpen ? bookSearchQuery : currentBookMeta?.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenBookSearch();
                  }}
                  onChange={(e) => {
                    setBookSearchQuery(e.target.value);
                    if (!isBookDropdownOpen) setIsBookDropdownOpen(true);
                  }}
                  onKeyDown={handleBookSearchKeyDown}
                  onFocus={(e) => {
                    setIsBookDropdownOpen(true);
                    e.target.select();
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.88rem',
                    fontWeight: isBookDropdownOpen && bookSearchQuery ? 500 : 700,
                    color: 'var(--text-primary)',
                    width: '100%',
                    cursor: 'text'
                  }}
                />
                {isBookDropdownOpen && bookSearchQuery ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBookSearchQuery('');
                      bookSearchInputRef.current?.focus();
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-tertiary)' }}
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isBookDropdownOpen) {
                        setIsBookDropdownOpen(false);
                      } else {
                        handleOpenBookSearch();
                      }
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  >
                    <ChevronDown
                      size={16}
                      style={{
                        color: 'var(--text-tertiary)',
                        transform: isBookDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0
                      }}
                    />
                  </button>
                )}
              </div>

              {/* Hybrid Dropdown Menu */}
              {isBookDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  maxHeight: '320px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  zIndex: 150,
                  padding: '5px'
                }}>
                  {filteredBooks.map((b, idx) => {
                    const isCurrent = b.code === bibleBookCode;
                    const isHighlighted = idx === highlightedBookIndex;
                    const serialNum = booksMeta.indexOf(b) + 1;

                    return (
                      <button
                        key={b.code}
                        onClick={() => selectBookAndFocusJump(b.code)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          backgroundColor: isCurrent ? 'var(--accent-light)' : (isHighlighted ? 'var(--bg-surface-hover)' : 'transparent'),
                          color: isCurrent ? 'var(--accent)' : 'var(--text-primary)',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', minWidth: '18px' }}>
                            {serialNum}.
                          </span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{b.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{b.english}</div>
                          </div>
                        </div>
                        {isCurrent && <Check size={14} style={{ color: 'var(--accent)' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECOND INPUT BOX: JUMP TO CHAPTER & VERSE (44px Height) */}
            <div style={{
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0 12px',
              minHeight: '44px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Hash size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <input
                ref={jumpInputRef}
                type="text"
                placeholder={uiLang === 'ta' ? 'அதிகாரம்.வசனம் (1.15 அல்லது 1 15)' : 'Chapter.Verse (e.g: 1.15 or 1 15)'}
                value={jumpQuery}
                onChange={(e) => setJumpQuery(e.target.value)}
                onKeyDown={handleJumpKeyDown}
                onClick={(e) => e.target.select()}
                onFocus={(e) => e.target.select()}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.84rem',
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
                  title="Jump to chapter or verse"
                >
                  <span>Go</span>
                  <CornerDownLeft size={12} />
                </button>
              )}
            </div>

            {/* SUB-SECTION TOGGLE: CHAPTERS VS BOOKMARKS */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              marginTop: '0.65rem',
              marginBottom: '0.4rem',
              gap: '2px'
            }}>
              <button
                type="button"
                onClick={() => setBibleLeftSubTab('chapters')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 750,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: bibleLeftSubTab === 'chapters' ? 'var(--accent)' : 'transparent',
                  color: bibleLeftSubTab === 'chapters' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                  transition: 'all 0.12s ease'
                }}
              >
                <BookOpen size={12} />
                <span>{uiLang === 'ta' ? 'அதிகாரங்கள்' : 'Chapters'} ({currentBookMeta?.chapters || 1})</span>
              </button>

              <button
                type="button"
                onClick={() => setBibleLeftSubTab('bookmarks')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 750,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: bibleLeftSubTab === 'bookmarks' ? 'var(--accent)' : 'transparent',
                  color: bibleLeftSubTab === 'bookmarks' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                  transition: 'all 0.12s ease'
                }}
              >
                <Bookmark size={12} />
                <span>{uiLang === 'ta' ? 'புக்மார்க்' : 'Bookmarks'} ({bibleBookmarks.length})</span>
              </button>
            </div>

            {/* TAB CONTENT: CHAPTERS GRID */}
            {bibleLeftSubTab === 'chapters' ? (
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
                  gap: '5px',
                  alignContent: 'start',
                  paddingRight: '2px',
                  marginTop: '4px'
                }}>
                  {Array.from({ length: currentBookMeta?.chapters || 1 }, (_, i) => i + 1).map((ch) => {
                    const isCurrent = bibleChapterNum === ch;
                    return (
                      <button
                        key={ch}
                        onClick={() => setBibleChapterNum(ch)}
                        style={{
                          aspectRatio: '1 / 1',
                          borderRadius: '6px',
                          border: isCurrent ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                          backgroundColor: isCurrent ? 'var(--accent)' : 'var(--bg-canvas)',
                          color: isCurrent ? 'var(--accent-contrast)' : 'var(--text-primary)',
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transform: 'translateY(-0.5px)',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* TAB CONTENT: BOOKMARKS LIST */
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', paddingRight: '2px', marginTop: '4px' }}>
                {bibleBookmarks.length === 0 ? (
                  <div style={{
                    padding: '2rem 0.5rem',
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Bookmark size={24} style={{ opacity: 0.4 }} />
                    <div style={{ whiteSpace: 'pre-line' }}>
                      {uiLang === 'ta' 
                        ? 'புக்மார்க்குகள் இல்லை.\nமினி ஸ்லைடை வலது கிளிக் செய்து புக்மார்க் செய்யலாம்.' 
                        : 'No bookmarks yet.\nRight-click any slide to bookmark it.'}
                    </div>
                  </div>
                ) : (
                  bibleBookmarks.map((bm) => {
                    const isCurrentSlide = selectedSlideId === `bible-${bm.bookCode}-${bm.chapter}-${bm.verseNumber}`;
                    return (
                      <div
                        key={bm.id}
                        onClick={() => handleSelectBookmark(bm)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '7px',
                          backgroundColor: isCurrentSlide ? 'var(--accent-light)' : 'var(--bg-canvas)',
                          border: `1px solid ${isCurrentSlide ? 'var(--accent)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '6px',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                            <Bookmark size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--accent)' }}>
                              {bm.bookName} {bm.chapter}:{bm.verseNumber}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                              ({bm.englishBookName})
                            </span>
                          </div>
                          {bm.text && (
                            <div style={{
                              fontSize: '0.74rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {bm.text}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBibleBookmark(bm.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '3px',
                            color: 'var(--text-tertiary)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                          title={uiLang === 'ta' ? 'புக்மார்க்கை நீக்கு' : 'Delete bookmark'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* MOBILE ONLY: Verses list with tap to go live fullscreen */}
            {isMobile && (
              <div style={{ marginTop: '0.75rem', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  padding: '2px 0'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-tertiary)' }}>
                    VERSES ({activePresentation.slides.length})
                  </span>
                  {activePresentation.slides.length > 0 && (
                    <button
                      onClick={() => {
                        const firstSlide = activePresentation.slides[0];
                        handleSelectSlide(firstSlide);
                        handleGoLive(firstSlide);
                        setIsFullscreenMobilePresenter(true);
                      }}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {uiLang === 'ta' ? '▶ திரையிடு' : '▶ Present'}
                    </button>
                  )}
                </div>

                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {activePresentation.slides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      onClick={() => {
                        handleSelectSlide(slide);
                        handleGoLive(slide);
                        setIsFullscreenMobilePresenter(true);
                      }}
                      style={{
                        padding: '7px 9px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)' }}>
                        {currentBookMeta?.name} {bibleChapterNum}:{idx + 1}
                      </div>
                      <div style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {slide.body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB 3: SONGS SECTION (Search & project Hymns and Stanzas)              */}
        {/* --------------------------------------------------------------------- */}
        {leftTab === 'songs' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {isMobile && mobileSongViewMode === 'stanzas' && selectedSongMeta ? (
              // MOBILE STANZAS VIEW
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* Header with Back, Title, and Present Button */}
                <div style={{
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexShrink: 0
                }}>
                  <button
                    type="button"
                    onClick={() => setMobileSongViewMode('list')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronLeft size={15} />
                    <span>{uiLang === 'ta' ? 'பாடல்கள்' : 'Songs'}</span>
                  </button>

                  <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedSongMeta?.t || selectedSongMeta?.title}
                    </div>
                    {(selectedSongMeta?.ro || selectedSongMeta?.englishTitle) && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedSongMeta?.ro || selectedSongMeta?.englishTitle}
                      </div>
                    )}
                  </div>

                  {activePresentation.slides.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const firstSlide = activePresentation.slides[0];
                        handleSelectSlide(firstSlide);
                        handleGoLive(firstSlide);
                        setIsFullscreenMobilePresenter(true);
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {uiLang === 'ta' ? '▶ திரையிடு' : '▶ Present'}
                    </button>
                  )}
                </div>

                {/* Stanzas List */}
                {loadingSong ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-tertiary)', fontSize: '0.82rem', gap: '8px' }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                    <span>பாடல் வரிகள் ஏற்றப்படுகிறது...</span>
                  </div>
                ) : (
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', padding: '0.5rem' }}>
                    {activePresentation.slides.map((slide, idx) => (
                      <div
                        key={slide.id || idx}
                        onClick={() => {
                          handleSelectSlide(slide);
                          handleGoLive(slide);
                          setIsFullscreenMobilePresenter(true);
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-canvas)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)' }}>
                          {slide.title || `சரணம் ${idx + 1}`}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          lineHeight: 1.35,
                          whiteSpace: 'pre-line',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {slide.body || slide.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // SONGS SEARCH & LIST (Normal View)
              <>
                {/* Search Input & Favorite Filter */}
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
                      <button
                        onClick={() => setSongFilterTab('all')}
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: songFilterTab === 'all' ? 'var(--accent-light)' : 'transparent',
                          color: songFilterTab === 'all' ? 'var(--accent)' : 'var(--text-tertiary)',
                          fontWeight: 750,
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setSongFilterTab('fav')}
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: songFilterTab === 'fav' ? 'var(--accent-light)' : 'transparent',
                          color: songFilterTab === 'fav' ? 'var(--accent)' : 'var(--text-tertiary)',
                          fontWeight: 750,
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Fav ({songFavorites.length})
                      </button>
                      <button
                        onClick={() => setSongFilterTab('my')}
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: songFilterTab === 'my' ? 'var(--accent-light)' : 'transparent',
                          color: songFilterTab === 'my' ? 'var(--accent)' : 'var(--text-tertiary)',
                          fontWeight: 750,
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        My ({userSongs.length})
                      </button>
                    </div>
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
                        padding: '4px 7px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--accent)',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        flexShrink: 0
                      }}
                      title={t.addSong || 'Add Song'}
                    >
                      <Plus size={12} />
                      <span>{t.addSong || 'Add'}</span>
                    </button>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0 10px',
                    minHeight: '44px'
                  }}>
                    <Search size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Search song / பாடல் தேடுக..."
                      value={songQuery}
                      onChange={(e) => setSongQuery(e.target.value)}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '0.84rem',
                        color: 'var(--text-primary)',
                        width: '100%',
                        fontWeight: 650
                      }}
                    />
                    {songQuery && (
                      <button onClick={() => setSongQuery('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <X size={14} style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Songs List */}
                <div 
                  onScroll={handleSongListScroll}
                  style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.5rem' }}
                >
                  {/* Song count badge when searching */}
                  {songQuery.trim() && (
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', padding: '2px 6px 6px 6px' }}>
                      {filteredSongs.length} songs found
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {visibleSongs.map((s) => {
                      const isSelected = selectedSongMeta?.id === s.id;
                      const isFav = songFavorites.some((f) => f.id === s.id);

                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedSongMeta(s);
                            if (isMobile) setMobileSongViewMode('stanzas');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 8px',
                            borderRadius: '6px',
                            backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                            border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease',
                            gap: '6px'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{
                              fontSize: '0.82rem',
                              fontWeight: isSelected ? 800 : 650,
                              color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {s.t || s.title}
                            </div>
                            {(s.ro || s.englishTitle) && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.ro || s.englishTitle}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {s.custom && onDeleteSong && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(t.confirmDeleteSong || 'Are you sure you want to delete this song?')) {
                                    onDeleteSong(s.id);
                                    if (selectedSongMeta?.id === s.id) setSelectedSongMeta(null);
                                  }
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: '#ef4444'
                                }}
                                title={t.deleteSong || 'Delete'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSongFavorite(s);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                color: isFav ? 'var(--accent)' : 'var(--text-tertiary)'
                              }}
                              title={isFav ? 'Remove favorite' : 'Add favorite'}
                            >
                              <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {visibleSongs.length < filteredSongs.length && (
                      <div 
                        onClick={() => setSongDisplayCount(prev => Math.min(prev + 100, filteredSongs.length))}
                        style={{
                          padding: '8px',
                          textAlign: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 650,
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          backgroundColor: 'var(--accent-light)',
                          marginTop: '4px'
                        }}
                      >
                        Showing {visibleSongs.length} of {filteredSongs.length} (Load more...)
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* COLUMN 2: MIDDLE - "PRESENTATION EDITOR" (With 16:9 Mini Slides Grid)     */}
      {/* ========================================================================= */}
      {!isMobile && (
        <main style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          maxHeight: '100%',
          overflow: 'hidden',
          gap: '0.65rem'
        }}>
        {/* Middle Stage Row: Main Canvas Preview + Mini Slide Editor Stack */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: '0.75rem',
          alignItems: 'stretch',
          minHeight: 0,
          flex: '1 1 56%'
        }}>
            {/* Main Center Slide Canvas (16:9 Aspect Ratio) with Auto-fit scaling & Bible Selection Highlighter */}
            <div 
              ref={stageCanvasRef}
              onMouseUp={handleStageMouseUp}
              style={{
                backgroundColor: selectedSlide?.bgType === 'texture' ? '#0b111e' : (selectedSlide?.backgroundColor || '#0c1322'),
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 0,
                padding: '0',
                boxSizing: 'border-box',
                transition: 'background-color 0.2s ease, color 0.2s ease'
              }}
            >
              {/* Texture Background Layer & Darkness Scrim */}
              {selectedSlide?.bgType === 'texture' && selectedSlide?.textureSrc && (
                <>
                  <img
                    src={selectedSlide.textureSrc}
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 0,
                      pointerEvents: 'none'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: `rgba(0, 0, 0, ${selectedSlide.bgOverlayOpacity ?? 0.70})`,
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                  />
                </>
              )}

              {/* Floating Quick Highlight Button for Bible Text Selection */}
              {floatingHighlightPos && leftTab === 'bible' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddBibleHighlight(floatingHighlightPos.text);
                    setFloatingHighlightPos(null);
                    window.getSelection()?.removeAllRanges();
                  }}
                  style={{
                    position: 'absolute',
                    top: `${floatingHighlightPos.top}px`,
                    left: `${floatingHighlightPos.left}px`,
                    zIndex: 80,
                    backgroundColor: activeHighlightColor,
                    color: '#090d14',
                    border: '1px solid rgba(0,0,0,0.25)',
                    borderRadius: '20px',
                    padding: '3px 9px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    userSelect: 'none'
                  }}
                  title="Highlight selected text in live projector"
                >
                  <Highlighter size={12} />
                  <span>Highlight</span>
                </button>
              )}

              {selectedSlide ? (
                selectedSlide.type === 'new-year-counter' ? (
                  <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
                    <NewYearCounterView
                      targetDate={selectedSlide.targetDate}
                      celebrate={selectedSlide.celebrate}
                      customGreeting={selectedSlide.customGreeting || selectedSlide.title}
                      customVerse={selectedSlide.customVerse || selectedSlide.body}
                      bgType={selectedSlide.bgType || 'gradient'}
                      gradientBg={selectedSlide.gradientBg}
                      textureSrc={selectedSlide.textureSrc || './images/card-backgrounds/sunbeams-golden.jpg'}
                      bgOverlayOpacity={selectedSlide.bgOverlayOpacity ?? 0.70}
                      bgColor={selectedSlide.backgroundColor || '#090d16'}
                      isMini={true}
                      uiLang={uiLang}
                    />
                  </div>
                ) : selectedSlide.type === 'clock' ? (
                  <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
                    <ChurchClockView
                      serviceTitle={selectedSlide.serviceTitle || selectedSlide.title}
                      format24h={selectedSlide.format24h}
                      showSeconds={selectedSlide.showSeconds ?? true}
                      bgType={selectedSlide.bgType || 'gradient'}
                      gradientBg={selectedSlide.gradientBg}
                      textureSrc={selectedSlide.textureSrc || './images/card-backgrounds/clouds-golden.jpg'}
                      bgOverlayOpacity={selectedSlide.bgOverlayOpacity ?? 0.70}
                      bgColor={selectedSlide.backgroundColor || '#090d16'}
                      animatedBg={selectedSlide.animatedBg ?? true}
                      isMini={true}
                      uiLang={uiLang}
                    />
                  </div>
                ) : selectedSlide.mediaPath ? (
                  /* Media Image Slide (Photos, PDFs, PPTX slide images) */
                  <div style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selectedSlide.backgroundColor || '#000000',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={selectedSlide.mediaPath}
                      alt={selectedSlide.title || 'Media Slide'}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        userSelect: 'none'
                      }}
                    />
                    {selectedSlide.body && (
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: selectedSlide.textColor || '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        textAlign: selectedSlide.align || 'center',
                        lineHeight: 1.3
                      }}>
                        {selectedSlide.body}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textShadow: selectedSlide.bgType === 'texture' ? '0 2px 10px rgba(0,0,0,0.85)' : 'none'
                  }}>
                    <AutoFitSlideContent
                      text={selectedSlide.body || selectedSlide.title}
                      reference={selectedSlide.reference}
                      highlights={leftTab === 'bible' ? bibleHighlights : []}
                      fontFamily={selectedSlide.fontFamily || 'Noto Sans Tamil'}
                      textColor={selectedSlide.textColor || '#ffffff'}
                      referenceColor={selectedSlide.referenceColor || selectedSlide.accent || effectiveRefColor}
                      accentColor={selectedSlide.referenceColor || selectedSlide.accent || effectiveRefColor}
                      align={selectedSlide.align || 'center'}
                      preferredSize={selectedSlide.fontSize || 42}
                      referenceSize={selectedSlide.referenceSize || 24}
                      paddingX={10}
                      paddingY={10}
                      altLineColorEnabled={selectedSlide.altLineColorEnabled}
                      altLineColor={selectedSlide.altLineColor}
                    />
                  </div>
                )
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '2rem 1rem'
                }}>
                  {leftTab === 'songs' ? (
                    <>
                      <Music size={36} style={{ opacity: 0.35, color: 'var(--accent)' }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        பாடலைத் தேர்ந்தெடுக்கவும்
                      </div>
                      <small style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                        Select a song from the list on the left to preview stanzas
                      </small>
                    </>
                  ) : leftTab === 'media' ? (
                    <>
                      <ImageIcon size={36} style={{ opacity: 0.35, color: 'var(--accent)' }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        மீடியா ஸ்லைடு தேர்ந்தெடுக்கப்படவில்லை
                      </div>
                      <small style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                        Import or select an asset from the left
                      </small>
                    </>
                  ) : (
                    <>
                      <BookOpen size={36} style={{ opacity: 0.35, color: 'var(--accent)' }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        வசனம் தேர்ந்தெடுக்கப்படவில்லை
                      </div>
                      <small style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                        Select a book and chapter from the left
                      </small>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Slide Controls Stack: Dedicated Bible Controls & Media Controls */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
              minHeight: 0,
              overflowY: 'auto'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
                  {leftTab === 'bible' ? 'BIBLE LIVE CONTROLS' : (leftTab === 'songs' ? 'SONG LIVE CONTROLS' : 'SLIDE FORMATTING')}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', backgroundColor: 'var(--accent-light)', padding: '1px 5px', borderRadius: '3px' }}>
                  16:9
                </span>
              </div>

              {/* Live Editable Text Area (ONLY kept for Media mode, REMOVED for Bible & Songs modes) */}
              {leftTab === 'media' && (
                <textarea
                  value={selectedSlide?.body || ''}
                  onChange={(e) => updateActiveSlide({ body: e.target.value })}
                  placeholder="உங்கள் செய்தியை இங்கே எழுதுங்கள்..."
                  rows={3}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                    fontFamily: 'Noto Sans Tamil, sans-serif',
                    lineHeight: 1.4,
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              )}

              {/* Font Size Slider Row (Directly scales live projection!) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 650, minWidth: '46px' }}>Text Size</span>
                <input
                  type="range"
                  min="24"
                  max="90"
                  value={effectiveFontSize}
                  onChange={(e) => updateActiveSlide({ fontSize: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent)', minWidth: '22px', textAlign: 'right' }}>
                  {effectiveFontSize}
                </span>
              </div>

              {/* Reference Size Slider Row (Controls verse reference citation size) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 650, minWidth: '46px' }}>Ref Size</span>
                <input
                  type="range"
                  min="14"
                  max="48"
                  value={effectiveRefSize}
                  onChange={(e) => updateActiveSlide({ referenceSize: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent)', minWidth: '22px', textAlign: 'right' }}>
                  {effectiveRefSize}
                </span>
              </div>

              {/* Custom Styled Font Dropdown (Improved typography, sample glyphs & animated chevron) */}
              <div ref={fontDropdownRef} style={{ position: 'relative', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setIsFontDropdownOpen((prev) => !prev)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: `1px solid ${isFontDropdownOpen ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    boxShadow: isFontDropdownOpen ? '0 0 0 2px var(--accent-light)' : 'var(--shadow-sm)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Choose reading typography"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <Type size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{
                      fontFamily: effectiveFontFamily,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {tamilReadingFonts.find((f) => f.id === effectiveFontFamily)?.label || 'Noto Sans Tamil'}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--text-tertiary)',
                      transform: isFontDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0
                    }}
                  />
                </button>

                {isFontDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    zIndex: 120,
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}>
                    {tamilReadingFonts.map((font) => {
                      const isSelected = effectiveFontFamily === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => {
                            updateActiveSlide({ fontFamily: font.id });
                            setIsFontDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 0.12s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{
                              fontSize: '0.66rem',
                              fontWeight: 750,
                              padding: '2px 5px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)',
                              fontFamily: font.id
                            }}>
                              {font.sample}
                            </span>
                            <div>
                              <div style={{ fontFamily: font.id, fontSize: '0.8rem', fontWeight: 650 }}>
                                {font.label}
                              </div>
                              <div style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                                {font.desc}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Text Alignment Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 650, flex: 1 }}>
                  Alignment
                </span>
                {[
                  { id: 'left', icon: <AlignLeft size={14} />, title: 'Align left' },
                  { id: 'center', icon: <AlignCenter size={14} />, title: 'Align center' },
                  { id: 'right', icon: <AlignRight size={14} />, title: 'Align right' }
                ].map((al) => (
                  <button
                    key={al.id}
                    onClick={() => updateActiveSlide({ align: al.id })}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: effectiveAlign === al.id ? 'var(--accent-light)' : 'var(--bg-canvas)',
                      color: effectiveAlign === al.id ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                    title={al.title}
                  >
                    {al.icon}
                  </button>
                ))}
              </div>

              {/* Background Options: Solid Color vs Texture Image with Darkness Scrim */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                    Background
                  </span>

                  {/* Mode Toggler: Solid vs Texture */}
                  <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-canvas)', padding: '2px', borderRadius: '5px', border: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (leftTab === 'bible') {
                          setBibleStyle(prev => ({ ...prev, bgType: 'solid' }));
                        } else if (leftTab === 'songs') {
                          setSongStyle(prev => ({ ...prev, bgType: 'solid' }));
                        }
                        updateActiveSlide({ bgType: 'solid' });
                      }}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '3px',
                        border: 'none',
                        backgroundColor: effectiveBgType === 'solid' ? 'var(--accent)' : 'transparent',
                        color: effectiveBgType === 'solid' ? 'var(--accent-contrast)' : 'var(--text-tertiary)',
                        fontSize: '0.62rem',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                      title="Solid color background"
                    >
                      Solid
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (leftTab === 'bible') {
                          setBibleStyle(prev => ({ ...prev, bgType: 'texture' }));
                        } else if (leftTab === 'songs') {
                          setSongStyle(prev => ({ ...prev, bgType: 'texture' }));
                        }
                        updateActiveSlide({ bgType: 'texture', textureSrc: effectiveTextureSrc });
                      }}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '3px',
                        border: 'none',
                        backgroundColor: effectiveBgType === 'texture' ? 'var(--accent)' : 'transparent',
                        color: effectiveBgType === 'texture' ? 'var(--accent-contrast)' : 'var(--text-tertiary)',
                        fontSize: '0.62rem',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                      title="Texture image background"
                    >
                      Texture
                    </button>
                  </div>
                </div>

                {effectiveBgType === 'solid' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Color Presets</span>
                      {/* Native HTML5 Color Picker */}
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--accent)', fontWeight: 700 }}>Custom</span>
                        <input
                          type="color"
                          value={effectiveBg}
                          onChange={(e) => updateActiveSlide({ backgroundColor: e.target.value, bgType: 'solid' })}
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                        />
                        <span style={{
                          width: '13px',
                          height: '13px',
                          borderRadius: '50%',
                          backgroundColor: effectiveBg,
                          border: '1px solid var(--border-subtle)',
                          display: 'inline-block'
                        }} />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                      {bgPresets.map((swatch) => (
                        <button
                          key={swatch.hex}
                          onClick={() => updateActiveSlide({ backgroundColor: swatch.hex, bgType: 'solid' })}
                          style={{
                            height: '22px',
                            borderRadius: '4px',
                            backgroundColor: swatch.hex,
                            border: `2px solid ${effectiveBg === swatch.hex ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                          title={swatch.label}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Texture selection grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                      {SLIDE_TEXTURES.map((tex) => {
                        const isSelected = effectiveSelectedTextureId === tex.id && !(leftTab === 'bible' ? bibleStyle.customBgImage && effectiveSelectedTextureId === 'custom' : songStyle.customBgImage && effectiveSelectedTextureId === 'custom');
                        return (
                          <button
                            key={tex.id}
                            type="button"
                            onClick={() => {
                              if (leftTab === 'bible') {
                                setBibleStyle(prev => ({ ...prev, selectedTextureId: tex.id, textureSrc: tex.src, bgType: 'texture' }));
                              } else if (leftTab === 'songs') {
                                setSongStyle(prev => ({ ...prev, selectedTextureId: tex.id, textureSrc: tex.src, bgType: 'texture' }));
                              }
                              updateActiveSlide({ selectedTextureId: tex.id, textureSrc: tex.src, bgType: 'texture' });
                            }}
                            style={{
                              position: 'relative',
                              height: '32px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                              padding: 0,
                              cursor: 'pointer',
                              backgroundColor: '#0c1322'
                            }}
                            title={tex.label}
                          >
                            <img src={tex.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {isSelected && (
                              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={12} style={{ color: '#fff', strokeWidth: 3 }} />
                              </div>
                            )}
                          </button>
                        );
                      })}

                      {/* Custom Upload Button */}
                      <button
                        type="button"
                        onClick={() => customTextureInputRef.current?.click()}
                        style={{
                          position: 'relative',
                          height: '32px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: effectiveSelectedTextureId === 'custom' ? '2px solid var(--accent)' : '1px dashed var(--border-strong)',
                          padding: 0,
                          cursor: 'pointer',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent)'
                        }}
                        title="Upload custom background image"
                      >
                        <Upload size={12} />
                        <span style={{ fontSize: '0.52rem', fontWeight: 750 }}>Custom</span>
                      </button>
                    </div>

                    {/* Darkness Scrim Overlay Slider (Default 70%) */}
                    <div style={{ backgroundColor: 'var(--bg-canvas)', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Darkness Scrim
                        </span>
                        <span style={{ fontSize: '0.64rem', fontWeight: 850, color: 'var(--accent)' }}>
                          {Math.round(effectiveBgOverlayOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={effectiveBgOverlayOpacity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (leftTab === 'bible') {
                            setBibleStyle(prev => ({ ...prev, bgOverlayOpacity: val }));
                          } else if (leftTab === 'songs') {
                            setSongStyle(prev => ({ ...prev, bgOverlayOpacity: val }));
                          }
                          updateActiveSlide({ bgOverlayOpacity: val });
                        }}
                        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', margin: '2px 0 0 0' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Text Color Picker & Auto Contrast Option */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: effectiveAutoContrast ? '0' : '4px' }}>
                  {/* Left: Text Color Label + Auto Contrast Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                      Text Color
                    </span>
                    <button
                      onClick={handleToggleAutoContrast}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: effectiveAutoContrast ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                        backgroundColor: effectiveAutoContrast ? 'var(--accent-light)' : 'var(--bg-canvas)',
                        color: effectiveAutoContrast ? 'var(--accent)' : 'var(--text-tertiary)',
                        fontSize: '0.65rem',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                      title="Auto Contrast sets text color automatically based on background brightness"
                    >
                      <Sparkles size={11} />
                      <span>Auto: {effectiveAutoContrast ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* Right: Custom Color Selector (Only visible if Auto Contrast is OFF) */}
                  {!effectiveAutoContrast && (
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700 }}>Custom</span>
                      <input
                        type="color"
                        value={effectiveTextColor}
                        onChange={(e) => updateActiveSlide({ textColor: e.target.value })}
                        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                      />
                      <span style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: effectiveTextColor,
                        border: '1px solid var(--border-subtle)',
                        display: 'inline-block'
                      }} />
                    </label>
                  )}
                </div>

                {/* Text Color Swatches (Only visible if Auto Contrast is OFF) */}
                {!effectiveAutoContrast && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '4px',
                    transition: 'opacity 0.2s ease'
                  }}>
                    {textPresets.map((swatch) => (
                      <button
                        key={swatch.hex}
                        onClick={() => updateActiveSlide({ textColor: swatch.hex })}
                        style={{
                          height: '22px',
                          borderRadius: '4px',
                          backgroundColor: swatch.hex,
                          border: `2px solid ${effectiveTextColor === swatch.hex ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Reference Text Color Controller (Citation text color) */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                    Reference Color
                  </span>

                  {/* Custom Reference Color Picker */}
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700 }}>Custom</span>
                    <input
                      type="color"
                      value={effectiveRefColor}
                      onChange={(e) => updateActiveSlide({ referenceColor: e.target.value, accent: e.target.value })}
                      style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                    />
                    <span style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: effectiveRefColor,
                      border: '1px solid var(--border-subtle)',
                      display: 'inline-block'
                    }} />
                  </label>
                </div>

                {/* Reference Color Swatches */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                  {refPresets.map((swatch) => (
                    <button
                      key={swatch.hex}
                      onClick={() => updateActiveSlide({ referenceColor: swatch.hex, accent: swatch.hex })}
                      style={{
                        height: '22px',
                        borderRadius: '4px',
                        backgroundColor: swatch.hex,
                        border: `2px solid ${effectiveRefColor === swatch.hex ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                      title={swatch.label}
                    />
                  ))}
                </div>
              </div>

              {/* Alternate Line Color Section (STRICTLY ONLY for Songs in live/projector!) */}
              {leftTab === 'songs' && (
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                        Alternate Line Color
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !songStyle.altLineColorEnabled;
                        setSongStyle(prev => ({ ...prev, altLineColorEnabled: next }));
                        updateActiveSlide({ altLineColorEnabled: next, altLineColor: songStyle.altLineColor });
                      }}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: songStyle.altLineColorEnabled ? 'var(--accent)' : 'transparent',
                        color: songStyle.altLineColorEnabled ? '#fff' : 'var(--text-tertiary)',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {songStyle.altLineColorEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {songStyle.altLineColorEnabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {/* Custom color picker */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            type="color"
                            value={songStyle.altLineColor || '#38bdf8'}
                            onChange={(e) => {
                              setSongStyle(prev => ({ ...prev, altLineColor: e.target.value }));
                              updateActiveSlide({ altLineColor: e.target.value, altLineColorEnabled: true });
                            }}
                            style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                          />
                          <span style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: songStyle.altLineColor || '#38bdf8',
                            border: '1px solid var(--border-subtle)',
                            display: 'inline-block'
                          }} />
                          <span style={{ fontSize: '0.62rem', fontWeight: 650, color: 'var(--text-tertiary)' }}>
                            Even line color
                          </span>
                        </label>
                      </div>

                      {/* Preset color swatches */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                        {[
                          { hex: '#38bdf8', label: 'Sky Blue' },
                          { hex: '#fbbf24', label: 'Amber' },
                          { hex: '#a78bfa', label: 'Violet' },
                          { hex: '#34d399', label: 'Emerald' },
                          { hex: '#fb923c', label: 'Orange' },
                          { hex: '#f472b6', label: 'Pink' },
                          { hex: '#60a5fa', label: 'Blue' },
                          { hex: '#facc15', label: 'Yellow' },
                          { hex: '#c084fc', label: 'Purple' },
                          { hex: '#4ade80', label: 'Green' },
                          { hex: '#e2e8f0', label: 'Light Gray' },
                          { hex: '#94a3b8', label: 'Slate' }
                        ].map((swatch) => (
                          <button
                            key={swatch.hex}
                            onClick={() => {
                              setSongStyle(prev => ({ ...prev, altLineColor: swatch.hex }));
                              updateActiveSlide({ altLineColor: swatch.hex, altLineColorEnabled: true });
                            }}
                            style={{
                              height: '22px',
                              borderRadius: '4px',
                              backgroundColor: swatch.hex,
                              border: `2px solid ${(songStyle.altLineColor || '#38bdf8') === swatch.hex ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
                              cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                            title={swatch.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Word Highlighter Section (STRICTLY ONLY for Bible in live/projector!) */}
              {leftTab === 'bible' && (
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Highlighter size={12} style={{ color: activeHighlightColor }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                        Live Highlighter
                      </span>
                    </div>

                    {bibleHighlights.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearBibleHighlights}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 4px'
                        }}
                        title="Clear all active highlights"
                      >
                        <Eraser size={11} />
                        <span>Clear ({bibleHighlights.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Highlighter Color Palette & Word Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* 5 Preset Highlighter Colors */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {[
                        { color: '#f6d365', label: 'Gold' },
                        { color: '#86efac', label: 'Neon Green' },
                        { color: '#7dd3fc', label: 'Sky Blue' },
                        { color: '#f472b6', label: 'Rose Pink' },
                        { color: '#fdba74', label: 'Orange' }
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => setActiveHighlightColor(item.color)}
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            border: activeHighlightColor === item.color ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.25)',
                            cursor: 'pointer',
                            transform: activeHighlightColor === item.color ? 'scale(1.18)' : 'scale(1)',
                            transition: 'transform 0.12s ease',
                            boxShadow: activeHighlightColor === item.color ? `0 0 6px ${item.color}` : 'none'
                          }}
                          title={item.label}
                        />
                      ))}
                    </div>

                    {/* Word Input & Quick Add */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                      <input
                        type="text"
                        value={highlightInput}
                        onChange={(e) => setHighlightInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && highlightInput.trim()) {
                            e.preventDefault();
                            handleAddBibleHighlight(highlightInput);
                            setHighlightInput('');
                          }
                        }}
                        placeholder="Type word or select on slide..."
                        style={{
                          flex: 1,
                          backgroundColor: 'var(--bg-canvas)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          fontSize: '0.68rem',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          minWidth: 0
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (highlightInput.trim()) {
                            handleAddBibleHighlight(highlightInput);
                            setHighlightInput('');
                          }
                        }}
                        disabled={!highlightInput.trim()}
                        style={{
                          backgroundColor: highlightInput.trim() ? activeHighlightColor : 'var(--bg-canvas)',
                          color: '#090d14',
                          border: highlightInput.trim() ? 'none' : '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          padding: '3px 7px',
                          fontSize: '0.65rem',
                          fontWeight: 750,
                          cursor: highlightInput.trim() ? 'pointer' : 'default',
                          opacity: highlightInput.trim() ? 1 : 0.45,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          flexShrink: 0
                        }}
                      >
                        <Highlighter size={11} />
                        <span>Highlight</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Highlights Badges */}
                  {bibleHighlights.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      maxHeight: '48px',
                      overflowY: 'auto',
                      paddingTop: '2px'
                    }}>
                      {bibleHighlights.map((h, i) => (
                        <span
                          key={i}
                          style={{
                            backgroundColor: h.color,
                            color: '#090d14',
                            borderRadius: '4px',
                            padding: '1px 5px',
                            fontSize: '0.64rem',
                            fontWeight: 750,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                        >
                          <span>{h.text}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBibleHighlight(h.text)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#090d14',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Remove highlight"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        {/* ========================================================================= */}
        {/* BOTTOM: 16:9 MINI SLIDES GRID (Vertically Scrollable, Hover Animated)   */}
        {/* ========================================================================= */}
        <section style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 46%',
          minHeight: 0,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Filmstrip Header */}
          <div style={{
            padding: '0.5rem 0.9rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
                SLIDES ({activePresentation?.slides?.length || 0})
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                Double click goes live · Click to edit
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {leftTab === 'media' && (
                <button
                  onClick={handleClearAllSlides}
                  disabled={!activePresentation?.slides?.length}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.72rem',
                    fontWeight: 650,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <Trash2 size={12} />
                  <span>Clear all</span>
                </button>
              )}

              {leftTab === 'media' && (
                <button
                  onClick={handleAddSlide}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '0.72rem',
                    fontWeight: 750,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <Plus size={13} />
                  <span>Add slide</span>
                </button>
              )}
            </div>
          </div>

          {/* VERTICALLY SCROLLABLE 16:9 MINI SLIDES GRID WITH HOVER ANIMATION */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0.75rem',
            display: 'grid',
            gridTemplateColumns: activePresentation?.slides?.length ? 'repeat(auto-fill, minmax(165px, 1fr))' : '1fr',
            gap: '0.65rem',
            alignContent: 'start'
          }}>
            {activePresentation?.slides?.length > 0 ? (
              activePresentation.slides.map((slide, index) => {
                const isSelected = slide.id === selectedSlide?.id;
                const isLive = projector.activeSlide?.id === slide.id;

                return (
                  <div
                    key={slide.id}
                    id={`slide-card-${slide.id}`}
                    onClick={() => handleSelectSlide(slide)}
                    onDoubleClick={() => handleGoLive(slide)}
                    onContextMenu={(e) => handleSlideContextMenu(e, slide)}
                    style={{
                      aspectRatio: '16 / 9',
                      backgroundColor: slide.bgType === 'texture' ? '#0b111e' : (slide.backgroundColor || '#0c1322'),
                      borderRadius: '6px',
                      border: isLive 
                        ? '2px solid var(--accent)' 
                        : (isSelected ? '2px solid var(--accent)' : '1px solid var(--border-subtle)'),
                      boxShadow: isSelected 
                        ? '0 0 0 2px var(--accent-light)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.25)',
                      padding: slide.mediaPath ? '0' : '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.18s ease, border-color 0.15s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      contain: 'content',
                      isolation: 'isolate'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = isSelected ? '0 0 0 2px var(--accent-light)' : '0 2px 8px rgba(0, 0, 0, 0.25)';
                    }}
                  >
                    {/* Media Image Slide Thumbnail */}
                    {slide.mediaPath ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                        <img
                          src={slide.mediaPath}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 850,
                          color: '#fff',
                          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                          zIndex: 2
                        }}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        {isLive && (
                          <span style={{
                            position: 'absolute',
                            top: '4px',
                            right: '6px',
                            fontSize: '0.55rem',
                            fontWeight: 900,
                            color: 'var(--accent)',
                            backgroundColor: 'rgba(0,0,0,0.75)',
                            border: '1px solid var(--accent)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            zIndex: 2
                          }}>
                            LIVE
                          </span>
                        )}
                        {slide.title && (
                          <div style={{
                            position: 'absolute',
                            bottom: '3px',
                            left: '4px',
                            right: '4px',
                            fontSize: '0.58rem',
                            fontWeight: 650,
                            color: '#fff',
                            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            zIndex: 2
                          }}>
                            {slide.title}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Texture Background Layer & Darkness Scrim */}
                        {slide.bgType === 'texture' && slide.textureSrc && (
                          <>
                            <img
                              src={slide.textureSrc}
                              alt=""
                              style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                zIndex: 0,
                                pointerEvents: 'none'
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: `rgba(0, 0, 0, ${slide.bgOverlayOpacity ?? 0.70})`,
                                zIndex: 1,
                                pointerEvents: 'none'
                              }}
                            />
                          </>
                        )}

                        {/* Top Bar: Slide Index & Live Badge & Bookmark Indicator */}
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ 
                            fontSize: '0.82rem', 
                            fontWeight: 850, 
                            color: isSelected ? 'var(--accent)' : '#94a3b8',
                            letterSpacing: '0.02em',
                            textShadow: slide.bgType === 'texture' ? '0 1px 3px rgba(0,0,0,0.9)' : 'none'
                          }}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isSlideBookmarked(slide) && (
                              <span title={uiLang === 'ta' ? 'புக்மார்க் செய்யப்பட்டது' : 'Bookmarked'} style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                                <Bookmark size={13} fill="var(--accent)" />
                              </span>
                            )}
                            {isLive && (
                              <span style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--accent)', backgroundColor: 'var(--accent-light)', padding: '1px 4px', borderRadius: '3px' }}>
                                LIVE
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: Content Preview */}
                        <div style={{
                          position: 'relative',
                          zIndex: 2,
                          fontSize: '0.72rem',
                          lineHeight: 1.35,
                          maxHeight: '44px',
                          color: slide.textColor || '#ffffff',
                          fontFamily: slide.fontFamily || 'Noto Sans Tamil',
                          textAlign: slide.align || 'center',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontWeight: 650,
                          pointerEvents: 'none',
                          wordBreak: 'break-word',
                          flex: 1,
                          minHeight: 0,
                          textShadow: slide.bgType === 'texture' ? '0 1px 4px rgba(0,0,0,0.95)' : 'none'
                        }}>
                          {slide.body || slide.title}
                        </div>

                        {/* Bottom: Citation Tag */}
                        <div style={{
                          position: 'relative',
                          zIndex: 2,
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: slide.accent || 'var(--accent)',
                          textAlign: 'right',
                          opacity: 0.85,
                          textShadow: slide.bgType === 'texture' ? '0 1px 3px rgba(0,0,0,0.9)' : 'none'
                        }}>
                          {slide.reference && !/^slide\s*\d+$/i.test(slide.reference.trim()) ? slide.reference : ''}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                gap: '8px'
              }}>
                {leftTab === 'songs' ? (
                  <>
                    <Music size={32} style={{ opacity: 0.35, color: 'var(--accent)' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                      பாடலைத் தேர்ந்தெடுக்கவும் (Select a Song)
                    </div>
                    <div style={{ fontSize: '0.74rem', maxWidth: '320px', lineHeight: 1.4 }}>
                      இடது பக்கத்தில் உள்ள பட்டியலிலிருந்து ஒரு பாடலைத் தேர்வு செய்தால் அதன் சரணங்கள் இங்கே 16:9 ஸ்லைடுகளாகத் தோன்றும்.
                    </div>
                  </>
                ) : leftTab === 'media' ? (
                  <>
                    <ImageIcon size={32} style={{ opacity: 0.35, color: 'var(--accent)' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                      மீடியா கோப்புகளைச் சேர்க்கவும் (Import Media)
                    </div>
                    <div style={{ fontSize: '0.74rem', maxWidth: '320px', lineHeight: 1.4 }}>
                      இடது பக்கத்தில் உள்ள பட்டனைப் பயன்படுத்தி படங்கள் அல்லது PDF/PPTX கோப்புகளை இறக்குமதி செய்யவும்.
                    </div>
                  </>
                ) : (
                  <>
                    <BookOpen size={32} style={{ opacity: 0.35, color: 'var(--accent)' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                      வேத பகுதியைத் தேர்ந்தெடுக்கவும் (Select Chapter)
                    </div>
                    <div style={{ fontSize: '0.74rem', maxWidth: '320px', lineHeight: 1.4 }}>
                      அத்தியாயத்தைத் தேர்ந்தெடுத்தவுடன் வசனங்கள் இங்கே தோன்றும்.
                    </div>
                  </>
                )}
              </div>
            )}

            {/* "+ Add Slide" 16:9 Card (Only in Media tab) */}
            {leftTab === 'media' && (
              <button
                onClick={handleAddSlide}
                style={{
                  aspectRatio: '16 / 9',
                  backgroundColor: 'transparent',
                  border: '1.5px dashed var(--border-subtle)',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
              >
                <Plus size={18} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Add slide</span>
              </button>
            )}
          </div>
        </section>
      </main>
      )}

      {/* ========================================================================= */}
      {/* COLUMN 3: RIGHT SIDEBAR - "Active Output" (Reduced 30% Preview Screen)   */}
      {/* ========================================================================= */}
      {!isMobile && (
        <aside style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        gap: '0.65rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Output Header with Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.45rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Monitor size={15} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              ACTIVE OUTPUT
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: projector.isBlackout ? 'rgba(0,0,0,0.3)' : (projector.activeSlide ? 'var(--accent-light)' : 'rgba(234,179,8,0.15)'),
            color: projector.isBlackout ? '#94a3b8' : (projector.activeSlide ? 'var(--accent)' : '#eab308')
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: projector.isBlackout ? '#64748b' : (projector.activeSlide ? 'var(--accent)' : '#eab308')
            }} />
            <span>{projector.isBlackout ? 'BLACKOUT' : (projector.activeSlide ? 'LIVE' : 'STANDBY')}</span>
          </div>
        </div>

        {/* LIVE OUTPUT PREVIEW SCREEN (Reduced by 30% as requested) */}
        <div style={{
          aspectRatio: '16 / 9',
          maxHeight: '190px',
          margin: '0 auto',
          width: '100%',
          backgroundColor: projector.isBlackout ? '#000000' : (projector.activeSlide?.bgType === 'texture' ? '#0b111e' : (projector.activeSlide?.backgroundColor || '#0c1322')),
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.35rem',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          transition: 'background-color 0.2s ease, color 0.2s ease'
        }}>
          {/* Texture Background Layer & Darkness Scrim */}
          {!projector.isBlackout && projector.activeSlide?.bgType === 'texture' && projector.activeSlide?.textureSrc && (
            <>
              <img
                src={projector.activeSlide.textureSrc}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: `rgba(0, 0, 0, ${projector.activeSlide.bgOverlayOpacity ?? 0.70})`,
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              />
            </>
          )}

          {projector.isBlackout ? (
            <div style={{ position: 'relative', zIndex: 2, color: '#475569', fontSize: '0.7rem', fontWeight: 800 }}>
              BLACKOUT ACTIVE
            </div>
          ) : projector.activeSlide ? (
            projector.activeSlide.mediaPath ? (
              /* Media Image Preview */
              <div style={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={projector.activeSlide.mediaPath}
                  alt=""
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            ) : (
              <div style={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textShadow: projector.activeSlide?.bgType === 'texture' ? '0 1px 4px rgba(0,0,0,0.95)' : 'none'
              }}>
                <AutoFitSlideContent
                  text={projector.activeSlide.text || projector.activeSlide.body || projector.activeSlide.title}
                  reference={projector.activeSlide.reference}
                  highlights={projector.activeSlide?.kind === 'bible' || projector.activeSlide?.id?.startsWith('bible-') || leftTab === 'bible' ? (projector.highlights?.length ? projector.highlights : bibleHighlights) : []}
                  fontFamily={projector.activeSlide.fontFamily || 'Noto Sans Tamil'}
                  textColor={projector.activeSlide.textColor || '#ffffff'}
                  referenceColor={projector.activeSlide.referenceColor || projector.activeSlide.accent || effectiveRefColor}
                  accentColor={projector.activeSlide.referenceColor || projector.activeSlide.accent || effectiveRefColor}
                  align={projector.activeSlide.align || 'center'}
                  referenceSize={Math.max(8, Math.round((projector.activeSlide.referenceSize || 24) * 0.45))}
                  paddingX={8}
                  paddingY={6}
                  minFontSize={8}
                  maxFontSize={18}
                  altLineColorEnabled={projector.activeSlide.altLineColorEnabled}
                  altLineColor={projector.activeSlide.altLineColor}
                />
              </div>
            )
          ) : (
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#64748b', fontSize: '0.7rem' }}>
              <Tv size={20} style={{ opacity: 0.35, marginBottom: '3px' }} />
              <div>தயார் நிலையில் உள்ளது</div>
            </div>
          )}
        </div>

        {/* 3-Action Quick Grid: Quick live, Black, Freeze (Image button removed) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '5px'
        }}>
          {/* Quick button */}
          <button
            onClick={() => setQuickLive((v) => !v)}
            style={{
              padding: '8px 4px',
              borderRadius: '6px',
              border: quickLive ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
              backgroundColor: quickLive ? 'var(--accent-light)' : 'var(--bg-canvas)',
              color: quickLive ? 'var(--accent)' : 'var(--text-primary)',
              fontSize: '0.72rem',
              fontWeight: 750,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Radio size={13} />
            <span>Quick</span>
          </button>

          {/* Blackout button */}
          <button
            onClick={projector.toggleBlackout}
            style={{
              padding: '8px 4px',
              borderRadius: '6px',
              border: projector.isBlackout ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
              backgroundColor: projector.isBlackout ? 'rgba(239,68,68,0.18)' : 'var(--bg-canvas)',
              color: projector.isBlackout ? '#ef4444' : 'var(--text-primary)',
              fontSize: '0.72rem',
              fontWeight: 750,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <EyeOff size={13} />
            <span>Black</span>
          </button>

          {/* Freeze button */}
          <button
            onClick={() => setFrozen((v) => !v)}
            style={{
              padding: '8px 4px',
              borderRadius: '6px',
              border: frozen ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
              backgroundColor: frozen ? 'rgba(56,189,248,0.18)' : 'var(--bg-canvas)',
              color: frozen ? '#38bdf8' : 'var(--text-primary)',
              fontSize: '0.72rem',
              fontWeight: 750,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>❄️</span>
            <span>Freeze</span>
          </button>
        </div>

        {/* Bottom Actions: [Open output] & [Close output] */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={projector.openProjectorWindow}
            style={{
              padding: '10px',
              borderRadius: '6px',
              backgroundColor: '#e5b965',
              color: '#1a1306',
              fontWeight: 800,
              fontSize: '0.84rem',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(229,185,101,0.25)',
              transition: 'all 0.15s ease'
            }}
            title="Open projector output in dedicated window for 2nd monitor"
          >
            <ExternalLink size={15} />
            <span>Open output</span>
          </button>

          {projector.closeProjectorWindow && (
            <button
              type="button"
              onClick={projector.closeProjectorWindow}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                fontWeight: 750,
                fontSize: '0.78rem',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={t.closeProjectorWindow || 'Close 2nd Screen Window'}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.22)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'; }}
            >
              <MonitorOff size={14} />
              <span>{t.closeProjectorWindow || 'Close 2nd Screen'}</span>
            </button>
          )}
        </div>
      </aside>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN MOBILE PRESENTER OVERLAY                                      */}
      {/* ========================================================================= */}
      {isMobile && isFullscreenMobilePresenter && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: selectedSlide?.bgType === 'texture' ? '#0b111e' : (selectedSlide?.backgroundColor || '#0c1322'),
            color: selectedSlide?.textColor || '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none'
          }}
        >
          {/* Optional background texture image */}
          {selectedSlide?.bgType === 'texture' && selectedSlide?.textureSrc && (
            <>
              <img
                src={selectedSlide.textureSrc}
                alt="texture"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: `rgba(0, 0, 0, ${selectedSlide.bgOverlayOpacity ?? 0.70})`,
                  pointerEvents: 'none'
                }}
              />
            </>
          )}

          {/* Floating Minimal Top Control Bar (Non-intrusive) */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)'
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreenMobilePresenter(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={16} />
              <span>{uiLang === 'ta' ? 'வெளியேறு' : 'Exit'}</span>
            </button>

            {/* Slide counter pill */}
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 750,
                color: 'rgba(255, 255, 255, 0.85)',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              {(() => {
                const slides = activePresentation?.slides || [];
                const idx = slides.findIndex((s) => s.id === (selectedSlideId || selectedSlide?.id));
                return `${idx >= 0 ? idx + 1 : 1} / ${slides.length || 1}`;
              })()}
            </div>

            {/* Live Indicator Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                padding: '4px 9px',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              LIVE
            </div>
          </div>

          {/* Center Stage Presentation Content */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem',
              position: 'relative',
              zIndex: 5,
              textAlign: selectedSlide?.align || 'center'
            }}
          >
            {selectedSlide && (
              <AutoFitSlideContent
                text={selectedSlide.body || selectedSlide.title}
                reference={selectedSlide.reference}
                highlights={activePresentation.kind === 'bible' ? bibleHighlights : []}
                fontFamily={selectedSlide.fontFamily || 'Noto Sans Tamil'}
                textColor={selectedSlide.textColor || '#ffffff'}
                referenceColor={selectedSlide.referenceColor || selectedSlide.accent || effectiveRefColor}
                accentColor={selectedSlide.referenceColor || selectedSlide.accent || effectiveRefColor}
                align={selectedSlide.align || 'center'}
                preferredSize={selectedSlide.fontSize || 42}
                referenceSize={selectedSlide.referenceSize || 24}
                paddingX={16}
                paddingY={16}
                altLineColorEnabled={activePresentation.kind === 'song' ? (selectedSlide.altLineColorEnabled || songStyle.altLineColorEnabled) : false}
                altLineColor={activePresentation.kind === 'song' ? (selectedSlide.altLineColor || songStyle.altLineColor || '#38bdf8') : undefined}
              />
            )}
          </div>

          {/* Subtle Tap Guides at Bottom */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)',
              fontSize: '0.68rem',
              color: 'rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none'
            }}
          >
            <span>◀ {uiLang === 'ta' ? 'இடது: முந்தையது' : 'Tap left: Prev'}</span>
            <span>↕ {uiLang === 'ta' ? 'மேல்/கீழ்: தொடக்கம்' : 'Swipe: Start'}</span>
            <span>{uiLang === 'ta' ? 'வலது: அடுத்தது' : 'Tap right: Next'} ▶</span>
          </div>
        </div>
      )}

      {/* RIGHT-CLICK SLIDE CONTEXT MENU */}
      {slideContextMenu.visible && slideContextMenu.slide && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: slideContextMenu.y,
            left: slideContextMenu.x,
            zIndex: 99999,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            padding: '4px',
            minWidth: '200px'
          }}
        >
          {/* Header citation preview */}
          <div style={{
            padding: '6px 10px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'var(--text-tertiary)',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '4px'
          }}>
            {slideContextMenu.slide.reference || slideContextMenu.slide.title || 'Slide Action'}
          </div>

          {/* Toggle Bookmark */}
          <button
            type="button"
            onClick={() => {
              toggleBookmarkFromSlide(slideContextMenu.slide);
              setSlideContextMenu({ visible: false, x: 0, y: 0, slide: null });
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: isSlideBookmarked(slideContextMenu.slide) ? '#ef4444' : 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 650,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.1s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-canvas)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isSlideBookmarked(slideContextMenu.slide) ? (
              <>
                <Trash2 size={14} style={{ color: '#ef4444' }} />
                <span>{uiLang === 'ta' ? 'புக்மார்க்கை நீக்கு' : 'Remove Bookmark'}</span>
              </>
            ) : (
              <>
                <Bookmark size={14} style={{ color: 'var(--accent)' }} />
                <span>{uiLang === 'ta' ? 'புக்மார்க் செய்' : 'Bookmark Verse'}</span>
              </>
            )}
          </button>

          {/* Go Live */}
          <button
            type="button"
            onClick={() => {
              handleGoLive(slideContextMenu.slide);
              setSlideContextMenu({ visible: false, x: 0, y: 0, slide: null });
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--accent)',
              fontSize: '0.8rem',
              fontWeight: 650,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.1s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-canvas)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Cast size={14} />
            <span>{uiLang === 'ta' ? 'திரையிடு (Live)' : 'Present Live'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
