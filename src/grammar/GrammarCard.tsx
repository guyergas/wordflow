// A short grammar stop in the English course: a rule, then questions, and a wrong answer gets a hint and another try.
import { pushWin } from '../wins';
import { useMemo, useRef, useState } from 'react';
import { g, userKey } from '../course';
import { GRAMMAR, GRAMMAR_PARTS, GrammarQ, partOf } from './topics';
import '../users.css';

/** A new topic at most once in this many days. A learned topic returns after 1, 3, 7, 14 and 30 days. */
export const NEW_GAP = 3;
const INTERVALS = [1, 3, 7, 14, 30];
/** Questions in a first sitting and in a review, drawn at random from the topic's bank. */
export const NEW_QS = 20, REVIEW_QS = 10;
export interface GState { topics: Record<string, { box: number; due: number }>; last: number }
const dayNow = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };
const KEY = () => userKey('enGrammar');
const load = (): GState => { try { return { topics: {}, last: 0, ...JSON.parse(localStorage.getItem(KEY()) ?? '{}') }; } catch { return { topics: {}, last: 0 }; } };
const save = (s: GState) => { try { localStorage.setItem(KEY(), JSON.stringify(s)); } catch { /* this visit only */ } };

export function nextGrammar(s: GState, known: number, today: number) {
  const due = GRAMMAR.find((t) => s.topics[t.id] && s.topics[t.id].due <= today);
  if (due) return { topic: due, review: true };
  const fresh = GRAMMAR.find((t) => !s.topics[t.id]);
  if (fresh && known >= fresh.words && today - s.last >= NEW_GAP) return { topic: fresh, review: false };
  return null;
}
export function afterGrammar(s: GState, id: string, firstTry: number, all: number, today: number, review: boolean): GState {
  const box = s.topics[id]?.box ?? 0, good = firstTry / all >= 0.7, next = good ? Math.min(INTERVALS.length - 1, review ? box + 1 : 0) : 0;
  return { topics: { ...s.topics, [id]: { box: next, due: today + INTERVALS[next] } }, last: review ? s.last : today };
}

function Run({ title, rule, example, qs, onClose }: { title: string; rule: string; example: string; qs: GrammarQ[]; onClose: (first: number | null) => void }) {
  const [at, setAt] = useState(-1);
  const [tried, setTried] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const first = useRef(0);
  const q = qs[at];
  const opts = useMemo(() => (q ? [q[1], ...q[2]].sort(() => Math.random() - 0.5) : []), [at]);
  const pick = (o: string) => { if (o === q[1]) { if (!tried.length) first.current++; setDone(true); } else setTried([...tried, o]); };
  const next = () => { setTried([]); setDone(false); if (at + 1 < qs.length) setAt(at + 1); else onClose(first.current); };
  return (
    <div className="fam-page"><div className="fam-inner">
      <div className="cs-row"><h2>{title}</h2><button type="button" className="cs-round" aria-label="סגירה" onClick={() => onClose(null)}>✕</button></div>
      {at === -1 && <>
        <div className="fam-card"><p className="gr-rule">{rule}</p><p className="en-text" dir="ltr">{example}</p></div>
        <button type="button" className="fam-open" onClick={() => setAt(0)}>לתרגול</button>
      </>}
      {q && <>
        <p className="cs-note">שאלה {at + 1} מתוך {qs.length}</p>
        <p className="en-text gr-q" dir="ltr">{done ? q[0].replace('___', q[1]) : q[0]}</p>
        {tried.length > 0 && !done && <p className="cs-note">לא בדיוק. {rule}</p>}
        {done && <p className="cs-note">{q[3]}</p>}
        {opts.map((o) => <button key={o} type="button" dir="ltr" className={`en-opt${done && o === q[1] ? ' ok' : tried.includes(o) ? ' no' : ''}`} disabled={done || tried.includes(o)} onClick={() => pick(o)}>{o}</button>)}
        {done && <button type="button" className="fam-open" onClick={next}>{at + 1 < qs.length ? 'הבאה' : 'סיום'}</button>}
      </>}
    </div></div>
  );
}

