import { greeting, TopBar } from '../topBar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Arrows, Glyph, Lines, Next, useStudyTimer, WritePad } from '../alef/AlefApp';
import { frameOf } from '../alef/letters';
import { STORAGE_KEY, USER_NAME } from '../course';
import { saveHebrewRecordings, sayInTurn, sfx } from '../platform';
import { CourseSwitch, SummaryTab } from '../summaryUi';
import { addTime, advance, answer, buildPlan, choices, dayNumber, EState, huntCells, initial, meet, nextLetter, noteMiss, pairsOf, pictureChoices, PlanOptions, secure, shaky, SHAKY_LIMIT, Status, statusOf, Step, topMisses, validStep, WRITING } from './engine';
import { ABC, AbcLetter, EN, FAMILIES, HE, LETTER, wordsOf } from './letters';

type Update = (fn: (s: EState) => EState) => void;
let memory: string | null = null;
function load(): EState {
  let raw = memory;
  try { raw = localStorage.getItem(STORAGE_KEY) ?? raw; } catch { /* memory only */ }
  if (!raw) return initial(USER_NAME);
  try {
    const p = JSON.parse(raw), b = initial(''), st: EState = { ...b, ...p, name: USER_NAME || p.name, settings: { ...b.settings, ...p.settings } };
    if (st.plan && !st.plan.steps.every(validStep)) st.plan = null;
    return st;
  } catch { return initial(USER_NAME); }
}
function save(st: EState) { memory = JSON.stringify(st); try { localStorage.setItem(STORAGE_KEY, memory); } catch { /* memory only */ } }
export function recoverTinyEn() { save({ ...load(), plan: null }); }

type Part = { text: string; lang: 'he' | 'en' };
const en = (text: string): Part => ({ text, lang: 'en' }), he = (text: string): Part => ({ text, lang: 'he' });
const say = (...parts: Part[]) => sayInTurn(parts);
const named = (l: AbcLetter): Part[] => (l.big ? [en(EN.name(l.id))] : [en(EN.name(l.id)), he(HE.small)]);
const SpeakBtn = ({ parts }: { parts: Part[] }) => <button type="button" className="a-speak" aria-label="לשמוע שוב" onClick={() => sayInTurn(parts)}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Z" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></svg></button>;
const Play = () => <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M18 5v14L6 12z" /></svg>;
function Art({ id, draw, arrows }: { id: string; draw?: boolean; arrows?: boolean }) {
  const l = LETTER[id];
  return <svg viewBox={frameOf(l)} className="a-mini" aria-hidden="true"><Lines /><Glyph strokes={l.strokes} draw={draw} />{arrows && <Arrows strokes={l.strokes} />}</svg>;
}
const Print = ({ id }: { id: string }) => <span className="e-letter" dir="ltr">{id}</span>;

export function TinyEnApp() {
  const [st, setSt] = useState<EState>(() => load());
  const update: Update = useCallback((fn) => setSt((s) => { const n = fn(s); save(n); return n; }), []);
  const [tab, setTab] = useState<'home' | 'progress'>('home');
  const [inSession, setInSession] = useState(false);
  const [settings, setSettings] = useState(false);
  const today = dayNumber();
  const onSeconds = useCallback((sec: number) => update((s) => addTime(s, dayNumber(), sec)), [update]);
  useStudyTimer(inSession, onSeconds);
  useEffect(() => { void saveHebrewRecordings(); }, []);
  useEffect(() => {
    if (!inSession) return;
    const root = document.documentElement, stop = (e: TouchEvent) => e.preventDefault();
    root.classList.add('a-lock');
    document.addEventListener('touchmove', stop, { passive: false });
    return () => { root.classList.remove('a-lock'); document.removeEventListener('touchmove', stop); };
  }, [inSession]);
  const start = (o: PlanOptions = {}) => {
    update((s) => { const open = !!s.plan && !s.plan.extra && s.plan.day === today && s.plan.at < s.plan.steps.length; return open && !o.bonus && !o.warm && !o.boost ? s : { ...s, plan: buildPlan(s, today, o) }; });
    setInSession(true);
  };
  if (inSession && st.plan) return <Session st={st} update={update} onExit={() => setInSession(false)} />;
  return (
    <div className="app">
      <main className="page">{tab === 'home' ? <Home st={st} today={today} onStart={start} onProgress={() => setTab('progress')} onSettings={() => setSettings(true)} /> : <Progress st={st} />}</main>
      <nav className="nav" aria-label="ניווט">
        {([['home', 'בית'], ['progress', 'התקדמות']] as const).map(([k, label]) => <button key={k} type="button" className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{label}</button>)}
        <SummaryTab name={st.name} />
      </nav>
      {settings && <Settings st={st} update={update} onClose={() => setSettings(false)} />}
    </div>
  );
}

