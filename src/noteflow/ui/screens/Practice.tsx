import { confusions, coupleChallenge, listenPlan } from '../../engine/extras';
import { dailyChallenge, dailyDone, SessionPlan } from '../../engine/sessions';
import { dayKey } from '../../engine/stats';
import { useApp } from '../../state/store';
import { Icon, TopBar } from '../components/ui';
import type { Route } from '../App';

/** Everything that is not "today's practice": free play, games, songs, challenges and tests. */
export function Practice({ start, go }: { start: (p: SessionPlan) => void; go: (r: Route) => void }) {
  const { idx, sessions, settings, attempts } = useApp();
  const daily = dailyDone(sessions);
  const today = dayKey(Date.now());
  const couple = sessions.filter((x) => x.config.couple && dayKey(x.endedAt) === today).sort((a, b) => b.summary.score - a.summary.score)[0];
  const conf = confusions(attempts).length;

  return (
    <div className="page with-nav">
      <TopBar title="תרגול" />
      <div className="hub">
        <button className="tile" onClick={() => start(listenPlan(idx, sessions, settings))}>
          <Icon name="ear" /><b>שומעים ומוצאים</b><small>תו נשמע — איפה הוא על החמשה?</small>
        </button>
        <button className="tile" onClick={() => go('piano')}>
          <Icon name="keys" /><b>פסנתר חופשי</b><small>לנגן, לראות בתווים ולהקליט משפט</small>
        </button>
        <button className="tile" onClick={() => go('playalong')}>
          <Icon name="music" /><b>נגינה עם ליווי</b><small>את מנגנת את המנגינה, הפסנתר מלווה</small>
        </button>
        <button className="tile" onClick={() => go('symbols')}>
          <Icon name="note" /><b>סימנים מוזיקליים</b><small>מילון עם צלילים, וחידון</small>
        </button>
        <button className="tile" onClick={() => go('songs')}>
          <Icon name="book" /><b>ספר השירים</b><small>המנגינות שקראת, והמנגינה שגדלה איתך</small>
        </button>
        <button className="tile" onClick={() => go('workshop')}>
          <Icon name="tool" /><b>סדנת טעויות</b><small>{conf ? `${conf} בלבולים חוזרים לטפל בהם` : 'הבלבולים החוזרים, וטיפול ממוקד'}</small>
        </button>
        <button className="tile" onClick={() => go('instrument')}>
          <Icon name="mic" /><b>מקלדת אמיתית</b><small>{settings.input === 'external' ? 'פעיל: האפליקציה מקשיבה לפסנתר' : 'האפליקציה מקשיבה לפסנתר שלך'}</small>
        </button>
        <button className="tile" onClick={() => go('free')}>
          <Icon name="sliders" /><b>תרגול חופשי</b><small>בוחרים מפתח, טווח, זמן ומקצב</small>
        </button>
        <button className="tile" onClick={() => go('tests')}>
          <Icon name="test" /><b>מבחנים</b><small>מבחני שליטה והיסטוריה</small>
        </button>
        <button className="tile wide" onClick={() => start(dailyChallenge(idx, sessions, settings))}>
          <span style={{ display: 'grid', gap: 2 }}><b>אתגר היום</b><small>20 תווים, 3 שניות לכל אחד — לפי מה שכבר למדת</small></span>
          {daily ? <span className="done">היום: {daily.summary.score}</span> : <Icon name="calendar" />}
        </button>
        <button className="tile wide" onClick={() => start(coupleChallenge())}>
          <span style={{ display: 'grid', gap: 2 }}><b>אתגר זוגי</b><small>אותם 20 תווים לכל מי שפותח היום. שולחים תוצאה ומשווים</small></span>
          {couple ? <span className="done">היום: {couple.summary.score}</span> : <Icon name="heart" />}
        </button>
      </div>
    </div>
  );
}
