import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ExternalLink,
  MonitorOff
} from 'lucide-react';
import { translations } from '../lib/i18n';

export function PresenterToolbar({
  activeSlide,
  isBlackout,
  isClear,
  onPrev,
  onNext,
  onToggleBlackout,
  onToggleClear,
  onUnproject,
  onOpenProjectorWindow,
  onCloseProjectorWindow,
  uiLang = 'ta'
}) {
  const [activeClickId, setActiveClickId] = useState(null);

  const t = translations[uiLang] || translations.ta;

  // Global presentation keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger when user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'b' || e.key === 'B') {
        onToggleBlackout();
      } else if (e.key === 'c' || e.key === 'C') {
        onToggleClear();
      } else if (e.key === 'Escape') {
        if (activeSlide) onUnproject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlide, onNext, onPrev, onToggleBlackout, onToggleClear, onUnproject]);

  if (!activeSlide) return null;

  const getStatusBadge = () => {
    if (isBlackout) return { label: t.presenterBlackout || 'BLACKOUT', bg: '#000000', color: '#ffffff' };
    if (isClear) return { label: t.presenterCleared || 'CLEARED', bg: '#475569', color: '#ffffff' };
    return { label: t.presenterLive || 'LIVE', bg: '#dc2626', color: '#ffffff' };
  };

  const status = getStatusBadge();

  return (
    <div 
      role="region"
      aria-label="Presenter Live Control Bar"
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        maxWidth: '920px',
        width: 'calc(100% - 2rem)',
        height: '52px',
        backgroundColor: 'var(--accent)',
        borderRadius: '999px',
        padding: '5px 8px 5px 6px',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.35), 0 4px 14px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        boxSizing: 'border-box',
        backdropFilter: 'blur(16px)',
        animation: 'slideUpBar 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none'
      }}
    >
      {/* LEFT: Live Status Indicator & Slide Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
        {/* Circular Live Status Emblem (matching circular emblem in top-left tab switcher) */}
        <div 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: status.bg,
            color: status.color,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            transition: 'all 0.2s ease'
          }}
          title={status.label}
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            marginBottom: '1px',
            animation: !isBlackout && !isClear ? 'pulseGlow 1.2s infinite' : 'none'
          }} />
          <span style={{ fontSize: '0.52rem', fontWeight: 850, letterSpacing: '0.04em', lineHeight: 1 }}>
            {isBlackout ? 'BLK' : (isClear ? 'CLR' : 'LIVE')}
          </span>
        </div>

        {/* Slide Title & Text Preview Pill */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.22)',
          borderRadius: '999px',
          padding: '4px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: 0,
          flex: '1 1 auto',
          maxWidth: '360px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2
            }}>
              {activeSlide.title || activeSlide.reference || 'Active Slide'}
            </div>
            {(activeSlide.text || activeSlide.body) && (
              <div style={{
                fontSize: '0.72rem',
                color: 'rgba(255, 255, 255, 0.82)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2
              }}>
                {activeSlide.text || activeSlide.body}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Pill Control Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {/* Previous Button */}
        <button
          type="button"
          onClick={onPrev}
          onMouseDown={() => setActiveClickId('prev')}
          onMouseUp={() => setActiveClickId(null)}
          title={`${t.presenterPrev || 'Previous'} (Left Arrow)`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '999px',
            backgroundColor: 'rgba(0, 0, 0, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            transform: activeClickId === 'prev' ? 'scale(0.92)' : 'scale(1)',
            transition: 'transform 0.12s ease, background-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.36)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.22)'; }}
        >
          <ChevronLeft size={16} />
          <span>{t.presenterPrev || 'Prev'}</span>
        </button>

        {/* Next Button (High-Contrast White Pill) */}
        <button
          type="button"
          onClick={onNext}
          onMouseDown={() => setActiveClickId('next')}
          onMouseUp={() => setActiveClickId(null)}
          title={`${t.presenterNext || 'Next'} (Right Arrow / Space)`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 14px',
            borderRadius: '999px',
            backgroundColor: '#ffffff',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '0.82rem',
            fontWeight: 850,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
            transform: activeClickId === 'next' ? 'scale(0.92)' : 'scale(1)',
            transition: 'transform 0.12s ease, filter 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.95)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
        >
          <span>{t.presenterNext || 'Next'}</span>
          <ChevronRight size={16} />
        </button>

        {/* Separator */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.25)', margin: '0 2px' }} />

        {/* Blackout Button */}
        <button
          type="button"
          onClick={onToggleBlackout}
          onMouseDown={() => setActiveClickId('blackout')}
          onMouseUp={() => setActiveClickId(null)}
          title={`${t.presenterBlack || 'Blackout (B)'} (Key: B)`}
          style={{
            padding: '6px 11px',
            borderRadius: '999px',
            backgroundColor: isBlackout ? '#000000' : 'rgba(0, 0, 0, 0.22)',
            border: isBlackout ? '1.5px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.16)',
            color: '#ffffff',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transform: activeClickId === 'blackout' ? 'scale(0.92)' : 'scale(1)',
            transition: 'transform 0.12s ease, background-color 0.15s ease'
          }}
          onMouseEnter={(e) => { if (!isBlackout) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.36)'; }}
          onMouseLeave={(e) => { if (!isBlackout) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.22)'; }}
        >
          <span>{t.presenterBlack || 'Black (B)'}</span>
        </button>

        {/* Clear Button */}
        <button
          type="button"
          onClick={onToggleClear}
          onMouseDown={() => setActiveClickId('clear')}
          onMouseUp={() => setActiveClickId(null)}
          title={`${t.presenterClear || 'Clear (C)'} (Key: C)`}
          style={{
            padding: '6px 11px',
            borderRadius: '999px',
            backgroundColor: isClear ? '#334155' : 'rgba(0, 0, 0, 0.22)',
            border: isClear ? '1.5px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.16)',
            color: '#ffffff',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transform: activeClickId === 'clear' ? 'scale(0.92)' : 'scale(1)',
            transition: 'transform 0.12s ease, background-color 0.15s ease'
          }}
          onMouseEnter={(e) => { if (!isClear) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.36)'; }}
          onMouseLeave={(e) => { if (!isClear) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.22)'; }}
        >
          <span>{t.presenterClear || 'Clear (C)'}</span>
        </button>

        {/* Open 2nd Screen Window Button */}
        <button
          type="button"
          onClick={onOpenProjectorWindow}
          onMouseDown={() => setActiveClickId('popout')}
          onMouseUp={() => setActiveClickId(null)}
          title={t.presenterWindow || 'Open Display Window in 2nd Monitor'}
          style={{
            padding: '6px 8px',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            backgroundColor: 'rgba(0, 0, 0, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transform: activeClickId === 'popout' ? 'scale(0.92)' : 'scale(1)',
            transition: 'transform 0.12s ease, background-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.36)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.22)'; }}
        >
          <ExternalLink size={15} />
        </button>

        {/* Close 2nd Screen Window Button */}
        {onCloseProjectorWindow && (
          <button
            type="button"
            onClick={onCloseProjectorWindow}
            onMouseDown={() => setActiveClickId('close-popout')}
            onMouseUp={() => setActiveClickId(null)}
            title={t.closeProjectorWindow || 'Close 2nd Screen Window'}
            style={{
              padding: '6px 8px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              backgroundColor: 'rgba(239, 68, 68, 0.22)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transform: activeClickId === 'close-popout' ? 'scale(0.92)' : 'scale(1)',
              transition: 'transform 0.12s ease, background-color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.22)'; }}
          >
            <MonitorOff size={15} />
          </button>
        )}

        {/* Stop / Unproject Button */}
        <button
          type="button"
          onClick={onUnproject}
          onMouseDown={() => setActiveClickId('unproject')}
          onMouseUp={() => setActiveClickId(null)}
          title={`${t.presenterExit || 'Stop Projecting'} (Esc)`}
          style={{
            padding: '6px 8px',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            backgroundColor: 'rgba(0, 0, 0, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transform: activeClickId === 'unproject' ? 'scale(0.92)' : 'scale(1)',
            transition: 'transform 0.12s ease, background-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.85)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.22)'; }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
