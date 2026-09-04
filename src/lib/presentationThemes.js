/**
 * Presentation Themes, Background Textures, and Typography presets
 * for the Lyrics to PDF/PPTX Converter.
 */

export const SLIDE_THEMES = [
  { id: 'dark', name: 'Dark Obsidian', nameTa: 'கருப்பு', bg: '#0d1117', text: '#ffffff', border: '#30363d' },
  { id: 'gold', name: 'Navy & Gold', nameTa: 'நேவி & தங்கம்', bg: '#121824', text: '#fdfbf7', border: '#2f3e57' },
  { id: 'pure_black', name: 'Pure Black', nameTa: 'தூய கருப்பு', bg: '#000000', text: '#ffffff', border: '#27272a' },
  { id: 'white', name: 'Pristine White', nameTa: 'வெள்ளை', bg: '#ffffff', text: '#0f172a', border: '#cbd5e1' },
  { id: 'sepia', name: 'Warm Parchment', nameTa: 'சுருளேடு', bg: '#fdfbf7', text: '#1c1917', border: '#d6c7b2' },
  { id: 'emerald', name: 'Sacred Emerald', nameTa: 'மரகதம்', bg: '#081c18', text: '#edfbf7', border: '#1b423b' },
  { id: 'crimson', name: 'Velvet Crimson', nameTa: 'செந்நிறம்', bg: '#1e0a10', text: '#fff1f2', border: '#4c0519' },
  { id: 'indigo', name: 'Royal Cobalt', nameTa: 'அடர் நீலம்', bg: '#0c1322', text: '#f8fafc', border: '#1e293b' },
  { id: 'purple', name: 'Cosmic Violet', nameTa: 'ஊதா', bg: '#13091f', text: '#fbf7ff', border: '#3b0764' },
  { id: 'ocean', name: 'Oceanic Teal', nameTa: 'ஆழ்கடல்', bg: '#041f24', text: '#ecfeff', border: '#155e75' }
];

export const SLIDE_TEXTURES = [
  {
    id: 'sunbeams',
    label: 'Heavenly Sunbeams',
    labelTa: 'விண்ணக கதிர்கள்',
    src: './images/card-backgrounds/sunbeams.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'sunbeams_golden',
    label: 'Golden Burst Rays',
    labelTa: 'பொன்மலர் கதிர்கள்',
    src: './images/card-backgrounds/sunbeams-golden.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'heavenly_dawn',
    label: 'Heavenly Dawn',
    labelTa: 'விடியற்காலை ஒளி',
    src: './images/card-backgrounds/heavenly-dawn.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'heavenly_glory',
    label: 'Radiant Sunburst',
    labelTa: 'சூரியக்கதிர்கள்',
    src: './images/card-backgrounds/heavenly-glory.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'blue_heaven',
    label: 'Blue Sky & Light',
    labelTa: 'நீல வான மேகங்கள்',
    src: './images/card-backgrounds/blue-heaven.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'clouds_golden',
    label: 'Golden Rim Clouds',
    labelTa: 'பொன் மேகங்கள்',
    src: './images/card-backgrounds/clouds-golden.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'amethyst_clouds',
    label: 'Amethyst Twilight',
    labelTa: 'அந்தி வானம்',
    src: './images/card-backgrounds/amethyst-clouds.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'golden_hour',
    label: 'Golden Hour Glow',
    labelTa: 'மாலை ஒளிக்கீற்று',
    src: './images/card-backgrounds/golden-hour-rays.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'sacred_light',
    label: 'Cathedral Arch Light',
    labelTa: 'தேவாலய ஒளி',
    src: './images/card-backgrounds/sacred-light-chapel.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'church_light',
    label: 'Sanctuary Light',
    labelTa: 'பரிசுத்த பிரசன்னம்',
    src: './images/card-backgrounds/church-light.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'linen',
    label: 'Woven Linen Fabric',
    labelTa: 'சணல் துணி',
    src: './images/card-backgrounds/linen.jpg',
    defaultOverlay: 0.25
  },
  {
    id: 'clean_parchment',
    label: 'Ancient Parchment',
    labelTa: 'சுருளேடு காகிதம்',
    src: './images/card-backgrounds/clean-parchment.jpg',
    defaultOverlay: 0.25
  },
  {
    id: 'pure_marble',
    label: 'Carrara White Marble',
    labelTa: 'வெள்ளை பளிங்கு',
    src: './images/card-backgrounds/pure-marble.jpg',
    defaultOverlay: 0.25
  },
  {
    id: 'calm_waters',
    label: 'Still Waters',
    labelTa: 'அமைதியான நன்னீர்',
    src: './images/card-backgrounds/calm-waters.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'mountain',
    label: 'Misty Mountains',
    labelTa: 'பனிமலை சிகரம்',
    src: './images/card-backgrounds/mountain.jpg',
    defaultOverlay: 0.65
  },
  {
    id: 'cosmos',
    label: 'Starry Cosmos',
    labelTa: 'விண்மீன் மண்டலம்',
    src: './images/card-backgrounds/cosmos.jpg',
    defaultOverlay: 0.55
  },
  {
    id: 'sunset',
    label: 'Sunset Horizon',
    labelTa: 'அந்தி வானம்',
    src: './images/card-backgrounds/sunset.jpg',
    defaultOverlay: 0.65
  }
];

