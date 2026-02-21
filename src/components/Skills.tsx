import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';


const skills = [
  { name: 'JavaScript/TypeScript', level: 90 },
  { name: 'React & Next.js', level: 85 },
  { name: 'Flutter', level: 83 },
  { name: 'Java', level: 75 },
  { name: 'Database Design', level: 70 },
  { name: 'Cloud Services', level: 70 },
  { name: 'Mobile Development', level: 89 },
  { name: 'UI/UX Design', level: 80 },
  { name: 'Angular', level: 80 },
];

const tools = [
  'Git', 'Docker', 'VS Code', 'Figma', 'Postman', 'AWS',
  'MongoDB', 'PostgreSQL', 'Firebase', 'Supabase', 'Vercel', 'Android Studio', 'Xcode',
  'Slack', 'Dotnet', 'SQL', 'Azure Data Studio', 'Notion'
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
            {/* Floating shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-16 h-16 sm:w-32 sm:h-32 border-2 border-accent/10 rounded-full"
                  initial={{
                    x: Math.random() * 100 + '%',
                    y: Math.random() * 100 + '%',
                    scale: Math.random() * 0.5 + 0.5
                  }}
                  animate={{
                    y: [0, -40, 0],
                    x: [0, 20, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 15 + i * 5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              ))}
            </div>
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
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{
                    scale: 1.1,
                    rotate: index % 2 === 0 ? 2 : -2,
                    boxShadow: "0 0 20px hsl(var(--accent) / 0.4)"
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 10,
                    delay: index * 0.02
                  }}
                  className="glass-card p-3 sm:p-4 rounded-xl text-center transition-all cursor-default border border-accent/10 hover:border-accent/40"
                >
                  <span className="text-xs sm:text-sm font-medium text-foreground/90 group-hover:text-foreground">{tool}</span>
                </motion.div>
              ))}
            </div>


          </motion.div>
        </div>
      </div>
    </section>
  );
};
