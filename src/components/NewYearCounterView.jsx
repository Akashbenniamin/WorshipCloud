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
  bgType = 'gradient',
  textureSrc = './images/card-backgrounds/sunbeams-golden.jpg',
  gradientBg = 'radial-gradient(ellipse at center, #1e1b4b 0%, #0f172a 50%, #020617 100%)',
  bgOverlayOpacity = 0.65,
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
        } else {
          this.vy += this.gravity;
          this.x += this.vx;
          this.y += this.vy;
        }
        this.life -= this.decay;
      }

      draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.life);
        c.fillStyle = this.color;
        if (this.isConfetti) {
          c.translate(this.x, this.y);
          c.rotate(this.tiltAngle);
          c.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        } else {
          c.beginPath();
          c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    }

    const fireRocket = () => {
      const rx = Math.random() * width * 0.8 + width * 0.1;
      const ry = Math.random() * height * 0.45 + height * 0.1;
      for (let i = 0; i < 45; i++) {
        particles.push(new Particle(rx, ry, false));
      }
    };

    let rocketTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      rocketTimer++;
      if (rocketTimer % 35 === 0) {
        fireRocket();
      }

      if (Math.random() < 0.3) {
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

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isCelebrationActive]);

  const defaultCelebrationVerse = isEn
    ? '“The LORD bless thee, and keep thee: The LORD make his face shine upon thee, and be gracious unto thee.” — Numbers 6:24-25'
    : '“கர்த்தர் உன்னை ஆசீர்வதித்து, உன்னைக் காக்கக்கடவர்; கர்த்தர் தம்முடைய முகத்தை உன்மேல் பிரகாசிக்கப்பண்ணி, உன்மேல் கிருபையாயிருக்கக்கடவர்.” — எண்ணாகமம் 6:24-25';

  const defaultCountdownVerse = isEn
    ? '“Remember ye not the former things, neither consider the things of old. Behold, I will do a new thing!” — Isaiah 43:18-19'
    : '“முந்தினவைகளை நினைக்கவேண்டாம், பூர்வமானவைகளைச் சிந்திக்கவேண்டாம். இதோ, நான் புதிய காரியத்தைச் செய்கிறேன்!” — ஏசாயா 43:18-19';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: isMini ? '240px' : '420px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: isMini ? '1rem' : '2.5rem',
        backgroundColor: bgColor,
        background: bgType === 'gradient' ? gradientBg : undefined,
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Texture Background Layer if active */}
      {bgType === 'texture' && textureSrc && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${textureSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1
          }}
        />
      )}

      {/* Dark Overlay Layer for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: bgType === 'texture' ? `rgba(0, 0, 0, ${bgOverlayOpacity})` : 'transparent',
          zIndex: 2
        }}
      />

      {/* Canvas for Confetti & Fireworks */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
          width: '100%',
          height: '100%'
        }}
      />

      {/* Primary Content Card Container */}
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
          maxWidth: isMini ? '100%' : '1240px'
        }}
      >
        {isCelebrationActive ? (
          /* ========================================================================= */
          /* CELEBRATION MODE: HAPPY NEW YEAR WITH OKINE BLACK YEAR                   */
          /* ========================================================================= */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMini ? '8px' : '20px',
              animation: 'celebrationPop 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Glowing Giant Year with Okine Black Font */}
            <div
              style={{
                fontSize: isMini ? 'clamp(3rem, 9vw, 5.2rem)' : 'clamp(5.5rem, 15vw, 13rem)',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 35%, #f59e0b 70%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 45px rgba(245, 158, 11, 0.7)) drop-shadow(0 8px 30px rgba(0,0,0,0.8))',
                margin: isMini ? '2px 0' : '6px 0',
                fontFamily: 'OkineBlack, Okine, sans-serif'
              }}
            >
              {targetYear}
            </div>

            {/* Happy New Year Banner */}
            <div
              style={{
                fontSize: isMini ? 'clamp(1.1rem, 3.8vw, 1.7rem)' : 'clamp(2rem, 4.4vw, 4rem)',
                fontWeight: 900,
                color: '#ffffff',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.85), 0 0 32px rgba(245, 158, 11, 0.55)',
                lineHeight: 1.25,
                maxWidth: '92%'
              }}
            >
              {isEn ? `HAPPY NEW YEAR ${targetYear}!` : `இனிய புத்தாண்டு நல்வாழ்த்துகள் ${targetYear}!`}
            </div>

            {/* Blessing Scripture Card */}
            <div
              style={{
                maxWidth: isMini ? '95%' : '880px',
                marginTop: isMini ? '4px' : '14px',
                padding: isMini ? '8px 14px' : '18px 32px',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(12px)',
                borderRadius: isMini ? '8px' : '16px',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55)'
              }}
            >
              <p
                style={{
                  fontSize: isMini ? '0.72rem' : 'clamp(0.95rem, 1.7vw, 1.4rem)',
                  color: '#fef3c7',
                  lineHeight: 1.55,
                  margin: 0,
                  fontStyle: 'italic',
                  fontWeight: 600
                }}
              >
                {customVerse || defaultCelebrationVerse}
              </p>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* COUNTDOWN TICKER: ULTRA-AESTHETIC OKINE YEAR & GLOWING DIGIT CARDS       */
          /* ========================================================================= */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMini ? '10px' : '24px',
              width: '100%'
            }}
          >
            {/* Aesthetic Header with Okine Black Target Year (Badge Removed!) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <div
                style={{
                  fontSize: isMini ? 'clamp(2.4rem, 8vw, 4.4rem)' : 'clamp(4.2rem, 10vw, 8.5rem)',
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: '-0.02em',
                  fontFamily: 'OkineBlack, Okine, sans-serif',
                  background: 'linear-gradient(135deg, #ffffff 10%, #fef08a 45%, #f59e0b 80%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 35px rgba(245, 158, 11, 0.55)) drop-shadow(0 4px 18px rgba(0, 0, 0, 0.7))'
                }}
              >
                {targetYear}
              </div>
              <div
                style={{
                  fontSize: isMini ? '0.72rem' : 'clamp(0.85rem, 1.6vw, 1.2rem)',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.85)',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                }}
              >
                {isEn ? 'NEW YEAR COUNTDOWN' : 'புத்தாண்டு கவுண்டவுன்'}
              </div>
            </div>

            {/* Four Aesthetic Glassmorphic Glowing Digital Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: isMini ? '8px' : 'clamp(12px, 2.4vw, 32px)',
                width: '100%',
                maxWidth: isMini ? '360px' : '1020px'
              }}
            >
              {[
                { val: days, labelTa: 'நாட்கள்', labelEn: 'DAYS' },
                { val: hours, labelTa: 'மணி', labelEn: 'HOURS' },
                { val: minutes, labelTa: 'நிமிடம்', labelEn: 'MINUTES' },
                { val: seconds, labelTa: 'விநாடி', labelEn: 'SECONDS' }
              ].map((slot, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.78)',
                    backdropFilter: 'blur(20px)',
                    border: '1.5px solid rgba(245, 158, 11, 0.38)',
                    borderRadius: isMini ? '10px' : '20px',
                    padding: isMini ? '8px 4px' : 'clamp(18px, 3vw, 34px) 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 0 24px rgba(245, 158, 11, 0.12)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Subtle top light sheen on digit card */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '15%',
                      right: '15%',
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(254, 240, 138, 0.8), transparent)'
                    }}
                  />
                  <div
                    style={{
                      fontSize: isMini ? 'clamp(1.5rem, 5.5vw, 2.4rem)' : 'clamp(3.2rem, 7.5vw, 6.4rem)',
                      fontWeight: 900,
                      lineHeight: 1,
                      color: '#ffffff',
                      fontFamily: 'OkineBlack, Okine, monospace',
                      letterSpacing: '-0.02em',
                      textShadow: '0 0 28px rgba(245, 158, 11, 0.7), 0 4px 14px rgba(0,0,0,0.9)'
                    }}
                  >
                    {String(slot.val).padStart(2, '0')}
                  </div>
                  <div
                    style={{
                      fontSize: isMini ? '0.55rem' : 'clamp(0.72rem, 1.2vw, 0.95rem)',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      color: '#fde047',
                      marginTop: isMini ? '3px' : '10px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {isEn ? slot.labelEn : slot.labelTa}
                  </div>
                </div>
              ))}
            </div>

            {/* Scripture Promise Banner at Bottom */}
            <div
              style={{
                maxWidth: isMini ? '95%' : '860px',
                marginTop: isMini ? '4px' : '14px',
                padding: isMini ? '8px 12px' : '14px 28px',
                backgroundColor: 'rgba(0, 0, 0, 0.60)',
                backdropFilter: 'blur(10px)',
                borderRadius: isMini ? '8px' : '14px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 6px 24px rgba(0, 0, 0, 0.4)'
              }}
            >
              <p
                style={{
                  fontSize: isMini ? '0.66rem' : 'clamp(0.85rem, 1.4vw, 1.18rem)',
                  color: 'rgba(255, 255, 255, 0.92)',
                  lineHeight: 1.45,
                  margin: 0,
                  fontStyle: 'italic',
                  fontWeight: 500
                }}
              >
                {customVerse || defaultCountdownVerse}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
