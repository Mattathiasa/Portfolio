import { useRef, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';

interface SplitRevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  type?: 'lines' | 'chars';
  stagger?: number;
  start?: string;
}

/**
 * Masked SplitText reveal on scroll. Re-split by keying the component on the
 * text when the content can change after mount (Firestore data).
 */
export const SplitReveal = ({
  children,
  as: Tag = 'div',
  className,
  type = 'lines',
  stagger,
  start = 'top 80%',
}: SplitRevealProps) => {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          if (ctx.conditions?.reduced) {
            gsap.set(el, { opacity: 1 });
            return;
          }

          const split = SplitText.create(el, {
            type: type === 'chars' ? 'chars,lines' : 'lines',
            mask: 'lines',
          });
          gsap.set(el, { opacity: 1 });

          const targets = type === 'chars' ? split.chars : split.lines;
          gsap.from(targets, {
            yPercent: 115,
            duration: 0.9,
            ease: 'power4.out',
            stagger: stagger ?? (type === 'chars' ? 0.02 : 0.09),
            scrollTrigger: { trigger: el, start, once: true },
          });

          return () => split.revert();
        }
      );
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={cn('opacity-0', className)}>
      {children}
    </Tag>
  );
};
