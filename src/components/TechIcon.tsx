import {
  siReact, siTypescript, siJavascript, siFlutter, siFirebase, siNodedotjs,
  siTailwindcss, siElectron, siFigma, siVercel, siDocker, siPostgresql,
  siMongodb, siSupabase, siGithub, siExpo, siVite, siPython, siGsap,
  siCloudflare, siNetlify, siGooglecloud, siRender, siDart, siAngular,
  siNextdotjs, siGit, siAndroid,
  type SimpleIcon,
} from 'simple-icons';

const ICONS: Record<string, SimpleIcon> = {
  react: siReact,
  reactjs: siReact,
  reactnative: siReact,
  typescript: siTypescript,
  ts: siTypescript,
  javascript: siJavascript,
  js: siJavascript,
  flutter: siFlutter,
  dart: siDart,
  firebase: siFirebase,
  firebaserealtimeddb: siFirebase,
  firebaserealtimedatabase: siFirebase,
  firestore: siFirebase,
  firebaseauth: siFirebase,
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
  angular: siAngular,
  nextjs: siNextdotjs,
  nextdotjs: siNextdotjs,
  git: siGit,
  android: siAndroid,
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
 * Vertical icon card: large brand logo on top, tech name below.
 * Falls back to a plain text pill for unrecognized techs.
 *
 * Use inside a grid/flex container — does not set its own width.
 */
export default function TechIcon({ tech }: { tech: string }) {
  const icon = getTechIcon(tech);

  if (!icon) {
    // Fallback: plain pill for unrecognized / legacy freeform entries
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-lg border border-foreground/10 bg-card px-3 py-3 text-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/8">
          <span className="font-mono text-[10px] font-bold uppercase text-foreground/50">
            {tech.slice(0, 2)}
          </span>
        </div>
        <span className="font-mono text-[10px] leading-tight text-foreground/60 max-w-[56px] truncate">
          {tech}
        </span>
      </div>
    );
  }

  return (
    <div
      className="group flex flex-col items-center gap-1.5 rounded-lg border border-foreground/10 bg-card px-3 py-3 text-center transition-colors hover:border-foreground/25 hover:bg-card/80"
      title={icon.title}
    >
      <svg
        role="img"
        aria-label={icon.title}
        viewBox="0 0 24 24"
        className="h-8 w-8 shrink-0 transition-opacity group-hover:opacity-90"
        fill={`#${icon.hex}`}
      >
        <path d={icon.path} />
      </svg>
      <span className="font-mono text-[10px] leading-tight text-foreground/60 max-w-[64px] truncate">
        {tech}
      </span>
    </div>
  );
}
