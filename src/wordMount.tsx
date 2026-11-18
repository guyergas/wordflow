import '@fontsource-variable/heebo/index.css';
import '@fontsource-variable/fredoka/index.css';
import './styles.css';
import { createRoot } from 'react-dom/client';
import { Component, ComponentType, ReactNode } from 'react';
import { FirstRunTop } from './topBar';
import { CoursePicker, UserPicker } from './users';
import { load, save } from './platform';
import { COURSE_CHOSEN, USER_ID, IS_ALEF, IS_KNOWLEDGE, IS_MATH, IS_TINYEN, IS_TOTS } from './course';

// Each course's app, with all its lessons, loads only for that course, so a phone downloads and reads only what it uses.
type Course = { App: ComponentType; recover: () => void };
const english = async (): Promise<Course> => { const m = await import('./App'); return { App: m.App, recover: () => save({ ...load(), plan: null, paused: null }) }; };
const loadCourse = (): Promise<Course> =>
  IS_TINYEN ? import('./tinyen/TinyEnApp').then((m) => ({ App: m.TinyEnApp, recover: m.recoverTinyEn }))
  : IS_TOTS ? import('./tots/TotsApp').then((m) => ({ App: m.TotsApp, recover: m.recoverTots }))
  : IS_ALEF ? import('./alef/AlefApp').then((m) => ({ App: m.AlefApp, recover: m.recoverAlef }))
  : IS_MATH ? import('./math/MathApp').then((m) => ({ App: m.MathApp, recover: m.recoverMath }))
  : IS_KNOWLEDGE ? import('./knowledge/KnowledgeApp').then((m) => ({ App: m.KnowledgeApp, recover: m.recoverKnowledge }))
  : english();

/** When a course breaks, the frame still works: the settings switch to another course or person, and the error is shown. */
function Broken({ error, recover }: { error: unknown; recover?: () => void }) {
  const why = error instanceof Error ? error.message : String(error ?? '');
  return (
    <>
      <FirstRunTop />
      <div className="onb">
        <h1>הקורס הזה לא נפתח</h1>
        <p className="lead">ההתקדמות שמורה. אפשר לנסות שוב, או לעבור לקורס אחר בהגדרות למעלה.</p>
        <button type="button" className="cta" onClick={() => { try { recover?.(); } catch { /* reload anyway */ } location.reload(); }}>לנסות שוב</button>
        {why && <p dir="ltr" style={{ fontSize: 12, opacity: 0.6, wordBreak: 'break-word' }}>{why}</p>}
      </div>
    </>
  );
}

/** An unexpected error shows the frame and a way out, not a blank screen. Learning progress is left alone. */
class Recover extends Component<{ children: ReactNode; recover?: () => void }, { error: unknown }> {
  state: { error: unknown } = { error: null };
  static getDerivedStateFromError(error: unknown) { return { error: error ?? 'error' }; }
  componentDidCatch(error: unknown) { console.error(error); }
  render() { return this.state.error ? <Broken error={this.state.error} recover={this.props.recover} /> : this.props.children; }
}

/** Done once the screen is drawn. The frame loads apart from the course, so a broken course never hides the settings. */
export async function mount() {
  const root = createRoot(document.getElementById('root')!);
  if (!USER_ID) return root.render(<Recover><UserPicker /></Recover>);
  if (!COURSE_CHOSEN) return root.render(<Recover><CoursePicker /></Recover>);
  let course: Course;
  try { course = await loadCourse(); } catch (e) { console.error(e); return root.render(<Broken error={e} />); }
  root.render(<Recover recover={course.recover}><course.App /></Recover>);
}
