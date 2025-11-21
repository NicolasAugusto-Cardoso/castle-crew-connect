import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';

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
            {/* Crown Icon */}
            <motion.div
              className="-mt-8 sm:-mt-12"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              <svg className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40" style={{ filter: 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 24px rgba(255, 165, 0, 0.4))' }}>
                <defs>
                  <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#FF8C00', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <Crown 
                  className="w-full h-full"
                  stroke="url(#crownGradient)"
                  strokeWidth={1.5}
                  fill="none"
                />
              </svg>
            </motion.div>

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
