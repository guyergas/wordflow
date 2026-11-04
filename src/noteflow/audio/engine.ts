// Audio Engine — Web Audio, scheduled on the audio clock (never setTimeout for musical timing).
// Piano: sampled (Salamander Grand, via tonejs-instruments), one sample every 3 semitones, repitched.

const sampleUrls = import.meta.glob('../assets/samples/*.mp3', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

const NAME_TO_PC: Record<string, number> = { C: 0, Cs: 1, D: 2, Ds: 3, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11 };

const SAMPLES: { midi: number; url: string }[] = Object.entries(sampleUrls).map(([path, url]) => {
  const m = /\/([A-G]s?)(\d)\.mp3$/.exec(path)!;
  return { midi: (Number(m[2]) + 1) * 12 + NAME_TO_PC[m[1]], url };
}).sort((a, b) => a.midi - b.midi);

/** data: URIs (single-file preview) are decoded locally; everything else is fetched (and precached by the SW). */
async function loadBytes(url: string): Promise<ArrayBuffer> {
  if (url.startsWith('data:')) {
    const b64 = url.slice(url.indexOf(',') + 1);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }
  return (await fetch(url)).arrayBuffer();
}

/** A short silent WAV as a data URI (8 kHz mono, 16-bit). */
function silentWav(seconds = 0.5): string {
  const rate = 8000, n = Math.floor(rate * seconds), bytes = 44 + n * 2;
  const v = new DataView(new ArrayBuffer(bytes));
  const w = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, bytes - 8, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n * 2, true);
  let bin = '';
  const u8 = new Uint8Array(v.buffer);
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

export interface AudioStatus {
  supported: boolean;
  state: string;
  samples: number;
  totalSamples: number;
  mediaUnlocked: boolean;
  sampleRate: number | null;
  lastError: string | null;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<number, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private media: HTMLAudioElement | null = null;
  private mediaUnlocked = false;
  private lastError: string | null = null;
  volume = 0.8;
  feedback = true;
  /** Audio-clock time until which the app's own sound is audible (the microphone ignores it). */
  private busyUntil = 0;
  private tone: BiquadFilterNode | null = null;
  private evening = false;

  private active: { pc: number; from: number; until: number }[] = [];

  /** True while a note the app played is still ringing (optionally: one with this note's name, in any octave). */
  isSounding(m?: number): boolean {
    if (!this.ctx) return false;
    const now = this.ctx.currentTime;
    if (m == null) return now < this.busyUntil;
    this.active = this.active.filter((a) => a.until > now);
    const pc = ((m % 12) + 12) % 12;
    return this.active.some((a) => a.pc === pc && a.from <= now + 0.03);
  }

  /** Evening mode: warmer (softer highs) and quieter. */
  setEvening(on: boolean): void {
    this.evening = on;
    if (this.tone && this.ctx) this.tone.frequency.setTargetAtTime(on ? 1900 : 18000, this.ctx.currentTime, 0.05);
    this.setVolume(this.volume);
  }

  status(): AudioStatus {
    return {
      supported: !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext),
      state: this.ctx?.state ?? 'not-created',
      samples: this.buffers.size,
      totalSamples: SAMPLES.length,
      mediaUnlocked: this.mediaUnlocked,
      sampleRate: this.ctx?.sampleRate ?? null,
      lastError: this.lastError,
    };
  }

  /**
   * iOS routes Web Audio through the "ambient" category, which the silent switch mutes.
   * A looping silent <audio> element moves the page to the "playback" category, so
   * Web Audio is heard even with the switch on. Must start inside a user gesture.
   */
  private startMediaKeepAlive(): void {
    try {
      if (!this.media) {
        const el = document.createElement('audio');
        el.setAttribute('playsinline', '');
        el.setAttribute('x-webkit-airplay', 'deny');
        el.preload = 'auto';
        el.loop = true;
        el.volume = 0.01;
        el.src = silentWav();
        this.media = el;
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) this.media?.pause();
        });
      }
      if (this.media.paused) {
        const p = this.media.play();
        if (p) p.then(() => { this.mediaUnlocked = true; }).catch((e) => { this.lastError = `media: ${String(e?.name ?? e)}`; });
      }
    } catch (e) {
      this.lastError = `media: ${String(e)}`;
    }
  }

  get context(): AudioContext | null { return this.ctx; }

  get unlocked(): boolean { return this.ctx?.state === 'running'; }

  /** Must be called from a user gesture (iOS). Safe to call repeatedly. */
  unlock(): void {
    this.startMediaKeepAlive();
    try {
      // Safari 17+: play through the ringer/silent switch like a music app.
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'playback';
    } catch { /* ignore */ }
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      try {
        this.ctx = new AC({ latencyHint: 'interactive' });
      } catch {
        this.ctx = new AC();
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume * (this.evening ? 0.6 : 1);
      this.tone = this.ctx.createBiquadFilter();
      this.tone.type = 'lowpass';
      this.tone.frequency.value = this.evening ? 1900 : 18000;
      this.tone.Q.value = 0.5;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -10;
      this.master.connect(this.tone).connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state !== 'running') {
      this.ctx.resume().catch((e) => { this.lastError = `resume: ${String(e?.name ?? e)}`; });
      // A silent buffer inside the gesture fully unlocks older iOS versions.
      const b = this.ctx.createBuffer(1, 1, 22050);
      const s = this.ctx.createBufferSource();
      s.buffer = b;
      s.connect(this.ctx.destination);
      s.start(0);
    }
    void this.load();
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v * (this.evening ? 0.6 : 1), this.ctx.currentTime, 0.02);
  }

  load(): Promise<void> {
    if (!this.ctx) return Promise.resolve();
    if (!this.loading) {
      const ctx = this.ctx;
      this.loading = Promise.all(
        SAMPLES.map(async (s) => {
          try {
            const buf = await ctx.decodeAudioData(await loadBytes(s.url));
            this.buffers.set(s.midi, buf);
          } catch (e) {
            this.lastError = `decode: ${String((e as Error)?.name ?? e)}`; // falls back to synth for this range
          }
        }),
      ).then(() => undefined);
    }
    return this.loading;
  }

  private nearest(m: number): { midi: number; buf: AudioBuffer } | null {
    let best: { midi: number; buf: AudioBuffer } | null = null;
    for (const [sm, buf] of this.buffers) {
      if (!best || Math.abs(sm - m) < Math.abs(best.midi - m)) best = { midi: sm, buf };
    }
    return best;
  }

  /** Install document-level gesture listeners so every tap re-arms audio (iOS interrupts it on calls, lock, app switch). */
  installGestureUnlock(): void {
    const on = () => {
      if (!this.ctx || this.ctx.state !== 'running' || (this.media && this.media.paused)) this.unlock();
    };
    for (const ev of ['touchend', 'click', 'keydown']) document.addEventListener(ev, on, { capture: true, passive: true });
  }

  /** Play a piano note. `when` is in audio-clock seconds (default: now). */
  playNote(m: number, duration = 1.2, when?: number, velocity = 0.9): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = when ?? ctx.currentTime;
    this.busyUntil = Math.max(this.busyUntil, t + duration + 0.45);
    this.active.push({ pc: ((m % 12) + 12) % 12, from: t, until: t + duration + 0.45 });
    const s = this.nearest(m);
    const g = ctx.createGain();
    g.connect(this.master);
    if (s) {
      const src = ctx.createBufferSource();
      src.buffer = s.buf;
      src.playbackRate.value = Math.pow(2, (m - s.midi) / 12);
      src.connect(g);
      g.gain.setValueAtTime(velocity, t);
      g.gain.setTargetAtTime(0, t + duration, 0.25);
      src.start(t);
      src.stop(t + duration + 1.5);
      this.track(src, t);
    } else {
      // Synth fallback while samples load: soft decaying tone with a few partials.
      const f = 440 * Math.pow(2, (m - 69) / 12);
      for (const [mult, amp] of [[1, 0.5], [2, 0.18], [3, 0.08]] as const) {
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.frequency.value = f * mult;
        og.gain.setValueAtTime(0, t);
        og.gain.linearRampToValueAtTime(amp * velocity, t + 0.008);
        og.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.6);
        o.connect(og).connect(g);
        o.start(t);
        o.stop(t + duration + 0.7);
        this.track(o, t);
      }
    }
  }

  /** Gentle, low "not quite" sound — never harsh. */
  playWrong(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.feedback) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(196, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.25);
  }

  /** Short neutral tick for test mode (does not reveal correctness). */
  playTick(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.feedback) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 1400;
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.05);
  }

  private scheduled = new Set<AudioScheduledSourceNode>();

  /** Remember sources that start in the future so they can be cancelled (stop, pause, leaving a screen). */
  private track(node: AudioScheduledSourceNode, when: number): void {
    if (!this.ctx || when <= this.ctx.currentTime + 0.02) return;
    this.scheduled.add(node);
    node.addEventListener('ended', () => this.scheduled.delete(node));
  }

  /** Stops everything scheduled ahead (melody playback, metronome). */
  cancelScheduled(): void {
    for (const n of this.scheduled) {
      try { n.stop(); } catch { /* already stopped */ }
    }
    this.scheduled.clear();
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.busyUntil = Math.min(this.busyUntil, now + 0.5);
      this.active = this.active.filter((a) => a.from <= now).map((a) => ({ ...a, until: Math.min(a.until, now + 0.5) }));
    }
  }

  /** Schedules note events (beats from `start`, audio-clock seconds). Returns the end time. */
  playEvents(events: { midi: number; at: number; beats: number; velocity: number }[], bpm: number, start?: number): number {
    const ctx = this.ctx;
    if (!ctx) return 0;
    const t0 = start ?? ctx.currentTime + 0.12;
    const beat = 60 / bpm;
    let end = t0;
    for (const e of events) {
      const t = t0 + e.at * beat;
      const len = Math.max(0.18, e.beats * beat * 0.95);
      this.playNote(e.midi, len, t, e.velocity);
      end = Math.max(end, t + e.beats * beat);
    }
    return end;
  }

  /** Metronome click on the audio clock. Accent = first beat of the bar. */
  click(when: number, accent = false, volume = 1): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = accent ? 1760 : 1320;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime((accent ? 0.22 : 0.14) * volume, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.045);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = accent ? 1800 : 1400;
    o.connect(f).connect(g).connect(this.master);
    o.start(when);
    o.stop(when + 0.06);
    this.track(o, when);
  }

  /** Short percussive "tok" used to demonstrate a rhythm. */
  tok(when: number, beats = 1, beatSec = 0.8): void {
    this.playNote(72, Math.max(0.12, Math.min(beats * beatSec * 0.85, 1.6)), when, 0.7);
  }

  /** Plays a list of notes (midi or null = rest) either with their rhythm at a tempo, or one every `gapSec`. Returns the end time. */
  playSequence(notes: { midi: number | null; beats: number }[], opts: { bpm?: number; gapSec?: number }): number {
    const ctx = this.ctx;
    if (!ctx) return 0;
    this.cancelScheduled();
    let t = ctx.currentTime + 0.12;
    const beat = 60 / (opts.bpm ?? 90);
    for (const n of notes) {
      const len = opts.gapSec ?? n.beats * beat;
      if (n.midi != null) this.playNote(n.midi, opts.gapSec ? Math.max(0.25, opts.gapSec * 0.95) : Math.max(0.2, len * 0.95), t, 0.85);
      t += opts.gapSec ? (n.midi == null ? 0 : opts.gapSec) : len;
    }
    return t;
  }

  /** A small rising arpeggio for the end of a session / a new record. */
  playFlourish(): void {
    const ctx = this.ctx;
    if (!ctx || !this.feedback) return;
    const t = ctx.currentTime + 0.05;
    [60, 64, 67, 72].forEach((m, i) => this.playNote(m, 0.6, t + i * 0.09, 0.55));
  }
}

export const audio = new AudioEngine();
