// The shared database address, this device's family and this device's id. Nothing here reads the user or the course,
// so the app can talk to the database before the course is loaded.

/** Firebase Realtime Database address, such as https://name-default-rtdb.firebaseio.com */
export const DB_URL = 'https://wordflow-family-default-rtdb.asia-southeast1.firebasedatabase.app';
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export const dbUrl = () => (get('wordflow.dbUrl') || DB_URL).replace(/\/$/, '');

/** The first family. Devices that were in use before there were families belong to it. */
export const FIRST_FAMILY = 'argas';
export const FAMILY_KEY = 'wordflow.family';
export const validFamily = (v: string | null | undefined): v is string => !!v && /^[a-z0-9]{3,24}$/.test(v);

/** This device's family. A device that already has someone signed in or something learned is in the first family. */
export function familyId(): string | null {
  const saved = get(FAMILY_KEY);
  if (validFamily(saved)) return saved;
  let used = false;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('wordflow.') && k !== 'wordflow.device' && k !== 'wordflow.dbUrl') { used = true; break; } } } catch { /* no storage */ }
  if (!used) return null;
  try { localStorage.setItem(FAMILY_KEY, FIRST_FAMILY); } catch { /* asked again next time */ }
  return FIRST_FAMILY;
}

/** Where this device's family keeps its data. Empty when the device has no family yet. */
// The first family is used only once its data has moved into it, so nothing new is written over by the move.
export const famUrl = (fid = familyId()) => (fid && dbUrl() && (fid !== FIRST_FAMILY || get('wordflow.fam.moved')) ? `${dbUrl()}/families/${fid}` : '');

export function deviceId() {
  let id = get('wordflow.device');
  if (!id) { id = Math.random().toString(36).slice(2, 12); try { localStorage.setItem('wordflow.device', id); } catch { /* a new id next time */ } }
  return id;
}
