// Real keyboard: listening through the microphone (or a MIDI cable), with a live test.

import { useEffect, useState } from 'react';
import { InputState, noteInput } from '../../audio/input';
import { pitchFromMidi } from '../../engine/exercise';
import { clefForMidi, pitchName } from '../../music/pitch';
import { Staff } from '../../notation/Staff';
import { useApp, useStore } from '../../state/store';
import { Icon, Switch, TopBar } from '../components/ui';

export function Instrument({ onBack }: { onBack: () => void }) {
  const { settings } = useApp();
  const store = useStore();
  const [state, setState] = useState<InputState>(noteInput.state);
  const [level, setLevel] = useState(0);
  const [live, setLive] = useState<number | null>(null);
  const [heard, setHeard] = useState<number[]>([]);
  const [testing, setTesting] = useState(false);
  const on = settings.input === 'external';

  useEffect(() => {
    if (!testing) return;
    const a = noteInput.onState(setState);
    const b = noteInput.onFrame((f) => { setLevel(Math.min(1, f.rms * 8)); setLive(f.midi); });
    const c = noteInput.onNote((e) => setHeard((h) => [e.midi, ...h].slice(0, 8)));
    void noteInput.start().then(setState);
    return () => { a(); b(); c(); noteInput.stop(); };
  }, [testing]);

  const last = heard[0];
  const lastPitch = last != null ? pitchFromMidi(last) : null;

  return (
    <div className="page with-nav">
      <TopBar title="מקלדת אמיתית" onBack={onBack} />
      <p className="muted" style={{ marginTop: -6 }}>
        כשתגיע מקלדת — האפליקציה יכולה להקשיב לה. בכל תרגיל שבו מוצאים קלידים, אפשר לנגן על הפסנתר האמיתי במקום על המסך,
        והמיקרופון יזהה איזה צליל ניגנת.
      </p>

      <div className="card">
        <Switch checked={on} onChange={(v) => store.updateSettings({ input: v ? 'external' : 'screen' })}
          label="להקשיב למקלדת אמיתית" hint={on ? 'פעיל — בתרגילי מקלדת, מנגינות, שתי ידיים ונגינה עם ליווי' : 'כבוי — רק המקלדת שעל המסך'} />
      </div>

      <div className="eyebrow">בדיקה</div>
      <div className="card instrument-test">
        {!testing ? (
          <>
            <p style={{ marginTop: 0 }}>נגני כמה צלילים בודדים, לאט, ובדקי שהאפליקציה מזהה אותם נכון.</p>
            <button className="btn primary block" onClick={() => setTesting(true)}><Icon name="sound" />הפעלת המיקרופון ובדיקה</button>
            <p className="faint" style={{ marginBottom: 0 }}>הדפדפן יבקש אישור להשתמש במיקרופון. הקול לא נשמר ולא נשלח לשום מקום — הזיהוי קורה במכשיר.</p>
          </>
        ) : state === 'denied' ? (
          <div className="banner">
            <b>אין גישה למיקרופון.</b> באייפון: הגדרות ← Safari ← מיקרופון ← "לשאול" או "לאפשר", ואז לנסות שוב.
            <div className="row" style={{ marginTop: 8 }}><button className="btn small" onClick={() => { setTesting(false); window.setTimeout(() => setTesting(true), 50); }}>לנסות שוב</button></div>
          </div>
        ) : state === 'unsupported' || state === 'error' ? (
          <div className="banner">המיקרופון לא זמין כאן{noteInput.lastError ? ` (${noteInput.lastError})` : ''}. בטלפון, פתחי את האפליקציה מהמסך הראשי או ב־Safari.</div>
        ) : (
          <>
            <div className="meter" aria-label="עוצמת קול"><span style={{ transform: `scaleX(${level})` }} /></div>
            <div className="live-note" aria-live="polite">
              <span className="faint">שומעת:</span> <b className="num" dir="ltr">{live != null ? pitchName(pitchFromMidi(live)) : '—'}</b>
            </div>
            {lastPitch && (
              <div className="staff-card" style={{ marginTop: 8 }}>
                <Staff clef={clefForMidi(last)} notes={[{ pitch: lastPitch, role: 'target' }]} scale={1.4} ariaLabel={`זוהה ${pitchName(lastPitch)}`} />
              </div>
            )}
            <div className="row wrap" style={{ marginTop: 8, gap: 6 }} dir="ltr">
              {heard.map((m, i) => <span key={i} className="chip">{pitchName(pitchFromMidi(m))}</span>)}
            </div>
            <button className="btn small" style={{ marginTop: 10 }} onClick={() => setTesting(false)}>סיום הבדיקה</button>
          </>
        )}
      </div>

      <div className="eyebrow">טיפים</div>
      <div className="card">
        <ul className="tips">
          <li>חדר שקט, והטלפון במרחק של כמה עשרות סנטימטרים מהרמקולים של המקלדת.</li>
          <li>צליל אחד בכל פעם. אקורדים (כמה צלילים יחד) עדיין לא מזוהים.</li>
          <li>כשהאפליקציה משמיעה תו לדוגמה, היא לא מקשיבה לאותו צליל עד שהוא נגמר — כדי לא "לשמוע את עצמה".</li>
          <li>מקלדת עם יציאת USB/MIDI? במחשב (Chrome) אפשר לחבר בכבל, והזיהוי מדויק ומיידי.{noteInput.midiDevices.length ? ` מחובר: ${noteInput.midiDevices.join(', ')}.` : ''}</li>
        </ul>
      </div>
    </div>
  );
}
