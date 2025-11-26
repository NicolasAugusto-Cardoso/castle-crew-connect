import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashProps {
  onComplete: () => void;
}

// Spray splatter positions
const splatters = [
  { x: '25%', y: '30%', size: 8, delay: 0.3 },
  { x: '75%', y: '35%', size: 6, delay: 0.35 },
  { x: '15%', y: '65%', size: 10, delay: 0.4 },
  { x: '80%', y: '70%', size: 7, delay: 0.32 },
  { x: '45%', y: '25%', size: 5, delay: 0.38 },
  { x: '60%', y: '75%', size: 9, delay: 0.36 },
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
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ 
            isolation: 'isolate',
            willChange: 'opacity',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
          }}
        >
          {/* Concrete texture overlay */}
          <motion.div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: '150px 150px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.03 }}
            transition={{ duration: 0.3 }}
          />

          {/* Spray stroke entering */}
          <motion.div
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent"
            style={{
              transformOrigin: 'left center',
              filter: 'blur(1px)',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1.5, opacity: [0, 0.6, 0] }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          {/* Spray splatters */}
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
                boxShadow: '0 0 8px hsl(var(--accent) / 0.4)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.2, 1],
                opacity: [0, 0.7, 0.5],
              }}
              transition={{
                duration: 0.3,
                delay: splatter.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}

          {/* Graffiti-style text container */}
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative"
          >
            {/* Golden glow behind text */}
            <motion.div
              className="absolute inset-0 blur-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0.6] }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                times: [0, 0.6, 1],
                ease: "easeOut",
              }}
              style={{
                background: 'radial-gradient(circle, hsl(var(--accent) / 0.5) 0%, transparent 70%)',
              }}
            />

            {/* Main text with stroke reveal */}
            <motion.div className="relative px-8">
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-transparent relative"
                style={{
                  WebkitTextStroke: '2px hsl(var(--accent))',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.3), 0 0 20px hsl(var(--accent) / 0.5)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                }}
                initial={{ clipPath: 'inset(0 100% 0 0)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                transition={{
                  duration: 0.6,
                  delay: 0.25,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                Castle
              </motion.h1>
              
              <motion.h2
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent relative -mt-2"
                style={{
                  WebkitTextStroke: '2px hsl(var(--accent))',
                  textShadow: '3px 3px 0px rgba(0,0,0,0.3), 0 0 20px hsl(var(--accent) / 0.5)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
                initial={{ clipPath: 'inset(0 0 0 100%)' }}
                animate={{ clipPath: 'inset(0 0 0 0%)' }}
                transition={{
                  duration: 0.6,
                  delay: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                Movement
              </motion.h2>
            </motion.div>

            {/* Drip effects */}
            <motion.div
              className="absolute bottom-0 left-1/4 w-1 bg-accent"
              style={{
                height: '20px',
                filter: 'blur(0.5px)',
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 0.6 }}
              transition={{
                duration: 0.4,
                delay: 0.6,
                ease: "easeOut",
              }}
            />
            <motion.div
              className="absolute bottom-0 right-1/3 w-1 bg-accent"
              style={{
                height: '15px',
                filter: 'blur(0.5px)',
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 0.5 }}
              transition={{
                duration: 0.4,
                delay: 0.65,
                ease: "easeOut",
              }}
            />

            {/* Small accent marks */}
            <motion.div
              className="absolute -top-4 left-0 w-8 h-0.5 bg-accent rotate-45"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.7 }}
              transition={{ duration: 0.2, delay: 0.5 }}
            />
            <motion.div
              className="absolute -bottom-4 right-0 w-10 h-0.5 bg-accent -rotate-45"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.7 }}
              transition={{ duration: 0.2, delay: 0.55 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};