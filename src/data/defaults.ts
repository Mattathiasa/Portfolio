import type { CVData, AboutHighlight, ContactData, BlogPost, Testimonial, Certification } from '@/types/portfolio';
import clashrollerImage from '@/assets/project-clashroller.png';
import footballFreestyleImage from '@/assets/project-football-freestyle.png';
import skzpyImage from '@/assets/project-skypy.png';
import ahawImage from '@/assets/project-ahaw.png';
import type { Project, Skill } from '@/types/portfolio';

export const DEFAULT_PROJECTS: Omit<Project, 'id'>[] = [
  {
    title: 'Ahaw Church Management',
    description: 'Production management system serving 300+ users with 7-level role-based access control.',
    longDescription: 'A full-scale church management system built with React Native and Firebase. Supports 7 hierarchical user levels (Sinodos → Hiyawan Mahderat) with real-time data synchronization, member management, and administrative workflows. Actively used by church leadership to manage 300+ members, replacing manual paper-based processes.',
    image: ahawImage,
    tags: ['React Native', 'Firebase', 'Expo', 'RBAC'],
    techStack: ['React Native', 'Firebase Realtime DB', 'Expo', 'Node.js', 'Firebase Auth'],
    challenges: 'Designing a secure access control system for 7 distinct hierarchical levels was the core architectural challenge. Solved by implementing a middleware-style validation layer on top of Firebase security rules, ensuring each role can only access its permitted data and actions.',
    category: ['Web Apps', 'Mobile'],
    github: 'https://github.com/Mattathiasa',
    demo: 'https://mahibereahaw.vercel.app/',
    order: 0,
  },
  {
    title: 'Clashroller',
    description: 'Multiverse battle simulator with custom event-driven state machine and optimized rendering.',
    longDescription: 'A character battle simulator featuring live-action, cartoon, and anime characters. Built with React and TypeScript, it uses a custom event-driven state machine for real-time interactions. Optimized rendering performance to handle dynamic state updates with smooth animations under load.',
    image: clashrollerImage,
    tags: ['React', 'TypeScript', 'Framer Motion', 'State Machine'],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Node.js'],
    challenges: 'Synchronizing complex character animations with game logic state was the main challenge. Solved by implementing a custom event-driven state machine using specialized React hooks, decoupling animation timing from game state transitions.',
    category: ['Games', 'Web Apps', 'Mobile'],
    github: 'https://github.com/Mattathiasa/animecrewdraft',
    demo: 'https://mn-clashroller.vercel.app/',
    order: 1,
  },
  {
    title: 'Football Freestyle',
    description: 'Video content platform with optimized HD delivery and progressive loading for mobile.',
    longDescription: 'A custom-built content platform for showcasing high-quality football freestyle videos. Implements progressive video loading and asset caching strategies to deliver HD content smoothly on mobile devices without sacrificing UI performance.',
    image: footballFreestyleImage,
    tags: ['React', 'TypeScript', 'Vite', 'Video'],
    techStack: ['React', 'TypeScript', 'Vercel', 'Video-React'],
    challenges: 'Optimizing high-resolution video delivery for mobile users while maintaining smooth UI transitions was critical. Implemented progressive video loading with adaptive bitrate selection and service worker caching for offline playback.',
    category: ['Web Apps', 'Mobile'],
    github: 'https://github.com/Mattathiasa/Football-Freestyle',
    demo: 'https://football-freestyle.vercel.app/',
    order: 2,
  },
  {
    title: 'SKZPY Music Player',
    description: 'Desktop music player with radar-chart analytics and millisecond-accurate multi-language lyrics.',
    longDescription: 'A cross-platform desktop music player built with Electron and React. Features radar-chart vibe ratings powered by Web Audio API analysis, and a custom millisecond-accurate lyric synchronization engine supporting Korean, English, and Romanized lyrics simultaneously.',
    image: skzpyImage,
    tags: ['Electron', 'React', 'Web Audio API', 'Zustand'],
    techStack: ['Electron', 'React', 'Recharts', 'Zustand', 'Web Audio API'],
    challenges: 'Parsing and syncing multi-language (Korean/English/Romanized) lyrics line-by-line required a robust timing engine. Developed a custom synchronization system using Web Audio API timestamps that stays accurate within milliseconds across track seeks and tempo changes.',
    category: ['Web Apps', 'Mobile'],
    github: 'https://github.com/Mattathiasa/skz-player',
    demo: 'https://skz-player.vercel.app/',
    order: 3,
  },
];

