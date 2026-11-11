import { greeting, TopBar } from '../topBar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { pushProgress } from '../progressSync';
import { Arrows, Glyph, Lines, Next, Speaker, useStudyTimer, WritePad } from '../alef/AlefApp';
import { frameOf } from '../alef/letters';
import { STORAGE_KEY, USER_NAME } from '../course';
import { saveHebrewRecordings, sayHebrew, sfx } from '../platform';
import { CourseSwitch, SummaryTab, TodayPlan } from '../summaryUi';
import { addTime, advance, answer, buildPlan, dayNumber, initial, makeTask, meet, nextSkill, noteMiss, PlanOptions, record, secure, shaky, SHAKY_LIMIT, Status, statusOf, Step, Task, topMisses, TState, validStep, WRITING } from './engine';
import { ALL_DIGITS, DIGITS, SAY, Skill, SKILL, SKILLS, STAGES, WORD } from './numbers';

type Update = (fn: (s: TState) => TState) => void;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const THINGS = ['🍎', '🐟', '⭐', '🚗', '🐶', '🍌', '🎈', '🌸', '🐥', '⚽', '🍓', '🐝'];
let memory: string | null = null;

function load(): TState {
  let raw = memory;
  try { raw = localStorage.getItem(STORAGE_KEY) ?? raw; } catch { /* memory only */ }
  if (!raw) return initial(USER_NAME);
  try {
    const p = JSON.parse(raw), b = initial(''), st: TState = { ...b, ...p, name: USER_NAME || p.name, settings: { ...b.settings, ...p.settings } };
    if (st.plan && !st.plan.steps.every(validStep)) st.plan = null;
    return st;
  } catch { return initial(USER_NAME); }
}
function save(st: TState) { memory = JSON.stringify(st); try { localStorage.setItem(STORAGE_KEY, memory); } catch { /* memory only */ } }
export function recoverTots() { save({ ...load(), plan: null }); }

/** Objects in rows of five, the way a child learns to see a number without counting one by one. */
function Objects({ n, thing, gone = 0, grow, animate }: { n: number; thing: string; gone?: number; grow?: boolean; animate?: boolean }) {
  if (n === 0) return <div className="t-empty" aria-label="אין כלום" />;
  return <div className={`t-objects ${n > 5 ? 'two' : ''} ${grow ? 'grow' : ''}`} dir="ltr" aria-label={String(n)}>{Array.from({ length: n }, (_, i) => <span key={i} className={`${i >= n - gone ? 'gone' : ''} ${animate ? 'pop-in' : ''}`} style={animate ? { animationDelay: `${i * 0.85}s` } : undefined}>{thing}</span>)}</div>;
}
const Digit = ({ n }: { n: number }) => <span className="t-digit" dir="ltr">{n}</span>;
function DigitArt({ n, draw, arrows }: { n: number; draw?: boolean; arrows?: boolean }) {
  const d = DIGITS[n];
  return <svg viewBox={frameOf(d)} className="a-mini" aria-hidden="true"><Lines /><Glyph strokes={d.strokes} draw={draw} />{arrows && <Arrows strokes={d.strokes} />}</svg>;
}

