// First run: name, a sound check that solves the iPhone silent-switch problem up front, and what we'll learn.

import { useState } from 'react';
import { audio } from '../../audio/engine';
import { useApp, useStore } from '../../state/store';
import { Icon } from '../components/ui';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { settings } = useApp();
  const store = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.name);
  const [heard, setHeard] = useState<null | boolean>(null);
  const [played, setPlayed] = useState(false);

  const test = () => {
    audio.unlock();
    const t = (audio.context?.currentTime ?? 0) + 0.1;
    [60, 64, 67, 72].forEach((m, i) => audio.playNote(m, 0.8, t + i * 0.2, 0.8));
    setPlayed(true);
  };

  const finish = () => {
    store.updateSettings({ name: name.trim(), onboarded: true });
    onDone();
  };

  return (
    <div className="page onboarding">
      <div className="ob-steps" aria-label={`שלב ${step + 1} מתוך 3`}>{[0, 1, 2].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>

      {step === 0 && (
        <div className="ob-card">
          <svg className="ob-staff" viewBox="0 0 340 92" aria-hidden="true">
            {[22, 34, 46, 58, 70].map((y) => <line key={y} x1="0" x2="340" y1={y} y2={y} />)}
            {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((l, i) => (
              <g key={l} transform={`translate(${34 + i * 45} ${82 - i * 6}) rotate(-20)`} style={{ animationDelay: `${i * 70}ms` }} className="ob-note">
                <ellipse rx="10" ry="7.5" />
              </g>
            ))}
            <line x1="22" x2="46" y1="82" y2="82" />
          </svg>
          <h1 className="ob-title">ברוכה הבאה ל־NoteFlow</h1>
          <p className="muted">כאן לומדים לקרוא תווים ולמצוא אותם על הפסנתר — כמה דקות ביום, בקצב שלך.</p>
          <label htmlFor="ob-name" className="label" style={{ marginTop: 18 }}>איך לקרוא לך?</label>
          <input id="ob-name" className="text-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          <button className="btn keycta" style={{ marginTop: 18 }} onClick={() => setStep(1)}>ממשיכים</button>
        </div>
      )}

      {step === 1 && (
        <div className="ob-card">
          <h1 className="ob-title">בדיקת צליל</h1>
          <p className="muted">כל תו באפליקציה מושמע. בואי נוודא שהצליל עובד לפני שמתחילים.</p>
          <button className="btn big block" style={{ marginTop: 14 }} onClick={test}><Icon name="sound" />השמעת צליל</button>
          {played && heard === null && (
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn grow primary" onClick={() => setHeard(true)}>שמעתי</button>
              <button className="btn grow" onClick={() => setHeard(false)}>לא שמעתי</button>
            </div>
          )}
          {heard === false && (
            <div className="banner" style={{ marginTop: 12 }}>
              <b>מה לבדוק באייפון:</b>
              <ul style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>
                <li>להגביר את העוצמה בכפתורי הצד, כשהאפליקציה פתוחה.</li>
                <li>מתג השקט בצד המכשיר — לנסות כשהוא כבוי.</li>
                <li>אוזניות Bluetooth מחוברות? הצליל אולי יוצא שם.</li>
              </ul>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn small" onClick={() => { setHeard(null); test(); }}>לנסות שוב</button>
                <button className="btn small ghost" onClick={() => setStep(2)}>אמשיך בכל זאת</button>
              </div>
            </div>
          )}
          {heard === true && <button className="btn keycta" style={{ marginTop: 18 }} onClick={() => setStep(2)}>מעולה, ממשיכים</button>}
        </div>
      )}

      {step === 2 && (
        <div className="ob-card">
          <h1 className="ob-title">מה נלמד</h1>
          <ul className="ob-list">
            <li><b>לקרוא תווים</b><span>מתחילים בחמישה תווים במפתח סול, ומוסיפים בהדרגה.</span></li>
            <li><b>למצוא אותם על המקלדת</b><span>כל תו גם במקומו על הפסנתר — כדי שהידיים יידעו כשתגיע מקלדת.</span></li>
            <li><b>מנגינות ומקצב</b><span>משפטים מוזיקליים, Ode to Joy ו־Twinkle, ודופק בהקשה.</span></li>
          </ul>
          <p className="muted">עשר דקות ביום מספיקות. אין רצפים שנשברים ואין עונש על יום שהוחמץ.</p>
          <button className="btn keycta" style={{ marginTop: 10 }} onClick={finish}>בואי נתחיל</button>
        </div>
      )}
    </div>
  );
}
