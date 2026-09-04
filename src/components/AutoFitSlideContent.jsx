import React, { useState, useLayoutEffect, useRef } from 'react';
import { renderHighlightedContent } from '../lib/highlightRenderer';

export function AutoFitSlideContent({
  text = '',
  reference = '',
  page = null,
  highlights = [],
  fontFamily = 'Noto Sans Tamil',
  textColor = '#ffffff',
  accentColor = '#e5b965',
  referenceColor = null,
  align = 'center',
  preferredSize = null,
  referenceSize = null,
  maxFontSize = 130,
  minFontSize = 13,
  paddingX = 10,
  paddingY = 10,
  altLineColorEnabled = false,
  altLineColor = '#38bdf8'
}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const refRef = useRef(null);
  const [calculatedSize, setCalculatedSize] = useState(preferredSize || 42);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const measureAndFit = () => {
      const cW = container.clientWidth;
      const cH = container.clientHeight;
      if (cW === 0 || cH === 0) return;

      const refH = refRef.current ? refRef.current.offsetHeight : (reference ? (referenceSize || 30) : 0);
      const targetAvailH = Math.max(30, cH - refH - (paddingY * 2));
      const targetAvailW = Math.max(30, cW - (paddingX * 2));

      let low = minFontSize;
      let high = Math.min(maxFontSize, Math.round(targetAvailH * 0.58));
      
      if (preferredSize && preferredSize > 0) {
        high = Math.min(high, Math.round(preferredSize * 1.5));
      }
      if (high < low) high = low;

      let best = low;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        textEl.style.fontSize = `${mid}px`;
        
        if (textEl.scrollHeight <= targetAvailH && textEl.scrollWidth <= targetAvailW) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      textEl.style.fontSize = `${best}px`;
      setCalculatedSize(best);
    };

    measureAndFit();

    const observer = new ResizeObserver(() => measureAndFit());
    observer.observe(container);

    return () => observer.disconnect();
  }, [text, reference, fontFamily, preferredSize, referenceSize, maxFontSize, minFontSize, paddingX, paddingY, altLineColorEnabled, altLineColor]);

  const hasReference = reference && !/^slide\s*\d+$/i.test(reference.trim());

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: `${paddingY}px ${paddingX}px`,
        position: 'relative'
      }}
    >
      <div
        ref={textRef}
        style={{
          width: '100%',
          textAlign: align || 'center',
          color: textColor,
          fontFamily: fontFamily.includes(',') ? fontFamily : `'${fontFamily}', sans-serif`,
          lineHeight: 1.44,
          fontWeight: (fontFamily?.includes('Baloo') || fontFamily?.includes('Anek') || fontFamily?.includes('Mukta') || fontFamily?.includes('Catamaran')) ? 800 : 750,
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',
          textShadow: 'none',
          letterSpacing: '0.01em',
          transition: 'color 0.15s ease'
        }}
      >
        {altLineColorEnabled && altLineColor ? (
          text.split('\n').map((line, idx) => (
            <div
              key={idx}
              style={{
                color: idx % 2 === 1 ? altLineColor : textColor,
                transition: 'color 0.15s ease'
              }}
            >
              {line ? (highlights && highlights.length > 0 ? renderHighlightedContent(line, highlights) : line) : '\u00A0'}
            </div>
          ))
        ) : (
          highlights && highlights.length > 0 ? renderHighlightedContent(text, highlights) : text
        )}
      </div>

      {hasReference && (
        <div
          ref={refRef}
          style={{
            marginTop: '1.2vh',
            fontSize: referenceSize 
              ? `${referenceSize}px` 
              : `clamp(14px, ${Math.max(15, Math.round(calculatedSize * 0.48))}px, 32px)`,
            fontWeight: 700,
            color: referenceColor || accentColor || '#e5b965',
            letterSpacing: '0.03em',
            opacity: 0.92,
            width: '100%',
            textAlign: align || 'center',
            textShadow: 'none',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: align === 'left' ? 'flex-start' : (align === 'right' ? 'flex-end' : 'center'),
            gap: '8px'
          }}
        >
          <span>{reference}</span>
          {page && <span style={{ opacity: 0.6, fontSize: '0.85em' }}>· பக்கம் {page}</span>}
        </div>
      )}
    </div>
  );
}
