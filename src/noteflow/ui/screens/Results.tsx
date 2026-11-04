import { useEffect, useMemo, useState } from 'react';
import { audio } from '../../audio/engine';
import { midi } from '../../music/pitch';
import type { Melody, MelodyNote } from '../../music/songs';
import { endingPhrase, phraseMidi } from '../../engine/extras';
import { Score, ScoreNote } from '../../notation/Score';
import { ACHIEVEMENTS } from '../../engine/achievements';
import { stageById } from '../../engine/curriculum';
import { answerLabel, noteLabel } from '../../engine/exercise';
import { median, targetFor } from '../../engine/stats';
import { useApp } from '../../state/store';
import type { Attempt, ErrorType, SessionRecord } from '../../storage/types';
import { fmtPct, fmtSec, Icon, Ring, TopBar } from '../components/ui';
import { SessionKeys } from '../components/SessionKeys';
import type { SessionResult } from './Session';

function comparable(a: SessionRecord, b: SessionRecord): boolean {
  return a.id !== b.id && a.config.kind === b.config.kind && a.config.mode === b.config.mode && a.config.skill === b.config.skill
    && a.config.stageId === b.config.stageId && JSON.stringify(a.config.ranges ?? null) === JSON.stringify(b.config.ranges ?? null);
}

function advice(attempts: Attempt[], r: SessionRecord, fluencyTargetMs: number, masteryAccuracy: number): string[] {
  const out: string[] = [];
  const s = r.summary;
  const errs: Partial<Record<ErrorType, number>> = {};
  for (const a of attempts) if (a.error) errs[a.error] = (errs[a.error] ?? 0) + 1;
  const target = targetFor(r.config.skill, { fluencyTargetMs });
  if (r.config.kind === 'stage-test' && !s.passed) {
    const missing: string[] = [];
    if (s.accuracy < masteryAccuracy) missing.push(`דיוק (${fmtPct(s.accuracy)}, נדרשים ${fmtPct(masteryAccuracy)})`);
    if (s.medianRt == null || s.medianRt > target) missing.push(`מהירות (חציון ${fmtSec(s.medianRt)}, היעד ${fmtSec(target)})`);
    out.push(`עוד קצת: ${missing.join(' ו')}. האימון המומלץ יתמקד בדיוק בזה.`);
  }
  if ((errs.clef ?? 0) >= 2) out.push('כמה טעויות נבעו מקריאה במפתח הלא נכון — לפני כל תו, הציצי רגע בסימן המפתח.');
  if ((errs.adjacent ?? 0) >= 2) out.push(r.config.exercise === 'sequence'
    ? 'רוב הטעויות היו בצעד אחד מהתשובה. במנגינה, השווי לתו הקודם: עולה, יורד או חוזר — רוב הצעדים קטנים.'
    : 'רוב הטעויות היו בצעד אחד מהתשובה. רמז העוגן (הרמז השני) מאמן בדיוק את הספירה הזאת.');
  if ((errs.accidental ?? 0) >= 2) out.push('כמה טעויות היו בסימן ♯ או ♭. לפני כל תו, הציצי אם יש לפניו סימן: ♯ — הקליד השחור מימין, ♭ — הקליד השחור משמאל.');
  if ((errs.octave ?? 0) >= 1) out.push('האות הייתה נכונה אבל האוקטבה לא. Middle C הוא C4 — הקליד הלבן שמשמאל לזוג הקלידים השחורים במרכז.');
  if ((errs.timeout ?? 0) >= 2) out.push('היו החמצות בגלל הזמן. זה בסדר — המהירות תגיע מעצמה ככל שהזיהוי יהיה אוטומטי.');
  if (s.slowNotes.length && s.slowNotes[0].medianRt > target) out.push(`התווים האיטיים ביותר: ${s.slowNotes.map((x) => x.key).join(', ')}. הם יופיעו יותר באימון הבא.`);
  if (!out.length && s.accuracy >= 0.95) out.push('ביצוע נקי. האימון הבא ידחוף מעט את המהירות.');
  return out;
}

