import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CourseSwitch, SummaryTab, TodayPlan } from '../summaryUi';
import { readCourses } from '../summary';
import { STORAGE_KEY, USER_NAME } from '../course';
import { canSpeak, sfx, speakHebrew } from '../platform';
import { Figure } from './Figure';
import {
  addTime, advance, answerPlacement, applyPlacement, buildPlan, checkTyped, dayLog, dayNumber, flaggedSkills, hintFor, initialMath, isChoiceRight, isMet, makeQuestion, markMet, MathState,
  nextNew, Part, placementDone, placementStep, queueRetry, recordAnswer, shown, startPlacement, stationsOf, statusOf, Step, totals, trapForTyped, weekDays,
} from './engine';
import { DOMAINS, Question, SKILL, SKILLS, STATIONS, TRAPS, TrapId } from './skills';

type Update = (fn: (s: MathState) => MathState) => void;
type Tab = 'home' | 'path' | 'progress';

// ---------- Storage ----------
let memory: string | null = null;
function load(): MathState {
  let raw = memory;
  try { raw = localStorage.getItem(STORAGE_KEY) ?? raw; } catch { /* memory only */ }
  if (!raw) return initialMath();
  try {
    const p = JSON.parse(raw), base = initialMath();
    const st: MathState = { ...base, ...p, settings: { ...base.settings, ...p.settings } };
    if (st.plan && st.plan.steps.some((s) => !SKILL[s.skill])) st.plan = null;
    return st;
  } catch { return initialMath(); }
}
function save(st: MathState) { memory = JSON.stringify(st); try { localStorage.setItem(STORAGE_KEY, memory); } catch { /* memory only */ } }
/** After an unexpected error: today's lesson starts over, and all progress stays. */
export function recoverMath() { save({ ...load(), plan: null }); }

// ---------- Math text ----------
/** Text inside [[...]] reads left to right inside Hebrew, and a/b is drawn as a fraction. */
export function MT({ s }: { s: string }) {
  if (/^[<>=]$/.test(s)) return <span className="mt" dir="ltr">{s}</span>;
  return <>{s.split(/(\[\[.*?\]\])/).map((part, i) => {
    if (!part.startsWith('[[')) return <span key={i}>{part}</span>;
    const inner = part.slice(2, -2);
    return <bdi key={i} className="mt" dir="ltr">{inner.split(/(\d+\/\d+|▢\/\d+)/).map((t, j) => {
      const m = t.match(/^(\d+|▢)\/(\d+)$/);
      return m ? <span key={j} className="frac"><span>{m[1]}</span><span>{m[2]}</span></span> : <span key={j}>{t}</span>;
    })}</bdi>;
  })}</>;
}
const CloseIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>;
const Mark = () => <div className="wordmark" dir="ltr" aria-label="WordFlow"><span className="tile small"><i>W</i></span><span>ordFlow</span></div>;
const PRAISE = ['יפה!', 'בול!', 'נכון!', 'מעולה!', 'איזה יופי!', 'בדיוק!'];
const ANS = (a: string) => shown(a).replace(/^\[\[([<>=])\]\]$/, '$1');

function useTimer(active: boolean, update: Update) {
  useEffect(() => {
    if (!active) return;
    const TICK = 5, IDLE = 45000;
    let last = Date.now(), pending = 0;
    const touch = () => { last = Date.now(); };
    const flush = () => { if (pending > 0) { const sec = pending; pending = 0; update((s) => addTime(s, dayNumber(), sec)); } };
    window.addEventListener('pointerdown', touch); window.addEventListener('keydown', touch);
    const id = setInterval(() => { if (document.visibilityState === 'visible' && Date.now() - last < IDLE) pending += TICK; if (pending >= 15) flush(); }, TICK * 1000);
    document.addEventListener('visibilitychange', flush);
    return () => { clearInterval(id); flush(); window.removeEventListener('pointerdown', touch); window.removeEventListener('keydown', touch); document.removeEventListener('visibilitychange', flush); };
  }, [active, update]);
}

