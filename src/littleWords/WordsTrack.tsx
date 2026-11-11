// The words track of the little ones' Hebrew and English: lessons of five words each, opened by the letters learned,
// and free practice as often as they like. Choosing, then building, then writing with an example above.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Next, useStudyTimer, WritePad } from '../alef/AlefApp';
import { LETTER as HE_LETTER, LETTERS, SAY } from '../alef/letters';
import { ABC, EN, HE, LETTER as EN_LETTER } from '../tinyen/letters';
import { sayInTurn, sfx } from '../platform';
import { STORAGE_KEY } from '../course';
import { HE_SAY, Lang, LESSONS, LittleWord, lessonOpen, shownForm } from './data';
import { chooseOptions, doneShort, emptyProgress, finishLesson, lessonSteps, practiceSteps, record, WProgress, WStep, wordOf } from './engine';

const KEY = `${STORAGE_KEY}.words`;
function loadW(): WProgress { try { return { ...emptyProgress(), ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return emptyProgress(); } }
function saveW(p: WProgress) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* this visit only */ } }
export const wordsProgress = loadW;

type Part = { text: string; lang: 'he' | 'en' };
const he = (text: string): Part => ({ text, lang: 'he' });
const wordPart = (lang: Lang, w: LittleWord): Part => ({ text: w.say, lang });
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const Speak = ({ onClick }: { onClick: () => void }) => <button type="button" className="a-speak" aria-label="לשמוע שוב" onClick={onClick}><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Z" /><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></svg></button>;
const CloseIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>;

/** The button on the home screen. */
export function WordsButton({ lang, met, onOpen }: { lang: Lang; met: Set<string>; onOpen: () => void }) {
  const p = useMemo(loadW, []);
  const open = LESSONS[lang].filter((l) => lessonOpen(lang, l, met, doneShort(lang, p))), fresh = open.filter((l) => !p.lessons[l.id]).length;
  const next = LESSONS[lang].find((l) => !p.lessons[l.id]);
  const note = fresh > 0 ? `${fresh === 1 ? 'שיעור חדש מחכה' : `${fresh} שיעורים חדשים מחכים`}` : open.length ? 'תרגול המילים שכבר למדנו' : next ? 'נפתח כשלומדים עוד כמה אותיות' : '';
  return <button type="button" className="card a-song" onClick={onOpen}><span aria-hidden="true">🧩</span><b>מילים</b><small>{note}</small></button>;
}

