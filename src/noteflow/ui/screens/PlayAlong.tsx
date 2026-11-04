import { earnedAchievements } from '../../engine/achievements';
// Play along: the melody in the right hand, a piano accompaniment underneath.
// "Waits for you" — the accompaniment moves on with every right note; "in time" — a steady tempo with a count-in.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { accompaniment, chordsForSong, melodyEvents } from '../../engine/accomp';
import { melodyFingers } from '../../engine/fingers';
import { midi, pitchName } from '../../music/pitch';
import { generateMelody, knownSongsFor, Melody, MelodyNote, myMelody } from '../../music/songs';
import { Score, ScoreNote, ScoreRole } from '../../notation/Score';
import { useApp, useStore } from '../../state/store';
import type { SessionRecord } from '../../storage/types';
import { keyboardRange, Piano } from '../components/Piano';
import { Icon, Seg, TopBar } from '../components/ui';
import { useExternalNotes } from '../useExternalNotes';

type Mode = 'wait' | 'tempo' | 'listen';
type Mark = 'good' | 'bad' | 'miss';

/** Onset (beats) of every note; pitched indexes only. */
function onsets(notes: MelodyNote[]): number[] {
  const out: number[] = [];
  let at = 0;
  for (const n of notes) { out.push(at); at += n.beats; }
  return out;
}

export function PlayAlong({ onBack, songId }: { onBack: () => void; songId?: string }) {
  const app = useApp();
  const { settings } = app;
  const songs = useMemo(() => {
    const known = knownSongsFor('treble', 'C4', 'C5');
    const mine = app.myMelodies.filter((m) => m.clef === 'treble').map(myMelody);
    return [...known, ...mine];
  }, [app.myMelodies]);
  const [pick, setPick] = useState<Melody | null>(() => (songId ? songs.find((s) => s.id.split('@')[0] === songId) ?? null : null));

  if (!pick) {
    return (
      <div className="page with-nav">
        <TopBar title="נגינה עם ליווי" onBack={onBack} />
        <p className="muted" style={{ marginTop: -6 }}>את מנגנת את המנגינה ביד ימין, והפסנתר מלווה אותך בבס ובאקורדים. אפשר שהליווי יחכה לך, או לנגן בקצב קבוע.</p>
        <div className="card">
          <ul className="list">
            {songs.map((s) => (
              <li key={s.id} style={{ alignItems: 'center' }}>
                <div><b dir="ltr">{s.title}</b><div className="faint">{s.composer}</div></div>
                <button className="btn small primary" onClick={() => setPick(s)}>לנגן</button>
              </li>
            ))}
            <li style={{ alignItems: 'center' }}>
              <div><b>מנגינה מקורית חדשה</b><div className="faint">נוצרת עכשיו, ומלווה אוטומטית</div></div>
              <button className="btn small" onClick={() => setPick(generateMelody('treble', 'C4', 'A4', Math.random, 4, Math.floor(Math.random() * 16)))}>לנגן</button>
            </li>
          </ul>
        </div>
      </div>
    );
  }
  return <Player key={pick.id} melody={pick} onBack={() => (songId ? onBack() : setPick(null))} settingsFingers={settings.showFingers} />;
}

