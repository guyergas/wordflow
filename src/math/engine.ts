// Math learning rules: pure functions over plain state. No DOM and no storage.
//   u = understanding (choosing, matching, explaining)   e = execution (getting the calculation right)
import { DOMAINS, Domain, fmt, Fig, Measure, Question, Rnd, seeded, Skill, SKILL, SKILLS, STATIONS, TrapId } from './skills';

export interface Metric { box: number; due: number; flag: boolean; clear: number; ok: number; no: number; helped: number; last: number }
export interface SkillState { u: Metric; e: Metric; met: number | null; assumed?: boolean }
export type Part = 'warm' | 'boost' | 'new';
export type StepKind = 'worked' | 'partial' | 'solve';
export interface Step { part: Part; kind: StepKind; skill: string; measure: Measure; seed: number; support: boolean; mode: 'choice' | 'type'; retry?: boolean }
export interface Plan { day: number; steps: Step[]; at: number; extra?: boolean; bonus?: boolean; newSkill: string | null; flagged: string[] }
export interface DayLog { ok: number; no: number; helped: number; done: boolean; sec?: number }
export interface Placement { d: number; station: number; round: number; i: number; score: number; seed: number; start: Partial<Record<Domain, number>>; asked: number }
export interface MathState {
  v: 1; name: string; onboarded: boolean; placement: Placement | null; start: Partial<Record<Domain, number>>;
  skills: Record<string, SkillState>; days: Record<string, DayLog>; plan: Plan | null; traps: Record<string, number>;
  settings: { sound: boolean; pace: 'calm' | 'normal'; weeklyGoal: number };
}

export const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];
const MAX_BOX = INTERVALS.length - 1;
/** Solid: at least three separate successful days. */
export const SOLID_BOX = 3;
/** The next skill can build on this one after two separate successful days. */
export const OPEN_BOX = 2;
export const PACE = { calm: 3, normal: 5 };
export const PLACEMENT_QUESTIONS = 4;
export const PLACEMENT_PASS = 3;

export const dayNumber = (d: Date = new Date()) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5 + 0.5);
export const freshMetric = (): Metric => ({ box: 0, due: 0, flag: false, clear: 0, ok: 0, no: 0, helped: 0, last: -1 });
const freshSkill = (): SkillState => ({ u: freshMetric(), e: freshMetric(), met: null });
export const initialMath = (): MathState => ({ v: 1, name: '', onboarded: false, placement: null, start: {}, skills: {}, days: {}, plan: null, traps: {}, settings: { sound: true, pace: 'normal', weeklyGoal: 4 } });
export const ss = (st: MathState, id: string) => st.skills[id] ?? freshSkill();
export const dayLog = (st: MathState, d: number): DayLog => st.days[d] ?? { ok: 0, no: 0, helped: 0, done: false };

const measures = (s: Skill): Measure[] => [...(s.u ? ['u' as const] : []), ...(s.e ? ['e' as const] : [])];
const reached = (st: MathState, s: Skill, box: number) => { const x = ss(st, s.id); return measures(s).every((m) => x[m].box >= box && !x[m].flag); };
export const isMet = (st: MathState, id: string) => ss(st, id).met !== null;
export const isSolid = (st: MathState, id: string) => isMet(st, id) && reached(st, SKILL[id], SOLID_BOX);
const isSettled = (st: MathState, id: string) => isMet(st, id) && reached(st, SKILL[id], OPEN_BOX);
export const isLearning = (st: MathState, id: string) => isMet(st, id) && !isSettled(st, id);
/** A skill opens once the skills it stands on directly are settled, in both understanding and execution. */
export const isOpen = (st: MathState, s: Skill) => s.needs.every((id) => isSettled(st, id));

export const learningCount = (st: MathState) => SKILLS.filter((s) => isLearning(st, s.id)).length;
export const nextNew = (st: MathState): Skill | null => (learningCount(st) >= PACE[st.settings.pace] ? null : SKILLS.find((s) => !isMet(st, s.id) && isOpen(st, s)) ?? null);

let counter = 0;
const newSeed = (rnd: Rnd) => Math.floor(rnd() * 2 ** 31) + counter++;
function shuffle<T>(a: T[], rnd: Rnd): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

