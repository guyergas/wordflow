import { PointerEvent as PE, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COURSE_ID, COURSE_INFO, COURSES, STORAGE_KEY, switchCourse } from '../course';
import { saveHebrewRecordings, sayHebrew, sfx } from '../platform';
import { CourseSwitch, SummaryTab } from '../summaryUi';
import { addTime, advance, answer, AState, buildPlan, choices, dayNumber, initial, meet, nextLetter, secure, shaky, SHAKY_LIMIT, Step, validStep } from './engine';
import { Ink, judge, FREE, TRACE } from './ink';
import { FAMILIES, KIND_SAY, LETTER, Letter, LETTERS, Pt, SAY, Stroke, VIEW, WORDS } from './letters';

type Update = (fn: (s: AState) => AState) => void;
const KID = (COURSE_INFO.short ?? '').replace('א״ב ', '');
const VB = `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`;
const pts = (p: Pt[]) => p.map((q) => q.join(',')).join(' ');
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
let memory: string | null = null;

function load(): AState {
  let raw = memory;
  try { raw = localStorage.getItem(STORAGE_KEY) ?? raw; } catch { /* memory only */ }
  if (!raw) return initial(KID);
  try {
    const p = JSON.parse(raw), b = initial(KID), st: AState = { ...b, ...p, settings: { ...b.settings, ...p.settings } };
    if (st.plan && !st.plan.steps.every(validStep)) st.plan = null;
    return st;
  } catch { return initial(KID); }
}
function save(st: AState) { memory = JSON.stringify(st); try { localStorage.setItem(STORAGE_KEY, memory); } catch { /* memory only */ } }
export function recoverAlef() { save({ ...load(), plan: null }); }

function useTimer(active: boolean, update: Update) {
  useEffect(() => {
    if (!active) return;
    const TICK = 5, IDLE = 45000;
    let last = Date.now(), pending = 0;
    const touch = () => { last = Date.now(); };
    const flush = () => { if (pending > 0) { const sec = pending; pending = 0; update((s) => addTime(s, dayNumber(), sec)); } };
    window.addEventListener('pointerdown', touch);
    const id = setInterval(() => { if (document.visibilityState === 'visible' && Date.now() - last < IDLE) pending += TICK; if (pending >= 15) flush(); }, TICK * 1000);
    document.addEventListener('visibilitychange', flush);
    return () => { clearInterval(id); flush(); window.removeEventListener('pointerdown', touch); document.removeEventListener('visibilitychange', flush); };
  }, [active, update]);
}

/** The notebook line every letter stands on, so that small, big and giant look different. */
const Lines = () => <g className="a-lines"><line x1={VIEW.x} x2={VIEW.x + VIEW.w} y1="0" y2="0" /><line x1={VIEW.x} x2={VIEW.x + VIEW.w} y1="100" y2="100" /></g>;

function Glyph({ strokes, cls, draw, gap = 0.75, start = 0 }: { strokes: Stroke[]; cls?: string; draw?: boolean; gap?: number; start?: number }) {
  return <>{strokes.map((s, i) => <polyline key={i} points={pts(s.p)} pathLength={draw ? 1 : undefined} className={`a-stroke ${cls ?? ''} ${draw ? 'draw' : ''}`} style={draw ? { animationDelay: `${start + i * gap}s` } : undefined} />)}</>;
}
const Mini = ({ id, print }: { id: string; print?: boolean }) => print
  ? <span className="a-print" aria-hidden="true">{id}</span>
  : <svg viewBox={VB} className="a-mini" aria-hidden="true"><Lines /><Glyph strokes={LETTER[id].strokes} /></svg>;

const Speaker = ({ text }: { text: string }) => <button type="button" className="a-speak" aria-label="לשמוע שוב" onClick={() => sayHebrew(text)}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Z" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></svg></button>;
const Next = ({ onClick }: { onClick: () => void }) => <button type="button" className="cta a-go" aria-label="ממשיכים" onClick={onClick}><svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" /></svg></button>;

