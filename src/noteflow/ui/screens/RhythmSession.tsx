// Rhythm: read two bars, hear a four-beat count-in, tap at the start of every note. Timing runs on the audio clock.

import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { earnedAchievements } from '../../engine/achievements';
import {
  combineRounds, evaluateTaps, makePattern, onsetsOf, parseBar, RhythmEvent, rhythmPassed, rhythmScore, RoundResult,
} from '../../engine/rhythm';
import { SessionPlan } from '../../engine/sessions';
import { computeRecords } from '../../engine/stats';
import { Score, ScoreNote, ScoreRole } from '../../notation/Score';
import { useApp, useStore } from '../../state/store';
import type { SessionRecord, SessionSummary } from '../../storage/types';
import { Sheet } from '../components/Sheet';
import { Icon } from '../components/ui';
import type { ResumeInfo, SessionResult } from './Session';

export interface RhythmResumeState {
  rounds: RoundResult['summary'][];
}

type Phase = 'ready' | 'countin' | 'playing' | 'review' | 'received';

interface Clock { start: number; patternStart: number; end: number; evalAt: number }

export function RhythmSession({ plan, onDone, onExit, resume }: {
  plan: SessionPlan; onDone: (r: SessionResult) => void; onExit: () => void; resume?: ResumeInfo<RhythmResumeState>;
}) {
  const app = useApp();
  const store = useStore();
  const { settings } = app;
  const cfg = plan.config;
  const isTest = cfg.mode === 'test';
  const level = cfg.rhythmLevel ?? 1;
  const bpm = cfg.bpm ?? 70;
  const beat = 60 / bpm;
  const totalRounds = cfg.count;

  const startedAt = useRef(resume?.startedAt ?? Date.now());
  const sessionId = useRef(resume?.sessionId ?? `${startedAt.current.toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const [prevRecords] = useState(() => computeRecords(app.attempts, app.sessions));
  const [rounds, setRounds] = useState<RoundResult['summary'][]>(resume?.state.rounds ?? []);
  // Fixed bars (a song's rhythm) are read two at a time, in order; otherwise patterns are generated.
  const roundIdx = useRef(resume?.state.rounds.length ?? 0);
  const nextPattern = useCallback((): RhythmEvent[] => {
    const fixed = cfg.rhythmBars;
    if (fixed?.length) {
      const k = (roundIdx.current * 2) % fixed.length;
      return [...parseBar(fixed[k]), ...parseBar(fixed[(k + 1) % fixed.length])];
    }
    return makePattern(level, Math.random);
  }, [cfg.rhythmBars, level]);
  const [pattern, setPattern] = useState<RhythmEvent[]>(() => nextPattern());
  const [lastTaps, setLastTaps] = useState<number[]>([]);
  const [xs, setXs] = useState<number[]>([]);
  const [head, setHead] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [last, setLast] = useState<RoundResult | null>(null);
  const [beatNo, setBeatNo] = useState(-1);
  const [playIdx, setPlayIdx] = useState(-1);
  const [taps, setTaps] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [askExit, setAskExit] = useState(false);
  const clock = useRef<Clock | null>(null);
  const tapTimes = useRef<number[]>([]);
  const raf = useRef(0);
  const finished = useRef(false);

  void playIdx;
  const width = typeof window !== 'undefined' ? Math.min(window.innerWidth, 900) - 24 : 360;
  const scale = Math.max(1.0, Math.min(1.6, width / 300));

  const finish = useCallback(async (all: RoundResult['summary'][]) => {
    if (finished.current) return;
    finished.current = true;
    cancelAnimationFrame(raf.current);
    audio.cancelScheduled();
    store.clearPending();
    const r = combineRounds(all, bpm, level);
    const summary: SessionSummary = {
      total: r.onsets, correct: r.onTime, misses: r.misses, accuracy: r.timingAccuracy, meanRt: null, medianRt: null,
      score: rhythmScore(r), passed: cfg.kind === 'stage-test' ? rhythmPassed(r) : undefined, wrongNotes: [], slowNotes: [], rhythm: r,
    };
    const record: SessionRecord = { id: sessionId.current, startedAt: startedAt.current, endedAt: Date.now(), config: cfg, summary };
    store.addSession(record);
    const d = store.getSnapshot();
    const fresh = store.unlockAchievements(earnedAchievements(d.attempts, d.sessions, d.idx, d.settings));
    audio.playFlourish();
    await store.flush();
    onDone({ record, plan, attempts: [], newAchievements: fresh, prevRecords, newRecords: computeRecords(d.attempts, d.sessions) });
  }, [bpm, cfg, level, onDone, plan, prevRecords, store]);

  const stopRound = () => {
    cancelAnimationFrame(raf.current);
    audio.cancelScheduled();
    clock.current = null;
    setBeatNo(-1);
    setPlayIdx(-1);
    setHead(null);
  };

  const evaluate = useCallback(() => {
    const res = evaluateTaps(pattern, tapTimes.current, beat);
    stopRound();
    const all = [...rounds, res.summary];
    setRounds(all);
    setLast(res);
    setLastTaps([...tapTimes.current]);
    roundIdx.current = all.length;
    store.setPending({
      plan, sessionId: sessionId.current, startedAt: startedAt.current, savedAt: Date.now(),
      done: all.length, total: totalRounds, state: { rounds: all } satisfies RhythmResumeState,
    });
    if (isTest) {
      setPhase('received');
      window.setTimeout(() => {
        if (all.length >= totalRounds || (cfg.timeBudgetMs && Date.now() - startedAt.current >= cfg.timeBudgetMs)) { void finish(all); return; }
        setPattern(nextPattern());
        setLast(null);
        setPhase('ready');
      }, 1100);
    } else {
      setPhase('review');
    }
  }, [beat, finish, isTest, level, pattern, plan, rounds, store, totalRounds]);

  const evalRef = useRef(evaluate);
  evalRef.current = evaluate;

  const loop = useCallback(() => {
    const c = clock.current;
    const ctx = audio.context;
    if (!c || !ctx) return;
    const now = ctx.currentTime;
    if (now >= c.evalAt) { evalRef.current(); return; }
    const b = Math.floor((now - c.start) / beat);
    setBeatNo(b);
    if (now >= c.patternStart) {
      setPhase((p) => (p === 'countin' ? 'playing' : p));
      const rel = (now - c.patternStart) / beat;
      let acc = 0;
      let idx = -1;
      let frac = 0;
      pattern.forEach((e, i) => { if (rel >= acc && rel < acc + e.beats) { idx = i; frac = (rel - acc) / e.beats; } acc += e.beats; });
      setPlayIdx(idx);
      setHead(idx < 0 ? null : idx + frac);
    }
    raf.current = requestAnimationFrame(loop);
  }, [beat, pattern]);

  const startRound = (demo = false) => {
    audio.unlock();
    const ctx = audio.context;
    if (!ctx) return;
    stopRound();
    if (ctx.state !== 'running') {
      setNote('השמע עדיין לא פעיל. לחצי שוב על "התחילי".');
      void ctx.resume();
      return;
    }
    setNote(null);
    const start = ctx.currentTime + 0.3;
    const patternStart = start + 4 * beat;
    const len = pattern.reduce((a, e) => a + e.beats, 0);
    const end = patternStart + len * beat;
    for (let i = 0; i < 4; i++) audio.click(start + i * beat, i === 0);
    if (cfg.metronome !== false || demo) {
      for (let i = 0; i < len; i++) audio.click(patternStart + i * beat, i % 4 === 0, demo ? 0.6 : 0.8);
    }
    if (demo) {
      const { onsets } = onsetsOf(pattern, beat);
      onsets.forEach((o) => audio.tok(patternStart + o.time, pattern[o.index].beats, beat));
    }
    clock.current = { start, patternStart, end, evalAt: demo ? Infinity : end + Math.min(0.6, 0.5 * beat) };
    (window as unknown as { __nfRhythm?: unknown }).__nfRhythm = { patternStart, beat, pattern, ctx }; // read by automated QA only
    tapTimes.current = [];
    setTaps(0);
    setLast(null);
    setPhase('countin');
    raf.current = requestAnimationFrame(loop);
    if (demo) {
      window.setTimeout(() => { stopRound(); setPhase(rounds.length && !isTest && last ? 'review' : 'ready'); }, (end - ctx.currentTime + 0.4) * 1000);
    }
  };

  /** "This is how you tapped": the count-in, then her taps on the beat grid (the example is the demo button). */
  const playTaps = () => {
    audio.unlock();
    const ctx = audio.context;
    if (!ctx) return;
    audio.cancelScheduled();
    const start = ctx.currentTime + 0.25;
    const ps = start + 4 * beat;
    const len = pattern.reduce((a, e) => a + e.beats, 0);
    for (let i = 0; i < 4; i++) audio.click(start + i * beat, i === 0, 0.7);
    for (let i = 0; i < len; i++) audio.click(ps + i * beat, i % 4 === 0, 0.35);
    lastTaps.forEach((t) => audio.tok(ps + t, 0.5, beat));
    setNote('שומעים את ההקשות שלך על רשת הפעימות. "השמעה לדוגמה" מנגנת את המקצב הכתוב.');
  };

  const tap = (timeStamp: number) => {
    const c = clock.current;
    const ctx = audio.context;
    if (!c || !ctx || c.evalAt === Infinity) return;
    // Event time on the audio clock, minus the calibrated touch/output latency.
    const t = ctx.currentTime - Math.max(0, performance.now() - timeStamp) / 1000 - settings.tapOffsetMs / 1000;
    if (t < c.patternStart - 0.45 * beat || t > c.end + 0.45 * beat) return;
    tapTimes.current.push(t - c.patternStart);
    setTaps(tapTimes.current.length);
    setPulse((p) => p + 1);
  };

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) tap(e.timeStamp); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  useEffect(() => {
    const on = () => {
      if (!document.hidden) return;
      if (clock.current) { stopRound(); setPhase('ready'); setNote('הסבב נעצר כשיצאת מהאפליקציה. מתחילים אותו מחדש.'); }
    };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  useEffect(() => () => { cancelAnimationFrame(raf.current); audio.cancelScheduled(); }, []);

  const roles: ScoreRole[] = pattern.map((e, i) => {
    if (phase === 'review' && last) {
      if (e.rest) return 'normal';
      const r = last.perOnset.find((x) => x.index === i);
      return r?.status === 'ontime' ? 'good' : r?.status === 'miss' ? 'bad' : 'warn';
    }
    if (!isTest && phase === 'playing' && i === playIdx) return 'current';
    return 'normal';
  });
  const bars: ScoreNote[][] = [];
  let acc = 0;
  pattern.forEach((e, i) => {
    const b = Math.floor(acc / 4);
    (bars[b] ??= []).push({ pitch: e.rest ? null : { letter: 'B', octave: 4, accidental: 0 }, beats: e.beats, role: roles[i] });
    acc += e.beats;
  });

  const overBudget = () => !!cfg.timeBudgetMs && Date.now() - startedAt.current >= cfg.timeBudgetMs;
  const nextRound = () => {
    if (rounds.length >= totalRounds || overBudget()) { void finish(rounds); return; }
    setPattern(nextPattern());
    setLast(null);
    setPhase('ready');
  };

  const exit = () => {
    stopRound();
    if (!rounds.length) { store.clearPending(); onExit(); return; }
    setPhase('ready');
    setAskExit(true);
  };

  const running = phase === 'countin' || phase === 'playing';
  const countLabel = phase === 'countin' ? `${Math.max(1, Math.min(4, beatNo + 1))}` : phase === 'playing' ? 'מקישים' : '';
  const s = last?.summary;

  return (
    <div className="session rhythm">
      {askExit && (
        <Sheet title="לסיים את האימון?" body={`השלמת ${rounds.length} מתוך ${totalRounds} סבבים. התוצאות עד עכשיו יישמרו.`}
          confirmLabel="סיום ושמירה" cancelLabel="להמשיך"
          onConfirm={() => { setAskExit(false); void finish(rounds); }} onCancel={() => setAskExit(false)} />
      )}
      <div className="s-top">
        <button className="icon-btn" onClick={exit} aria-label="סיום"><Icon name="close" /></button>
        <div className="s-progress">
          <div className="s-meta">
            <span>{plan.title}</span>
            <span className="num">סבב {Math.min(rounds.length + (phase === 'review' || phase === 'received' ? 0 : 1), totalRounds)} / {totalRounds}</span>
          </div>
          <div className="bar"><span style={{ width: `${(rounds.length / totalRounds) * 100}%` }} /></div>
        </div>
        <span className="chip num" dir="ltr">{bpm} BPM</span>
      </div>

      <div className="s-stage">
        <div className="beatlights" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => <i key={i} className={running && beatNo >= 0 && ((beatNo % 4) === i) ? (phase === 'countin' ? 'on count' : 'on') : ''} />)}
          <span className="countlabel">{countLabel}</span>
        </div>
        <div className="staff-card">
          {head != null && xs.length > 0 && (() => {
            const i = Math.floor(head);
            const x0 = xs[i] ?? xs[xs.length - 1];
            const x1 = xs[i + 1] ?? (x0 + (xs[1] - xs[0] || 40));
            return <span className="playhead" style={{ left: x0 + 6 + (x1 - x0) * (head - i) }} aria-hidden="true" />;
          })()}
          <Score clef="percussion" bars={bars} scale={scale} showTime beams onLayout={setXs} ariaLabel="תבנית מקצב בשתי תיבות" />
        </div>
        <div className="feedback" aria-live="polite">
          {note && <div>{note}</div>}
          {!note && phase === 'ready' && <div className="faint">ארבע פעימות הכנה, ואז מקישים בתחילת כל צליל. בשתיקה לא מקישים.</div>}
          {phase === 'received' && <div className="big">נקלט · {taps} הקשות</div>}
          {phase === 'review' && s && (
            <>
              <div className="big">{s.onTime} מתוך {s.onsets} בזמן</div>
              <div>
                {s.hits - s.onTime > 0 && <>{s.hits - s.onTime} מעט {s.meanOffsetMs != null && s.meanOffsetMs < 0 ? 'מוקדם' : 'מאוחר'} · </>}
                {s.misses > 0 && <>{s.misses} הוחמצו · </>}
                {s.extras > 0 && <>{s.extras} הקשות עודפות{s.restTaps ? ` (${s.restTaps} בשתיקה)` : ''} · </>}
                {s.meanOffsetMs != null && <span className="num" dir="ltr">{s.meanOffsetMs > 0 ? '+' : ''}{s.meanOffsetMs}ms</span>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="s-tools">
        {(phase === 'ready' || phase === 'review') && !isTest && (
          <button className="btn small" onClick={() => startRound(true)}><Icon name="sound" size={16} />השמעה לדוגמה</button>
        )}
        {phase === 'review' && !isTest && lastTaps.length > 0 && (
          <button className="btn small" onClick={() => playTaps()}>כך הקשת</button>
        )}
        {phase === 'review' && (
          <>
            <button className="btn small" onClick={() => { if (rounds.length >= totalRounds) { void finish(rounds); return; } startRound(); }}>שוב</button>
            <button className="btn small primary" onClick={nextRound}>{rounds.length >= totalRounds ? 'לתוצאות' : 'לסבב הבא'}</button>
          </>
        )}
      </div>

      <div className="answers">
        {phase === 'ready' ? (
          <button className="tapbtn start" onClick={() => startRound()}>התחילי</button>
        ) : (
          <button className={`tapbtn ${running ? 'live' : ''}`} key={pulse} disabled={!running}
            onPointerDown={(e) => { e.preventDefault(); tap(e.timeStamp); }} aria-label="הקשה">
            {phase === 'countin' ? 'מתכוננים…' : phase === 'playing' ? 'הקישי כאן' : phase === 'review' ? 'הסבב הסתיים' : 'נקלט'}
          </button>
        )}
      </div>
    </div>
  );
}
