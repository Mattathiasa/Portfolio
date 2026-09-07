import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCV } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CV } from '@/data/defaults';
import { useContent } from '@/hooks/useContent';
import { Certifications } from '@/components/Certifications';
import { gsap, useGSAP } from '@/lib/gsap';

export const Skills = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { c } = useContent();

  const { data: cvData } = useQuery({
    queryKey: ['cv'],
    queryFn: getCV,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const groups = (cvData ?? DEFAULT_CV).skills ?? [];

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', section);
          if (ctx.conditions?.reduced) {
            gsap.set(reveals, { opacity: 1, y: 0 });
            return;
          }
          reveals.forEach((el) => {
            gsap.from(el, {
              y: 24,
              opacity: 0,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            });
          });
        }
      );
    },
    { scope: sectionRef, dependencies: [groups.length], revertOnUpdate: true }
  );

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="relative border-t hairline bg-card [scroll-margin-top:64px]"
    >
      <div className="section-shell">
        <div data-reveal className="mb-[clamp(32px,5vh,56px)] flex items-end justify-between gap-6">
          <h2>{c('skillsHeading')}</h2>
          <span className="mono-label shrink-0 pb-2">{c('skillsIndexLabel')}</span>
        </div>

        {/* Category cells with 1px dividers */}
        <div data-reveal className="grid gap-px overflow-hidden rounded-md border hairline bg-foreground/10 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, index) => (
            <div key={group.label ?? index} className="bg-card p-6">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h3 className="!text-[22px]">{group.label}</h3>
                <span className="mono-label">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {group.value
                  .split(',')
                  .map((chip) => chip.trim())
                  .filter(Boolean)
                  .map((chip) => (
                    <li
                      key={chip}
                      className="rounded-full border border-foreground/15 px-3 py-1 font-mono text-[11px] text-foreground/70"
                    >
                      {chip}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Credentials row */}
        <Certifications />
      </div>
    </section>
  );
};