export function AlefApp() {
  const [st, setSt] = useState<AState>(() => load());
  const update: Update = useCallback((fn) => setSt((s) => { const n = fn(s); save(n); return n; }), []);
  const [parents, setParents] = useState(false);
  const [inSession, setInSession] = useState(false);
  const today = dayNumber();
  useTimer(inSession, update);
  useEffect(() => { void saveHebrewRecordings(); }, []);
  const start = (o: { bonus?: boolean; extra?: boolean } = {}) => {
    update((s) => { const open = !!s.plan && s.plan.day === today && s.plan.at < s.plan.steps.length; return open && !o.bonus && !o.extra ? s : { ...s, plan: buildPlan(s, today, o) }; });
    setInSession(true);
  };
  if (inSession && st.plan) return <Session st={st} update={update} onExit={() => setInSession(false)} onMore={start} />;
  if (parents) return <Parents st={st} update={update} onClose={() => setParents(false)} />;
  return <Home st={st} today={today} onStart={start} onParents={() => setParents(true)} />;
}

const Play = () => <svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true"><path fill="currentColor" d="M18 5v14L6 12z" /></svg>;

/** The child's whole screen: who is learning, and one big button. Everything else is behind the small button for parents. */
function Home({ st, today, onStart, onParents }: { st: AState; today: number; onStart: (o?: { bonus?: boolean; extra?: boolean }) => void; onParents: () => void }) {
  const kids = COURSES.filter((c) => c.alef);
  const open = st.plan && st.plan.day === today && st.plan.at < st.plan.steps.length ? st.plan : null;
  const preview = useMemo(() => open ?? buildPlan(st, today, { rnd: () => 0.5 }), [open?.at, st.letters, today]);
  const shown = preview.steps.find((s) => s.t === 'meet')?.id ?? preview.steps[preview.at]?.id;
  const more = !!nextLetter(st) && shaky(st).length < SHAKY_LIMIT;
  return (
    <div className="a-home">
      <div className="a-kids" role="group" aria-label="מי לומד">{kids.map((c) => <button key={c.id} type="button" aria-pressed={c.id === COURSE_ID} onClick={() => { if (c.id !== COURSE_ID) switchCourse(c.id); }}>{(c.short ?? '').replace('א״ב ', '')}</button>)}</div>
      {shown ? (
        <button type="button" className="a-hero" aria-label="להתחיל" onClick={() => onStart()}>
          <svg viewBox={VB} aria-hidden="true"><Lines /><Glyph strokes={LETTER[shown].strokes} draw /></svg>
          <span className="a-play"><Play /></span>
        </button>
      ) : (
        <button type="button" className="a-hero done" aria-label="עוד" onClick={() => onStart(more ? { bonus: true } : { extra: true })}>
          <span className="a-star" aria-hidden="true">★</span>
          <span className="a-play"><Play /></span>
        </button>
      )}
      <Stars st={st} />
      <button type="button" className="a-parents" onClick={onParents}>להורים</button>
    </div>
  );
}

/** The whole alef-bet: a letter lights up when met and turns gold when it is known and written over several days. */
function Stars({ st }: { st: AState }) {
  return <div className="a-row" aria-hidden="true">{LETTERS.map((l) => { const k = st.letters[l.id]; return <i key={l.id} className={k ? (secure(k) ? 'gold' : 'met') : ''} />; })}</div>;
}

