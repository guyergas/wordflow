// Free piano: play, see what you played on the staff, record a short phrase and keep it as your own melody.

import { useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { pitchFromMidi } from '../../engine/exercise';
import { SessionPlan } from '../../engine/sessions';
import { Clef, midi, parsePitch, pitchId, pitchName } from '../../music/pitch';
import { Staff } from '../../notation/Staff';
import { useApp, useStore } from '../../state/store';
import { Piano } from '../components/Piano';
import { Sheet } from '../components/Sheet';
import { Icon, Seg, TopBar } from '../components/ui';
import { Looper, LooperHandle } from '../components/Looper';
import { useExternalNotes } from '../useExternalNotes';

interface Played { midi: number; t: number }

export function FreePiano({ onBack, start }: { onBack: () => void; start: (p: SessionPlan) => void }) {
  const { settings, myMelodies } = useApp();
  const store = useStore();
  const [low, setLow] = useState(48); // C3
  const [clefMode, setClefMode] = useState<'auto' | Clef>('auto');
  const [names, setNames] = useState(settings.showKeyNames);
  const [recent, setRecent] = useState<number[]>([]);
  const [recording, setRecording] = useState(false);
  const [take, setTake] = useState<Played[]>([]);
  const [naming, setNaming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const recStart = useRef(0);

  useEffect(() => () => audio.cancelScheduled(), []);

  const looper = useRef<LooperHandle>(null);
  const press = (m: number, external = false) => {
    audio.unlock();
    if (!external) audio.playNote(m, 1.2);
    looper.current?.note(m);
    // Only natural notes go on the staff spelling-free; black keys show as sharps.
    setRecent((r) => [...r, m].slice(-8));
    if (recording) setTake((t) => [...t, { midi: m, t: performance.now() - recStart.current }].slice(0, 32));
  };

  useExternalNotes(true, (m) => press(m, true));

  const shown = recent.map(pitchFromMidi);
  const autoClef: Clef = shown.length && shown.filter((p) => p.octave >= 4).length < shown.length / 2 ? 'bass' : 'treble';
  const clef: Clef = clefMode === 'auto' ? autoClef : clefMode;

  const playTake = () => {
    audio.unlock();
    const ctx = audio.context;
    if (!ctx || !take.length) return;
    audio.cancelScheduled();
    const t0 = ctx.currentTime + 0.15;
    take.forEach((n) => audio.playNote(n.midi, 0.9, t0 + n.t / 1000));
  };

  const save = (title: string) => {
    setNaming(false);
    const notes = take.map((n) => pitchFromMidi(n.midi)).slice(0, 16);
    const takeClef: Clef = notes.filter((p) => p.octave >= 4).length >= notes.length / 2 ? 'treble' : 'bass';
    store.addMyMelody({ id: Date.now().toString(36), title, clef: clefMode === 'auto' ? takeClef : clefMode, notes: notes.map(pitchId), createdAt: Date.now() });
    setMsg('נשמר. בעוד יומיים המנגינה תחזור אלייך כתרגיל קריאה — ואפשר גם עכשיו מהרשימה למטה.');
    setTake([]);
  };

  const readMine = (id: string, c: Clef) => {
    start({
      title: 'המנגינה שכתבת',
      config: {
        kind: 'free', exercise: 'sequence', mode: 'practice', skill: 'name', count: 16, timeLimitMs: null, autoAdvance: true,
        look: 4, content: 'original', songIds: [`my-${id}`], ranges: [c === 'treble' ? { clef: 'treble', from: 'C3', to: 'C6' } : { clef: 'bass', from: 'C2', to: 'C5' }],
      },
      pool: [], reviewPool: [],
    });
  };

  return (
    <div className="page with-nav free-piano">
      <TopBar title="פסנתר חופשי" onBack={onBack} />
      <p className="muted" style={{ marginTop: -6 }}>מנגנים מה שבא. כל צליל מופיע על החמשה. אפשר להקליט משפט קצר ולשמור אותו, או לבנות לופ של עד ארבע רצועות.</p>

      <div className="staff-card" style={{ paddingTop: 30 }}>
        {shown.length ? (
          <Staff clef={clef} scale={1.35} notes={shown.map((p, i) => ({ pitch: p, role: i === shown.length - 1 ? 'target' : 'ghost' }))} />
        ) : <div className="faint" style={{ height: 120, display: 'grid', placeItems: 'center' }}>הקישי על קליד</div>}
        {shown.length > 0 && <div className="faint" style={{ textAlign: 'center', paddingBottom: 6 }} dir="ltr">{shown.map((p) => pitchName(p)).join('  ')}</div>}
      </div>

      <div className="row wrap" style={{ marginTop: 12, gap: 8 }}>
        <Seg value={clefMode} onChange={setClefMode} options={[{ value: 'auto', label: 'מפתח אוטומטי' }, { value: 'treble', label: 'סול' }, { value: 'bass', label: 'פה' }]} />
      </div>
      <div className="row" style={{ marginTop: 8, gap: 8 }}>
        <button className="btn small" onClick={() => setLow((l) => Math.max(36, l - 12))} aria-label="אוקטבה נמוכה יותר">‹ נמוך</button>
        <span className="faint grow" style={{ textAlign: 'center' }} dir="ltr">C{Math.floor(low / 12) - 1}–B{Math.floor(low / 12)}</span>
        <button className="btn small" onClick={() => setLow((l) => Math.min(60, l + 12))} aria-label="אוקטבה גבוהה יותר">גבוה ›</button>
        <button className={`btn small ${names ? 'primary' : ''}`} onClick={() => setNames((n) => !n)}>שמות</button>
      </div>
      <div style={{ marginTop: 10 }}>
        <Piano low={low} high={low + 23} onPress={(m) => press(m)} showNames={names} minKeyWidth={30} />
      </div>

      <Looper ref={looper} />

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row between">
          <b>הקלטה</b>
          <span className="faint num">{take.length ? `${take.length} צלילים` : ''}</span>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          {recording ? (
            <button className="btn grow danger-fill" onClick={() => setRecording(false)}><Icon name="pause" size={16} />עצירת הקלטה</button>
          ) : (
            <button className="btn grow" onClick={() => { setTake([]); recStart.current = performance.now(); setRecording(true); setMsg(null); }}>● הקלטה חדשה</button>
          )}
          <button className="btn" disabled={!take.length || recording} onClick={playTake}><Icon name="play" size={16} />השמעה</button>
          <button className="btn primary" disabled={take.length < 3 || recording} onClick={() => setNaming(true)}>שמירה</button>
        </div>
        {msg && <div className="faint" style={{ marginTop: 8 }}>{msg}</div>}
      </div>

      {myMelodies.length > 0 && (
        <>
          <div className="eyebrow">המנגינות שלי</div>
          <div className="card">
            <ul className="list">
              {myMelodies.map((m) => (
                <li key={m.id} style={{ alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <b>{m.title}</b>
                    <div className="faint" style={{ fontSize: 12.5 }}>{new Date(m.createdAt).toLocaleDateString('he-IL')} · {m.notes.length} תווים · {m.clef === 'treble' ? 'סול' : 'פה'}</div>
                  </div>
                  <div className="row" style={{ gap: 6, flex: 'none' }}>
                    <button className="btn small" onClick={() => { audio.unlock(); audio.playSequence(m.notes.map((n) => ({ midi: midi(parsePitch(n)), beats: 1 })), { gapSec: 0.45 }); }} aria-label={`השמעת ${m.title}`}><Icon name="play" size={14} /></button>
                    <button className="btn small primary" onClick={() => readMine(m.id, m.clef)}>קריאה</button>
                    <button className="icon-btn" style={{ width: 38, height: 38 }} aria-label={`מחיקת ${m.title}`} onClick={() => store.removeMyMelody(m.id)}><Icon name="trash" size={15} /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      {naming && <Sheet title="שם למנגינה" confirmLabel="שמירה" input={{ initial: `המנגינה של ${settings.name || 'דיקלה'}` }} onConfirm={save} onCancel={() => setNaming(false)} />}
    </div>
  );
}
