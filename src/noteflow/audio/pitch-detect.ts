// Monophonic pitch detection (YIN, de Cheveigné & Kawahara 2002) — pure functions, unit-tested with synthetic tones.

export interface Detection {
  /** Hz, or null when no clear pitch. */
  freq: number | null;
  /** 0..1 (1 = perfectly periodic). */
  clarity: number;
  /** RMS level of the frame. */
  rms: number;
}

export function rms(buf: Float32Array): number {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
}

/**
 * YIN pitch estimate for one frame. `minHz`/`maxHz` bound the search (piano C2–C7 by default).
 * Returns freq=null when the frame is too quiet or not periodic enough.
 */
export function detectPitch(buf: Float32Array, sampleRate: number, opts: { minHz?: number; maxHz?: number; threshold?: number; minRms?: number } = {}): Detection {
  const minHz = opts.minHz ?? 60;
  const maxHz = opts.maxHz ?? 2200;
  const threshold = opts.threshold ?? 0.15;
  const level = rms(buf);
  if (level < (opts.minRms ?? 0.006)) return { freq: null, clarity: 0, rms: level };

  const maxTau = Math.min(Math.floor(sampleRate / minHz), Math.floor(buf.length / 2));
  const minTau = Math.max(2, Math.floor(sampleRate / maxHz));
  const W = buf.length - maxTau;
  const d = new Float32Array(maxTau + 1);
  // Difference function.
  for (let tau = 1; tau <= maxTau; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) {
      const x = buf[i] - buf[i + tau];
      s += x * x;
    }
    d[tau] = s;
  }
  // Cumulative mean normalised difference.
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    run += d[tau];
    cmnd[tau] = run ? (d[tau] * tau) / run : 1;
  }
  // First dip under the threshold (then walk to its local minimum).
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (cmnd[t] < threshold) {
      while (t + 1 <= maxTau && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) {
    // No dip under the threshold: take the global minimum if it is still fairly clear.
    let best = minTau;
    for (let t = minTau; t <= maxTau; t++) if (cmnd[t] < cmnd[best]) best = t;
    if (cmnd[best] > 0.35) return { freq: null, clarity: 1 - cmnd[best], rms: level };
    tau = best;
  }
  // Parabolic interpolation around tau.
  let better = tau;
  if (tau > 1 && tau < maxTau) {
    const a = cmnd[tau - 1], b = cmnd[tau], c = cmnd[tau + 1];
    const den = a + c - 2 * b;
    if (den) better = tau + (a - c) / (2 * den);
  }
  return { freq: sampleRate / better, clarity: Math.max(0, 1 - cmnd[tau]), rms: level };
}

export function freqToMidi(f: number): number {
  return 69 + 12 * Math.log2(f / 440);
}

/**
 * Turns a stream of frame detections into note events: a note is reported once it has been stable for
 * `stableFrames` frames, and again only after it changes or is struck again (a clear rise in level).
 */
export class OnsetTracker {
  private candidate: number | null = null;
  private count = 0;
  private emitted: number | null = null;
  private floor = 1;
  private lastRms = 0;
  constructor(private stableFrames = 3, private minClarity = 0.8) {}

  reset(): void {
    this.candidate = null;
    this.count = 0;
    this.emitted = null;
    this.floor = 1;
  }

  /** Forget the last reported note, so it is reported again on the next stable frames. */
  forget(): void {
    this.emitted = null;
  }

  /** Feed one frame; returns a MIDI note when a new note starts. */
  push(det: Detection): number | null {
    const rising = det.rms > this.lastRms * 1.8 && det.rms > 0.02;
    this.lastRms = det.rms;
    this.floor = Math.min(this.floor, det.rms);
    if (det.freq == null || det.clarity < this.minClarity) {
      this.candidate = null;
      this.count = 0;
      // Silence between notes lets the same note be played again.
      if (det.rms < 0.01) this.emitted = null;
      return null;
    }
    const m = Math.round(freqToMidi(det.freq));
    if (rising && this.emitted === m) { this.emitted = null; this.count = 0; }
    if (m === this.candidate) this.count++;
    else { this.candidate = m; this.count = 1; }
    if (this.count >= this.stableFrames && m !== this.emitted) {
      this.emitted = m;
      this.floor = det.rms;
      return m;
    }
    return null;
  }
}