export function MathApp() {
  const [st, setSt] = useState<MathState>(() => load());
  const update: Update = useCallback((fn) => setSt((s) => { const n = fn(s); save(n); return n; }), []);
  const [tab, setTab] = useState<Tab>('home');
  const [inSession, setInSession] = useState(false);
  const [settings, setSettings] = useState(false);
  const [running, setRunning] = useState(false);
  const today = dayNumber();
  useTimer(inSession || running, update);

  const start = (o: { extra?: boolean; bonus?: boolean } = {}) => {
    update((s) => {
      const open = !!s.plan && s.plan.day === today && s.plan.at < s.plan.steps.length;
      return open && !o.extra && !o.bonus ? s : { ...s, plan: buildPlan(s, today, o) };
    });
    setInSession(true);
  };

  if (!st.onboarded) return <Onboarding st={st} update={update} running={running} setRunning={setRunning} />;
  if (inSession && st.plan) return <Session st={st} update={update} onExit={() => { setInSession(false); setTab('home'); }} onMore={start} />;
  return (
    <div className="app">
      <main className="page">
        {tab === 'home' && <Home st={st} today={today} onStart={start} onSettings={() => setSettings(true)} />}
        {tab === 'path' && <PathScreen st={st} />}
        {tab === 'progress' && <Progress st={st} />}
      </main>
      <nav className="nav" aria-label="ניווט">
        {([['home', 'בית'], ['path', 'המסע'], ['progress', 'התקדמות']] as [Tab, string][]).map(([k, t]) => <button key={k} type="button" className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{t}</button>)}
        <SummaryTab name={st.name} />
      </nav>
      {settings && <Settings st={st} update={update} onClose={() => setSettings(false)} />}
    </div>
  );
}

// ---------- A question ----------
interface QProps { q: Question; sound: boolean; hint?: Question | null; onDone: (r: { correct: boolean; hinted: boolean; trap?: TrapId }) => void; onNext: () => void; neutral?: boolean; extraAction?: React.ReactNode; shownSteps?: string[] }

