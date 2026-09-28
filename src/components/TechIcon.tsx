import {
  siReact, siTypescript, siJavascript, siFlutter, siFirebase, siNodedotjs,
  siTailwindcss, siElectron, siFigma, siVercel, siDocker, siPostgresql,
  siMongodb, siSupabase, siGithub, siExpo, siVite, siPython, siGsap,
  siCloudflare, siNetlify, siGooglecloud, siRender,
} from 'simple-icons';

import * as simpleIcons from 'simple-icons';

/**
 * Tech-icon lookup: aliases map freeform admin-entered tech names to
 * simple-icons slugs. Keys are matched case-insensitively, with
 * punctuation (spaces, dots, dashes, slashes) stripped. Anything not
 * listed falls back to a plain text pill — handled in the component.
 */
const ICON_ALIASES: Record<string, string> = {
  react: 'react',
  reactjs: 'react',
  reactnative: 'react',
  typescript: 'typescript',
  ts: 'typescript',
  javascript: 'javascript',
  js: 'javascript',
  flutter: 'flutter',
  dart: 'flutter',
  firebase: 'firebase',
  node: 'nodedotjs',
  nodejs: 'nodedotjs',
  'node.js': 'nodedotjs',
  nodotjs: 'nodedotjs',
  express: 'nodedotjs',
  tailwind: 'tailwindcss',
  tailwindcss: 'tailwindcss',
  'tailwind css': 'tailwindcss',
  electron: 'electron',
  figma: 'figma',
  vercel: 'vercel',
  docker: 'docker',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  mongodb: 'mongodb',
  mongo: 'mongodb',
  supabase: 'supabase',
  github: 'github',
  expo: 'expo',
  vite: 'vite',
  python: 'python',
  gsap: 'gsap',
  'greensock': 'gsap',
  cloudflare: 'cloudflare',
  netlify: 'netlify',
  gcp: 'googlecloud',
  'google cloud': 'googlecloud',
  googlecloud: 'googlecloud',
  render: 'render',
};

/** Normalize a tech string for lookup: lowercase, punctuation stripped. */
const normalize = (tech: string) =>
  tech.toLowerCase().replace(/[.\s\-/]/g, '');

const slugByIconTitle: Record<string, string> = {
  react: siReact.title,
  typescript: siTypescript.title,
  javascript: siJavascript.title,
  flutter: siFlutter.title,
  firebase: siFirebase.title,
  nodedotjs: siNodedotjs.title,
  tailwindcss: siTailwindcss.title,
  electron: siElectron.title,
  figma: siFigma.title,
  vercel: siVercel.title,
  docker: siDocker.title,
  postgresql: siPostgresql.title,
  mongodb: siMongodb.title,
  supabase: siSupabase.title,
  github: siGithub.title,
  expo: siExpo.title,
  vite: siVite.title,
  python: siPython.title,
  gsap: siGsap.title,
  cloudflare: siCloudflare.title,
  netlify: siNetlify.title,
  googlecloud: siGooglecloud.title,
  render: siRender.title,
};

/** Path + brand color + title for a known tech, or null for unknowns. */
export function getTechIcon(tech: string): { path: string; hex: string; title: string } | null {
  const normalized = normalize(tech);
  const alias = ICON_ALIASES[normalized];
  if (!alias) return null;
  const slug = slugByIconTitle[alias];
  if (!slug) return null;
  const icon = (simpleIcons as Record<string, { path: string; hex: string; title: string }>)[`si${slug}`];
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
