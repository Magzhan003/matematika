/**
 * ЕНТ preparation plan by days: weak topics first (by the diagnostic and answers),
 * prerequisites before the topics that need them, algebra and geometry on the same day,
 * math literacy regularly, a mock exam every 7th day, and a full mock + rest at the end.
 */
import { geometrySections, topicById, topics } from '../data/topics'
import { gens } from './bank'
import { masteryOf, prereqs, topicGrade, type Status } from './mastery'

export type DayKind = 'study' | 'mock' | 'full' | 'rest'
export type PlanDay = { n: number; date: string; kind: DayKind; topics: string[] }
export type Plan = { created: string; exam: string; days: PlanDay[]; done: number[] }

type Store = Parameters<typeof masteryOf>[1]
const weight: Record<Status, number> = { weak: 0, unknown: 1, learning: 2, mastered: 3 }
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const todayIso = () => iso(new Date())
export function addDays(dateIso: string, k: number) { const d = new Date(`${dateIso}T12:00:00`); d.setDate(d.getDate() + k); return iso(d) }
export function daysBetween(a: string, b: string) { return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000) }

/** Topics in the order to study: weakest first, but never before their prerequisites. */
export function topicOrder(store: Store): string[] {
  const ids = topics.map((t) => t.id).filter((id) => id !== 'literacy' && gens.some((g) => g.topic === id))
  const score = (id: string) => weight[masteryOf(topicById(id)!, store).status] * 100 + topicGrade(id)
  const sorted = [...ids].sort((a, b) => score(a) - score(b))
  const out: string[] = []
  const visit = (id: string, path: Set<string>) => {
    if (out.includes(id) || path.has(id) || !ids.includes(id)) return
    path.add(id)
    // a weak prerequisite comes first; a mastered one is skipped here (it is reviewed later)
    for (const p of prereqs[id] ?? []) if (weight[masteryOf(topicById(p)!, store).status] < 3) visit(p, path)
    out.push(id)
  }
  for (const id of sorted) visit(id, new Set())
  return out
}

export function buildPlan(exam: string, store: Store, start = todayIso()): Plan {
  const total = Math.max(3, daysBetween(start, exam))
  const order = topicOrder(store)
  const isGeo = (id: string) => geometrySections.includes(topicById(id)!.section)
  const alg = order.filter((id) => !isGeo(id)), geo = order.filter(isGeo)
  // review queue: after the first pass, topics that are not mastered come again
  const again = order.filter((id) => weight[masteryOf(topicById(id)!, store).status] < 3)
  const review = again.length ? again : order
  let ai = 0, gi = 0, ri = 0
  /** First pass: one algebra + one geometry topic a day while both last; then the review queue. */
  const take = (k: number) => {
    const out: string[] = []
    let turn = ai <= gi ? 'a' : 'g'
    while (out.length < k && (ai < alg.length || gi < geo.length)) {
      if ((turn === 'a' && ai < alg.length) || gi >= geo.length) out.push(alg[ai++]); else out.push(geo[gi++])
      turn = turn === 'a' ? 'g' : 'a'
    }
    while (out.length < k) { const id = review[ri++ % review.length]; if (!out.includes(id)) out.push(id); else if (review.length < 2) break }
    return out
  }
  const days: PlanDay[] = []
  for (let n = 1; n <= total; n++) {
    const date = addDays(start, n - 1)
    let kind: DayKind = 'study', tp: string[] = []
    if (n === total) kind = 'rest'
    else if (n === total - 1 && total >= 6) kind = 'full'
    else if (n % 7 === 0) kind = 'mock'
    // math literacy is a separate ЕНТ test: it gets every third day of a week
    else tp = n % 7 === 3 ? [...take(1), 'literacy'] : take(2)
    days.push({ n, date, kind, topics: tp })
  }
  return { created: start, exam, days, done: [] }
}

const KEY = 'ent-plan'
export function loadPlan(): Plan | null { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') } catch { return null } }
export function savePlan(p: Plan | null) { try { if (p) localStorage.setItem(KEY, JSON.stringify(p)); else localStorage.removeItem(KEY) } catch { /* storage blocked */ } }
