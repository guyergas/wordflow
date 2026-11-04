import { useEffect, useState } from 'react';

function fmtClock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Session progress: one dot per question (filled as answered, colored in practice),
 * or a time bar for timed daily-plan blocks.
 */
export function SessionProgress({ title, done, total, marks, notes, showMarks, budget, paused }: {
  title: string;
  done: number;
  total: number;
  marks?: boolean[];
  /** Note letter of each answered question: a correct answer fills its dot with that note's colour. */
  notes?: string[];
  showMarks?: boolean;
  budget?: { startedAt: number; ms: number };
  paused?: boolean;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!budget || paused) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [budget, paused]);

  if (budget) {
    const left = budget.ms - (now - budget.startedAt);
    return (
      <div className="s-progress">
        <div className="s-meta"><span>{title}</span><span className="num" dir="ltr">{fmtClock(left)}</span></div>
        <div className="bar"><span style={{ width: `${Math.min(100, ((now - budget.startedAt) / budget.ms) * 100)}%` }} /></div>
      </div>
    );
  }
  if (total <= 30) {
    return (
      <div className="s-progress">
        <div className="s-meta"><span>{title}</span><span className="num">{Math.min(done + 1, total)} / {total}</span></div>
        <div className="dots" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => {
            const m = marks?.[i];
            const cls = i < done ? (showMarks && m !== undefined ? (m ? 'ok' : 'no') : 'done') : i === done ? 'cur' : '';
            const nc = cls === 'ok' && notes?.[i] ? { ['--nc' as string]: `var(--n-${notes[i]})` } : undefined;
            return <i key={i} className={cls} style={nc} />;
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="s-progress">
      <div className="s-meta"><span>{title}</span><span className="num">{Math.min(done + 1, total)} / {total}</span></div>
      <div className="bar"><span style={{ width: `${(done / Math.max(1, total)) * 100}%` }} /></div>
    </div>
  );
}
