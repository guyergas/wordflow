import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COURSE_INFO, STORAGE_KEY, USER_NAME, userKey } from '../course';
import { shortParagraphs } from './kit';
import { sfx } from '../platform';
import { readCourses } from '../summary';
import { CourseSwitch, SummaryTab, TodayPlan } from '../summaryUi';
import { addTime, advance, answerKey, buildPlan, dayLog, dayNumber, finishLesson, finishReview, initial, keyOf, KState, LESSON, lessonsOf, nextLesson, pickQs, recallCount, statusOf, Step } from './engine';
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
  if (!st.onboarded) return <Hello st={st} update={update} />;
  if (inSession && st.plan) return <Session st={st} update={update} onExit={() => setInSession(false)} onMore={start} />;
  return (
    <div className="app">
      <main className="page">
        {tab === 'home' ? <Home st={st} today={today} onStart={start} onSettings={() => setSettings(true)} /> : <Path st={st} />}
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
  const [name, setName] = useState(() => st.name || USER_NAME || readCourses().find((c) => c.name)?.name || '');
  return (
    <div className="onb">
      <Mark />
      <h1>{COURSE_INFO.name}</h1>
      <p className="lead">{COURSE_INFO.note}. בכל שיעור קוראים קטע קצר ועונים על כמה שאלות. לא צריך לזכור כל פרט, אלא להבין את הרעיון.</p>
      <label className="field" htmlFor="kn">איך לקרוא לך?</label>
      <input id="kn" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      <button type="button" className="cta" disabled={!name.trim()} onClick={() => update((s) => ({ ...s, name: name.trim(), onboarded: true }))}>מתחילות</button>
    </div>
  );
}

function Home({ st, today, onStart, onSettings }: { st: KState; today: number; onStart: (o?: { bonus?: boolean; extra?: boolean }) => void; onSettings: () => void }) {
  const open = st.plan && st.plan.day === today && st.plan.at < st.plan.steps.length && !st.plan.extra ? st.plan : null;
  const preview = useMemo(() => open ?? buildPlan(st, today, { rnd: () => 0.5 }), [open?.at, st.lessons, st.keys, today]);
  const all = lessonsOf(), done = all.filter((l) => st.lessons[l.id]).length, log = dayLog(st, today), next = nextLesson(st);
  const fresh = preview.steps.filter((x) => x.t === 'lesson').length, keys = preview.steps.filter((x) => x.t === 'key').length;
  const firstLesson = preview.steps.find((x) => x.t === 'lesson'), review = preview.steps.some((x) => x.t === 'review'), recall = preview.steps.some((x) => x.t === 'recall');
  return (
    <>
      <header className="top"><Mark /><CourseSwitch /><button type="button" className="round" aria-label="הגדרות" onClick={onSettings}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="8" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="2" /></svg></button></header>
      <h1 className="greet">{COURSE_INFO.name}</h1>
      <div className="next-card">
        {preview.steps.length === 0 || (log.done && !open) ? (
          <>
            <span className="chip-d">{next ? 'היום הושלם' : 'הכול נלמד'}</span>
            <h2>{next ? 'סיימת להיום' : 'סיימת את כל השיעורים שיש כרגע'}</h2>
            <p>{next ? 'הנושא הבא מחכה לך באימון של מחר.' : 'שיעורים חדשים ייתווספו בהמשך.'}</p>
            {Object.keys(st.keys).length > 0 && <button type="button" className="cta-d" onClick={() => onStart({ extra: true })}>חזרה קצרה</button>}
          </>
        ) : (
          <>
            <span className="chip-d">{open && open.at > 0 ? 'ממשיכות מאיפה שעצרת' : 'האימון של היום'}</span>
            <h2>{review ? 'שיעור חזרה' : firstLesson && firstLesson.t === 'lesson' ? LESSON[firstLesson.id].title : 'חזרה קצרה על מה שלמדת'}</h2>
            <p>{review ? 'בלי נושא חדש היום: כל השאלות של חמשת השיעורים האחרונים.' : [recall ? 'מה זוכרים מהשיעור הקודם' : '', fresh > 0 ? 'נושא אחד' : '', keys > 0 ? `${keys} שאלות חזרה` : ''].filter(Boolean).join(', ')}</p>
            <button type="button" className="cta-d" onClick={() => onStart()}>{open && open.at > 0 ? 'להמשיך' : 'להתחיל'}</button>
          </>
        )}
      </div>
      <section className="two-meters solo" aria-label="סיכום"><div><b>{done}</b><span>שיעורים שלמדת מתוך {all.length}</span></div></section>
      <TodayPlan />
    </>
  );
}

