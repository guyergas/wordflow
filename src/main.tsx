import '@fontsource-variable/heebo/index.css';
import '@fontsource-variable/fredoka/index.css';
import './styles.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);

// A new version takes over as soon as it is ready, so nobody stays on an old one.
if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  const hadController = !!sw.controller;
  sw.addEventListener('controllerchange', () => { if (hadController) location.reload(); });
  const check = () => { sw.getRegistration().then((r) => r?.update()).catch(() => undefined); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  check();
}
