// The learning engine: pure functions over plain state. No DOM, no storage.
//
// Two independent measures per word:
//   r = recognition (does she know what it means)  - primary, gates new words
//   s = spelling (can she write it)                - secondary, never blocks anything
import { WORD, WORDS, Word } from './words';

export interface Metric { box: number; due: number; flag: boolean; clear: number; ok: number; no: number; last: number }
export interface WordState { r: Metric; s: Metric; met: number | null; assumed?: boolean }
export type Part = 'warm' | 'boost' | 'new';
export type Kind = 'check' | 'intro' | 'meaning' | 'reverse' | 'listen' | 'cloze' | 'match' | 'tiles' | 'gaps' | 'type' | 'review';
export interface Step { part: Part; kind: Kind; id: string; ids?: string[]; retry?: boolean }
export interface DayLog { rOk: number; rNo: number; sOk: number; sNo: number; fresh: number; done: boolean }
export interface Plan {
  day: number; steps: Step[]; at: number; short: boolean; extra?: boolean; bonus?: boolean; alreadyKnown: string[];
  newIds: string[]; consolidating: boolean; gained: { r: string[]; s: string[] }; flagged: string[];
}
export interface State {
  v: 1; name: string; onboarded: boolean; startLevel: number;
  words: Record<string, WordState>; sentences: Record<string, Metric>; days: Record<string, DayLog>; plan: Plan | null;
  traps: Record<string, number>; confusions: Record<string, Record<string, number>>;
  settings: { sound: boolean; autoSpeak: boolean; voice: string; rate: number; weeklyGoal: number };
}

export const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];
export const MAX_BOX = INTERVALS.length - 1;
/** A word counts as established once recognition reaches this box (at least 3 successful days). */
export const KNOWN_BOX = 3;
/** New words stop arriving while this many words are still not established. */
export const LEARNING_CAP = 24;
export const MAX_NEW_PER_DAY = 4;

export const dayNumber = (d: Date = new Date()) =>
  Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5);

export const freshMetric = (): Metric => ({ box: 0, due: 0, flag: false, clear: 0, ok: 0, no: 0, last: -1 });
export const freshWord = (): WordState => ({ r: freshMetric(), s: freshMetric(), met: null });

export function initialState(): State {
  return {
    v: 1, name: 'איילה', onboarded: false, startLevel: 0, words: {}, sentences: {}, days: {}, plan: null, traps: {}, confusions: {},
    settings: { sound: true, autoSpeak: true, voice: '', rate: 0.9, weeklyGoal: 4 },
  };
}

export const ws = (st: State, id: string): WordState => st.words[id] ?? freshWord();
export const isMet = (w: WordState) => w.met !== null;
export const isKnown = (w: WordState) => isMet(w) && w.r.box >= KNOWN_BOX && !w.r.flag;
export const isLearning = (w: WordState) => isMet(w) && (w.r.box < KNOWN_BOX || w.r.flag);
export const spellMeasured = (w: WordState) => w.s.ok + w.s.no > 0;
export const spellKnown = (w: WordState) => w.s.box >= KNOWN_BOX && !w.s.flag;

export const label = (m: Metric, measured = true): string => {
  if (!measured) return 'טרם נבדק';
  if (m.flag) return 'דורש שיפור';
  if (m.box >= 5) return 'שולטת';
  if (m.box >= KNOWN_BOX) return 'מבוסס';
  if (m.box >= 1) return 'בתהליך';
  return 'התחלה';
};

function shuffle<T>(a: T[], rnd: () => number): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

/** How many new words she may meet today. Recognition is the gate; spelling has no say. */
export function newAllowance(st: State, today: number, short = false): number {
  const learning = WORDS.filter((w) => isLearning(ws(st, w.id))).length;
  let room = Math.max(0, LEARNING_CAP - learning);
  let ok = 0, no = 0;
  for (let d = today - 3; d < today; d++) { const l = st.days[d]; if (l) { ok += l.rOk; no += l.rNo; } }
  if (ok + no >= 10 && ok / (ok + no) < 0.65) room = Math.min(room, 2);
  return Math.min(room, short ? 2 : MAX_NEW_PER_DAY);
}

export const nextNewWords = (st: State, n: number): Word[] =>
  WORDS.filter((w) => !isMet(ws(st, w.id))).sort((a, b) => a.order - b.order).slice(0, n);

