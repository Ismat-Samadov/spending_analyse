// ============================================================
// PauseMenu.tsx – pause overlay
// ============================================================

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RefreshCw } from 'lucide-react';
import type { GameState, Difficulty } from '@/lib/types';
import DifficultySelect from './DifficultySelect';

interface PauseMenuProps {
  state: GameState;
  onResume: () => void;
  onNewGame: (difficulty: Difficulty) => void;
}

export default function PauseMenu({ state, onResume, onNewGame }: PauseMenuProps) {
  const [selectedDiff, setSelectedDiff] = React.useState<Difficulty>(state.difficulty);

  return (
    <AnimatePresence>
      {state.phase === 'paused' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="max-w-xs w-full rounded-3xl border border-slate-700/60 bg-slate-950/95 p-8 text-center font-mono shadow-2xl"
          >
            <div className="text-4xl mb-4">⏸</div>
            <h2 className="text-2xl font-black text-slate-200 mb-1">Paused</h2>
            <p className="text-slate-500 text-xs mb-6">Press P to resume</p>

            {/* Difficulty selector */}
            <div className="mb-4 text-left">
              <div className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">
                Difficulty (new game)
              </div>
              <DifficultySelect value={selectedDiff} onChange={setSelectedDiff} />
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onResume}
                className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 font-bold hover:bg-cyan-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNewGame(selectedDiff)}
                className="w-full py-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-300 font-bold hover:bg-slate-700/60 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                New Game
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