export const DEFAULT_SKILLS: Omit<Skill, 'id'>[] = [
  { name: 'JavaScript/TypeScript', level: 90, order: 0 },
  { name: 'React & Next.js',       level: 85, order: 1 },
  { name: 'Flutter',               level: 83, order: 2 },
  { name: 'Java',                  level: 75, order: 3 },
  { name: 'Database Design',       level: 70, order: 4 },
  { name: 'Cloud Services',        level: 70, order: 5 },
  { name: 'Mobile Development',    level: 89, order: 6 },
  { name: 'UI/UX Design',          level: 80, order: 7 },
  { name: 'Angular',               level: 80, order: 8 },
];

export const DEFAULT_TOOLS: string[] = [
  'Git', 'Docker', 'VS Code', 'Figma', 'Postman', 'AWS',
  'MongoDB', 'PostgreSQL', 'Firebase', 'Supabase', 'Vercel',
  'Android Studio', 'Xcode', 'Slack', 'Dotnet', 'SQL',
  'Azure Data Studio', 'Notion',
];

export const DEFAULT_CONTENT = {
  heroTitle: 'Mattathias Abraham',
  siteInitials: 'MA',
  heroSubtitle: 'Software Engineer',
  currentlyWorking: 'Open to remote opportunities',
  heroDescription:
    'Building production mobile and web systems with Flutter, React Native, and Firebase. Currently migrating legacy apps and architecting role-based systems at DAFTech.',
  aboutHeading: 'Software Engineer Who Ships Real Products',
  aboutBody1:
    "I'm a Software Engineering graduate from Addis Ababa, currently building production mobile and web systems at DAFTech. I migrated a legacy Android Java app to Flutter, reducing maintenance overhead and enabling cross-platform deployment. I also architected a church management system serving 300+ users with 7-level hierarchical role-based access control.",
  aboutBody2:
    "My focus is on building scalable, real-time systems with clean architecture. I work across the full stack — from Firebase backends to polished React and Flutter frontends. I'm always looking for challenging problems that require both technical depth and practical thinking.",
  aboutSubtitle: 'Building production systems with real users and real impact.',
  aboutCta: "Let's Work Together",
  skillsHeading: 'Skills & Expertise',
  skillsSubtitle: 'Technologies and tools I work with',
  blogHeading: 'Latest Insights',
  blogSubtitle: 'Thoughts on development, football, and technology',
  blogViewAllText: 'View All Posts',
  contactHeading: 'Get In Touch',
  contactSubtitle: 'Available for new projects and collaborations',
  aboutStats: [
    { number: '2+',  label: 'Years in Tech' },
    { number: '4',   label: 'Production Apps' },
    { number: '300+',label: 'Users Served' },
    { number: '7',   label: 'Role Levels Built' },
  ],
  footerBio: 'Software Engineer building production mobile and web systems with Flutter, React Native, and Firebase.',
  cvUrl: '/resume',
};

