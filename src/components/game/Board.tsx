// ============================================================
// Board.tsx – HTML5 Canvas backgammon board renderer
// ============================================================

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import type { GameState } from '@/lib/types';
import { WHITE_BAR, BLACK_BAR, WHITE_BEAROFF, BLACK_BEAROFF } from '@/lib/constants';
import { legalMovesFrom, getRemainingDice } from '@/lib/backgammon';

interface BoardProps {
  state: GameState;
  onPointClick: (index: number) => void;
  onMoveClick: (to: number) => void;
}

// ── Drawing constants ────────────────────────────────────────
const COLS = 13;         // 12 points + 1 bar column
const ROWS = 2;
const BAR_WIDTH_RATIO = 0.06;
const BEAR_OFF_RATIO = 0.06;

// Neon theme colours
const COLORS = {
  bg: '#0d0d1a',
  boardBg: '#111128',
  pointLight: '#1a3a4a',
  pointDark: '#0a1a2a',
  pointLightNeon: '#00ffe0',
  pointDarkNeon: '#7c3aed',
  border: '#00ffe066',
  barBg: '#0a0a18',
  barBorder: '#00ffe044',
  white: '#e0f7fa',
  whiteGlow: '#00ffe0',
  black: '#1a0533',
  blackGlow: '#9333ea',
  validMove: '#00ff9966',
  validMoveBorder: '#00ff99',
  selected: '#fbbf2488',
  selectedBorder: '#fbbf24',
  text: '#94a3b8',
  textBright: '#e2e8f0',
  pip: '#334155',
  bearOff: '#0f172a',
};

