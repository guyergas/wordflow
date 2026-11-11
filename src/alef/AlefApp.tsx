import { WordsButton, WordsTrack } from '../littleWords/WordsTrack';
import { SettingsSheet } from '../settingsSheet';
import { greeting, TopBar } from '../topBar';
import { PointerEvent as PE, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pushProgress } from '../progressSync';
import { STORAGE_KEY, USER_NAME } from '../course';
import { playPart, saveHebrewRecordings, sayHebrew, sayInTurn, sfx, stopSound } from '../platform';
import { SummaryTab, TodayPlan } from '../summaryUi';
import { addTime, advance, answer, AState, buildPlan, choices, dayNumber, huntCells, initial, meet, mix, nextLetter, noteMix, pairsOf, PlanOptions, record, secure, shaky, SHAKY_LIMIT, struggling, HARD_LIMIT, Status, statusOf, Step, topMix, validStep, WRITING, OrderQuestion, orderQuestion } from './engine';
import { Ink, judge, FREE, TRACE } from './ink';
import { FAMILIES, frameOf, LETTER, Letter, LETTERS, Pt, SAY, Shape, firstWords, LETTERS as ALL, spots, Stroke, VIEW, WORDS, SONG_ORDER, SONG_TIMES, SONG_URL } from './letters';

type Update = (fn: (s: AState) => AState) => void;
const VB = `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`;
export const pts = (p: Pt[]) => p.map((q) => q.join(',')).join(' ');
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
let memory: string | null = null;

function load(): AState {
  let raw = memory;
  try { raw = localStorage.getItem(STORAGE_KEY) ?? raw; } catch { /* memory only */ }
  if (!raw) return initial(USER_NAME);
  try {
    const p = JSON.parse(raw), b = initial(''), st: AState = { ...b, ...p, name: USER_NAME || p.name, settings: { ...b.settings, ...p.settings } };
    if (st.plan && !st.plan.steps.every(validStep)) st.plan = null;
    // A sitting saved before exercises were mixed: what remains of it is mixed now, so nobody has to finish the old order.
    if (st.plan && !st.plan.mixed) { const done = st.plan.steps.slice(0, st.plan.at), rest = st.plan.steps.slice(st.plan.at), first = rest[0]?.t === 'meet' ? rest.slice(0, 1) : []; st.plan = { ...st.plan, mixed: true, steps: [...done, ...first, ...mix(rest.slice(first.length), Math.random)] }; }
    return st;
  } catch { return initial(USER_NAME); }
}
function save(st: AState) { memory = JSON.stringify(st); try { localStorage.setItem(STORAGE_KEY, memory); } catch { /* memory only */ } }
export function recoverAlef() { save({ ...load(), plan: null }); }

export function useStudyTimer(active: boolean, onSeconds: (sec: number) => void) {
  useEffect(() => {
    if (!active) return;
    const TICK = 5, IDLE = 45000;
    let last = Date.now(), pending = 0;
    const touch = () => { last = Date.now(); };
    const flush = () => { if (pending > 0) { const sec = pending; pending = 0; onSeconds(sec); } };
    window.addEventListener('pointerdown', touch);
    const id = setInterval(() => { if (document.visibilityState === 'visible' && Date.now() - last < IDLE) pending += TICK; if (pending >= 15) flush(); }, TICK * 1000);
    document.addEventListener('visibilitychange', flush);
    return () => { clearInterval(id); flush(); window.removeEventListener('pointerdown', touch); document.removeEventListener('visibilitychange', flush); };
  }, [active, onSeconds]);
}

/** The notebook line every letter stands on, so that small, big and giant look different. */
export const Lines = () => <g className="a-lines"><line x1={VIEW.x} x2={VIEW.x + VIEW.w} y1="0" y2="0" /><line x1={VIEW.x} x2={VIEW.x + VIEW.w} y1="100" y2="100" /></g>;

