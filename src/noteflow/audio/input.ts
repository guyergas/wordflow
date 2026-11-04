// External note input: a real piano heard through the microphone, or a MIDI keyboard (where the browser supports Web MIDI).
// Notes the app itself is playing are ignored (the microphone hears the speaker too).

import { audio } from './engine';
import { Detection, detectPitch, OnsetTracker } from './pitch-detect';

export type InputState = 'off' | 'starting' | 'on' | 'denied' | 'unsupported' | 'error';

export interface NoteEvent {
  midi: number;
  source: 'mic' | 'midi';
  /** performance.now() when the note was detected. */
  at: number;
}

type NoteListener = (e: NoteEvent) => void;
type FrameListener = (d: Detection & { midi: number | null; suppressed: boolean }) => void;
type StateListener = (s: InputState) => void;

class NoteInput {
  state: InputState = 'off';
  midiState: 'off' | 'on' | 'unsupported' = 'off';
  midiDevices: string[] = [];
  lastError: string | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private timer: number | undefined;
  private buf: Float32Array<ArrayBuffer> | null = null;
  private tracker = new OnsetTracker(3, 0.82);
  private noteL = new Set<NoteListener>();
  private frameL = new Set<FrameListener>();
  private stateL = new Set<StateListener>();

  get micSupported(): boolean {
    return !!navigator.mediaDevices?.getUserMedia;
  }

  get midiSupported(): boolean {
    return typeof (navigator as Navigator & { requestMIDIAccess?: unknown }).requestMIDIAccess === 'function';
  }

  onNote(fn: NoteListener): () => void { this.noteL.add(fn); return () => { this.noteL.delete(fn); }; }
  onFrame(fn: FrameListener): () => void { this.frameL.add(fn); return () => { this.frameL.delete(fn); }; }
  onState(fn: StateListener): () => void { this.stateL.add(fn); return () => { this.stateL.delete(fn); }; }

  private setState(s: InputState): void {
    this.state = s;
    for (const f of this.stateL) f(s);
  }

  private emit(e: NoteEvent): void {
    for (const f of this.noteL) f(e);
  }

  /** Starts listening (asks for microphone permission the first time). Safe to call repeatedly. */
  async start(): Promise<InputState> {
    void this.startMidi();
    if (this.state === 'on' || this.state === 'starting') return this.state;
    if (!this.micSupported) { this.setState('unsupported'); return this.state; }
    this.setState('starting');
    try {
      audio.unlock();
      const ctx = audio.context;
      if (!ctx) throw new Error('no audio context');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      });
      try {
        const nav = navigator as Navigator & { audioSession?: { type: string } };
        if (nav.audioSession) nav.audioSession.type = 'play-and-record';
      } catch { /* ignore */ }
      this.source = ctx.createMediaStreamSource(this.stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.source.connect(this.analyser);
      this.buf = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));
      this.tracker.reset();
      this.timer = window.setInterval(() => this.tick(), 30);
      this.setState('on');
    } catch (e) {
      const name = (e as Error)?.name ?? '';
      this.lastError = String((e as Error)?.message ?? e);
      this.setState(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error');
    }
    return this.state;
  }

  stop(): void {
    window.clearInterval(this.timer);
    this.timer = undefined;
    try { this.source?.disconnect(); } catch { /* */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.source = null;
    this.analyser = null;
    try {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'playback';
    } catch { /* ignore */ }
    if (this.state === 'on' || this.state === 'starting') this.setState('off');
  }

  private tick(): void {
    const an = this.analyser;
    const ctx = audio.context;
    if (!an || !this.buf || !ctx) return;
    an.getFloatTimeDomainData(this.buf);
    const det = detectPitch(this.buf, ctx.sampleRate, { minHz: 60, maxHz: 2200 });
    let note = this.tracker.push(det);
    // The microphone hears the app too: drop notes with the same name as something the app is sounding,
    // and let them through as soon as the app's note has faded (if the piano is still ringing).
    const suppressed = note != null && audio.isSounding(note);
    if (suppressed) { this.tracker.forget(); note = null; }
    const m = det.freq ? Math.round(69 + 12 * Math.log2(det.freq / 440)) : null;
    for (const f of this.frameL) f({ ...det, midi: det.clarity >= 0.82 ? m : null, suppressed });
    if (note != null && note >= 21 && note <= 108) this.emit({ midi: note, source: 'mic', at: performance.now() });
  }

  private midiAccess: unknown = null;

  async startMidi(): Promise<void> {
    if (this.midiAccess || !this.midiSupported) { if (!this.midiSupported) this.midiState = 'unsupported'; return; }
    try {
      const nav = navigator as Navigator & { requestMIDIAccess: () => Promise<MIDIAccessLike> };
      const access = await nav.requestMIDIAccess();
      this.midiAccess = access;
      const bind = () => {
        this.midiDevices = [];
        access.inputs.forEach((inp) => {
          this.midiDevices.push(inp.name ?? 'MIDI');
          inp.onmidimessage = (ev) => {
            const [st, note, vel] = ev.data ?? [];
            if ((st & 0xf0) === 0x90 && vel > 0) this.emit({ midi: note, source: 'midi', at: performance.now() });
          };
        });
        this.midiState = this.midiDevices.length ? 'on' : 'off';
        for (const f of this.stateL) f(this.state);
      };
      access.onstatechange = bind;
      bind();
    } catch {
      this.midiState = 'unsupported';
    }
  }
}

interface MIDIInputLike { name?: string | null; onmidimessage: ((e: { data: Uint8Array | null }) => void) | null }
interface MIDIAccessLike { inputs: Map<string, MIDIInputLike>; onstatechange: (() => void) | null }

export const noteInput = new NoteInput();
