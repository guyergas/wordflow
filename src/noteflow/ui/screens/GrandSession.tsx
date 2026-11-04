// Two hands: reading on the grand staff. Notes are answered in reading order — by time, and at the same moment
// the left hand (bass staff) first, then the right hand.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { earnedAchievements } from '../../engine/achievements';
import { evaluateKey, evaluateName, explain, NameAnswer, Question, summarize } from '../../engine/exercise';
import { fingerFor, HAND_NAME, handFor } from '../../engine/fingers';
import { GrandPiece, grandMelody, grandPairs, odeHands, piecesBars, readingOrder } from '../../engine/grand';
import { SessionPlan } from '../../engine/sessions';
import { computeRecords } from '../../engine/stats';
import { midi, pitchId } from '../../music/pitch';
import { GrandScore } from '../../notation/GrandScore';
import type { ScoreRole } from '../../notation/Score';
import { useApp, useStore } from '../../state/store';
import type { Attempt, SessionRecord } from '../../storage/types';
import { NamePad } from '../components/NamePad';
import { keyboardRange, Piano } from '../components/Piano';
import { SessionProgress } from '../components/Progress';
import { Sheet } from '../components/Sheet';
import { Icon } from '../components/ui';
import { useExternalNotes } from '../useExternalNotes';
import type { SessionResult } from './Session';

function makePieces(plan: SessionPlan): GrandPiece[] {
  const cfg = plan.config;
  const ranges = (cfg.ranges ?? []).map((r) => ({ clef: r.clef, from: r.from, to: r.to }));
  if (cfg.grandMode === 'song' || cfg.songIds?.includes('ode')) return [odeHands()];
  const out: GrandPiece[] = [];
  let n = 0;
  let total = 0;
  const rng = Math.random;
  while (total < cfg.count && out.length < 8) {
    const p = cfg.grandMode === 'melody' ? grandMelody(ranges, rng, n++) : grandPairs(ranges, rng, 8, n++);
    out.push(p);
    total += p.notes.filter((x) => x.pitch).length;
  }
  return out;
}

