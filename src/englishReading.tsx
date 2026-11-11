// Reading: short English texts with questions, each opening at a word count and at most once in a few days. Most of the practice stays with words.
import { pushWin } from './wins';
import { useRef, useState } from 'react';
import { g, userKey } from './course';
import { PASSAGES, Passage, wordsNeeded } from './readingTexts';
import './users.css';

export const GAP_DAYS = 3;
export { PASSAGES, wordsNeeded } from './readingTexts';
export type { Passage } from './readingTexts';


const nowDay = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5); };
const KEY = () => userKey('enReading');
const load = (): { done: string[]; last: number } => { try { return { done: [], last: 0, ...JSON.parse(localStorage.getItem(KEY()) ?? '{}') }; } catch { return { done: [], last: 0 }; } };
const store = (s: { done: string[]; last: number }) => { try { localStorage.setItem(KEY(), JSON.stringify(s)); } catch { /* this visit only */ } };

function Reader({ p, onClose }: { p: Passage; onClose: (finished: boolean) => void }) {
  const [at, setAt] = useState(-1);
  const [chosen, setChosen] = useState<string | null>(null);
  const [tried, setTried] = useState<string[]>([]);
  const opts = useRef(p.qs.map((q) => [q[1], ...q[2]].sort(() => Math.random() - 0.5)));
  const q = p.qs[at];
  return (
    <div className="fam-page"><div className="fam-inner">
      <div className="cs-row"><h2 dir="ltr">{p.title}</h2><button type="button" className="cs-round" aria-label="סגירה" onClick={() => onClose(false)}>✕</button></div>
      {(at === -1 || tried.length > 0) && <div className="fam-card en-text" dir="ltr">{p.text}</div>}
      {at === -1 && <button type="button" className="fam-open" onClick={() => setAt(0)}>קראתי</button>}
      {q && <>
        <h3>{q[0]}</h3>
        {tried.length > 0 && !chosen && <p className="cs-note">לא בדיוק. כדאי לקרוא שוב את הקטע ולנסות שוב.</p>}
        {opts.current[at].map((o) => <button key={o} type="button" className={`en-opt${chosen === o ? ' ok' : tried.includes(o) ? ' no' : ''}`} disabled={!!chosen || tried.includes(o)} onClick={() => { if (o === q[1]) setChosen(o); else setTried([...tried, o]); }}>{o}</button>)}
        {chosen && <button type="button" className="fam-open" onClick={() => { setChosen(null); setTried([]); if (at + 1 < p.qs.length) setAt(at + 1); else onClose(true); }}>{at + 1 < p.qs.length ? 'הבאה' : 'סיום'}</button>}
      </>}
    </div></div>
  );
}

/** The reading card on the home screen. It opens a page with every text: read ones can be read again, and the rest say when they open. */
export function EnglishReading({ known, onTime }: { known: number; onTime: (sec: number) => void }) {
  const [state, setState] = useState(load);
  const [page, setPage] = useState(false);
  const [reading, setReading] = useState<Passage | null>(null);
  const started = useRef(0);
  const today = nowDay();
  const next = PASSAGES.find((p) => !state.done.includes(p.id));
  const wait = Math.max(0, GAP_DAYS - (today - state.last));
  const lockText = (p: Passage) => {
    const need = wordsNeeded(PASSAGES.indexOf(p));
    if (p !== next) return 'ייפתח אחרי הקטע הקודם';
    if (known < need) return `ייפתח כש${g('תכירי', 'תכיר')} ${need} מילים (עכשיו ${known})`;
    return wait > 0 ? `ייפתח בעוד ${wait === 1 ? 'יום' : `${wait} ימים`}` : '';
  };
  const ready = next && !lockText(next);
  const open = (p: Passage) => { started.current = Date.now(); setReading(p); };
  const close = (finished: boolean) => {
    onTime(Math.min(600, Math.round((Date.now() - started.current) / 1000)));
    if (finished && reading && !state.done.includes(reading.id)) { pushWin('reading', reading.title); const s = { done: [...state.done, reading.id], last: today }; store(s); setState(s); }
    setReading(null);
  };
  const sub = !next ? `כל ${PASSAGES.length} הקטעים נקראו` : ready ? `קטע חדש: ${next.title}` : lockText(next);
  return (
    <>
      <button type="button" className="sent-card" onClick={() => setPage(true)}>
        <span className="sent-txt"><b>קריאה</b><small>{sub}</small></span>
        <span className="sent-go" aria-hidden="true">←</span>
      </button>
      {page && !reading && (
        <div className="fam-page"><div className="fam-inner">
          <div className="cs-row"><h2>קריאה</h2><button type="button" className="cs-round" aria-label="סגירה" onClick={() => setPage(false)}>✕</button></div>
          <p className="cs-note">קטעים באנגלית עם שאלות הבנה בעברית, שנעשים ארוכים וקשים יותר עד רמת כיתה ט. קטע חדש נפתח כשמגיעים למספר המילים שלו, ולכל היותר פעם ב־{GAP_DAYS} ימים. קטע שכבר נקרא אפשר לקרוא שוב.</p>
          {PASSAGES.map((p) => {
            const done = state.done.includes(p.id), lock = done ? '' : lockText(p);
            return (
              <button key={p.id} type="button" className={`en-card gr-topic${lock ? ' locked' : ''}`} disabled={!!lock} onClick={() => open(p)}>
                <b dir="ltr">{p.title}</b>
                <small className="cs-note">{done ? 'נקרא' : lock || 'פתוח לקריאה'} · רמת כיתה {p.grade} · {p.text.split(/\s+/).length} מילים · {p.qs.length} שאלות</small>
                {done && <span className="gr-again">לקרוא שוב</span>}
              </button>
            );
          })}
        </div></div>
      )}
      {reading && <Reader p={reading} onClose={close} />}
    </>
  );
}
