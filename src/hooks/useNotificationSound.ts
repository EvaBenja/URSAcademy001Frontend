import { useRef, useCallback } from 'react';

// Génère un son "ding ding" via la Web Audio API (pas de fichier audio nécessaire)
// Deux bips espacés de 300ms, fréquence agréable (880Hz)
export function useNotificationSound() {
  const audioCtx = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx.current;
  };

  const bip = useCallback((ctx: AudioContext, startTime: number, freq = 880, duration = 0.18) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    // Envelope : attaque rapide, decay doux
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }, []);

  const play = useCallback(() => {
    try {
      const ctx = getCtx();
      // Résoudre le blocage autoplay des navigateurs mobiles
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      bip(ctx, now,        880, 0.18); // premier bip
      bip(ctx, now + 0.32, 1100, 0.22); // deuxième bip plus aigu
    } catch (e) {
      // Silencieux si Web Audio non supporté
    }
  }, [bip]);

  return { play };
}

// Hook de polling qui détecte les nouveaux items et joue un son
// Utilisation :
//   usePollingWithSound(fetchFn, items, key, setItems, play, 20000)
export function usePrevCount(current: number, onIncrease: () => void) {
  const prevRef = useRef<number | null>(null);
  if (prevRef.current !== null && current > prevRef.current) {
    onIncrease();
  }
  prevRef.current = current;
}