/** The grammar practice card on the home screen. It opens a page with every topic, and points at the one to do now. */
export function GrammarCard({ known, onTime }: { known: number; onTime: (sec: number) => void }) {
  const [state, setState] = useState(load);
  const [page, setPage] = useState(false);
  const [run, setRun] = useState<{ id: string; review: boolean } | null>(null);
  const started = useRef(0);
  const today = dayNow();
  const item = nextGrammar(state, known, today);
  const topic = run ? GRAMMAR.find((t) => t.id === run.id) : undefined;
  // A big topic has a bank of questions: each sitting draws a fresh set, so later reviews practice different sentences.
  const qs = useMemo(() => (topic ? [...topic.qs].sort(() => Math.random() - 0.5).slice(0, run?.review ? REVIEW_QS : NEW_QS) : []), [run]);
  const learned = GRAMMAR.filter((t) => state.topics[t.id]).length;
  const open = (id: string) => { started.current = Date.now(); setRun({ id, review: !!state.topics[id] }); };
  const close = (first: number | null) => {
    onTime(Math.min(900, Math.round((Date.now() - started.current) / 1000)));
    if (run && topic && first !== null) { if (!run.review) pushWin('grammar', topic.title); const s = afterGrammar(state, run.id, first, qs.length, today, run.review); save(s); setState(s); }
    setRun(null);
  };
  // The first topic is always open, so a beginner has somewhere to start.
  const unlocked = (id: string, words: number) => !!state.topics[id] || known >= words || id === GRAMMAR[0].id;
  const status = (id: string, words: number) => {
    const t = state.topics[id];
    if (!t) return unlocked(id, words) ? (item?.topic.id === id ? 'הבא בתור' : 'פתוח') : `נעול: ייפתח כש${g('תכירי', 'תכיר')} ${words} מילים (עכשיו ${known})`;
    return t.due <= today ? 'לחזרה היום' : `נלמד · חזרה ${t.due - today === 1 ? 'מחר' : `בעוד ${t.due - today} ימים`}`;
  };
  const sub = item ? `${item.review ? 'חזרה' : 'נושא חדש'}: ${item.topic.title}` : `${learned} מתוך ${GRAMMAR.length} נושאים נלמדו`;
  return (
    <>
      <button type="button" className="sent-card" onClick={() => setPage(true)}>
        <span className="sent-txt"><b>אימון דקדוק</b><small>{sub}</small></span>
        <span className="sent-go" aria-hidden="true">←</span>
      </button>
      {page && !run && (
        <div className="fam-page"><div className="fam-inner">
          <div className="cs-row"><h2>אימון דקדוק</h2><button type="button" className="cs-round" aria-label="סגירה" onClick={() => setPage(false)}>✕</button></div>
          <p className="cs-note">{learned} מתוך {GRAMMAR.length} נושאים נלמדו. נושא נפתח כשמגיעים למספר המילים שלו. נושא שכבר נלמד אפשר לתרגל שוב בכל זמן, וכל פעם מגיעות שאלות אחרות.</p>
          {item && <button type="button" className="fam-open" onClick={() => open(item.topic.id)}>{item.review ? 'חזרה' : 'להתחיל'}: {item.topic.title}</button>}
          {GRAMMAR_PARTS.map((part) => {
            const ts = GRAMMAR.filter((t) => partOf(t) === part);
            if (!ts.length) return null;
            const done = ts.filter((t) => state.topics[t.id]).length;
            return (
              <div key={part.name} className="gr-item">
                <h3 className="gr-part">{part.name} <small className="cs-note">{done} מתוך {ts.length} נלמדו</small></h3>
                {ts.map((t) => {
                  const open1 = unlocked(t.id, t.words);
                  return (
                    <button key={t.id} type="button" className={`en-card gr-topic${open1 ? '' : ' locked'}`} disabled={!open1} onClick={() => open(t.id)}>
                      <b>{t.title}</b>
                      <small className="cs-note">{[status(t.id, t.words), `${t.qs.length} שאלות`].join(' · ')}</small>
                      {state.topics[t.id] && <span className="gr-again">לתרגל שוב</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div></div>
      )}
      {run && topic && <Run title={topic.title} rule={topic.rule} example={topic.example} qs={qs} onClose={close} />}
    </>
  );
}
