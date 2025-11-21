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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark overflow-hidden"
        >
          <div className="relative flex flex-col items-center justify-center">
            {/* Graffiti spray particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-accent"
                style={{
                  left: `calc(50% + ${Math.cos((i * Math.PI * 2) / 8) * 80}px)`,
                  top: `calc(50% + ${Math.sin((i * Math.PI * 2) / 8) * 80}px)`,
                  transform: 'translate(-50%, -50%)'
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

            {/* SVG Crown - Minimalist Design */}
            <motion.svg
              viewBox="0 0 200 200"
              className="w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 relative z-10 mx-auto"
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

              {/* Base curva */}
              <motion.path
                d="M 50 150 Q 100 145 150 150"
                stroke="url(#goldGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeInOut' }}
              />

              {/* Pico 1 - Externo Esquerdo (pequeno) */}
              <motion.path
                d="M 60 150 L 60 100"
                stroke="url(#goldGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4, ease: 'easeInOut' }}
              />

              {/* Pico 2 - Interno Esquerdo (médio) */}
              <motion.path
                d="M 80 150 L 80 80"
                stroke="url(#blueGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6, ease: 'easeInOut' }}
              />

              {/* Pico 3 - Central (grande) */}
              <motion.path
                d="M 100 150 L 100 60"
                stroke="url(#goldGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8, ease: 'easeInOut' }}
              />

              {/* Pico 4 - Interno Direito (médio) */}
              <motion.path
                d="M 120 150 L 120 80"
                stroke="url(#blueGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.0, ease: 'easeInOut' }}
              />

              {/* Pico 5 - Externo Direito (pequeno) */}
              <motion.path
                d="M 140 150 L 140 100"
                stroke="url(#goldGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.2, ease: 'easeInOut' }}
              />

              {/* Joia esquerda */}
              <motion.circle
                cx="80"
                cy="80"
                r="5"
                fill="url(#goldGradient)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.4 }}
              />

              {/* Joia central - com brilho */}
              <motion.circle
                cx="100"
                cy="60"
                r="6"
                fill="url(#goldGradient)"
                filter="url(#glow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.5 }}
              />

              {/* Joia direita */}
              <motion.circle
                cx="120"
                cy="80"
                r="5"
                fill="url(#goldGradient)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.6 }}
              />

              {/* Brilho final sutil em toda a coroa */}
              <motion.g
                opacity="0"
                animate={{ 
                  opacity: [0, 0.4, 0.2],
                }}
                transition={{ 
                  duration: 0.8,
                  delay: 1.8,
                  ease: 'easeInOut'
                }}
              >
                <path
                  d="M 50 150 Q 100 145 150 150"
                  stroke="url(#goldGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#glow)"
                />
                <path
                  d="M 60 150 L 60 100 M 80 150 L 80 80 M 100 150 L 100 60 M 120 150 L 120 80 M 140 150 L 140 100"
                  stroke="url(#goldGradient)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#glow)"
                />
              </motion.g>
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
              className="mt-3 sm:mt-4 px-4 mx-auto max-w-full"
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
                width: '200px',
                maxWidth: '70vw'
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
