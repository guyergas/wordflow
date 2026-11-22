import { SettingsSheet, Toggle } from '../settingsSheet';
import { g } from '../course';
import { FirstRunTop, greeting, TopBar } from '../topBar';
import { reward } from '../hearts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pushProgress } from '../progressSync';
import { COURSE_INFO, STORAGE_KEY, USER_NAME, userKey } from '../course';
import { shortParagraphs } from './kit';
import { pushWin } from '../wins';
import { sfx } from '../platform';
import { readCourses } from '../summary';
import { SummaryTab, TodayPlan } from '../summaryUi';
import { addTime, advance, answerKey, buildPlan, dayLog, dayNumber, finishLesson, finishReview, initial, keyOf, practiceQs, learned, retryPlan, KState, LESSON, lessonsOf, needed, nextLesson, passes, pickQs, practicePlan, recallCount, statusOf, Step } from './engine';
import { Lesson, QuizQ } from './lessons';

type Update = (fn: (s: KState) => KState) => void;
const LEVEL = ['בסיס', 'מעמיק', 'קפיצה'];
let memory: string | null = null;
function load(): KState {
  let raw = memory;
  try { raw = localStorage.getItem(STORAGE_KEY) ?? raw; } catch { /* memory only */ }
  if (!raw) return initial();
  try { const p = JSON.parse(raw), b = initial(); const st: KState = { ...b, ...p, name: USER_NAME || p.name, settings: { ...b.settings, ...p.settings } }; if (st.plan?.steps.some((x) => (x.t === 'review' ? x.ids.some((id) => !LESSON[id]) : !LESSON[x.id.split('#')[0]]))) st.plan = null; return st; } catch { return initial(); }
}
function save(st: KState) { memory = JSON.stringify(st); try { localStorage.setItem(STORAGE_KEY, memory); } catch { /* memory only */ } }
export function recoverKnowledge() { save({ ...load(), plan: null }); }

function useTimer(active: boolean, update: Update) {
  useEffect(() => {
    if (!active) return;
    const TICK = 5, IDLE = 90000; // Reading a passage has few taps, so the pause allowed here is longer.
    let last = Date.now(), pending = 0;
    const touch = () => { last = Date.now(); };
    const flush = () => { if (pending > 0) { const sec = pending; pending = 0; update((s) => addTime(s, dayNumber(), sec)); } };
    window.addEventListener('pointerdown', touch); window.addEventListener('scroll', touch, true);
    const id = setInterval(() => { if (document.visibilityState === 'visible' && Date.now() - last < IDLE) pending += TICK; if (pending >= 15) flush(); }, TICK * 1000);
    document.addEventListener('visibilitychange', flush);
    return () => { clearInterval(id); flush(); window.removeEventListener('pointerdown', touch); window.removeEventListener('scroll', touch, true); document.removeEventListener('visibilitychange', flush); };
  }, [active, update]);
}
const CloseIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>;
const Mark = () => <div className="wordmark" dir="ltr" aria-label="WordFlow"><span className="tile small"><i>W</i></span><span>ordFlow</span></div>;

export function KnowledgeApp() {
  const [st, setSt] = useState<KState>(() => load());
  const update: Update = useCallback((fn) => setSt((s) => { const n = fn(s); save(n); return n; }), []);
  const [tab, setTab] = useState<'home' | 'path'>('home');
  const [inSession, setInSession] = useState(false);
  const [settings, setSettings] = useState(false);
  const today = dayNumber();
  useTimer(inSession, update);
  const start = (o: { bonus?: boolean; extra?: boolean } = {}) => {
    update((s) => { const open = !!s.plan && s.plan.day === today && s.plan.at < s.plan.steps.length; return open && !o.bonus && !o.extra ? s : { ...s, plan: buildPlan(s, today, o) }; });
    setInSession(true);
  };
  const practice = (id: string) => { update((s) => ({ ...s, plan: practicePlan(id, today) })); setInSession(true); };
  const retry = (id: string) => { update((s) => ({ ...s, plan: retryPlan(id, today) })); setInSession(true); };
  if (!st.onboarded) return <Hello st={st} update={update} />;
  if (inSession && st.plan) return <Session st={st} update={update} onExit={() => setInSession(false)} onRetry={retry} />;
  return (
    <div className="app">
      <main className="page">
        {tab === 'home' ? <Home st={st} today={today} onStart={start} onRetry={retry} onPractice={practice} onSettings={() => setSettings(true)} /> : <Path st={st} onPick={practice} onRetry={retry} />}
      </main>
      <nav className="nav" aria-label="ניווט">
        {([['home', 'בית'], ['path', 'המסע']] as const).map(([k, t]) => <button key={k} type="button" className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{t}</button>)}
        <SummaryTab name={st.name} />
      </nav>
      {settings && <Settings st={st} update={update} onClose={() => setSettings(false)} />}
    </div>
  );
}

