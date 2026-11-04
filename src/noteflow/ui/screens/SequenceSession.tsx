// Melody reading: one note after another, left to right, with a configurable look-ahead.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { earnedAchievements } from '../../engine/achievements';
import { evaluateKey, evaluateName, explain, NameAnswer, Question, summarize } from '../../engine/exercise';
import { SessionPlan } from '../../engine/sessions';
import { computeRecords } from '../../engine/stats';
import { midi, pitchId } from '../../music/pitch';
import { Melody, melodyById, myMelody, pickMelodies } from '../../music/songs';
import { Score, ScoreNote, ScoreRole } from '../../notation/Score';
import { useApp, useStore } from '../../state/store';
import { getKV, setKV } from '../../storage/db';
import type { Attempt, SessionRecord } from '../../storage/types';
import { NamePad } from '../components/NamePad';
import { keyboardRange, Piano } from '../components/Piano';
import { Sheet } from '../components/Sheet';
import { SessionProgress } from '../components/Progress';
import { Icon } from '../components/ui';
import type { ResumeInfo, SessionResult } from './Session';
import { melodyFingers } from '../../engine/fingers';
import { useExternalNotes } from '../useExternalNotes';

export interface SequenceResumeState {
  melodies: Melody[];
  mi: number;
  ei: number;
  results: Record<string, 'good' | 'bad'>;
  attempts: Attempt[];
}

type Phase = 'loading' | 'question' | 'paused' | 'interlude';

function usePerLine(): { perLine: number; scale: number } {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const inner = Math.min(w, 900) - 24;
  return { perLine: inner >= 620 ? 4 : 2, scale: Math.max(1.0, Math.min(1.7, inner / (inner >= 620 ? 560 : 300))) };
}

const isPitched = (m: Melody, i: number) => !!m.quarters[i]?.pitch;

function nextPitched(m: Melody, from: number): number {
  let i = from;
  while (i < m.quarters.length && !isPitched(m, i)) i++;
  return i;
}

