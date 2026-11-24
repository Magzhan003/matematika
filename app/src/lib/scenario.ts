/**
 * Lesson scenario: a 40/45-minute lesson on one topic split into stages with minutes and content
 * (warm-up on the previous topic, recall, new material from the formula cards, practice,
 * a short check in two variants, reflection and homework).
 */
import { curriculum } from '../data/curriculum'
import { formulas, type Formula } from '../data/formulas'
import { geometrySections, topicById } from '../data/topics'
import { gens, seeded, type Gen, type Problem, type Rng } from './bank'

export type StageKey = 'org' | 'warmup' | 'recall' | 'new' | 'practice' | 'check' | 'reflect'
export type Stage = { key: StageKey; minutes: number; problems?: Problem[]; variants?: Problem[][]; formulas?: Formula[]; homework?: Problem[] }
export type Scenario = { topic: string; prevTopic: string | null; grade: number; stages: Stage[]; total: number }

const MINUTES: Record<40 | 45, Record<StageKey, number>> = {
  40: { org: 2, warmup: 5, recall: 4, new: 10, practice: 11, check: 6, reflect: 2 },
  45: { org: 2, warmup: 5, recall: 4, new: 10, practice: 13, check: 8, reflect: 3 },
}

/** The topic studied before `topic` in this grade (or in the grade below), for the warm-up. */
export function previousTopic(topic: string, grade: number): string | null {
  const order = [...(curriculum[grade - 1] ?? []).flat(), ...curriculum[grade].flat()]
  const at = order.lastIndexOf(topic)
  const geo = (id: string) => geometrySections.includes(topicById(id)?.section as never)
  const ok = (id: string) => id !== topic && gens.some((g) => g.topic === id)
  // an algebra lesson warms up on algebra, a geometry lesson on geometry; otherwise any earlier topic
  for (let i = at - 1; i >= 0; i--) if (ok(order[i]) && geo(order[i]) === geo(topic)) return order[i]
  for (let i = at - 1; i >= 0; i--) if (ok(order[i])) return order[i]
  return null
}

const rank = { easy: 0, medium: 1, hard: 2 }
/** `n` problems of the topic, easy first; different numbers each time. */
function take(list: Gen[], n: number, r: Rng, maxLevel = 2): Problem[] {
  const pool = list.filter((g) => rank[g.level] <= maxLevel)
  const src = pool.length ? pool : list
  if (!src.length) return []
  const seen = new Set<string>()
  const out: Problem[] = []
  for (let i = 0; out.length < n && i < n * 8; i++) {
    const g = src[i % src.length]
    const p = g.make(r)
    if (seen.has(p.text.ru + p.tex)) continue
    seen.add(p.text.ru + p.tex); out.push(p)
  }
  return out.sort((a, b) => rank[a.level] - rank[b.level])
}

export function buildScenario(topic: string, grade: number, length: 40 | 45, seed: number): Scenario {
  const r = seeded(seed)
  const own = gens.filter((g) => g.topic === topic)
  const prev = previousTopic(topic, grade)
  const prevGens = prev ? gens.filter((g) => g.topic === prev) : []
  const fs = formulas.filter((f) => f.topic === topic && f.grade <= grade + 1).sort((a, b) => a.grade - b.grade || rank[a.level] - rank[b.level])
  const m = MINUTES[length]
  const stages: Stage[] = [
    { key: 'org', minutes: m.org, formulas: fs.slice(0, 1) },
    { key: 'warmup', minutes: m.warmup, problems: take(prevGens.length ? prevGens : own, 4, r, 0) },
    { key: 'recall', minutes: m.recall, formulas: fs.slice(0, 4) },
    { key: 'new', minutes: m.new, formulas: fs.slice(0, 2) },
    { key: 'practice', minutes: m.practice, problems: take(own, length === 45 ? 6 : 5, r, 1) },
    { key: 'check', minutes: m.check, variants: [take(own, 3, seeded(seed * 7 + 1)), take(own, 3, seeded(seed * 7 + 2))] },
    { key: 'reflect', minutes: m.reflect, homework: take(own, 3, seeded(seed * 7 + 3)) },
  ]
  return { topic, prevTopic: prevGens.length ? prev : null, grade, stages, total: stages.reduce((s, x) => s + x.minutes, 0) }
}
