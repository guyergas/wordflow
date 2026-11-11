import { useState } from 'react';
import { ltrTitle, RECOMMENDED_ORDER, Skill, stageById, stageExercise, stageSkills, TRACKS } from '../../engine/curriculum';
import { LESSONS } from '../../engine/lessons';
import { SessionPlan, stagePractice, stageTest } from '../../engine/sessions';
import { recommend, stageProgress, STATUS_LABEL, StageStatus } from '../../engine/stats';
import { useApp } from '../../state/store';
import { Bar, fmtPct, fmtSec, Seg, TopBar } from '../components/ui';

const statusChip = (s: StageStatus) => (s === 'mastered' ? 'gold' : s === 'passed' ? 'good' : s === 'ready' ? 'accent' : '');

/** The learning path as a journey: one rail, a node per stage; the current stage is open. */
export function Path({ start, onBack, onLesson }: { start: (p: SessionPlan) => void; onBack: () => void; onLesson: (id: string) => void }) {
  const { idx, sessions, settings } = useApp();
  const [skill, setSkill] = useState<Skill>('name');
  const rec = recommend(idx, sessions, settings);
  const [open, setOpen] = useState<string | null>(rec.stageId);

  return (
    <div className="page with-nav">
      <TopBar title="המסע" onBack={onBack} />
      <p className="muted" style={{ marginTop: -6 }}>
        הסדר הוא המלצה — שום שלב לא נעול. בשלבי התווים והמנגינות נמדדות בנפרד שתי מיומנויות: שם התו, ומציאתו על המקלדת.
      </p>
      <Seg value={skill} onChange={setSkill} options={[{ value: 'name', label: 'שמות התווים' }, { value: 'key', label: 'מקלדת' }]} />

      <ol className="journey">
        {RECOMMENDED_ORDER.map((id, i) => {
          const st = stageById(id);
          const ex = stageExercise(st);
          const skills = stageSkills(st);
          const sk: Skill = skills.includes(skill) ? skill : skills[0];
          const pn = stageProgress(st, 'name', idx, sessions, settings);
          const pk = skills.includes('key') ? stageProgress(st, 'key', idx, sessions, settings) : null;
          const cur = sk === 'key' && pk ? pk : pn;
          const track = TRACKS.find((t) => t.id === st.track)!;
          const isRec = rec.stageId === id;
          const isOpen = open === id;
          const lastTest = [...sessions].reverse().find((s) => s.config.kind === 'stage-test' && s.config.stageId === id && s.config.skill === sk);
          return (
            <li key={id} className={`jstep ${cur.status} ${isRec ? 'here' : ''} ${isOpen ? 'open' : ''}`}>
              <span className="node" aria-hidden="true">{cur.status === 'mastered' ? '★' : cur.status === 'passed' ? '✓' : i + 1}</span>
              <button className="jhead" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
                <span className="jtitle">
                  <b className={ltrTitle(st) ? 'ltr' : undefined}>{st.title}</b>
                  <small>{track.title}{isRec ? ' · את כאן' : ''}</small>
                </span>
                <span className={`chip ${statusChip(cur.status)}`}>{STATUS_LABEL[cur.status]}</span>
              </button>
              {isOpen && (
                <div className="jbody">
                  <div className="sub">{st.subtitle}</div>
                  {ex === 'rhythm' ? (
                    <div className="skill-line"><span className="faint">מקצב</span><Bar value={pn.progress} gold={pn.status === 'mastered'} /><span className="faint num">{Math.round(pn.progress * 100)}%</span></div>
                  ) : (
                    <>
                      <div className="skill-line"><span className="faint">שמות</span><Bar value={pn.progress} gold={pn.status === 'mastered'} /><span className="faint num">{Math.round(pn.progress * 100)}%</span></div>
                      {pk && <div className="skill-line"><span className="faint">מקלדת</span><Bar value={pk.progress} gold={pk.status === 'mastered'} /><span className="faint num">{Math.round(pk.progress * 100)}%</span></div>}
                    </>
                  )}
                  {lastTest && (
                    <div className="faint">
                      מבחן אחרון: {lastTest.summary.score} · {lastTest.summary.rhythm ? `בזמן ${fmtPct(lastTest.summary.rhythm.timingAccuracy)}` : `דיוק ${fmtPct(lastTest.summary.accuracy)} · חציון ${fmtSec(lastTest.summary.medianRt)}`}
                    </div>
                  )}
                  <div className="row" style={{ marginTop: 10 }}>
                    {LESSONS[id] && <button className="btn small ghost" onClick={() => onLesson(id)}>הסבר</button>}
                    <button className="btn small grow primary" onClick={() => start(stagePractice(id, sk, settings))}>תרגול</button>
                    <button className={`btn small grow ${cur.status === 'ready' ? 'gold' : ''}`} onClick={() => start(stageTest(id, sk, settings))}>מבחן שליטה</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="faint" style={{ marginTop: 16 }}>
        תווים: "מוכנה למבחן" — כל תו בשלב נענה לפחות 5 פעמים ב־80% דיוק. "עבר מבחן" — {fmtPct(settings.masteryAccuracy)} דיוק וחציון של עד {fmtSec(settings.fluencyTargetMs)} (במקלדת {fmtSec(settings.fluencyTargetMs * 1.5)}).
        מנגינות: אותם ספים, במבחן עם מנגינות מקוריות שעוד לא ראית. מקצב: 85% מהצלילים בזמן.
        "שולטת": עברת שוב אחרי יום לפחות — הוכחה שהידע נשמר.
      </p>
    </div>
  );
}
