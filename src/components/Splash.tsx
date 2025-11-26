import React, { useEffect, useState } from 'react';
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
      setTimeout(onComplete, 200);
    }, 700);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
          style={{ 
            isolation: 'isolate',
            willChange: 'opacity'
          }}
        >
          {/* Animated circle stroke */}
          <motion.svg
            className="absolute w-48 h-48 sm:w-56 sm:h-56"
            viewBox="0 0 100 100"
            initial={{ rotate: 0, opacity: 0 }}
            animate={{ rotate: 180, opacity: 0.3 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="0.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
            />
          </motion.svg>

          {/* Crown logo with glow */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="relative"
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.4] }}
              transition={{
                duration: 0.7,
                times: [0, 0.5, 1],
                ease: "easeInOut"
              }}
            >
              <Crown 
                className="w-20 h-20 sm:w-24 sm:h-24 text-accent"
                strokeWidth={2}
              />
            </motion.div>

            {/* Main icon */}
            <Crown 
              className="w-20 h-20 sm:w-24 sm:h-24 text-accent relative z-10"
              strokeWidth={1.5}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};