function Home({ st, today, onStart, onProgress, onSettings }: { st: EState; today: number; onStart: (o?: PlanOptions) => void; onProgress: () => void; onSettings: () => void }) {
  const open = st.plan && !st.plan.extra && st.plan.day === today && st.plan.at < st.plan.steps.length ? st.plan : null;
  const preview = useMemo(() => open ?? buildPlan(st, today, { rnd: () => 0.5 }), [open?.at, st.letters, today]);
  const left = preview.steps.slice(preview.at), fresh = left.find((s) => s.t === 'meet')?.id, first = fresh ?? left[0]?.id;
  const more = !!nextLetter(st) && shaky(st).length < SHAKY_LIMIT, met = Object.keys(st.letters).length, hard = ABC.filter((l) => statusOf(st, l.id) === 'hard').length;
  return (
    <>
      <TopBar onSettings={onSettings} />
      <h1 className="greet">{greeting(st.name)}</h1>
      <div className="next-card a-today-card">
        {first ? (
          <>
            <div className="a-today-letter"><Art id={first} /></div>
            <div className="a-today-text">
              <span className="chip-d">{open && open.at > 0 ? 'ממשיכים מאיפה שעצרנו' : 'האימון של היום'}</span>
              <h2>{fresh ? <>אות חדשה: <span dir="ltr">{fresh}</span></> : 'חזרה על אותיות'}</h2>
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
      <button type="button" className="card a-strip-card" onClick={onProgress}>
        <span className="row-between"><b>ה־ABC שלי</b><small className="muted">{met} מתוך {ABC.length} ›</small></span>
        <span className="e-abc" dir="ltr">{ABC.map((l) => <i key={l.id} className={statusOf(st, l.id)}>{l.id}</i>)}</span>
      </button>
    </>
  );
}

const STATUS: { key: Status; title: string; note: string }[] = [
  { key: 'hard', title: 'קשה עכשיו', note: 'כדאי לתרגל בחיזוק' },
  { key: 'learning', title: 'בתהליך', note: 'נפגשו, ועוד לא בטוחות' },
  { key: 'known', title: 'נלמדו', note: 'מזהים וכותבים בכמה ימים שונים' },
  { key: 'new', title: 'עוד לא נלמדו', note: 'לפי סדר הלימוד' },
];
const STAGE = ['מעבר על מקווקו', 'כתיבה ליד דוגמה', 'מהזיכרון ולבד', 'כתיבה לבד'];
const share = ([g, b]: [number, number]) => (g + b ? `${g} מתוך ${g + b} נכון` : 'עוד לא תורגל');

function Progress({ st }: { st: EState }) {
  const [shown, setShown] = useState<string | null>(null);
  const l = shown ? LETTER[shown] : null, k = shown ? st.letters[shown] : undefined;
  const of = (x: Status) => ABC.filter((v) => statusOf(st, v.id) === x);
  return (
    <>
      <header className="page-head"><h1>התקדמות</h1></header>
      <section className="a-totals">
        <div><b>{of('known').length}</b><span>נלמדו</span></div>
        <div><b>{of('learning').length}</b><span>בתהליך</span></div>
        <div className={of('hard').length ? 'warn' : ''}><b>{of('hard').length}</b><span>קשות</span></div>
        <div><b>{of('new').length}</b><span>נשארו</span></div>
      </section>
      {STATUS.map((x) => { const list = of(x.key); return list.length > 0 && (
        <section key={x.key} className="a-fam"><h3>{x.title}</h3><p className="small muted">{x.note}</p>
          <div className="a-grid" dir="ltr">{list.map((v) => <button key={v.id} type="button" className={`a-cell ${x.key}`} aria-label={v.id} onClick={() => { setShown(v.id); say(en(EN.name(v.id)), he(v.recipe)); }}><Art id={v.id} />{x.key === 'hard' && st.letters[v.id] && topMisses(st.letters[v.id]).length > 0 && <small>עם {topMisses(st.letters[v.id]).join(' ')}</small>}</button>)}</div>
        </section>
      ); })}
      {l && <div className="sheet-wrap" onClick={() => setShown(null)}><div className="sheet a-show" role="dialog" aria-label={l.id} onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h2 dir="ltr">{l.id}</h2><SpeakBtn parts={[en(EN.name(l.id)), he(l.recipe)]} /></div>
        <p className="small muted">{FAMILIES[l.family]}</p>
        <div className="a-board t-show"><Art key={l.id} id={l.id} draw arrows /></div>
        <div className="e-show-words">{wordsOf(l.id).map((w) => <button key={w[0]} type="button" onClick={() => say(en(w[0]))}><i aria-hidden="true">{w[1]}</i><span dir="ltr">{w[0]}</span></button>)}</div>
        {k ? <ul className="a-facts"><li><span>זיהוי</span><b>{share(k.ok)}</b></li><li><span>כתיבה</span><b>{share(k.wrote)}</b></li><li><span>שלב הכתיבה</span><b>{STAGE[Math.min(3, k.write.box)]}</b></li>{topMisses(k).length > 0 && <li><span>מתבלבל עם</span><b dir="ltr">{topMisses(k).join(', ')}</b></li>}</ul> : <p className="small muted">האות הזאת עוד לא נלמדה.</p>}
      </div></div>}
    </>
  );
}

function Settings({ st, update, onClose }: { st: EState; update: Update; onClose: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="הגדרות" onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h2>הגדרות</h2><button type="button" className="round" aria-label="סגירה" onClick={onClose}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button></div>
        <div className="set-row"><label htmlFor="e1">צלילי משחק</label><input id="e1" type="checkbox" checked={st.settings.sound} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, sound: e.target.checked } }))} /></div>
        <div className="danger">
          {!confirm ? <button type="button" className="link" onClick={() => setConfirm(true)}>איפוס ההתקדמות</button> : <><p className="small">למחוק את ההתקדמות בקורס? אי אפשר לבטל את זה.</p><div className="row-between"><button type="button" className="link" onClick={() => setConfirm(false)}>ביטול</button><button type="button" className="link" onClick={() => { update(() => initial(USER_NAME)); setConfirm(false); onClose(); }}>למחוק</button></div></>}
        </div>
      </div>
    </div>
  );
}