function rhythmAdvice(r: NonNullable<SessionRecord['summary']['rhythm']>, passedRequired: boolean): string[] {
  const out: string[] = [];
  if (passedRequired && !(r.timingAccuracy >= 0.85)) out.push(`כדי לעבור צריך 85% מהצלילים בזמן (היה ${Math.round(r.timingAccuracy * 100)}%).`);
  if (r.meanOffsetMs != null && r.meanOffsetMs <= -45) out.push('נטייה להקדים. נסי לחכות לפעימה במקום לרוץ אליה — נשימה קטנה לפני כל הקשה.');
  if (r.meanOffsetMs != null && r.meanOffsetMs >= 45) out.push('נטייה לאחר. אם זה קורה בכל פעם, כדאי לכייל את ההקשה בהגדרות — ייתכן שזו השהיה של המכשיר.');
  if (r.restTaps > 0) out.push('היו הקשות בתוך שתיקה. בשתיקה ממשיכים לספור בראש ולא מקישים.');
  if (r.misses > r.onsets * 0.15) out.push('כמה צלילים לא קיבלו הקשה. אפשר להאט את הקצב בתרגול חופשי ולבנות ביטחון.');
  if (!out.length && r.timingAccuracy >= 0.9) out.push('דופק יציב. אפשר להעלות מעט את הקצב או לעבור לרמה הבאה.');
  return out;
}

