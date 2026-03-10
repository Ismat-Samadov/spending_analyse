// ============================================================
// GameControls.tsx – roll dice, end turn, pause buttons
// ============================================================

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Dices, SkipForward, Pause, Volume2, VolumeX } from 'lucide-react';
import type { GameState } from '@/lib/types';
import { allLegalMoves, getRemainingDice } from '@/lib/backgammon';
import Dice from '@/components/game/Dice';

interface GameControlsProps {
  state: GameState;
  onRoll: () => void;
  onEndTurn: () => void;
  onPause: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
}

export default function GameControls({
  state,
  onRoll,
  onEndTurn,
  onPause,
  soundEnabled,
  onSoundToggle,
}: GameControlsProps) {
  const isPlayerTurn = !state.isAITurn && state.phase === 'playing';
  const canRoll = isPlayerTurn && !state.isRolled;
  const remaining = getRemainingDice(state);
  const hasLegalMoves = state.isRolled && allLegalMoves(state).length > 0;
  const canEndTurn = isPlayerTurn && state.isRolled && (!hasLegalMoves || remaining.length === 0);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Dice display */}
      <div className="flex items-center justify-center min-h-[60px]">
        <Dice
          dice={state.dice}
          usedDice={state.usedDice}
          isRolling={false}
        />
      </div>

      {/* Action buttons row */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {/* Roll button */}
        <motion.button
          whileHover={canRoll ? { scale: 1.05 } : {}}
          whileTap={canRoll ? { scale: 0.95 } : {}}
          onClick={canRoll ? onRoll : undefined}
          disabled={!canRoll}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm transition-all duration-200 ${
            canRoll
              ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 hover:bg-cyan-500/30 shadow-[0_0_12px_rgba(0,255,224,0.3)] cursor-pointer'
              : 'bg-slate-800/40 border border-slate-700/40 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Dices className="w-4 h-4" />
          Roll <span className="hidden sm:inline text-xs opacity-60">(R)</span>
        </motion.button>

        {/* End turn button */}
        <motion.button
          whileHover={canEndTurn ? { scale: 1.05 } : {}}
          whileTap={canEndTurn ? { scale: 0.95 } : {}}
          onClick={canEndTurn ? onEndTurn : undefined}
          disabled={!canEndTurn}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm transition-all duration-200 ${
            canEndTurn
              ? 'bg-violet-500/20 border border-violet-400/60 text-violet-300 hover:bg-violet-500/30 shadow-[0_0_12px_rgba(124,58,237,0.3)] cursor-pointer'
              : 'bg-slate-800/40 border border-slate-700/40 text-slate-600 cursor-not-allowed'
          }`}
        >
          <SkipForward className="w-4 h-4" />
          End Turn
        </motion.button>

        {/* Pause button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPause}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-sm bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all duration-200 cursor-pointer"
        >
          <Pause className="w-4 h-4" />
          <span className="hidden sm:inline text-xs opacity-60">(P)</span>
        </motion.button>

        {/* Sound toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSoundToggle}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-sm bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all duration-200 cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Status indicator */}
      <div className="text-center font-mono text-xs text-slate-500 min-h-[20px]">
        {state.isAITurn && state.phase === 'playing' && (
          <span className="text-violet-400 animate-pulse">
            AI is thinking...
          </span>
        )}
        {isPlayerTurn && !state.isRolled && (
          <span className="text-cyan-500">Your turn — roll the dice</span>
        )}
        {isPlayerTurn && state.isRolled && hasLegalMoves && remaining.length > 0 && (
          <span className="text-green-400">Select a checker to move</span>
        )}
        {isPlayerTurn && state.isRolled && !hasLegalMoves && (
          <span className="text-amber-400">No legal moves — end turn</span>
        )}
      </div>
    </div>
  );
}