export const SLIDE_FONTS = [
  { id: 'Nirmala UI', label: 'Nirmala UI (Windows / Office)' },
  { id: 'Baloo Thambi 2', label: 'Baloo Thambi 2 (பாலூ - தடித்த நவீன வடிவம்)' },
  { id: 'TAMIL-UNI031', label: 'Tamil Unicode 31 (தனித்துவ வடிவம்)' },
  { id: 'Noto Sans Tamil', label: 'Noto Sans Tamil (நவீன இயல்பு)' },
  { id: 'Segoe UI', label: 'Segoe UI' },
  { id: 'Calibri', label: 'Calibri' }
];

export function getSlideTheme(themeId) {
  return SLIDE_THEMES.find((t) => t.id === themeId) || SLIDE_THEMES[0];
}

/**
 * Calculates a safe, consistent font size in pixels for a 1920x1080 (or 1600x1200) slide canvas.
 * Balances user slider preference (24pt - 90pt) with auto-fit protection so that
 * long stanzas never spill over or cut off.
 */
export function calculateSlideFontSize(lines = [], requestedFontSize = 34, aspectRatio = '16x9') {
  const targetH = aspectRatio === '4x3' ? 1200 : 1080;
  const availH = targetH - 180; // 900px safe content height
  const baseSize = Math.round(requestedFontSize * (aspectRatio === '4x3' ? 1.05 : 1.16));

  // Estimate wrapped lines based on character length
  const estimatedLines = (lines || []).reduce((acc, line) => {
    const len = String(line || '').trim().length;
    if (len === 0) return acc;
    // For Tamil display fonts, ~32 characters comfortably fit in ~1600px width at 75-80px
    const wraps = Math.max(1, Math.ceil(len / 32));
    return acc + wraps;
  }, 0);

  // Maximum font size that physically fits inside safe height with 1.48 line-height
  const maxSafeSize = Math.floor(availH / (Math.max(1, estimatedLines) * 1.48));

  // Returns safe size respecting user preference up to maxSafeSize
  return Math.max(26, Math.min(baseSize, maxSafeSize));
}

/**
 * Calculates safe font sizes for the Title slide
 */
export function calculateTitleSlideFontSize(requestedFontSize = 34) {
  return {
    titleSize: Math.min(105, Math.max(48, Math.round(requestedFontSize * 1.35))),
    subtitleSize: Math.min(52, Math.max(26, Math.round(requestedFontSize * 0.72)))
  };
}
