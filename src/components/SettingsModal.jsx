import React from 'react';
import { X, Globe, Palette, Type, Settings } from 'lucide-react';
import { translations } from '../lib/i18n';

export function SettingsModal({
  isOpen,
  onClose,
  uiLang,
  setUiLang,
  theme,
  setTheme,
  fontSize,
  setFontSize
}) {
  if (!isOpen) return null;
  const t = translations[uiLang] || translations.ta;

  const themes = [
    { id: 'parchment', name: uiLang === 'ta' ? 'சுருள் (Parchment)' : 'Parchment (Warm Paper)', color: '#fcfaf6' },
    { id: 'midnight', name: uiLang === 'ta' ? 'நள்ளிரவு (Midnight)' : 'Midnight (OLED Dark)', color: '#090d14' },
    { id: 'pristine', name: uiLang === 'ta' ? 'வெண்மை (Pristine)' : 'Pristine (Clean Light)', color: '#ffffff' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 120,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--bg-canvas)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t.settingsTitle}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-tertiary)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. UI Language */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
              <Globe size={16} style={{ color: 'var(--accent)' }} />
              <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.uiLanguage}
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => setUiLang('en')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: uiLang === 'en' ? 'var(--accent)' : 'var(--bg-surface)',
                  color: uiLang === 'en' ? 'var(--accent-contrast)' : 'var(--text-primary)',
                  border: `1px solid ${uiLang === 'en' ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}
              >
                English
              </button>
              <button
                onClick={() => setUiLang('ta')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: uiLang === 'ta' ? 'var(--accent)' : 'var(--bg-surface)',
                  color: uiLang === 'ta' ? 'var(--accent-contrast)' : 'var(--text-primary)',
                  border: `1px solid ${uiLang === 'ta' ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>

          {/* 2. Color Theme */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
              <Palette size={16} style={{ color: 'var(--accent)' }} />
              <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.theme}
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {themes.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: theme === th.id ? 'var(--accent-light)' : 'var(--bg-surface)',
                    color: theme === th.id ? 'var(--accent)' : 'var(--text-primary)',
                    border: `1px solid ${theme === th.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    fontSize: '0.8rem',
                    fontWeight: 650,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: th.color, border: '1px solid var(--border-strong)' }} />
                  <span>{th.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Base Font Size */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Type size={16} style={{ color: 'var(--accent)' }} />
                <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t.fontSize} ({fontSize}px)
                </label>
              </div>
            </div>
            <input
              type="range"
              min="14"
              max="30"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.8rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
