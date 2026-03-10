// ============================================================
// Core backgammon rules engine
// ============================================================

import type { Color, GameState, Move, Point } from './types';
import {
  BLACK_BAR,
  BLACK_BEAROFF,
  BLACK_HOME,
  WHITE_BAR,
  WHITE_BEAROFF,
  WHITE_HOME,
  getInitialPoints,
  MATCH_LENGTH,
} from './constants';

// ── helpers ─────────────────────────────────────────────────

/** Opponent color */
export const opponent = (c: Color): Color => (c === 'white' ? 'black' : 'white');

/** Deep clone the points array */
const clonePoints = (pts: Point[]): Point[] =>
  pts.map((p) => ({ checkers: [...p.checkers] }));

/**
 * Returns true if a player can legally bear off – i.e. all their remaining
 * checkers (including bar) are in their home board.
 */
export function canBearOff(state: GameState, color: Color): boolean {
  if (color === 'white') {
    if (state.bar.white > 0) return false;
    for (let i = 6; i < 24; i++) {
      if (state.points[i].checkers.some((c) => c === 'white')) return false;
    }
    return true;
  } else {
    if (state.bar.black > 0) return false;
    for (let i = 0; i < 18; i++) {
      if (state.points[i].checkers.some((c) => c === 'black')) return false;
    }
    return true;
  }
}

/**
 * Returns all legal moves for the given player/die combination FROM a
 * specific point.  `from` uses the extended index scheme:
 *   0–23  = board points
 *   24    = white bar
 *   25    = black bar
 */
export function legalMovesFrom(
  state: GameState,
  color: Color,
  from: number,
  die: number
): Move[] {
  const moves: Move[] = [];
  const isWhite = color === 'white';

  // Bar entry: white enters on points 18–23 (opponent's home) when rolled
  // die corresponds to point (24 - die) for white, or (die - 1) for black.
  if (from === WHITE_BAR) {
    if (!isWhite) return [];
    const to = 24 - die; // white enters from high end (point 24 side)
    if (to >= 0 && to <= 23) {
      const pt = state.points[to];
      const oppCount = pt.checkers.filter((c) => c === 'black').length;
      if (oppCount < 2) moves.push({ from, to, dieUsed: die });
    }
    return moves;
  }

  if (from === BLACK_BAR) {
    if (isWhite) return [];
    const to = die - 1; // black enters from low end (point 1 side)
    if (to >= 0 && to <= 23) {
      const pt = state.points[to];
      const oppCount = pt.checkers.filter((c) => c === 'white').length;
      if (oppCount < 2) moves.push({ from, to, dieUsed: die });
    }
    return moves;
  }

  // Checker must belong to current player
  const myCheckers = state.points[from].checkers.filter((c) => c === color);
  if (myCheckers.length === 0) return [];

  const bearing = isWhite ? state.canBearOff.white : state.canBearOff.black;

  if (isWhite) {
    const to = from - die; // white moves from high to low index
    if (to >= 0) {
      const pt = state.points[to];
      const oppCount = pt.checkers.filter((c) => c === 'black').length;
      if (oppCount < 2) moves.push({ from, to, dieUsed: die });
    } else if (bearing) {
      // Bear off: exact or highest occupied (if no lower points occupied)
      if (to === -1) {
        // Exact bear-off
        moves.push({ from, to: WHITE_BEAROFF, dieUsed: die });
      } else if (to < -1) {
        // Over-roll: allowed only if no checkers on higher points
        const higherOccupied = WHITE_HOME.slice(from + 1).some(
          (i) => state.points[i].checkers.some((c) => c === 'white')
        );
        if (!higherOccupied) {
          moves.push({ from, to: WHITE_BEAROFF, dieUsed: die });
        }
      }
    }
  } else {
    const to = from + die; // black moves from low to high index
    if (to <= 23) {
      const pt = state.points[to];
      const oppCount = pt.checkers.filter((c) => c === 'white').length;
      if (oppCount < 2) moves.push({ from, to, dieUsed: die });
    } else if (bearing) {
      if (to === 24) {
        moves.push({ from, to: BLACK_BEAROFF, dieUsed: die });
      } else if (to > 24) {
        // Over-roll allowed only when no checkers on higher-indexed home points
        // BLACK_HOME = [18..23]; from-18 is its index; slice from next gives higher points
        const higherOccupied = BLACK_HOME.slice(from - 17).some(
          (i) => state.points[i].checkers.some((c) => c === 'black')
        );
        if (!higherOccupied) {
          moves.push({ from, to: BLACK_BEAROFF, dieUsed: die });
        }
      }
    }
  }

  return moves;
}

/**
 * Gathers all legal moves for the current player across all remaining dice.
 * Returns a flat list of unique (from, to, dieUsed) moves.
 */
