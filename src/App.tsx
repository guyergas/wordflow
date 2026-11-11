import { SettingsSheet, Toggle } from './settingsSheet';
import { FirstRunTop, greeting, TopBar } from './topBar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pushProgress } from './progressSync';
import {
  applyPlacement, buildPlan, clozeOf, currentLevel, dayLog, dayNumber, hardWords, isKnown, isMet, Kind, label, levelStats, LEARNING_CAP, options,
  Part, Plan, placementWords, PLACEMENT_PASS, recordRecognition, recordSpelling, givenLetters, spellLevel, spellAlign, spellDiff, spellKnown, spellMeasured, State, Step, tileSet,
  toggleFlag, topConfusions, topTraps, totals, weekDays, ws, isLearning, newAllowance, nextNewWords, addStudyTime, questionCount, studyTimeLabel, studySeconds, resolveCheck, restorePaused, repairPlans, onTheWay, steppedToday, spellCandidates,
} from './engine';
import { metricOf, readyCount, recordSentence, Sentence, SENTENCES, sentenceKind, sentencePlan, sentencesKnown, tokens, TOPICS, unknownWords } from './sentences';
import { COURSE_ID, COURSES, HAS_SPELLING, IS_THAI, USER_NAME, x } from './course';
import { SummaryTab, TodayPlan } from './summaryUi';
import { EnglishReading } from './englishReading';
import { GrammarCard } from './grammar/GrammarCard';
import { LEVELS, WORD, WORDS, Word } from './words';
import { buildReport, drawReport, fileName, Period, toBlob } from './report';
import { askPersistence, canSpeak, englishVoices, load, save, saveThaiRecordings, sfx, speak } from './platform';

type Tab = 'home' | 'path' | 'progress' | 'words';
type Update = (fn: (s: State) => State) => void;
type StartOpts = { short?: boolean; extra?: boolean; spell?: boolean; bonus?: boolean };

const PART: Record<Part, { name: string; next: string; note: string }> = {
  warm: { name: 'חימום', next: x('מילים שאת כבר מכירה', 'מילים שאתה כבר מכיר'), note: x('כאן את על מגרש הבית', 'כאן אתה על מגרש הבית') },
  boost: { name: 'חיזוק', next: 'כמה מילים שצריכות עוד סיבוב', note: 'קצר, ותמיד עם עזרה' },
  new: { name: 'חדשות', next: 'המילים החדשות של היום', note: 'הפרס של היום' },
};
const PARTS: Part[] = ['warm', 'boost', 'new'];

const En = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span dir="ltr" lang="en" className={`en ${className}`}>{children}</span>
);

function SpeakIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M4 9.5v5h3.6L13 19V5L7.6 9.5H4Z" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 9a4 4 0 0 1 0 6M18.6 6.5a8 8 0 0 1 0 11" /></svg>;
}

function Tile({ ch, state = '', onClick, small, disabled }: { ch: string; state?: string; onClick?: () => void; small?: boolean; disabled?: boolean }) {
  const cls = `tile ${small ? 'small' : ''} ${state}`;
  if (onClick) return <button type="button" className={cls} onClick={onClick} disabled={disabled} aria-label={ch}><i>{ch}</i></button>;
  return <span className={cls}><i>{ch}</i></span>;
}

const longClass = (t: string) => (t.length > 22 ? 'very-long' : t.length > 11 ? 'long' : '');
const searchable = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]/g, '').toLowerCase();
/** The word as the learner reads it: letter tiles in English, a plain line of transliteration in Thai. */
function WordFace({ w }: { w: Word }) {
  if (IS_THAI) return <div className={`flip-in word-hero ${longClass(w.en)}`}><En>{w.en}</En></div>;
  return <div className="flip-in tiles-row" dir="ltr">{[...w.en].map((c, i) => <Tile key={i} ch={c} state="pop" small={w.en.length > 8} />)}</div>;
}

function ToneNote() {
  return (
    <div className="tone-note">
      <b>הסימן מעל התנועה הוא הטון</b>
      <ul dir="ltr"><li><En>à</En><span>נמוך</span></li><li><En>a</En><span>אמצעי</span></li><li><En>á</En><span>גבוה</span></li><li><En>â</En><span>יורד</span></li><li><En>ǎ</En><span>עולה</span></li></ul>
      <small>תנועה כפולה ארוכה יותר. הטון משנה את המשמעות, ולכן כדאי להקשיב לכל מילה.</small>
    </div>
  );
}

export function Wordmark() {
  return <div className="wordmark" dir="ltr" aria-label="WordFlow"><Tile ch="W" small /><span>ordFlow</span></div>;
}

/** Counts real study time: the screen is visible and she touched it recently. Walking away stops the clock. */
function useStudyTimer(active: boolean, update: Update) {
  useEffect(() => {
    if (!active) return;
    const TICK = 5, IDLE_MS = 45000;
    let last = Date.now(), pending = 0;
    const touch = () => { last = Date.now(); };
    const flush = () => { if (pending > 0) { const sec = pending; pending = 0; update((s) => addStudyTime(s, dayNumber(), sec)); } };
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - last < IDLE_MS) pending += TICK;
      if (pending >= 15) flush();
    }, TICK * 1000);
    document.addEventListener('visibilitychange', flush);
    return () => {
      clearInterval(id); flush();
      window.removeEventListener('pointerdown', touch); window.removeEventListener('keydown', touch);
      document.removeEventListener('visibilitychange', flush);
    };
  }, [active, update]);
}

export function App() {
  const [st, setSt] = useState<State>(() => restorePaused(load()));
  const [tab, setTab] = useState<Tab>('home');
  const [inSession, setInSession] = useState(false);
  const [inSentences, setInSentences] = useState(false);
  const [settings, setSettings] = useState(false);
  const [wordSheet, setWordSheet] = useState<string | null>(null);
  const update: Update = useCallback((fn) => setSt((s) => { const n = fn(s); save(n); return n; }), []);
  const today = dayNumber();

  useEffect(() => { void askPersistence(); const t = setTimeout(() => void saveThaiRecordings(), 1500); return () => clearTimeout(t); }, []);
  useStudyTimer(inSession || inSentences, update);

  const startSession = (opts: StartOpts = {}) => {
    update((raw) => {
      const s = restorePaused(raw);
      const unfinished = !!s.plan && s.plan.day === today && s.plan.at < s.plan.steps.length;
      if (opts.extra) return { ...s, plan: buildPlan(s, today, opts), paused: unfinished ? s.plan : null };
      return unfinished && !opts.short ? s : { ...s, plan: buildPlan(s, today, opts) };
    });
    setInSession(true);
  };

  if (!st.onboarded) return <Onboarding st={st} update={update} />;
  if (inSession && st.plan) return <Session st={st} update={update} onExit={() => { update(restorePaused); setInSession(false); setTab('home'); }} onMore={() => startSession(st.plan?.spelling ? { extra: true, spell: true } : { extra: true })} onMoreNew={() => startSession({ bonus: true })} />;
  if (inSentences) return <SentenceSession st={st} update={update} today={today} onExit={() => setInSentences(false)} />;

  return (
    <div className="app">
      <main className="page">
        {tab === 'home' && <Home st={st} today={today} onStart={startSession} onSentences={() => setInSentences(true)} onSettings={() => setSettings(true)} onReadTime={(sec) => update((s) => addStudyTime(s, dayNumber(), sec))} />}
        {tab === 'path' && <PathScreen st={st} onWord={setWordSheet} />}
        {tab === 'progress' && <Progress st={st} today={today} onWord={setWordSheet} />}
        {tab === 'words' && <WordsScreen st={st} onWord={setWordSheet} />}
      </main>
      <nav className="nav" aria-label="ניווט">
        {([['home', 'בית'], ['path', 'המסע'], ['progress', 'התקדמות'], ['words', 'מילים']] as [Tab, string][]).map(([k, t]) => (
          <button key={k} type="button" className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{t}</button>
        ))}
        <SummaryTab name={st.name} />
      </nav>
      {settings && <Settings st={st} update={update} onClose={() => setSettings(false)} />}
      {wordSheet && <WordSheet st={st} update={update} id={wordSheet} onClose={() => setWordSheet(null)} />}
    </div>
  );
}