export function Glyph({ strokes, cls, draw, gap = 1.3, start = 0 }: { strokes: Stroke[]; cls?: string; draw?: boolean; gap?: number; start?: number }) {
  return <>{strokes.map((s, i) => <polyline key={i} points={pts(s.p)} pathLength={draw ? 1 : undefined} className={`a-stroke ${cls ?? ''} ${draw ? 'draw' : ''}`} style={draw ? { animationDelay: `${start + i * gap}s` } : undefined} />)}</>;
}
/** The direction of writing: an arrow along each line, pointing where the finger goes. */
function arrowOf(p: Pt[]) {
  const seg = p.slice(1).map((q, i) => Math.hypot(q[0] - p[i][0], q[1] - p[i][1])), all = seg.reduce((a, b) => a + b, 0);
  const pad = all < 40 ? 0.1 : 0.16, at = (d: number): Pt => { let left = d; for (let i = 0; i < seg.length; i++) { if (left <= seg[i] || i === seg.length - 1) { const f = left / seg[i]; return [p[i][0] + (p[i + 1][0] - p[i][0]) * f, p[i][1] + (p[i + 1][1] - p[i][1]) * f]; } left -= seg[i]; } return p[0]; };
  const from = all * pad, to = all * (1 - pad), line: Pt[] = [at(from)]; let run = 0;
  seg.forEach((len, i) => { run += len; if (run > from && run < to) line.push(p[i + 1]); });
  const end = at(to); line.push(end);
  const [bx, by] = line[line.length - 2], a = Math.atan2(end[1] - by, end[0] - bx), size = 9;
  const wing = (w: number): Pt => [end[0] - size * Math.cos(a + w), end[1] - size * Math.sin(a + w)];
  return { line, head: [wing(0.6), end, wing(-0.6)] };
}
export const Arrows = ({ strokes }: { strokes: Stroke[] }) => <g className="a-arrows">{strokes.map((s, i) => { const { line, head } = arrowOf(s.p); return <g key={i}><polyline points={pts(line)} /><polyline points={pts(head)} /></g>; })}</g>;
const Mini = ({ id, print }: { id: string; print?: boolean }) => print
  ? <svg viewBox={VB} className="a-mini" aria-hidden="true"><Lines /><text x="50" y="100" className="a-print-svg">{id}</text></svg>
  : <svg viewBox={VB} className="a-mini" aria-hidden="true"><Lines /><Glyph strokes={LETTER[id].strokes} /></svg>;

export const Speaker = ({ text }: { text: string }) => <button type="button" className="a-speak" aria-label="לשמוע שוב" onClick={() => sayHebrew(text)}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Z" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></svg></button>;
export const Next = ({ onClick }: { onClick: () => void }) => <button type="button" className="cta a-go" aria-label="ממשיכים" onClick={onClick}><svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" /></svg></button>;

type DrawMode = 'trace' | 'copy' | 'memory' | 'write' | 'opening';

export function AlefApp() {
  const [st, setSt] = useState<AState>(() => load());
  const update: Update = useCallback((fn) => setSt((s) => { const n = fn(s); save(n); return n; }), []);
  const [tab, setTab] = useState<'home' | 'progress'>('home');
  const [inSession, setInSession] = useState(false);
  const [order, setOrder] = useState(false);
  const [words, setWords] = useState(false);
  const [settings, setSettings] = useState(false);
  const today = dayNumber();
  const onSeconds = useCallback((sec: number) => update((s) => addTime(s, dayNumber(), sec)), [update]);
  useStudyTimer(inSession || order, onSeconds);
  useEffect(() => { void saveHebrewRecordings(); }, []);
  // Exercises fit the screen and never scroll, so a tap or a stroke is never taken for a scroll.
  useEffect(() => {
    if (!inSession && !order) return;
    const root = document.documentElement, stop = (e: TouchEvent) => e.preventDefault();
    root.classList.add('a-lock');
    document.addEventListener('touchmove', stop, { passive: false });
    return () => { root.classList.remove('a-lock'); document.removeEventListener('touchmove', stop); };
  }, [inSession, order]);
  const start = (o: PlanOptions = {}) => {
    update((s) => { const open = !!s.plan && !s.plan.extra && s.plan.day === today && s.plan.at < s.plan.steps.length; if (open && !o.bonus && !o.extra && !o.warm && !o.boost && !o.focus) return s; return { ...s, plan: buildPlan(s, today, o) }; });
    setInSession(true);
  };
  if (words) return <WordsTrack lang="he" met={new Set(Object.keys(st.letters))} sound={st.settings.sound} onSeconds={onSeconds} onExit={() => setWords(false)} />;
  if (order) return <OrderPractice sound={st.settings.sound} onExit={() => setOrder(false)} />;
  if (inSession && st.plan) return <Session st={st} update={update} onExit={() => setInSession(false)} onMore={start} />;
  return (
    <div className="app">
      <main className="page">{tab === 'home' ? <Home st={st} today={today} onStart={start} onProgress={() => setTab('progress')} onSettings={() => setSettings(true)} onOrder={() => setOrder(true)} onWords={() => setWords(true)} /> : <Progress st={st} onFocus={(id) => start({ focus: id })} />}</main>
      <nav className="nav" aria-label="ניווט">
        {([['home', 'בית'], ['progress', 'התקדמות']] as const).map(([k, label]) => <button key={k} type="button" className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{label}</button>)}
        <SummaryTab name={st.name} />
      </nav>
      {settings && <Settings st={st} update={update} onClose={() => setSettings(false)} />}
    </div>
  );
}

const Play = () => <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M18 5v14L6 12z" /></svg>;

