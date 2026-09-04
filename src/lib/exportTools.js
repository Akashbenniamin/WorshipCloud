import { jsPDF } from 'jspdf';
import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';
import { splitSongSections } from './songParser';

/**
 * Exports a song's lyrics as a formatted PDF song sheet with native Tamil font rendering.
 */
export async function exportSongToPdf(songTitle, lyrics, subtitle = '', options = {}) {
  const {
    pallaviIndices = [0],
    isEn = false
  } = options;

  // Wait for web fonts to load
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // continue
    }
  }

  const cleanTitle = songTitle || 'பாடல் வரிகள்';
  const cleanSubtitle = subtitle && !subtitle.toLowerCase().includes('adorehim') ? subtitle : '';

  // Render song sheet inside an offscreen wrapper on top (positive zIndex ensures html2canvas renders it cleanly)
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '0';
  wrapper.style.top = '0';
  wrapper.style.width = '794px'; // A4 width at 96 DPI
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.zIndex = '999999';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.boxSizing = 'border-box';

  const sections = splitSongSections(lyrics);

  // Label Pallavi and Saranam stanzas dynamically based on user selection
  const totalPallavis = sections.filter((_, idx) => (pallaviIndices || [0]).includes(idx)).length;
  let pallaviCounter = 1;
  let saranamCounter = 1;

  let sectionsHtml = '';
  if (sections && sections.length > 0) {
    sectionsHtml = sections.map((sec, idx) => {
      const isPallavi = (pallaviIndices || [0]).includes(idx);
      let label = '';
      if (isPallavi) {
        if (totalPallavis > 1) {
          label = isEn ? `CHORUS ${pallaviCounter}` : `பல்லவி ${pallaviCounter}`;
          pallaviCounter++;
        } else {
          label = isEn ? 'CHORUS / PALLAVI' : 'பல்லவி';
        }
      } else {
        label = isEn ? `VERSE ${saranamCounter}` : `சரணம் ${saranamCounter}`;
        saranamCounter++;
      }

      return `
        <div style="margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid;">
          <div style="font-size: 11px; font-weight: 800; color: ${isPallavi ? '#2563eb' : '#64748b'}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; font-family: 'Noto Sans Tamil', 'Inter', sans-serif;">${label}</div>
          <div style="font-size: 15px; line-height: 1.85; color: #0f172a; white-space: pre-line; font-family: 'Noto Sans Tamil', 'Inter', sans-serif; font-weight: 500;">${sec.text.trim()}</div>
        </div>
      `;
    }).join('');
  } else {
    sectionsHtml = `
      <div style="font-size: 15px; line-height: 1.85; color: #0f172a; white-space: pre-line; font-family: 'Noto Sans Tamil', 'Inter', sans-serif; font-weight: 500;">${lyrics.trim()}</div>
    `;
  }

  wrapper.innerHTML = `
    <div style="width: 794px; padding: 48px 52px 42px 52px; box-sizing: border-box; background-color: #ffffff; color: #0f172a; font-family: 'Noto Sans Tamil', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
      <div style="border-bottom: 2.5px solid #0f172a; padding-bottom: 14px; margin-bottom: 26px;">
        <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; font-family: 'Noto Sans Tamil', 'Inter', sans-serif; line-height: 1.3;">
          ${cleanTitle}
        </h1>
        ${cleanSubtitle ? `<div style="font-size: 13.5px; color: #64748b; font-weight: 600; font-family: 'Noto Sans Tamil', 'Inter', sans-serif;">${cleanSubtitle}</div>` : ''}
      </div>

      <div>
        ${sectionsHtml}
      </div>

      <div style="margin-top: 40px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; font-family: 'Noto Sans Tamil', 'Inter', sans-serif;">
        <span>Worship Cloud Song Sheet</span>
        <span>${new Date().toLocaleDateString()}</span>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
      windowHeight: wrapper.offsetHeight
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const a4WidthMm = 210;
    const a4HeightMm = 297;
    const pxPerMm = canvas.width / a4WidthMm;
    const a4HeightPx = Math.round(a4HeightMm * pxPerMm);

    let renderedHeight = 0;
    let pageIndex = 0;

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = a4HeightPx;
    const pageCtx = pageCanvas.getContext('2d');

    while (renderedHeight < canvas.height) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      pageCtx.fillStyle = '#ffffff';
      pageCtx.fillRect(0, 0, pageCanvas.width, a4HeightPx);

      const sliceHeight = Math.min(a4HeightPx, canvas.height - renderedHeight);
      pageCtx.drawImage(
        canvas,
        0, renderedHeight, canvas.width, sliceHeight,
        0, 0, canvas.width, sliceHeight
      );

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(pageImgData, 'JPEG', 0, 0, a4WidthMm, a4HeightMm);

      renderedHeight += a4HeightPx;
      pageIndex++;
    }

    const safeFilename = cleanTitle.replace(/[^a-zA-Z0-9\u0B80-\u0BFF_-]/g, '_');
    pdf.save(`${safeFilename || 'song-sheet'}.pdf`);
  } catch (err) {
    console.error('Failed to export PDF:', err);
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}

import { getSlideTheme, calculateSlideFontSize, calculateTitleSlideFontSize } from './presentationThemes';

function fontFamilyToCss(fontFace) {
  if (fontFace === 'Nirmala UI') {
    return "'Nirmala UI', 'Noto Sans Tamil', sans-serif";
  }
  if (fontFace === 'Baloo Thambi 2') {
    return "'Baloo Thambi 2', 'Noto Sans Tamil', sans-serif";
  }
  if (fontFace === 'TAMIL-UNI031') {
    return "'TAMIL-UNI031', 'Noto Sans Tamil', sans-serif";
  }
  if (fontFace === 'Noto Sans Tamil') {
    return "'Noto Sans Tamil', sans-serif";
  }
  return `'${fontFace}', 'Noto Sans Tamil', sans-serif`;
}

/**
 * Exports a song or custom lyrics as a PowerPoint (.pptx) presentation with
 * pixel-perfect, non-editable high-DPI image slides (100% exact match with the web preview).
 */
export async function exportSongToPptx(songTitle, lyrics, options = {}) {
  const {
    theme = 'dark',
    aspectRatio = '16x9', // '16x9' or '4x3'
    fontSize = 34,
    fontFace = 'Nirmala UI',
    includeTitleSlide = false,
    subtitle = '',
    // Customization features:
    bgType = 'solid', // 'solid' | 'texture'
    textureSrc = '', // image path / URL
    bgOverlayOpacity = 0.65, // 0 to 1
    customBgColor = null,
    customTextColor = null,
    textAlign = 'center', // 'left' | 'center' | 'right'
    alternateEvenLines = false,
    evenLineColor = '#e5b965'
  } = options;

  // Wait for web fonts to load
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // continue
    }
  }

  // Preload background texture if specified
  if (bgType === 'texture' && textureSrc) {
    try {
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = img.onerror = resolve;
        img.src = textureSrc;
      });
    } catch {
      // continue
    }
  }

  const pptx = new pptxgen();
  pptx.layout = aspectRatio === '4x3' ? 'LAYOUT_4x3' : 'LAYOUT_16x9';

  const baseTheme = getSlideTheme(theme);
  const selectedTheme = {
    bg: customBgColor || baseTheme.bg,
    text: customTextColor || baseTheme.text
  };

  // High-DPI presentation canvas dimensions
  const width = aspectRatio === '4x3' ? 1600 : 1920;
  const height = aspectRatio === '4x3' ? 1200 : 1080;

  const fontCss = fontFamilyToCss(fontFace);
  const alignFlex = textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center');

  // Helper to render an offscreen slide card to a high-DPI JPEG image
  const renderSlideToImage = async (contentHtml) => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.backgroundColor = selectedTheme.bg;
    wrapper.style.color = selectedTheme.text;
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = alignFlex;
    wrapper.style.justifyContent = 'center';
    wrapper.style.textAlign = textAlign;
    wrapper.style.padding = aspectRatio === '4x3' ? '60px 90px' : '70px 100px';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.overflow = 'hidden';
    wrapper.style.zIndex = '999999';
    wrapper.style.pointerEvents = 'none';

    // If texture background is active, inject image layer and darkness scrim
    let bgLayers = '';
    if (bgType === 'texture' && textureSrc) {
      bgLayers = `
        <img src="${textureSrc}" crossorigin="anonymous" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none;" />
        <div style="position: absolute; inset: 0; background-color: rgba(0, 0, 0, ${bgOverlayOpacity}); z-index: 1; pointer-events: none;"></div>
      `;
    }

    wrapper.innerHTML = `
      ${bgLayers}
      ${contentHtml}
    `;
    document.body.appendChild(wrapper);

    try {
      const canvas = await html2canvas(wrapper, {
        width,
        height,
        x: 0,
        y: 0,
        windowWidth: width,
        windowHeight: height,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: selectedTheme.bg,
        scrollX: 0,
        scrollY: 0
      });
      return canvas.toDataURL('image/jpeg', 0.96);
    } finally {
      if (document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
    }
  };

  // 1. Optional Title Slide
  if (includeTitleSlide) {
    const { titleSize, subtitleSize } = calculateTitleSlideFontSize(fontSize);
    const cleanTitle = songTitle || 'பாடல் தலைப்பு';
    const textShadowStyle = bgType === 'texture' ? 'text-shadow: 0 2px 12px rgba(0,0,0,0.85);' : '';

    const titleHtml = `
      <div style="position: relative; z-index: 2; display: flex; flex-direction: column; align-items: ${alignFlex}; justify-content: center; text-align: ${textAlign}; width: 100%; transform: translateY(-4px); gap: 18px;">
        <div style="font-size: ${titleSize}px; font-weight: 800; color: ${selectedTheme.text}; line-height: 1.25; font-family: ${fontCss}; word-break: break-word; max-width: 90%; ${textShadowStyle}">
          ${cleanTitle}
        </div>
        ${subtitle ? `
          <div style="font-size: ${subtitleSize}px; font-weight: 600; color: ${selectedTheme.text}; opacity: 0.85; line-height: 1.4; font-family: ${fontCss}; word-break: break-word; max-width: 85%; ${textShadowStyle}">
            ${subtitle}
          </div>
        ` : ''}
      </div>
    `;

    const titleImg = await renderSlideToImage(titleHtml);
    const slide = pptx.addSlide();
    slide.background = { color: selectedTheme.bg.replace('#', '') };
    slide.addImage({ data: titleImg, x: 0, y: 0, w: '100%', h: '100%' });
  }

  // 2. Stanza Slides (Pixel-perfect matches with preview, optical dead-center, non-editable)
  const sections = splitSongSections(lyrics);

  for (const section of sections) {
    const calculatedFontSize = calculateSlideFontSize(section.lines, fontSize, aspectRatio);
    const textShadowStyle = bgType === 'texture' ? 'text-shadow: 0 2px 10px rgba(0,0,0,0.85);' : '';

    const linesHtml = section.lines.map((line, lIdx) => {
      const isEvenLine = lIdx % 2 === 1; // 2nd, 4th, 6th lines
      const color = (alternateEvenLines && isEvenLine) ? evenLineColor : selectedTheme.text;
      return `<div style="color: ${color}; width: 100%; text-align: ${textAlign}; ${textShadowStyle}">${line}</div>`;
    }).join('');

    const stanzaHtml = `
      <div style="position: relative; z-index: 2; display: flex; flex-direction: column; align-items: ${alignFlex}; justify-content: center; text-align: ${textAlign}; width: 100%; transform: translateY(-4px); font-size: ${calculatedFontSize}px; font-weight: 650; line-height: 1.48; font-family: ${fontCss}; word-break: break-word; max-width: 92%;">
        ${linesHtml}
      </div>
    `;

    const stanzaImg = await renderSlideToImage(stanzaHtml);
    const slide = pptx.addSlide();
    slide.background = { color: selectedTheme.bg.replace('#', '') };
    slide.addImage({ data: stanzaImg, x: 0, y: 0, w: '100%', h: '100%' });
  }

  const safeFilename = (songTitle || 'song-presentation').replace(/[^a-zA-Z0-9\u0B80-\u0BFF_-]/g, '_');
  await pptx.writeFile({ fileName: `${safeFilename}.pptx` });
}
