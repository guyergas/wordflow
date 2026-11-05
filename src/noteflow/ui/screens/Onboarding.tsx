// First run of the piano course: the user's name comes from the app, and the sound needs no separate check.

import { USER_NAME } from '../../../course';
import { useStore } from '../../state/store';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const store = useStore();

  const finish = () => {
    store.updateSettings({ name: USER_NAME, onboarded: true });
    onDone();
  };

  return (
    <div className="page onboarding">
      <div className="ob-card">
        <h1 className="ob-title">מה נלמד</h1>
        <ul className="ob-list">
          <li><b>לקרוא תווים</b><span>מתחילים בחמישה תווים במפתח סול, ומוסיפים בהדרגה.</span></li>
          <li><b>למצוא אותם על המקלדת</b><span>כל תו גם במקומו על הפסנתר — כדי שהידיים יידעו כשתגיע מקלדת.</span></li>
          <li><b>מנגינות ומקצב</b><span>משפטים מוזיקליים, Ode to Joy ו־Twinkle, ודופק בהקשה.</span></li>
        </ul>
        <p className="muted">עשר דקות ביום מספיקות. אין רצפים שנשברים ואין עונש על יום שהוחמץ.</p>
        <button className="btn keycta" style={{ marginTop: 10 }} onClick={finish}>מתחילים</button>
      </div>
    </div>
  );
}
