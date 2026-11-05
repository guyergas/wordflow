import '@fontsource-variable/heebo/index.css';
import '@fontsource-variable/fredoka/index.css';
import './styles.css';
import { createRoot } from 'react-dom/client';
import { Component, ReactNode } from 'react';
import { App } from './App';
import { CoursePicker, UserPicker } from './users';
import { load, save } from './platform';
import { COURSE_CHOSEN, USER_ID, IS_ALEF, IS_KNOWLEDGE, IS_MATH, IS_TINYEN, IS_TOTS } from './course';
import { TinyEnApp, recoverTinyEn } from './tinyen/TinyEnApp';
import { TotsApp, recoverTots } from './tots/TotsApp';
import { AlefApp, recoverAlef } from './alef/AlefApp';
import { KnowledgeApp, recoverKnowledge } from './knowledge/KnowledgeApp';
import { MathApp, recoverMath } from './math/MathApp';

/** An unexpected error shows a way out and not a blank screen. Learning progress is left alone. */
class Recover extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="onb">
        <h1>משהו השתבש</h1>
        <p className="lead">ההתקדמות שלך שמורה. אפשר להתחיל מחדש את האימון של היום.</p>
        <button type="button" className="cta" onClick={() => { if (IS_TINYEN) recoverTinyEn(); else if (IS_TOTS) recoverTots(); else if (IS_ALEF) recoverAlef(); else if (IS_MATH) recoverMath(); else if (IS_KNOWLEDGE) recoverKnowledge(); else save({ ...load(), plan: null, paused: null }); location.reload(); }}>להמשיך</button>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(<Recover>{!USER_ID ? <UserPicker /> : !COURSE_CHOSEN ? <CoursePicker /> : IS_TINYEN ? <TinyEnApp /> : IS_TOTS ? <TotsApp /> : IS_ALEF ? <AlefApp /> : IS_MATH ? <MathApp /> : IS_KNOWLEDGE ? <KnowledgeApp /> : <App />}</Recover>);