// ---------- Onboarding + placement ----------
function Onboarding({ st, update }: { st: State; update: Update }) {
  const [step, setStep] = useState<'hello' | 'test' | 'result'>('hello');
  const [name, setName] = useState(USER_NAME || st.name);
  const [level, setLevel] = useState(0);
  const [queue, setQueue] = useState<Word[]>(() => placementWords(0));
  const [i, setI] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [startLevel, setStartLevel] = useState(0);
  const w = queue[i];
  const opts = useMemo(() => (w ? options(st, w.id, 3) : []), [w?.id]);
  const asked = Object.keys(results).length;

  const answer = (val: string | null) => {
    if (picked) return;
    const ok = val === w.id;
    setPicked(val ?? '-');
    if (st.settings.sound) (ok ? sfx.good : sfx.tap)();
    const nextResults = { ...results, [w.id]: ok };
    const nextScore = score + (ok ? 1 : 0);
    setTimeout(() => {
      setResults(nextResults); setPicked(null);
      if (i + 1 < queue.length) { setScore(nextScore); setI(i + 1); return; }
      if (nextScore >= PLACEMENT_PASS && level + 1 < LEVELS.length) {
        setLevel(level + 1); setQueue(placementWords(level + 1)); setI(0); setScore(0);
      } else {
        setStartLevel(nextScore >= PLACEMENT_PASS ? LEVELS.length - 1 : level);
        setStep('result');
      }
    }, 450);
  };

  const finish = (from: number, res: Record<string, boolean>) => { pushProgress(); update((s) => applyPlacement({ ...s, name: name.trim() || s.name }, res, from, dayNumber())); };

  if (step === 'hello') return (
    <div className="onb">
      <FirstRunTop />
      <div className="onb-tiles" dir="ltr" aria-hidden="true">{[...x('HELLO', 'SAWATDII')].map((c, n) => <Tile key={n} ch={c} state="pop" small={IS_THAI} />)}</div>
      <h1>כל יום קצת.<br />והמילים נשארות.</h1>
      <p className="lead">{x('אימון קצר ביום: חימום על מילים שאת מכירה, חיזוק קליל, ואז מילים חדשות שמחכות לך בסוף.', 'אימון קצר ביום: חימום על מילים שאתה מכיר, חיזוק קליל, ואז מילים חדשות שמחכות לך בסוף.')}</p>
      {IS_THAI && <p className="lead"><b>מקשיבים וחוזרים בקול רם על כל מילה.</b> ככה הפה מתרגל, ולא רק האוזן.</p>}
      {IS_THAI && <ToneNote />}
      {!USER_NAME && <><label className="field" htmlFor="nm">איך לקרוא לך?</label><input id="nm" className="input" value={name} onChange={(e) => setName(e.target.value)} /></>}
      <button type="button" className="cta" disabled={!name.trim()} onClick={() => { if (st.settings.sound) sfx.tap(); if (IS_THAI) finish(0, {}); else setStep('test'); }}>{x('נתחיל בבדיקה קצרה', 'נתחיל')}</button>
      {!IS_THAI && <p className="small muted center">כמה דקות, בלי ציון. היא רק מוצאת לך את נקודת ההתחלה. אם מילה לא מוכרת, זה בסדר גמור.</p>}
    </div>
  );

  if (step === 'result') {
    const lv = LEVELS[startLevel];
    return (
      <div className="onb">
        <FirstRunTop />
        <div className="next-card static">
          <span className="chip-d">נקודת ההתחלה שלך</span>
          <h2>תחנה {startLevel + 1}: {lv.name}</h2>
          <p>{lv.blurb}. המילים של התחנות הקודמות יעלו בחימום. אם מילה תתברר כפחות מוכרת, היא פשוט תקבל עוד חיזוק.</p>
        </div>
        <button type="button" className="cta" onClick={() => finish(startLevel, results)}>יאללה, לאימון</button>
        {startLevel > 0 && <button type="button" className="link" onClick={() => finish(Math.max(0, startLevel - 1), results)}>{x('אני מעדיפה להתחיל תחנה אחת קודם', 'אני מעדיף להתחיל תחנה אחת קודם')}</button>}
      </div>
    );
  }

  return (
    <div className="session">
      <div className="s-top"><span className="muted small">בדיקת פתיחה · תחנה {level + 1}</span>
        <button type="button" className="link" onClick={() => { setStartLevel(level); setStep('result'); }}>{x('מספיק, עצרי כאן', 'מספיק, עצור כאן')}</button></div>
      <div className="thin"><span style={{ width: `${Math.min(100, (asked / (LEVELS.length * 4)) * 100)}%` }} /></div>
      <div className="q">
        <p className="prompt">מה פירוש המילה?</p>
        <button type="button" className={`word-hero as-btn ${longClass(w.en)}`} onClick={() => speak(w.en)}><En>{w.en}</En></button>
        <div className="answers">
          {opts.map((o) => (
            <button key={o.id} type="button" className={`ans ${picked && o.id === w.id ? 'right' : ''} ${picked === o.id && o.id !== w.id ? 'wrong' : ''}`} onClick={() => answer(o.id)}>{o.he}</button>
          ))}
          <button type="button" className="ans quiet" onClick={() => answer(null)}>{x('עוד לא מכירה', 'עוד לא מכיר')}</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Home ----------
function Home({ st, today, onStart, onSentences, onSettings, onReadTime }: { st: State; today: number; onStart: (o?: StartOpts) => void; onSentences: () => void; onSettings: () => void; onReadTime: (sec: number) => void }) {
  const plan = st.plan && st.plan.day === today && !st.plan.extra ? st.plan : null;
  const log = dayLog(st, today);
  const done = log.done;
  const canMore = newAllowance(st, today) > 0 && nextNewWords(st, 1).length > 0;
  const midBonus = !!plan?.bonus && plan.at < plan.steps.length;
  const ready = readyCount(st);
  const spellCount = spellCandidates(st, today).length;
  const preview = useMemo(() => plan ?? buildPlan(st, today), [plan?.day, st.words, today]);
  const inProgress = !!plan && plan.at > 0 && plan.at < plan.steps.length;
  const t = totals(st);
  const way = onTheWay(st);
  const count = (p: Part) => preview.steps.filter((s) => s.part === p && s.kind !== 'intro').length;
  const part = plan && inProgress ? plan.steps[plan.at].part : null;
  const lockCount = preview.consolidating ? 0 : preview.newIds.length;

  return (
    <>
      <TopBar onSettings={onSettings} />
      <h1 className="greet">{greeting(st.name)}</h1>
      <div className="next-card">
        {done ? (
          <>
            <span className="chip-d">היום הושלם</span>
            <h2>סיימת את האימון של היום</h2>
            <p>{log.fresh > 0 ? `פגשת היום ${log.fresh} מילים חדשות. ` : ''}{canMore || midBonus ? 'בא לך עוד? אפשר ללמוד עוד כמה עכשיו.' : 'יש כרגע מספיק מילים בתהליך. חדשות יגיעו ברגע שכמה מהן יתבססו.'}</p>
            {canMore || midBonus
              ? <button type="button" className="cta-d" onClick={() => onStart({ bonus: true })}>{midBonus ? 'להמשיך את הסבב' : 'עוד מילים חדשות'}</button>
              : <button type="button" className="cta-d" onClick={() => onStart({ extra: true })}>אימון חיזוק</button>}
          </>
        ) : (
          <>
            <span className="chip-d">{inProgress ? `${x('ממשיכות', 'ממשיכים')} מ${PART[part!].name}` : 'האימון של היום'}</span>
            {lockCount > 0 ? (
              <>
                <div className="hidden-tiles" dir="ltr" aria-label={`${lockCount} מילים חדשות מחכות בסוף`}>
                  {preview.newIds.map((id) => <span key={id} className="face-down" aria-hidden="true">?</span>)}
                </div>
                <h2>{lockCount} מילים חדשות מחכות לך בסוף</h2>
              </>
            ) : (
              <h2>{x('היום מבססות את המילים האחרונות', 'היום מבססים את המילים האחרונות')}</h2>
            )}
            <ol className="route">
              {PARTS.map((p) => <li key={p} className={part === p ? 'now' : ''}><b>{PART[p].name}</b><small>{count(p) || '-'} {p === 'new' ? 'מילים ומשחק' : 'קטנות'}</small></li>)}
            </ol>
            <button type="button" className="cta-d" onClick={() => onStart()}>{inProgress ? 'להמשיך' : 'להתחיל'}</button>
          </>
        )}
      </div>
      {!done && !inProgress && <button type="button" className="link center-block" onClick={() => onStart({ short: true })}>יש לי רק כמה דקות היום</button>}

      <section className={`two-meters ${HAS_SPELLING ? '' : 'solo'}`} aria-label="סיכום">
        <div><b>{t.known}</b><span>{x('מילים שאת מכירה', 'מילים שאתה מכיר')}</span>{way.r > 0 && <small>ועוד {way.r} בדרך</small>}</div>
        {HAS_SPELLING && <div><b>{t.spelled}</b><span>מילים שאת יודעת לאיית</span>{way.s > 0 && <small>ועוד {way.s} בדרך</small>}</div>}
      </section>

      {t.met > 0 && (
        <button type="button" className="sent-card" onClick={() => onStart({ extra: true })}>
          <span className="sent-txt"><b>אימון חיזוק</b><small>{log.fresh > 0 ? 'המילים של היום ועוד מילים ישנות יותר' : 'סיבוב על מילים שכבר למדת'}{t.flagged > 0 ? ` · ${t.flagged} מסומנות` : ''}</small></span>
          <span className="sent-go" aria-hidden="true">←</span>
        </button>
      )}

      {spellCount > 0 && (
        <button type="button" className="sent-card" onClick={() => onStart({ extra: true, spell: true })}>
          <span className="sent-txt"><b>אימון איות</b><small>רואים את המילה, היא נעלמת, וכותבים אותה</small></span>
          <span className="sent-go" aria-hidden="true">←</span>
        </button>
      )}

      <button type="button" className="sent-card" onClick={onSentences}>
        <span className="sent-txt"><b>אימון משפטים</b><small>{ready > 0 ? `${ready} משפטים שימושיים מהמילים ש${x('את כבר מכירה', 'אתה כבר מכיר')}` : 'משפטים שימושיים לכל יום'}</small></span>
        <span className="sent-go" aria-hidden="true">←</span>
      </button>

      {COURSE_ID === 'en' && <GrammarCard known={t.known} onTime={onReadTime} />}
      {COURSE_ID === 'en' && <EnglishReading known={t.known} onTime={onReadTime} />}
      <TodayPlan />

    </>
  );
}

// ---------- Session ----------
function Session({ st, update, onExit, onMore, onMoreNew }: { st: State; update: Update; onExit: () => void; onMore: () => void; onMoreNew: () => void }) {
  const plan = st.plan as Plan;
  const today = plan.day;
  const [shownPart, setShownPart] = useState<Part | null>(plan.at > 0 ? plan.steps[plan.at]?.part ?? null : null);
  const [retried] = useState(() => new Set<string>());
  const [combo, setCombo] = useState(0);
  const steps = plan.steps;
  const step = steps[plan.at];
  const prevDone = useRef(false);

  const advance = useCallback(() => {
    update((s) => {
      if (!s.plan) return s;
      const nextAt = s.plan.at + 1;
      const n = { ...s, plan: { ...s.plan, at: nextAt } };
      if (nextAt >= s.plan.steps.length && !s.plan.extra) {
        const log = dayLog(s, today);
        n.days = { ...s.days, [today]: { ...log, done: true } };
      }
      return n;
    });
  }, [update, today]);

  const queueRetry = useCallback((stp: Step) => {
    const key = `${stp.kind}:${stp.id}`;
    if (retried.has(key) || stp.part === 'new' || stp.kind === 'match') return;
    retried.add(key);
    // One gentle second look, later in the same part, in the easiest format. It does not count as a new mistake.
    update((s) => {
      if (!s.plan) return s;
      const lastInPart = s.plan.steps.reduce((acc, x, i) => (x.part === stp.part ? i : acc), s.plan.at);
      const retry: Step = { part: stp.part, kind: stp.kind === 'memo' || stp.kind === 'type' ? 'memo' : stp.kind === 'tiles' || stp.kind === 'gaps' ? 'gaps' : 'meaning', id: stp.id, retry: true };
      const copy = [...s.plan.steps];
      copy.splice(lastInPart + 1, 0, retry);
      return { ...s, plan: { ...s.plan, steps: copy } };
    });
  }, [update, retried]);

  const isDone = plan.at >= steps.length;
  useEffect(() => {
    if (isDone && !prevDone.current && st.settings.sound) sfx.win();
    prevDone.current = isDone;
  }, [isDone]);

  if (isDone) return <Finish st={st} plan={plan} onExit={onExit} onMore={onMore} onMoreNew={onMoreNew} />;
  if (!step) return null;

  // Moving into a new part gets a small moment, and flips a tile of what's waiting.
  if (step.part !== shownPart) return <Interlude key={step.part} st={st} plan={plan} part={step.part} onGo={() => setShownPart(step.part)} onExit={onExit} />;

  const onResult = (correct: boolean, meta: { chosen?: string; wrongAt?: number[] } = {}) => {
    const spelling = ['tiles', 'gaps', 'memo', 'type'].includes(step.kind);
    if (!step.retry) {
      update((s) => spelling
        ? recordSpelling(s, step.id, correct, today, meta.wrongAt)
        : recordRecognition(s, step.id, correct, today, step.part, meta.chosen));
      if (!correct) queueRetry(step);
    }
    setCombo((c) => (correct ? c + 1 : 0));
  };

  const partSteps = steps.filter((s) => s.part === step.part);
  const partIndex = steps.slice(0, plan.at).filter((s) => s.part === step.part).length;

  return (
    <div className="session" key={`${plan.at}`}>
      <div className="s-top">
        <button type="button" className="round" aria-label="יציאה. ההתקדמות נשמרת" onClick={onExit}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        {plan.extra ? <div className="thin grow-bar"><span style={{ width: `${(plan.at / steps.length) * 100}%` }} /></div> : <ol className="part-bar" aria-label={`חלק ${PART[step.part].name}`}>
          {PARTS.map((p) => {
            const pi = PARTS.indexOf(p), cur = PARTS.indexOf(step.part);
            const fill = pi < cur ? 100 : pi > cur ? 0 : (partIndex / partSteps.length) * 100;
            return <li key={p} className={p === step.part ? 'on' : ''}><span><i style={{ width: `${fill}%` }} /></span><small>{PART[p].name}</small></li>;
          })}
        </ol>}
        {combo >= 3 ? <span className="combo" aria-live="polite">{combo}×</span> : <span className="combo ghost" />}
      </div>
      <Exercise st={st} update={update} step={step} today={today} onResult={onResult} onNext={advance} />
    </div>
  );
}

function Interlude({ st, plan, part, onGo, onExit }: { st: State; plan: Plan; part: Part; onGo: () => void; onExit: () => void }) {
  const pi = PARTS.indexOf(part);
  const hasWarm = plan.steps.some((s) => s.part === 'warm');
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setRevealed(true); if (st.settings.sound && pi > 0) sfx.flip(); }, 350); return () => clearTimeout(t); }, []);
  const words = plan.newIds.map((id) => WORD[id]);
  const count = plan.steps.filter((s) => s.part === part && s.kind !== 'intro').length;
  const title = plan.spelling ? 'עכשיו כותבות' : plan.extra ? x('מחזקות מילים', 'מחזקים מילים') : part === 'new'
    ? plan.consolidating ? 'היום הן מקבלות עוד מבט' : 'הגעת! הנה המילים החדשות'
    : part === 'boost' ? (hasWarm ? 'יופי של חימום' : x('מתחילות בחיזוק', 'מתחילים בחיזוק')) : x('מתחממות', 'מתחממים');
  const reveal = pi === 2 ? 99 : pi;
  return (
    <div className="session interlude">
      <div className="s-top"><button type="button" className="round" aria-label="יציאה" onClick={onExit}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button></div>
      <div className="il-body">
        <span className="stage">{plan.spelling ? 'אימון איות' : plan.extra ? 'אימון חיזוק' : plan.bonus ? 'סבב נוסף' : `עצירה ${pi + 1} מתוך 3`}</span>
        <h1>{title}</h1>
        <p className="lead">{plan.spelling ? 'מילים שאת כבר מכירה. רואים, מסתירים וכותבים. טעות באיות לא פוגעת בהכרות של המילה.' : `${PART[part].next}. ${PART[part].note}.`}</p>
        {plan.extra ? null : plan.consolidating ? (
          <p className="gate-note">כשעוד כמה מילים יתבססו, יגיעו חדשות. עד אז אנחנו {x('מוודאות', 'מוודאים')} שהן נשארות איתך.</p>
        ) : (
          IS_THAI ? <div className="hidden-tiles" dir="ltr" aria-label="המילים שמחכות בסוף">{words.map((w) => <span key={w.id} className="face-down" aria-hidden="true">?</span>)}</div> : <div className="waiting" dir="ltr" aria-label="המילים שמחכות בסוף">
            {words.map((w) => (
              <div key={w.id} className="wait-word">
                {[...w.en].map((c, i) => {
                  const show = revealed && i < reveal;
                  return <span key={i} className={`mini ${show ? 'up' : ''}`}>{show ? c : ''}</span>;
                })}
              </div>
            ))}
          </div>
        )}
        {!IS_THAI && pi < 2 && !plan.consolidating && !plan.extra && !plan.bonus && <p className="small muted center">בכל עצירה נחשפת עוד אות מהמילים שמחכות לך.</p>}
      </div>
      <button type="button" className="cta" onClick={onGo}>{count > 0 ? 'קדימה' : 'ממשיכים'}</button>
    </div>
  );
}

