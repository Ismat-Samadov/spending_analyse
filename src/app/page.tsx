// ============================================================
// page.tsx – Main game page
// ============================================================

'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Board from '@/components/game/Board';
import GameControls from '@/components/ui/GameControls';
import ScorePanel from '@/components/ui/ScorePanel';
import DifficultySelect from '@/components/ui/DifficultySelect';
import EndScreen from '@/components/ui/EndScreen';
import PauseMenu from '@/components/ui/PauseMenu';
import { useGameState } from '@/hooks/useGameState';
import { useSound } from '@/hooks/useSound';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Difficulty } from '@/lib/types';
import { legalMovesFrom, getRemainingDice } from '@/lib/backgammon';
import { WHITE_BAR, BLACK_BAR } from '@/lib/constants';

export default function GamePage() {
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>('bgDifficulty', 'medium');
  const { state, actions } = useGameState(difficulty);
  const { soundEnabled, toggle: toggleSound, play } = useSound();

  // Trigger win/lose sound once on game end
  const prevWinner = useRef<string | null>(null);
  useEffect(() => {
    if (state.winner && state.winner !== prevWinner.current) {
      prevWinner.current = state.winner;
      play(state.winner === 'white' ? 'win' : 'lose');
    }
    if (!state.winner) prevWinner.current = null;
  }, [state.winner, play]);

  // Play roll sound when dice appear
  const prevDiceLen = useRef(0);
  useEffect(() => {
    if (state.dice.length > 0 && prevDiceLen.current === 0) {
      play('roll');
    }
    prevDiceLen.current = state.dice.length;
  }, [state.dice.length, play]);

  /** Handle point click: select a checker */
  const handlePointClick = useCallback(
    (index: number) => {
      if (!state.isRolled || state.isAITurn || state.phase !== 'playing') return;

      const color = state.currentPlayer;
      const hasChecker =
        index === WHITE_BAR
          ? state.bar.white > 0
          : index === BLACK_BAR
          ? state.bar.black > 0
          : state.points[index]?.checkers.some((c) => c === color);

      if (hasChecker) {
        actions.selectPoint(index);
      }
    },
    [state, actions]
  );

  /** Handle move destination click */
  const handleMoveClick = useCallback(
    (to: number) => {
      if (state.selectedPoint === null || state.isAITurn) return;

      const color = state.currentPlayer;
      const remaining = getRemainingDice(state);

      for (const die of new Set(remaining)) {
        const mvs = legalMovesFrom(state, color, state.selectedPoint, die);
        const mv = mvs.find((m) => m.to === to);
        if (mv) {
          // Hit sound if landing on a blot
          if (
            to < 24 &&
            state.points[to].checkers.length === 1 &&
            state.points[to].checkers[0] !== color
          ) {
            play('hit');
          } else {
            play('move');
          }
          actions.makeMove(mv);
          return;
        }
      }
    },
    [state, actions, play]
  );

  const handleDifficultyChange = useCallback(
    (d: Difficulty) => {
      setDifficulty(d);
      actions.newGame(d);
    },
    [actions, setDifficulty]
  );

  const handleNewGame = useCallback(
    (d: Difficulty) => {
      setDifficulty(d);
      actions.newGame(d);
    },
    [actions, setDifficulty]
  );

  return (
    <main className="min-h-screen bg-[#0a0a1a] bg-grid flex flex-col items-center justify-start px-2 py-4 sm:py-6 overflow-x-hidden">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl flex items-center justify-between mb-4 px-2"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight neon-text-cyan text-cyan-300">
            NEON<span className="text-violet-400 neon-text-violet">GAMMON</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono">Backgammon · First to 7 points wins the match</p>
        </div>
        <div className="text-right text-xs text-slate-500 font-mono hidden sm:block">
          <span className="text-cyan-400 font-bold">{state.matchScore.white}</span>
          <span className="text-slate-600 mx-1">–</span>
          <span className="text-violet-400 font-bold">{state.matchScore.black}</span>
          <div className="text-slate-600">You – AI</div>
        </div>
      </motion.header>

      {/* ── Main layout ────────────────────────────────────── */}
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-4 items-start justify-center">

        {/* Board */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full lg:flex-1 rounded-2xl overflow-hidden border border-slate-700/40 bg-slate-900/20 shadow-2xl"
        >
          <Board
            state={state}
            onPointClick={handlePointClick}
            onMoveClick={handleMoveClick}
          />
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full lg:w-72 flex flex-col gap-4"
        >
          {/* Score */}
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 backdrop-blur-sm">
            <ScorePanel state={state} />
          </div>

          {/* Controls */}
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 backdrop-blur-sm">
            <GameControls
              state={state}
              onRoll={actions.rollDice}
              onEndTurn={actions.endTurn}
              onPause={actions.pause}
              soundEnabled={soundEnabled}
              onSoundToggle={toggleSound}
            />
          </div>

          {/* Difficulty */}
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest mb-2">
              Difficulty
            </div>
            <DifficultySelect
              value={state.difficulty}
              onChange={handleDifficultyChange}
            />
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest mb-2">
              How to Play
            </div>
            <ul className="text-xs text-slate-400 font-mono space-y-1">
              <li>• <span className="text-cyan-400">White</span> = You · moves right→left</li>
              <li>• <span className="text-violet-400">Black</span> = AI · moves left→right</li>
              <li>• Roll dice, click a checker</li>
              <li>• Click a glowing spot to move</li>
              <li>• Bear off all 15 pieces to win</li>
              <li className="pt-1 text-slate-600">
                <kbd className="bg-slate-800 px-1 rounded border border-slate-700">R</kbd> Roll ·{' '}
                <kbd className="bg-slate-800 px-1 rounded border border-slate-700">P</kbd> Pause
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* ── Overlays ───────────────────────────────────────── */}
      <EndScreen
        state={state}
        onRestart={() => actions.newGame(state.difficulty)}
        onNextRound={actions.nextRound}
      />
      <PauseMenu
        state={state}
        onResume={actions.resume}
        onNewGame={handleNewGame}
      />
    </main>
  );
}
