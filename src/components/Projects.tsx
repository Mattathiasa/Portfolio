import { useRef, useState, useEffect } from 'react';
import { ExternalLink, Github, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SplitReveal } from '@/components/SplitReveal';
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
import { useLenis } from '@/providers/SmoothScrollProvider';
import { setTunnelProgress } from '@/three/sceneBus';

const categories = ['All', 'Web Apps', 'Mobile', 'Games', 'Content'];

// Cards per page. Three keeps the mobile stack short and still leaves the
// desktop track wide enough for the pinned horizontal scrub to feel intentional.
const PAGE_SIZE = 3;

const isPhone = (device: string) => device === 'mobile' || device === 'app';
const cssAspect = (a: string) => a.replace('/', ' / ');

// Standardized card aspect — always 16:9 on desktop so cards are uniform height;
// on mobile the phone mockup frame fits naturally inside flex-col layout.
const cardAspect = (_cover?: ProjectImage): string => '16 / 9';

// Modal container: phone projects get a constrained portrait box; desktop stays 16:9
const modalContainerStyle = (cover?: ProjectImage): React.CSSProperties => {
  if (cover && isPhone(cover.device)) {
    return { height: 'min(48vh, 26rem)', width: '100%', maxWidth: '220px', margin: '0 auto' };
  }
  return { aspectRatio: cover && cover.aspect !== 'auto' ? cssAspect(cover.aspect) : '16 / 9', width: '100%', maxHeight: '50vh' };
};

// ── A single slide (desktop image, or a phone-framed mobile/app screenshot) ────