export function GrandSession({ plan, onDone, onExit }: { plan: SessionPlan; onDone: (r: SessionResult) => void; onExit: () => void }) {
  const app = useApp();
  const store = useStore();
  const { settings } = app;
  const cfg = plan.config;
  const isTest = cfg.mode === 'test';
  const skill = cfg.skill === 'key' ? 'key' : 'name';
  const [pieces] = useState(() => makePieces(plan));
  const orders = useMemo(() => pieces.map(readingOrder), [pieces]);
  const total = orders.reduce((a, o) => a + o.length, 0);
  const startedAt = useRef(Date.now());
  const sessionId = useRef(`${startedAt.current.toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const [prevRecords] = useState(() => computeRecords(app.attempts, app.sessions));
  const attempts = useRef<Attempt[]>([]);
  const [pi, setPi] = useState(0);
  const [k, setK] = useState(0); // position in the reading order of piece pi
  const [results, setResults] = useState<Record<string, 'good' | 'bad'>>({});
  const [flash, setFlash] = useState<{ ok: boolean; text?: string } | null>(null);
  const [askExit, setAskExit] = useState(false);
  const [paused, setPaused] = useState(false);
  const shownAt = useRef(performance.now());
  const timer = useRef<number | undefined>(undefined);
  const finished = useRef(false);
  const busy = useRef(false);
  const done = attempts.current.length;

  const piece = pieces[pi];
  const order = orders[pi];
  const ni = order[k];
  const note = piece?.notes[ni];
  const w = Math.min(window.innerWidth, 900) - 24;
  const perLine = w >= 620 ? 4 : 2;
  const scale = Math.max(0.95, Math.min(1.5, w / (perLine === 4 ? 560 : 300))) * (settings.noteSize === 'large' ? 1.12 : 1);

  const [kLow, kHigh] = useMemo(() => {
    const ms = pieces.flatMap((p) => p.notes.filter((x) => x.pitch).map((x) => midi(x.pitch!)));
    return keyboardRange(Math.min(...ms), Math.max(...ms));
  }, [pieces]);

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    window.clearTimeout(timer.current);
    const list = attempts.current;
    const summary = summarize(list, settings, cfg.kind === 'stage-test');
    summary.marks = list.map((a) => a.correct);
    const record: SessionRecord = { id: sessionId.current, startedAt: startedAt.current, endedAt: Date.now(), config: cfg, summary };
    store.addSession(record);
    const d = store.getSnapshot();
    const fresh = store.unlockAchievements(earnedAchievements(d.attempts, d.sessions, d.idx, d.settings));
    audio.playFlourish();
    await store.flush();
    onDone({ record, plan, attempts: list, newAchievements: fresh, prevRecords, newRecords: computeRecords(d.attempts, d.sessions) });
  }, [cfg, onDone, plan, prevRecords, settings, store]);

  const advance = useCallback(() => {
    if (cfg.timeBudgetMs && Date.now() - startedAt.current >= cfg.timeBudgetMs) { void finish(); return; }
    if (k + 1 < order.length) { setK(k + 1); return; }
    if (pi + 1 < pieces.length) { setPi(pi + 1); setK(0); return; }
    void finish();
  }, [cfg.timeBudgetMs, finish, k, order.length, pi, pieces.length]);

  const answer = useCallback((value: { name?: NameAnswer | null; midi?: number | null }, external = false) => {
    if (paused || !note?.pitch || finished.current || busy.current) return;
    busy.current = true;
    window.clearTimeout(timer.current);
    const q: Question = { n: done, skill, clef: note.clef, pitch: note.pitch, timeLimitMs: cfg.timeLimitMs };
    const timedOut = value.name === null || value.midi === null;
    const ev = skill === 'name' ? evaluateName(q, value.name ?? null) : evaluateKey(q, value.midi ?? null);
    const a: Attempt = {
      sessionId: sessionId.current, ts: Date.now(), skill, clef: note.clef, pitch: pitchId(note.pitch),
      answer: skill === 'name' ? (value.name ?? null) : value.midi != null ? String(value.midi) : null,
      correct: ev.correct, rtMs: timedOut ? null : Math.round(performance.now() - shownAt.current),
      timeLimitMs: cfg.timeLimitMs, mode: cfg.mode, hints: 0, heard: false, error: ev.error, meta: 'grand',
    };
    attempts.current.push(a);
    store.addAttempt(a);
    setResults((r) => ({ ...r, [`${pi}:${ni}`]: ev.correct ? 'good' : 'bad' }));
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
    advance();
    busy.current = false;
  }, [advance, cfg.mode, cfg.timeLimitMs, done, isTest, ni, note, paused, pi, skill, store]);

  const ext = useExternalNotes(skill === 'key', (m) => { if (!paused) answer({ midi: m }, true); });

  useEffect(() => {
    if (paused || !note?.pitch) return;
    shownAt.current = performance.now();
    if (cfg.timeLimitMs) timer.current = window.setTimeout(() => answer({ name: null, midi: null }), cfg.timeLimitMs);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pi, k, paused]);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), flash.ok ? 500 : 2200);
    return () => window.clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    const on = () => { if (document.hidden) { audio.cancelScheduled(); window.clearTimeout(timer.current); setPaused(true); } };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  useEffect(() => () => { window.clearTimeout(timer.current); audio.cancelScheduled(); }, []);

  if (!piece || !note) return null;

  const bar = Math.floor(note.at / 4);
  const line = Math.floor(bar / perLine);
  const firstBar = line * perLine;
  const lastBar = Math.min(piece.bars, firstBar + perLine);
  const showFingers = settings.showFingers && !isTest;
  const bars = piecesBars(piece, firstBar, lastBar, (i): ScoreRole => {
    if (i === ni) return 'current';
    const r = results[`${pi}:${i}`];
    if (r) return isTest ? 'done' : r;
    return 'normal';
  }, showFingers ? (i) => { const n = piece.notes[i]; return n.pitch ? fingerFor(n.pitch, n.clef) ?? undefined : undefined; } : undefined);

  const hand = HAND_NAME[handFor(note.clef)];
  const playPiece = () => {
    audio.unlock();
    audio.playEvents(piece.notes.filter((n) => n.pitch).map((n) => ({ midi: midi(n.pitch!), at: n.at, beats: n.beats, velocity: n.clef === 'bass' ? 0.55 : 0.8 })), 84);
  };

  return (
    <div className="session grand-session">
      {askExit && (
        <Sheet title="לסיים את האימון?" body={`קראת ${done} מתוך ${total} תווים. התוצאות עד עכשיו יישמרו.`}
          confirmLabel="סיום ושמירה" cancelLabel="להמשיך"
          onConfirm={() => { setAskExit(false); void finish(); }} onCancel={() => { setAskExit(false); setPaused(false); }} />
      )}
      <div className="s-top">
        <button className="icon-btn" aria-label="סיום" onClick={() => { if (done < 3) onExit(); else { setPaused(true); setAskExit(true); } }}><Icon name="close" /></button>
        <SessionProgress title={plan.title} done={done} total={total} paused={paused} showMarks={!isTest} marks={attempts.current.map((a) => a.correct)}
          budget={cfg.timeBudgetMs ? { startedAt: startedAt.current, ms: cfg.timeBudgetMs } : undefined} />
        <button className="icon-btn" aria-label={paused ? 'המשך' : 'עצירה'} onClick={() => setPaused(!paused)}><Icon name={paused ? 'play' : 'pause'} /></button>
      </div>
      <div className="s-stage">
        <div className="faint seq-title">
          {piece.title !== 'זוגות' ? `${piece.title} · ` : ''}עכשיו: <b className={`hand-chip ${note.clef}`}>{hand} · {note.clef === 'treble' ? 'מפתח סול' : 'מפתח פה'}</b>
        </div>
        <div className={`staff-card ${flash ? (flash.ok ? 'flash-good' : 'flash-bad') : ''}`}>
          {paused && !askExit && (
            <div className="paused"><button className="btn primary big" onClick={() => setPaused(false)}><Icon name="play" />המשך</button></div>
          )}
          <GrandScore bars={bars} scale={scale} showTime={line === 0} ariaLabel="שתי חמשות: מפתח סול למעלה, מפתח פה למטה" />
          {cfg.timeLimitMs != null && (
            <div className={`timer ${!paused ? 'run' : ''}`} aria-hidden="true">
              <span key={`${pi}-${k}-${paused}`} style={{ animationDuration: `${cfg.timeLimitMs}ms` }} />
            </div>
          )}
        </div>
        <div className="feedback" aria-live="polite">
          {flash && !flash.ok && <div>{flash.text}</div>}
          {!flash && done === 0 && <div className="faint">התו המודגש הוא התו הנוכחי. כשיש שני תווים יחד — קודם התחתון (יד שמאל), אחר כך העליון.{ext.enabled ? ' אפשר לנגן על הפסנתר.' : ''}</div>}
        </div>
      </div>
      {!isTest && (
        <div className="s-tools">
          <button className="btn small" onClick={playPiece}><Icon name="play" size={14} />האזנה לשתי הידיים</button>
        </div>
      )}
      <div className="answers" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {skill === 'name' ? (
          <NamePad disabled={paused} onAnswer={(n) => answer({ name: n })} />
        ) : (
          <Piano low={kLow} high={kHigh} disabled={paused} showNames={!isTest && settings.showKeyNames}
            onPress={(m) => { audio.unlock(); answer({ midi: m }); }} />
        )}
      </div>
    </div>
  );
}
