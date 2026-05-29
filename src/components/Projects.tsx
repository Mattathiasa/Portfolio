import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ExternalLink, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_PROJECTS } from '@/data/defaults';

const categories = ['All', 'Web Apps', 'Mobile', 'Games', 'Content'];

export const Projects = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [activeCategory, setActiveCategory] = useState('All');

  const { data: firestoreProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Use Firestore data when available; fall back to bundled defaults
  const rawProjects = (firestoreProjects && firestoreProjects.length > 0)
    ? firestoreProjects
    : DEFAULT_PROJECTS;

  // If a Firestore project has no image yet, resolve it from the local defaults
  const projects = rawProjects.map(p => {
    if (p.image) return p;
    const match = DEFAULT_PROJECTS.find(d => d.title === p.title);
    return match ? { ...p, image: match.image } : p;
  });

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
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <AnimatePresence mode='popLayout'>
            {projects
              .filter((project) => activeCategory === 'All' || project.category.includes(activeCategory))
              .map((project) => (
                // motion.div must be the direct child of AnimatePresence so Framer Motion
                // can forward a ref to a real DOM element (Dialog is a function component
                // without forwardRef and would throw a ref warning otherwise).
                <motion.div
                  key={project.title}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  <Dialog>
                  <DialogTrigger asChild>
                    <div className="glass-card rounded-xl overflow-hidden group transition-smooth hover:scale-[1.02] hover:glow-accent cursor-pointer flex flex-col">
                      {/* Image */}
                      <div className="relative overflow-hidden aspect-video bg-secondary/30 shrink-0">
                        {project.image ? (
                          <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-4xl font-bold">
                            {project.title[0]}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button size="sm" className="bg-accent text-accent-foreground">
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 group-hover:text-accent transition-colors">{project.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                        </div>

                        {/* Languages / tags */}
                        {project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {project.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-accent/5 text-accent/80 rounded border border-accent/10"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* GitHub + Demo links */}
                        <div className="flex items-center gap-2 mt-auto pt-1" onClick={e => e.stopPropagation()}>
                          {project.github && (
                            <a
                              href={project.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 hover:border-accent/40 rounded-md px-2.5 py-1.5"
                            >
                              <Github className="w-3.5 h-3.5" /> GitHub
                            </a>
                          )}
                          {project.demo && (
                            <a
                              href={project.demo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 hover:border-accent/40 rounded-md px-2.5 py-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-accent/20">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold gradient-text">{project.title}</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Detailed Project Breakdown
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      {project.image && (
                        <div className="aspect-video rounded-lg overflow-hidden border border-accent/10">
                          <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                        </div>
                      )}
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
                        {project.github && (
                          <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                            <a href={project.github} target="_blank" rel="noopener noreferrer">
                              <Github className="w-4 h-4 mr-2" /> View Source Code
                            </a>
                          </Button>
                        )}
                        {project.demo && (
                          <Button variant="outline" className="flex-1 border-accent text-accent hover:bg-accent" asChild>
                            <a href={project.demo} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" /> Live Demo
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
