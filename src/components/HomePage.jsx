import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Music, 
  Tv, 
  SunMedium, 
  Wrench 
} from 'lucide-react';
import { translations } from '../lib/i18n';

// 3D Realistic Pushpin with dynamic "Unpinning" hover animation
function PushPin({ color = '#ef4444', isHovered = false }) {
  return (
    <div style={{
      position: 'absolute',
      top: '-15px',
      left: '50%',
      transform: isHovered 
        ? 'translate(-50%, -12px) rotate(-14deg) scale(1.22)' 
        : 'translate(-50%, 0) rotate(0deg) scale(1)',
      transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.28s ease',
      zIndex: 30,
      pointerEvents: 'none',
      filter: isHovered 
        ? 'drop-shadow(0 14px 10px rgba(0, 0, 0, 0.35))' 
        : 'drop-shadow(0 4px 5px rgba(0, 0, 0, 0.4))'
    }}>
      <svg width="26" height="30" viewBox="0 0 26 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="13" cy="26" rx="3.5" ry="1.5" fill="rgba(0,0,0,0.45)" />
        <path d="M13 18V26" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="13" cy="16.5" rx="5" ry="2" fill={color} />
        <circle cx="13" cy="11" r="7.5" fill={color} />
        <ellipse cx="10.5" cy="8" rx="3.2" ry="2" fill="#ffffff" opacity="0.75" transform="rotate(-25 10.5 8)" />
        <circle cx="15.5" cy="13.5" r="1.5" fill="#ffffff" opacity="0.3" />
        <ellipse cx="13" cy="5.5" rx="4" ry="1.6" fill={color} />
      </svg>
    </div>
  );
}

// 3D Parallax Interactive Card where Pin & Card share the exact transform
function InteractiveCard({ card, onNavigate, isMobile = false, isLastCard = false }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });

  const handleMouseMove = (e) => {
    if (isMobile || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / (rect.height / 2)) * 14;
    const rotateY = (x / (rect.width / 2)) * 14;
    const glareX = ((e.clientX - rect.left) / rect.width) * 100;
    const glareY = ((e.clientY - rect.top) / rect.height) * 100;
    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handleMouseEnter = () => { if (!isMobile) setIsHovered(true); };
  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
    }
  };

  const combinedTransform = isMobile
    ? 'none'
    : isHovered
      ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-16px) scale3d(1.06, 1.06, 1.06)`
      : `rotate(${card.tilt}) translateY(${card.offsetY})`;

  const CardIcon = card.icon;

  return (
    <div
      ref={cardRef}
      onClick={() => onNavigate(card.id)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        flex: isMobile ? undefined : 1,
        gridColumn: isMobile && isLastCard ? 'span 2' : undefined,
        minWidth: isMobile ? '0' : '175px',
        maxWidth: isMobile ? 'none' : '225px',
        position: 'relative',
        transform: combinedTransform,
        transition: isHovered 
          ? 'transform 0.08s ease-out' 
          : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        zIndex: isHovered ? 35 : 10,
        userSelect: 'none'
      }}
    >
      {/* 3D Push Pin locked to the top center of this card */}
      <PushPin color={card.pinColor} isHovered={isHovered} />

      {/* Pinned Card Body */}
      <div
        style={{
          width: '100%',
          minHeight: isMobile ? '78px' : '215px',
          maxHeight: isMobile ? '90px' : '245px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '0.55rem 0.75rem 0.45rem 0.75rem' : '1.4rem 1.1rem 1.15rem 1.1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isHovered
            ? '0 24px 44px rgba(0, 0, 0, 0.18), var(--shadow-lg)'
            : '0 8px 24px rgba(0, 0, 0, 0.07), var(--shadow-sm)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        {/* Dynamic Glare Sheen across the paper on hover */}
        {isHovered && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.28) 0%, transparent 65%)`,
            borderRadius: '12px',
            zIndex: 8
          }} />
        )}

        {/* BIG WATERMARK-STYLE MINIMAL THICK ICON WITH FADED BOTTOM */}
        <div style={{
          position: 'absolute',
          right: '-10px',
          bottom: '-12px',
          width: '105px',
          height: '105px',
          color: card.numColor,
          pointerEvents: 'none',
          zIndex: 1,
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0) 90%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0) 90%)',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: isHovered ? 'scale(1.15) rotate(-6deg)' : 'scale(1) rotate(0deg)'
        }}>
          {card.watermarkIcon}
        </div>

        {/* REPLACED BOX THING: SLEEK SUITABLE ICON IN TOP-LEFT */}
        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', zIndex: 4 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              backgroundColor: card.accentBg,
              color: card.numColor,
              border: '1px solid var(--border-subtle)',
              flexShrink: 0
            }}>
              <CardIcon size={12} strokeWidth={2.4} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-okine)',
              fontSize: '0.90rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {card.title}
            </h2>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            backgroundColor: card.accentBg,
            color: card.numColor,
            marginBottom: '0.75rem',
            zIndex: 4,
            border: '1px solid var(--border-subtle)'
          }}>
            <CardIcon size={16} strokeWidth={2.4} />
          </div>
        )}

        {/* Main Text as Center Attraction */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 4, marginTop: isMobile ? '2px' : undefined }}>
          {!isMobile && (
            <h2 style={{
              fontFamily: 'var(--font-okine)',
              fontSize: 'clamp(1.35rem, 1.8vw, 1.65rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: '0.45rem'
            }}>
              {card.title}
            </h2>
          )}

          {/* Very Short Description */}
          <p style={{
            fontSize: isMobile ? '0.68rem' : '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.25,
            margin: 0,
            fontWeight: 500,
            whiteSpace: isMobile ? 'nowrap' : undefined,
            overflow: isMobile ? 'hidden' : undefined,
            textOverflow: isMobile ? 'ellipsis' : undefined
          }}>
            {card.desc}
          </p>
        </div>

        {/* Bottom Accent Line */}
        <div style={{
          height: isMobile ? '2px' : '3px',
          width: isMobile ? '20px' : '28px',
          backgroundColor: card.pinColor,
          borderRadius: '2px',
          opacity: 0.7,
          marginTop: isMobile ? '2px' : '0.75rem',
          zIndex: 4
        }} />
      </div>
    </div>
  );
}

