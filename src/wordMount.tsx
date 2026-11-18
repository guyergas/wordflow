import '@fontsource-variable/heebo/index.css';
import '@fontsource-variable/fredoka/index.css';
import './styles.css';
import { createRoot } from 'react-dom/client';
import { Component, ComponentType, ReactNode } from 'react';
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

/** An unexpected error shows a way out and not a blank screen. Learning progress is left alone. */
class Recover extends Component<{ children: ReactNode; recover?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="onb">
        <h1>משהו השתבש</h1>
        <p className="lead">ההתקדמות שלך שמורה. אפשר להתחיל מחדש את האימון של היום.</p>
        <button type="button" className="cta" onClick={() => { this.props.recover?.(); location.reload(); }}>להמשיך</button>
      </div>
    );
  }
}

/** Done once the screen is drawn. A failed download is handled in main.tsx, which offers to try again. */
export async function mount() {
  const root = createRoot(document.getElementById('root')!);
  if (!USER_ID) return root.render(<Recover><UserPicker /></Recover>);
  if (!COURSE_CHOSEN) return root.render(<Recover><CoursePicker /></Recover>);
  const { App, recover } = await loadCourse();
  root.render(<Recover recover={recover}><App /></Recover>);
}
