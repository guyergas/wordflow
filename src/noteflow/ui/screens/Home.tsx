import { userKey } from '../../../course';
import { CourseSwitch } from '../../../users';
import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../../engine/achievements';
import { ltrTitle, stageById, TRACKS } from '../../engine/curriculum';
import { dueCount, minutesToday, Mood, MOODS, weeklyCheckDue } from '../../engine/extras';
import { recommendedSession, SessionPlan, stageTest } from '../../engine/sessions';
import { recommend, stageProgress } from '../../engine/stats';
import { useApp, useStore } from '../../state/store';
import { Icon } from '../components/ui';
import { learnedKeys } from '../components/MasteryKeyboard';
import type { Route } from '../App';

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * Home is calm on purpose: the day's practice in the middle, then only what is waiting and the latest win.
 * Everything else lives in Practice and Progress.
 */
export function Home({ start, go, onResume, startDaily, startReview, startWeeklyCheck }: {
  start: (p: SessionPlan) => void; go: (r: Route) => void; onResume: () => void;
  startDaily: (mood: Mood) => void; startReview: () => void; startWeeklyCheck: () => void;
}) {
  const app = useApp();
  const store = useStore();
  const { idx, sessions, settings, achievements } = app;
  const [mood, setMood] = useState<Mood>(() => {
    try { return (localStorage.getItem(userKey('nf-mood')) as Mood) || 'new'; } catch { return 'new'; }
  });
  const [dismissInstall, setDismissInstall] = useState(() => {
    try { return localStorage.getItem('nf-install-dismissed') === '1'; } catch { return false; }
  });
  const [installEvt, setInstallEvt] = useState<Event & { prompt?: () => void } | null>(null);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setInstallEvt(e as Event & { prompt?: () => void }); };
    window.addEventListener('beforeinstallprompt', on);
    return () => window.removeEventListener('beforeinstallprompt', on);
  }, []);

  if (!app.loaded) return <div className="page"><div className="faint">טוען…</div></div>;

  const rec = recommend(idx, sessions, settings);
  const st = stageById(rec.stageId);
  const track = TRACKS.find((t) => t.id === st.track)!;
  const keys = learnedKeys(idx, settings);
  const first = sessions.length === 0;
  const minutes = minutesToday(sessions);
  const due = dueCount(idx, sessions, settings);
  const lastAch = Object.entries(achievements).sort((a, b) => b[1] - a[1])[0];
  const lastAchDef = lastAch && ACHIEVEMENTS.find((a) => a.id === lastAch[0]);
  const pending = app.pending;
  const pendingTitle = (pending?.plan as SessionPlan | undefined)?.title;
  const showInstall = !dismissInstall && !isStandalone() && (isIOS() || installEvt);
  const pickMood = (m: Mood) => { setMood(m); try { localStorage.setItem(userKey('nf-mood'), m); } catch { /* */ } };

  const waiting: { key: string; title: string; sub: string; action: () => void; label: string }[] = [];
  if (pending) waiting.push({ key: 'pending', title: 'אימון שלא הסתיים', sub: `${pendingTitle} · ${pending.done} מתוך ${pending.total}`, action: onResume, label: 'להמשיך' });
  if (rec.action === 'test') waiting.push({ key: 'test', title: 'מוכנה למבחן שליטה', sub: `${st.title} — ${rec.reason}`, action: () => start(stageTest(rec.stageId, rec.skill, settings)), label: 'למבחן' });
  if (weeklyCheckDue(sessions)) waiting.push({ key: 'check', title: 'בדיקת הקריאה של השבוע', sub: '16 תווים חדשים, באותם תנאים כמו בשבוע שעבר', action: startWeeklyCheck, label: 'לבדיקה' });
  if (due >= 3) waiting.push({ key: 'due', title: `${due} תווים מחכים לחזרה`, sub: 'חזרה קצרה עכשיו שומרת אותם בזיכרון', action: startReview, label: 'לחזרה' });

  // One focal point: the next practice, said in two short lines.
  const status = stageProgress(st, rec.skill, idx, sessions, settings).status;
  const headline: [string, string] = first ? ['חמישה תווים.', 'התחלה חדשה.']
    : rec.action === 'test' ? ['התרגול יציב.', 'הגיע הזמן למבחן.']
      : status === 'new' ? [`${st.title}.`, 'משהו חדש מתחיל.'] : [`${st.title}.`, 'ממשיכים בקצב שלך.'];
  const weekAgo = Date.now() - 7 * 86_400_000;
  const recent = app.attempts.filter((a) => a.ts >= weekAgo);
  const recentOk = recent.filter((a) => a.correct).length;

  return (
    <div className="page with-nav home">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}><CourseSwitch /></div>
      <div className="topbar home-top">
        <h1 className="wordmark" aria-label="NoteFlow"><span className="brandmark" aria-hidden="true">♫</span>NoteFlow<i>.</i></h1>
        <button className="icon-btn" onClick={() => go('settings')} aria-label="הגדרות"><Icon name="settings" /></button>
      </div>

      <h2 className="hh-greet">{first ? 'נעים להכיר' : 'נעים לנגן'}{settings.name ? `, ${settings.name}.` : '.'}</h2>
      <p className="hh-sub">{first ? 'עשר דקות ביום. תו אחר תו, בקצב שלך.' : minutes >= 10 ? 'עשר הדקות של היום מאחורייך. אפשר להמשיך בכיף.' : 'עשרה רגעים קטנים. עוד צעד בדרך למוזיקה.'}</p>

      <section className="next-card" aria-label="האימון הבא">
        <div className="nc-art" aria-hidden="true"><div className="nc-lines" /><span className="glyph g1">{'\uE1D7'}</span><span className="glyph g2">{'\uE1D5'}</span></div>
        <span className="nc-chip">{first ? 'כ־5 דקות' : rec.action === 'test' ? 'מבחן שליטה' : 'כ־10 דקות'}</span>
        <h3 className="nc-title"><span className={ltrTitle(st) ? 'ltr' : undefined}>{headline[0]}</span><br />{headline[1]}</h3>
        <p className="nc-text">{first ? 'מתחילים בחמישה תווים במפתח סול, וכל תו מושמע כשהוא מופיע.' : `${track.title}: ${st.subtitle}`}</p>
        <button className="btn nc-cta" onClick={() => (first ? start(recommendedSession(idx, sessions, settings)) : rec.action === 'test' ? start(stageTest(rec.stageId, rec.skill, settings)) : startDaily(mood))}>
          {first ? 'מתחילים' : rec.action === 'test' ? 'למבחן' : 'מתחילים את האימון'}
        </button>
      </section>

      {!first && (
        <>
          <div className="section-head"><h3>מה מתחשק היום?</h3><button className="linkbtn" onClick={() => go('practice')}>כל האפשרויות</button></div>
          <div className="mood-cards">
            {MOODS.map((m, i) => (
              <button key={m.id} className={`mood-card ${mood === m.id ? 'on' : ''}`} onClick={() => { pickMood(m.id); startDaily(m.id); }}>
                <span className="mc-glyph glyph" aria-hidden="true">{['\uE050', '\uE4C0', '\uE1D7'][i]}</span>
                <b>{m.title}</b>
                <small>{m.hint}</small>
              </button>
            ))}
          </div>

          <div className="card stat-strip">
            <div><b className="num">{Math.floor(minutes)}<small>/10</small></b><span>דקות היום</span></div>
            <div><b className="num">{recentOk}</b><span>תווים נכונים השבוע</span></div>
            <div><b className="num">{keys.learned}<small>/{keys.total}</small></b><span>קלידים שכבר שלך</span></div>
          </div>
          <button className="linkbtn short-one" onClick={() => start(recommendedSession(idx, sessions, settings))}>או אימון קצר אחד, בלי שעון</button>
        </>
      )}

      {app.storageError && (
        <div className="banner" style={{ marginTop: 12 }}>
          <b>ההתקדמות לא נשמרת במכשיר הזה.</b> הדפדפן חוסם אחסון (למשל בגלישה פרטית), ולכן הנתונים יימחקו כשהדף ייסגר.
          {' '}פתחי את האפליקציה בספארי רגיל או ממסך הבית.
        </div>
      )}

      {waiting.length > 0 && (
        <>
          <div className="eyebrow">מחכה לך</div>
          <div className="card waiting">
            {waiting.slice(0, 3).map((w) => (
              <div key={w.key} className="wrow">
                <div style={{ minWidth: 0 }}><b>{w.title}</b><div className="faint">{w.sub}</div></div>
                <div className="row" style={{ gap: 6, flex: 'none' }}>
                  {w.key === 'pending' && <button className="btn small ghost" onClick={() => store.clearPending()}>לוותר</button>}
                  <button className="btn small" onClick={w.action}>{w.label}</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {lastAchDef && (
        <button className="card last-win" onClick={() => go('stats')}>
          <span className="medal"><Icon name="medal" size={18} /></span>
          <span style={{ minWidth: 0 }}><b>{lastAchDef.title}</b><span className="faint"> · {lastAchDef.desc}</span></span>
        </button>
      )}

      {showInstall && (
        <div className="banner" style={{ marginTop: 12 }}>
          <b>כדאי להתקין למסך הבית.</b>{' '}
          {isIOS()
            ? 'בספארי: כפתור השיתוף ← "הוסף למסך הבית". כך ההתקדמות נשמרת לאורך זמן והאפליקציה עובדת גם בלי אינטרנט.'
            : 'כך ההתקדמות נשמרת לאורך זמן והאפליקציה עובדת גם בלי אינטרנט.'}
          <div className="row" style={{ marginTop: 8 }}>
            {installEvt?.prompt && <button className="btn small gold" onClick={() => installEvt.prompt?.()}>התקיני</button>}
            <button className="btn small ghost" onClick={() => { setDismissInstall(true); try { localStorage.setItem('nf-install-dismissed', '1'); } catch { /* */ } }}>אחר כך</button>
          </div>
        </div>
      )}
    </div>
  );
}
