import { useRef, useState } from 'react';
import { audio } from '../../audio/engine';
import { importAll, requestPersistence, BackupFile } from '../../storage/db';
import { useApp, useStore } from '../../state/store';
import { fmtPct, fmtSec, Icon, Seg, Switch, TopBar } from '../components/ui';
import { googleCalendarUrl, reminderIcs } from '../../engine/reminder';
import { inHostFrame, saveFile } from '../download';
import { Sheet } from '../components/Sheet';
import { TapCalibration } from '../components/TapCalibration';

const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function Reminder() {
  const { settings: s } = useApp();
  const store = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  const toggle = (d: number) => {
    const days = s.reminderDays.includes(d) ? s.reminderDays.filter((x) => x !== d) : [...s.reminderDays, d];
    if (days.length) void store.updateSettings({ reminderDays: days });
  };
  const ics = async () => {
    const r = await saveFile('noteflow-reminder.ics', reminderIcs(s.reminderTime, s.reminderDays), 'text/calendar');
    setMsg(r === 'saved' ? 'נפתח קובץ יומן — אשרי "הוספה ליומן".' : r === 'declined' ? 'בוטל.' : 'כאן אי אפשר לפתוח קובץ יומן — אפשר דרך Google Calendar, או מהאפליקציה המותקנת.');
  };
  return (
    <>
      <div className="eyebrow">תזכורת יומית</div>
      <div className="card">
        <div className="field">
          <div className="row between" style={{ alignItems: 'center' }}>
            <label htmlFor="rem-time" className="label" style={{ margin: 0 }}>שעה</label>
            <input id="rem-time" type="time" className="text-input time-input" value={s.reminderTime} dir="ltr"
              onChange={(e) => e.target.value && void store.updateSettings({ reminderTime: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <span className="label">ימים</span>
          <div className="days" role="group" aria-label="ימי תזכורת">
            {DAY_LETTERS.map((l, d) => (
              <button key={d} className={s.reminderDays.includes(d) ? 'on' : ''} aria-pressed={s.reminderDays.includes(d)} onClick={() => toggle(d)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="row">
          {!inHostFrame() && <button className="btn grow primary" onClick={ics}><Icon name="bell" size={16} />הוספה ליומן</button>}
          <a className="btn grow" href={googleCalendarUrl(s.reminderTime, s.reminderDays)} target="_blank" rel="noopener noreferrer">Google Calendar</a>
        </div>
        <div className="faint" style={{ marginTop: 8 }}>אירוע חוזר של 10 דקות עם התראה, ביומן שלך. באייפון "הוספה ליומן" פותח את אפליקציית היומן.</div>
        {msg && <div className="chip accent" style={{ marginTop: 8 }}>{msg}</div>}
      </div>
    </>
  );
}

export function Settings({ onBack }: { onBack: () => void }) {
  const { settings: s, attempts } = useApp();
  const store = useStore();
  const set = (p: Partial<typeof s>) => void store.updateSettings(p);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  const doExport = async () => {
    const data = store.snapshotBackup();
    const json = JSON.stringify(data);
    const filename = `noteflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    // Inside the claude.ai viewer, files are offered through the host's download capability.
    const host = (window as unknown as { claude?: { use: (n: string) => Promise<{ save: (r: { filename: string; data: string }) => Promise<unknown> } | null> } }).claude;
    if (host?.use) {
      const dl = await host.use('downloads');
      if (dl) {
        try {
          await dl.save({ filename, data: json });
          setMsg('קובץ הגיבוי נשמר.');
        } catch (e) {
          const code = (e as { code?: string })?.code;
          setMsg(code === 'declined' ? 'הייצוא בוטל.' : 'לא ניתן לשמור קובץ בתצוגה הזו.');
        }
        return;
      }
      if (window.self !== window.top) { setMsg('לא ניתן לשמור קובץ בתצוגה הזו.'); return; }
    }
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setMsg('קובץ הגיבוי נוצר.');
  };

  const [soundInfo, setSoundInfo] = useState<string | null>(null);
  const testSound = () => {
    audio.unlock();
    [60, 64, 67, 72].forEach((m, i) => audio.playNote(m, 0.7, (audio.context?.currentTime ?? 0) + 0.05 + i * 0.18));
    setTimeout(() => {
      const st = audio.status();
      setSoundInfo(`audio: ${st.state} · samples ${st.samples}/${st.totalSamples} · media ${st.mediaUnlocked ? 'on' : 'off'} · ${st.sampleRate ?? '-'}Hz${st.lastError ? ` · ${st.lastError}` : ''}`);
    }, 1200);
  };
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [askReset, setAskReset] = useState(false);

  const readImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as BackupFile;
      if (data?.app !== 'noteflow') throw new Error('זה לא קובץ גיבוי של NoteFlow.');
      setPending(data);
    } catch (e) {
      setMsg(e instanceof Error && e.message.includes('NoteFlow') ? e.message : 'לא הצלחתי לקרוא את הקובץ. בחרי קובץ גיבוי שנוצר מ"ייצוא גיבוי".');
    }
  };

  const doImport = async (data: BackupFile) => {
    setPending(null);
    try {
      await store.flush();
      await importAll(data);
      await store.reload();
      setMsg('הנתונים שוחזרו.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'השחזור נכשל');
    }
  };

  const doReset = async () => {
    setAskReset(false);
    await store.reset();
    setMsg('ההתקדמות אופסה.');
  };

  return (
    <div className="page">
      <TopBar title="הגדרות" onBack={onBack} />

      <div className="eyebrow">מראה וצליל</div>
      <div className="card">
        <div className="field">
          <span className="label">ערכת צבעים</span>
          <Seg value={s.theme} onChange={(theme) => set({ theme })} options={[
            { value: 'system', label: 'לפי המכשיר' }, { value: 'light', label: 'בהיר' }, { value: 'dark', label: 'כהה' }, { value: 'evening', label: 'ערב' },
          ]} />
          <div className="faint" style={{ marginTop: 6 }}>"ערב": צבעים חמים ומעומעמים, צליל רך ושקט יותר — לתרגול לפני השינה.</div>
        </div>
        <div className="field"><Switch label="מצב ערב אוטומטי" hint="מ־20:00 עד 06:00" checked={s.autoEvening} onChange={(autoEvening) => set({ autoEvening })} /></div>
        <div className="field">
          <div className="row between"><span className="label" style={{ margin: 0 }}>עוצמה</span><span className="faint num">{Math.round(s.volume * 100)}%</span></div>
          <input type="range" min={0} max={1} step={0.05} value={s.volume} dir="ltr" aria-label="עוצמה"
            onChange={(e) => set({ volume: Number(e.target.value) })}
            onPointerUp={() => { audio.unlock(); audio.playNote(67, 0.6); }} />
        </div>
        <div className="field"><Switch label="צלילי משוב" hint="צליל עדין לטעות וצליל סיום" checked={s.feedbackSounds} onChange={(feedbackSounds) => set({ feedbackSounds })} /></div>
        <div className="field"><Switch label="השמעת כל תו כשהוא מופיע" hint="שומעים את הצליל ורואים את מיקומו בבת אחת" checked={s.playNoteOnShow} onChange={(playNoteOnShow) => set({ playNoteOnShow })} /></div>
        <div className="field"><Switch label="השמעת התו אחרי תשובה" hint="מחבר בין התמונה לצליל" checked={s.playNoteOnAnswer} onChange={(playNoteOnAnswer) => set({ playNoteOnAnswer })} /></div>
        <div className="field">
          <button className="btn block" onClick={testSound}>בדיקת צליל</button>
          {soundInfo && <div className="faint ltr" style={{ marginTop: 8, fontSize: 12.5, textAlign: 'left' }}>{soundInfo}</div>}
        </div>
        <div className="faint" style={{ paddingTop: 8 }}>אם אין צליל באייפון: הגבירי את עוצמת המדיה בכפתורי הצד, ונסי שוב עם מתג השקט במצב כבוי.</div>
      </div>

      <div className="eyebrow">נוחות קריאה</div>
      <div className="card">
        <div className="field">
          <span className="label">גודל התווים</span>
          <Seg value={s.noteSize} onChange={(noteSize) => set({ noteSize })} options={[{ value: 'normal', label: 'רגיל' }, { value: 'large', label: 'גדול' }]} />
          <div className="faint" style={{ marginTop: 6 }}>"גדול" מגדיל את החמשה ואת כפתורי התווים — נוח כשקוראים מטאבלט מרחוק.</div>
        </div>
        <div className="field"><Switch label="ניגודיות גבוהה" hint="שחור ולבן נקיים, קווים חדים יותר" checked={s.highContrast} onChange={(highContrast) => set({ highContrast })} /></div>
        <div className="field"><Switch label="פחות אנימציות" hint="ללא תנועה מלבד מה שנחוץ לתרגיל" checked={s.reduceMotion} onChange={(reduceMotion) => set({ reduceMotion })} /></div>
      </div>

      <div className="eyebrow">תרגול</div>
      <div className="card">
        <div className="field"><Switch label="שמות על הקלידים" hint="במבחן מוצגים רק סימוני ה־C" checked={s.showKeyNames} onChange={(showKeyNames) => set({ showKeyNames })} /></div>
        <div className="field"><Switch label="רמזים בתרגול" checked={s.hintsEnabled} onChange={(hintsEnabled) => set({ hintsEnabled })} /></div>
        <div className="field"><Switch label="מספרי אצבעות" hint="מעל מנגינות שנכנסות בחמש אצבעות (לא במבחנים)" checked={s.showFingers} onChange={(showFingers) => set({ showFingers })} /></div>
        <div className="field"><Switch label="להקשיב למקלדת אמיתית" hint="מיקרופון או כבל MIDI. בדיקה: תרגול ← מקלדת אמיתית" checked={s.input === 'external'} onChange={(v) => set({ input: v ? 'external' : 'screen' })} /></div>
        <div className="field"><Switch label="מעבר אוטומטי אחרי טעות" hint="כבוי: ממתין ללחיצה על 'המשך'" checked={s.autoAdvance} onChange={(autoAdvance) => set({ autoAdvance })} /></div>
        <TapCalibration />
        <div className="field">
          <span className="label">אורך אימון מומלץ</span>
          <Seg value={s.sessionLength} onChange={(sessionLength) => set({ sessionLength })} ltr options={[12, 20, 30, 40].map((v) => ({ value: v, label: String(v) }))} />
        </div>
        <div className="field">
          <span className="label">יעד שבועי (ימים)</span>
          <Seg value={s.weeklyGoalDays} onChange={(weeklyGoalDays) => set({ weeklyGoalDays })} ltr options={[2, 3, 4, 5, 6, 7].map((v) => ({ value: v, label: String(v) }))} />
        </div>
      </div>

      <Reminder />

      <div className="eyebrow">ספי שליטה</div>
      <div className="card">
        <div className="field">
          <div className="row between"><span className="label" style={{ margin: 0 }}>יעד מהירות (חציון)</span><span className="faint num">{fmtSec(s.fluencyTargetMs)}</span></div>
          <input type="range" min={800} max={4000} step={100} value={s.fluencyTargetMs} dir="ltr" aria-label="יעד מהירות"
            onChange={(e) => set({ fluencyTargetMs: Number(e.target.value) })} />
          <div className="faint">במקלדת היעד ארוך פי 1.5.</div>
        </div>
        <div className="field">
          <div className="row between"><span className="label" style={{ margin: 0 }}>דיוק נדרש במבחן</span><span className="faint num">{fmtPct(s.masteryAccuracy)}</span></div>
          <input type="range" min={0.8} max={1} step={0.05} value={s.masteryAccuracy} dir="ltr" aria-label="דיוק נדרש"
            onChange={(e) => set({ masteryAccuracy: Number(e.target.value) })} />
        </div>
      </div>

      <div className="eyebrow">נתונים</div>
      <div className="card stack">
        <div className="faint">כל הנתונים נשמרים רק במכשיר הזה ({attempts.length} ניסיונות). כדאי לגבות מדי פעם.</div>
        <div className="row">
          <button className="btn grow" onClick={doExport}>ייצוא גיבוי</button>
          <button className="btn grow" onClick={() => file.current?.click()}>שחזור מגיבוי</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void readImport(f); }} />
        </div>
        <button className="btn block" onClick={async () => setPersisted(await requestPersistence())}>בקשי מהדפדפן לשמור את הנתונים לצמיתות</button>
        {persisted !== null && <div className="faint">{persisted ? 'הדפדפן אישר אחסון קבוע.' : 'הדפדפן לא אישר. באייפון — התקנה למסך הבית פותרת את זה.'}</div>}
        <button className="btn danger block" onClick={() => setAskReset(true)}>איפוס התקדמות</button>
        {msg && <div className="chip accent">{msg}</div>}
      </div>

      {pending && (
        <Sheet title="שחזור מגיבוי" body={`בגיבוי יש ${pending.attempts.length} ניסיונות מ־${new Date(pending.exportedAt).toLocaleDateString('he-IL')}. הנתונים הנוכחיים יוחלפו.`}
          confirmLabel="שחזור" onConfirm={() => doImport(pending)} onCancel={() => setPending(null)} />
      )}
      {askReset && (
        <Sheet title="איפוס התקדמות" danger body="כל ההתקדמות, ההיסטוריה וההישגים יימחקו, ומסכי ההיכרות יופיעו מחדש. ההגדרות יישמרו. כדי לאשר, הקלידי: אפס"
          confirmLabel="איפוס" input={{ initial: '', placeholder: 'אפס', mustEqual: 'אפס' }} onConfirm={doReset} onCancel={() => setAskReset(false)} />
      )}
      <p className="faint" style={{ marginTop: 18 }}>
        שפת הממשק: עברית. שמות התווים בסימון אותיות (A–G) בלבד.
        דגימות הפסנתר: Salamander Grand Piano מאת Alexander Holm (CC-BY 3.0), דרך tonejs-instruments. תיווי: VexFlow.
      </p>
    </div>
  );
}
