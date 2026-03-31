import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ExternalLink, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import clashrollerImage from '@/assets/project-clashroller.png';
import footballFreestyleImage from '@/assets/project-football-freestyle.png';
import skzpyImage from '@/assets/project-skypy.png';
import ahawImage from '@/assets/project-ahaw.png';

const projects = [
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
  }
];

const categories = ['All', 'Web Apps', 'Mobile', 'Games', 'Content'];

export const Projects = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <section id="projects" ref={ref} className="min-h-screen flex items-center justify-center relative py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4">Featured Projects</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            A showcase of my recent work and side projects
          </p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              onClick={() => setActiveCategory(category)}
              className={
                activeCategory === category
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'border-accent text-accent hover:bg-accent hover:text-accent-foreground'
              }
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12"
        >
          <AnimatePresence mode='popLayout'>
            {projects
              .filter((project) => activeCategory === 'All' || project.category.includes(activeCategory))
              .map((project) => (
                <Dialog key={project.title}>
                  <DialogTrigger asChild>
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                      className="glass-card rounded-xl overflow-hidden group transition-smooth hover:scale-[1.02] hover:glow-accent cursor-pointer"
                    >
                      <div className="relative overflow-hidden aspect-video">
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button size="sm" className="bg-accent text-accent-foreground">
                            View Details
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">{project.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-[10px] uppercase tracking-wider px-2 py-1 bg-accent/5 text-accent/80 rounded border border-accent/10"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-accent/20">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold gradient-text">{project.title}</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Detailed Project Breakdown
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      <div className="aspect-video rounded-lg overflow-hidden border border-accent/10">
                        <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-foreground">Overview</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{project.longDescription}</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <h4 className="text-lg font-semibold text-foreground">Tech Stack</h4>
                          <div className="flex flex-wrap gap-2">
                            {project.techStack.map((tech) => (
                              <span key={tech} className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-md border border-accent/20">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-semibold text-foreground">The Challenge</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed italic">
                            "{project.challenges}"
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                          <a href={project.github} target="_blank" rel="noopener noreferrer">
                            <Github className="w-4 h-4 mr-2" />
                            View Source Code
                          </a>
                        </Button>
                        <Button variant="outline" className="flex-1 border-accent text-accent hover:bg-accent" asChild>
                          <a href={project.demo} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Live Demo
                          </a>
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
          </AnimatePresence>
        </motion.div>

        {/* View More */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Button
            size="lg"
            variant="outline"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            asChild
          >
            <a href="https://github.com/Mattathiasa" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-5 w-5" />
              View All Projects on GitHub
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
