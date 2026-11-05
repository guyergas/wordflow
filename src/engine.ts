// The learning engine: pure functions over plain state. No DOM, no storage.
//
// Two independent measures per word:
//   r = recognition (does she know what it means)  - primary, gates new words
//   s = spelling (can she write it)                - secondary, never blocks anything
import { HAS_SPELLING, IS_THAI, x } from './course';
import { PROD_WORDS } from './prodWords';
import { LEVELS, WORD, WORDS, Word } from './words';

export interface Metric { box: number; due: number; flag: boolean; clear: number; ok: number; no: number; last: number }
export interface WordState { r: Metric; s: Metric; met: number | null; assumed?: boolean }
export type Part = 'warm' | 'boost' | 'new';
export type Kind = 'check' | 'intro' | 'meaning' | 'reverse' | 'listen' | 'cloze' | 'match' | 'tiles' | 'gaps' | 'memo' | 'type' | 'review';
export interface Step { part: Part; kind: Kind; id: string; ids?: string[]; retry?: boolean }
export interface DayLog { rOk: number; rNo: number; sOk: number; sNo: number; fresh: number; done: boolean; sen?: number; sec?: number; known?: number; spelled?: number }
export interface Plan {
  day: number; steps: Step[]; at: number; short: boolean; extra?: boolean; spelling?: boolean; bonus?: boolean; alreadyKnown: string[];
  newIds: string[]; consolidating: boolean; gained: { r: string[]; s: string[] }; flagged: string[];
}
export interface State {
  v: 1; name: string; onboarded: boolean; startLevel: number;
  paused?: Plan | null; words: Record<string, WordState>; sentences: Record<string, Metric>; days: Record<string, DayLog>; plan: Plan | null;
  traps: Record<string, number>; confusions: Record<string, Record<string, number>>;
  settings: { sound: boolean; autoSpeak: boolean; voice: string; rate: number; weeklyGoal: number };
}

export const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];
export const MAX_BOX = INTERVALS.length - 1;
/** A word counts as established once recognition reaches this box (at least 3 successful days). */
export const KNOWN_BOX = 3;
/** New words stop arriving while this many words are still not established. */
export const LEARNING_CAP = IS_THAI ? 24 : 36;
export const MAX_NEW_PER_DAY = IS_THAI ? 4 : 6;

export const dayNumber = (d: Date = new Date()) =>
  Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5);

export const freshMetric = (): Metric => ({ box: 0, due: 0, flag: false, clear: 0, ok: 0, no: 0, last: -1 });
export const freshWord = (): WordState => ({ r: freshMetric(), s: freshMetric(), met: null });

