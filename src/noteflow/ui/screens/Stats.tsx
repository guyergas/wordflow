import { useMemo, useState } from 'react';
import { ACHIEVEMENTS } from '../../engine/achievements';
import { itemsForRanges, ltrTitle, RECOMMENDED_ORDER, Skill, stageById, stageExercise, stageItems } from '../../engine/curriculum';
import { buildIndex, computeRecords, dayKey, itemMastery, median, stageProgress } from '../../engine/stats';
import { Clef, midi, naturalRange, pitchId, pitchName } from '../../music/pitch';
import { MasteryKeyboard } from '../components/MasteryKeyboard';
import { WeeklyCard } from '../components/WeeklyCard';
import { useApp } from '../../state/store';
import type { Attempt, ErrorType } from '../../storage/types';
import { Bar, fmtPct, fmtSec, Icon, Seg, TopBar } from '../components/ui';

const DAY = 86_400_000;
const ERR_LABEL: Record<ErrorType, string> = {
  adjacent: 'תו סמוך', clef: 'בלבול בין מפתחות', accidental: 'דיאז / במול', octave: 'אוקטבה שגויה', direction: 'כיוון הפוך', timeout: 'החמצה בגלל זמן', other: 'טעות אחרת',
};

interface Point { day: string; ts: number; acc: number; med: number | null; n: number }

