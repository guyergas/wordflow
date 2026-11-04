// Looper: up to four tracks recorded over a repeating loop of 1, 2 or 4 bars, played back on the audio clock.
// Recording starts at the top of the loop (with a one-bar count-in when stopped) and lasts one pass; the loop keeps
// playing so the next track can be layered on top.

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { pitchFromMidi } from '../../engine/exercise';
import { pitchName } from '../../music/pitch';
import { Icon, Seg } from './ui';

interface LoopNote { midi: number; pos: number; beats: number; loop: number }
interface Track { notes: LoopNote[]; muted: boolean }

export interface LooperHandle { note: (midi: number) => void }

const MAX_TRACKS = 4;
const TRACK_NAMES = ['רצועה 1', 'רצועה 2', 'רצועה 3', 'רצועה 4'];

// Kept for the session, so leaving the piano screen doesn't lose the loop.
const memory: { tracks: Track[]; bpm: number; bars: number; quant: boolean; click: boolean } = {
  tracks: Array.from({ length: MAX_TRACKS }, () => ({ notes: [], muted: false })), bpm: 84, bars: 2, quant: true, click: true,
};

export const Looper = forwardRef<LooperHandle>(function Looper(_, ref) {
  const [tracks, setTracks] = useState<Track[]>(memory.tracks);
  const [bpm, setBpm] = useState(memory.bpm);
  const [bars, setBars] = useState(memory.bars);
  const [quant, setQuant] = useState(memory.quant);
  const [click, setClick] = useState(memory.click);
  const [playing, setPlaying] = useState(false);
  const [armed, setArmed] = useState<number | null>(null); // track waiting for / in a recording pass
  const [recLoop, setRecLoop] = useState<number | null>(null); // loop index being recorded
  const [countIn, setCountIn] = useState(false);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const st = useRef({ t0: 0, nextBeat: 0, timer: 0 as number | undefined, raf: 0, armed: null as number | null, recLoop: null as number | null });
  const head = useRef<HTMLDivElement>(null);

  const beatSec = 60 / bpm;
  const L = bars * 4;

  useEffect(() => { memory.tracks = tracks; memory.bpm = bpm; memory.bars = bars; memory.quant = quant; memory.click = click; }, [tracks, bpm, bars, quant, click]);

  const stop = useCallback(() => {
    window.clearInterval(st.current.timer);
    cancelAnimationFrame(st.current.raf);
    audio.cancelScheduled();
    st.current.armed = null;
    st.current.recLoop = null;
    setArmed(null);
    setRecLoop(null);
    setCountIn(false);
    setPlaying(false);
  }, []);
  useEffect(() => () => { window.clearInterval(st.current.timer); cancelAnimationFrame(st.current.raf); audio.cancelScheduled(); }, []);
  useEffect(() => {
    const on = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [stop]);
  // Changing tempo or length restarts the transport.
  useEffect(() => { if (playing) stop(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [bpm, bars]);

  /** Lookahead scheduler: everything due in the next 150ms is put on the audio clock. */
  const tick = useCallback(() => {
    const ctx = audio.context;
    if (!ctx) return;
    const s = st.current;
    const horizon = (ctx.currentTime + 0.15 - s.t0) / beatSec;
    while (s.nextBeat < horizon) {
      const b = s.nextBeat;
      const loop = Math.floor(b / L);
      const inLoop = b - loop * L;
      const when = s.t0 + b * beatSec;
      if (when >= ctx.currentTime - 0.01) {
        if (click && b >= 0) audio.click(when, inLoop % 4 === 0, 0.5);
        if (b < 0) audio.click(when, (b + 4) % 4 === 0, 0.8); // count-in
        tracksRef.current.forEach((t) => {
          if (t.muted) return;
          for (const n of t.notes) {
            if (n.loop === loop) continue; // just recorded in this pass: already heard live
            if (n.pos >= inLoop - 1e-6 && n.pos < inLoop + 0.25 - 1e-6) audio.playNote(n.midi, Math.max(0.2, n.beats * beatSec * 0.95), s.t0 + (loop * L + n.pos) * beatSec, 0.75);
          }
        });
      }
      s.nextBeat += 0.25;
      // End of a recording pass.
      if (s.recLoop != null && s.nextBeat >= (s.recLoop + 1) * L) {
        s.recLoop = null;
        s.armed = null;
        window.setTimeout(() => { setRecLoop(null); setArmed(null); }, Math.max(0, (s.t0 + s.nextBeat * beatSec - ctx.currentTime) * 1000));
      }
    }
  }, [L, beatSec, click]);

  const tickRef = useRef(tick);
  tickRef.current = tick;
  const [beat, setBeat] = useState(0);

  const animate = useCallback(() => {
    const ctx = audio.context;
    const s = st.current;
    if (ctx && head.current) {
      const b = (ctx.currentTime - s.t0) / beatSec;
      setCountIn(b < 0);
      setBeat(Math.floor(b));
      head.current.style.setProperty('--p', String(b < 0 ? 0 : ((b % L) + L) % L / L));
    }
    s.raf = requestAnimationFrame(animate);
  }, [L, beatSec]);

  const startTransport = (withCountIn: boolean) => {
    audio.unlock();
    const ctx = audio.context;
    if (!ctx) return;
    const s = st.current;
    const lead = withCountIn ? 4 : 0;
    s.t0 = ctx.currentTime + 0.12 + lead * beatSec;
    s.nextBeat = -lead;
    // Loop numbers restart with the transport: nothing counts as "just recorded" any more.
    const fresh = tracksRef.current.map((t) => ({ ...t, notes: t.notes.map((n) => ({ ...n, loop: -1 })) }));
    tracksRef.current = fresh;
    setTracks(fresh);
    window.clearInterval(s.timer);
    s.timer = window.setInterval(() => tickRef.current(), 25);
    tickRef.current();
    cancelAnimationFrame(s.raf);
    s.raf = requestAnimationFrame(animate);
    setPlaying(true);
  };

  const record = (i: number) => {
    const ctx = audio.context;
    const s = st.current;
    if (!playing || !ctx) {
      // From silence: one bar of count-in, then record the first pass.
      s.armed = i;
      s.recLoop = 0;
      setArmed(i);
      setRecLoop(0);
      startTransport(true);
      return;
    }
    // While playing: record from the top of the next loop.
    const b = (ctx.currentTime - s.t0) / beatSec;
    const next = Math.max(0, Math.ceil(b / L - 0.03));
    s.armed = i;
    s.recLoop = next;
    setArmed(i);
    setRecLoop(next);
  };

  useImperativeHandle(ref, () => ({
    note: (m: number) => {
      const ctx = audio.context;
      const s = st.current;
      if (!ctx || s.armed == null || s.recLoop == null) return;
      let b = (ctx.currentTime - s.t0) / beatSec;
      // A note played a little early for the downbeat belongs to the pass.
      if (b < s.recLoop * L && b > s.recLoop * L - 0.35) b = s.recLoop * L;
      const loop = Math.floor(b / L);
      if (loop !== s.recLoop) return;
      let pos = b - loop * L;
      if (quant) pos = Math.round(pos * 2) / 2;
      if (pos >= L) pos -= L;
      const ti = s.armed;
      const note: LoopNote = { midi: m, pos, beats: 1, loop };
      setTracks((ts) => ts.map((t, k) => {
        if (k !== ti) return t;
        const notes = [...t.notes, note].sort((a, c) => a.pos - c.pos);
        return { ...t, notes };
      }));
    },
  }), [L, beatSec, quant]);

  const clear = (i: number) => setTracks((ts) => ts.map((t, k) => (k === i ? { notes: [], muted: false } : t)));
  const toggleMute = (i: number) => setTracks((ts) => ts.map((t, k) => (k === i ? { ...t, muted: !t.muted } : t)));
  const anyNotes = tracks.some((t) => t.notes.length);
  const status = countIn ? 'ספירה…' : armed != null ? (recLoop != null && st.current.recLoop != null ? `מקליטה ב${TRACK_NAMES[armed]}` : '') : playing ? 'מתנגן בלופ' : '';
  const waiting = armed != null && playing && !countIn && beat < (recLoop ?? 0) * L;

  return (
    <div className="card looper">
      <div className="row between" style={{ alignItems: 'center' }}>
        <b>לופר</b>
        <span className={`faint ${armed != null ? 'rec-on' : ''}`}>{waiting ? 'ההקלטה תתחיל בתחילת הסבב' : status}</span>
      </div>
      <div className="row wrap looper-opts">
        <Seg value={bars} onChange={setBars} ltr options={[1, 2, 4].map((v) => ({ value: v, label: `${v} ${v === 1 ? 'תיבה' : 'תיבות'}` }))} />
        <label className="tempo-row" style={{ marginTop: 0 }}>
          <span className="num faint">{bpm}</span>
          <input type="range" min={56} max={132} step={4} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} aria-label="מהירות" />
        </label>
      </div>
      <div className={`looper-tracks ${playing && !countIn ? 'playing' : ''}`} ref={head} dir="ltr">
        {tracks.map((t, i) => (
          <div key={i} className={`lp-track t${i} ${armed === i ? 'armed' : ''} ${t.muted ? 'muted' : ''}`}>
            <div className="lp-lane">
              <i className="lp-ph" aria-hidden="true" />
              {Array.from({ length: bars }, (_, b) => <i key={b} className="lp-bar" style={{ left: `${(b * 4 / L) * 100}%` }} />)}
              {t.notes.map((n, k) => (
                <span key={k} className="lp-note" title={pitchName(pitchFromMidi(n.midi))}
                  style={{ left: `${(n.pos / L) * 100}%`, bottom: `${Math.max(4, Math.min(84, ((n.midi - 36) / 48) * 84))}%` }} />
              ))}
            </div>
            <div className="lp-ctrl" dir="rtl">
              <span className="lp-name">{TRACK_NAMES[i]}</span>
              <button className={`btn small ${armed === i ? 'danger-fill' : ''}`} onClick={() => (armed === i ? stop() : record(i))} aria-label={`הקלטה ב${TRACK_NAMES[i]}`}>●</button>
              <button className="btn small" disabled={!t.notes.length} onClick={() => toggleMute(i)} aria-pressed={t.muted}>{t.muted ? 'מושתק' : 'השתקה'}</button>
              <button className="icon-btn lp-del" disabled={!t.notes.length} onClick={() => clear(i)} aria-label={`מחיקת ${TRACK_NAMES[i]}`}><Icon name="trash" size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 10, gap: 8 }}>
        {playing ? (
          <button className="btn grow" onClick={stop}><Icon name="pause" size={16} />עצירה</button>
        ) : (
          <button className="btn grow primary" disabled={!anyNotes} onClick={() => startTransport(false)}><Icon name="play" size={16} />ניגון בלופ</button>
        )}
        <button className={`btn small ${click ? 'primary' : ''}`} onClick={() => setClick((c) => !c)} aria-pressed={click}>מטרונום</button>
        <button className={`btn small ${quant ? 'primary' : ''}`} onClick={() => setQuant((q) => !q)} aria-pressed={quant} title="מיישר כל צליל לחצי פעמה הקרובה">יישור</button>
      </div>
      <div className="faint" style={{ marginTop: 8, fontSize: 13 }}>
        ● מתחיל הקלטה של סבב אחד (מהשקט — אחרי ספירה של תיבה). הלופ ממשיך להתנגן, וכל רצועה חדשה נשמעת מעל הקודמות.
      </div>
    </div>
  );
});