export function initialState(): State {
  return {
    v: 1, name: x('איילה', 'גיא'), onboarded: false, startLevel: 0, words: {}, sentences: {}, days: {}, plan: null, traps: {}, confusions: {},
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
  if (m.box >= 5) return x('שולטת', 'שולט');
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
export const spellKind = (box: number): Kind => (box <= 2 ? 'gaps' : box === 3 ? 'memo' : 'type');

/**
 * Free practice, any time: today's words, words marked for improvement, words that are due, and older words.
 * It is safe to repeat: a word still moves up at most once a day, so extra practice cannot rush it past the gate.
 */
export function practicePlan(st: State, today: number, count = 10, rnd: () => number = Math.random): Plan {
  const met = WORDS.map((w) => ({ w, s: ws(st, w.id) })).filter((e) => isMet(e.s));
  const flagged = shuffle(met.filter((e) => e.s.r.flag || e.s.s.flag), rnd).slice(0, 3);
  const fromToday = shuffle(met.filter((e) => e.s.met === today && !e.s.assumed), rnd).slice(0, 4);
  const due = shuffle(met.filter((e) => e.s.r.due <= today), rnd).slice(0, 3);
  const older = shuffle(met.filter((e) => e.s.met !== today || e.s.assumed), rnd);
  const picked = new Map<string, (typeof met)[number]>();
  for (const e of [...flagged, ...fromToday, ...due, ...older]) { if (picked.size < count) picked.set(e.w.id, e); }
  const steps: Step[] = shuffle([...picked.values()], rnd).map((e, i) => {
    if (HAS_SPELLING && (e.s.s.flag || (i % 3 === 2 && e.s.r.box >= 1))) return { part: 'boost', kind: spellKind(spellLevel(e.s.s)), id: e.w.id };
    return { part: 'boost', kind: e.s.r.flag || e.s.met === today ? 'meaning' : recKind(e.s.r.box, i), id: e.w.id };
  });
  return { day: today, steps, at: 0, short: false, extra: true, alreadyKnown: [], newIds: [], consolidating: false, gained: { r: [], s: [] }, flagged: [] };
}

/** Words the Ministry's lists mark for active use come first in spelling. The others still get their turn after them. */
const prodFirst = (a: Word, b: Word) => Number(PROD_WORDS.has(b.en.toLowerCase())) - Number(PROD_WORDS.has(a.en.toLowerCase()));

/** Words ready for spelling work: known words first. Words still being learned only fill in when there are too few. */
export function spellCandidates(st: State, today: number): Word[] {
  if (!HAS_SPELLING) return [];
  const rank = (s: WordState) => (s.s.flag ? 0 : spellMeasured(s) && s.s.due <= today ? 1 : !spellMeasured(s) ? 2 : 3);
  const sorted = (list: Word[]) => [...list].sort((a, b) => rank(ws(st, a.id)) - rank(ws(st, b.id)) || prodFirst(a, b) || ws(st, a.id).s.due - ws(st, b.id).s.due || a.order - b.order);
  const ready = WORDS.filter((w) => { const s = ws(st, w.id); return isMet(s) && !s.r.flag && s.r.box >= 2; });
  const learning = WORDS.filter((w) => { const s = ws(st, w.id); return isMet(s) && (s.r.flag || s.r.box < 2); });
  return [...sorted(ready), ...sorted(learning)];
}

/** Spelling round: look at the word, hide it, write it on the lines. Stronger words are written from sound alone. */
export function spellingPlan(st: State, today: number, count = 8): Plan {
  const steps: Step[] = spellCandidates(st, today).slice(0, count).map((w) => ({ part: 'boost', kind: spellLevel(ws(st, w.id).s) >= 4 ? 'type' : 'memo', id: w.id }));
  return { day: today, steps, at: 0, short: false, extra: true, spelling: true, alreadyKnown: [], newIds: [], consolidating: false, gained: { r: [], s: [] }, flagged: [] };
}

/** An unfinished daily round waits while she runs free practice, and comes back afterwards. */
export function restorePaused(st: State): State {
  if (!st.plan?.extra || !st.paused) return st.paused && !st.plan ? { ...st, plan: st.paused, paused: null } : st;
  return { ...st, plan: st.paused, paused: null };
}

export function buildPlan(st: State, today: number, opts: { short?: boolean; extra?: boolean; spell?: boolean; bonus?: boolean; rnd?: () => number } = {}): Plan {
  if (opts.spell) return spellingPlan(st, today);
  if (opts.extra) return practicePlan(st, today, 10, opts.rnd);
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
  const spellDue = eligible.filter((e) => !e.s.s.flag && spellMeasured(e.s) && e.s.s.due <= today).sort((a, b) => prodFirst(a.w, b.w) || a.s.s.due - b.s.s.due);
  const spellFresh = eligible.filter((e) => !spellMeasured(e.s)).sort((a, b) => prodFirst(a.w, b.w) || a.w.order - b.w.order);
  const spellPick = opts.bonus || !HAS_SPELLING ? [] : [...spellFlag, ...spellDue, ...spellFresh].slice(0, short ? 2 : 3);
  spellPick.forEach((e) => used.add(e.w.id));
  const spellSteps: Step[] = spellPick.map((e) => ({ part: 'boost', kind: spellKind(spellLevel(e.s.s)), id: e.w.id }));

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
  const justMet = w.met === today && w.r.box <= 1 && !w.r.flag;
  const r = (part === 'new' && first) || justMet
    ? correct ? { ...grade(w.r, true, today) } : { ...w.r, no: w.r.no + 1, due: today + 1, last: today }
    : grade(w.r, correct, today);
  const log = dayLog(st, today);
  const before = isKnown(w);
  const nw: WordState = { ...w, r, met: w.met ?? today, assumed: correct ? w.assumed : false };
  const plan = st.plan;
  const next: State = {
    ...st,
    words: { ...st.words, [id]: nw },
    days: { ...st.days, [today]: { ...log, rOk: log.rOk + (correct ? 1 : 0), rNo: log.rNo + (correct ? 0 : 1), fresh: log.fresh + (first ? 1 : 0), known: (log.known ?? 0) + (!before && isKnown(nw) ? 1 : 0) } },
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
  // A word met today is still brand new, so a slip is a retry tomorrow and not a mark against it.
  const s = !correct && w.met === today && w.s.box <= 1 && !w.s.flag ? { ...w.s, no: w.s.no + 1, due: today + 1, last: today } : grade(w.s, correct, today);
  const log = dayLog(st, today);
  const nw = { ...w, s, met: w.met ?? today };
  const next: State = {
    ...st,
    words: { ...st.words, [id]: nw },
    days: { ...st.days, [today]: { ...log, sOk: log.sOk + (correct ? 1 : 0), sNo: log.sNo + (correct ? 0 : 1), spelled: (log.spelled ?? 0) + (!before && spellKnown(nw) ? 1 : 0) } },
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

/** Align typed text with the target: which target letters were missed, and which typed letters are wrong. */
export function spellAlign(target: string, typed: string): { target: number[]; typed: number[] } {
  const a = target.toLowerCase(), b = typed.toLowerCase().trim();
  if (a === b) return { target: [], typed: [] };
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  const missed = new Set<number>(), extra = new Set<number>();
  let i = a.length, j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) { i--; j--; }
    else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) { missed.add(i - 1); extra.add(j - 1); i--; j--; }
    else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { missed.add(i - 1); i--; }
    else { extra.add(j - 1); j--; }
  }
  // Only extra letters, such as "catt": point at the target letter next to the extra one.
  if (!missed.size) missed.add(Math.min(Math.min(...extra), a.length - 1));
  return { target: [...missed].sort((x, y) => x - y), typed: [...extra].sort((x, y) => x - y) };
}

export const spellDiff = (target: string, typed: string): number[] => spellAlign(target, typed).target;

// ---------- Exercise helpers ----------
export function options(st: State, id: string, count: number, rnd: () => number = Math.random): Word[] {
  const w = WORD[id];
  const conf = Object.entries(st.confusions[id] ?? {}).sort((a, b) => b[1] - a[1]).map(([k]) => WORD[k]).filter(Boolean).slice(0, 1);
  const pool = WORDS.filter((x) => x.id !== id && x.he !== w.he && !conf.includes(x));
  const near = pool.filter((x) => x.pos === w.pos && Math.abs(x.level - w.level) <= 1);
  // In Thai, wrong answers come from words already met, so a question does not show words never taught. Others only fill a gap.
  const seen = pool.filter((x) => isMet(ws(st, x.id)));
  const fill = IS_THAI ? [...shuffle(seen, rnd), ...shuffle(pool.filter((x) => !isMet(ws(st, x.id))), rnd)] : shuffle(near.length >= count ? near : pool, rnd);
  // Two answers that read the same, in either language, would make the question unfair.
  const picks: Word[] = [];
  for (const x of [...conf, ...fill, ...shuffle(pool, rnd)]) {
    if (picks.length >= count - 1) break;
    if (x.en !== w.en && !picks.some((p) => p.he === x.he || p.en === x.en)) picks.push(x);
  }
  return shuffle([w, ...picks], rnd);
}

/** A word marked for improvement gets letters back, even if it was strong before. */
export const spellLevel = (m: Metric) => (m.flag ? Math.min(m.box, 1) : m.box);

/**
 * Which letters stay visible. The stronger the word, the fewer stay: about 70%, 50%, then 25%, then none.
 * The first letter stays while she is still getting to know the word.
 */
export function givenLetters(word: string, box: number, rnd: () => number = Math.random): boolean[] {
  const n = word.length;
  if (box >= 3) return new Array(n).fill(false);
  const hide = Math.min(n, Math.max(box === 0 ? 1 : 2, Math.round(n * [0.3, 0.5, 0.75][Math.max(0, box)])));
  const order = shuffle(Array.from({ length: n }, (_, i) => i).filter((i) => box === 2 || i > 0), rnd);
  const hidden = new Set(order.slice(0, hide));
  return Array.from({ length: n }, (_, i) => !hidden.has(i));
}

export function tileSet(word: string, kind: Kind, rnd: () => number = Math.random, box = 0): { letters: string[]; given: boolean[] } {
  const clean = word.toLowerCase();
  const chars = [...clean];
  const given = chars.map(() => false);
  if (kind === 'gaps') {
    const shown = givenLetters(clean, box, rnd);
    shown.forEach((v, i) => { given[i] = v; });
    const missing = chars.filter((_, i) => !given[i]);
    const extras = shuffle('aeiouyrstln'.split('').filter((c) => !missing.includes(c)), rnd).slice(0, Math.min(box, 2));
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

/**
 * In Thai a word counts as met only after real contact: an answer, a proof that it is known, or a flag.
 * The old placement test marked whole chapters without any of these, so those words go back to being new.
 */
export function dropUnpracticed(st: State): State {
  const entries = Object.entries(st.words);
  const kept = entries.filter(([, w]) => w.r.last >= 0 || w.r.ok + w.r.no > 0 || w.s.ok + w.s.no > 0 || w.r.flag);
  if (kept.length === entries.length) return st;
  return { ...st, words: Object.fromEntries(kept), startLevel: 0, plan: null, paused: null };
}

/** A saved round can name a word that a later version replaced. Those steps go, and the round carries on from the same place. */
function repairOne(plan: Plan): Plan | null {
  const ok = (id: string) => !!WORD[id];
  const fine = (s: Step) => ok(s.id) && (s.ids ?? []).every(ok);
  if (plan.steps.every(fine) && plan.newIds.every(ok) && plan.alreadyKnown.every(ok) && plan.flagged.every(ok) && plan.gained.r.every(ok) && plan.gained.s.every(ok)) return plan;
  const steps = plan.steps.filter(fine);
  if (!steps.length) return null;
  return {
    ...plan, steps, at: plan.steps.slice(0, plan.at).filter(fine).length,
    newIds: plan.newIds.filter(ok), alreadyKnown: plan.alreadyKnown.filter(ok), flagged: plan.flagged.filter(ok),
    gained: { r: plan.gained.r.filter(ok), s: plan.gained.s.filter(ok) },
  };
}

export function repairPlans(st: State): State {
  const plan = st.plan ? repairOne(st.plan) : st.plan;
  const paused = st.paused ? repairOne(st.paused) : st.paused;
  return plan === st.plan && paused === st.paused ? st : { ...st, plan, paused };
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

export function addStudyTime(st: State, today: number, sec: number): State {
  const log = dayLog(st, today);
  return { ...st, days: { ...st.days, [today]: { ...log, sec: (log.sec ?? 0) + sec } } };
}

export function studySeconds(st: State, from: number, to: number): number {
  let sum = 0;
  for (let d = from; d <= to; d++) sum += st.days[d]?.sec ?? 0;
  return sum;
}

/** Questions answered in a period, across words, spelling and sentences. */
export function questionCount(st: State, from: number, to: number): number {
  let sum = 0;
  for (let d = from; d <= to; d++) { const l = st.days[d]; if (l) sum += l.rOk + l.rNo + l.sOk + l.sNo + (l.sen ?? 0); }
  return sum;
}

/** The label for a period's time. Days from before time was measured say so, and do not claim zero. */
export function studyTimeLabel(sec: number, questions: number): string {
  if (sec > 0) return formatStudyTime(sec);
  return questions > 0 ? 'לא נמדד' : '0 דקות';
}

export function formatStudyTime(sec: number): string {
  if (sec < 30) return 'פחות מדקה';
  const total = Math.round(sec / 60);
  if (total < 60) return total === 1 ? 'דקה' : `${total} דקות`;
  const h = Math.floor(total / 60), m = total % 60;
  const hours = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`;
  if (!m) return hours;
  return `${hours} ו${m === 1 ? 'דקה' : `־${m} דקות`}`;
}

/** Words on their way: practiced and moving up, but not yet established. This is what changes on the day itself. */
export function onTheWay(st: State): { r: number; s: number } {
  let r = 0, sp = 0;
  for (const w of WORDS) {
    const x = ws(st, w.id);
    if (isMet(x) && !isKnown(x)) r++;
    if (spellMeasured(x) && !spellKnown(x)) sp++;
  }
  return { r, s: sp };
}

/** Words that moved up a step today, per measure. */
export function steppedToday(st: State, today: number): { r: number; s: number } {
  const up = (m: Metric) => m.last === today && !m.flag && m.box > 0 && m.ok > 0;
  let r = 0, sp = 0;
  for (const w of WORDS) { const x = ws(st, w.id); if (up(x.r)) r++; if (up(x.s)) sp++; }
  return { r, s: sp };
}

export function levelStats(st: State, level: number) {
  const list = WORDS.filter((w) => w.level === level);
  const known = list.filter((w) => isKnown(ws(st, w.id))).length;
  const spelled = list.filter((w) => spellKnown(ws(st, w.id))).length;
  return { all: list.length, known, spelled };
}

export const currentLevel = (st: State): number => nextNewWords(st, 1)[0]?.level ?? LEVELS.length - 1;

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
