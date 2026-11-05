// The whole family's study time for a day or a week, and each person's daily goals.
import { useEffect, useState } from 'react';
import { COURSES, CourseId, USER_ID, USERS } from './course';
import { FamilyData, pushPlan, readFamily } from './familySync';
import { Schedule, timeLabel, weekday, weekStart } from './summary';

const dayNow = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };
const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const X = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>;

function Goals({ user, courses, plan, onChange }: { user: string; courses: CourseId[]; plan: Schedule; onChange: (p: Schedule) => void }) {
  const [day, setDay] = useState(() => weekday(dayNow()));
  const set = (id: CourseId, v: number) => {
    const row = [...(plan[id] ?? [0, 0, 0, 0, 0, 0, 0])];
    row[day] = Math.max(0, Math.min(300, Math.round(v) || 0));
    const next = { ...plan, [id]: row };
    onChange(next);
    void pushPlan(user, next);
  };
  return (
    <div className="fam-goals">
      <div className="fam-seg" role="group" aria-label="יום בשבוע">{DAYS.map((d, i) => <button key={d} type="button" aria-pressed={i === day} onClick={() => setDay(i)}>{d}</button>)}</div>
      {courses.map((id) => {
        const c = COURSES.find((x) => x.id === id);
        return c && <label key={id} className="fam-row"><span>{c.name}</span><input type="number" inputMode="numeric" min="0" value={plan[id]?.[day] ?? 0} onChange={(e) => set(id, +e.target.value)} /><small>דק׳</small></label>;
      })}
    </div>
  );
}

const Bar = ({ part, done }: { part: number; done: boolean }) => <div className="fam-bar"><span className={done ? 'ok' : ''} style={{ width: `${Math.min(100, part * 100)}%` }} /></div>;

/** A full page for everyone, in every course. Only Guy changes goals; the others see them. */
export function FamilySheet({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<FamilyData | null>(null);
  const [failed, setFailed] = useState(false);
  const [choice, setChoice] = useState<'today' | 'yesterday' | 'week'>('today');
  const [editing, setEditing] = useState<string | null>(null);
  useEffect(() => { readFamily().then((d) => setData(d ?? {})).catch(() => setFailed(true)); }, []);
  const today = dayNow(), week = Array.from({ length: 7 }, (_, i) => weekStart(today) + i);
  const days = choice === 'week' ? week : [choice === 'today' ? today : today - 1];
  const secOn = (u: string, c: string, d: number) => Object.values(data?.time?.[u]?.[c]?.[d] ?? {}).reduce((a, b) => a + b, 0);
  const people = [...USERS.filter((u) => u.id === USER_ID), ...USERS.filter((u) => u.id !== USER_ID)];
  return (
    <div className="fam-page">
      <div className="fam-inner">
        <div className="cs-row"><h2>לוח המשפחה</h2><button type="button" className="cs-round" aria-label="סגירה" onClick={onClose}><X /></button></div>
        <div className="fam-seg" role="group" aria-label="תקופה">{([['today', 'היום'], ['yesterday', 'אתמול'], ['week', 'השבוע']] as const).map(([k, t]) => <button key={k} type="button" aria-pressed={choice === k} onClick={() => setChoice(k)}>{t}</button>)}</div>
        {failed && <p className="cs-note">אין כרגע חיבור לנתוני המשפחה. נסו שוב כשיש אינטרנט.</p>}
        {!failed && !data && <p className="cs-note">טוען…</p>}
        {data && people.map((u) => {
          const plan = data.plans?.[u.id] ?? {};
          const mine = (data.courses?.[u.id] ?? []) as CourseId[];
          const goalOn = (c: CourseId, d: number) => (plan[c] ? plan[c]![weekday(d)] ?? 0 : 0);
          const list = [...new Set([...mine, ...Object.keys(plan) as CourseId[], ...Object.keys(data.time?.[u.id] ?? {}) as CourseId[]])];
          const rows = list.map((c) => ({ c, name: COURSES.find((x) => x.id === c)?.short ?? COURSES.find((x) => x.id === c)?.name ?? c, sec: days.reduce((a, d) => a + secOn(u.id, c, d), 0), goal: days.reduce((a, d) => a + goalOn(c, d), 0) })).filter((r) => r.sec > 0 || r.goal > 0);
          const goalAll = rows.reduce((a, r) => a + r.goal, 0), secAll = rows.reduce((a, r) => a + r.sec, 0);
          return (
            <section key={u.id} className={u.id === USER_ID ? 'fam-card me' : 'fam-card'}>
              <div className="cs-row"><h3>{u.name}</h3><b>{timeLabel(secAll)}{goalAll > 0 ? ` מתוך ${timeLabel(goalAll * 60)}` : ''}</b></div>
              {!rows.length && <p className="cs-note">{choice === 'week' ? 'אין השבוע לימוד או יעדים' : 'אין ביום הזה לימוד או יעדים'}</p>}
              {choice !== 'week' && rows.map((r) => (
                <div key={r.c} className="fam-item">
                  <div className="fam-line"><span>{r.name}</span><small className={r.goal > 0 && r.sec >= r.goal * 60 ? 'ok' : ''}>{timeLabel(r.sec)}{r.goal > 0 ? ` מתוך ${r.goal} דק׳` : ''}{r.goal > 0 && r.sec >= r.goal * 60 ? ' ✓' : ''}</small></div>
                  {r.goal > 0 && <Bar part={r.sec / (r.goal * 60)} done={r.sec >= r.goal * 60} />}
                </div>
              ))}
              {choice === 'week' && rows.length > 0 && (
                <div className="fam-scroll"><table className="fam-week">
                  <thead><tr><th scope="col">דקות</th>{DAYS.map((d, i) => <th key={d} scope="col" aria-current={week[i] === today ? 'date' : undefined}>{d}</th>)}</tr></thead>
                  <tbody>{rows.map((r) => <tr key={r.c}><th scope="row">{r.name}</th>{week.map((d) => { const m = Math.floor(secOn(u.id, r.c, d) / 60), g = goalOn(r.c, d); return <td key={d} className={g > 0 && m >= g ? 'ok' : ''}>{m || g ? <>{m}{g > 0 && <small>/{g}</small>}</> : '–'}</td>; })}</tr>)}</tbody>
                </table></div>
              )}
              {USER_ID === 'guy' && <button type="button" className="cs-link" aria-expanded={editing === u.id} onClick={() => setEditing(editing === u.id ? null : u.id)}>קביעת יעדים</button>}
              {USER_ID === 'guy' && editing === u.id && <Goals user={u.id} courses={[...mine, ...COURSES.map((c) => c.id).filter((c) => !mine.includes(c))]} plan={plan} onChange={(p) => setData({ ...data, plans: { ...data.plans, [u.id]: p } })} />}
            </section>
          );
        })}
      </div>
    </div>
  );
}