/** Says plainly what today holds and what each button does. */
function Home({ st, today, onStart, onProgress, onSettings, onOrder, onWords }: { st: AState; today: number; onStart: (o?: PlanOptions) => void; onProgress: () => void; onSettings: () => void; onOrder: () => void; onWords: () => void }) {
  const open = st.plan && !st.plan.extra && st.plan.day === today && st.plan.at < st.plan.steps.length ? st.plan : null;
  const preview = useMemo(() => open ?? buildPlan(st, today, { rnd: () => 0.5 }), [open?.at, st.letters, today]);
  const left = preview.steps.slice(preview.at), fresh = left.find((s) => s.t === 'meet')?.id, firstId = fresh ?? left[0]?.id;
  const more = !!nextLetter(st) && struggling(st).length < HARD_LIMIT, met = Object.keys(st.letters).length, hard = LETTERS.filter((l) => statusOf(st, l.id) === 'hard').length;
  return (
    <>
      <TopBar onSettings={onSettings} />
      <h1 className="greet">{greeting(st.name)}</h1>
      <div className="next-card a-today-card">
        {firstId ? (
          <>
            <div className="a-today-letter"><Mini id={firstId} /></div>
            <div className="a-today-text">
              <span className="chip-d">{open && open.at > 0 ? 'ממשיכים מאיפה שעצרנו' : 'האימון של היום'}</span>
              <h2>{fresh ? `אות חדשה: ${LETTER[fresh].name}` : preview.review ? 'חזרה גדולה על כל האותיות' : 'חזרה על אותיות'}</h2>
              <p>{left.length} תרגילים של זיהוי וכתיבה</p>
            </div>
            <button type="button" className="cta-d a-start" onClick={() => onStart()}><Play /> {open && open.at > 0 ? 'להמשיך' : 'להתחיל'}</button>
          </>
        ) : (
          <>
            <div className="a-today-letter a-done-star" aria-hidden="true">★</div>
            <div className="a-today-text">
              <span className="chip-d">היום הושלם</span>
              <h2>סיימנו להיום, כל הכבוד!</h2>
              <p>{more ? 'אפשר ללמוד עוד אות, או לחזור מחר.' : 'נתרגל את האותיות שלמדנו, ומחר נמשיך.'}</p>
            </div>
            {more && <button type="button" className="cta-d a-start" onClick={() => onStart({ bonus: true })}><Play /> עוד אות</button>}
          </>
        )}
      </div>
      {met > 0 && (
        <div className="a-free" role="group" aria-label="תרגול נוסף">
          <button type="button" onClick={() => onStart({ warm: true })}><span aria-hidden="true">🔥</span><b>חימום</b><small>אותיות שכבר יודעים</small></button>
          <button type="button" onClick={() => onStart({ boost: true })}><span aria-hidden="true">💪</span><b>חיזוק</b><small>{hard > 0 ? `${hard} אותיות קשות` : 'האותיות שפחות בטוחות'}</small></button>
        </div>
      )}
      <OrderButton onOpen={onOrder} />
      <WordsButton lang="he" met={new Set(Object.keys(st.letters))} onOpen={onWords} />
      <TodayPlan />
      <button type="button" className="card a-strip-card" onClick={onProgress}>
        <span className="row-between"><b>הא״ב שלי</b><small className="muted">{met} מתוך {LETTERS.length} ›</small></span>
        <span className="a-strip">{LETTERS.map((l) => <i key={l.id} className={statusOf(st, l.id)}><Mini id={l.id} /></i>)}</span>
      </button>
    </>
  );
}

/** On the home screen: the order of the alef-bet, apart from which letters are being learned to write. */
function OrderButton({ onOpen }: { onOpen: () => void }) {
  return <button type="button" className="card a-song" onClick={onOpen}><span aria-hidden="true">🎵</span><b>סדר האותיות</b><small>מקשיבים לשיר ומגלים מה האות הבאה</small></button>;
}