function Hello({ st, update }: { st: KState; update: Update }) {
  const [name, setName] = useState(() => USER_NAME || st.name || readCourses().find((c) => c.name)?.name || '');
  return (
    <div className="onb">
      <FirstRunTop />
      <h1>{COURSE_INFO.name}</h1>
      <p className="lead">{COURSE_INFO.note}. בכל שיעור קוראים קטע קצר ועונים על כמה שאלות. לא צריך לזכור כל פרט, אלא להבין את הרעיון.</p>
      {!USER_NAME && <><label className="field" htmlFor="kn">איך לקרוא לך?</label><input id="kn" className="input" value={name} onChange={(e) => setName(e.target.value)} /></>}
      <button type="button" className="cta" disabled={!name.trim()} onClick={() => update((s) => ({ ...s, name: name.trim(), onboarded: true }))}>{g('מתחילות', 'מתחילים')}</button>
    </div>
  );
}

const Lock = () => <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z" /></svg>;
function Locked({ title, why }: { title: string; why: string }) {
  return <div className="card k-locked" aria-disabled="true"><span className="k-chip"><Lock /> נעול</span><h3>{title}</h3><p className="small muted">{why}</p></div>;
}

/** Home: the previous lesson (passed or not), the next one, and the one after it. A lesson that did not pass locks what comes after. */
function Home({ st, today, onStart, onRetry, onPractice, onSettings }: { st: KState; today: number; onStart: (o?: { bonus?: boolean; extra?: boolean }) => void; onRetry: (id: string) => void; onPractice: (id: string) => void; onSettings: () => void }) {
  const open = st.plan && st.plan.day === today && st.plan.at < st.plan.steps.length && !st.plan.extra && !st.plan.practice ? st.plan : null;
  const preview = useMemo(() => open ?? buildPlan(st, today, { rnd: () => 0.5 }), [open?.at, st.lessons, st.keys, today]);
  const all = lessonsOf(), done = all.filter((l) => st.lessons[l.id]).length, list = learned(st);
  const prev = list.find((l) => !st.lessons[l.id].pass) ?? list.at(-1), ps = prev && st.lessons[prev.id], failed = !!ps && !ps.pass;
  const [next, after] = all.filter((l) => !st.lessons[l.id]);
  const review = preview.steps.some((x) => x.t === 'review'), recall = preview.steps.some((x) => x.t === 'recall'), keys = preview.steps.filter((x) => x.t === 'key').length;
  const blocker = failed ? `כדי לפתוח צריך לעבור את "${prev!.title}".` : '';
  return (
    <>
      <TopBar onSettings={onSettings} />
      <h1 className="greet">{greeting(st.name)}</h1>
      <div className="k-cards">
        {prev && ps && (failed ? (
          <div className="next-card">
            <span className="chip-d">השיעור הקודם · לא עבר</span>
            <h2>{prev.title}</h2>
            <p>ענית נכון על {ps.ok} מתוך {ps.all} בניסיון הראשון. כדי לעבור צריך {needed(ps.all)}.</p>
            <button type="button" className="cta-d" onClick={() => onRetry(prev.id)}>לעשות שוב</button>
          </div>
        ) : (
          <div className="card">
            <span className="k-chip ok">השיעור הקודם · עבר</span>
            <h3>{prev.title}</h3>
            <p className="small muted">ענית נכון על {ps.ok} מתוך {ps.all} בניסיון הראשון.</p>
            <button type="button" className="k-btn" onClick={() => onPractice(prev.id)}>חזרה נוספת</button>
          </div>
        ))}
        {review && !failed ? (
          <div className="next-card">
            <span className="chip-d">{open && open.at > 0 ? g('ממשיכות מאיפה שעצרת', 'ממשיכים מאיפה שעצרת') : 'לפני השיעור הבא'}</span>
            <h2>שיעור חזרה</h2>
            <p>כל השאלות של חמשת השיעורים האחרונים, לפני שממשיכים לנושא חדש.</p>
            <button type="button" className="cta-d" onClick={() => onStart()}>{open && open.at > 0 ? 'להמשיך' : 'להתחיל'}</button>
          </div>
        ) : next ? (failed ? <Locked title={next.title} why={blocker} /> : (
          <div className="next-card">
            <span className="chip-d">{open && open.at > 0 ? g('ממשיכות מאיפה שעצרת', 'ממשיכים מאיפה שעצרת') : 'השיעור הבא'}</span>
            <h2>{next.title}</h2>
            <p>{[recall ? 'מה זוכרים מהשיעור הקודם' : '', 'נושא חדש', keys > 0 ? `${keys} שאלות חזרה` : ''].filter(Boolean).join(', ')}</p>
            <button type="button" className="cta-d" onClick={() => onStart()}>{open && open.at > 0 ? 'להמשיך' : 'להתחיל'}</button>
          </div>
        )) : !failed && (
          <div className="next-card">
            <span className="chip-d">הכול נלמד</span>
            <h2>סיימת את כל השיעורים שיש כרגע</h2>
            <p>שיעורים חדשים ייתווספו בהמשך. אפשר לחזור על כל שיעור דרך המסע.</p>
            {Object.keys(st.keys).length > 0 && <button type="button" className="cta-d" onClick={() => onStart({ extra: true })}>חזרה קצרה</button>}
          </div>
        )}
        {review && !failed ? next && <Locked title={next.title} why="נפתח אחרי שיעור החזרה." /> : after && <Locked title={after.title} why={`נפתח אחרי "${next!.title}".`} />}
      </div>
      <section className="two-meters solo" aria-label="סיכום"><div><b>{done}</b><span>שיעורים שלמדת מתוך {all.length}</span></div></section>
      <TodayPlan />
    </>
  );
}

