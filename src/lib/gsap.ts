import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

ScrollTrigger.config({ ignoreMobileResize: true });

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;

export { gsap, ScrollTrigger, SplitText, useGSAP };
