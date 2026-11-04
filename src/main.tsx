// Piano notes has its own look, so each app's styles load only with that app.
import { COURSE_CHOSEN, IS_NOTES, USER_ID } from './course';
import { startSync } from './familySync';

startSync();

if (USER_ID && COURSE_CHOSEN && IS_NOTES) void import('./noteflow/mount');
else void import('./wordMount');

// A new version takes over as soon as it is ready, so nobody stays on an old one.
if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  const hadController = !!sw.controller;
  sw.addEventListener('controllerchange', () => { if (hadController) location.reload(); });
  const check = () => { sw.getRegistration().then((r) => r?.update()).catch(() => undefined); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  check();
}
