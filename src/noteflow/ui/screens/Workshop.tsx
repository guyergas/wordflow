import { confusionPlan, confusions, confusionText } from '../../engine/extras';
import { mistakesSession, SessionPlan } from '../../engine/sessions';
import { parsePitch, pitchName } from '../../music/pitch';
import { useApp } from '../../state/store';
import { TopBar } from '../components/ui';

const KIND: Record<string, string> = { clef: 'בלבול בין מפתחות', adjacent: 'תו שכן', octave: 'אוקטבה', accidental: 'דיאז / במול', other: 'בלבול' };
const show = (id: string) => { try { return pitchName(parsePitch(id)); } catch { return id; } };

/** Recurring confusions, and a short drill that targets the cause. */
export function Workshop({ start, onBack }: { start: (p: SessionPlan) => void; onBack: () => void }) {
  const { attempts, settings } = useApp();
  const list = confusions(attempts);
  const recentWrong = attempts.filter((a) => !a.correct && a.ts > Date.now() - 7 * 86_400_000);
  const all = mistakesSession(recentWrong, settings);

  return (
    <div className="page with-nav">
      <TopBar title="סדנת טעויות" onBack={onBack} />
      <p className="muted" style={{ marginTop: -6 }}>
        כאן נאספים בלבולים שחוזרים על עצמם ב־30 הימים האחרונים. כל אימון ממוקד מתרגל את שני התווים שמתבלבלים, ואת השכנים שלהם.
      </p>
      {list.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <b>אין בלבולים חוזרים כרגע</b>
          <div className="faint" style={{ marginTop: 4 }}>בלבול מופיע כאן אחרי שקרה לפחות פעמיים.</div>
        </div>
      ) : (
        <div className="stack">
          {list.slice(0, 8).map((c) => (
            <div key={c.key} className="card conf">
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div className="pair" dir="ltr">
                  <b>{show(c.target)}</b><span>⇄</span><b>{/\d/.test(c.answer) ? show(c.answer) : c.answer}</b>
                </div>
                <span className="chip">{KIND[c.kind]} · {c.count}×</span>
              </div>
              <div className="faint" style={{ margin: '6px 0 10px' }}>
                {c.clef === 'treble' ? 'מפתח סול' : 'מפתח פה'} · {c.skill === 'key' ? 'מקלדת' : 'שמות'} · {confusionText(c)}
              </div>
              <button className="btn small primary" onClick={() => start(confusionPlan(c, settings))}>אימון ממוקד</button>
            </div>
          ))}
        </div>
      )}
      {all && (
        <button className="btn block" style={{ marginTop: 16 }} onClick={() => start({ ...all, title: 'כל הטעויות של השבוע' })}>
          תרגול כל הטעויות של השבוע ({all.pool.length} תווים)
        </button>
      )}
    </div>
  );
}
