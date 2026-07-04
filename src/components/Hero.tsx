import { useRef } from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getContent } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTENT } from '@/data/defaults';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';

interface HeroProps {
  introReady: boolean;
}

export const Hero = ({ introReady }: HeroProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const { data: content } = useQuery({
    queryKey: ['content'],
    queryFn: getContent,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const heroTitle        = content?.heroTitle        ?? DEFAULT_CONTENT.heroTitle;
  const heroSubtitle     = content?.heroSubtitle     ?? DEFAULT_CONTENT.heroSubtitle;
  const heroDescription  = content?.heroDescription  ?? DEFAULT_CONTENT.heroDescription;
  const currentlyWorking = content?.currentlyWorking ?? DEFAULT_CONTENT.currentlyWorking;

  useGSAP(
    () => {
      if (!introReady || !titleRef.current) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const revealTargets = ['.hero-badge', '.hero-subtitle', '.hero-description', '.hero-ctas', '.hero-scroll-hint'];

          if (ctx.conditions?.reduced) {
            gsap.set(titleRef.current, { opacity: 1 });
            gsap.set(revealTargets, { opacity: 1, y: 0 });
            return;
          }

          const split = SplitText.create(titleRef.current, {
            type: 'chars,lines',
            mask: 'lines',
            linesClass: 'overflow-hidden',
          });

          gsap.set(titleRef.current, { opacity: 1 });

          const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
          intro
            .from(split.chars, {
              yPercent: 120,
              rotateX: -90,
              duration: 1.1,
              stagger: 0.03,
            })
            .to('.hero-badge', { opacity: 1, y: 0, duration: 0.6 }, '-=0.7')
            .to('.hero-subtitle', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
            .to('.hero-description', { opacity: 1, y: 0, duration: 0.7 }, '-=0.55')
            .to('.hero-ctas', { opacity: 1, y: 0, duration: 0.7 }, '-=0.55')
            .to('.hero-scroll-hint', { opacity: 1, duration: 0.6 }, '-=0.3');

          // Scrubbed exit: characters scatter and the block lifts away as the
          // scene morphs toward the About sphere.
          const mid = (split.chars.length - 1) / 2;
          gsap
            .timeline({
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
              },
            })
            .to(split.chars, {
              x: (i) => (i - mid) * 14,
              letterSpacing: '0.08em',
              ease: 'none',
            }, 0)
            .to('.hero-content', { yPercent: -18, opacity: 0, ease: 'none' }, 0);

          return () => split.revert();
        }
      );
    },
    { scope: sectionRef, dependencies: [introReady, heroTitle] }
  );

  return (
    <section
      ref={sectionRef}
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="hero-content max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          {currentlyWorking && (
            <div className="hero-badge flex justify-center opacity-0 translate-y-3">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-sm text-accent">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                {currentlyWorking}
              </span>
            </div>
          )}

          <h1
            ref={titleRef}
            className="font-title text-[13vw] leading-[0.95] md:text-[7.5rem] lg:text-[8.5rem] text-foreground opacity-0"
            style={{ perspective: '600px' }}
          >
            {heroTitle.split(' ').map((word, i, words) => (
              <span key={i} className={i === words.length - 1 ? 'text-accent' : undefined}>
                {word}
                {i < words.length - 1 && <br />}
              </span>
            ))}
          </h1>

          <div className="space-y-3 sm:space-y-4">
            <h2 className="hero-subtitle text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground/90 opacity-0 translate-y-4">
              {heroSubtitle}
            </h2>
            <p className="hero-description text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 opacity-0 translate-y-4">
              {heroDescription}
            </p>
          </div>

          <div className="hero-ctas flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 opacity-0 translate-y-4">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 transition-smooth glow-accent group"
              asChild
            >
              <a href="#projects">
                View My Work
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-smooth"
              asChild
            >
              <a href="/resume?print=1" target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-5 w-5" />
                Download CV
              </a>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-muted-foreground hover:text-accent transition-smooth"
              asChild
            >
              <a href="#contact">Get In Touch</a>
            </Button>
          </div>
        </div>
      </div>

      <div className="hero-scroll-hint absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0">
        <div className="w-6 h-10 border-2 border-accent rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};