const ROUNDS = 10;
/** Order practice. It moves no letter on and stands apart from the daily plan. */
function OrderPractice({ sound, onExit }: { sound: boolean; onExit: () => void }) {
  const [round, setRound] = useState(0), [q, setQ] = useState<OrderQuestion>(() => orderQuestion());
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState(false), [playing, setPlaying] = useState<'part' | 'all' | null>(null), [score, setScore] = useState(0);
  const wait = useRef<ReturnType<typeof setTimeout>>(undefined);
  const part = (ask = true) => { clearTimeout(wait.current); setPlaying('part'); playPart(SONG_URL, q.from, q.to, () => { setPlaying(null); if (ask) sayHebrew(SAY.songNext); }); };
  // A new question waits two seconds, with the button lit, so that the first letter is not missed.
  const soon = () => { clearTimeout(wait.current); stopSound(); setPlaying('part'); wait.current = setTimeout(() => part(), 2000); };
  const whole = () => { clearTimeout(wait.current); if (playing === 'all') { stopSound(); setPlaying(null); return; } setPlaying('all'); playPart(SONG_URL, 0, 9999, () => setPlaying(null)); };
  useEffect(() => { if (round < ROUNDS) soon(); else { sfx.win(); sayHebrew(SAY.orderDone); } }, [round]);
  useEffect(() => () => { clearTimeout(wait.current); stopSound(); }, []);
  const tap = (c: string) => {
    if (right) return;
    clearTimeout(wait.current);
    if (c === q.target) {
      setRight(true); if (!wrong.length) setScore((s) => s + 1); if (sound) sfx.good();
      const k = SONG_ORDER.indexOf(c); setPlaying('part'); playPart(SONG_URL, SONG_TIMES[k][0], SONG_TIMES[k][1], () => setPlaying(null));
    } else { setWrong([...wrong, c]); if (sound) sfx.bad(); sayHebrew(SAY.thisIs(LETTER[c])); }
  };
  const next = () => { setQ(orderQuestion(Math.random, q.target)); setWrong([]); setRight(false); setRound(round + 1); };
  const close = <button type="button" className="round" aria-label="יציאה" onClick={onExit}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button>;
  if (round >= ROUNDS) return (
    <div className="session finish a-finish">
      <span className="a-star" aria-hidden="true">★</span>
      <h1>{score} מתוך {ROUNDS} בפעם הראשונה</h1>
      <div className="grow" />
      <button type="button" className="cta a-go" onClick={() => { setScore(0); setQ(orderQuestion()); setWrong([]); setRight(false); setRound(0); }}>עוד סבב</button>
      <button type="button" className="link center-block" onClick={onExit}>סיום</button>
    </div>
  );
  return (
    <div className="session a-session">
      <div className="s-top">{close}<div className="thin" style={{ flex: 1 }}><span style={{ width: `${(round / ROUNDS) * 100}%` }} /></div></div>
      <div className="a-step">
        <div className="a-order-play">
          <button type="button" className={`a-song-ask ${playing === 'part' ? 'on' : ''}`} onClick={() => part()}><span aria-hidden="true">🔁</span><small>לשמוע שוב</small></button>
          <button type="button" className={`a-song-ask ${playing === 'all' ? 'on' : ''}`} onClick={whole}><span aria-hidden="true">{playing === 'all' ? '⏸' : '🎵'}</span><small>{playing === 'all' ? 'לעצור' : 'כל השיר'}</small></button>
        </div>
        <div className="a-order-lead" aria-label="האותיות ששמענו">{q.lead.map((c) => <span key={c}><Mini id={c} /></span>)}<b aria-hidden="true">{right ? <Mini id={q.target} /> : '?'}</b></div>
        <div className={`a-answers a-order-answers n${q.options.length}`}>{q.options.map((c) => <button key={c} type="button" disabled={wrong.includes(c)} className={`a-answer ${right && c === q.target ? 'right' : ''} ${wrong.includes(c) ? 'off' : ''}`} aria-label={LETTER[c].name} onClick={() => tap(c)}><Mini id={c} /></button>)}</div>
        {right ? <Next onClick={next} /> : <div className="a-next-space" />}
      </div>
    </div>
  );
}

/** The whole alef-bet: a letter lights up when met and turns gold when it is known and written over several days. */
function Stars({ st }: { st: AState }) {
  return <div className="a-row" aria-hidden="true">{LETTERS.map((l) => { const k = st.letters[l.id]; return <i key={l.id} className={k ? (secure(k) ? 'gold' : 'met') : ''} />; })}</div>;
}

const STATUS: { key: Status; title: string; note: string }[] = [
  { key: 'hard', title: 'קשה עכשיו', note: 'כדאי לתרגל בחיזוק' },
  { key: 'learning', title: 'בתהליך', note: 'נפגשו, ועוד לא בטוחות' },
  { key: 'known', title: 'נלמדו', note: 'מזהים וכותבים בכמה ימים שונים' },
  { key: 'new', title: 'עוד לא נלמדו', note: 'לפי סדר הלימוד' },
];
const STAGE = ['מעבר על מקווקו', 'כתיבה ליד דוגמה', 'כתיבה מהזיכרון ולבד', 'כתיבה לבד'];
const share = ([ok, bad]: [number, number]) => (ok + bad ? `${ok} מתוך ${ok + bad} נכון` : 'עוד לא תורגל');