export function TotsApp() {
  const [st, setSt] = useState<TState>(() => load());
  const update: Update = useCallback((fn) => setSt((s) => { const n = fn(s); save(n); return n; }), []);
  const [tab, setTab] = useState<'home' | 'progress'>('home');
  const [inSession, setInSession] = useState(false);
  const [settings, setSettings] = useState(false);
  const today = dayNumber();
  const onSeconds = useCallback((sec: number) => update((s) => addTime(s, dayNumber(), sec)), [update]);
  useStudyTimer(inSession, onSeconds);
  useEffect(() => { void saveHebrewRecordings(); }, []);
  // Exercises fit the screen and never scroll, so a tap or a stroke is never taken for a scroll.
  useEffect(() => {
    if (!inSession) return;
    const root = document.documentElement, stop = (e: TouchEvent) => e.preventDefault();
    root.classList.add('a-lock');
    document.addEventListener('touchmove', stop, { passive: false });
    return () => { root.classList.remove('a-lock'); document.removeEventListener('touchmove', stop); };
  }, [inSession]);
  const start = (o: PlanOptions = {}) => {
    update((s) => { const open = !!s.plan && !s.plan.extra && s.plan.day === today && s.plan.at < s.plan.steps.length; return open && !o.bonus && !o.warm && !o.boost && !o.focus ? s : { ...s, plan: buildPlan(s, today, o) }; });
    setInSession(true);
  };
  if (inSession && st.plan) return <Session st={st} update={update} onExit={() => setInSession(false)} />;
  return (
    <div className="app">
      <main className="page">{tab === 'home' ? <Home st={st} today={today} onStart={start} onProgress={() => setTab('progress')} onSettings={() => setSettings(true)} /> : <Progress st={st} onFocus={(id) => start({ focus: id })} />}</main>
      <nav className="nav" aria-label="ניווט">
        {([['home', 'בית'], ['progress', 'התקדמות']] as const).map(([k, label]) => <button key={k} type="button" className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{label}</button>)}
        <SummaryTab name={st.name} />
      </nav>
      {settings && <Settings st={st} update={update} onClose={() => setSettings(false)} />}
    </div>
  );
}

const Play = () => <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M18 5v14L6 12z" /></svg>;
const Face = ({ s }: { s: Skill }) => (s.kind === 'num' ? <DigitArt n={s.n} /> : <span className="t-label" dir="ltr">{s.label}</span>);

function Home({ st, today, onStart, onProgress, onSettings }: { st: TState; today: number; onStart: (o?: PlanOptions) => void; onProgress: () => void; onSettings: () => void }) {
  const open = st.plan && !st.plan.extra && st.plan.day === today && st.plan.at < st.plan.steps.length ? st.plan : null;
  const preview = useMemo(() => open ?? buildPlan(st, today, { rnd: () => 0.5 }), [open?.at, st.skills, today]);
  const left = preview.steps.slice(preview.at), fresh = left.find((s) => s.t === 'meet')?.id, first = fresh ?? left[0]?.id;
  const more = !!nextSkill(st) && shaky(st).length < SHAKY_LIMIT, met = Object.keys(st.skills).length, hard = SKILLS.filter((s) => statusOf(st, s.id) === 'hard').length;
  return (
    <>
      <TopBar onSettings={onSettings} />
      <h1 className="greet">{greeting(st.name)}</h1>
      <div className="next-card a-today-card">
        {first ? (
          <>
            <div className="a-today-letter t-face"><Face s={SKILL[first]} /></div>
            <div className="a-today-text">
              <span className="chip-d">{open && open.at > 0 ? 'ממשיכים מאיפה שעצרנו' : 'האימון של היום'}</span>
              <h2>{fresh ? `חדש: ${SKILL[fresh].title}` : 'חזרה על מה שלמדנו'}</h2>
              <p>{left.length} תרגילים</p>
            </div>
            <button type="button" className="cta-d a-start" onClick={() => onStart()}><Play /> {open && open.at > 0 ? 'להמשיך' : 'להתחיל'}</button>
          </>
        ) : (
          <>
            <div className="a-today-letter a-done-star" aria-hidden="true">★</div>
            <div className="a-today-text">
              <span className="chip-d">היום הושלם</span>
              <h2>סיימנו להיום, כל הכבוד!</h2>
              <p>{more ? 'אפשר ללמוד עוד משהו, או לחזור מחר.' : 'נתרגל את מה שלמדנו, ומחר נמשיך.'}</p>
            </div>
            {more && <button type="button" className="cta-d a-start" onClick={() => onStart({ bonus: true })}><Play /> עוד משהו חדש</button>}
          </>
        )}
      </div>
      {met > 0 && (
        <div className="a-free" role="group" aria-label="תרגול נוסף">
          <button type="button" onClick={() => onStart({ warm: true })}><span aria-hidden="true">🔥</span><b>חימום</b><small>מה שכבר יודעים</small></button>
          <button type="button" onClick={() => onStart({ boost: true })}><span aria-hidden="true">💪</span><b>חיזוק</b><small>{hard > 0 ? `${hard} דברים קשים` : 'מה שפחות בטוח'}</small></button>
        </div>
      )}
      <TodayPlan />
      <button type="button" className="card a-strip-card" onClick={onProgress}>
        <span className="row-between"><b>המסע שלי</b><small className="muted">{met} מתוך {SKILLS.length} ›</small></span>
        <span className="t-strip">{SKILLS.map((s) => <i key={s.id} className={statusOf(st, s.id)} dir="ltr">{s.label}</i>)}</span>
      </button>
    </>
  );
}

