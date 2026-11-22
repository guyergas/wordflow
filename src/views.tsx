// Several screens on one bar tab, as sections that fold open and closed. Keeps the bottom bar short.
// The first is open. A section's content is drawn only while it is open.
import { ReactNode, useState } from 'react';

export function Views({ views }: { views: [string, string, () => ReactNode][] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ [views[0][0]]: true });
  return (
    <div className="folds">
      {views.map(([k, label, body]) => (
        <details key={k} className="fold" open={!!open[k]} onToggle={(e) => { const o = (e.currentTarget as HTMLDetailsElement).open; setOpen((s) => (s[k] === o ? s : { ...s, [k]: o })); }}>
          <summary>{label}</summary>
          {open[k] && <div className="fold-body">{body()}</div>}
        </details>
      ))}
    </div>
  );
}