function Session({ st, update, onExit }: { st: EState; update: Update; onExit: () => void }) {
  const plan = st.plan!, step = plan.steps[plan.at];
  if (!step) return <Finish st={st} onExit={onExit} />;
  const l = LETTER[step.id], sound = st.settings.sound;
  const done = (what: 'see' | 'write') => (ok: boolean) => update((s) => advance(answer(s, l.id, what, ok, plan.day, !!plan.extra)));
  const miss = (c: string) => update((s) => noteMiss(s, l.id, c));
  return (
    <div className="session a-session" key={plan.at}>
      <div className="s-top"><button type="button" className="round" aria-label="יציאה. ההתקדמות נשמרת" onClick={onExit}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button><div className="thin" style={{ flex: 1 }}><span style={{ width: `${(plan.at / plan.steps.length) * 100}%` }} /></div></div>
      {step.t === 'meet' ? <Meet l={l} onDone={() => update((s) => advance(meet(s, l.id, plan.day)))} />
        : WRITING.includes(step.t) ? <Write l={l} mode={step.t as 'trace' | 'copy' | 'memory' | 'write' | 'opening'} n={step.n} sound={sound} onDone={done('write')} />
          : step.t === 'hunt' ? <Hunt st={st} l={l} sound={sound} onMiss={miss} onDone={done('see')} />
            : step.t === 'word' ? <WordGame st={st} l={l} n={step.n} sound={sound} onMiss={miss} onDone={done('see')} />
              : step.t === 'picture' ? <PictureGame st={st} l={l} n={step.n} sound={sound} onDone={done('see')} />
                : step.t === 'pair' && pairsOf(st, l.id).length ? <Pair st={st} l={l} n={step.n} sound={sound} onDone={done('see')} />
                : step.t === 'twin' ? <Twin st={st} l={l} sound={sound} onMiss={miss} onDone={done('see')} />
                  : <Find st={st} step={step} sound={sound} onMiss={miss} onDone={done('see')} />}
    </div>
  );
}

