/**
 * Toolkit for ЕНТ practice sets built on the task types of the Rustyumova trainer (numbers and wording are new).
 * Every question is generated from a seed, so a set can be printed again by its variant number.
 * `verify` holds an independent check that scripts/check-trainer.ts runs for thousands of seeds.
 */
import { frac, gcd, pick, ri, seeded, type Rng } from '../bank/core'
import type { L, MCQ } from '../../data/materials/types'

export { frac, gcd, pick, ri, seeded, type Rng }
export const l = (kz: string, ru: string = kz): L => ({ kz, ru })

/** Independent checks: all real roots of f in a range, or a value computed another way. */
export type Verify =
  | { kind: 'roots'; f: (x: number) => number; roots: number[]; range: [number, number] }
  | { kind: 'value'; got: number; expect: number }
export type TQ = MCQ & { type: string; verify: Verify[] }
export type TGen = { id: string; make: (r: Rng) => TQ }

/** An option: a TeX string (shown in $…$) or text in both languages. */
export type Opt = string | L
const toL = (o: Opt): L => (typeof o === 'string' ? l(`$${o}$`) : o)

/** Builds a question: the right answer at a random place among three distinct wrong ones. */
export function q(r: Rng, type: string, text: L, right: Opt, wrong: Opt[], sol: L, verify: Verify[]): TQ {
  const R = toL(right)
  const seen = new Set([R.kz])
  const W: L[] = []
  for (const w of wrong) {
    const x = toL(w)
    if (!seen.has(x.kz)) { seen.add(x.kz); W.push(x) }
    if (W.length === 3) break
  }
  if (W.length < 3) throw new Error(`${type}: not enough distinct wrong answers`)
  const pos = ri(r, 0, 3)
  const opts = [...W]
  opts.splice(pos, 0, R)
  return { type, q: text, opts, ans: pos, sol, verify }
}

export const roots = (f: (x: number) => number, rs: number[], range: [number, number] = [-60, 60]): Verify => ({ kind: 'roots', f, roots: rs, range })
export const value = (got: number, expect: number): Verify => ({ kind: 'value', got, expect })

/** Number for TeX with a decimal comma (no conversion to fractions). */
export const dec = (x: number) => String(Number(x.toFixed(6))).replace('.', '{,}').replace(/^-/, '-')
/** Fraction p/q of π in TeX: π/6, 5π/6, −π/3, 2π, 0. */
export function pi(p: number, d = 1): string {
  if (p === 0) return '0'
  const g = gcd(p, d) || 1
  let [a, b] = [p / g, d / g]
  if (b < 0) { a = -a; b = -b }
  const s = a < 0 ? '-' : ''
  const num = Math.abs(a) === 1 ? '\\pi' : `${Math.abs(a)}\\pi`
  return b === 1 ? `${s}${num}` : `${s}\\frac{${num}}{${b}}`
}
/** A signed term after another term: "+ 3", "- 5". */
export const sgn = (k: number) => (k < 0 ? `- ${-k}` : `+ ${k}`)
/** Number in brackets when negative: 3, (−3). */
export const br = (k: number) => (k < 0 ? `(${k})` : String(k))
export const shuffle = <T,>(r: Rng, a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }

/** A practice set: questions of the given types in turn (shuffled), no repeated statements. */
export function makeSet(gens: TGen[], seed: number, count: number): TQ[] {
  const r = seeded(seed * 7919 + 17)
  const out: TQ[] = []
  const seen = new Set<string>()
  let order: TGen[] = []
  for (let guard = 0; out.length < count && guard < count * 40; guard++) {
    if (!order.length) order = shuffle(r, gens)
    const g = order.shift()!
    let made: TQ | null = null
    for (let k = 0; k < 30 && !made; k++) { try { made = g.make(r) } catch { /* rare dead end: try other numbers */ } }
    if (!made || seen.has(made.q.kz)) continue
    seen.add(made.q.kz)
    out.push(made)
  }
  return out
}

/* ---------- exact values with square roots: a + b√2 + c√3 (rationals as [num, den]) ---------- */
export type Rat = [number, number]
export type Surd = [Rat, Rat, Rat]
const rn = ([a, b]: Rat): Rat => { const g = gcd(a, b) || 1; const s = b < 0 ? -1 : 1; return [(s * a) / g, (s * b) / g] }
export const radd = (x: Rat, y: Rat): Rat => rn([x[0] * y[1] + y[0] * x[1], x[1] * y[1]])
export const rmul = (x: Rat, k: number): Rat => rn([x[0] * k, x[1]])
export const S = (a: Rat = [0, 1], b: Rat = [0, 1], c: Rat = [0, 1]): Surd => [rn(a), rn(b), rn(c)]
export const sadd = (x: Surd, y: Surd): Surd => [radd(x[0], y[0]), radd(x[1], y[1]), radd(x[2], y[2])]
export const smul = (x: Surd, k: number): Surd => [rmul(x[0], k), rmul(x[1], k), rmul(x[2], k)]
export const sval = (x: Surd) => x[0][0] / x[0][1] + (x[1][0] / x[1][1]) * Math.SQRT2 + (x[2][0] / x[2][1]) * Math.sqrt(3)
/** TeX of a + b√2 + c√3, e.g. 1 + \frac{\sqrt3}{2}. */
export function stex(x: Surd): string {
  let out = ''
  x.forEach(([n, d], i) => {
    if (!n) return
    const rad = i === 0 ? '' : `\\sqrt${i === 1 ? 2 : 3}`
    const an = Math.abs(n)
    const top = rad ? (an === 1 ? rad : `${an}${rad}`) : String(an)
    const body = d === 1 ? top : `\\frac{${top}}{${d}}`
    out += out ? ` ${n < 0 ? '-' : '+'} ${body}` : `${n < 0 ? '-' : ''}${body}`
  })
  return out || '0'
}
