// The whole family's study time for a day or a week, and each person's daily goals.
import { useEffect, useState } from 'react';
import { COURSES, CourseId, coursesFor, FAMILY_NAME, IS_OWNER, IS_PARENT, USER_ID, USERS, userKey } from './course';
import { FamilyAdmin, OwnerAdmin } from './familyAdmin';
import { lineOf, readWins, Win } from './wins';
import { FamilyData, pushPlan, readFamily } from './familySync';
import { cleanSchedule, Schedule, timeLabel, weekday, weekStart } from './summary';

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
      <p className="cs-note">יעד שנקבע ליום בשבוע חוזר בכל שבוע באותו יום, עד שמשנים אותו.</p>
      {courses.map((id) => {
        const c = COURSES.find((x) => x.id === id);
        return c && <label key={id} className="fam-row"><span>{c.name}</span><input type="number" inputMode="numeric" min="0" value={plan[id]?.[day] ?? 0} onChange={(e) => set(id, +e.target.value)} /><small>דק׳</small></label>;
      })}
    </div>
  );
}

const Bar = ({ part, state }: { part: number; state: string }) => <div className="fam-bar"><span className={state} style={{ width: `${Math.min(100, part * 100)}%` }} /></div>;

/** A full page for everyone in the family, in every course. Parents change goals and manage the family; the others see them. */
const RED_FROM = 20761;

export function FamilySheet({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<FamilyData | null>(null);
  const [failed, setFailed] = useState(false);
  const [choice, setChoice] = useState<'today' | 'yesterday' | 'week'>('today');
  const [editing, setEditing] = useState<string | null>(null);
  useEffect(() => { readFamily().then((d) => setData(d ?? {})).catch(() => setFailed(true)); }, []);
  const today = dayNow(), week = Array.from({ length: 7 }, (_, i) => weekStart(today) + i);
  const days = choice === 'week' ? week : [choice === 'today' ? today : today - 1];
  const secOn = (u: string, c: string, d: number) => Object.values(data?.time?.[u]?.[c]?.[d] ?? {}).reduce((a, b) => a + b, 0);
  // A goal met is green. Not met yet today is orange, and not met on a past day is red, counting only from
  // RED_FROM (Nov 4, 2026). Earlier and future days stay plain.
  const stateOf = (sec: number, goal: number, day: number) => (goal <= 0 ? '' : sec >= goal * 60 ? 'ok' : day === today ? 'late' : day < today && day >= RED_FROM ? 'miss' : '');
  const people = [...USERS.filter((u) => u.id === USER_ID), ...USERS.filter((u) => u.id !== USER_ID)];
  return (
    <div className="fam-page">
      <div className="fam-inner">
        <div className="cs-row"><h2>מערכת{FAMILY_NAME ? ` · ${FAMILY_NAME}` : ''}</h2><button type="button" className="cs-round" aria-label="סגירה" onClick={onClose}><X /></button></div>
        <div className="fam-seg" role="group" aria-label="תקופה">{([['today', 'היום'], ['yesterday', 'אתמול'], ['week', 'השבוע']] as const).map(([k, t]) => <button key={k} type="button" aria-pressed={choice === k} onClick={() => setChoice(k)}>{t}</button>)}</div>
        {failed && <p className="cs-note">אין כרגע חיבור לנתוני המשפחה. נסו שוב כשיש אינטרנט.</p>}
        {!failed && !data && <p className="cs-note">טוען…</p>}
        {data && people.map((u) => {
          const plan = cleanSchedule(data.plans?.[u.id]);
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
                  <div className="fam-line"><span>{r.name}</span><small className={stateOf(r.sec, r.goal, days[0])}>{timeLabel(r.sec)}{r.goal > 0 ? ` מתוך ${r.goal} דק׳` : ''}{r.goal > 0 && r.sec >= r.goal * 60 ? ' ✓' : ''}</small></div>
                  {r.goal > 0 && <Bar part={r.sec / (r.goal * 60)} state={stateOf(r.sec, r.goal, days[0])} />}
                </div>
              ))}
              {choice === 'week' && rows.length > 0 && (
                <div className="fam-scroll"><table className="fam-week">
                  <thead><tr><th scope="col">דקות</th>{DAYS.map((d, i) => <th key={d} scope="col" aria-current={week[i] === today ? 'date' : undefined}>{d}</th>)}</tr></thead>
                  <tbody>{rows.map((r) => <tr key={r.c}><th scope="row">{r.name}</th>{week.map((d) => { const m = Math.floor(secOn(u.id, r.c, d) / 60), g = goalOn(r.c, d); return <td key={d} className={stateOf(secOn(u.id, r.c, d), g, d)}>{m || g ? <>{m}{g > 0 && <small>/{g}</small>}</> : '–'}</td>; })}</tr>)}</tbody>
                </table></div>
              )}
              {IS_PARENT && <button type="button" className="cs-link" aria-expanded={editing === u.id} onClick={() => setEditing(editing === u.id ? null : u.id)}>קביעת יעדים</button>}
              {IS_PARENT && editing === u.id && <Goals user={u.id} courses={(() => { const open = coursesFor(u.role).map((c) => c.id); return [...mine.filter((c) => open.includes(c)), ...open.filter((c) => !mine.includes(c))]; })()} plan={plan} onChange={(p) => setData({ ...data, plans: { ...data.plans, [u.id]: p } })} />}
            </section>
          );
        })}
        {IS_PARENT && <FamilyAdmin onChange={() => setData(data ? { ...data } : data)} />}
        {IS_OWNER && <OwnerAdmin />}
      </div>
    </div>
  );
}

/** The achievements page, apart from the board. */
export function WinsSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fam-page">
      <div className="fam-inner">
        <div className="cs-row"><h2>הישגים</h2><button type="button" className="cs-round" aria-label="סגירה" onClick={onClose}><X /></button></div>
        <Wins />
      </div>
    </div>
  );
}

/** The family's achievements, newest first. Ones that arrived since this person last looked are highlighted. */
function Wins() {
  const [wins, setWins] = useState<Win[] | null>(null), [failed, setFailed] = useState(false);
  const [seen] = useState(() => { try { return Number(localStorage.getItem(userKey('winsSeen'))) || 0; } catch { return 0; } });
  useEffect(() => { readWins().then((w) => { setWins(w); try { localStorage.setItem(userKey('winsSeen'), String(Date.now())); } catch { /* highlighted again next time */ } }).catch(() => setFailed(true)); }, []);
  if (failed) return <p className="cs-note">אין כרגע חיבור לנתוני המשפחה. נסו שוב כשיש אינטרנט.</p>;
  if (!wins) return <p className="cs-note">טוען…</p>;
  if (!wins.length) return <p className="cs-note">עוד אין הישגים. בסוף כל שיעור חדש בידע כללי, נושא חדש בחשבון, נושא בדקדוק או קטע קריאה באנגלית, יופיע כאן משפט לכל המשפחה.</p>;
  const when = (t: number) => { const d = dayNow() - Math.floor(new Date(new Date(t).toDateString()).getTime() / 864e5 + 0.5); return d === 0 ? 'היום' : d === 1 ? 'אתמול' : `לפני ${d} ימים`; };
  return (
    <ul className="fam-wins">
      {wins.map((w) => <li key={`${w.user}${w.at}`} className={`fam-card${w.at > seen ? ' me' : ''}`}><p>{lineOf(w)}</p><small>{when(w.at)}</small></li>)}
    </ul>
  );
}
