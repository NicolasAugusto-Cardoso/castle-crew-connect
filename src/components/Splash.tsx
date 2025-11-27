import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 150);
    }, 1850);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.15,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark overflow-hidden"
          style={{ 
            isolation: 'isolate',
            willChange: 'opacity, transform',
          }}
        >
          {/* Soft glow effect 1 - top left */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.02, 0.03, 0.01, 0],
              scale: [1, 1.1, 1.05, 1.15, 1],
              x: [0, 20, -10, 30, 0],
              y: [0, -15, 25, -20, 0]
            }}
            transition={{
              duration: 1.8,
              ease: "easeInOut",
            }}
            style={{
              background: 'radial-gradient(circle at 20% 30%, hsl(var(--accent) / 0.15) 0%, transparent 50%)',
            }}
          />

          {/* Soft glow effect 2 - bottom right */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.03, 0.02, 0.03, 0],
              scale: [1, 1.15, 1.05, 1.2, 1],
              x: [0, -25, 15, -30, 0],
              y: [0, 20, -15, 25, 0]
            }}
            transition={{
              duration: 1.8,
              delay: 0.2,
              ease: "easeInOut",
            }}
            style={{
              background: 'radial-gradient(circle at 80% 70%, hsl(var(--accent) / 0.12) 0%, transparent 50%)',
            }}
          />

          {/* Light flash effect - center */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.015, 0.025, 0.01, 0],
            }}
            transition={{
              duration: 1.6,
              delay: 0.4,
              ease: "easeInOut",
            }}
            style={{
              background: 'radial-gradient(circle at 50% 50%, hsl(var(--accent) / 0.2) 0%, transparent 60%)',
            }}
          />

          {/* Luminous point 1 */}
          <motion.div
            className="absolute w-32 h-32 rounded-full blur-2xl"
            initial={{ opacity: 0, x: '20vw', y: '30vh' }}
            animate={{ 
              opacity: [0, 0.02, 0.01, 0],
              x: ['20vw', '25vw', '18vw'],
              y: ['30vh', '35vh', '28vh'],
            }}
            transition={{
              duration: 1.7,
              ease: "easeInOut",
            }}
            style={{
              background: 'hsl(var(--accent) / 0.1)',
            }}
          />

          {/* Luminous point 2 */}
          <motion.div
            className="absolute w-24 h-24 rounded-full blur-xl"
            initial={{ opacity: 0, x: '70vw', y: '60vh' }}
            animate={{ 
              opacity: [0, 0.025, 0.015, 0],
              x: ['70vw', '75vw', '68vw'],
              y: ['60vh', '55vh', '62vh'],
            }}
            transition={{
              duration: 1.8,
              delay: 0.3,
              ease: "easeInOut",
            }}
            style={{
              background: 'hsl(var(--accent) / 0.12)',
            }}
          />

          {/* Floating particles */}
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              initial={{ 
                opacity: 0,
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
              }}
              animate={{ 
                opacity: [0, 0.5 + Math.random() * 0.3, 0.4 + Math.random() * 0.2, 0],
                x: [
                  `${Math.random() * 100}vw`,
                  `${Math.random() * 100}vw`,
                  `${Math.random() * 100}vw`,
                ],
                y: [
                  `${Math.random() * 100}vh`,
                  `${Math.random() * 100}vh`,
                  `${Math.random() * 100}vh`,
                ],
              }}
              transition={{
                duration: 1.5 + Math.random() * 0.5,
                delay: Math.random() * 0.3,
                ease: "easeInOut",
              }}
              style={{
                width: `${4 + Math.random() * 5}px`,
                height: `${4 + Math.random() * 5}px`,
                background: 'hsl(var(--accent) / 1)',
                boxShadow: '0 0 8px hsl(var(--accent) / 0.6), 0 0 16px hsl(var(--accent) / 0.3)',
              }}
            />
          ))}

          {/* Cinematic grain overlay */}
          <motion.div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: '180px 180px',
              mixBlendMode: 'overlay',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.06 }}
            transition={{ duration: 0.2 }}
          />

          {/* Main text container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex flex-col items-center justify-center"
          >
            {/* Golden glow behind text */}
            <motion.div
              className="absolute inset-0 blur-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0.35] }}
              transition={{
                duration: 0.6,
                times: [0, 0.5, 1],
                ease: "easeOut",
              }}
              style={{
                background: 'radial-gradient(circle, hsl(var(--accent) / 0.4) 0%, transparent 70%)',
              }}
            />

            {/* Text content */}
            <motion.div className="relative flex flex-col items-center justify-center px-4">

              <h1
                className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold tracking-tight relative font-outfit whitespace-nowrap text-center"
                style={{
                  color: 'hsl(var(--accent))',
                  WebkitTextStroke: '1px hsl(var(--accent))',
                  textShadow: '0 0 12px hsl(var(--accent) / 0.3), 0 0 24px hsl(var(--accent) / 0.2)',
                  letterSpacing: '-0.03em',
                }}
              >
                {'Castle'.split('').map((letter, i) => (
                  <motion.span
                    key={`castle-${i}`}
                    initial={{ opacity: 0, y: 8, scale: 0.75 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.05 + i * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ display: 'inline-block' }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </h1>
              
              <h2
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-wide relative mt-2 font-outfit whitespace-nowrap text-center"
                style={{
                  color: 'hsl(var(--accent))',
                  WebkitTextStroke: '0.5px hsl(var(--accent))',
                  textShadow: '0 0 12px hsl(var(--accent) / 0.3), 0 0 24px hsl(var(--accent) / 0.2)',
                  letterSpacing: '0.15em',
                }}
              >
                {'Movement'.split('').map((letter, i) => (
                  <motion.span
                    key={`movement-${i}`}
                    initial={{ opacity: 0, y: 8, scale: 0.75 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.32 + i * 0.035,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ display: 'inline-block' }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </h2>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};