function Path({ st }: { st: KState }) {
  return (
    <>
      <header className="page-head"><h1>המסע</h1><p className="muted">{COURSE_INFO.name}, משיעורי הבסיס ועד הקפיצה.</p></header>
      {[0, 1, 2].map((lv) => { const list = lessonsOf().filter((l) => l.level === lv); return list.length > 0 && (
        <section key={lv} className="station"><div className="st-head"><span className="st-num">{lv + 1}</span><span className="st-txt"><b>{LEVEL[lv]}</b></span></div>
          {list.map((l) => <div key={l.id} className="m-skill"><span>{l.title}</span><small>{statusOf(st, l)}</small></div>)}
        </section>
      ); })}
    </>
  );
}

function Session({ st, update, onExit, onMore }: { st: KState; update: Update; onExit: () => void; onMore: (o?: { bonus?: boolean; extra?: boolean }) => void }) {
  const plan = st.plan!, step = plan.steps[plan.at];
  if (!step) return <Finish st={st} onExit={onExit} />;
  return (
    <div className="session" key={plan.at}>
      <div className="s-top"><button type="button" className="round" aria-label="יציאה. ההתקדמות נשמרת" onClick={onExit}><CloseIcon /></button><div className="thin" style={{ flex: 1 }}><span style={{ width: `${(plan.at / plan.steps.length) * 100}%` }} /></div></div>
      {step.t === 'recall' || step.t === 'review'
        ? <Recall step={step} seed={plan.day * 7 + plan.at} sound={st.settings.sound} onDone={(ok, all) => update((s) => advance(finishReview(s, step, ok, all, plan.day)))} />
        : step.t === 'key'
        ? <Quiz q={keyOf(step.id)} sound={st.settings.sound} onAnswer={(ok) => update((s) => answerKey(s, step.id, ok, plan.day))} onNext={() => update(advance)} label="חזרה" />
        : <LessonView lesson={LESSON[step.id]} wiki={st.settings.wiki} sound={st.settings.sound} onDone={(ok, all) => update((s) => advance(finishLesson(s, step.id, ok, all, plan.day)))} />}
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
      {picked && <div className={`feedback ${picked === right ? 'good k-why' : 'soft'}`} role="status"><b>{picked === right ? 'נכון!' : 'לא הפעם.'}</b>{why && <span>{why}</span>}<button type="button" className="btn-next" onClick={onNext}>ממשיכות</button></div>}
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
function Recall({ step, seed, sound, onDone }: { step: Extract<Step, { t: 'recall' | 'review' }>; seed: number; sound: boolean; onDone: (ok: number, all: number) => void }) {
  const items = useMemo(() => (step.t === 'recall' ? pickQs(step.id, recallCount(step.id), seed) : step.ids.flatMap((id) => LESSON[id].qs.map((_, i): [string, number] => [id, i]))), [step, seed]);
  const [i, setI] = useState(0), [reread, setReread] = useState(false), score = useRef(0);
  const [id, qi] = items[i], lesson = LESSON[id];
  const label = step.t === 'recall' ? `מה זוכרים מ"${lesson.title}"` : `שיעור חזרה · ${lesson.title}`;
  return (
    <div className="k-wrap" key={i}>
      <Quiz q={lesson.qs[qi]} sound={sound} label={`${label} · ${i + 1}/${items.length}`} onAnswer={(ok) => { if (ok) score.current++; }}
        onNext={() => { setReread(false); if (i + 1 < items.length) setI(i + 1); else onDone(score.current, items.length); }}
        onWrong={() => setReread(true)}
        tools={<><button type="button" className="link center-block" aria-expanded={reread} onClick={() => setReread(!reread)}>{reread ? 'להסתיר את הקטע' : 'להציץ בקטע'}</button>{reread && <Text lesson={lesson} />}</>} />
    </div>
  );
}

function LessonView({ lesson, wiki, sound, onDone }: { lesson: Lesson; wiki: boolean; sound: boolean; onDone: (ok: number, all: number) => void }) {
  type Stage = 'read' | 'q' | 'end';
  const [stage, setStage] = useState<Stage>('read');
  const [i, setI] = useState(0);
  const score = useRef(0);
  const [reread, setReread] = useState(false);
  // Key sentences are in yellow on the first reading only. Back from a question, she looks for the answer herself.
  if (stage === 'read') return <div className="q"><span className="m-chip-hi center">{LEVEL[lesson.level]}</span><h1 className="k-title">{lesson.title}</h1>{lesson.text.includes('[[') && <p className="small muted center">במרקר הצהוב: המשפטים החשובים בקטע</p>}<Text lesson={lesson} marks /><div className="grow" /><button type="button" className="cta" onClick={() => setStage('q')}>קראתי</button></div>;
  if (stage === 'q') return (
    <div className="k-wrap" key={i}>
      <Quiz q={lesson.qs[i]} sound={sound} label={`שאלה ${i + 1} מתוך ${lesson.qs.length}`} onAnswer={(ok) => { if (ok) score.current++; }} onNext={() => { setReread(false); if (i + 1 < lesson.qs.length) setI(i + 1); else setStage('end'); }}
        onWrong={() => setReread(true)}
        tools={<><button type="button" className="link center-block" aria-expanded={reread} onClick={() => setReread(!reread)}>{reread ? 'להסתיר את הקטע' : 'לראות שוב את הקטע'}</button>{reread && <Text lesson={lesson} />}</>} />
    </div>
  );
  return (
    <div className="q">
      <span className="m-chip-hi center">מה לקחת מכאן</span>
      <p className="k-idea">{lesson.idea}</p>
      <section className="card"><h3>שלושה דברים לזכור</h3><ul className="k-sum">{summaryOf(lesson).map((x) => <li key={x}>{x}</li>)}</ul></section>
      {wiki && <a className="link center-block" href={`https://he.wikipedia.org/wiki/${encodeURIComponent(lesson.wiki.replace(/ /g, '_'))}`} target="_blank" rel="noreferrer">רוצה לדעת עוד? בוויקיפדיה</a>}
      <ReportProblem lesson={lesson} />
      <div className="grow" />
      <button type="button" className="cta" onClick={() => onDone(score.current, lesson.qs.length)}>סיימתי</button>
    </div>
  );
}

function Finish({ st, onExit }: { st: KState; onExit: () => void }) {
  const log = dayLog(st, st.plan!.day);
  return (
    <div className="session finish">
      <span className="stage">סיימת</span>
      <h1>כל הכבוד{st.name ? `, ${st.name}` : ''}!</h1>
      <section className="two-meters solo"><div><b>{log.fresh}</b><span>נושאים חדשים היום</span></div></section>
      <div className="grow" />
      <button type="button" className="cta" onClick={onExit}>סיום</button>
    </div>
  );
}

function Settings({ st, update, onClose }: { st: KState; update: Update; onClose: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const set = (p: Partial<KState['settings']>) => update((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="הגדרות" onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h2>הגדרות</h2><button type="button" className="round" aria-label="סגירה" onClick={onClose}><CloseIcon /></button></div>
        <div className="set-row"><span>מה לומדים</span><CourseSwitch /></div>
        <label className="field" htmlFor="k2">שם</label>
        <input id="k2" className="input" value={st.name} onChange={(e) => update((s) => ({ ...s, name: e.target.value }))} />
        <div className="set-row"><label htmlFor="k3">צלילי משחק</label><input id="k3" type="checkbox" checked={st.settings.sound} onChange={(e) => set({ sound: e.target.checked })} /></div>
        <div className="set-row"><label htmlFor="k4">קישור לוויקיפדיה בסוף שיעור</label><input id="k4" type="checkbox" checked={st.settings.wiki} onChange={(e) => set({ wiki: e.target.checked })} /></div>
        <div className="danger">
          {!confirm ? <button type="button" className="link" onClick={() => setConfirm(true)}>איפוס ההתקדמות בקורס</button> : <><p className="small">למחוק את ההתקדמות בקורס הזה? אי אפשר לבטל את זה.</p><div className="btns"><button type="button" className="btn" onClick={() => setConfirm(false)}>ביטול</button><button type="button" className="btn del" onClick={() => { update(() => ({ ...initial(), name: st.name, onboarded: true })); onClose(); }}>מחיקה</button></div></>}
        </div>
      </div>
    </div>
  );
}
