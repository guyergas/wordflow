import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Next, useStudyTimer } from '../alef/AlefApp';
import { STORAGE_KEY, USER_NAME } from '../course';
import { saveHebrewRecordings, sayInTurn, sfx } from '../platform';
import { CourseSwitch, SummaryTab } from '../summaryUi';
import { addTime, advance, answer, buildPlan, dayNumber, EState, huntCells, initial, Known, meet, nextBatch, noteMiss, others, pairCards, PlanOptions, secure, shaky, SHAKY_LIMIT, Status, statusOf, Step, topMisses, validStep, yesNoPicture } from './engine';
import { BATCH, BATCHES, EN, HE, Word, WORD } from './words';

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

const en = (text: string) => ({ text, lang: 'en' as const }), he = (text: string) => ({ text, lang: 'he' as const });
type Part = ReturnType<typeof en> | ReturnType<typeof he>;
const say = (...parts: Part[]) => sayInTurn(parts);
const SpeakBtn = ({ parts }: { parts: Part[] }) => <button type="button" className="a-speak" aria-label="לשמוע שוב" onClick={() => sayInTurn(parts)}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Z" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></svg></button>;
const Play = () => <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M18 5v14L6 12z" /></svg>;

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
  const preview = useMemo(() => open ?? buildPlan(st, today, { rnd: () => 0.5 }), [open?.at, st.batches, today]);
  const left = preview.steps.slice(preview.at), fresh = left.find((s) => s.t === 'meet')?.id, first = fresh ?? left[0]?.id;
  const more = !!nextBatch(st) && shaky(st).length < SHAKY_LIMIT, met = Object.keys(st.batches).length, hard = BATCHES.filter((b) => statusOf(st, b.id) === 'hard').length;
  return (
    <>
      <header className="top"><CourseSwitch /><button type="button" className="round" aria-label="הגדרות" onClick={onSettings}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg></button></header>
      <h1 className="greet">{st.name ? `שלום ${st.name}` : 'אנגלית לקטנטנים'}</h1>
      <div className="next-card a-today-card">
        {first ? (
          <>
            <div className="a-today-letter e-face" aria-hidden="true">{BATCH[first].words[0].pic}</div>
            <div className="a-today-text">
              <span className="chip-d">{open && open.at > 0 ? 'ממשיכים מאיפה שעצרנו' : 'האימון של היום'}</span>
              <h2>{fresh ? `מילים חדשות: ${BATCH[fresh].title}` : 'חזרה על מילים'}</h2>
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
              <p>{more ? 'אפשר ללמוד עוד מילים, או לחזור מחר.' : 'נתרגל את מה שלמדנו, ומחר נמשיך.'}</p>
            </div>
            {more && <button type="button" className="cta-d a-start" onClick={() => onStart({ bonus: true })}><Play /> עוד מילים</button>}
          </>
        )}
      </div>
      {met > 0 && (
        <div className="a-free" role="group" aria-label="תרגול נוסף">
          <button type="button" onClick={() => onStart({ warm: true })}><span aria-hidden="true">🔥</span><b>חימום</b><small>מילים שכבר יודעים</small></button>
          <button type="button" onClick={() => onStart({ boost: true })}><span aria-hidden="true">💪</span><b>חיזוק</b><small>{hard > 0 ? `${hard} קבוצות קשות` : 'מילים שפחות בטוחות'}</small></button>
        </div>
      )}
      <button type="button" className="card a-strip-card" onClick={onProgress}>
        <span className="row-between"><b>המילים שלי</b><small className="muted">{met * 3 > 0 ? Object.keys(st.batches).reduce((a, id) => a + BATCH[id].words.length, 0) : 0} מילים ›</small></span>
        <span className="e-strip">{BATCHES.map((b) => <i key={b.id} className={statusOf(st, b.id)} aria-hidden="true">{b.words[0].pic}</i>)}</span>
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

function Progress({ st }: { st: EState }) {
  const of = (x: Status) => BATCHES.filter((b) => statusOf(st, b.id) === x);
  const words = (x: Status) => of(x).reduce((a, b) => a + b.words.length, 0);
  const missed = (k?: Known) => (k ? topMisses(k) : []);
  return (
    <>
      <header className="page-head"><h1>התקדמות</h1></header>
      <section className="a-totals">
        <div><b>{words('known')}</b><span>נלמדו</span></div>
        <div><b>{words('learning')}</b><span>בתהליך</span></div>
        <div className={of('hard').length ? 'warn' : ''}><b>{words('hard')}</b><span>קשות</span></div>
        <div><b>{words('new')}</b><span>נשארו</span></div>
      </section>
      {STATUS.map((x) => { const list = of(x.key); return list.length > 0 && (
        <section key={x.key} className="a-fam"><h3>{x.title}</h3><p className="small muted">{x.note}</p>
          <ul className="t-list">{list.map((b) => <li key={b.id} className={`t-row ${x.key} e-row`}><b>{b.title}</b>
            <span className="e-words">{b.words.map((w) => <button key={w.en} type="button" onClick={() => say(en(w.en))} aria-label={`${w.en}, ${w.he}`} className={missed(st.batches[b.id]).includes(w.en) ? 'miss' : ''}><i aria-hidden="true">{w.pic}</i><span dir="ltr">{w.en}</span><small>{w.he}</small></button>)}</span>
          </li>)}</ul>
        </section>
      ); })}
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
  const sound = st.settings.sound, target = WORD[step.word ?? ''] ?? BATCH[step.id].words[step.n % BATCH[step.id].words.length];
  const box = st.batches[step.id]?.see.box ?? 0;
  const done = (ok: boolean) => update((s) => advance(answer(s, step.id, ok, plan.day, !!plan.extra)));
  const miss = (w: string) => update((s) => noteMiss(s, step.id, w));
  return (
    <div className="session a-session" key={plan.at}>
      <div className="s-top"><button type="button" className="round" aria-label="יציאה. ההתקדמות נשמרת" onClick={onExit}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button><div className="thin" style={{ flex: 1 }}><span style={{ width: `${(plan.at / plan.steps.length) * 100}%` }} /></div></div>
      {step.t === 'meet' ? <Meet w={target} first={step.n === 0} onDone={() => update((s) => advance(meet(s, step.id, plan.day)))} />
        : step.t === 'yesno' ? <YesNo st={st} w={target} sound={sound} onMiss={miss} onDone={done} />
          : step.t === 'hunt' ? <Hunt st={st} w={target} sound={sound} onMiss={miss} onDone={done} />
            : step.t === 'pairs' ? <Pairs st={st} w={target} sound={sound} onDone={done} />
              : <Listen st={st} w={target} english={box >= 2} sound={sound} onMiss={miss} onDone={done} />}
    </div>
  );
}

/** A word, big, with its picture. The voice says it twice so the child can say it back. */
function Meet({ w, first, onDone }: { w: Word; first: boolean; onDone: () => void }) {
  const parts = first ? [he(HE.intro), en(w.en), en(w.en)] : [en(w.en), en(w.en)];
  useEffect(() => { say(...parts); }, []);
  return (
    <div className="a-step">
      <button type="button" className="e-card" aria-label="לשמוע שוב" onClick={() => say(en(w.en), en(w.en))}>
        <span className="e-pic" aria-hidden="true">{w.pic}</span>
        <b dir="ltr">{w.en}</b>
        <small>{w.he}</small>
      </button>
      <div className="a-tools"><SpeakBtn parts={[en(w.en), en(w.en)]} /></div>
      <Next onClick={onDone} />
    </div>
  );
}

/** Hear a word and choose its picture. First the question is in Hebrew with the English word, later all in English. */
function Listen({ st, w, english, sound, onMiss, onDone }: { st: EState; w: Word; english: boolean; sound: boolean; onMiss: (word: string) => void; onDone: (ok: boolean) => void }) {
  const options = useMemo(() => [w, ...others(st, w, 2)].sort(() => Math.random() - 0.5), [w.en]);
  const q = english ? [en(w.ask)] : [he(HE.where), en(w.en)];
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState(false);
  useEffect(() => { say(...q); }, []);
  const tap = (o: Word) => {
    if (right) return;
    if (o === w) { setRight(true); if (sound) sfx.good(); say(en(EN.yes(w.en))); }
    else { setWrong([...wrong, o.en]); onMiss(w.en); if (sound) sfx.bad(); say(he(HE.notThis), en(o.en)); }
  };
  return (
    <div className="a-step">
      <SpeakBtn parts={q} />
      <div className="e-options">{options.map((o) => <button key={o.en} type="button" disabled={wrong.includes(o.en)} aria-label={o.en} className={`a-answer ${right && o === w ? 'right' : ''} ${wrong.includes(o.en) ? 'off' : ''}`} onClick={() => tap(o)}><span aria-hidden="true">{o.pic}</span></button>)}</div>
      {right ? <Next onClick={() => onDone(wrong.length === 0)} /> : <div className="a-next-space" />}
    </div>
  );
}

/** A picture and a word: does it match? */
function YesNo({ st, w, sound, onMiss, onDone }: { st: EState; w: Word; sound: boolean; onMiss: (word: string) => void; onDone: (ok: boolean) => void }) {
  const { shown, match } = useMemo(() => yesNoPicture(st, w), [w.en]), q = [he(HE.isIt), en(w.en)];
  const [picked, setPicked] = useState<boolean | null>(null);
  useEffect(() => { say(...q); }, []);
  const ok = picked === match;
  const tap = (v: boolean) => {
    if (picked !== null) return;
    setPicked(v);
    if (v === match) { if (sound) sfx.good(); say(en(EN.yes(shown.en))); }
    else { onMiss(w.en); if (sound) sfx.bad(); say(he(HE.isIt), en(shown.en)); }
  };
  return (
    <div className="a-step">
      <SpeakBtn parts={q} />
      <div className={`e-card static ${picked !== null ? (ok ? 'right' : 'soft') : ''}`}><span className="e-pic" aria-hidden="true">{shown.pic}</span>{picked !== null && <b dir="ltr">{shown.en}</b>}</div>
      <div className="e-yesno">
        <button type="button" className={`a-answer ${picked === true ? (ok ? 'right' : 'off') : ''}`} aria-label="כן" onClick={() => tap(true)}>👍</button>
        <button type="button" className={`a-answer ${picked === false ? (ok ? 'right' : 'off') : ''}`} aria-label="לא" onClick={() => tap(false)}>👎</button>
      </div>
      {picked !== null ? <Next onClick={() => onDone(ok)} /> : <div className="a-next-space" />}
    </div>
  );
}

function Hunt({ st, w, sound, onMiss, onDone }: { st: EState; w: Word; sound: boolean; onMiss: (word: string) => void; onDone: (ok: boolean) => void }) {
  const cells = useMemo(() => huntCells(st, w), [w.en]), q = [he(HE.hunt), en(w.en)];
  const [found, setFound] = useState<number[]>([]), [misses, setMisses] = useState<number[]>([]);
  const all = found.length === cells.filter((c) => c === w).length;
  useEffect(() => { say(...q); }, []);
  const tap = (c: Word, i: number) => {
    if (all || found.includes(i)) return;
    if (c === w) { const next = [...found, i]; setFound(next); if (sound) sfx.good(); say(en(next.length === 4 ? EN.yes(w.en) : w.en)); }
    else { if (!misses.includes(i)) { setMisses([...misses, i]); onMiss(w.en); } if (sound) sfx.bad(); say(he(HE.notThis), en(c.en)); }
  };
  return (
    <div className="a-step">
      <SpeakBtn parts={q} />
      <div className="e-hunt">{cells.map((c, i) => <button key={i} type="button" aria-label={c.en} className={`a-answer ${found.includes(i) ? 'right' : ''} ${misses.includes(i) ? 'off' : ''}`} onClick={() => tap(c, i)}><span aria-hidden="true">{c.pic}</span></button>)}</div>
      {all ? <Next onClick={() => onDone(misses.length <= 1)} /> : <div className="a-next-space" />}
    </div>
  );
}

/** A memory game. Every card says its word when it is turned, so the child hears the words again and again. */
function Pairs({ st, w, sound, onDone }: { st: EState; w: Word; sound: boolean; onDone: (ok: boolean) => void }) {
  const cards = useMemo(() => pairCards(st, w), [w.en]);
  const [open, setOpen] = useState<number[]>([]), [won, setWon] = useState<number[]>([]);
  const wait = useRef<ReturnType<typeof setTimeout>>(undefined);
  const misses = useRef(0);
  useEffect(() => { say(he(HE.pairs)); return () => clearTimeout(wait.current); }, []);
  const finished = won.length === cards.length;
  const tap = (i: number) => {
    if (open.length >= 2 || open.includes(i) || won.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    say(en(cards[i].en));
    if (next.length < 2) return;
    if (cards[next[0]] === cards[next[1]]) {
      if (sound) sfx.good();
      const all = [...won, ...next];
      wait.current = setTimeout(() => { setWon(all); setOpen([]); if (all.length === cards.length) say(en(EN.again)); }, 700);
    } else { misses.current++; wait.current = setTimeout(() => setOpen([]), 1300); }
  };
  return (
    <div className="a-step">
      <SpeakBtn parts={[he(HE.pairs)]} />
      <div className="e-pairs">{cards.map((c, i) => { const up = open.includes(i) || won.includes(i); return <button key={i} type="button" aria-label={up ? c.en : 'קלף הפוך'} className={`a-answer ${won.includes(i) ? 'right' : ''} ${up ? '' : 'back'}`} onClick={() => tap(i)}><span aria-hidden="true">{up ? c.pic : '★'}</span></button>; })}</div>
      {finished ? <Next onClick={() => onDone(true)} /> : <div className="a-next-space" />}
    </div>
  );
}

function Finish({ st, onExit }: { st: EState; onExit: () => void }) {
  useEffect(() => { sfx.win(); say(he(HE.finish)); }, []);
  const day = st.plan!.day, today = Object.keys(st.batches).filter((id) => st.batches[id].met === day).flatMap((id) => BATCH[id].words);
  return (
    <div className="session finish a-finish">
      <span className="a-star" aria-hidden="true">★</span>
      <h1>כל הכבוד{st.name ? `, ${st.name}` : ''}!</h1>
      {today.length > 0 && <div className="e-today">{today.map((w) => <button key={w.en} type="button" onClick={() => say(en(w.en))} aria-label={w.en}><i aria-hidden="true">{w.pic}</i><span dir="ltr">{w.en}</span></button>)}</div>}
      <p className="muted center">{Object.values(st.batches).filter(secure).length} קבוצות מילים כבר בטוחות</p>
      <div className="grow" />
      <button type="button" className="cta a-go" aria-label="סיום" onClick={onExit}><svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" d="m5 13 5 5L20 7" /></svg></button>
    </div>
  );
}
