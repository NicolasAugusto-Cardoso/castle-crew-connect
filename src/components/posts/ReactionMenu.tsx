import { motion, AnimatePresence } from 'framer-motion';
import { EmojiType } from '@/hooks/usePosts';

interface ReactionMenuProps {
  isOpen: boolean;
  onSelect: (emoji: EmojiType) => void;
  position: { x: number; y: number };
}

const REACTIONS = [
  { type: 'heart' as EmojiType, emoji: '❤️', label: 'Coração' },
  { type: 'fire' as EmojiType, emoji: '🔥', label: 'Fogo' },
  { type: 'hands' as EmojiType, emoji: '🙌', label: 'Amém' }
];

export function ReactionMenu({ isOpen, onSelect, position }: ReactionMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed z-50 bg-card border border-border rounded-full shadow-2xl px-2 py-2"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex items-center gap-1">
            {REACTIONS.map((reaction) => (
              <motion.button
                key={reaction.type}
                onClick={() => onSelect(reaction.type)}
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={reaction.label}
              >
                <span className="text-2xl">{reaction.emoji}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