export default function Board({ state, onPointClick, onMoveClick }: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Maps a canvas click to a logical point index (0–23), or bar/bearoff
   */
  const getClickTarget = useCallback(
    (canvas: HTMLCanvasElement, x: number, y: number): number | null => {
      const W = canvas.width;
      const H = canvas.height;
      const barW = W * BAR_WIDTH_RATIO;
      const bearW = W * BEAR_OFF_RATIO;
      const boardW = W - barW - bearW;
      const colW = (boardW - barW) / 12;

      // Bear-off area is on the LEFT side (x=0..bearW)
      if (x < bearW) {
        // Return WHITE_BEAROFF or BLACK_BEAROFF so the caller can detect it
        return state.currentPlayer === 'white' ? WHITE_BEAROFF : BLACK_BEAROFF;
      }

      // Bar click? Bar starts at bearW + 6*colW
      const barLeft = colW * 6 + bearW;
      if (x >= barLeft && x <= barLeft + barW) {
        return state.currentPlayer === 'white' ? WHITE_BAR : BLACK_BAR;
      }

      // Map x to column index 0–11
      // Left six columns:  bearW + col*colW          (col 0..5)
      // Right six columns: bearW + barW + col*colW   (col 6..11)
      let col: number;
      const adjustedX = x - bearW;
      if (adjustedX < colW * 6) {
        // Left half: col 0..5
        col = Math.floor(adjustedX / colW);
      } else {
        // Right half: subtract barW offset, gives col 6..11
        col = Math.floor((adjustedX - barW) / colW);
        // Bug fix: do NOT add 6; the formula already produces 6–11
      }
      col = Math.max(0, Math.min(11, col));

      const isTop = y < H / 2;

      // Board layout:
      // Top row  (left→right): col 0→11  maps to indices 12→23
      // Bottom row (left→right): col 0→11  maps to indices 11→0
      let pointIndex: number;
      if (isTop) {
        pointIndex = 12 + col;
      } else {
        pointIndex = 11 - col;
      }

      return pointIndex;
    },
    [state.currentPlayer]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const target = getClickTarget(canvas, x, y);
      if (target === null) return;

      // Valid move destination (includes bear-off indices 26/27)?
      if (state.validMoves.includes(target)) {
        onMoveClick(target);
        return;
      }

      // Otherwise try to select a checker on that point
      // (ignore bear-off zone when no bear-off move available)
      if (target === WHITE_BEAROFF || target === BLACK_BEAROFF) return;
      onPointClick(target);
    },
    [state.validMoves, getClickTarget, onPointClick, onMoveClick]
  );

  const handleTouch = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      const target = getClickTarget(canvas, x, y);
      if (target === null) return;

      if (state.validMoves.includes(target)) {
        onMoveClick(target);
      } else if (target !== WHITE_BEAROFF && target !== BLACK_BEAROFF) {
        onPointClick(target);
      }
    },
    [state.validMoves, getClickTarget, onPointClick, onMoveClick]
  );

  // ── Draw ──────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const barW = W * BAR_WIDTH_RATIO;
    const bearW = W * BEAR_OFF_RATIO;
    const boardW = W - barW - bearW;
    const colW = (boardW - barW) / 12;
    const triH = H * 0.42;
    const checkerR = Math.min(colW * 0.4, triH / 11);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Board background
    ctx.fillStyle = COLORS.boardBg;
    ctx.fillRect(bearW, 0, boardW, H);

    // ── Draw 24 triangular points ──────────────────────────
    for (let col = 0; col < 12; col++) {
      const isLight = col % 2 === 0;
      const color = isLight ? COLORS.pointLight : COLORS.pointDark;
      const neon = isLight ? COLORS.pointLightNeon : COLORS.pointDarkNeon;

      // Adjust x for bar
      const xOffset = col < 6 ? bearW + col * colW : bearW + barW + col * colW;
      const cx = xOffset + colW / 2;

      // Top triangle (points 12–23)
      ctx.beginPath();
      ctx.moveTo(xOffset, 0);
      ctx.lineTo(xOffset + colW, 0);
      ctx.lineTo(cx, triH);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Neon tip glow
      const grad = ctx.createLinearGradient(cx, 0, cx, triH);
      grad.addColorStop(0, neon + '44');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();

      // Triangle outline
      ctx.strokeStyle = neon + '33';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bottom triangle (points 11–0)
      ctx.beginPath();
      ctx.moveTo(xOffset, H);
      ctx.lineTo(xOffset + colW, H);
      ctx.lineTo(cx, H - triH);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      const grad2 = ctx.createLinearGradient(cx, H, cx, H - triH);
      grad2.addColorStop(0, neon + '44');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fill();

      ctx.strokeStyle = neon + '33';
      ctx.stroke();
    }

    // ── Point numbers ──────────────────────────────────────
    ctx.font = `bold ${Math.max(9, colW * 0.22)}px monospace`;
    ctx.textAlign = 'center';
    for (let col = 0; col < 12; col++) {
      const xOffset = col < 6 ? bearW + col * colW : bearW + barW + col * colW;
      const cx = xOffset + colW / 2;
      // Top: points 13..24 (displayed as col 0=13, col 11=24)
      const topNum = 13 + col;
      // Bottom: points 12..1 (displayed as col 0=12, col 11=1)
      const botNum = 12 - col;

      ctx.fillStyle = COLORS.text;
      ctx.fillText(String(topNum), cx, 14);
      ctx.fillText(String(botNum), cx, H - 4);
    }

    // ── Bar ──────────────────────────────────────────────────
    const barLeft = bearW + colW * 6;
    ctx.fillStyle = COLORS.barBg;
    ctx.fillRect(barLeft, 0, barW, H);
    ctx.strokeStyle = COLORS.barBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(barLeft, 0, barW, H);

    // Center divider line
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bearW, H / 2);
    ctx.lineTo(W - bearW, H / 2);
    ctx.stroke();

    // ── Bear-off area ─────────────────────────────────────────
    ctx.fillStyle = COLORS.bearOff;
    ctx.fillRect(0, 0, bearW, H);
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, bearW, H);

    // Bear-off label
    ctx.save();
    ctx.translate(bearW / 2, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = COLORS.text;
    ctx.font = `${Math.max(8, bearW * 0.25)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('BEAR OFF', 0, 0);
    ctx.restore();

    // ── Helper: draw a checker ────────────────────────────────
    function drawChecker(cx: number, cy: number, color: 'white' | 'black', isSelected = false) {
      const r = checkerR;
      const fillColor = color === 'white' ? COLORS.white : COLORS.black;
      const glowColor = color === 'white' ? COLORS.whiteGlow : COLORS.blackGlow;
      const borderColor = isSelected ? COLORS.selectedBorder : glowColor;

      // Glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.5);
      glow.addColorStop(0, glowColor + '44');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Checker body
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
      if (color === 'white') {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#a0d8ef');
      } else {
        grad.addColorStop(0, '#3b1f5e');
        grad.addColorStop(1, '#0d0020');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Border / glow ring
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.shadowColor = borderColor;
      ctx.shadowBlur = isSelected ? 12 : 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner ring detail
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = color === 'white' ? COLORS.whiteGlow + '88' : COLORS.blackGlow + '88';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ── Helper: draw checkers on a point ─────────────────────
    function drawCheckersOnPoint(
      col: number,
      isTop: boolean,
      checkers: ('white' | 'black')[],
      selectedPt: number | null
    ) {
      if (checkers.length === 0) return;

      const xOffset = col < 6 ? bearW + col * colW : bearW + barW + col * colW;
      const cx = xOffset + colW / 2;
      const maxVisible = 5;
      const spacing = Math.min(checkerR * 2.1, triH / maxVisible);

      for (let i = 0; i < checkers.length; i++) {
        const visible = Math.min(i, maxVisible - 1);
        const cy = isTop
          ? checkerR + visible * spacing
          : H - checkerR - visible * spacing;

        // Determine point index for selection highlighting
        const ptIdx = isTop ? 12 + col : 11 - col;
        const isSelected = selectedPt === ptIdx;

        drawChecker(cx, cy, checkers[i], isSelected && i === checkers.length - 1);
      }

      // Stack count badge if > 5
      if (checkers.length > 5) {
        const labelY = isTop
          ? checkerR + (maxVisible - 1) * spacing
          : H - checkerR - (maxVisible - 1) * spacing;
        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${Math.max(8, checkerR * 0.8)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`×${checkers.length}`, cx, labelY + checkerR * 0.35);
      }
    }

    // ── Draw all board checkers ──────────────────────────────
    for (let col = 0; col < 12; col++) {
      const topIdx = 12 + col;  // indices 12–23
      const botIdx = 11 - col;  // indices 11–0

      drawCheckersOnPoint(col, true, state.points[topIdx].checkers as ('white' | 'black')[], state.selectedPoint);
      drawCheckersOnPoint(col, false, state.points[botIdx].checkers as ('white' | 'black')[], state.selectedPoint);
    }

    // ── Bar checkers ──────────────────────────────────────────
    const barCX = barLeft + barW / 2;
    if (state.bar.white > 0) {
      for (let i = 0; i < Math.min(state.bar.white, 4); i++) {
        drawChecker(barCX, H * 0.75 + i * checkerR * 2.2, 'white');
      }
      if (state.bar.white > 0) {
        ctx.fillStyle = COLORS.whiteGlow;
        ctx.font = `bold ${Math.max(8, checkerR * 0.8)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`${state.bar.white}`, barCX, H * 0.73);
      }
    }
    if (state.bar.black > 0) {
      for (let i = 0; i < Math.min(state.bar.black, 4); i++) {
        drawChecker(barCX, H * 0.25 - i * checkerR * 2.2, 'black');
      }
      if (state.bar.black > 0) {
        ctx.fillStyle = COLORS.blackGlow;
        ctx.font = `bold ${Math.max(8, checkerR * 0.8)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`${state.bar.black}`, barCX, H * 0.27);
      }
    }

    // ── Valid move indicators ─────────────────────────────────
    const hasBearOffMove = state.validMoves.includes(WHITE_BEAROFF) || state.validMoves.includes(BLACK_BEAROFF);

    // Glow the bear-off zone when a bear-off move is available
    if (hasBearOffMove) {
      ctx.strokeStyle = COLORS.validMoveBorder;
      ctx.lineWidth = 3;
      ctx.shadowColor = COLORS.validMoveBorder;
      ctx.shadowBlur = 16;
      ctx.strokeRect(2, 2, bearW - 4, H - 4);
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.validMove;
      ctx.fillRect(2, 2, bearW - 4, H - 4);
      // Label
      ctx.save();
      ctx.translate(bearW / 2, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = COLORS.validMoveBorder;
      ctx.font = `bold ${Math.max(9, bearW * 0.22)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('BEAR OFF!', 0, 0);
      ctx.restore();
    }

    for (const dest of state.validMoves) {
      if (dest >= 0 && dest < 24) {
        const col = dest >= 12 ? dest - 12 : 11 - dest;
        const isTop = dest >= 12;
        const xOffset = col < 6 ? bearW + col * colW : bearW + barW + col * colW;
        const cx = xOffset + colW / 2;

        const numCheckers = state.points[dest].checkers.length;
        const spacing = Math.min(checkerR * 2.1, triH / 5);
        const stackY = isTop
          ? checkerR + numCheckers * spacing
          : H - checkerR - numCheckers * spacing;

        // Circle indicator
        ctx.beginPath();
        ctx.arc(cx, stackY, checkerR * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.validMove;
        ctx.fill();
        ctx.strokeStyle = COLORS.validMoveBorder;
        ctx.lineWidth = 2;
        ctx.shadowColor = COLORS.validMoveBorder;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // ── Bear-off checker count ────────────────────────────────
    const bOff = (n: number, color: 'white' | 'black', y: number) => {
      if (n === 0) return;
      for (let i = 0; i < Math.min(n, 8); i++) {
        drawChecker(bearW / 2, y - i * checkerR * 2.2, color);
      }
      ctx.fillStyle = color === 'white' ? COLORS.whiteGlow : COLORS.blackGlow;
      ctx.font = `bold ${Math.max(8, checkerR * 0.8)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`${n}`, bearW / 2, y + checkerR * 1.8);
    };
    bOff(state.borneOff.white, 'white', H - checkerR - 4);
    bOff(state.borneOff.black, 'black', checkerR + 4);

    // ── Board border ──────────────────────────────────────────
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.border;
    ctx.shadowBlur = 8;
    ctx.strokeRect(1, 1, W - 2, H - 2);
    ctx.shadowBlur = 0;

    // ── Current player indicator ─────────────────────────────
    const indicatorColor =
      state.currentPlayer === 'white' ? COLORS.whiteGlow : COLORS.blackGlow;
    ctx.fillStyle = indicatorColor;
    ctx.shadowColor = indicatorColor;
    ctx.shadowBlur = 12;
    const indicatorY = state.currentPlayer === 'white' ? H - 8 : 8;
    ctx.fillRect(bearW + 4, indicatorY - 3, boardW - barW - 8, 3);
    ctx.shadowBlur = 0;

  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={460}
      onClick={handleClick}
      onTouchStart={handleTouch}
      className="w-full h-auto max-w-full cursor-pointer touch-none rounded-lg"
      style={{ imageRendering: 'pixelated' }}
      aria-label="Backgammon board"
    />
  );
}