function Path({ st, onPick, onRetry }: { st: KState; onPick: (id: string) => void; onRetry: (id: string) => void }) {
  return (
    <>
      <header className="page-head"><h1>המסע</h1><p className="muted">{COURSE_INFO.name}, משיעורי הבסיס ועד הקפיצה. {g('לחצי', 'לחץ')} על שיעור שלמדת כדי לחזור עליו.</p></header>
      {[0, 1, 2].map((lv) => { const list = lessonsOf().filter((l) => l.level === lv); return list.length > 0 && (
        <section key={lv} className="station"><div className="st-head"><span className="st-num">{lv + 1}</span><span className="st-txt"><b>{LEVEL[lv]}</b></span></div>
          {list.map((l) => { const s = st.lessons[l.id]; return s
            ? <button key={l.id} type="button" className="m-skill" onClick={() => (s.pass ? onPick(l.id) : onRetry(l.id))}><span>{l.title}</span><small>{s.pass ? statusOf(st, l) : 'לא עבר · לנסות שוב'}</small></button>
            : <div key={l.id} className="m-skill"><span>{l.title}</span><small>{statusOf(st, l)}</small></div>; })}
        </section>
      ); })}
    </>
  );
}

function Session({ st, update, onExit, onRetry }: { st: KState; update: Update; onExit: () => void; onRetry: (id: string) => void }) {
  const plan = st.plan!, step = plan.steps[plan.at];
  if (!step) return <Finish st={st} onExit={onExit} onRetry={onRetry} />;
  return (
    <div className="session" key={plan.at}>
      <div className="s-top"><button type="button" className="round" aria-label="יציאה. ההתקדמות נשמרת" onClick={onExit}><CloseIcon /></button><div className="thin" style={{ flex: 1 }}><span style={{ width: `${(plan.at / plan.steps.length) * 100}%` }} /></div></div>
      {step.t === 'recall' || step.t === 'review'
        ? <Recall step={step} seed={plan.seed ?? plan.day * 7 + plan.at} practice={plan.practice} miss={step.t === 'recall' ? st.lessons[step.id]?.miss : undefined} nextTitle={(() => { const n = plan.steps[plan.at + 1]; return n?.t === 'lesson' ? LESSON[n.id].title : undefined; })()} sound={st.settings.sound} onDone={(ok, all) => { pushProgress(); update((s) => (plan.practice ? { ...s, plan: null } : advance(finishReview(s, step, ok, all, plan.day)))); if (plan.practice) onExit(); }} />
        : step.t === 'key'
        ? <Quiz q={keyOf(step.id)} sound={st.settings.sound} onAnswer={(ok) => update((s) => answerKey(s, step.id, ok, plan.day))} onNext={() => update(advance)} label="חזרה" />
        : <LessonView lesson={LESSON[step.id]} wiki={st.settings.wiki} sound={st.settings.sound} onDone={(ok, all, miss) => { if (!st.lessons[step.id]) pushWin('lesson', LESSON[step.id].title); pushProgress(); update((s) => advance(finishLesson(s, step.id, ok, all, plan.day, miss))); }} />}
    </div>
  );
}

