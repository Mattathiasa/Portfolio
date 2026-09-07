import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProjects, getContactData } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTACT } from '@/data/defaults';
import { toProjectMedia } from '@/types/portfolio';
import type { Project } from '@/types/portfolio';
import { useContent } from '@/hooks/useContent';
import { gsap, useGSAP } from '@/lib/gsap';

// The admin marks the first media entry as the cover and sets its fit
// (Cover crops to fill, Contain shows the whole image — e.g. portrait app shots).
const cover = (p: Project) => toProjectMedia(p)[0];

// The homepage shows a curated few; the full catalogue lives at /projects.
const HOMEPAGE_PROJECT_LIMIT = 4;

export const Projects = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { c } = useContent();

  const { data: firestoreProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: contactData } = useQuery({
    queryKey: ['contact'],
    queryFn: getContactData,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const githubUrl = contactData?.github ?? DEFAULT_CONTACT.github;

  // No default fallback — an unconnected/empty Firestore shows an empty state
  // rather than misleading sample projects.
  const allVisible = ((firestoreProjects ?? []) as Project[])
    .filter((p) => p.visible !== false)
    .slice()
    .sort((a, b) => a.order - b.order);
  const projects = allVisible.slice(0, HOMEPAGE_PROJECT_LIMIT);
  const hasMore = allVisible.length > projects.length;
  const isEmpty = allVisible.length === 0;

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
        }
      );
    },
    { scope: sectionRef, dependencies: [projects.length], revertOnUpdate: true }
  );

  return (
    <section id="work" ref={sectionRef} className="section-shell relative [scroll-margin-top:64px]">
      {/* Header row */}
      <div data-reveal className="mb-[clamp(32px,5vh,56px)] flex items-end justify-between gap-6">
        <h2>{c('workHeading')}</h2>
        {!isEmpty && (
          <span className="mono-label shrink-0 pb-2">
            01 — {String(projects.length).padStart(2, '0')}
          </span>
        )}
      </div>

      {isEmpty && (
        <div data-reveal className="border-t hairline py-20 text-center">
          <p className="mono-label text-foreground/40">No projects to display yet</p>
        </div>
      )}

      {/* Vertical project rows */}
      <div>
        {projects.map((project, index) => {
          const cov = cover(project);
          const coverContain = cov?.fit === 'contain';
          return (
          <article
            key={project.id ?? project.title}
            data-reveal
            className="grid gap-8 border-t hairline py-[clamp(36px,6vh,64px)] lg:grid-cols-[minmax(min(100%,380px),1fr)_1fr] lg:gap-14"
          >
            {/* Cover image */}
            <a
              href={project.demo || project.github || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block self-start overflow-hidden rounded-md border hairline"
              aria-label={project.title}
            >
              <div className={`aspect-[16/10] w-full ${coverContain ? 'bg-secondary' : ''}`}>
                <img
                  src={cov?.url ?? project.image}
                  alt={project.title}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full ${coverContain ? 'object-contain' : 'object-cover'} transition-transform duration-700 ease-out group-hover:scale-[1.04]`}
                />
              </div>
              {project.category?.[0] && (
                <span className="absolute left-3 top-3 rounded-full border border-accent/40 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-accent backdrop-blur-sm">
                  {project.category[0]}
                </span>
              )}
            </a>

            {/* Meta / copy */}
            <div className="flex flex-col gap-5">
              <p className="mono-label">
                {String(index + 1).padStart(2, '0')} · {project.techStack.slice(0, 3).join(' · ')}
              </p>
              <h3>{project.title}</h3>
              <p className="max-w-[60ch] text-foreground/70">
                {project.longDescription || project.description}
              </p>

              {project.challenges && (
                <div className="border-l-2 border-accent bg-accent/5 py-3 pl-4 pr-3">
                  <p className="mono-label mb-1.5 !text-accent">{c('workHardPartLabel')}</p>
                  <p className="text-sm leading-relaxed text-foreground/70">{project.challenges}</p>
                </div>
              )}

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

              <div className="mt-auto flex items-center gap-6 pt-1">
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
            </div>
          </article>
          );
        })}
      </div>

      {/* Footer row */}
      {!isEmpty && (
        <div data-reveal className="flex flex-wrap items-center justify-between gap-4 border-t hairline pt-8">
          <p className="text-sm text-foreground/60">{c('workMoreText')}</p>
          <div className="flex items-center gap-6">
            <Link
              to="/projects"
              className="font-mono text-xs uppercase tracking-[0.06em] text-accent transition-colors hover:text-accent-hover"
            >
              {hasMore ? `View all ${allVisible.length} projects →` : 'All projects →'}
            </Link>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs uppercase tracking-[0.06em] text-foreground/60 transition-colors hover:text-foreground"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      )}
    </section>
  );
};
