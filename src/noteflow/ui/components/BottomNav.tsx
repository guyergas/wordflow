import { useState } from 'react';
import { dbUrl } from '../../../familySync';
import { FamilySheet } from '../../../family';
import type { Route } from '../App';
import { Icon } from './ui';

const TABS: { route: Route; label: string; icon: string }[] = [
  { route: 'home', label: 'בית', icon: 'home' },
  { route: 'path', label: 'מסלול', icon: 'path' },
  { route: 'practice', label: 'תרגול', icon: 'keys' },
  { route: 'stats', label: 'התקדמות', icon: 'chart' },
];

export function BottomNav({ route, go }: { route: Route; go: (r: Route) => void }) {
  const active = (r: Route) => r === route
    || (r === 'practice' && ['free', 'freetest', 'tests', 'songs', 'workshop', 'piano'].includes(route));
  const [family, setFamily] = useState(false);
  if (family) return <FamilySheet onClose={() => setFamily(false)} />;
  return (
    <nav className="bottomnav" aria-label="ניווט ראשי">
      {TABS.map((t) => (
        <button key={t.route} className={active(t.route) ? 'on' : ''} aria-current={active(t.route) ? 'page' : undefined} onClick={() => go(t.route)}>
          <Icon name={t.icon} size={22} />
          <span>{t.label}</span>
        </button>
      ))}
      {dbUrl() && <button onClick={() => setFamily(true)}><span>משפחה</span></button>}
    </nav>
  );
}