// ---------- Exercises ----------
interface ExProps { st: State; update: Update; step: Step; today: number; onResult: (ok: boolean, m?: { chosen?: string; wrongAt?: number[] }) => void; onNext: () => void }

function Exercise(p: ExProps) {
  switch (p.step.kind) {
    case 'check': return <Check {...p} />;
    case 'intro': return <Intro {...p} />;
    case 'match': return <Match {...p} />;
    case 'tiles': case 'gaps': return <TileSpell {...p} />;
    case 'memo': case 'type': return <TypeSpell {...p} />;
    default: return <Choice {...p} />;
  }
}

function useSay(st: State) {
  return useCallback((t: string) => speak(t, { voice: st.settings.voice, rate: st.settings.rate }), [st.settings.voice, st.settings.rate]);
}

function FlagButton({ st, update, id, m }: { st: State; update: Update; id: string; m: 'r' | 's' }) {
  const on = ws(st, id)[m].flag;
  return <button type="button" className={`flag ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => update((s) => toggleFlag(s, id, m))}>{on ? 'מסומנת לחיזוק' : 'קשה לי, לסמן'}</button>;
}

function Intro({ st, step, onNext }: ExProps) {
  const w = WORD[step.id];
  const say = useSay(st);
  useEffect(() => { if (st.settings.autoSpeak) say(w.en); }, [w.id]);
  const index = (st.plan?.newIds ?? []).indexOf(w.id);
  return (
    <div className="q intro-q">
      <p className="prompt">{index >= 0 ? 'מילה חדשה' : 'עוד מבט'}</p>
      <WordFace w={w} />
      <button type="button" className="speak" onClick={() => say(w.en)} aria-label="השמעה"><SpeakIcon /></button>
      <div className="meaning">{w.he}</div>
      <RepeatCue strong />
      {w.ex && <button type="button" className="sentence" dir="ltr" lang="en" onClick={() => say(w.ex)}><span>{highlight(w.ex, w.en)}</span><span className="s-icon"><SpeakIcon /></span></button>}
      <div className="grow" />
      <button type="button" className="cta" onClick={() => { if (st.settings.sound) sfx.tap(); onNext(); }}>{x('הבנתי', 'אמרתי בקול רם')}</button>
    </div>
  );
}

function Check(p: ExProps) {
  const { st, update, step, today, onNext } = p;
  const w = WORD[step.id];
  const say = useSay(st);
  const [phase, setPhase] = useState<'ask' | 'prove' | 'intro'>('ask');
  const [picked, setPicked] = useState<string | null>(null);
  const opts = useMemo(() => options(st, w.id, 4), [w.id]);
  const left = st.plan?.steps.filter((x, i) => x.kind === 'check' && i >= (st.plan?.at ?? 0)).length ?? 1;
  useEffect(() => { if (st.settings.autoSpeak) say(w.en); }, [w.id]);

  const settle = (known: boolean) => { update((s) => resolveCheck(s, w.id, known, today)); onNext(); };
  const pick = (o: Word) => {
    if (picked) return;
    setPicked(o.id);
    const ok = o.id === w.id;
    if (st.settings.sound) (ok ? sfx.good : sfx.tap)();
    setTimeout(() => (ok ? settle(true) : setPhase('intro')), ok ? 1100 : 1300);
  };

  if (phase === 'intro') return <Intro {...p} onNext={() => settle(false)} />;
  if (phase === 'prove') return (
    <div className="q">
      <p className="prompt">{x('אם את מכירה, מה הפירוש?', 'אם אתה מכיר, מה הפירוש?')}</p>
      <button type="button" className={`word-hero as-btn ${longClass(w.en)}`} onClick={() => say(w.en)}><En>{w.en}</En></button>
      <div className="answers">
        {opts.map((o) => (
          <button key={o.id} type="button" onClick={() => pick(o)} className={`ans ${picked && o.id === w.id ? 'right' : ''} ${picked === o.id && o.id !== w.id ? 'wrong' : ''}`}>{o.he}</button>
        ))}
        {!picked && <button type="button" className="ans quiet" onClick={() => setPhase('intro')}>{x('בעצם לא בטוחה', 'בעצם לא בטוח')}</button>}
      </div>
      {picked === w.id && <div className="feedback good" role="status"><b>{x('מעולה, את כבר מכירה! מביאה מילה אחרת.', 'מעולה, אתה כבר מכיר! הנה מילה אחרת.')}</b></div>}
      {picked && picked !== w.id && <div className="feedback soft" role="status"><b>אין בעיה, נלמד אותה עכשיו.</b></div>}
    </div>
  );
  return (
    <div className="q">
      <p className="prompt">{left > 1 ? `עוד ${left} מילים` : 'מילה אחרונה'}: {x('את מכירה אותה?', 'אתה מכיר אותה?')}</p>
      <WordFace w={w} />
      <button type="button" className="speak" onClick={() => say(w.en)} aria-label="השמעה"><SpeakIcon /></button>
      <div className="answers">
        <button type="button" className="cta" onClick={() => setPhase('intro')}>חדשה לי</button>
        <button type="button" className="ans" onClick={() => setPhase('prove')}>{x('כבר מכירה', 'כבר מכיר')}</button>
      </div>
    </div>
  );
}

function highlight(text: string, word: string) {
  const re = new RegExp(`(\\b${word}\\b)`, 'i');
  return text.split(re).map((part, i) => (re.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>));
}

function Choice({ st, update, step, onResult, onNext }: ExProps) {
  const w = WORD[step.id];
  const say = useSay(st);
  const kind: Kind = step.kind === 'listen' && !canSpeak() ? 'meaning' : step.kind === 'cloze' && !w.ex ? 'reverse' : step.kind;
  const count = step.part === 'warm' || step.part === 'new' ? 3 : 4;
  const opts = useMemo(() => options(st, w.id, count), [w.id]);
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked === w.id;

  useEffect(() => { if (kind === 'listen' || (kind === 'meaning' && st.settings.autoSpeak)) say(w.en); }, [w.id]);

  const pick = (o: Word) => {
    if (picked) return;
    setPicked(o.id);
    const ok = o.id === w.id;
    if (st.settings.sound) (ok ? sfx.good : sfx.bad)();
    onResult(ok, { chosen: o.id });
    if (ok) { if (IS_THAI || (kind !== 'listen' && kind !== 'meaning' && st.settings.autoSpeak)) say(w.en); setTimeout(onNext, AFTER_RIGHT); }
    else if (IS_THAI || st.settings.autoSpeak) say(w.en);
  };

  const showEnglishAnswers = kind === 'reverse' || kind === 'cloze';
  return (
    <div className="q">
      {kind === 'meaning' && <><p className="prompt">מה פירוש המילה?</p><button type="button" className={`word-hero as-btn ${longClass(w.en)}`} onClick={() => say(w.en)}><En>{w.en}</En></button></>}
      {kind === 'reverse' && <><p className="prompt">איך אומרים {x('באנגלית', 'בתאית')}?</p><div className="word-hero he">{w.he}</div></>}
      {kind === 'listen' && <><p className="prompt">מה שמעת?</p><button type="button" className="speak big" onClick={() => say(w.en)} aria-label="השמעה"><SpeakIcon /></button>{picked && <div className="word-hero small-hero"><En>{w.en}</En></div>}</>}
      {kind === 'cloze' && <><p className="prompt">איזו מילה משלימה את המשפט?</p><div className="cloze" dir="ltr" lang="en">{picked ? highlight(w.ex, w.en) : clozeOf(w)}</div></>}
      <div className="answers" dir={showEnglishAnswers ? 'ltr' : undefined}>
        {opts.map((o) => (
          <button key={o.id} type="button" onClick={() => pick(o)}
            className={`ans ${showEnglishAnswers ? 'ans-en' : ''} ${picked && o.id === w.id ? 'right' : ''} ${picked === o.id && o.id !== w.id ? 'wrong' : ''}`}>
            {showEnglishAnswers ? o.en : o.he}
          </button>
        ))}
      </div>
      {picked && !correct && (
        <div className="feedback bad" role="status">
          <div className="fb-word"><En className="big-en">{w.en}</En><b>{w.he}</b></div>
          {w.ex && <p className="fb-ex" dir="ltr" lang="en">{highlight(w.ex, w.en)}</p>}
          <RepeatCue />
          <div className="fb-actions">
            {!step.retry && <FlagButton st={st} update={update} id={w.id} m="r" />}
            <button type="button" className="btn-next" onClick={onNext}>הבנתי</button>
          </div>
        </div>
      )}
      {picked && correct && <div className="feedback good" role="status"><b>{praise(step.id)}</b><RepeatCue /></div>}
    </div>
  );
}

/** Thai practice asks for speaking: hear it, then say it out loud. Answers wait long enough for that. */
const RepeatCue = ({ strong }: { strong?: boolean }) => (IS_THAI ? (
  <p className={`repeat-cue ${strong ? 'strong' : ''}`}>
    <svg viewBox="0 0 24 24" width={strong ? 22 : 16} height={strong ? 22 : 16} aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" /></svg>
    {strong ? 'עכשיו אמור את זה בקול רם' : 'חזור בקול רם'}
  </p>
) : null);
const AFTER_RIGHT = IS_THAI ? 2600 : 850;

const PRAISE = ['יפה!', 'בול!', 'נכון!', 'מעולה!', 'איזה יופי!', 'בדיוק!'];
const praise = (seed: string) => PRAISE[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % PRAISE.length];

function TileSpell({ st, update, step, onResult, onNext }: ExProps) {
  const w = WORD[step.id];
  const say = useSay(st);
  const word = w.en.toLowerCase();
  const kind = step.kind;
  const [set] = useState(() => tileSet(word, kind, undefined, spellLevel(ws(st, w.id).s)));
  const [used, setUsed] = useState<boolean[]>(() => set.letters.map(() => false));
  const [placed, setPlaced] = useState<string[]>(() => [...word].map((c, i) => (set.given[i] ? c : '')));
  const [shake, setShake] = useState(-1);
  const [mistakes, setMistakes] = useState<number[]>([]);
  const [slips, setSlips] = useState<{ at: number; tapped: string }[]>([]);
  const [done, setDone] = useState(false);
  const cursor = placed.findIndex((c) => !c);

  useEffect(() => { if (st.settings.autoSpeak) say(w.en); }, [w.id]);

  const tap = (i: number) => {
    if (done || used[i] || cursor < 0) return;
    const c = set.letters[i];
    if (c === word[cursor]) {
      if (st.settings.sound) sfx.tap();
      const nextPlaced = [...placed]; nextPlaced[cursor] = c;
      const nextUsed = [...used]; nextUsed[i] = true;
      setPlaced(nextPlaced); setUsed(nextUsed);
      if (nextPlaced.every(Boolean)) {
        setDone(true);
        const ok = mistakes.length === 0;
        if (st.settings.sound) (ok ? sfx.good : sfx.tap)();
        say(w.en);
        onResult(ok, { wrongAt: mistakes });
        if (ok) setTimeout(onNext, 1000);
      }
    } else {
      if (st.settings.sound) sfx.bad();
      setShake(i); setTimeout(() => setShake(-1), 380);
      if (!mistakes.includes(cursor)) setMistakes([...mistakes, cursor]);
      setSlips((x) => (x.some((y) => y.at === cursor && y.tapped === c) ? x : [...x, { at: cursor, tapped: c }]));
    }
  };

  return (
    <div className="q">
      <p className="prompt">{kind === 'gaps' ? 'השלימי את האותיות החסרות' : 'סדרי את האותיות למילה'}</p>
      <div className="word-hero he medium">{w.he}</div>
      <button type="button" className="speak" onClick={() => say(w.en)} aria-label="השמעה"><SpeakIcon /></button>
      <div className="slots" dir="ltr">
        {placed.map((c, i) => c
          ? <Tile key={i} ch={c} small={word.length > 8} state={`${set.given[i] ? 'given' : 'set'} ${done && mistakes.includes(i) ? 'missed' : ''}`} />
          : <span key={i} className={`slot ${word.length > 8 ? 'small' : ''} ${i === cursor ? 'cur' : ''}`} />)}
      </div>
      {!done && <div className="tray" dir="ltr">
        {set.letters.map((c, i) => <Tile key={i} ch={c} state={`${used[i] ? 'gone' : ''} ${shake === i ? 'shake' : ''}`} onClick={() => tap(i)} disabled={used[i]} />)}
      </div>}
      {done && mistakes.length === 0 && <div className="feedback good" role="status"><b>{praise(step.id)}</b></div>}
      {done && mistakes.length > 0 && (
        <div className="feedback soft" role="status">
          <b>בנית אותה עד הסוף.</b>
          <ul className="slips">{slips.map((x) => <li key={`${x.at}${x.tapped}`}>במקום <En className="slip-right">{word[x.at]}</En> לחצת על <En className="slip-wrong">{x.tapped}</En></li>)}</ul>
          <div className="fb-actions">{!step.retry && <FlagButton st={st} update={update} id={w.id} m="s" />}<button type="button" className="btn-next" onClick={onNext}>הבנתי</button></div>
        </div>
      )}
    </div>
  );
}

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function TypeSpell({ st, update, step, onResult, onNext }: ExProps) {
  const w = WORD[step.id];
  const say = useSay(st);
  const [text, setText] = useState('');
  const [wrong, setWrong] = useState<number[] | null>(null);
  const [looking, setLooking] = useState(step.kind === 'memo');
  const [given] = useState(() => (step.kind === 'memo' ? givenLetters(w.en, spellLevel(ws(st, w.id).s)) : [...w.en].map(() => false)));
  const open = useMemo(() => given.flatMap((g, i) => (g ? [] : [i])), [given]);
  const merged = [...w.en].map((c, i) => { if (given[i]) return c; const k = open.indexOf(i); return text[k] ?? ''; }).join('');
  const done = wrong !== null;
  const badTyped = done ? spellAlign(w.en, merged).typed : [];

  useEffect(() => { say(w.en); }, [w.id]);

  const key = (c: string) => { if (done || looking) return; if (st.settings.sound) sfx.tap(); setText((t) => (t.length < open.length ? t + c : t)); };
  const back = () => { if (!done && !looking) setText((t) => t.slice(0, -1)); };
  const check = () => {
    if (done || looking || text.length < open.length) return;
    const d = spellDiff(w.en, merged);
    setWrong(d);
    const ok = d.length === 0;
    if (st.settings.sound) (ok ? sfx.good : sfx.bad)();
    say(w.en);
    onResult(ok, { wrongAt: d });
    if (ok) setTimeout(onNext, 1000);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) key(e.key.toLowerCase());
      else if (e.key === 'Backspace') back();
      else if (e.key === 'Enter') { if (looking) setLooking(false); else if (done) { if (wrong?.length) onNext(); } else check(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (looking) return (
    <div className="q">
      <p className="prompt">הסתכלי טוב על המילה</p>
      <div className="flip-in tiles-row" dir="ltr">{[...w.en].map((c, i) => <Tile key={i} ch={c} state="pop" small={w.en.length > 8} />)}</div>
      <button type="button" className="speak" onClick={() => say(w.en)} aria-label="השמעה"><SpeakIcon /></button>
      <div className="meaning">{w.he}</div>
      <div className="grow" />
      <button type="button" className="cta" onClick={() => { if (st.settings.sound) sfx.flip(); setLooking(false); }}>זכרתי, להסתיר</button>
    </div>
  );

  return (
    <div className="q">
      <p className="prompt">{step.kind === 'memo' ? (open.length < w.en.length ? 'השלימי את האותיות החסרות' : 'עכשיו כתבי אותה') : 'כתבי את המילה ששמעת'}</p>
      <div className="word-hero he medium">{w.he}</div>
      <button type="button" className="speak" onClick={() => say(w.en)} aria-label="השמעה"><SpeakIcon /></button>
      <div className={`typed ${done ? (wrong!.length ? 'is-bad' : 'is-good') : ''}`} dir="ltr" aria-live="polite">
        {[...w.en].map((_, i) => <span key={i} className={`ln ${given[i] ? 'given' : ''} ${!done && i === open[text.length] ? 'cur' : ''} ${done && badTyped.includes(i) ? 'bad' : ''}`}>{given[i] ? w.en[i] : text[open.indexOf(i)] ?? ''}</span>)}
      </div>
      {done && wrong!.length > 0 && (
        <div className="feedback soft" role="status">
          <div className="correct-word" dir="ltr">{[...w.en].map((c, i) => <Tile key={i} ch={c} small state={wrong!.includes(i) ? 'missed' : ''} />)}</div>
          <p className="small">למעלה מה שכתבת, וכאן המילה הנכונה. האותיות הצבועות הן ההבדל. ההכרות של המילה לא נפגעת.</p>
          <div className="fb-actions"><FlagButton st={st} update={update} id={w.id} m="s" /><button type="button" className="btn-next" onClick={onNext}>הבנתי</button></div>
        </div>
      )}
      {done && !wrong!.length && <div className="feedback good" role="status"><b>{praise(step.id)}</b></div>}
      {!done && (
        <div className="kbd" dir="ltr">
          {ROWS.map((r, i) => (
            <div key={r} className="krow">
              {[...r].map((c) => <button key={c} type="button" className="k" onClick={() => key(c)}>{c}</button>)}
              {i === 2 && <button type="button" className="k wide" onClick={back} aria-label="מחיקה">⌫</button>}
            </div>
          ))}
          <button type="button" className="cta kcheck" disabled={text.length < open.length} onClick={check}>בדיקה</button>
        </div>
      )}
    </div>
  );
}

function Match({ st, step, onNext }: ExProps) {
  const ids = step.ids ?? [];
  const say = useSay(st);
  const [left] = useState(() => [...ids].sort(() => Math.random() - 0.5));
  const [right] = useState(() => [...ids].sort(() => Math.random() - 0.5));
  const [en, setEn] = useState<string | null>(null);
  const [he, setHe] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [miss, setMiss] = useState<string[]>([]);

  const attempt = (a: string | null, b: string | null) => {
    if (!a || !b) return;
    if (a === b) {
      if (st.settings.sound) sfx.good();
      const next = [...done, a];
      setDone(next); setEn(null); setHe(null);
      if (next.length === ids.length) setTimeout(onNext, 700);
    } else {
      if (st.settings.sound) sfx.bad();
      setMiss([a, b]);
      setTimeout(() => { setMiss([]); setEn(null); setHe(null); }, 450);
    }
  };

  return (
    <div className="q">
      <p className="prompt">{x('התאימי זוגות', 'התאם זוגות')}</p>
      <div className="match">
        <div className="col" dir="ltr">
          {left.map((id) => (
            <button key={id} type="button" disabled={done.includes(id)} onClick={() => { say(WORD[id].en); setEn(id); attempt(id, he); }}
              className={`m ans-en ${en === id ? 'sel' : ''} ${done.includes(id) ? 'ok' : ''} ${miss[0] === id ? 'no' : ''}`}>{WORD[id].en}</button>
          ))}
        </div>
        <div className="col">
          {right.map((id) => (
            <button key={id} type="button" disabled={done.includes(id)} onClick={() => { setHe(id); attempt(en, id); }}
              className={`m ${he === id ? 'sel' : ''} ${done.includes(id) ? 'ok' : ''} ${miss[1] === id ? 'no' : ''}`}>{WORD[id].he}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Finish ----------
function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = ref.current!, x = c.getContext('2d');
    if (!x) return;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const colors = ['#ffc83d', '#ff7a59', '#57c785', '#fffef3'];
    const bits = Array.from({ length: 70 }, () => ({ x: Math.random() * c.width, y: -Math.random() * c.height * 0.6, s: 7 + Math.random() * 7, v: 2 + Math.random() * 3, r: Math.random() * 6, w: Math.random() * 0.2 - 0.1, c: colors[Math.floor(Math.random() * 4)] }));
    let raf = 0; const start = performance.now();
    const tick = (t: number) => {
      x.clearRect(0, 0, c.width, c.height);
      for (const b of bits) { b.y += b.v; b.r += b.w; x.save(); x.translate(b.x, b.y); x.rotate(b.r); x.fillStyle = b.c; x.fillRect(-b.s / 2, -b.s / 2, b.s, b.s); x.restore(); }
      if (t - start < 3200) raf = requestAnimationFrame(tick); else x.clearRect(0, 0, c.width, c.height);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}

function Finish({ st, plan, onExit, onMore, onMoreNew }: { st: State; plan: Plan; onExit: () => void; onMore: () => void; onMoreNew: () => void }) {
  // A finished practice is a whole point: the progress goes to the person's other devices.
  useEffect(() => { pushProgress(); }, []);
  const log = dayLog(st, plan.day);
  const total = log.rOk + log.rNo + log.sOk + log.sNo;
  const pct = total ? Math.round(((log.rOk + log.sOk) / total) * 100) : 100;
  const point = plan.flagged[0] ? WORD[plan.flagged[0]] : null;
  const say = useSay(st);
  const [share, setShare] = useState(false);
  const stepped = steppedToday(st, plan.day);
  const canMore = !plan.extra && newAllowance(st, plan.day) > 0 && nextNewWords(st, 1).length > 0;
  return (
    <div className="session finish">
      <Confetti />
      <span className="stage">{plan.spelling ? 'אימון איות' : plan.extra ? 'אימון חיזוק' : plan.bonus ? 'סבב נוסף' : 'סיימת את שלוש העצירות'}</span>
      <h1>{pct >= 85 ? `${x('אלופה', 'אלוף')}, ${st.name}!` : `כל הכבוד שהגעת עד הסוף, ${st.name}!`}</h1>
      {plan.newIds.length > 0 && !plan.consolidating && (
        <section className="fresh-shelf">
          <h3>מילים חדשות שפגשת היום</h3>
          <div className="shelf">
            {plan.newIds.map((id) => <button key={id} type="button" className="shelf-w" onClick={() => say(WORD[id].en)}><En>{WORD[id].en}</En><small>{WORD[id].he}</small></button>)}
          </div>
        </section>
      )}
      {plan.alreadyKnown.length > 0 && <p className="one-point">התברר ש{x('את כבר מכירה', 'אתה כבר מכיר')}: {plan.alreadyKnown.map((id, i) => <span key={id}>{i > 0 ? ', ' : ''}<En>{WORD[id].en}</En></span>)}. נחזור לזה בחימום בהמשך.</p>}
      <p className="one-point">היום: <b>{studyTimeLabel(studySeconds(st, plan.day, plan.day), questionCount(st, plan.day, plan.day))}</b> של למידה, <b>{questionCount(st, plan.day, plan.day)}</b> שאלות.</p>
      <section className={`results-grid ${HAS_SPELLING ? '' : 'one'}`}>
        <div><b>{log.rOk + log.rNo ? Math.round((log.rOk / (log.rOk + log.rNo)) * 100) : '-'}{log.rOk + log.rNo ? '%' : ''}</b><span>דיוק בהכרות</span></div>
        {HAS_SPELLING && <div><b>{log.sOk + log.sNo ? Math.round((log.sOk / (log.sOk + log.sNo)) * 100) : '-'}{log.sOk + log.sNo ? '%' : ''}</b><span>דיוק באיות</span></div>}
      </section>
      {(plan.gained.r.length > 0 || plan.gained.s.length > 0) && (
        <p className="gain">{plan.gained.r.length > 0 && <>התבססו {plan.gained.r.length} מילים. </>}{plan.gained.s.length > 0 && <>{plan.gained.s.length} מילים עלו באיות.</>}</p>
      )}
      {(stepped.r > 0 || stepped.s > 0) && <p className="gain">{HAS_SPELLING ? `היום התקדמו ${stepped.r} מילים בהכרות ו-${stepped.s} באיות.` : `היום התקדמו ${stepped.r} מילים.`}</p>}
      <p className="small muted">מילה עולה שלב אחד ביום, ונספרת כמבוססת אחרי 3 ימי הצלחה שונים. ככה היא נשארת בזיכרון.</p>
      {point && <p className="one-point">נקודה אחת למחר: <En>{point.en}</En> ({point.he}). היא תחזור בחיזוק.</p>}
      <div className="grow" />
      {canMore && <button type="button" className="cta" onClick={onMoreNew}>עוד מילים חדשות</button>}
      <button type="button" className={canMore ? 'ans' : 'cta'} onClick={onExit}>סיום</button>
      <button type="button" className="link center-block" onClick={() => setShare(true)}>שליחת סיכום בתמונה</button>
      {share && <ShareSheet st={st} today={plan.day} onClose={() => setShare(false)} />}
      <button type="button" className="link center-block" onClick={onMore}>{plan.spelling ? 'עוד סיבוב איות' : plan.extra ? 'עוד סיבוב חיזוק' : 'אימון חיזוק'}</button>
    </div>
  );
}

// ---------- Path ----------
function PathScreen({ st, onWord }: { st: State; onWord: (id: string) => void }) {
  const cur = currentLevel(st);
  const [open, setOpen] = useState<number | null>(cur);
  return (
    <>
      <header className="page-head"><h1>המסע</h1><p className="muted">{x(`${LEVELS.length} תחנות, מהקל לקשה.`, `${LEVELS.length} תחנות, לפי נושאים.`)} תחנה נחשבת כשרוב המילים בה מבוססות.</p></header>
      <ol className="stations">
        {LEVELS.map((l, i) => {
          const s = levelStats(st, i);
          const pct = Math.round((s.known / s.all) * 100);
          const state = i === cur ? 'now' : pct >= 80 ? 'done' : i > cur ? 'ahead' : 'past';
          return (
            <li key={l.name} className={`station ${state}`}>
              <button type="button" className="st-head" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span className="st-num">{i + 1}</span>
                <span className="st-txt"><b>{l.name}</b><small>{l.blurb}{l.cefr ? ` · ${l.cefr}` : ''}</small>
                  <span className="double-bar"><span className="b-r" style={{ width: `${pct}%` }} /><span className="b-s" style={{ width: `${(s.spelled / s.all) * 100}%` }} /></span></span>
                <span className="st-count"><b>{s.known}</b>/{s.all}</span>
              </button>
              {open === i && <WordGrid st={st} level={i} onWord={onWord} />}
            </li>
          );
        })}
      </ol>
      {HAS_SPELLING && <div className="legend"><span><i className="dot r" />הכרות</span><span><i className="dot s" />איות</span></div>}
    </>
  );
}

function WordGrid({ st, level, onWord }: { st: State; level: number; onWord: (id: string) => void }) {
  return (
    <div className={`grid ${IS_THAI ? 'phrases' : ''}`} dir="ltr">
      {WORDS.filter((w) => w.level === level).map((w) => {
        const s = ws(st, w.id);
        return (
          <button key={w.id} type="button" className={`cell ${isMet(s) ? '' : 'unseen'}`} onClick={() => onWord(w.id)} title={w.he}>
            <span className="c-en">{isMet(s) ? w.en : '•'.repeat(Math.min(w.en.length, 6))}</span>
            <span className="pair"><Pips n={s.r.box} flag={s.r.flag} kind="r" />{HAS_SPELLING && <Pips n={s.s.box} flag={s.s.flag} kind="s" />}</span>
          </button>
        );
      })}
    </div>
  );
}
const Pips = ({ n, flag, kind }: { n: number; flag: boolean; kind: 'r' | 's' }) => <i className={`pip ${kind} l${Math.min(n, 3)} ${flag ? 'flagged' : ''}`} />;

// ---------- Progress ----------
function Progress({ st, today, onWord }: { st: State; today: number; onWord: (id: string) => void }) {
  const [share, setShare] = useState(false);
  const t = totals(st);
  const hard = hardWords(st);
  const traps = topTraps(st);
  const conf = topConfusions(st);
  const days = Array.from({ length: 14 }, (_, i) => today - 13 + i);
  const max = Math.max(4, ...days.map((d) => { const l = st.days[d]; return l ? l.rOk + l.rNo + l.sOk + l.sNo : 0; }));
  const maxTrap = Math.max(1, ...traps.map((x) => x.count));
  const learning = WORDS.filter((w) => isLearning(ws(st, w.id))).length;
  const spellMeasuredCount = WORDS.filter((w) => spellMeasured(ws(st, w.id))).length;

  return (
    <>
      <header className="page-head"><h1>התקדמות</h1></header>
      <section className={`meters ${HAS_SPELLING ? '' : 'solo'}`}>
        <div className="meter r"><span className="m-name">הכרות</span><b>{t.known}</b><small>מילים מבוססות מתוך {t.all}</small>
          <div className="m-bar"><span style={{ width: `${(t.known / t.all) * 100}%` }} /></div><small>{learning} בתהליך</small></div>
        {HAS_SPELLING && <div className="meter s"><span className="m-name">איות</span><b>{t.spelled}</b><small>מילים מבוססות מתוך {t.all}</small>
          <div className="m-bar"><span style={{ width: `${(t.spelled / t.all) * 100}%` }} /></div><small>{spellMeasuredCount} נבדקו</small></div>}
      </section>

      <button type="button" className="sent-card" onClick={() => setShare(true)}>
        <span className="sent-txt"><b>שליחת סיכום בתמונה</b><small>סיכום יומי או שבועי לוואטסאפ, כולל זמן הלמידה</small></span>
        <span className="sent-go" aria-hidden="true">←</span>
      </button>
      {share && <ShareSheet st={st} today={today} onClose={() => setShare(false)} />}

      <section className="card">
        <div className="row-between"><h3>משפטים</h3><span className="chip">{sentencesKnown(st)}/{SENTENCES.length}</span></div>
        <div className="gauge"><span style={{ width: `${(sentencesKnown(st) / SENTENCES.length) * 100}%` }} /></div>
        <p className="small muted">{readyCount(st)} משפטים בנויים רק ממילים ש{x('את כבר מכירה', 'אתה כבר מכיר')}.</p>
      </section>

      <section className="card pace">
        <div className="row-between"><h3>קצב המילים החדשות</h3><span className="chip">{learning}/{LEARNING_CAP}</span></div>
        <div className="gauge"><span style={{ width: `${Math.min(100, (learning / LEARNING_CAP) * 100)}%` }} /></div>
        <p className="small muted">{learning >= LEARNING_CAP ? 'יש כרגע מספיק מילים בתהליך. חדשות יגיעו ברגע שכמה יתבססו.' : x('כשפחות מילים בתהליך, מגיעות יותר חדשות. האיות לא משפיע על הקצב.', 'כשפחות מילים בתהליך, מגיעות יותר חדשות.')}</p>
      </section>

      <section className="card">
        <h3>14 הימים האחרונים</h3>
        <div className="bars" aria-label="תשובות ביום" dir="ltr">
          {days.map((d) => {
            const l = st.days[d];
            const r = l ? l.rOk + l.rNo : 0, s = l ? l.sOk + l.sNo : 0;
            return <div key={d} className={`bar-col ${d === today ? 'today' : ''}`} title={`${r + s} תשובות`}><span className="b-s" style={{ height: `${(s / max) * 100}%` }} /><span className="b-r" style={{ height: `${(r / max) * 100}%` }} /></div>;
          })}
        </div>
        {HAS_SPELLING && <div className="legend"><span><i className="dot r" />הכרות</span><span><i className="dot s" />איות</span></div>}
      </section>

      <h2 className="eyebrow">נקודות קושי</h2>
      {hard.length === 0 && traps.length === 0 && <section className="card empty"><p>עדיין אין נקודות קושי. אחרי כמה ימי אימון נראה כאן מה כדאי לחזק.</p></section>}
      {hard.length > 0 && (
        <section className="card">
          <h3>המילים שמאתגרות</h3>
          <ul className="hard">
            {hard.map(({ w, s }) => (
              <li key={w.id}><button type="button" onClick={() => onWord(w.id)}>
                <En>{w.en}</En><span className="muted">{w.he}</span>
                {HAS_SPELLING && <span className="tags">{s.r.flag && <em className="tag r">הכרות</em>}{s.s.flag && <em className="tag s">איות</em>}</span>}
              </button></li>
            ))}
          </ul>
        </section>
      )}
      {traps.length > 0 && (
        <section className="card">
          <h3>מלכודות איות</h3>
          <ul className="traps">
            {traps.map((x) => (
              <li key={x.id}><div className="row-between"><b>{x.name}</b><En className="small muted">{x.hint}</En></div>
                <div className="gauge"><span style={{ width: `${(x.count / maxTrap) * 100}%` }} /></div></li>
            ))}
          </ul>
        </section>
      )}
      {conf.length > 0 && (
        <section className="card">
          <h3>מילים שמתבלבלות</h3>
          <ul className="hard">{conf.map((c) => <li key={c.a.id + c.b.id}><div className="conf"><En>{c.a.en}</En><span className="muted">עם</span><En>{c.b.en}</En></div></li>)}</ul>
        </section>
      )}
    </>
  );
}

// ---------- Words ----------
function WordsScreen({ st, onWord }: { st: State; onWord: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'flag' | 'known'>('all');
  const list = WORDS.filter((w) => isMet(ws(st, w.id)))
    .filter((w) => {
      const s = ws(st, w.id);
      if (filter === 'flag') return s.r.flag || s.s.flag;
      if (filter === 'known') return isKnown(s);
      return true;
    })
    .filter((w) => !q || w.en.includes(q.toLowerCase()) || w.he.includes(q) || (IS_THAI && searchable(w.en).includes(searchable(q))))
    .sort((a, b) => (ws(st, b.id).met ?? 0) - (ws(st, a.id).met ?? 0) || b.order - a.order);
  return (
    <>
      <header className="page-head"><h1>המילים שלי</h1></header>
      <input id="search" className="input" placeholder={x('חיפוש בעברית או באנגלית', 'חיפוש בעברית או בתעתיק')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="seg" role="group">
        {([['all', 'הכול'], ['flag', 'לחיזוק'], ['known', 'מבוססות']] as const).map(([k, t]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{t}</button>)}
      </div>
      {list.length === 0 && <p className="muted center pad">{filter === 'flag' ? 'אין כרגע מילים לחיזוק. יופי!' : 'לא נמצאו מילים.'}</p>}
      <ul className="word-list">
        {list.slice(0, 200).map((w) => {
          const s = ws(st, w.id);
          return (
            <li key={w.id}><button type="button" onClick={() => onWord(w.id)}>
              <span className="wl-he">{w.he}</span>
              <span className="pair"><Pips n={s.r.box} flag={s.r.flag} kind="r" />{HAS_SPELLING && <Pips n={s.s.box} flag={s.s.flag} kind="s" />}</span>
              <En className="wl-en">{w.en}</En>
            </button></li>
          );
        })}
      </ul>
      {list.length > 200 && <p className="muted center small pad">מוצגות 200 מילים. אפשר לחפש כדי למצוא מילה מסוימת.</p>}
    </>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h2>{title}</h2><button type="button" className="round" aria-label="סגירה" onClick={onClose}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button></div>
        {children}
      </div>
    </div>
  );
}

function WordSheet({ st, update, id, onClose }: { st: State; update: Update; id: string; onClose: () => void }) {
  const w = WORD[id];
  const s = ws(st, id);
  const say = useSay(st);
  if (!isMet(s)) return <Sheet title="מילה שמחכה" onClose={onClose}><p className="muted">את המילה הזו עוד לא פגשת. היא תיחשף כש{x('תגיעי', 'תגיע')} אליה.</p></Sheet>;
  return (
    <Sheet title={w.he} onClose={onClose}>
      <button type="button" className="sheet-word" onClick={() => say(w.en)}><En>{w.en}</En><SpeakIcon /></button>
      {w.ex && <button type="button" className="sentence" dir="ltr" lang="en" onClick={() => say(w.ex)}><span>{highlight(w.ex, w.en)}</span></button>}
      <div className={`sheet-m ${HAS_SPELLING ? '' : 'solo'}`}>
        <div><span>הכרות</span><b>{label(s.r)}</b><small>{s.r.ok} נכון · {s.r.no} טעויות</small><FlagButton st={st} update={update} id={id} m="r" /></div>
        {HAS_SPELLING && <div><span>איות</span><b>{label(s.s, spellMeasured(s) || s.s.flag)}</b><small>{s.s.ok} נכון · {s.s.no} טעויות</small><FlagButton st={st} update={update} id={id} m="s" /></div>}
      </div>
      {HAS_SPELLING && spellKnown(s) && isKnown(s) && <p className="small muted center">שני המדדים מבוססים. מעולה!</p>}
    </Sheet>
  );
}

// ---------- Settings ----------
function Settings({ st, update, onClose }: { st: State; update: Update; onClose: () => void }) {
  const [msg, setMsg] = useState('');
  const set = (patch: Partial<State['settings']>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const voices = IS_THAI ? [] : englishVoices();
  const backup = () => {
    try {
      const blob = new Blob([JSON.stringify({ ...st, course: COURSE_ID })], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `wordflow-${COURSE_ID}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setMsg('הגיבוי נשמר בקובץ.');
    } catch { setMsg('לא הצלחתי לשמור קובץ במכשיר הזה.'); }
  };
  const restore = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.v !== 1 || !data.words || (data.course ?? 'en') !== COURSE_ID) throw new Error('bad');
      update(() => repairPlans(data));
      setMsg('הגיבוי שוחזר.');
    } catch { setMsg(`הקובץ הזה אינו גיבוי של ${COURSES.find((c) => c.id === COURSE_ID)!.name} ב-WordFlow.`); }
  };
  const audio = <>
    <Toggle id="s2" label="הקראה אוטומטית של מילים" checked={st.settings.autoSpeak} onChange={(v) => set({ autoSpeak: v })} />
    {voices.length > 1 && <div className="st-row"><label htmlFor="vc">קול</label>
      <select id="vc" dir="ltr" value={st.settings.voice} onChange={(e) => { set({ voice: e.target.value }); speak('Hello, this is my voice', { voice: e.target.value, rate: st.settings.rate }); }}>
        <option value="">אוטומטי</option>
        {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
      </select></div>}
    {IS_THAI ? <ToneNote /> : <><label htmlFor="rt">מהירות הקראה</label>
      <input id="rt" type="range" min="0.6" max="1.1" step="0.1" value={st.settings.rate} onChange={(e) => { set({ rate: +e.target.value }); speak('listen', { voice: st.settings.voice, rate: +e.target.value }); }} /></>}
  </>;
  return (
    <SettingsSheet onClose={onClose} sound={{ on: st.settings.sound, set: (v) => set({ sound: v }) }} audio={audio}
      onReset={() => update(() => ({ ...load(), words: {}, sentences: {}, days: {}, plan: null, traps: {}, confusions: {}, onboarded: false }))}>
      {!USER_NAME && <><label className="field" htmlFor="n2">שם</label><input id="n2" className="input" value={st.name} onChange={(e) => update((s) => ({ ...s, name: e.target.value }))} /></>}
      <p className="cs-note">גיבוי: ההתקדמות נשמרת רק במכשיר הזה. קובץ גיבוי מעביר אותה למכשיר אחר.</p>
      <div className="cs-row"><button type="button" className="st-btn" onClick={backup}>שמירת גיבוי</button>
        <label className="st-btn" htmlFor="restore" style={{ display: 'inline-flex', alignItems: 'center' }}>שחזור מקובץ</label><input id="restore" type="file" accept="application/json" hidden onChange={(e) => restore(e.target.files?.[0])} /></div>
      {msg && <p className="cs-note" role="status">{msg}</p>}
    </SettingsSheet>
  );
}

