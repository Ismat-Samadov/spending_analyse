// ============================================================
// AI opponent logic – Easy / Medium / Hard
// ============================================================

import type { Color, Difficulty, GameState, Move } from './types';
import {
  allLegalMoves,
  applyMove,
  deepCloneState,
  getRemainingDice,
  opponent,
  pipCount,
} from './backgammon';

// ── Public API ───────────────────────────────────────────────

/**
 * Returns the best sequence of moves for the AI player.
 * Plays all remaining dice in order.
 */
export function getAIMoves(state: GameState, difficulty: Difficulty): Move[] {
  switch (difficulty) {
    case 'easy':   return playEasy(state);
    case 'medium': return playMedium(state);
    case 'hard':   return playHard(state);
  }
}

// ── Easy ─────────────────────────────────────────────────────

/** Easy: picks random valid moves */
function playEasy(state: GameState): Move[] {
  return greedyPlay(state, () => Math.random());
}

// ── Medium ───────────────────────────────────────────────────

/**
 * Medium: heuristic-based play.
 *  Priority: hit blots > escape from opponent's home > make points.
 */
function playMedium(state: GameState): Move[] {
  return greedyPlay(state, (s, m) => scoreMoveHeuristic(s, m));
}

/** Scores a single move by simple heuristics */
function scoreMoveHeuristic(state: GameState, move: Move): number {
  let score = 0;
  const color = state.currentPlayer;
  const opp = opponent(color);
  const dest = move.to;

  if (dest < 24) {
    const destPt = state.points[dest];
    // Hitting an opponent blot is very good
    if (destPt.checkers.length === 1 && destPt.checkers[0] === opp) score += 10;
    // Making a point (we already have one there) is good
    if (destPt.checkers.length === 1 && destPt.checkers[0] === color) score += 5;
    // Landing as a blot on opponent's half is risky
    if (color === 'black' && dest < 12 && destPt.checkers.length === 0) score -= 2;
    if (color === 'white' && dest > 11 && destPt.checkers.length === 0) score -= 2;
  }

  // Bearing off is always great
  if (dest === 24 || dest === 25 || dest === 26 || dest === 27) score += 15;

  // Add small randomness so equal moves don't always repeat
  score += Math.random() * 0.5;
  return score;
}

// ── Hard ─────────────────────────────────────────────────────

/**
 * Hard: depth-limited minimax with pip count evaluation.
 * Evaluates all possible move sequences for the remaining dice.
 */
function playHard(state: GameState): Move[] {
  const sequences = generateAllSequences(state);
  if (sequences.length === 0) return [];

  const color = state.currentPlayer;
  let best: Move[] = [];
  let bestScore = -Infinity;

  for (const seq of sequences) {
    let s = deepCloneState(state);
    for (const m of seq) s = applyMove(s, m);
    const score = evaluateState(s, color);
    if (score > bestScore) {
      bestScore = score;
      best = seq;
    }
  }

  return best;
}

/**
 * Evaluates a board position from `color`'s perspective.
 * Lower pip count is better; extra bonuses for hitting / primes.
 */
function evaluateState(state: GameState, color: Color): number {
  const myPip = pipCount(state, color);
  const oppPip = pipCount(state, opponent(color));

  let score = oppPip - myPip;

  // Bonus for having opponent on bar
  const oppBar = color === 'white' ? state.bar.black : state.bar.white;
  score += oppBar * 8;

  // Bonus for borne off
  const myOff = color === 'white' ? state.borneOff.white : state.borneOff.black;
  score += myOff * 5;

  // Bonus for made points (2+ checkers = safe)
  for (let i = 0; i < 24; i++) {
    const n = state.points[i].checkers.filter((c) => c === color).length;
    if (n >= 2) score += 2;
  }

  return score;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Greedy play: repeatedly picks the highest-scoring move until no moves left.
 * `scorer` returns a number (higher = better).
 */
function greedyPlay(
  state: GameState,
  scorer: (s: GameState, m: Move) => number
): Move[] {
  const chosen: Move[] = [];
  let current = deepCloneState(state);

  for (let round = 0; round < 4; round++) {
    const moves = allLegalMoves(current);
    if (moves.length === 0) break;

    let best: Move | null = null;
    let bestScore = -Infinity;
    for (const m of moves) {
      const s = scorer(current, m);
      if (s > bestScore) {
        bestScore = s;
        best = m;
      }
    }

    if (!best) break;
    chosen.push(best);
    current = applyMove(current, best);

    // Stop if no dice remain
    if (getRemainingDice(current).length === 0) break;
  }

  return chosen;
}

/**
 * Generates all possible complete move sequences for the current dice.
 * Limited to a manageable branching factor for performance.
 */
function generateAllSequences(
  state: GameState,
  depth = 0
): Move[][] {
  if (depth > 3) return [[]];

  const moves = allLegalMoves(state);
  if (moves.length === 0) return [[]];

  // Cap branching for performance
  const candidates = moves.slice(0, 20);
  const results: Move[][] = [];

  for (const move of candidates) {
    const next = applyMove(state, move);
    if (getRemainingDice(next).length === 0) {
      results.push([move]);
    } else {
      const subSeqs = generateAllSequences(next, depth + 1);
      for (const sub of subSeqs) {
        results.push([move, ...sub]);
      }
    }
  }

  // Also include "stop early" option
  results.push([]);

  return results;
}
