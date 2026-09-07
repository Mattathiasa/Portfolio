import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { toProjectMedia } from '@/types/portfolio';
import type { Project } from '@/types/portfolio';
import { useContent } from '@/hooks/useContent';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { SmoothScrollProvider } from '@/providers/SmoothScrollProvider';
import { gsap, useGSAP } from '@/lib/gsap';

const cover = (p: Project) => toProjectMedia(p)[0];

const AllProjects = () => {
  const mainRef = useRef<HTMLElement>(null);
  const { c } = useContent();

  useEffect(() => {
    const prev = document.title;
    document.title = 'Projects · Mattathias Abraham';
    window.scrollTo(0, 0);
    return () => {
      document.title = prev;
    };
  }, []);

  const { data: firestoreProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // No default fallback — show a real (possibly empty) view of Firestore.
  const projects = ((firestoreProjects ?? []) as Project[])
    .filter((p) => p.visible !== false)
    .slice()
    .sort((a, b) => a.order - b.order);

  useGSAP(
    () => {
      const scope = mainRef.current;
      if (!scope) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', scope);
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
              scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            });
          });
        }
      );
    },
    { scope: mainRef, dependencies: [projects.length], revertOnUpdate: true }
  );

  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen">
        <Navigation />
        <main ref={mainRef} className="relative z-10">
          {/* Header */}
          <section className="section-shell !pb-[clamp(32px,5vh,56px)]">
            <p data-reveal className="mono-label mb-5">
              <Link to="/" className="transition-colors hover:text-accent">
                ← {c('brandLabel')}
              </Link>
            </p>
            <div data-reveal className="flex items-end justify-between gap-6">
              <h1 className="!text-[clamp(44px,8vw,104px)]">{c('workHeading')}</h1>
              <span className="mono-label shrink-0 pb-2">
                {String(projects.length).padStart(2, '0')} projects
              </span>
            </div>
          </section>

          {/* Full project list */}
          <section className="section-shell !pt-0">
            {projects.length === 0 && (
              <div data-reveal className="border-t hairline py-20 text-center">
                <p className="mono-label text-foreground/40">No projects to display yet</p>
              </div>
            )}
            {projects.map((project, index) => (
              <article
                key={project.id ?? project.title}
                data-reveal
                className="grid gap-8 border-t hairline py-[clamp(40px,7vh,72px)] lg:grid-cols-[minmax(min(100%,420px),1fr)_1fr] lg:gap-14"
              >
                {/* Cover image */}
                <a
                  href={project.demo || project.github || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block self-start overflow-hidden rounded-md border hairline"
                  aria-label={project.title}
                >
                  <div className={`aspect-[16/10] w-full ${cover(project)?.fit === 'contain' ? 'bg-secondary' : ''}`}>
                    <img
                      src={cover(project)?.url ?? project.image}
                      alt={project.title}
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full ${cover(project)?.fit === 'contain' ? 'object-contain' : 'object-cover'} transition-transform duration-700 ease-out group-hover:scale-[1.04]`}
                    />
                  </div>
                  {project.category?.[0] && (
                    <span className="absolute left-3 top-3 rounded-full border border-accent/40 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-accent backdrop-blur-sm">
                      {project.category[0]}
                    </span>
                  )}
                </a>

                {/* Full detail */}
                <div className="flex flex-col gap-5">
                  <p className="mono-label">{String(index + 1).padStart(2, '0')}</p>
                  <h2 className="!text-[clamp(28px,3.2vw,44px)]">{project.title}</h2>

                  {/* Short description */}
                  {project.description && (
                    <p className="max-w-[62ch] text-[17px] text-foreground/80">{project.description}</p>
                  )}

                  {/* Language / tags */}
                  {project.tags?.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-foreground/15 px-3 py-1 font-mono text-[11px] text-foreground/60"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Long description */}
                  {project.longDescription && (
                    <p className="max-w-[62ch] text-foreground/70">{project.longDescription}</p>
                  )}

                  {/* Hard part / challenges */}
                  {project.challenges && (
                    <div className="border-l-2 border-accent bg-accent/5 py-3 pl-4 pr-3">
                      <p className="mono-label mb-1.5 !text-accent">{c('workHardPartLabel')}</p>
                      <p className="text-sm leading-relaxed text-foreground/70">{project.challenges}</p>
                    </div>
                  )}

                  {/* Full tech stack */}
                  {project.techStack?.length > 0 && (
                    <div className="border-t hairline pt-4">
                      <p className="mono-label mb-2.5">Tech stack</p>
                      <ul className="flex flex-wrap gap-2">
                        {project.techStack.map((tech) => (
                          <li
                            key={tech}
                            className="rounded border border-foreground/15 bg-card px-2.5 py-1 font-mono text-[11px] text-foreground/70"
                          >
                            {tech}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Links */}
                  {(project.demo || project.github) && (
                    <div className="mt-1 flex items-center gap-6">
                      {project.demo && (
                        <a
                          href={project.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs uppercase tracking-[0.06em] text-accent transition-colors hover:text-accent-hover"
                        >
                          {c('workLiveLabel')} ↗
                        </a>
                      )}
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs uppercase tracking-[0.06em] text-foreground/60 transition-colors hover:text-foreground"
                        >
                          {c('workSourceLabel')} ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        </main>
        <Footer />
      </div>
    </SmoothScrollProvider>
  );
};

export default AllProjects;
