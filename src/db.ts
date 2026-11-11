// The family's shared database address and this device's id. Nothing here reads the user or the course,
// so the app can talk to the database before the course is loaded.

/** Firebase Realtime Database address, such as https://name-default-rtdb.firebaseio.com */
export const DB_URL = 'https://wordflow-family-default-rtdb.asia-southeast1.firebasedatabase.app';
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export const dbUrl = () => (get('wordflow.dbUrl') || DB_URL).replace(/\/$/, '');

export function deviceId() {
  let id = get('wordflow.device');
  if (!id) { id = Math.random().toString(36).slice(2, 12); try { localStorage.setItem('wordflow.device', id); } catch { /* a new id next time */ } }
  return id;
}
