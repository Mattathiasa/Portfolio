import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';
import { PortfolioScene, FORMATION_INDEX } from '@/three/PortfolioScene';
import { onTunnelProgress } from '@/three/sceneBus';

interface SectionState {
  selector: string;
  formation: number;
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  lookAtY: number;
  accentIntensity: number;
  shapeOpacity: number;
}

const SECTION_STATES: SectionState[] = [
  { selector: '#home',     formation: FORMATION_INDEX.cloud,        cameraX: 0,  cameraY: 0, cameraZ: 35, lookAtY: 0,  accentIntensity: 0.8, shapeOpacity: 0.2 },
  { selector: '#about',    formation: FORMATION_INDEX.sphere,       cameraX: -4, cameraY: 0, cameraZ: 28, lookAtY: 0,  accentIntensity: 1.0, shapeOpacity: 0.12 },
  { selector: '#skills',   formation: FORMATION_INDEX.waveGrid,     cameraX: 0,  cameraY: 6, cameraZ: 30, lookAtY: -6, accentIntensity: 0.9, shapeOpacity: 0.08 },
  { selector: '#projects', formation: FORMATION_INDEX.tunnel,       cameraX: 0,  cameraY: 0, cameraZ: 24, lookAtY: 0,  accentIntensity: 1.0, shapeOpacity: 0 },
  { selector: '#blog',     formation: FORMATION_INDEX.helix,        cameraX: 0,  cameraY: 0, cameraZ: 32, lookAtY: 0,  accentIntensity: 0.9, shapeOpacity: 0.18 },
  { selector: '#contact',  formation: FORMATION_INDEX.convergedOrb, cameraX: 0,  cameraY: 0, cameraZ: 20, lookAtY: 2,  accentIntensity: 1.4, shapeOpacity: 0.1 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const isConstrainedDevice = () =>
  window.matchMedia('(max-width: 767px)').matches ||
  (navigator.hardwareConcurrency ?? 8) <= 4;

const SceneCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = prefersReducedMotion();
    const constrained = isConstrainedDevice();

    const scene = new PortfolioScene(container, {
      particleCount: constrained ? 1200 : 4000,
      shapeCount: constrained ? 5 : 15,
      interactive: !reduced && !constrained,
      pixelRatioCap: constrained ? 1.5 : 2,
    });

    if (reduced) {
      scene.renderStatic();
      return () => scene.dispose();
    }

    gsap.ticker.add(scene.update);

    // One scrubbed trigger per section transition: while section i's top
    // travels from viewport bottom to viewport top, blend formation i-1 → i.
    const triggers: ScrollTrigger[] = [];
    for (let i = 1; i < SECTION_STATES.length; i++) {
      const prev = SECTION_STATES[i - 1];
      const next = SECTION_STATES[i];
      const el = document.querySelector(next.selector);
      if (!el) continue;

      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress;
            const t = scene.target;
            t.formationA = prev.formation;
            t.formationB = next.formation;
            t.formationMix = p;
            t.cameraX = lerp(prev.cameraX, next.cameraX, p);
            t.cameraY = lerp(prev.cameraY, next.cameraY, p);
            t.cameraZ = lerp(prev.cameraZ, next.cameraZ, p);
            t.lookAtY = lerp(prev.lookAtY, next.lookAtY, p);
            t.accentIntensity = lerp(prev.accentIntensity, next.accentIntensity, p);
            t.shapeOpacity = lerp(prev.shapeOpacity, next.shapeOpacity, p);
          },
        })
      );
    }

    // The pinned project gallery publishes its horizontal progress; ride the
    // tunnel rings past the camera while it plays.
    const offTunnel = onTunnelProgress((p) => {
      scene.target.tunnelShift = p * 60;
    });

    return () => {
      offTunnel();
      triggers.forEach((st) => st.kill());
      gsap.ticker.remove(scene.update);
      scene.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
};

export default SceneCanvas;
