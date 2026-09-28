// ── Canonical tech-stack options (used by the admin TechStackPicker) ─────────
// These exact names are the source of truth for project.techStack entries —
// freeform aliases ('Firebase', 'Tailwind') should be normalized to them.

export interface TechOption {
  name: string;
  category: string;
}

export const TECH_OPTIONS: TechOption[] = [
  // Languages
  { name: 'TypeScript', category: 'Languages' },
  { name: 'JavaScript', category: 'Languages' },
  { name: 'Dart', category: 'Languages' },
  { name: 'Java', category: 'Languages' },
  { name: 'Python', category: 'Languages' },
  { name: 'HTML/CSS', category: 'Languages' },

  // Frameworks
  { name: 'React', category: 'Frameworks' },
  { name: 'Next.js', category: 'Frameworks' },
  { name: 'Flutter', category: 'Frameworks' },
  { name: 'React Native', category: 'Frameworks' },
  { name: 'Angular', category: 'Frameworks' },
  { name: 'Electron', category: 'Frameworks' },
  { name: 'Video-React', category: 'Frameworks' },

  // Backend
  { name: 'Node.js', category: 'Backend' },
  { name: '.NET', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'REST API', category: 'Backend' },
  { name: 'Firebase Auth', category: 'Backend' },

  // Database
  { name: 'Firebase Realtime DB', category: 'Database' },
  { name: 'Firestore', category: 'Database' },
  { name: 'Supabase', category: 'Database' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'SQL', category: 'Database' },

  // Cloud & DevOps
  { name: 'Vercel', category: 'Cloud & DevOps' },
  { name: 'AWS', category: 'Cloud & DevOps' },
  { name: 'Azure', category: 'Cloud & DevOps' },
  { name: 'Docker', category: 'Cloud & DevOps' },
  { name: 'Git', category: 'Cloud & DevOps' },

  // Tools & Design
  { name: 'Figma', category: 'Tools & Design' },
  { name: 'Expo', category: 'Tools & Design' },
  { name: 'Xcode', category: 'Tools & Design' },
  { name: 'Android Studio', category: 'Tools & Design' },
  { name: 'Postman', category: 'Tools & Design' },
  { name: 'Zustand', category: 'Tools & Design' },
  { name: 'Tailwind CSS', category: 'Tools & Design' },
  { name: 'Framer Motion', category: 'Tools & Design' },
  { name: 'Web Audio API', category: 'Tools & Design' },
  { name: 'Recharts', category: 'Tools & Design' },
];

// Unique category strings, in display order (derived so the two stay in sync).
export const TECH_CATEGORIES: string[] = [
  ...new Set(TECH_OPTIONS.map((t) => t.category)),
];
