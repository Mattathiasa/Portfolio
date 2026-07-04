import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getContent, getProjects } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTENT } from '@/data/defaults';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';

interface PreloaderProps {
  onComplete: () => void;
}

/**
 * Weighted, asset-aware loading: fonts + data prefetch + the lazy three.js
 * chunk + a minimum-duration timer, eased so the counter never jumps.
 */
const STEPS = [
  { weight: 0.25, run: () => document.fonts.ready },
  {
    weight: 0.35,
    run: (queryClient: ReturnType<typeof useQueryClient>) =>
      isFirebaseConfigured
        ? Promise.allSettled([
            queryClient.prefetchQuery({ queryKey: ['content'], queryFn: getContent, staleTime: 5 * 60 * 1000 }),
            queryClient.prefetchQuery({ queryKey: ['projects'], queryFn: getProjects, staleTime: 5 * 60 * 1000 }),
          ])
        : Promise.resolve(),
  },
  { weight: 0.3, run: () => import('@/components/three/SceneCanvas') },
  { weight: 0.1, run: () => new Promise((r) => setTimeout(r, 1400)) },
] as const;

export const Preloader = ({ onComplete }: PreloaderProps) => {
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const { data: content } = useQuery({
    queryKey: ['content'],
    queryFn: getContent,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const displayName = content?.heroTitle ?? DEFAULT_CONTENT.heroTitle;

  useEffect(() => {
    const reduced = prefersReducedMotion();
    let loaded = 0;
    let cancelled = false;
    const proxy = { value: 0 };

    const render = () => {
      if (counterRef.current) {
        counterRef.current.textContent = String(Math.round(proxy.value)).padStart(3, '0');
      }
      if (lineRef.current) {
        lineRef.current.style.transform = `scaleX(${proxy.value / 100})`;
      }
    };

    const exit = () => {
      if (cancelled) return;
      const done = () => {
        onCompleteRef.current();
        ScrollTrigger.refresh();
      };
      if (reduced || !rootRef.current) {
        gsap.to(rootRef.current, { opacity: 0, duration: 0.3, onComplete: done });
        return;
      }
      gsap
        .timeline({ onComplete: done })
        .to(counterRef.current, { yPercent: 120, opacity: 0, duration: 0.5, ease: 'power2.in' })
        .to(nameRef.current, { yPercent: -40, opacity: 0, duration: 0.5, ease: 'power2.in' }, '<0.05')
        .to(rootRef.current, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.9,
          ease: 'power4.inOut',
        }, '-=0.2');
    };

    const advance = () => {
      gsap.to(proxy, {
        value: loaded * 100,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: render,
        onComplete: () => {
          if (loaded >= 1) exit();
        },
      });
    };

    STEPS.forEach((step) => {
      Promise.resolve(step.run(queryClient))
        .catch(() => undefined)
        .then(() => {
          if (cancelled) return;
          loaded += step.weight;
          if (loaded > 0.999) loaded = 1;
          advance();
        });
    });

    if (nameRef.current && !reduced) {
      gsap.fromTo(
        nameRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }

    return () => {
      cancelled = true;
      gsap.killTweensOf(proxy);
    };
  }, [queryClient]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] bg-background"
      style={{ clipPath: 'inset(0 0 0% 0)' }}
    >
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <h1
          ref={nameRef}
          className="font-title text-[11vw] sm:text-6xl md:text-8xl text-foreground text-center leading-none opacity-0"
        >
          {displayName}
        </h1>
      </div>

      <div className="absolute bottom-8 left-6 sm:left-10 overflow-hidden">
        <span
          ref={counterRef}
          className="block font-title text-6xl sm:text-8xl text-accent tabular-nums leading-none"
        >
          000
        </span>
      </div>

      <div
        ref={lineRef}
        className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-accent"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
};