/** The letter draws itself with arrows, and the voice says its name and a word for it. */
function Meet({ l, onDone }: { l: AbcLetter; onDone: () => void }) {
  const w = wordsOf(l.id)[0], [run, setRun] = useState(0), parts = [en(EN.name(l.id)), he(l.recipe), en(EN.isFor(l.id, w[0]))];
  useEffect(() => { say(...parts); }, [run]);
  return (
    <div className="a-step">
      <div className="a-board t-meet-digit" key={run}><Art id={l.id} draw arrows /></div>
      <button type="button" className="e-example" aria-label="לשמוע שוב" onClick={() => say(en(EN.isFor(l.id, w[0])))}><span aria-hidden="true">{w[1]}</span><Highlight word={w[0]} l={l} /></button>
      <div className="a-tools"><button type="button" className="a-speak" aria-label="שוב" onClick={() => setRun(run + 1)}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" /></svg></button></div>
      <Next onClick={onDone} />
    </div>
  );
}
function Highlight({ word, l, hide, right }: { word: string; l: AbcLetter; hide?: boolean; right?: boolean }) {
  const first = l.big ? word[0].toUpperCase() : word[0].toLowerCase();
  return <span className="e-word" dir="ltr"><b className={right ? 'yes' : ''}>{hide ? '?' : first}</b>{word.slice(1)}</span>;
}

function Write({ l, mode, n, sound, onDone }: { l: AbcLetter; mode: 'trace' | 'copy' | 'memory' | 'write' | 'opening'; n: number; sound: boolean; onDone: (ok: boolean) => void }) {
  const rivals = useMemo(() => ABC.filter((x) => x.big === l.big), [l.id]), list = wordsOf(l.id), w = list[n % list.length];
  // The pad speaks by key, so that the same pad can say a Hebrew instruction, the English letter, and how it is written.
  const talk = (key: string) => {
    // Naming the letter would give the answer away when writing the opening letter of a word.
    if (key === 'said') { if (mode === 'opening') say(en(w[0]), he(HE.writeOpening)); else say(he(HE[mode]), ...named(l), he(l.recipe)); }
    else if (key === 'praise') say(en(EN.yes(l.id)));
    else if (key === 'told') say(...named(l));
    else say(he(HE.again));
  };
  const side = mode === 'opening' ? <button type="button" className="a-model a-opening" aria-label="לשמוע שוב" onClick={() => talk('said')}><span aria-hidden="true">{w[1]}</span><Highlight word={w[0]} l={l} hide /></button> : undefined;
  return <WritePad shape={l} name={l.id} mode={mode === 'opening' ? 'write' : mode} said="said" praise="praise" answer="told" again="again" rivals={rivals} side={side} talk={talk} sound={sound} onDone={onDone} />;
}

