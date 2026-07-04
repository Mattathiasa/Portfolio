import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSkills, getTools } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_SKILLS, DEFAULT_TOOLS } from '@/data/defaults';
import { SplitReveal } from '@/components/SplitReveal';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

const MarqueeRow = ({ tools, reverse }: { tools: string[]; reverse?: boolean }) => (
  <div className="marquee-row overflow-hidden" data-reverse={reverse ? '1' : undefined}>
    <div className="marquee-track flex w-max gap-3 sm:gap-4 py-2">
      {[0, 1].map((copy) => (
        <div key={copy} className="flex gap-3 sm:gap-4" aria-hidden={copy === 1 || undefined}>
          {tools.map((tool, i) => (
            <span
              key={`${copy}-${i}`}
              className="glass-card whitespace-nowrap px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium text-foreground/90 border border-accent/10"
            >
              {tool}
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const Skills = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const { data: firestoreSkills } = useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: firestoreTools } = useQuery({
    queryKey: ['tools'],
    queryFn: getTools,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const skills = (firestoreSkills && firestoreSkills.length > 0) ? firestoreSkills : DEFAULT_SKILLS;
  const tools = (firestoreTools && firestoreTools.length > 0) ? firestoreTools : DEFAULT_TOOLS;

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
          const rows = gsap.utils.toArray<HTMLElement>('.skill-row', section);

          if (ctx.conditions?.reduced) {
            // Static end state: filled to level, number shown, no marquee.
            rows.forEach((row) => {
              const level = Number(row.dataset.level ?? 0);
              const fill = row.querySelector<HTMLElement>('.skill-fill');
              const num = row.querySelector<HTMLElement>('.skill-num');
              if (fill) fill.style.clipPath = `inset(0 ${100 - level}% 0 0)`;
              if (num) num.textContent = `${level}%`;
            });
            return;
          }

          // Kinetic rows: the lime fill wipes to the skill level and the
          // number counts alongside as the row crosses the viewport.
          rows.forEach((row) => {
            const level = Number(row.dataset.level ?? 0);
            const fill = row.querySelector<HTMLElement>('.skill-fill');
            const num = row.querySelector<HTMLElement>('.skill-num');

            ScrollTrigger.create({
              trigger: row,
              start: 'top 85%',
              end: 'top 40%',
              scrub: true,
              onUpdate: (self) => {
                const current = level * self.progress;
                if (fill) fill.style.clipPath = `inset(0 ${100 - current}% 0 0)`;
                if (num) num.textContent = `${Math.round(current)}%`;
              },
            });
          });

          // Opposing marquees whose speed and skew react to scroll velocity.
          const marqueeTweens: gsap.core.Tween[] = [];
          gsap.utils.toArray<HTMLElement>('.marquee-row', section).forEach((rowEl) => {
            const track = rowEl.querySelector<HTMLElement>('.marquee-track');
            if (!track) return;
            const reverse = rowEl.dataset.reverse === '1';
            const tween = gsap.fromTo(
              track,
              { xPercent: reverse ? -50 : 0 },
              { xPercent: reverse ? 0 : -50, duration: 28, ease: 'none', repeat: -1 }
            );
            marqueeTweens.push(tween);
          });

          const proxy = { timeScale: 1, skew: 0 };
          const apply = () => {
            marqueeTweens.forEach((tw) => tw.timeScale(proxy.timeScale));
            gsap.set('.marquee-track', { skewX: proxy.skew });
          };
          ScrollTrigger.create({
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            onUpdate: (self) => {
              const velocity = self.getVelocity();
              const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(velocity) / 900);
              const skew = gsap.utils.clamp(-8, 8, velocity / 300);
              gsap.to(proxy, {
                timeScale: boost,
                skew,
                duration: 0.3,
                overwrite: true,
                onUpdate: apply,
                onComplete: () => {
                  gsap.to(proxy, { timeScale: 1, skew: 0, duration: 0.8, onUpdate: apply });
                },
              });
            },
          });
        }
      );
    },
    { scope: sectionRef, dependencies: [skills, tools], revertOnUpdate: true }
  );

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center relative bg-gradient-to-b from-background to-[hsl(var(--gradient-mid))] py-24"
    >
      <div className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <SplitReveal
              as="h2"
              type="chars"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4"
            >
              Skills & Expertise
            </SplitReveal>
            <SplitReveal as="p" className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Technologies and tools I work with
            </SplitReveal>
          </div>

          {/* Kinetic skill rows */}
          <div className="mb-16 sm:mb-24">
            {skills.map((skill, index) => (
              <div
                key={index}
                data-level={skill.level}
                className="skill-row flex items-center justify-between gap-4 border-b border-border/30 py-4 sm:py-5"
              >
                <div className="relative min-w-0">
                  <span className="block font-title text-[9vw] md:text-6xl xl:text-7xl leading-none text-stroke select-none truncate">
                    {skill.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className="skill-fill absolute inset-0 block font-title text-[9vw] md:text-6xl xl:text-7xl leading-none text-accent select-none truncate"
                    style={{ clipPath: 'inset(0 100% 0 0)' }}
                  >
                    {skill.name}
                  </span>
                </div>
                <span className="skill-num shrink-0 font-title text-xl sm:text-2xl md:text-4xl text-accent tabular-nums">
                  0%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tools: opposing velocity marquees (motion), wrapped grid (reduced) */}
        <div className="motion-safe:block motion-reduce:hidden space-y-2">
          <MarqueeRow tools={tools} />
          <MarqueeRow tools={tools} reverse />
        </div>
        <div className="motion-safe:hidden motion-reduce:block container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {tools.map((tool, i) => (
              <span
                key={i}
                className="glass-card px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-foreground/90 border border-accent/10"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
