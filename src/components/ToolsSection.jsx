import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { 
  Wrench, 
  Presentation, 
  FileDown, 
  Copy, 
  Check, 
  Eye, 
  Sparkles,
  Music,
  ArrowLeft,
  LayoutGrid,
  Square,
  Search,
  ChevronRight,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  Trash2,
  Type,
  Paintbrush,
  X,
  Clock as ClockIcon,
  Tv,
  PartyPopper,
  Maximize2
} from 'lucide-react';
import { NewYearCounterView, getNearestNewYear } from './NewYearCounterView';
import { ChurchClockView } from './ChurchClockView';
import { splitSongSections, rankSongResults } from '../lib/songParser';
import { exportSongToPdf, exportSongToPptx } from '../lib/exportTools';
import { 
  SLIDE_THEMES, 
  SLIDE_TEXTURES, 
  getSlideTheme, 
  calculateSlideFontSize, 
  calculateTitleSlideFontSize 
} from '../lib/presentationThemes';

const chunkCache = new Map();

function cleanSongTitle(rawTitle = '') {
  return String(rawTitle || '')
    .replace(/^[\s\d.\-–—|/()\[\]{}]+/, '')
    .replace(/[“”"']/g, '')
    .trim();
}

/**
 * Renders a pixel-perfect scaled preview of the exact 1920x1080 (or 1600x1200) slide canvas.
 * Guarantees 100% visual parity between the web preview and PowerPoint (.pptx) export.
 */
function SlidePreviewFrame({
  aspectRatio = '16x9',
  bgType = 'solid',
  bgColor = '#0d1117',
  textColor = '#ffffff',
  borderColor = 'var(--border-subtle)',
  textureSrc = '',
  bgOverlayOpacity = 0.65,
  textAlign = 'center',
  children
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.18);

  const targetW = aspectRatio === '4x3' ? 1600 : 1920;
  const targetH = aspectRatio === '4x3' ? 1200 : 1080;
  const alignFlex = textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center');

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const currentW = el.clientWidth;
      if (currentW > 0) {
        setScale(currentW / targetW);
      }
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspectRatio, targetW]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        aspectRatio: aspectRatio === '4x3' ? '4 / 3' : '16 / 9',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '10px',
        border: `1.5px solid ${borderColor}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        backgroundColor: bgType === 'texture' ? '#0b111e' : bgColor
      }}
    >
      <div
        style={{
          width: `${targetW}px`,
          height: `${targetH}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: alignFlex,
          justifyContent: 'center',
          textAlign: textAlign,
          padding: aspectRatio === '4x3' ? '60px 90px' : '70px 100px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          backgroundColor: bgType === 'texture' ? '#0b111e' : bgColor,
          color: textColor
        }}
      >
        {bgType === 'texture' && textureSrc && (
          <>
            <img
              src={textureSrc}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: `rgba(0,0,0,${bgOverlayOpacity})`,
                zIndex: 1
              }}
            />
          </>
        )}
        {children}
      </div>
    </div>
  );
}

const SAMPLE_LYRICS = `ஆவியானவரே ஆவியானவரே
தூய ஆவியானவரே - 2

யெகோவா சபையோத்
என்னை ஆளுகை செய்பவர்
ஆளுகை செய்து ஆட்கொண்டு நடத்துமே

யெகோவா மெக்காதீஸ்
பரிசுத்தப்படுத்துபவர்
பரிசுத்தப்படுத்தி பூரணமாக்குமே

வழிக்காட்டும் தீபமாய் பாதைக்கு வெளிச்சமாய்
உம் நல்ல ஆவியால் நீர் என்னை நடத்துமே
உமக்காக வாழ்ந்திட உம் சித்தம் செய்திட
என்னை நீர் மறைத்து உம்மை வெளிப்படுத்துமே`;

