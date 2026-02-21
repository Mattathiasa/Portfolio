import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ExternalLink, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import clashrollerImage from '@/assets/project-clashroller.png';
import footballFreestyleImage from '@/assets/project-football-freestyle.png';
import skzpyImage from '@/assets/project-skypy.png';

const projects = [
  {
    title: 'Clashroller',
    description: 'A character vs character multiverse battle with live-action, cartoon, and anime characters.',
    image: clashrollerImage,
    tags: ['React', 'TypeScript', 'Node.js'],
    category: ['Games', 'Web Apps', 'Mobile'],
    github: 'https://github.com/Mattathiasa/animecrewdraft',
    demo: 'https://mn-clashroller.vercel.app/',
  },
  {
    title: 'Football Freestyle',
    description: 'My Personal Football trick short, freestyle videos.',
    image: footballFreestyleImage,
    tags: ['React', 'TypeScript', 'Node.js'],
    category: ['Web Apps', 'Mobile'],
    github: 'https://github.com/Mattathiasa/Football-Freestyle',
    demo: 'https://football-freestyle.vercel.app/',
  },

  {
    title: 'SKZPY Music Player',
    description: 'A music player that rates your music on a radar chart, have line by line lyrics and have an original, english translation and rom translation lyrics.',
    image: skzpyImage,
    tags: ['React', 'TypeScript', 'Node.js', 'Electron'],
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
              .map((project, index) => (
                <motion.div
                  key={project.title}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="glass-card rounded-xl overflow-hidden group transition-smooth hover:scale-[1.02] hover:glow-accent"
                >
                  <div className="relative overflow-hidden aspect-video">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        size="sm"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                        asChild
                      >
                        <a href={project.github} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-1" />
                          Code
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-accent text-accent hover:bg-accent hover:text-accent-foreground transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                        asChild
                      >
                        <a href={project.demo} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Demo
                        </a>
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
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-5 w-5" />
              View All Projects on GitHub
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
