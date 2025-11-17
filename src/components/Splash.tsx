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
    }, 1800);

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

            {/* SVG Crown - Clean Gold Style */}
            <motion.svg
              viewBox="0 0 512 384"
              className="w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 relative z-10 mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              role="img"
              aria-label="Coroa Castle Movement"
            >
              <defs>
                {/* Glow MUITO sutil (opcional) */}
                <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* COR PRINCIPAL */}
              <motion.g
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 1 },
                  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
                }}
                fill="#F4B63A"
              >
                {/* Silhueta principal da coroa (forma cheia, topo curvo) */}
                <motion.path
                  d="
                    M 56 264
                    L 96 96
                    Q 176 160 256 160
                    Q 336 160 416 96
                    L 456 264
                    Z
                  "
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.38, ease: 'easeInOut' }}
                />

                {/* Base retangular */}
                <motion.rect
                  x="96" y="264" width="320" height="36" rx="2"
                  initial={{ opacity: 0, scaleY: 0.9 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                />

                {/* Barra inferior (pequena) – pode ser trapézio se preferir */}
                <motion.path
                  d="M 128 310 L 384 310 L 376 330 L 136 330 Z"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.22, ease: 'easeOut', delay: 0.1 }}
                />

                {/* Esferas das pontas (esq, centro, dir) */}
                <motion.circle
                  cx="72" cy="120" r="24"
                  filter="url(#softGlow)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.45 }}
                />
                <motion.circle
                  cx="256" cy="88" r="26"
                  filter="url(#softGlow)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.55 }}
                />
                <motion.circle
                  cx="440" cy="120" r="24"
                  filter="url(#softGlow)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.65 }}
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