/** In a lesson, a wrong answer sends her back to the text to try again. Only the first try counts. In a review there is no text, so the answer is shown. */
function Quiz({ q, sound, onAnswer, onNext, label, tools, onWrong }: { q: QuizQ; sound: boolean; onAnswer: (ok: boolean) => void; onNext: () => void; label?: string; tools?: React.ReactNode; onWrong?: () => void }) {
  const [question, right, wrong, why] = q;
  const options = useMemo(() => [right, ...wrong].map((o) => ({ o, k: Math.random() })).sort((a, b) => a.k - b.k).map((x) => x.o), [question]);
  const [picked, setPicked] = useState<string | null>(null);
  const [tried, setTried] = useState<string[]>([]);
  const pick = (o: string) => {
    if (picked || tried.includes(o)) return;
    if (sound) (o === right ? sfx.good : sfx.bad)();
    if (!tried.length) onAnswer(o === right);
    if (o !== right && onWrong) { setTried([...tried, o]); onWrong(); return; }
    setPicked(o);
  };
  return (
    <div className="q">
      {label && <span className="m-chip-hi center">{label}</span>}
      <p className="m-prompt">{question}</p>
      {tried.length > 0 && !picked && <div className="feedback soft" role="status"><b>לא בדיוק.</b><span>כדאי לחזור לקטע, למצוא את המקום המתאים ולנסות שוב.</span></div>}
      {tools}
      <div className="answers">
        {options.map((o) => <button key={o} type="button" disabled={tried.includes(o)} className={`ans k-ans ${picked && o === right ? 'right' : ''} ${(picked === o && o !== right) || tried.includes(o) ? 'wrong' : ''}`} onClick={() => pick(o)}>{o}</button>)}
      </div>
      {picked && <div className={`feedback ${picked === right ? 'good k-why' : 'soft'}`} role="status"><b>{picked === right ? 'נכון!' : 'לא הפעם.'}</b>{why && <span>{why}</span>}<button type="button" className="btn-next" onClick={onNext}>{g('ממשיכות', 'ממשיכים')}</button></div>}
    </div>
  );
}

