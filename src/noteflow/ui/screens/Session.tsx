import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import {
  anchorFor, evaluateKey, evaluateName, explain, Generator, hint as makeHint, Hint, isBlackAnswer,
  NameAnswer, noteLabel, Question, summarize,
} from '../../engine/exercise';
import { evaluateFinger, explainFinger, fingerFor, handFor, HAND_NAME } from '../../engine/fingers';
import { HandPad } from '../components/HandPad';
import { useExternalNotes } from '../useExternalNotes';
import { SessionPlan, seededRng } from '../../engine/sessions';
import { earnedAchievements } from '../../engine/achievements';
import { computeRecords, Records } from '../../engine/stats';
import { Letter, LETTERS, midi, pitchId, pitchName } from '../../music/pitch';
import { Staff, StaffNote } from '../../notation/Staff';
import type { Melody } from '../../music/songs';
import { useApp, useStore } from '../../state/store';
import type { Attempt, SessionRecord } from '../../storage/types';
import { Icon } from '../components/ui';
import { keyboardRange, Piano } from '../components/Piano';
import { Sheet } from '../components/Sheet';
import { SessionProgress } from '../components/Progress';
import { NamePad } from '../components/NamePad';

export interface NotesResumeState {
  history: { q: Question; correct: boolean }[];
  attempts: Attempt[];
}

export interface ResumeInfo<T> {
  sessionId: string;
  startedAt: number;
  state: T;
}

export interface SessionResult {
  record: SessionRecord;
  plan: SessionPlan;
  attempts: Attempt[];
  newAchievements: string[];
  prevRecords: Records;
  newRecords: Records;
  /** Sequence sessions: the melodies that were read, for playback. */
  melodies?: Melody[];
}

type Phase = 'question' | 'feedback' | 'paused';

interface Feedback {
  correct: boolean;
  chosenName?: NameAnswer | null;
  chosenMidi?: number | null;
  chosenFinger?: number | null;
  text?: string;
  wait: boolean;
}