export const DEFAULT_HIGHLIGHTS: AboutHighlight[] = [
  { id: 'h1', icon: 'Smartphone', title: 'Cross-Platform Mobile', description: 'Flutter and React Native production apps with real-time sync and role-based access' },
  { id: 'h2', icon: 'Database',   title: 'Full-Stack Systems',   description: 'Firebase, Node.js backends paired with React and TypeScript frontends' },
  { id: 'h3', icon: 'Shield',     title: 'Architecture Design',  description: 'Role-based access control, hierarchical permission systems, and scalable data models' },
  { id: 'h4', icon: 'Rocket',     title: 'Real-World Deployment', description: 'Production apps serving hundreds of users, from legacy migration to new builds' },
];

export const DEFAULT_CONTACT: ContactData = {
  email:            'mattathiasabraham@gmail.com',
  phone:            '+251 902 212 622',
  location:         'Addis Ababa, Ethiopia',
  locationUrl:      'https://www.google.com/maps/place/Addis+Ababa,+Ethiopia',
  github:           'https://github.com/Mattathiasa',
  linkedin:         'https://www.linkedin.com/in/mattathias-abraham-3707a0398/',
  instagram:        'https://www.instagram.com/mattathiasa/',
  availabilityText: 'Available for new projects',
};

export const DEFAULT_BLOG_POSTS: Omit<BlogPost, 'id'>[] = [];