function Parents({ st, update, onClose }: { st: AState; update: Update; onClose: () => void }) {
  const [shown, setShown] = useState<string | null>(null), [confirm, setConfirm] = useState(false);
  const l = shown ? LETTER[shown] : null, met = Object.keys(st.letters).length, stage = ['מעבר על מקווקו', 'כתיבה ליד דוגמה', 'כתיבה לבד', 'כתיבה לבד'];
  return (
    <div className="app"><main className="page a-parents-page">
      <header className="row-between"><h1>{st.name}</h1><button type="button" className="round" aria-label="חזרה" onClick={onClose}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button></header>
      <p className="muted">{met} אותיות מתוך {LETTERS.length}, ומהן {Object.values(st.letters).filter(secure).length} בטוחות: מזהים אותן וכותבים לבד, בכמה ימים שונים. כל יום אות חדשה אחת, ואות חדשה מחכה כשיש {SHAKY_LIMIT} שעוד לא בטוחות.</p>
      <div className="a-parent-tools"><SummaryTab name={st.name} /></div>
      {FAMILIES.map((f, i) => (
        <section key={f} className="a-fam"><h3>{f}</h3>
          <div className="a-grid">{LETTERS.filter((x) => x.family === i).map((x) => { const k = st.letters[x.id]; return <button key={x.id} type="button" className={`a-cell ${k ? (secure(k) ? 'gold' : 'met') : 'locked'}`} aria-label={x.name} onClick={() => { setShown(x.id); sayHebrew(x.recipe); }}><Mini id={x.id} /></button>; })}</div>
        </section>
      ))}
      <div className="set-row"><span>מה לומדים</span><CourseSwitch /></div>
      <div className="set-row"><label htmlFor="a1">צלילי משחק</label><input id="a1" type="checkbox" checked={st.settings.sound} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, sound: e.target.checked } }))} /></div>
      <div className="danger">
        {!confirm ? <button type="button" className="link" onClick={() => setConfirm(true)}>איפוס ההתקדמות של {st.name}</button> : <><p className="small">למחוק את ההתקדמות של {st.name}? אי אפשר לבטל את זה.</p><div className="row-between"><button type="button" className="link" onClick={() => setConfirm(false)}>ביטול</button><button type="button" className="link" onClick={() => { update(() => initial(KID)); setConfirm(false); onClose(); }}>למחוק</button></div></>}
      </div>
      {l && <div className="sheet-wrap" onClick={() => setShown(null)}><div className="sheet a-show" role="dialog" aria-label={l.name} onClick={(e) => e.stopPropagation()}>
        <svg key={l.id} viewBox={VB} className="a-board" aria-hidden="true"><Lines /><Glyph strokes={l.strokes} draw /></svg>
        <div className="row-between"><b>{l.name}</b><Speaker text={l.recipe} /></div>
        {st.letters[l.id] && <p className="small muted">שלב הכתיבה: {stage[Math.min(3, st.letters[l.id].write.box)]}</p>}
      </div></div>}
    </main></div>
  );
}

function Session({ st, update, onExit, onMore }: { st: AState; update: Update; onExit: () => void; onMore: (o?: { bonus?: boolean; extra?: boolean }) => void }) {
  const plan = st.plan!, step = plan.steps[plan.at];
  const next = () => update(advance);
  if (!step) return <Finish st={st} onExit={onExit} onMore={onMore} />;
  const l = LETTER[step.id], sound = st.settings.sound;
  return (
    <div className="session a-session" key={plan.at}>
      <div className="s-top"><button type="button" className="round" aria-label="יציאה. ההתקדמות נשמרת" onClick={onExit}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button><div className="thin" style={{ flex: 1 }}><span style={{ width: `${(plan.at / plan.steps.length) * 100}%` }} /></div></div>
      {step.t === 'meet' && <Meet l={l} onDone={() => update((s) => advance(meet(s, l.id, plan.day)))} />}
      {step.t === 'build' && <Build l={l} sound={sound} onDone={next} />}
      {(step.t === 'trace' || step.t === 'copy' || step.t === 'write') && <Draw l={l} mode={step.t} sound={sound} onDone={(ok) => update((s) => advance(answer(s, l.id, 'write', ok, plan.day)))} />}
      {step.t === 'word' && <WordGame st={st} id={l.id} sound={sound} onDone={(ok) => update((s) => advance(answer(s, l.id, 'see', ok, plan.day)))} />}
      {step.t === 'find' && <Find st={st} step={step} sound={sound} onDone={(ok) => update((s) => advance(answer(s, l.id, 'see', ok, plan.day)))} />}
    </div>
  );
}

