import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import castleLogo from '@/assets/castle-logo.png';

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 400);
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-background overflow-hidden"
        >
          <div className="relative">
            {/* Animated glow effect */}
            <motion.div
              className="absolute inset-0 -inset-12"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="w-full h-full rounded-full bg-accent/30 blur-3xl" />
            </motion.div>

            {/* Crown/Logo with rise animation */}
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.7 }}
              animate={{ 
                y: [40, -8, 0],
                opacity: [0, 1, 1],
                scale: [0.7, 1.08, 1]
              }}
              transition={{
                duration: 1,
                times: [0, 0.6, 1],
                ease: [0.34, 1.56, 0.64, 1]
              }}
              className="relative z-10"
            >
              <img
                src={castleLogo}
                alt="Castle Movement"
                className="w-40 h-40 mx-auto drop-shadow-2xl"
              />
            </motion.div>

            {/* Text fade in with delay */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6,
                delay: 0.8,
                ease: 'easeOut'
              }}
              className="mt-6"
            >
              <h1 className="text-2xl font-bold gradient-text text-center tracking-wide">
                Castle Movement
              </h1>
            </motion.div>

            {/* Accent line */}
            <motion.div
              className="mt-4 mx-auto h-1 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '180px', opacity: 1 }}
              transition={{ 
                duration: 0.8,
                delay: 1.2,
                ease: 'easeOut'
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