export const DEFAULT_CV: CVData = {
  header: {
    name: 'Mattathias Abraham',
    role: 'Flutter · React Native · Mobile App Developer',
    tagline1: 'Building scalable mobile systems with real-time data and role-based architecture',
    tagline2: 'Open to remote opportunities and international relocation',
    email: 'mattathiasabraham@gmail.com',
    phone: '+251 902 212 622',
    location: 'Addis Ababa, Ethiopia',
    linkedin: 'https://www.linkedin.com/in/mattathias-abraham-3707a0398/',
    portfolio: 'https://mattathiasportfolio.vercel.app/',
    github: 'https://github.com/Mattathiasa',
  },
  summary:
    'Software Engineering graduate specializing in high-performance mobile development with Flutter and React Native. Proven track record of designing and building role-based systems with hierarchical access control, real-time data synchronization, and scalable cloud architectures. Focused on transforming complex requirements into scalable, user-centered mobile solutions.',
  skills: [
    { label: 'Mobile',         value: 'Flutter, React Native, Android (Java), iOS (Xcode)' },
    { label: 'Frontend',       value: 'React, Next.js, Angular, TypeScript, JavaScript, HTML/CSS, Tailwind CSS' },
    { label: 'Backend',        value: 'Node.js, .NET, Java, REST APIs' },
    { label: 'Databases',      value: 'Firebase (Realtime & Firestore), Supabase, PostgreSQL, MongoDB, SQL' },
    { label: 'Cloud & DevOps', value: 'AWS, Azure, Vercel, Docker, Git' },
    { label: 'Tools & Design', value: 'Figma, Postman, Android Studio, VS Code, Notion' },
  ],
  experience: [
    {
      id: 'exp-1',
      title: 'Full Stack Developer',
      badge: 'Full-time',
      org: 'DAFTech Computer Engineering · Addis Ababa, Ethiopia',
      date: 'Feb 2026 – Present',
      bullets: [
        'Leading migration of a legacy Android (Java) application to Flutter, enabling cross-platform deployment and reducing maintenance overhead',
        'Designed and implemented the Inventory module with REST API integration for real-time tracking of 1,000+ records',
        'Improved system maintainability and reduced platform-specific code by consolidating into a single Flutter codebase',
        'Identified and resolved performance bottlenecks during development, improving application responsiveness',
      ],
    },
    {
      id: 'exp-2',
      title: 'Freelance Software Developer',
      badge: 'Freelance',
      org: 'Mahibere Ahaw Church · Remote',
      date: 'Oct 2025 – Present',
      bullets: [
        'Developing a full-scale Church Management System using React Native and Firebase with role-based access for 7 hierarchical user levels',
        'Actively used by church leadership to manage 300+ members and organizational workflows',
        'Implementing real-time data synchronization, member management, and administrative workflows',
        'Designing scalable data structures to support hundreds of active users',
      ],
    },
    {
      id: 'exp-3',
      title: 'IT Intern',
      badge: 'Internship',
      org: 'African Union · Addis Ababa, Ethiopia',
      date: 'Mar 2024 – May 2024',
      bullets: [
        'Contributed to a data mining assignment, collecting and structuring organizational data for analysis.',
        'Converted AFP XML files into well-structured, user-friendly HTML documents to improve content accessibility.',
      ],
    },
  ],
  projects: [
    {
      id: 'cvp-1',
      name: 'Ahaw Church Management App',
      liveUrl: 'https://mahibereahaw.vercel.app/',
      githubUrl: 'https://github.com/Mattathiasa',
      tech: 'React Native (Expo) · Firebase · Role-Based Architecture',
      bullets: [
        'Engineered a role-based mobile application supporting 7 hierarchical user levels with secure access control',
        'Deployed for real-world use to support organizational communication and member management',
        'Architected hierarchical role system (Sinodos → Hiyawan Mahderat) ensuring scalable access control across organizational levels',
        'Implemented real-time data synchronization using Firebase Realtime Database',
      ],
    },
    {
      id: 'cvp-2',
      name: 'Clashroller',
      liveUrl: 'https://mn-clashroller.vercel.app/',
      githubUrl: '',
      tech: 'React · TypeScript · Node.js · Framer Motion · Tailwind CSS',
      bullets: [
        'Built a multiverse battle simulator using React and TypeScript',
        'Developed a custom event-driven state machine for real-time interactions',
        'Optimized rendering performance for smooth interactions under dynamic state updates',
        'Synchronized complex animations with game logic for smooth user experience',
      ],
    },
    {
      id: 'cvp-3',
      name: 'SKZPY Music Player',
      liveUrl: 'https://skz-player.vercel.app/',
      githubUrl: '',
      tech: 'Electron · React · Recharts · Zustand · Web Audio API',
      bullets: [
        'Engineered a cross-platform desktop music player with radar-chart vibe ratings',
        'Developed a custom millisecond-accurate lyric synchronization engine for multi-language display',
        'Implemented advanced state management for real-time visualization of audio data',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'BSc Software Engineering',
      school: 'HiLCoE — Higher Learning College of Engineering · Addis Ababa, Ethiopia',
      date: 'Graduated 2025',
      gpa: '3.5 / 4.0',
    },
  ],
  languages: [
    { name: 'Amharic', level: 'Native' },
    { name: 'English', level: 'Professional' },
  ],
};

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote: 'Mattathias delivered an exceptional church management system that transformed how we organize our 300+ member community. His technical skill and reliability made the entire process seamless.',
    author: 'Mahibere Ahaw Leadership',
    role: 'Church Administration',
    company: 'Mahibere Ahaw Church',
    order: 0,
  },
  {
    id: 't2',
    quote: 'Working with Mattathias has been a pleasure. He quickly understood our complex role hierarchy and built a system that handles it flawlessly. His Flutter migration work has significantly reduced our maintenance costs.',
    author: 'DAFTech Engineering Team',
    role: 'Development Team Lead',
    company: 'DAFTech Computer Engineering',
    order: 1,
  },
  {
    id: 't3',
    quote: 'One of the most talented graduates I have worked with. Mattathias combines strong technical fundamentals with genuine passion for building things that matter.',
    author: 'Academic Supervisor',
    role: 'Professor of Software Engineering',
    company: 'HiLCoE',
    order: 2,
  },
];

export const DEFAULT_CERTIFICATIONS: Certification[] = [
  {
    id: 'cert-1',
    name: 'BSc Software Engineering',
    issuer: 'HiLCoE — Higher Learning College of Engineering',
    date: '2025',
    order: 0,
  },
  {
    id: 'cert-2',
    name: 'Software Engineering Internship',
    issuer: 'African Union',
    date: '2024',
    order: 1,
  },
];
