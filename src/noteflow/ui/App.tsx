import { useCallback, useEffect, useState } from 'react';
import { audio } from '../audio/engine';
import { dailyPlan, Mood, reviewPool, weeklyCheckPlan } from '../engine/extras';
import { LESSONS } from '../engine/lessons';
import { mistakesSession, recommendedSession, SessionPlan } from '../engine/sessions';
import { diatonic, fromDiatonic, parsePitch } from '../music/pitch';
import type { PoolItem } from '../engine/exercise';
import { requestPersistence } from '../storage/db';
import { useApp, useStore, useThemeEffect } from '../state/store';
import { BottomNav } from './components/BottomNav';
import { LessonModal } from './components/LessonModal';
import { Free } from './screens/Free';
import { FreePiano } from './screens/FreePiano';
import { Home } from './screens/Home';
import { ListenSession } from './screens/ListenSession';
import { Onboarding } from './screens/Onboarding';
import { Path } from './screens/Path';
import { Practice } from './screens/Practice';
import { Results } from './screens/Results';
import { RhythmSession } from './screens/RhythmSession';
import { SequenceSession } from './screens/SequenceSession';
import { ResumeInfo, Session, SessionResult } from './screens/Session';
import { Settings } from './screens/Settings';
import { Songbook } from './screens/Songbook';
import { Stats } from './screens/Stats';
import { Tests } from './screens/Tests';
import { Workshop } from './screens/Workshop';
import { GrandSession } from './screens/GrandSession';
import { Instrument } from './screens/Instrument';
import { IntervalSession } from './screens/IntervalSession';
import { PlayAlong } from './screens/PlayAlong';
import { ProgressCard } from './screens/ProgressCard';
import { Symbols } from './screens/Symbols';

export type Route = 'home' | 'path' | 'practice' | 'free' | 'freetest' | 'tests' | 'stats' | 'settings' | 'session' | 'results'
  | 'songs' | 'workshop' | 'piano' | 'symbols' | 'playalong' | 'instrument' | 'card';

const ROUTES: Route[] = ['home', 'path', 'practice', 'free', 'freetest', 'tests', 'stats', 'settings', 'session', 'results', 'songs', 'workshop', 'piano', 'symbols', 'playalong', 'instrument', 'card'];
const TABBED: Route[] = ['home', 'path', 'practice', 'stats', 'songs', 'workshop', 'piano', 'free', 'freetest', 'tests', 'symbols', 'instrument', 'card'];
const readHash = (): Route => {
  const h = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(h) ? h : 'home';
};

let askedPersist = false;