const weakerMeasure = (st: MathState, s: Skill, today: number): Measure => {
  const ms = measures(s); const x = ss(st, s.id);
  return [...ms].sort((a, b) => Number(x[b].flag) - Number(x[a].flag) || Number(x[b].due <= today) - Number(x[a].due <= today) || x[a].box - x[b].box)[0];
};
const practiceStep = (st: MathState, s: Skill, part: Part, today: number, rnd: Rnd): Step => {
  const m = weakerMeasure(st, s, today), box = ss(st, s.id)[m].box;
  const hasChoice = m === 'u' || box === 0;
  return { part, kind: 'solve', skill: s.id, measure: m, seed: newSeed(rnd), support: box < 2, mode: hasChoice ? 'choice' : 'type' };
};
function teach(s: Skill, rnd: Rnd): Step[] {
  const m: Measure = s.e ? 'e' : 'u';
  const out: Step[] = [
    { part: 'new', kind: 'worked', skill: s.id, measure: m, seed: newSeed(rnd), support: true, mode: 'choice' },
  ];
  if (m === 'e') out.push({ part: 'new', kind: 'partial', skill: s.id, measure: m, seed: newSeed(rnd), support: true, mode: 'type' });
  out.push({ part: 'new', kind: 'solve', skill: s.id, measure: m, seed: newSeed(rnd), support: true, mode: 'choice' });
  out.push({ part: 'new', kind: 'solve', skill: s.id, measure: m, seed: newSeed(rnd), support: true, mode: m === 'e' ? 'type' : 'choice' });
  if (s.u && s.e) out.push({ part: 'new', kind: 'solve', skill: s.id, measure: 'u', seed: newSeed(rnd), support: true, mode: 'choice' });
  return out;
}

export function buildPlan(st: MathState, today: number, opts: { extra?: boolean; bonus?: boolean; rnd?: Rnd } = {}): Plan {
  const rnd = opts.rnd ?? Math.random;
  const steps: Step[] = [];
  const fresh = opts.extra ? null : nextNew(st);
  if (!opts.bonus) {
    const met = SKILLS.filter((s) => isMet(st, s.id) && s.id !== fresh?.id);
    const weak = met.filter((s) => { const x = ss(st, s.id); return measures(s).some((m) => x[m].flag || (x[m].box < SOLID_BOX && x[m].due <= today)); })
      .sort((a, b) => ss(st, a.id).u.box + ss(st, a.id).e.box - ss(st, b.id).u.box - ss(st, b.id).e.box).slice(0, 5);
    const weakIds = new Set(weak.map((s) => s.id));
    const solid = met.filter((s) => !weakIds.has(s.id) && reached(st, s, OPEN_BOX));
    const dueFirst = [...solid].sort((a, b) => Math.min(...measures(a).map((m) => ss(st, a.id)[m].due)) - Math.min(...measures(b).map((m) => ss(st, b.id)[m].due))).slice(0, 12);
    shuffle(dueFirst, rnd).slice(0, 4).forEach((s) => steps.push(practiceStep(st, s, 'warm', today, rnd)));
    weak.forEach((s) => steps.push(practiceStep(st, s, 'boost', today, rnd)));
  }
  if (fresh) steps.push(...teach(fresh, rnd));
  else if (!opts.extra) {
    // The gate is closed: the newest skill still settling gets another look instead.
    const recent = SKILLS.filter((s) => isLearning(st, s.id) && !steps.some((x) => x.skill === s.id)).sort((a, b) => (ss(st, b.id).met ?? 0) - (ss(st, a.id).met ?? 0))[0];
    if (recent) { const p = practiceStep(st, recent, 'new', today, rnd); steps.push({ ...p, support: true }, { ...p, seed: newSeed(rnd), support: true }); }
  }
  if (opts.extra && !steps.length) {
    // A practice round when nothing is due: any skill she has already met.
    shuffle(SKILLS.filter((s) => isMet(st, s.id)), rnd).slice(0, 6).forEach((s) => steps.push(practiceStep(st, s, 'warm', today, rnd)));
  }
  return { day: today, steps, at: 0, extra: opts.extra, bonus: opts.bonus, newSkill: fresh?.id ?? null, flagged: [] };
}

