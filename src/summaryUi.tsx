// Shared by every course: moving between courses, today's schedule, and the summary she sends.
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { COURSE_ID, CourseId, myCourses, switchCourse, USER_ID, USER_NAME } from './course';
import { dbUrl, pushPlan } from './familySync';
import { buildSummary, drawSummary, loadSchedule, minutes, planOf, rangeLabel, readCourses, saveSchedule, Schedule, SummaryPeriod, timeLabel, weekday } from './summary';

const dayNow = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };
const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export { CourseSwitch } from './users';

/** What is on today's schedule on the home screen, with a tap to go there. */
export function TodayPlan() {
  const today = dayNow();
  const schedule = useMemo(() => loadSchedule(), []);
  const courses = useMemo(() => readCourses(), []);
  const list = myCourses().map((c) => ({ c, goal: planOf(schedule, c.id)[weekday(today)], sec: courses.find((x) => x.id === c.id)?.days[today]?.sec ?? 0 })).filter((x) => x.goal > 0);
  if (!list.length) return null;
  return (
    <section className="card">
      <h3>הלו״ז של היום</h3>
      <ul className="today-plan">
        {list.map(({ c, goal, sec }) => (
          <li key={c.id}><button type="button" onClick={() => { if (COURSE_ID !== c.id) switchCourse(c.id); }} aria-current={COURSE_ID === c.id ? 'true' : undefined}>
            <span>{c.short ?? c.name}{c.id === COURSE_ID ? ' · כאן' : ''}</span>
            <small className={sec >= goal * 60 ? 'ok' : ''}>{minutes(sec)} מתוך {goal} דק׳{sec >= goal * 60 ? ' ✓' : ''}</small>
          </button></li>
        ))}
      </ul>
    </section>
  );
}

function ScheduleEditor({ schedule, onChange }: { schedule: Schedule; onChange: (s: Schedule) => void }) {
  const [day, setDay] = useState(() => weekday(dayNow()));
  const set = (id: CourseId, v: number) => {
    const plan = [...planOf(schedule, id)];
    plan[day] = Math.max(0, Math.min(300, Math.round(v) || 0));
    onChange({ ...schedule, [id]: plan });
  };
  return (
    <div className="goals">
      <div className="seg" role="group" aria-label="יום בשבוע">{DAYS.map((d, i) => <button key={d} type="button" aria-pressed={i === day} onClick={() => setDay(i)}>{d}</button>)}</div>
      {myCourses().map((c) => {
        const plan = planOf(schedule, c.id);
        return (
          <div key={c.id} className="goal-row"><b>{c.name}</b>
            <input className="input" type="number" inputMode="numeric" min="0" aria-label={`${c.name}: דקות ביום ${DAYS[day]}`} value={plan[day]} onChange={(e) => set(c.id, +e.target.value)} />
            <small>{plan.reduce((a, b) => a + b, 0)} בשבוע</small>
          </div>
        );
      })}
      <p className="small muted">הדקות לכל קורס ביום שנבחר. 0 אומר שהקורס לא בלו״ז באותו יום. הזמן נספר רק בזמן תרגול פעיל.</p>
    </div>
  );
}

function SummarySheet({ name, onClose }: { name: string; onClose: () => void }) {
  const courses = useMemo(() => readCourses(), []);
  const today = dayNow();
  // In the morning today is still empty, so the summary opens on the day she last practiced.
  const [choice, setChoice] = useState<'today' | 'yesterday' | 'week'>(() => (!courses.some((c) => c.days[today]?.sec) && courses.some((c) => c.days[today - 1]?.sec) ? 'yesterday' : 'today'));
  const period: SummaryPeriod = choice === 'week' ? 'week' : 'day';
  const [schedule, setSchedule] = useState<Schedule>(() => loadSchedule());
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [msg, setMsg] = useState('');
  const owner = USER_NAME || name || courses.find((c) => c.name)?.name || '';
  const summary = useMemo(() => buildSummary(courses, schedule, choice === 'yesterday' ? today - 1 : today, period, owner), [courses, schedule, choice, today, owner]);

  useEffect(() => {
    let alive = true, made = '';
    setBlob(null); setMsg('');
    drawSummary(summary).then((c) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('no image'))), 'image/png')))
      .then((b) => { if (!alive) return; made = URL.createObjectURL(b); setBlob(b); setUrl(made); })
      .catch(() => setMsg('לא הצלחתי ליצור תמונה במכשיר הזה.'));
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [summary]);

  const fname = `wordflow-${period}-${new Date(summary.to * 864e5).toISOString().slice(0, 10)}.png`;
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

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="כל הקורסים" onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h2>כל הקורסים</h2><button type="button" className="round" aria-label="סגירה" onClick={onClose}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button></div>
        <div className="seg" role="group" aria-label="תקופה">
          {([['today', 'היום'], ['yesterday', 'אתמול'], ['week', 'השבוע']] as const).map(([k, t]) => <button key={k} type="button" aria-pressed={choice === k} onClick={() => setChoice(k)}>{t}</button>)}
        </div>
        <p className="small muted center">{rangeLabel(summary)}</p>
        {url ? <img className="summary-img" src={url} alt={`זמן לימוד: ${summary.rows.map((r) => `${r.name} ${minutes(r.sec)} דקות, ${r.fresh} ${r.freshLabel}`).join('; ') || 'אין עדיין למידה'}. סך הכול ${timeLabel(summary.totalSec)}`} /> : <p className="muted center pad">מכינה תמונה…</p>}
        <button type="button" className="cta" disabled={!blob} onClick={send}>שליחה</button>
        {msg && <p className="small center" role="status">{msg}</p>}
        {!dbUrl() && <button type="button" className="link center-block" aria-expanded={editing} onClick={() => setEditing(!editing)}>לו״ז שבועי</button>}
        {editing && !dbUrl() && <ScheduleEditor schedule={schedule} onChange={(s) => { setSchedule(s); saveSchedule(s); if (USER_ID) void pushPlan(USER_ID, s); }} />}
      </div>
    </div>
  );
}

/** A tab in every course's navigation. */
export function SummaryTab({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>סיכום</button>
      {/* Outside the nav, whose button styles would otherwise color every button in the sheet. */}
      {open && createPortal(<SummarySheet name={name} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
