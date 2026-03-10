// ============================================================
// Board constants and initial game setup
// ============================================================

import type { Point } from './types';

/** Total checkers per player */
export const CHECKERS_PER_PLAYER = 15;

/** Number of points on the board */
export const BOARD_POINTS = 24;

/** Special indices */
export const WHITE_BAR = 24;   // white's bar slot
export const BLACK_BAR = 25;   // black's bar slot
export const WHITE_BEAROFF = 26; // white's bear-off destination
export const BLACK_BEAROFF = 27; // black's bear-off destination

/**
 * Standard backgammon starting position.
 *
 * Direction convention (following standard backgammon):
 *   White moves from point 24→1  (i.e. index 23 → 0)
 *   Black moves from point 1→24  (i.e. index 0 → 23)
 *
 * Points are 0-indexed:  index 0 = point 1, index 23 = point 24
 */
export function getInitialPoints(): Point[] {
  const pts: Point[] = Array.from({ length: 24 }, () => ({ checkers: [] }));

  // White checkers
  for (let i = 0; i < 2; i++) pts[23].checkers.push('white');   // point 24
  for (let i = 0; i < 5; i++) pts[12].checkers.push('white');   // point 13
  for (let i = 0; i < 3; i++) pts[7].checkers.push('white');    // point 8
  for (let i = 0; i < 5; i++) pts[5].checkers.push('white');    // point 6

  // Black checkers
  for (let i = 0; i < 2; i++) pts[0].checkers.push('black');    // point 1
  for (let i = 0; i < 5; i++) pts[11].checkers.push('black');   // point 12
  for (let i = 0; i < 3; i++) pts[16].checkers.push('black');   // point 17
  for (let i = 0; i < 5; i++) pts[18].checkers.push('black');   // point 19

  return pts;
}

/** Points in white's home board (indices 0–5) */
export const WHITE_HOME = [0, 1, 2, 3, 4, 5];

/** Points in black's home board (indices 18–23) */
export const BLACK_HOME = [18, 19, 20, 21, 22, 23];

/** Match length (points needed to win) */
export const MATCH_LENGTH = 7;

/** Milliseconds the AI "thinks" before moving */
export const AI_THINK_DELAY = 800;