const recKind = (box: number, i: number): Kind => {
  if (box <= 1) return 'meaning';
  if (box === 2) return i % 2 ? 'listen' : 'reverse';
  return (['cloze', 'listen', 'reverse'] as Kind[])[i % 3];
};
export const spellKind = (box: number): Kind => (box <= 0 ? 'tiles' : box <= 2 ? 'gaps' : 'type');

export function buildPlan(st: State, today: number, opts: { short?: boolean; extra?: boolean; bonus?: boolean; rnd?: () => number } = {}): Plan {
  const rnd = opts.rnd ?? Math.random;
  const short = !!opts.short;
  const entries = WORDS.map((w) => ({ w, s: ws(st, w.id) }));
  const used = new Set<string>();
  const steps: Step[] = [];

  // Part 3 is decided first, so its words stay out of the first two parts.
  const allow = opts.extra ? 0 : newAllowance(st, today, short);
  const fresh = nextNewWords(st, allow);
  fresh.forEach((w) => used.add(w.id));

  // Part 2: boost. Hardest part, tightly capped so she always gets past it.
  const weakRec = entries
    .filter((e) => isMet(e.s) && (e.s.r.flag || (e.s.r.box < KNOWN_BOX && e.s.r.due <= today)))
    .sort((a, b) => Number(b.s.r.flag) - Number(a.s.r.flag) || a.s.r.box - b.s.r.box || a.s.r.due - b.s.r.due)
    .slice(0, opts.bonus ? 4 : short ? 3 : 6);
  weakRec.forEach((e) => used.add(e.w.id));
  const recSteps: Step[] = weakRec.map((e, i) => ({
    part: 'boost', kind: e.s.r.flag ? 'meaning' : recKind(e.s.r.box, i), id: e.w.id,
  }));

  // Spelling practice only starts once a word has been seen on at least one earlier day.
  const eligible = entries.filter((e) => isMet(e.s) && (e.s.met as number) < today && e.s.r.box >= 1 && !used.has(e.w.id));
  const spellFlag = eligible.filter((e) => e.s.s.flag);
  const spellDue = eligible.filter((e) => !e.s.s.flag && spellMeasured(e.s) && e.s.s.due <= today).sort((a, b) => a.s.s.due - b.s.s.due);
  const spellFresh = eligible.filter((e) => !spellMeasured(e.s)).sort((a, b) => a.w.order - b.w.order);
  const spellPick = opts.bonus ? [] : [...spellFlag, ...spellDue, ...spellFresh].slice(0, short ? 2 : 3);
  spellPick.forEach((e) => used.add(e.w.id));
  const spellSteps: Step[] = spellPick.map((e) => ({ part: 'boost', kind: spellKind(e.s.s.box), id: e.w.id }));

  const boost: Step[] = [];
  while (recSteps.length || spellSteps.length) {
    if (recSteps.length) boost.push(recSteps.shift()!);
    if (spellSteps.length) boost.push(spellSteps.shift()!);
  }

  // Part 1: warm-up. Words she knows, in easy formats, for quick wins.
  const familiar = entries
    .filter((e) => isKnown(e.s) && !used.has(e.w.id))
    .sort((a, b) => a.s.r.due - b.s.r.due || b.s.r.box - a.s.r.box);
  const dueFirst = opts.bonus ? [] : familiar.slice(0, 16);
  const warmPool = shuffle(dueFirst, rnd).slice(0, short || boost.length >= 7 ? 3 : 4);
  warmPool.forEach((e) => used.add(e.w.id));
  warmPool.forEach((e, i) => steps.push({ part: 'warm', kind: i % 3 === 2 ? 'listen' : 'meaning', id: e.w.id }));
  const pairs = opts.bonus ? [] : shuffle(familiar.filter((e) => !used.has(e.w.id)), rnd).slice(0, 4).map((e) => e.w.id);
  if (pairs.length === 4) steps.push({ part: 'warm', kind: 'match', id: pairs[0], ids: pairs });

  steps.push(...boost);

  // Part 3: new words. When the gate is closed, the newest unsettled words get a fresh look instead.
  let consolidating = false;
  if (!opts.extra) {
    let newIds = fresh.map((w) => w.id);
    if (!newIds.length) {
      consolidating = true;
      newIds = entries.filter((e) => isLearning(e.s)).sort((a, b) => (b.s.met ?? 0) - (a.s.met ?? 0)).slice(0, 3).map((e) => e.w.id);
    }
    if (consolidating) {
      newIds.forEach((id) => steps.push({ part: 'new', kind: 'intro', id }));
      newIds.forEach((id) => steps.push({ part: 'new', kind: 'meaning', id }));
      if (newIds.length >= 2) steps.push({ part: 'new', kind: 'match', id: newIds[0], ids: newIds });
    } else {
      // Practice steps are added by resolveCheck, once she confirmed which words really are new.
      newIds.forEach((id) => steps.push({ part: 'new', kind: 'check', id }));
    }
    return { day: today, steps, at: 0, short, bonus: opts.bonus, alreadyKnown: [], newIds, consolidating, gained: { r: [], s: [] }, flagged: [] };
  }
  return { day: today, steps, at: 0, short, extra: true, alreadyKnown: [], newIds: [], consolidating, gained: { r: [], s: [] }, flagged: [] };
}

