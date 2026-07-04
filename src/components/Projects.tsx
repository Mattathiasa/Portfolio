import { useRef, useState, useEffect } from 'react';
import { ExternalLink, Github, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_PROJECTS } from '@/data/defaults';
import { toProjectMedia } from '@/types/portfolio';
import type { Project, ProjectImage } from '@/types/portfolio';
import { gsap, useGSAP } from '@/lib/gsap';
import { useScrollTriggerRefresh } from '@/hooks/useScrollTriggerRefresh';
import { setTunnelProgress } from '@/three/sceneBus';

const categories = ['All', 'Web Apps', 'Mobile', 'Games', 'Content'];

const isPhone = (device: string) => device === 'mobile' || device === 'app';
const cssAspect = (a: string) => a.replace('/', ' / ');

// Container proportion derived from the cover image — keeps the gallery dynamic
// in width/height instead of forcing every image into a 16:9 desktop frame.
const cardAspect = (cover?: ProjectImage): string =>
  !cover ? '16 / 9'
    : isPhone(cover.device) ? '4 / 5'
    : cover.aspect !== 'auto' ? cssAspect(cover.aspect) : '16 / 9';

const modalStyle = (cover?: ProjectImage): React.CSSProperties =>
  cover && isPhone(cover.device)
    ? { aspectRatio: '9 / 16', height: 'min(60vh, 32rem)', maxWidth: '100%' }
    : { aspectRatio: cover && cover.aspect !== 'auto' ? cssAspect(cover.aspect) : '16 / 9' };

// ── A single slide (desktop image, or a phone-framed mobile/app screenshot) ────

const MediaSlide = ({ image, alt, active }: { image: ProjectImage; alt: string; active: boolean }) => {
  const fit = image.fit === 'contain' ? 'object-contain' : 'object-cover';
  const base = `absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`;

  if (isPhone(image.device)) {
    return (
      <div className={`${base} flex items-center justify-center p-3 bg-gradient-to-br from-accent/5 to-secondary/30`}>
        <div className="relative h-full aspect-[9/19] max-w-full rounded-[1.6rem] border-[5px] border-foreground/85 bg-black shadow-xl overflow-hidden">
          <img src={image.url} alt={alt} loading="lazy" className={`w-full h-full ${fit}`} />
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-white/30" />
        </div>
      </div>
    );
  }
  return <img src={image.url} alt={alt} loading="lazy" className={`${base} w-full h-full ${fit}`} />;
};

// ── Slideshow ─────────────────────────────────────────────────────────────────