/** What was learned, what is hard and why, letter by letter. */
function Progress({ st, onFocus }: { st: AState; onFocus: (id: string) => void }) {
  const [shown, setShown] = useState<string | null>(null);
  const l = shown ? LETTER[shown] : null, k = shown ? st.letters[shown] : undefined;
  const of = (s: Status) => LETTERS.filter((x) => statusOf(st, x.id) === s);
  return (
    <>
      <header className="page-head"><h1>התקדמות</h1></header>
      <section className="a-totals">
        <div><b>{of('known').length}</b><span>נלמדו</span></div>
        <div><b>{of('learning').length}</b><span>בתהליך</span></div>
        <div className={of('hard').length ? 'warn' : ''}><b>{of('hard').length}</b><span>קשות</span></div>
        <div><b>{of('new').length}</b><span>נשארו</span></div>
      </section>
      {STATUS.map((s) => { const list = of(s.key); return list.length > 0 && (
        <section key={s.key} className="a-fam"><h3>{s.title}</h3><p className="small muted">{s.note}</p>
          <div className="a-grid">{list.map((x) => { const mix = st.letters[x.id] ? topMix(st.letters[x.id]) : []; return (
            <button key={x.id} type="button" className={`a-cell ${s.key}`} aria-label={x.name} onClick={() => { setShown(x.id); sayHebrew(x.recipe); }}><Mini id={x.id} />{s.key === 'hard' && mix.length > 0 && <small>עם {mix.join(' ')}</small>}</button>
          ); })}</div>
        </section>
      ); })}
      {l && <div className="sheet-wrap" onClick={() => setShown(null)}><div className="sheet a-show" role="dialog" aria-label={l.name} onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h2>{l.name}</h2><Speaker text={l.recipe} /></div>
        <svg key={l.id} viewBox={VB} className="a-board" aria-hidden="true"><Lines /><Glyph strokes={l.strokes} draw /><Arrows strokes={l.strokes} /></svg>
        {k ? (
          <ul className="a-facts">
            <li><span>זיהוי</span><b>{share(k.tally?.see ?? [0, 0])}</b></li>
            <li><span>כתיבה</span><b>{share(k.tally?.write ?? [0, 0])}</b></li>
            <li><span>שלב הכתיבה</span><b>{STAGE[Math.min(3, k.write.box)]}</b></li>
            {topMix(k).length > 0 && <li><span>מתבלבל עם</span><b>{topMix(k).map((c) => LETTER[c].name).join(', ')}</b></li>}
          </ul>
        ) : <p className="small muted">האות הזאת עוד לא נלמדה.</p>}
        {k && <button type="button" className="cta" onClick={() => onFocus(l.id)}>חזרה ממוקדת על {l.name}</button>}
      </div></div>}
    </>
  );
}

function Settings({ st, update, onClose }: { st: AState; update: Update; onClose: () => void }) {
  return <SettingsSheet onClose={onClose} sound={{ on: st.settings.sound, set: (v) => update((s) => ({ ...s, settings: { ...s.settings, sound: v } })) }} onReset={() => update(() => initial(USER_NAME))} />;
}

function Session({ st, update, onExit, onMore }: { st: AState; update: Update; onExit: () => void; onMore: (o?: PlanOptions) => void }) {
  const plan = st.plan!, step = plan.steps[plan.at];
  if (!step) return <Finish st={st} onExit={onExit} onMore={onMore} />;
  const l = LETTER[step.id], sound = st.settings.sound;
  return (
    <div className="session a-session" key={plan.at}>
      <div className="s-top"><button type="button" className="round" aria-label="יציאה. ההתקדמות נשמרת" onClick={onExit}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button><div className="thin" style={{ flex: 1 }}><span style={{ width: `${(plan.at / plan.steps.length) * 100}%` }} /></div></div>
      {step.t === 'meet' && <Meet l={l} onDone={() => update((s) => advance(meet(s, l.id, plan.day)))} />}
      {WRITING.includes(step.t) && <Draw l={l} mode={step.t as DrawMode} n={step.n} sound={sound} onDone={(ok) => update((s) => { const r = record(s, l.id, 'write', ok); return advance(plan.extra ? r : answer(r, l.id, 'write', ok, plan.day)); })} />}
      {step.t !== 'meet' && !WRITING.includes(step.t) && (() => {
        const onMix = (c: string) => update((s) => noteMix(s, l.id, c));
        const done = (ok: boolean) => update((s) => { const r = record(s, l.id, 'see', ok); return advance(plan.extra ? r : answer(r, l.id, 'see', ok, plan.day)); });
        if (step.t === 'word') return <WordGame st={st} id={l.id} n={step.n} onMix={onMix} sound={sound} onDone={done} />;
        if (step.t === 'missing') return <WordGame st={st} id={l.id} n={step.n} missing onMix={onMix} sound={sound} onDone={done} />;
        if (step.t === 'sound') return <SoundGame st={st} id={l.id} n={step.n} sound={sound} onDone={done} />;
        if (step.t === 'hunt') return <Hunt st={st} id={l.id} onMix={onMix} sound={sound} onDone={done} />;
        if (step.t === 'pair' && pairsOf(st, l.id).length) return <Pair st={st} id={l.id} n={step.n} sound={sound} onDone={done} />;
        return <Find st={st} step={step} onMix={onMix} sound={sound} onDone={done} />;
      })()}
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
      <svg key={run} viewBox={VB} className="a-board" role="img" aria-label={l.name}><Lines /><Glyph strokes={old} /><Glyph strokes={fresh} cls="new" draw start={old.length ? 1 : 0.3} gap={1.4} /><Arrows strokes={l.strokes} /></svg>
      <div className="a-tools"><button type="button" className="a-speak" aria-label="שוב" onClick={() => setRun(run + 1)}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" /></svg></button></div>
      <Next onClick={onDone} />
    </div>
  );
}

