import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCV } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CV } from '@/data/defaults';
import { useContent } from '@/hooks/useContent';
import { gsap, useGSAP } from '@/lib/gsap';

interface TimelineEntry {
  id: string;
  date: string;
  badge: string;
  title: string;
  org: string;
  bullets: string[];
}

export const Experience = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { c } = useContent();

  const { data: cvData } = useQuery({
    queryKey: ['cv'],
    queryFn: getCV,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const cv = cvData ?? DEFAULT_CV;

  const timeline: TimelineEntry[] = [
    ...(cv.experience ?? []).map((e) => ({
      id: e.id,
      date: e.date,
      badge: e.badge,
      title: e.title,
      org: e.org,
      bullets: e.bullets ?? [],
    })),
    ...(cv.education ?? []).map((e) => ({
      id: e.id,
      date: e.date,
      badge: c('educationBadge'),
      title: e.degree,
      org: e.gpa ? `${e.school} · GPA ${e.gpa}` : e.school,
      bullets: [],
    })),
  ];

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
            gsap.set('[data-timeline-line]', { scaleY: 1 });
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
          gsap.from('[data-timeline-line]', {
            scaleY: 0,
            duration: 1.4,
            ease: 'power2.out',
            scrollTrigger: { trigger: '[data-timeline-list]', start: 'top 75%', once: true },
          });
        }
      );
    },
    { scope: sectionRef, dependencies: [timeline.length], revertOnUpdate: true }
  );

  return (
    <section id="experience" ref={sectionRef} className="section-shell relative [scroll-margin-top:64px]">
      <div data-reveal className="mb-[clamp(32px,5vh,56px)] flex items-end justify-between gap-6">
        <h2>{c('experienceHeading')}</h2>
        <span className="mono-label shrink-0 pb-2">{c('experienceIndexLabel')}</span>
      </div>

      <ol data-timeline-list className="relative ml-[7px] border-none pl-0">
        {/* Timeline line */}
        <span
          data-timeline-line
          aria-hidden
          className="absolute bottom-2 left-0 top-2 w-px origin-top bg-foreground/15"
        />
        {timeline.map((entry) => {
          const current = /present/i.test(entry.date);
          return (
            <li key={entry.id} data-reveal className="relative pb-[clamp(32px,5vh,52px)] pl-9 last:pb-0">
              {/* Dot */}
              <span
                aria-hidden
                className={`absolute left-[-7px] top-1.5 h-[15px] w-[15px] rounded-full border ${
                  current ? 'border-accent bg-accent' : 'border-foreground/40 bg-background'
                }`}
              />
              <div className="grid gap-x-12 gap-y-3 lg:grid-cols-[280px_1fr]">
                <div>
                  <p className="mono-label mb-2 !text-foreground/70">{entry.date}</p>
                  {entry.badge && (
                    <span className="inline-block rounded-full border border-accent/40 px-3 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-accent">
                      {entry.badge}
                    </span>
                  )}
                  <h3 className="mt-3 !text-[clamp(22px,2.4vw,30px)]">{entry.title}</h3>
                  <p className="mt-1 text-sm text-foreground/60">{entry.org}</p>
                </div>
                {entry.bullets.length > 0 && (
                  <ul className="space-y-2 self-center">
                    {entry.bullets.map((bullet, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-foreground/70">
                        <span className="mt-[10px] h-px w-4 shrink-0 bg-accent/60" aria-hidden />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
