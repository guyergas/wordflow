// Piano notes has its own look, so each app's styles load only with that app.
import { pullProgress, startProgressSync } from './progressSync';
import { blockZoom } from './noZoom';
import { setupFamily } from './families';

// Before anything renders: no zooming in any course.
blockZoom();

// The family and its people come first, then progress from another device, so the course opens with both.
async function start() {
  await setupFamily();
  await pullProgress();
  startProgressSync();
  const [{ COURSE_CHOSEN, IS_NOTES, USER_ID }, { startSync }] = await Promise.all([import('./course'), import('./familySync')]);
  startSync();
  if (USER_ID && COURSE_CHOSEN && IS_NOTES) await import('./noteflow/mount');
  else await (await import('./wordMount')).mount();
}

/** If the app does not open, say so and offer to try again, and not a blank screen that never changes. */
function stuck(why: string) {
  const el = document.getElementById('boot');
  if (!el || !el.isConnected) return;
  el.innerHTML = '<p>האפליקציה לא נפתחה.</p><p class="why"></p><button type="button">לנסות שוב</button>';
  el.querySelector('.why')!.textContent = why;
  el.querySelector('button')!.addEventListener('click', () => location.reload());
}
const slow = setTimeout(() => stuck('זה לוקח יותר מדי זמן. אולי האינטרנט איטי.'), 30_000);
start().then(() => clearTimeout(slow), (e: unknown) => { clearTimeout(slow); console.error(e); stuck(String((e as Error)?.message ?? e)); });

// A new version takes over as soon as it is ready, so nobody stays on an old one.
if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  const hadController = !!sw.controller;
  sw.addEventListener('controllerchange', () => { if (hadController) location.reload(); });
  const check = () => { sw.getRegistration().then((r) => r?.update()).catch(() => undefined); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  check();
}
