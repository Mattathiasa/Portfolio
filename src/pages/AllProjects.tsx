import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { toProjectMedia } from '@/types/portfolio';
import type { Project, ProjectImage } from '@/types/portfolio';
import { useContent } from '@/hooks/useContent';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { SmoothScrollProvider } from '@/providers/SmoothScrollProvider';
import { gsap, useGSAP } from '@/lib/gsap';

type Content = ReturnType<typeof useContent>['c'];

const fitClass = (img?: ProjectImage) =>
  img?.fit === 'contain' ? 'object-contain' : 'object-cover';

// Status badge colors: Live → green, In Development → amber, On Hold → gray, rest → gray.
const STATUS_STYLES: Record<string, string> = {
  Live: 'border-green-500/40 bg-green-500/10 text-green-400',
  'In Development': 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  'On Hold': 'border-foreground/25 bg-background/70 text-foreground/60',
};
const STATUS_FALLBACK = 'border-foreground/25 bg-background/70 text-foreground/60';

// ── A single project entry, with its own image gallery ──────────────────────
function ProjectCard({
  project,
  index,
  c,
  expanded,
  onToggleExpand,
}: {
  project: Project;
  index: number;
  c: Content;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const media = useMemo(() => toProjectMedia(project), [project]);
  const [active, setActive] = useState(0);
  const main = media[active] ?? media[0];
  const categories = project.category ?? [];
  const articleRef = useRef<HTMLElement>(null);

  // When expanding, keep the card comfortably in view.
  const handleToggleExpand = () => {
    onToggleExpand();
    if (!expanded) {
      requestAnimationFrame(() => {
        articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  };

  return (
    <article
      ref={articleRef}
      data-reveal
      className="grid gap-8 border-t hairline py-[clamp(40px,7vh,72px)] lg:grid-cols-[minmax(min(100%,420px),1fr)_1fr] lg:gap-14"
    >
      {/* Image gallery */}
      <div className="flex flex-col gap-3 self-start">
        <a
          href={project.demo || project.github || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block overflow-hidden rounded-md border hairline"
          aria-label={project.title}
        >
          <div className={`aspect-[16/10] w-full ${main?.fit === 'contain' ? 'bg-secondary' : ''}`}>
            <img
              src={main?.url ?? project.image}
              alt={project.title}
              loading="lazy"
              decoding="async"
              className={`h-full w-full ${fitClass(main)} transition-transform duration-700 ease-out group-hover:scale-[1.04]`}
            />
          </div>
          {categories[0] && (
            <span className="absolute left-3 top-3 rounded-full border border-accent/40 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-accent backdrop-blur-sm">
              {categories[0]}
            </span>
          )}
          {project.status && (
            <span
              className={`absolute right-3 top-3 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.06em] backdrop-blur-sm ${
                STATUS_STYLES[project.status] ?? STATUS_FALLBACK
              }`}
            >
              {project.status}
            </span>
          )}
        </a>

        {/* Thumbnails — only when there is more than one image */}
        {media.length > 1 && (
          <ul className="flex flex-wrap gap-2">
            {media.map((m, i) => (
              <li key={m.url + i}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1} of ${project.title}`}
                  aria-pressed={i === active}
                  className={`h-14 w-20 overflow-hidden rounded border transition-colors ${
                    i === active ? 'border-accent' : 'border-foreground/15 hover:border-foreground/40'
                  } ${m.fit === 'contain' ? 'bg-secondary' : ''}`}
                >
                  <img
                    src={m.url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className={`h-full w-full ${fitClass(m)}`}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Full detail */}
      <div className="flex flex-col gap-5">
        <p className="mono-label">
          {String(index + 1).padStart(2, '0')}
          {categories.length > 0 && <> · {categories.join(' · ')}</>}
        </p>
        <h2 className="!text-[clamp(28px,3.2vw,44px)]">{project.title}</h2>

        {project.description && (
          <p className="max-w-[62ch] text-[17px] text-foreground/80">{project.description}</p>
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

        {project.techStack?.length > 0 && (
          <div className="border-t hairline pt-4">
            <p className="mono-label mb-2.5">Tech stack</p>
            <ul className="flex flex-wrap gap-2">
              {(expanded ? project.techStack : project.techStack.slice(0, 3)).map((tech) => (
                <li
                  key={tech}
                  className="rounded border border-foreground/15 bg-card px-2.5 py-1 font-mono text-[11px] text-foreground/70"
                >
                  {tech}
                </li>
              ))}
              {!expanded && project.techStack.length > 3 && (
                <li className="rounded border border-foreground/15 bg-card px-2.5 py-1 font-mono text-[11px] text-foreground/50">
                  +{project.techStack.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

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

        {/* Expand toggle */}
        <button
          type="button"
          onClick={handleToggleExpand}
          aria-expanded={expanded}
          className="mt-1 flex w-fit items-center gap-1.5 font-mono text-xs uppercase tracking-[0.06em] text-foreground/60 transition-colors hover:text-accent"
        >
          {expanded ? 'Collapse ↑' : 'View details ↓'}
        </button>

        {/* Expandable detail panel — full long description, challenges, full tech stack */}
        <div
          className={`grid transition-all duration-500 ease-in-out ${
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-5 border-t hairline pt-5">
              {project.longDescription && (
                <p className="max-w-[62ch] text-foreground/70">{project.longDescription}</p>
              )}

              {project.challenges && (
                <div className="border-l-2 border-accent bg-accent/5 py-3 pl-4 pr-3">
                  <p className="mono-label mb-1.5 !text-accent">{c('workHardPartLabel')}</p>
                  <p className="text-sm leading-relaxed text-foreground/70">{project.challenges}</p>
                </div>
              )}

              {project.techStack?.length > 0 && (
                <div>
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
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Loading placeholder matching the ProjectCard layout ──────────────────────
function SkeletonCard() {
  return (
    <div className="grid gap-8 border-t hairline py-[clamp(40px,7vh,72px)] lg:grid-cols-[minmax(min(100%,420px),1fr)_1fr] lg:gap-14">
      {/* Image placeholder */}
      <div className="self-start">
        <div className="aspect-[16/10] w-full animate-pulse rounded-md bg-foreground/8" />
      </div>
      {/* Stacked text placeholders */}
      <div className="flex flex-col gap-5">
        <div className="h-3 w-24 animate-pulse rounded bg-foreground/8" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-foreground/8" />
        <div className="h-4 w-full max-w-[62ch] animate-pulse rounded bg-foreground/8" />
        <div className="h-4 w-full max-w-[48ch] animate-pulse rounded bg-foreground/8" />
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-20 animate-pulse rounded bg-foreground/8" />
          <div className="h-6 w-24 animate-pulse rounded bg-foreground/8" />
          <div className="h-6 w-16 animate-pulse rounded bg-foreground/8" />
        </div>
      </div>
    </div>
  );
}

const AllProjects = () => {
  const mainRef = useRef<HTMLElement>(null);
  const { c } = useContent();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Projects · Mattathias Abraham';
    window.scrollTo(0, 0);
    return () => {
      document.title = prev;
    };
  }, []);

  const { data: firestoreProjects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // No default fallback — show a real (possibly empty) view of Firestore.
  const projects = useMemo(
    () =>
      ((firestoreProjects ?? []) as Project[])
        .filter((p) => p.visible !== false)
        .slice()
        .sort((a, b) => a.order - b.order),
    [firestoreProjects]
  );

  // Category filters keyed on primary category (category[0]), in first-seen order.
  // Grouping and filtering both use the primary category so they stay in sync.
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of projects) {
      const primary = p.category?.[0] ?? 'Uncategorized';
      if (!seen.includes(primary)) seen.push(primary);
    }
    return seen;
  }, [projects]);

  // Base filter: active category (on primary category, category[0]).
  const categoryFiltered = useMemo(
    () =>
      activeCategory === 'All'
        ? projects
        : projects.filter((p) => (p.category?.[0] ?? 'Uncategorized') === activeCategory),
    [projects, activeCategory]
  );

  // Then real-time search over title, tags and tech stack (case-insensitive,
  // whitespace-trimmed). Empty query matches everything.
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categoryFiltered;
    return categoryFiltered.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (p.techStack ?? []).some((t) => t.toLowerCase().includes(q))
    );
  }, [categoryFiltered, searchQuery]);

  // Total projects per primary category across ALL projects (for filter button counts).
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      const primary = p.category?.[0] ?? 'Uncategorized';
      counts.set(primary, (counts.get(primary) ?? 0) + 1);
    }
    return counts;
  }, [projects]);

  // Filtered projects grouped by primary category (category[0]), in first-seen
  // order — same ordering logic as the categories memo above. When a category
  // filter is active this naturally collapses to just the matching group(s).
  const grouped = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of filtered) {
      const key = p.category?.[0] ?? 'Uncategorized';
      const bucket = map.get(key);
      if (bucket) bucket.push(p);
      else map.set(key, [p]);
    }
    return [...map].map(([category, groupProjects]) => ({ category, projects: groupProjects }));
  }, [filtered]);

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
          // fromTo (not scroll-gated) so cards always settle visible — a
          // scroll-triggered reveal leaves filtered cards stuck at opacity 0.
          gsap.fromTo(
            reveals,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.05, overwrite: true }
          );
        }
      );
    },
    // Re-run on data load and on filter changes so freshly-shown cards get
    // fresh scroll-triggers (otherwise revealed-once cards stay invisible).
    { scope: mainRef, dependencies: [projects.length, activeCategory], revertOnUpdate: true }
  );

  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen">
        <Navigation />
        <main ref={mainRef} className="relative z-10">
          {/* Header */}
          <section className="section-shell !pb-[clamp(24px,4vh,40px)]">
            <p data-reveal className="mono-label mb-5">
              <Link to="/" className="transition-colors hover:text-accent">
                ← {c('brandLabel')}
              </Link>
            </p>
            <div data-reveal className="flex items-end justify-between gap-6">
              <h1 className="!text-[clamp(44px,8vw,104px)]">{c('workHeading')}</h1>
              <span className="mono-label shrink-0 pb-2">
                {String(filtered.length).padStart(2, '0')}
                {activeCategory !== 'All' && <> / {String(projects.length).padStart(2, '0')}</>} projects
              </span>
            </div>

            {/* Category filter */}
            {categories.length > 1 && (
              <div data-reveal className="mt-8 flex flex-wrap gap-2">
                {['All', ...categories].map((cat) => {
                  const count = cat === 'All' ? projects.length : (categoryCounts.get(cat) ?? 0);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      aria-pressed={activeCategory === cat}
                      className={`rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors ${
                        activeCategory === cat
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-foreground/15 text-foreground/55 hover:border-foreground/40 hover:text-foreground'
                      }`}
                    >
                      {cat} · {count}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Real-time search */}
            <div data-reveal className="mt-4">
              <div className="relative flex items-center">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects…"
                  aria-label="Search projects"
                  className="w-full rounded-md border hairline bg-card/60 py-2.5 pl-4 pr-10 font-mono text-sm text-foreground placeholder:text-foreground/35 outline-none transition-colors focus:border-accent/50"
                />
                {searchQuery.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full border border-foreground/20 text-foreground/50 transition-colors hover:border-foreground/50 hover:text-foreground"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Full project list */}
          <section className="section-shell !pt-0">
            {isLoading ? (
              // Skeleton placeholders while Firestore loads
              [0, 1, 2].map((i) => <SkeletonCard key={i} />)
            ) : (
              <>
                {filtered.length === 0 && (
                  <div data-reveal className="border-t hairline py-20 text-center">
                    <p className="mono-label text-foreground/40">
                      {projects.length === 0
                        ? 'No projects to display yet'
                        : searchQuery.trim() !== ''
                          ? `No results for '${searchQuery.trim()}'`
                          : 'No projects in this category'}
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-[clamp(56px,10vh,96px)]">
                  {grouped.map((group) => (
                    <div key={group.category} className="flex flex-col">
                      {/* Group heading: category name + zero-padded count, hairline rule */}
                      <div
                        data-reveal
                        className="flex items-end justify-between gap-6 border-b hairline pb-4"
                      >
                        <h2 className="!text-[clamp(24px,2.6vw,36px)]">{group.category}</h2>
                        <span className="mono-label shrink-0 pb-1">
                          {String(group.projects.length).padStart(2, '0')} projects
                        </span>
                      </div>

                      {/* The heading's rule replaces the first card's top border */}
                      <div className="flex flex-col [&>article:first-child]:border-t-0">
                        {group.projects.map((project, index) => (
                          <ProjectCard
                            key={project.id ?? project.title}
                            project={project}
                            index={index}
                            c={c}
                            expanded={expandedId === (project.id ?? project.title)}
                            onToggleExpand={() => {
                              const key = project.id ?? project.title;
                              setExpandedId((prev) => (prev === key ? null : key));
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </main>
        <Footer />
      </div>
    </SmoothScrollProvider>
  );
};

export default AllProjects;
