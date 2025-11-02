import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500);
    }, 2900);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark overflow-hidden"
        >
          <div className="relative">
            {/* Graffiti spray particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-accent"
                style={{
                  left: `${50 + Math.cos((i * Math.PI * 2) / 8) * 80}%`,
                  top: `${50 + Math.sin((i * Math.PI * 2) / 8) * 80}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.5 + i * 0.1,
                  ease: 'easeOut'
                }}
              />
            ))}

            {/* SVG Crown - Graffiti Style */}
            <motion.svg
              viewBox="0 0 160 180"
              className="w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <defs>
                {/* Glow filter */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                {/* Grunge texture */}
                <filter id="grunge" x="0%" y="0%" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                </filter>

                {/* Gold gradient */}
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#FF8C00', stopOpacity: 1 }} />
                </linearGradient>

                {/* Blue gradient */}
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#4A90E2', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#2E7EBF', stopOpacity: 1 }} />
                </linearGradient>
              </defs>

              {/* Crown base - left side */}
              <motion.path
                d="M 40 140 L 50 70 L 65 140"
                stroke="url(#blueGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2, ease: 'easeInOut' }}
              />

              {/* Crown base - center */}
              <motion.path
                d="M 70 140 L 80 40 L 90 140"
                stroke="url(#goldGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4, ease: 'easeInOut' }}
              />

              {/* Crown base - right side */}
              <motion.path
                d="M 95 140 L 110 70 L 120 140"
                stroke="url(#blueGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6, ease: 'easeInOut' }}
              />

              {/* Crown bottom line */}
              <motion.path
                d="M 35 145 L 125 145"
                stroke="url(#goldGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8, ease: 'easeInOut' }}
              />

              {/* Decorative jewels */}
              <motion.circle
                cx="50"
                cy="70"
                r="4"
                fill="url(#goldGradient)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.2 }}
              />
              <motion.circle
                cx="80"
                cy="40"
                r="5"
                fill="url(#goldGradient)"
                filter="url(#glow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.3 }}
              />
              <motion.circle
                cx="110"
                cy="70"
                r="4"
                fill="url(#goldGradient)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.4 }}
              />

              {/* Fill effect - appears after stroke */}
              <motion.path
                d="M 40 140 L 50 70 L 65 140 M 70 140 L 80 40 L 90 140 M 95 140 L 110 70 L 120 140 M 35 145 L 125 145"
                stroke="none"
                fill="url(#goldGradient)"
                fillOpacity="0.15"
                filter="url(#grunge)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0.15] }}
                transition={{ duration: 0.8, delay: 1.5 }}
              />

              {/* Final glow overlay */}
              <motion.path
                d="M 40 140 L 50 70 L 65 140 M 70 140 L 80 40 L 90 140 M 95 140 L 110 70 L 120 140"
                stroke="url(#goldGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0"
                filter="url(#glow)"
                animate={{ 
                  opacity: [0, 0.6, 0.3],
                }}
                transition={{ 
                  duration: 0.8,
                  delay: 2.0,
                  ease: 'easeInOut'
                }}
              />
            </motion.svg>

            {/* Text fade in with delay */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6,
                delay: 2.3,
                ease: 'easeOut'
              }}
              className="mt-3 sm:mt-4 px-4"
            >
              <h1 className="text-xl xs:text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center tracking-wide drop-shadow-lg">
                Castle Movement
              </h1>
            </motion.div>

            {/* Accent line with graffiti style */}
            <motion.div
              className="mt-2 sm:mt-3 mx-auto h-0.5 sm:h-1 rounded-full overflow-hidden"
              style={{
                background: 'linear-gradient(90deg, transparent, #FFD700, #FFA500, transparent)',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                maxWidth: 'min(200px, 70vw)'
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              transition={{ 
                duration: 0.5,
                delay: 2.5,
                ease: 'easeOut'
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
