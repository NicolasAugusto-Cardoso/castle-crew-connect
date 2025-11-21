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
            {/* Minimalist Crown Icon */}
            <motion.svg
              viewBox="0 0 640 480"
              className="w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 relative z-10 mx-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              {/* Main crown silhouette */}
              <path
                d="M 110 380 L 110 420 L 530 420 L 530 380 M 120 410 L 520 410 L 480 280 L 480 200 Q 480 180 460 180 L 420 180 Q 410 180 400 200 Q 370 260 320 260 Q 270 260 240 200 Q 230 180 220 180 L 180 180 Q 160 180 160 200 L 160 280 L 120 410 Z"
                stroke="#F4B63A"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Base bar */}
              <rect
                x="115"
                y="425"
                width="410"
                height="30"
                rx="5"
                stroke="#F4B63A"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
              />

              {/* Ornament circles */}
              <circle cx="65" cy="200" r="35" stroke="#F4B63A" strokeWidth="10" fill="none" />
              <circle cx="320" cy="85" r="40" stroke="#F4B63A" strokeWidth="10" fill="none" />
              <circle cx="575" cy="200" r="35" stroke="#F4B63A" strokeWidth="10" fill="none" />
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
