import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContactData } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTACT } from '@/data/defaults';
import { useContent } from '@/hooks/useContent';
import { renderAccent } from '@/lib/accentText';
import { gsap, useGSAP } from '@/lib/gsap';

export const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { c } = useContent();

  const { data: contactData } = useQuery({
    queryKey: ['contact'],
    queryFn: getContactData,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const location = contactData?.location ?? DEFAULT_CONTACT.location;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          if (ctx.conditions?.reduced) {
            gsap.set('[data-hero]', { opacity: 1, y: 0 });
            return;
          }
          gsap.from('[data-hero]', {
            y: 28,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.06,
            delay: 0.1,
          });
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex min-h-[100svh] flex-col justify-end"
    >
      <div className="mx-auto w-full max-w-[1280px] px-[clamp(20px,4vw,48px)] pb-[clamp(32px,5vh,56px)]">
        {/* Mono status line */}
        <p data-hero className="mono-label mb-6 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className="h-1.5 w-1.5 rounded-full bg-accent"
            style={{ animation: 'blink 2s ease-in-out infinite' }}
            aria-hidden
          />
          <span className="text-accent">{c('currentlyWorking')}</span>
          <span aria-hidden>/</span>
          <span>{c('heroSubtitle')}</span>
          <span aria-hidden>/</span>
          <span>
            {location} · {c('heroTimezone')}
          </span>
        </p>

        {/* Serif headline with *accent* parsing */}
        <h1 data-hero className="max-w-[18ch] text-balance">
          {renderAccent(c('heroHeadline'))}
        </h1>

        <div data-hero className="mt-10 border-t hairline pt-6">
          <div className="flex flex-col justify-between gap-6 min-[900px]:flex-row min-[900px]:items-end">
            <p className="max-w-[52ch] text-[17px] leading-[1.55] text-foreground/70">
              <span className="text-foreground">{c('heroTitle')}</span> — {c('heroDescription')}
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <a
                href="#work"
                className="inline-flex items-center rounded-full bg-foreground px-6 py-3 font-mono text-xs uppercase tracking-[0.06em] text-background transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {c('heroCtaPrimary')}
              </a>
              <a
                href={c('cvUrl')}
                className="inline-flex items-center rounded-full border border-foreground/25 px-6 py-3 font-mono text-xs uppercase tracking-[0.06em] text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                {c('heroCtaSecondary')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
