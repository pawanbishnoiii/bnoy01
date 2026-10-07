'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';

const defaultCardImages = [
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=80',
  'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=600&q=80',
];

const ASCII_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789(){}[]<>;:,._-+=!@#$%^&*|/\\?";
const generateCode = (width: number, height: number): string => {
  let out = '';
  for (let i = 0; i < height; i++) {
    let line = '';
    for (let j = 0; j < width; j++) line += ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
    out += line + '\n';
  }
  return out;
};

type ScannerCardStreamProps = {
  initialSpeed?: number;
  direction?: -1 | 1;
  cardImages?: string[];
  repeat?: number;
  cardGap?: number;
  friction?: number;
  scanEffect?: 'clip' | 'scramble';
  height?: number;
};

export const ScannerCardStream = ({
  initialSpeed = 80,
  direction = -1,
  cardImages = defaultCardImages,
  repeat = 4,
  cardGap = 32,
  friction = 0.97,
  scanEffect = 'scramble',
  height = 320,
}: ScannerCardStreamProps) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  const [isPaused, setIsPaused] = useState(false);

  const cards = useMemo(() => {
    const total = cardImages.length * repeat;
    return Array.from({ length: total }, (_, i) => ({
      id: i,
      image: cardImages[i % cardImages.length],
      ascii: generateCode(Math.floor(280 / 7), Math.floor(180 / 13)),
    }));
  }, [cardImages, repeat]);

  const cardLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalAscii = useRef(new Map<number, string>());

  const stateRef = useRef({
    position: 0,
    velocity: initialSpeed,
    direction: direction as number,
    isDragging: false,
    lastMouseX: 0,
    lastTime: performance.now(),
  });
  const scannerState = useRef({ isScanning: false });
  const CARD_WIDTH = 280;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cardLine = cardLineRef.current;
    const container = containerRef.current;
    const scannerCanvas = scannerCanvasRef.current;
    if (!cardLine || !container || !scannerCanvas) return;
    const ctx2d = scannerCanvas.getContext('2d');
    if (!ctx2d) return;

    cards.forEach((c) => originalAscii.current.set(c.id, c.ascii));
    let raf = 0;
    const ctx = ctx2d;
    const setSize = () => {
      scannerCanvas.width = container.offsetWidth;
      scannerCanvas.height = height;
    };
    setSize();
    window.addEventListener('resize', setSize);

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number; decay: number };
    let particles: P[] = [];
    const baseMax = 300;
    const scanMax = 1200;
    let curMax = baseMax;
    const createP = (): P => ({
      x: container.offsetWidth / 2 + (Math.random() - 0.5) * 4,
      y: Math.random() * height,
      vx: Math.random() * 0.6 + 0.15,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 0.7 + 0.3,
      a: Math.random() * 0.5 + 0.5,
      life: 1,
      decay: Math.random() * 0.02 + 0.005,
    });
    for (let i = 0; i < baseMax; i++) particles.push(createP());

    const runScramble = (el: HTMLElement, id: number) => {
      if (el.dataset.scrambling === 'true') return;
      el.dataset.scrambling = 'true';
      const original = originalAscii.current.get(id) || '';
      let n = 0;
      const it = setInterval(() => {
        el.textContent = generateCode(Math.floor(280 / 7), Math.floor(180 / 13));
        if (++n >= 8) {
          clearInterval(it);
          el.textContent = original;
          delete el.dataset.scrambling;
        }
      }, 35);
    };

    const updateEffects = () => {
      const rect = container.getBoundingClientRect();
      const scannerX = rect.left + rect.width / 2;
      const w = 6;
      let scanning = false;
      cardLine.querySelectorAll<HTMLElement>('.card-wrapper').forEach((wrap, idx) => {
        const r = wrap.getBoundingClientRect();
        const normal = wrap.querySelector<HTMLElement>('.card-normal');
        const ascii = wrap.querySelector<HTMLElement>('.card-ascii');
        const pre = wrap.querySelector<HTMLElement>('pre');
        if (!normal || !ascii || !pre) return;
        const sL = scannerX - w / 2;
        const sR = scannerX + w / 2;
        if (r.left < sR && r.right > sL) {
          scanning = true;
          if (scanEffect === 'scramble' && wrap.dataset.scanned !== 'true') runScramble(pre, idx);
          wrap.dataset.scanned = 'true';
          const iL = Math.max(sL - r.left, 0);
          const iR = Math.min(sR - r.left, r.width);
          normal.style.clipPath = `inset(0 ${100 - (iL / r.width) * 100}% 0 0)`;
          ascii.style.clipPath = `inset(0 0 0 ${(iR / r.width) * 100}%)`;
        } else {
          delete wrap.dataset.scanned;
          if (r.right < sL) {
            normal.style.clipPath = 'inset(0 100% 0 0)';
            ascii.style.clipPath = 'inset(0 0 0 0)';
          } else {
            normal.style.clipPath = 'inset(0 0 0 0)';
            ascii.style.clipPath = 'inset(0 0 0 100%)';
          }
        }
      });
      scannerState.current.isScanning = scanning;
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.lastMouseX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!stateRef.current.isDragging) return;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const dx = x - stateRef.current.lastMouseX;
      stateRef.current.position += dx;
      stateRef.current.velocity = Math.min(Math.abs(dx) * 50, 600);
      stateRef.current.direction = dx < 0 ? -1 : 1;
      stateRef.current.lastMouseX = x;
    };
    const onUp = () => { stateRef.current.isDragging = false; };

    cardLine.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    cardLine.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    const animate = (t: number) => {
      const dt = (t - stateRef.current.lastTime) / 1000;
      stateRef.current.lastTime = t;
      if (!isPaused && !prefersReducedMotion && !stateRef.current.isDragging) {
        if (stateRef.current.velocity > initialSpeed) stateRef.current.velocity *= friction;
        else stateRef.current.velocity = initialSpeed;
        stateRef.current.position += stateRef.current.velocity * stateRef.current.direction * dt;
      }
      const lineWidth = (CARD_WIDTH + cardGap) * cards.length;
      const cw = container.offsetWidth;
      if (stateRef.current.position < -lineWidth) stateRef.current.position = cw;
      else if (stateRef.current.position > cw) stateRef.current.position = -lineWidth;
      cardLine.style.transform = `translate3d(${stateRef.current.position}px,0,0)`;
      updateEffects();

      ctx.clearRect(0, 0, scannerCanvas.width, scannerCanvas.height);
      const target = scannerState.current.isScanning ? scanMax : baseMax;
      curMax += (target - curMax) * 0.05;
      while (particles.length < curMax) particles.push(createP());
      while (particles.length > curMax) particles.pop();
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life <= 0 || p.x > scannerCanvas.width) Object.assign(p, createP());
        ctx.globalAlpha = p.a * p.life;
        ctx.fillStyle = '#FFB070';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', setSize);
      cardLine.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      cardLine.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [cards, cardGap, friction, scanEffect, initialSpeed, height, isPaused]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-gradient-to-b from-ink via-ink to-ink/95 outline-none focus-visible:ring-2 focus-visible:ring-fire/60"
      style={{ height }}
      role="region"
      aria-label="Live marketplace scanner — drag or use arrow keys to scrub through projects. Press space to pause."
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setIsPaused((p) => !p); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); stateRef.current.position -= 60; stateRef.current.direction = -1; }
        if (e.key === 'ArrowRight') { e.preventDefault(); stateRef.current.position += 60; stateRef.current.direction = 1; }
      }}
    >
      {/* radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(255,87,34,0.18), transparent 60%)',
      }} />

      {/* Scanner line */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] z-30 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #FF5722, #FFC107, #FF5722, transparent)', boxShadow: '0 0 24px #FF5722, 0 0 48px #FF5722' }} />

      {/* Particles canvas */}
      <canvas ref={scannerCanvasRef} className="absolute inset-0 z-20 pointer-events-none mix-blend-screen" />

      {/* Cards */}
      <div className="absolute inset-0 flex items-center">
        <div ref={cardLineRef} className="flex will-change-transform cursor-grab active:cursor-grabbing" style={{ gap: `${cardGap}px` }}>
          {cards.map((card) => (
            <div key={card.id} className="card-wrapper relative shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
              style={{ width: CARD_WIDTH, height: 180 }}>
              <div className="card-normal absolute inset-0">
                <img src={card.image} alt="" className="w-full h-full object-cover" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="card-ascii absolute inset-0 bg-ink text-fire/80 overflow-hidden" style={{ clipPath: 'inset(0 0 0 100%)' }}>
                <pre className="text-[8px] leading-[10px] font-mono p-2 select-none whitespace-pre">{card.ascii}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Caption */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-30 pointer-events-none">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/60 font-bold">Scanning the marketplace</p>
      </div>
    </div>
  );
};
