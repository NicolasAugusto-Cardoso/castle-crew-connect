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
              viewBox="0 0 200 200"
              className="w-48 h-48 md:w-56 md:h-56 relative z-10"
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
                d="M 60 120 L 70 80 L 80 120"
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
                d="M 85 120 L 100 60 L 115 120"
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
                d="M 120 120 L 130 80 L 140 120"
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
                d="M 55 125 L 145 125"
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
                cx="70"
                cy="80"
                r="4"
                fill="url(#goldGradient)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.2 }}
              />
              <motion.circle
                cx="100"
                cy="60"
                r="5"
                fill="url(#goldGradient)"
                filter="url(#glow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.3 }}
              />
              <motion.circle
                cx="130"
                cy="80"
                r="4"
                fill="url(#goldGradient)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.4 }}
              />

              {/* Fill effect - appears after stroke */}
              <motion.path
                d="M 60 120 L 70 80 L 80 120 M 85 120 L 100 60 L 115 120 M 120 120 L 130 80 L 140 120 M 55 125 L 145 125"
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
                d="M 60 120 L 70 80 L 80 120 M 85 120 L 100 60 L 115 120 M 120 120 L 130 80 L 140 120"
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
              className="mt-4"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-white text-center tracking-wide drop-shadow-lg">
                Castle Movement
              </h1>
            </motion.div>

            {/* Accent line with graffiti style */}
            <motion.div
              className="mt-3 mx-auto h-1 rounded-full overflow-hidden"
              style={{
                background: 'linear-gradient(90deg, transparent, #FFD700, #FFA500, transparent)',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '200px', opacity: 1 }}
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
