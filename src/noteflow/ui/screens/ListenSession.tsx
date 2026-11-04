// Hear and find: a note sounds; tap where it sits on the staff (three close positions).

import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { earnedAchievements } from '../../engine/achievements';
import { summarize } from '../../engine/exercise';
import { listenQuestion, ListenQuestion } from '../../engine/extras';
import { SessionPlan } from '../../engine/sessions';
import { computeRecords } from '../../engine/stats';
import { midi, pitchId, pitchName } from '../../music/pitch';
import { Staff, StaffNote } from '../../notation/Staff';
import { useApp, useStore } from '../../state/store';
import type { Attempt, SessionRecord } from '../../storage/types';
import { SessionProgress } from '../components/Progress';
import { Icon } from '../components/ui';
import type { SessionResult } from './Session';

export function ListenSession({ plan, onDone, onExit }: { plan: SessionPlan; onDone: (r: SessionResult) => void; onExit: () => void }) {
  const app = useApp();
  const store = useStore();
  const cfg = plan.config;
  const startedAt = useRef(Date.now());
  const sessionId = useRef(`${startedAt.current.toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const [prevRecords] = useState(() => computeRecords(app.attempts, app.sessions));
  const attempts = useRef<Attempt[]>([]);
  const [q, setQ] = useState<ListenQuestion>(() => listenQuestion(plan.pool, Math.random));
  const [chosen, setChosen] = useState<number | null>(null);
  const [xs, setXs] = useState<number[]>([]);
  const shownAt = useRef(performance.now());
  const finished = useRef(false);
  const done = attempts.current.length;
  const scale = Math.max(1.3, Math.min(2.2, Math.min(window.innerWidth, 640) / 210)) * (app.settings.noteSize === 'large' ? 1.15 : 1);

  const play = useCallback((m: number) => { audio.unlock(); audio.playNote(m, 1.1); }, []);

  useEffect(() => {
    shownAt.current = performance.now();
    const t = window.setTimeout(() => play(midi(q.target)), 250);
    return () => window.clearTimeout(t);
  }, [q, play]);

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    const list = attempts.current;
    const summary = summarize(list, app.settings);
    summary.marks = list.map((a) => a.correct);
    const record: SessionRecord = { id: sessionId.current, startedAt: startedAt.current, endedAt: Date.now(), config: cfg, summary };
    store.addSession(record);
    const d = store.getSnapshot();
    const fresh = store.unlockAchievements(earnedAchievements(d.attempts, d.sessions, d.idx, d.settings));
    await store.flush();
    onDone({ record, plan, attempts: list, newAchievements: fresh, prevRecords, newRecords: computeRecords(d.attempts, d.sessions) });
  }, [app.settings, cfg, onDone, plan, prevRecords, store]);

  const answer = (i: number) => {
    if (chosen !== null) return;
    const pick = q.options[i];
    const ok = pitchId(pick) === pitchId(q.target);
    setChosen(i);
    const a: Attempt = {
      sessionId: sessionId.current, ts: Date.now(), skill: 'ear', clef: q.clef, pitch: pitchId(q.target), answer: pitchId(pick),
      correct: ok, rtMs: Math.round(performance.now() - shownAt.current), timeLimitMs: null, mode: 'practice', hints: 0, heard: true,
      error: ok ? undefined : 'adjacent',
    };
    attempts.current.push(a);
    store.addAttempt(a);
    if (!ok) {
      // Hear the difference: the note you picked, then the one that sounded.
      const ctx = audio.context;
      const t = ctx ? ctx.currentTime + 0.1 : undefined;
      audio.playNote(midi(pick), 0.7, t);
      audio.playNote(midi(q.target), 0.9, t != null ? t + 0.75 : undefined);
    }
    window.setTimeout(() => {
      if (attempts.current.length >= cfg.count || (cfg.timeBudgetMs && Date.now() - startedAt.current >= cfg.timeBudgetMs)) { void finish(); return; }
      setChosen(null);
      setQ(listenQuestion(plan.pool, Math.random, pitchId(q.target)));
    }, ok ? 800 : 2300);
  };

  const notes: StaffNote[] = q.options.map((p, i) => ({
    pitch: p,
    role: chosen === null ? 'target' : pitchId(p) === pitchId(q.target) ? 'correct' : i === chosen ? 'wrong' : 'ghost',
  }));

  return (
    <div className="session listen">
      <div className="s-top">
        <button className="icon-btn" aria-label="סיום" onClick={() => { if (done >= 3) void finish(); else onExit(); }}><Icon name="close" /></button>
        <SessionProgress title={plan.title} done={done} total={cfg.count} showMarks marks={attempts.current.map((a) => a.correct)}
          budget={cfg.timeBudgetMs ? { startedAt: startedAt.current, ms: cfg.timeBudgetMs } : undefined} />
        <span style={{ width: 44 }} />
      </div>
      <div className="s-stage">
        <div className="faint" style={{ textAlign: 'center', marginBottom: 8 }}>הקשיבי — איפה התו הזה על החמשה?</div>
        <div className="staff-card listen-card">
          <Staff clef={q.clef} notes={notes} scale={scale} onLayout={setXs} ariaLabel="שלוש אפשרויות על החמשה" />
          <div className="listen-picks" dir="ltr">
            {xs.map((x, i) => (
              <button key={i} className={`pick ${chosen === null ? '' : pitchId(q.options[i]) === pitchId(q.target) ? 'good' : i === chosen ? 'bad' : ''}`}
                style={{ left: x + 6 }} onClick={() => answer(i)} disabled={chosen !== null}
                aria-label={`אפשרות ${i + 1}`}>
                {chosen === null ? ['א', 'ב', 'ג'][i] : pitchName(q.options[i])}
              </button>
            ))}
          </div>
        </div>
        <div className="feedback" aria-live="polite">
          {chosen !== null && (pitchId(q.options[chosen]) === pitchId(q.target)
            ? <div className="big" style={{ color: 'var(--good)' }}>שמעת נכון</div>
            : <div>שמעי את ההבדל: קודם התו שבחרת, ואז התו שנשמע.</div>)}
        </div>
      </div>
      <div className="s-tools">
        <button className="btn" onClick={() => play(midi(q.target))}><Icon name="sound" size={16} />השמעה שוב</button>
      </div>
    </div>
  );
}
