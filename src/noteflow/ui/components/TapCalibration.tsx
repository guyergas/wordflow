import { useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { median } from '../../engine/stats';
import { useApp, useStore } from '../../state/store';

const BPM = 90;
const CLICKS = 12;

/** Measures how late taps register on this device (touch + speaker latency) by tapping along with clicks. */
export function TapCalibration() {
  const { settings } = useApp();
  const store = useStore();
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const clicks = useRef<number[]>([]);
  const taps = useRef<number[]>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => { window.clearTimeout(timer.current); audio.cancelScheduled(); }, []);

  const startCal = () => {
    audio.unlock();
    const ctx = audio.context;
    if (!ctx) return;
    const beat = 60 / BPM;
    const t0 = ctx.currentTime + 0.4;
    clicks.current = Array.from({ length: CLICKS }, (_, i) => t0 + i * beat);
    clicks.current.forEach((t, i) => audio.click(t, i % 4 === 0));
    taps.current = [];
    setRunning(true);
    setMsg('הקישי יחד עם הקליקים, מהקליק החמישי.');
    timer.current = window.setTimeout(() => {
      setRunning(false);
      const offs = taps.current.map((t) => {
        const near = clicks.current.slice(4).reduce((b, c) => (Math.abs(c - t) < Math.abs(b - t) ? c : b), Infinity);
        return t - near;
      }).filter((d) => Math.abs(d) < 0.25);
      if (offs.length < 4) { setMsg('לא נקלטו מספיק הקשות. נסי שוב.'); return; }
      const ms = Math.round(Math.max(0, Math.min(250, median(offs)! * 1000)));
      store.updateSettings({ tapOffsetMs: ms });
      setMsg(`נשמר: ${ms}ms. ההקשות בתרגילי המקצב יתוקנו בהתאם.`);
    }, (clicks.current[CLICKS - 1] - ctx.currentTime + 0.6) * 1000);
  };

  const tap = (e: React.PointerEvent) => {
    e.preventDefault();
    const ctx = audio.context;
    if (!running || !ctx) return;
    taps.current.push(ctx.currentTime - Math.max(0, performance.now() - e.timeStamp) / 1000);
  };

  return (
    <div className="field">
      <div className="row between"><span className="label" style={{ margin: 0 }}>כיול הקשה למקצב</span><span className="faint num" dir="ltr">{settings.tapOffsetMs}ms</span></div>
      <div className="faint" style={{ marginBottom: 8 }}>כל מכשיר מוסיף השהיה קטנה בין הצליל למגע. 12 קליקים, ומקישים יחד איתם.</div>
      {running ? (
        <button className="tapbtn live" style={{ height: 96 }} onPointerDown={tap}>הקישי עם הקליק</button>
      ) : (
        <div className="row">
          <button className="btn grow" onClick={startCal}>התחלת כיול</button>
          {settings.tapOffsetMs !== 0 && <button className="btn ghost" onClick={() => store.updateSettings({ tapOffsetMs: 0 })}>איפוס</button>}
        </div>
      )}
      {msg && <div className="faint" style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