function Find({ st, step, onMix, sound, onDone }: { st: AState; step: Step; onMix: (c: string) => void; sound: boolean; onDone: (ok: boolean) => void }) {
  const l = LETTER[step.id], options = useMemo(() => choices(st, l.id), [l.id]);
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState(false);
  const say = SAY.find(l);
  useEffect(() => { sayHebrew(say); }, []);
  const tap = (id: string) => {
    if (right) return;
    if (id === l.id) {
      setRight(true); if (sound) sfx.good();
      sayHebrew(SAY.rightIs(l));
    } else { setWrong([...wrong, id]); onMix(id); if (sound) sfx.bad(); sayHebrew(SAY.thisIs(LETTER[id])); }
  };
  return (
    <div className="a-step">
      <Speaker text={say} />
      <div className={`a-answers n${options.length}`}>{options.map((id) => <button key={id} type="button" disabled={wrong.includes(id)} className={`a-answer ${right && id === l.id ? 'right' : ''} ${wrong.includes(id) ? 'off' : ''}`} aria-label={LETTER[id].name} onClick={() => tap(id)}><Mini id={id} print={step.print} /></button>)}</div>
      {right ? <Next onClick={() => onDone(wrong.length === 0)} /> : <div className="a-next-space" />}
    </div>
  );
}

/** A word with a picture and one enlarged letter: which letter is the big one? Options are in print, like the word. */
function WordGame({ st, id, n, missing, onMix, sound, onDone }: { st: AState; id: string; n?: number; missing?: boolean; onMix: (c: string) => void; sound: boolean; onDone: (ok: boolean) => void }) {
  const pool = missing ? firstWords(id) : WORDS[id], l = LETTER[id], word = pool[(n ?? 0) % pool.length], options = useMemo(() => choices(st, id), [id]);
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState(false);
  const places = spots(word[0], id), place = missing ? places[0] : places[Math.floor((n ?? 0) / pool.length) % places.length], at = place.at, say = SAY.word(word[1], place.where);
  useEffect(() => { sayHebrew(say); }, []);
  const tap = (c: string) => {
    if (right) return;
    if (c === id) { setRight(true); if (sound) sfx.good(); sayHebrew(SAY.rightIs(l)); }
    else { setWrong([...wrong, c]); onMix(c); if (sound) sfx.bad(); sayHebrew(SAY.thisIs(LETTER[c])); }
  };
  return (
    <div className="a-step">
      <button type="button" className="a-word" aria-label="לשמוע שוב" onClick={() => sayHebrew(say)}>
        <span className="a-pic" aria-hidden="true">{word[2]}</span>
        <span className="a-letters" dir="rtl">{word[0].slice(0, at)}<b className={right ? 'yes' : ''}>{missing && !right ? '?' : id}</b>{word[0].slice(at + 1)}</span>
      </button>
      <div className={`a-answers small n${options.length}`}>{options.map((c) => <button key={c} type="button" disabled={wrong.includes(c)} className={`a-answer ${right && c === id ? 'right' : ''} ${wrong.includes(c) ? 'off' : ''}`} aria-label={LETTER[c].name} onClick={() => tap(c)}><Mini id={c} print /></button>)}</div>
      {right ? <Next onClick={() => onDone(wrong.length === 0)} /> : <div className="a-next-space" />}
    </div>
  );
}

/** Hear a letter, choose the picture whose word opens with it. This joins the shape to its sound, which is what reading needs. */
function SoundGame({ st, id, n, sound, onDone }: { st: AState; id: string; n?: number; sound: boolean; onDone: (ok: boolean) => void }) {
  const l = LETTER[id], say = SAY.sound(l);
  const options = useMemo(() => {
    const own = firstWords(id), right = own[(n ?? 0) % own.length];
    const pool = ALL.filter((x) => x.id !== id).flatMap((x) => firstWords(x.id)).filter((w) => w[2] !== right[2] && w[0][0] !== id);
    const known = pool.filter((w) => st.letters[w[0][0]]);
    const pickFrom = [...known.sort(() => Math.random() - 0.5), ...pool.sort(() => Math.random() - 0.5)], others: typeof pool = [];
    for (const w of pickFrom) if (others.length < 2 && !others.some((o) => o[2] === w[2] || o[0][0] === w[0][0])) others.push(w);
    return [right, ...others].sort(() => Math.random() - 0.5);
  }, [id, n]);
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState(false);
  // The question names every picture, since a child cannot read the words yet.
  const ask = () => sayInTurn([{ text: say, lang: 'he' }, ...options.map((w) => ({ text: SAY.heard(w[1]), lang: 'he' as const }))]);
  useEffect(() => { ask(); }, []);
  const tap = (w: string[]) => {
    if (right) return;
    if (w[0][0] === id) { setRight(true); if (sound) sfx.good(); sayHebrew(SAY.rightWord(w[1])); }
    else { setWrong([...wrong, w[0]]); if (sound) sfx.bad(); sayHebrew(SAY.heard(w[1])); }
  };
  return (
    <div className="a-step">
      <button type="button" className="a-speak" aria-label="לשמוע שוב" onClick={ask}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Z" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></svg></button>
      <div className="a-answers n1">{options.map((w) => <button key={w[0]} type="button" disabled={wrong.includes(w[0])} className={`a-answer a-picture ${right && w[0][0] === id ? 'right' : ''} ${wrong.includes(w[0]) ? 'off' : ''}`} aria-label={w[0]} onClick={() => tap(w)}>{w[2]}</button>)}</div>
      {right ? <Next onClick={() => onDone(wrong.length === 0)} /> : <div className="a-next-space" />}
    </div>
  );
}

