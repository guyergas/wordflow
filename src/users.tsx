// Who is learning, which courses they joined, and moving between them.
import { useState } from 'react';
import './users.css';
import { FamilySheet } from './family';
import { dbUrl } from './familySync';
import { COURSE_ID, COURSE_INFO, COURSES, CourseId, joinCourses, leaveCourse, myCourses, oldProgress, signIn, signOut, switchCourse, USER_NAME, USERS } from './course';

export function UserPicker() {
  const old = oldProgress();
  return (
    <div className="onb">
      <h1>מי לומד עכשיו?</h1>
      {old.length > 0 && <p className="lead">ההתקדמות שכבר נמצאת במכשיר הזה תישמר אצל מי שייבחר עכשיו.</p>}
      <div className="people">{USERS.map((u) => <button key={u.id} type="button" className="person" onClick={() => signIn(u.id)}>{u.name}</button>)}</div>
    </div>
  );
}

export function CoursePicker() {
  const [chosen, setChosen] = useState<CourseId[]>([]);
  const toggle = (id: CourseId) => setChosen(chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id]);
  return (
    <div className="onb">
      <h1>{USER_NAME}, מה לומדים?</h1>
      <p className="lead">אפשר לבחור כמה קורסים, ולהוסיף עוד בהמשך.</p>
      <div className="courses">
        {COURSES.map((c) => (
          <button key={c.id} type="button" className="course" aria-pressed={chosen.includes(c.id)} onClick={() => toggle(c.id)}>
            <b>{c.name}</b><small>{c.note}</small>
          </button>
        ))}
      </div>
      <button type="button" className="cta" disabled={!chosen.length} onClick={() => joinCourses(chosen)}>להתחיל</button>
      <button type="button" className="link center-block" onClick={signOut}>זה לא {USER_NAME}</button>
    </div>
  );
}

const Close = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>;

function CourseSheet({ onClose }: { onClose: () => void }) {
  const mine = myCourses(), more = COURSES.filter((c) => !mine.includes(c));
  const [editing, setEditing] = useState(false);
  const [, refresh] = useState(0);
  const [family, setFamily] = useState(false);
  if (family) return <FamilySheet onClose={onClose} />;
  return (
    <div className="cs-wrap" onClick={onClose}>
      <div className="cs-sheet" role="dialog" aria-label="הקורסים שלי" onClick={(e) => e.stopPropagation()}>
        <div className="cs-row"><h2>הקורסים של {USER_NAME}</h2><button type="button" className="cs-round" aria-label="סגירה" onClick={onClose}><Close /></button></div>
        {dbUrl() && <button type="button" className="fam-open" onClick={() => setFamily(true)}>לוח המשפחה: לו״ז, יעדים וביצוע</button>}
        <div className="my-courses">
          {mine.map((c) => (
            <div key={c.id} className="my-course">
              <button type="button" aria-current={c.id === COURSE_ID ? 'true' : undefined} onClick={() => { if (c.id === COURSE_ID) onClose(); else switchCourse(c.id); }}>{c.name}</button>
              {editing && mine.length > 1 && <button type="button" className="cs-round" aria-label={`יציאה מהקורס ${c.name}`} onClick={() => { leaveCourse(c.id); refresh((n) => n + 1); }}><Close /></button>}
            </div>
          ))}
        </div>
        {editing && mine.length > 1 && <p className="cs-note">יציאה מקורס לא מוחקת את ההתקדמות, והיא חוזרת בהרשמה מחדש.</p>}
        {more.length > 0 && <>
          <h3>להירשם לעוד קורס</h3>
          <div className="more-courses">{more.map((c) => <button key={c.id} type="button" onClick={() => joinCourses([c.id])}>+ {c.name}</button>)}</div>
        </>}
        <div className="cs-row">
          <button type="button" className="cs-link" onClick={signOut}>החלפת משתמש</button>
          {mine.length > 1 && <button type="button" className="cs-link" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? 'סיום' : 'עריכת הקורסים'}</button>}
        </div>
      </div>
    </div>
  );
}

/** The person and the course in one button. The full list opens in a sheet, however many courses there are. */
export function CourseSwitch() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="who" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span>{USER_NAME} · {COURSE_INFO.short ?? COURSE_INFO.name}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && <CourseSheet onClose={() => setOpen(false)} />}
    </>
  );
}