export function HomePage({ onNavigate, uiLang = 'ta' }) {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 600, y: 350 });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleContainerMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Cursor Parallax Offsets for Realistic Reactive Cloud Drift
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const dx = mousePos.x - winW / 2;
  const dy = mousePos.y - winH / 2;

  const cards = [
    {
      id: 'bible',
      icon: BookOpen,
      title: uiLang === 'ta' ? 'வேதாகமம்' : 'Bible',
      desc: uiLang === 'ta' ? 'புதிய பதிப்பு & KJV வாசிப்பு' : 'New Ortho & KJV Scripture',
      pinColor: '#f97316',
      accentBg: 'rgba(249, 115, 22, 0.1)',
      numColor: '#ea580c',
      tilt: '-1.4deg',
      offsetY: '-14px',
      watermarkIcon: (
        <svg width="105" height="105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
          <path d="M6 14h6" />
        </svg>
      )
    },
    {
      id: 'songs',
      icon: Music,
      title: uiLang === 'ta' ? 'பாடல்கள்' : 'Songs',
      desc: uiLang === 'ta' ? 'கிறிஸ்தவ பாடல்கள் & வரிகள்' : 'Christian Songs & Lyrics',
      pinColor: '#2563eb',
      accentBg: 'rgba(37, 99, 235, 0.1)',
      numColor: '#2563eb',
      tilt: '1.2deg',
      offsetY: '18px',
      watermarkIcon: (
        <svg width="105" height="105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      )
    },
    {
      id: 'projector',
      icon: Tv,
      title: uiLang === 'ta' ? 'ப்ரொஜெக்டர்' : 'Projector',
      desc: uiLang === 'ta' ? 'இரட்டைத் திரை நேரடி கன்சோல்' : 'Dual Screen Live Console',
      pinColor: '#7c3aed',
      accentBg: 'rgba(124, 58, 237, 0.1)',
      numColor: '#7c3aed',
      tilt: '-0.8deg',
      offsetY: '-10px',
      watermarkIcon: (
        <svg width="105" height="105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
          <path d="m9 9 6 3-6 3Z" fill="currentColor" stroke="none" opacity="0.3" />
        </svg>
      )
    },
    {
      id: 'daily',
      icon: SunMedium,
      title: uiLang === 'ta' ? 'அன்றாட வசனம்' : 'Daily Verse',
      desc: uiLang === 'ta' ? 'இன்றைய நாளுக்கான வேத மன்னா' : "Today's Scripture & Card",
      pinColor: '#d97706',
      accentBg: 'rgba(217, 119, 6, 0.1)',
      numColor: '#d97706',
      tilt: '1.4deg',
      offsetY: '20px',
      watermarkIcon: (
        <svg width="105" height="105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      )
    },
    {
      id: 'tools',
      icon: Wrench,
      title: uiLang === 'ta' ? 'கருவிகள்' : 'Tools',
      desc: uiLang === 'ta' ? 'பாடல் வரிகள் PPTX & PDF' : 'Lyrics to PPTX & PDF',
      pinColor: '#059669',
      accentBg: 'rgba(5, 150, 105, 0.1)',
      numColor: '#059669',
      tilt: '-1.2deg',
      offsetY: '-6px',
      watermarkIcon: (
        <svg width="105" height="105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      )
    }
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        overflowY: isMobile ? 'auto' : 'hidden',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '0.75rem 0.75rem 1.5rem 0.75rem' : '0 2rem',
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      {/* 1. INTERACTIVE MOUSE-FOLLOWING AMBIENT GRADIENT BG */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: `
            radial-gradient(750px circle at ${mousePos.x}px ${mousePos.y}px, var(--accent-light) 0%, transparent 65%),
            radial-gradient(550px circle at 80% 20%, rgba(229, 185, 101, 0.08) 0%, transparent 60%),
            radial-gradient(600px circle at 15% 85%, rgba(37, 99, 235, 0.05) 0%, transparent 60%)
          `,
          transition: 'background 0.08s ease-out'
        }}
      />

      {/* 2. SUBTLE ANIMATED CLOUDS WITH CURSOR REACTIVITY & FEATHERED EDGES */}
      {/* Cloud 1: Top Left Drifting & Parallax Cloud */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          left: '-60px',
          width: '580px',
          pointerEvents: 'none',
          zIndex: 2,
          transform: `translate3d(${dx * 0.03}px, ${dy * 0.03}px, 0)`,
          transition: 'transform 0.15s ease-out'
        }}
      >
        <img
          src="/images/clouds/cloud-1.png"
          alt=""
          style={{
            width: '100%',
            opacity: 0.72,
            filter: 'drop-shadow(0 20px 35px rgba(150, 120, 85, 0.3)) contrast(1.05)',
            animation: 'floatCloudLeft 26s ease-in-out infinite',
            userSelect: 'none'
          }}
        />
      </div>

      {/* Cloud 2: Top Right Drifting & Parallax Cloud */}
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-70px',
          width: '600px',
          pointerEvents: 'none',
          zIndex: 2,
          transform: `translate3d(${-dx * 0.025}px, ${-dy * 0.025}px, 0)`,
          transition: 'transform 0.15s ease-out'
        }}
      >
        <img
          src="/images/clouds/cloud-2.png"
          alt=""
          style={{
            width: '100%',
            opacity: 0.7,
            filter: 'drop-shadow(0 22px 38px rgba(150, 120, 85, 0.28)) contrast(1.05)',
            animation: 'floatCloudRight 30s ease-in-out infinite',
            userSelect: 'none'
          }}
        />
      </div>

      {/* Cloud 3: Floating Behind Center Stage (Replaced with Feathered Cloud, Zero Rough Edges) */}
      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: '50%',
          width: '880px',
          pointerEvents: 'none',
          zIndex: 2,
          transform: `translate(-50%, -50%) translate3d(${dx * 0.015}px, ${dy * 0.015}px, 0)`,
          transition: 'transform 0.15s ease-out'
        }}
      >
        <img
          src="/images/clouds/cloud-center.png"
          alt=""
          style={{
            width: '100%',
            opacity: 0.78,
            filter: 'drop-shadow(0 25px 45px rgba(150, 120, 85, 0.32)) contrast(1.05)',
            maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 82%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 82%)',
            animation: 'floatCloudCenter 24s ease-in-out infinite',
            userSelect: 'none'
          }}
        />
      </div>

      {/* Cloud 4: Bottom Left Atmospheric Parallax Cloud */}
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '8%',
          width: '540px',
          pointerEvents: 'none',
          zIndex: 2,
          transform: `translate3d(${-dx * 0.035}px, ${dy * 0.03}px, 0)`,
          transition: 'transform 0.15s ease-out'
        }}
      >
        <img
          src="/images/clouds/cloud-4.png"
          alt=""
          style={{
            width: '100%',
            opacity: 0.65,
            filter: 'drop-shadow(0 20px 35px rgba(150, 120, 85, 0.25)) contrast(1.05)',
            maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 85%)',
            animation: 'floatCloudRight 28s ease-in-out infinite',
            userSelect: 'none'
          }}
        />
      </div>

      {/* 3. HERO SECTION (TALINA FONT FOR HERO TITLE, REDUCED JOHN 8:32 MOTTO) */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '0.65rem' : '2.5rem',
        marginTop: isMobile ? '0.15rem' : undefined,
        zIndex: 15,
        animation: 'fadeIn 0.25s ease-out'
      }}>
        {/* HERO TITLE IN TALINA FONT */}
        <h1 style={{
          fontFamily: 'Talina, var(--font-talina), Georgia, serif',
          fontSize: isMobile ? 'clamp(2.1rem, 7.5vw, 2.7rem)' : 'clamp(3.6rem, 6.8vw, 5.4rem)',
          fontWeight: 400,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
          lineHeight: 1.05,
          marginBottom: isMobile ? '0.2rem' : '0.45rem',
          textShadow: '0 2px 14px rgba(0,0,0,0.04)'
        }}>
          Worship Cloud
        </h1>

        {/* ULTRA-REDUCED SCRIPTURE MOTTO IN MALIBU SUNDAY */}
        <div style={{
          fontFamily: 'var(--font-malibu)',
          fontStyle: 'italic',
          color: 'var(--text-secondary)',
          fontSize: isMobile ? '0.68rem' : '0.78rem',
          letterSpacing: '0.04em',
          maxWidth: '650px',
          margin: '0 auto',
          lineHeight: 1.25,
          opacity: 0.7
        }}>
          {uiLang === 'ta' 
            ? '“சத்தியத்தை அறிவீர்கள், சத்தியம் உங்களை விடுதலையாக்கும்.” — யோவான் 8:32'
            : '"And ye shall know the truth, and the truth shall make you free." — John 8:32'}
        </div>
      </div>

      {/* 4. CENTER STAGE: CARDS IN MIDDLE OVER AMBIENT CLOUDS */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: isMobile ? '390px' : '1240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
      }}>
        {/* Subtle Curved Dotted Connecting Path on Desktop only */}
        {!isMobile && (
          <svg
            style={{
              position: 'absolute',
              top: '50%',
              left: '3%',
              width: '94%',
              height: '120px',
              transform: 'translateY(-50%)',
              zIndex: 2,
              pointerEvents: 'none',
              overflow: 'visible',
              opacity: 0.35
            }}
            viewBox="0 0 1000 120"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M 50 40 Q 250 110, 500 50 T 950 60"
              stroke="var(--border-strong)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          </svg>
        )}

        {/* CARDS ROW (DESKTOP: ROW OF 5; MOBILE: 2 COLS X 3 ROWS VERTICAL GRID FIT IN 100%) */}
        <div style={{
          display: isMobile ? 'grid' : 'flex',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : undefined,
          flexDirection: isMobile ? undefined : 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMobile ? '0.55rem' : '1.25rem',
          width: '100%',
          zIndex: 10,
          padding: isMobile ? '0.25rem 0' : '1.5rem 0'
        }}>
          {cards.map((card, idx) => (
            <InteractiveCard
              key={card.id}
              card={card}
              onNavigate={onNavigate}
              isMobile={isMobile}
              isLastCard={idx === cards.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
