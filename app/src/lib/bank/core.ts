/**
 * Problem bank: generators that create school problems with random (or seeded)
 * numbers, the exact answer, wrong answers for multiple choice and, when the
 * problem is an equation/expression, the raw input for the step-by-step solver.
 */
import type { Level } from '../../data/formulas'
import { numTex } from '../calc/tools'

export type L = { ru: string; kz: string }
export type Rng = () => number

export type Problem = {
  gen: string
  topic: string
  level: Level
  text: L
  /** Math part of the statement (TeX), may be empty for word problems. */
  tex: string
  /** Exact answer (TeX). */
  answer: string
  /** Numeric value(s) for typed answers; roots may come in any order. */
  values?: number[]
  /** Wrong answers (TeX) for multiple choice; numeric ones are filled automatically. */
  wrong?: string[]
  /** Raw input for the step-by-step solver (calc/index.ts → solveAny). */
  solve?: string
  solveAction?: 'auto' | 'diff' | 'integrate' | 'factor' | 'expand' | 'simplify'
  /** Short solution lines (TeX) when the solver does not apply. */
  steps?: string[]
  /** Typical wrong answers with the reason (i18n key under "mist."); they also become answer options. */
  mistakes?: Mistake[]
  /** A table or a bar chart that belongs to the statement (math literacy tasks). */
  visual?: Visual
}

type Cell = string | number | L
export type Visual =
  | { kind: 'table'; head: Cell[]; rows: Cell[][] }
  | { kind: 'bars'; title: L; labels: Cell[]; values: number[]; unit?: L }

export type Mistake = { tex: string; values?: number[]; why: string }
/** A typical wrong number (tex is built from the value unless given). */
export const mk = (v: number, why: string, tex = numTex(v)): Mistake => ({ tex, values: [v], why })
/** A typical wrong answer written in TeX (an expression, roots, an interval…). */
export const mkT = (tex: string, why: string, values?: number[]): Mistake => ({ tex, values, why })

export type Gen = { id: string; topic: string; level: Level; grade: number; make: (r: Rng) => Problem }

/** Small fast seeded RNG (mulberry32). */
export function seeded(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const ri = (r: Rng, min: number, max: number) => min + Math.floor(r() * (max - min + 1))
export const pick = <T,>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length)]
export const nz = (r: Rng, min: number, max: number) => {
  let x = 0
  while (x === 0) x = ri(r, min, max)
  return x
}
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))

/** Signed term for TeX: "+ 3x", "- x", "+ 5". */
export function term(k: number, v = '', first = false): string {
  if (k === 0) return ''
  const abs = Math.abs(k)
  const coef = v && abs === 1 ? '' : String(abs)
  const sign = k < 0 ? '-' : first ? '' : '+'
  return `${first ? sign : ` ${sign} `}${coef}${v}`.trimEnd()
}
/** Polynomial a·x² + b·x + c as TeX, skipping zero terms. */
export function poly(c: number[], v = 'x'): string {
  const deg = c.length - 1
  let out = ''
  c.forEach((k, i) => {
    if (k === 0) return
    const p = deg - i
    const mono = p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`
    const abs = Math.abs(k)
    const coef = mono && abs === 1 ? '' : String(abs)
    const sign = k < 0 ? '-' : '+'
    out += out === '' ? `${k < 0 ? '-' : ''}${coef}${mono}` : ` ${sign} ${coef}${mono}`
  })
  return out || '0'
}
/** Same polynomial as plain input for the solver. */
export function polyIn(c: number[], v = 'x'): string {
  const deg = c.length - 1
  return c.map((k, i) => {
    const p = deg - i
    if (k === 0) return ''
    const mono = p === 0 ? '' : p === 1 ? v : `${v}^${p}`
    return `${k < 0 ? '-' : '+'}${Math.abs(k) === 1 && mono ? '' : Math.abs(k)}${mono}`
  }).join('').replace(/^\+/, '') || '0'
}

export const frac = (n: number, d: number) => {
  const g = gcd(n, d) || 1
  let [a, b] = [n / g, d / g]
  if (b < 0) { a = -a; b = -b }
  return b === 1 ? String(a) : `${a < 0 ? '-' : ''}\\dfrac{${Math.abs(a)}}{${b}}`
}

/** Distractors for numeric answers: typical slips (sign, ±1, ×2, ÷2, ±10 %). */
export function numericWrong(v: number, r: Rng, n = 4): string[] {
  const cands = new Set<string>()
  const base = numTex(v)
  const opts = [v + 1, v - 1, -v, v * 2, v / 2, v + 2, v - 2, v * 1.1, v + 10, v - 10, v * 3, v + 5]
  for (const o of opts.sort(() => r() - 0.5)) {
    const tt = numTex(Number(o.toFixed(4)))
    if (tt !== base && !/,\d{3,}/.test(tt)) cands.add(tt)
    if (cands.size >= n) break
  }
  return [...cands]
}
