// ============================================================
// Hook: central game state + all game actions
// ============================================================

'use client';

import { useCallback, useEffect, useReducer } from 'react';
import type { Color, Difficulty, GameState, Move } from '@/lib/types';
import {
  allLegalMoves,
  applyMove,
  canBearOff,
  checkWinner,
  createInitialState,
  deepCloneState,
  endTurn,
  getRemainingDice,
  legalMovesFrom,
  rollDice,
} from '@/lib/backgammon';
import { getAIMoves } from '@/lib/aiLogic';
import { AI_THINK_DELAY, MATCH_LENGTH, WHITE_BAR, BLACK_BAR } from '@/lib/constants';

// ── Actions ──────────────────────────────────────────────────

type Action =
  | { type: 'ROLL_DICE' }
  | { type: 'SELECT_POINT'; index: number }
  | { type: 'MAKE_MOVE'; move: Move }
  | { type: 'END_TURN' }
  | { type: 'AI_MOVE'; moves: Move[] }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'NEW_GAME'; difficulty: Difficulty }
  | { type: 'NEXT_ROUND' };

// ── Reducer ──────────────────────────────────────────────────

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {

    case 'ROLL_DICE': {
      if (state.isRolled || state.phase !== 'playing') return state;
      const dice = rollDice();
      const next = { ...deepCloneState(state), dice, usedDice: [], isRolled: true };
      next.canBearOff.white = canBearOff(next, 'white');
      next.canBearOff.black = canBearOff(next, 'black');
      return next;
    }

    case 'SELECT_POINT': {
      if (!state.isRolled || state.phase !== 'playing') return state;
      const { index } = action;
      const color = state.currentPlayer;

      // Compute valid destination indices for all remaining dice
      const remaining = getRemainingDice(state);
      const uniqueDice = [...new Set(remaining)];
      const destSet = new Set<number>();

      for (const die of uniqueDice) {
        const mvs = legalMovesFrom(state, color, index, die);
        mvs.forEach((m) => destSet.add(m.to));
      }

      return {
        ...deepCloneState(state),
        selectedPoint: index,
        validMoves: [...destSet],
      };
    }

    case 'MAKE_MOVE': {
      if (!state.isRolled || state.phase !== 'playing') return state;
      let next = applyMove(state, action.move);

      // Check for winner
      const winner = checkWinner(next);
      if (winner) {
        const matchScore = { ...next.matchScore };
        matchScore[winner]++;
        const matchWinner = matchScore[winner] >= MATCH_LENGTH ? winner : null;
        return {
          ...next,
          winner,
          phase: 'ended',
          matchScore,
          selectedPoint: null,
          validMoves: [],
        };
      }

      // Check if any dice remain and moves are available
      const remaining = getRemainingDice(next);
      if (remaining.length === 0) {
        next = endTurn(next);
      } else {
        // Check if any moves are possible with remaining dice
        const legal = allLegalMoves(next);
        if (legal.length === 0) {
          next = endTurn(next);
        } else {
          next.selectedPoint = null;
          next.validMoves = [];
        }
      }

      return next;
    }

    case 'END_TURN': {
      return endTurn(state);
    }

    case 'AI_MOVE': {
      let next = deepCloneState(state);
      for (const move of action.moves) {
        next = applyMove(next, move);
        const winner = checkWinner(next);
        if (winner) {
          const matchScore = { ...next.matchScore };
          matchScore[winner]++;
          return { ...next, winner, phase: 'ended', matchScore };
        }
      }
      return endTurn(next);
    }

    case 'PAUSE': {
      if (state.phase !== 'playing') return state;
      return { ...deepCloneState(state), phase: 'paused' };
    }

    case 'RESUME': {
      if (state.phase !== 'paused') return state;
      return { ...deepCloneState(state), phase: 'playing' };
    }

    case 'NEW_GAME': {
      return createInitialState(action.difficulty);
    }

    case 'NEXT_ROUND': {
      const fresh = createInitialState(state.difficulty);
      return { ...fresh, matchScore: { ...state.matchScore } };
    }

    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────

export function useGameState(initialDifficulty: Difficulty = 'medium') {
  const [state, dispatch] = useReducer(reducer, initialDifficulty, createInitialState);

  // AI turn effect
  useEffect(() => {
    if (
      state.phase !== 'playing' ||
      !state.isAITurn ||
      !state.isRolled
    ) return;

    const timer = setTimeout(() => {
      const moves = getAIMoves(state, state.difficulty);
      dispatch({ type: 'AI_MOVE', moves });
    }, AI_THINK_DELAY);

    return () => clearTimeout(timer);
  }, [state.isAITurn, state.isRolled, state.dice, state.phase, state.difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-roll for AI turn
  useEffect(() => {
    if (
      state.phase !== 'playing' ||
      !state.isAITurn ||
      state.isRolled
    ) return;

    const timer = setTimeout(() => {
      dispatch({ type: 'ROLL_DICE' });
    }, AI_THINK_DELAY / 2);

    return () => clearTimeout(timer);
  }, [state.isAITurn, state.isRolled, state.phase]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (state.phase === 'playing') dispatch({ type: 'PAUSE' });
        else if (state.phase === 'paused') dispatch({ type: 'RESUME' });
      }
      if ((e.key === 'r' || e.key === 'R') && !state.isAITurn) {
        dispatch({ type: 'ROLL_DICE' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.phase, state.isAITurn]);

  const actions = {
    rollDice: useCallback(() => dispatch({ type: 'ROLL_DICE' }), []),
    selectPoint: useCallback((index: number) => dispatch({ type: 'SELECT_POINT', index }), []),
    makeMove: useCallback((move: Move) => dispatch({ type: 'MAKE_MOVE', move }), []),
    endTurn: useCallback(() => dispatch({ type: 'END_TURN' }), []),
    pause: useCallback(() => dispatch({ type: 'PAUSE' }), []),
    resume: useCallback(() => dispatch({ type: 'RESUME' }), []),
    newGame: useCallback((difficulty: Difficulty) => dispatch({ type: 'NEW_GAME', difficulty }), []),
    nextRound: useCallback(() => dispatch({ type: 'NEXT_ROUND' }), []),
  };

  return { state, actions };
}
