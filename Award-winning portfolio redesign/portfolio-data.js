// Data layer mirroring the repo's Firestore schema (src/lib/firestore.ts + src/types/portfolio.ts).
// Collections: projects, skills, scheduler, blog. Docs: content/{main,contact,tools,certifications,testimonials,cv,highlights,develop}.
import { firebaseConfig } from './firebase-config.js';

const A = 'src/assets/';
export const DEFAULTS = {
  content: {
    heroTitle: 'Mattathias Abraham', siteInitials: 'MA', heroSubtitle: 'Software Engineer',
    currentlyWorking: 'Open to remote opportunities',
    heroDescription: 'Building production mobile and web systems with Flutter, React Native, and Firebase. Currently migrating legacy apps and architecting role-based systems at DAFTech.',
    aboutHeading: 'Software Engineer Who Ships Real Products',
    aboutSubtitle: 'Building production systems with real users and real impact.',
    aboutBody1: "I'm a Software Engineering graduate from Addis Ababa, currently building production mobile and web systems at DAFTech. I migrated a legacy Android Java app to Flutter, reducing maintenance overhead and enabling cross-platform deployment. I also architected a church management system serving 300+ users with 7-level hierarchical role-based access control.",
    aboutBody2: "My focus is on building scalable, real-time systems with clean architecture. I work across the full stack — from Firebase backends to polished React and Flutter frontends. I'm always looking for challenging problems that require both technical depth and practical thinking.",
    aboutStats: [{ number: '2+', label: 'Years in Tech' }, { number: '4', label: 'Production Apps' }, { number: '300+', label: 'Users Served' }, { number: '7', label: 'Role Levels Built' }],
    aboutImage: A + 'workspace-1280.webp', cvUrl: '/resume',
    footerBio: 'Software Engineer building production mobile and web systems with Flutter, React Native, and Firebase.',
    // ── Site copy (every visible label on the redesigned homepage) ──
    brandLabel: 'mattathias.dev',
    navWork: 'Work', navAbout: 'About', navExperience: 'Experience', navStack: 'Stack', navContact: 'Contact', navResume: 'Résumé', navHire: 'Hire me',
    heroHeadline: 'I build software that *ships* — end to end.',
    heroCtaPrimary: 'Selected work', heroCtaSecondary: 'Résumé', heroTimezone: 'GMT+3',
    workHeading: 'Selected work', workHardPartLabel: 'Hard part', workLiveLabel: 'Live site', workSourceLabel: 'Source', workMoreText: 'More experiments and source on GitHub.',
    aboutIndexLabel: '02 — About',
    experienceHeading: 'Experience', experienceIndexLabel: '03 — Timeline', educationBadge: 'Education',
    skillsHeading: 'Stack', skillsIndexLabel: '04 — What I work with',
    contactIndexLabel: '05 — Contact', contactHeading: 'Have a role or a hard problem? *Let\u2019s talk.*',
    formHeading: 'Send a message', formIntro: 'Lands straight in my inbox. I reply within a day.', formName: 'Name', formEmail: 'Email', formSubject: 'Subject', formMessage: 'Message', formSubmit: 'Send message', formSuccess: 'Message sent — thanks! I\u2019ll get back to you soon.', formError: 'Couldn\u2019t send. Try again or email me directly.',
    elsewhereLabel: 'Elsewhere', directLabel: 'Direct', footerCredit: 'React · GSAP · Three.js · Firebase',
    chatTitle: 'Matty\u2019s AI', chatSubtitle: 'Ask about his work, projects or skills', chatWelcome: 'Hi! I\u2019m Matty\u2019s AI assistant. Ask me anything about his work, projects, or skills!', chatPlaceholder: 'Message Matty\u2019s AI…', chatCta: 'Want Matty to build something? Get in touch →',
    chatSuggestions: ['Is he available for hire?', 'What can he build for me?', 'What\u2019s his favourite anime?'],
    chatSystemPrompt: 'You are a friendly AI assistant on Mattathias Abraham\u2019s portfolio website. Answer questions about him accurately and warmly, in 2–4 sentences. Never invent facts. He is a Software Engineering graduate (HiLCoE, 2025, GPA 3.5) from Addis Ababa working as a Full Stack Developer at DAFTech, freelancing on the Ahaw church management system, passionate about Flutter and mobile, open to remote roles worldwide. Email: mattathiasabraham@gmail.com. When asked about hiring or working together, end with: "You can reach him directly using the **Get in touch** button below 👇"',
  },
  contact: {
    email: 'mattathiasabraham@gmail.com', phone: '+251 902 212 622', location: 'Addis Ababa, Ethiopia',
    locationUrl: 'https://www.google.com/maps/place/Addis+Ababa,+Ethiopia', github: 'https://github.com/Mattathiasa',
    linkedin: 'https://www.linkedin.com/in/mattathias-abraham-3707a0398/', instagram: 'https://www.instagram.com/mattathiasa/',
    availabilityText: 'Available for new projects',
  },
  projects: [
    { id: 'p1', title: 'Ahaw Church Management', description: 'Production management system serving 300+ users with 7-level role-based access control.', longDescription: 'A full-scale church management system built with React Native and Firebase. Supports 7 hierarchical user levels (Sinodos → Hiyawan Mahderat) with real-time data synchronization, member management, and administrative workflows. Actively used by church leadership to manage 300+ members, replacing manual paper-based processes.', image: A + 'project-ahaw.png', tags: ['React Native', 'Firebase', 'Expo', 'RBAC'], techStack: ['React Native', 'Firebase Realtime DB', 'Expo', 'Node.js', 'Firebase Auth'], challenges: 'Designing a secure access control system for 7 distinct hierarchical levels was the core architectural challenge. Solved by implementing a middleware-style validation layer on top of Firebase security rules.', category: ['Web Apps', 'Mobile'], github: 'https://github.com/Mattathiasa', demo: 'https://mahibereahaw.vercel.app/', order: 0, visible: true },
    { id: 'p2', title: 'Clashroller', description: 'Multiverse battle simulator with custom event-driven state machine and optimized rendering.', longDescription: 'A character battle simulator featuring live-action, cartoon, and anime characters. Built with React and TypeScript, it uses a custom event-driven state machine for real-time interactions.', image: A + 'project-clashroller.png', tags: ['React', 'TypeScript', 'Framer Motion', 'State Machine'], techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Node.js'], challenges: 'Synchronizing complex character animations with game logic state. Solved with a custom event-driven state machine using specialized React hooks.', category: ['Games', 'Web Apps', 'Mobile'], github: 'https://github.com/Mattathiasa/animecrewdraft', demo: 'https://mn-clashroller.vercel.app/', order: 1, visible: true },
    { id: 'p3', title: 'Football Freestyle', description: 'Video content platform with optimized HD delivery and progressive loading for mobile.', longDescription: 'A custom-built content platform for showcasing high-quality football freestyle videos. Implements progressive video loading and asset caching strategies to deliver HD content smoothly on mobile.', image: A + 'project-football-freestyle.png', tags: ['React', 'TypeScript', 'Vite', 'Video'], techStack: ['React', 'TypeScript', 'Vercel', 'Video-React'], challenges: 'Optimizing high-resolution video delivery for mobile users while maintaining smooth UI transitions.', category: ['Web Apps', 'Mobile'], github: 'https://github.com/Mattathiasa/Football-Freestyle', demo: 'https://football-freestyle.vercel.app/', order: 2, visible: true },
    { id: 'p4', title: 'SKZPY Music Player', description: 'Desktop music player with radar-chart analytics and millisecond-accurate multi-language lyrics.', longDescription: 'A cross-platform desktop music player built with Electron and React. Features radar-chart vibe ratings powered by Web Audio API analysis, and a custom lyric synchronization engine supporting Korean, English, and Romanized lyrics simultaneously.', image: A + 'project-skypy.png', tags: ['Electron', 'React', 'Web Audio API', 'Zustand'], techStack: ['Electron', 'React', 'Recharts', 'Zustand', 'Web Audio API'], challenges: 'Parsing and syncing multi-language lyrics line-by-line required a robust timing engine accurate within milliseconds across seeks.', category: ['Web Apps', 'Mobile'], github: 'https://github.com/Mattathiasa/skz-player', demo: 'https://skz-player.vercel.app/', order: 3, visible: true },
  ],
  skills: [{ id: 's1', name: 'JavaScript/TypeScript', level: 90, order: 0 }, { id: 's2', name: 'React & Next.js', level: 85, order: 1 }, { id: 's3', name: 'Flutter', level: 83, order: 2 }, { id: 's4', name: 'Java', level: 75, order: 3 }, { id: 's5', name: 'Database Design', level: 70, order: 4 }, { id: 's6', name: 'Cloud Services', level: 70, order: 5 }, { id: 's7', name: 'Mobile Development', level: 89, order: 6 }, { id: 's8', name: 'UI/UX Design', level: 80, order: 7 }, { id: 's9', name: 'Angular', level: 80, order: 8 }],
  tools: ['Git', 'Docker', 'VS Code', 'Figma', 'Postman', 'AWS', 'MongoDB', 'PostgreSQL', 'Firebase', 'Supabase', 'Vercel', 'Android Studio', 'Xcode', 'Slack', 'Dotnet', 'SQL', 'Azure Data Studio', 'Notion'],
  highlights: [
    { id: 'h1', icon: 'Smartphone', title: 'Cross-Platform Mobile', description: 'Flutter and React Native production apps with real-time sync and role-based access' },
    { id: 'h2', icon: 'Database', title: 'Full-Stack Systems', description: 'Firebase, Node.js backends paired with React and TypeScript frontends' },
    { id: 'h3', icon: 'Shield', title: 'Architecture Design', description: 'Role-based access control, hierarchical permission systems, and scalable data models' },
    { id: 'h4', icon: 'Rocket', title: 'Real-World Deployment', description: 'Production apps serving hundreds of users, from legacy migration to new builds' }],
  certifications: [{ id: 'cert-1', name: 'BSc Software Engineering', issuer: 'HiLCoE — Higher Learning College of Engineering', date: '2025', order: 0 }, { id: 'cert-2', name: 'Software Engineering Internship', issuer: 'African Union', date: '2024', order: 1 }],
  testimonials: [
    { id: 't1', quote: 'Mattathias delivered an exceptional church management system that transformed how we organize our 300+ member community. His technical skill and reliability made the entire process seamless.', author: 'Mahibere Ahaw Leadership', role: 'Church Administration', company: 'Mahibere Ahaw Church', order: 0 },
    { id: 't2', quote: 'He quickly understood our complex role hierarchy and built a system that handles it flawlessly. His Flutter migration work has significantly reduced our maintenance costs.', author: 'DAFTech Engineering Team', role: 'Development Team Lead', company: 'DAFTech Computer Engineering', order: 1 },
    { id: 't3', quote: 'One of the most talented graduates I have worked with. Mattathias combines strong technical fundamentals with genuine passion for building things that matter.', author: 'Academic Supervisor', role: 'Professor of Software Engineering', company: 'HiLCoE', order: 2 }],
  cv: {
    header: { name: 'Mattathias Abraham', role: 'Flutter · React Native · Mobile App Developer', tagline1: 'Building scalable mobile systems with real-time data and role-based architecture', tagline2: 'Open to remote opportunities and international relocation', email: 'mattathiasabraham@gmail.com', phone: '+251 902 212 622', location: 'Addis Ababa, Ethiopia', linkedin: 'https://www.linkedin.com/in/mattathias-abraham-3707a0398/', portfolio: 'https://mattathiasportfolio.vercel.app/', github: 'https://github.com/Mattathiasa' },
    summary: 'Software Engineering graduate specializing in high-performance mobile development with Flutter and React Native. Proven track record of designing and building role-based systems with hierarchical access control, real-time data synchronization, and scalable cloud architectures.',
    skills: [{ label: 'Mobile', value: 'Flutter, React Native, Android (Java), iOS (Xcode)' }, { label: 'Frontend', value: 'React, Next.js, Angular, TypeScript, JavaScript, HTML/CSS, Tailwind CSS' }, { label: 'Backend', value: 'Node.js, .NET, Java, REST APIs' }, { label: 'Databases', value: 'Firebase (Realtime & Firestore), Supabase, PostgreSQL, MongoDB, SQL' }, { label: 'Cloud & DevOps', value: 'AWS, Azure, Vercel, Docker, Git' }, { label: 'Tools & Design', value: 'Figma, Postman, Android Studio, VS Code, Notion' }],
    experience: [
      { id: 'exp-1', title: 'Full Stack Developer', badge: 'Full-time', org: 'DAFTech Computer Engineering · Addis Ababa, Ethiopia', date: 'Feb 2026 – Present', bullets: ['Leading migration of a legacy Android (Java) application to Flutter, enabling cross-platform deployment and reducing maintenance overhead', 'Designed and implemented the Inventory module with REST API integration for real-time tracking of 1,000+ records', 'Consolidated platform-specific code into a single Flutter codebase', 'Identified and resolved performance bottlenecks during development'] },
      { id: 'exp-2', title: 'Freelance Software Developer', badge: 'Freelance', org: 'Mahibere Ahaw Church · Remote', date: 'Oct 2025 – Present', bullets: ['Developing a full-scale Church Management System using React Native and Firebase with role-based access for 7 hierarchical user levels', 'Actively used by church leadership to manage 300+ members and organizational workflows', 'Implementing real-time data synchronization, member management, and administrative workflows'] },
      { id: 'exp-3', title: 'IT Intern', badge: 'Internship', org: 'African Union · Addis Ababa, Ethiopia', date: 'Mar 2024 – May 2024', bullets: ['Contributed to a data mining assignment, collecting and structuring organizational data for analysis.', 'Converted AFP XML files into well-structured HTML documents to improve content accessibility.'] }],
    education: [{ id: 'edu-1', degree: 'BSc Software Engineering', school: 'HiLCoE — Higher Learning College of Engineering · Addis Ababa, Ethiopia', date: 'Graduated 2025', gpa: '3.5 / 4.0' }],
    languages: [{ name: 'Amharic', level: 'Native' }, { name: 'English', level: 'Professional' }],
  },
  blog: [],
  scheduler: [
    { id: 'sc1', title: 'Finish Inventory module REST integration', type: 'project', priority: 'high', status: 'in_progress', date: '2026-09-08', time: '09:00', estMinutes: 180, tags: ['flutter', 'api'], completed: false },
    { id: 'sc2', title: 'Ahaw: role-permission audit', type: 'todo', priority: 'medium', status: 'scheduled', date: '2026-09-09', estMinutes: 90, tags: ['security'], completed: false },
    { id: 'sc3', title: 'Standup with DAFTech team', type: 'meeting', priority: 'low', status: 'scheduled', date: '2026-09-08', time: '14:00', duration: '30m', completed: false },
    { id: 'sc4', title: 'Portfolio redesign launch', type: 'deadline', priority: 'high', status: 'review', date: '2026-09-12', completed: false },
    { id: 'sc5', title: 'Write SKZPY lyric-sync blog post', type: 'todo', priority: 'low', status: 'backlog', completed: false }],
  develop: {
    p1: { stage: 'Live', aiPrompts: [{ id: 'a1', text: 'Draft Firestore security rules for 7-level RBAC with unit tests', done: true }], features: [{ id: 'f1', text: 'Offline member roster with sync queue', done: false }, { id: 'f2', text: 'Export attendance to CSV', done: true }], todos: [{ id: 'd1', text: 'Add audit log for role changes', done: false }], notes: 'Leadership asked for monthly report view.' },
    p2: { stage: 'Maintenance', aiPrompts: [], features: [{ id: 'f3', text: 'Tournament bracket mode', done: false }], todos: [], notes: '' },
    p3: { stage: 'Live', aiPrompts: [], features: [], todos: [{ id: 'd2', text: 'Move video hosting to Cloudinary', done: false }], notes: '' },
    p4: { stage: 'Development', aiPrompts: [{ id: 'a2', text: 'Implement LRC parser edge cases (multi-line timestamps)', done: false }], features: [], todos: [{ id: 'd3', text: 'Package Windows build', done: false }, { id: 'd4', text: 'Radar chart tooltips', done: true }], notes: 'Zustand store getting large — split by domain.' },
  },
};

export const isFirebaseConfigured = () => !!firebaseConfig.apiKey && !!window.firebase;

let db = null;
function getDb() {
  if (!isFirebaseConfigured()) return null;
  if (!db) { const fb = window.firebase; const app = fb.apps.length ? fb.app() : fb.initializeApp(firebaseConfig); db = fb.firestore(app); }
  return db;
}

async function docData(d, name, key) { const s = await d.collection('content').doc(name).get(); return s.exists ? (key ? s.data()[key] : s.data()) : null; }
async function coll(d, name) { const s = await d.collection(name).orderBy('order').get(); return s.docs.map(x => ({ id: x.id, ...x.data() })); }

// Returns the full portfolio. Falls back per-section to DEFAULTS when Firestore is empty or unconfigured.
export async function loadPortfolio() {
  const d = getDb(); const out = structuredClone(DEFAULTS); out.source = 'defaults';
  if (!d) return out;
  try {
    const [projects, skills, content, contact, tools, highlights, certs, testi, cv, blog] = await Promise.all([
      coll(d, 'projects'), coll(d, 'skills'), docData(d, 'main'), docData(d, 'contact'), docData(d, 'tools', 'items'),
      docData(d, 'highlights', 'items'), docData(d, 'certifications', 'items'), docData(d, 'testimonials', 'items'), docData(d, 'cv'), coll(d, 'blog')]);
    if (projects.length) out.projects = projects.map(p => ({ ...p, image: p.image || (DEFAULTS.projects.find(x => x.title === p.title) || {}).image || '' }));
    if (skills.length) out.skills = skills;
    if (content) out.content = { ...out.content, ...content };
    if (contact) out.contact = contact;
    if (tools && tools.length) out.tools = tools;
    if (highlights && highlights.length) out.highlights = highlights;
    if (certs && certs.length) out.certifications = certs;
    if (testi && testi.length) out.testimonials = testi;
    if (cv) out.cv = cv;
    if (blog.length) out.blog = blog;
    out.source = 'firestore';
  } catch (e) { console.warn('Firestore load failed, using defaults', e); }
  return out;
}

export async function loadAdminExtras() {
  const d = getDb(); if (!d) return { scheduler: DEFAULTS.scheduler, develop: DEFAULTS.develop, source: 'defaults' };
  try {
    const s = await d.collection('scheduler').orderBy('createdAt').get();
    const dev = await docData(d, 'develop', 'items');
    return { scheduler: s.docs.map(x => ({ id: x.id, ...x.data() })), develop: dev || {}, source: 'firestore' };
  } catch (e) { return { scheduler: DEFAULTS.scheduler, develop: DEFAULTS.develop, source: 'defaults' }; }
}

// Writers — same shapes as src/lib/firestore.ts. No-ops (resolve) when unconfigured so the admin UI can be exercised.
export const save = {
  content: (data) => { const d = getDb(); return d ? d.collection('content').doc('main').set(data, { merge: true }) : Promise.resolve(); },
  contact: (data) => { const d = getDb(); return d ? d.collection('content').doc('contact').set(data) : Promise.resolve(); },
  items: (name, items) => { const d = getDb(); return d ? d.collection('content').doc(name).set({ items }) : Promise.resolve(); },
  cv: (data) => { const d = getDb(); return d ? d.collection('content').doc('cv').set(data) : Promise.resolve(); },
  project: (p) => { const d = getDb(); if (!d) return Promise.resolve(p.id || 'local-' + Date.now()); const { id, ...rest } = p; return id && !id.startsWith('local-') ? d.collection('projects').doc(id).update(rest).then(() => id) : d.collection('projects').add(rest).then(r => r.id); },
  deleteProject: (id) => { const d = getDb(); return d ? d.collection('projects').doc(id).delete() : Promise.resolve(); },
  skill: (s) => { const d = getDb(); if (!d) return Promise.resolve(s.id || 'local-' + Date.now()); const { id, ...rest } = s; return id && !id.startsWith('local-') ? d.collection('skills').doc(id).update(rest).then(() => id) : d.collection('skills').add(rest).then(r => r.id); },
  deleteSkill: (id) => { const d = getDb(); return d ? d.collection('skills').doc(id).delete() : Promise.resolve(); },
};

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