function ReportProblem({ lesson }: { lesson: Lesson }) {
  const [msg, setMsg] = useState('');
  const send = async () => {
    const text = `משהו לא נכון בשיעור "${lesson.title}" (${lesson.id}) ב־WordFlow:`;
    try { if (navigator.share) { await navigator.share({ text }); return; } await navigator.clipboard.writeText(text); setMsg('הטקסט הועתק. אפשר להדביק אותו בהודעה.'); }
    catch (e) { if ((e as Error).name !== 'AbortError') setMsg('לא הצלחתי לשלוח מהמכשיר הזה.'); }
  };
  return <><button type="button" className="link center-block" onClick={send}>משהו לא נכון?</button>{msg && <p className="small center" role="status">{msg}</p>}</>;
}

/** Three of the sentences marked in yellow, spread over the text. Lessons without marks fall back to their key points. */
const summaryOf = (l: Lesson): string[] => {
  const marks = [...l.text.matchAll(/\[\[([\s\S]*?)\]\]/g)].map((m) => m[1].trim());
  if (marks.length <= 3) return marks.length ? marks : l.keys.slice(0, 3).map((k) => `${k[0]} ${k[1]}`);
  return [0, Math.floor(marks.length / 2), marks.length - 1].map((i) => marks[i]);
};

const textSize = () => { try { return Number(localStorage.getItem(userKey('textSize'))) || 18; } catch { return 18; } };

/** The lesson's text with its size buttons. Key sentences are in yellow only when asked (the first reading). */
function Text({ lesson, marks = false }: { lesson: Lesson; marks?: boolean }) {
  const [size, setSize] = useState(textSize);
  const change = (by: number) => { const next = Math.max(14, Math.min(28, size + by)); setSize(next); try { localStorage.setItem(userKey('textSize'), String(next)); } catch { /* this visit only */ } };
  return <div className="k-text" style={{ fontSize: size }}><div className="k-size" role="group" aria-label="גודל הטקסט"><button type="button" aria-label="הקטנת הטקסט" disabled={size <= 14} onClick={() => change(-2)}>א−</button><button type="button" aria-label="הגדלת הטקסט" disabled={size >= 28} onClick={() => change(2)}>א+</button></div>{shortParagraphs(lesson.text).map((t, i) => <p key={i}>{t.split(/\[\[|\]\]/).map((part, j) => (marks && j % 2 ? <mark key={j} className="k-mark">{part}</mark> : part))}</p>)}</div>;
}

/** Questions on lessons already read. The text is closed, a tap away. A wrong answer sends her back to it, with no answer shown. */
function Recall({ step, seed, sound, onDone, nextTitle, practice, miss }: { step: Extract<Step, { t: 'recall' | 'review' }>; seed: number; sound: boolean; onDone: (ok: number, all: number) => void; nextTitle?: string; practice?: boolean; miss?: number[] }) {
  const items = useMemo(() => (step.t === 'recall' ? (practice ? practiceQs(step.id, recallCount(step.id), seed, miss) : pickQs(step.id, recallCount(step.id), seed)) : step.ids.flatMap((id) => LESSON[id].qs.map((_, i): [string, number] => [id, i]))), [step, seed]);
  const [i, setI] = useState(0), [reread, setReread] = useState(false), score = useRef(0);
  const [stage, setStage] = useState<'intro' | 'q' | 'end'>('intro');
  // The review is a screen of its own: an opening, the questions, and a closing before the day's new topic.
  if (stage === 'intro') return (
    <div className="q">
      <span className="m-chip-hi center">{step.t === 'recall' ? 'חזרה' : 'שיעור חזרה'}</span>
      <h1 className="k-title">{step.t === 'recall' ? `מה זוכרים מ"${LESSON[step.id].title}"?` : 'חוזרים על חמשת השיעורים האחרונים'}</h1>
      <p className="k-idea">{practice ? `${items.length} שאלות מהשיעור, בסדר מעורבב.` : step.t === 'recall' ? `${items.length} שאלות על השיעור הקודם, לפני הנושא החדש.` : `${items.length} שאלות, בלי נושא חדש היום.`} הקטע סגור. אם לא זוכרים, אפשר להציץ בו.</p>
      <div className="grow" />
      <button type="button" className="cta" onClick={() => setStage('q')}>להתחיל את החזרה</button>
    </div>
  );
  if (stage === 'end') return (
    <div className="q">
      <span className="m-chip-hi center">סוף החזרה</span>
      <h1 className="k-title">{score.current} מתוך {items.length} בניסיון הראשון</h1>
      <p className="k-idea">{nextTitle ? `ועכשיו לנושא של היום: ${nextTitle}.` : 'כל הכבוד על החזרה!'}</p>
      <div className="grow" />
      <button type="button" className="cta" onClick={() => onDone(score.current, items.length)}>{nextTitle ? 'לנושא החדש' : 'סיימתי'}</button>
    </div>
  );
  const [id, qi] = items[i], lesson = LESSON[id];
  const label = step.t === 'recall' ? `מה זוכרים מ"${lesson.title}"` : `שיעור חזרה · ${lesson.title}`;
  return (
    <div className="k-wrap" key={i}>
      <Quiz q={lesson.qs[qi]} sound={sound} label={`${label} · ${i + 1}/${items.length}`} onAnswer={(ok) => { if (ok) score.current++; }}
        onNext={() => { setReread(false); if (i + 1 < items.length) setI(i + 1); else setStage('end'); }}
        onWrong={() => setReread(true)}
        tools={<><button type="button" className="link center-block" aria-expanded={reread} onClick={() => setReread(!reread)}>{reread ? 'להסתיר את הקטע' : 'להציץ בקטע'}</button>{reread && <Text lesson={lesson} />}</>} />
    </div>
  );
}

