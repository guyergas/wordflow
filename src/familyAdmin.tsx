// What a parent manages: the family's people and roles, and the invite link. Guy also opens new families.
import { useState } from 'react';
import { USER_ID, USERS } from './course';
import { createFamily, deletePerson, inviteLink, listFamilies, newUserId, Person, Role, ROLES, savePerson } from './families';

function Invite({ link, label = 'קישור הזמנה למשפחה' }: { link: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: 'WordFlow', text: 'הצטרפות למשפחה ב־WordFlow', url: link }); return; } } catch { return; /* closed by the person */ }
    try { await navigator.clipboard.writeText(link); setCopied(true); } catch { /* the link is shown and can be copied by hand */ }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { /* shown below */ } };
  return (
    <div className="fa-invite">
      <b>{label}</b>
      <p className="cs-note">פותחים את הקישור פעם אחת בכל מכשיר חדש, ואז בוחרים מי לומד.</p>
      <code dir="ltr">{link}</code>
      <div className="fa-actions">
        <button type="button" className="fa-btn main" onClick={share}>שיתוף</button>
        <button type="button" className="fa-btn" onClick={copy}>{copied ? 'הועתק ✓' : 'העתקה'}</button>
      </div>
    </div>
  );
}

function GenderPick({ she, onChange }: { she: boolean; onChange: (v: boolean) => void }) {
  return <div className="fam-seg" role="group" aria-label="פנייה">{[[false, 'בן / גבר'], [true, 'בת / אישה']].map(([v, t]) => <button key={String(v)} type="button" aria-pressed={she === v} onClick={() => onChange(v as boolean)}>{t as string}</button>)}</div>;
}

function PersonForm({ person, isNew, onDone }: { person: Person; isNew: boolean; onDone: (changed: boolean) => void }) {
  const [p, setP] = useState(person);
  const [busy, setBusy] = useState(false), [err, setErr] = useState(''), [sure, setSure] = useState(false);
  const parents = USERS.filter((u) => u.role === 'parent' && u.id !== person.id).length;
  const lastParent = person.role === 'parent' && parents === 0 && !isNew;
  const run = async (f: () => Promise<void>) => {
    setBusy(true); setErr('');
    try { await f(); if (person.id === USER_ID) { location.reload(); return; } onDone(true); } catch { setErr('לא נשמר. צריך חיבור לאינטרנט.'); setBusy(false); }
  };
  const save = () => run(async () => {
    const clean = { ...p, name: p.name.trim() };
    await savePerson(clean);
    const i = USERS.findIndex((u) => u.id === clean.id);
    if (i >= 0) USERS.splice(i, 1, clean); else USERS.push(clean);
  });
  const remove = () => run(async () => { await deletePerson(person.id); const i = USERS.findIndex((u) => u.id === person.id); if (i >= 0) USERS.splice(i, 1); });
  return (
    <div className="fa-form">
      <label className="fa-field"><span>שם</span><input value={p.name} maxLength={20} onChange={(e) => setP({ ...p, name: e.target.value })} /></label>
      <GenderPick she={p.she} onChange={(she) => setP({ ...p, she })} />
      <div className="fa-roles" role="group" aria-label="תפקיד">
        {ROLES.map((r) => <button key={r.id} type="button" aria-pressed={p.role === r.id} disabled={lastParent && r.id !== 'parent'} onClick={() => setP({ ...p, role: r.id as Role })}><b>{r.name}</b><small>{r.note}</small></button>)}
      </div>
      {lastParent && <p className="cs-note">צריך לפחות הורה אחד במשפחה.</p>}
      {!isNew && p.role !== person.role && <p className="cs-note">החלפת תפקיד משנה אילו קורסים פתוחים. ההתקדמות נשמרת.</p>}
      {err && <p className="cs-note fa-err">{err}</p>}
      <div className="fa-actions">
        <button type="button" className="fa-btn main" disabled={busy || !p.name.trim()} onClick={save}>{isNew ? 'הוספה' : 'שמירה'}</button>
        <button type="button" className="fa-btn" disabled={busy} onClick={() => onDone(false)}>ביטול</button>
      </div>
      {!isNew && person.id !== USER_ID && !lastParent && (sure
        ? <div className="fa-danger"><p>למחוק את {person.name}? כל ההתקדמות וזמני הלימוד יימחקו מכל המכשירים, ואי אפשר להחזיר.</p><div className="fa-actions"><button type="button" className="fa-btn danger" disabled={busy} onClick={remove}>כן, למחוק</button><button type="button" className="fa-btn" onClick={() => setSure(false)}>לא</button></div></div>
        : <button type="button" className="cs-link fa-del" onClick={() => setSure(true)}>מחיקת {person.name}</button>)}
    </div>
  );
}