/**
 * Settle one candidate at the current check step.
 * A word she proved she knows joins the familiar words and another word takes its place in the same round.
 * After the last check, the practice steps for the words that really are new are added.
 */
export function resolveCheck(st: State, id: string, alreadyKnown: boolean, today: number): State {
  const plan = st.plan;
  if (!plan) return st;
  const steps = [...plan.steps];
  let newIds = plan.newIds;
  let known = plan.alreadyKnown;
  let words = st.words;
  if (alreadyKnown) {
    known = [...known, id];
    newIds = newIds.filter((x) => x !== id);
    // One right answer can be a lucky guess, so the word stays checkable: it comes back in a warm-up soon.
    words = { ...words, [id]: { ...ws(st, id), met: today, assumed: true, r: { ...freshMetric(), box: KNOWN_BOX, due: today + 3, last: today } } };
    const taken = new Set(newIds);
    const next = WORDS.filter((w) => w.id !== id && !taken.has(w.id) && words[w.id]?.met == null).sort((a, b) => a.order - b.order)[0];
    if (next) {
      newIds = [...newIds, next.id];
      steps.splice(steps.length, 0, { part: 'new', kind: 'check', id: next.id });
    }
  }
  const moreChecks = steps.slice(plan.at + 1).some((x) => x.kind === 'check');
  if (!moreChecks) {
    newIds.forEach((x) => steps.push({ part: 'new', kind: 'meaning', id: x }));
    if (newIds.length >= 2) steps.push({ part: 'new', kind: 'match', id: newIds[0], ids: newIds });
  }
  return { ...st, words, plan: { ...plan, steps, newIds, alreadyKnown: known } };
}

/** Apply one answer to one measure. Promotion happens at most once per day. */
export function grade(m: Metric, correct: boolean, today: number): Metric {
  const n = { ...m };
  if (correct) {
    n.ok++;
    if (n.last !== today) {
      if (n.flag) { n.clear++; if (n.clear >= 2) { n.flag = false; n.clear = 0; } }
      n.box = Math.min(MAX_BOX, n.box + 1);
      n.due = today + INTERVALS[n.box];
    }
  } else {
    n.no++;
    n.box = Math.max(0, n.box - 2);
    n.flag = true;
    n.clear = 0;
    n.due = today + 1;
  }
  n.last = today;
  return n;
}

export const dayLog = (st: State, day: number): DayLog => st.days[day] ?? { rOk: 0, rNo: 0, sOk: 0, sNo: 0, fresh: 0, done: false };

export function recordRecognition(st: State, id: string, correct: boolean, today: number, part: Part, chosen?: string): State {
  const w = ws(st, id);
  const first = !isMet(w);
  // A brand-new word answered wrong is not a failure yet: it just returns tomorrow, unflagged.
  const r = part === 'new' && first
    ? correct ? { ...grade(w.r, true, today) } : { ...w.r, no: w.r.no + 1, due: today + 1, last: today }
    : grade(w.r, correct, today);
  const log = dayLog(st, today);
  const before = isKnown(w);
  const nw: WordState = { ...w, r, met: w.met ?? today, assumed: correct ? w.assumed : false };
  const plan = st.plan;
  const next: State = {
    ...st,
    words: { ...st.words, [id]: nw },
    days: { ...st.days, [today]: { ...log, rOk: log.rOk + (correct ? 1 : 0), rNo: log.rNo + (correct ? 0 : 1), fresh: log.fresh + (first ? 1 : 0) } },
  };
  if (plan) {
    next.plan = {
      ...plan,
      gained: { ...plan.gained, r: !before && isKnown(nw) ? [...plan.gained.r, id] : plan.gained.r },
      flagged: !correct && r.flag && !plan.flagged.includes(id) ? [...plan.flagged, id] : plan.flagged,
    };
  }
  if (!correct && chosen && chosen !== id) {
    const c = st.confusions[id] ?? {};
    next.confusions = { ...st.confusions, [id]: { ...c, [chosen]: (c[chosen] ?? 0) + 1 } };
  }
  return next;
}