const Slideshow = ({
  media, alt, autoPlay = false, interval = 3500, showArrows = 'hover',
}: {
  media: ProjectImage[];
  alt: string;
  autoPlay?: boolean;
  interval?: number;
  showArrows?: 'hover' | 'always';
}) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = media.length;

  // Keep index valid if the image list shrinks
  useEffect(() => { setIdx(i => (i >= count ? 0 : i)); }, [count]);

  useEffect(() => {
    if (!autoPlay || paused || count <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [autoPlay, paused, count, interval]);

  if (count === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-4xl font-bold">
        {alt[0]}
      </div>
    );
  }

  const go = (dir: number) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIdx(i => (i + dir + count) % count);
  };
  const jump = (i: number) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIdx(i);
  };

  const arrowVis = showArrows === 'always' ? 'opacity-100' : 'opacity-0 group-hover/slide:opacity-100';
  const arrowBase = 'absolute top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-background/70 backdrop-blur flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition';

  return (
    <div
      className="group/slide relative w-full h-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {media.map((image, i) => (
        <MediaSlide key={i} image={image} alt={`${alt} – image ${i + 1}`} active={i === idx} />
      ))}

      {count > 1 && (
        <>
          <button type="button" aria-label="Previous image" onClick={go(-1)} className={`${arrowBase} left-2 ${arrowVis}`}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" aria-label="Next image" onClick={go(1)} className={`${arrowBase} right-2 ${arrowVis}`}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={jump(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-accent' : 'w-1.5 bg-foreground/40 hover:bg-foreground/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Card (trigger + detail dialog) ────────────────────────────────────────────

const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  const media = toProjectMedia(project);

  return (
    <div className="project-card w-full md:w-[42vw] xl:w-[36vw] shrink-0">
      <Dialog>
        <DialogTrigger asChild>
          <div className="glass-card rounded-xl overflow-hidden group transition-smooth hover:scale-[1.02] hover:glow-accent cursor-pointer flex flex-col">
            {/* Image slideshow */}
            <div className="relative overflow-hidden bg-secondary/30 shrink-0" style={{ aspectRatio: cardAspect(media[0]) }}>
              <Slideshow media={media} alt={project.title} autoPlay />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button size="sm" className="bg-accent text-accent-foreground">
                  View Details
                </Button>
              </div>
              <span className="pointer-events-none absolute top-3 left-3 font-title text-sm text-foreground/50 bg-background/50 backdrop-blur rounded px-2 py-0.5">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>

            {/* Card body */}
            <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 group-hover:text-accent transition-colors">{project.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{project.description}</p>
              </div>

              {/* Languages / tags */}
              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-accent/5 text-accent/80 rounded border border-accent/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* GitHub + Demo links */}
              <div className="flex items-center gap-2 mt-auto pt-1" onClick={e => e.stopPropagation()}>
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 hover:border-accent/40 rounded-md px-2.5 py-1.5"
                  >
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </a>
                )}
                {project.demo && (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 hover:border-accent/40 rounded-md px-2.5 py-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                  </a>
                )}
              </div>
            </div>
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-accent/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text">{project.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Detailed Project Breakdown
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {media.length > 0 && (
              <div className="mx-auto rounded-lg overflow-hidden border border-accent/10 bg-secondary/30" style={modalStyle(media[0])}>
                <Slideshow media={media} alt={project.title} autoPlay interval={4500} showArrows="always" />
              </div>
            )}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-foreground">Overview</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{project.longDescription}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-md border border-accent/20">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">The Challenge</h4>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  "{project.challenges}"
                </p>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              {project.github && (
                <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                  <a href={project.github} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" /> View Source Code
                  </a>
                </Button>
              )}
              {project.demo && (
                <Button variant="outline" className="flex-1 border-accent text-accent hover:bg-accent" asChild>
                  <a href={project.demo} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" /> Live Demo
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const Projects = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const { data: firestoreProjects, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Make the fallback cause obvious instead of silently showing demo projects.
  const usingDefaults = !(firestoreProjects && firestoreProjects.length > 0);
  if (usingDefaults) {
    if (!isFirebaseConfigured) {
      console.warn('[Projects] Firebase is not configured (VITE_FIREBASE_API_KEY missing) — showing bundled demo projects.');
    } else if (isError) {
      console.error('[Projects] Failed to load projects from Firestore — showing bundled demo projects.', error);
    } else if (firestoreProjects) {
      console.warn('[Projects] Firestore returned 0 projects — showing bundled demo projects.');
    }
  }

  // Use Firestore data when available; fall back to bundled defaults
  const rawProjects = usingDefaults ? DEFAULT_PROJECTS : firestoreProjects;

  // If a Firestore project has no image(s) yet, resolve them from the local defaults
  const projects = rawProjects.map(p => {
    if ((p.images && p.images.length) || p.image) return p;
    const match = DEFAULT_PROJECTS.find(d => d.title === p.title);
    return match ? { ...p, image: match.image } : p;
  });

  const filteredProjects = projects.filter(
    (project) =>
      project.visible !== false &&
      (activeCategory === 'All' || project.category.includes(activeCategory))
  );

  useScrollTriggerRefresh(activeCategory, filteredProjects.length);

  useGSAP(
    () => {
      const track = trackRef.current;
      const gallery = galleryRef.current;
      if (!track || !gallery || filteredProjects.length === 0) return;

      const mm = gsap.matchMedia();

      // Desktop: pin the gallery and scrub the track sideways; the scene's
      // tunnel rings ride the same progress.
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        const horizontal = gsap.to(track, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: gallery,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => '+=' + getDistance(),
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              setTunnelProgress(self.progress);
              if (progressRef.current) {
                progressRef.current.style.transform = `scaleX(${self.progress})`;
              }
            },
          },
        });

        const cards = gsap.utils.toArray<HTMLElement>('.project-card', track);
        cards.forEach((card) => {
          gsap.from(card, {
            opacity: 0.2,
            scale: 0.92,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              containerAnimation: horizontal,
              start: 'left 95%',
              toggleActions: 'play none none reverse',
            },
          });
        });

        return () => setTunnelProgress(0);
      });

      // Mobile: plain vertical stack with fade-up reveals.
      mm.add('(max-width: 767.98px) and (prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.project-card', track);
        cards.forEach((card) => {
          gsap.from(card, {
            opacity: 0,
            y: 40,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          });
        });
      });
    },
    { scope: sectionRef, dependencies: [activeCategory, filteredProjects.length], revertOnUpdate: true }
  );

  return (
    <section id="projects" ref={sectionRef} className="relative py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4">Featured Projects</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            A showcase of my recent work and side projects
          </p>

          {/* Dev-only notice so a Firestore fallback is never silent again */}
          {import.meta.env.DEV && usingDefaults && (
            <p className="mt-4 inline-block rounded-md border border-yellow-500/40 bg-yellow-500/10 px-3 py-1.5 text-xs text-yellow-600 dark:text-yellow-400">
              ⚠ Showing bundled demo projects —{' '}
              {!isFirebaseConfigured
                ? 'Firebase env vars not set (VITE_FIREBASE_API_KEY missing).'
                : isError
                  ? 'Firestore request failed (check console / security rules).'
                  : 'Firestore returned no projects.'}
            </p>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              onClick={() => setActiveCategory(category)}
              className={
                activeCategory === category
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'border-accent text-accent hover:bg-accent hover:text-accent-foreground'
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Gallery: pinned horizontal scrub on desktop, vertical stack on mobile */}
      <div
        ref={galleryRef}
        className="relative md:h-screen md:flex md:flex-col md:justify-center md:overflow-hidden"
      >
        <div
          ref={trackRef}
          className="flex flex-col md:flex-row md:items-center gap-8 md:gap-[4vw] px-4 sm:px-6 md:px-[8vw] md:w-max"
        >
          {filteredProjects.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} />
          ))}
        </div>

        {/* Scrub progress (desktop only, visible while pinned) */}
        <div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-border/60 rounded-full overflow-hidden">
          <div
            ref={progressRef}
            className="h-full w-full origin-left bg-accent"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>

      {/* View More */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mt-12">
        <Button
          size="lg"
          variant="outline"
          className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
          asChild
        >
          <a href="https://github.com/Mattathiasa" target="_blank" rel="noopener noreferrer">
            <Github className="mr-2 h-5 w-5" />
            View All Projects on GitHub
          </a>
        </Button>
      </div>
    </section>
  );
};