const roleName = (r: Role) => ROLES.find((x) => x.id === r)?.name ?? r;

/** The family's people for a parent: change a name, form of address or role, add someone, remove someone. */
export function FamilyAdmin({ onChange }: { onChange?: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const done = (changed: boolean) => { setEditing(null); if (changed) onChange?.(); };
  const fresh: Person = { id: '', name: '', she: true, role: 'kid', order: Math.max(-1, ...USERS.map((u) => u.order ?? 0)) + 1 };
  return (
    <section className="st-sec fa-card">
      <h3>ניהול המשפחה</h3>
      <Invite link={inviteLink()} />
      <div className="fa-people">
        {USERS.map((u) => editing === u.id
          ? <PersonForm key={u.id} person={u} isNew={false} onDone={done} />
          : <button key={u.id} type="button" className="fa-person" onClick={() => setEditing(u.id)}><span><b>{u.name}</b><small>{roleName(u.role)}</small></span><span className="fa-edit">עריכה</span></button>)}
      </div>
      {editing === 'new'
        ? <PersonForm person={{ ...fresh, id: newUserId() }} isNew onDone={done} />
        : <button type="button" className="fa-btn" onClick={() => setEditing('new')}>+ הוספת בן משפחה</button>}
    </section>
  );
}

/** Guy only: open a family for someone else and send its first parent the invite link. */
export function OwnerAdmin() {
  const [name, setName] = useState(''), [parent, setParent] = useState(''), [she, setShe] = useState(true);
  const [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const [made, setMade] = useState<{ id: string; name: string } | null>(null);
  const [list, setList] = useState<{ id: string; name: string; people: number }[] | null>(null);
  const create = async () => {
    setBusy(true); setErr('');
    try { const id = await createFamily(name.trim(), { name: parent.trim(), she }); setMade({ id, name: name.trim() }); setName(''); setParent(''); setList(null); } catch { setErr('לא נוצרה. צריך חיבור לאינטרנט.'); }
    setBusy(false);
  };
  return (
    <section className="st-sec fa-card">
      <h3>משפחות</h3>
      <p className="cs-note">משפחה חדשה מקבלת את כל הקורסים, ומערכת והישגים משלה. ההורה הראשון מוסיף את השאר.</p>
      <label className="fa-field"><span>שם המשפחה</span><input value={name} maxLength={30} placeholder="למשל: כהן" onChange={(e) => setName(e.target.value)} /></label>
      <label className="fa-field"><span>שם ההורה הראשון</span><input value={parent} maxLength={20} onChange={(e) => setParent(e.target.value)} /></label>
      <GenderPick she={she} onChange={setShe} />
      {err && <p className="cs-note fa-err">{err}</p>}
      <button type="button" className="fa-btn main" disabled={busy || !name.trim() || !parent.trim()} onClick={create}>פתיחת משפחה</button>
      {made && <Invite link={inviteLink(made.id)} label={`הקישור למשפחת ${made.name}`} />}
      {!list && <button type="button" className="cs-link" onClick={() => { listFamilies().then(setList).catch(() => setErr('אין חיבור כרגע.')); }}>כל המשפחות והקישורים</button>}
      {list && <ul className="fa-list">{list.map((f) => <li key={f.id}><b>{f.name}</b> <small>· {f.people} אנשים</small><code dir="ltr">{inviteLink(f.id)}</code></li>)}</ul>}
    </section>
  );
}
