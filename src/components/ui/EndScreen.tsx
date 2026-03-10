// ============================================================
// EndScreen.tsx – animated win/lose overlay
// ============================================================

'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, ChevronRight } from 'lucide-react';
import type { GameState } from '@/lib/types';
import { MATCH_LENGTH } from '@/lib/constants';

interface EndScreenProps {
  state: GameState;
  onRestart: () => void;
  onNextRound: () => void;
}

export default function EndScreen({ state, onRestart, onNextRound }: EndScreenProps) {
  const isVisible = state.phase === 'ended' && state.winner !== null;
  const playerWon = state.winner === 'white';
  const matchOver =
    state.matchScore.white >= MATCH_LENGTH || state.matchScore.black >= MATCH_LENGTH;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.7)' }}
        >
          <motion.div
            initial={{ scale: 0.5, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`relative overflow-hidden max-w-sm w-full rounded-3xl border p-8 text-center font-mono ${
              playerWon
                ? 'border-cyan-400/60 bg-slate-950/95 shadow-[0_0_60px_rgba(0,255,224,0.3)]'
                : 'border-violet-500/60 bg-slate-950/95 shadow-[0_0_60px_rgba(124,58,237,0.3)]'
            }`}
          >
            {/* Glow background */}
            <div
              className={`absolute inset-0 opacity-10 ${
                playerWon ? 'bg-cyan-400' : 'bg-violet-600'
              }`}
            />

            {/* Floating particles */}
            {playerWon && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-cyan-400"
                    initial={{ x: '50%', y: '50%', opacity: 1 }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 80}%`,
                      y: `${50 + (Math.random() - 0.5) * 80}%`,
                      opacity: 0,
                      scale: [1, 2, 0],
                    }}
                    transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                  />
                ))}
              </>
            )}

            {/* Icon */}
            <motion.div
              animate={{ rotate: playerWon ? [0, -10, 10, 0] : 0 }}
              transition={{ duration: 0.5, repeat: playerWon ? Infinity : 0, repeatDelay: 2 }}
              className="text-6xl mb-4"
            >
              {playerWon ? '🏆' : '😔'}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-3xl font-black mb-2 ${
                playerWon ? 'text-cyan-300' : 'text-violet-300'
              }`}
            >
              {playerWon ? 'You Win!' : 'AI Wins!'}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 text-sm mb-1"
            >
              {playerWon
                ? 'Excellent backgammon!'
                : 'Better luck next time!'}
            </motion.p>

            {/* Match score */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="my-4 py-3 px-4 rounded-xl bg-slate-900/60 border border-slate-700/40"
            >
              <div className="text-xs text-slate-500 mb-1">Match Score</div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-cyan-400">{state.matchScore.white}</div>
                  <div className="text-xs text-slate-500">You</div>
                </div>
                <div className="text-slate-600 font-bold">—</div>
                <div className="text-center">
                  <div className="text-2xl font-black text-violet-400">{state.matchScore.black}</div>
                  <div className="text-xs text-slate-500">AI</div>
                </div>
              </div>
              {matchOver && (
                <div className={`mt-2 text-xs font-bold ${playerWon ? 'text-cyan-400' : 'text-violet-400'}`}>
                  {playerWon ? 'Match won!' : 'Match lost!'}
                </div>
              )}
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-2"
            >
              {!matchOver && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onNextRound}
                  className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 font-bold hover:bg-cyan-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-4 h-4" />
                  Next Round
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onRestart}
                className="w-full py-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-300 font-bold hover:bg-slate-700/60 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                New Match
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