export function recordSpelling(st: State, id: string, correct: boolean, today: number, wrongAt: number[] = []): State {
  const w = ws(st, id);
  const before = spellKnown(w);
  const s = grade(w.s, correct, today);
  const log = dayLog(st, today);
  const nw = { ...w, s, met: w.met ?? today };
  const next: State = {
    ...st,
    words: { ...st.words, [id]: nw },
    days: { ...st.days, [today]: { ...log, sOk: log.sOk + (correct ? 1 : 0), sNo: log.sNo + (correct ? 0 : 1) } },
  };
  if (!correct) {
    const traps = { ...st.traps };
    for (const t of trapsAt(WORD[id].en, wrongAt)) traps[t] = (traps[t] ?? 0) + 1;
    next.traps = traps;
  }
  if (st.plan) next.plan = { ...st.plan, gained: { ...st.plan.gained, s: !before && spellKnown(nw) ? [...st.plan.gained.s, id] : st.plan.gained.s } };
  return next;
}

export function toggleFlag(st: State, id: string, measure: 'r' | 's'): State {
  const w = ws(st, id);
  const m = w[measure];
  return { ...st, words: { ...st.words, [id]: { ...w, met: w.met ?? dayNumber(), [measure]: { ...m, flag: !m.flag, clear: 0, due: m.flag ? m.due : Math.min(m.due, dayNumber()) } } } };
}

// ---------- Spelling traps ----------
export const TRAPS: { id: string; name: string; hint: string; re: RegExp }[] = [
  { id: 'double', name: 'אותיות כפולות', hint: 'ss, ll, tt, rr, pp', re: /([a-z])\1/g },
  { id: 'silent', name: 'אותיות שקטות', hint: 'knee, write, lamb, castle', re: /^kn|^wr|mb$|stl|^gn|gh(?=t)|sc(?=i|e)|^h(?=our|onest)/g },
  { id: 'ie', name: 'ie מול ei', hint: 'believe, weight, height', re: /ie|ei/g },
  { id: 'vowels', name: 'צמד תנועות', hint: 'ea, ou, oa, ai', re: /ea|ou|oa|ai|au|ee|oo|ue/g },
  { id: 'sounds', name: 'צירופים מיוחדים', hint: 'ph, gh, ch, sh, th', re: /ph|gh|ch|sh|th|wh/g },
  { id: 'endings', name: 'סיומות', hint: 'tion, ous, ible, able, ful', re: /tion$|sion$|ous$|ible$|able$|ful$|ence$|ance$|ment$|ness$|ly$/g },
  { id: 'magic', name: 'e בסוף המילה', hint: 'smile, hope, arrive', re: /e$/g },
];

export function trapsAt(word: string, wrongAt: number[]): string[] {
  const out = new Set<string>();
  const lower = word.toLowerCase();
  for (const t of TRAPS) {
    for (const m of lower.matchAll(t.re)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (wrongAt.some((i) => i >= start && i < end)) out.add(t.id);
    }
  }
  return [...out];
}

/** Compare typed text with the target. Returns the target indexes that were wrong. */
export function spellDiff(target: string, typed: string): number[] {
  const a = target.toLowerCase(), b = typed.toLowerCase().trim();
  if (a === b) return [];
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  const wrong = new Set<number>();
  let i = a.length, j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) { i--; j--; }
    else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) { wrong.add(i - 1); i--; j--; }
    else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { wrong.add(i - 1); i--; }
    else { wrong.add(Math.min(i, a.length - 1)); j--; }
  }
  return [...wrong].sort((x, y) => x - y);
}

// ---------- Exercise helpers ----------
export function options(st: State, id: string, count: number, rnd: () => number = Math.random): Word[] {
  const w = WORD[id];
  const conf = Object.entries(st.confusions[id] ?? {}).sort((a, b) => b[1] - a[1]).map(([k]) => WORD[k]).filter(Boolean).slice(0, 1);
  const pool = WORDS.filter((x) => x.id !== id && x.he !== w.he && !conf.includes(x));
  const near = pool.filter((x) => x.pos === w.pos && Math.abs(x.level - w.level) <= 1);
  const picks = [...conf, ...shuffle(near.length >= count ? near : pool, rnd)].slice(0, count - 1);
  return shuffle([w, ...picks], rnd);
}