const STATUS: { key: Status; title: string; note: string }[] = [
  { key: 'hard', title: 'קשה עכשיו', note: 'כדאי לתרגל בחיזוק' },
  { key: 'learning', title: 'בתהליך', note: 'התחלנו, ועוד לא בטוח' },
  { key: 'known', title: 'נלמדו', note: 'יודעים היטב, בכמה ימים שונים' },
  { key: 'new', title: 'עוד לא נלמדו', note: 'לפי סדר הלימוד' },
];
const WRITE_STAGE = ['מעבר על מקווקו', 'כתיבה ליד דוגמה', 'מהזיכרון ולבד', 'כתיבה לבד'];
const share = ([ok, bad]: [number, number]) => (ok + bad ? `${ok} מתוך ${ok + bad} נכון` : 'עוד לא תורגל');

function Progress({ st, onFocus }: { st: TState; onFocus: (id: string) => void }) {
  const [shown, setShown] = useState<string | null>(null);
  const s = shown ? SKILL[shown] : null, k = shown ? st.skills[shown] : undefined;
  const of = (x: Status) => SKILLS.filter((v) => statusOf(st, v.id) === x);
  return (
    <>
      <header className="page-head"><h1>התקדמות</h1></header>
      <section className="a-totals">
        <div><b>{of('known').length}</b><span>נלמדו</span></div>
        <div><b>{of('learning').length}</b><span>בתהליך</span></div>
        <div className={of('hard').length ? 'warn' : ''}><b>{of('hard').length}</b><span>קשים</span></div>
        <div><b>{of('new').length}</b><span>נשארו</span></div>
      </section>
      {STATUS.map((x) => { const list = of(x.key); return list.length > 0 && (
        <section key={x.key} className="a-fam"><h3>{x.title}</h3><p className="small muted">{x.note}</p>
          <ul className="t-list">{list.map((v) => <li key={v.id}><button type="button" className={`t-row ${x.key}`} onClick={() => setShown(v.id)}><span className="t-row-face" dir="ltr">{v.label}</span><span className="t-row-text"><b>{v.title}</b><small>{STAGES[v.stage]}{x.key === 'hard' && st.skills[v.id] && topMisses(st.skills[v.id]).length > 0 ? ' · טעויות: ' : ''}{x.key === 'hard' && st.skills[v.id] && <bdi dir="ltr">{topMisses(st.skills[v.id]).join(', ')}</bdi>}</small></span></button></li>)}</ul>
        </section>
      ); })}
      {s && <div className="sheet-wrap" onClick={() => setShown(null)}><div className="sheet a-show" role="dialog" aria-label={s.title} onClick={(e) => e.stopPropagation()}>
        <h2>{s.title}</h2>
        {s.kind === 'num' && <div className="a-board t-show"><DigitArt key={s.id} n={s.n} draw arrows /></div>}
        {k ? (
          <ul className="a-facts">
            <li><span>תרגילים</span><b>{share(k.tally?.see ?? [0, 0])}</b></li>
            {s.kind === 'num' && <li><span>כתיבה</span><b>{share(k.tally?.write ?? [0, 0])}</b></li>}
            {s.kind === 'num' && <li><span>שלב הכתיבה</span><b>{WRITE_STAGE[Math.min(3, k.write.box)]}</b></li>}
            {topMisses(k).length > 0 && <li><span>טעויות נפוצות</span><b dir="ltr">{topMisses(k).join(', ')}</b></li>}
          </ul>
        ) : <p className="small muted">עוד לא למדנו את זה.</p>}
        {k && <button type="button" className="cta" onClick={() => onFocus(s.id)}>חזרה ממוקדת על {s.kind === 'num' ? <bdi dir="ltr">{s.n}</bdi> : s.title}</button>}
      </div></div>}
    </>
  );
}