function LineChart({ points, value, fmt, label, invert }: {
  points: Point[]; value: (p: Point) => number | null; fmt: (x: number) => string; label: string; invert?: boolean;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const W = 320, H = 130, P = { l: 8, r: 8, t: 14, b: 20 };
  const vals = points.map(value);
  const defined = vals.filter((v): v is number => v != null);
  if (defined.length < 2) return <div className="faint" style={{ padding: '18px 0' }}>צריך לפחות שני ימי תרגול כדי לראות מגמה.</div>;
  let lo = Math.min(...defined), hi = Math.max(...defined);
  if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
  const x = (i: number) => P.l + (i / Math.max(1, points.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const d = vals.map((v, i) => (v == null ? '' : `${x(i)},${y(v)}`)).filter(Boolean).join(' L');
  const last = defined[defined.length - 1], first = defined[0];
  const better = invert ? last < first : last > first;
  const s = sel != null ? points[sel] : null;
  return (
    <div style={{ position: 'relative' }}>
      <div className="row between" style={{ marginBottom: 4 }}>
        <b>{label}</b>
        <span className={better ? 'delta-up' : 'faint'} style={{ fontSize: 13 }}>{fmt(first)} ← {fmt(last)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={label} style={{ direction: "ltr" }}
        onPointerLeave={() => setSel(null)}
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const fx = ((e.clientX - r.left) / r.width) * W;
          let best = 0;
          points.forEach((_, i) => { if (Math.abs(x(i) - fx) < Math.abs(x(best) - fx)) best = i; });
          setSel(vals[best] == null ? null : best);
        }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={P.l} x2={W - P.r} y1={P.t + f * (H - P.t - P.b)} y2={P.t + f * (H - P.t - P.b)} stroke="var(--line)" strokeWidth={1} />
        ))}
        <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="var(--line)" strokeWidth={1} />
        <path d={`M${d}`} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {vals.map((v, i) => v != null && (
          <circle key={i} cx={x(i)} cy={y(v)} r={sel === i ? 5 : 3} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
        ))}
        {sel != null && <line x1={x(sel)} x2={x(sel)} y1={P.t} y2={H - P.b} stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 3" />}
        <text x={P.l} y={H - 5} fontSize={10} fill="var(--ink-3)">{new Date(points[0].ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}</text>
        <text x={W - P.r} y={H - 5} fontSize={10} fill="var(--ink-3)" textAnchor="end">{new Date(points[points.length - 1].ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}</text>
      </svg>
      {s && vals[sel!] != null && (
        <div className="chip" style={{ position: 'absolute', top: 24, left: `${(x(sel!) / W) * 100}%`, transform: 'translateX(-50%)', background: 'var(--ink)', color: 'var(--bg)' }}>
          {new Date(s.ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })} · {fmt(vals[sel!]!)} · {s.n} תווים
        </div>
      )}
    </div>
  );
}


export function Stats({ onDrill, onCard }: { onDrill?: (pitch: string, clef: 'treble' | 'bass') => void; onCard?: () => void }) {
  const { attempts, sessions, settings, achievements, idx: fullIdx } = useApp();
  const [period, setPeriod] = useState<7 | 30 | 0>(30);
  const [skill, setSkill] = useState<Skill>('name');
  const [clef, setClef] = useState<Clef>('treble');
  const [range, setRange] = useState<string>('all');
  const [picked, setPicked] = useState<number | null>(null);

  const from = period ? Date.now() - period * DAY : 0;
  const rangeKeys = useMemo(() => (range === 'all' ? null : new Set(stageItems(stageById(range)).map((i) => `${i.clef}:${pitchId(i.pitch)}`))), [range]);
  const filtered: Attempt[] = useMemo(() => attempts.filter((a) =>
    a.ts >= from && a.skill === skill && a.clef === clef && (!rangeKeys || rangeKeys.has(`${a.clef}:${a.pitch}`)),
  ), [attempts, from, skill, clef, rangeKeys]);
  const idx = useMemo(() => buildIndex(filtered, settings), [filtered, settings]);

  const points: Point[] = useMemo(() => {
    const byDay = new Map<string, Attempt[]>();
    for (const a of filtered) byDay.set(dayKey(a.ts), [...(byDay.get(dayKey(a.ts)) ?? []), a]);
    return [...byDay].map(([day, xs]) => ({
      day, ts: xs[0].ts, n: xs.length, acc: xs.filter((a) => a.correct).length / xs.length,
      med: median(xs.filter((a) => a.correct && a.rtMs != null).map((a) => a.rtMs!)),
    })).sort((a, b) => a.ts - b.ts);
  }, [filtered]);

  const notes = (clef === 'treble' ? naturalRange('A3', 'C6') : naturalRange('C2', 'E4'))
    .filter((p) => !rangeKeys || rangeKeys.has(`${clef}:${pitchId(p)}`));
  const rows = notes.map((p) => ({ p, it: idx.get(`${skill}:${clef}:${pitchId(p)}`) }));
  // ♯/♭ notes appear in the table once practised (the fluency map stays on the white keys).
  const accRows = itemsForRanges([clef === 'treble' ? { clef, from: 'A3', to: 'C6', accidentals: true } : { clef, from: 'C2', to: 'E4', accidentals: true }])
    .map((i) => i.pitch).filter((p) => p.accidental !== 0 && (!rangeKeys || rangeKeys.has(`${clef}:${pitchId(p)}`)))
    .map((p) => ({ p, it: idx.get(`${skill}:${clef}:${pitchId(p)}`) }));
  const seen = [...rows, ...accRows].filter((r) => r.it && r.it.attempts > 0);
  const weak = [...seen].sort((a, b) => itemMastery(a.it!, skill, settings) - itemMastery(b.it!, skill, settings)).slice(0, 4);
  const errs: Partial<Record<ErrorType, number>> = {};
  for (const a of filtered) if (a.error) errs[a.error] = (errs[a.error] ?? 0) + 1;
  const errTotal = Object.values(errs).reduce((x, y) => x + (y ?? 0), 0);
  const total = filtered.length;
  const acc = total ? filtered.filter((a) => a.correct).length / total : null;
  const med = median(filtered.filter((a) => a.correct && a.rtMs != null).map((a) => a.rtMs!));
  const records = computeRecords(attempts, sessions);

  return (
    <div className="page with-nav">
      <TopBar title="התקדמות" right={onCard ? <button className="icon-btn" onClick={onCard} aria-label="כרטיס התקדמות חודשי"><Icon name="image" /></button> : undefined} />
      <WeeklyCard onDrill={onDrill} />
      {onCard && (
        <button className="btn block card-link" onClick={onCard}><Icon name="image" size={18} />כרטיס החודש — תמונה לשמור או לשלוח</button>
      )}

      <div className="eyebrow">הנתונים לפרטים</div>
      <div className="card stack">
        <Seg value={period} onChange={setPeriod} options={[{ value: 7, label: '7 ימים' }, { value: 30, label: '30 ימים' }, { value: 0, label: 'הכל' }]} />
        <Seg value={skill} onChange={setSkill} options={[{ value: 'name', label: 'שמות' }, { value: 'key', label: 'מקלדת' }]} />
        <Seg value={clef} onChange={(c) => { setClef(c); setRange('all'); }} options={[{ value: 'treble', label: 'מפתח סול' }, { value: 'bass', label: 'מפתח פה' }]} />
        <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="טווח">
          <option value="all">כל הטווח</option>
          {RECOMMENDED_ORDER.map(stageById).filter((s) => s.ranges.some((r) => r.clef === clef)).map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>

      <div className="kv" style={{ marginTop: 12 }}>
        <div className="stat"><b className="num">{fmtPct(acc)}</b><small>ידע — דיוק</small></div>
        <div className="stat"><b className="num">{fmtSec(med)}</b><small>שטף — זמן חציוני</small></div>
        <div className="stat"><b className="num">{total}</b><small>ניסיונות בתקופה</small></div>
        <div className="stat"><b className="num">{records.bestStreak}</b><small>שיא רצף (כללי)</small></div>
      </div>

      <div className="eyebrow">מפת שטף</div>
      <div className="card">
        <div className="faint" style={{ marginBottom: 10 }}>כל קליד מתמלא בפליז לפי שליטה אמיתית: דיוק, מהירות, ומספיק ניסיונות. הקישי על קליד לפרטים.</div>
        <MasteryKeyboard idx={idx} settings={settings} skill={skill} clefs={[clef]}
          low={clef === 'treble' ? 57 : 36} high={clef === 'treble' ? 84 : 64}
          onKey={(m) => setPicked(m)} />
        {picked != null && (() => {
          const row = [...rows, ...accRows].find((r) => midi(r.p) === picked);
          const it = row?.it;
          return (
            <div className="faint" style={{ marginTop: 10, textAlign: 'center' }}>
              <b className="ltr" style={{ color: 'var(--ink)' }}>{row ? pitchName(row.p) : '—'}</b>{' · '}
              {it ? `דיוק ${fmtPct(it.acc)} · חציון ${fmtSec(it.medianRt)} · ${it.attempts} ניסיונות` : 'עוד לא תורגל'}
            </div>
          );
        })()}
      </div>

      <div className="eyebrow">מגמה לאורך זמן</div>
      <div className="card stack">
        <LineChart points={points} value={(p) => p.acc} fmt={(x) => `${Math.round(x * 100)}%`} label="דיוק יומי" />
        <LineChart points={points} value={(p) => p.med} fmt={(x) => fmtSec(x)} label="זמן זיהוי חציוני" invert />
      </div>

      {weak.length > 0 && (
        <>
          <div className="eyebrow">התווים החלשים</div>
          <div className="card">
            <ul className="list">
              {weak.map(({ p, it }) => (
                <li key={pitchId(p)}><b className="ltr">{pitchName(p)}</b>
                  <span className="muted num">{fmtPct(it!.acc)} · {fmtSec(it!.medianRt)}</span></li>
              ))}
            </ul>
          </div>
        </>
      )}

      {errTotal > 0 && (
        <>
          <div className="eyebrow">סוגי טעויות</div>
          <div className="card stack">
            {(Object.entries(errs) as [ErrorType, number][]).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k}>
                <div className="row between" style={{ fontSize: 14 }}><span>{ERR_LABEL[k]}</span><span className="num faint">{v}</span></div>
                <Bar value={v / errTotal} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="eyebrow">לפי תו</div>
      <div className="card" style={{ overflowX: 'auto' }}>
        {seen.length === 0 ? <div className="faint">אין עדיין נתונים בסינון הזה.</div> : (
          <table className="notes">
            <thead><tr><th>תו</th><th>דיוק</th><th>חציון</th><th>פיזור</th><th>ניסיונות</th></tr></thead>
            <tbody>
              {seen.map(({ p, it }) => (
                <tr key={pitchId(p)}>
                  <td className="ltr"><b>{pitchName(p)}</b></td>
                  <td className="num">{fmtPct(it!.acc)}</td>
                  <td className="num">{fmtSec(it!.medianRt)}</td>
                  <td className="num">{it!.sdRt != null ? `±${(it!.sdRt / 1000).toFixed(2)}` : '—'}</td>
                  <td className="num">{it!.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="faint" style={{ marginTop: 8 }}>דיוק וחציון מחושבים על 20 הניסיונות האחרונים של כל תו בתקופה.</div>
      </div>

      {(() => {
        const rs = sessions.filter((x) => x.summary.rhythm && x.endedAt >= from).slice(-12);
        if (!rs.length) return null;
        const bias = rs.flatMap((x) => (x.summary.rhythm!.meanOffsetMs != null ? [x.summary.rhythm!.meanOffsetMs] : []));
        const avg = bias.length ? Math.round(bias.reduce((a, b) => a + b, 0) / bias.length) : null;
        return (
          <>
            <div className="eyebrow">מקצב</div>
            <div className="card">
              <div className="rbars" role="img" aria-label="אחוז הצלילים בזמן בכל אימון מקצב">
                {rs.map((x) => (
                  <div key={x.id} className="rbar" title={`${new Date(x.endedAt).toLocaleDateString('he-IL')} · ${Math.round(x.summary.rhythm!.timingAccuracy * 100)}%`}>
                    <span style={{ height: `${Math.max(4, x.summary.rhythm!.timingAccuracy * 100)}%` }} />
                    <small className="num">{Math.round(x.summary.rhythm!.timingAccuracy * 100)}</small>
                  </div>
                ))}
              </div>
              <div className="faint" style={{ marginTop: 8 }}>
                אחוז הצלילים בזמן בכל אימון (מהישן לחדש).{avg != null && <> נטייה כללית: <b dir="ltr" className="num">{avg > 0 ? '+' : ''}{avg}ms</b> — {avg < -20 ? 'מעט לפני הפעימה' : avg > 20 ? 'מעט אחרי הפעימה' : 'מדויק על הפעימה'}.</>}
              </div>
            </div>
          </>
        );
      })()}

      <div className="eyebrow">התקדמות במסלול</div>
      <div className="card stack">
        {RECOMMENDED_ORDER.map((id) => {
          const st = stageById(id);
          const pn = stageProgress(st, 'name', fullIdx, sessions, settings);
          const rhythm = stageExercise(st) === 'rhythm';
          const pk = rhythm ? pn : stageProgress(st, 'key', fullIdx, sessions, settings);
          return (
            <div key={id}>
              <div className="row between" style={{ fontSize: 14 }}><b className={ltrTitle(st) ? 'ltr' : undefined}>{st.title}</b>
                <span className="faint num">{rhythm ? `מקצב ${Math.round(pn.progress * 100)}%` : `שמות ${Math.round(pn.progress * 100)}% · מקלדת ${Math.round(pk.progress * 100)}%`}</span></div>
              <Bar value={(pn.progress + pk.progress) / 2} gold={pn.status === 'mastered'} />
            </div>
          );
        })}
      </div>

      <div className="eyebrow">שיאים והישגים</div>
      <div className="card">
        <div className="faint" style={{ marginBottom: 6 }}>
          קריאה מהירה ביותר (חציון מפגש): <b>{fmtSec(records.fastestMedianName)}</b> · ציון מבחן גבוה: <b>{records.bestTestScore ?? '—'}</b> · תווים שזוהו נכון: <b className="num">{records.totalNotes}</b>
        </div>
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className={`ach ${achievements[a.id] ? 'on' : ''}`}>
            <span className="medal"><Icon name="medal" size={18} /></span>
            <div><b>{a.title}</b><div className="faint">{a.desc}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