/** First the known letter, then the new part draws itself in color while the voice explains. */
function Meet({ l, onDone }: { l: Letter; onDone: () => void }) {
  const old = l.strokes.slice(0, l.strokes.length - l.fresh), fresh = l.strokes.slice(l.strokes.length - l.fresh);
  const [run, setRun] = useState(0);
  useEffect(() => { sayHebrew(l.recipe); }, [run]);
  return (
    <div className="a-step">
      <svg key={run} viewBox={VB} className="a-board" role="img" aria-label={l.name}><Lines /><Glyph strokes={old} /><Glyph strokes={fresh} cls="new" draw start={old.length ? 0.5 : 0.1} gap={0.9} /></svg>
      <div className="a-tools"><button type="button" className="a-speak" aria-label="שוב" onClick={() => setRun(run + 1)}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" /></svg></button></div>
      <Next onClick={onDone} />
    </div>
  );
}

const scaled = (s: Stroke, f: number): Pt[] => {
  const cx = s.p.reduce((a, q) => a + q[0], 0) / s.p.length, cy = s.p.reduce((a, q) => a + q[1], 0) / s.p.length;
  return s.p.map(([x, y]): Pt => [(x - cx) * f, (y - cy) * f]);
};
const SIZES: Record<Stroke['k'], number[]> = { chup: [1, 2.6, 4.2], small: [1, 2.1, 3.4], big: [1, 0.42, 1.55], giant: [1, 0.3, 0.62], slant: [1, 0.45, 1.4], round: [1, 0.45, 0.7] };

/** Choosing the pieces: small line, big line, giant line, and the letter grows. */
function Build({ l, sound, onDone }: { l: Letter; sound: boolean; onDone: () => void }) {
  const [at, setAt] = useState(0), [wrong, setWrong] = useState<number | null>(null);
  const stroke = l.strokes[at];
  const options = useMemo(() => (stroke ? SIZES[stroke.k].map((f, i) => ({ f, i, k: Math.random() })).sort((a, b) => a.k - b.k) : []), [at]);
  useEffect(() => { sayHebrew(SAY.build(l)); }, []);
  const tap = (i: number) => {
    if (i !== 0) { setWrong(i); if (sound) sfx.bad(); sayHebrew(SAY.notThis); return; }
    setWrong(null); if (sound) sfx.good();
    if (at + 1 >= l.strokes.length) sayHebrew(SAY.thisIs(l)); else sayHebrew(KIND_SAY[stroke.k]);
    setAt(at + 1);
  };
  return (
    <div className="a-step">
      <svg viewBox={VB} className="a-board" role="img" aria-label={l.name}><Lines /><Glyph strokes={l.strokes} cls="ghost" /><Glyph strokes={l.strokes.slice(0, at)} />{stroke && <polyline points={pts(stroke.p)} className="a-stroke next" />}</svg>
      {stroke ? (
        <div className="a-pieces">{options.map(({ f, i }) => <button key={`${at}-${i}`} type="button" className={`a-piece ${wrong === i ? 'shake' : ''}`} aria-label={i === 0 ? 'החלק הנכון' : 'חלק אחר'} onClick={() => tap(i)}><svg viewBox="-85 -85 170 170" aria-hidden="true"><polyline points={pts(scaled(stroke, f))} className="a-stroke" /></svg></button>)}</div>
      ) : <Next onClick={onDone} />}
    </div>
  );
}

