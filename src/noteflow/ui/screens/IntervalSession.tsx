// Reading by intervals: two notes on the staff — how far, and which way?

import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { earnedAchievements } from '../../engine/achievements';
import { summarize } from '../../engine/exercise';
import {
  evaluateInterval, explainInterval, intervalId, intervalNumber, intervalQuestion, IntervalQuestion, intervalText, questionKey,
} from '../../engine/intervals';
import { SessionPlan } from '../../engine/sessions';
import { computeRecords } from '../../engine/stats';
import { midi, pitchId, pitchName } from '../../music/pitch';
import { Staff, StaffNote } from '../../notation/Staff';
import { useApp, useStore } from '../../state/store';
import type { Attempt, SessionRecord } from '../../storage/types';
import { IntervalPad } from '../components/IntervalPad';
import { SessionProgress } from '../components/Progress';
import { Sheet } from '../components/Sheet';
import { Icon } from '../components/ui';
import type { SessionResult } from './Session';

export function IntervalSession({ plan, onDone, onExit }: { plan: SessionPlan; onDone: (r: SessionResult) => void; onExit: () => void }) {
  const app = useApp();
  const store = useStore();
  const { settings } = app;
  const cfg = plan.config;
  const isTest = cfg.mode === 'test';
  const ranges = (cfg.ranges ?? [{ clef: 'treble' as const, from: 'C4', to: 'C5' }]).map((r) => ({ clef: r.clef, from: r.from, to: r.to }));
  const max = cfg.maxInterval ?? 3;
  const startedAt = useRef(Date.now());
  const sessionId = useRef(`${startedAt.current.toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const [prevRecords] = useState(() => computeRecords(app.attempts, app.sessions));
  const attempts = useRef<Attempt[]>([]);
  const [q, setQ] = useState<IntervalQuestion>(() => intervalQuestion(ranges, max, Math.random));
  const [chosen, setChosen] = useState<number | null>(null);
  const [askExit, setAskExit] = useState(false);
  const shownAt = useRef(performance.now());
  const timer = useRef<number | undefined>(undefined);
  const adv = useRef<number | undefined>(undefined);
  const finished = useRef(false);
  const listened = useRef(false);
  const done = attempts.current.length;
  const w = Math.min(window.innerWidth, 640);
  const scale = Math.max(1.3, Math.min(2.2, w / 200)) * (settings.noteSize === 'large' ? 1.15 : 1);

  const playPair = useCallback((x: IntervalQuestion, dur = 0.6) => {
    audio.unlock();
    const ctx = audio.context;
    const t = ctx ? ctx.currentTime + 0.05 : undefined;
    audio.playNote(midi(x.a), dur, t);
    audio.playNote(midi(x.b), dur + 0.3, t != null ? t + dur * 0.85 : undefined);
  }, []);

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    window.clearTimeout(timer.current);
    const list = attempts.current;
    const summary = summarize(list, settings, cfg.kind === 'stage-test');
    summary.marks = list.map((a) => a.correct);
    // Mistakes by interval rather than by note.
    const wrong = new Map<string, number>();
    for (const a of list) {
      if (a.correct || !a.meta) continue;
      const [x, y] = a.meta.split('>');
      const d = Number(y) - Number(x);
      const k = intervalText(d);
      wrong.set(k, (wrong.get(k) ?? 0) + 1);
    }
    summary.wrongNotes = [...wrong].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
    summary.slowNotes = [];
    const record: SessionRecord = { id: sessionId.current, startedAt: startedAt.current, endedAt: Date.now(), config: cfg, summary };
    store.addSession(record);
    const d = store.getSnapshot();
    const fresh = store.unlockAchievements(earnedAchievements(d.attempts, d.sessions, d.idx, d.settings));
    audio.playFlourish();
    await store.flush();
    onDone({ record, plan, attempts: list, newAchievements: fresh, prevRecords, newRecords: computeRecords(d.attempts, d.sessions) });
  }, [cfg, onDone, plan, prevRecords, settings, store]);

  const next = useCallback(() => {
    window.clearTimeout(adv.current);
    if (attempts.current.length >= cfg.count || (cfg.timeBudgetMs && Date.now() - startedAt.current >= cfg.timeBudgetMs)) { void finish(); return; }
    setChosen(null);
    listened.current = false;
    setQ((prev) => intervalQuestion(ranges, max, Math.random, questionKey(prev)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.count, cfg.timeBudgetMs, finish, max]);

  const answer = useCallback((dist: number | null) => {
    if (chosen !== null || finished.current || attempts.current.length > done) return;
    window.clearTimeout(timer.current);
    const ev = evaluateInterval(q, dist);
    const a: Attempt = {
      sessionId: sessionId.current, ts: Date.now(), skill: 'interval', clef: q.clef, pitch: pitchId(q.b),
      answer: dist == null ? null : intervalId(dist), correct: ev.correct,
      rtMs: dist == null ? null : Math.round(performance.now() - shownAt.current), timeLimitMs: cfg.timeLimitMs, mode: cfg.mode,
      hints: listened.current ? 1 : 0, heard: settings.playNoteOnShow, error: ev.error,
      meta: `${midiDiatonic(q.a)}>${midiDiatonic(q.b)}`,
    };
    attempts.current.push(a);
    store.addAttempt(a);
    if (isTest) { audio.playTick(); setChosen(dist ?? 99); adv.current = window.setTimeout(next, 150); return; }
    setChosen(dist ?? 99);
    if (!ev.correct) { audio.playWrong(); playPair(q, 0.55); }
    if (ev.correct || cfg.autoAdvance) adv.current = window.setTimeout(next, ev.correct ? 700 : 2600);
  }, [cfg.autoAdvance, cfg.mode, cfg.timeLimitMs, chosen, done, isTest, next, playPair, q, settings.playNoteOnShow, store]);

  useEffect(() => {
    shownAt.current = performance.now();
    if (settings.playNoteOnShow) playPair(q);
    if (cfg.timeLimitMs) timer.current = window.setTimeout(() => answer(null), cfg.timeLimitMs);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  useEffect(() => () => window.clearTimeout(adv.current), []);

  const correct = chosen !== null && chosen === q.dist;
  const notes: StaffNote[] = [
    { pitch: q.a, role: 'ghost' },
    { pitch: q.b, role: chosen === null || isTest ? 'target' : correct ? 'correct' : 'wrong' },
  ];
  const marks = (d: number) => (chosen === null || isTest ? '' : d === chosen ? (correct ? 'good' : 'bad') : !correct && d === q.dist ? 'reveal' : '');

  return (
    <div className="session interval">
      {askExit && (
        <Sheet title="לסיים את האימון?" body={`ענית על ${done} מתוך ${cfg.count}. התוצאות עד עכשיו יישמרו.`}
          confirmLabel="סיום ושמירה" cancelLabel="להמשיך"
          onConfirm={() => { setAskExit(false); void finish(); }} onCancel={() => setAskExit(false)} />
      )}
      <div className="s-top">
        <button className="icon-btn" aria-label="סיום" onClick={() => { if (done >= 3) setAskExit(true); else onExit(); }}><Icon name="close" /></button>
        <SessionProgress title={plan.title} done={done} total={cfg.count} showMarks={!isTest} marks={attempts.current.map((a) => a.correct)}
          budget={cfg.timeBudgetMs ? { startedAt: startedAt.current, ms: cfg.timeBudgetMs } : undefined} />
        <span style={{ width: 44 }} />
      </div>
      <div className="s-stage">
        <div className="faint" style={{ textAlign: 'center', marginBottom: 8 }}>מהתו האפור לתו השחור: כמה, ולאן? · {q.clef === 'treble' ? 'מפתח סול' : 'מפתח פה'}</div>
        <div className={`staff-card ${chosen !== null && !isTest ? (correct ? 'flash-good' : 'flash-bad') : ''}`}>
          <div key={questionKey(q) + done} className="note-in">
            <Staff clef={q.clef} notes={notes} scale={scale} ariaLabel={`שני תווים: ${pitchName(q.a)} ואחריו תו שני`} />
          </div>
          <div className={`timer ${cfg.timeLimitMs && chosen === null ? 'run' : ''}`} aria-hidden="true">
            <span key={done} style={{ animationDuration: `${cfg.timeLimitMs ?? 0}ms`, opacity: cfg.timeLimitMs ? 1 : 0 }} />
          </div>
        </div>
        <div className="feedback" aria-live="polite">
          {chosen !== null && !isTest && (correct
            ? <div className="big" style={{ color: 'var(--good)' }}>{intervalText(q.dist)} · {intervalNumber(q.dist) > 1 ? `${pitchName(q.a)} → ${pitchName(q.b)}` : pitchName(q.a)}</div>
            : <><div className="big">{chosen === 99 ? 'הזמן נגמר' : 'לא בדיוק'}</div><div>{explainInterval(q)}</div></>)}
        </div>
      </div>
      {!isTest && (
        <div className="s-tools">
          {chosen !== null && !correct ? <button className="btn primary small" onClick={next}>המשך</button> : (
            <button className="btn small" disabled={chosen !== null} onClick={() => { listened.current = true; playPair(q); }}><Icon name="sound" size={16} />השמעה</button>
          )}
        </div>
      )}
      <div className="answers">
        <IntervalPad max={max} marks={marks} disabled={chosen !== null} onAnswer={answer} />
      </div>
    </div>
  );
}

/** Diatonic index as a string (stored in attempt meta so the interval can be recovered). */
function midiDiatonic(p: IntervalQuestion['a']): number {
  return p.octave * 7 + 'CDEFGAB'.indexOf(p.letter);
}