function Settings({ st, update, onClose }: { st: TState; update: Update; onClose: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="הגדרות" onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h2>הגדרות</h2><button type="button" className="round" aria-label="סגירה" onClick={onClose}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button></div>
        <div className="set-row"><label htmlFor="t1">צלילי משחק</label><input id="t1" type="checkbox" checked={st.settings.sound} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, sound: e.target.checked } }))} /></div>
        <div className="danger">
          {!confirm ? <button type="button" className="link" onClick={() => setConfirm(true)}>איפוס ההתקדמות</button> : <><p className="small">למחוק את ההתקדמות בקורס? אי אפשר לבטל את זה.</p><div className="row-between"><button type="button" className="link" onClick={() => setConfirm(false)}>ביטול</button><button type="button" className="link" onClick={() => { update(() => initial(USER_NAME)); setConfirm(false); onClose(); }}>למחוק</button></div></>}
        </div>
      </div>
    </div>
  );
}

function Session({ st, update, onExit }: { st: TState; update: Update; onExit: () => void }) {
  const plan = st.plan!, step = plan.steps[plan.at];
  if (!step) return <Finish st={st} onExit={onExit} />;
  const s = SKILL[step.id], sound = st.settings.sound;
  const done = (what: 'see' | 'write') => (ok: boolean) => update((c) => { const r = record(c, s.id, what, ok); return advance(plan.extra ? r : answer(r, s.id, what, ok, plan.day)); });
  return (
    <div className="session a-session" key={plan.at}>
      <div className="s-top"><button type="button" className="round" aria-label="יציאה. ההתקדמות נשמרת" onClick={onExit}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button><div className="thin" style={{ flex: 1 }}><span style={{ width: `${(plan.at / plan.steps.length) * 100}%` }} /></div></div>
      {step.t === 'meet' ? <Meet s={s} onDone={() => update((c) => advance(meet(c, s.id, plan.day)))} />
        : WRITING.includes(step.t) ? <Write n={s.n} mode={step.t as 'trace' | 'copy' | 'memory' | 'write'} sound={sound} onDone={done('write')} />
          : step.t === 'make' ? <Make n={s.n} sound={sound} onDone={done('see')} />
            : <Quiz st={st} step={step} sound={sound} onMiss={(what) => update((c) => noteMiss(c, s.id, what))} onDone={done('see')} />}
    </div>
  );
}

function Write({ n, mode, sound, onDone }: { n: number; mode: 'trace' | 'copy' | 'memory' | 'write'; sound: boolean; onDone: (ok: boolean) => void }) {
  return <WritePad shape={DIGITS[n]} name={String(n)} mode={mode} said={SAY[mode](n)} praise={SAY.isRight(n)} answer={SAY.thisIs(n)} again={SAY.again} rivals={ALL_DIGITS} sound={sound} onDone={onDone} />;
}

