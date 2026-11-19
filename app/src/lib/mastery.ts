import { formulas } from '../data/formulas'
import { topics, type Topic } from '../data/topics'
import { gens } from './bank'

/** What a student should know before a topic (school order). */
export const prereqs: Record<string, string[]> = {
  fractions: [], percents: ['fractions'], proportions: ['fractions'], divisibility: [], 'word-problems': ['proportions', 'linear-eq'], literacy: ['percents', 'proportions'],
  powers: [], roots: ['powers'], 'short-mult': ['powers'], 'linear-eq': ['fractions'], quadratic: ['short-mult', 'roots', 'linear-eq'],
  inequalities: ['linear-eq'], 'linear-fn': ['linear-eq', 'coord-plane'], 'quadratic-fn': ['quadratic', 'linear-fn'], 'other-fn': ['linear-fn'],
  'arith-prog': ['linear-eq'], 'geom-prog': ['powers'],
  'trig-basics': ['right-triangle'], 'trig-identities': ['trig-basics'], 'trig-reduction': ['trig-identities'], 'trig-addition': ['trig-identities'],
  'trig-double': ['trig-addition'], 'trig-sum-product': ['trig-addition'], 'trig-equations': ['trig-identities', 'trig-reduction', 'inverse-trig'], 'inverse-trig': ['trig-basics'], 'trig-inequalities': ['trig-equations'], complex: ['quadratic'], 'integrals-table': ['antiderivatives'],
  'exp-fn': ['powers'], 'log-props': ['exp-fn'], 'log-eq': ['log-props', 'quadratic'],
  'derivative-table': ['other-fn', 'powers'], 'derivative-rules': ['derivative-table'], 'derivative-apply': ['derivative-rules', 'inequalities'],
  antiderivatives: ['derivative-table'], integrals: ['antiderivatives'],
  combinatorics: [], probability: ['fractions', 'combinatorics'], statistics: ['fractions'],
  'angles-lines': [], triangles: ['angles-lines'], 'triangle-area': ['triangles'], 'right-triangle': ['triangles', 'roots'],
  quadrilaterals: ['triangles'], polygons: ['triangles'], circle: ['triangles'],
  'coord-plane': [], vectors: ['coord-plane'], prisms: ['quadrilaterals'], pyramids: ['prisms', 'right-triangle'], 'bodies-rotation': ['circle'],
}

/** The school grade where a topic starts: the earliest formula or task of the topic. */
export function topicGrade(id: string): number {
  const gr = [...formulas.filter((f) => f.topic === id).map((f) => f.grade), ...gens.filter((g) => g.topic === id).map((g) => g.grade)]
  return gr.length ? Math.min(...gr) : 11
}

export type Status = 'unknown' | 'weak' | 'learning' | 'mastered'
export type Mastery = { topic: Topic; value: number | null; status: Status; answered: number; lessons: number; lessonsTotal: number }

type P = {
  stats: Record<string, { ok: number; n: number }>
  lessonsDone: string[]
  diag: { topics: Record<string, number> } | null
}

/** How well a topic is known (0..1) from answers, the diagnostic test and finished lessons. */
export function masteryOf(topic: Topic, p: P): Mastery {
  const fs = formulas.filter((f) => f.topic === topic.id)
  const keys = [...gens.filter((g) => g.topic === topic.id).map((g) => `g:${g.id}`), ...fs.map((f) => `f:${f.id}`)]
  let ok = 0, n = 0
  for (const k of keys) {
    const s = p.stats[k]
    if (s) { ok += s.ok; n += s.n }
  }
  const lessons = fs.filter((f) => p.lessonsDone.includes(f.id)).length
  const L = fs.length ? lessons / fs.length : 0
  const diag = p.diag?.topics[topic.id]
  const acc = (ok + 1) / (n + 2) // smoothed share of right answers
  const w = Math.min(1, n / 8)
  const knowledge = n > 0 ? (diag !== undefined ? w * acc + (1 - w) * diag : acc) : diag
  let value: number | null = null
  if (knowledge !== undefined) value = 0.75 * knowledge + 0.25 * L
  else if (lessons) value = 0.5 * L
  const status: Status = value === null ? 'unknown' : value >= 0.8 ? 'mastered' : value >= 0.5 ? 'learning' : 'weak'
  return { topic, value, status, answered: n, lessons, lessonsTotal: fs.length }
}

export const allMastery = (p: P) => topics.map((t) => masteryOf(t, p))

/** Topics to work on: weak first, then the ones in progress; a weak prerequisite goes before its topic. */
export function focusTopics(p: P, grade?: number, count = 3): Mastery[] {
  const all = allMastery(p).filter((m) => grade === undefined || topicGrade(m.topic.id) <= grade)
  const byId = new Map(all.map((m) => [m.topic.id, m]))
  const pick: Mastery[] = []
  const order = [...all.filter((m) => m.status === 'weak'), ...all.filter((m) => m.status === 'learning')]
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0))
  for (const m of order) {
    // go down to the weakest prerequisite first
    const pre = (prereqs[m.topic.id] ?? []).map((id) => byId.get(id)).find((x) => x && x.status === 'weak')
    const target = pre ?? m
    if (!pick.includes(target)) pick.push(target)
    if (pick.length >= count) break
  }
  return pick
}
