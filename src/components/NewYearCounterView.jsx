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
  const rawTarget = targetDate ? new Date(targetDate) : getNearestNewYear();
  const finalTarget = (rawTarget instanceof Date && !isNaN(rawTarget.getTime())) ? rawTarget : getNearestNewYear();
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

  const days = Math.max(0, Math.floor(totalDiff / (1000 * 60 * 60 * 24))) || 0;
  const hours = Math.max(0, Math.floor((totalDiff / (1000 * 60 * 60)) % 24)) || 0;
  const minutes = Math.max(0, Math.floor((totalDiff / (1000 * 60)) % 60)) || 0;
  const seconds = Math.max(0, Math.floor((totalDiff / 1000) % 60)) || 0;

  // Fireworks & Confetti Animation on Canvas when Celebrating
  useEffect(() => {
    if (!isCelebrationActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const getCanvasDims = () => {
      const pW = canvas.parentElement?.clientWidth;
      const pH = canvas.parentElement?.clientHeight;
      const w = pW && pW > 0 ? pW : (isMini ? 320 : window.innerWidth);
      const h = pH && pH > 0 ? pH : (isMini ? 180 : Math.round(w * 9 / 16));
      return { w, h };
    };

    let { w: width, h: height } = getCanvasDims();
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      if (!canvas) return;
      const dims = getCanvasDims();
      width = canvas.width = dims.w;
      height = canvas.height = dims.h;
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
        minHeight: isMini ? '200px' : '360px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '6px',
        backgroundColor: bgColor,
        background: bgType === 'gradient' ? gradientBg : undefined,
        fontFamily: "'Inter', sans-serif",
        containerType: 'size'
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

      {/* Primary Content Container - Occupies 100% space with 5px padding */}
      <div
        style={{
          position: 'relative',
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'stretch',
          textAlign: 'center',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box'
        }}
      >
        {isCelebrationActive ? (
          /* ========================================================================= */
          /* CELEBRATION MODE: ULTRA-MASSIVE 2027 VISIBLE FROM THE VERY BACK OF HALL  */
          /* ========================================================================= */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              width: '100%',
              height: '100%',
              padding: '2px',
              boxSizing: 'border-box',
              animation: 'celebrationPop 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* GIGANTIC YEAR - Visible from the very back of the hall */}
            <div
              style={{
                fontSize: isMini ? 'clamp(3.8rem, 18cqi, 8.5rem)' : 'clamp(8rem, 27cqi, 24rem)',
                fontWeight: 900,
                lineHeight: 0.88,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 20%, #fde047 45%, #f59e0b 70%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 60px rgba(245, 158, 11, 0.9)) drop-shadow(0 0 120px rgba(245, 158, 11, 0.6)) drop-shadow(0 12px 45px rgba(0,0,0,0.95))',
                margin: 0,
                fontFamily: 'OkineBlack, Okine, sans-serif'
              }}
            >
              {targetYear}
            </div>

            {/* Happy New Year Banner */}
            <div
              style={{
                fontSize: isMini ? 'clamp(1rem, 4cqi, 2rem)' : 'clamp(2.2rem, 5.5cqi, 5rem)',
                fontWeight: 900,
                color: '#ffffff',
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.9), 0 0 36px rgba(245, 158, 11, 0.75)',
                lineHeight: 1.15,
                width: '100%',
                padding: '0 6px'
              }}
            >
              {(customGreeting && !customGreeting.includes('கவுண்டவுன்') && !customGreeting.toLowerCase().includes('countdown'))
                ? customGreeting
                : (isEn ? `HAPPY NEW YEAR ${targetYear}!` : `இனிய புத்தாண்டு நல்வாழ்த்துகள் ${targetYear}!`)}
            </div>

            {/* Blessing Scripture Card */}
            <div
              style={{
                width: '100%',
                maxWidth: '96%',
                padding: isMini ? '5px 12px' : '12px 32px',
                backgroundColor: 'rgba(0, 0, 0, 0.72)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: isMini ? '8px' : '14px',
                border: '1.5px solid rgba(245, 158, 11, 0.55)',
                boxShadow: '0 8px 36px rgba(0, 0, 0, 0.65)'
              }}
            >
              <p
                style={{
                  fontSize: isMini ? '0.66rem' : 'clamp(0.92rem, 1.6cqi, 1.4rem)',
                  color: '#fef3c7',
                  lineHeight: 1.4,
                  margin: 0,
                  fontStyle: 'italic',
                  fontWeight: 600
                }}
              >
                {(customVerse && !customVerse.includes('43:19')) ? customVerse : defaultCelebrationVerse}
              </p>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* COUNTDOWN TICKER: SEPARATE DAYS ROW + 3-COLUMN (HOURS/MIN/SEC) ROW        */
          /* ========================================================================= */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'space-between',
              width: '100%',
              height: '100%',
              gap: '4px',
              boxSizing: 'border-box'
            }}
          >
            {/* Header: Target Year & Subtitle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(8px, 1.5cqi, 16px)',
                padding: '2px 0',
                flexShrink: 0
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.5rem, 5.5cqb, 3.8rem)',
                  fontWeight: 900,
                  lineHeight: 1,
                  fontFamily: 'OkineBlack, Okine, sans-serif',
                  background: 'linear-gradient(135deg, #ffffff 10%, #fef08a 45%, #f59e0b 80%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 25px rgba(245, 158, 11, 0.6)) drop-shadow(0 2px 10px rgba(0, 0, 0, 0.8))'
                }}
              >
                {targetYear}
              </span>
              <div
                style={{
                  height: 'clamp(16px, 3.2cqb, 30px)',
                  width: '2px',
                  backgroundColor: 'rgba(245, 158, 11, 0.5)'
                }}
              />
              <span
                style={{
                  fontSize: 'clamp(0.75rem, 2.2cqb, 1.4rem)',
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)'
                }}
              >
                {customGreeting || (isEn ? 'NEW YEAR COUNTDOWN' : 'புத்தாண்டு கவுண்டவுன்')}
              </span>
            </div>

            {/* ROW 1: DAYS (Dedicated Separate Row occupying full width) */}
            <div
              style={{
                flex: '1.25',
                minHeight: 0,
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(16px, 4cqi, 60px)',
                padding: '2px 16px',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}
            >
              {/* Subtle top light sheen on card */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '10%',
                  right: '10%',
                  height: '1.5px',
                  background: 'linear-gradient(90deg, transparent, rgba(254, 240, 138, 0.9), transparent)'
                }}
              />

              {/* Days Number - Occupies ~90% of box height */}
              <div
                style={{
                  fontSize: 'clamp(3.8rem, 30cqb, 22rem)',
                  fontWeight: 900,
                  lineHeight: 0.82,
                  color: '#ffffff',
                  fontFamily: 'OkineBlack, Okine, monospace',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 45px rgba(245, 158, 11, 0.9), 0 4px 20px rgba(0,0,0,0.95)'
                }}
              >
                {days}
              </div>

              {/* Days Label & Badge */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    fontSize: 'clamp(1.4rem, 6cqb, 4.5rem)',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#fde047',
                    lineHeight: 1.05,
                    textShadow: '0 0 24px rgba(245, 158, 11, 0.65)'
                  }}
                >
                  {isEn ? 'DAYS' : 'நாட்கள்'}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(0.7rem, 2.4cqb, 1.8rem)',
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.75)',
                    marginTop: '2px'
                  }}
                >
                  {isEn ? 'REMAINING' : 'மீதமுள்ளவை'}
                </div>
              </div>
            </div>

            {/* ROW 2: HOURS, MINUTES, SECONDS (Next row with 3 equal columns) */}
            <div
              style={{
                flex: '1.25',
                minHeight: 0,
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'clamp(4px, 1cqi, 10px)',
                boxSizing: 'border-box'
              }}
            >
              {[
                { val: hours, labelTa: 'மணி', labelEn: 'HOURS' },
                { val: minutes, labelTa: 'நிமிடம்', labelEn: 'MINUTES' },
                { val: seconds, labelTa: 'விநாடி', labelEn: 'SECONDS' }
              ].map((slot, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1.5px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 24px rgba(245, 158, 11, 0.12)',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '2px 4px'
                  }}
                >
                  {/* Top light sheen */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '12%',
                      right: '12%',
                      height: '1.5px',
                      background: 'linear-gradient(90deg, transparent, rgba(254, 240, 138, 0.8), transparent)'
                    }}
                  />

                  {/* Digit - Occupies ~90% of box */}
                  <div
                    style={{
                      fontSize: 'clamp(3.2rem, 25cqb, 18rem)',
                      fontWeight: 900,
                      lineHeight: 0.82,
                      color: '#ffffff',
                      fontFamily: 'OkineBlack, Okine, monospace',
                      letterSpacing: '-0.02em',
                      textShadow: '0 0 35px rgba(245, 158, 11, 0.85), 0 4px 16px rgba(0,0,0,0.95)'
                    }}
                  >
                    {String(slot.val).padStart(2, '0')}
                  </div>

                  {/* Label - Compact bottom badge */}
                  <div
                    style={{
                      fontSize: 'clamp(0.68rem, 2.6cqb, 2rem)',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      color: '#fde047',
                      marginTop: '2px',
                      textTransform: 'uppercase',
                      lineHeight: 1
                    }}
                  >
                    {isEn ? slot.labelEn : slot.labelTa}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Row: Scripture Promise Banner */}
            <div
              style={{
                width: '100%',
                padding: '6px 18px',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                boxSizing: 'border-box',
                flexShrink: 0
              }}
            >
              <p
                style={{
                  fontSize: 'clamp(0.72rem, 2.2cqb, 1.4rem)',
                  color: 'rgba(255, 255, 255, 0.95)',
                  lineHeight: 1.35,
                  margin: 0,
                  fontStyle: 'italic',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
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