/** A short phrase made only of the notes practised — the session ends as music. */
function EndingPhrase({ clef, notes, autoplay }: { clef: 'treble' | 'bass'; notes: MelodyNote[]; autoplay?: boolean }) {
  const play = () => { audio.unlock(); audio.playSequence(phraseMidi(notes), { bpm: 84 }); };
  useEffect(() => {
    if (!autoplay) return;
    const t = window.setTimeout(play, 1400);
    return () => { window.clearTimeout(t); audio.cancelScheduled(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const bars: ScoreNote[][] = [];
  let acc = 0;
  for (const n of notes) { (bars[Math.floor(acc / 4)] ??= []).push({ pitch: n.pitch, beats: n.beats }); acc += n.beats; }
  return (
    <div className="card ending-card">
      <div className="row between">
        <div>
          <div className="eyebrow" style={{ margin: 0 }}>הסיום המוזיקלי</div>
          <b>משפט קטן מהתווים שקראת עכשיו</b>
        </div>
        <button className="btn small" onClick={play}><Icon name="play" size={14} />השמעה</button>
      </div>
      <Score clef={clef} bars={bars} scale={1.05} beams />
    </div>
  );
}

function MelodyPlayer({ melodies }: { melodies: Melody[] }) {
  useEffect(() => () => audio.cancelScheduled(), []);
  const play = (m: Melody, gap?: number) => {
    audio.unlock();
    const notes = gap ? m.quarters : m.rhythmic;
    audio.playSequence(notes.map((x) => ({ midi: x.pitch ? midi(x.pitch) : null, beats: x.beats })), gap ? { gapSec: gap } : { bpm: m.bpm });
  };
  return (
    <>
      <div className="eyebrow">המנגינות שקראת</div>
      <div className="card">
        <ul className="list">
          {melodies.map((m, i) => (
            <li key={`${m.id}-${i}`} style={{ alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <b>{m.category === 'known' ? m.title : `מנגינה מקורית · ${m.title}`}</b>
                <div className="faint" style={{ fontSize: 12.5 }}>{m.category === 'known' ? `${m.composer} · ${m.license}` : 'נוצרה עבורך · CC0'}</div>
              </div>
              <div className="row" style={{ gap: 6, flex: 'none' }}>
                <button className="btn small" onClick={() => play(m)} aria-label={`השמעת ${m.title} בקצב`}><Icon name="play" size={14} />בקצב</button>
                <button className="btn small" onClick={() => play(m, 0.3)}>300ms</button>
              </div>
            </li>
          ))}
        </ul>
        <button className="btn ghost small" style={{ marginTop: 6 }} onClick={() => audio.cancelScheduled()}>עצירת השמעה</button>
      </div>
    </>
  );
}

function shareText(r: SessionRecord): string {
  const s = r.summary;
  const date = new Date(r.endedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
  const what = r.config.couple ? 'אתגר זוגי' : r.config.kind === 'daily' ? 'אתגר היום' : 'NoteFlow';
  const line = (s.marks ?? []).map((m) => (m ? '🟩' : '🟥')).join('');
  return `NoteFlow · ${what} ${date}\n${s.correct}/${s.total} · חציון ${fmtSec(s.medianRt)} · ציון ${s.score}\n${line}`;
}

function ShareCard({ record }: { record: SessionRecord }) {
  const [msg, setMsg] = useState<string | null>(null);
  const text = shareText(record);
  const share = async () => {
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    try {
      if (nav.share && window.self === window.top) { await nav.share({ text }); return; }
    } catch { /* fall back to copy */ }
    try { await navigator.clipboard.writeText(text); setMsg('התוצאה הועתקה — אפשר להדביק בווטסאפ.'); } catch { setMsg('לא הצלחתי להעתיק. אפשר לסמן את הטקסט ולהעתיק ידנית.'); }
  };
  return (
    <div className="card" style={{ marginTop: 12, textAlign: 'center' }}>
      <b>{record.config.couple ? 'שלחי את התוצאה, ובדקי מי קרא מהר יותר' : 'התוצאה של היום'}</b>
      <div className="share-line" aria-label="תוצאה לפי סדר התשובות">{(record.summary.marks ?? []).map((m) => (m ? '🟩' : '🟥')).join('')}</div>
      <pre className="faint" style={{ whiteSpace: 'pre-wrap', margin: '6px 0 10px', fontFamily: 'inherit', userSelect: 'all' }}>{text.split('\n').slice(0, 2).join('\n')}</pre>
      <button className="btn block" onClick={share}>שיתוף התוצאה</button>
      {msg && <div className="faint" style={{ marginTop: 6 }}>{msg}</div>}
    </div>
  );
}

export function Results({ result, onRetry, onContinue, onHome, onMistakes, onNextBlock }: {
  result: SessionResult; onRetry: () => void; onContinue: () => void; onHome: () => void; onMistakes?: () => void;
  /** Daily plan: continue to the next block. */
  onNextBlock?: () => void;
}) {
  const { sessions, settings } = useApp();
  const { record, attempts, newAchievements, prevRecords, newRecords } = result;
  const s = record.summary;
  const prev = useMemo(() => [...sessions].reverse().find((x) => comparable(x, record)), [sessions, record]);
  const rh = s.rhythm;
  const tips = rh ? rhythmAdvice(rh, record.config.kind === 'stage-test' && !s.passed) : advice(attempts, record, settings.fluencyTargetMs, settings.masteryAccuracy);
  const meanAll = median(attempts.filter((a) => a.rtMs != null && a.correct).map((a) => a.rtMs!));

  const records: string[] = [];
  if (newRecords.bestStreak > prevRecords.bestStreak && newRecords.bestStreak >= 5) records.push(`שיא רצף חדש: ${newRecords.bestStreak}`);
  if (newRecords.fastestMedianName != null && prevRecords.fastestMedianName != null && newRecords.fastestMedianName < prevRecords.fastestMedianName)
    records.push(`הקריאה המהירה ביותר שלך: חציון ${fmtSec(newRecords.fastestMedianName)}`);
  if (record.config.mode === 'test' && prevRecords.bestTestScore != null && s.score > prevRecords.bestTestScore)
    records.push(`ציון המבחן הגבוה ביותר שלך: ${s.score}`);

  const delta = (now: number | null, before: number | null, lowerIsBetter = false, fmt: (x: number) => string = String) => {
    if (now == null || before == null) return null;
    const d = now - before;
    if (Math.abs(d) < 1e-9) return <span className="faint">ללא שינוי</span>;
    const better = lowerIsBetter ? d < 0 : d > 0;
    return <span className={better ? 'delta-up' : 'delta-down'}>{better ? '▲' : '▼'} {fmt(Math.abs(d))}</span>;
  };

  const celebrate = !!s.passed || (s.total >= 10 && s.correct === s.total);
  const wins: string[] = [];
  if (record.config.kind === 'stage-test' && s.passed) wins.push(`עברת את מבחן השליטה של ${stageById(record.config.stageId!).title}`);
  if (rh) wins.push(`${rh.onTime} מתוך ${rh.onsets} צלילים בדיוק בזמן`);
  else if (s.total) wins.push(s.correct === s.total ? `כל ${s.total} התשובות נכונות` : `${s.correct} מתוך ${s.total} נכונות`);
  wins.push(...records);
  const fastest = (() => {
    const by = new Map<string, number[]>();
    for (const a of attempts) if (a.correct && a.rtMs != null) by.set(noteLabel(a), [...(by.get(noteLabel(a)) ?? []), a.rtMs]);
    let best: [string, number] | null = null;
    for (const [k, xs] of by) { if (xs.length < 2) continue; const m = median(xs)!; if (!best || m < best[1]) best = [k, m]; }
    return best;
  })();
  if (fastest && !rh) wins.push(`הכי מהיר: ${fastest[0]} — ${fmtSec(fastest[1])}`);
  if (prev && !rh && s.medianRt != null && prev.summary.medianRt != null && s.medianRt < prev.summary.medianRt * 0.95) wins.push(`מהר יותר מהפעם הקודמת: ${fmtSec(prev.summary.medianRt)} ← ${fmtSec(s.medianRt)}`);
  const tip = tips[0] ?? (rh ? 'עוד סבב קצר באותו קצב יבסס את הדופק.' : 'עוד סבב קצר באותו טווח יבסס את הקריאה.');
  const phrase = !rh && attempts.length >= 4 ? endingPhrase(attempts, record.startedAt) : null;
  const lastBlock = !!record.config.daily && !onNextBlock;

  return (
    <div className="page">
      <TopBar title={result.plan.title} onBack={onHome} />

      <div className="card win-card">
        <div className="win-top">
          <Ring value={s.score / 100} size={104}>{s.score}</Ring>
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow" style={{ margin: 0 }}>מה הצלחת</div>
            <h2 className="win-head">{wins[0]}</h2>
            {wins.slice(1, 3).map((w) => <div key={w} className="muted" style={{ fontSize: 14.5 }}>{w}</div>)}
          </div>
        </div>
        {newAchievements.map((id) => {
          const a = ACHIEVEMENTS.find((x) => x.id === id)!;
          return <div key={id} className="row" style={{ marginTop: 10 }}><span className="chip gold"><Icon name="medal" size={14} />הישג חדש</span><b>{a.title}</b></div>;
        })}
        {record.config.kind === 'stage-test' && !s.passed && <div className="pass no" style={{ marginTop: 12 }}>עוד לא עברת — אבל קרוב יותר ממה שנדמה</div>}
        {attempts.length > 0 && <div style={{ marginTop: 14 }}><SessionKeys attempts={attempts} celebrate={celebrate} /></div>}
      </div>

      {phrase && !celebrate && <EndingPhrase clef={phrase.clef} notes={phrase.notes} autoplay={lastBlock} />}

      <div className="card improve-card">
        <div className="eyebrow" style={{ margin: 0 }}>נקודה אחת לשיפור</div>
        <p style={{ margin: '6px 0 12px' }}>{tip}</p>
        {onMistakes ? <button className="btn block" onClick={onMistakes}>תרגול ממוקד בתווים שבלבלו</button>
          : <button className="btn block" onClick={onRetry}>{rh ? 'עוד סבב באותו מקצב' : 'עוד סבב באותם תנאים'}</button>}
      </div>

      {(record.config.kind === 'daily' || record.config.couple) && <ShareCard record={record} />}

      {onNextBlock && record.config.daily && (
        <button className="btn keycta" style={{ marginTop: 16 }} onClick={onNextBlock}>
          ממשיכים לחלק {record.config.daily.index + 2} מתוך {record.config.daily.total}
        </button>
      )}
      <div className="row" style={{ marginTop: onNextBlock ? 10 : 16 }}>
        <button className="btn grow" onClick={onRetry}>נסי שוב</button>
        <button className={`btn grow ${onNextBlock ? '' : 'primary'}`} onClick={onContinue}>{lastBlock ? 'סיימתי להיום' : onNextBlock ? 'לעצור כאן' : 'המשך ללמוד'}</button>
      </div>

      {result.melodies && result.melodies.length > 0 && <MelodyPlayer melodies={result.melodies} />}

      <details className="card details-card">
        <summary>הניתוח המפורט</summary>
      <div className="eyebrow">מדדים</div>
      {rh ? (
        <div className="kv">
          <div className="stat"><b className="num">{fmtPct(rh.timingAccuracy)}</b><small>בזמן · {rh.onTime}/{rh.onsets}</small>
            {prev?.summary.rhythm && <div style={{ fontSize: 13 }}>{delta(rh.timingAccuracy, prev.summary.rhythm.timingAccuracy, false, (x) => `${Math.round(x * 100)}%`)}</div>}</div>
          <div className="stat"><b className="num" dir="ltr">{rh.meanOffsetMs == null ? '—' : `${rh.meanOffsetMs > 0 ? '+' : ''}${rh.meanOffsetMs}ms`}</b>
            <small>{rh.meanOffsetMs == null ? 'סטייה ממוצעת' : rh.meanOffsetMs < -15 ? 'בממוצע מוקדם' : rh.meanOffsetMs > 15 ? 'בממוצע מאוחר' : 'בממוצע בדיוק על הפעימה'}</small></div>
          <div className="stat"><b className="num">{rh.misses}</b><small>צלילים שהוחמצו</small></div>
          <div className="stat"><b className="num">{rh.extras}</b><small>הקשות עודפות{rh.restTaps ? ` · ${rh.restTaps} בשתיקה` : ''}</small></div>
        </div>
      ) : (
      <div className="kv">
        <div className="stat"><b className="num">{fmtPct(s.accuracy)}</b><small>דיוק · {s.correct}/{s.total}</small>
          {prev && <div style={{ fontSize: 13 }}>{delta(s.accuracy, prev.summary.accuracy, false, (x) => `${Math.round(x * 100)}%`)}</div>}</div>
        <div className="stat"><b className="num">{fmtSec(s.medianRt)}</b><small>זמן תגובה חציוני</small>
          {prev && <div style={{ fontSize: 13 }}>{delta(s.medianRt, prev.summary.medianRt, true, (x) => fmtSec(x))}</div>}</div>
        <div className="stat"><b className="num">{fmtSec(s.meanRt)}</b><small>זמן תגובה ממוצע</small></div>
        <div className="stat"><b className="num">{s.misses}</b><small>החמצות בגלל זמן</small></div>
      </div>
      )}
      {prev ? (
        <div className="faint" style={{ marginTop: 8 }}>
          השוואה לפעם הקודמת באותו תרגיל ({new Date(prev.endedAt).toLocaleDateString('he-IL')}): ציון {prev.summary.score} → {s.score}
        </div>
      ) : <div className="faint" style={{ marginTop: 8 }}>זו הפעם הראשונה בתרגיל הזה — בפעם הבאה תופיע השוואה.</div>}

      {(s.wrongNotes.length > 0 || s.slowNotes.length > 0) && (
        <>
          <div className="eyebrow">ניתוח טעויות</div>
          <div className="card">
            {s.wrongNotes.length > 0 && (
              <>
                <h2>טעויות</h2>
                <ul className="list">
                  {s.wrongNotes.map((w) => {
                    const ex = attempts.filter((a) => !a.correct && noteLabel(a) === w.key);
                    const answers = ex.map((a) => (a.answer == null ? 'זמן' : a.skill === 'key' ? '' : answerLabel(a.answer))).filter(Boolean);
                    return (
                      <li key={w.key}><span className="ltr" style={{ fontWeight: 700 }}>{w.key}</span>
                        <span className="muted">{w.count}× {answers.length ? `· ענית ${[...new Set(answers)].join(', ')}` : ''}</span></li>
                    );
                  })}
                </ul>
              </>
            )}
            {s.slowNotes.length > 0 && (
              <>
                <h2 style={{ marginTop: s.wrongNotes.length ? 14 : 0 }}>האיטיים ביותר</h2>
                <ul className="list">
                  {s.slowNotes.map((x) => <li key={x.key}><span className="ltr">{x.key}</span><span className="num muted">{fmtSec(x.medianRt)}</span></li>)}
                </ul>
                {meanAll != null && <div className="faint">החציון שלך בכל המפגש: {fmtSec(meanAll)}</div>}
              </>
            )}
          </div>
        </>
      )}

      {tips.length > 1 && (
        <>
          <div className="eyebrow">עוד המלצות</div>
          <div className="stack">{tips.slice(1).map((t) => <div key={t}>{t}</div>)}</div>
        </>
      )}

      </details>
    </div>
  );
}