// ---------- Sentences ----------
const clean = (t: string) => (t === 'i' ? 'I' : t.startsWith("i'") ? `I${t.slice(1)}` : t);

function SentenceSession({ st, update, today, onExit }: { st: State; update: Update; today: number; onExit: () => void }) {
  const [queue, setQueue] = useState<{ s: Sentence; kind: 'meaning' | 'build' | 'ear'; retry?: boolean }[]>(() =>
    sentencePlan(st, today).map((s) => ({ s, kind: sentenceKind(metricOf(st, s.id)) })));
  const [at, setAt] = useState(0);
  const [score, setScore] = useState({ ok: 0, all: 0 });
  const item = queue[at];

  useEffect(() => { if (at >= queue.length) { pushProgress(); if (st.settings.sound) sfx.win(); } }, [at, queue.length]);

  if (!item) return (
    <div className="session finish">
      <Confetti />
      <span className="stage">אימון משפטים</span>
      <h1>{score.all > 0 && score.ok / score.all >= 0.8 ? x('כבר מדברת!', 'כבר מדבר!') : 'כל משפט מקרב אותך'}</h1>
      <section className="results-grid one"><div><b>{score.ok}/{score.all}</b><span>משפטים נכונים בניסיון הראשון</span></div></section>
      <div className="grow" />
      <button type="button" className="cta" onClick={onExit}>סיום</button>
    </div>
  );

  const result = (ok: boolean) => {
    if (item.retry) return;
    update((x) => recordSentence(x, item.s.id, ok, today));
    setScore((c) => ({ ok: c.ok + (ok ? 1 : 0), all: c.all + 1 }));
    if (!ok) setQueue((q) => [...q, { s: item.s, kind: 'meaning', retry: true }]);
  };

  return (
    <div className="session" key={at}>
      <div className="s-top">
        <button type="button" className="round" aria-label="יציאה" onClick={onExit}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg></button>
        <div className="thin grow-bar"><span style={{ width: `${(at / queue.length) * 100}%` }} /></div>
        <span className="topic">{TOPICS[item.s.topic]}</span>
      </div>
      {item.kind === 'meaning'
        ? <SentenceMeaning st={st} s={item.s} onResult={result} onNext={() => setAt(at + 1)} />
        : <SentenceBuild st={st} s={item.s} ear={item.kind === 'ear' && canSpeak()} onResult={result} onNext={() => setAt(at + 1)} />}
    </div>
  );
}

