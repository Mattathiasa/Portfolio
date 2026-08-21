import { useRef } from 'react';
import {
  Code, Smartphone, Video, Users, Globe, Database, Cpu, Zap,
  Brain, Trophy, Camera, Music, BookOpen, Wrench, Shield, Rocket,
  Star, Heart, Briefcase, Terminal, Layers, Monitor, Server, type LucideProps,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import workspaceImage from '@/assets/workspace.jpg';
import { useQuery } from '@tanstack/react-query';
import { getContent, getHighlights } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTENT, DEFAULT_HIGHLIGHTS } from '@/data/defaults';
import type { FC } from 'react';
import { SplitReveal } from '@/components/SplitReveal';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

const ICON_MAP: Record<string, FC<LucideProps>> = {
  Code, Smartphone, Video, Users, Globe, Database, Cpu, Zap,
  Brain, Trophy, Camera, Music, BookOpen, Wrench, Shield, Rocket,
  Star, Heart, Briefcase, Terminal, Layers, Monitor, Server,
};

/** "15+" → { value: 15, suffix: "+" } for the count-up. */
const parseStat = (raw: string) => {
  const match = raw.match(/^([\d.,]+)(.*)$/);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ''));
  return Number.isFinite(value) ? { value, suffix: match[2] } : null;
};

export const About = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const { data: content } = useQuery({
    queryKey: ['content'],
    queryFn: getContent,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: firestoreHighlights } = useQuery({
    queryKey: ['highlights'],
    queryFn: getHighlights,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const aboutHeading  = content?.aboutHeading  ?? DEFAULT_CONTENT.aboutHeading;
  const aboutSubtitle = content?.aboutSubtitle ?? DEFAULT_CONTENT.aboutSubtitle;
  const aboutBody1    = content?.aboutBody1    ?? DEFAULT_CONTENT.aboutBody1;
  const aboutBody2    = content?.aboutBody2    ?? DEFAULT_CONTENT.aboutBody2;
  const aboutImage    = content?.aboutImage    || workspaceImage;
  const aboutStats    = content?.aboutStats    ?? DEFAULT_CONTENT.aboutStats;
  const aboutCta      = content?.aboutCta      ?? DEFAULT_CONTENT.aboutCta;
  const highlights    = firestoreHighlights     ?? DEFAULT_HIGHLIGHTS;

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
          if (ctx.conditions?.reduced) {
            gsap.set(['.about-image-frame', '.about-cta', '.stat-card', '.highlight-card'], {
              opacity: 1,
              y: 0,
              clipPath: 'none',
            });
            return;
          }

          // Image: wipe in, then drift against the scroll direction.
          gsap.from('.about-image-frame', {
            clipPath: 'inset(100% 0 0 0)',
            duration: 1.1,
            ease: 'power4.inOut',
            scrollTrigger: { trigger: '.about-image-frame', start: 'top 80%', once: true },
          });
          gsap.fromTo(
            '.about-image',
            { yPercent: -10 },
            {
              yPercent: 10,
              ease: 'none',
              scrollTrigger: {
                trigger: '.about-image-frame',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          );

          gsap.from('.about-cta', {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: '.about-cta', start: 'top 88%', once: true },
          });

          // Stats count up once the grid is in view.
          gsap.utils.toArray<HTMLElement>('.stat-number', section).forEach((el) => {
            const parsed = parseStat(el.dataset.value ?? '');
            if (!parsed) return;
            const proxy = { value: 0 };
            gsap.to(proxy, {
              value: parsed.value,
              duration: 1.6,
              ease: 'power2.out',
              snap: { value: 1 },
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
              onUpdate: () => {
                el.textContent = `${Math.round(proxy.value)}${parsed.suffix}`;
              },
            });
          });

          gsap.set('.stat-card', { opacity: 0, y: 24 });
          ScrollTrigger.batch('.stat-card', {
            start: 'top 90%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }),
          });

          gsap.set('.highlight-card', { opacity: 0, y: 32 });
          ScrollTrigger.batch('.highlight-card', {
            start: 'top 88%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' }),
          });
        }
      );
    },
    { scope: sectionRef, dependencies: [highlights.length, aboutStats?.length, aboutImage], revertOnUpdate: true }
  );

  return (
    <section id="about" ref={sectionRef} className="min-h-screen flex items-center justify-center relative py-16 sm:py-24">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <SplitReveal
            as="h2"
            type="chars"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4"
          >
            About Me
          </SplitReveal>
          <SplitReveal as="p" className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            {aboutSubtitle}
          </SplitReveal>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center mb-10 sm:mb-12 md:mb-16">
          {/* Image */}
          <div className="about-image-frame relative rounded-3xl overflow-hidden shadow-2xl border border-border/50">
            <img
              src={aboutImage}
              alt="Mattathias Abraham's workspace"
              className="about-image w-full h-auto object-cover scale-110"
              style={{ background: 'transparent' }}
            />
          </div>

          {/* Content */}
          <div className="space-y-4 sm:space-y-6">
            <SplitReveal
              key={aboutHeading}
              as="h3"
              className="text-2xl sm:text-3xl font-bold text-foreground"
            >
              {aboutHeading}
            </SplitReveal>
            <SplitReveal key={aboutBody1} as="p" stagger={0.06} className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {aboutBody1}
            </SplitReveal>
            <SplitReveal key={aboutBody2} as="p" stagger={0.06} className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {aboutBody2}
            </SplitReveal>
            <div className="about-cta">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 transition-smooth"
                asChild
              >
                <a href="#contact">{aboutCta}</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {aboutStats && aboutStats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8">
            {aboutStats.map((stat, index) => (
              <div
                key={index}
                className="stat-card glass-card p-4 sm:p-5 rounded-xl text-center border border-accent/10 hover:border-accent/30 hover:scale-105 transition-all"
              >
                <div className="stat-number text-3xl sm:text-4xl font-bold gradient-text mb-1" data-value={stat.number}>
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Highlights */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {highlights.map((item, index) => {
            const IconComponent = ICON_MAP[item.icon] ?? Code;
            return (
              <div
                key={item.id ?? index}
                className="highlight-card glass-card p-4 sm:p-6 rounded-2xl border border-accent/10 transition-all duration-300 hover:border-accent/30 hover:glow-accent hover:-translate-y-2 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12 group-hover:bg-accent/10 transition-colors" />
                <IconComponent className="w-10 h-10 sm:w-12 sm:h-12 text-accent mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h4 className="text-base sm:text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors">{item.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
