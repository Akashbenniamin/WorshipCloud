import React, { useState, useEffect, useMemo } from 'react';
import { X, Globe, Palette, Type, Settings, Download, HardDrive, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { translations } from '../lib/i18n';
import { 
  getAllOfflineUrlsWithBible, 
  downloadAllForOffline, 
  getCacheStatus, 
  cancelOfflineDownload 
} from '../lib/offlineManager';

export function SettingsModal({
  isOpen,
  onClose,
  uiLang,
  setUiLang,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  onOpenInstallModal,
  isAppInstalled,
  booksMeta = []
}) {
  if (!isOpen) return null;
  const t = translations[uiLang] || translations.ta;

  // Offline caching states
  const offlineUrls = useMemo(() => getAllOfflineUrlsWithBible(booksMeta), [booksMeta]);
  const [cacheStatus, setCacheStatus] = useState({ cachedCount: 0, totalCount: offlineUrls.length, isComplete: false });
  const [downloadProgress, setDownloadProgress] = useState(null); // { current, total, percent, isDone, currentItem }
  const [isDownloading, setIsDownloading] = useState(false);

  // Check initial cache status on open
  useEffect(() => {
    if (isOpen) {
      getCacheStatus(offlineUrls).then((status) => {
        setCacheStatus(status);
      });
    }
  }, [isOpen, offlineUrls]);

  const handleStartFullDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: offlineUrls.length, percent: 0, isDone: false, currentItem: '' });

    try {
      await downloadAllForOffline(offlineUrls, (progress) => {
        setDownloadProgress(progress);
        setCacheStatus({
          cachedCount: progress.current,
          totalCount: progress.total,
          isComplete: progress.isDone
        });
      });
    } catch (err) {
      console.error('Download offline error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

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
        maxWidth: '500px',
        maxHeight: '90vh',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
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
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
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

          {/* 4. Complete Offline Storage & Caching */}
          <div style={{
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <HardDrive size={18} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t.offlineStorage}
                    </label>
                    {cacheStatus.isComplete && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        <CheckCircle2 size={12} />
                        {t.offlineReadyBadge}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px', lineHeight: 1.4 }}>
                    {t.offlineDesc}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    {t.cachedCountLabel}: <strong>{cacheStatus.cachedCount} / {cacheStatus.totalCount}</strong> files (~54 MB)
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar (when downloading or recently finished) */}
            {(isDownloading || downloadProgress) && (
              <div style={{
                marginTop: '4px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {downloadProgress?.isDone 
                      ? (uiLang === 'ta' ? 'பதிவிறக்கம் முடிந்தது!' : 'Download Complete!') 
                      : (t.offlineDownloading)}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {downloadProgress?.percent || 0}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'var(--border-subtle)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${downloadProgress?.percent || 0}%`,
                    height: '100%',
                    backgroundColor: downloadProgress?.isDone ? '#10b981' : 'var(--accent)',
                    transition: 'width 0.15s ease'
                  }} />
                </div>
                {downloadProgress?.currentItem && !downloadProgress.isDone && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {downloadProgress.currentItem}
                  </div>
                )}
              </div>
            )}

            {/* Download Button */}
            {!cacheStatus.isComplete && (
              <button
                onClick={handleStartFullDownload}
                disabled={isDownloading}
                style={{
                  marginTop: '4px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: isDownloading ? 'var(--bg-surface)' : 'var(--accent-light)',
                  color: isDownloading ? 'var(--text-tertiary)' : 'var(--accent)',
                  border: `1px solid ${isDownloading ? 'var(--border-subtle)' : 'var(--accent)'}`,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isDownloading ? 'not-allowed' : 'pointer'
                }}
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{t.offlineDownloading}</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>{t.downloadAllOffline}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 5. App Installation & PWA */}
          <div style={{
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} style={{ color: 'var(--accent)' }} />
              <div>
                <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                  {uiLang === 'ta' ? 'செயலியை நிறுவு / ஆப்' : 'Install App / Add to Home'}
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {uiLang === 'ta' ? 'முகப்புத் திரையில் சேர்க்கவும்' : 'Add to home screen or desktop app'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenInstallModal?.();
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: isAppInstalled ? 'rgba(5, 150, 105, 0.12)' : 'var(--accent-light)',
                color: isAppInstalled ? '#059669' : 'var(--accent)',
                border: `1px solid ${isAppInstalled ? '#059669' : 'var(--accent)'}`,
                fontSize: '0.78rem',
                fontWeight: 750,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {isAppInstalled 
                ? (uiLang === 'ta' ? 'நிறுவப்பட்டது' : 'Installed') 
                : (uiLang === 'ta' ? 'நிறுவு' : 'Install')}
            </button>
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
