import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
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

const categories = ['All', 'Web Apps', 'Mobile', 'Games', 'Content'];

const PROJECTS_PER_PAGE = 6;

// Resolve a project's gallery: prefer `images`, fall back to the single `image`
const projectImages = (p: { images?: string[]; image?: string }): string[] =>
  p.images && p.images.length ? p.images : p.image ? [p.image] : [];

// ── Slideshow ─────────────────────────────────────────────────────────────────

const Slideshow = ({
  images, alt, autoPlay = false, interval = 3500, showArrows = 'hover',
}: {
  images: string[];
  alt: string;
  autoPlay?: boolean;
  interval?: number;
  showArrows?: 'hover' | 'always';
}) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

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
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${alt} – image ${i + 1}`}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        />
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
            {images.map((_, i) => (
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

export const Projects = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

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
    (project) => activeCategory === 'All' || project.category.includes(activeCategory)
  );

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE));
  // Clamp the page in case the filtered count shrank below the current page
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProjects = filteredProjects.slice(
    (safePage - 1) * PROJECTS_PER_PAGE,
    safePage * PROJECTS_PER_PAGE
  );

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  return (
    <section id="projects" ref={ref} className="min-h-screen flex items-center justify-center relative py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
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
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              onClick={() => handleCategoryChange(category)}
              className={
                activeCategory === category
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'border-accent text-accent hover:bg-accent hover:text-accent-foreground'
              }
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <AnimatePresence mode='popLayout'>
            {paginatedProjects
              .map((project) => (
                // motion.div must be the direct child of AnimatePresence so Framer Motion
                // can forward a ref to a real DOM element (Dialog is a function component
                // without forwardRef and would throw a ref warning otherwise).
                <motion.div
                  key={project.title}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  <Dialog>
                  <DialogTrigger asChild>
                    <div className="glass-card rounded-xl overflow-hidden group transition-smooth hover:scale-[1.02] hover:glow-accent cursor-pointer flex flex-col">
                      {/* Image slideshow */}
                      <div className="relative overflow-hidden aspect-video bg-secondary/30 shrink-0">
                        <Slideshow images={projectImages(project)} alt={project.title} autoPlay />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button size="sm" className="bg-accent text-accent-foreground">
                            View Details
                          </Button>
                        </div>
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
                      {projectImages(project).length > 0 && (
                        <div className="aspect-video rounded-lg overflow-hidden border border-accent/10">
                          <Slideshow images={projectImages(project)} alt={project.title} autoPlay interval={4500} showArrows="always" />
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
                </motion.div>
              ))}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-2 mb-8 sm:mb-12"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={safePage === page ? 'default' : 'outline'}
                size="icon"
                onClick={() => setCurrentPage(page)}
                aria-label={`Page ${page}`}
                aria-current={safePage === page ? 'page' : undefined}
                className={
                  safePage === page
                    ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                    : 'border-accent text-accent hover:bg-accent hover:text-accent-foreground'
                }
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Next page"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* View More */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
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
        </motion.div>
      </div>
    </section>
  );
};
