import React, { useState, useMemo } from 'react';
import { X, Music, Sparkles, Check, AlertCircle, LogIn } from 'lucide-react';
import { translations } from '../lib/i18n';
import { extractTamilTitleFromLyrics } from '../lib/userSongsStore';

export function AddSongModal({
  isOpen,
  onClose,
  onSave,
  user,
  onOpenAuth,
  uiLang = 'ta'
}) {
  if (!isOpen) return null;

  const t = translations[uiLang] || translations.ta;

  const [lyrics, setLyrics] = useState('');
  const [tanglishTitle, setTanglishTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-detect Tamil title from the 1st non-empty lyrics line
  const autoTamilTitle = useMemo(() => {
    return extractTamilTitleFromLyrics(lyrics);
  }, [lyrics]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError(t.loginToSaveSong || 'Please sign in with Google to save custom songs.');
      return;
    }

    const cleanLyrics = lyrics.trim();
    if (!cleanLyrics) {
      setError(uiLang === 'ta' ? 'தயவுசெய்து பாடல் வரிகளை உள்ளிடவும்' : 'Please enter song lyrics');
      return;
    }

    if (!tanglishTitle.trim()) {
      setError(uiLang === 'ta' ? 'தயவுசெய்து தங்லிஷ் தலைப்பை உள்ளிடவும்' : 'Please enter the Tanglish title');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        lyrics: cleanLyrics,
        tanglishTitle: tanglishTitle.trim(),
        subtitle: subtitle.trim()
      });
      setIsSaving(false);
      onClose();
    } catch (err) {
      setIsSaving(false);
      setError(err.message || 'Failed to save song');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 130,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Music size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {t.addNewSong}
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {uiLang === 'ta' ? 'உங்கள் சொந்த பாடல்களைச் சேர்க்கவும்' : 'Add your custom song to Worship Cloud'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1.4rem', gap: '1rem' }}>
          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{error}</div>
              {!user && onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <LogIn size={12} />
                  <span>{t.signIn}</span>
                </button>
              )}
            </div>
          )}

          {/* 1. Tanglish Title Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              {t.tanglishTitleLabel} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder={t.tanglishPlaceholder}
              value={tanglishTitle}
              onChange={(e) => setTanglishTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 2. Lyrics Textarea */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {t.lyricsLabel} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                {uiLang === 'ta' ? 'பல்லவி, சரணங்கள் வரிசையாக' : 'Separate stanzas with empty lines'}
              </span>
            </div>
            <textarea
              required
              rows={8}
              placeholder={t.lyricsPlaceholder}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* 3. Auto-detected Tamil Title Preview Card */}
          <div
            style={{
              padding: '0.75rem 0.95rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px dashed var(--border-strong)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 700 }}>
              <Sparkles size={13} />
              <span>{t.tamilTitleLabel}</span>
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: autoTamilTitle ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              {autoTamilTitle || (uiLang === 'ta' ? '(முதல் வரியை தட்டச்சு செய்யவும்)' : '(Type the first line of lyrics above)')}
            </div>
          </div>

          {/* 4. Subtitle / Author (Optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              {t.subtitleArtistLabel}
            </label>
            <input
              type="text"
              placeholder={uiLang === 'ta' ? 'எ.கா. Gersson Edinbaro / புதிய ஆராதனைப் பாடல்' : 'e.g. Gersson Edinbaro / New Worship Song'}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t.close}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '0.65rem 1.4rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Check size={16} />
              <span>{isSaving ? t.savingSong : t.saveSong}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
