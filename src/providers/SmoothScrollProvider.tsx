import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';

const ANCHOR_OFFSET = -80;

interface SmoothScrollContextValue {
  lenisRef: React.MutableRefObject<Lenis | null>;
  scrollTo: (target: string | HTMLElement, options?: { offset?: number }) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

export const useLenis = () => {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) throw new Error('useLenis must be used within SmoothScrollProvider');
  return ctx;
};

export const SmoothScrollProvider = ({ children }: { children: ReactNode }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const apiRef = useRef<SmoothScrollContextValue>({
    lenisRef,
    scrollTo: (target, options) => {
      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(target, { offset: options?.offset ?? ANCHOR_OFFSET });
        return;
      }
      const el =
        typeof target === 'string' ? document.querySelector(target) : target;
      el?.scrollIntoView({ block: 'start' });
    },
  });

  useEffect(() => {
    const reduced = prefersReducedMotion();

    let lenis: Lenis | null = null;
    let tickerFn: ((time: number) => void) | null = null;

    if (!reduced) {
      lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      lenisRef.current = lenis;

      lenis.on('scroll', ScrollTrigger.update);
      tickerFn = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);
    }

    // One delegated handler covers nav links, hero CTAs, footer links and chat CTAs.
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      apiRef.current.scrollTo(el as HTMLElement);
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      if (tickerFn) gsap.ticker.remove(tickerFn);
      lenis?.destroy();
      lenisRef.current = null;
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <SmoothScrollContext.Provider value={apiRef.current}>
      {children}
    </SmoothScrollContext.Provider>
  );
};
