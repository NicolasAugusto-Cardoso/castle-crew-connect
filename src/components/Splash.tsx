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
      setTimeout(onComplete, 200);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ 
            opacity: 1,
            scale: [1, 1.02, 1],
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            opacity: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
            scale: { 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark overflow-hidden"
          style={{ 
            isolation: 'isolate',
            willChange: 'opacity, transform',
          }}
        >
          {/* Subtle animated overlay for depth */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0.1, 0.15] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background: 'radial-gradient(circle at 50% 50%, hsl(var(--accent) / 0.08) 0%, transparent 60%)',
            }}
          />

          {/* Very subtle texture overlay */}
          <motion.div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.015 }}
            transition={{ duration: 0.2 }}
          />

          {/* Main text container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex flex-col items-center justify-center"
          >
            {/* Golden glow behind text */}
            <motion.div
              className="absolute inset-0 blur-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.25, 0.3] }}
              transition={{
                duration: 0.7,
                delay: 0.2,
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
                    initial={{ opacity: 0, y: 10, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.08 + i * 0.05,
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
                    initial={{ opacity: 0, y: 10, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.38 + i * 0.04,
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