import React, { useState } from 'react';
import {
  X,
  User,
  LogOut,
  CheckCircle2,
  Cloud,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Key,
  Globe,
  Sparkles
} from 'lucide-react';
import { translations } from '../lib/i18n';

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthModal({
  isOpen,
  onClose,
  uiLang,
  auth
}) {
  if (!isOpen) return null;

  const t = translations[uiLang] || translations.ta;
  const {
    user,
    loading,
    error,
    isConfigured,
    config,
    signInWithGoogle,
    signOut,
    updateConfig,
    removeConfig
  } = auth;

  const [inputUrl, setInputUrl] = useState(config.url || '');
  const [inputKey, setInputKey] = useState(config.anonKey || '');
  const [showConfig, setShowConfig] = useState(!isConfigured);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setActionError('');
    if (!inputUrl.trim() || !inputKey.trim()) {
      setActionError(uiLang === 'ta' ? 'URL மற்றும் Anon Key இரண்டையும் உள்ளிடவும்' : 'Both URL and Anon Key are required');
      return;
    }
    const ok = updateConfig(inputUrl, inputKey);
    if (ok) {
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
      setShowConfig(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setActionError('');
    if (!isConfigured) {
      setShowConfig(true);
      setActionError(
        uiLang === 'ta'
          ? 'முதலில் கீழே உள்ள Supabase URL & Anon Key-ஐ உள்ளிடவும்'
          : 'Please configure your Supabase Project URL and Anon Key below first'
      );
      return;
    }
    try {
      setActionLoading(true);
      await signInWithGoogle();
    } catch (err) {
      const errMsg = err?.message || String(err);
      if (errMsg.toLowerCase().includes('provider is not enabled') || errMsg.toLowerCase().includes('unsupported provider')) {
        setActionError(
          uiLang === 'ta'
            ? 'உங்கள் Supabase திட்டத்தில் Google provider இன்னும் இயக்கப்படவில்லை. Authentication > Providers > Google-ல் சென்று இயக்கவும்.'
            : 'Google login provider is not enabled yet in your Supabase project. Please enable it under Authentication > Providers > Google.'
        );
      } else {
        setActionError(errMsg || 'Google sign-in failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setActionLoading(true);
      await signOut();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const projectRef = (config.url || inputUrl || '').replace(/^https?:\/\//, '').split('.')[0];
  const activeErrMsg = actionError || error || '';
  const isProviderDisabled = activeErrMsg.toLowerCase().includes('provider is not enabled') ||
    activeErrMsg.toLowerCase().includes('unsupported provider');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 125,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)'
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {user ? t.profile : t.signInTitle}
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Worship Cloud Account
              </div>
            </div>
          </div>
          <button
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
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Error Banner */}
          {activeErrMsg && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.84rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ lineHeight: 1.4 }}>{activeErrMsg}</div>
              </div>
              {isProviderDisabled && projectRef && (
                <a
                  href={`https://supabase.com/dashboard/project/${projectRef}/auth/providers`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#ffffff',
                    backgroundColor: '#ef4444',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    alignSelf: 'flex-start',
                    marginTop: '4px'
                  }}
                >
                  <span>{uiLang === 'ta' ? 'Supabase-ல் Google-ஐ இயக்குக' : 'Enable Google in Supabase'}</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {/* VIEW A: USER IS SIGNED IN */}
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* User Profile Card */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative' }}>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        border: '2px solid var(--accent)',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700
                      }}
                    >
                      {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  {/* Google badge icon */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      padding: '2px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Google Account"
                  >
                    <GoogleIcon size={14} />
                  </div>
                </div>

                {/* Name & Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user.fullName}
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '2px'
                    }}
                  >
                    {user.email}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#34d399',
                      backgroundColor: 'rgba(52, 211, 153, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      marginTop: '6px'
                    }}
                  >
                    <CheckCircle2 size={12} />
                    {t.cloudSyncActive}
                  </div>
                </div>
              </div>

              {/* Synchronized Features List */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {uiLang === 'ta' ? 'கிளவுடில் சேமிக்கப்படுபவை' : 'What is Synced Across Devices'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                    {uiLang === 'ta' ? 'விருப்பப் பாடல்கள்' : 'Favorite Songs'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                    {uiLang === 'ta' ? 'வேதாகம புக்மார்க்குகள்' : 'Bible Bookmarks'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                    {uiLang === 'ta' ? 'திரை வண்ணத் தோற்றம்' : 'Projector Themes'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                    {uiLang === 'ta' ? 'அமைப்புகள் & மொழிகள்' : 'Custom Preferences'}
                  </div>
                </div>
              </div>

              {/* Sign Out Action Button */}
              <button
                onClick={handleSignOut}
                disabled={actionLoading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                }}
              >
                <LogOut size={16} />
                {actionLoading ? (uiLang === 'ta' ? 'வெளியேறுகிறது...' : 'Signing out...') : t.signOut}
              </button>
            </div>
          ) : (
            /* VIEW B: USER IS NOT SIGNED IN */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Introduction Banner */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem 0.5rem 0.5rem'
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.05))',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    marginBottom: '1rem'
                  }}
                >
                  <Cloud size={26} />
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {t.signInTitle}
                </h4>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    margin: '8px auto 0',
                    maxWidth: '380px',
                    lineHeight: 1.45
                  }}
                >
                  {t.signInSubtitle}
                </p>
              </div>

              {/* Big Continue with Google Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={actionLoading}
                style={{
                  width: '100%',
                  padding: '0.95rem 1.25rem',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
              >
                <GoogleIcon size={20} />
                {actionLoading ? (uiLang === 'ta' ? 'இணைக்கப்படுகிறது...' : 'Connecting to Google...') : t.continueWithGoogle}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
