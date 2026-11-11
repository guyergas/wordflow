// The same top of the home screen in every course, so moving between courses feels like one app.
// The person and course are shown, not switched: switching lives in settings.
import { useState } from 'react';
import { COURSE_INFO, USER_NAME } from './course';
import { SettingsIcon, SettingsSheet } from './settingsSheet';

export const WfMark = () => <div className="wf-mark" aria-label="WordFlow"><b aria-hidden="true">W</b><span aria-hidden="true">ordFlow</span></div>;
const Where = () => <span className="wf-label">{[USER_NAME, COURSE_INFO.short ?? COURSE_INFO.name].filter(Boolean).join(' · ')}</span>;
const Gear = ({ onClick }: { onClick: () => void }) => <button type="button" className="wf-round" aria-label="הגדרות" onClick={onClick}><SettingsIcon /></button>;

export function TopBar({ onSettings, className = '' }: { onSettings: () => void; className?: string }) {
  return <header className={`wf-top ${className}`}><WfMark /><Where /><Gear onClick={onSettings} /></header>;
}

/** The top of a first-run screen: the same settings button, so nobody gets stuck in one course. */
export function FirstRunTop() {
  const [open, setOpen] = useState(false);
  return <><header className="wf-top onb-top"><WfMark /><Where /><Gear onClick={() => setOpen(true)} /></header>{open && <SettingsSheet onClose={() => setOpen(false)} />}</>;
}

/** The home screen's greeting, by the hour, in every course. */
export function greeting(name?: string) {
  const hour = new Date().getHours(), hi = hour < 5 ? 'לילה טוב' : hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';
  return name ? `${hi}, ${name}` : hi;
}
