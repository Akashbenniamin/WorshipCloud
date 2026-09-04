import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export function ChurchClockView({
  serviceTitle,
  format24h = false,
  showSeconds = true,
  _theme = 'midnight-gold',
  bgType = 'texture',
  textureSrc = './images/card-backgrounds/clouds-golden.jpg',
  bgOverlayOpacity = 0.70,
  bgColor = '#090d16',
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

  const defaultTitle = isEn 
    ? 'Sanctuary Worship Time' 
    : 'ஆலய ஆராதனை நேரம்';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: bgColor,
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif",
      userSelect: 'none',
      boxSizing: 'border-box',
      padding: isMini ? '12px' : '2.5rem'
    }}>
      {/* Texture Background Layer */}
      {bgType === 'texture' && textureSrc && (
        <>
          <img
            src={textureSrc}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: `rgba(0, 0, 0, ${bgOverlayOpacity})`,
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        </>
      )}

      {/* Main Clock Card Container */}
      <div style={{
        position: 'relative',
        zIndex: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        maxWidth: isMini ? '100%' : '1100px'
      }}>
        {/* Service Header Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: isMini ? '3px 10px' : '6px 22px',
          borderRadius: '999px',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 215, 0, 0.35)',
          backdropFilter: 'blur(10px)',
          color: '#fde047',
          fontSize: isMini ? '0.7rem' : 'clamp(0.95rem, 1.8vw, 1.35rem)',
          fontWeight: 750,
          letterSpacing: '0.04em',
          marginBottom: isMini ? '6px' : '18px'
        }}>
          <ClockIcon size={isMini ? 12 : 18} />
          <span>{serviceTitle || defaultTitle}</span>
        </div>

        {/* Large Digital Clock Dial Container */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(20px)',
          borderRadius: isMini ? '10px' : '24px',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          padding: isMini ? '10px 14px' : 'clamp(20px, 3.5vw, 42px) clamp(24px, 5vw, 64px)',
          boxShadow: '0 16px 44px rgba(0, 0, 0, 0.5), inset 0 0 24px rgba(245, 158, 11, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: isMini ? '2px' : 'clamp(4px, 1vw, 12px)',
            fontFamily: "'Outfit', 'Inter', monospace",
            fontWeight: 900,
            lineHeight: 1,
            color: '#ffffff',
            textShadow: '0 0 28px rgba(245, 158, 11, 0.55), 0 4px 14px rgba(0,0,0,0.9)'
          }}>
            {/* Hours */}
            <span style={{ fontSize: isMini ? 'clamp(2rem, 7vw, 3.2rem)' : 'clamp(4.2rem, 10vw, 8.5rem)' }}>
              {hoursStr}
            </span>

            {/* Pulsing Colon */}
            <span style={{
              fontSize: isMini ? 'clamp(1.8rem, 6.5vw, 3rem)' : 'clamp(3.8rem, 9.5vw, 8rem)',
              color: '#fde047',
              margin: '0 2px',
              animation: 'pulseGlow 1s infinite'
            }}>
              :
            </span>

            {/* Minutes */}
            <span style={{ fontSize: isMini ? 'clamp(2rem, 7vw, 3.2rem)' : 'clamp(4.2rem, 10vw, 8.5rem)' }}>
              {minutesStr}
            </span>

            {/* Seconds (Optional) */}
            {showSeconds && (
              <>
                <span style={{
                  fontSize: isMini ? 'clamp(1.8rem, 6.5vw, 3rem)' : 'clamp(3.8rem, 9.5vw, 8rem)',
                  color: '#fde047',
                  margin: '0 2px',
                  animation: 'pulseGlow 1s infinite'
                }}>
                  :
                </span>
                <span style={{
                  fontSize: isMini ? 'clamp(1.6rem, 5.5vw, 2.6rem)' : 'clamp(3.4rem, 8vw, 6.8rem)',
                  color: 'rgba(255, 255, 255, 0.88)'
                }}>
                  {secondsStr}
                </span>
              </>
            )}

            {/* AM / PM Badge (Only when 12-hour mode) */}
            {!format24h && (
              <span style={{
                fontSize: isMini ? '0.68rem' : 'clamp(1rem, 2.2vw, 1.8rem)',
                fontWeight: 850,
                color: '#fde047',
                backgroundColor: 'rgba(245, 158, 11, 0.22)',
                border: '1.5px solid rgba(245, 158, 11, 0.5)',
                borderRadius: isMini ? '4px' : '8px',
                padding: isMini ? '2px 5px' : '4px 10px',
                marginLeft: isMini ? '4px' : '14px',
                alignSelf: 'center',
                letterSpacing: '0.06em'
              }}>
                {ampmStr}
              </span>
            )}
          </div>

          {/* Full Localized Calendar Date */}
          <div style={{
            marginTop: isMini ? '6px' : '18px',
            fontSize: isMini ? '0.72rem' : 'clamp(1.1rem, 2.2vw, 1.75rem)',
            fontWeight: 750,
            color: '#fef3c7',
            letterSpacing: '0.04em',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
          }}>
            {formattedDate}
          </div>
        </div>
      </div>
    </div>
  );
}
