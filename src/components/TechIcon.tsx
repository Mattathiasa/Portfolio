import {
  siReact, siTypescript, siJavascript, siFlutter, siFirebase, siNodedotjs,
  siTailwindcss, siElectron, siFigma, siVercel, siDocker, siPostgresql,
  siMongodb, siSupabase, siGithub, siExpo, siVite, siPython, siGsap,
  siCloudflare, siNetlify, siGooglecloud, siRender,
  type SimpleIcon,
} from 'simple-icons';

/**
 * Tech-icon lookup: maps freeform admin-entered tech names to simple-icons.
 * Keys must be in normalized form (lowercase, spaces/dots/dashes/slashes
 * stripped) because lookup normalizes the input the same way. Anything not
 * listed falls back to a plain text pill — handled in the component.
 */
const ICONS: Record<string, SimpleIcon> = {
  react: siReact,
  reactjs: siReact,
  reactnative: siReact,
  typescript: siTypescript,
  ts: siTypescript,
  javascript: siJavascript,
  js: siJavascript,
  flutter: siFlutter,
  dart: siFlutter,
  firebase: siFirebase,
  node: siNodedotjs,
  nodejs: siNodedotjs,
  nodotjs: siNodedotjs,
  express: siNodedotjs,
  tailwind: siTailwindcss,
  tailwindcss: siTailwindcss,
  electron: siElectron,
  figma: siFigma,
  vercel: siVercel,
  docker: siDocker,
  postgres: siPostgresql,
  postgresql: siPostgresql,
  mongodb: siMongodb,
  mongo: siMongodb,
  supabase: siSupabase,
  github: siGithub,
  expo: siExpo,
  vite: siVite,
  python: siPython,
  gsap: siGsap,
  greensock: siGsap,
  cloudflare: siCloudflare,
  netlify: siNetlify,
  gcp: siGooglecloud,
  googlecloud: siGooglecloud,
  render: siRender,
};

/** Normalize a tech string for lookup: lowercase, punctuation stripped. */
const normalize = (tech: string) =>
  tech.toLowerCase().replace(/[.\s\-/]/g, '');

/** Path + brand color + title for a known tech, or null for unknowns. */
export function getTechIcon(tech: string): { path: string; hex: string; title: string } | null {
  const icon = ICONS[normalize(tech)];
  return icon ? { path: icon.path, hex: icon.hex, title: icon.title } : null;
}

/**
 * Small 24×24 brand icon for a known tech; plain text pill fallback for
 * anything unrecognized (same styling as the legacy pills).
 */
export default function TechIcon({ tech }: { tech: string }) {
  const icon = getTechIcon(tech);
  if (!icon) {
    return (
      <span className="rounded border border-foreground/15 bg-card px-2.5 py-1 font-mono text-[11px] text-foreground/70">
        {tech}
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1.5 rounded border border-foreground/15 bg-card px-2.5 py-1 font-mono text-[11px] text-foreground/70"
      title={icon.title}
    >
      <svg
        role="img"
        aria-label={icon.title}
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0"
        fill={`#${icon.hex}`}
      >
        <path d={icon.path} />
      </svg>
      {tech}
    </span>
  );
}
