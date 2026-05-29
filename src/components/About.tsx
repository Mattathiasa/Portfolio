import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  Code, Smartphone, Video, Users, Globe, Database, Cpu, Zap,
  Brain, Trophy, Camera, Music, BookOpen, Wrench, Shield, Rocket,
  Star, Heart, Briefcase, Terminal, Layers, Monitor, Server, type LucideProps,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import workspaceImage from '@/assets/workspace.jpg';
import { useQuery } from '@tanstack/react-query';
import { getContent, getHighlights } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { DEFAULT_CONTENT, DEFAULT_HIGHLIGHTS } from '@/data/defaults';
import type { FC } from 'react';

const ICON_MAP: Record<string, FC<LucideProps>> = {
  Code, Smartphone, Video, Users, Globe, Database, Cpu, Zap,
  Brain, Trophy, Camera, Music, BookOpen, Wrench, Shield, Rocket,
  Star, Heart, Briefcase, Terminal, Layers, Monitor, Server,
};

export const About = () => {
  const { ref, isVisible } = useScrollAnimation();

  const { data: content } = useQuery({
    queryKey: ['content'],
    queryFn: getContent,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: firestoreHighlights } = useQuery({
    queryKey: ['highlights'],
    queryFn: getHighlights,
    enabled: isFirebaseConfigured,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const aboutHeading = content?.aboutHeading ?? DEFAULT_CONTENT.aboutHeading;
  const aboutBody1   = content?.aboutBody1   ?? DEFAULT_CONTENT.aboutBody1;
  const aboutBody2   = content?.aboutBody2   ?? DEFAULT_CONTENT.aboutBody2;
  const aboutImage   = content?.aboutImage   || workspaceImage;
  const highlights   = firestoreHighlights ?? DEFAULT_HIGHLIGHTS;

  return (
    <section id="about" ref={ref} className="min-h-screen flex items-center justify-center relative py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4">About Me</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Passionate about technology and creative storytelling.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50">
              <img
                src={aboutImage}
                alt="Mattathias Abraham's workspace"
                className="w-full h-auto object-cover transition-smooth hover:scale-105"
                style={{ background: 'transparent' }}
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-4 sm:space-y-6"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              {aboutHeading}
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {aboutBody1}
            </p>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {aboutBody2}
            </p>
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 transition-smooth"
              asChild
            >
              <a href="#contact">Let's Work Together</a>
            </Button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mb-8"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass-card p-4 sm:p-5 rounded-xl text-center transition-smooth hover:scale-105"
            >
              <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">{stat.number}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div> */}

        {/* Highlights */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {highlights.map((item, index) => {
            const IconComponent = ICON_MAP[item.icon] ?? Code;
            return (
              <motion.div
                key={item.id ?? index}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -10, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
                className="glass-card p-4 sm:p-6 rounded-2xl border border-accent/10 transition-all hover:border-accent/30 hover:glow-accent group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12 group-hover:bg-accent/10 transition-colors" />
                <IconComponent className="w-10 h-10 sm:w-12 sm:h-12 text-accent mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h4 className="text-base sm:text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors">{item.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">{item.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
