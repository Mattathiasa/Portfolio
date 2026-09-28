import { useMemo, useState } from 'react';
import { TECH_OPTIONS, TECH_CATEGORIES } from '@/data/tech';

/**
 * Structured tech-stack picker for the admin project form.
 * Controlled component: selected techs live in the parent (form.techStack).
 * Search filters pills by name (case-insensitive); pills toggle in/out of
 * `selected`; the current selection renders below as dismissible pills.
 */
export default function TechStackPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [search, setSearch] = useState('');

  const toggle = (name: string) => {
    onChange(
      selected.includes(name)
        ? selected.filter((t) => t !== name)
        : [...selected, name]
    );
  };

  // Visible options: filtered by search, grouped by category in display order.
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TECH_CATEGORIES.map((category) => ({
      category,
      options: TECH_OPTIONS.filter(
        (t) => t.category === category && (!q || t.name.toLowerCase().includes(q))
      ),
    })).filter((g) => g.options.length > 0);
  }, [search]);

  const hasSelection = selected.length > 0;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter tech…"
          aria-label="Filter tech stack options"
          className="w-full rounded-md border border-border/50 bg-input/40 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent/50"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        {search !== '' && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear filter"
            className="absolute right-2.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      {/* Grouped pills */}
      <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-border/50 bg-secondary/20 p-3">
        {grouped.length === 0 && (
          <p className="py-2 text-center font-mono text-[11px] text-muted-foreground">
            No tech matches '{search.trim()}'
          </p>
        )}
        {grouped.map((group) => (
          <div key={group.category}>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              {group.category}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.options.map((tech) => {
                const active = selected.includes(tech.name);
                return (
                  <button
                    key={tech.name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(tech.name)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                      active
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border/60 bg-background text-foreground/70 hover:border-accent/40 hover:text-foreground'
                    }`}
                  >
                    {tech.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Current selection */}
      {hasSelection && (
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            Selected ({selected.length})
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {selected.map((tech) => (
              <li key={tech}>
                <button
                  type="button"
                  onClick={() => toggle(tech)}
                  aria-label={`Remove ${tech}`}
                  className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[11px] text-accent transition-colors hover:border-red-400/60 hover:bg-red-400/10 hover:text-red-400"
                >
                  {tech}
                  <span aria-hidden="true" className="text-[13px] leading-none opacity-70">
                    ×
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
