// Storage, speech and sound. Everything here fails soft: a missing capability never breaks the lesson.
import { IS_THAI, STORAGE_KEY as KEY } from './course';
import { initialState, State } from './engine';
import { audioName, THAI_AUDIO } from './thai';
let memory: string | null = null;

export function load(): State {
  let raw: string | null = memory;
  try { raw = localStorage.getItem(KEY) ?? raw; } catch { /* memory only */ }
  if (!raw) return initialState();
  try {
    const parsed = JSON.parse(raw);
    const base = initialState();
    return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } };
  } catch { return initialState(); }
}

export function save(st: State) {
  memory = JSON.stringify(st);
  try { localStorage.setItem(KEY, memory); } catch { /* memory only */ }
}

export async function askPersistence() {
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch { /* optional */ }
}

// ---------- Speech ----------
let voices: SpeechSynthesisVoice[] = [];
const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

function refreshVoices() { const s = synth(); if (s) voices = s.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en')); }
if (synth()) { refreshVoices(); try { synth()!.addEventListener('voiceschanged', refreshVoices); } catch { /* old Safari */ } }

export const englishVoices = () => { refreshVoices(); return voices; };
export const canSpeak = () => IS_THAI || !!synth();

function bestVoice(name: string) {
  refreshVoices();
  const chosen = voices.find((v) => v.name === name);
  if (chosen) return chosen;
  const rank = (v: SpeechSynthesisVoice) => (/samantha|ava|allison|google us|jenny|aria/i.test(v.name) ? 3 : 0) + (/en[-_]us/i.test(v.lang) ? 2 : 0) + (v.localService ? 1 : 0);
  return [...voices].sort((a, b) => rank(b) - rank(a))[0];
}

// ---------- Thai recordings ----------
const THAI_TEXT = new Map(THAI_AUDIO.map((a) => [a.en, a.th]));
const recordings = new Map<string, Promise<AudioBuffer>>();
let playing: AudioBufferSourceNode | null = null;
let turn = 0;

function recording(th: string, c: AudioContext) {
  let p = recordings.get(th);
  if (!p) {
    p = fetch(`audio/th/${audioName(th)}.mp3`)
      .then((r) => { if (!r.ok) throw new Error('missing'); return r.arrayBuffer(); })
      .then((b) => c.decodeAudioData(b));
    p.catch(() => recordings.delete(th));
    recordings.set(th, p);
  }
  return p;
}

/** The phone's Thai voice, for a recording that is not available. */
function speakThaiVoice(th: string) {
  const s = synth();
  if (!s) return;
  try {
    s.cancel();
    const u = new SpeechSynthesisUtterance(th);
    u.lang = 'th-TH';
    const v = s.getVoices().find((o) => o.lang.toLowerCase().replace('_', '-').startsWith('th'));
    if (v) u.voice = v;
    u.rate = 0.85;
    s.speak(u);
  } catch { /* no audio */ }
}

function speakThai(text: string) {
  const th = THAI_TEXT.get(text);
  if (!th) return;
  const mine = ++turn;
  try { playing?.stop(); } catch { /* already over */ }
  playing = null;
  // On iPhone this lets the recording play when the silent switch is on, as a video would.
  try { (navigator as unknown as { audioSession?: { type: string } }).audioSession!.type = 'playback'; } catch { /* other phones */ }
  const c = audio();
  if (!c) { speakThaiVoice(th); return; }
  recording(th, c).then((buffer) => {
    if (mine !== turn) return;
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.connect(c.destination);
    src.start();
    playing = src;
  }).catch(() => { if (mine === turn) speakThaiVoice(th); });
}

export function speak(text: string, opts: { voice?: string; rate?: number } = {}) {
  if (IS_THAI) { speakThai(text); return; }
  const s = synth();
  if (!s) return;
  try {
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    const v = bestVoice(opts.voice ?? '');
    if (v) u.voice = v;
    u.rate = opts.rate ?? 0.9;
    s.speak(u);
  } catch { /* no audio */ }
}

// ---------- Sound effects ----------
let ctx: AudioContext | null = null;
function audio() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}
function tone(freq: number, at: number, dur: number, vol = 0.08, type: OscillatorType = 'triangle') {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  const t = c.currentTime + at;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
export const sfx = {
  tap: () => tone(620, 0, 0.07, 0.05),
  good: () => { tone(660, 0, 0.14); tone(880, 0.09, 0.2); },
  bad: () => tone(196, 0, 0.2, 0.06, 'sine'),
  flip: () => tone(420, 0, 0.09, 0.05),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.32, 0.08)),
};