function grade(m: Metric, correct: boolean, today: number): Metric {
  const n = { ...m };
  if (correct) {
    n.ok++;
    if (n.last !== today) {
      if (n.flag) { n.clear++; if (n.clear >= 2) { n.flag = false; n.clear = 0; } }
      n.box = Math.min(MAX_BOX, n.box + 1);
      n.due = today + INTERVALS[n.box];
    }
  } else { n.no++; n.box = Math.max(0, n.box - 2); n.flag = true; n.clear = 0; n.due = today + 1; }
  n.last = today;
  return n;
}

/** Registers that she met the skill, so leaving in the middle of a lesson does not lose it. */
export const markMet = (st: MathState, id: string, today: number): MathState => {
  const x = ss(st, id);
  return x.met !== null ? st : { ...st, skills: { ...st.skills, [id]: { ...x, met: today } } };
};

/** One answered question. A retry and a partly solved example are never graded. A hint means success with help: it is not a mistake, and it does not promote. */
export function recordAnswer(st: MathState, step: Step, res: { correct: boolean; hinted: boolean; trap?: TrapId }, today: number): MathState {
  let next = markMet(st, step.skill, today);
  if (res.trap && !res.correct) next = { ...next, traps: { ...next.traps, [res.trap]: (next.traps[res.trap] ?? 0) + 1 } };
  if (step.retry || step.kind !== 'solve') return next;
  const x = ss(next, step.skill), m = x[step.measure], log = dayLog(next, today);
  let nm: Metric;
  if (res.correct && res.hinted) nm = { ...m, helped: m.helped + 1, due: Math.max(m.due, today + 1) };
  else if (!res.correct && step.part === 'new' && m.ok === 0) nm = { ...m, no: m.no + 1, due: today + 1, last: today };
  else nm = grade(m, res.correct, today);
  const days = { ...next.days, [today]: { ...log, ok: log.ok + (res.correct && !res.hinted ? 1 : 0), no: log.no + (res.correct ? 0 : 1), helped: log.helped + (res.correct && res.hinted ? 1 : 0) } };
  const plan = next.plan && nm.flag && !next.plan.flagged.includes(step.skill) ? { ...next.plan, flagged: [...next.plan.flagged, step.skill] } : next.plan;
  return { ...next, days, plan, skills: { ...next.skills, [step.skill]: { ...x, [step.measure]: nm } } };
}

/** One gentle second look, later in the same part, with help on the screen. It does not count again. */
export function queueRetry(st: MathState, step: Step, rnd: Rnd = Math.random): MathState {
  if (!st.plan || step.retry || step.kind !== 'solve') return st;
  const last = st.plan.steps.reduce((acc, s, i) => (s.part === step.part ? i : acc), st.plan.at);
  const copy = [...st.plan.steps];
  copy.splice(last + 1, 0, { ...step, retry: true, seed: newSeed(rnd), support: true, mode: 'choice' });
  return { ...st, plan: { ...st.plan, steps: copy } };
}

export function advance(st: MathState): MathState {
  if (!st.plan) return st;
  const at = st.plan.at + 1, today = st.plan.day, log = dayLog(st, today);
  const finished = at >= st.plan.steps.length && !st.plan.extra && !st.plan.bonus;
  return { ...st, plan: { ...st.plan, at }, days: finished ? { ...st.days, [today]: { ...log, done: true } } : st.days };
}

export const addTime = (st: MathState, day: number, sec: number): MathState => {
  const log = dayLog(st, day);
  return { ...st, days: { ...st.days, [day]: { ...log, sec: (log.sec ?? 0) + sec } } };
};

