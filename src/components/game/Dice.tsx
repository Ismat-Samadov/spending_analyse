// ============================================================
// Dice.tsx – animated dice display component
// ============================================================

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceProps {
  dice: number[];
  usedDice: number[];
  isRolling?: boolean;
}

/** Dot positions for each face value (row, col) in a 3×3 grid */
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DieFace({ value, used }: { value: number; used: boolean }) {
  const dots = DOT_POSITIONS[value] || [];

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 transition-all duration-300 ${
        used
          ? 'border-slate-700 bg-slate-900/50 opacity-40'
          : 'border-cyan-400/60 bg-slate-900/90 shadow-[0_0_12px_rgba(0,255,224,0.4)]'
      }`}
    >
      {/* 3×3 grid of dot positions */}
      <div className="absolute inset-1.5 grid grid-cols-3 grid-rows-3">
        {dots.map(([row, col], i) => (
          <div
            key={i}
            className={`flex items-center justify-center`}
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
          >
            <div
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                used
                  ? 'bg-slate-600'
                  : 'bg-cyan-300 shadow-[0_0_6px_rgba(0,255,224,0.8)]'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Used overlay */}
      {used && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <div className="w-8 h-0.5 bg-slate-600 rotate-45" />
        </div>
      )}
    </motion.div>
  );
}

export default function Dice({ dice, usedDice, isRolling = false }: DiceProps) {
  // Track which dice are used (by position, since doubles have identical values)
  const usedCopy = [...usedDice];
  const diceWithUsed = dice.map((d) => {
    const idx = usedCopy.indexOf(d);
    if (idx !== -1) {
      usedCopy.splice(idx, 1);
      return { value: d, used: true };
    }
    return { value: d, used: false };
  });

  if (dice.length === 0 && !isRolling) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm font-mono">
        <span className="animate-pulse">Roll to play</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <AnimatePresence mode="popLayout">
        {isRolling
          ? [1, 2].map((_, i) => (
              <motion.div
                key={`rolling-${i}`}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-cyan-400/60 bg-slate-900/90 shadow-[0_0_12px_rgba(0,255,224,0.4)] flex items-center justify-center"
              >
                <span className="text-cyan-400 text-lg">?</span>
              </motion.div>
            ))
          : diceWithUsed.map((d, i) => (
              <DieFace key={`die-${i}-${d.value}`} value={d.value} used={d.used} />
            ))}
      </AnimatePresence>
    </div>
  );
}
