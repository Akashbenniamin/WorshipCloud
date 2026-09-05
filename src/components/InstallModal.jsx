import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Share, PlusSquare, Check, Sparkles, ArrowRight } from 'lucide-react';

export function InstallModal({
  isOpen,
  onClose,
  uiLang = 'ta',
  installPrompt,
  onPromptInstall,
  isAppInstalled
}) {
  if (!isOpen) return null;

  const isEn = uiLang === 'en';
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);
  const isDesktop = !isIOS && !isAndroid;

  const [activePlatform, setActivePlatform] = useState(
    isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 130,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <Download size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isEn ? 'Install App / Add to Home' : 'செயலியை நிறுவு / முகப்புத் திரை'}
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                {isEn ? 'Sharon AG Church · Worship Cloud' : 'ஷாரோன் ஏஜி சர்ச் · வர்ஷிப் கிளவுட்'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
          {/* App Feature Highlight Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem'
            }}
          >
            <img
              src="./favicon.svg"
              alt="Worship Cloud Logo"
              style={{ width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Worship Cloud
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 750,
                    padding: '2px 6px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(5, 150, 105, 0.12)',
                    color: '#059669'
                  }}
                >
                  PWA
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.35 }}>
                {isEn
                  ? 'Fast, full-screen offline-ready church worship assistant'
                  : 'முழுத்திரை, ஆஃப்லைன் மற்றும் அதிவேக ஆராதனை சேவைக்கான செயலி'}
              </p>
            </div>
          </div>

          {/* Instant One-Click Install Button if browser supports beforeinstallprompt */}
          {installPrompt && !isAppInstalled && (
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                onClick={async () => {
                  if (onPromptInstall) await onPromptInstall();
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  border: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Download size={18} />
                {isEn ? 'Install Worship Cloud Now' : 'இப்போதே செயலியை நிறுவவும்'}
              </button>
            </div>
          )}

          {isAppInstalled && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                borderRadius: '10px',
                color: '#059669',
                fontSize: '0.84rem',
                fontWeight: 750,
                marginBottom: '1.25rem'
              }}
            >
              <Check size={18} />
              {isEn ? 'App is already installed!' : 'செயலி ஏற்கனவே நிறுவப்பட்டுள்ளது!'}
            </div>
          )}

          {/* Platform Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              backgroundColor: 'var(--bg-surface)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem'
            }}
          >
            {[
              { id: 'android', label: 'Android', icon: Smartphone },
              { id: 'ios', label: 'iPhone / iPad', icon: Smartphone },
              { id: 'desktop', label: isEn ? 'PC / Mac' : 'கணினி', icon: Monitor }
            ].map((p) => {
              const isActive = activePlatform === p.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 4px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: isActive ? 800 : 600,
                    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={14} />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Platform Step-By-Step Guides */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '1rem'
            }}
          >
            {activePlatform === 'ios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isEn ? 'Apple Safari (iPhone / iPad):' : 'ஆப்பிள் சஃபாரி (ஐபோன் / ஐபேட்):'}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>1</div>
                  <div style={{ lineHeight: 1.4 }}>
                    {isEn ? 'Open this website in ' : 'இணையதளத்தை '} <strong>Safari</strong> {isEn ? 'and tap the ' : 'இல் திறந்து கீழேயுள்ள '} <strong>{isEn ? 'Share button' : 'பகிர்வு (Share)'}</strong> <Share size={13} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> {isEn ? 'at the bottom toolbar.' : 'பொத்தானை அழுத்தவும்.'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>2</div>
                  <div style={{ lineHeight: 1.4 }}>
                    {isEn ? 'Scroll down and tap ' : 'கீழே உருட்டி '} <strong>"{isEn ? 'Add to Home Screen' : 'முகப்புத் திரையில் சேர் (Add to Home Screen)'}"</strong> <PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>3</div>
                  <div style={{ lineHeight: 1.4 }}>
                    {isEn ? 'Tap ' : 'மேல் வலது மூலையில் உள்ள '} <strong>{isEn ? 'Add' : 'சேர் (Add)'}</strong> {isEn ? 'in the top right. Worship Cloud will appear as a standalone app!' : 'பொத்தானை அழுத்தவும்.'}
                  </div>
                </div>
              </div>
            )}

            {activePlatform === 'android' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isEn ? 'Google Chrome / Edge (Android):' : 'கூகிள் குரோம் / எட்ஜ் (ஆண்ட்ராய்டு):'}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>1</div>
                  <div style={{ lineHeight: 1.4 }}>
                    {isEn ? 'Tap the ' : 'வலது மேல் மூலையில் உள்ள '} <strong>{isEn ? 'three dots menu (⋮)' : 'மூன்று புள்ளிகள் மெனுவை (⋮)'}</strong> {isEn ? 'at the top right corner.' : 'அழுத்தவும்.'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>2</div>
                  <div style={{ lineHeight: 1.4 }}>
                    {isEn ? 'Select ' : 'பட்டியலில் இருந்து '} <strong>"{isEn ? 'Install app' : 'செயலியை நிறுவு (Install app)'}"</strong> {isEn ? 'or ' : 'அல்லது '} <strong>"{isEn ? 'Add to Home screen' : 'முகப்புத் திரையில் சேர்'}"</strong>.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>3</div>
                  <div style={{ lineHeight: 1.4 }}>
                    {isEn ? 'Confirm by clicking Install. The app will launch like a native mobile app!' : 'நிறுவு என்பதை உறுதிப்படுத்தவும். செயலி உங்கள் மொபைல் திரையில் சேர்க்கப்படும்!'}
                  </div>
                </div>
              </div>
            )}

            {activePlatform === 'desktop' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isEn ? 'Chrome / Edge on Windows & Mac:' : 'குரோம் / எட்ஜ் கணினி உலாவி:'}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>1</div>
                  <div style={{ lineHeight: 1.4 }}>
                    {isEn ? 'Click the ' : 'முகவரிப் பட்டியில் (Address Bar) வலதுபுறம் உள்ள '} <strong>{isEn ? 'Install App icon (⊕)' : 'நிறுவல் ஐகானை (⊕)'}</strong> {isEn ? 'in the browser URL address bar.' : 'அழுத்தவும்.'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>2</div>
                  <div style={{ lineHeight: 1.4 }}>
                    {isEn ? 'Or click browser menu (⋮) -> ' : 'அல்லது உலாவி மெனுவிலிருந்து (⋮) '} <strong>"{isEn ? 'Install Worship Cloud' : 'Worship Cloud செயலியை நிறுவு'}"</strong>.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>3</div>
                  <div style={{ lineHeight: 1.4 }}>
                    {isEn ? 'The app will open in a distraction-free standalone desktop window!' : 'செயலி தனி சாளரத்தில் நேரடியாகத் தொடங்கும்!'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            {isEn ? 'Works offline with saved cache' : 'ஆஃப்லைனிலும் பயன்படுத்தலாம்'}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {isEn ? 'Done' : 'முடிந்தது'}
          </button>
        </div>
      </div>
    </div>
  );
}