type Spot = { id: string; stage: 'read' | 'q' | 'end'; i: number; score: number; miss?: number[] };
const SPOT = () => userKey(`lessonSpot.${COURSE_INFO.id}`);
const readSpot = (): Spot | null => { try { return JSON.parse(localStorage.getItem(SPOT()) ?? 'null') as Spot | null; } catch { return null; } };
const writeSpot = (s: Spot | null) => { try { if (s) localStorage.setItem(SPOT(), JSON.stringify(s)); else localStorage.removeItem(SPOT()); } catch { /* this visit only */ } };

function LessonView({ lesson, wiki, sound, onDone }: { lesson: Lesson; wiki: boolean; sound: boolean; onDone: (ok: number, all: number, miss: number[]) => void }) {
  type Stage = 'read' | 'q' | 'end';
  // Leaving in the middle of a lesson, or closing the app, brings her back to the same question with the same score.
  const [saved] = useState(() => { const s = readSpot(); return s?.id === lesson.id ? s : null; });
  const [stage, setStage] = useState<Stage>(saved?.stage ?? 'read');
  const [i, setI] = useState(saved?.i ?? 0);
  const score = useRef(saved?.score ?? 0), miss = useRef<number[]>(saved?.miss ?? []);
  useEffect(() => { writeSpot({ id: lesson.id, stage, i, score: score.current, miss: miss.current }); }, [lesson.id, stage, i]);
  const [reread, setReread] = useState(false);
  // Key sentences are in yellow on the first reading only. Back from a question, she looks for the answer herself.
  if (stage === 'read') return <div className="q"><span className="m-chip-hi center">{LEVEL[lesson.level]}</span><h1 className="k-title">{lesson.title}</h1>{lesson.text.includes('[[') && <p className="small muted center">במרקר הצהוב: המשפטים החשובים בקטע</p>}<Text lesson={lesson} marks /><div className="grow" /><button type="button" className="cta" onClick={() => setStage('q')}>קראתי</button></div>;
  if (stage === 'q') return (
    <div className="k-wrap" key={i}>
      <Quiz q={lesson.qs[i]} sound={sound} label={`שאלה ${i + 1} מתוך ${lesson.qs.length}`} onAnswer={(ok) => { if (ok) score.current++; else miss.current.push(i); }} onNext={() => { setReread(false); if (i + 1 < lesson.qs.length) setI(i + 1); else setStage('end'); }}
        onWrong={() => setReread(true)}
        tools={<><button type="button" className="link center-block" aria-expanded={reread} onClick={() => setReread(!reread)}>{reread ? 'להסתיר את הקטע' : 'לראות שוב את הקטע'}</button>{reread && <Text lesson={lesson} />}</>} />
    </div>
  );
  return (
    <div className="q">
      <span className="m-chip-hi center">מה לקחת מכאן</span>
      <p className="k-idea">{lesson.idea}</p>
      {!passes(score.current, lesson.qs.length) && <div className="feedback soft k-again" role="status"><b>השיעור עוד לא עבר את הרף</b><span>ענית נכון בניסיון הראשון על {score.current} מתוך {lesson.qs.length} שאלות. כדי לעבור לנושא הבא צריך {needed(lesson.qs.length)}. אפשר לנסות שוב מיד, כמה פעמים שרוצים. כדאי לקרוא לאט ולחפש את התשובה בקטע לפני שעונים.</span></div>}
      <section className="card"><h3>שלושה דברים לזכור</h3><ul className="k-sum">{summaryOf(lesson).map((x) => <li key={x}>{x}</li>)}</ul></section>
      {wiki && <a className="link center-block" href={`https://he.wikipedia.org/wiki/${encodeURIComponent(lesson.wiki.replace(/ /g, '_'))}`} target="_blank" rel="noreferrer">רוצה לדעת עוד? בוויקיפדיה</a>}
      <ReportProblem lesson={lesson} />
      <div className="grow" />
      <button type="button" className="cta" onClick={() => { writeSpot(null); onDone(score.current, lesson.qs.length, miss.current); }}>סיימתי</button>
    </div>
  );
}