const MediaSlide = ({ image, alt, active }: { image: ProjectImage; alt: string; active: boolean }) => {
  const fit = image.fit === 'contain' ? 'object-contain' : 'object-cover';
  const base = `absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`;

  if (isPhone(image.device)) {
    return (
      <div className={`${base} flex items-center justify-center bg-gradient-to-br from-accent/5 to-secondary/30 p-2`}>
        {/* iPhone-style phone frame */}
        <div className="relative flex flex-col h-full max-h-full" style={{ aspectRatio: '9/19.5' }}>
          {/* Outer shell */}
          <div className="relative flex flex-col h-full w-full rounded-[2rem] border-[3px] border-foreground/80 bg-black shadow-2xl overflow-hidden">
            {/* Dynamic island / notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[28%] h-[3.5%] bg-black rounded-full" />
            {/* Screen glass sheen */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10" />
            {/* Screenshot */}
            <img
              src={image.url}
              alt={alt}
              loading="lazy"
              className={`w-full h-full ${fit}`}
            />
            {/* Home bar */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 w-[35%] h-[0.9%] bg-white/60 rounded-full" />
          </div>
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

// ── Small shared bits ─────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="font-title text-[10px] tracking-[0.2em] text-accent/60 uppercase">{children}</p>
);

// ── Card (trigger + detail dialog) ────────────────────────────────────────────

const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  const media = toProjectMedia(project);
  // Firestore documents can omit array fields, so never index into them blindly.
  const tags = project.tags ?? [];
  const techStack = project.techStack ?? [];
  const projectCategories = Array.isArray(project.category)
    ? project.category
    : project.category
      ? [project.category as unknown as string]
      : [];

  return (
    <div className="project-card w-full md:w-[42vw] xl:w-[36vw] shrink-0">
      <Dialog>
        <DialogTrigger asChild>
          <div className="group relative glass-card rounded-xl overflow-hidden cursor-pointer flex flex-col border border-border/30 hover:border-accent/40 transition-all duration-500 hover:shadow-[0_0_40px_hsl(72_72%_73%/0.12)]">

            {/* Image slideshow */}
            <div className="relative overflow-hidden bg-secondary/30 shrink-0" style={{ aspectRatio: cardAspect(media[0]) }}>
              <Slideshow media={media} alt={project.title} autoPlay />

              {/* Hover gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Bottom-left editorial CTA */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="font-title text-[11px] tracking-widest text-accent flex items-center gap-2">
                  VIEW PROJECT <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Category badge — top right */}
              {projectCategories.length > 0 && (
                <span className="pointer-events-none absolute top-3 right-3 font-title text-[10px] tracking-widest text-foreground/60 bg-background/60 backdrop-blur rounded px-2.5 py-1">
                  {projectCategories[0]}
                </span>
              )}
            </div>

            {/* Card body */}
            <div className="relative p-5 sm:p-6 flex flex-col flex-1 gap-4 overflow-hidden">

              {/* Faint oversized background index number */}
              <span
                aria-hidden
                className="absolute -bottom-3 right-3 font-title text-[5.5rem] leading-none text-stroke select-none pointer-events-none opacity-[0.06]"
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <div>
                <p className="font-title text-[10px] tracking-[0.2em] text-accent/60 mb-2">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="font-title text-2xl sm:text-3xl leading-tight text-foreground group-hover:text-accent transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="glass-card text-[10px] tracking-wider px-2.5 py-1 text-accent/80 rounded-lg border border-accent/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Links + accent line */}
              <div className="flex items-center gap-4 mt-auto pt-2" onClick={e => e.stopPropagation()}>
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" /> Source
                  </a>
                )}
                {project.demo && (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Live
                  </a>
                )}
                {/* Growing accent line on hover */}
                <div className="ml-auto h-px w-0 group-hover:w-16 bg-accent rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
              </div>
            </div>
          </div>
        </DialogTrigger>

        {/* ── Detail dialog ── */}
        <DialogContent
          className="w-[calc(100vw-1.5rem)] sm:w-full max-w-3xl p-0 gap-0 bg-background/95 backdrop-blur-xl border-accent/20 max-h-[88dvh] overflow-hidden"
        >
          {/* Inner scroller keeps the close button pinned while the body scrolls */}
          <div className="max-h-[88dvh] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">

            <DialogHeader className="pb-5 pr-8 text-left space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-title text-[10px] tracking-[0.25em] text-accent/60">
                  PROJECT {String(index + 1).padStart(2, '0')}
                </span>
                {projectCategories.map((cat) => (
                  <span
                    key={cat}
                    className="font-title text-[10px] tracking-widest text-foreground/60 bg-secondary/60 rounded px-2 py-0.5"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              <DialogTitle className="font-title text-2xl sm:text-4xl gradient-text leading-tight">
                {project.title}
              </DialogTitle>

              {/* Short description */}
              <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {project.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 sm:space-y-7">
              {media.length > 0 && (
                <div className="mx-auto rounded-lg overflow-hidden border border-accent/10 bg-secondary/30" style={modalContainerStyle(media[0])}>
                  <Slideshow media={media} alt={project.title} autoPlay interval={4500} showArrows="always" />
                </div>
              )}

              {/* Languages / tags */}
              {tags.length > 0 && (
                <section className="space-y-2.5">
                  <SectionLabel>Languages &amp; Tags</SectionLabel>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="glass-card text-[11px] tracking-wider px-2.5 py-1 text-accent/90 rounded-lg border border-accent/15"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Long description */}
              {project.longDescription && (
                <section className="space-y-2.5">
                  <SectionLabel>Overview</SectionLabel>
                  <p className="text-sm sm:text-[0.95rem] text-muted-foreground leading-relaxed whitespace-pre-line">
                    {project.longDescription}
                  </p>
                </section>
              )}

              {/* Full tech stack */}
              {techStack.length > 0 && (
                <section className="space-y-2.5">
                  <SectionLabel>Full Tech Stack</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="glass-card text-xs px-3 py-1.5 text-foreground/90 rounded-xl border border-accent/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Challenges */}
              {project.challenges && (
                <section className="space-y-2.5">
                  <SectionLabel>The Challenge</SectionLabel>
                  <blockquote className="border-l-2 border-accent/40 pl-4 text-sm sm:text-[0.95rem] text-muted-foreground leading-relaxed italic whitespace-pre-line">
                    {project.challenges}
                  </blockquote>
                </section>
              )}

              {/* Links */}
              {(project.github || project.demo) && (
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  {project.github && (
                    <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                      <a href={project.github} target="_blank" rel="noopener noreferrer">
                        <Github className="w-4 h-4 mr-2" /> View Source Code
                      </a>
                    </Button>
                  )}
                  {project.demo && (
                    <Button variant="outline" className="flex-1 border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground" asChild>
                      <a href={project.demo} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" /> Live Demo
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Pagination ────────────────────────────────────────────────────────────────

/** Page numbers to render, collapsing long runs into ellipses. */
const pageWindow = (current: number, total: number): (number | 'gap')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push('gap');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push('gap');

  items.push(total);
  return items;
};

const ProjectsPagination = ({
  page, totalPages, total, from, to, onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  onChange: (page: number) => void;
}) => {
  const navBtn =
    'flex items-center justify-center h-9 w-9 sm:h-10 sm:w-auto sm:px-4 gap-1.5 rounded-full border text-[11px] font-title tracking-widest transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none border-accent/30 text-accent/70 hover:border-accent hover:text-accent';

  return (
    <nav aria-label="Projects pagination" className="flex flex-col items-center gap-4">
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className={navBtn}
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">PREV</span>
          </button>

          {pageWindow(page, totalPages).map((item, i) =>
            item === 'gap' ? (
              <span key={`gap-${i}`} aria-hidden className="px-1 text-accent/40 select-none">
                &hellip;
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                aria-label={`Go to page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={`font-title text-[11px] tracking-widest h-9 w-9 sm:h-10 sm:w-10 rounded-full border transition-all duration-300 ${
                  item === page
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'border-accent/30 text-accent/70 hover:border-accent hover:text-accent bg-transparent'
                }`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            className={navBtn}
          >
            <span className="hidden sm:inline">NEXT</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}

      <p aria-live="polite" className="font-title text-[10px] sm:text-[11px] tracking-[0.2em] text-muted-foreground">
        SHOWING {from}&ndash;{to} OF {total} PROJECT{total === 1 ? '' : 'S'}
      </p>
    </nav>
  );
};

export const Projects = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const { scrollTo } = useLenis();

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
  const rawProjects: Project[] = usingDefaults ? DEFAULT_PROJECTS : firestoreProjects;

  // If a Firestore project has no image(s) yet, resolve them from the local defaults
  const projects = rawProjects.map(p => {
    if ((p.images && p.images.length) || p.image) return p;
    const match = DEFAULT_PROJECTS.find(d => d.title === p.title);
    return match ? { ...p, image: match.image } : p;
  });

  const filteredProjects = projects.filter((project) => {
    if (project.visible === false) return false;
    if (activeCategory === 'All') return true;
    return Array.isArray(project.category)
      ? project.category.includes(activeCategory)
      : project.category === activeCategory;
  });

  // ── Paging ──────────────────────────────────────────────────────────────────
  const total = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Render from a clamped page so a shrinking list never blanks the gallery
  // for a frame before the sync effect below catches up.
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageProjects = filteredProjects.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const goToPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    if (clamped === safePage) return;
    setPage(clamped);
    // Desktop pins the gallery over a long scroll range, so send the reader
    // back to the top of the section instead of leaving them mid-pin.
    if (sectionRef.current) scrollTo(sectionRef.current);
  };

  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setPage(1);
  };

  useScrollTriggerRefresh(activeCategory, safePage, pageProjects.length);

  useGSAP(
    () => {
      const track = trackRef.current;
      const gallery = galleryRef.current;
      if (!track || !gallery || pageProjects.length === 0) return;

      const mm = gsap.matchMedia();

      // Desktop: pin the gallery and scrub the track sideways; the scene's
      // tunnel rings ride the same progress.
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        // A short page — the last one often holds a single card — already fits
        // on screen. Pinning it would make the section stick with nothing to
        // scrub, so fall back to the same fade-up reveal mobile uses.
        if (getDistance() === 0) {
          if (progressTrackRef.current) progressTrackRef.current.style.opacity = '0';
          gsap.utils.toArray<HTMLElement>('.project-card', track).forEach((card) => {
            gsap.from(card, {
              opacity: 0,
              y: 40,
              duration: 0.7,
              ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
            });
          });
          return () => setTunnelProgress(0);
        }

        if (progressTrackRef.current) progressTrackRef.current.style.opacity = '1';

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
    { scope: sectionRef, dependencies: [activeCategory, safePage, pageProjects.length], revertOnUpdate: true }
  );

  return (
    <section id="projects" ref={sectionRef} className="relative py-24 overflow-hidden">

      {/* Editorial background label */}
      <span
        aria-hidden
        className="pointer-events-none select-none absolute -top-[5vw] right-0 font-title text-[28vw] leading-none text-stroke opacity-[0.025] block"
      >
        WORK
      </span>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full relative">
        <div className="text-center mb-8 sm:mb-12">
          <SplitReveal
            as="h2"
            type="chars"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4"
          >
            Featured Projects
          </SplitReveal>
          <SplitReveal as="p" className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            A showcase of my recent work and side projects
          </SplitReveal>

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

        {/* Filter Buttons — editorial pill style */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => selectCategory(category)}
              className={`font-title text-[11px] tracking-widest px-5 py-2 rounded-full border transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'border-accent/30 text-accent/70 hover:border-accent hover:text-accent bg-transparent'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery: pinned horizontal scrub on desktop, vertical stack on mobile */}
      {pageProjects.length > 0 ? (
        <div
          ref={galleryRef}
          className="relative md:h-screen md:flex md:flex-col md:justify-center md:overflow-hidden"
        >
          <div
            ref={trackRef}
            className="flex flex-col md:flex-row md:items-center gap-8 md:gap-[4vw] px-4 sm:px-6 md:px-[8vw] md:w-max"
          >
            {pageProjects.map((project, i) => (
              <ProjectCard
                key={project.id ?? project.title}
                project={project}
                index={startIndex + i}
              />
            ))}
          </div>

          {/* Scrub progress (desktop only, visible while pinned) */}
          <div
            ref={progressTrackRef}
            className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-border/60 rounded-full overflow-hidden transition-opacity duration-300"
          >
            <div
              ref={progressRef}
              className="h-full w-full origin-left bg-accent"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
          <p className="text-muted-foreground">No projects in this category yet.</p>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14">
          <ProjectsPagination
            page={safePage}
            totalPages={totalPages}
            total={total}
            from={startIndex + 1}
            to={startIndex + pageProjects.length}
            onChange={goToPage}
          />
        </div>
      )}

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
