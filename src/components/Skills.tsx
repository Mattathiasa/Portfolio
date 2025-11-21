import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Award, Trophy, CheckCircle2 } from 'lucide-react';

const skills = [
  { name: 'JavaScript/TypeScript', level: 90 },
  { name: 'React & Next.js', level: 85 },
  { name: 'Node.js & Express', level: 80 },
  { name: 'Python & Django', level: 75 },
  { name: 'Database Design', level: 85 },
  { name: 'Cloud Services', level: 70 },
  { name: 'Mobile Development', level: 75 },
  { name: 'UI/UX Design', level: 80 },
];

const tools = [
  'Git', 'Docker', 'VS Code', 'Figma', 'Postman', 'AWS',
  'MongoDB', 'PostgreSQL', 'Firebase', 'Vercel', 'Jira', 'Slack'
];

const achievements = [
  {
    icon: Award,
    title: "Dean's List",
    description: 'Academic Excellence Recognition',
  },
  {
    icon: Trophy,
    title: 'Hackathon Winner',
    description: 'Best Innovation Award 2024',
  },
  {
    icon: CheckCircle2,
    title: 'AWS Certified',
    description: 'Cloud Practitioner',
  },
];

export const Skills = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="skills" ref={ref} className="min-h-screen flex items-center justify-center relative bg-gradient-to-b from-background to-[hsl(var(--gradient-mid))] py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4">Skills & Expertise</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Technologies and tools I work with
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
          {/* Technical Skills */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-4 sm:space-y-6"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Technical Skills</h3>
            {skills.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{skill.name}</span>
                  <span className="text-sm font-bold text-accent">{skill.level}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent to-[hsl(var(--accent-gradient-end))] rounded-full"
                    initial={{ width: 0 }}
                    animate={isVisible ? { width: `${skill.level}%` } : {}}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Tools & Technologies */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-4 sm:space-y-6"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Tools & Technologies</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {tools.map((tool, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="glass-card p-3 sm:p-4 rounded-lg text-center transition-smooth hover:scale-105 hover:glow-accent"
                >
                  <span className="text-xs sm:text-sm font-medium text-foreground">{tool}</span>
                </motion.div>
              ))}
            </div>

            {/* Achievements */}
            <div className="pt-6 sm:pt-8">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Achievements</h3>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isVisible ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="glass-card p-3 sm:p-4 rounded-lg flex items-center gap-3 sm:gap-4 transition-smooth hover:glow-accent"
                  >
                    <achievement.icon className="w-8 h-8 sm:w-10 sm:h-10 text-accent flex-shrink-0" />
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-foreground">{achievement.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
