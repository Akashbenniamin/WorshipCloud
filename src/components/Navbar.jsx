import React, { useState, useRef, useEffect } from 'react';
import { 
  Home,
  BookOpen,
  Music,
  Tv, 
  SunMedium,
  Wrench,
  Search, 
  Settings,
  Cloud,
  User
} from 'lucide-react';
import { translations } from '../lib/i18n';

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenSearch,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  activeSlide,
  onOpenProjector,
  uiLang = 'ta',
  onOpenSettings,
  user,
  onOpenAuth
}) {
  const t = translations[uiLang] || translations.ta;

  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 200, y: 25 });
  const searchBarRef = useRef(null);

  // Floating Nav Bar State & Refs
  const navRef = useRef(null);
  const lastWheelTime = useRef(0);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [navCursorPos, setNavCursorPos] = useState({ x: 50, y: 24 });
  const [navTilt, setNavTilt] = useState({ x: 0, y: 0 });
  const [activeClickId, setActiveClickId] = useState(null);

  const handleSearchMouseMove = (e) => {
    if (!searchBarRef.current) return;
    const rect = searchBarRef.current.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const navItems = [
    { id: 'bible', label: 'Bible', icon: BookOpen },
    { id: 'songs', label: 'Songs', icon: Music },
    { id: 'projector', label: 'Live', icon: Tv },
    { id: 'daily', label: 'Daily', icon: SunMedium },
    { id: 'tools', label: 'Tools', icon: Wrench },
  ];

  // Cursor tracking for floating navigation dock
  const handleNavMouseMove = (e) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    setNavCursorPos({ x: relX, y: relY });

    // Subtle 3D perspective tilt
    const tiltY = ((relX / rect.width) - 0.5) * 8; // rotateY
    const tiltX = -((relY / rect.height) - 0.5) * 6; // rotateX
    setNavTilt({ x: tiltX, y: tiltY });
  };

  const handleNavMouseLeave = () => {
    setIsNavHovered(false);
    setNavTilt({ x: 0, y: 0 });
    setActiveClickId(null);
  };

  // Scroll wheel navigation on floating bar: cycles through tabs smoothly
  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      if (now - lastWheelTime.current < 160) return; // 160ms throttle
      lastWheelTime.current = now;

      const tabs = ['bible', 'songs', 'projector', 'daily', 'tools'];
      const currentIndex = tabs.indexOf(activeTab);

      if (e.deltaY > 0 || e.deltaX > 0) {
        // Scroll down / right -> next tab
        const nextIndex = (currentIndex === -1 ? 0 : (currentIndex + 1) % tabs.length);
        setActiveTab(tabs[nextIndex]);
        setActiveClickId(tabs[nextIndex]);
        setTimeout(() => setActiveClickId(null), 180);
      } else if (e.deltaY < 0 || e.deltaX < 0) {
        // Scroll up / left -> previous tab
        const prevIndex = (currentIndex === -1 ? 0 : (currentIndex - 1 + tabs.length) % tabs.length);
        setActiveTab(tabs[prevIndex]);
        setActiveClickId(tabs[prevIndex]);
        setTimeout(() => setActiveClickId(null), 180);
      }
    };

    navEl.addEventListener('wheel', onWheel, { passive: false });
    return () => navEl.removeEventListener('wheel', onWheel);
  }, [activeTab, setActiveTab]);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      backgroundColor: 'rgba(var(--bg-canvas), 0.94)',
      borderBottom: 'none',
      padding: '0.85rem 2rem 0.5rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* FLOATING TOP-LEFT PILL TAB SWITCHER (Cursor-reactive, click-animated, wheel-navigable) */}
      {activeTab !== 'home' && (
        <nav 
          ref={navRef}
          aria-label="Tab Navigation"
          onMouseMove={handleNavMouseMove}
          onMouseEnter={() => setIsNavHovered(true)}
          onMouseLeave={handleNavMouseLeave}
          style={{
            position: 'absolute',
            left: '1.5rem',
            top: '50%',
            transform: isNavHovered 
              ? `translateY(-50%) perspective(600px) rotateX(${navTilt.x}deg) rotateY(${navTilt.y}deg) scale(1.025)` 
              : 'translateY(-50%) perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--accent)',
            borderRadius: '999px',
            padding: '4px 8px 4px 6px',
            boxShadow: isNavHovered 
              ? '0 14px 32px rgba(0, 0, 0, 0.28), var(--shadow-lg)' 
              : '0 8px 24px rgba(0, 0, 0, 0.22)',
            boxSizing: 'border-box',
            height: '48px',
            overflow: 'hidden',
            transition: 'transform 0.15s ease-out, box-shadow 0.2s ease',
            cursor: 'pointer'
          }}
          title={uiLang === 'ta' ? 'பிரிவுகளை மாற்ற கிளிக் செய்க அல்லது ஸ்க்ரோல் செய்க' : 'Click or scroll with mouse wheel to switch tabs'}
        >
          {/* Dynamic Cursor Spotlight Glow on Floating Bar */}
          {isNavHovered && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '999px',
              pointerEvents: 'none',
              background: `radial-gradient(130px circle at ${navCursorPos.x}px ${navCursorPos.y}px, rgba(255, 255, 255, 0.32), transparent 75%)`,
              zIndex: 1
            }} />
          )}

          {/* Brand Circle Emblem (Home Button with Tactile Click Bounce) */}
          <button 
            onClick={() => setActiveTab('home')}
            onMouseDown={() => setActiveClickId('home')}
            onMouseUp={() => setActiveClickId(null)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              marginRight: '2px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              zIndex: 2,
              transform: activeClickId === 'home' ? 'scale(0.88)' : (isNavHovered ? 'scale(1.04)' : 'scale(1)'),
              transition: 'transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            title={uiLang === 'ta' ? 'முகப்புக்குச் செல்க (Home)' : 'Go to Home'}
          >
            <Cloud size={18} style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />
          </button>

          {/* Tab Items with Perfectly Aligned Icons, Labels, Spacing & Click Animation */}
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;
            const isPressed = activeClickId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                onMouseDown={() => setActiveClickId(item.id)}
                onMouseUp={() => setActiveClickId(null)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '5px 10px 6px 10px',
                  borderRadius: isActive ? '12px' : '8px',
                  backgroundColor: isActive ? 'rgba(0, 0, 0, 0.22)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.76)',
                  zIndex: 2,
                  transform: isPressed 
                    ? 'scale(0.88)' 
                    : (isActive ? 'scale(1.02)' : 'scale(1)'),
                  transition: 'transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease, color 0.15s ease',
                  minWidth: '48px',
                  height: '40px',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.76)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                title={item.label}
              >
                {/* Fixed Icon Frame for 100% Consistent Centerline */}
                <div style={{
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComponent size={15} strokeWidth={isActive ? 2.4 : 1.9} />
                </div>

                {/* Micro Label with Stable Baseline */}
                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: isActive ? 750 : 550,
                  lineHeight: 1,
                  letterSpacing: '0.01em',
                  display: 'block'
                }}>
                  {item.label}
                </span>

                {/* Subtle Active Dot */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff'
                  }} />
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* UNIFIED SEARCH BAR: EXACT SAME POSITION, SAME SIZE (1060px), FIXED AT TOP ACROSS ALL SECTIONS */}
      <div style={{
        flex: 1,
        maxWidth: '1060px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div
          ref={searchBarRef}
          onClick={onOpenSearch}
          onMouseMove={handleSearchMouseMove}
          onMouseEnter={() => setIsSearchHovered(true)}
          onMouseLeave={() => setIsSearchHovered(false)}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--bg-surface)',
            border: `1px solid ${isSearchHovered ? 'var(--accent)' : 'var(--border-subtle)'}`,
            padding: '7px 10px 7px 20px',
            minHeight: '52px',
            borderRadius: '10px',
            cursor: 'pointer',
            overflow: 'hidden',
            boxSizing: 'border-box',
            transform: isSearchHovered ? 'translateY(-2px)' : 'translateY(0)',
            boxShadow: isSearchHovered 
              ? '0 12px 30px rgba(0, 0, 0, 0.1), var(--shadow-md)' 
              : 'var(--shadow-sm)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease'
          }}
          title={uiLang === 'ta' ? 'தேடுவதற்கு கிளிக் செய்க (Ctrl+K)' : 'Search scripture, books, or songs (Ctrl+K)'}
        >
          {/* Dynamic Cursor-Following Spotlight Glow */}
          {isSearchHovered && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: `radial-gradient(400px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(179, 115, 38, 0.12), transparent 70%)`,
              zIndex: 1
            }} />
          )}

          {/* Search Icon & Placeholder Text (Perfect Vertical Centering, Only "Search") */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            flex: 1, 
            zIndex: 2, 
            minWidth: 0,
            height: '100%'
          }}>
            <Search 
              size={18} 
              style={{ 
                color: 'var(--accent)', 
                flexShrink: 0,
                transform: isSearchHovered ? 'scale(1.12) rotate(-5deg)' : 'scale(1)',
                transition: 'transform 0.2s ease',
                display: 'block'
              }} 
            />
            <span style={{ 
              color: isSearchHovered ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              fontSize: '0.94rem',
              fontWeight: 500,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              userSelect: 'none'
            }}>
              Search
            </span>
          </div>

          {/* INTEGRATED SIDE BUTTONS: Divider + [Projector Button] + [Settings Button] */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, zIndex: 3 }}>
            {/* Subtle Vertical Divider */}
            <div style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'var(--border-subtle)',
              margin: '0 4px'
            }} />

            {/* Integrated Projector Popout Icon Button with Tooltip */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenProjector();
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: activeSlide ? 'var(--live-badge-bg)' : 'var(--bg-canvas)',
                color: activeSlide ? '#ffffff' : 'var(--text-primary)',
                border: `1px solid ${activeSlide ? 'transparent' : 'var(--border-subtle)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeSlide ? '0 0 10px rgba(230, 81, 0, 0.4)' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                if (!activeSlide) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                if (!activeSlide) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              title={
                activeSlide
                  ? (uiLang === 'ta' ? 'திரையில் ஒளிபரப்பப்படுகிறது · 2வது திரை சாளரம்' : 'Broadcasting Live · Projector Output Window')
                  : (uiLang === 'ta' ? '2வது திரைக்கான ப்ரொஜெக்ஷன் சாளரத்தைத் திறக்க (Pop out)' : 'Open Standalone Projector Window (2nd Display)')
              }
            >
              <Tv size={16} />
            </button>

            {/* Integrated Settings Icon Button with Tooltip */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              title={uiLang === 'ta' ? 'அமைப்புகள் & வண்ணத் தோற்றம் (Settings)' : 'Settings & Themes'}
            >
              <Settings size={16} />
            </button>

            {/* Integrated Profile / Sign-in Icon Button with Tooltip */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAuth) onOpenAuth();
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: user?.avatarUrl ? '50%' : '8px',
                backgroundColor: 'var(--bg-canvas)',
                border: user ? '1.5px solid var(--accent)' : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: user ? 'var(--accent)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                overflow: 'visible',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = user ? 'var(--accent)' : 'var(--border-subtle)';
                e.currentTarget.style.color = user ? 'var(--accent)' : 'var(--text-primary)';
              }}
              title={
                user
                  ? `${user.fullName} (${user.email}) · ${uiLang === 'ta' ? 'சுயவிவரம்' : 'Profile'}`
                  : (uiLang === 'ta' ? 'உள்நுழைக / சுயவிவரம் (Sign In / Profile)' : 'Sign In / Profile')
              }
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : user ? (
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)' }}>
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
              ) : (
                <User size={16} />
              )}
              {/* Online Green Pulse Indicator when logged in */}
              {user && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '9px',
                    height: '9px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%',
                    border: '1.5px solid var(--bg-surface)',
                    boxShadow: '0 0 4px #10b981'
                  }}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
