# NeonGammon 🎲

A sleek, neon-glassmorphism backgammon game built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. Play against an AI opponent with three difficulty levels, right in your browser.

---

## Features

- **Full backgammon rules** — standard setup, bar re-entry, bearing off, doubles (4 moves), hit detection, blocked-move detection
- **AI opponent** — three difficulty tiers:
  - **Easy** — random valid moves
  - **Medium** — heuristic AI (hits blots, makes points, escapes)
  - **Hard** — minimax search with pip-count evaluation
- **Match scoring** — first to 7 points wins the match; per-game score tracked with "Next Round" flow
- **Animated dice** — rolls visually, used dice are crossed out
- **Sound effects** — Web Audio API (no external files): roll, move, hit, win, lose; toggle on/off with persistent preference
- **Pause / resume** — overlay with difficulty selection for next game
- **End screen** — animated win/lose modal with match score and restart/next-round buttons
- **Keyboard shortcuts** — `R` to roll, `P` to pause/resume
- **Touch support** — fully playable on mobile / tablet
- **Responsive layout** — sidebar collapses below board on small screens; no horizontal scroll
- **Neon glassmorphism theme** — dark background, neon cyan (you) and violet (AI), glow effects throughout
- **LocalStorage persistence** — difficulty preference and sound toggle survive page refresh
- **Vercel-ready** — zero extra configuration needed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Board rendering | HTML5 Canvas |
| Icons | Lucide React |
| Sound | Web Audio API (procedural) |
| Deployment | Vercel |

---

## Controls

### Desktop
| Key / Action | Effect |
|---|---|
| `R` | Roll dice |
| `P` | Pause / Resume |
| Click checker | Select it (valid moves highlight) |
| Click glowing spot | Move selected checker there |
| Roll button | Roll dice |
| End Turn button | Pass turn when no moves remain |

### Mobile / Touch
- Tap a checker to select it
- Tap a glowing destination to move
- Use on-screen Roll and End Turn buttons
- Sound and pause buttons in the controls panel

---

## How to Run Locally

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd backgammon

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:3000
```

Requires **Node.js 18+**.

---

## Deploy to Vercel

```bash
# Option A: Vercel CLI
npm i -g vercel
vercel

# Option B: Push to GitHub and import at vercel.com/new
# Framework: Next.js — auto-detected, no config needed
```

---

## Project Structure

```
src/
  app/
    layout.tsx        # Root layout + metadata
    page.tsx          # Main game page
    globals.css       # Global styles + neon theme vars
  components/
    game/
      Board.tsx       # HTML5 Canvas board renderer
      Dice.tsx        # Animated dice faces
    ui/
      GameControls.tsx    # Roll/EndTurn/Pause/Sound buttons
      ScorePanel.tsx      # Match score display
      DifficultySelect.tsx # Easy/Medium/Hard picker
      EndScreen.tsx       # Win/lose animated overlay
      PauseMenu.tsx       # Pause overlay
  hooks/
    useGameState.ts   # Central reducer + all game actions
    useSound.ts       # Sound management hook
    useLocalStorage.ts # Persistent preferences hook
  lib/
    types.ts          # All TypeScript interfaces
    constants.ts      # Board layout + initial position
    backgammon.ts     # Rules engine (moves, validation, bear-off)
    aiLogic.ts        # AI logic (easy/medium/hard)
  utils/
    soundUtils.ts     # Web Audio API sound generators
```

---

## Game Rules Summary

1. Each player has 15 checkers. White moves from high-numbered points to low; Black moves low to high.
2. Roll two dice; move checkers that many points each (or use both on one checker).
3. Doubles give four moves of the same value.
4. You cannot land on a point with 2+ opponent checkers.
5. Landing on a single opponent checker (blot) hits it — it goes to the bar.
6. A checker on the bar must re-enter in the opponent's home board before any other move.
7. Once all your checkers are in your home board (points 1–6 for White), you may bear off.
8. First to bear off all 15 checkers wins the game and earns 1 match point.
9. First to reach 7 match points wins the match.
