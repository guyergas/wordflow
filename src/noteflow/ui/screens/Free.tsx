import { useState } from 'react';
import { DEFAULT_FREE, FreeOptions, freeSession, SessionPlan } from '../../engine/sessions';
import { diatonic, naturalRange, parsePitch, pitchId } from '../../music/pitch';
import { useApp, useStore } from '../../state/store';
import { Icon, Seg, Switch, TopBar } from '../components/ui';
import { Sheet } from '../components/Sheet';

const TIMES: { v: number | null; label: string }[] = [
  { v: null, label: 'ללא' }, { v: 15000, label: '15' }, { v: 10000, label: '10' }, { v: 7000, label: '7' }, { v: 5000, label: '5' },
  { v: 3000, label: '3' }, { v: 2000, label: '2' }, { v: 1000, label: '1' }, { v: 500, label: '½' },
];

const TREBLE_NOTES = naturalRange('A3', 'C6').map(pitchId);
const BASS_NOTES = naturalRange('C2', 'E4').map(pitchId);

function RangePicker({ label, notes, value, onChange }: {
  label: string; notes: string[]; value: { from: string; to: string }; onChange: (v: { from: string; to: string }) => void;
}) {
  const fix = (from: string, to: string) => {
    if (diatonic(parsePitch(from)) > diatonic(parsePitch(to))) [from, to] = [to, from];
    if (from === to) to = notes[Math.min(notes.indexOf(from) + 1, notes.length - 1)];
    onChange({ from, to });
  };
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="row" dir="ltr">
        <select value={value.from} onChange={(e) => fix(e.target.value, value.to)} aria-label={`${label} — מ`} className="grow">
          {notes.map((n) => <option key={n}>{n}</option>)}
        </select>
        <span className="faint">עד</span>
        <select value={value.to} onChange={(e) => fix(value.from, e.target.value)} aria-label={`${label} — עד`} className="grow">
          {notes.map((n) => <option key={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

export function Free({ start, onBack, initialMode }: { start: (p: SessionPlan) => void; onBack: () => void; initialMode?: 'practice' | 'test' }) {
  const { settings, favorites } = useApp();
  const store = useStore();
  const [o, setO] = useState<FreeOptions>({ ...DEFAULT_FREE, mode: initialMode ?? 'practice' });
  const set = (p: Partial<FreeOptions>) => setO((x) => ({ ...x, ...p }));
  const custom = o.timeLimitMs != null && !TIMES.some((t) => t.v === o.timeLimitMs);

  const [naming, setNaming] = useState(false);
  const save = async (name: string) => {
    setNaming(false);
    await store.addFavorite({ id: Date.now().toString(36), name, options: o, createdAt: Date.now() });
  };
  const ex = o.exercise ?? 'notes';
  const exLabel = ex === 'rhythm' ? 'מקצב' : ex === 'sequence' ? 'מנגינות' : '';
  const defaultName = ex === 'rhythm' ? `מקצב · רמה ${o.rhythmLevel} · ${o.bpm} BPM` : `${exLabel ? exLabel + ' · ' : ''}${o.skill === 'key' ? 'מקלדת' : o.skill === 'mixed' ? 'מעורב' : 'שמות'} · ${o.clef === 'treble' ? 'סול' : o.clef === 'bass' ? 'פה' : 'שני מפתחות'} · ${o.count}`;

  return (
    <div className="page with-nav">
      <TopBar title="תרגול חופשי" onBack={onBack} />

      {favorites.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h2>מועדפים</h2>
          {favorites.map((f) => (
            <div key={f.id} className="row" style={{ marginTop: 8 }}>
              <button className="btn small grow" style={{ justifyContent: 'flex-start' }}
                onClick={() => start(freeSession(f.options as FreeOptions, settings))}><Icon name="play" size={14} />{f.name}</button>
              <button className="icon-btn" aria-label={`מחק ${f.name}`} onClick={() => store.removeFavorite(f.id)}><Icon name="trash" size={16} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="field">
          <span className="label">מצב</span>
          <Seg value={o.mode} onChange={(mode) => set({ mode })} options={[{ value: 'practice', label: 'תרגול' }, { value: 'test', label: 'מבחן' }]} />
          <div className="faint" style={{ marginTop: 6 }}>
            {o.mode === 'test' ? 'בלי רמזים ובלי משוב עד הסוף. התוצאות נשמרות בהיסטוריה.' : 'משוב מיידי, רמזים והסבר על כל טעות.'}
          </div>
        </div>
        <div className="field">
          <span className="label">מה מתרגלים</span>
          <Seg value={ex} onChange={(exercise) => set({ exercise, ...(exercise === 'sequence' && o.skill === 'mixed' ? { skill: 'name' } : {}), ...(exercise === 'sequence' ? { count: 32 } : exercise === 'notes' ? { count: 20 } : {}) })} options={[
            { value: 'notes', label: 'תו בודד' }, { value: 'sequence', label: 'מנגינות' }, { value: 'rhythm', label: 'מקצב' },
          ]} />
        </div>
        {ex === 'rhythm' ? (
          <>
            <div className="field">
              <span className="label">רמה</span>
              <Seg value={o.rhythmLevel ?? 1} onChange={(rhythmLevel) => set({ rhythmLevel })} options={[
                { value: 1, label: 'רבעים וחצאים' }, { value: 2, label: '+ שמיניות ושתיקות' }, { value: 3, label: '+ נקודות' },
              ]} />
            </div>
            <div className="field">
              <div className="row between"><span className="label" style={{ margin: 0 }}>קצב</span><span className="faint num" dir="ltr">{o.bpm} BPM</span></div>
              <input id="free-bpm" type="range" min={40} max={120} step={2} dir="ltr" value={o.bpm ?? 70} aria-label="BPM"
                onChange={(e) => set({ bpm: Number(e.target.value) })} />
            </div>
            <div className="field"><Switch label="מטרונום בזמן ההקשה" hint="ארבע פעימות ההכנה נשמעות תמיד" checked={o.metronome !== false} onChange={(metronome) => set({ metronome })} /></div>
            <div className="field">
              <span className="label">מספר סבבים</span>
              <Seg value={o.rounds ?? 4} onChange={(rounds) => set({ rounds })} ltr options={[3, 4, 6, 8].map((v) => ({ value: v, label: String(v) }))} />
            </div>
          </>
        ) : (
        <>
        <div className="field">
          <span className="label">איך עונים</span>
          <Seg value={o.skill} onChange={(skill) => set({ skill })} options={[
            { value: 'name', label: 'שמות תווים' }, { value: 'key', label: 'מקלדת' },
            ...(ex === 'notes' ? [{ value: 'mixed' as const, label: 'מעורב' }] : []),
          ]} />
        </div>
        {ex === 'sequence' && (
          <>
            <div className="field">
              <span className="label">מנגינות</span>
              <Seg value={o.content ?? 'mixed'} onChange={(content) => set({ content })} options={[
                { value: 'mixed', label: 'מוכרות ומקוריות' }, { value: 'known', label: 'מוכרות' }, { value: 'original', label: 'מקוריות' },
              ]} />
              <div className="faint" style={{ marginTop: 6 }}>מוכרות: לחנים ברשות הציבור (Ode to Joy, Twinkle ועוד). מקוריות: נוצרות מחדש בכל פעם — בודקות קריאה ולא זיכרון.</div>
            </div>
            <div className="field">
              <span className="label">כמה תווים רואים קדימה</span>
              <Seg value={o.look ?? 4} onChange={(look) => set({ look })} options={[
                { value: 1, label: 'רק הנוכחי' }, { value: 2, label: '+1' }, { value: 4, label: '+3' }, { value: -1, label: 'תיבה' }, { value: 0, label: 'שורה' },
              ]} />
            </div>
          </>
        )}
        <div className="field">
          <span className="label">מפתח</span>
          <Seg value={o.clef} onChange={(clef) => set({ clef })} options={[
            { value: 'treble', label: 'סול' }, { value: 'bass', label: 'פה' }, { value: 'mixed', label: 'שניהם' },
          ]} />
        </div>
        {o.clef !== 'bass' && <RangePicker label="טווח במפתח סול" notes={TREBLE_NOTES} value={o.treble} onChange={(treble) => set({ treble })} />}
        {o.clef !== 'treble' && <RangePicker label="טווח במפתח פה" notes={BASS_NOTES} value={o.bass} onChange={(bass) => set({ bass })} />}
        {ex === 'notes' && (
          <div className="field">
            <Switch label="כולל דיאז ובמול" hint="מוסיף לטווח את התווים עם ♯ ו־♭ — הקלידים השחורים" checked={!!o.accidentals} onChange={(accidentals) => set({ accidentals })} />
          </div>
        )}
        <div className="field">
          <span className="label">מספר תווים</span>
          <Seg value={o.count} onChange={(count) => set({ count })} ltr options={(ex === 'sequence' ? [16, 32, 48, 64] : [10, 20, 30, 50]).map((v) => ({ value: v, label: String(v) }))} />
        </div>
        <div className="field">
          <span className="label">זמן מרבי לתו (שניות)</span>
          {o.mode === 'practice' && ex === 'notes' && (
            <Switch label="זמן אדפטיבי" hint="המערכת מקצרת את הזמן רק לתווים שכבר יציבים אצלך" checked={o.adaptiveTime} onChange={(adaptiveTime) => set({ adaptiveTime })} />
          )}
          {!(o.mode === 'practice' && o.adaptiveTime && ex === 'notes') && (
            <>
              <div className="row wrap" dir="ltr" style={{ gap: 6, marginTop: 6 }}>
                {TIMES.map((t) => (
                  <button key={t.label} className={`btn small ${o.timeLimitMs === t.v ? 'primary' : ''}`} style={{ minWidth: 44 }}
                    onClick={() => set({ timeLimitMs: t.v })}>{t.label}</button>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="row between faint"><span>הגדרה ידנית</span><span className="num">{o.timeLimitMs ? (o.timeLimitMs / 1000).toFixed(1) : '—'}{custom ? ' (ידני)' : ''}</span></div>
                <input type="range" min={500} max={15000} step={100} dir="ltr" value={o.timeLimitMs ?? 15000}
                  onChange={(e) => set({ timeLimitMs: Number(e.target.value) })} aria-label="זמן לתו" />
              </div>
            </>
          )}
        </div>
        </>
        )}
      </div>

      <button className="btn primary big block" style={{ marginTop: 16 }} onClick={() => start(freeSession(o, settings))}>
        {o.mode === 'test' ? 'התחילי מבחן' : 'התחילי תרגול'}
      </button>
      {naming && <Sheet title="שמירה כמועדף" confirmLabel="שמירה" input={{ initial: defaultName }} onConfirm={save} onCancel={() => setNaming(false)} />}
      <button className="btn ghost block" style={{ marginTop: 8 }} onClick={() => setNaming(true)}><Icon name="star" size={16} />שמרי כמועדף</button>
    </div>
  );
}
