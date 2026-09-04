import React, { useState, useEffect } from 'react';

export function ChurchClockView({
  format24h = false,
  showSeconds = true,
  _theme = 'midnight-gold',
  bgType = 'gradient',
  gradientBg = 'radial-gradient(ellipse at center, #1e1b4b 0%, #0f172a 45%, #020617 100%)',
  bgColor = '#090d16',
  animatedBg = true,
  isMini = false,
  uiLang = 'ta'
}) {
  const isEn = uiLang === 'en';
  const [time, setTime] = useState(() => new Date());

  // High-frequency tick for real-time live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 250);
    return () => clearInterval(timer);
  }, []);

  const hoursRaw = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const isPm = hoursRaw >= 12;
  const hours12 = hoursRaw % 12 || 12;
  const displayHours = format24h ? hoursRaw : hours12;

  const hoursStr = String(displayHours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');
  const ampmStr = isPm ? 'PM' : 'AM';

  // Localized date formatting
  const daysTamil = ['ஞாயிற்றுக்கிழமை', 'திங்கட்கிழமை', 'செவ்வாய்க்கிழமை', 'புதன்கிழமை', 'வியாழக்கிழமை', 'வெள்ளிக்கிழமை', 'சனிக்கிழமை'];
  const monthsTamil = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayName = isEn ? daysEn[time.getDay()] : daysTamil[time.getDay()];
  const monthName = isEn ? monthsEn[time.getMonth()] : monthsTamil[time.getMonth()];
  const dateNum = time.getDate();
  const yearNum = time.getFullYear();

  const formattedDate = isEn 
    ? `${dayName}, ${monthName} ${dateNum}, ${yearNum}`
    : `${dayName}, ${dateNum} ${monthName} ${yearNum}`;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: bgColor,
        background: bgType === 'gradient' ? gradientBg : bgColor,
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif",
        userSelect: 'none',
        boxSizing: 'border-box',
        padding: isMini ? '12px' : '2rem'
      }}
    >
      {/* Optional Ambient Subtle Shimmer Wave */}
      {animatedBg && (
        <div
          style={{
            position: 'absolute',
            inset: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.08) 0%, rgba(56, 189, 248, 0.04) 35%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 1,
            animation: 'rotateClockBg 28s linear infinite'
          }}
        />
      )}

      {/* Main Clock Dial Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          maxWidth: isMini ? '100%' : '1200px'
        }}
      >
        {/* Massive Aesthetic Digital Clock Dial */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(24px)',
            borderRadius: isMini ? '12px' : '28px',
            border: '1.5px solid rgba(245, 158, 11, 0.45)',
            padding: isMini ? '12px 16px' : 'clamp(28px, 4.5vw, 56px) clamp(28px, 6vw, 76px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 0 32px rgba(245, 158, 11, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {/* Subtle Top Rim Sheen */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '15%',
              right: '15%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(254, 240, 138, 0.75), transparent)'
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: isMini ? '2px' : 'clamp(6px, 1.2vw, 16px)',
              fontFamily: "'Outfit', 'Inter', monospace",
              fontWeight: 900,
              lineHeight: 1,
              color: '#ffffff',
              textShadow: '0 0 35px rgba(245, 158, 11, 0.65), 0 6px 18px rgba(0,0,0,0.95)'
            }}
          >
            {/* Hours */}
            <span style={{ fontSize: isMini ? 'clamp(2.6rem, 8.5vw, 3.8rem)' : 'clamp(5.5rem, 13vw, 11.5rem)' }}>
              {hoursStr}
            </span>

            {/* Pulsing Colon */}
            <span
              style={{
                fontSize: isMini ? 'clamp(2.2rem, 7.5vw, 3.4rem)' : 'clamp(5rem, 12vw, 10.5rem)',
                color: '#fde047',
                margin: '0 2px',
                animation: 'pulseGlow 1s infinite'
              }}
            >
              :
            </span>

            {/* Minutes */}
            <span style={{ fontSize: isMini ? 'clamp(2.6rem, 8.5vw, 3.8rem)' : 'clamp(5.5rem, 13vw, 11.5rem)' }}>
              {minutesStr}
            </span>

            {/* Seconds (Optional) */}
            {showSeconds && (
              <>
                <span
                  style={{
                    fontSize: isMini ? 'clamp(2.2rem, 7.5vw, 3.4rem)' : 'clamp(5rem, 12vw, 10.5rem)',
                    color: '#fde047',
                    margin: '0 2px',
                    animation: 'pulseGlow 1s infinite'
                  }}
                >
                  :
                </span>
                <span
                  style={{
                    fontSize: isMini ? 'clamp(2.2rem, 7vw, 3.2rem)' : 'clamp(4.5rem, 10.5vw, 9rem)',
                    color: 'rgba(255, 255, 255, 0.88)'
                  }}
                >
                  {secondsStr}
                </span>
              </>
            )}

            {/* AM / PM Badge (Only when 12-hour mode) */}
            {!format24h && (
              <span
                style={{
                  fontSize: isMini ? 'clamp(0.9rem, 2.5vw, 1.3rem)' : 'clamp(1.5rem, 3.2vw, 2.6rem)',
                  fontWeight: 900,
                  color: '#fde047',
                  marginLeft: isMini ? '4px' : '14px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: isMini ? '2px 6px' : '4px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}
              >
                {ampmStr}
              </span>
            )}
          </div>

          {/* Localized Date Card inside the Clock Dial */}
          <div
            style={{
              marginTop: isMini ? '8px' : '22px',
              padding: isMini ? '4px 12px' : '8px 24px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontSize: isMini ? '0.74rem' : 'clamp(1rem, 1.8vw, 1.45rem)',
              fontWeight: 650,
              letterSpacing: '0.03em'
            }}
          >
            {formattedDate}
          </div>
        </div>
      </div>
    </div>
  );
}
