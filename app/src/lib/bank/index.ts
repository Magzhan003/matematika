import type { Level } from '../../data/formulas'
import { topicById, type Section } from '../../data/topics'
import { normalize, num } from '../mathcore'
import { prepare } from '../calc/tools'
import { algGens } from './alg'
import { numericWrong, seeded, type Gen, type Mistake, type Problem, type Rng } from './core'
import { alg7Gens } from './alg7'
import { extraGens } from './extra'
import { geoGens } from './geo'
import { literacyGens } from './literacy'

export type { Gen, Mistake, Problem, Rng } from './core'
export { seeded } from './core'

export const gens: Gen[] = [...algGens, ...geoGens, ...literacyGens, ...extraGens, ...alg7Gens]
export const genById = (id: string) => gens.find((g) => g.id === id)

const rank: Record<Level, number> = { easy: 0, medium: 1, hard: 2 }
export const sectionOfGen = (g: Gen): Section | undefined => topicById(g.topic)?.section

/** Generators for a set of topics/sections, up to a level. */
export function gensFor(opts: { topics?: string[]; sections?: Section[]; level?: Level; exactLevel?: boolean }): Gen[] {
  return gens.filter((g) => {
    if (opts.topics?.length && !opts.topics.includes(g.topic)) return false
    if (opts.sections?.length && !opts.sections.includes(sectionOfGen(g)!)) return false
    if (opts.level) return opts.exactLevel ? g.level === opts.level : rank[g.level] <= rank[opts.level]
    return true
  })
}

/** Multiple-choice options: the answer plus distractors, shuffled. */
export function choices(p: Problem, r: Rng = Math.random, n = 5): { options: string[]; correct: number } {
  // typical mistakes come first: they are the most "tempting" wrong options
  let wrong = [...(p.mistakes ?? []).map((m) => m.tex), ...(p.wrong ?? [])].filter((w) => w !== p.answer)
  if (wrong.length < n - 1 && p.values?.length === 1) wrong = [...wrong, ...numericWrong(p.values[0], r, n)]
  wrong = [...new Set(wrong)].filter((w) => w !== p.answer)
  // fallback: shift the last number of the answer until there are enough options
  for (const k of [1, -1, 2, -2, 3, 5]) {
    if (wrong.length >= n - 1) break
    const w = p.answer.replace(/-?\d+(?!.*\d)/, (m) => String(Number(m) + k))
    if (w !== p.answer && !wrong.includes(w)) wrong.push(w)
  }
  wrong = wrong.slice(0, n - 1)
  const options = [...wrong, p.answer].sort(() => r() - 0.5)
  return { options, correct: options.indexOf(p.answer) }
}

/** Numbers typed by the student ("x = 2; 3", "-1 и 4"), or null if something is not a number. */
function parseTyped(input: string): number[] | null {
  const parts = input
    .replace(/x\s*[_\d]*\s*=|y\s*=|\(|\)/gi, ' ')
    .split(/[;\n]|,(?!\d)|\s+и\s+|\s+және\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const vals = parts.map((s) => num(prepare(normalize(s))))
  return !vals.length || vals.some((v) => !Number.isFinite(v)) ? null : vals
}

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => Math.abs(v - [...b].sort((x, y) => x - y)[i]) <= Math.max(0.011, Math.abs(v) * 1e-4))

/** Which typical mistake a wrong answer matches (a chosen option or typed numbers). */
export function findMistake(p: Problem, answer: { picked?: string; typed?: string }): Mistake | undefined {
  const list = (p.mistakes ?? []).filter((m) => m.tex !== p.answer && !(m.values && p.values && sameSet(m.values, p.values)))
  if (answer.picked !== undefined) return list.find((m) => m.tex === answer.picked)
  if (answer.typed !== undefined) {
    const vals = parseTyped(answer.typed)
    return vals ? list.find((m) => m.values && sameSet(m.values, vals)) : undefined
  }
  return undefined
}

/** Check a typed answer: every expected value must appear (order free). */
export function checkTyped(p: Problem, input: string): boolean | null {
  if (!p.values?.length) return null
  const vals = parseTyped(input)
  if (!vals) return null
  const need = [...p.values]
  if (vals.length !== need.length) return false
  // integers must match exactly; other answers may be rounded to hundredths
  const ok = (a: number, b: number) =>
    Number.isInteger(b) ? Math.abs(a - b) < 1e-9 : Math.abs(a - b) <= Math.max(0.011, Math.abs(b) * 1e-4)
  return need.every((v) => {
    const i = vals.findIndex((u) => ok(u, v))
    if (i < 0) return false
    vals.splice(i, 1)
    return true
  })
}

/** Deterministic problem for a given day (task of the day). */
export function problemOfDay(date = new Date()): Problem {
  const key = Number(date.toISOString().slice(0, 10).replace(/-/g, ''))
  const r = seeded(key)
  const g = gens[Math.floor(r() * gens.length)]
  return g.make(r)
}

/** Generate `count` problems spread over the generators, avoiding repeats where possible. */
export function makeSet(list: Gen[], count: number, r: Rng = Math.random): Problem[] {
  return pickGens(list, count, r).map((g) => g.make(r))
}

/** Choose `count` generators (task types) in a random order, repeating only when needed. */
export function pickGens(list: Gen[], count: number, r: Rng = Math.random): Gen[] {
  if (!list.length) return []
  const order: Gen[] = []
  while (order.length < count) order.push(...[...list].sort(() => r() - 0.5))
  return order.slice(0, count)
}
