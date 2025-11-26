import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashProps {
  onComplete: () => void;
}

// Subtle spray splatters
const splatters = [
  { x: '20%', y: '25%', size: 6, delay: 0.25 },
  { x: '78%', y: '30%', size: 5, delay: 0.28 },
  { x: '15%', y: '68%', size: 7, delay: 0.3 },
  { x: '82%', y: '72%', size: 4, delay: 0.26 },
];

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 200);
    }, 950);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark overflow-hidden"
          style={{ 
            isolation: 'isolate',
            willChange: 'opacity',
          }}
        >
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

          {/* Spray stroke crossing screen */}
          <motion.div
            className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
            style={{
              filter: 'blur(1px)',
              boxShadow: '0 0 10px hsl(var(--accent) / 0.3)',
            }}
            initial={{ scaleX: 0, opacity: 0, x: '-100%' }}
            animate={{ scaleX: 2, opacity: [0, 0.5, 0], x: '50%' }}
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          {/* Subtle spray splatters */}
          {splatters.map((splatter, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-accent"
              style={{
                left: splatter.x,
                top: splatter.y,
                width: splatter.size,
                height: splatter.size,
                filter: 'blur(1px)',
                boxShadow: '0 0 6px hsl(var(--accent) / 0.3)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.3, 1],
                opacity: [0, 0.6, 0.4],
              }}
              transition={{
                duration: 0.25,
                delay: splatter.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}

          {/* Main text container */}
          <motion.div
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{
              duration: 0.45,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative px-6"
          >
            {/* Golden glow behind text */}
            <motion.div
              className="absolute inset-0 blur-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0.5] }}
              transition={{
                duration: 0.7,
                delay: 0.25,
                times: [0, 0.5, 1],
                ease: "easeOut",
              }}
              style={{
                background: 'radial-gradient(circle, hsl(var(--accent) / 0.4) 0%, transparent 65%)',
              }}
            />

            {/* Minimalist text with stroke reveal */}
            <motion.div className="relative">
              <motion.h1
                className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight relative font-outfit"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '1.5px hsl(var(--accent))',
                  textShadow: '0 0 20px hsl(var(--accent) / 0.3)',
                  letterSpacing: '-0.03em',
                }}
                initial={{ clipPath: 'inset(0 100% 0 0)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                transition={{
                  duration: 0.5,
                  delay: 0.22,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                Castle
              </motion.h1>
              
              <motion.h2
                className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wide relative -mt-1 font-outfit"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '1px hsl(var(--accent))',
                  textShadow: '0 0 20px hsl(var(--accent) / 0.3)',
                  letterSpacing: '0.15em',
                }}
                initial={{ clipPath: 'inset(0 0 0 100%)' }}
                animate={{ clipPath: 'inset(0 0 0 0%)' }}
                transition={{
                  duration: 0.5,
                  delay: 0.32,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                Movement
              </motion.h2>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};