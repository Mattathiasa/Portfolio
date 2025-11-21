import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Code, Smartphone, Video, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import workspaceImage from '@/assets/workspace.jpg';

const stats = [
  { number: '2+', label: 'Years Experience' },
  { number: '15+', label: 'Projects' },
  { number: '10+', label: 'Technologies' },
  { number: '100%', label: 'Dedication' },
];

const highlights = [
  {
    icon: Code,
    title: 'Full-Stack Development',
    description: 'Building scalable web applications with modern technologies',
  },
  {
    icon: Smartphone,
    title: 'Mobile Development',
    description: 'Creating responsive and intuitive mobile experiences',
  },
  {
    icon: Video,
    title: 'Football Content',
    description: 'Producing engaging football analysis and highlights videos',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Working effectively in agile development teams',
  },
];

export const About = () => {
  const { ref, isVisible } = useScrollAnimation();

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
            Passionate about technology and creative storytelling
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
            <div className="relative rounded-2xl overflow-hidden shadow-elegant glow-accent">
              <img
                src={workspaceImage}
                alt="Mattathias Abraham's workspace"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
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
              Recent Graduate with a Passion for Innovation
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              I'm a recent Software Engineering graduate from Addis Ababa, with a strong passion
              for building innovative applications that solve real-world problems. My journey in tech
              is complemented by my creative side - I love making football videos, combining my
              technical skills with storytelling and video editing.
            </p>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Whether it's developing full-stack applications, creating mobile experiences, or
              producing engaging football content, I bring dedication and creativity to everything
              I do. I'm always excited to learn new technologies and take on challenging projects.
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass-card p-4 sm:p-6 rounded-xl text-center transition-smooth hover:scale-105"
            >
              <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">{stat.number}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {highlights.map((item, index) => (
            <div
              key={index}
              className="glass-card p-4 sm:p-6 rounded-xl transition-smooth hover:scale-105 hover:glow-accent"
            >
              <item.icon className="w-10 h-10 sm:w-12 sm:h-12 text-accent mb-3 sm:mb-4" />
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">{item.title}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