export function App() {
  const app = useApp();
  const store = useStore();
  useThemeEffect(app.settings.theme, app.settings);
  const [route, setRoute] = useState<Route>(readHash);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [resume, setResume] = useState<ResumeInfo<unknown> | undefined>(undefined);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [lesson, setLesson] = useState<{ id: string; plan?: SessionPlan } | null>(null);
  const [daily, setDaily] = useState<{ plans: SessionPlan[]; index: number } | null>(null);
  const [alongSong, setAlongSong] = useState<string | null>(null);

  useEffect(() => {
    const on = () => setRoute(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [route]);

  const go = useCallback((r: Route, replace = false) => {
    const h = r === 'home' ? '#/' : `#/${r}`;
    if (replace) history.replaceState(null, '', h); else location.hash = h;
    setRoute(r);
  }, []);

  const launch = useCallback((p: SessionPlan, res?: ResumeInfo<unknown>) => {
    audio.unlock(); // inside the tap: required by iOS
    if (!askedPersist) { askedPersist = true; void requestPersistence(); }
    if (!res) store.clearPending();
    if (!p.config.daily) setDaily(null);
    setPlan(p);
    setResume(res);
    setRunKey((k) => k + 1);
    go('session', route === 'session' || route === 'results');
  }, [go, route, store]);

  /** Starts a plan; the first time a stage is opened, its one-idea lesson comes first. */
  const start = useCallback((p: SessionPlan) => {
    const id = p.config.stageId;
    if (id && LESSONS[id] && !app.lessonsSeen[id]) {
      audio.unlock();
      setLesson({ id, plan: p });
      return;
    }
    launch(p);
  }, [app.lessonsSeen, launch]);

  const startDaily = useCallback((mood: Mood) => {
    const plans = dailyPlan(mood, app.idx, app.sessions, app.settings);
    setDaily({ plans, index: 0 });
    launch(plans[0]);
  }, [app.idx, app.sessions, app.settings, launch]);

  const nextBlock = useCallback(() => {
    if (!daily) return;
    const i = daily.index + 1;
    if (i >= daily.plans.length) { setDaily(null); go('home'); return; }
    setDaily({ ...daily, index: i });
    launch(daily.plans[i]);
  }, [daily, go, launch]);

  const startReview = useCallback(() => {
    const pool = reviewPool(app.idx, app.sessions, app.settings, 'name');
    const p = recommendedSession(app.idx, app.sessions, app.settings);
    if (pool.length) launch({ ...p, title: 'חזרה על תווים שהגיע זמנם', pool, reviewPool: [], config: { ...p.config, exercise: 'notes', kind: 'recommended', mode: 'practice', skill: 'name', count: 16 } });
    else launch(p);
  }, [app.idx, app.sessions, app.settings, launch]);

  const resumePending = useCallback(() => {
    const pd = app.pending;
    if (!pd) return;
    launch(pd.plan as SessionPlan, { sessionId: pd.sessionId, startedAt: pd.startedAt, state: pd.state });
  }, [app.pending, launch]);

  /** A short drill on one weak note: the note itself (twice as often) and its two neighbours. */
  const drill = useCallback((pitch: string, clef: 'treble' | 'bass') => {
    const t = parsePitch(pitch);
    const d = diatonic(t);
    const pool: PoolItem[] = [t, t, fromDiatonic(d - 1), fromDiatonic(d + 1)].map((p) => ({ skill: 'name', clef, pitch: p }));
    launch({
      title: 'חיזוק קצר',
      config: { kind: 'mistakes', mode: 'practice', skill: 'name', count: 12, timeLimitMs: null, autoAdvance: app.settings.autoAdvance },
      pool, reviewPool: [],
    });
  }, [app.settings.autoAdvance, launch]);

  if (app.loaded && !app.settings.onboarded && app.sessions.length === 0 && route !== 'session') {
    return <Onboarding onDone={() => go('home', true)} />;
  }

  // Deep links to transient screens without state fall back home.
  const effective: Route = (route === 'session' && !plan) || (route === 'results' && !result) ? 'home' : route;
  const home = () => go('home');
  const done = (r: SessionResult) => { setResult(r); go('results', true); };

  const lessonModal = lesson && LESSONS[lesson.id] && (
    <LessonModal lesson={LESSONS[lesson.id]}
      onClose={() => { if (lesson.plan) store.markLessonSeen(lesson.id); setLesson(null); }}
      onGo={lesson.plan ? () => { store.markLessonSeen(lesson.id); const p = lesson.plan!; setLesson(null); launch(p); } : undefined} />
  );

  let screen;
  switch (effective) {
    case 'session': {
      const ex = plan!.config.exercise ?? 'notes';
      const props = { key: runKey, plan: plan!, onExit: () => { setDaily(null); home(); }, onDone: done };
      screen = ex === 'sequence' ? <SequenceSession {...props} resume={resume as never} />
        : ex === 'rhythm' ? <RhythmSession {...props} resume={resume as never} />
        : ex === 'listen' ? <ListenSession {...props} />
        : ex === 'interval' ? <IntervalSession {...props} />
        : ex === 'grand' ? <GrandSession {...props} />
        : <Session {...props} resume={resume as never} />;
      break;
    }
    case 'results': {
      const mistakes = mistakesSession(result!.attempts, app.settings);
      const more = daily && daily.index < daily.plans.length - 1;
      screen = <Results result={result!} onHome={() => { setDaily(null); home(); }} onRetry={() => launch(result!.plan)}
        onMistakes={mistakes ? () => launch(mistakes) : undefined}
        onNextBlock={more ? nextBlock : undefined}
        onContinue={() => { if (result!.record.config.daily) { setDaily(null); home(); return; } start(recommendedSession(app.idx, app.sessions, app.settings)); }} />;
      break;
    }
    case 'path': screen = <Path start={start} onBack={home} onLesson={(id) => setLesson({ id })} />; break;
    case 'practice': screen = <Practice start={start} go={go} />; break;
    case 'songs': screen = <Songbook start={start} onBack={() => go('practice')} go={go} onPlayAlong={(id) => { setAlongSong(id); go('playalong'); }} />; break;
    case 'symbols': screen = <Symbols onBack={() => go('practice')} />; break;
    case 'playalong': screen = <PlayAlong key={alongSong ?? 'pick'} songId={alongSong ?? undefined} onBack={() => { const back = alongSong ? 'songs' : 'practice'; setAlongSong(null); go(back); }} />; break;
    case 'instrument': screen = <Instrument onBack={() => go('practice')} />; break;
    case 'card': screen = <ProgressCard onBack={() => go('stats')} />; break;
    case 'workshop': screen = <Workshop start={start} onBack={() => go('practice')} />; break;
    case 'piano': screen = <FreePiano start={start} onBack={() => go('practice')} />; break;
    case 'free': screen = <Free start={start} onBack={() => go('practice')} />; break;
    case 'freetest': screen = <Free start={start} onBack={() => go('tests')} initialMode="test" />; break;
    case 'tests': screen = <Tests start={start} onBack={() => go('practice')} onFree={() => go('freetest')} />; break;
    case 'stats': screen = <Stats onDrill={drill} onCard={() => go('card')} />; break;
    case 'settings': screen = <Settings onBack={home} />; break;
    default: screen = <Home start={start} go={go} onResume={resumePending} startDaily={startDaily} startReview={startReview}
      startWeeklyCheck={() => launch(weeklyCheckPlan(app.idx, app.sessions, app.settings))} />;
  }
  return (
    <>
      {screen}
      {TABBED.includes(effective) && <BottomNav route={effective} go={go} />}
      {lessonModal}
    </>
  );
}