export function allLegalMoves(state: GameState): Move[] {
  const color = state.currentPlayer;
  const remainingDice = getRemainingDice(state);
  const seen = new Set<string>();
  const result: Move[] = [];

  const fromPoints = getSourcesToCheck(state, color);

  for (const die of new Set(remainingDice)) {
    for (const from of fromPoints) {
      const mvs = legalMovesFrom(state, color, from, die);
      for (const m of mvs) {
        const key = `${m.from}-${m.to}-${m.dieUsed}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(m);
        }
      }
    }
  }

  return result;
}

/** Returns remaining (unused) dice values */
export function getRemainingDice(state: GameState): number[] {
  const used = [...state.usedDice];
  const remaining: number[] = [];
  for (const d of state.dice) {
    const idx = used.indexOf(d);
    if (idx !== -1) {
      used.splice(idx, 1);
    } else {
      remaining.push(d);
    }
  }
  return remaining;
}

/** Points to check for valid sources for the current player */
function getSourcesToCheck(state: GameState, color: Color): number[] {
  if (color === 'white' && state.bar.white > 0) return [WHITE_BAR];
  if (color === 'black' && state.bar.black > 0) return [BLACK_BAR];

  const sources: number[] = [];
  for (let i = 0; i < 24; i++) {
    if (state.points[i].checkers.some((c) => c === color)) sources.push(i);
  }
  return sources;
}

/**
 * Applies a move to a copy of the state and returns the new state.
 * Does NOT advance the turn – caller is responsible.
 */
export function applyMove(state: GameState, move: Move): GameState {
  const next = deepCloneState(state);
  const color = next.currentPlayer;
  const opp = opponent(color);
  const isWhite = color === 'white';

  // Remove checker from source
  if (move.from === WHITE_BAR) {
    next.bar.white--;
  } else if (move.from === BLACK_BAR) {
    next.bar.black--;
  } else {
    const srcIdx = next.points[move.from].checkers.lastIndexOf(color);
    next.points[move.from].checkers.splice(srcIdx, 1);
  }

  // Place checker at destination
  if (move.to === WHITE_BEAROFF) {
    next.borneOff.white++;
  } else if (move.to === BLACK_BEAROFF) {
    next.borneOff.black++;
  } else {
    const dest = next.points[move.to];
    const oppCheckers = dest.checkers.filter((c) => c === opp);
    if (oppCheckers.length === 1) {
      // Hit! Send opponent to bar
      const hitIdx = dest.checkers.indexOf(opp);
      dest.checkers.splice(hitIdx, 1);
      if (opp === 'white') next.bar.white++;
      else next.bar.black++;
    }
    dest.checkers.push(color);
  }

  // Mark die as used
  const dieIdx = next.dice.indexOf(move.dieUsed);
  // Find an unused occurrence
  let used = 0;
  for (const u of next.usedDice) if (u === move.dieUsed) used++;
  let found = 0;
  for (let i = 0; i < next.dice.length; i++) {
    if (next.dice[i] === move.dieUsed) {
      found++;
      if (found > used) {
        next.usedDice.push(move.dieUsed);
        break;
      }
    }
  }

  // Update bear-off eligibility
  next.canBearOff.white = canBearOff(next, 'white');
  next.canBearOff.black = canBearOff(next, 'black');

  return next;
}

/**
 * Checks if the current player has won (all 15 checkers borne off).
 */
export function checkWinner(state: GameState): Color | null {
  if (state.borneOff.white === 15) return 'white';
  if (state.borneOff.black === 15) return 'black';
  return null;
}

/**
 * Returns a fresh initial game state.
 */
export function createInitialState(difficulty: import('./types').Difficulty): GameState {
  const points = getInitialPoints();
  const state: GameState = {
    points,
    bar: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
    currentPlayer: 'white',
    dice: [],
    usedDice: [],
    phase: 'playing',
    winner: null,
    canBearOff: { white: false, black: false },
    selectedPoint: null,
    validMoves: [],
    matchScore: { white: 0, black: 0 },
    isRolled: false,
    difficulty,
    isAITurn: false,
  };
  return state;
}

/**
 * Advances the turn to the next player after all dice are used or no moves.
 */
export function endTurn(state: GameState): GameState {
  const next = deepCloneState(state);
  next.currentPlayer = opponent(next.currentPlayer);
  next.dice = [];
  next.usedDice = [];
  next.isRolled = false;
  next.selectedPoint = null;
  next.validMoves = [];
  next.isAITurn = next.currentPlayer === 'black';
  return next;
}

/**
 * Rolls two dice (or four on doubles).
 */
export function rollDice(): number[] {
  const d1 = Math.ceil(Math.random() * 6);
  const d2 = Math.ceil(Math.random() * 6);
  return d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
}

/** Deep clone the entire game state */
export function deepCloneState(state: GameState): GameState {
  return {
    ...state,
    points: clonePoints(state.points),
    bar: { ...state.bar },
    borneOff: { ...state.borneOff },
    canBearOff: { ...state.canBearOff },
    dice: [...state.dice],
    usedDice: [...state.usedDice],
    validMoves: [...state.validMoves],
    matchScore: { ...state.matchScore },
  };
}

/**
 * Computes pip count (lower is better in terms of distance to goal).
 */
export function pipCount(state: GameState, color: Color): number {
  let count = 0;
  if (color === 'white') {
    count += state.bar.white * 25;
    for (let i = 0; i < 24; i++) {
      const n = state.points[i].checkers.filter((c) => c === 'white').length;
      count += n * (i + 1); // white wants to reduce, so distance from point 0
    }
  } else {
    count += state.bar.black * 25;
    for (let i = 0; i < 24; i++) {
      const n = state.points[i].checkers.filter((c) => c === 'black').length;
      count += n * (24 - i); // black wants to reduce distance from point 24
    }
  }
  return count;
}
