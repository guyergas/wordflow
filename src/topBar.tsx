// The same top of the home screen in every course, so moving between courses feels like one app.
import { CourseSwitch } from './users';

export const WfMark = () => <div className="wf-mark" aria-label="WordFlow"><b aria-hidden="true">W</b><span aria-hidden="true">ordFlow</span></div>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="8" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;

export function TopBar({ onSettings, className = '' }: { onSettings: () => void; className?: string }) {
  return <header className={`wf-top ${className}`}><WfMark /><CourseSwitch /><button type="button" className="wf-round" aria-label="הגדרות" onClick={onSettings}><SettingsIcon /></button></header>;
}

/** The home screen's greeting, by the hour, in every course. */
export function greeting(name?: string) {
  const hour = new Date().getHours(), hi = hour < 5 ? 'לילה טוב' : hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';
  return name ? `${hi}, ${name}` : hi;
}