// ---------- Question building ----------
export function makeQuestion(step: Pick<Step, 'skill' | 'measure' | 'seed' | 'support' | 'mode'>): Question {
  const s = SKILL[step.skill];
  const gen = step.measure === 'u' ? s.u ?? s.e! : s.e ?? s.u!;
  const q = gen(seeded(step.seed));
  const fig: Fig | undefined = q.needFig || step.support ? q.fig : undefined;
  const choices = step.mode === 'choice' && !q.choices ? autoChoices(q, seeded(step.seed + 7)) : q.choices;
  const wrong = q.wrong?.filter(([v]) => !sameValue(v, q.answer));
  // Every question can be worked on paper, and every one has a hint behind the pencil.
  return { ...q, pencil: true, fig, wrong, choices: choices ? shuffle(choices, seeded(step.seed + 3)) : undefined };
}
function autoChoices(q: Question, rnd: Rnd) {
  const out = new Map<string, { label: string; trap?: TrapId }>([[q.answer, { label: q.answer }]]);
  for (const [v, t] of q.wrong ?? []) if (!sameValue(v, q.answer) && out.size < 4 && v !== '0') out.set(v, { label: v, trap: t });
  const base = parseValue(q.answer);
  for (let i = 1; out.size < 4 && i < 40; i++) {
    const v = q.frac && base ? `${Math.max(1, base.n + i)}/${base.d + (i % 2)}` : q.dot ? String(Math.round((Number(q.answer) + i * (rnd() < 0.5 ? 0.1 : 1)) * 100) / 100) : String(Number(q.answer) + (rnd() < 0.5 ? i : -i));
    if (Number(v) !== 0 && !v.startsWith('-') && !sameValue(v, q.answer)) out.set(v, { label: v });
  }
  return [...out.values()].map((c) => ({ ...c, label: shown(c.label) }));
}
/** How a number is shown: thousands separated, fractions as math. */
export const shown = (v: string) => (v.includes('[[') ? v : /^[\u0590-\u05ff]/.test(v) ? v : `[[${/^\d+$/.test(v) ? fmt(Number(v)) : v}]]`);