export function SequenceSession({ plan, onDone, onExit, resume }: {
  plan: SessionPlan; onDone: (r: SessionResult) => void; onExit: () => void; resume?: ResumeInfo<SequenceResumeState>;
}) {
  const app = useApp();
  const store = useStore();
  const { settings } = app;
  const cfg = plan.config;
  const isTest = cfg.mode === 'test';
  const skill = cfg.skill;
  const look = cfg.look ?? 4;
  const { perLine, scale: baseScale } = usePerLine();
  const scale = baseScale * (settings.noteSize === 'large' ? 1.15 : 1);

  const startedAt = useRef(resume?.startedAt ?? Date.now());
  const sessionId = useRef(resume?.sessionId ?? `${startedAt.current.toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const [prevRecords] = useState(() => computeRecords(app.attempts, app.sessions));
  const [melodies, setMelodies] = useState<Melody[]>(resume?.state.melodies ?? []);
  const [mi, setMi] = useState(resume?.state.mi ?? 0);
  const [ei, setEi] = useState(resume?.state.ei ?? 0);
  const [results, setResults] = useState<Record<string, 'good' | 'bad'>>(resume?.state.results ?? {});
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const attempts = useRef<Attempt[]>(resume?.state.attempts ?? []);
  const [phase, setPhase] = useState<Phase>(resume ? 'question' : 'loading');
  const [flash, setFlash] = useState<{ ok: boolean; text?: string } | null>(null);
  const [askExit, setAskExit] = useState(false);
  const [xs, setXs] = useState<number[]>([]);
  const shownAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const finished = useRef(false);
  const busy = useRef(false);

  // Pick melodies once (avoid songs played recently).
  useEffect(() => {
    if (resume) return;
    let alive = true;
    (async () => {
      const recent = await getKV<string[]>('song-history', []).catch(() => [] as string[]);
      const ranges = cfg.ranges?.length ? cfg.ranges : [{ clef: 'treble' as const, from: 'C4', to: 'C5' }];
      const per = Math.ceil(cfg.count / ranges.length);
      const all: Melody[] = [];
      if (cfg.songIds?.length) {
        const r = ranges[0];
        for (const id of cfg.songIds) { const mm = melodyById(id, r.clef, r.from, r.to, app.myMelodies); if (mm) all.push(mm); }
      } else {
        // A melody she wrote at least two days ago comes back as reading practice (not in tests).
        if (cfg.mode === 'practice') {
          const old = app.myMelodies.filter((x) => Date.now() - x.createdAt > 2 * 86_400_000 && ranges.some((r) => r.clef === x.clef));
          if (old.length) all.push(myMelody(old[Math.floor(Math.random() * old.length)]));
        }
        ranges.forEach((r) => {
          all.push(...pickMelodies({ clef: r.clef, from: r.from, to: r.to, content: cfg.content ?? 'mixed', notes: per, recent, rng: Math.random }).melodies);
        });
      }
      if (!all.length) all.push(...pickMelodies({ clef: 'treble', from: 'C4', to: 'C5', content: 'mixed', notes: 16, recent, rng: Math.random }).melodies);
      // Alternate clefs when both are practised.
      const t = all.filter((m) => m.clef === 'treble');
      const b = all.filter((m) => m.clef === 'bass');
      const mixed: Melody[] = [];
      while (t.length || b.length) { if (t.length) mixed.push(t.shift()!); if (b.length) mixed.push(b.shift()!); }
      if (!alive) return;
      setMelodies(mixed);
      setEi(nextPitched(mixed[0], 0));
      setPhase('question');
      const ids = mixed.filter((m) => m.category === 'known').map((m) => m.id.split('@')[0]);
      setKV('song-history', [...ids, ...recent].slice(0, 6)).catch(() => undefined);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => melodies.reduce((a, m) => a + m.quarters.filter((x) => x.pitch).length, 0), [melodies]);
  const done = attempts.current.length;
  const m = melodies[mi];
  const note = m?.quarters[ei];

  const [kLow, kHigh] = useMemo(() => {
    const ms = melodies.flatMap((x) => x.quarters.filter((q) => q.pitch).map((q) => midi(q.pitch!)));
    return ms.length ? keyboardRange(Math.min(...ms), Math.max(...ms)) : [60, 71];
  }, [melodies]);

  const save = useCallback((state: SequenceResumeState) => {
    store.setPending({
      plan, sessionId: sessionId.current, startedAt: startedAt.current, savedAt: Date.now(),
      done: state.attempts.length, total, state,
    });
  }, [plan, store, total]);

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    window.clearTimeout(timer.current);
    store.clearPending();
    const list = attempts.current;
    const summary = summarize(list, settings, cfg.kind === 'stage-test');
    summary.marks = list.map((a) => a.correct);
    // Per-melody results for the songbook (only melodies that were actually read).
    summary.melodies = melodies.map((x, k) => {
      const keys = Object.keys(resultsRef.current).filter((key) => key.startsWith(`${k}:`));
      return { id: x.id, title: x.title, correct: keys.filter((key) => resultsRef.current[key] === 'good').length, total: keys.length };
    }).filter((x) => x.total > 0);
    const record: SessionRecord = { id: sessionId.current, startedAt: startedAt.current, endedAt: Date.now(), config: cfg, summary };
    store.addSession(record);
    const d = store.getSnapshot();
    const fresh = store.unlockAchievements(earnedAchievements(d.attempts, d.sessions, d.idx, d.settings));
    audio.playFlourish();
    await store.flush();
    onDone({ record, plan, attempts: list, newAchievements: fresh, prevRecords, newRecords: computeRecords(d.attempts, d.sessions), melodies });
  }, [cfg, melodies, onDone, plan, prevRecords, settings, store]);

  const advance = useCallback((res: Record<string, 'good' | 'bad'>) => {
    resultsRef.current = res;
    if (cfg.timeBudgetMs && Date.now() - startedAt.current >= cfg.timeBudgetMs) { void finish(); return; }
    const nextEi = nextPitched(m, ei + 1);
    if (nextEi < m.quarters.length) {
      setEi(nextEi);
      save({ melodies, mi, ei: nextEi, results: res, attempts: attempts.current });
      return;
    }
    // Melody finished.
    const nmi = mi + 1;
    if (nmi >= melodies.length) { void finish(); return; }
    save({ melodies, mi: nmi, ei: nextPitched(melodies[nmi], 0), results: res, attempts: attempts.current });
    if (isTest) {
      setMi(nmi);
      setEi(nextPitched(melodies[nmi], 0));
    } else {
      setPhase('interlude');
    }
  }, [cfg.timeBudgetMs, ei, finish, isTest, m, melodies, mi, save]);

  const answer = useCallback((value: { name?: NameAnswer | null; midi?: number | null }, external = false) => {
    if (phase !== 'question' || !note?.pitch || finished.current || busy.current) return;
    busy.current = true;
    window.clearTimeout(timer.current);
    const q: Question = { n: done, skill, clef: m.clef, pitch: note.pitch, timeLimitMs: cfg.timeLimitMs };
    const timedOut = value.name === null || value.midi === null;
    const ev = skill === 'name' ? evaluateName(q, value.name ?? null) : evaluateKey(q, value.midi ?? null);
    const a: Attempt = {
      sessionId: sessionId.current, ts: Date.now(), skill, clef: m.clef, pitch: pitchId(note.pitch),
      answer: skill === 'name' ? (value.name ?? null) : value.midi != null ? String(value.midi) : null,
      correct: ev.correct, rtMs: timedOut ? null : Math.round(performance.now() - shownAt.current),
      timeLimitMs: cfg.timeLimitMs, mode: cfg.mode, hints: 0, heard: false, error: ev.error,
    };
    attempts.current.push(a);
    store.addAttempt(a);
    const res = { ...results, [`${mi}:${ei}`]: ev.correct ? 'good' as const : 'bad' as const };
    setResults(res);
    // The melody builds from your answers: a correct note sounds; in a test nothing reveals the result.
    if (isTest) {
      if (skill === 'key' && value.midi != null && !external) audio.playNote(value.midi, 0.6);
      else audio.playTick();
    } else if (ev.correct) {
      if (!external) audio.playNote(midi(note.pitch), 0.7);
      setFlash({ ok: true });
    } else {
      audio.playWrong();
      audio.playNote(midi(note.pitch), 0.7, audio.context ? audio.context.currentTime + 0.25 : undefined);
      setFlash({ ok: false, text: explain(q, ev.error) });
    }
    advance(res);
    busy.current = false;
  }, [advance, cfg.mode, cfg.timeLimitMs, done, ei, isTest, m, mi, note, phase, results, skill, store]);

  const ext = useExternalNotes(skill === 'key', (k) => { if (phase === 'question') answer({ midi: k }, true); });

  // Start the clock once the note is on screen.
  useEffect(() => {
    if (phase !== 'question' || !note?.pitch) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        shownAt.current = performance.now();
        if (cfg.timeLimitMs) timer.current = window.setTimeout(() => answer({ name: null, midi: null }), cfg.timeLimitMs);
      });
    });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); window.clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mi, ei, phase]);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), flash.ok ? 500 : 2200);
    return () => window.clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    const on = () => {
      if (!document.hidden) return;
      audio.cancelScheduled();
      if (phase === 'question') { window.clearTimeout(timer.current); setPhase('paused'); }
    };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [phase]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (askExit || e.metaKey || e.ctrlKey || e.altKey || skill !== 'name') return;
      const k = e.key.toUpperCase();
      if ('CDEFGAB'.includes(k) && k.length === 1) answer({ name: k as NameAnswer });
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [answer, askExit, skill]);

  useEffect(() => () => { window.clearTimeout(timer.current); audio.cancelScheduled(); }, []);

  if (phase === 'loading' || !m) {
    return <div className="session"><div className="s-stage"><div className="faint" style={{ textAlign: 'center' }}>מכינה מנגינות…</div></div></div>;
  }

  // Which line of the current melody is on screen.
  const barOf = (i: number) => Math.floor(i / 4);
  const line = Math.floor(barOf(ei) / perLine);
  const firstBar = line * perLine;
  const barCount = Math.ceil(m.quarters.length / 4);
  const lineBars = Array.from({ length: Math.min(perLine, barCount - firstBar) }, (_, k) => firstBar + k);
  const visibleUntil = (() => {
    if (look === 0) return Infinity;
    if (look === -1) return (barOf(ei) + 1) * 4 - 1;
    let n = 0;
    let i = ei;
    for (; i < m.quarters.length; i++) { if (isPitched(m, i)) n++; if (n >= look) break; }
    return i;
  })();
  const fingers = settings.showFingers && !isTest ? melodyFingers(m.quarters.map((x) => x.pitch), m.clef) : null;
  const bars: ScoreNote[][] = lineBars.map((b) => m.quarters.slice(b * 4, b * 4 + 4).map((qn, k) => {
    const i = b * 4 + k;
    const r = results[`${mi}:${i}`];
    let role: ScoreRole = 'normal';
    if (i < ei) role = isTest ? 'done' : r === 'bad' ? 'bad' : r === 'good' ? 'good' : 'done';
    else if (i === ei) role = 'current';
    else if (i > visibleUntil) role = 'hidden';
    return { pitch: qn.pitch, beats: qn.beats, role, finger: role === 'hidden' ? undefined : fingers?.[i] };
  }));
  const curIdx = ei - firstBar * 4;

  const melodyAcc = (() => {
    const keys = Object.keys(results).filter((k) => k.startsWith(`${mi}:`));
    return keys.length ? keys.filter((k) => results[k] === 'good').length / keys.length : 0;
  })();

  const exit = () => {
    if (done < 3) { window.clearTimeout(timer.current); store.clearPending(); audio.cancelScheduled(); onExit(); return; }
    window.clearTimeout(timer.current);
    if (phase === 'question') setPhase('paused');
    setAskExit(true);
  };

  const playMelody = (gap?: number) => {
    audio.unlock();
    const notes = gap ? m.quarters : m.rhythmic;
    audio.playSequence(notes.map((x) => ({ midi: x.pitch ? midi(x.pitch) : null, beats: x.beats })), gap ? { gapSec: gap } : { bpm: m.bpm });
  };

  const header = m.category === 'known' ? `${m.title} · ${m.composer}` : m.id.startsWith('my-') ? `המנגינה שכתבת · ${m.title}` : `מנגינה מקורית · ${m.title}`;

  return (
    <div className="session seq">
      {askExit && (
        <Sheet title="לסיים את האימון?" body={`קראת ${done} מתוך ${total} תווים. התוצאות עד עכשיו יישמרו.`}
          confirmLabel="סיום ושמירה" cancelLabel="להמשיך לקרוא"
          onConfirm={() => { setAskExit(false); void finish(); }}
          onCancel={() => { setAskExit(false); if (phase === 'paused') setPhase('question'); }} />
      )}
      <div className="s-top">
        <button className="icon-btn" onClick={exit} aria-label="סיום"><Icon name="close" /></button>
        <SessionProgress title={plan.title} done={done} total={total} paused={phase === 'paused'}
          budget={cfg.timeBudgetMs ? { startedAt: startedAt.current, ms: cfg.timeBudgetMs } : undefined} />
        <button className="icon-btn" aria-label={phase === 'paused' ? 'המשך' : 'עצירה'} disabled={phase === 'interlude'}
          onClick={() => { if (phase === 'paused') setPhase('question'); else if (phase === 'question') { window.clearTimeout(timer.current); setPhase('paused'); } }}>
          <Icon name={phase === 'paused' ? 'play' : 'pause'} />
        </button>
      </div>

      <div className="s-stage">
        <div className="faint seq-title">{header}{melodies.length > 1 ? ` · ${mi + 1}/${melodies.length}` : ''}</div>
        <div className={`staff-card ${flash ? (flash.ok ? 'flash-good' : 'flash-bad') : ''}`}>
          {phase === 'paused' && (
            <div className="paused">
              <button className="btn primary big" onClick={() => setPhase('question')}><Icon name="play" />המשך</button>
            </div>
          )}
          {phase === 'interlude' && (
            <div className="paused interlude">
              <div style={{ textAlign: 'center', display: 'grid', gap: 10 }}>
                <b style={{ fontSize: 18 }}>{melodyAcc === 1 ? 'כל המנגינה נכונה' : 'המנגינה הושלמה'}</b>
                <span className="muted">{Math.round(melodyAcc * 100)}% נכון במנגינה הזו</span>
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button className="btn small" onClick={() => playMelody()}><Icon name="play" size={14} />השמעה בקצב</button>
                  <button className="btn small" onClick={() => playMelody(0.3)}>תו כל 300ms</button>
                </div>
                <button className="btn primary" onClick={() => {
                  audio.cancelScheduled();
                  const nmi = mi + 1;
                  setMi(nmi); setEi(nextPitched(melodies[nmi], 0)); setPhase('question');
                }}>למנגינה הבאה</button>
              </div>
            </div>
          )}
          {xs[curIdx] != null && phase === 'question' && (
            <>
              <span className="seq-glow" style={{ left: xs[curIdx] + 6, width: 34 * scale }} aria-hidden="true" />
              <span className="seq-caret" style={{ left: xs[curIdx] + 6 }} aria-hidden="true">▲</span>
            </>
          )}
          <Score clef={m.clef} bars={bars} scale={scale} showTime={line === 0} beams={false} onLayout={setXs}
            ariaLabel={`${m.clef === 'treble' ? 'מפתח סול' : 'מפתח פה'}, מנגינה`} />
          {cfg.timeLimitMs != null && (
            <div className={`timer ${phase === 'question' ? 'run' : ''}`} aria-hidden="true">
              <span key={`${mi}-${ei}-${phase}`} style={{ animationDuration: `${cfg.timeLimitMs}ms` }} />
            </div>
          )}
        </div>
        <div className="feedback" aria-live="polite">
          {flash && !flash.ok && <div>{flash.text}</div>}
          {!flash && phase === 'question' && done === 0 && <div className="faint">קוראים משמאל לימין. התו המסומן ב־▲ הוא התו הנוכחי.{fingers ? ' המספרים מעל התווים: איזו אצבע מנגנת.' : ''}{ext.enabled ? ' אפשר לנגן על הפסנתר.' : ''}</div>}
          {!flash && note?.pitch && results[`${mi}:${ei - 1}`] === undefined && done > 0 && phase === 'question' && isTest && <div className="faint">המבחן בעיצומו — התוצאות בסוף.</div>}
        </div>
      </div>

      <div className="answers" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {skill === 'name' ? (
          <NamePad disabled={phase !== 'question'} onAnswer={(n) => answer({ name: n })} />
        ) : (
          <Piano low={kLow} high={kHigh} disabled={phase !== 'question'} showNames={!isTest && settings.showKeyNames}
            onPress={(k) => { audio.unlock(); answer({ midi: k }); }} />
        )}
      </div>
    </div>
  );
}
