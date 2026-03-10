// ============================================================
// Hook: sound effect management
// ============================================================

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  playRoll,
  playMove,
  playHit,
  playWin,
  playLose,
  playIllegal,
} from '@/utils/soundUtils';
import type { SoundType } from '@/lib/types';

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useLocalStorage('bgSoundEnabled', true);

  const play = useCallback(
    (type: SoundType) => {
      switch (type) {
        case 'roll':    playRoll(soundEnabled);    break;
        case 'move':    playMove(soundEnabled);    break;
        case 'hit':     playHit(soundEnabled);     break;
        case 'win':     playWin(soundEnabled);     break;
        case 'lose':    playLose(soundEnabled);    break;
        case 'illegal': playIllegal(soundEnabled); break;
      }
    },
    [soundEnabled]
  );

  const toggle = useCallback(() => setSoundEnabled((v) => !v), [setSoundEnabled]);

  return { soundEnabled, toggle, play };
}
