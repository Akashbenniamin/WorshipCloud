import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  User,
  X,
  ArrowRight,
  CornerDownLeft,
  Download
} from 'lucide-react';
import { translations } from '../lib/i18n';
import { parseReferenceQuery, normalizeSearch, filterBooksByQuery } from '../lib/searchParser';
import { rankSongResults } from '../lib/songParser';

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
  onOpenAuth,
  booksMeta = [],
  songsIndex = [],
  onSelectBibleReference,
  onSelectPage,
  onSelectSong,
  onOpenInstallModal,
  onPromptInstall,
  isAppInstalled = false,
  installPrompt = null
}) {
  const t = translations[uiLang] || translations.ta;

  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 200, y: 25 });
  const searchBarRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // In-Place Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Global Ctrl+K / Cmd+K to focus search input directly in the search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchDropdownOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Long-press mobile bottom bar fullscreen logic
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressTriggeredRef = useRef(false);

  const toggleFullscreen = async () => {
    try {
      const doc = document.documentElement;
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs) {
        if (doc.requestFullscreen) {
          await doc.requestFullscreen();
        } else if (doc.webkitRequestFullscreen) {
          await doc.webkitRequestFullscreen();
        }
        if (navigator.vibrate) navigator.vibrate(60);
        window.history.pushState({ isMobileFullscreen: true }, '');
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request:', err);
    }
  };

  const startLongPress = (clientX, clientY) => {
    touchStartPosRef.current = { x: clientX, y: clientY };
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      toggleFullscreen();
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const checkMoveCancel = (clientX, clientY) => {
    const dx = Math.abs(clientX - touchStartPosRef.current.x);
    const dy = Math.abs(clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      cancelLongPress();
    }
  };

  // Fullscreen change and browser back button (popstate) handling
  useEffect(() => {
    const handlePopState = () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen().catch(() => {});
        }
      }
    };

    const handleFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs && window.history.state?.isMobileFullscreen) {
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 1. Direct scripture / page reference jump
  const parsedRef = useMemo(() => {
    return parseReferenceQuery(searchQuery, booksMeta);
  }, [searchQuery, booksMeta]);

  // 2. Matching Bible books in Tamil, English, and Tanglish
  const matchedBooks = useMemo(() => {
    return filterBooksByQuery(searchQuery, booksMeta, 5);
  }, [searchQuery, booksMeta]);

  // 3. Matching Songs in Tanglish, English, and Tamil
  const matchedSongs = useMemo(() => {
    if (!songsIndex || !searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const needle = normalizeSearch(searchQuery);
    const matches = [];
    for (const s of songsIndex) {
      const qMatch = s.q && s.q.includes(needle);
      const tMatch = s.t && normalizeSearch(s.t).includes(needle);
      const sMatch = s.s && normalizeSearch(s.s).includes(needle);
      const nMatch = s.n && String(s.n) === needle;
      if (qMatch || tMatch || sMatch || nMatch) {
        matches.push(s);
        if (matches.length >= 80) break;
      }
    }
    return rankSongResults(matches, searchQuery).slice(0, 7);
  }, [songsIndex, searchQuery]);

  const handleSelectRef = (ref) => {
    if (!ref) return;
    if (ref.type === 'page') {
      onSelectPage?.(ref.page);
    } else {
      onSelectBibleReference?.(ref.book.code, ref.chapter, ref.verse);
    }
    setIsSearchDropdownOpen(false);
    setSearchQuery('');
    searchInputRef.current?.blur();
  };

  const handleSelectBookItem = (b) => {
    if (!b) return;
    onSelectBibleReference?.(b.code, 1, 1);
    setIsSearchDropdownOpen(false);
    setSearchQuery('');
    searchInputRef.current?.blur();
  };

  const handleSelectSongItem = (song) => {
    if (!song) return;
    onSelectSong?.(song);
    setIsSearchDropdownOpen(false);
    setSearchQuery('');
    searchInputRef.current?.blur();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsSearchDropdownOpen(false);
      searchInputRef.current?.blur();
    } else if (e.key === 'Enter') {
      if (parsedRef) {
        handleSelectRef(parsedRef);
      } else if (matchedBooks.length > 0) {
        handleSelectBookItem(matchedBooks[0]);
      } else if (matchedSongs.length > 0) {
        handleSelectSongItem(matchedSongs[0]);
      }
    }
  };

  // Responsive mobile detection
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'bible', label: 'Bible', icon: BookOpen },
    { id: 'songs', label: 'Songs', icon: Music },
    { id: 'daily', label: 'Daily', icon: SunMedium },
    { id: 'tools', label: 'Tools', icon: Wrench },
  ];

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
    <>
      {(!isMobile || (activeTab !== 'bible' && activeTab !== 'songs' && activeTab !== 'daily')) && (
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(var(--bg-canvas), 0.94)',
          borderBottom: 'none',
          padding: isMobile ? '0.5rem 0.5rem 0.3rem 0.5rem' : '0.85rem 2rem 0.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* FLOATING TOP-LEFT PILL TAB SWITCHER (Desktop only: cursor-reactive, click-animated, wheel-navigable) */}
          {!isMobile && activeTab !== 'home' && (
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

      {/* UNIFIED SEARCH BAR WITH IN-PLACE AUTOCOMPLETE DROPDOWN */}
      <div 
        ref={searchContainerRef}
        style={{
          position: 'relative',
          flex: 1,
          maxWidth: isMobile ? '100%' : (activeTab !== 'home' ? 'calc(100% - 370px)' : '1060px'),
          margin: isMobile ? '0 auto' : (activeTab !== 'home' ? '0 0 0 auto' : '0 auto'),
          width: '100%'
        }}
      >
        <div
          ref={searchBarRef}
          onClick={() => {
            searchInputRef.current?.focus();
            setIsSearchDropdownOpen(true);
          }}
          onMouseMove={handleSearchMouseMove}
          onMouseEnter={() => setIsSearchHovered(true)}
          onMouseLeave={() => setIsSearchHovered(false)}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isMobile ? '6px' : '12px',
            backgroundColor: 'var(--bg-surface)',
            border: `1px solid ${isSearchFocused || isSearchHovered ? 'var(--accent)' : 'var(--border-subtle)'}`,
            padding: isMobile ? '4px 6px 4px 10px' : '7px 10px 7px 18px',
            minHeight: isMobile ? '42px' : '52px',
            borderRadius: '10px',
            cursor: 'text',
            boxSizing: 'border-box',
            transform: isSearchHovered ? 'translateY(-1px)' : 'translateY(0)',
            boxShadow: isSearchFocused 
              ? '0 0 0 2px var(--accent-light), var(--shadow-md)' 
              : (isSearchHovered ? '0 8px 24px rgba(0, 0, 0, 0.08)' : 'var(--shadow-sm)'),
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease'
          }}
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
              borderRadius: '9px',
              background: `radial-gradient(400px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(179, 115, 38, 0.12), transparent 70%)`,
              zIndex: 1
            }} />
          )}

          {/* Search Icon & Direct Input Field */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '8px' : '12px', 
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
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onFocus={() => {
                setIsSearchFocused(true);
                setIsSearchDropdownOpen(true);
              }}
              onBlur={() => {
                setIsSearchFocused(false);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={uiLang === 'ta' ? 'வேத வசனம், புத்தகம், பாடல் தேடுக...' : 'Search Bible, books or songs...'}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: isMobile ? '0.86rem' : '0.94rem',
                fontWeight: 550,
                minWidth: 0,
                padding: 0,
                fontFamily: 'inherit'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  flexShrink: 0
                }}
                title={uiLang === 'ta' ? 'அழிக்க' : 'Clear'}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* INTEGRATED SIDE BUTTONS: Divider + [Projector Button] + [Settings Button] */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '6px', flexShrink: 0, zIndex: 3 }}>
            {/* Subtle Vertical Divider */}
            <div style={{
              width: '1px',
              height: isMobile ? '20px' : '24px',
              backgroundColor: 'var(--border-subtle)',
              margin: isMobile ? '0 2px' : '0 4px'
            }} />

            {/* Integrated Projector Popout Icon Button with Tooltip (Desktop only) */}
            {!isMobile && (
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
            )}

            {/* Integrated Settings Icon Button with Tooltip */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              style={{
                width: isMobile ? '31px' : '36px',
                height: isMobile ? '31px' : '36px',
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
              <Settings size={isMobile ? 15 : 16} />
            </button>

            {/* Integrated Install App / Add to Home Screen Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenInstallModal) onOpenInstallModal();
              }}
              style={{
                width: isMobile ? '31px' : '36px',
                height: isMobile ? '31px' : '36px',
                borderRadius: '8px',
                backgroundColor: isAppInstalled ? 'rgba(5, 150, 105, 0.12)' : 'var(--bg-canvas)',
                border: `1px solid ${isAppInstalled ? 'rgba(5, 150, 105, 0.3)' : 'var(--border-subtle)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isAppInstalled ? '#059669' : 'var(--text-primary)',
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
                e.currentTarget.style.borderColor = isAppInstalled ? 'rgba(5, 150, 105, 0.3)' : 'var(--border-subtle)';
                e.currentTarget.style.color = isAppInstalled ? '#059669' : 'var(--text-primary)';
              }}
              title={
                isAppInstalled
                  ? (uiLang === 'ta' ? 'செயலி நிறுவப்பட்டுள்ளது (Installed)' : 'App Installed')
                  : (uiLang === 'ta' ? 'செயலியை நிறுவு / முகப்புத் திரை' : 'Install App / Add to Home Screen')
              }
            >
              <Download size={isMobile ? 15 : 16} />
            </button>

            {/* Integrated Profile / Sign-in Icon Button with Tooltip */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAuth) onOpenAuth();
              }}
              style={{
                width: isMobile ? '31px' : '36px',
                height: isMobile ? '31px' : '36px',
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

        {/* IN-PLACE SEARCH RESULTS DROPDOWN (Directly beneath search bar, no blocking modal!) */}
        {isSearchDropdownOpen && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              boxShadow: '0 18px 40px rgba(0, 0, 0, 0.22), 0 6px 16px rgba(0,0,0,0.1)',
              maxHeight: isMobile ? '65vh' : '460px',
              overflowY: 'auto',
              padding: '6px',
              boxSizing: 'border-box'
            }}
          >
            {/* Direct Scripture Reference Card */}
            {parsedRef && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 750, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.04em' }}>
                  {uiLang === 'ta' ? 'நேரடி வேத வாசிப்பு' : 'Direct Scripture Jump'}
                </div>
                {parsedRef.type === 'page' ? (
                  <button
                    type="button"
                    onClick={() => handleSelectRef(parsedRef)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--accent-light)',
                      border: '1px solid var(--accent)',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.94rem' }}>
                          {uiLang === 'ta' ? `அச்சுப் பக்கம் ${parsedRef.page} க்குச் செல்லவும்` : `Jump to page ${parsedRef.page}`}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          Printed Bible page {parsedRef.page}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 750 }}>
                      <span>{uiLang === 'ta' ? 'திறக்க' : 'Open'}</span>
                      <CornerDownLeft size={15} />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectRef(parsedRef)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--accent-light)',
                      border: '1px solid var(--accent)',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.94rem' }}>
                          {parsedRef.book.name} {parsedRef.chapter}:{parsedRef.verse}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {parsedRef.book.english} {parsedRef.chapter}:{parsedRef.verse}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 750 }}>
                      <span>{uiLang === 'ta' ? 'திறக்க' : 'Open'}</span>
                      <CornerDownLeft size={15} />
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Matched Bible Books (Tamil, English, Tanglish) */}
            {matchedBooks.length > 0 && (
              <div style={{ marginBottom: matchedSongs.length > 0 ? '8px' : '0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 750, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.04em' }}>
                  {uiLang === 'ta' ? 'வேதப் புத்தகங்கள்' : 'Bible Books'} ({matchedBooks.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {matchedBooks.map((b) => (
                    <button
                      key={b.code}
                      type="button"
                      onClick={() => handleSelectBookItem(b)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.12s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-canvas)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          {b.index !== undefined ? b.index + 1 : b.code}
                        </div>
                        <div>
                          <div style={{ fontWeight: 750, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {b.name} <span style={{ fontWeight: 550, color: 'var(--text-secondary)' }}>({b.english})</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                            {b.testament === 'OT' ? (uiLang === 'ta' ? 'பழைய ஏற்பாடு' : 'Old Testament') : (uiLang === 'ta' ? 'புதிய ஏற்பாடு' : 'New Testament')} · {b.chapters} {uiLang === 'ta' ? 'அதிகாரங்கள்' : 'Chapters'}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Songs (Tamil, English, Tanglish) */}
            {matchedSongs.length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 750, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.04em' }}>
                  {uiLang === 'ta' ? 'பாடல்கள்' : 'Worship Songs'} ({matchedSongs.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {matchedSongs.map((s) => (
                    <button
                      key={s.id || s.n || s.t}
                      type="button"
                      onClick={() => handleSelectSongItem(s)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.12s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-canvas)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(245, 158, 11, 0.14)',
                          color: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Music size={15} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {(s.t || s.title || '').replace(/^[-—\s]+/, '')}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                            {s.s && s.s !== 'AdoreHim 18K Tamil Songs' ? s.s : (uiLang === 'ta' ? 'தமிழ் ஆராதனைப் பாடல்' : 'Tamil Worship Song')}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No matches notice */}
            {!parsedRef && matchedBooks.length === 0 && matchedSongs.length === 0 && searchQuery.trim().length >= 2 && (
              <div style={{ padding: '1.25rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.84rem' }}>
                {uiLang === 'ta' 
                  ? 'எந்தப் பொருத்தமும் கிடைக்கவில்லை. தயவுசெய்து வேறு வார்த்தையைத் தேடவும்.' 
                  : 'No matching scripture, books, or songs found.'}
              </div>
            )}

            {/* Empty Query Guide */}
            {!searchQuery.trim() && (
              <div style={{ padding: '0.6rem 0.75rem', color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 750, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {uiLang === 'ta' ? 'தேடல் உதாரணங்கள்:' : 'Quick Examples:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '2px' }}>
                  <div>📖 <strong>John 3:16</strong> / <strong>யோவான் 3:16</strong> / <strong>yovan 3:16</strong></div>
                  <div>📚 <strong>சங்கீதம்</strong> / <strong>psalms</strong> / <strong>aathiyagamam</strong></div>
                  <div>🎵 <strong>ஆவியானவரே</strong> / <strong>aaviyanavare</strong></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )}

  {/* MOBILE FIXED BOTTOM TAB SWITCHER BAR (Expands left-to-right edge-to-edge) */}
  {isMobile && (
    <nav
      aria-label="Mobile Navigation Bar"
      onTouchStart={(e) => {
        if (e.touches?.[0]) {
          startLongPress(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches?.[0]) {
          checkMoveCancel(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={() => cancelLongPress()}
      onTouchCancel={() => cancelLongPress()}
      onMouseDown={(e) => startLongPress(e.clientX, e.clientY)}
      onMouseMove={(e) => checkMoveCancel(e.clientX, e.clientY)}
      onMouseUp={() => cancelLongPress()}
      onMouseLeave={() => cancelLongPress()}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '56px',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 90,
        padding: '0 4px',
        boxSizing: 'border-box',
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {mobileNavItems.map((item) => {
        const isActive = activeTab === item.id;
        const IconComponent = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              if (isLongPressTriggeredRef.current) {
                e.preventDefault();
                e.stopPropagation();
                isLongPressTriggeredRef.current = false;
                return;
              }
              setActiveTab(item.id);
            }}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              background: 'transparent',
              border: 'none',
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '3px 0',
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
              transition: 'color 0.15s ease'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3px 12px',
              borderRadius: '12px',
              backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
              transition: 'background-color 0.15s ease'
            }}>
              <IconComponent size={18} strokeWidth={isActive ? 2.4 : 1.9} />
            </div>
            <span style={{
              fontSize: '0.64rem',
              fontWeight: isActive ? 800 : 600,
              lineHeight: 1,
              letterSpacing: '0.01em'
            }}>
              {item.label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: '2px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)'
              }} />
            )}
          </button>
        );
      })}
    </nav>
  )}
</>
  );
}