function Finish({ st, onExit, onRetry }: { st: KState; onExit: () => void; onRetry: (id: string) => void }) {
  // A finished practice is a whole point: the progress goes to the person's other devices.
  useEffect(() => { pushProgress(); }, []);
  // And it earns hearts for the game.
  useEffect(() => { reward('lesson'); }, []);
  const log = dayLog(st, st.plan!.day);
  const failed = st.plan!.steps.find((x): x is Extract<Step, { t: 'lesson' }> => x.t === 'lesson' && !st.lessons[x.id]?.pass);
  return (
    <div className="session finish">
      <span className="stage">סיימת</span>
      <h1>כל הכבוד{st.name ? `, ${st.name}` : ''}!</h1>
      {failed && <div className="feedback soft k-again" role="status"><b>"{LESSON[failed.id].title}" עוד לא עבר את הרף</b><span>צריך {needed(LESSON[failed.id].qs.length)} תשובות נכונות מתוך {LESSON[failed.id].qs.length} בניסיון הראשון. אפשר לנסות שוב עכשיו.</span></div>}
      <section className="two-meters solo"><div><b>{log.fresh}</b><span>נושאים חדשים היום</span></div></section>
      <div className="grow" />
      {failed && <button type="button" className="cta" onClick={() => onRetry(failed.id)}>לנסות שוב עכשיו</button>}
      <button type="button" className={failed ? 'cta-d' : 'cta'} onClick={onExit}>סיום</button>
    </div>
  );
}

function Settings({ st, update, onClose }: { st: KState; update: Update; onClose: () => void }) {
  const set = (p: Partial<KState['settings']>) => update((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  return (
    <SettingsSheet onClose={onClose} sound={{ on: st.settings.sound, set: (v) => set({ sound: v }) }} onReset={() => update(() => ({ ...initial(), name: st.name, onboarded: true }))}>
      {!USER_NAME && <><label className="field" htmlFor="k2">שם</label><input id="k2" className="input" value={st.name} onChange={(e) => update((s) => ({ ...s, name: e.target.value }))} /></>}
      <Toggle id="k4" label="קישור לוויקיפדיה בסוף שיעור" checked={st.settings.wiki} onChange={(v) => set({ wiki: v })} />
    </SettingsSheet>
  );
}
