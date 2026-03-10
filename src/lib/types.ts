// ============================================================
// Core TypeScript types for the Backgammon game
// ============================================================

/** Player colors */
export type Color = 'white' | 'black';

/** Game phases */
export type GamePhase = 'menu' | 'playing' | 'paused' | 'ended';

/** AI difficulty levels */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** A single point (triangle) on the board */
export interface Point {
  checkers: Color[]; // checkers stacked here, last = top
}

/** The full game state */
export interface GameState {
  /** 24 board points, index 0–23 */
  points: Point[];
  /** Checkers hit and placed on the bar */
  bar: { white: number; black: number };
  /** Checkers successfully borne off */
  borneOff: { white: number; black: number };
  /** Whose turn it is */
  currentPlayer: Color;
  /** Current dice values (1–6 each) */
  dice: number[];
  /** Which dice values have already been used this turn */
  usedDice: number[];
  /** Current game phase */
  phase: GamePhase;
  /** Winner when phase === 'ended' */
  winner: Color | null;
  /** Whether each player may legally bear off */
  canBearOff: { white: boolean; black: boolean };
  /** The point index the player has selected (-1 = none, 24 = white bar, 25 = black bar) */
  selectedPoint: number | null;
  /** Valid destination point indices for the current selection */
  validMoves: number[];
  /** Cumulative match score (first to 7 wins) */
  matchScore: { white: number; black: number };
  /** Whether the dice have been rolled this turn */
  isRolled: boolean;
  /** AI difficulty */
  difficulty: Difficulty;
  /** Whether it's the AI's turn to move */
  isAITurn: boolean;
}

/** A proposed checker move */
export interface Move {
  from: number; // 0–23 | 24 (white bar) | 25 (black bar)
  to: number;   // 0–23 | 24 (white bear-off) | 25 (black bear-off)
  dieUsed: number;
}

/** Sound categories */
export type SoundType = 'roll' | 'move' | 'hit' | 'win' | 'lose' | 'illegal';