function UnknownHint({ st, s }: { st: State; s: Sentence }) {
  const list = unknownWords(st, s);
  if (!list.length) return null;
  return <p className="hint-words">{list.length === 1 ? 'מילה שעוד לא התבססה: ' : 'מילים שעוד לא התבססו: '}{list.map((w, i) => <span key={w.id}>{i > 0 ? ' · ' : ''}<En>{w.en}</En> = {w.he}</span>)}</p>;
}

interface SentProps { st: State; s: Sentence; onResult: (ok: boolean) => void; onNext: () => void }

function SentenceMeaning({ st, s, onResult, onNext }: SentProps) {
  const say = useSay(st);
  const [picked, setPicked] = useState<string | null>(null);
  const opts = useMemo(() => {
    const others = SENTENCES.filter((o) => o.id !== s.id && o.he !== s.he);
    const near = others.filter((o) => o.topic === s.topic);
    const same = (near.length >= 2 ? near : others).sort(() => Math.random() - 0.5).slice(0, 2);
    return [s, ...same].sort(() => Math.random() - 0.5);
  }, [s.id]);
  useEffect(() => { if (st.settings.autoSpeak) say(s.en); }, [s.id]);
  const pick = (o: Sentence) => {
    if (picked) return;
    setPicked(o.id);
    const ok = o.id === s.id;
    if (st.settings.sound) (ok ? sfx.good : sfx.bad)();
    onResult(ok);
    if (IS_THAI) say(s.en);
    if (ok) setTimeout(onNext, IS_THAI ? 3000 : 1000);
  };
  return (
    <div className="q">
      <p className="prompt">מה פירוש המשפט?</p>
      <button type="button" className="sentence-hero" dir="ltr" lang="en" onClick={() => say(s.en)}>{s.en}<span className="s-icon"><SpeakIcon /></span></button>
      <UnknownHint st={st} s={s} />
      <div className="answers">
        {opts.map((o) => <button key={o.id} type="button" onClick={() => pick(o)} className={`ans ${picked && o.id === s.id ? 'right' : ''} ${picked === o.id && o.id !== s.id ? 'wrong' : ''}`}>{o.he}</button>)}
      </div>
      {picked && picked !== s.id && <div className="feedback soft" role="status"><div className="fb-actions"><b>הפירוש מסומן בירוק.</b><button type="button" className="btn-next" onClick={onNext}>הבנתי</button></div></div>}
      {picked && picked !== s.id && <RepeatCue />}
      {picked === s.id && <div className="feedback good" role="status"><b>{praise(s.id)}</b><RepeatCue /></div>}
    </div>
  );
}