/** Many letters on the screen: find every one of this letter. */
function Hunt({ st, id, onMix, sound, onDone }: { st: AState; id: string; onMix: (c: string) => void; sound: boolean; onDone: (ok: boolean) => void }) {
  const l = LETTER[id], cells = useMemo(() => huntCells(st, id), [id]), say = SAY.hunt(l);
  const [found, setFound] = useState<number[]>([]), [misses, setMisses] = useState<number[]>([]);
  const all = found.length === cells.filter((c) => c === id).length;
  useEffect(() => { sayHebrew(say); }, []);
  const tap = (c: string, i: number) => {
    if (all || found.includes(i)) return;
    if (c === id) { const next = [...found, i]; setFound(next); if (sound) sfx.good(); if (next.length === 5) sayHebrew(SAY.rightIs(l)); else sayHebrew(l.say); }
    else { if (!misses.includes(i)) { setMisses([...misses, i]); onMix(c); } if (sound) sfx.bad(); sayHebrew(SAY.thisIs(LETTER[c])); }
  };
  return (
    <div className="a-step">
      <Speaker text={say} />
      <div className="a-hunt">{cells.map((c, i) => <button key={i} type="button" className={`a-answer ${found.includes(i) ? 'right' : ''} ${misses.includes(i) ? 'off' : ''}`} aria-label={LETTER[c].name} onClick={() => tap(c, i)}><Mini id={c} /></button>)}</div>
      {all ? <Next onClick={() => onDone(misses.length <= 1)} /> : <div className="a-next-space" />}
    </div>
  );
}

/** Two look-alikes and a question about what tells them apart. */
function Pair({ st, id, n, sound, onDone }: { st: AState; id: string; n?: number; sound: boolean; onDone: (ok: boolean) => void }) {
  const list = pairsOf(st, id), [answer_, other, question] = list[(n ?? 0) % list.length];
  const order = useMemo(() => (Math.random() < 0.5 ? [answer_, other] : [other, answer_]), [answer_, other]);
  const [wrong, setWrong] = useState(false), [right, setRight] = useState(false);
  useEffect(() => { sayHebrew(question); }, []);
  const tap = (c: string) => {
    if (right) return;
    if (c === answer_) { setRight(true); if (sound) sfx.good(); sayHebrew(SAY.rightIs(LETTER[c])); }
    else { setWrong(true); if (sound) sfx.bad(); sayHebrew(SAY.thisIs(LETTER[c])); }
  };
  return (
    <div className="a-step">
      <Speaker text={question} />
      <div className="a-answers n1">{order.map((c) => <button key={c} type="button" disabled={wrong && c !== answer_} className={`a-answer ${right && c === answer_ ? 'right' : ''} ${wrong && c !== answer_ ? 'off' : ''}`} aria-label={LETTER[c].name} onClick={() => tap(c)}><Mini id={c} /></button>)}</div>
      {right ? <Next onClick={() => onDone(!wrong)} /> : <div className="a-next-space" />}
    </div>
  );
}

function Draw({ l, mode, n, sound, onDone }: { l: Letter; mode: DrawMode; n?: number; sound: boolean; onDone: (ok: boolean) => void }) {
  const words = firstWords(l.id), heard = words.length ? words[(n ?? 0) % words.length] : null;
  const said = mode === 'trace' ? SAY.trace(l) : mode === 'copy' ? SAY.copy(l) : mode === 'memory' ? SAY.memory(l) : mode === 'opening' && heard ? SAY.opening(heard[1]) : SAY.write(l);
  return <WritePad shape={l} name={l.name} mode={mode === 'opening' ? 'write' : mode} said={said} praise={pick(SAY.right)} answer={SAY.thisIs(l)} again={SAY.again} rivals={LETTERS} sound={sound} onDone={onDone} side={mode === 'opening' && heard ? <button type="button" className="a-model a-opening" aria-label="לשמוע שוב" onClick={() => sayHebrew(said)}>{heard[2]}</button> : undefined} />;
}