export function WordsTrack({ lang, met, sound, onSeconds, onExit }: { lang: Lang; met: Set<string>; sound: boolean; onSeconds: (sec: number) => void; onExit: () => void }) {
  const [p, setP] = useState<WProgress>(loadW);
  const [run, setRun] = useState<{ steps: WStep[]; lesson?: string; at: number; ok: number; all: number } | null>(null);
  useStudyTimer(!!run, onSeconds);
  // Exercises never scroll, so a stroke is never taken for a scroll.
  useEffect(() => {
    if (!run) return;
    const root = document.documentElement, stop = (e: TouchEvent) => e.preventDefault();
    root.classList.add('a-lock');
    document.addEventListener('touchmove', stop, { passive: false });
    return () => { root.classList.remove('a-lock'); document.removeEventListener('touchmove', stop); };
  }, [!!run]);
  const update = (fn: (x: WProgress) => WProgress) => setP((x) => { const n = fn(x); saveW(n); return n; });
  const short = doneShort(lang, p);

  if (run) {
    const step = run.steps[run.at];
    const done = (ok: boolean | null) => {
      if (ok !== null) update((x) => record(x, step.id, ok));
      setRun({ ...run, at: run.at + 1, ok: run.ok + (ok ? 1 : 0), all: run.all + (ok === null ? 0 : 1) });
    };
    if (!step) return <Finish lang={lang} ok={run.ok} all={run.all} onAgain={run.lesson ? undefined : () => setRun({ steps: practiceSteps(lang, p), at: 0, ok: 0, all: 0 })} onExit={() => { if (run.lesson) update((x) => finishLesson(x, run.lesson!)); setRun(null); }} />;
    const w = wordOf(lang, step.id), form = shownForm(lang, w, met) ?? w.text;
    return (
      <div className="session a-session" key={run.at}>
        <div className="s-top"><button type="button" className="round" aria-label="יציאה" onClick={() => setRun(null)}><CloseIcon /></button><div className="thin" style={{ flex: 1 }}><span style={{ width: `${(run.at / run.steps.length) * 100}%` }} /></div></div>
        {step.kind === 'meet' && <Meet lang={lang} w={w} form={form} onDone={() => done(null)} />}
        {step.kind === 'choose' && <Choose lang={lang} w={w} form={form} met={met} sound={sound} onDone={done} />}
        {step.kind === 'build' && <Build lang={lang} w={w} form={form} met={met} sound={sound} onDone={done} />}
        {step.kind === 'write' && <WriteWord lang={lang} w={w} form={form} sound={sound} onDone={done} />}
      </div>
    );
  }

  const anyDone = LESSONS[lang].some((l) => p.lessons[l.id]);
  return (
    <div className="page lw-page">
      <div className="row-between"><h1>מילים</h1><button type="button" className="round" aria-label="חזרה" onClick={onExit}><CloseIcon /></button></div>
      <p className="muted">כל שיעור מלמד חמש מילים מהאותיות שכבר למדנו: בוחרים, בונים וכותבים. אפשר לחזור על שיעור ולתרגל כמה שרוצים.</p>
      {anyDone && <button type="button" className="cta" onClick={() => setRun({ steps: practiceSteps(lang, p), at: 0, ok: 0, all: 0 })}>תרגול מילים</button>}
      <ol className="lw-list">
        {LESSONS[lang].map((l, i) => {
          const open = lessonOpen(lang, l, met, short), times = p.lessons[l.id] ?? 0;
          const missing = l.letters.filter((c) => !met.has(c));
          return (
            <li key={l.id}>
              <button type="button" className={`lw-lesson ${open ? '' : 'locked'} ${times ? 'done' : ''}`} disabled={!open} onClick={() => setRun({ steps: lessonSteps(l.words), lesson: l.id, at: 0, ok: 0, all: 0 })}>
                <span className="lw-pics" aria-hidden="true">{l.words.map((w) => w.pic).join(' ')}</span>
                <b>שיעור {i + 1}{l.long ? ' · מילים ארוכות' : ''}</b>
                <small dir={lang === 'en' ? 'ltr' : undefined}>{open ? l.words.map((w) => shownForm(lang, w, met)).join(' · ') : ''}</small>
                <small>{times ? `נלמד${times > 1 ? ` ${times} פעמים` : ''} ✓` : open ? 'חדש' : l.long && !short ? 'אחרי כל השיעורים הקצרים' : <>מחכה לאותיות <bdi dir={lang === 'en' ? 'ltr' : undefined}>{missing.join(' ')}</bdi></>}</small>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Meet({ lang, w, form, onDone }: { lang: Lang; w: LittleWord; form: string; onDone: () => void }) {
  const say = () => sayInTurn([he(HE_SAY.meet), wordPart(lang, w)]);
  useEffect(say, []);
  return (
    <div className="a-step">
      <div className="lw-pic" aria-hidden="true">{w.pic}</div>
      <button type="button" className="lw-word big" dir={lang === 'en' ? 'ltr' : 'rtl'} onClick={() => sayInTurn([wordPart(lang, w)])}>{form}</button>
      <div className="a-tools"><Speak onClick={say} /></div>
      <Next onClick={onDone} />
    </div>
  );
}

function Choose({ lang, w, form, met, sound, onDone }: { lang: Lang; w: LittleWord; form: string; met: Set<string>; sound: boolean; onDone: (ok: boolean) => void }) {
  // The choices use the same case as the word asked for, so the case is never the clue, and every choice can be read.
  const caps = lang === 'en' && form === form.toUpperCase();
  const shown = (o: LittleWord) => (caps ? o.text.toUpperCase() : o.text);
  const options = useMemo(() => chooseOptions(lang, w.id, (o) => [...shown(o)].every((c) => met.has(c))), [w.id]);
  const [wrong, setWrong] = useState<string[]>([]), [right, setRight] = useState(false);
  const ask = () => sayInTurn([he(HE_SAY.choose), wordPart(lang, w)]);
  useEffect(ask, []);
  const tap = (o: LittleWord) => {
    if (right || wrong.includes(o.id)) return;
    if (o.id === w.id) { setRight(true); if (sound) sfx.good(); sayInTurn([he(pick(SAY.right)), wordPart(lang, w)]); }
    else { setWrong([...wrong, o.id]); if (sound) sfx.bad(); sayInTurn([wordPart(lang, o)]); }
  };
  return (
    <div className="a-step">
      <div className="lw-ask"><Speak onClick={ask} /><span className="lw-pic small" aria-hidden="true">{w.pic}</span></div>
      <div className="lw-options">{options.map((o) => <button key={o.id} type="button" disabled={wrong.includes(o.id)} className={`a-answer lw-opt ${right && o.id === w.id ? 'right' : ''} ${wrong.includes(o.id) ? 'off' : ''}`} dir={lang === 'en' ? 'ltr' : 'rtl'} onClick={() => tap(o)}>{shown(o)}</button>)}</div>
      {right ? <Next onClick={() => onDone(wrong.length === 0)} /> : <div className="a-next-space" />}
    </div>
  );
}

function Build({ lang, w, form, met, sound, onDone }: { lang: Lang; w: LittleWord; form: string; met: Set<string>; sound: boolean; onDone: (ok: boolean) => void }) {
  const letters = [...form];
  const tiles = useMemo(() => {
    const extra = [...met].filter((c) => !letters.includes(c) && (lang === 'he' || (c === c.toUpperCase()) === (form === form.toUpperCase())));
    const all = [...letters, ...(extra.length ? [pick(extra)] : [])].map((c, i) => ({ c, i }));
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    return all;
  }, [w.id]);
  const [used, setUsed] = useState<number[]>([]), [shake, setShake] = useState(-1), missed = useRef(false);
  const ask = () => sayInTurn([he(HE_SAY.build), wordPart(lang, w)]);
  useEffect(ask, []);
  const placed = used.length, done = placed === letters.length;
  const tap = (t: { c: string; i: number }) => {
    if (done || used.includes(t.i)) return;
    if (t.c === letters[placed]) {
      const n = [...used, t.i]; setUsed(n); if (sound) sfx.tap();
      if (n.length === letters.length) { if (sound) sfx.good(); sayInTurn([he(pick(SAY.right)), wordPart(lang, w)]); }
    } else { missed.current = true; if (sound) sfx.bad(); setShake(t.i); setTimeout(() => setShake(-1), 380); }
  };
  return (
    <div className="a-step">
      <div className="lw-ask"><Speak onClick={ask} /><span className="lw-pic small" aria-hidden="true">{w.pic}</span></div>
      <div className="lw-slots" dir={lang === 'en' ? 'ltr' : 'rtl'}>{letters.map((c, i) => <span key={i} className={`lw-slot ${i < placed ? 'on' : ''} ${i === placed && !done ? 'cur' : ''}`}>{i < placed ? c : ''}</span>)}</div>
      {!done && <div className="lw-tiles" dir={lang === 'en' ? 'ltr' : 'rtl'}>{tiles.map((t) => <button key={t.i} type="button" className={`lw-tile ${used.includes(t.i) ? 'gone' : ''} ${shake === t.i ? 'shake' : ''}`} onClick={() => tap(t)} aria-label={t.c}>{t.c}</button>)}</div>}
      {done ? <Next onClick={() => onDone(!missed.current)} /> : <div className="a-next-space" />}
    </div>
  );
}

function WriteWord({ lang, w, form, sound, onDone }: { lang: Lang; w: LittleWord; form: string; sound: boolean; onDone: (ok: boolean) => void }) {
  const letters = [...form];
  const [at, setAt] = useState(0), allOk = useRef(true);
  useEffect(() => { sayInTurn([he(HE_SAY.write), wordPart(lang, w)]); }, []);
  const c = letters[at];
  const shape = lang === 'he' ? HE_LETTER[c] : EN_LETTER[c];
  const rivals = useMemo(() => (lang === 'he' ? LETTERS : ABC.filter((x) => x.big === EN_LETTER[c]?.big)), [c]);
  const letterPart: Part = lang === 'he' ? he(HE_LETTER[c]?.say ?? c) : { text: EN.name(c), lang: 'en' };
  const talk = (key: string) => {
    if (key === 'said') sayInTurn([he(lang === 'he' ? HE_SAY.letter : HE.copy), letterPart]);
    else if (key === 'praise') sayInTurn([he(pick(SAY.right))]);
    else if (key === 'told') sayInTurn([letterPart]);
    else sayInTurn([he(SAY.again)]);
  };
  const strip = (
    <div className="lw-model" aria-hidden="true">
      <span className="lw-pic small">{w.pic}</span>
      <span className="lw-word" dir={lang === 'en' ? 'ltr' : 'rtl'}>{letters.map((x, i) => <i key={i} className={i === at ? 'now' : i < at ? 'past' : ''}>{x}</i>)}</span>
    </div>
  );
  if (!shape) return <div className="a-step"><Next onClick={() => onDone(true)} /></div>;
  return (
    <>
      {strip}
      <WritePad key={at} shape={shape} name={c} mode="copy" said="said" praise="praise" answer="told" again="again" rivals={rivals} talk={talk} sound={sound}
        onDone={(ok) => { if (!ok) allOk.current = false; if (at + 1 < letters.length) setAt(at + 1); else { sayInTurn([wordPart(lang, w)]); onDone(allOk.current); } }} />
    </>
  );
}

function Finish({ lang, ok, all, onAgain, onExit }: { lang: Lang; ok: number; all: number; onAgain?: () => void; onExit: () => void }) {
  useEffect(() => { sfx.win(); sayInTurn([he(HE_SAY.done)]); }, []);
  void lang;
  return (
    <div className="session a-session lw-finish">
      <div className="lw-pic" aria-hidden="true">🌟</div>
      <h1>כל הכבוד!</h1>
      {all > 0 && <p className="lead">{ok} מתוך {all} נכון בפעם הראשונה</p>}
      <div className="grow" />
      {onAgain && <button type="button" className="cta" onClick={onAgain}>עוד תרגול</button>}
      <button type="button" className={onAgain ? 'link center-block' : 'cta'} onClick={onExit}>סיום</button>
    </div>
  );
}
