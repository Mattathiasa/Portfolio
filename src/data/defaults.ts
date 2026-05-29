import type { CVData, AboutHighlight, ContactData, BlogPost } from '@/types/portfolio';
import clashrollerImage from '@/assets/project-clashroller.png';
import footballFreestyleImage from '@/assets/project-football-freestyle.png';
import skzpyImage from '@/assets/project-skypy.png';
import ahawImage from '@/assets/project-ahaw.png';
import type { Project, Skill } from '@/types/portfolio';

export const DEFAULT_PROJECTS: Omit<Project, 'id'>[] = [
  {
    title: 'Ahaw Church Management',
    description: 'A full-scale management system with 7 hierarchical user levels and real-time synchronization.',
    longDescription: 'Engineered a role-based mobile application supporting complex organizational structures. Architected a hierarchical role system (Sinodos → Hiyawan Mahderat) ensuring scalable access control. Designed for real-world deployment to support church leadership in managing over 300 members and administrative workflows.',
    image: ahawImage,
    tags: ['React Native', 'Firebase', 'Expo'],
    techStack: ['React Native', 'Firebase Realtime DB', 'Expo', 'Node.js'],
    challenges: 'Designing a secure access control system for 7 distinct hierarchical levels was a major architectural challenge. I solved this by implementing a custom middleware-style validation layer on top of Firebase rules.',
    category: ['Web Apps', 'Mobile'],
    github: 'https://github.com/Mattathiasa',
    demo: 'https://mahibereahaw.vercel.app/',
    order: 0,
  },
  {
    title: 'Clashroller',
    description: 'A character vs character multiverse battle with live-action, cartoon, and anime characters.',
    longDescription: 'Built a multiverse battle simulator featuring a diverse roster of characters. Developed a custom event-driven state machine for real-time interactions and optimized rendering performance for smooth interactions under dynamic state updates.',
    image: clashrollerImage,
    tags: ['React', 'TypeScript', 'Node.js', 'Framer Motion'],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Node.js'],
    challenges: 'One of the major challenges was synchronizing complex animations with game logic state. I solved this by implementing a custom event-driven state machine using specialized React hooks.',
    category: ['Games', 'Web Apps', 'Mobile'],
    github: 'https://github.com/Mattathiasa/animecrewdraft',
    demo: 'https://mn-clashroller.vercel.app/',
    order: 1,
  },
  {
    title: 'Football Freestyle',
    description: 'My Personal Football trick short, freestyle videos content platform.',
    longDescription: 'A custom-built content platform to showcase high-quality football freestyle videos. Features a smooth video playback experience with optimized loading strategies for high-definition assets.',
    image: footballFreestyleImage,
    tags: ['React', 'TypeScript', 'Vite'],
    techStack: ['React', 'TypeScript', 'Vercel', 'Video-React'],
    challenges: 'Optimizing high-resolution video delivery for mobile users while maintaining smooth UI transitions was critical. I implemented progressive video loading and asset caching strategies.',
    category: ['Web Apps', 'Mobile'],
    github: 'https://github.com/Mattathiasa/Football-Freestyle',
    demo: 'https://football-freestyle.vercel.app/',
    order: 2,
  },
  {
    title: 'SKZPY Music Player',
    description: 'A music player that rates your music on a radar chart and provides multi-language lyrics.',
    longDescription: 'Engineered a cross-platform desktop music player with radar-chart vibe ratings. Developed a custom millisecond-accurate lyric synchronization engine for multi-language display.',
    image: skzpyImage,
    tags: ['React', 'TypeScript', 'Electron', 'Recharts'],
    techStack: ['Electron', 'React', 'Recharts', 'Zustand', 'Web Audio API'],
    challenges: 'Parsing and syncing multi-language (Rom/Eng/Original) lyrics line-by-line required a robust timing engine. I developed a custom synchronization system that stays accurate within milliseconds.',
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
  heroDescription:
    'Software engineering graduate passionate about building innovative applications and creating engaging football content. Combining technical expertise with creative storytelling.',
  aboutHeading: 'Software Engineering Graduate with a Passion for Innovation',
  aboutBody1:
    "I'm a Software Engineering graduate from Addis Ababa, with a strong passion for building innovative web and mobile applications that solve real-world problems. My journey in tech is complemented by my creative side — I love making football videos, combining my technical skills with storytelling and video editing.",
  aboutBody2:
    "Whether it's developing full-stack applications, creating mobile experiences, or making my personal skill football videos, I bring dedication and creativity to everything I do. I'm always excited to learn new technologies and take on challenging projects.",
  footerBio: 'Software Engineer & Football Content Creator passionate about building innovative solutions and creating engaging content.',
  cvUrl: '/resume',
};

export const DEFAULT_HIGHLIGHTS: AboutHighlight[] = [
  { id: 'h1', icon: 'Code',       title: 'Full-Stack Development', description: 'Building scalable web applications with modern technologies' },
  { id: 'h2', icon: 'Smartphone', title: 'Mobile Development',     description: 'Creating responsive and intuitive mobile experiences' },
  { id: 'h3', icon: 'Video',      title: 'Football Videos',        description: 'Making Football tricks, skills and trick shot videos' },
  { id: 'h4', icon: 'Users',      title: 'Team Collaboration',     description: 'Working effectively in agile development teams' },
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

export const DEFAULT_BLOG_POSTS: Omit<BlogPost, 'id'>[] = [
  {
    title:    'Building Scalable React Applications',
    excerpt:  'Learn best practices for structuring large-scale React applications with TypeScript, state management, and performance optimization.',
    image:    '',
    category: 'Development',
    date:     '2024-11-05',
    readTime: '8 min read',
    link:     '#',
    order:    0,
  },
  {
    title:    'Football Analytics: Data-Driven Insights',
    excerpt:  'How data analytics is revolutionizing football strategy, player performance tracking, and match prediction using modern technologies.',
    image:    '',
    category: 'Analytics',
    date:     '2024-10-28',
    readTime: '6 min read',
    link:     '#',
    order:    1,
  },
  {
    title:    'My Journey into Software Engineering',
    excerpt:  'From choosing computer science to graduating as a software engineer — lessons learned, challenges faced, and advice for aspiring developers.',
    image:    '',
    category: 'Career',
    date:     '2024-10-15',
    readTime: '10 min read',
    link:     '#',
    order:    2,
  },
];

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
