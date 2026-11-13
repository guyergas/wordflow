// One settings sheet for every course: the same icon, the same order and the same look.
// Who is learning and which course come first, then sound, then what only this course has, then reset.
// Switching the person or the course happens only here.
import { ReactNode, useState } from 'react';
import './users.css';
import { FamilySheet } from './family';
import { dbUrl } from './familySync';
import { Trial, trialName, TRIALS } from './speech';
import { COURSE_ID, COURSES, openCourses, joinCourses, leaveCourse, myCourses, signOut, switchCourse, USER_NAME } from './course';

const Close = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>;
export const SettingsIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="8" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;

/** The person and the course, with switching between them. Also used on NoteFlow's own settings page. */
export function WhoPanel() {
  const mine = myCourses(), more = openCourses().filter((c) => !mine.includes(c));
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [, refresh] = useState(0);
  const [family, setFamily] = useState(false);
  return (
    <>
      <section className="st-sec">
        <h3>משתמש</h3>
        <div className="cs-row"><b className="st-who">{USER_NAME || 'בלי שם'}</b><button type="button" className="st-btn" onClick={signOut}>החלפת משתמש</button></div>
        {dbUrl() && <button type="button" className="fam-open" onClick={() => setFamily(true)}>מערכת: לו״ז, יעדים וביצוע</button>}
      </section>
      <section className="st-sec">
        <h3>קורס</h3>
        <div className="my-courses">
          {mine.map((c) => (
            <div key={c.id} className="my-course">
              <button type="button" aria-current={c.id === COURSE_ID ? 'true' : undefined} onClick={() => { if (c.id !== COURSE_ID) switchCourse(c.id); }}>{c.name}{c.id === COURSE_ID ? ' · כאן' : ''}</button>
              {editing && mine.length > 1 && <button type="button" className="cs-round" aria-label={`יציאה מהקורס ${c.name}`} onClick={() => { leaveCourse(c.id); refresh((n) => n + 1); }}><Close /></button>}
            </div>
          ))}
        </div>
        {editing && <p className="cs-note">יציאה מקורס לא מוחקת את ההתקדמות, והיא חוזרת בהרשמה מחדש.</p>}
        {adding && more.length > 0 && <div className="more-courses">{more.map((c) => <button key={c.id} type="button" onClick={() => joinCourses([c.id])}>+ {c.name}</button>)}</div>}
        <div className="cs-row">
          {more.length > 0 && <button type="button" className="cs-link" aria-pressed={adding} onClick={() => setAdding(!adding)}>{adding ? 'סגירת הרשימה' : 'הרשמה לקורס נוסף'}</button>}
          {mine.length > 1 && <button type="button" className="cs-link" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? 'סיום' : 'עריכת הקורסים'}</button>}
        </div>
      </section>
      {family && <FamilySheet onClose={() => setFamily(false)} />}
    </>
  );
}

export function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <div className="st-row"><label htmlFor={id}>{label}</label><input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /></div>;
}

export interface SettingsProps {
  onClose: () => void;
  /** Game sounds, on in every course that has them. */
  sound?: { on: boolean; set: (v: boolean) => void };
  /** More sound settings this course has, such as voice and speed. */
  audio?: ReactNode;
  /** Settings only this course has: pace, goals, backup. */
  children?: ReactNode;
  /** Erases this course's progress after a confirmation in the sheet. */
  onReset?: () => void;
}

export function SettingsSheet({ onClose, sound, audio, children, onReset }: SettingsProps) {
  const [confirm, setConfirm] = useState(false);
  const course = COURSES.find((c) => c.id === COURSE_ID);
  return (
    <div className="cs-wrap" onClick={onClose}>
      <div className="cs-sheet st-sheet" role="dialog" aria-label="הגדרות" onClick={(e) => e.stopPropagation()}>
        <div className="cs-row"><h2>הגדרות</h2><button type="button" className="cs-round" aria-label="סגירה" onClick={onClose}><Close /></button></div>
        <WhoPanel />
        {(sound || audio) && <section className="st-sec">
          <h3>שמע</h3>
          {sound && <Toggle id="st-sound" label="צלילי משחק" checked={sound.on} onChange={sound.set} />}
          {audio}
        </section>}
        {children && <section className="st-sec"><h3>{course?.name ?? 'הקורס'}</h3>{children}</section>}
        {onReset && <section className="st-sec st-danger">
          {!confirm ? <button type="button" className="cs-link" onClick={() => setConfirm(true)}>איפוס ההתקדמות ב{course?.short ?? course?.name ?? 'קורס'}</button> : <>
            <p className="cs-note">למחוק את ההתקדמות בקורס הזה? אי אפשר לבטל את זה. שאר הקורסים לא נפגעים.</p>
            <div className="cs-row"><button type="button" className="st-btn" onClick={() => setConfirm(false)}>ביטול</button><button type="button" className="st-btn st-del" onClick={() => { onReset(); setConfirm(false); onClose(); }}>מחיקה</button></div>
          </>}
        </section>}
        <Pronounce />
        <p className="cs-note">גרסה {__APP_VERSION__}</p>
      </div>
    </div>
  );
}

/** A listening test: a few spellings of a word the voice reads wrong, to pick the one that sounds right. */
function Pronounce() {
  const [open, setOpen] = useState(false), [on, setOn] = useState('');
  const play = (t: Trial) => { const k = trialName(t); setOn(k); const a = new Audio(`audio/he/${k}.mp3`); a.onended = () => setOn(''); a.play().catch(() => setOn('')); };
  if (!TRIALS.length) return null;
  if (!open) return <button type="button" className="cs-link" onClick={() => setOpen(true)}>בדיקת הגייה</button>;
  return (
    <section className="st-sec">
      <h3>בדיקת הגייה</h3>
      <p className="cs-note">לכל אות כמה הקלטות. מקשיבים, ומספרים לי איזה מספר נשמע נכון.</p>
      {TRIALS.map((t) => (
        <div key={t.label} className="st-trial">
          <b>{t.label}</b>
          <div className="st-trial-list">{t.options.map((o, i) => <button key={i} type="button" className="st-btn" aria-pressed={on === trialName(o)} onClick={() => play(o)}><b>{i + 1}</b> <small>{o.note}</small></button>)}</div>
        </div>
      ))}
    </section>
  );
}
