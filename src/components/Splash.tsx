import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

// Particle positions around the crown (polar coordinates)
const particlePositions = [
  { angle: 0, distance: 60 },
  { angle: 45, distance: 55 },
  { angle: 90, distance: 65 },
  { angle: 135, distance: 58 },
  { angle: 180, distance: 62 },
  { angle: 225, distance: 56 },
  { angle: 270, distance: 64 },
  { angle: 315, distance: 59 },
];

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 200);
    }, 700);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
          style={{ 
            isolation: 'isolate',
            willChange: 'opacity'
          }}
        >
          {/* Animated circle stroke */}
          <motion.svg
            className="absolute w-48 h-48 sm:w-56 sm:h-56"
            viewBox="0 0 100 100"
            initial={{ rotate: 0, opacity: 0 }}
            animate={{ rotate: 180, opacity: 0.3 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="0.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
            />
          </motion.svg>

          {/* Particles */}
          <div className="absolute">
            {particlePositions.map((pos, i) => {
              const x = Math.cos((pos.angle * Math.PI) / 180) * pos.distance;
              const y = Math.sin((pos.angle * Math.PI) / 180) * pos.distance;
              
              return (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-accent"
                  style={{
                    left: '50%',
                    top: '50%',
                    boxShadow: '0 0 8px hsl(var(--accent))',
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    x: x,
                    y: y,
                    scale: [0, 1.5, 0.8],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: 0.7,
                    delay: i * 0.05,
                    times: [0, 0.5, 1],
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              );
            })}
          </div>

          {/* Crown logo with glow */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="relative"
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.4] }}
              transition={{
                duration: 0.7,
                times: [0, 0.5, 1],
                ease: "easeInOut"
              }}
            >
              <Crown 
                className="w-20 h-20 sm:w-24 sm:h-24 text-accent"
                strokeWidth={2}
              />
            </motion.div>

            {/* Main icon */}
            <Crown 
              className="w-20 h-20 sm:w-24 sm:h-24 text-accent relative z-10"
              strokeWidth={1.5}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};