function Find({ st, step, sound, onDone }: { st: AState; step: Step; sound: boolean; onDone: (ok: boolean) => void }) {
  const l = LETTER[step.id], options = useMemo(() => choices(st, l.id), [l.id]);
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState(false);
  const say = SAY.find(l);
  useEffect(() => { sayHebrew(say); }, []);
  const tap = (id: string) => {
    if (right) return;
    if (id === l.id) {
      setRight(true); if (sound) sfx.good();
      sayHebrew(wrong.length ? SAY.thisIs(l) : pick(SAY.right));
      setTimeout(() => onDone(wrong.length === 0), 1300);
    } else { setWrong([...wrong, id]); if (sound) sfx.bad(); sayHebrew(SAY.notThis); }
  };
  return (
    <div className="a-step">
      <Speaker text={say} />
      <div className={`a-answers n${options.length}`}>{options.map((id) => <button key={id} type="button" disabled={wrong.includes(id)} className={`a-answer ${right && id === l.id ? 'right' : ''} ${wrong.includes(id) ? 'off' : ''}`} aria-label={LETTER[id].name} onClick={() => tap(id)}><Mini id={id} print={step.print} /></button>)}</div>
    </div>
  );
}

/** A word with a picture and one enlarged letter: which letter is the big one? Options are in print, like the word. */
function WordGame({ st, id, sound, onDone }: { st: AState; id: string; sound: boolean; onDone: (ok: boolean) => void }) {
  const l = LETTER[id], word = useMemo(() => pick(WORDS[id]), [id]), options = useMemo(() => choices(st, id), [id]);
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState(false);
  const say = SAY.word(word[1]), at = word[0].indexOf(id);
  useEffect(() => { sayHebrew(say); }, []);
  const tap = (c: string) => {
    if (right) return;
    if (c === id) { setRight(true); if (sound) sfx.good(); sayHebrew(wrong.length ? SAY.thisIs(l) : pick(SAY.right)); setTimeout(() => onDone(wrong.length === 0), 1400); }
    else { setWrong([...wrong, c]); if (sound) sfx.bad(); sayHebrew(SAY.notThis); }
  };
  return (
    <div className="a-step">
      <button type="button" className="a-word" aria-label="לשמוע שוב" onClick={() => sayHebrew(say)}>
        <span className="a-pic" aria-hidden="true">{word[2]}</span>
        <span className="a-letters" dir="rtl">{word[0].slice(0, at)}<b className={right ? 'yes' : ''}>{id}</b>{word[0].slice(at + 1)}</span>
      </button>
      <div className={`a-answers small n${options.length}`}>{options.map((c) => <button key={c} type="button" disabled={wrong.includes(c)} className={`a-answer ${right && c === id ? 'right' : ''} ${wrong.includes(c) ? 'off' : ''}`} aria-label={LETTER[c].name} onClick={() => tap(c)}><Mini id={c} print /></button>)}</div>
    </div>
  );
}

