import { useEffect } from 'react';
import { audio } from '../../audio/engine';
import { GROWING_LEVELS, GROWING_SONG, growingLevelDone, ODE_RHYTHM } from '../../engine/extras';
import { SessionPlan } from '../../engine/sessions';
import { accompaniment, chordsForSong, melodyEvents } from '../../engine/accomp';
import { knownSongsFor, parseNotes, SONG_DEFS } from '../../music/songs';
import { useApp } from '../../state/store';
import type { SessionRecord } from '../../storage/types';
import { Icon, TopBar } from '../components/ui';
import type { Route } from '../App';

function songStats(sessions: SessionRecord[], id: string) {
  const reads = sessions.flatMap((s) => (s.summary.melodies ?? []).filter((m) => m.id.split('@')[0] === id && m.total));
  const best = reads.length ? Math.max(...reads.map((m) => (m.correct ?? 0) / (m.total || 1))) : null;
  return { times: reads.length, best, star: reads.some((m) => m.total && m.correct === m.total) };
}

const readPlan = (id: string, skill: 'name' | 'key', title: string): SessionPlan => ({
  title,
  config: {
    kind: 'free', exercise: 'sequence', mode: 'practice', skill, count: 16, timeLimitMs: null, autoAdvance: true, look: 4,
    content: 'known', songIds: [id], ranges: [{ clef: 'treble', from: 'C4', to: 'C5' }],
  },
  pool: [], reviewPool: [],
});

export function Songbook({ start, onBack, go, onPlayAlong }: { start: (p: SessionPlan) => void; onBack: () => void; go: (r: Route) => void; onPlayAlong: (id: string) => void }) {
  const { sessions, myMelodies } = useApp();
  useEffect(() => () => audio.cancelScheduled(), []);
  const play = (id: string) => {
    audio.unlock();
    audio.cancelScheduled();
    const d = SONG_DEFS.find((x) => x.id === id)!;
    const notes = parseNotes(d.notes);
    // The melody with its accompaniment.
    audio.playEvents([...melodyEvents(notes, 0.8), ...accompaniment(chordsForSong(id, notes))], d.bpm);
  };
  const ode = SONG_DEFS.find((d) => d.id === GROWING_SONG)!;
  const originals = sessions.flatMap((s) => s.summary.melodies ?? []).filter((m) => m.id.startsWith('orig-')).length;

  const startLevel = (level: string) => {
    if (level === 'names') start(readPlan(GROWING_SONG, 'name', 'המנגינה שלך · שמות'));
    else if (level === 'keys') start(readPlan(GROWING_SONG, 'key', 'המנגינה שלך · מקלדת'));
    else if (level === 'rhythm') start({
      title: 'המנגינה שלך · מקצב',
      config: { kind: 'free', exercise: 'rhythm', mode: 'practice', skill: 'name', count: 2, timeLimitMs: null, autoAdvance: true, rhythmLevel: 3, bpm: 80, metronome: true, rhythmBars: ODE_RHYTHM, songIds: [GROWING_SONG] },
      pool: [], reviewPool: [],
    });
    else if (level === 'hands') start({
      title: 'המנגינה שלך · שתי ידיים',
      config: { kind: 'free', exercise: 'grand', mode: 'practice', skill: 'name', count: 45, timeLimitMs: null, autoAdvance: true, grandMode: 'song', songIds: [GROWING_SONG] },
      pool: [], reviewPool: [],
    });
  };

  return (
    <div className="page with-nav">
      <TopBar title="ספר השירים" onBack={onBack} />

      <div className="card grow-card">
        <div className="eyebrow" style={{ margin: 0 }}>המנגינה שגדלה איתך</div>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '4px 0 2px' }}>{ode.title}</h2>
            <div className="faint">{ode.composer} · חוזרים אליה בגרסאות עשירות יותר</div>
          </div>
          <button className="btn small" onClick={() => play(ode.id)}><Icon name="play" size={14} />השמעה</button>
        </div>
        <ol className="levels">
          {GROWING_LEVELS.map((l, i) => {
            const best = growingLevelDone(sessions, l.id);
            const soon = false;
            return (
              <li key={l.id} className={best != null && best >= 0.9 ? 'done' : ''}>
                <span className="lnum">{best != null && best >= 0.9 ? '✓' : i + 1}</span>
                <div style={{ minWidth: 0 }} className="grow">
                  <b>{l.title}</b>
                  <div className="faint">{l.hint}{best != null ? ` · הכי טוב: ${Math.round(best * 100)}%` : ''}</div>
                </div>
                {soon ? <span className="chip">בקרוב</span> : <button className="btn small" onClick={() => startLevel(l.id)}>{best != null ? 'שוב' : 'להתחיל'}</button>}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="eyebrow">מנגינות מוכרות</div>
      <div className="card">
        <ul className="list">
          {SONG_DEFS.map((d) => {
            const st = songStats(sessions, d.id);
            const fits = knownSongsFor('treble', 'C4', 'C5').some((m) => m.id === d.id);
            return (
              <li key={d.id} style={{ alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <b>{st.star && <span className="star" aria-label="נקראה בלי טעויות">★ </span>}{d.title}</b>
                  <div className="faint" style={{ fontSize: 12.5 }}>
                    {d.composer} · {st.times ? `נקראה ${st.times} פעמים · הכי טוב ${Math.round((st.best ?? 0) * 100)}%` : 'עוד לא נקראה'}
                  </div>
                </div>
                <div className="row" style={{ gap: 6, flex: 'none' }}>
                  <button className="btn small" onClick={() => play(d.id)} aria-label={`השמעת ${d.title}`}><Icon name="play" size={14} /></button>
                  {fits && <button className="btn small" onClick={() => onPlayAlong(d.id)}>לנגן</button>}
                  {fits && <button className="btn small primary" onClick={() => start(readPlan(d.id, 'name', d.title))}>קריאה</button>}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="faint" style={{ marginTop: 8 }}>כל המנגינות ברשות הציבור, בעיבוד לימודי ב־C. ★ — נקראה פעם אחת לפחות בלי טעויות.</div>
      </div>

      <div className="eyebrow">שלך</div>
      <div className="card">
        <div className="row between">
          <div><b>{myMelodies.length ? `${myMelodies.length} מנגינות שכתבת` : 'עוד לא כתבת מנגינה'}</b><div className="faint">{originals} מנגינות מקוריות נקראו עד היום</div></div>
          <button className="btn small" onClick={() => go('piano')}>לפסנתר</button>
        </div>
      </div>
    </div>
  );
}
