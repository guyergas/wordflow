// Shared by every course: moving between courses, and the summary she sends.
import { useEffect, useMemo, useState } from 'react';
import { COURSE_ID, COURSES, CourseId, switchCourse } from './course';
import { buildSummary, drawSummary, goalOf, Goals, loadGoals, minutes, rangeLabel, readCourses, saveGoals, SummaryPeriod, timeLabel } from './summary';

const dayNow = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };

/** In settings and on the first math screen. It lists whatever courses exist, so a new one appears by itself. */
export function CourseSwitch() {
  return (
    <div className="course-switch" role="group" aria-label="מעבר בין קורסים">
      {COURSES.map((c) => <button key={c.id} type="button" aria-pressed={COURSE_ID === c.id} onClick={() => { if (COURSE_ID !== c.id) switchCourse(c.id); }}>{c.name}</button>)}
    </div>
  );
}

function SummarySheet({ name, onClose }: { name: string; onClose: () => void }) {
  const courses = useMemo(() => readCourses(), []);
  const today = dayNow();
  // In the morning today is still empty, so the summary opens on the day she last practiced.
  const [choice, setChoice] = useState<'today' | 'yesterday' | 'week'>(() => (!courses.some((c) => c.days[today]?.sec) && courses.some((c) => c.days[today - 1]?.sec) ? 'yesterday' : 'today'));
  const period: SummaryPeriod = choice === 'week' ? 'week' : 'day';
  const [goals, setGoals] = useState<Goals>(() => loadGoals());
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [msg, setMsg] = useState('');
  const owner = name || courses.find((c) => c.name)?.name || '';
  const summary = useMemo(() => buildSummary(courses, goals, choice === 'yesterday' ? today - 1 : today, period, owner), [courses, goals, choice, today, owner]);

  useEffect(() => {
    let alive = true, made = '';
    setBlob(null); setMsg('');
    drawSummary(summary).then((c) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('no image'))), 'image/png')))
      .then((b) => { if (!alive) return; made = URL.createObjectURL(b); setBlob(b); setUrl(made); })
      .catch(() => setMsg('לא הצלחתי ליצור תמונה במכשיר הזה.'));
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [summary]);

  const fname = `wordflow-time-${period}-${new Date(summary.to * 864e5).toISOString().slice(0, 10)}.png`;
  const send = async () => {
    if (!blob) return;
    const file = new File([blob], fname, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); }
      catch (e) { if ((e as Error).name !== 'AbortError') setMsg('השליחה לא הצליחה. אפשר ללחוץ לחיצה ארוכה על התמונה ולשמור אותה.'); }
      return;
    }
    const a = document.createElement('a'); a.href = url; a.download = fname; a.click();
    setMsg('התמונה נשמרה. אפשר לצרף אותה להודעה.');
  };
  const setGoal = (id: CourseId, key: 'day' | 'week', v: number) => {
    const next = { ...goals, [id]: { ...goalOf(goals, id), [key]: Math.max(0, Math.min(1000, Math.round(v) || 0)) } };
    setGoals(next); saveGoals(next);
  };

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="סיכום לשליחה" onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h2>סיכום לשליחה</h2><button type="button" className="round" aria-label="סגירה" onClick={onClose}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button></div>
        <div className="seg" role="group" aria-label="תקופה">
          {([['today', 'היום'], ['yesterday', 'אתמול'], ['week', 'השבוע']] as const).map(([k, t]) => <button key={k} type="button" aria-pressed={choice === k} onClick={() => setChoice(k)}>{t}</button>)}
        </div>
        <p className="small muted center">{rangeLabel(summary)}</p>
        {url ? <img className="summary-img" src={url} alt={`זמן תרגול: ${summary.rows.map((r) => `${r.name} ${minutes(r.sec)} דקות`).join(', ') || 'אין עדיין תרגול'}. סך הכול ${timeLabel(summary.totalSec)}`} /> : <p className="muted center pad">מכינה תמונה…</p>}
        <button type="button" className="cta" disabled={!blob} onClick={send}>שליחה</button>
        {msg && <p className="small center" role="status">{msg}</p>}
        <button type="button" className="link center-block" aria-expanded={editing} onClick={() => setEditing(!editing)}>מטרות הזמן</button>
        {editing && (
          <div className="goals">
            <div className="goal-row head"><span /><small>דקות ביום</small><small>דקות בשבוע</small></div>
            {COURSES.map((c) => {
              const g = goalOf(goals, c.id);
              return (
                <div key={c.id} className="goal-row"><b>{c.name}</b>
                  <input className="input" type="number" inputMode="numeric" min="0" aria-label={`${c.name}: דקות ביום`} value={g.day} onChange={(e) => setGoal(c.id, 'day', +e.target.value)} />
                  <input className="input" type="number" inputMode="numeric" min="0" aria-label={`${c.name}: דקות בשבוע`} value={g.week} onChange={(e) => setGoal(c.id, 'week', +e.target.value)} />
                </div>
              );
            })}
            <p className="small muted">0 אומר שאין מטרה לקורס. הזמן נספר רק בזמן תרגול פעיל.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** The card on every home screen. */
export function SummaryCard({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="sent-card" onClick={() => setOpen(true)}>
        <span className="sent-txt"><b>סיכום לשליחה</b><small>זמן התרגול בכל הקורסים, מול המטרות</small></span>
        <span className="sent-go" aria-hidden="true">←</span>
      </button>
      {open && <SummarySheet name={name} onClose={() => setOpen(false)} />}
    </>
  );
}
