import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  SunMedium, 
  Copy, 
  Check, 
  BookOpen, 
  Tv, 
  RotateCw, 
  Star, 
  Download,
  Trash2,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bookmark,
  Sparkles,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import html2canvas from 'html2canvas';

// Curated popular verses as fallback if pool is loading
const POPULAR_VERSES = [
  { bookCode: 'JHN', bookName: 'யோவான்', englishBookName: 'John', chapter: 3, verse: 16 },
  { bookCode: 'PSA', bookName: 'சங்கீதம்', englishBookName: 'Psalms', chapter: 23, verse: 1 },
  { bookCode: 'ISA', bookName: 'ஏசாயா', englishBookName: 'Isaiah', chapter: 40, verse: 31 },
  { bookCode: 'JER', bookName: 'எரேமியா', englishBookName: 'Jeremiah', chapter: 29, verse: 11 },
  { bookCode: 'PHP', bookName: 'பிலிப்பியர்', englishBookName: 'Philippians', chapter: 4, verse: 13 },
  { bookCode: 'PRO', bookName: 'நீதிமொழிகள்', englishBookName: 'Proverbs', chapter: 3, verse: 5 },
  { bookCode: 'MAT', bookName: 'மத்தேயு', englishBookName: 'Matthew', chapter: 6, verse: 33 },
  { bookCode: 'ROM', bookName: 'ரோமர்', englishBookName: 'Romans', chapter: 8, verse: 28 },
  { bookCode: 'JOS', bookName: 'யோசுவா', englishBookName: 'Joshua', chapter: 1, verse: 9 },
  { bookCode: 'PSA', bookName: 'சங்கீதம்', englishBookName: 'Psalms', chapter: 91, verse: 1 }
];

const TEXTURE_PRESETS = [
  {
    id: 'sunbeams',
    label: 'Heavenly Sunbeams',
    labelTa: 'விண்ணக கதிர்கள் (நீல வானம்)',
    src: './images/card-backgrounds/sunbeams.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#fde047',
    defaultOverlay: 0.70
  },
  {
    id: 'sunbeams_golden',
    label: 'Golden Burst Rays',
    labelTa: 'பொன்மலர் ஒளிக்கதிர்கள்',
    src: './images/card-backgrounds/sunbeams-golden.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#fde047',
    defaultOverlay: 0.70
  },
  {
    id: 'heavenly_dawn',
    label: 'Heavenly Dawn',
    labelTa: 'விடியற்காலை ஒளி',
    src: './images/card-backgrounds/heavenly-dawn.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#fde047',
    defaultOverlay: 0.70
  },
  {
    id: 'heavenly_glory',
    label: 'Radiant Sunburst',
    labelTa: 'பிரகாச சூரியக்கதிர்கள்',
    src: './images/card-backgrounds/heavenly-glory.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#fbbf24',
    defaultOverlay: 0.70
  },
  {
    id: 'blue_heaven',
    label: 'Blue Sky & Light',
    labelTa: 'நீல வானம் & மேகங்கள்',
    src: './images/card-backgrounds/blue-heaven.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#38bdf8',
    defaultOverlay: 0.70
  },
  {
    id: 'clouds_golden',
    label: 'Golden Rim Clouds',
    labelTa: 'பொன் மேகங்கள்',
    src: './images/card-backgrounds/clouds-golden.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#fbbf24',
    defaultOverlay: 0.70
  },
  {
    id: 'amethyst_clouds',
    label: 'Amethyst Twilight',
    labelTa: 'அந்தி வான மேகங்கள்',
    src: './images/card-backgrounds/amethyst-clouds.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#fde047',
    defaultOverlay: 0.70
  },
  {
    id: 'golden_hour',
    label: 'Golden Hour Glow',
    labelTa: 'பொன் மாலை ஒளி',
    src: './images/card-backgrounds/golden-hour-rays.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#fde047',
    defaultOverlay: 0.70
  },
  {
    id: 'sacred_light',
    label: 'Cathedral Arch Light',
    labelTa: 'தேவாலய ஒளிக்கீற்று',
    src: './images/card-backgrounds/sacred-light-chapel.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#e5b965',
    defaultOverlay: 0.70
  },
  {
    id: 'church_light',
    label: 'Sanctuary Light',
    labelTa: 'பரிசுத்த பிரசன்ன ஒளி',
    src: './images/card-backgrounds/church-light.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#e5b965',
    defaultOverlay: 0.70
  },
  {
    id: 'linen',
    label: 'Woven Linen Fabric',
    labelTa: 'மெல்லிய சணல் துணி',
    src: './images/card-backgrounds/linen.jpg',
    isDark: false,
    text: '#1c1917',
    accent: '#b45309',
    defaultOverlay: 0.06
  },
  {
    id: 'clean_parchment',
    label: 'Ancient Parchment',
    labelTa: 'பழைய சுருளேடு காகிதம்',
    src: './images/card-backgrounds/clean-parchment.jpg',
    isDark: false,
    text: '#291b0c',
    accent: '#854d0e',
    defaultOverlay: 0.06
  },
  {
    id: 'pure_marble',
    label: 'Carrara White Marble',
    labelTa: 'வெள்ளை பளிங்குக்கல்',
    src: './images/card-backgrounds/pure-marble.jpg',
    isDark: false,
    text: '#0f172a',
    accent: '#0369a1',
    defaultOverlay: 0.08
  },
  {
    id: 'calm_waters',
    label: 'Still Waters (Psalm 23)',
    labelTa: 'அமைதியான நன்னீர்',
    src: './images/card-backgrounds/calm-waters.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#38bdf8',
    defaultOverlay: 0.70
  },
  {
    id: 'mountain',
    label: 'Misty Mountains',
    labelTa: 'பனிமலை சிகரம்',
    src: './images/card-backgrounds/mountain.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#6ee7b7',
    defaultOverlay: 0.70
  },
  {
    id: 'cosmos',
    label: 'Starry Sky & Cosmos',
    labelTa: 'விண்மீன் மண்டலம் (சங் 19)',
    src: './images/card-backgrounds/cosmos.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#c084fc',
    defaultOverlay: 0.50
  },
  {
    id: 'sunset',
    label: 'Sunset Horizon',
    labelTa: 'அந்தி வானம்',
    src: './images/card-backgrounds/sunset.jpg',
    isDark: true,
    text: '#ffffff',
    accent: '#fde047',
    defaultOverlay: 0.70
  }
];