/** Two look-alikes and a question about what tells them apart. */
function Pair({ st, l, n, sound, onDone }: { st: EState; l: AbcLetter; n: number; sound: boolean; onDone: (ok: boolean) => void }) {
  const list = pairsOf(st, l.id), [right, other, question] = list[n % list.length], target = LETTER[right];
  const order = useMemo(() => (Math.random() < 0.5 ? [right, other] : [other, right]), [right, other]), a = useAnswer(target, sound), q = [he(question)];
  useEffect(() => { say(...q); }, []);
  return <div className="a-step"><SpeakBtn parts={q} /><Letters l={target} options={order} a={a} />{a.right ? <Next onClick={() => onDone(a.wrong.length === 0)} /> : <div className="a-next-space" />}</div>;
}

function useAnswer(l: AbcLetter, sound: boolean, onMiss?: (c: string) => void) {
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState(false);
  const tap = (c: string) => {
    if (right) return;
    if (c === l.id) { setRight(true); if (sound) sfx.good(); say(en(EN.yes(l.id))); }
    else { setWrong([...wrong, c]); onMiss?.(c); if (sound) sfx.bad(); say(he(HE.notThis), en(EN.name(c))); }
  };
  return { wrong, right, tap };
}
const Letters = ({ l, options, a, print }: { l: AbcLetter; options: string[]; a: ReturnType<typeof useAnswer>; print?: boolean }) => <div className={`t-options n${options.length} ${print ? '' : 'tall'}`} dir="ltr">{options.map((c) => <button key={c} type="button" disabled={a.wrong.includes(c)} aria-label={c} className={`a-answer ${a.right && c === l.id ? 'right' : ''} ${a.wrong.includes(c) ? 'off' : ''}`} onClick={() => a.tap(c)}>{print ? <Print id={c} /> : <Art id={c} />}</button>)}</div>;

function Find({ st, step, sound, onMiss, onDone }: { st: EState; step: Step; sound: boolean; onMiss: (c: string) => void; onDone: (ok: boolean) => void }) {
  const l = LETTER[step.id], options = useMemo(() => choices(st, l.id), [l.id]), a = useAnswer(l, sound, onMiss), q = [he(HE.where), ...named(l)];
  useEffect(() => { say(...q); }, []);
  return <div className="a-step"><SpeakBtn parts={q} /><Letters l={l} options={options} a={a} />{a.right ? <Next onClick={() => onDone(a.wrong.length === 0)} /> : <div className="a-next-space" />}</div>;
}

/** A small letter and its big partner, the bridge from capitals to small letters. */
function Twin({ st, l, sound, onMiss, onDone }: { st: EState; l: AbcLetter; sound: boolean; onMiss: (c: string) => void; onDone: (ok: boolean) => void }) {
  const big = LETTER[l.id.toUpperCase()], options = useMemo(() => choices(st, big.id), [big.id]), q = [he(HE.bigOf), en(EN.name(l.id))];
  const a = useAnswer(big, sound, onMiss);
  useEffect(() => { say(...q); }, []);
  return <div className="a-step"><div className="t-ask"><SpeakBtn parts={q} /><div className="t-stage"><Art id={l.id} /></div></div><Letters l={big} options={options} a={a} print />{a.right ? <Next onClick={() => onDone(a.wrong.length === 0)} /> : <div className="a-next-space" />}</div>;
}

function Hunt({ st, l, sound, onMiss, onDone }: { st: EState; l: AbcLetter; sound: boolean; onMiss: (c: string) => void; onDone: (ok: boolean) => void }) {
  const cells = useMemo(() => huntCells(st, l.id), [l.id]), q = [he(HE.hunt), ...named(l)];
  const [found, setFound] = useState<number[]>([]), [misses, setMisses] = useState<number[]>([]);
  const all = found.length === 5;
  useEffect(() => { say(...q); }, []);
  const tap = (c: string, i: number) => {
    if (all || found.includes(i)) return;
    if (c === l.id) { const n = [...found, i]; setFound(n); if (sound) sfx.good(); say(en(n.length === 5 ? EN.yes(l.id) : EN.name(l.id))); }
    else { if (!misses.includes(i)) { setMisses([...misses, i]); onMiss(c); } if (sound) sfx.bad(); say(he(HE.notThis), en(EN.name(c))); }
  };
  return (
    <div className="a-step">
      <SpeakBtn parts={q} />
      <div className="a-hunt" dir="ltr">{cells.map((c, i) => <button key={i} type="button" aria-label={c} className={`a-answer ${found.includes(i) ? 'right' : ''} ${misses.includes(i) ? 'off' : ''}`} onClick={() => tap(c, i)}><Art id={c} /></button>)}</div>
      {all ? <Next onClick={() => onDone(misses.length <= 1)} /> : <div className="a-next-space" />}
    </div>
  );
}