function Player({ melody, onBack, settingsFingers }: { melody: Melody; onBack: () => void; settingsFingers: boolean }) {
  const app = useApp();
  const store = useStore();
  const { settings } = app;
  const notes = melody.rhythmic;
  const starts = useMemo(() => onsets(notes), [notes]);
  const pitched = useMemo(() => notes.map((n, i) => (n.pitch ? i : -1)).filter((i) => i >= 0), [notes]);
  const chords = useMemo(() => chordsForSong(melody.id, notes), [melody.id, notes]);
  const acc = useMemo(() => accompaniment(chords), [chords]);
  const totalBeats = starts[starts.length - 1] + notes[notes.length - 1].beats;
  const [mode, setMode] = useState<Mode>('wait');
  const [tempo, setTempo] = useState(0.7);
  const bpm = Math.round(melody.bpm * tempo);
  const beatSec = 60 / bpm;
  const [k, setK] = useState(0); // wait mode: position in `pitched`
  const [marks, setMarks] = useState<Record<number, Mark>>({});
  const [wrong, setWrong] = useState(0);
  const [running, setRunning] = useState(false);
  const [cursor, setCursor] = useState(-1); // tempo/listen: note index under the playhead
  const [result, setResult] = useState<{ good: number; bad: number; miss: number } | null>(null);
  const t0 = useRef(0);
  const raf = useRef(0);
  const startedAt = useRef(Date.now());
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const fingers = settingsFingers ? melodyFingers(notes.map((n) => n.pitch), 'treble') : null;
  const [kLow, kHigh] = useMemo(() => {
    const ms = notes.filter((n) => n.pitch).map((n) => midi(n.pitch!));
    return keyboardRange(Math.min(...ms), Math.max(...ms));
  }, [notes]);
  const w = Math.min(window.innerWidth, 900) - 24;
  const perLine = w >= 620 ? 4 : 2;
  const scale = Math.max(1.0, Math.min(1.6, w / (perLine === 4 ? 560 : 300))) * (settings.noteSize === 'large' ? 1.12 : 1);

  const stopAll = useCallback(() => {
    cancelAnimationFrame(raf.current);
    audio.cancelScheduled();
    setRunning(false);
  }, []);
  useEffect(() => () => { cancelAnimationFrame(raf.current); audio.cancelScheduled(); }, []);
  useEffect(() => {
    const on = () => { if (document.hidden) stopAll(); };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [stopAll]);

  const reset = () => { stopAll(); setK(0); setMarks({}); setWrong(0); setCursor(-1); setResult(null); startedAt.current = Date.now(); };

  const save = (good: number, total: number) => {
    const rec: SessionRecord = {
      id: `pa-${Date.now().toString(36)}`, startedAt: startedAt.current, endedAt: Date.now(),
      config: { kind: 'free', exercise: 'playalong', mode: 'practice', skill: 'key', count: total, timeLimitMs: null, autoAdvance: true, songIds: [melody.id.split('@')[0]] },
      summary: { total, correct: good, misses: total - good, accuracy: total ? good / total : 0, meanRt: null, medianRt: null, score: Math.round((total ? good / total : 0) * 100), wrongNotes: [], slowNotes: [], melodies: [{ id: melody.id, title: melody.title, correct: good, total }] },
    };
    store.addSession(rec);
    { const d = store.getSnapshot(); store.unlockAchievements(earnedAchievements(d.attempts, d.sessions, d.idx, d.settings)); }
    void store.flush();
  };

  // ---- Wait mode ----
  const playSegment = (i: number) => {
    const from = starts[pitched[i]];
    const to = i + 1 < pitched.length ? starts[pitched[i + 1]] : totalBeats;
    const seg = acc.filter((e) => e.at >= from - 1e-9 && e.at < to - 1e-9).map((e) => ({ ...e, at: e.at - from }));
    audio.cancelScheduled();
    audio.playEvents(seg, bpm, (audio.context?.currentTime ?? 0) + 0.01);
  };

  const pressWait = (m: number, external: boolean) => {
    if (k >= pitched.length) return;
    const ni = pitched[k];
    const target = midi(notes[ni].pitch!);
    if (m === target) {
      if (!external) audio.playNote(m, Math.max(0.3, notes[ni].beats * beatSec * 0.95), undefined, 0.85);
      playSegment(k);
      setMarks((x) => ({ ...x, [ni]: x[ni] === 'bad' ? 'bad' : 'good' }));
      const next = k + 1;
      setK(next);
      if (next >= pitched.length) {
        const good = pitched.filter((i) => (marksRef.current[i] ?? 'good') === 'good').length;
        window.setTimeout(() => { setResult({ good, bad: pitched.length - good, miss: 0 }); save(good, pitched.length); audio.playFlourish(); }, notes[ni].beats * beatSec * 1000 + 300);
      }
    } else {
      if (!external) audio.playNote(m, 0.35, undefined, 0.5);
      setMarks((x) => ({ ...x, [ni]: 'bad' }));
      setWrong((x) => x + 1);
    }
  };

  // ---- Tempo / listen ----
  const tolSec = Math.max(0.16, Math.min(0.3, beatSec * 0.3));
  const run = (withMelody: boolean) => {
    audio.unlock();
    reset();
    const ctx = audio.context;
    if (!ctx) return;
    const start = ctx.currentTime + 0.2;
    for (let i = 0; i < 4; i++) audio.click(start + i * beatSec, i === 0, 0.7);
    t0.current = start + 4 * beatSec;
    audio.playEvents(acc, bpm, t0.current);
    if (withMelody) audio.playEvents(melodyEvents(notes, 0.8), bpm, t0.current);
    setRunning(true);
    const tick = () => {
      const now = ctx.currentTime;
      const beat = (now - t0.current) / beatSec;
      let idx = -1;
      for (let i = 0; i < notes.length; i++) if (starts[i] <= beat + 1e-6) idx = i;
      setCursor(beat < 0 ? -1 : idx);
      if (!withMelody) {
        // Notes whose window has passed without a hit are missed.
        const late = pitched.filter((i) => !marksRef.current[i] && now > t0.current + starts[i] * beatSec + tolSec);
        if (late.length) setMarks((x) => { const y = { ...x }; for (const i of late) if (!y[i]) y[i] = 'miss'; marksRef.current = y; return y; });
      }
      if (beat >= totalBeats + 0.5) {
        setRunning(false);
        setCursor(-1);
        if (!withMelody) {
          const vals = pitched.map((i) => marksRef.current[i] ?? 'miss');
          const good = vals.filter((v) => v === 'good').length;
          setResult({ good, bad: vals.filter((v) => v === 'bad').length, miss: vals.filter((v) => v === 'miss').length });
          save(good, pitched.length);
          audio.playFlourish();
        }
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const pressTempo = (m: number, external: boolean, source?: 'mic' | 'midi') => {
    const ctx = audio.context;
    if (!ctx || !running) { if (!external) audio.playNote(m, 0.5); return; }
    if (!external) audio.playNote(m, 0.5, undefined, 0.85);
    // Compensate input latency: screen taps (calibrated in settings), microphone detection (~120ms).
    const t = ctx.currentTime - (source === 'mic' ? 0.12 : source === 'midi' ? 0.01 : settings.tapOffsetMs / 1000);
    let best = -1;
    let bestD = Infinity;
    for (const i of pitched) {
      if (marksRef.current[i]) continue;
      const d = Math.abs(t - (t0.current + starts[i] * beatSec));
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0 || bestD > tolSec) return;
    const ok = midi(notes[best].pitch!) === m;
    setMarks((x) => { const y = { ...x, [best]: ok ? 'good' as const : 'bad' as const }; marksRef.current = y; return y; });
  };

  const press = (m: number, external = false, source?: 'mic' | 'midi') => {
    if (result) return;
    if (mode === 'wait') pressWait(m, external);
    else if (mode === 'tempo') pressTempo(m, external, source);
    else if (!external) audio.playNote(m, 0.6);
  };
  const ext = useExternalNotes(mode !== 'listen', (m, e) => press(m, true, e.source));

  // Which line to show.
  const focus = mode === 'wait' ? (pitched[Math.min(k, pitched.length - 1)] ?? 0) : Math.max(0, cursor);
  const bar = Math.floor(starts[focus] / 4);
  const line = Math.floor(bar / perLine);
  const barsAll: ScoreNote[][] = [];
  notes.forEach((n, i) => {
    const b = Math.floor(starts[i] / 4 + 1e-9);
    (barsAll[b] ??= []).push({
      pitch: n.pitch, beats: n.beats, finger: fingers?.[i],
      role: ((): ScoreRole => {
        const mk = marks[i];
        if (mode === 'wait' && i === pitched[k]) return 'current';
        if (mode !== 'wait' && i === cursor) return 'current';
        if (mk === 'good') return 'good';
        if (mk === 'bad') return 'bad';
        if (mk === 'miss') return 'warn';
        return 'normal';
      })(),
    });
  });
  const lineBars = barsAll.slice(line * perLine, line * perLine + perLine);
  const done = mode === 'wait' && k >= pitched.length;
  const curNote = mode === 'wait' && !done ? notes[pitched[k]] : null;

  return (
    <div className="page playalong">
      <TopBar title={melody.title} onBack={() => { stopAll(); onBack(); }} />
      <div className="row wrap" style={{ gap: 8, marginTop: -6 }}>
        <Seg value={mode} onChange={(m) => { reset(); setMode(m); }} options={[
          { value: 'wait', label: 'מחכה לי' }, { value: 'tempo', label: 'בקצב' }, { value: 'listen', label: 'האזנה' },
        ]} />
      </div>
      {mode !== 'wait' && (
        <label className="tempo-row">
          <span>מהירות</span>
          <input type="range" min={0.5} max={1} step={0.05} value={tempo} disabled={running} onChange={(e) => setTempo(Number(e.target.value))} />
          <span className="num faint">{bpm} BPM</span>
        </label>
      )}
      <div className="staff-card pa-card">
        <Score clef="treble" bars={lineBars} scale={scale} showTime={line === 0} beams ariaLabel={`${melody.title}, מנגינה ביד ימין`} />
      </div>
      <div className="feedback" aria-live="polite">
        {result ? (
          <div className="pa-result">
            <b>{result.good === pitched.length ? 'ניגנת את כל המנגינה נכון' : `${result.good} מתוך ${pitched.length} תווים ${mode === 'tempo' ? 'בזמן ובגובה הנכון' : 'נכונים בניסיון הראשון'}`}</b>
            {mode === 'tempo' && <span className="faint">{result.bad ? `${result.bad} בגובה אחר · ` : ''}{result.miss ? `${result.miss} שהוחמצו` : ''}</span>}
            <button className="btn small primary" onClick={reset}>עוד פעם</button>
          </div>
        ) : mode === 'wait' ? (
          <div className="faint">{done ? '' : k === 0 ? `התחילי ב־${pitchName(curNote!.pitch!)}. כל תו נכון מזיז את הליווי קדימה.` : wrong ? `${wrong} תווים לא נכונים בדרך — זה בסדר, מנסים שוב.` : 'ממשיכים…'}{ext.enabled ? ' אפשר לנגן על הפסנתר.' : ''}</div>
        ) : !running ? (
          <button className="btn primary" onClick={() => run(mode === 'listen')}><Icon name="play" />{mode === 'listen' ? 'השמעה עם ליווי' : 'התחלה — ארבע נקישות ספירה'}</button>
        ) : (
          <button className="btn" onClick={stopAll}><Icon name="pause" />עצירה</button>
        )}
      </div>
      {mode !== 'listen' && (
        <div className="answers">
          <Piano low={kLow} high={kHigh} showNames={settings.showKeyNames} onPress={(m) => { audio.unlock(); press(m); }} />
        </div>
      )}
    </div>
  );
}