export function ToolsSection({ songsIndex = [], uiLang = 'ta', projector }) {
  const isEn = uiLang === 'en';

  // Responsive mobile state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile Download Preview Modal State: null | 'pptx' | 'pdf'
  const [downloadPreviewType, setDownloadPreviewType] = useState(null);

  // Navigation State: null = Tools Hub, 'converter' = Lyrics to PDF/PPTX Converter, 'new-year-counter', 'clock'
  const [activeTool, setActiveTool] = useState(() => {
    try {
      return localStorage.getItem('ortho_tools_active_tool') || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (activeTool) {
        localStorage.setItem('ortho_tools_active_tool', activeTool);
      } else {
        localStorage.removeItem('ortho_tools_active_tool');
      }
    } catch {}
  }, [activeTool]);

  // New Year Gradients
  const nyGradients = [
    { id: 'grad-1', name: 'Midnight Gold', value: 'radial-gradient(ellipse at center, #1e1b4b 0%, #0f172a 50%, #020617 100%)' },
    { id: 'grad-2', name: 'Cosmic Purple', value: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #0f0728 100%)' },
    { id: 'grad-3', name: 'Deep Aurora', value: 'linear-gradient(135deg, #064e3b 0%, #022c22 50%, #01140e 100%)' },
    { id: 'grad-4', name: 'Obsidian Amber', value: 'linear-gradient(135deg, #451a03 0%, #1c1917 50%, #090d16 100%)' }
  ];

  const clockGradients = [
    { id: 'c-grad-1', name: 'Deep Cosmic', value: 'radial-gradient(ellipse at center, #1e1b4b 0%, #0f172a 45%, #020617 100%)' },
    { id: 'c-grad-2', name: 'Midnight Navy', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #090d16 100%)' },
    { id: 'c-grad-3', name: 'Royal Emerald', value: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #021a14 100%)' },
    { id: 'c-grad-4', name: 'Obsidian Pure', value: '#050811' }
  ];

  // New Year Counter State (Dynamic upcoming nearest New Year)
  const [nyGreeting, setNyGreeting] = useState(isEn ? 'NEW YEAR COUNTDOWN' : 'புத்தாண்டு கவுண்டவுன்');
  const [nyVerse, setNyVerse] = useState(
    isEn 
      ? '"Behold, I will do a new thing; now it shall spring forth." — Isaiah 43:19'
      : '"இதோ, நான் புதிய காரியத்தைச் செய்கிறேன்; இப்பொழுதே அது தோன்றும்." — ஏசாயா 43:19'
  );
  const [nyBgType, setNyBgType] = useState('gradient');
  const [nyGradient, setNyGradient] = useState(nyGradients[0].value);
  const [nyTextureId, setNyTextureId] = useState('sunbeams_golden');
  const [nyOverlayOpacity, setNyOverlayOpacity] = useState(0.70);
  const [nyCelebrate, setNyCelebrate] = useState(false);
  const [isNyFullscreen, setIsNyFullscreen] = useState(false);

  // Hardware back button to exit mobile fullscreen New Year view
  useEffect(() => {
    const handlePopState = () => {
      if (isNyFullscreen) {
        setIsNyFullscreen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isNyFullscreen]);

  const handleOpenNyFullscreen = () => {
    setIsNyFullscreen(true);
    window.history.pushState({ modal: 'ny_fullscreen' }, '');
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch {}
  };

  // Church Clock State (No textures, larger time, vibrant gradients)
  const [clockFormat24h, setClockFormat24h] = useState(false);
  const [clockShowSeconds, setClockShowSeconds] = useState(true);
  const [clockGradient, setClockGradient] = useState(clockGradients[0].value);
  const [clockAnimatedBg, setClockAnimatedBg] = useState(true);

  // Projection status checks
  const isNewYearLive = projector?.activeSlide?.type === 'new-year-counter';
  const isClockLive = projector?.activeSlide?.type === 'clock';

  const handleProjectNewYear = () => {
    if (!projector) return;
    if (isNewYearLive) {
      projector.unproject();
      return;
    }
    const tex = SLIDE_TEXTURES.find(t => t.id === nyTextureId);
    projector.projectSlide({
      id: 'tool-new-year-counter',
      type: 'new-year-counter',
      title: isEn ? 'New Year Countdown' : 'புத்தாண்டு கவுண்டவுன்',
      targetDate: getNearestNewYear().getTime(),
      celebrate: nyCelebrate,
      customGreeting: nyGreeting,
      customVerse: nyVerse,
      bgType: nyBgType,
      gradientBg: nyGradient,
      textureSrc: tex?.src || './images/card-backgrounds/sunbeams-golden.jpg',
      bgOverlayOpacity: nyOverlayOpacity,
      uiLang
    });
  };

  const handleToggleCelebrate = () => {
    const next = !nyCelebrate;
    setNyCelebrate(next);
    if (isNewYearLive && projector) {
      const tex = SLIDE_TEXTURES.find(t => t.id === nyTextureId);
      projector.projectSlide({
        id: 'tool-new-year-counter',
        type: 'new-year-counter',
        title: isEn ? 'New Year Countdown' : 'புத்தாண்டு கவுண்டவுன்',
        targetDate: getNearestNewYear().getTime(),
        celebrate: next,
        customGreeting: nyGreeting,
        customVerse: nyVerse,
        bgType: nyBgType,
        gradientBg: nyGradient,
        textureSrc: tex?.src || './images/card-backgrounds/sunbeams-golden.jpg',
        bgOverlayOpacity: nyOverlayOpacity,
        uiLang
      });
    }
  };

  const handleProjectClock = () => {
    if (!projector) return;
    if (isClockLive) {
      projector.unproject();
      return;
    }
    projector.projectSlide({
      id: 'tool-church-clock',
      type: 'clock',
      title: isEn ? 'Church Clock' : 'ஆலய கடிகாரம்',
      format24h: clockFormat24h,
      showSeconds: clockShowSeconds,
      bgType: 'gradient',
      gradientBg: clockGradient,
      animatedBg: clockAnimatedBg,
      uiLang
    });
  };

  // Converter Form State
  const [songTitle, setSongTitle] = useState('ஆவியானவரே');
  const [subtitle, setSubtitle] = useState(isEn ? 'Tamil Worship Song' : 'தமிழ் ஆராதனைப் பாடல்');
  const [lyricsText, setLyricsText] = useState(SAMPLE_LYRICS);

  // Background & Appearance Styling options
  const [presentationTheme, setPresentationTheme] = useState('dark');
  const [bgType, setBgType] = useState('solid'); // 'solid' | 'texture'
  const [selectedTextureId, setSelectedTextureId] = useState('sunbeams');
  const [customBgImage, setCustomBgImage] = useState(null); // Custom uploaded background image
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState(0.65);
  const [customBgColor, setCustomBgColor] = useState('');
  const [customTextColor, setCustomTextColor] = useState('');
  const [textAlign, setTextAlign] = useState('center'); // 'center' | 'left' | 'right'
  const [alternateEvenLines, setAlternateEvenLines] = useState(false);
  const [evenLineColor, setEvenLineColor] = useState('#fde047');

  const fileInputRef = useRef(null);

  const [aspectRatio, setAspectRatio] = useState('16x9'); // '16x9' | '4x3'
  const [fontSize, setFontSize] = useState(34);
  const [fontFamily, setFontFamily] = useState('Nirmala UI'); // 'Nirmala UI' | 'Baloo Thambi 2' | 'TAMIL-UNI031' | 'Noto Sans Tamil' | 'Segoe UI' | 'Calibri'
  const [includeTitleSlide, setIncludeTitleSlide] = useState(false); // EXCLUDED BY DEFAULT
  const [pallaviIndices, setPallaviIndices] = useState([0]); // By default, first stanza (0) is Pallavi for PDF
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (at least 3-4 slides visible) | 'single'

  // Quick Song Library Search
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [loadingSongFromLibrary, setLoadingSongFromLibrary] = useState(false);
  const pickerRef = useRef(null);

  // Self-loading of songs-index if not passed or not loaded yet
  const [internalSongsIndex, setInternalSongsIndex] = useState(null);
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);

  useEffect(() => {
    if (songsIndex && songsIndex.length > 0) {
      setInternalSongsIndex(songsIndex);
      return;
    }
    if (!internalSongsIndex && !isLoadingIndex) {
      setIsLoadingIndex(true);
      fetch('./data/songs/songs-index.json')
        .then((r) => r.json())
        .then((data) => {
          setInternalSongsIndex(data);
          setIsLoadingIndex(false);
        })
        .catch(() => {
          const base = import.meta.env.BASE_URL || './';
          fetch(`${base.replace(/\/$/, '')}/data/songs/songs-index.json`)
            .then((r) => r.json())
            .then((data) => {
              setInternalSongsIndex(data);
              setIsLoadingIndex(false);
            })
            .catch((err) => {
              console.error('Failed to load songs index in ToolsSection:', err);
              setIsLoadingIndex(false);
            });
        });
    }
  }, [songsIndex, internalSongsIndex, isLoadingIndex]);

  const activeSongsIndex = useMemo(() => {
    if (songsIndex && songsIndex.length > 0) return songsIndex;
    return internalSongsIndex || [];
  }, [songsIndex, internalSongsIndex]);

  // Close song picker dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowSongPicker(false);
      }
    };
    if (showSongPicker) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showSongPicker]);

  // Preview sections
  const previewSections = useMemo(() => {
    return splitSongSections(lyricsText);
  }, [lyricsText]);

  // Total slides count depending on title slide inclusion
  const totalSlides = includeTitleSlide ? previewSections.length + 1 : previewSections.length;

  // Filter songs for quick picker using rankSongResults on s.t, s.q
  const filteredSongs = useMemo(() => {
    if (!activeSongsIndex || activeSongsIndex.length === 0) return [];
    const q = songSearchQuery.trim().toLowerCase();
    if (!q) {
      // Default: show first 12 songs so user has immediate songs to pick from
      return activeSongsIndex.slice(0, 12);
    }
    try {
      const ranked = rankSongResults(activeSongsIndex, q);
      if (ranked && ranked.length > 0) {
        return ranked.slice(0, 15);
      }
    } catch (err) {
      console.warn('Rank search error in ToolsSection:', err);
    }
    return activeSongsIndex.filter((s) => {
      const title = (s.t || s.title || '').toLowerCase();
      const queryStr = (s.q || '').toLowerCase();
      const source = (s.s || s.author || '').toLowerCase();
      return title.includes(q) || queryStr.includes(q) || source.includes(q);
    }).slice(0, 15);
  }, [activeSongsIndex, songSearchQuery]);

  const handleSelectSongFromLibrary = async (song) => {
    if (!song) return;
    setLoadingSongFromLibrary(true);
    try {
      const titleClean = cleanSongTitle(song.t || song.title) || (song.t || song.title || '');
      setSongTitle(titleClean);
      const sub = song.s && song.s !== 'AdoreHim 18K Tamil Songs'
        ? song.s
        : (isEn ? 'Tamil Worship Song' : 'தமிழ் ஆராதனைப் பாடல்');
      setSubtitle(sub);

      const chunkId = String(song.c).padStart(2, '0');
      const chunkUrl = `./data/songs/chunks/chunk-${chunkId}.json`;

      let chunkData;
      if (chunkCache.has(chunkUrl)) {
        chunkData = chunkCache.get(chunkUrl);
      } else {
        let res;
        try {
          res = await fetch(chunkUrl);
          if (!res.ok) throw new Error('Primary chunk fetch failed');
        } catch {
          const base = import.meta.env.BASE_URL || './';
          res = await fetch(`${base.replace(/\/$/, '')}/data/songs/chunks/chunk-${chunkId}.json`);
        }
        chunkData = await res.json();
        chunkCache.set(chunkUrl, chunkData);
      }

      const full = chunkData?.songs ? chunkData.songs[song.id] : chunkData?.[song.id];
      if (full?.lyrics) {
        setLyricsText(full.lyrics);
      }
      setPallaviIndices([0]); // Default first stanza as pallavi
      setShowSongPicker(false);
      setSongSearchQuery('');
    } catch (err) {
      console.error('Failed to load song lyrics from chunk:', err);
      alert(isEn ? 'Failed to load lyrics for this song. Please try another.' : 'பாடல் வரிகளை ஏற்றுவதில் பிழை ஏற்பட்டது. வேறொரு பாடலைத் தேர்ந்தெடுக்கவும்.');
    } finally {
      setLoadingSongFromLibrary(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert(isEn ? 'Image size must be under 15MB' : 'படத்தின் அளவு 15MB-க்குள் இருக்க வேண்டும்');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        setCustomBgImage(uploadEvt.target.result);
        setSelectedTextureId('custom');
        setBgType('texture');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCustomImage = (e) => {
    e.stopPropagation();
    setCustomBgImage(null);
    if (selectedTextureId === 'custom') {
      setSelectedTextureId('sunbeams');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportSongToPdf(songTitle, lyricsText, subtitle, {
        pallaviIndices,
        isEn
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const baseTheme = getSlideTheme(presentationTheme);
  const activeStyle = {
    bg: bgType === 'texture' ? '#0b111e' : (customBgColor || baseTheme.bg),
    text: customTextColor || (bgType === 'texture' ? '#ffffff' : baseTheme.text),
    border: baseTheme.border
  };
  const activeTextureSrc = (selectedTextureId === 'custom' && customBgImage)
    ? customBgImage
    : (SLIDE_TEXTURES.find(t => t.id === selectedTextureId)?.src || SLIDE_TEXTURES[0].src);

  const getFontFamilyCss = (font) => {
    if (font === 'Baloo Thambi 2') return "'Baloo Thambi 2', 'Noto Sans Tamil', sans-serif";
    if (font === 'Nirmala UI') return "'Nirmala UI', 'Noto Sans Tamil', sans-serif";
    if (font === 'TAMIL-UNI031') return "'TAMIL-UNI031', 'Noto Sans Tamil', sans-serif";
    if (font === 'Noto Sans Tamil') return "'Noto Sans Tamil', sans-serif";
    return `'${font}', 'Noto Sans Tamil', sans-serif`;
  };

  const handleExportPptx = async () => {
    if (isExportingPptx) return;
    setIsExportingPptx(true);
    try {
      await exportSongToPptx(songTitle, lyricsText, {
        theme: presentationTheme,
        aspectRatio,
        fontSize,
        fontFace: fontFamily,
        includeTitleSlide,
        subtitle,
        bgType,
        textureSrc: activeTextureSrc,
        bgOverlayOpacity,
        customBgColor: customBgColor || null,
        customTextColor: customTextColor || null,
        textAlign,
        alternateEvenLines,
        evenLineColor
      });
    } catch (err) {
      console.error('Failed to export PPTX:', err);
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`${songTitle}\n\n${lyricsText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // =========================================================================
  // VIEW 1: TOOLS HUB (Card Grid Selection Screen similar to Home Page)
  // =========================================================================
  if (!activeTool) {
    return (
      <div style={{
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
        padding: isMobile ? '10px 10px 84px 10px' : '1.5rem 2rem 3rem 2rem',
        backgroundColor: 'var(--bg-canvas)'
      }}>
        {/* Top Header Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0.75rem 0.85rem' : '1rem 1.4rem',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: isMobile ? '0.85rem' : '1.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
            <div style={{
              width: isMobile ? '34px' : '42px',
              height: isMobile ? '34px' : '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              flexShrink: 0
            }}>
              <Wrench size={isMobile ? 18 : 22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: isMobile ? '1rem' : '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isEn ? 'Worship Tools & Utilities' : 'ஆராதனைக் கருவிகள்'}
              </h1>
              <p style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.35 }}>
                {isEn 
                  ? 'Select a tool below for church service preparation, media creation, and document export.' 
                  : 'ஆராதனை மற்றும் பாடல் சேவைக்கான பிரத்தியேக பயன்பாட்டுக் கருவிகள்.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tools Selection Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: isMobile ? '8px' : '1.25rem',
          maxWidth: '1200px'
        }}>
          {/* Card 1: Lyrics to PDF/PPTX Converter */}
          <div
            onClick={() => setActiveTool('converter')}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: isMobile ? '14px' : '18px',
              border: '1px solid var(--border-subtle)',
              padding: isMobile ? '0.75rem 0.65rem' : '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? '160px' : '220px',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '0.5rem' : '1.1rem' }}>
                <div style={{
                  width: isMobile ? '32px' : '46px',
                  height: isMobile ? '32px' : '46px',
                  borderRadius: isMobile ? '8px' : '12px',
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  flexShrink: 0
                }}>
                  <Presentation size={isMobile ? 16 : 24} />
                </div>
                <div style={{ display: 'flex', gap: '3px' }}>
                  <span style={{
                    fontSize: isMobile ? '0.56rem' : '0.68rem',
                    fontWeight: 800,
                    padding: isMobile ? '2px 4px' : '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(5, 150, 105, 0.12)',
                    color: '#059669'
                  }}>
                    PPTX
                  </span>
                  <span style={{
                    fontSize: isMobile ? '0.56rem' : '0.68rem',
                    fontWeight: 800,
                    padding: isMobile ? '2px 4px' : '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb'
                  }}>
                    PDF
                  </span>
                </div>
              </div>

              <h3 style={{ fontSize: isMobile ? '0.82rem' : '1.18rem', fontWeight: 800, color: 'var(--text-primary)', margin: isMobile ? '0 0 0.3rem 0' : '0 0 0.5rem 0', lineHeight: 1.25 }}>
                Lyrics to PDF/PPTX
              </h3>
              <p style={{
                fontSize: isMobile ? '0.68rem' : '0.84rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.35,
                margin: 0,
                display: isMobile ? '-webkit-box' : undefined,
                WebkitLineClamp: isMobile ? 2 : undefined,
                WebkitBoxOrient: isMobile ? 'vertical' : undefined,
                overflow: isMobile ? 'hidden' : undefined
              }}>
                {isEn 
                  ? 'Convert worship song lyrics into formatted PowerPoint slides and printable song sheets.' 
                  : 'பாடல் வரிகளை தானாக பிரித்து PowerPoint (.pptx) ஸ்லைடுகளாகவும் PDF அச்சுத்தாள்களாகவும் மாற்றும் கருவி.'}
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px',
              marginTop: isMobile ? '0.5rem' : '1.4rem',
              paddingTop: isMobile ? '0.45rem' : '0.9rem',
              borderTop: '1px solid var(--border-subtle)',
              minWidth: 0
            }}>
              <span style={{ fontSize: isMobile ? '0.62rem' : '0.74rem', color: 'var(--text-tertiary)', fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                {isEn ? 'PPTX · PDF' : 'PPTX · PDF'}
              </span>
              <span style={{
                fontSize: isMobile ? '0.72rem' : '0.82rem',
                fontWeight: 800,
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '1px',
                flexShrink: 0
              }}>
                {isEn ? 'Open' : 'திறக்க'} <ChevronRight size={13} />
              </span>
            </div>
          </div>

          {/* Card 2: New Year Counter Tool */}
          <div
            onClick={() => setActiveTool('new-year-counter')}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: isMobile ? '14px' : '18px',
              border: '1px solid var(--border-subtle)',
              padding: isMobile ? '0.75rem 0.65rem' : '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? '160px' : '220px',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#f59e0b';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(245, 158, 11, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '0.5rem' : '1.1rem' }}>
                <div style={{
                  width: isMobile ? '32px' : '46px',
                  height: isMobile ? '32px' : '46px',
                  borderRadius: isMobile ? '8px' : '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.14)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  flexShrink: 0
                }}>
                  <PartyPopper size={isMobile ? 16 : 24} />
                </div>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {isNewYearLive && (
                    <span style={{
                      fontSize: isMobile ? '0.56rem' : '0.68rem',
                      fontWeight: 800,
                      padding: isMobile ? '2px 4px' : '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      animation: 'pulseGlow 1.2s infinite'
                    }}>
                      • LIVE
                    </span>
                  )}
                  <span style={{
                    fontSize: isMobile ? '0.55rem' : '0.68rem',
                    fontWeight: 800,
                    padding: isMobile ? '2px 4px' : '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(245, 158, 11, 0.14)',
                    color: '#d97706'
                  }}>
                    {isMobile ? 'FULLSCREEN' : 'PROJECTABLE'}
                  </span>
                </div>
              </div>

              <h3 style={{ fontSize: isMobile ? '0.82rem' : '1.18rem', fontWeight: 800, color: 'var(--text-primary)', margin: isMobile ? '0 0 0.3rem 0' : '0 0 0.5rem 0', lineHeight: 1.25 }}>
                {isEn ? 'New Year Countdown' : 'புத்தாண்டு கவுண்டவுன்'}
              </h3>
              <p style={{
                fontSize: isMobile ? '0.68rem' : '0.84rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.35,
                margin: 0,
                display: isMobile ? '-webkit-box' : undefined,
                WebkitLineClamp: isMobile ? 2 : undefined,
                WebkitBoxOrient: isMobile ? 'vertical' : undefined,
                overflow: isMobile ? 'hidden' : undefined
              }}>
                {isEn 
                  ? 'Live countdown to the nearest New Year with midnight celebration transition animation & screen projection.' 
                  : 'அடுத்த புத்தாண்டிற்கான நேரடி கவுண்டவுன், நள்ளிரவு மாறுதல் அனிமேஷன் மற்றும் நேரடி திரையிடல்.'}
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px',
              marginTop: isMobile ? '0.5rem' : '1.4rem',
              paddingTop: isMobile ? '0.45rem' : '0.9rem',
              borderTop: '1px solid var(--border-subtle)',
              minWidth: 0
            }}>
              <span style={{ fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-tertiary)', fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                {isEn ? 'Countdown' : 'கவுண்டவுன்'}
              </span>
              <span style={{
                fontSize: isMobile ? '0.72rem' : '0.82rem',
                fontWeight: 800,
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '1px',
                flexShrink: 0
              }}>
                {isEn ? 'Open' : 'திறக்க'} <ChevronRight size={13} />
              </span>
            </div>
          </div>

          {/* Card 3: Live Church Clock Tool (Hidden on Mobile) */}
          {!isMobile && (
            <div
              onClick={() => setActiveTool('clock')}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '18px',
                border: '1px solid var(--border-subtle)',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '220px',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(2, 132, 199, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(2, 132, 199, 0.14)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}>
                    <ClockIcon size={24} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {isClockLive && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        animation: 'pulseGlow 1.2s infinite'
                      }}>
                        • LIVE
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(2, 132, 199, 0.14)',
                      color: '#0284c7'
                    }}>
                      PROJECTABLE
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                  {isEn ? 'Church Clock' : 'ஆலய கடிகாரம்'}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                  {isEn 
                    ? 'Full-screen liturgical digital clock for sanctuary projector screens with 12h/24h format and themes.' 
                    : 'ஆராதனை நேரத்தில் பெரிய திரையில் நேரடி கடிகாரத்தை காட்ட உதவும் கருவி.'}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginTop: '1.4rem',
                paddingTop: '0.9rem',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isEn ? '12h / 24h · Full Screen' : '12h/24h · முழுத்திரை'}
                </span>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isEn ? 'Open Tool' : 'திறக்க'} <ChevronRight size={15} />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: NEW YEAR COUNTER TOOL
  // =========================================================================
  if (activeTool === 'new-year-counter') {
    const nyTexture = SLIDE_TEXTURES.find(t => t.id === nyTextureId);
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: isMobile ? '8px 0.5rem 64px 0.5rem' : '0.5rem 1rem 0.6rem 1rem',
        backgroundColor: 'var(--bg-canvas)'
      }}>
        {/* Top Navigation Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} />
              <span>{isEn ? 'Tools Hub' : 'கருவிகள்'}</span>
            </button>
            <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <h2 style={{ fontSize: isMobile ? '0.88rem' : '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              <PartyPopper size={isMobile ? 16 : 18} style={{ color: '#f59e0b' }} />
              <span>{isEn ? 'Countdown' : 'கவுண்டவுன்'}</span>
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {!isMobile && isNewYearLive && (
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 850,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                animation: 'pulseGlow 1.2s infinite'
              }}>
                • LIVE
              </span>
            )}
            {isMobile ? (
              <button
                type="button"
                onClick={handleOpenNyFullscreen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Maximize2 size={14} />
                <span>{isEn ? 'Fullscreen' : 'முழுத்திரை'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleProjectNewYear}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  backgroundColor: isNewYearLive ? '#dc2626' : 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Tv size={14} />
                <span>{isNewYearLive ? (isEn ? 'Stop' : 'நிறுத்து') : (isEn ? 'Project Countdown' : 'கவுண்டவுனை திரையிடுக')}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Area: Left Live Preview, Right Controls */}
        <div style={{
          flex: 1,
          minHeight: 0,
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : '1.2fr 1fr',
          gap: isMobile ? '0.75rem' : '1rem',
          overflow: isMobile ? 'auto' : 'hidden'
        }}>
          {/* Left Column: Stage Preview */}
          <div style={{
            height: isMobile ? 'auto' : '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            minHeight: isMobile ? 'auto' : 0,
            flexShrink: 0,
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            padding: '0.8rem',
            boxShadow: 'var(--shadow-sm)',
            overflow: isMobile ? 'visible' : 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                {isEn ? 'Live Preview Canvas (16:9 Screen Output)' : 'நேரடி முன்னோட்டம் (16:9 திரை தோற்றம்)'}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>
                {nyCelebrate ? (isEn ? '★ Celebration Active' : '★ கொண்டாட்டம் இயங்குகிறது') : (isEn ? '⏳ Countdown Ticking' : '⏳ கவுண்டவுன் இயங்குகிறது')}
              </span>
            </div>

            <div style={{
              width: '100%',
              aspectRatio: '16 / 9',
              maxHeight: isMobile ? '260px' : '520px',
              minHeight: isMobile ? '200px' : '320px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1.5px solid var(--border-strong)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <NewYearCounterView
                targetDate={getNearestNewYear().getTime()}
                celebrate={nyCelebrate}
                customGreeting={nyGreeting}
                customVerse={nyVerse}
                bgType={nyBgType}
                gradientBg={nyGradient}
                textureSrc={nyTexture?.src || './images/card-backgrounds/sunbeams-golden.jpg'}
                bgOverlayOpacity={nyOverlayOpacity}
                uiLang={uiLang}
                isMini={true}
              />
            </div>
          </div>

          {/* Right Column: Controls & Triggers */}
          <div style={{
            height: isMobile ? 'auto' : '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            overflowY: isMobile ? 'visible' : 'auto',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            padding: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Manual Celebration Trigger Section */}
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1.5px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 850, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} />
                  <span>{isEn ? 'Midnight Transition Animation' : 'நள்ளிரவு கொண்டாட்ட அனிமேஷன்'}</span>
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f59e0b', color: '#fff' }}>
                  OPERATOR CUE
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {isEn
                  ? 'Automatically triggers when countdown hits 00:00:00. You can also manually trigger it right now for rehearsal or live countdown cue.'
                  : 'கவுண்டவுன் பூஜ்ஜியத்தை அடையும் போது தானாகவே இயங்கும். ஒத்திகைக்காக அல்லது உடனே இயக்க கீழேயுள்ள பொத்தானை அழுத்தவும்.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleToggleCelebrate}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: nyCelebrate ? '#ef4444' : '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <PartyPopper size={16} />
                  <span>{nyCelebrate ? (isEn ? 'Reset Countdown' : 'கவுண்டவுனை மீட்டமைக்க') : (isEn ? '🎉 Trigger Celebration Animation' : '🎉 கொண்டாட்ட அனிமேஷனை இயக்கு')}</span>
                </button>
              </div>
            </div>

            {/* Background Theme Gradients */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                {isEn ? 'Background Theme (Gradients)' : 'பின்னணி தீம் (வண்ணக் கலவை)'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {nyGradients.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setNyBgType('gradient');
                      setNyGradient(g.value);
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: g.value,
                      border: nyBgType === 'gradient' && nyGradient === g.value ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.15)',
                      color: '#ffffff',
                      fontWeight: 750,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Title / Custom Greeting Input */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                {isEn ? 'Service Header Title' : 'ஆராதனை தலைப்பு'}
              </label>
              <input
                type="text"
                value={nyGreeting}
                onChange={(e) => setNyGreeting(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Scripture Verse Input */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                {isEn ? 'Covenant Scripture Promise' : 'புத்தாண்டு வாக்குத்தத்த வசனம்'}
              </label>
              <textarea
                rows={2}
                value={nyVerse}
                onChange={(e) => setNyVerse(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none'
                }}
              />
            </div>

            {/* Background Texture Selector */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                {isEn ? 'Background Image Texture' : 'பின்னணி அமைவு'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {SLIDE_TEXTURES.slice(0, 6).map(tex => (
                  <button
                    key={tex.id}
                    type="button"
                    onClick={() => setNyTextureId(tex.id)}
                    style={{
                      height: '42px',
                      borderRadius: '6px',
                      border: nyTextureId === tex.id ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                      position: 'relative',
                      overflow: 'hidden',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                    title={tex.label}
                  >
                    <img src={tex.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {nyTextureId === tex.id && (
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={14} style={{ color: '#fff', strokeWidth: 3 }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Darkness Scrim Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {isEn ? 'Darkness Scrim' : 'இருள் மேலடுக்கு'}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b' }}>
                  {Math.round(nyOverlayOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={nyOverlayOpacity}
                onChange={(e) => setNyOverlayOpacity(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Mobile Fullscreen Landscape Mode for New Year Counter */}
        {isNyFullscreen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999999,
              backgroundColor: '#000000',
              overflow: 'hidden'
            }}
          >
            <style>{`
              @media (orientation: portrait) {
                .ny-landscape-wrapper {
                  width: 100vh !important;
                  height: 100vw !important;
                  transform: rotate(90deg) translate(0, -100vw) !important;
                  transform-origin: top left !important;
                }
              }
              @media (orientation: landscape) {
                .ny-landscape-wrapper {
                  width: 100vw !important;
                  height: 100vh !important;
                  transform: none !important;
                }
              }
            `}</style>
            <div
              className="ny-landscape-wrapper"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Close / Exit Button (50% opacity) */}
              <button
                type="button"
                onClick={() => {
                  setIsNyFullscreen(false);
                  try {
                    if (window.history.state?.modal === 'ny_fullscreen') {
                      window.history.back();
                    }
                  } catch {}
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  zIndex: 1000,
                  opacity: 0.5,
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                title={isEn ? 'Exit Fullscreen' : 'வெளியேறு'}
              >
                <X size={20} />
              </button>

              <NewYearCounterView
                targetDate={getNearestNewYear().getTime()}
                celebrate={nyCelebrate}
                customGreeting={nyGreeting}
                customVerse={nyVerse}
                bgType={nyBgType}
                gradientBg={nyGradient}
                textureSrc={nyTexture?.src || './images/card-backgrounds/sunbeams-golden.jpg'}
                bgOverlayOpacity={nyOverlayOpacity}
                uiLang={uiLang}
                isMini={false}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: CHURCH CLOCK TOOL
  // =========================================================================
  if (activeTool === 'clock') {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: isMobile ? '8px 0.5rem 64px 0.5rem' : '0.5rem 1rem 0.6rem 1rem',
        backgroundColor: 'var(--bg-canvas)'
      }}>
        {/* Top Navigation Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} />
              <span>{isEn ? 'Tools Hub' : 'கருவிகள்'}</span>
            </button>
            <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <h2 style={{ fontSize: isMobile ? '0.88rem' : '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              <ClockIcon size={isMobile ? 16 : 18} style={{ color: '#0284c7' }} />
              <span>{isEn ? 'Clock' : 'கடிகாரம்'}</span>
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isClockLive && (
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 850,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                animation: 'pulseGlow 1.2s infinite'
              }}>
                • LIVE
              </span>
            )}
            <button
              type="button"
              onClick={handleProjectClock}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: isMobile ? '6px 10px' : '7px 16px',
                borderRadius: '8px',
                backgroundColor: isClockLive ? '#dc2626' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontSize: isMobile ? '0.75rem' : '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                whiteSpace: 'nowrap'
              }}
            >
              <Tv size={14} />
              <span>{isClockLive ? (isEn ? 'Stop' : 'நிறுத்து') : (isMobile ? (isEn ? 'Project' : 'திரையிடுக') : (isEn ? 'Project Clock' : 'கடிகாரத்தை திரையிடுக'))}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Area: Left Live Preview, Right Controls */}
        <div style={{
          flex: 1,
          minHeight: 0,
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : '1.2fr 1fr',
          gap: isMobile ? '0.75rem' : '1rem',
          overflow: isMobile ? 'auto' : 'hidden'
        }}>
          {/* Left Column: Stage Preview */}
          <div style={{
            height: isMobile ? 'auto' : '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            minHeight: isMobile ? 'auto' : 0,
            flexShrink: 0,
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            padding: '0.8rem',
            boxShadow: 'var(--shadow-sm)',
            overflow: isMobile ? 'visible' : 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                {isEn ? 'Live Clock Preview (16:9 Screen Output)' : 'நேரடி முன்னோட்டம் (16:9 திரை தோற்றம்)'}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700 }}>
                {clockFormat24h ? '24H' : '12H'} · {clockShowSeconds ? (isEn ? 'Seconds On' : 'விநாடிகள் இயங்குகிறது') : (isEn ? 'Seconds Off' : 'விநாடிகள் மறைவு')}
              </span>
            </div>

            <div style={{
              width: '100%',
              aspectRatio: '16 / 9',
              maxHeight: isMobile ? '260px' : '520px',
              minHeight: isMobile ? '200px' : '320px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1.5px solid var(--border-strong)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <ChurchClockView
                format24h={clockFormat24h}
                showSeconds={clockShowSeconds}
                bgType="gradient"
                gradientBg={clockGradient}
                animatedBg={clockAnimatedBg}
                uiLang={uiLang}
                isMini={true}
              />
            </div>
          </div>

          {/* Right Column: Controls & Settings */}
          <div style={{
            height: isMobile ? 'auto' : '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            overflowY: isMobile ? 'visible' : 'auto',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            padding: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Format Toggles */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                {isEn ? 'Time Format' : 'நேர வடிவம்'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setClockFormat24h(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: !clockFormat24h ? '2px solid #0284c7' : '1px solid var(--border-subtle)',
                    backgroundColor: !clockFormat24h ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-canvas)',
                    color: !clockFormat24h ? '#0284c7' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  12-Hour (AM / PM)
                </button>
                <button
                  type="button"
                  onClick={() => setClockFormat24h(true)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: clockFormat24h ? '2px solid #0284c7' : '1px solid var(--border-subtle)',
                    backgroundColor: clockFormat24h ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-canvas)',
                    color: clockFormat24h ? '#0284c7' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  24-Hour Format
                </button>
              </div>
            </div>

            {/* Show / Hide Seconds */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                {isEn ? 'Seconds Display' : 'விநாடிகள் காட்சி'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setClockShowSeconds(true)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: clockShowSeconds ? '2px solid #0284c7' : '1px solid var(--border-subtle)',
                    backgroundColor: clockShowSeconds ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-canvas)',
                    color: clockShowSeconds ? '#0284c7' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {isEn ? 'Show Seconds' : 'விநாடிகளை காட்டுக'}
                </button>
                <button
                  type="button"
                  onClick={() => setClockShowSeconds(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: !clockShowSeconds ? '2px solid #0284c7' : '1px solid var(--border-subtle)',
                    backgroundColor: !clockShowSeconds ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-canvas)',
                    color: !clockShowSeconds ? '#0284c7' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {isEn ? 'Hide Seconds' : 'விநாடிகளை மறை'}
                </button>
              </div>
            </div>

            {/* Background Gradients Selector */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                {isEn ? 'Background Theme (Gradients)' : 'பின்னணி வண்ணக் கலவை'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {clockGradients.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setClockGradient(g.value)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: g.value,
                      border: clockGradient === g.value ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                      color: '#ffffff',
                      fontWeight: 750,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Animated Ambient Shimmer Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setClockAnimatedBg((v) => !v)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: clockAnimatedBg ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-canvas)',
                  border: clockAnimatedBg ? '1.5px solid #38bdf8' : '1px solid var(--border-subtle)',
                  color: clockAnimatedBg ? '#38bdf8' : 'var(--text-secondary)',
                  fontWeight: 750,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>✨ {isEn ? 'Subtle Ambient Background Motion' : 'மென்மையான பின்னணி ஒளி இயக்கம்'}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>({clockAnimatedBg ? (isEn ? 'ON' : 'இயக்கத்தில்') : (isEn ? 'OFF' : 'அணைக்கப்பட்டது')})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LYRICS TO PDF/PPTX CONVERTER TOOL
  // (Left: Slide Deck Preview, Right: Compact Controls & Settings)
  // =========================================================================
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box',
      padding: isMobile ? '8px 0.5rem 64px 0.5rem' : '0.5rem 1rem 0.6rem 1rem',
      backgroundColor: 'var(--bg-canvas)'
    }}>
      {/* Top Navigation & Title Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.8rem',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '0.6rem',
        flexShrink: 0
      }}>
        {/* Back Button */}
        <button
          type="button"
          onClick={() => setActiveTool(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 11px',
            borderRadius: '7px',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title={isEn ? 'Back to Tools Hub' : 'கருவிகள் முகப்புக்குச் செல்க'}
        >
          <ArrowLeft size={14} />
          <span>{isEn ? 'Back to Tools' : 'கருவிகள் முகப்பு'}</span>
        </button>

        {/* Tool Name: Only "Lyrics to PDF/PPTX Converter" */}
        <h2 style={{
          fontSize: '1.05rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.01em'
        }}>
          Lyrics to PDF/PPTX Converter
        </h2>

        {/* Slide Counter Badge */}
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 750,
          color: 'var(--accent)',
          backgroundColor: 'var(--accent-light)',
          padding: '3px 10px',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)'
        }}>
          {totalSlides} {isEn ? 'Slides' : 'ஸ்லைடுகள்'}
        </div>
      </div>

      {/* Main Area: Desktop 2-Column (Left Slides, Right Controls), Mobile 1-Column (Controls Only) */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        gridTemplateColumns: isMobile ? undefined : '1.15fr 1fr',
        gap: '0.85rem',
        overflow: isMobile ? 'auto' : 'hidden'
      }}>
        {/* =================================================================== */}
        {/* LEFT COLUMN: Slide Cards Preview (Desktop Only)                     */}
        {/* =================================================================== */}
        {!isMobile && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            padding: '0.8rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
          {/* Slides Header Bar with View Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.65rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                {isEn ? `Slide Deck Preview (${totalSlides})` : `ஸ்லைடு முன்னோட்டம் (${totalSlides})`}
              </span>
            </div>

            {/* View Mode Toggle: Grid View (4 visible on 16:9) vs Single Column */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', backgroundColor: 'var(--bg-canvas)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: viewMode === 'grid' ? 'var(--accent-light)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}
                  title={isEn ? 'Grid (Multiple slides visible)' : 'கட்டம் (பல ஸ்லைடுகள்)'}
                >
                  <LayoutGrid size={12} />
                  <span>{isEn ? 'Grid' : 'கட்டம்'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: viewMode === 'single' ? 'var(--accent-light)' : 'transparent',
                    color: viewMode === 'single' ? 'var(--accent)' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}
                  title={isEn ? 'Single column' : 'ஒற்றை நிரல்'}
                >
                  <Square size={12} />
                  <span>{isEn ? 'Single' : 'ஒற்றை'}</span>
                </button>
              </div>

              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-canvas)'
              }}>
                {aspectRatio === '16x9' ? '16:9' : '4:3'}
              </span>
            </div>
          </div>

          {/* Scrollable Slide Cards Deck (Independent Scroll, At least 3 visible on 16:9) */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            paddingRight: '4px',
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(2, 1fr)' : '1fr',
            gap: '0.65rem',
            alignContent: 'start'
          }}>
            {/* Optional Title Slide Preview (EXCLUDED BY DEFAULT, shown only when includeTitleSlide is true) */}
            {includeTitleSlide && (() => {
              const { titleSize, subtitleSize } = calculateTitleSlideFontSize(fontSize);
              const alignFlex = textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center');
              return (
                <div>
                  <div style={{
                    fontSize: '0.68rem',
                    fontWeight: 750,
                    color: 'var(--text-tertiary)',
                    marginBottom: '3px',
                    paddingLeft: '2px'
                  }}>
                    #1 · {isEn ? 'Title Slide' : 'தலைப்பு'}
                  </div>
                  <SlidePreviewFrame
                    aspectRatio={aspectRatio}
                    bgType={bgType}
                    bgColor={activeStyle.bg}
                    textColor={activeStyle.text}
                    borderColor={activeStyle.border}
                    textureSrc={activeTextureSrc}
                    bgOverlayOpacity={bgOverlayOpacity}
                    textAlign={textAlign}
                  >
                    <div style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: alignFlex,
                      justifyContent: 'center',
                      textAlign: textAlign,
                      width: '100%',
                      transform: 'translateY(-4px)',
                      gap: '18px'
                    }}>
                      <div style={{
                        fontSize: `${titleSize}px`,
                        fontWeight: 800,
                        color: activeStyle.text,
                        lineHeight: 1.25,
                        fontFamily: getFontFamilyCss(fontFamily),
                        wordBreak: 'break-word',
                        maxWidth: '90%',
                        textShadow: bgType === 'texture' ? '0 2px 12px rgba(0,0,0,0.85)' : 'none'
                      }}>
                        {songTitle || (isEn ? 'Song Title' : 'பாடல் தலைப்பு')}
                      </div>
                      {subtitle && (
                        <div style={{
                          fontSize: `${subtitleSize}px`,
                          fontWeight: 600,
                          color: activeStyle.text,
                          opacity: 0.85,
                          lineHeight: 1.4,
                          fontFamily: getFontFamilyCss(fontFamily),
                          wordBreak: 'break-word',
                          maxWidth: '85%',
                          textShadow: bgType === 'texture' ? '0 2px 12px rgba(0,0,0,0.85)' : 'none'
                        }}>
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </SlidePreviewFrame>
                </div>
              );
            })()}

            {/* Stanza Slides Previews (Clean centered lyrics, NO internal badges) */}
            {previewSections.map((section, idx) => {
              const slideIndex = includeTitleSlide ? idx + 2 : idx + 1;
              const isPallavi = (pallaviIndices || []).includes(idx);
              const lines = section.lines && section.lines.length > 0 ? section.lines : section.text.split('\n');
              const stanzaFontSize = calculateSlideFontSize(lines, fontSize, aspectRatio);
              const alignFlex = textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center');

              return (
                <div key={section.id || idx}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    paddingLeft: '2px',
                    paddingRight: '2px'
                  }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 750,
                      color: 'var(--text-tertiary)'
                    }}>
                      #{slideIndex}
                    </span>

                    {/* Pallavi checkmark selector (Only for PDF) */}
                    <button
                      type="button"
                      onClick={() => {
                        setPallaviIndices(prev => 
                          prev.includes(idx)
                            ? (prev.length > 1 ? prev.filter(i => i !== idx) : [idx])
                            : [...prev, idx]
                        );
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '5px',
                        border: isPallavi ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                        backgroundColor: isPallavi ? 'var(--accent-light)' : 'transparent',
                        color: isPallavi ? 'var(--accent)' : 'var(--text-tertiary)',
                        fontSize: '0.66rem',
                        fontWeight: isPallavi ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title={isEn ? 'Toggle as Pallavi (Chorus) for PDF song sheet' : 'PDF பாடல்தாளில் இதை பல்லவியாகக் குறிக்க'}
                    >
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        border: isPallavi ? 'none' : '1.5px solid var(--border-strong)',
                        backgroundColor: isPallavi ? 'var(--accent)' : 'transparent',
                        color: 'var(--accent-contrast)'
                      }}>
                        {isPallavi && <Check size={10} style={{ strokeWidth: 3 }} />}
                      </span>
                      <span>{isPallavi ? (isEn ? 'Pallavi (PDF)' : 'பல்லவி (PDF)') : (isEn ? 'Set Pallavi' : 'பல்லவி ஆக்கு')}</span>
                    </button>
                  </div>

                  <SlidePreviewFrame
                    aspectRatio={aspectRatio}
                    bgType={bgType}
                    bgColor={activeStyle.bg}
                    textColor={activeStyle.text}
                    borderColor={activeStyle.border}
                    textureSrc={activeTextureSrc}
                    bgOverlayOpacity={bgOverlayOpacity}
                    textAlign={textAlign}
                  >
                    <div style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: alignFlex,
                      justifyContent: 'center',
                      textAlign: textAlign,
                      width: '100%',
                      transform: 'translateY(-4px)',
                      fontSize: `${stanzaFontSize}px`,
                      fontWeight: 650,
                      lineHeight: 1.48,
                      fontFamily: getFontFamilyCss(fontFamily),
                      wordBreak: 'break-word',
                      maxWidth: '92%',
                      textShadow: bgType === 'texture' ? '0 2px 10px rgba(0,0,0,0.85)' : 'none'
                    }}>
                      {lines.map((line, lIdx) => {
                        const isAlternate = alternateEvenLines && (lIdx % 2 === 1);
                        const lineClr = isAlternate ? evenLineColor : activeStyle.text;
                        return (
                          <div
                            key={lIdx}
                            style={{
                              color: lineClr,
                              width: '100%',
                              textAlign: textAlign,
                              fontWeight: isAlternate ? 750 : 650
                            }}
                          >
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  </SlidePreviewFrame>
                </div>
              );
            })}
          </div>
        </div>
      )}

        {/* =================================================================== */}
        {/* RIGHT COLUMN: Compact Controls & Settings Panel                     */}
        {/* =================================================================== */}
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          padding: isMobile ? '0.75rem' : '0.85rem 1rem',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-sm)',
          width: isMobile ? '100%' : undefined,
          boxSizing: 'border-box'
        }}>
          {/* 1. Song Details & Library Quick Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                {isEn ? 'Song Information' : 'பாடல் தலைப்பு & குறிப்பு'}
              </label>

              {/* Songbook library quick picker trigger */}
              <div style={{ position: 'relative' }} ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => setShowSongPicker(!showSongPicker)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: showSongPicker ? 'var(--accent-light)' : 'var(--bg-canvas)',
                    color: 'var(--accent)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={isEn ? 'Choose a song from 18K+ Tamil hymn & worship library' : '18,000+ பாடல் நூலகத்திலிருந்து தேர்ந்தெடுக்க'}
                >
                  {isLoadingIndex ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Music size={11} />
                  )}
                  <span>{isEn ? 'Pick from Songbook' : 'பாடல் தேர்வு'}</span>
                </button>

                {/* Dropdown popup */}
                {showSongPicker && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '5px',
                    width: '320px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-strong)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 50,
                    padding: '8px'
                  }}>
                    {/* Search Bar with Clear Button */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '6px'
                    }}>
                      <Search size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder={isEn ? 'Search Tamil or English (e.g. Aaviyanavare)...' : 'பாடல் தேடுக (எ.கா: ஆவியானவரே / aaviyanavare)...'}
                        value={songSearchQuery}
                        onChange={(e) => setSongSearchQuery(e.target.value)}
                        autoFocus
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontSize: '0.75rem',
                          color: 'var(--text-primary)'
                        }}
                      />
                      {songSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSongSearchQuery('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Header info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 4px 4px 4px',
                      borderBottom: '1px solid var(--border-subtle)',
                      marginBottom: '4px',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      color: 'var(--text-tertiary)'
                    }}>
                      <span>{songSearchQuery ? (isEn ? 'Search Results' : 'தேடல் முடிவுகள்') : (isEn ? 'Popular / Recent Songs' : 'பிரபல பாடல்கள்')}</span>
                      <span>{filteredSongs.length} {isEn ? 'songs' : 'பாடல்கள்'}</span>
                    </div>

                    {/* Results list */}
                    <div style={{ maxHeight: '230px', overflowY: 'auto' }}>
                      {loadingSongFromLibrary ? (
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent)' }} />
                          <span>{isEn ? 'Loading song lyrics...' : 'பாடல் வரிகள் ஏற்றப்படுகின்றன...'}</span>
                        </div>
                      ) : filteredSongs.length > 0 ? (
                        filteredSongs.map((s) => {
                          const displayTitle = cleanSongTitle(s.t || s.title) || (s.t || s.title || '');
                          const displayAuthor = s.s && s.s !== 'AdoreHim 18K Tamil Songs' ? s.s : null;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSelectSongFromLibrary(s)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {displayTitle}
                                </div>
                                {displayAuthor && (
                                  <div style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {displayAuthor}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', flexShrink: 0, fontFamily: 'monospace' }}>
                                #{s.id.split('-').pop()}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div style={{ padding: '14px 8px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                          {isLoadingIndex
                            ? (isEn ? 'Loading songbook index...' : 'பாடல் நூலகம் ஏற்றப்படுகிறது...')
                            : songSearchQuery
                              ? (isEn ? 'No songs matched your search' : 'பொருத்தமான பாடல்கள் இல்லை')
                              : (isEn ? 'Type to search songs...' : 'தேட தட்டச்சு செய்யவும்...')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Subtitle Inputs in 1 Compact Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder={isEn ? 'Song Title' : 'பாடல் தலைப்பு'}
                style={{
                  width: '100%',
                  padding: '6px 9px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder={isEn ? 'Subtitle / Author' : 'குறிப்பு / கலைஞர்'}
                style={{
                  width: '100%',
                  padding: '6px 9px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* 2. Lyrics Textarea with Load Sample */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                {isEn ? 'Song Lyrics' : 'பாடல் வரிகள் (பல்லவி, சரணம்)'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setLyricsText(SAMPLE_LYRICS);
                  setPallaviIndices([0]);
                }}
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {isEn ? 'Load Sample' : 'மாதிரி வரிகள்'}
              </button>
            </div>
            <textarea
              rows={7}
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder={isEn ? 'Paste song lyrics here...' : 'பாடல் வரிகளை இங்கே ஒட்டவும்...'}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                outline: 'none',
                fontFamily: 'var(--font-tamil)',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 3. Background & Color Theme (Solid Colors or Background Images/Textures) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                {isEn ? 'Slide Background & Colors' : 'ஸ்லைடு பின்னணி & நிறங்கள்'}
              </label>

              {/* Segmented Mode Switcher */}
              <div style={{ display: 'flex', backgroundColor: 'var(--bg-canvas)', borderRadius: '7px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setBgType('solid')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: bgType === 'solid' ? 'var(--accent-light)' : 'transparent',
                    color: bgType === 'solid' ? 'var(--accent)' : 'var(--text-tertiary)',
                    fontWeight: 750,
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isEn ? 'Solid Color & Theme Presets' : 'வண்ணத் தோற்றம்'}
                >
                  <Palette size={12} />
                  <span>{isEn ? 'Colors' : 'வண்ணம்'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBgType('texture')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: bgType === 'texture' ? 'var(--accent-light)' : 'transparent',
                    color: bgType === 'texture' ? 'var(--accent)' : 'var(--text-tertiary)',
                    fontWeight: 750,
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isEn ? 'Image Textures & Custom Upload' : 'பின்னணி படங்கள்'}
                >
                  <ImageIcon size={12} />
                  <span>{isEn ? 'Images' : 'படங்கள்'}</span>
                </button>
              </div>
            </div>

            {/* MODE A: SOLID COLORS & THEMES */}
            {bgType === 'solid' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 10 Theme Preset Chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
                  {SLIDE_THEMES.map((t) => {
                    const isSelected = presentationTheme === t.id && !customBgColor && !customTextColor;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setPresentationTheme(t.id);
                          setCustomBgColor(t.bg);
                          setCustomTextColor(t.text);
                        }}
                        style={{
                          padding: '6px 3px',
                          borderRadius: '7px',
                          backgroundColor: t.bg,
                          color: t.text,
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                          fontSize: '0.66rem',
                          fontWeight: 750,
                          cursor: 'pointer',
                          textAlign: 'center',
                          boxShadow: isSelected ? '0 0 0 2px var(--accent-light)' : 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                        title={t.name}
                      >
                        {t.name.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>

                {/* Prominent Color Control Cards: 2-Column Split for BG & Text */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Card 1: Background Color */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '9px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Paintbrush size={12} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                          {isEn ? 'Background' : 'பின்னணி நிறம்'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.66rem', fontFamily: 'monospace', fontWeight: 750, color: 'var(--text-tertiary)' }}>
                        {(customBgColor || baseTheme.bg).toUpperCase()}
                      </span>
                    </div>

                    {/* Interactive Color Box */}
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 6px',
                      borderRadius: '7px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: customBgColor || baseTheme.bg,
                        border: '1.5px solid rgba(0,0,0,0.2)',
                        flexShrink: 0,
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)'
                      }} />
                      <input
                        type="text"
                        value={(customBgColor || baseTheme.bg).toUpperCase()}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        placeholder="#000000"
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontFamily: 'monospace',
                          fontSize: '0.78rem',
                          fontWeight: 750,
                          color: 'var(--text-primary)'
                        }}
                      />
                      <input
                        type="color"
                        value={customBgColor || baseTheme.bg}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                        title={isEn ? 'Click to pick background color' : 'பின்னணி நிறத்தை தேர்ந்தெடுக்க'}
                      />
                    </div>

                    {/* Quick Swatches Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                      {[
                        { color: '#000000', label: 'Black' },
                        { color: '#0d1117', label: 'Obsidian' },
                        { color: '#0a192f', label: 'Navy' },
                        { color: '#062118', label: 'Emerald' },
                        { color: '#1e0a10', label: 'Crimson' },
                        { color: '#180b2c', label: 'Violet' },
                        { color: '#ffffff', label: 'White' },
                        { color: '#fbf7ee', label: 'Parchment' }
                      ].map((s) => {
                        const isCurrent = (customBgColor || baseTheme.bg).toLowerCase() === s.color.toLowerCase();
                        return (
                          <button
                            key={s.color}
                            type="button"
                            onClick={() => setCustomBgColor(s.color)}
                            style={{
                              width: '17px',
                              height: '17px',
                              borderRadius: '50%',
                              backgroundColor: s.color,
                              border: isCurrent ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.25)',
                              cursor: 'pointer',
                              padding: 0,
                              boxShadow: isCurrent ? '0 0 0 1.5px var(--accent-light)' : 'none',
                              transition: 'transform 0.1s ease'
                            }}
                            title={s.label}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Card 2: Lyrics Text Color */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '9px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Type size={12} style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                          {isEn ? 'Lyrics Text' : 'எழுத்து நிறம்'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.66rem', fontFamily: 'monospace', fontWeight: 750, color: 'var(--text-tertiary)' }}>
                        {(customTextColor || baseTheme.text).toUpperCase()}
                      </span>
                    </div>

                    {/* Interactive Color Box */}
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 6px',
                      borderRadius: '7px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: customTextColor || baseTheme.text,
                        border: '1.5px solid rgba(0,0,0,0.2)',
                        flexShrink: 0,
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)'
                      }} />
                      <input
                        type="text"
                        value={(customTextColor || baseTheme.text).toUpperCase()}
                        onChange={(e) => setCustomTextColor(e.target.value)}
                        placeholder="#FFFFFF"
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontFamily: 'monospace',
                          fontSize: '0.78rem',
                          fontWeight: 750,
                          color: 'var(--text-primary)'
                        }}
                      />
                      <input
                        type="color"
                        value={customTextColor || baseTheme.text}
                        onChange={(e) => setCustomTextColor(e.target.value)}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                        title={isEn ? 'Click to pick lyrics text color' : 'பாடல் வரி நிறத்தை தேர்ந்தெடுக்க'}
                      />
                    </div>

                    {/* Quick Swatches Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                      {[
                        { color: '#ffffff', label: 'Pure White' },
                        { color: '#fde047', label: 'Vibrant Gold' },
                        { color: '#e5b965', label: 'Warm Gold' },
                        { color: '#fdfbf7', label: 'Linen' },
                        { color: '#38bdf8', label: 'Sky Blue' },
                        { color: '#34d399', label: 'Mint' },
                        { color: '#0f172a', label: 'Charcoal' },
                        { color: '#cbd5e1', label: 'Silver' }
                      ].map((s) => {
                        const isCurrent = (customTextColor || baseTheme.text).toLowerCase() === s.color.toLowerCase();
                        return (
                          <button
                            key={s.color}
                            type="button"
                            onClick={() => setCustomTextColor(s.color)}
                            style={{
                              width: '17px',
                              height: '17px',
                              borderRadius: '50%',
                              backgroundColor: s.color,
                              border: isCurrent ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.25)',
                              cursor: 'pointer',
                              padding: 0,
                              boxShadow: isCurrent ? '0 0 0 1.5px var(--accent-light)' : 'none',
                              transition: 'transform 0.1s ease'
                            }}
                            title={s.label}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Live Contrast Preview Bar & Reset Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: activeStyle.bg,
                  color: activeStyle.text,
                  border: `1.5px solid ${activeStyle.border || 'rgba(0,0,0,0.15)'}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 750, fontFamily: getFontFamilyCss(fontFamily), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Aa · {songTitle || (isEn ? 'Lyrics Preview' : 'பாடல் முன்னோட்டம்')}
                  </div>
                  {(customBgColor || customTextColor) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomBgColor('');
                        setCustomTextColor('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        border: '1px solid rgba(128,128,128,0.3)',
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        color: '#ffffff',
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title={isEn ? 'Reset to theme defaults' : 'இயல்பு நிலைக்கு மீட்டமைக்க'}
                    >
                      <RotateCcw size={10} />
                      <span>{isEn ? 'Reset' : 'மீட்டமை'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* MODE B: BACKGROUND TEXTURES & CUSTOM IMAGE UPLOAD */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Hidden File Input for Custom Background Image Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />

                {/* Custom Image Upload Zone */}
                {customBgImage ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: selectedTextureId === 'custom' ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                    boxShadow: selectedTextureId === 'custom' ? '0 0 0 2px var(--accent-light)' : 'none'
                  }}>
                    <div
                      onClick={() => setSelectedTextureId('custom')}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
                    >
                      <img
                        src={customBgImage}
                        alt="Custom"
                        style={{ width: '42px', height: '26px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-strong)' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                          {isEn ? 'Custom Uploaded Image' : 'பதிவேற்றிய சொந்தப் படம்'}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: selectedTextureId === 'custom' ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 650 }}>
                          {selectedTextureId === 'custom' ? (isEn ? 'Active background' : 'செயலில் உள்ளது') : (isEn ? 'Click to select' : 'தேர்ந்தெடுக்க கிளிக் செய்க')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title={isEn ? 'Change image' : 'படத்தை மாற்ற'}
                      >
                        <Upload size={11} />
                        <span>{isEn ? 'Replace' : 'மாற்று'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCustomImage}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px 6px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface)',
                          color: '#ef4444',
                          cursor: 'pointer'
                        }}
                        title={isEn ? 'Remove custom image' : 'படத்தை நீக்கு'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px dashed var(--border-strong)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--accent)',
                      fontSize: '0.74rem',
                      fontWeight: 750,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={isEn ? 'Upload custom photo from computer' : 'கணினியிலிருந்து உங்கள் சொந்தப் பின்னணிப் படத்தை பதிவேற்றவும்'}
                  >
                    <Upload size={14} />
                    <span>{isEn ? 'Upload Custom Background Image' : 'சொந்தப் பின்னணிப் படம் பதிவேற்றவும்'}</span>
                  </button>
                )}

                {/* 17 Spiritual Textures Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '5px',
                  maxHeight: '125px',
                  overflowY: 'auto',
                  paddingRight: '2px'
                }}>
                  {SLIDE_TEXTURES.map((tex) => {
                    const isSelected = selectedTextureId === tex.id;
                    return (
                      <button
                        key={tex.id}
                        type="button"
                        onClick={() => setSelectedTextureId(tex.id)}
                        style={{
                          position: 'relative',
                          aspectRatio: '16 / 9',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                          padding: 0,
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 0 1.5px var(--accent-light)' : 'none',
                          transition: 'transform 0.1s ease'
                        }}
                        title={tex.name}
                      >
                        <img
                          src={tex.src}
                          alt={tex.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          fontSize: '0.55rem',
                          fontWeight: 700,
                          padding: '1px 2px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {tex.name}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Darkness Scrim Slider & Text Color */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', alignItems: 'center' }}>
                  {/* Darkness Scrim */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {isEn ? 'Darkness Scrim' : 'இருள் திரை செறிவு'}
                      </label>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)' }}>
                        {Math.round(bgOverlayOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.20"
                      max="0.90"
                      step="0.05"
                      value={bgOverlayOpacity}
                      onChange={(e) => setBgOverlayOpacity(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                  </div>

                  {/* Lyrics Text Color for Texture */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '5px 8px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {isEn ? 'Text Color' : 'எழுத்து நிறம்'}
                      </span>
                      <span style={{ fontSize: '0.64rem', fontFamily: 'monospace', fontWeight: 750, color: 'var(--text-tertiary)' }}>
                        {(customTextColor || '#ffffff').toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {['#ffffff', '#fde047', '#38bdf8', '#34d399', '#fdfbf7'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCustomTextColor(c)}
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: c,
                            border: (customTextColor || '#ffffff').toLowerCase() === c.toLowerCase() ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        />
                      ))}
                      <label style={{ position: 'relative', width: '18px', height: '18px', borderRadius: '4px', backgroundColor: customTextColor || '#ffffff', border: '1px solid rgba(0,0,0,0.3)', cursor: 'pointer', overflow: 'hidden' }}>
                        <input
                          type="color"
                          value={customTextColor || '#ffffff'}
                          onChange={(e) => setCustomTextColor(e.target.value)}
                          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Text Alignment & Layout Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
            {/* Alignment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {isEn ? 'Text Alignment' : 'வரிசைப்படுத்தல்'}
              </label>
              <div style={{ display: 'flex', backgroundColor: 'var(--bg-canvas)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setTextAlign('left')}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: textAlign === 'left' ? 'var(--accent-light)' : 'transparent',
                    color: textAlign === 'left' ? 'var(--accent)' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={isEn ? 'Align Left' : 'இடது'}
                >
                  <AlignLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setTextAlign('center')}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: textAlign === 'center' ? 'var(--accent-light)' : 'transparent',
                    color: textAlign === 'center' ? 'var(--accent)' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={isEn ? 'Align Center' : 'மையம்'}
                >
                  <AlignCenter size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setTextAlign('right')}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: textAlign === 'right' ? 'var(--accent-light)' : 'transparent',
                    color: textAlign === 'right' ? 'var(--accent)' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={isEn ? 'Align Right' : 'வலது'}
                >
                  <AlignRight size={13} />
                </button>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {isEn ? 'Aspect Ratio' : 'திரை விகிதம்'}
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  fontWeight: 650,
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="16x9">16:9 Widescreen</option>
                <option value="4x3">4:3 Standard</option>
              </select>
            </div>
          </div>

          {/* 5. Font Family & Font Size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
            {/* Font Family (Includes Baloo Thambi 2) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {isEn ? 'Slide Font' : 'எழுத்துரு'}
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  fontWeight: 650,
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="Baloo Thambi 2">Baloo Thambi 2 (Display / Bold)</option>
                <option value="Nirmala UI">Nirmala UI (Windows / Office)</option>
                <option value="TAMIL-UNI031">Tamil Unicode (031)</option>
                <option value="Noto Sans Tamil">Noto Sans Tamil</option>
                <option value="Segoe UI">Segoe UI</option>
                <option value="Calibri">Calibri</option>
              </select>
            </div>

            {/* Font Size (Range 24pt - 90pt) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {isEn ? 'Font Size' : 'அளவு'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setFontSize((prev) => Math.max(24, prev - 2))}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '3px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title="-2pt"
                  >
                    -
                  </button>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent)', minWidth: '32px', textAlign: 'center' }}>
                    {fontSize}pt
                  </span>
                  <button
                    type="button"
                    onClick={() => setFontSize((prev) => Math.min(90, prev + 2))}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '3px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title="+2pt"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="24"
                max="90"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>

          {/* 6. Alternate Even Line Color (Leader / Congregation or Bilingual) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '7px 10px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                  {isEn ? 'Alternate Even Line Color' : 'இரட்டை வரி வண்ண மாற்றம்'}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                  {isEn ? 'Different color for alternating lines' : 'இரண்டாவது வரிகளை வேறு நிறத்தில் சிறப்பிக்க'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlternateEvenLines(!alternateEvenLines)}
                style={{
                  width: '38px',
                  height: '22px',
                  borderRadius: '12px',
                  backgroundColor: alternateEvenLines ? 'var(--accent)' : 'var(--border-strong)',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  padding: 0,
                  flexShrink: 0
                }}
                title={alternateEvenLines ? (isEn ? 'Enabled' : 'இயக்கப்பட்டது') : (isEn ? 'Disabled' : 'முடக்கப்பட்டது')}
              >
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: alternateEvenLines ? '18px' : '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                }} />
              </button>
            </div>

            {alternateEvenLines && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed var(--border-subtle)' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {isEn ? 'Line Color:' : 'வரி நிறம்:'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[
                    { label: 'Gold', val: '#fde047' },
                    { label: 'Sky', val: '#38bdf8' },
                    { label: 'Mint', val: '#34d399' },
                    { label: 'Rose', val: '#fb7185' },
                    { label: 'White', val: '#ffffff' }
                  ].map((c) => (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => setEvenLineColor(c.val)}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: c.val,
                        border: evenLineColor === c.val ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.25)',
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: evenLineColor === c.val ? '0 0 0 1.5px var(--accent-light)' : 'none'
                      }}
                      title={c.label}
                    />
                  ))}
                  <input
                    type="color"
                    value={evenLineColor}
                    onChange={(e) => setEvenLineColor(e.target.value)}
                    style={{ width: '20px', height: '20px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
                    title={isEn ? 'Custom Even Line Color' : 'தனிப்பயன் நிறம்'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 7. Include Title Slide Toggle (EXCLUDED BY DEFAULT) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 11px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                {isEn ? 'Include Title Slide' : 'தலைப்பு ஸ்லைடு சேர்க்க'}
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                {isEn ? 'Add song title as first slide (Default: Off)' : 'முதல் ஸ்லைடாக தலைப்பைச் சேர்க்க (முன்னிருப்பு: ஆஃப்)'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIncludeTitleSlide(!includeTitleSlide)}
              style={{
                width: '38px',
                height: '22px',
                borderRadius: '12px',
                backgroundColor: includeTitleSlide ? 'var(--accent)' : 'var(--border-strong)',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                padding: 0,
                flexShrink: 0
              }}
              title={includeTitleSlide ? (isEn ? 'Title slide included' : 'தலைப்பு ஸ்லைடு சேர்க்கப்பட்டுள்ளது') : (isEn ? 'Title slide excluded' : 'தலைப்பு ஸ்லைடு விலக்கப்பட்டுள்ளது')}
            >
              <span style={{
                position: 'absolute',
                top: '2px',
                left: includeTitleSlide ? '18px' : '2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
              }} />
            </button>
          </div>

          {/* 7. Action Buttons (Export PPTX, Export PDF, Copy) */}
          <div style={{
            display: 'flex',
            gap: '6px',
            marginTop: 'auto',
            paddingTop: '0.6rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => {
                if (isMobile) {
                  setDownloadPreviewType('pptx');
                } else {
                  handleExportPptx();
                }
              }}
              disabled={isExportingPptx}
              style={{
                flex: 1.2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 750,
                border: 'none',
                cursor: isExportingPptx ? 'not-allowed' : 'pointer',
                opacity: isExportingPptx ? 0.75 : 1,
                boxShadow: 'var(--shadow-sm)'
              }}
              title={isEn ? 'Download PowerPoint presentation (.pptx)' : 'PowerPoint (.pptx) ஸ்லைடுகளைப் பதிவிறக்கு'}
            >
              {isExportingPptx ? <Loader2 size={15} className="animate-spin" /> : <Presentation size={15} />}
              <span>{isExportingPptx ? (isEn ? 'Exporting...' : 'ஏற்றுகிறது...') : (isEn ? 'PPTX' : 'PPTX பதிவிறக்கு')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isMobile) {
                  setDownloadPreviewType('pdf');
                } else {
                  handleExportPdf();
                }
              }}
              disabled={isExportingPdf}
              style={{
                flex: 1.1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontSize: '0.82rem',
                fontWeight: 750,
                border: 'none',
                cursor: isExportingPdf ? 'not-allowed' : 'pointer',
                opacity: isExportingPdf ? 0.75 : 1,
                boxShadow: 'var(--shadow-sm)'
              }}
              title={isEn ? 'Download printable song sheet (.pdf)' : 'அச்சிடக்கூடிய PDF பாடல்தாளைப் பதிவிறக்கு'}
            >
              {isExportingPdf ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
              <span>{isExportingPdf ? (isEn ? 'Generating...' : 'உருவாகிறது...') : (isEn ? 'PDF' : 'PDF பதிவிறக்கு')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '9px 11px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                color: copied ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
              title={isEn ? 'Copy lyrics text to clipboard' : 'பாடல் வரிகளை நகலெடு'}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? (isEn ? 'Copied' : 'நகலானது') : (isEn ? 'Copy' : 'நகல்')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Download Preview Modal */}
      {isMobile && downloadPreviewType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            boxSizing: 'border-box'
          }}
          onClick={() => setDownloadPreviewType(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {downloadPreviewType === 'pptx' ? (
                  <Presentation size={18} style={{ color: '#059669' }} />
                ) : (
                  <FileDown size={18} style={{ color: 'var(--accent)' }} />
                )}
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isEn
                    ? `Download Preview (${downloadPreviewType.toUpperCase()})`
                    : `பதிவிறக்க முன்னோட்டம் (${downloadPreviewType.toUpperCase()})`}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 750,
                  color: 'var(--accent)',
                  backgroundColor: 'var(--accent-light)',
                  padding: '2px 8px',
                  borderRadius: '5px'
                }}>
                  {totalSlides} {isEn ? 'Slides' : 'ஸ்லைடுகள்'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDownloadPreviewType(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Scrollable slide deck preview */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: 'var(--bg-canvas)'
            }}>
              {/* Title Slide Preview */}
              {includeTitleSlide && (() => {
                const { titleSize, subtitleSize } = calculateTitleSlideFontSize(songTitle, subtitle, aspectRatio);
                const alignFlex = textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center');
                return (
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                      #1 {isEn ? 'Title Slide' : 'தலைப்பு ஸ்லைடு'}
                    </div>
                    <SlidePreviewFrame
                      aspectRatio={aspectRatio}
                      bgType={bgType}
                      bgColor={activeStyle.bg}
                      textColor={activeStyle.text}
                      borderColor={activeStyle.border}
                      textureSrc={activeTextureSrc}
                      bgOverlayOpacity={bgOverlayOpacity}
                      textAlign={textAlign}
                    >
                      <div style={{
                        position: 'relative',
                        zIndex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: alignFlex,
                        justifyContent: 'center',
                        textAlign: textAlign,
                        width: '100%',
                        transform: 'translateY(-4px)',
                        gap: '18px'
                      }}>
                        <div style={{
                          fontSize: `${titleSize}px`,
                          fontWeight: 800,
                          color: activeStyle.text,
                          lineHeight: 1.25,
                          fontFamily: getFontFamilyCss(fontFamily),
                          wordBreak: 'break-word',
                          maxWidth: '90%',
                          textShadow: bgType === 'texture' ? '0 2px 12px rgba(0,0,0,0.85)' : 'none'
                        }}>
                          {songTitle || (isEn ? 'Song Title' : 'பாடல் தலைப்பு')}
                        </div>
                        {subtitle && (
                          <div style={{
                            fontSize: `${subtitleSize}px`,
                            fontWeight: 600,
                            color: activeStyle.text,
                            opacity: 0.85,
                            lineHeight: 1.4,
                            fontFamily: getFontFamilyCss(fontFamily),
                            wordBreak: 'break-word',
                            maxWidth: '85%',
                            textShadow: bgType === 'texture' ? '0 2px 12px rgba(0,0,0,0.85)' : 'none'
                          }}>
                            {subtitle}
                          </div>
                        )}
                      </div>
                    </SlidePreviewFrame>
                  </div>
                );
              })()}

              {/* Stanza Slides Previews */}
              {previewSections.map((section, idx) => {
                const slideIndex = includeTitleSlide ? idx + 2 : idx + 1;
                const lines = section.lines && section.lines.length > 0 ? section.lines : section.text.split('\n');
                const stanzaFontSize = calculateSlideFontSize(lines, fontSize, aspectRatio);
                const alignFlex = textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center');

                return (
                  <div key={section.id || idx}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                      #{slideIndex}
                    </div>
                    <SlidePreviewFrame
                      aspectRatio={aspectRatio}
                      bgType={bgType}
                      bgColor={activeStyle.bg}
                      textColor={activeStyle.text}
                      borderColor={activeStyle.border}
                      textureSrc={activeTextureSrc}
                      bgOverlayOpacity={bgOverlayOpacity}
                      textAlign={textAlign}
                    >
                      <div style={{
                        position: 'relative',
                        zIndex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: alignFlex,
                        justifyContent: 'center',
                        textAlign: textAlign,
                        width: '100%',
                        transform: 'translateY(-4px)',
                        fontSize: `${stanzaFontSize}px`,
                        fontWeight: 650,
                        lineHeight: 1.48,
                        fontFamily: getFontFamilyCss(fontFamily),
                        wordBreak: 'break-word',
                        maxWidth: '92%',
                        textShadow: bgType === 'texture' ? '0 2px 10px rgba(0,0,0,0.85)' : 'none'
                      }}>
                        {lines.map((line, lIdx) => {
                          const isAlternate = alternateEvenLines && (lIdx % 2 === 1);
                          const lineClr = isAlternate ? evenLineColor : activeStyle.text;
                          return (
                            <div
                              key={lIdx}
                              style={{
                                color: lineClr,
                                width: '100%',
                                textAlign: textAlign,
                                fontWeight: isAlternate ? 750 : 650
                              }}
                            >
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    </SlidePreviewFrame>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer: Cancel and Confirm Download Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '12px 16px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setDownloadPreviewType(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isEn ? 'Cancel' : 'ரத்து செய்'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (downloadPreviewType === 'pptx') {
                    await handleExportPptx();
                  } else if (downloadPreviewType === 'pdf') {
                    await handleExportPdf();
                  }
                  setDownloadPreviewType(null);
                }}
                disabled={isExportingPptx || isExportingPdf}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  backgroundColor: downloadPreviewType === 'pptx' ? '#059669' : 'var(--accent)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: (isExportingPptx || isExportingPdf) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {(isExportingPptx || isExportingPdf) ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : downloadPreviewType === 'pptx' ? (
                  <Presentation size={16} />
                ) : (
                  <FileDown size={16} />
                )}
                <span>
                  {isEn
                    ? `Confirm Download ${downloadPreviewType.toUpperCase()}`
                    : `${downloadPreviewType.toUpperCase()} பதிவிறக்கு`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