/** An easy word with a picture, its first letter enlarged or missing: which letter opens it? */
function WordGame({ st, l, n, sound, onMiss, onDone }: { st: EState; l: AbcLetter; n: number; sound: boolean; onMiss: (c: string) => void; onDone: (ok: boolean) => void }) {
  const list = wordsOf(l.id), w = list[n % list.length], hide = n % 2 === 1, options = useMemo(() => choices(st, l.id), [l.id]), q = [en(w[0]), he(HE.opens)], a = useAnswer(l, sound, onMiss);
  useEffect(() => { say(...q); }, []);
  return (
    <div className="a-step">
      <button type="button" className="a-word e-example big" aria-label="לשמוע שוב" onClick={() => say(...q)}><span aria-hidden="true">{w[1]}</span><Highlight word={w[0]} l={l} hide={hide && !a.right} right={a.right} /></button>
      <Letters l={l} options={options} a={a} print />
      {a.right ? <Next onClick={() => onDone(a.wrong.length === 0)} /> : <div className="a-next-space" />}
    </div>
  );
}

/** Hear a letter and choose the picture whose word opens with it. The words are written, since a child does not know them in English yet. */
function PictureGame({ st, l, n, sound, onDone }: { st: EState; l: AbcLetter; n: number; sound: boolean; onDone: (ok: boolean) => void }) {
  const { right, options } = useMemo(() => pictureChoices(st, l.id, n), [l.id, n]), q = [he(HE.picture), ...named(l), ...options.map((w) => en(w[0]))];
  const [wrong, setWrong] = useState<string[]>([]), [won, setWon] = useState(false);
  useEffect(() => { say(...q); }, []);
  const tap = (w: [string, string]) => {
    if (won) return;
    if (w === right) { setWon(true); if (sound) sfx.good(); say(en(EN.isFor(l.id, w[0]))); }
    else { setWrong([...wrong, w[0]]); if (sound) sfx.bad(); say(en(w[0])); }
  };
  return (
    <div className="a-step">
      <SpeakBtn parts={q} />
      <div className="e-options" dir="ltr">{options.map((w) => <button key={w[0]} type="button" disabled={wrong.includes(w[0])} aria-label={w[0]} className={`a-answer ${won && w === right ? 'right' : ''} ${wrong.includes(w[0]) ? 'off' : ''}`} onClick={() => tap(w)}><span aria-hidden="true">{w[1]}</span><Highlight word={w[0]} l={l} right={won && w === right} /></button>)}</div>
      {won ? <Next onClick={() => onDone(wrong.length === 0)} /> : <div className="a-next-space" />}
    </div>
  );
}

function Finish({ st, onExit }: { st: EState; onExit: () => void }) {
  useEffect(() => { sfx.win(); say(he(HE.finish)); }, []);
  const day = st.plan!.day, today = Object.keys(st.letters).filter((id) => st.letters[id].met === day);
  return (
    <div className="session finish a-finish">
      <span className="a-star" aria-hidden="true">★</span>
      <h1>כל הכבוד{st.name ? `, ${st.name}` : ''}!</h1>
      {today.length > 0 && <div className="a-today" dir="ltr">{today.map((id) => <Art key={id} id={id} />)}</div>}
      <p className="muted center">{Object.values(st.letters).filter(secure).length} אותיות כבר בטוחות</p>
      <div className="grow" />
      <button type="button" className="cta a-go" aria-label="סיום" onClick={onExit}><svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" d="m5 13 5 5L20 7" /></svg></button>
    </div>
  );
}
