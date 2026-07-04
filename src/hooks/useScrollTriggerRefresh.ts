import { useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

/**
 * Re-measures ScrollTriggers after late-arriving data (Firestore via
 * react-query) changes layout height. Deferred one frame so the DOM
 * has committed before measuring.
 */
export const useScrollTriggerRefresh = (...deps: unknown[]) => {
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