function QuestionView({ q, sound, hint, onDone, onNext, neutral, extraAction, shownSteps }: QProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<null | { correct: boolean; trap?: TrapId }>(null);
  const [hinted, setHinted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const finish = (correct: boolean, trap?: TrapId) => {
    setResult({ correct, trap });
    if (sound) (correct ? sfx.good : sfx.bad)();
    onDone({ correct, hinted, trap });
    if (correct) setTimeout(onNext, 850);
  };
  const pick = (label: string, trap?: TrapId) => { if (result) return; setPicked(label); finish(isChoiceRight(q, label), trap); };
  const check = () => { if (result || !text) return; finish(checkTyped(q, text), trapForTyped(q, text)); };
  const key = (c: string) => { if (result) return; if (sound) sfx.tap(); setText((t) => (t.length < 12 ? t + c : t)); };

  useEffect(() => {
    if (q.choices) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      if (/^[0-9]$/.test(e.key) || (e.key === '/' && q.frac) || (e.key === '.' && (q.dot || q.frac))) key(e.key);
      else if (e.key === 'Backspace') setText((t) => (result ? t : t.slice(0, -1)));
      else if (e.key === 'Enter') check();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const long = q.prompt.length > 40;
  return (
    <div className="q">
      <p className={`m-prompt ${long ? 'long' : ''}`}><MT s={q.prompt} /></p>
      {q.big && <div className="m-big"><MT s={q.big} /></div>}
      {shownSteps && <ol className="m-steps">{shownSteps.map((s, i) => <li key={i}><span><MT s={s} /></span></li>)}</ol>}
      {q.fig && <Figure fig={q.fig} />}
      <div className="m-tools">
        {q.pencil && hint && !result && <button type="button" className="m-tool pencil" onClick={() => { setHinted(true); setShowHint(true); }}>✎ אפשר בדף · לחיצה לרמז</button>}
        {q.read && canSpeak() && <button type="button" className="m-tool" onClick={() => speakHebrew(q.prompt)}>🔊 הקראה</button>}
      </div>
      {q.choices ? (
        <div className="answers m-pick">
          {q.choices.map((c) => <button key={c.label} type="button" onClick={() => pick(c.label, c.trap)} className={`ans ${result && isChoiceRight(q, c.label) ? 'right' : ''} ${result && picked === c.label && !isChoiceRight(q, c.label) ? 'wrong' : ''}`}><MT s={c.label} /></button>)}
          {!result && extraAction}
        </div>
      ) : (
        <>
          <div className={`m-typed ${result ? (result.correct ? 'ok' : 'no') : ''}`} aria-live="polite">{text || ' '}</div>
          {!result && (
            <>
              <div className="m-keys">
                {['7', '8', '9'].map((c) => <button key={c} type="button" onClick={() => key(c)}>{c}</button>)}<button type="button" aria-label="מחיקה" onClick={() => setText((t) => t.slice(0, -1))}>⌫</button>
                {['4', '5', '6'].map((c) => <button key={c} type="button" onClick={() => key(c)}>{c}</button>)}<button type="button" aria-label="קו שבר" disabled={!q.frac} onClick={() => key('/')}>/</button>
                {['1', '2', '3'].map((c) => <button key={c} type="button" onClick={() => key(c)}>{c}</button>)}<button type="button" aria-label="נקודה" disabled={!(q.dot || q.frac)} onClick={() => key('.')}>.</button>
                <button type="button" onClick={() => key('0')}>0</button><button type="button" className="go" style={{ gridColumn: 'span 3' }} disabled={!text} onClick={check}>בדיקה</button>
              </div>
              {extraAction}
            </>
          )}
        </>
      )}
      {result?.correct && <div className="feedback good" role="status"><b>{hinted ? 'יפה! עם רמז, ועכשיו זה שלך' : PRAISE[(q.answer.length + q.prompt.length) % PRAISE.length]}</b></div>}
      {neutral && result && !result.correct && (
        <div className="feedback soft" role="status">
          <b>לא הפעם, וזה בסדר.</b>
          <span className="m-result">התשובה: <MT s={ANS(q.answer)} /></span>
          <button type="button" className="btn-next" onClick={onNext}>ממשיכות</button>
        </div>
      )}
      {!neutral && result && !result.correct && (
        <div className="feedback soft" role="status">
          <span className="m-result">התשובה: <MT s={ANS(q.answer)} /></span>
          {result.trap && <p className="m-trap"><b>{TRAPS[result.trap].name}.</b> {TRAPS[result.trap].explain}</p>}
          <ol className="m-steps">{q.steps.map((s, i) => <li key={i}><span><MT s={s} /></span></li>)}</ol>
          <button type="button" className="btn-next" onClick={onNext}>הבנתי</button>
        </div>
      )}
      {showHint && hint && <HintSheet hint={hint} onClose={() => setShowHint(false)} />}
    </div>
  );
}

function HintSheet({ hint, onClose }: { hint: Question; onClose: () => void }) {
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="רמז" onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h2>ככה פותרים</h2><button type="button" className="round" aria-label="סגירה" onClick={onClose}><CloseIcon /></button></div>
        <p className="small muted">דוגמה מאותו סוג, עם מספרים אחרים. אחר כך חוזרים לשאלה שלך.</p>
        {hint.prompt !== 'כמה זה?' && <p className="m-prompt long"><MT s={hint.prompt} /></p>}
        {hint.big && <div className="m-big"><MT s={hint.big} /></div>}
        {hint.fig && <Figure fig={hint.fig} />}
        <ol className="m-steps">{hint.steps.map((s, i) => <li key={i}><span><MT s={s} /></span></li>)}</ol>
        <p className="m-result">התשובה בדוגמה: <MT s={ANS(hint.answer)} /></p>
        <button type="button" className="cta" onClick={onClose}>חזרה לשאלה</button>
      </div>
    </div>
  );
}

// ---------- Worked example ----------
function Worked({ q, title, sound, onNext }: { q: Question; title: string; sound: boolean; onNext: () => void }) {
  const [shown_, setShown] = useState(1);
  const all = shown_ > q.steps.length;
  return (
    <div className="q">
      <span className="m-chip-hi center">מיומנות חדשה: {title}</span>
      <p className="m-prompt"><MT s={q.prompt === 'כמה זה?' ? 'נראה איך פותרים' : q.prompt} /></p>
      {q.big && <div className="m-big"><MT s={q.big} /></div>}
      {q.fig && <Figure fig={q.fig} />}
      <ol className="m-steps">{q.steps.slice(0, shown_).map((s, i) => <li key={i}><span><MT s={s} /></span></li>)}</ol>
      {all && <p className="m-result center">התשובה: <MT s={ANS(q.answer)} /></p>}
      <div className="grow" />
      <button type="button" className="cta" onClick={() => { if (sound) sfx.tap(); if (all) onNext(); else setShown(shown_ + 1); }}>{all ? 'הבנתי, ננסה' : 'הצעד הבא'}</button>
    </div>
  );
}

// ---------- Session ----------
const PARTS: { id: Part; name: string }[] = [{ id: 'warm', name: 'חימום' }, { id: 'boost', name: 'חיזוק' }, { id: 'new', name: 'חדש' }];

function Session({ st, update, onExit, onMore }: { st: MathState; update: Update; onExit: () => void; onMore: (o?: { extra?: boolean; bonus?: boolean }) => void }) {
  const plan = st.plan!;
  const step = plan.steps[plan.at];
  const finished = plan.at >= plan.steps.length;
  const played = useRef(false);
  useEffect(() => { if (finished && !played.current && st.settings.sound) { played.current = true; sfx.win(); } }, [finished, st.settings.sound]);
  const q = useMemo(() => (step ? makeQuestion(step) : null), [step?.seed, step?.skill, step?.kind]);
  const hint = useMemo(() => (step && q?.pencil && step.kind !== 'worked' ? hintFor(step, q) : null), [q]);
  if (finished) return <Finish st={st} onExit={onExit} onMore={onMore} />;
  if (!step || !q) return null;
  const next = () => update(advance);
  const parts = PARTS.filter((p) => plan.steps.some((s) => s.part === p.id));
  const cur = parts.findIndex((p) => p.id === step.part);
  const inPart = plan.steps.filter((s) => s.part === step.part), idx = plan.steps.slice(0, plan.at).filter((s) => s.part === step.part).length;
  const onDone = (r: { correct: boolean; hinted: boolean; trap?: TrapId }) => update((s) => {
    const a = recordAnswer(s, step, r, plan.day);
    return r.correct ? a : queueRetry(a, step);
  });
  return (
    <div className="session" key={plan.at}>
      <div className="s-top">
        <button type="button" className="round" aria-label="יציאה. ההתקדמות נשמרת" onClick={onExit}><CloseIcon /></button>
        <ol className="part-bar" style={{ gridTemplateColumns: `repeat(${parts.length}, 1fr)` }}>
          {parts.map((p, i) => <li key={p.id} className={i === cur ? 'on' : ''}><span><i style={{ width: `${i < cur ? 100 : i > cur ? 0 : (idx / inPart.length) * 100}%` }} /></span><small>{p.name}</small></li>)}
        </ol>
      </div>
      {step.kind === 'worked'
        ? <Worked q={q} title={SKILL[step.skill].title} sound={st.settings.sound} onNext={() => update((s) => advance(markMet(s, step.skill, plan.day)))} />
        : <QuestionView q={q} sound={st.settings.sound} hint={hint} onDone={onDone} onNext={next} shownSteps={step.kind === 'partial' && q.steps.length > 1 ? q.steps.slice(0, -1) : undefined} />}
    </div>
  );
}

function Finish({ st, onExit, onMore }: { st: MathState; onExit: () => void; onMore: (o?: { extra?: boolean; bonus?: boolean }) => void }) {
  const plan = st.plan!, log = dayLog(st, plan.day);
  const fresh = plan.newSkill ? SKILL[plan.newSkill] : null;
  return (
    <div className="session finish">
      <span className="stage">{plan.extra ? 'סיבוב נוסף' : 'סיימת את האימון'}</span>
      <h1>כל הכבוד{st.name ? `, ${st.name}` : ''}!</h1>
      {fresh && <p className="lead">למדת היום: <b>{fresh.title}</b></p>}
      <section className="results-grid">
        <div><b>{log.ok}</b><span>תשובות נכונות לבד</span></div>
        <div><b>{log.helped}</b><span>נכונות אחרי רמז</span></div>
      </section>
      {plan.flagged[0] && <p className="one-point">למחר: <b>{SKILL[plan.flagged[0]].title}</b>. זה יחזור בחיזוק.</p>}
      <div className="grow" />
      <button type="button" className="cta" onClick={onExit}>סיום</button>
      {nextNew(st) && <button type="button" className="link center-block" onClick={() => onMore({ bonus: true })}>עוד מיומנות חדשה</button>}
    </div>
  );
}

// ---------- Onboarding and the opening run ----------
function Onboarding({ st, update, running, setRunning }: { st: MathState; update: Update; running: boolean; setRunning: (v: boolean) => void }) {
  const [name, setName] = useState(() => st.name || USER_NAME || readCourses().find((c) => c.name)?.name || '');
  const p = st.placement;
  const begin = () => { update((s) => ({ ...s, name: name.trim(), placement: s.placement ?? startPlacement(Math.floor(Math.random() * 1e8)) })); setRunning(true); };
  if (p && placementDone(p)) return <RunResult st={st} update={update} />;
  if (running && p) return <Run st={st} update={update} onPause={() => setRunning(false)} />;
  return (
    <div className="onb">
      <Mark />
      <h1>{p ? 'ממשיכות מאיפה שעצרנו' : 'מוצאות יחד מאיפה מתחילים'}</h1>
      <p className="lead">כמה שאלות קצרות, בלי ציון. {p ? 'ההתקדמות נשמרה.' : 'מתחילות בקל, ועוצרות במקום שעוד לא למדת.'}</p>
      {!p && <><p className="lead"><b>כדאי להכין דף ועט.</b> עושים כאן את החישוב כמו בבית, וכותבים באפליקציה רק את התשובה.</p>
        <label className="field" htmlFor="mn">איך לקרוא לך?</label>
        <input id="mn" className="input" value={name} onChange={(e) => setName(e.target.value)} /></>}
      <button type="button" className="cta" disabled={!p && !name.trim()} onClick={begin}>{p ? 'להמשיך' : 'מתחילות'}</button>
      <p className="small muted center">אפשר לעצור בכל רגע ולהמשיך בפעם אחרת.</p>
    </div>
  );
}

function Run({ st, update, onPause }: { st: MathState; update: Update; onPause: () => void }) {
  const p = st.placement!;
  const stepDef = placementStep(p);
  const q = useMemo(() => makeQuestion(stepDef), [p.station, p.round, p.i, p.d]);
  const hint = useMemo(() => (q.pencil ? hintFor(stepDef, q) : null), [q]);
  const station = STATIONS.find((s) => s.id === p.station)!;
  const total = STATIONS.length;
  const pct = Math.min(100, ((station.id - 1 + p.i / 4) / total) * 100);
  const answered = useRef<boolean | null>(null);
  const move = (res: boolean | 'notyet') => update((s) => (s.placement ? { ...s, placement: answerPlacement(s.placement, res) } : s));
  return (
    <div className="session" key={`${p.d}-${p.station}-${p.round}-${p.i}`}>
      <div className="s-top"><span className="muted small">{DOMAINS[p.d].name}</span><button type="button" className="link" onClick={onPause}>אמשיך אחר כך</button></div>
      <div className="thin"><span style={{ width: `${pct}%` }} /></div>
      <QuestionView q={q} sound={st.settings.sound} neutral hint={hint} onDone={(r) => { answered.current = r.correct && !r.hinted; }} onNext={() => move(answered.current === true)}
        extraAction={<button type="button" className="ans quiet" onClick={() => move('notyet')}>עוד לא למדתי</button>} />
    </div>
  );
}

function RunResult({ st, update }: { st: MathState; update: Update }) {
  const p = st.placement!;
  return (
    <div className="onb">
      <Mark />
      <h1>מצאנו מאיפה מתחילים</h1>
      <p className="lead">כל תחום מתחיל במקום שלו. מה שכבר עברת יחזור מדי פעם בחימום.</p>
      <ul className="card m-where">
        {DOMAINS.map((d) => {
          const start = p.start[d.id] ?? 1, last = Math.max(...stationsOf(d.id));
          return <li key={d.id}><span>{d.name}</span><b>{start > last ? 'הכול עבר בהצלחה' : STATIONS.find((s) => s.id === start)!.name}</b></li>;
        })}
      </ul>
      <button type="button" className="cta" onClick={() => update((s) => applyPlacement(s, s.placement!, dayNumber()))}>לאימון הראשון</button>
    </div>
  );
}

// ---------- Home ----------
function Home({ st, today, onStart, onSettings }: { st: MathState; today: number; onStart: (o?: { extra?: boolean; bonus?: boolean }) => void; onSettings: () => void }) {
  const open = st.plan && st.plan.day === today && st.plan.at < st.plan.steps.length && !st.plan.extra ? st.plan : null;
  const preview = useMemo(() => open ?? buildPlan(st, today, { rnd: () => 0.5 }), [open?.at, st.skills, today]);
  const log = dayLog(st, today), t = totals(st), week = weekDays(st, today);
  const fresh = preview.newSkill ? SKILL[preview.newSkill] : null;
  const count = (p: Part) => preview.steps.filter((s) => s.part === p && s.kind === 'solve').length;
  const hour = new Date().getHours(), hi = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';
  const canNew = !!nextNew(st), anyMet = SKILLS.some((s) => isMet(st, s.id));
  return (
    <>
      <header className="top"><Mark /><CourseSwitch /><button type="button" className="round" aria-label="הגדרות" onClick={onSettings}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="8" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="2" /></svg></button></header>
      <h1 className="greet">{hi}{st.name ? `, ${st.name}` : ''}</h1>
      <div className="next-card">
        {log.done && !open ? (
          <>
            <span className="chip-d">היום הושלם</span>
            <h2>סיימת את האימון של היום</h2>
            <p>{canNew ? 'בא לך עוד? אפשר ללמוד מיומנות נוספת.' : 'מיומנויות חדשות ייפתחו כשמה שלמדת יתבסס.'}</p>
            <button type="button" className="cta-d" onClick={() => onStart(canNew ? { bonus: true } : { extra: true })}>{canNew ? 'עוד מיומנות' : 'אימון חיזוק'}</button>
          </>
        ) : preview.steps.length === 0 ? (
          <>
            <span className="chip-d">הכול מעודכן</span>
            <h2>סיימת את כל התחנות שפתוחות כרגע</h2>
            <p>התחנות הבאות עוד בבנייה. בינתיים אפשר לחזק את מה שלמדת.</p>
            {anyMet && <button type="button" className="cta-d" onClick={() => onStart({ extra: true })}>אימון חיזוק</button>}
          </>
        ) : (
          <>
            <span className="chip-d">{open && open.at > 0 ? 'ממשיכות מאיפה שעצרת' : 'האימון של היום'}</span>
            <h2>{fresh ? `מחכה לך: ${fresh.title}` : 'היום מחזקות את מה שלמדת'}</h2>
            <ol className="route">
              {PARTS.map((p) => <li key={p.id}><b>{p.name}</b><small>{p.id === 'new' ? (fresh ? 'דוגמה ותרגול' : count(p.id) || '-') : `${count(p.id) || 0} שאלות`}</small></li>)}
            </ol>
            <button type="button" className="cta-d" onClick={() => onStart()}>{open && open.at > 0 ? 'להמשיך' : 'להתחיל'}</button>
          </>
        )}
      </div>
      <p className="small muted center">כדאי שיהיו לידך דף ועט.</p>
      <section className="two-meters" aria-label="סיכום">
        <div><b>{t.u}</b><span>מיומנויות שהבנת מתוך {t.uAll}</span></div>
        <div><b>{t.e}</b><span>מיומנויות שאת מחשבת נכון מתוך {t.eAll}</span></div>
      </section>
      {anyMet && <button type="button" className="sent-card" onClick={() => onStart({ extra: true })}><span className="sent-txt"><b>אימון חיזוק</b><small>סיבוב קצר על מה שכבר למדת</small></span><span className="sent-go" aria-hidden="true">←</span></button>}
      <TodayPlan />
      <section className="card week">
        <div className="row-between"><h3>השבוע</h3><span className="muted small">{week.filter(Boolean).length} מתוך {st.settings.weeklyGoal} ימים</span></div>
        <div className="week-tiles" aria-hidden="true">{['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((d, i) => <span key={d} className={`wd ${week[i] ? 'on' : ''}`}>{d}</span>)}</div>
        <p className="small muted">יום שפספסת לא מוחק כלום. פשוט ממשיכות.</p>
      </section>
    </>
  );
}

// ---------- Path ----------
function PathScreen({ st }: { st: MathState }) {
  const cur = nextNew(st)?.station ?? SKILLS.find((s) => !isMet(st, s.id))?.station ?? 7;
  const [open, setOpen] = useState<number | null>(cur);
  return (
    <>
      <header className="page-head"><h1>המסע</h1><p className="muted">תחנה אחרי תחנה. כל מיומנות נפתחת כשמה שהיא נשענת עליו התבסס.</p></header>
      <ol className="stations">
        {STATIONS.map((s) => {
          const list = SKILLS.filter((k) => k.station === s.id);
          const known = list.filter((k) => ['מבוסס', 'מוכר, ונבדק בחימום'].includes(statusOf(st, k))).length;
          const state = s.id === cur ? 'now' : known === list.length ? 'done' : s.id > cur ? 'ahead' : 'past';
          return (
            <li key={s.id} className={`station ${state}`}>
              <button type="button" className="st-head" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>
                <span className="st-num">{s.id}</span>
                <span className="st-txt"><b>{s.name}</b><small>{s.blurb}</small></span>
                <span className="st-count"><b>{known}</b>/{list.length}</span>
              </button>
              {open === s.id && list.map((k) => { const label = statusOf(st, k); return <div key={k.id} className={`m-skill ${label === 'צריך חיזוק' ? 'flagged' : ''}`}><span>{k.title}</span><small>{label}</small></div>; })}
            </li>
          );
        })}
      </ol>
    </>
  );
}

// ---------- Progress ----------
function Progress({ st }: { st: MathState }) {
  const t = totals(st), weak = flaggedSkills(st);
  const traps = Object.entries(st.traps).sort((a, b) => b[1] - a[1]).slice(0, 5) as [TrapId, number][];
  return (
    <>
      <header className="page-head"><h1>התקדמות</h1></header>
      <section className="meters">
        <div className="meter r"><span className="m-name">הבנה</span><b>{t.u}</b><small>מיומנויות מבוססות מתוך {t.uAll}</small><div className="m-bar"><span style={{ width: `${(t.u / t.uAll) * 100}%` }} /></div></div>
        <div className="meter s"><span className="m-name">ביצוע</span><b>{t.e}</b><small>מיומנויות מבוססות מתוך {t.eAll}</small><div className="m-bar"><span style={{ width: `${(t.e / t.eAll) * 100}%` }} /></div></div>
      </section>
      <section className="card">
        <h3>נקודת ההתחלה</h3>
        <ul className="m-where">{DOMAINS.map((d) => { const start = st.start[d.id] ?? 1, last = Math.max(...stationsOf(d.id)); return <li key={d.id}><span>{d.name}</span><b>{start > last ? 'הכול עבר בהצלחה' : STATIONS.find((s) => s.id === start)!.name}</b></li>; })}</ul>
      </section>
      <h2 className="eyebrow">נקודות קושי</h2>
      {!weak.length && !traps.length && <section className="card empty"><p>עדיין אין נקודות קושי. אחרי כמה ימי אימון נראה כאן מה כדאי לחזק.</p></section>}
      {weak.length > 0 && <section className="card"><h3>מיומנויות לחיזוק</h3><ul className="m-where">{weak.map((s) => <li key={s.id}><span>{s.title}</span><small className="muted">{STATIONS.find((x) => x.id === s.station)!.name}</small></li>)}</ul></section>}
      {traps.length > 0 && <section className="card"><h3>טעויות שחוזרות</h3><ul className="traps">{traps.map(([id, c]) => <li key={id}><div className="row-between"><b>{TRAPS[id].name}</b><span className="chip">{c}</span></div><p className="small muted">{TRAPS[id].explain}</p></li>)}</ul></section>}
    </>
  );
}

// ---------- Settings ----------
function Settings({ st, update, onClose }: { st: MathState; update: Update; onClose: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (patch: Partial<MathState['settings']>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const backup = () => {
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ ...st, course: 'math' })], { type: 'application/json' })); a.download = `wordflow-math-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setMsg('הגיבוי נשמר בקובץ.'); }
    catch { setMsg('לא הצלחתי לשמור קובץ במכשיר הזה.'); }
  };
  const restore = async (f?: File) => {
    if (!f) return;
    try { const d = JSON.parse(await f.text()); if (d.course !== 'math' || !d.skills) throw new Error('bad'); update(() => d); setMsg('הגיבוי שוחזר.'); }
    catch { setMsg('הקובץ הזה אינו גיבוי של חשבון ב-WordFlow.'); }
  };
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="הגדרות" onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h2>הגדרות</h2><button type="button" className="round" aria-label="סגירה" onClick={onClose}><CloseIcon /></button></div>
        <div className="set-row"><span>מה לומדים</span><CourseSwitch /></div>
        <p className="small muted">לכל קורס התקדמות משלו, והיא נשמרת כשעוברים ביניהם.</p>
        <label className="field" htmlFor="m2">שם</label>
        <input id="m2" className="input" value={st.name} onChange={(e) => update((s) => ({ ...s, name: e.target.value }))} />
        <div className="set-row"><span>קצב מיומנויות חדשות</span>
          <div className="seg lang" role="group" aria-label="קצב">
            <button type="button" aria-pressed={st.settings.pace === 'calm'} onClick={() => set({ pace: 'calm' })}>רגוע</button>
            <button type="button" aria-pressed={st.settings.pace === 'normal'} onClick={() => set({ pace: 'normal' })}>רגיל</button>
          </div></div>
        <div className="set-row"><label htmlFor="m3">צלילי משחק</label><input id="m3" type="checkbox" checked={st.settings.sound} onChange={(e) => set({ sound: e.target.checked })} /></div>
        <div className="set-row"><label htmlFor="m4">יעד ימי אימון בשבוע</label><select id="m4" className="input tiny" value={st.settings.weeklyGoal} onChange={(e) => set({ weeklyGoal: +e.target.value })}>{[2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
        <h3 className="sub">גיבוי</h3>
        <p className="small muted">ההתקדמות נשמרת רק במכשיר הזה.</p>
        <div className="btns"><button type="button" className="btn" onClick={backup}>שמירת גיבוי</button><label className="btn" htmlFor="m5">שחזור מקובץ</label><input id="m5" type="file" accept="application/json" hidden onChange={(e) => restore(e.target.files?.[0])} /></div>
        {msg && <p className="small" role="status">{msg}</p>}
        <div className="danger">
          {!confirm ? <button type="button" className="link" onClick={() => setConfirm(true)}>איפוס ההתקדמות בחשבון</button> : <>
            <p className="small">למחוק את ההתקדמות בחשבון? אי אפשר לבטל את זה.</p>
            <div className="btns"><button type="button" className="btn" onClick={() => setConfirm(false)}>ביטול</button><button type="button" className="btn del" onClick={() => { update(() => ({ ...initialMath(), name: st.name })); onClose(); }}>מחיקה</button></div></>}
        </div>
      </div>
    </div>
  );
}
