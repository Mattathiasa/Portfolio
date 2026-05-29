export interface Project {
  id?: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
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

export interface PortfolioContent {
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  siteInitials?: string;
  aboutHeading?: string;
  aboutBody1?: string;
  aboutBody2?: string;
  aboutImage?: string;
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
