import { earnedAchievements } from '../../engine/achievements';
// Musical symbols: a small illustrated dictionary with sound examples, and a quiz.

import { useEffect, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { MusicSymbol, SYMBOL_GROUPS, SYMBOLS, SymbolArt, symbolQuiz } from '../../engine/symbols';
import { useApp, useStore } from '../../state/store';
import type { SessionRecord } from '../../storage/types';
import { Icon, Seg, TopBar } from '../components/ui';

export function SymbolArtView({ art, height = 76 }: { art: SymbolArt; height?: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { document.fonts.load('40px Bravura').catch(() => undefined).finally(() => setReady(true)); }, []);
  return (
    <svg className="sym-art" viewBox="0 0 160 100" style={{ height }} aria-hidden="true" direction="ltr">
      {art.kind === 'glyph' && art.staff && [30, 40, 50, 60, 70].map((y) => <line key={y} x1="4" x2="156" y1={y} y2={y} className="sym-line" />)}
      {art.kind === 'glyph' && ready && art.parts.map(([t, x, y], i) => (
        <text key={i} x={x} y={y} className="sym-glyph" style={{ fontSize: art.size ?? 40 }}>{t}</text>
      ))}
      {art.kind === 'svg' && <Shape shape={art.shape} ready={ready} />}
    </svg>
  );
}

function Shape({ shape, ready }: { shape: 'tie' | 'slur' | 'cresc' | 'decresc'; ready: boolean }) {
  const head = (x: number, y: number, k: number) => ready ? <text key={k} x={x} y={y} className="sym-glyph" style={{ fontSize: 40 }}>{''}</text> : null;
  if (shape === 'tie') {
    return <>{head(40, 70, 1)}{head(104, 70, 2)}<path className="sym-stroke" d="M50 80 Q 80 96 112 80" /></>;
  }
  if (shape === 'slur') {
    return <>{[0, 1, 2, 3].map((i) => head(24 + i * 30, 72 - i * 6, i))}<path className="sym-stroke" d="M28 84 Q 80 102 120 70" /></>;
  }
  const open = shape === 'cresc';
  return <path className="sym-stroke" d={open ? 'M20 50 L140 34 M20 50 L140 66' : 'M20 34 L140 50 M20 66 L140 50'} />;
}

function playDemo(s: MusicSymbol): void {
  if (!s.demo) return;
  audio.unlock();
  audio.cancelScheduled();
  audio.playEvents(s.demo.events, s.demo.bpm);
}

export function Symbols({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'dict' | 'quiz'>('dict');
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="page with-nav">
      <TopBar title="סימנים מוזיקליים" onBack={onBack} />
      <Seg value={tab} onChange={setTab} options={[{ value: 'dict', label: 'מילון' }, { value: 'quiz', label: 'חידון' }]} />
      {tab === 'dict' ? (
        <>
          <p className="muted">לכל סימן — מה הוא אומר, ואיך זה נשמע. לחיצה על כרטיס פותחת אותו.</p>
          {SYMBOL_GROUPS.map((g) => (
            <section key={g.id}>
              <div className="eyebrow">{g.title}</div>
              <div className="sym-grid">
                {SYMBOLS.filter((s) => s.group === g.id).map((s) => {
                  const isOpen = open === s.id;
                  return (
                    <div key={s.id} className={`sym-card ${isOpen ? 'open' : ''}`}>
                      <button className="sym-head" onClick={() => { setOpen(isOpen ? null : s.id); if (!isOpen) playDemo(s); }} aria-expanded={isOpen}>
                        <SymbolArtView art={s.art} />
                        <b>{s.name}</b>
                        <small className="faint" dir="ltr">{s.term}</small>
                      </button>
                      {isOpen && (
                        <div className="sym-body">
                          <p>{s.text}</p>
                          {s.demo && <button className="btn small" onClick={() => playDemo(s)}><Icon name="sound" size={15} />{s.demo.caption}</button>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      ) : <SymbolQuiz />}
    </div>
  );
}

function SymbolQuiz() {
  const store = useStore();
  const { sessions } = useApp();
  const [round, setRound] = useState(0);
  const qs = useMemo(() => symbolQuiz(Math.random, 10), [round]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const startedAt = useRef(Date.now());
  const best = sessions.filter((s) => s.config.exercise === 'symbols').reduce((m, s) => Math.max(m, s.summary.correct), 0);
  const done = i >= qs.length;

  const choose = (id: string) => {
    if (picked) return;
    const q = qs[i];
    const ok = id === q.symbol.id;
    setPicked(id);
    if (ok) setScore((x) => x + 1); else audio.playWrong();
    window.setTimeout(() => {
      setPicked(null);
      const next = i + 1;
      setI(next);
      if (next >= qs.length) {
        const correct = score + (ok ? 1 : 0);
        const rec: SessionRecord = {
          id: `sym-${Date.now().toString(36)}`, startedAt: startedAt.current, endedAt: Date.now(),
          config: { kind: 'free', exercise: 'symbols', mode: 'practice', skill: 'name', count: qs.length, timeLimitMs: null, autoAdvance: true },
          summary: { total: qs.length, correct, misses: 0, accuracy: correct / qs.length, meanRt: null, medianRt: null, score: Math.round((correct / qs.length) * 100), wrongNotes: [], slowNotes: [] },
        };
        store.addSession(rec);
        { const d = store.getSnapshot(); store.unlockAchievements(earnedAchievements(d.attempts, d.sessions, d.idx, d.settings)); }
        void store.flush();
        audio.playFlourish();
      }
    }, ok ? 650 : 1800);
  };

  if (done) {
    return (
      <div className="card" style={{ textAlign: 'center', display: 'grid', gap: 10, marginTop: 12 }}>
        <div className="eyebrow" style={{ margin: 0 }}>החידון הושלם</div>
        <div className="big-num num">{score}/{qs.length}</div>
        <p className="muted" style={{ margin: 0 }}>{score === qs.length ? 'כל הסימנים — בלי טעות אחת.' : score >= 7 ? 'יפה מאוד. הסימנים שפספסת יחזרו בחידון הבא.' : 'כדאי לעבור שוב על המילון, ולנסות שוב.'}{best > score ? ` השיא שלך: ${best}.` : ''}</p>
        <button className="btn primary" onClick={() => { setRound((r) => r + 1); setI(0); setScore(0); startedAt.current = Date.now(); }}>חידון חדש</button>
      </div>
    );
  }

  const q = qs[i];
  return (
    <div className="sym-quiz">
      <div className="faint num" style={{ textAlign: 'center' }}>{i + 1} / {qs.length}</div>
      <div className="card sym-q">
        <SymbolArtView art={q.symbol.art} height={110} />
        <div className="faint">מה הסימן הזה אומר?</div>
      </div>
      <div className="stack">
        {q.options.map((o) => {
          const cls = !picked ? '' : o.id === q.symbol.id ? 'good' : o.id === picked ? 'bad' : '';
          return (
            <button key={o.id} className={`btn block quiz-opt ${cls}`} onClick={() => choose(o.id)} disabled={!!picked}>
              {o.short}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="feedback" aria-live="polite">
          <b>{q.symbol.name}</b> — {q.symbol.text}
        </div>
      )}
    </div>
  );
}
