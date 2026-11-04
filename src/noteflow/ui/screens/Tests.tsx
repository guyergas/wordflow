import { ltrTitle, RECOMMENDED_ORDER, stageById, stageSkills } from '../../engine/curriculum';
import { SessionPlan, stageTest } from '../../engine/sessions';
import { skillLabel, stageProgress, STATUS_LABEL } from '../../engine/stats';
import { useApp } from '../../state/store';
import { fmtPct, fmtSec, TopBar } from '../components/ui';

export function Tests({ start, onBack, onFree }: { start: (p: SessionPlan) => void; onBack: () => void; onFree: () => void }) {
  const { idx, sessions, settings } = useApp();
  const history = sessions.filter((s) => s.config.mode === 'test').slice(-20).reverse();
  const title = (s: (typeof sessions)[number]) =>
    s.config.kind === 'daily' ? 'אתגר יומי' : s.config.stageId ? `${skillLabel(stageById(s.config.stageId), s.config.skill)} · ${stageById(s.config.stageId).title}`
      : s.config.exercise === 'rhythm' ? 'מבחן מקצב חופשי' : s.config.exercise === 'sequence' ? 'מבחן מנגינות חופשי' : 'מבחן חופשי';

  return (
    <div className="page with-nav">
      <TopBar title="מבחנים" onBack={onBack} />
      <p className="muted" style={{ marginTop: -6 }}>במבחן אין רמזים ואין משוב עד הסוף. מבחן שליטה עובר ב־{fmtPct(settings.masteryAccuracy)} דיוק ובחציון מהירות של עד {fmtSec(settings.fluencyTargetMs)}.</p>
      <button className="btn block" onClick={onFree}>מבחן חופשי — בוחרים טווח וזמן</button>

      <div className="eyebrow">מבחני שליטה</div>
      <div className="card">
        <ul className="list">
          {RECOMMENDED_ORDER.flatMap((id) => stageSkills(stageById(id)).map((skill) => {
            const st = stageById(id);
            const p = stageProgress(st, skill, idx, sessions, settings);
            return (
              <li key={`${id}-${skill}`} style={{ alignItems: 'center' }}>
                <div>
                  <b className={ltrTitle(st) ? 'ltr' : undefined}>{st.title}</b> <span className="faint">· {skillLabel(st, skill)}</span>
                  <div className="faint">{STATUS_LABEL[p.status]}</div>
                </div>
                <button className={`btn small ${p.status === 'ready' ? 'gold' : ''}`} onClick={() => start(stageTest(id, skill, settings))}>התחילי</button>
              </li>
            );
          }))}
        </ul>
      </div>

      <div className="eyebrow">היסטוריה</div>
      <div className="card">
        {history.length === 0 ? <div className="faint">עוד אין מבחנים. המבחן הראשון יופיע כאן.</div> : (
          <ul className="list">
            {history.map((s) => (
              <li key={s.id}>
                <div>
                  <b>{title(s)}</b>
                  <div className="faint">{new Date(s.endedAt).toLocaleDateString('he-IL')} · {s.summary.rhythm ? `בזמן ${fmtPct(s.summary.rhythm.timingAccuracy)}` : `דיוק ${fmtPct(s.summary.accuracy)} · חציון ${fmtSec(s.summary.medianRt)}`}</div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <b className="num">{s.summary.score}</b>
                  {s.summary.passed !== undefined && <div className={s.summary.passed ? 'delta-up' : 'faint'} style={{ fontSize: 12 }}>{s.summary.passed ? 'עבר' : 'לא עבר'}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
