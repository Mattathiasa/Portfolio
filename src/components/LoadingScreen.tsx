import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-[hsl(var(--gradient-mid))] to-background"
    >
      <div className="text-center space-y-8 px-4">
        <h1 className="text-5xl md:text-7xl font-bold font-display gradient-text">
          Mattathias Abraham
        </h1>
        
        <div className="space-y-4 max-w-md mx-auto">
          <p className="text-foreground/80 text-lg">Loading Portfolio...</p>
          
          <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent to-[hsl(var(--accent-gradient-end))] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <div className="text-2xl font-bold text-accent">{progress}%</div>
          
          <div className="flex justify-center gap-2 mt-6">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-accent rounded-full"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
