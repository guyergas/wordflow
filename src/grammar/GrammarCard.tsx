// A short grammar stop in the English course: a rule, then questions, and a wrong answer gets a hint and another try.
import { pushWin } from '../wins';
import { useMemo, useRef, useState } from 'react';
import { userKey } from '../course';
import { GRAMMAR, GrammarQ } from './topics';
import '../users.css';

/** A new topic at most once in this many days. A learned topic returns after 1, 3, 7, 14 and 30 days. */
export const NEW_GAP = 3;
const INTERVALS = [1, 3, 7, 14, 30];
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

export function GrammarCard({ known, onTime }: { known: number; onTime: (sec: number) => void }) {
  const [state, setState] = useState(load);
  const [open, setOpen] = useState(false);
  const started = useRef(0);
  const today = dayNow();
  const item = nextGrammar(state, known, today);
  // A review keeps the daily practice short: five questions of the topic.
  const qs = useMemo(() => (item ? (item.review ? [...item.topic.qs].sort(() => Math.random() - 0.5).slice(0, 5) : item.topic.qs) : []), [item?.topic.id, item?.review]);
  if (!item) return null;
  const close = (first: number | null) => {
    onTime(Math.min(900, Math.round((Date.now() - started.current) / 1000)));
    setOpen(false);
    if (first !== null) { if (!item.review) pushWin('grammar', item.topic.title); const s = afterGrammar(state, item.topic.id, first, qs.length, today, item.review); save(s); setState(s); }
  };
  const skip = () => { const s = afterGrammar(state, item.topic.id, 1, 1, today, false); const t = { ...s, last: state.last }; save(t); setState(t); };
  return (
    <>
      <div className="en-card">
        <button type="button" className="gr-open" onClick={() => { started.current = Date.now(); setOpen(true); }}><b>{item.review ? 'חזרה בדקדוק' : 'דקדוק'}: {item.topic.title}</b></button>
        {!item.review && <button type="button" className="cs-link" onClick={skip}>כבר יודעת, לדלג</button>}
      </div>
      {open && <Run title={item.topic.title} rule={item.topic.rule} example={item.topic.example} qs={qs} onClose={close} />}
    </>
  );
}