/** A worked example of the same kind with other numbers, so the hint never gives this answer away. */
export function hintFor(step: Pick<Step, 'skill' | 'measure' | 'seed'>, q: Question): Question {
  const face = (x: Question) => JSON.stringify([x.big, x.prompt, x.fig]);
  let other: Question | null = null;
  for (let i = 1; i < 80; i++) {
    const h = makeQuestion({ ...step, seed: step.seed + i * 101, support: true, mode: 'type' });
    if (face(h) === face(q)) continue;
    other ??= h;
    if (h.answer !== q.answer && !sameValue(h.answer, q.answer)) return h;
  }
  return other ?? makeQuestion({ ...step, seed: step.seed + 9999, support: true, mode: 'type' });
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export function parseValue(raw: string): { n: number; d: number } | null {
  const t = raw.replace(/,/g, '').replace(/−/g, '-').trim();
  if (/^-?\d+$/.test(t)) return { n: Number(t), d: 1 };
  const fr = t.match(/^(-?\d+)\/(\d+)$/);
  if (fr) { const d = Number(fr[2]); if (!d) return null; const g = gcd(Number(fr[1]), d) || 1; return { n: Number(fr[1]) / g, d: d / g }; }
  const de = t.match(/^(-?)(\d*)\.(\d+)$/);
  if (de) { const d = 10 ** de[3].length, a = Number(de[2] || 0) * d + Number(de[3]), g = gcd(a, d) || 1; return { n: (de[1] ? -a : a) / g, d: d / g }; }
  return null;
}
export const sameValue = (a: string, b: string) => { const x = parseValue(a), y = parseValue(b); return !!x && !!y && x.n === y.n && x.d === y.d; };

/** An equal value in any form is right (1/2 and 0.5), unless the question asks for one exact form. */
export function checkTyped(q: Question, typed: string): boolean {
  if (q.exact) return typed.replace(/,/g, '').trim() === q.answer;
  return sameValue(typed, q.answer);
}
export const trapForTyped = (q: Question, typed: string): TrapId | undefined => q.wrong?.find(([v]) => sameValue(v, typed))?.[1];
export const isChoiceRight = (q: Question, label: string) => label === q.answer || label === shown(q.answer);

// ---------- Placement: three separate areas, and the run stops where she does ----------
export const startPlacement = (seed: number): Placement => ({ d: 0, station: stationsOf(DOMAINS[0].id)[0], round: 0, i: 0, score: 0, seed, start: {}, asked: 0 });
export const stationsOf = (d: Domain) => STATIONS.filter((s) => s.domain === d).map((s) => s.id);

export function placementStep(p: Placement): Pick<Step, 'skill' | 'measure' | 'seed' | 'support' | 'mode'> {
  const skills = shuffle(SKILLS.filter((s) => s.station === p.station), seeded(p.seed + p.station * 31 + p.round * 7));
  const s = skills[p.i % skills.length];
  const m: Measure = s.e ? 'e' : 'u';
  return { skill: s.id, measure: m, seed: p.seed + p.station * 1000 + p.round * 100 + p.i, support: false, mode: m === 'u' ? 'choice' : 'type' };
}

function stopDomain(p: Placement, at: number): Placement {
  const start = { ...p.start, [DOMAINS[p.d].id]: at };
  const d = p.d + 1;
  if (d >= DOMAINS.length) return { ...p, start, d };
  return { ...p, start, d, station: stationsOf(DOMAINS[d].id)[0], round: 0, i: 0, score: 0 };
}
export const placementDone = (p: Placement) => p.d >= DOMAINS.length;

/** 'notyet' stops this area and is not counted as a mistake. */
export function answerPlacement(p: Placement, res: boolean | 'notyet'): Placement {
  if (res === 'notyet') return { ...stopDomain(p, p.station), asked: p.asked + 1 };
  const score = p.score + (res ? 1 : 0), i = p.i + 1, asked = p.asked + 1;
  if (i < PLACEMENT_QUESTIONS) return { ...p, i, score, asked };
  if (score >= PLACEMENT_PASS) {
    const list = stationsOf(DOMAINS[p.d].id), idx = list.indexOf(p.station);
    if (idx + 1 < list.length) return { ...p, station: list[idx + 1], round: 0, i: 0, score: 0, asked };
    return { ...stopDomain(p, p.station + 1), asked };
  }
  if (p.round === 0) return { ...p, round: 1, i: 0, score: 0, asked };
  return { ...stopDomain(p, p.station), asked };
}

/** What she passed counts as known on condition: it comes back in warm-ups, and a mistake sends it to practice. */
export function applyPlacement(st: MathState, p: Placement, today: number): MathState {
  const skills = { ...st.skills };
  let i = 0;
  for (const s of SKILLS) {
    const dom = STATIONS.find((x) => x.id === s.station)!.domain;
    if (s.station < (p.start[dom] ?? 1)) {
      const m = (): Metric => ({ ...freshMetric(), box: SOLID_BOX, due: today + 1 + (i++ % 14) });
      skills[s.id] = { u: s.u ? m() : freshMetric(), e: s.e ? m() : freshMetric(), met: today, assumed: true };
    }
  }
  const low = (p.start.num ?? 1) <= 2;
  return { ...st, skills, start: p.start, placement: null, onboarded: true, settings: { ...st.settings, pace: low ? 'calm' : st.settings.pace } };
}

// ---------- Progress ----------
export const statusOf = (st: MathState, s: Skill): string => {
  if (!isMet(st, s.id)) return isOpen(st, s) ? 'מחכה לך' : 'עוד לא נפתח';
  const x = ss(st, s.id);
  if (measures(s).some((m) => x[m].flag)) return 'צריך חיזוק';
  if (isSolid(st, s.id)) return x.assumed ? 'מוכר, ונבדק בחימום' : 'מבוסס';
  return 'בתהליך';
};
export const totals = (st: MathState) => ({
  u: SKILLS.filter((s) => s.u && isMet(st, s.id) && ss(st, s.id).u.box >= SOLID_BOX && !ss(st, s.id).u.flag).length, uAll: SKILLS.filter((s) => s.u).length,
  e: SKILLS.filter((s) => s.e && isMet(st, s.id) && ss(st, s.id).e.box >= SOLID_BOX && !ss(st, s.id).e.flag).length, eAll: SKILLS.filter((s) => s.e).length,
  solid: SKILLS.filter((s) => isSolid(st, s.id)).length, all: SKILLS.length,
});
export const weekDays = (st: MathState, today: number) => { const dow = (today + 4) % 7; return Array.from({ length: 7 }, (_, i) => !!st.days[today - dow + i]?.done); };
export const flaggedSkills = (st: MathState) => SKILLS.filter((s) => measures(s).some((m) => ss(st, s.id)[m].flag));