/** A new number: things appear one by one while the voice counts, and then its digit draws itself. A new skill is shown and told. */
function Meet({ s, onDone }: { s: Skill; onDone: () => void }) {
  const thing = useMemo(() => pick(THINGS), []), [run, setRun] = useState(0), say = s.teach ?? SAY.meet(s.n);
  useEffect(() => { sayHebrew(say); }, [run]);
  return (
    <div className="a-step" key={run}>
      {s.kind === 'num' && <div className="t-stage"><Objects n={s.n} thing={thing} animate grow /></div>}
      {s.kind === 'num' && <div className="a-board t-meet-digit"><DigitArt n={s.n} draw arrows /></div>}
      {s.kind === 'add' && <div className="t-stage"><SumArt a={s.n === 3 ? 2 : 2} b={1} op="+" thing={thing} /></div>}
      {s.kind === 'sub' && <div className="t-stage"><SumArt a={3} b={1} op="−" thing={thing} /></div>}
      {s.kind === 'seq' && <div className="t-stage t-line" dir="ltr">{Array.from({ length: Math.min(s.n, 10) }, (_, i) => <span key={i} className="pop-in" style={{ animationDelay: `${i * 0.5}s` }}>{s.n === 20 ? 11 + i : i + 1}</span>)}</div>}
      {s.kind === 'more' && <div className="t-stage t-two"><Objects n={4} thing={thing} /><Objects n={2} thing={thing} /></div>}
      {s.kind === 'bond' && <div className="t-stage"><Frame size={s.n} filled={Math.ceil(s.n / 2)} /></div>}
      <div className="a-tools"><button type="button" className="a-speak" aria-label="שוב" onClick={() => setRun(run + 1)}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" /></svg></button></div>
      <Next onClick={onDone} />
    </div>
  );
}

function SumArt({ a, b, op, thing, pictures = true }: { a: number; b: number; op: '+' | '−'; thing: string; pictures?: boolean }) {
  if (!pictures) return <div className="t-eq" dir="ltr"><span>{a}</span><i>{op}</i><span>{b}</span><i>=</i><b>?</b></div>;
  if (op === '−') return <div className="t-sum one" dir="ltr"><Objects n={a} thing={thing} gone={b} grow /><div className="t-eq small"><span>{a}</span><i>−</i><span>{b}</span><i>=</i><b>?</b></div></div>;
  return <div className="t-sum" dir="ltr"><div className={`t-groups ${a + b <= 5 ? "few" : ""}`}><Objects n={a} thing={thing} /><i>+</i><Objects n={b} thing={thing} /></div><div className="t-eq small"><span>{a}</span><i>+</i><span>{b}</span><i>=</i><b>?</b></div></div>;
}
const Frame = ({ size, filled }: { size: number; filled: number }) => <div className={`t-frame s${size}`} dir="ltr">{Array.from({ length: size }, (_, i) => <i key={i} className={i < filled ? 'on' : ''} />)}</div>;

