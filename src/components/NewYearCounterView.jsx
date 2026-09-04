import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

export function getNearestNewYear() {
  const now = new Date();
  const nextYear = now.getFullYear() + 1;
  return new Date(nextYear, 0, 1, 0, 0, 0);
}

export function NewYearCounterView({
  targetDate,
  celebrate = false,
  customGreeting,
  customVerse,
  _theme = 'midnight-gold',
  bgType = 'texture',
  textureSrc = './images/card-backgrounds/sunbeams-golden.jpg',
  bgOverlayOpacity = 0.70,
  bgColor = '#090d16',
  isMini = false,
  uiLang = 'ta'
}) {
  const isEn = uiLang === 'en';
  const finalTarget = targetDate ? new Date(targetDate) : getNearestNewYear();
  const targetYear = finalTarget.getFullYear();

  const [now, setNow] = useState(() => Date.now());
  const canvasRef = useRef(null);

  // Update timer every 250ms for razor-sharp countdown precision
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const totalDiff = Math.max(0, finalTarget.getTime() - now);
  const isTimeUp = totalDiff <= 0;
  const isCelebrationActive = celebrate || isTimeUp;

  const days = Math.floor(totalDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalDiff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalDiff / (1000 * 60)) % 60);
  const seconds = Math.floor((totalDiff / 1000) % 60);

  // Fireworks & Confetti Animation on Canvas when Celebrating
  useEffect(() => {
    if (!isCelebrationActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle system
    const particles = [];
    const colors = ['#f59e0b', '#fbbf24', '#fef08a', '#ef4444', '#ec4899', '#38bdf8', '#34d399', '#a855f7', '#ffffff'];

    class Particle {
      constructor(x, y, isConfetti = false) {
        this.x = x;
        this.y = y;
        this.isConfetti = isConfetti;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        if (isConfetti) {
          this.vx = (Math.random() - 0.5) * 4;
          this.vy = Math.random() * 3 + 1.5;
          this.size = Math.random() * 8 + 4;
          this.tilt = Math.random() * 10;
          this.tiltAngle = Math.random() * Math.PI;
          this.tiltAngleInc = Math.random() * 0.08 + 0.04;
          this.life = 1;
          this.decay = Math.random() * 0.003 + 0.002;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 7 + 2;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
          this.size = Math.random() * 3.5 + 1.5;
          this.life = 1;
          this.decay = Math.random() * 0.015 + 0.01;
          this.gravity = 0.08;
        }
      }

      update() {
        if (this.isConfetti) {
          this.y += this.vy;
          this.x += this.vx + Math.sin(this.tiltAngle) * 0.8;
          this.tiltAngle += this.tiltAngleInc;
          this.tilt = Math.sin(this.tiltAngle) * 12;
          this.life -= this.decay;
        } else {
          this.vx *= 0.98;
          this.vy *= 0.98;
          this.vy += this.gravity;
          this.x += this.vx;
          this.y += this.vy;
          this.life -= this.decay;
        }
      }

      draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.life);
        c.fillStyle = this.color;
        if (this.isConfetti) {
          c.beginPath();
          c.rect(this.x, this.y, this.size, this.size * 0.6);
          c.fill();
        } else {
          c.beginPath();
          c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    }

    const fireworkBursts = () => {
      const x = Math.random() * (width * 0.8) + width * 0.1;
      const y = Math.random() * (height * 0.5) + height * 0.1;
      const count = isMini ? 35 : 70;
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, false));
      }
    };

    let lastBurst = 0;
    const loop = (timestamp) => {
      ctx.clearRect(0, 0, width, height);

      // Periodically trigger a new firework burst
      if (timestamp - lastBurst > (isMini ? 800 : 550)) {
        fireworkBursts();
        lastBurst = timestamp;
      }

      // Add gentle floating confetti from top
      if (Math.random() < 0.35 && particles.length < 350) {
        particles.push(new Particle(Math.random() * width, -10, true));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0 || p.y > height + 20) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    // Initial bursts
    fireworkBursts();
    fireworkBursts();
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isCelebrationActive, isMini]);

  const defaultGreeting = isEn 
    ? 'New Year Watch Night Service' 
    : 'புத்தாண்டு நள்ளிரவு ஆராதனை';

  const defaultCountdownVerse = isEn
    ? '"Behold, I will do a new thing; now it shall spring forth." — Isaiah 43:19'
    : '"இதோ, நான் புதிய காரியத்தைச் செய்கிறேன்; இப்பொழுதே அது தோன்றும்." — ஏசாயா 43:19';

  const defaultCelebrationVerse = isEn
    ? '"The eyes of the LORD thy God are always upon it, from the beginning of the year even unto the end of the year." — Deuteronomy 11:12'
    : '"வருஷத்தின் துவக்கமுதல் வருஷத்தின் முடிவுமட்டும் எப்பொழுதும் உங்கள் தேவனாகிய கர்த்தரின் கண்கள் அதின்மேல் வைக்கப்பட்டிருக்கிறது." — உபாகமம் 11:12';

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
      {/* Background Texture & Scrim Overlay */}
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

      {/* Celebration Canvas for Fireworks & Confetti */}
      {isCelebrationActive && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 3,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        maxWidth: isMini ? '100%' : '1280px'
      }}>
        {/* ========================================================================= */}
        {/* VIEW A: CELEBRATION TRANSITION ANIMATION (Happy New Year)                 */}
        {/* ========================================================================= */}
        {isCelebrationActive ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMini ? '8px' : '18px',
            animation: 'celebrationPop 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Sparkling Top Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMini ? '3px 10px' : '6px 20px',
              borderRadius: '999px',
              backgroundColor: 'rgba(245, 158, 11, 0.22)',
              border: '1.5px solid rgba(245, 158, 11, 0.65)',
              color: '#fde047',
              fontSize: isMini ? '0.72rem' : 'clamp(1rem, 1.8vw, 1.4rem)',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)'
            }}>
              <Sparkles size={isMini ? 12 : 20} />
              <span>{customGreeting || defaultGreeting}</span>
              <Sparkles size={isMini ? 12 : 20} />
            </div>

            {/* Glowing Giant Year Reveal */}
            <div style={{
              fontSize: isMini ? 'clamp(2.4rem, 8vw, 4rem)' : 'clamp(4.8rem, 14vw, 11.5rem)',
              fontWeight: 950,
              lineHeight: 1,
              letterSpacing: '0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 35%, #f59e0b 70%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 35px rgba(245, 158, 11, 0.6), 0 0 70px rgba(245, 158, 11, 0.35)',
              margin: isMini ? '4px 0' : '8px 0',
              fontFamily: "'Outfit', 'Inter', sans-serif"
            }}>
              {targetYear}
            </div>

            {/* Happy New Year Banner */}
            <div style={{
              fontSize: isMini ? 'clamp(1rem, 3.5vw, 1.5rem)' : 'clamp(1.8rem, 4.2vw, 3.8rem)',
              fontWeight: 900,
              color: '#ffffff',
              textShadow: '0 4px 18px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.5)',
              lineHeight: 1.25,
              maxWidth: '90%'
            }}>
              {isEn ? `HAPPY NEW YEAR ${targetYear}!` : `இனிய புத்தாண்டு நல்வாழ்த்துகள் ${targetYear}!`}
            </div>

            {/* Blessing Scripture Card */}
            <div style={{
              maxWidth: isMini ? '95%' : '880px',
              marginTop: isMini ? '4px' : '14px',
              padding: isMini ? '8px 14px' : '18px 32px',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(10px)',
              borderRadius: isMini ? '8px' : '16px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
              <p style={{
                fontSize: isMini ? '0.7rem' : 'clamp(0.95rem, 1.7vw, 1.4rem)',
                color: '#fef3c7',
                lineHeight: 1.55,
                margin: 0,
                fontStyle: 'italic',
                fontWeight: 600
              }}>
                {customVerse || defaultCelebrationVerse}
              </p>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: ACTIVE COUNTDOWN TICKER                                           */
          /* ========================================================================= */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMini ? '8px' : '22px',
            width: '100%'
          }}>
            {/* Header / Church Service Title */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: isMini ? '3px 10px' : '6px 20px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.35)',
              backdropFilter: 'blur(8px)',
              color: '#fde047',
              fontSize: isMini ? '0.7rem' : 'clamp(0.9rem, 1.6vw, 1.25rem)',
              fontWeight: 750,
              letterSpacing: '0.04em'
            }}>
              <Sparkles size={isMini ? 12 : 18} />
              <span>{customGreeting || defaultGreeting}</span>
            </div>

            {/* Target Year Sub-header */}
            <div style={{
              fontSize: isMini ? '0.82rem' : 'clamp(1.1rem, 2.2vw, 1.8rem)',
              fontWeight: 850,
              color: '#ffffff',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: 0.95,
              textShadow: '0 2px 8px rgba(0,0,0,0.6)'
            }}>
              {isEn ? `Countdown to ${targetYear}` : `${targetYear} புத்தாண்டு கவுண்டவுன்`}
            </div>

            {/* Four Glowing Digital Cards: Days, Hours, Mins, Secs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: isMini ? '6px' : 'clamp(12px, 2.2vw, 28px)',
              width: '100%',
              maxWidth: isMini ? '340px' : '980px',
              marginTop: isMini ? '2px' : '8px'
            }}>
              {[
                { val: days, labelTa: 'நாட்கள்', labelEn: 'DAYS' },
                { val: hours, labelTa: 'மணி', labelEn: 'HOURS' },
                { val: minutes, labelTa: 'நிமிடம்', labelEn: 'MINS' },
                { val: seconds, labelTa: 'விநாடி', labelEn: 'SECS' }
              ].map((slot, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.72)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: isMini ? '8px' : '18px',
                    padding: isMini ? '6px 4px' : 'clamp(14px, 2.5vw, 28px) 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), inset 0 0 20px rgba(245, 158, 11, 0.08)',
                    transition: 'border-color 0.2s ease, transform 0.2s ease'
                  }}
                >
                  <div style={{
                    fontSize: isMini ? 'clamp(1.4rem, 5vw, 2.2rem)' : 'clamp(2.8rem, 6.8vw, 5.8rem)',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: '#ffffff',
                    fontFamily: "'Outfit', 'Inter', monospace",
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 24px rgba(245, 158, 11, 0.65), 0 4px 12px rgba(0,0,0,0.8)'
                  }}>
                    {String(slot.val).padStart(2, '0')}
                  </div>
                  <div style={{
                    fontSize: isMini ? '0.55rem' : 'clamp(0.72rem, 1.2vw, 0.95rem)',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    color: '#fde047',
                    marginTop: isMini ? '2px' : '8px',
                    textTransform: 'uppercase'
                  }}>
                    {isEn ? slot.labelEn : slot.labelTa}
                  </div>
                </div>
              ))}
            </div>

            {/* Scripture Promise Banner at Bottom */}
            <div style={{
              maxWidth: isMini ? '95%' : '840px',
              marginTop: isMini ? '4px' : '16px',
              padding: isMini ? '6px 10px' : '14px 28px',
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(8px)',
              borderRadius: isMini ? '6px' : '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <p style={{
                fontSize: isMini ? '0.64rem' : 'clamp(0.85rem, 1.4vw, 1.15rem)',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.45,
                margin: 0,
                fontStyle: 'italic'
              }}>
                {customVerse || defaultCountdownVerse}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
