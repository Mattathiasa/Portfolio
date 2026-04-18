import { useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

const ACCENT_R = 221;
const ACCENT_G = 235;
const ACCENT_B = 157;
const PARTICLE_COUNT = 150;
const CONNECTION_DIST = 130;

interface Particle {
  rx: number;
  ry: number;
  gx: number;
  gy: number;
  size: number;
  driftSpeed: number;
  driftAngle: number;
  phase: number;
}

function buildHexGrid(count: number): [number, number][] {
  const positions: [number, number][] = [];
  const cols = 16;
  const rows = 12;
  const cellW = 1 / cols;
  const cellH = 1 / rows;
  for (let r = 0; r < rows && positions.length < count; r++) {
    for (let c = 0; c < cols && positions.length < count; c++) {
      const offset = r % 2 === 0 ? 0 : cellW * 0.5;
      positions.push([
        offset + c * cellW + cellW * 0.25,
        r * cellH + cellH * 0.25,
      ]);
    }
  }
  return positions;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const mapRange = (v: number, i0: number, i1: number, o0: number, o1: number) =>
  clamp01((v - i0) / (i1 - i0)) * (o1 - o0) + o0;
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export const ScrollytellingSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const progressRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Beat A: 0–20%
  const beatAOpacity = useTransform(smoothProgress, [0, 0.05, 0.17, 0.23], [0, 1, 1, 0]);
  const beatAY = useTransform(smoothProgress, [0, 0.05, 0.17, 0.23], [20, 0, 0, -20]);

  // Beat B: 25–45%
  const beatBOpacity = useTransform(smoothProgress, [0.25, 0.32, 0.42, 0.48], [0, 1, 1, 0]);
  const beatBY = useTransform(smoothProgress, [0.25, 0.32, 0.42, 0.48], [20, 0, 0, -20]);

  // Beat C: 50–70%
  const beatCOpacity = useTransform(smoothProgress, [0.50, 0.57, 0.67, 0.73], [0, 1, 1, 0]);
  const beatCY = useTransform(smoothProgress, [0.50, 0.57, 0.67, 0.73], [20, 0, 0, -20]);

  // Beat D: 75–95%
  const beatDOpacity = useTransform(smoothProgress, [0.75, 0.82, 0.92, 0.97], [0, 1, 1, 0]);
  const beatDY = useTransform(smoothProgress, [0.75, 0.82, 0.92, 0.97], [20, 0, 0, -20]);

  const exploreOpacity = useTransform(smoothProgress, [0, 0.06, 0.14], [1, 1, 0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    const gridPositions = buildHexGrid(PARTICLE_COUNT);

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      rx: Math.random(),
      ry: Math.random(),
      gx: gridPositions[i]?.[0] ?? Math.random(),
      gy: gridPositions[i]?.[1] ?? Math.random(),
      size: Math.random() * 1.5 + 0.5,
      driftSpeed: Math.random() * 0.4 + 0.1,
      driftAngle: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;

    const unsubscribe = smoothProgress.on('change', (v) => {
      progressRef.current = v;
    });

    const draw = () => {
      t += 0.016;
      rafRef.current = requestAnimationFrame(draw);
      const p = progressRef.current;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // Phase transitions
      const toGrid = easeInOut(mapRange(p, 0.20, 0.40, 0, 1));
      const toCenter = easeInOut(mapRange(p, 0.65, 0.85, 0, 1));
      const gridStrength = toGrid * (1 - toCenter);

      // Compute world positions
      const pos: [number, number][] = particles.map((pt) => {
        const floatX = pt.rx + Math.sin(t * pt.driftSpeed + pt.driftAngle) * 0.025;
        const floatY = pt.ry + Math.cos(t * pt.driftSpeed + pt.phase) * 0.025;

        const blendX = lerp(floatX, pt.gx, toGrid);
        const blendY = lerp(floatY, pt.gy, toGrid);

        const finalX = lerp(blendX, 0.5, toCenter);
        const finalY = lerp(blendY, 0.5, toCenter);

        return [finalX * width, finalY * height];
      });

      // Connection lines (stronger in grid phase)
      const connAlpha = gridStrength * 0.55 + (1 - toGrid) * 0.12;
      for (let i = 0; i < particles.length; i++) {
        const [x1, y1] = pos[i];
        for (let j = i + 1; j < particles.length; j++) {
          const [x2, y2] = pos[j];
          const dx = x2 - x1;
          const dy = y2 - y1;
          const distSq = dx * dx + dy * dy;
          const maxDist = gridStrength > 0.3 ? CONNECTION_DIST : CONNECTION_DIST * 0.7;
          if (distSq < maxDist * maxDist) {
            const alpha = (1 - Math.sqrt(distSq) / maxDist) * connAlpha;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      // Energy pulse waves in grid phase
      if (gridStrength > 0.2) {
        const waveR = ((t * 60) % 400);
        const waveAlpha = (1 - waveR / 400) * gridStrength * 0.08;
        if (waveAlpha > 0.005) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${waveAlpha})`;
          ctx.lineWidth = 1;
          ctx.arc(width / 2, height / 2, waveR, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Particle dots
      particles.forEach((pt, i) => {
        const [x, y] = pos[i];
        const pulse = 0.5 + 0.35 * Math.sin(t * 1.5 + pt.phase);
        const baseAlpha = 0.4 + gridStrength * 0.4 + toCenter * 0.2;
        const alpha = baseAlpha * pulse;

        // Soft glow halo
        if (gridStrength > 0.1 || toCenter > 0.05) {
          const glowR = pt.size * 7;
          const grd = ctx.createRadialGradient(x, y, 0, x, y, glowR);
          grd.addColorStop(0, `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${alpha * 0.25})`);
          grd.addColorStop(1, `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},0)`);
          ctx.beginPath();
          ctx.fillStyle = grd;
          ctx.arc(x, y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${alpha})`;
        ctx.arc(x, y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Central convergence glow
      if (toCenter > 0.05) {
        const cx = width / 2;
        const cy = height / 2;
        const glowPulse = 0.8 + 0.2 * Math.sin(t * 3);
        const radius = 280 * toCenter * glowPulse;

        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grd.addColorStop(0, `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${0.35 * toCenter})`);
        grd.addColorStop(0.25, `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${0.12 * toCenter})`);
        grd.addColorStop(1, `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},0)`);
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8 * toCenter);
        core.addColorStop(0, `rgba(255,255,255,${0.9 * toCenter})`);
        core.addColorStop(1, `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},0)`);
        ctx.beginPath();
        ctx.fillStyle = core;
        ctx.arc(cx, cy, 8 * toCenter, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      unsubscribe();
    };
  }, [smoothProgress]);

  return (
    <div ref={containerRef} className="relative h-[400vh]" style={{ background: '#050505' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Beat A — 0–20% — Centered hero word */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
          style={{ opacity: beatAOpacity, y: beatAY }}
        >
          <p className="text-xs tracking-[0.5em] text-white/30 uppercase mb-6 font-light">
            Software Engineering
          </p>
          <h2
            className="font-bold tracking-tight leading-none text-white/90 text-center"
            style={{ fontSize: 'clamp(4rem, 14vw, 12rem)', fontFamily: 'Inter, -apple-system, sans-serif' }}
          >
            ENGINEER
          </h2>
          <p className="mt-8 text-base text-white/40 tracking-widest uppercase">
            Building systems that matter
          </p>
        </motion.div>

        {/* Beat B — 25–45% — Left aligned */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-center px-[8vw] md:px-[12vw] pointer-events-none select-none"
          style={{ opacity: beatBOpacity, y: beatBY }}
        >
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.5em] text-white/30 uppercase mb-5 font-light">
              Full Stack Depth
            </p>
            <h2
              className="font-bold tracking-tight leading-[0.9] text-white/90"
              style={{ fontSize: 'clamp(3rem, 9vw, 8rem)', fontFamily: 'Inter, -apple-system, sans-serif' }}
            >
              Craft<br />at every<br />layer.
            </h2>
            <p className="mt-8 text-base text-white/40 tracking-wide max-w-xs">
              React · TypeScript · Node.js · Cloud — fluent across the stack.
            </p>
          </div>
        </motion.div>

        {/* Beat C — 50–70% — Right aligned */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-center items-end px-[8vw] md:px-[12vw] pointer-events-none select-none"
          style={{ opacity: beatCOpacity, y: beatCY }}
        >
          <div className="max-w-xl text-right">
            <p className="text-xs tracking-[0.5em] text-white/30 uppercase mb-5 font-light">
              Creative Code
            </p>
            <h2
              className="font-bold tracking-tight leading-[0.9] text-white/90"
              style={{ fontSize: 'clamp(3rem, 9vw, 8rem)', fontFamily: 'Inter, -apple-system, sans-serif' }}
            >
              Motion.<br />Canvas.<br />3D.
            </h2>
            <p className="mt-8 text-base text-white/40 tracking-wide max-w-xs ml-auto">
              Framer Motion · Three.js · WebGL — interfaces that breathe.
            </p>
          </div>
        </motion.div>

        {/* Beat D — 75–95% — Centered CTA */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
          style={{ opacity: beatDOpacity, y: beatDY }}
        >
          <p className="text-xs tracking-[0.5em] text-white/30 uppercase mb-6 font-light">
            Ready to collaborate
          </p>
          <h2
            className="font-bold tracking-tight leading-none text-white/90 text-center"
            style={{ fontSize: 'clamp(3.5rem, 11vw, 10rem)', fontFamily: 'Inter, -apple-system, sans-serif' }}
          >
            LET'S<br />BUILD.
          </h2>
          <motion.a
            href="#contact"
            className="mt-12 px-10 py-4 border border-white/20 text-white/60 text-xs tracking-[0.4em] uppercase pointer-events-auto transition-all duration-500 hover:border-[#DDEB9D] hover:text-[#DDEB9D] hover:shadow-[0_0_30px_rgba(221,235,157,0.15)]"
          >
            Get In Touch
          </motion.a>
        </motion.div>

        {/* Scroll to Explore indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none select-none"
          style={{ opacity: exploreOpacity }}
        >
          <p className="text-[10px] tracking-[0.6em] text-white/25 uppercase">Scroll to Explore</p>
          <motion.div
            className="w-px h-14 bg-gradient-to-b from-white/20 to-transparent"
            animate={{ scaleY: [1, 0.6, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  );
};