/** Writing with a finger between two lines: over a dashed letter, then beside a model, then alone. No button to finish: the app sees when the letter is done. */
function Draw({ l, mode, sound, onDone }: { l: Letter; mode: 'trace' | 'copy' | 'write'; sound: boolean; onDone: (ok: boolean) => void }) {
  const guide = mode === 'trace', rules = guide ? TRACE : FREE;
  const [ink, setInk] = useState<Ink>([]), [help, setHelp] = useState<number[] | null>(null), [won, setWon] = useState(false);
  const svg = useRef<SVGSVGElement>(null), down = useRef(false), tries = useRef(0), wait = useRef<ReturnType<typeof setTimeout>>(undefined), latest = useRef<Ink>([]);
  const said = guide ? SAY.trace : mode === 'copy' ? SAY.copy(l) : SAY.write(l);
  latest.current = ink;
  useEffect(() => { sayHebrew(said); return () => clearTimeout(wait.current); }, []);
  const at = (e: PE): Pt | null => {
    const m = svg.current?.getScreenCTM(); if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10];
  };
  const win = (ok: boolean) => { setWon(true); if (sound) (ok ? sfx.win : sfx.tap)(); sayHebrew(ok ? pick(SAY.right) : SAY.thisIs(l)); setTimeout(() => onDone(ok), 1600); };
  const giveUp = () => {
    const v = judge(latest.current, l, rules);
    if (v.ok) { win(true); return; }
    tries.current++;
    setInk([]);
    if (tries.current >= (guide ? 3 : 2)) { setHelp(l.strokes.map((_, i) => i)); win(guide); return; }
    if (sound) sfx.bad();
    sayHebrew(SAY.again); setHelp(v.missing.length ? v.missing : l.strokes.map((_, i) => i));
  };
  const start = (e: PE) => { if (won) return; const p = at(e); if (!p) return; clearTimeout(wait.current); (e.target as Element).setPointerCapture?.(e.pointerId); down.current = true; setHelp(null); setInk((k) => [...k, [p]]); };
  const move = (e: PE) => { if (!down.current) return; const p = at(e); if (p) setInk((k) => { const c = [...k]; c[c.length - 1] = [...c[c.length - 1], p]; return c; }); };
  // Lifting a finger may only be a pause in the letter, so a good letter is accepted soon and a poor one is given time.
  const end = () => {
    if (!down.current) return;
    down.current = false;
    wait.current = setTimeout(() => {
      if (judge(latest.current, l, rules).ok) win(true);
      else wait.current = setTimeout(giveUp, 3200);
    }, guide ? 250 : 900);
  };
  return (
    <div className="a-step">
      <div className={`a-desk ${mode === 'copy' ? 'two' : ''}`}>
        {mode === 'copy' && <svg viewBox={VB} className="a-model" role="img" aria-label={`דוגמה: ${l.name}`}><Lines /><Glyph strokes={l.strokes} /></svg>}
        <svg ref={svg} viewBox={VB} className="a-board a-pad" role="img" aria-label={`כתיבת ${l.name}`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          <Lines />
          {guide && <Glyph strokes={l.strokes} cls="dash" />}
          {guide && !ink.length && l.strokes.map((s, i) => <g key={i}><circle cx={s.p[0][0]} cy={s.p[0][1]} r="6" className="a-dot" /><text x={s.p[0][0]} y={s.p[0][1] + 3} className="a-num">{i + 1}</text></g>)}
          {help && <Glyph strokes={l.strokes.filter((_, i) => help.includes(i))} cls="new" draw gap={0.5} />}
          {ink.map((k, i) => <polyline key={i} points={pts(k)} className={`a-stroke ink ${won ? 'gold' : ''}`} />)}
        </svg>
      </div>
      <div className="a-tools">
        <Speaker text={said} />
        <button type="button" className="a-speak" aria-label="למחוק" disabled={won} onClick={() => { clearTimeout(wait.current); setInk([]); }}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M8 20h12M4 14l9-10 7 6-9 10H8z" /></svg></button>
      </div>
    </div>
  );
}

function Finish({ st, onExit }: { st: AState; onExit: () => void; onMore: (o?: { bonus?: boolean; extra?: boolean }) => void }) {
  useEffect(() => { sfx.win(); sayHebrew(SAY.finish); }, []);
  const day = st.plan!.day, today = Object.keys(st.letters).filter((id) => st.letters[id].met === day);
  return (
    <div className="session finish a-finish">
      <span className="a-star" aria-hidden="true">★</span>
      <h1>{st.name}!</h1>
      {today.length > 0 && <div className="a-today">{today.map((id) => <Mini key={id} id={id} />)}</div>}
      <Stars st={st} />
      <div className="grow" />
      <button type="button" className="cta a-go" aria-label="סיום" onClick={onExit}><svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" d="m5 13 5 5L20 7" /></svg></button>
    </div>
  );
}
