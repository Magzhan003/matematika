import { formulas, type Formula, type Level, type Section } from '../data/formulas'
import { N, normalize, num, splitList, tex } from './mathcore'

export type Question =
  | { kind: 'choice'; fid: string; options: string[]; correct: number }
  | { kind: 'number'; fid: string; given: string; unknownTex: string; value: number; answerTex: string }

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

/** Ranges for random givens: [min, max, multiplier]. Default is [2, 12, 1]. */
const ranges: Record<string, Record<string, [number, number, number]>> = {
  percent: { a: [2, 50, 10], p: [1, 10, 5] },
  motion: { v: [1, 12, 5], t: [1, 6, 1] },
  proportion: { b: [1, 12, 1], c: [1, 12, 1], d: [1, 12, 1] },
  linear: { a: [1, 9, 1], b: [-12, 12, 1] },
  discriminant: { a: [1, 5, 1], b: [-9, 9, 1], c: [-9, 9, 1] },
  'arithmetic-progression': { a1: [-5, 10, 1], n: [2, 15, 1], d: [-4, 6, 1] },
  'geometric-progression': { b1: [1, 5, 1], q: [2, 3, 1], n: [2, 6, 1] },
  'triangle-angles': { be: [3, 8, 10], ga: [2, 6, 10] },
  'polygon-angles': { n: [3, 12, 1] },
  'arithmetic-sum': { a1: [1, 10, 1], an: [10, 50, 1], n: [3, 20, 1] },
  probability: { m: [1, 5, 1], n: [6, 12, 1] },
  sector: { r: [1, 10, 1], al: [1, 6, 30] },
  'linear-function': { k: [-5, 5, 1], x: [-5, 5, 1], b: [-10, 10, 1] },
  'infinite-geometric': { b1: [1, 20, 1], q: [1, 9, 0.1] },
  'compound-interest': { S0: [1, 10, 10000], p: [1, 4, 5], n: [1, 5, 1] },
  'percent-whole': { x: [1, 20, 3], p: [1, 10, 10] },
  'percent-ratio': { x: [1, 10, 5], a: [2, 10, 10] },
  concentration: { m1: [1, 10, 5], m: [2, 10, 100] },
  'half-life': { m0: [1, 10, 16], t: [1, 4, 5], T: [1, 1, 5] },
  'parallelogram-diagonals': { d1: [2, 6, 1], a: [4, 8, 1], b: [4, 8, 1] },
  'adjacent-angles': { be: [2, 16, 10] },
}

const levelRank: Record<Level, number> = { easy: 0, medium: 1, hard: 2 }

/** Picks a formula from a different card: "which formula is this?" */
export function choiceQuestion(f: Formula): Question {
  const others = shuffle(formulas.filter((o) => o.id !== f.id && o.branch === f.branch && o.tex !== f.tex)).slice(0, 3)
  const options = shuffle([f.tex, ...others.map((o) => o.tex)])
  return { kind: 'choice', fid: f.id, options, correct: options.indexOf(f.tex) }
}

/** Random givens, solve for the first variable of the formula calculator. */
export function numberQuestion(f: Formula): Question | null {
  const c = f.calc
  if (!c) return null
  const [unknown, ...rest] = c.vars
  for (let attempt = 0; attempt < 8; attempt++) {
    const known: Record<string, string> = {}
    for (const v of rest) {
      const [min, max, mul] = ranges[f.id]?.[v.name] ?? [2, 12, 1]
      known[v.name] = String(Number((rand(min, max) * mul).toFixed(4)))
    }
    try {
      const [L, R] = c.eq.split('=').map((s) => s.trim())
      const l = N(L, known).toString()
      const r = N(R, known).toString()
      const roots = splitList(N.solve(`(${l})-(${r})`, unknown.name).toString())
        .map((x) => ({ x, v: num(x) }))
        .filter(({ v }) => Number.isFinite(v) && (!c.positive || v > 0))
      if (!roots.length) continue
      const { x, v } = roots[0]
      const exact = tex(x)
      const approx = Number.isInteger(v) ? '' : ` \\approx ${String(Number(v.toFixed(2))).replace('.', '{,}')}`
      return {
        kind: 'number',
        fid: f.id,
        given: rest.map((vv) => `${vv.tex} = ${known[vv.name].replace('.', '{,}')}`).join(';\\; '),
        unknownTex: unknown.tex,
        value: v,
        answerTex: `${unknown.tex} = ${exact}${approx}`,
      }
    } catch {
      /* try another set of numbers */
    }
  }
  return null
}

export function checkNumber(q: Extract<Question, { kind: 'number' }>, input: string): boolean | null {
  const s = normalize(input)
  if (!s) return null
  const v = num(s)
  if (!Number.isFinite(v)) return null
  return Math.abs(v - q.value) <= Math.max(0.01, Math.abs(q.value) * 0.005)
}

export function poolFor(scope: Section | 'all', level: Level): Formula[] {
  return formulas.filter((f) => (scope === 'all' || f.section === scope) && levelRank[f.level] <= levelRank[level])
}

/** 10 questions mixing "compute" and "pick the formula", weighted to the chosen level. */
export function buildTest(scope: Section | 'all', level: Level, size = 10): Question[] {
  const pool = poolFor(scope, level)
  if (!pool.length) return []
  const exact = pool.filter((f) => f.level === level)
  const order = shuffle([...shuffle(exact), ...shuffle(pool)])
  const qs: Question[] = []
  const asked = new Set<string>() // each "pick the formula" question only once
  for (let i = 0; qs.length < size && i < size * 4; i++) {
    const f = order[i % order.length]
    const wantNumber = qs.length % 2 === 0
    let q: Question | null = wantNumber ? numberQuestion(f) : null
    if (!q && !asked.has(f.id)) {
      q = choiceQuestion(f)
      asked.add(f.id)
    }
    if (!q) q = numberQuestion(f) // numbers differ every time, so repeats are fine
    if (q) qs.push(q)
  }
  return shuffle(qs)
}

export function lessonCheck(f: Formula): Question[] {
  const n = numberQuestion(f)
  return n ? [n, choiceQuestion(f)] : [choiceQuestion(f)]
}

export const PASS_PERCENT = 70
export const testKey = (scope: Section | 'all', level: Level) => `${scope}:${level}`
