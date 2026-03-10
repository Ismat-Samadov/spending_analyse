// ============================================================
// ScorePanel.tsx – match score + player info display
// ============================================================

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { MATCH_LENGTH } from '@/lib/constants';

interface ScorePanelProps {
  state: GameState;
}

function PipBar({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-sm border transition-all duration-300 ${
            i < filled ? color : 'border-slate-700 bg-transparent'
          }`}
        />
      ))}
    </div>
  );
}

export default function ScorePanel({ state }: ScorePanelProps) {
  const isWhiteTurn = state.currentPlayer === 'white';
  const isBlackTurn = state.currentPlayer === 'black';

  return (
    <div className="flex flex-col gap-3 w-full font-mono">
      {/* Black (AI) panel */}
      <motion.div
        animate={{
          boxShadow: isBlackTurn && state.phase === 'playing'
            ? '0 0 16px rgba(124,58,237,0.5)'
            : '0 0 0px transparent',
        }}
        transition={{ duration: 0.3 }}
        className={`p-3 rounded-xl border transition-all duration-300 ${
          isBlackTurn && state.phase === 'playing'
            ? 'border-violet-500/60 bg-violet-950/30'
            : 'border-slate-700/40 bg-slate-900/30'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Checker icon */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-900 to-black border border-violet-500/60 shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
            <span className="text-sm font-bold text-violet-300">
              AI
              {isBlackTurn && state.phase === 'playing' && (
                <span className="ml-2 text-xs text-violet-400 animate-pulse">▶ thinking...</span>
              )}
            </span>
          </div>
          <span className="text-lg font-bold text-violet-400">
            {state.matchScore.black}
            <span className="text-xs text-slate-500">/{MATCH_LENGTH}</span>
          </span>
        </div>
        <PipBar
          filled={state.matchScore.black}
          total={MATCH_LENGTH}
          color="border-violet-500 bg-violet-600"
        />
        <div className="mt-1.5 text-xs text-slate-500">
          Borne off:{' '}
          <span className="text-violet-400">{state.borneOff.black}</span>
          {state.bar.black > 0 && (
            <span className="ml-2 text-amber-400">Bar: {state.bar.black}</span>
          )}
          <span className="ml-2">Difficulty: </span>
          <span className="text-violet-300 capitalize">{state.difficulty}</span>
        </div>
      </motion.div>

      {/* VS divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-slate-700/50" />
        <span className="text-slate-600 text-xs font-bold">VS</span>
        <div className="flex-1 h-px bg-slate-700/50" />
      </div>

      {/* White (Player) panel */}
      <motion.div
        animate={{
          boxShadow: isWhiteTurn && state.phase === 'playing'
            ? '0 0 16px rgba(0,255,224,0.4)'
            : '0 0 0px transparent',
        }}
        transition={{ duration: 0.3 }}
        className={`p-3 rounded-xl border transition-all duration-300 ${
          isWhiteTurn && state.phase === 'playing'
            ? 'border-cyan-500/60 bg-cyan-950/20'
            : 'border-slate-700/40 bg-slate-900/30'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-white to-cyan-200 border border-cyan-400/60 shadow-[0_0_8px_rgba(0,255,224,0.5)]" />
            <span className="text-sm font-bold text-cyan-300">
              You
              {isWhiteTurn && state.phase === 'playing' && (
                <span className="ml-2 text-xs text-cyan-400">▶ your turn</span>
              )}
            </span>
          </div>
          <span className="text-lg font-bold text-cyan-400">
            {state.matchScore.white}
            <span className="text-xs text-slate-500">/{MATCH_LENGTH}</span>
          </span>
        </div>
        <PipBar
          filled={state.matchScore.white}
          total={MATCH_LENGTH}
          color="border-cyan-400 bg-cyan-500"
        />
        <div className="mt-1.5 text-xs text-slate-500">
          Borne off:{' '}
          <span className="text-cyan-400">{state.borneOff.white}</span>
          {state.bar.white > 0 && (
            <span className="ml-2 text-amber-400">Bar: {state.bar.white}</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