function Quiz({ st, step, sound, onMiss, onDone }: { st: TState; step: Step; sound: boolean; onMiss: (what: string) => void; onDone: (ok: boolean) => void }) {
  const task: Task = useMemo(() => makeTask(st, step), [step.t, step.id, step.n]), thing = useMemo(() => pick(THINGS), []);
  const [wrong, setWrong] = useState<number[]>([]), [right, setRight] = useState(false), [hint, setHint] = useState(false);
  useEffect(() => { sayHebrew(task.say); }, []);
  const tap = (v: number) => {
    if (right) return;
    if (v === task.answer) { setRight(true); if (sound) sfx.good(); sayHebrew(task.rightSay); }
    else { setWrong([...wrong, v]); onMiss(task.missLabel(v)); if (sound) sfx.bad(); sayHebrew(SAY.notThis(v)); }
  };
  return (
    <div className="a-step">
      <div className={`t-ask ${task.visual === 'none' || task.visual === 'groups' ? 'bare' : ''}`}>
        <Speaker text={task.say} />
        {task.visual === 'objects' && <div className="t-stage"><Objects n={task.a!} thing={thing} grow /></div>}
        {task.visual === 'digit' && <div className="t-stage"><Digit n={task.a!} /></div>}
        {task.visual === 'line' && <div className="t-stage t-line" dir="ltr">{task.line!.map((v, i) => (v === null ? <b key={i}>{right ? task.answer : '?'}</b> : <span key={i}>{v}</span>))}</div>}
        {task.visual === 'frame' && <div className="t-stage"><Frame size={task.size!} filled={right ? task.size! : task.filled!} /></div>}
        {task.visual === 'sum' && <div className="t-stage"><SumArt a={task.a!} b={task.b!} op={task.op!} thing={thing} pictures={task.pictures || hint} /></div>}
        {task.visual === 'sum' && !task.pictures && !hint && !right && <button type="button" className="t-hint" aria-label="רמז: להראות בתמונות" onClick={() => setHint(true)}>💡</button>}
      </div>
      <div className={`t-options n${task.options.length} ${task.groups ? 'groups' : ''} ${task.visual === 'none' ? 'tall' : ''}`} dir="ltr">
        {task.options.map((v) => <button key={v} type="button" disabled={wrong.includes(v)} className={`a-answer ${right && v === task.answer ? 'right' : ''} ${wrong.includes(v) ? 'off' : ''}`} aria-label={String(v)} onClick={() => tap(v)}>{task.groups ? <Objects n={v} thing={thing} grow /> : <Digit n={v} />}</button>)}
      </div>
      {right ? <Next onClick={() => onDone(wrong.length === 0)} /> : <div className="a-next-space" />}
    </div>
  );
}

/** Tap things one by one while the voice counts, until the number is reached. */
function Make({ n, sound, onDone }: { n: number; sound: boolean; onDone: (ok: boolean) => void }) {
  const thing = useMemo(() => pick(THINGS), []), total = Math.min(n + 3, 13), say = SAY.make(n);
  const [on, setOn] = useState<number[]>([]);
  useEffect(() => { sayHebrew(say); }, []);
  const tap = (i: number) => {
    if (on.includes(i) || on.length >= n) return;
    const next = [...on, i];
    setOn(next);
    if (sound) sfx.tap();
    sayHebrew(next.length === n ? SAY.isRight(n) : WORD[next.length]);
  };
  return (
    <div className="a-step">
      <div className="t-ask"><Speaker text={say} /><Digit n={n} /></div>
      <div className="t-make">{Array.from({ length: total }, (_, i) => <button key={i} type="button" className={on.includes(i) ? 'on' : ''} aria-label={`דבר ${i + 1}`} onClick={() => tap(i)}>{thing}{on.includes(i) && <small>{on.indexOf(i) + 1}</small>}</button>)}</div>
      {on.length === n ? <Next onClick={() => onDone(true)} /> : <div className="a-next-space" />}
    </div>
  );
}

function Finish({ st, onExit }: { st: TState; onExit: () => void }) {
  // A finished practice is a whole point: the progress goes to the person's other devices.
  useEffect(() => { pushProgress(); }, []);
  useEffect(() => { sfx.win(); sayHebrew(SAY.finish); }, []);
  const day = st.plan!.day, today = Object.keys(st.skills).filter((id) => st.skills[id].met === day);
  return (
    <div className="session finish a-finish">
      <span className="a-star" aria-hidden="true">★</span>
      <h1>כל הכבוד{st.name ? `, ${st.name}` : ''}!</h1>
      {today.length > 0 && <div className="a-today">{today.map((id) => <div key={id} className="t-face"><Face s={SKILL[id]} /></div>)}</div>}
      <p className="muted center">{Object.values(st.skills).length} מתוך {SKILLS.length} במסע, {SKILLS.filter((s) => st.skills[s.id] && secure(s, st.skills[s.id])).length} כבר בטוחים</p>
      <div className="grow" />
      <button type="button" className="cta a-go" aria-label="סיום" onClick={onExit}><svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" d="m5 13 5 5L20 7" /></svg></button>
    </div>
  );
}
