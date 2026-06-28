let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    audioCtx ??= new AudioContext();
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  volume = 0.25,
  type: OscillatorType = 'sine',
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.value = freq;

  const t = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.start(t);
  osc.stop(t + duration);
}

/** Double "ding-dong" — new order in admin */
export function playNewOrder(): void {
  const ctx = getCtx();
  if (!ctx) return;
  // First tone + octave harmonic
  playTone(ctx, 880, 0,    0.7,  0.55);
  playTone(ctx, 440, 0,    0.7,  0.25);
  // Second tone + octave harmonic
  playTone(ctx, 660, 0.55, 0.85, 0.55);
  playTone(ctx, 330, 0.55, 0.85, 0.25);
}

/** Ascending chime — status changed for customer */
export function playStatusChange(): void {
  const ctx = getCtx();
  if (!ctx) return;
  playTone(ctx, 528, 0,    0.5,  0.45);
  playTone(ctx, 660, 0.35, 0.55, 0.42);
  playTone(ctx, 792, 0.68, 0.7,  0.38);
}