function useStaffScale(): number {
  const [w, setW] = useState(() => Math.min(window.innerWidth, 900));
  const [h, setH] = useState(() => window.innerHeight);
  useEffect(() => {
    const on = () => { setW(Math.min(window.innerWidth, 900)); setH(window.innerHeight); };
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  // Big and readable, but leave room for the answer pad on short screens.
  // Phone in landscape: staff and answer pad sit side by side (see styles.css), so size by half the width.
  if (h < 520 && w > h) return Math.max(1.0, Math.min(2.2, w / 2 / 210, (h - 170) / 132));
  // Tablets: a bigger staff, readable from a music stand.
  // Tablet in landscape: staff on top, a wide keyboard under it — leave room for both.
  if (window.innerWidth >= 1000 && h >= 600 && window.innerWidth > h) return Math.max(1.25, Math.min(2.3, (h - Math.max(184, h * 0.36) - 290) / 132));
  return Math.max(1.3, Math.min(w >= 760 && h >= 600 ? 3.1 : 2.4, w / 200, (h - 420) / 120));
}

export function Session({ plan, onDone, onExit, resume }: {
  plan: SessionPlan; onDone: (r: SessionResult) => void; onExit: () => void; resume?: ResumeInfo<NotesResumeState>;
}) {
  const app = useApp();
  const store = useStore();
  const { settings } = app;
  const cfg = plan.config;
  const isTest = cfg.mode === 'test';
  const scale = useStaffScale() * (settings.noteSize === 'large' ? 1.2 : 1);

  const startedAt = useRef(resume?.startedAt ?? Date.now());
  const sessionId = useRef(resume?.sessionId ?? `${startedAt.current.toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const [prevRecords] = useState(() => computeRecords(app.attempts, app.sessions));
  const gen = useMemo(() => new Generator({
    mode: cfg.mode, count: cfg.count, pool: plan.pool, reviewPool: plan.reviewPool, reviewShare: plan.reviewPool.length ? 0.25 : 0,
    timeLimitMs: cfg.timeLimitMs, adaptiveTime: !!cfg.adaptiveTime, idx: app.idx, settings,
    rng: plan.seed ? seededRng(plan.seed) : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const history = useRef<{ q: Question; correct: boolean }[]>(resume?.state.history ?? []);
  const attempts = useRef<Attempt[]>(resume?.state.attempts ?? []);
  const [q, setQ] = useState<Question>(() => {
    const first = gen.next(history.current);
    return { ...first, n: history.current.length };
  });
  const qRef = useRef(q);
  const hintRef = useRef(0);
  const listenedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>('question');
  const [fb, setFb] = useState<Feedback | null>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [streak, setStreak] = useState(0);
  const [milestone, setMilestone] = useState<number | null>(null);
  useEffect(() => {
    if (milestone == null) return;
    const t = window.setTimeout(() => setMilestone(null), 1100);
    return () => window.clearTimeout(t);
  }, [milestone]);
  const [xs, setXs] = useState<number[]>([]);
  const [askExit, setAskExit] = useState(false);
  const shownAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const advanceTimer = useRef<number | undefined>(undefined);
  const finished = useRef(false);

  const keyPool = plan.pool.concat(plan.reviewPool).filter((p) => p.skill === 'key');
  const [kLow, kHigh] = useMemo(() => {
    if (!keyPool.length) return [60, 71];
    const ms = keyPool.map((p) => midi(p.pitch));
    return keyboardRange(Math.min(...ms), Math.max(...ms));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const hasKeys = keyPool.length > 0;

  const clearTimers = () => {
    window.clearTimeout(timer.current);
    window.clearTimeout(advanceTimer.current);
  };
  useEffect(() => clearTimers, []);

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    clearTimers();
    store.clearPending();
    const list = attempts.current;
    const summary = summarize(list, settings, cfg.kind === 'stage-test');
    summary.marks = list.map((a) => a.correct);
    const record: SessionRecord = { id: sessionId.current, startedAt: startedAt.current, endedAt: Date.now(), config: cfg, summary };
    store.addSession(record);
    const d = store.getSnapshot();
    const fresh = store.unlockAchievements(earnedAchievements(d.attempts, d.sessions, d.idx, d.settings));
    const newRecords = computeRecords(d.attempts, d.sessions);
    audio.playFlourish();
    await store.flush();
    onDone({ record, plan, attempts: list, newAchievements: fresh, prevRecords, newRecords });
  }, [cfg, onDone, plan, prevRecords, settings, store]);

  const nextQuestion = useCallback(() => {
    clearTimers();
    // Only advance once the current question has been answered (guards double taps / timer races).
    if (history.current.length <= qRef.current.n) return;
    if (history.current.length >= cfg.count) { void finish(); return; }
    if (cfg.timeBudgetMs && Date.now() - startedAt.current >= cfg.timeBudgetMs) { void finish(); return; }
    setFb(null);
    setHintLevel(0);
    hintRef.current = 0;
    listenedRef.current = false;
    const nq = gen.next(history.current);
    qRef.current = nq;
    setQ(nq);
    setPhase('question');
  }, [cfg.count, cfg.timeBudgetMs, finish, gen]);

  const answer = useCallback((value: { name?: NameAnswer | null; midi?: number | null; finger?: number | null }, external = false) => {
    if (phase !== 'question' || finished.current) return;
    // One answer per question, even if two taps land before React re-renders.
    if (history.current.length > q.n) return;
    window.clearTimeout(timer.current);
    const timedOut = value.name === null || value.midi === null || value.finger === null;
    const rt = timedOut ? null : Math.round(performance.now() - shownAt.current);
    const ev = q.skill === 'name' ? evaluateName(q, value.name ?? null)
      : q.skill === 'finger' ? evaluateFinger(q.pitch, q.clef, value.finger ?? null)
        : evaluateKey(q, value.midi ?? null);
    const a: Attempt = {
      sessionId: sessionId.current, ts: Date.now(), skill: q.skill, clef: q.clef, pitch: pitchId(q.pitch),
      answer: q.skill === 'name' ? (value.name ?? null) : q.skill === 'finger' ? (value.finger != null ? String(value.finger) : null)
        : value.midi != null ? String(value.midi) : null,
      correct: ev.correct, rtMs: rt, timeLimitMs: q.timeLimitMs, mode: cfg.mode,
      hints: hintRef.current + (listenedRef.current ? 1 : 0), heard: settings.playNoteOnShow || listenedRef.current, error: ev.error,
      ...(q.keySig ? { meta: `key:${q.keySig}` } : {}),
    };
    attempts.current.push(a);
    history.current.push({ q, correct: ev.correct });
    void store.addAttempt(a);
    store.setPending({
      plan, sessionId: sessionId.current, startedAt: startedAt.current, savedAt: Date.now(),
      done: history.current.length, total: cfg.count,
      state: { history: history.current, attempts: attempts.current } satisfies NotesResumeState,
    });
    setStreak((s) => {
      const n = ev.correct ? s + 1 : 0;
      if (!isTest && n > 0 && n % 5 === 0) setMilestone(n);
      return n;
    });

    // A real piano is heard on its own; the on-screen one sounds the key.
    if (q.skill === 'key' && value.midi != null && !external) audio.playNote(value.midi, 0.9);

    if (isTest) {
      if (q.skill === 'name') audio.playTick();
      nextQuestion();
      return;
    }
    const why = q.skill === 'finger' ? explainFinger(q.pitch, q.clef)
      : cfg.anchors && q.skill === 'name' ? `${explain(q, ev.error)} ${makeHint(q, 3).text}` : explain(q, ev.error);
    if (ev.correct) {
      if (q.skill !== 'key' && settings.playNoteOnAnswer && !settings.playNoteOnShow) audio.playNote(midi(q.pitch), 0.9);
      setFb({ correct: true, chosenName: value.name, chosenMidi: value.midi, chosenFinger: value.finger, wait: false });
      setPhase('feedback');
      advanceTimer.current = window.setTimeout(nextQuestion, 420);
    } else {
      audio.playWrong();
      if (settings.playNoteOnAnswer) {
        const t = audio.context ? audio.context.currentTime + 0.28 : undefined;
        audio.playNote(midi(q.pitch), 0.9, t);
      }
      setFb({ correct: false, chosenName: value.name, chosenMidi: value.midi, chosenFinger: value.finger, text: why, wait: !cfg.autoAdvance });
      setPhase('feedback');
      if (cfg.autoAdvance) advanceTimer.current = window.setTimeout(nextQuestion, 2200);
    }
  }, [cfg.anchors, cfg.autoAdvance, cfg.count, cfg.mode, isTest, nextQuestion, phase, plan, q, settings.playNoteOnAnswer, settings.playNoteOnShow, store]);

  // A real piano or MIDI keyboard answers keyboard questions too.
  const ext = useExternalNotes(q.skill === 'key', (m) => { if (phase === 'question') answer({ midi: m }, true); });

  // Play each new note as it appears (once per question, not again after pause or hints).
  const playedFor = useRef(-1);
  useEffect(() => {
    if (!settings.playNoteOnShow || playedFor.current === q.n) return;
    playedFor.current = q.n;
    // With a real piano listening, keep the example short so it doesn't cover her own note.
    audio.playNote(midi(q.pitch), ext.enabled ? 0.5 : 1.1);
  }, [q, settings.playNoteOnShow, ext.enabled]);

  // Start measuring once the note is actually on screen; arm the time limit.
  useEffect(() => {
    if (phase !== 'question') return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        shownAt.current = performance.now();
        if (q.timeLimitMs) timer.current = window.setTimeout(() => answer({ name: null, midi: null }), q.timeLimitMs);
      });
    });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); window.clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, phase]);

  // Desktop keyboard support: letter keys answer name questions.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (askExit || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (phase === 'feedback' && (e.key === ' ' || e.key === 'Enter')) { nextQuestion(); return; }
      if (q.skill === 'name' && (LETTERS as readonly string[]).includes(k)) answer({ name: k as Letter });
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [answer, askExit, nextQuestion, phase, q.skill]);

  const hint: Hint | null = hintLevel ? makeHint(q, hintLevel as 1 | 2 | 3) : null;

  const notes: StaffNote[] = [];
  const anchor = hint?.anchor ?? (cfg.anchors && q.skill === 'name' ? anchorFor(q.pitch, q.clef) : undefined);
  if (anchor && phase === 'question') notes.push({ pitch: anchor, role: 'ghost' });
  notes.push({ pitch: q.pitch, role: fb ? (fb.correct ? 'correct' : 'wrong') : 'target' });

  const done = history.current.length;

  // A checkpoint saved after the last answer: finish right away.
  useEffect(() => {
    if (history.current.length >= cfg.count) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving the app (call, message, lock screen) pauses the clock instead of counting misses.
  useEffect(() => {
    const on = () => {
      if (!document.hidden) return;
      audio.cancelScheduled();
      if (phase === 'question') { window.clearTimeout(timer.current); setPhase('paused'); }
    };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [phase]);

  const exit = () => {
    if (done < 3) { clearTimers(); store.clearPending(); onExit(); return; }
    window.clearTimeout(timer.current);
    window.clearTimeout(advanceTimer.current);
    if (phase === 'question') setPhase('paused');
    setAskExit(true);
  };

  const togglePause = () => {
    if (phase === 'paused') { setPhase('question'); return; }
    if (phase === 'question') { window.clearTimeout(timer.current); setPhase('paused'); }
  };

  const targetPc = ((midi(q.pitch) % 12) + 12) % 12;
  const nameMarks = (n: NameAnswer): string => {
    if (!fb) return '';
    if (fb.chosenName === n) return fb.correct ? 'good' : 'bad';
    if (fb.correct) return '';
    const isTarget = isBlackAnswer(n)
      ? q.pitch.accidental !== 0 && ((midi({ letter: n[0] as Letter, octave: 4, accidental: 1 }) % 12) === targetPc)
      : q.pitch.accidental === 0 && q.pitch.letter === n;
    return isTarget ? 'reveal' : '';
  };
  const pianoMarks: Record<number, 'good' | 'bad' | 'reveal'> = {};
  if (fb && q.skill === 'key') {
    if (fb.chosenMidi != null) pianoMarks[fb.chosenMidi] = fb.correct ? 'good' : 'bad';
    if (!fb.correct) pianoMarks[midi(q.pitch)] = 'reveal';
  }

  const clefName = q.clef === 'treble' ? 'מפתח סול' : 'מפתח פה';
  const prompt = q.skill === 'name' ? 'איזה תו זה?' : q.skill === 'finger' ? `איזו אצבע מנגנת? · ${HAND_NAME[handFor(q.clef)]}`
    : ext.enabled ? 'נגני את התו — על הפסנתר או כאן' : 'מצאי את הקליד';
  const fingerMarks = (f: number): string => {
    if (!fb) return '';
    if (fb.chosenFinger === f) return fb.correct ? 'good' : 'bad';
    return !fb.correct && fingerFor(q.pitch, q.clef) === f ? 'reveal' : '';
  };

  return (
    <div className="session">
      {askExit && (
        <Sheet title="לסיים את האימון?" body={`ענית על ${done} מתוך ${cfg.count}. התוצאות עד עכשיו יישמרו.`}
          confirmLabel="סיום ושמירה" cancelLabel="להמשיך לתרגל"
          onConfirm={() => { setAskExit(false); void finish(); }}
          onCancel={() => { setAskExit(false); if (phase === 'feedback') nextQuestion(); }} />
      )}
      <div className="s-top">
        <button className="icon-btn" onClick={exit} aria-label="סיום"><Icon name="close" /></button>
        <SessionProgress title={plan.title} done={done} total={cfg.count} showMarks={!isTest}
          marks={history.current.map((h) => h.correct)} notes={history.current.map((h) => h.q.pitch.letter)} paused={phase === 'paused'}
          budget={cfg.timeBudgetMs ? { startedAt: startedAt.current, ms: cfg.timeBudgetMs } : undefined} />
        {!isTest && streak >= 3 ? (
          <span className={`chip gold num ${milestone ? 'milestone' : ''}`} key={milestone ?? 0} aria-label={`רצף ${streak}`}><Icon name="flame" size={14} />{streak}</span>
        ) : <span style={{ width: 44 }} />}
      </div>

      <div className="s-stage">
        <div className="faint" style={{ textAlign: 'center', marginBottom: 8 }}>{prompt}{q.skill === 'finger' ? '' : ` · ${clefName}`}{q.keySig ? ' · שימי לב לסימן הסולם' : ''}</div>
        <div className={`staff-card ${fb ? (fb.correct ? 'flash-good' : 'flash-bad') : ''} ${milestone ? 'milestone' : ''}`}
          onClick={() => { if (phase === 'feedback' && !fb?.correct) nextQuestion(); }}>
          {milestone && <span className="streak-toast" aria-live="polite">{milestone} ברצף</span>}
          {phase === 'paused' && (
            <div className="paused">
              <button className="btn primary big" onClick={togglePause}><Icon name="play" />המשך</button>
            </div>
          )}
          {fb && xs.length > 0 && (
            <span className={`note-label ${fb.correct ? 'good' : 'bad'}`} style={{ left: xs[xs.length - 1] + 6 }}>
              {pitchName(q.pitch)}
            </span>
          )}
          {anchor && phase === 'question' && xs.length > 1 && (
            <span className="note-label ghost" style={{ left: xs[0] + 6 }}>{pitchName(anchor)}{cfg.anchors && !hint ? ' · עוגן' : ''}</span>
          )}
          <div key={q.n} className="note-in">
            <Staff clef={q.clef} notes={notes} scale={scale} onLayout={setXs} keySig={q.keySig}
              ariaLabel={`${clefName}, תו על החמשה`} />
          </div>
          <div className={`timer ${q.timeLimitMs && phase === 'question' ? 'run' : ''}`} aria-hidden="true">
            <span key={`${q.n}-${phase}`} style={{ animationDuration: `${q.timeLimitMs ?? 0}ms`, opacity: q.timeLimitMs ? 1 : 0 }} />
          </div>
        </div>

        <div className="feedback" aria-live="polite">
          {fb && !fb.correct && (
            <>
              <div className="big">{fb.chosenName === null || fb.chosenMidi === null ? 'הזמן נגמר' : 'לא בדיוק'}</div>
              <div>{fb.text}</div>
            </>
          )}
          {fb?.correct && <div className="big" style={{ color: 'var(--good)' }}>נכון</div>}
          {!fb && hint && <div>{hint.text}</div>}
        </div>
      </div>

      {!isTest && (
        <div className="s-tools">
          {fb && !fb.correct ? (
            <button className="btn primary small" onClick={nextQuestion}>המשך</button>
          ) : (
            <>
              {settings.hintsEnabled && (
                <button className="btn small" disabled={phase !== 'question' || hintLevel >= 3}
                  onClick={() => { const h = Math.min(3, hintRef.current + 1) as 1 | 2 | 3; hintRef.current = h; setHintLevel(h); }}>
                  <Icon name="bulb" size={16} />{hintLevel === 0 ? 'רמז' : hintLevel < 3 ? 'רמז נוסף' : 'אין עוד רמזים'}
                </button>
              )}
              <button className="btn small" onClick={() => { listenedRef.current = true; audio.playNote(midi(q.pitch), 1); }} disabled={phase !== 'question'}>
                <Icon name="sound" size={16} />השמעה
              </button>
              <button className="btn small" onClick={togglePause} disabled={phase === 'feedback'}>
                <Icon name={phase === 'paused' ? 'play' : 'pause'} size={16} />{phase === 'paused' ? 'המשך' : 'עצירה'}
              </button>
            </>
          )}
        </div>
      )}

      <div className="answers" style={{ minHeight: hasKeys ? 172 : undefined, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {q.skill === 'name' ? (
          <NamePad marks={nameMarks} disabled={phase === 'paused'} onAnswer={(n) => answer({ name: n })} />
        ) : q.skill === 'finger' ? (
          <HandPad hand={handFor(q.clef)} marks={fingerMarks} disabled={phase !== 'question'} onAnswer={(f) => answer({ finger: f })} />
        ) : (
          <Piano low={kLow} high={kHigh} disabled={phase !== 'question'}
            showNames={!isTest && settings.showKeyNames}
            marks={pianoMarks}
            onPress={(m) => { audio.unlock(); answer({ midi: m }); }} />
        )}
      </div>
    </div>
  );
}

export { noteLabel };
