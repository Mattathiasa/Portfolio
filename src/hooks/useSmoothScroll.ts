import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

/**
 * Custom smooth scrolling hook using Lenis
 * Provides natural, performant scrolling with customizable easing
 */
export const useSmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({
      // SCROLL SPEED: Controls how long the scroll animation takes
      // Lower = faster (0.8-1.0), Higher = slower (1.5-2.0)
      // Default: 1.2 provides a balanced, natural feel
      duration: 1.2,

      // EASING FUNCTION: Defines the acceleration curve
      // Current: Exponential ease-out for smooth deceleration
      // Alternatives:
      //   - Linear: (t) => t
      //   - Ease-in-out: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      //   - Cubic bezier: (t) => t * t * (3 - 2 * t)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),

      // ORIENTATION: Scroll direction
      orientation: 'vertical',

      // SMOOTH WHEEL: Enable smooth scrolling for mouse wheel
      smoothWheel: true,

      // WHEEL MULTIPLIER: Adjusts scroll distance per wheel tick
      // Lower = less distance per scroll (0.5-0.8 for subtle)
      // Higher = more distance per scroll (1.2-1.5 for aggressive)
      // Default: 1.0 matches native browser behavior
      wheelMultiplier: 1.0,

      // TOUCH MULTIPLIER: Adjusts scroll distance for touch/trackpad
      // Lower = slower touch scrolling (1.0-1.5)
      // Higher = faster touch scrolling (2.0-3.0)
      // Default: 2.0 provides responsive touch feel
      touchMultiplier: 2.0,

      // INFINITE: Disable infinite scrolling
      infinite: false,
    });

    // Animation loop - runs at 60fps for smooth performance
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Handle smooth anchor link navigation
    // Automatically scrolls to sections when clicking nav links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(
          (anchor as HTMLAnchorElement).getAttribute('href') || ''
        );
        if (target) {
          // Offset: -80 accounts for fixed navigation header
          // Adjust this value based on your header height
          lenis.scrollTo(target as HTMLElement, { offset: -80 });
        }
      });
    });

    // Cleanup: Destroy Lenis instance when component unmounts
    return () => {
      lenis.destroy();
    };
  }, []);
};
