import '@fontsource-variable/heebo/index.css';
import '@fontsource-variable/fredoka/index.css';
import './styles.css';
import { createRoot } from 'react-dom/client';
import { Component, ReactNode } from 'react';
import { App } from './App';
import { load, save } from './platform';
import { IS_ALEF, IS_KNOWLEDGE, IS_MATH } from './course';
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
        <button type="button" className="cta" onClick={() => { if (IS_ALEF) recoverAlef(); else if (IS_MATH) recoverMath(); else if (IS_KNOWLEDGE) recoverKnowledge(); else save({ ...load(), plan: null, paused: null }); location.reload(); }}>להמשיך</button>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(<Recover>{IS_ALEF ? <AlefApp /> : IS_MATH ? <MathApp /> : IS_KNOWLEDGE ? <KnowledgeApp /> : <App />}</Recover>);

// A new version takes over as soon as it is ready, so nobody stays on an old one.
if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  const hadController = !!sw.controller;
  sw.addEventListener('controllerchange', () => { if (hadController) location.reload(); });
  const check = () => { sw.getRegistration().then((r) => r?.update()).catch(() => undefined); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  check();
}
