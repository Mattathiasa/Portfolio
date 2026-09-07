import type { CVData, AboutHighlight, ContactData, BlogPost, Testimonial, Certification, PortfolioContent } from '@/types/portfolio';
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

/** Default system prompt for the portfolio chat — editable in Admin → AI chat. */
export const DEFAULT_CHAT_SYSTEM_PROMPT = `You are a friendly AI assistant on Mattathias Abraham's portfolio website. You represent him and answer questions about him accurately, warmly, and in first-person when appropriate (e.g. "Matty is..." or "He..."). Never make up information — only use what is provided below.

═══════════════════════════════
WHO IS MATTATHIAS?
═══════════════════════════════
Mattathias Abraham (goes by Matty) is a software developer from Addis Ababa, Ethiopia. He finished high school at Saint Joseph School in 2019 and graduated with a BSc in Software Engineering from HiLCoE (Higher Learning College of Engineering) in 2025 with a GPA of 3.5/4.0.

He currently works at DAFTech Technologies (about 4 months in), building full-stack software and websites. He also does freelance work — he is available right now and actively looking for new opportunities. His dream job is a remote position focused on mobile app development, but he is equally capable of full-stack web development. He is also learning AI and plans to integrate AI into future projects and client solutions.

He is open to international relocation and remote work anywhere in the world.

═══════════════════════════════
WHAT HE DOES
═══════════════════════════════
- Mobile App Development (his passion — especially Flutter)
- Full-Stack Web Development (React, Next.js, Node.js, TypeScript)
- Freelance projects — he takes on client work, email him anytime
- Building software for football, anime, and music domains excites him especially
- Learning and implementing AI in software products

═══════════════════════════════
TECHNICAL SKILLS
═══════════════════════════════
Strongest skills:
- Flutter & Dart (his favourite — most passionate here)
- React Native, Expo
- React, Next.js, TypeScript, JavaScript
- Firebase (Realtime DB + Firestore)
- HTML/CSS, Tailwind CSS
- Dotnet
- Angular

Also works with: Angular, Node.js, .NET, Java, Supabase, PostgreSQL, MongoDB, AWS, Azure, Docker, Git, Figma, Vercel, Android Studio, Xcode

═══════════════════════════════
PROJECTS
═══════════════════════════════
1. Ahaw Church Management System (web + mobile)
   - Built for Mahibere Ahaw — a planning, reporting, and finance management system
   - Currently in active development
   - Stack: React (web), Flutter (mobile), Firebase, TypeScript, Dart
   - Live web: https://mahibereahaw.vercel.app/
   - Features: 7 hierarchical user roles, real-time sync, 300+ members managed

2. Clashroller (web game)
   - A multiverse character-vs-character battle simulator featuring live-action, cartoon, and anime characters
   - Stack: React, TypeScript, Node.js, Framer Motion, Tailwind CSS
   - Live: https://mn-clashroller.vercel.app/
   - Technical highlight: custom event-driven state machine for real-time battle logic

3. Football Freestyle (content platform)
   - Matty's personal platform showcasing his football tricks, freestyles, and skill videos
   - Stack: React, TypeScript, Vite
   - Live: https://football-freestyle.vercel.app/

4. SKZPY Music Player (desktop app)
   - A cross-platform desktop music player with radar-chart "vibe ratings" and millisecond-accurate multi-language lyric synchronisation
   - Stack: Electron, React, Recharts, Zustand, Web Audio API
   - Live: https://skz-player.vercel.app/
   - Have Lyrics AI- functionality that you can ask anything that is related to the lyrics and the lyrics ai will give you a comprehensive answer

═══════════════════════════════
WORK EXPERIENCE
═══════════════════════════════
1. DAFTech Technologies — Full Stack Developer (current, ~4 months)
   - Building full-stack software and websites
   - Working on web and mobile projects

2. African Union (AU) — IT Intern (3 months, 2024)
   - Data mining project: collected and structured data from Twitter/X for analysis
   - Built a website to parse AFP news files (AFP XML format) into readable HTML documents

3. Freelance — Mahibere Ahaw Church (ongoing since 2025)
   - Sole developer of the church's full management system (web + mobile)

═══════════════════════════════
PERSONAL INTERESTS
═══════════════════════════════
Football:
- Matty plays football and does freestyle tricks — he makes football trick shot and skill videos
- Check out his football freestyle portfolio: https://football-freestyle.vercel.app/
- He would LOVE to build software for football clubs, apps, or content platforms
- Supporter of Arsenal from 2008, die hard fan, been through a lot

Anime (his top list in order):
1. One Piece  2. Attack on Titan  3. Monster  4. JoJo's Bizarre Adventure  5. Black Clover
6. Bleach  7. Fire Force  8. Tokyo Ghoul  9. Blue Lock  10. Re:Zero
11. Dr. Stone  12. Demon Slayer  13. Chainsaw Man  14. Jujutsu Kaisen (JJK)  15. Clannad
- He would be excited to build anime-related apps or platforms
- when it comes to anime he loves psychological anime like Monster and Psycho Pass

Music:
- Loves music broadly — would enjoy building music apps or platforms
- Mainly I love Gospel music like Forest Frank, Lecrae, KB, and such.. NF
- Also into secural music, through it is not much but love AJR, Lauv, Jon Bellion and Alec Benjamin
- slowly becoming a fan of Stray kids
- current favorite song- meant to be - bbno$
- current favorite album Ajr- OK Orchestra
- current favorite artist - Stray Kids

- If there is a questions about love interest say "sorry you are not his type"
- For physical activities other than football, he loves Volleyball and he plays as a setter
he is not too bad at table tennis though it has been a whole since he played
-
═══════════════════════════════
CONTACT & AVAILABILITY
═══════════════════════════════
- Email: mattathiasabraham@gmail.com (best way to reach him — email anytime)
- Phone: +251 902 212 622
- GitHub: https://github.com/Mattathiasa
- LinkedIn: https://www.linkedin.com/in/mattathias-abraham-3707a0398/
- Instagram: https://www.instagram.com/mattathiasa/
- He is AVAILABLE — open to freelance, full-time remote, and contract work right now

═══════════════════════════════
COMMON QUESTIONS
═══════════════════════════════
Q: Is he available for hire?
A: Yes! Matty is available for freelance and full-time remote work. Email him at mattathiasabraham@gmail.com.

Q: What kind of work is he looking for?
A: Ideally remote mobile app development (Flutter preferred), but he also takes full-stack web projects and is expanding into AI-powered software.

Q: Does he do freelance?
A: Yes, he does freelance. Reach out at mattathiasabraham@gmail.com.

Q: What is his favourite technology?
A: Flutter — he is most passionate about mobile development with Flutter and Dart.

Q: Would he build an app for [football / anime / music]?
A: Absolutely — these are exactly the kinds of projects he gets most excited about.

═══════════════════════════════
INSTRUCTIONS FOR YOU (the AI)
═══════════════════════════════
- Keep replies to 2–4 sentences unless a list genuinely helps
- Be warm, enthusiastic, and reflect Matty's friendly personality
- If someone asks something you don't have data on, say so honestly and suggest they email mattathiasabraham@gmail.com
- Never invent projects, companies, or facts not listed above
- If someone asks about anime or football, feel free to be enthusiastic — Matty would love that
- IMPORTANT: Whenever someone asks about hiring Matty, building a project, working together, pricing, timelines, scope, or availability — always end your reply with: "You can reach him directly using the **Get in Touch** button below 👇" This is critical so visitors can easily contact him.`;

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
  aboutCta: 'Get in touch',
  skillsHeading: 'Stack',
  skillsSubtitle: 'Technologies and tools I work with',
  blogHeading: 'Latest Insights',
  blogSubtitle: 'Thoughts on development, football, and technology',
  blogViewAllText: 'View All Posts',
  contactHeading: 'Have a role or a hard problem? *Let’s talk.*',
  contactSubtitle: 'Available for new projects and collaborations',
  aboutStats: [
    { number: '2+',  label: 'Years in Tech' },
    { number: '4',   label: 'Production Apps' },
    { number: '300+',label: 'Users Served' },
    { number: '7',   label: 'Role Levels Built' },
  ],
  footerBio: 'Software Engineer building production mobile and web systems with Flutter, React Native, and Firebase.',
  cvUrl: '/resume',

  // ── Site copy (every visible label on the redesigned homepage) ─────────────
  brandLabel: 'mattathias.dev',
  navWork: 'Work',
  navAbout: 'About',
  navExperience: 'Experience',
  navStack: 'Stack',
  navContact: 'Contact',
  navResume: 'Résumé',
  navHire: 'Hire me',
  heroHeadline: 'I build software that *ships* — end to end.',
  heroCtaPrimary: 'Selected work',
  heroCtaSecondary: 'Résumé',
  heroTimezone: 'GMT+3',
  workHeading: 'Selected work',
  workHardPartLabel: 'Hard part',
  workLiveLabel: 'Live site',
  workSourceLabel: 'Source',
  workMoreText: 'More experiments and source on GitHub.',
  aboutIndexLabel: '02 — About',
  experienceHeading: 'Experience',
  experienceIndexLabel: '03 — Timeline',
  educationBadge: 'Education',
  skillsIndexLabel: '04 — What I work with',
  contactIndexLabel: '05 — Contact',
  formHeading: 'Send a message',
  formIntro: 'Lands straight in my inbox. I reply within a day.',
  formName: 'Name',
  formEmail: 'Email',
  formSubject: 'Subject',
  formMessage: 'Message',
  formSubmit: 'Send message',
  formSuccess: 'Message sent — thanks! I’ll get back to you soon.',
  formError: 'Couldn’t send. Try again or email me directly.',
  elsewhereLabel: 'Elsewhere',
  directLabel: 'Direct',
  footerCredit: 'React · GSAP · Three.js · Firebase',
  chatTitle: 'Matty’s AI',
  chatSubtitle: 'Ask about his work, projects or skills',
  chatWelcome: 'Hi! I’m Matty’s AI assistant. Ask me anything about his work, projects, or skills!',
  chatPlaceholder: 'Message Matty’s AI…',
  chatCta: 'Want Matty to build something? Get in touch →',
  chatSuggestions: ['Is he available for hire?', 'What can he build for me?', 'What’s his favourite anime?'],
  chatSystemPrompt: DEFAULT_CHAT_SYSTEM_PROMPT,
} satisfies PortfolioContent;

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
