import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';

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

// Floating golden particles around crown
const particles = [
  { x: -70, y: -45, size: 3, delay: 0.3, duration: 2.8 },
  { x: 65, y: -50, size: 2, delay: 0.5, duration: 3.2 },
  { x: -55, y: -20, size: 4, delay: 0.4, duration: 2.5 },
  { x: 60, y: -15, size: 2.5, delay: 0.6, duration: 3 },
  { x: -80, y: 10, size: 3, delay: 0.35, duration: 2.9 },
  { x: 75, y: 15, size: 2, delay: 0.55, duration: 3.1 },
  { x: -50, y: 35, size: 3.5, delay: 0.45, duration: 2.7 },
  { x: 55, y: 40, size: 2.5, delay: 0.5, duration: 2.8 },
  { x: -35, y: -60, size: 2, delay: 0.4, duration: 3.3 },
  { x: 40, y: -55, size: 3, delay: 0.35, duration: 2.6 },
  { x: 0, y: -70, size: 2.5, delay: 0.5, duration: 3 },
  { x: -10, y: 50, size: 3, delay: 0.6, duration: 2.9 },
];

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
            {/* Golden glow behind text - Responsivo e sutil */}
            <motion.div
              className="absolute inset-0 blur-2xl md:blur-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0.4] }}
              transition={{
                duration: 0.7,
                delay: 0.25,
                times: [0, 0.5, 1],
                ease: "easeOut",
              }}
              style={{
                background: 'radial-gradient(circle, hsl(var(--accent) / 0.5) 0%, transparent 70%)',
              }}
            />
            
            {/* Extra glow - mais intenso no desktop */}
            <motion.div
              className="absolute inset-0 blur-xl md:blur-2xl opacity-0 md:opacity-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0.5] }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                times: [0, 0.5, 1],
                ease: "easeOut",
              }}
              style={{
                background: 'radial-gradient(circle, hsl(var(--accent) / 0.6) 0%, transparent 50%)',
              }}
            />

            {/* Minimalist text with crown */}
            <motion.div className="relative flex flex-col items-center justify-center">
              {/* Crown icon */}
              <motion.div
                className="mb-4 relative flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Floating golden particles around crown */}
                {particles.map((particle, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-accent"
                    style={{
                      left: `calc(50% + ${particle.x}px)`,
                      top: `calc(50% + ${particle.y}px)`,
                      width: particle.size,
                      height: particle.size,
                      filter: 'blur(0.5px)',
                      boxShadow: '0 0 4px hsl(var(--accent) / 0.4)',
                    }}
                    initial={{ opacity: 0, y: 0, x: 0 }}
                    animate={{ 
                      opacity: [0, 0.5, 0.3, 0.5, 0],
                      y: [0, -15, -10, -20, 0],
                      x: [0, 3, -2, 4, 0],
                    }}
                    transition={{
                      duration: particle.duration,
                      delay: particle.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                {/* Outer glow layer - sutil no mobile, mais visível no desktop */}
                <motion.div
                  className="absolute inset-0 blur-2xl md:blur-3xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0.5] }}
                  transition={{
                    duration: 0.8,
                    delay: 0.1,
                    times: [0, 0.5, 1],
                    ease: "easeOut",
                  }}
                >
                  <Crown 
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 text-accent"
                    strokeWidth={1}
                  />
                </motion.div>
                
                {/* Middle glow layer - apenas desktop */}
                <motion.div
                  className="absolute inset-0 blur-xl opacity-0 md:opacity-100"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0.4] }}
                  transition={{
                    duration: 0.8,
                    delay: 0.15,
                    times: [0, 0.5, 1],
                    ease: "easeOut",
                  }}
                >
                  <Crown 
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 text-accent"
                    strokeWidth={1}
                  />
                </motion.div>
                
                {/* Main crown - drop shadow clean */}
                <Crown 
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 text-accent relative z-10"
                  strokeWidth={1}
                  style={{
                    filter: 'drop-shadow(0 0 12px hsl(var(--accent) / 0.5)) drop-shadow(0 0 24px hsl(var(--accent) / 0.3))',
                  }}
                />
              </motion.div>

              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight relative font-outfit whitespace-nowrap text-center"
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
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
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-wide relative -mt-1 font-outfit whitespace-nowrap text-center"
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
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