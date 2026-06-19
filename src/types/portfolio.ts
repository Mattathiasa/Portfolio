// ── Project media ──────────────────────────────────────────────────────────────

export type ImageDevice = 'desktop' | 'mobile' | 'app';
export type ImageFit = 'cover' | 'contain';

export interface ProjectImage {
  url: string;
  device: ImageDevice;   // how the image is framed/displayed
  aspect: string;        // 'auto' | '16/9' | '9/16' | '1/1' | '4/3' | '3/4' | custom 'W/H'
  fit: ImageFit;         // object-fit when shown
}

// Sensible defaults applied when a device is chosen.
export const DEVICE_DEFAULTS: Record<ImageDevice, { aspect: string; fit: ImageFit }> = {
  desktop: { aspect: '16/9', fit: 'cover' },
  mobile:  { aspect: '9/16', fit: 'contain' },
  app:     { aspect: '9/16', fit: 'contain' },
};

export const ASPECT_PRESETS = ['auto', '16/9', '4/3', '1/1', '3/4', '9/16'] as const;

// Normalize any project (old or new) into a rich ProjectImage[] gallery.
export function toProjectMedia(
  p: { media?: ProjectImage[]; images?: string[]; image?: string },
): ProjectImage[] {
  if (p.media && p.media.length) {
    // Backfill any missing fields so callers can rely on them.
    return p.media.map(m => ({
      url: m.url,
      device: m.device ?? 'desktop',
      aspect: m.aspect ?? 'auto',
      fit: m.fit ?? 'cover',
    }));
  }
  const urls = p.images && p.images.length ? p.images : p.image ? [p.image] : [];
  return urls.map(url => ({ url, device: 'desktop' as ImageDevice, aspect: 'auto', fit: 'cover' as ImageFit }));
}

export interface Project {
  id?: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;          // cover image (kept = media[0].url for backward compatibility)
  images?: string[];      // legacy gallery (kept = media.map(url) for backward compatibility)
  media?: ProjectImage[]; // rich gallery: per-image device / aspect / fit
  visible?: boolean;      // shown on the public site? (undefined = visible)
  tags: string[];
  techStack: string[];
  challenges: string;
  category: string[];
  github: string;
  demo: string;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Skill {
  id?: string;
  name: string;
  level: number;
  order: number;
}

export interface AboutStat {
  number: string;
  label: string;
}

export interface PortfolioContent {
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  currentlyWorking?: string;
  siteInitials?: string;
  aboutHeading?: string;
  aboutBody1?: string;
  aboutBody2?: string;
  aboutImage?: string;
  aboutStats?: AboutStat[];
  footerBio?: string;
  cvUrl?: string;
}

// ── About highlights ──────────────────────────────────────────────────────────

export interface AboutHighlight {
  id: string;
  icon: string;
  title: string;
  description: string;
}

// ── Contact ───────────────────────────────────────────────────────────────────

export interface ContactData {
  email: string;
  phone: string;
  location: string;
  locationUrl: string;
  github: string;
  linkedin: string;
  instagram: string;
  availabilityText: string;
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id?: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
  link: string;
  order: number;
}

// ── Develop / project notes (admin-only) ─────────────────────────────────────

export const LIFECYCLE_STAGES = [
  'Idea', 'Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Live', 'Maintenance', 'On Hold',
] as const;
export type LifecycleStage = typeof LIFECYCLE_STAGES[number];

export interface DevItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ProjectDev {
  stage: string;
  aiPrompts: DevItem[];   // AI prompts to run later
  features: DevItem[];    // comments / additional feature ideas
  todos: DevItem[];       // what to do next
  notes: string;          // freeform scratchpad
}

export const emptyProjectDev = (): ProjectDev => ({
  stage: 'Not set',
  aiPrompts: [],
  features: [],
  todos: [],
  notes: '',
});

// ── CV ────────────────────────────────────────────────────────────────────────

export interface CVHeader {
  name: string;
  role: string;
  tagline1: string;
  tagline2: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  github: string;
}

export interface CVSkill {
  label: string;
  value: string;
}

export interface CVExperience {
  id: string;
  title: string;
  badge: string;
  org: string;
  date: string;
  bullets: string[];
}

export interface CVProject {
  id: string;
  name: string;
  liveUrl: string;
  githubUrl: string;
  tech: string;
  bullets: string[];
}

export interface CVEducation {
  id: string;
  degree: string;
  school: string;
  date: string;
  gpa: string;
}

export interface CVLanguage {
  name: string;
  level: string;
}

export interface CVData {
  header: CVHeader;
  summary: string;
  skills: CVSkill[];
  experience: CVExperience[];
  projects: CVProject[];
  education: CVEducation[];
  languages: CVLanguage[];
}
