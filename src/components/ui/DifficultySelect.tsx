// ============================================================
// DifficultySelect.tsx – difficulty picker with descriptions
// ============================================================

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Difficulty } from '@/lib/types';

interface DifficultySelectProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

const OPTIONS: { value: Difficulty; label: string; desc: string; color: string }[] = [
  {
    value: 'easy',
    label: 'Easy',
    desc: 'Random moves',
    color: 'border-green-500/60 bg-green-950/20 text-green-300 hover:border-green-400 hover:bg-green-950/40',
  },
  {
    value: 'medium',
    label: 'Medium',
    desc: 'Heuristic AI',
    color: 'border-amber-500/60 bg-amber-950/20 text-amber-300 hover:border-amber-400 hover:bg-amber-950/40',
  },
  {
    value: 'hard',
    label: 'Hard',
    desc: 'Minimax AI',
    color: 'border-red-500/60 bg-red-950/20 text-red-300 hover:border-red-400 hover:bg-red-950/40',
  },
];

export default function DifficultySelect({ value, onChange }: DifficultySelectProps) {
  return (
    <div className="flex gap-2 w-full">
      {OPTIONS.map((opt) => (
        <motion.button
          key={opt.value}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 px-1 rounded-xl border font-mono text-xs font-bold transition-all duration-200 cursor-pointer ${
            value === opt.value
              ? `${opt.color} shadow-lg ring-1 ring-current`
              : 'border-slate-700/40 bg-slate-900/30 text-slate-500 hover:text-slate-300 hover:border-slate-600'
          }`}
        >
          <div className="text-sm font-bold">{opt.label}</div>
          <div className="text-xs opacity-60 font-normal">{opt.desc}</div>
        </motion.button>
      ))}
    </div>
  );
}