/** Writing with a finger between two lines: over a dashed shape, then beside a model, then alone. No button to finish: the app sees when it is done. */
export function WritePad({ shape, name, mode, said, praise, answer: told, again, rivals, side, talk = sayHebrew, sound, onDone }: { shape: Shape; name: string; mode: 'trace' | 'copy' | 'memory' | 'write'; said: string; praise: string; answer: string; again: string; rivals: Shape[]; side?: React.ReactNode; talk?: (text: string) => void; sound: boolean; onDone: (ok: boolean) => void }) {
  const guide = mode === 'trace', rules = guide ? TRACE : FREE, strokes = shape.strokes;
  const [ink, setInk] = useState<Ink>([]), [help, setHelp] = useState<number[] | null>(null), [won, setWon] = useState(false), [result, setResult] = useState(false), frame = frameOf(shape);
  const svg = useRef<SVGSVGElement>(null), down = useRef(false), tries = useRef(0), wait = useRef<ReturnType<typeof setTimeout>>(undefined), latest = useRef<Ink>([]);
  const [showing, setShowing] = useState(mode === 'memory');
  useEffect(() => { if (!showing) return; const id = setTimeout(() => setShowing(false), 2500); return () => clearTimeout(id); }, [showing]);
  latest.current = ink;
  useEffect(() => { talk(said); return () => clearTimeout(wait.current); }, []);
  const at = (e: PE): Pt | null => {
    const m = svg.current?.getScreenCTM(); if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10];
  };
  const win = (ok: boolean) => { setWon(true); setResult(ok); if (sound) (ok ? sfx.good : sfx.tap)(); talk(ok ? praise : told); };
  const giveUp = () => {
    const v = judge(latest.current, shape, rules, rivals);
    if (v.ok) { win(true); return; }
    tries.current++;
    setInk([]);
    if (tries.current >= (guide ? 3 : 2)) { setHelp(strokes.map((_, i) => i)); win(guide); return; }
    if (sound) sfx.bad();
    talk(again); setHelp(v.missing.length ? v.missing : strokes.map((_, i) => i));
  };
  const start = (e: PE) => { if (won) return; const p = at(e); if (!p) return; clearTimeout(wait.current); setShowing(false); (e.target as Element).setPointerCapture?.(e.pointerId); down.current = true; setHelp(null); setInk((k) => [...k, [p]]); };
  const move = (e: PE) => { if (!down.current) return; const p = at(e); if (p) setInk((k) => { const c = [...k]; c[c.length - 1] = [...c[c.length - 1], p]; return c; }); };
  // Lifting a finger may only be a pause, so a good result is accepted soon and a poor one is given time.
  const end = () => {
    if (!down.current) return;
    down.current = false;
    wait.current = setTimeout(() => {
      if (judge(latest.current, shape, rules, rivals).ok) win(true);
      else wait.current = setTimeout(giveUp, 5000);
    }, guide ? 800 : 1500);
  };
  return (
    <div className="a-step">
      <div className={`a-desk ${mode === 'copy' ? 'two' : ''}`}>
        {mode === 'copy' && <svg viewBox={frame} className="a-model" role="img" aria-label={`דוגמה: ${name}`}><Lines /><Glyph strokes={strokes} /><Arrows strokes={strokes} /></svg>}
        {side}
        <svg ref={svg} viewBox={frame} className="a-board a-pad" role="img" aria-label={`כתיבת ${name}`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          <Lines />
          {guide && <Glyph strokes={strokes} cls="dash" />}
          {showing && <Glyph strokes={strokes} />}
          {guide && !won && <Arrows strokes={strokes} />}
          {guide && !ink.length && strokes.map((s, i) => <g key={i}><circle cx={s.p[0][0]} cy={s.p[0][1]} r="6" className="a-dot" /><text x={s.p[0][0]} y={s.p[0][1] + 3} className="a-num">{i + 1}</text></g>)}
          {help && <Glyph strokes={strokes.filter((_, i) => help.includes(i))} cls="new" draw gap={1} />}
          {ink.map((k, i) => <polyline key={i} points={pts(k)} className={`a-stroke ink ${won ? 'gold' : ''}`} />)}
        </svg>
      </div>
      {won ? <Next onClick={() => onDone(result)} /> : (
        <div className="a-tools">
          <button type="button" className="a-speak" aria-label="לשמוע שוב" onClick={() => talk(said)}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Z" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></svg></button>
          <button type="button" className="a-speak" aria-label="למחוק" onClick={() => { clearTimeout(wait.current); setInk([]); }}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M8 20h12M4 14l9-10 7 6-9 10H8z" /></svg></button>
        </div>
      )}
    </div>
  );
}

function Finish({ st, onExit }: { st: AState; onExit: () => void; onMore: (o?: PlanOptions) => void }) {
  // A finished practice is a whole point: the progress goes to the person's other devices.
  useEffect(() => { pushProgress(); }, []);
  useEffect(() => { sfx.win(); sayHebrew(SAY.finish); }, []);
  const day = st.plan!.day, today = Object.keys(st.letters).filter((id) => st.letters[id].met === day);
  return (
    <div className="session finish a-finish">
      <span className="a-star" aria-hidden="true">★</span>
      <h1>כל הכבוד{st.name ? `, ${st.name}` : ''}!</h1>
      {today.length > 0 && <div className="a-today">{today.map((id) => <Mini key={id} id={id} />)}</div>}
      <Stars st={st} />
      <div className="grow" />
      <button type="button" className="cta a-go" aria-label="סיום" onClick={onExit}><svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" d="m5 13 5 5L20 7" /></svg></button>
    </div>
  );
}