function SentenceBuild({ st, s, ear, onResult, onNext }: SentProps & { ear: boolean }) {
  const say = useSay(st);
  const target = useMemo(() => tokens(s.en).map(clean), [s.id]);
  const [pool] = useState(() => target.map((t, i) => ({ t, i })).sort(() => Math.random() - 0.5));
  const [placed, setPlaced] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  useEffect(() => { if (ear || st.settings.autoSpeak) say(s.en); }, [s.id]);
  const text = (i: number) => pool.find((p) => p.i === i)!.t;
  const tap = (i: number) => {
    if (verdict !== null) return;
    if (st.settings.sound) sfx.tap();
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === target.length) {
      const ok = next.every((n, k) => text(n) === target[k]);
      setVerdict(ok);
      if (st.settings.sound) (ok ? sfx.good : sfx.bad)();
      say(s.en);
      onResult(ok);
      if (ok) setTimeout(onNext, IS_THAI ? 3000 : 1300);
    }
  };
  return (
    <div className="q">
      <p className="prompt">{ear ? x('הקשיבי והרכיבי את המשפט', 'הקשב והרכב את המשפט') : x('הרכיבי את המשפט באנגלית', 'הרכב את המשפט בתאית')}</p>
      {(!ear || verdict !== null) && <div className="word-hero he sentence-he">{s.he}</div>}
      <button type="button" className={`speak ${ear ? 'big ear' : ''}`} onClick={() => say(s.en)} aria-label="השמעה"><SpeakIcon /></button>
      {!ear && <UnknownHint st={st} s={s} />}
      <div className={`line ${verdict === true ? 'is-good' : verdict === false ? 'is-bad' : ''}`} dir="ltr" lang="en">
        {placed.map((i) => <button key={i} type="button" className="chip-w set" onClick={() => { if (verdict === null) setPlaced(placed.filter((x) => x !== i)); }}>{text(i)}</button>)}
      </div>
      {verdict === null && <div className="chips" dir="ltr" lang="en">
        {pool.map((p) => <button key={p.i} type="button" className={`chip-w ${placed.includes(p.i) ? 'gone' : ''}`} disabled={placed.includes(p.i)} onClick={() => tap(p.i)}>{p.t}</button>)}
      </div>}
      {verdict === true && <div className="feedback good" role="status"><b>{praise(s.id)}</b><RepeatCue /></div>}
      {verdict === false && (
        <div className="feedback soft" role="status">
          <p className="fb-ex big" dir="ltr" lang="en">{s.en}</p>
          <RepeatCue />
          <div className="fb-actions"><span className="small">כך נראה המשפט הנכון.</span><button type="button" className="btn-next" onClick={onNext}>הבנתי</button></div>
        </div>
      )}
    </div>
  );
}

