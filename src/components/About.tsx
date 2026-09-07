import { useRef } from 'react';
import workspaceImage from '@/assets/workspace.jpg';
import workspace640 from '@/assets/workspace-640.webp';
import workspace960 from '@/assets/workspace-960.webp';
import workspace1280 from '@/assets/workspace-1280.webp';
import workspace1600 from '@/assets/workspace-1600.webp';
import { useQuery } from '@tanstack/react-query';
import { getHighlights } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_HIGHLIGHTS } from '@/data/defaults';
import { useContent } from '@/hooks/useContent';
import { gsap, useGSAP } from '@/lib/gsap';

// Responsive variants of the bundled workspace photo. The source was a 6720x4480
// camera original (2.9 MB); it is displayed at roughly half the grid on large
// screens, so the largest variant we ever need is 1600w.
const WORKSPACE_WEBP_SRCSET = [
  `${workspace640} 640w`,
  `${workspace960} 960w`,
  `${workspace1280} 1280w`,
  `${workspace1600} 1600w`,
].join(', ');
const WORKSPACE_SIZES = '(min-width: 1024px) 50vw, 100vw';

/** "15+" → { value: 15, suffix: "+" } for the count-up. */
const parseStat = (raw: string) => {
  const match = raw.match(/^([\d.,]+)(.*)$/);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ''));
  return Number.isFinite(value) ? { value, suffix: match[2] } : null;
};

export const About = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { c, content } = useContent();

  const { data: firestoreHighlights } = useQuery({
    queryKey: ['highlights'],
    queryFn: getHighlights,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const customImage = content?.aboutImage; // admin-supplied URL, if any
  const aboutStats = c('aboutStats');
  const highlights = firestoreHighlights ?? DEFAULT_HIGHLIGHTS;

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

          // Stats count up once they scroll into view.
          gsap.utils.toArray<HTMLElement>('.stat-number', section).forEach((el) => {
            const parsed = parseStat(el.dataset.value ?? '');
            if (!parsed) return;
            const proxy = { value: 0 };
            gsap.to(proxy, {
              value: parsed.value,
              duration: 1.2,
              ease: 'power2.out',
              snap: { value: 1 },
              scrollTrigger: { trigger: el, start: 'top 90%', once: true },
              onUpdate: () => {
                el.textContent = `${Math.round(proxy.value)}${parsed.suffix}`;
              },
            });
          });
        }
      );
    },
    {
      scope: sectionRef,
      dependencies: [highlights.length, aboutStats?.length, customImage],
      revertOnUpdate: true,
    }
  );

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative border-t hairline [scroll-margin-top:64px]"
      style={{ background: 'linear-gradient(180deg, hsl(var(--background)), hsl(var(--card)))' }}
    >
      <div className="section-shell grid gap-12 lg:grid-cols-[minmax(min(100%,340px),1fr)_1.1fr] lg:gap-16">
        {/* Left: heading + tall image */}
        <div data-reveal className="flex flex-col">
          <p className="mono-label mb-5">{c('aboutIndexLabel')}</p>
          <h2 className="mb-3">{c('aboutHeading')}</h2>
          <p className="mb-8 font-serif text-xl italic text-accent">{c('aboutSubtitle')}</p>

          <div className="relative min-h-[clamp(420px,60vh,640px)] flex-1 overflow-hidden rounded-md border hairline">
            {customImage ? (
              <img
                src={customImage}
                alt="Mattathias Abraham's workspace"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover saturate-[.85]"
              />
            ) : (
              <picture>
                <source type="image/webp" srcSet={WORKSPACE_WEBP_SRCSET} sizes={WORKSPACE_SIZES} />
                <img
                  src={workspaceImage}
                  alt="Mattathias Abraham's workspace"
                  width={1280}
                  height={1920}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover saturate-[.85]"
                />
              </picture>
            )}
          </div>
        </div>

        {/* Right: copy, stats, highlights, CTA */}
        <div className="flex flex-col gap-10 lg:pt-16">
          <div data-reveal className="space-y-5">
            <p className="text-foreground/70">{c('aboutBody1')}</p>
            <p className="text-foreground/70">{c('aboutBody2')}</p>
          </div>

          {aboutStats && aboutStats.length > 0 && (
            <dl data-reveal className="grid grid-cols-2 gap-x-8 gap-y-6 border-t hairline pt-8 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {aboutStats.map((stat, index) => (
                <div key={index}>
                  <dd
                    className="stat-number font-serif text-[40px] leading-none text-foreground"
                    data-value={stat.number}
                  >
                    {stat.number}
                  </dd>
                  <dt className="mono-label mt-2">{stat.label}</dt>
                </div>
              ))}
            </dl>
          )}

          <div data-reveal className="grid gap-3 sm:grid-cols-2">
            {highlights.map((item, index) => (
              <div
                key={item.id ?? index}
                className="rounded-md border hairline bg-card/60 p-5 transition-colors hover:border-accent/40"
              >
                <p className="mono-label mb-3 !text-accent">{String(index + 1).padStart(2, '0')}</p>
                <h4 className="mb-1.5 font-sans text-[15px] font-medium text-foreground">
                  {item.title}
                </h4>
                <p className="text-[13px] leading-relaxed text-foreground/60">{item.description}</p>
              </div>
            ))}
          </div>

          <div data-reveal>
            <a
              href="#contact"
              className="inline-flex items-center rounded-full border border-foreground/25 px-6 py-3 font-mono text-xs uppercase tracking-[0.06em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {c('aboutCta')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