export function tileSet(word: string, kind: Kind, rnd: () => number = Math.random): { letters: string[]; given: boolean[] } {
  const clean = word.toLowerCase();
  const chars = [...clean];
  const given = chars.map(() => false);
  if (kind === 'gaps') {
    const gaps = Math.max(2, Math.min(4, Math.round(chars.length * 0.4)));
    const idx = shuffle(chars.map((_, i) => i), rnd);
    const hide = new Set(idx.slice(0, gaps));
    chars.forEach((_, i) => { given[i] = !hide.has(i); });
    const missing = chars.filter((_, i) => !given[i]);
    const extras = shuffle('aeiouyrstln'.split('').filter((c) => !missing.includes(c)), rnd).slice(0, 2);
    return { letters: shuffle([...missing, ...extras], rnd), given };
  }
  return { letters: shuffle(chars, rnd), given };
}

export function clozeOf(w: Word): string {
  const re = new RegExp(`\\b${w.en}\\b`, 'i');
  return w.ex.replace(re, '_____');
}

// ---------- Placement ----------
export function placementWords(level: number, rnd: () => number = Math.random): Word[] {
  return shuffle(WORDS.filter((w) => w.level === level), rnd).slice(0, 4);
}
export const PLACEMENT_PASS = 3;

/** Levels she passed become assumed-familiar; spelling stays unmeasured because it is a separate skill. */
export function applyPlacement(st: State, results: Record<string, boolean>, startLevel: number, today: number): State {
  const words = { ...st.words };
  let i = 0;
  for (const w of WORDS) {
    if (w.level < startLevel) {
      const answered = results[w.id];
      if (answered === false) {
        words[w.id] = { ...freshWord(), met: today, r: { ...freshMetric(), box: 1, due: today } };
      } else {
        words[w.id] = { ...freshWord(), met: today, assumed: answered !== true, r: { ...freshMetric(), box: KNOWN_BOX, due: today + 1 + (i++ % 21) } };
      }
    } else if (results[w.id] === true) {
      words[w.id] = { ...freshWord(), met: today, r: { ...freshMetric(), box: 2, due: today + 1 } };
    }
  }
  return { ...st, words, startLevel, onboarded: true };
}

// ---------- Progress ----------
export interface Totals { met: number; known: number; spelled: number; flagged: number; all: number }
export function totals(st: State): Totals {
  let met = 0, known = 0, spelled = 0, flagged = 0;
  for (const w of WORDS) {
    const s = ws(st, w.id);
    if (!isMet(s)) continue;
    met++;
    if (isKnown(s)) known++;
    if (spellKnown(s)) spelled++;
    if (s.r.flag || s.s.flag) flagged++;
  }
  return { met, known, spelled, flagged, all: WORDS.length };
}

export function levelStats(st: State, level: number) {
  const list = WORDS.filter((w) => w.level === level);
  const known = list.filter((w) => isKnown(ws(st, w.id))).length;
  const spelled = list.filter((w) => spellKnown(ws(st, w.id))).length;
  return { all: list.length, known, spelled };
}

export const currentLevel = (st: State): number => nextNewWords(st, 1)[0]?.level ?? 7;

export function hardWords(st: State, n = 8) {
  return WORDS.map((w) => ({ w, s: ws(st, w.id) }))
    .filter((e) => e.s.r.no + e.s.s.no > 0 || e.s.r.flag || e.s.s.flag)
    .map((e) => ({ ...e, score: e.s.r.no * 2 + e.s.s.no + (e.s.r.flag ? 3 : 0) + (e.s.s.flag ? 2 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

export function topTraps(st: State) {
  return TRAPS.map((t) => ({ ...t, count: st.traps[t.id] ?? 0 })).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
}

export function topConfusions(st: State, n = 3) {
  const out: { a: Word; b: Word; count: number }[] = [];
  for (const [id, map] of Object.entries(st.confusions)) for (const [o, c] of Object.entries(map)) {
    if (c >= 2 && WORD[id] && WORD[o]) out.push({ a: WORD[id], b: WORD[o], count: c });
  }
  return out.sort((x, y) => y.count - x.count).slice(0, n);
}

export function weekDays(st: State, today: number): boolean[] {
  // Week starts on Sunday. dayNumber 0 = Thu 1 Jan 1970.
  const dow = (today + 4) % 7;
  return Array.from({ length: 7 }, (_, i) => !!st.days[today - dow + i]?.done);
}
