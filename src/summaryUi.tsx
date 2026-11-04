// Shared by every course: moving between courses, today's schedule, and the summary she sends.
import { useMemo, useState } from 'react';
import { COURSE_ID, myCourses, switchCourse } from './course';
import { FamilySheet } from './family';
import { loadSchedule, minutes, planOf, readCourses, weekday } from './summary';

const dayNow = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };

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

/** A tab in every course's navigation. It opens the family page. */
export function SummaryTab(_: { name?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>משפחה</button>
      {open && <FamilySheet onClose={() => setOpen(false)} />}
    </>
  );
}