const BG_PRESETS = [
  { id: 'midnight', label: 'Midnight Blue', value: '#0c1322', text: '#ffffff', accent: '#e5b965' },
  { id: 'royal_indigo', label: 'Royal Indigo', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', text: '#ffffff', accent: '#38bdf8' },
  { id: 'deep_emerald', label: 'Forest Emerald', value: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', text: '#ffffff', accent: '#6ee7b7' },
  { id: 'burgundy', label: 'Velvet Crimson', value: 'linear-gradient(135deg, #4c0519 0%, #881337 100%)', text: '#ffffff', accent: '#fbcfe8' },
  { id: 'golden_amber', label: 'Golden Amber', value: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)', text: '#fef3c7', accent: '#fbbf24' },
  { id: 'charcoal', label: 'Slate Charcoal', value: '#0f172a', text: '#f8fafc', accent: '#38bdf8' },
  { id: 'dark_violet', label: 'Cosmic Violet', value: 'linear-gradient(135deg, #2e1065 0%, #581c87 100%)', text: '#ffffff', accent: '#c084fc' },
  { id: 'ocean_abyss', label: 'Ocean Abyss', value: 'linear-gradient(135deg, #083344 0%, #0e7490 100%)', text: '#ffffff', accent: '#38bdf8' },
  { id: 'sunset_flare', label: 'Sunset Flare', value: 'linear-gradient(135deg, #701a75 0%, #db2777 100%)', text: '#ffffff', accent: '#fde047' },
  { id: 'deep_espresso', label: 'Deep Espresso', value: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)', text: '#fef3c7', accent: '#fbbf24' },
  { id: 'cobalt_royal', label: 'Cobalt Royal', value: 'linear-gradient(135deg, #172554 0%, #1d4ed8 100%)', text: '#ffffff', accent: '#60a5fa' },
  { id: 'forest_moss', label: 'Forest Moss', value: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)', text: '#ffffff', accent: '#4ade80' },
  { id: 'cyber_dark', label: 'Cyber Charcoal', value: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', text: '#ffffff', accent: '#38bdf8' },
  { id: 'pure_black', label: 'Pure Black', value: '#000000', text: '#ffffff', accent: '#e5b965' },
  { id: 'cream_parchment', label: 'Warm Parchment', value: '#fdfbf7', text: '#1c1917', accent: '#b45309' },
  { id: 'clean_white', label: 'Clean White', value: '#ffffff', text: '#0f172a', accent: '#2563eb' },
  { id: 'soft_lavender', label: 'Soft Lavender', value: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', text: '#1e1b4b', accent: '#6d28d9' },
  { id: 'nordic_ice', label: 'Nordic Ice', value: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', text: '#082f49', accent: '#0284c7' }
];

const TAMIL_FONTS = [
  // Tamil Unicode Font (X:\Fonts\Tamil Unicode Fonts)
  { id: 'TAMIL-UNI031', label: 'Tamil Unicode 31 (தனித்துவ வடிவம்)' },
  // Modern & Traditional Fonts
  { id: 'Noto Sans Tamil', label: 'Noto Sans (நவீன இயல்பு)' },
  { id: 'Baloo Thambi 2', label: 'Baloo Thambi 2 (தடித்த எழுத்து)' },
  { id: 'Anek Tamil', label: 'Anek Tamil (அடர்ந்த நவீன வடிவம்)' },
  { id: 'Mukta Malar', label: 'Mukta Malar (நேர்த்தியான வடிவம்)' },
  { id: 'Catamaran', label: 'Catamaran (உயர்ந்த எழுத்து)' },
  { id: 'Noto Serif Tamil', label: 'Noto Serif (பாரம்பரிய செரிஃப்)' },
  { id: 'Hind Madurai', label: 'Hind Madurai (தெளிவான எழுத்து)' },
  { id: 'Pavanam', label: 'Pavanam (மெல்லிய வடிவம்)' },
  { id: 'Coiny', label: 'Coiny (வட்ட வடிவம்)' },
  { id: 'Tiro Tamil', label: 'Tiro Tamil (நேர்த்தியான அச்சு)' },
  { id: 'Arima Madurai', label: 'Arima Madurai (அலங்கார எழுத்து)' },
  { id: 'Kavivanar', label: 'Kavivanar (கவிதை நயம்)' },
  { id: 'Latha', label: 'Latha (விண்டோஸ் இயல்பு)' },
  { id: 'Vijaya', label: 'Vijaya (பாரம்பரிய எழுத்து)' }
];

const RATIO_OPTIONS = [
  { id: 'auto', label: 'Auto', desc: 'Adaptive', ratio: 'auto' },
  { id: '1:1', label: '1:1', desc: 'Square (Status/Post)', ratio: '1 / 1' },
  { id: '4:5', label: '4:5', desc: 'Portrait (Stories)', ratio: '4 / 5' },
  { id: '16:9', label: '16:9', desc: 'Landscape (Banner)', ratio: '16 / 9' }
];

const DATE_FORMATS = [
  { id: 'full', labelEn: 'Full Date (e.g. Friday, 4 Sep 2026)', labelTa: 'முழு தேதி (வெள்ளி, 4 செப் 2026)' },
  { id: 'medium', labelEn: 'Medium (e.g. 04 Sep 2026)', labelTa: 'நடுத்தர (04 செப் 2026)' },
  { id: 'day_month', labelEn: 'Day & Month (e.g. 4 September)', labelTa: 'நாள் & மாதம் (4 செப்டம்பர்)' },
  { id: 'short', labelEn: 'Numeric (04/09/2026)', labelTa: 'எண் வடிவம் (04/09/2026)' },
  { id: 'none', labelEn: 'Hide Date', labelTa: 'தேதி மறை' }
];

function getBackgroundLuminance(bg) {
  if (!bg) return 0.1;
  const hexes = bg.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
  if (!hexes || hexes.length === 0) {
    if (bg.includes('white') || bg.includes('255,255,255') || bg.includes('#fff')) return 1;
    return 0.1;
  }
  let totalLum = 0;
  for (const h of hexes) {
    let clean = h.slice(1);
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    totalLum += (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  return totalLum / hexes.length;
}

function formatVerseDate(format, lang) {
  if (format === 'none') return '';
  const now = new Date();
  const locale = lang === 'en' ? 'en-US' : 'ta-IN';
  
  if (format === 'full') {
    return now.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (format === 'medium') {
    return now.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (format === 'day_month') {
    return now.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
  }
  if (format === 'short') {
    return now.toLocaleDateString('en-GB');
  }
  return now.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DailyVerseSection({
  booksMeta,
  onOpenInBible,
  onProjectVerse,
  uiLang = 'ta'
}) {
  const isEn = uiLang === 'en';
  const cardRef = useRef(null);

  // Responsive mobile state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pool & Verse State
  const [dailyPool, setDailyPool] = useState(null);
  const [currentVerseRef, setCurrentVerseRef] = useState(POPULAR_VERSES[0]);
  const [tamilVerseText, setTamilVerseText] = useState('');
  const [kjvVerseText, setKjvVerseText] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Language & Content Mode: 'tamil_only' | 'bilingual' | 'english_only'
  const [contentMode, setContentMode] = useState('bilingual');
  // Reference Language: 'auto' | 'ta' | 'en' | 'both'
  const [refLang, setRefLang] = useState('auto');

  // Customizer Controls State
  const [bgCategory, setBgCategory] = useState('textures'); // 'textures' | 'gradients' | 'custom'
  const [selectedBgType, setSelectedBgType] = useState('texture'); // 'texture' | 'gradient' | 'custom_image' | 'custom_color'
  const [selectedTexture, setSelectedTexture] = useState(TEXTURE_PRESETS[0]);
  const [selectedBg, setSelectedBg] = useState(BG_PRESETS[0].value);
  const [customBg, setCustomBg] = useState('#0c1322');
  const [customImage, setCustomImage] = useState(null);
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState(0.70); // 0 to 0.85 (default 70%)
  const [autoContrast, setAutoContrast] = useState(true);
  const [textColor, setTextColor] = useState('#291b0c');
  const [accentColor, setAccentColor] = useState('#854d0e');
  const [fontFamily, setFontFamily] = useState('Noto Sans Tamil');
  const [fontSize, setFontSize] = useState(30);
  const [lineSpacing, setLineSpacing] = useState(1.75);
  const [letterSpacing, setLetterSpacing] = useState(0.5);
  const [textAlign, setTextAlign] = useState('center');
  const [aspectRatio, setAspectRatio] = useState('auto');
  
  // Date & Tag Settings (Calendar icon removed, customizable format and editable tag text)
  const [dateFormat, setDateFormat] = useState('full');
  const [dateLang, setDateLang] = useState(isEn ? 'en' : 'ta');
  const [cardTagText, setCardTagText] = useState(isEn ? 'DAILY BREAD' : 'அன்றாட மன்னாவும்');
  const [showCardTag, setShowCardTag] = useState(true);

  const [rightTab, setRightTab] = useState('design'); // 'design' | 'saved'

  // Auto Contrast Color Calculation
  const isDarkBg = useMemo(() => {
    if (selectedBgType === 'texture') {
      if (bgOverlayOpacity >= 0.45) return true;
      return selectedTexture ? selectedTexture.isDark : true;
    }
    if (selectedBgType === 'custom_image') {
      return bgOverlayOpacity >= 0.35;
    }
    return getBackgroundLuminance(selectedBg) <= 0.55;
  }, [selectedBgType, selectedTexture, selectedBg, bgOverlayOpacity]);

  const activeTextColor = autoContrast 
    ? (isDarkBg ? '#ffffff' : (selectedBgType === 'texture' && selectedTexture?.text ? selectedTexture.text : '#0f172a')) 
    : textColor;
  const activeAccentColor = autoContrast 
    ? (isDarkBg ? '#e5b965' : (selectedBgType === 'texture' && selectedTexture?.accent ? selectedTexture.accent : '#b45309')) 
    : accentColor;

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('worship_cloud_daily_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load daily pool
  useEffect(() => {
    fetch('./data/dailyVersePool.json')
      .then((r) => r.json())
      .then((d) => {
        if (d?.pool) setDailyPool(d.pool);
      })
      .catch((err) => console.warn('Using popular verses fallback:', err));
  }, []);

  // Pick today's verse deterministically using today's date
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    if (dailyPool && dailyPool.length > 0) {
      const index = (dayOfYear * 73) % dailyPool.length;
      const ref = dailyPool[index];
      const meta = booksMeta.find((b) => b.code === ref.bookId || b.id === ref.bookId);
      setCurrentVerseRef({
        bookCode: ref.bookId,
        bookName: ref.bookName || meta?.name || ref.bookId,
        englishBookName: meta?.english || ref.bookId,
        chapter: ref.chapter,
        verse: ref.verse
      });
    } else {
      const index = dayOfYear % POPULAR_VERSES.length;
      setCurrentVerseRef(POPULAR_VERSES[index]);
    }
  }, [dailyPool, booksMeta]);

  // Load verse texts for currentVerseRef
  useEffect(() => {
    if (!currentVerseRef) return;
    let isCancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`./data/bible/taovbsi/${currentVerseRef.bookCode}.json`).then((r) => r.json()),
      fetch(`./data/bible/kjv/${currentVerseRef.bookCode}.json`).then((r) => r.json()).catch(() => null)
    ])
      .then(([tamilBook, kjvBook]) => {
        if (!isCancelled) {
          const tCh = tamilBook?.chapters?.find((ch) => ch.number === currentVerseRef.chapter);
          const tV = tCh?.verses?.find((v) => v.number === currentVerseRef.verse);
          setTamilVerseText(tV?.text || '');

          const kCh = kjvBook?.chapters?.find((ch) => ch.number === currentVerseRef.chapter);
          const kV = kCh?.verses?.find((v) => v.number === currentVerseRef.verse);
          setKjvVerseText(kV?.text || '');

          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load daily verse text:', err);
        if (!isCancelled) setLoading(false);
      });

    return () => { isCancelled = true; };
  }, [currentVerseRef]);

  // Next Random Verse
  const handleNextRandom = () => {
    if (dailyPool && dailyPool.length > 0) {
      const randIndex = Math.floor(Math.random() * dailyPool.length);
      const ref = dailyPool[randIndex];
      const meta = booksMeta.find((b) => b.code === ref.bookId || b.id === ref.bookId);
      setCurrentVerseRef({
        bookCode: ref.bookId,
        bookName: ref.bookName || meta?.name || ref.bookId,
        englishBookName: meta?.english || ref.bookId,
        chapter: ref.chapter,
        verse: ref.verse
      });
    } else {
      const randIndex = Math.floor(Math.random() * POPULAR_VERSES.length);
      setCurrentVerseRef(POPULAR_VERSES[randIndex]);
    }
  };

  // Magic Randomize / Shuffle All Customizer Options
  const handleRandomizeAll = () => {
    const fonts = TAMIL_FONTS.map(f => f.id);
    const aligns = ['center', 'left'];
    const randFont = fonts[Math.floor(Math.random() * fonts.length)];
    const randAlign = aligns[Math.floor(Math.random() * aligns.length)];
    const randSize = Math.floor(Math.random() * 11) + 26;

    const chooseTexture = Math.random() < 0.65;
    if (chooseTexture) {
      const randTex = TEXTURE_PRESETS[Math.floor(Math.random() * TEXTURE_PRESETS.length)];
      setSelectedBgType('texture');
      setSelectedTexture(randTex);
      setBgCategory('textures');
      setBgOverlayOpacity(randTex.defaultOverlay || 0.70);
      if (!autoContrast) {
        setTextColor(randTex.text);
        setAccentColor(randTex.accent);
      }
    } else {
      const randGrad = BG_PRESETS[Math.floor(Math.random() * BG_PRESETS.length)];
      setSelectedBgType('gradient');
      setSelectedBg(randGrad.value);
      setBgCategory('gradients');
      setBgOverlayOpacity(0);
      if (!autoContrast) {
        setTextColor(randGrad.text);
        setAccentColor(randGrad.accent);
      }
    }

    const randLineSpacing = parseFloat((1.6 + Math.random() * 0.35).toFixed(2));
    const randLetterSpacing = parseFloat((Math.random() * 1.5).toFixed(1));

    setFontFamily(randFont);
    setTextAlign(randAlign);
    setFontSize(randSize);
    setLineSpacing(randLineSpacing);
    setLetterSpacing(randLetterSpacing);
  };

  const handleCustomImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomImage(ev.target.result);
      setSelectedBgType('custom_image');
      setBgCategory('custom');
      setBgOverlayOpacity(0.35);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectFavoriteVerse = (fav) => {
    setCurrentVerseRef({
      bookCode: fav.bookCode,
      bookName: fav.bookName,
      englishBookName: fav.englishBookName,
      chapter: fav.chapter,
      verse: fav.verse
    });
  };

  const effectiveCitation = useMemo(() => {
    const isEngRef = refLang === 'en' || (refLang === 'auto' && contentMode === 'english_only');
    const isBothRef = refLang === 'both';
    
    if (isBothRef) {
      return `${currentVerseRef.bookName} (${currentVerseRef.englishBookName}) ${currentVerseRef.chapter}:${currentVerseRef.verse}`;
    }
    if (isEngRef) {
      return `${currentVerseRef.englishBookName} ${currentVerseRef.chapter}:${currentVerseRef.verse}`;
    }
    return `${currentVerseRef.bookName} ${currentVerseRef.chapter}:${currentVerseRef.verse}`;
  }, [currentVerseRef, refLang, contentMode]);

  const copyDailyCard = () => {
    let textToCopy = '';
    if (contentMode === 'english_only') {
      textToCopy = `"${kjvVerseText}"\n\n${effectiveCitation}`;
    } else if (contentMode === 'tamil_only') {
      textToCopy = `"${tamilVerseText}"\n\n${effectiveCitation}`;
    } else {
      textToCopy = `"${tamilVerseText}"\n\n"${kjvVerseText}"\n\n${effectiveCitation}`;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const id = `${currentVerseRef.bookCode}-${currentVerseRef.chapter}-${currentVerseRef.verse}`;
      const exists = prev.some((f) => f.id === id);
      let updated;
      if (exists) {
        updated = prev.filter((f) => f.id !== id);
      } else {
        updated = [{
          id,
          ...currentVerseRef,
          text: tamilVerseText,
          englishText: kjvVerseText,
          date: new Date().toLocaleDateString(isEn ? 'en-US' : 'ta-IN', { month: 'short', day: 'numeric', year: 'numeric' })
        }, ...prev];
      }
      try {
        localStorage.setItem('worship_cloud_daily_favorites', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isFavorite = favorites.some(
    (f) => f.id === `${currentVerseRef.bookCode}-${currentVerseRef.chapter}-${currentVerseRef.verse}`
  );

  // Download card as high-res PNG image
  const handleDownloadImage = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const cardEl = cardRef.current;
      const canvas = await html2canvas(cardEl, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: null,
        logging: false
      });

      const fileName = `Daily-Verse-${currentVerseRef.englishBookName || currentVerseRef.bookCode}-${currentVerseRef.chapter}-${currentVerseRef.verse}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Dynamic Responsive Font Size to ensure everything fits inside the card
  const effectiveFontSize = useMemo(() => {
    const textToMeasure = contentMode === 'english_only' ? (kjvVerseText || '') : (tamilVerseText || '');
    const textLen = textToMeasure.length;
    let factor = 1;
    if (aspectRatio === '16 / 9') {
      factor = textLen > 160 ? 0.72 : (textLen > 110 ? 0.8 : 0.88);
    } else if (aspectRatio === '1 / 1') {
      factor = textLen > 180 ? 0.82 : (textLen > 120 ? 0.9 : 0.96);
    } else if (aspectRatio === '4 / 5') {
      factor = textLen > 220 ? 0.85 : 1;
    }
    if (lineSpacing > 1.85) {
      factor *= 0.93;
    }
    if (lineSpacing > 2.2) {
      factor *= 0.92;
    }
    return Math.max(15, Math.round(fontSize * factor));
  }, [fontSize, aspectRatio, tamilVerseText, kjvVerseText, contentMode, lineSpacing]);

  const displayDateString = formatVerseDate(dateFormat, dateLang);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box',
      padding: '0.45rem 0.85rem 0.5rem 0.85rem',
      backgroundColor: 'var(--bg-canvas)'
    }}>
      {/* 100% Top Box Card Header (matching Bible & Songs section box header) */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.15rem',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '0.65rem'
      }}>
        {/* Left: Box Title (No extra badges or subtitle texts) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SunMedium size={22} style={{ color: 'var(--accent)' }} />
          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            {isEn ? 'Daily Bible Verse' : 'அன்றாட வேத வசனம்'}
          </h1>
        </div>

        {/* Right: Quick Action Controls (Moved to Top Right) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Download Image (Primary) */}
          <button
            onClick={handleDownloadImage}
            disabled={isExporting || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 750,
              cursor: isExporting ? 'wait' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease'
            }}
            title={isEn ? 'Download card as high-res PNG image' : 'அட்டையை படமாக பதிவிறக்குக'}
          >
            <Download size={14} />
            <span>{isExporting ? (isEn ? 'Generating...' : 'உருவாக்குகிறது...') : (isEn ? 'Download Image' : 'படமாக பதிவிறக்கு')}</span>
          </button>

          {/* Randomize All Styles */}
          <button
            onClick={handleRandomizeAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title={isEn ? 'Randomize background, fonts & all design styles' : 'அனைத்து பாணிகளையும் மாற்றியமை'}
          >
            <Sparkles size={14} />
            <span>{isEn ? 'Randomize' : 'பாணி மாற்று'}</span>
          </button>

          {/* New Verse */}
          <button
            onClick={handleNextRandom}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 11px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              fontWeight: 650,
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title={isEn ? 'Get another verse' : 'புதிய வசனம்'}
          >
            <RotateCw size={13} style={{ color: 'var(--accent)' }} />
            <span>{isEn ? 'New Verse' : 'புதிய வசனம்'}</span>
          </button>

          {/* Save / Favorite */}
          <button
            onClick={toggleFavorite}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 11px',
              borderRadius: '8px',
              backgroundColor: isFavorite ? 'var(--accent-light)' : 'var(--bg-canvas)',
              border: `1px solid ${isFavorite ? 'var(--accent)' : 'var(--border-subtle)'}`,
              color: isFavorite ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 650,
              cursor: 'pointer'
            }}
          >
            <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
            <span>{isFavorite ? (isEn ? 'Saved' : 'சேமிக்கப்பட்டது') : (isEn ? 'Save' : 'சேமி')}</span>
          </button>

          {/* Copy Text */}
          <button
            onClick={copyDailyCard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 11px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: copied ? 'var(--accent)' : 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 650,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? (isEn ? 'Copied' : 'பிரதி செய்யப்பட்டது') : (isEn ? 'Copy' : 'பிரதி')}</span>
          </button>

          {/* Project */}
          <button
            onClick={() => onProjectVerse({
              bookName: currentVerseRef.bookName,
              englishBookName: currentVerseRef.englishBookName,
              bookCode: currentVerseRef.bookCode,
              chapterNumber: currentVerseRef.chapter,
              verseNumber: currentVerseRef.verse,
              text: tamilVerseText,
              englishText: kjvVerseText
            })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 11px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 650,
              cursor: 'pointer'
            }}
          >
            <Tv size={14} style={{ color: 'var(--accent)' }} />
            <span>{isEn ? 'Project' : 'திரையிடு'}</span>
          </button>

          {/* Full Chapter */}
          <button
            onClick={() => onOpenInBible(currentVerseRef.bookCode, currentVerseRef.chapter, currentVerseRef.verse)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 11px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 650,
              cursor: 'pointer'
            }}
          >
            <BookOpen size={14} />
            <span>{isEn ? 'Chapter' : 'அதிகாரம்'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Desktop 2-Column, Mobile Top Portion Fixed Preview + Bottom Portion Scrollable Controls */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        gridTemplateColumns: isMobile ? undefined : 'minmax(350px, 1.25fr) minmax(330px, 1fr)',
        gap: isMobile ? '0.5rem' : '0.85rem',
        overflow: 'hidden',
        alignItems: 'stretch'
      }}>
        {/* ===================================================================== */}
        {/* PREVIEW CARD: Desktop Left Column (Scrollable), Mobile Fixed Top Portion */}
        {/* ===================================================================== */}
        <div style={{
          height: isMobile ? '38vh' : '100%',
          flexShrink: isMobile ? 0 : 1,
          overflowY: isMobile ? 'auto' : 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isMobile ? 'center' : 'flex-start',
          padding: isMobile ? '0.35rem' : '0.5rem 0.5rem 2.5rem 0.5rem',
          boxSizing: 'border-box',
          width: '100%',
          backgroundColor: isMobile ? 'var(--bg-surface)' : 'transparent',
          borderRadius: isMobile ? '10px' : 0,
          border: isMobile ? '1px solid var(--border-subtle)' : 'none'
        }}>
          {/* The Live Interactive Verse Card (No Watermark, No Calendar Icon, Auto-Fitting Font) */}
          <div
            ref={cardRef}
            style={{
              background: (selectedBgType === 'gradient' || selectedBgType === 'custom_color') ? selectedBg : '#0c1322',
              color: activeTextColor,
              borderRadius: isMobile ? '14px' : '20px',
              border: isDarkBg ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 15px 35px -8px rgba(0,0,0,0.45)',
              padding: isMobile ? '1rem 1.2rem' : '2rem 2rem',
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              maxWidth: isMobile ? '340px' : (aspectRatio === '16 / 9' ? '720px' : (aspectRatio === '1 / 1' ? '460px' : (aspectRatio === '4 / 5' ? '400px' : '560px'))),
              aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio,
              minHeight: aspectRatio === 'auto' ? (isMobile ? '200px' : '340px') : undefined,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
              transform: isMobile ? 'scale(0.88)' : 'none',
              transformOrigin: 'center center'
            }}
          >
            {/* Background Texture or Custom Image Layer */}
            {(selectedBgType === 'texture' || (selectedBgType === 'custom_image' && customImage)) && (
              <img
                src={selectedBgType === 'texture' ? selectedTexture.src : customImage}
                alt="Card Background"
                crossOrigin="anonymous"
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
            )}

            {/* Darkness / Contrast Scrim Overlay */}
            {bgOverlayOpacity > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: `rgba(0, 0, 0, ${bgOverlayOpacity})`,
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Background subtle ornament */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              opacity: isDarkBg ? 0.05 : 0.035,
              color: activeAccentColor,
              pointerEvents: 'none',
              zIndex: 1
            }}>
              <BookOpen size={200} />
            </div>

            {/* Card Inner Content (Layered above background and overlay) */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              flex: 1,
              minHeight: 0
            }}>
              {/* Card Top: Header Tag Text & Date Display (No Calendar Icon!) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                opacity: 0.9,
                fontSize: '0.78rem',
                fontWeight: 650,
                flexShrink: 0
              }}>
                {/* Date string without calendar icon */}
                {dateFormat !== 'none' ? (
                  <span>{displayDateString}</span>
                ) : <span />}

                {/* Editable Header Tag Text */}
                {showCardTag && cardTagText.trim() && (
                  <span style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.09em',
                    fontWeight: 800,
                    color: activeAccentColor
                  }}>
                    {cardTagText.trim()}
                  </span>
                )}
              </div>

              {/* Card Middle: Scripture Text (Auto-fitted font size so all elements are visible) */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: textAlign,
                padding: '0.4rem 0',
                minHeight: 0,
                overflow: 'hidden'
              }}>
                {loading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
                    {isEn ? "Loading today's verse..." : 'இன்றைய வசனம் ஏற்றப்படுகிறது...'}
                  </div>
                ) : (
                  <>
                    {/* English Only Mode */}
                    {contentMode === 'english_only' && (
                      <blockquote style={{
                        fontSize: `${effectiveFontSize}px`,
                        lineHeight: lineSpacing,
                        fontWeight: 650,
                        fontFamily: 'serif',
                        fontStyle: 'italic',
                        color: activeTextColor,
                        margin: 0,
                        letterSpacing: `${letterSpacing}px`,
                        wordSpacing: `${Math.max(1, letterSpacing * 1.5)}px`
                      }}>
                        “{kjvVerseText || tamilVerseText}”
                      </blockquote>
                    )}

                    {/* Tamil Only Mode */}
                    {contentMode === 'tamil_only' && (
                      <blockquote style={{
                        fontSize: `${effectiveFontSize}px`,
                        lineHeight: lineSpacing,
                        fontWeight: (fontFamily?.includes('Baloo') || fontFamily?.includes('Anek') || fontFamily?.includes('Mukta')) ? 800 : 750,
                        fontFamily: fontFamily.includes(',') ? fontFamily : `'${fontFamily}', 'Noto Sans Tamil', sans-serif`,
                        color: activeTextColor,
                        margin: 0,
                        letterSpacing: `${letterSpacing}px`,
                        wordSpacing: `${Math.max(1, letterSpacing * 1.5)}px`
                      }}>
                        “{tamilVerseText}”
                      </blockquote>
                    )}

                    {/* Bilingual Mode (Tamil + English) */}
                    {contentMode === 'bilingual' && (
                      <>
                        <blockquote style={{
                          fontSize: `${effectiveFontSize}px`,
                          lineHeight: lineSpacing,
                          fontWeight: (fontFamily?.includes('Baloo') || fontFamily?.includes('Anek') || fontFamily?.includes('Mukta')) ? 800 : 750,
                          fontFamily: fontFamily.includes(',') ? fontFamily : `'${fontFamily}', 'Noto Sans Tamil', sans-serif`,
                          color: activeTextColor,
                          margin: 0,
                          letterSpacing: `${letterSpacing}px`,
                          wordSpacing: `${Math.max(1, letterSpacing * 1.5)}px`
                        }}>
                          “{tamilVerseText}”
                        </blockquote>

                        {kjvVerseText && (
                          <p style={{
                            fontSize: `${Math.max(13, Math.round(effectiveFontSize * 0.58))}px`,
                            lineHeight: Math.max(1.35, parseFloat((lineSpacing * 0.88).toFixed(2))),
                            opacity: 0.88,
                            fontFamily: 'serif',
                            fontStyle: 'italic',
                            marginTop: '0.8rem',
                            marginBottom: 0,
                            paddingTop: '0.6rem',
                            borderTop: isDarkBg ? '1px dashed rgba(255,255,255,0.2)' : '1px dashed rgba(0,0,0,0.15)',
                            letterSpacing: `${(letterSpacing * 0.6).toFixed(1)}px`
                          }}>
                            "{kjvVerseText}"
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Card Bottom: Reference Citation (NO dash or symbol!) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: textAlign === 'center' ? 'center' : (textAlign === 'right' ? 'flex-end' : 'flex-start'),
                marginTop: '1rem',
                paddingTop: '0.8rem',
                borderTop: isDarkBg ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                flexShrink: 0
              }}>
                <div style={{
                  fontSize: `${Math.max(14, Math.round(effectiveFontSize * 0.68))}px`,
                  fontWeight: 850,
                  color: activeAccentColor,
                  letterSpacing: '0.01em',
                  textAlign: textAlign
                }}>
                  {effectiveCitation}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT COLUMN: Customizer Settings Panel & Saved Cards Library         */}
        {/* ===================================================================== */}
        <div style={{
          flex: 1,
          minHeight: 0,
          height: isMobile ? 'calc(100% - 38vh - 0.5rem)' : '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
          paddingRight: '4px',
          paddingBottom: isMobile ? '1.5rem' : '2.5rem',
          boxSizing: 'border-box'
        }}>
          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            padding: '3px',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => setRightTab('design')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: rightTab === 'design' ? 'var(--accent-light)' : 'transparent',
                color: rightTab === 'design' ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: 750,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <Palette size={14} />
              <span>{isEn ? 'Design & Customizer' : 'வடிவமைப்பு & பாணிகள்'}</span>
            </button>

            <button
              type="button"
              onClick={() => setRightTab('saved')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: rightTab === 'saved' ? 'var(--accent-light)' : 'transparent',
                color: rightTab === 'saved' ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: 750,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <Bookmark size={14} />
              <span>{isEn ? `Saved Cards (${favorites.length})` : `சேமித்தவை (${favorites.length})`}</span>
            </button>
          </div>

          {/* TAB 1: CARD CUSTOMIZER */}
          {rightTab === 'design' && (
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* 1. Language & Verse Display Controls (Combined Single Control) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                  {isEn ? 'Scripture Content Display' : 'வசனம் மற்றும் மொழித் தேர்வு'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '4px' }}>
                  {[
                    { id: 'tamil_only', label: isEn ? 'Tamil Only' : 'தமிழ் மட்டும்' },
                    { id: 'bilingual', label: isEn ? 'Tamil + English' : 'தமிழ் + ஆங்கிலம்' },
                    { id: 'english_only', label: isEn ? 'English Only' : 'English மட்டும்' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setContentMode(m.id)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: contentMode === m.id ? 'var(--accent-light)' : 'var(--bg-canvas)',
                        color: contentMode === m.id ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Reference Language Option */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 650 }}>
                    {isEn ? 'Reference Language' : 'குறிப்பு புத்தக மொழி'}
                  </span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[
                      { id: 'auto', label: 'Auto' },
                      { id: 'ta', label: 'தமிழ்' },
                      { id: 'en', label: 'English' },
                      { id: 'both', label: 'Both' }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRefLang(r.id)}
                        style={{
                          padding: '2px 7px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: refLang === r.id ? 'var(--accent-light)' : 'var(--bg-canvas)',
                          color: refLang === r.id ? 'var(--accent)' : 'var(--text-tertiary)',
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Background Themes & Textures (Textures / Gradients / Custom) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                    {isEn ? 'Background Theme & Art' : 'பின்னணி தீம்கள் & படங்கள்'}
                  </label>
                  
                  {/* Auto Contrast Toggle */}
                  <button
                    type="button"
                    onClick={() => setAutoContrast(!autoContrast)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      border: `1px solid ${autoContrast ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      backgroundColor: autoContrast ? 'var(--accent-light)' : 'transparent',
                      color: autoContrast ? 'var(--accent)' : 'var(--text-tertiary)',
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="Automatically adjust text & accent colors for maximum contrast"
                  >
                    {isEn ? 'Auto Contrast: ' : 'மாறுபாடு: '} {autoContrast ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Background Category Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '3px',
                  backgroundColor: 'var(--bg-canvas)',
                  padding: '3px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {[
                    { id: 'textures', label: isEn ? `Textures & Photos (${TEXTURE_PRESETS.length})` : `படங்கள் & அமைப்புகள் (${TEXTURE_PRESETS.length})` },
                    { id: 'gradients', label: isEn ? `Gradients (${BG_PRESETS.length})` : `வண்ணக் கலவை (${BG_PRESETS.length})` },
                    { id: 'custom', label: isEn ? 'Custom / Upload' : 'தனிப்பயன்' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setBgCategory(cat.id)}
                      style={{
                        flex: 1,
                        padding: '5px 2px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: bgCategory === cat.id ? 'var(--accent-light)' : 'transparent',
                        color: bgCategory === cat.id ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* CATEGORY A: TEXTURES & PHOTOS (15 PRESETS) */}
                {bgCategory === 'textures' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '6px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    paddingRight: '2px'
                  }}>
                    {TEXTURE_PRESETS.map((t) => {
                      const isSelected = selectedBgType === 'texture' && selectedTexture?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedBgType('texture');
                            setSelectedTexture(t);
                            setBgOverlayOpacity(t.defaultOverlay);
                            if (!autoContrast) {
                              setTextColor(t.text);
                              setAccentColor(t.accent);
                            }
                          }}
                          style={{
                            height: '56px',
                            borderRadius: '7px',
                            border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            padding: 0,
                            boxShadow: isSelected ? '0 0 0 2px var(--accent-light)' : 'none',
                            transition: 'transform 0.15s ease'
                          }}
                          title={isEn ? t.label : t.labelTa}
                        >
                          <img
                            src={t.src}
                            alt={t.label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.1) 60%)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            padding: '3px 4px'
                          }}>
                            <span style={{
                              color: '#ffffff',
                              fontSize: '0.62rem',
                              fontWeight: 750,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '100%',
                              textAlign: 'left'
                            }}>
                              {isEn ? t.label : t.labelTa}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* CATEGORY B: GRADIENTS (18 PRESETS) */}
                {bgCategory === 'gradients' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '5px' }}>
                    {BG_PRESETS.map((p) => {
                      const isSelected = selectedBgType === 'gradient' && selectedBg === p.value;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedBgType('gradient');
                            setSelectedBg(p.value);
                            setBgOverlayOpacity(0);
                            if (!autoContrast) {
                              setTextColor(p.text);
                              setAccentColor(p.accent);
                            }
                          }}
                          style={{
                            height: '28px',
                            borderRadius: '5px',
                            background: p.value,
                            border: isSelected ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.15)',
                            cursor: 'pointer',
                            boxShadow: isSelected ? '0 0 0 2px var(--accent-light)' : 'none'
                          }}
                          title={p.label}
                        />
                      );
                    })}
                  </div>
                )}

                {/* CATEGORY C: CUSTOM IMAGE UPLOAD & SOLID COLOR */}
                {bgCategory === 'custom' && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '8px',
                    backgroundColor: 'var(--bg-canvas)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {/* Custom Image Upload */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <label style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px dashed var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.74rem',
                        fontWeight: 650,
                        cursor: 'pointer'
                      }}>
                        <Upload size={13} style={{ color: 'var(--accent)' }} />
                        <span>{isEn ? 'Upload Photo/Texture' : 'படம் / அமைப்பு பதிவேற்று'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCustomImageUpload}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {customImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomImage(null);
                            setSelectedBgType('texture');
                          }}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: '#ef4444',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                          title="Remove uploaded image"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Custom Solid Color */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 650 }}>
                        {isEn ? 'Custom Hex Color' : 'தனிப்பயன் நிறம்'}
                      </span>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <input
                          type="color"
                          value={customBg}
                          onChange={(e) => {
                            setCustomBg(e.target.value);
                            setSelectedBg(e.target.value);
                            setSelectedBgType('custom_color');
                          }}
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                        />
                        <span style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          backgroundColor: customBg,
                          border: '1px solid var(--border-subtle)',
                          display: 'inline-block'
                        }} />
                        <span>{customBg}</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Overlay Darkness Slider (Available for all backgrounds to adjust contrast) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 650, color: 'var(--text-tertiary)' }}>
                      {isEn ? 'Darkness Scrim Overlay' : 'பின்னணி இருள் அளவு (Contrast)'}
                    </label>
                    <span style={{ fontSize: '0.7rem', fontWeight: 750, color: 'var(--accent)' }}>
                      {Math.round(bgOverlayOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.85"
                    step="0.05"
                    value={bgOverlayOpacity}
                    onChange={(e) => setBgOverlayOpacity(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>

              {/* 3. Text & Accent Colors (Hidden when Auto Contrast is active) */}
              {!autoContrast && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Text Color */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                        {isEn ? 'Text Color' : 'உரை நிறம்'}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                        />
                        <span style={{
                          width: '13px',
                          height: '13px',
                          borderRadius: '50%',
                          backgroundColor: textColor,
                          border: '1px solid var(--border-subtle)',
                          display: 'inline-block'
                        }} />
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {['#ffffff', '#fef08a', '#fde047', '#94a3b8', '#0f172a'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTextColor(c)}
                          style={{
                            flex: 1,
                            height: '18px',
                            borderRadius: '3px',
                            backgroundColor: c,
                            border: `1.5px solid ${textColor === c ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                        {isEn ? 'Accent Color' : 'குறிப்பு நிறம்'}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                        />
                        <span style={{
                          width: '13px',
                          height: '13px',
                          borderRadius: '50%',
                          backgroundColor: accentColor,
                          border: '1px solid var(--border-subtle)',
                          display: 'inline-block'
                        }} />
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {['#e5b965', '#38bdf8', '#34d399', '#f472b6', '#fbbf24'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAccentColor(c)}
                          style={{
                            flex: 1,
                            height: '18px',
                            borderRadius: '3px',
                            backgroundColor: c,
                            border: `1.5px solid ${accentColor === c ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Font Typography (14 Tamil Supported Fonts) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                  {isEn ? `Tamil Font Family (${TAMIL_FONTS.length} Fonts)` : `தமிழ் எழுத்துருக்கள் (${TAMIL_FONTS.length} தேர்வுகள்)`}
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 650,
                    outline: 'none'
                  }}
                >
                  {TAMIL_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Font Size & Alignment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                      {isEn ? 'Base Font Size' : 'எழுத்து அளவு'}
                    </label>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent)' }}>
                      {fontSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="48"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                    {isEn ? 'Alignment' : 'சீரமைப்பு'}
                  </label>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[
                      { id: 'left', icon: <AlignLeft size={13} /> },
                      { id: 'center', icon: <AlignCenter size={13} /> },
                      { id: 'right', icon: <AlignRight size={13} /> }
                    ].map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setTextAlign(a.id)}
                        style={{
                          flex: 1,
                          padding: '5px 0',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: textAlign === a.id ? 'var(--accent-light)' : 'var(--bg-canvas)',
                          color: textAlign === a.id ? 'var(--accent)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {a.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5b. Line Spacing & Letter Spacing Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                {/* Line Spacing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                      {isEn ? 'Line Spacing' : 'வரி இடைவெளி'}
                    </label>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent)' }}>
                      {lineSpacing.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.2"
                    max="2.6"
                    step="0.05"
                    value={lineSpacing}
                    onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>

                {/* Letter Spacing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                      {isEn ? 'Letter Spacing' : 'எழுத்து இடைவெளி'}
                    </label>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent)' }}>
                      {letterSpacing}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.5"
                    value={letterSpacing}
                    onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>

              {/* 6. Dimensions & Aspect Ratio */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                  {isEn ? 'Card Dimensions / Ratio' : 'அளவு விகிதம் (Aspect Ratio)'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {RATIO_OPTIONS.map((ro) => (
                    <button
                      key={ro.id}
                      type="button"
                      onClick={() => setAspectRatio(ro.ratio)}
                      style={{
                        padding: '6px 3px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: aspectRatio === ro.ratio ? 'var(--accent-light)' : 'var(--bg-canvas)',
                        color: aspectRatio === ro.ratio ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div>{ro.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Date Format & Editable Header Tag (No Calendar Icon!) */}
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {/* Date Format Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                      {isEn ? 'Date Format' : 'தேதி வடிவம்'}
                    </label>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <button
                        type="button"
                        onClick={() => setDateLang('ta')}
                        style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: dateLang === 'ta' ? 'var(--accent-light)' : 'transparent',
                          color: dateLang === 'ta' ? 'var(--accent)' : 'var(--text-tertiary)',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        தமிழ்
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateLang('en')}
                        style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: dateLang === 'en' ? 'var(--accent-light)' : 'transparent',
                          color: dateLang === 'en' ? 'var(--accent)' : 'var(--text-tertiary)',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        English
                      </button>
                    </div>
                  </div>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-primary)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    {DATE_FORMATS.map((df) => (
                      <option key={df.id} value={df.id}>
                        {isEn ? df.labelEn : df.labelTa}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Editable Header Tag Text Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                      {isEn ? 'Custom Header Tag' : 'தலைப்பு உரை (Header Tag)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCardTag(!showCardTag)}
                      style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: showCardTag ? 'var(--accent)' : 'var(--border-subtle)',
                        color: showCardTag ? 'var(--accent-contrast)' : 'var(--text-tertiary)',
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {showCardTag ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={cardTagText}
                    onChange={(e) => setCardTagText(e.target.value)}
                    placeholder={isEn ? 'e.g. DAILY BREAD, GOD IS LOVE' : 'எ.கா: அன்றாட மன்னாவும்'}
                    disabled={!showCardTag}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: showCardTag ? 'var(--bg-canvas)' : 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 650,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAVED CARDS ARCHIVE */}
          {rightTab === 'saved' && (
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
              maxHeight: '520px',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ⭐ {isEn ? 'Favorite Verses' : 'சேமிக்கப்பட்ட வசனங்கள்'} ({favorites.length})
                </span>
                {favorites.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(isEn ? 'Clear all saved daily verses?' : 'சேமிக்கப்பட்ட அனைத்து வசனங்களையும் அழிக்கவா?')) {
                        setFavorites([]);
                        localStorage.removeItem('worship_cloud_daily_favorites');
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '0.7rem',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontWeight: 650
                    }}
                  >
                    {isEn ? 'Clear All' : 'அனைத்தும் நீக்கு'}
                  </button>
                )}
              </div>

              {favorites.length === 0 ? (
                <div style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.8rem'
                }}>
                  <Bookmark size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
                  <div>{isEn ? 'No saved verses yet. Click "Save" in the header.' : 'இன்னும் வசனங்கள் சேமிக்கப்படவில்லை. மேலேயுள்ள "சேமி" பொத்தானை அழுத்தவும்.'}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      onClick={() => handleSelectFavoriteVerse(fav)}
                      style={{
                        backgroundColor: 'var(--bg-canvas)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.84rem' }}>
                          {isEn ? fav.englishBookName : fav.bookName} {fav.chapter}:{fav.verse}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavorites((prev) => {
                              const updated = prev.filter((f) => f.id !== fav.id);
                              localStorage.setItem('worship_cloud_daily_favorites', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          title={isEn ? 'Delete from saved' : 'நீக்கு'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <p style={{
                        fontSize: '0.78rem',
                        lineHeight: 1.45,
                        color: 'var(--text-secondary)',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {fav.text}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '4px',
                        borderTop: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                          {fav.date}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInBible(fav.bookCode, fav.chapter, fav.verse);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span>{isEn ? 'Read' : 'வாசி'}</span>
                          <BookOpen size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
