import { useState } from 'react';
import { isWeeklyCheck, weekSummary } from '../../engine/extras';
import { practiceDaysThisWeek } from '../../engine/stats';
import { parsePitch, pitchName } from '../../music/pitch';
import { useApp } from '../../state/store';
import { fmtPct, fmtSec } from './ui';

const nm = (id: string) => { try { return pitchName(parsePitch(id)); } catch { return id; } };

/** "Your week": what changed since last week, in plain sentences, plus the weekly goal and reading checks. */
export function WeeklyCard({ onDrill }: { onDrill?: (pitch: string, clef: 'treble' | 'bass') => void }) {
  const { attempts, sessions, settings } = useApp();
  const w = weekSummary(attempts, sessions);
  const days = practiceDaysThisWeek(sessions).length;
  const checks = sessions.filter(isWeeklyCheck).slice(-6);
  const [msg, setMsg] = useState<string | null>(null);

  const lines: string[] = [];
  lines.push(`קראת ${w.notes} תווים נכון${w.prevNotes ? ` (בשבוע שעבר ${w.prevNotes})` : ''}`);
  if (w.accuracy != null) lines.push(`דיוק ${fmtPct(w.accuracy)}${w.prevAccuracy != null ? ` · בשבוע שעבר ${fmtPct(w.prevAccuracy)}` : ''}`);
  if (w.medianRt != null && w.prevMedianRt != null) {
    const pct = Math.round((1 - w.medianRt / w.prevMedianRt) * 100);
    lines.push(pct > 0 ? `קוראת מהר יותר ב־${pct}% (${fmtSec(w.prevMedianRt)} ← ${fmtSec(w.medianRt)})` : `מהירות: ${fmtSec(w.medianRt)} לתו`);
  }
  if (w.improved) lines.push(`השיפור הגדול: ${nm(w.improved.pitch)} — ${fmtSec(w.improved.from)} ← ${fmtSec(w.improved.to)}`);

  const share = async () => {
    const text = `NoteFlow · השבוע של ${settings.name}\n${lines.join('\n')}${w.weakest ? `\nעוד לחזק: ${nm(w.weakest.pitch)}` : ''}\n${w.days} ימי תרגול · ${w.minutes} דקות`;
    try { await navigator.clipboard.writeText(text); setMsg('הסיכום הועתק — אפשר להדביק בווטסאפ.'); } catch { setMsg('לא הצלחתי להעתיק.'); }
  };

  return (
    <div className="card week-card">
      <div className="row between" style={{ alignItems: 'baseline' }}>
        <h2 style={{ margin: 0 }}>השבוע שלך</h2>
        <span className="faint num">{w.days} ימים · {w.minutes} דקות</span>
      </div>
      <div className="weekbar" aria-label={`יעד שבועי: ${days} מתוך ${settings.weeklyGoalDays} ימים`}>
        {Array.from({ length: settings.weeklyGoalDays }, (_, i) => <i key={i} className={i < days ? 'on' : ''} />)}
        <span className="faint">{days >= settings.weeklyGoalDays ? 'עמדת ביעד השבועי' : `יעד: ${settings.weeklyGoalDays} ימים`}</span>
      </div>
      {w.notes === 0 ? <p className="faint" style={{ margin: '8px 0 0' }}>עוד לא תרגלת השבוע. אין רצפים ואין עונש — רק יעד לשבוע.</p> : (
        <ul className="week-lines">{lines.map((l) => <li key={l}>{l}</li>)}</ul>
      )}
      {w.weakest && (
        <div className="row between" style={{ marginTop: 8 }}>
          <span>עוד לחזק: <b className="ltr">{nm(w.weakest.pitch)}</b> <span className="faint">({fmtPct(w.weakest.acc)} השבוע)</span></span>
          {onDrill && <button className="btn small" onClick={() => onDrill(w.weakest!.pitch, w.weakest!.clef)}>חיזוק קצר</button>}
        </div>
      )}
      {checks.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <b style={{ fontSize: 14 }}>בדיקת הקריאה השבועית</b>
          <div className="checks">
            {checks.map((c) => (
              <div key={c.id} className="chk">
                <b className="num">{fmtPct(c.summary.accuracy)}</b>
                <small className="num">{fmtSec(c.summary.medianRt)}</small>
                <small>{new Date(c.endedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}</small>
              </div>
            ))}
          </div>
          <div className="faint" style={{ fontSize: 12.5 }}>בכל שבוע משפט חדש שלא ראית, באותם תנאים — כך רואים שהקריאה עצמה השתפרה.</div>
        </div>
      )}
      {w.notes > 0 && <button className="btn small ghost" style={{ marginTop: 10 }} onClick={share}>העתקת הסיכום</button>}
      {msg && <div className="faint">{msg}</div>}
    </div>
  );
}
