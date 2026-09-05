import React, { useState, useEffect, useRef } from 'react';
import { Maximize2 } from 'lucide-react';
import { useProjectorSync } from '../hooks/useProjectorSync';
import { AutoFitSlideContent } from './AutoFitSlideContent';
import { NewYearCounterView } from './NewYearCounterView';
import { ChurchClockView } from './ChurchClockView';

export function ProjectorDisplay({ projector: propProjector }) {
  const localProjector = useProjectorSync();
  const projector = propProjector || localProjector;

  const {
    activeSlide,
    isBlackout,
    isClear,
    theme,
    fontSize,
    highlights,
    nextSlide,
    prevSlide,
    toggleBlackout,
    toggleClear
  } = projector;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // Auto-hide controls overlay
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2200);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', ' ', 'PageDown', 'PageUp'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') nextSlide();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') prevSlide();
      if (e.key === 'b' || e.key === 'B') toggleBlackout();
      if (e.key === 'c' || e.key === 'C') toggleClear();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextSlide, prevSlide, toggleBlackout, toggleClear]);

  // Projector Themes
  const themes = {
    'midnight-gold': {
      bg: '#090d16',
      text: '#fdfbf7',
      accent: '#e5b965',
      subText: '#9cb0d0',
      tagBg: 'rgba(229, 185, 101, 0.15)',
      fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif"
    },
    'pure-black': {
      bg: '#000000',
      text: '#ffffff',
      accent: '#f59e0b',
      subText: '#94a3b8',
      tagBg: '#1e293b',
      fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif"
    },
    'cathedral-blue': {
      bg: 'radial-gradient(ellipse at center, #111e38 0%, #060a14 100%)',
      text: '#f8fafc',
      accent: '#38bdf8',
      subText: '#94a3b8',
      tagBg: 'rgba(56, 189, 248, 0.15)',
      fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif"
    },
    'warm-sanctuary': {
      bg: '#140f0a',
      text: '#fef7ee',
      accent: '#f97316',
      subText: '#a8a29e',
      tagBg: 'rgba(249, 115, 22, 0.15)',
      fontFamily: "'Noto Sans Tamil', 'Lora', serif"
    }
  };

  const currentTheme = themes[theme] || themes['midnight-gold'];

  if (isBlackout) {
    return (
      <div 
        onMouseMove={handleMouseMove}
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          cursor: showControls ? 'default' : 'none'
        }}
      >
        {showControls && (
          <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }}>
            <button
              onClick={toggleBlackout}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              திரையை மீட்டமை (Exit Blackout)
            </button>
          </div>
        )}
      </div>
    );
  }

  const effectiveBg = activeSlide?.backgroundColor || currentTheme.bg;
  const effectiveTextColor = activeSlide?.textColor || currentTheme.text;
  const effectiveFontFamily = activeSlide?.fontFamily 
    ? `'${activeSlide.fontFamily}', ${currentTheme.fontFamily}` 
    : currentTheme.fontFamily;
  const baseFontSize = activeSlide?.fontSize || fontSize || 42;

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        width: '100vw',
        height: '100vh',
        background: effectiveBg,
        color: effectiveTextColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        cursor: showControls ? 'default' : 'none',
        userSelect: 'none',
        fontFamily: effectiveFontFamily
      }}
    >
      {/* Top Floating Fullscreen Button (Only when NOT in fullscreen, auto-hides) */}
      {!isFullscreen && (
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.2s ease',
          zIndex: 100,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          padding: '6px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <button 
            onClick={toggleFullscreen} 
            style={{ 
              color: '#fff', 
              padding: '4px', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center' 
            }} 
            title="Toggle Fullscreen (F)"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      )}

      {/* Texture Background Layer & Darkness Scrim */}
      {activeSlide?.bgType === 'texture' && activeSlide?.textureSrc && (
        <>
          <img
            src={activeSlide.textureSrc}
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
              backgroundColor: `rgba(0, 0, 0, ${activeSlide.bgOverlayOpacity ?? 0.70})`,
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        </>
      )}

      {/* Main Slide Content */}
      {!isClear && activeSlide ? (
        activeSlide.type === 'new-year-counter' ? (
          /* Live Projectable New Year Countdown & Midnight Celebration */
          <div style={{ position: 'relative', zIndex: 2, width: '100vw', height: '100vh' }}>
            <NewYearCounterView
              targetDate={activeSlide.targetDate}
              celebrate={activeSlide.celebrate}
              customGreeting={activeSlide.customGreeting || activeSlide.title}
              customVerse={activeSlide.customVerse || activeSlide.body}
              theme={theme}
              bgType={activeSlide.bgType || 'gradient'}
              gradientBg={activeSlide.gradientBg}
              textureSrc={activeSlide.textureSrc || './images/card-backgrounds/sunbeams-golden.jpg'}
              bgOverlayOpacity={activeSlide.bgOverlayOpacity ?? 0.70}
              bgColor={activeSlide.backgroundColor || '#090d16'}
              uiLang={activeSlide.uiLang || 'ta'}
            />
          </div>
        ) : activeSlide.type === 'clock' ? (
          /* Live Projectable Church Digital Clock */
          <div style={{ position: 'relative', zIndex: 2, width: '100vw', height: '100vh' }}>
            <ChurchClockView
              serviceTitle={activeSlide.serviceTitle || activeSlide.title}
              format24h={activeSlide.format24h}
              showSeconds={activeSlide.showSeconds ?? true}
              theme={theme}
              bgType={activeSlide.bgType || 'gradient'}
              gradientBg={activeSlide.gradientBg}
              textureSrc={activeSlide.textureSrc || './images/card-backgrounds/clouds-golden.jpg'}
              bgOverlayOpacity={activeSlide.bgOverlayOpacity ?? 0.70}
              bgColor={activeSlide.backgroundColor || '#090d16'}
              animatedBg={activeSlide.animatedBg ?? true}
              uiLang={activeSlide.uiLang || 'ta'}
            />
          </div>
        ) : activeSlide.mediaPath ? (
          /* Media Image Slide (Photos, PDFs, PPTX slide images) */
          <div style={{
            position: 'relative',
            zIndex: 2,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: activeSlide.backgroundColor || '#000000',
            overflow: 'hidden'
          }}>
            <img
              src={activeSlide.mediaPath}
              alt={activeSlide.title || ''}
              style={{
                maxWidth: '100vw',
                maxHeight: '100vh',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                userSelect: 'none'
              }}
            />
            {activeSlide.body && (
              <div style={{
                position: 'absolute',
                bottom: '36px',
                left: '6%',
                right: '6%',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                color: activeSlide.textColor || '#ffffff',
                padding: '14px 24px',
                borderRadius: '10px',
                fontSize: 'clamp(18px, 2.8vw, 34px)',
                textAlign: activeSlide.align || 'center',
                lineHeight: 1.4,
                fontFamily: effectiveFontFamily,
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
              }}>
                {activeSlide.body}
              </div>
            )}
          </div>
        ) : (
          /* Text / Verse / Song Stanza Slide */
          <div style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            height: '100%',
            maxWidth: '100vw',
            maxHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out',
            textShadow: activeSlide?.bgType === 'texture' ? '0 2px 12px rgba(0,0,0,0.9)' : 'none'
          }}>
            <AutoFitSlideContent
              text={activeSlide.text || activeSlide.body || activeSlide.title}
              reference={activeSlide.reference}
              page={activeSlide.page}
              highlights={activeSlide?.kind === 'bible' || activeSlide?.id?.startsWith('bible-') ? (activeSlide.highlights || highlights) : []}
              fontFamily={effectiveFontFamily}
              textColor={effectiveTextColor}
              referenceColor={activeSlide.referenceColor || activeSlide.accent || currentTheme.accent}
              accentColor={activeSlide.referenceColor || activeSlide.accent || currentTheme.accent}
              align={activeSlide.align || 'center'}
              preferredSize={activeSlide.fontSize || fontSize || 44}
              referenceSize={activeSlide.refFontSize || activeSlide.referenceSize}
              paddingX={4}
              paddingY={4}
              altLineColorEnabled={activeSlide.altLineColorEnabled}
              altLineColor={activeSlide.altLineColor}
            />
          </div>
        )
      ) : (
        /* Standby State */
        <div style={{
          textAlign: 'center',
          color: currentTheme.subText,
          opacity: 0.5
        }}>
          <div style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, marginBottom: '8px', color: currentTheme.accent }}>
            Worship Cloud
          </div>
          <div style={{ fontSize: 'clamp(15px, 2vw, 22px)', color: currentTheme.text }}>
            ஆலய நேரடி திரை தயார் நிலையில் உள்ளது
          </div>
        </div>
      )}
    </div>
  );
}