// ---------- Share progress ----------
function ShareSheet({ st, today, onClose }: { st: State; today: number; onClose: () => void }) {
  type Choice = 'today' | 'yesterday' | 'week';
  const asked = (d: number) => questionCount(st, d, d) > 0;
  // In the morning today is still empty, so the summary opens on the day she last practiced.
  const [choice, setChoice] = useState<Choice>(!asked(today) && asked(today - 1) ? 'yesterday' : 'today');
  const period: Period = choice === 'week' ? 'week' : 'day';
  const endDay = choice === 'yesterday' ? today - 1 : today;
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState('');
  const report = useMemo(() => buildReport(st, endDay, period), [period, endDay]);

  // The image is ready before the tap, because phones only allow sharing directly from a tap.
  useEffect(() => {
    let live = true; let made = '';
    setBlob(null); setMsg('');
    drawReport(report).then(toBlob).then((b) => {
      if (!live) return;
      made = URL.createObjectURL(b); setBlob(b); setUrl(made);
    }).catch(() => { if (live) setMsg('לא הצלחתי ליצור את התמונה במכשיר הזה.'); });
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [report]);

  const save = () => {
    if (!url) return;
    const a = document.createElement('a'); a.href = url; a.download = fileName(report); a.click();
    setMsg('התמונה נשמרה. אפשר לצרף אותה בוואטסאפ.');
  };
  const send = async () => {
    if (!blob) return;
    const file = new File([blob], fileName(report), { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); }
      catch (e) { if ((e as Error).name !== 'AbortError') setMsg('השליחה לא הצליחה. אפשר ללחוץ לחיצה ארוכה על התמונה ולשמור אותה.'); }
    } else save();
  };

  return (
    <Sheet title="שליחת סיכום" onClose={onClose}>
      <div className="seg" role="group">
        {([['today', 'היום'], ['yesterday', 'אתמול'], ['week', '7 ימים']] as const).map(([k, t]) => <button key={k} type="button" aria-pressed={choice === k} onClick={() => setChoice(k)}>{t}</button>)}
      </div>
      <div className="report-preview">{url && blob ? <img src={url} alt="תמונת סיכום ההתקדמות" /> : <span className="muted small">{x('מכינה את התמונה...', 'מכין את התמונה...')}</span>}</div>
      <button type="button" className="cta" disabled={!blob} onClick={send}>שליחה</button>
      <p className="small muted center">בחלון שנפתח בוחרים בוואטסאפ ואת איש הקשר.</p>
      {msg && <p className="small center" role="status">{msg}</p>}
    </Sheet>
  );
}
