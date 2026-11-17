/**
 * Shared helpers for the step-by-step solvers: parsing, numeric evaluation,
 * polynomial coefficients, numeric root finding and number formatting.
 */
import { compile, parse, rationalize, type MathNode } from 'mathjs'
import { N, num, tex, texIn } from '../mathcore'

export type Step = { note?: string; params?: Record<string, string>; tex: string }

/** A plot request attached to a result: functions of x and marked points. */
export type Plot = { fns: string[]; points?: { x: number; y: number; label?: string }[] }

export type SignChart = {
  points: { x: number; tex: string; hollow: boolean }[]
  signs: ('+' | '-')[]
  take: boolean[]
}

export type CalcResult =
  | {
      steps: Step[]
      answer: string
      approx?: string
      verify?: Step[]
      plot?: Plot
      signChart?: SignChart
      kind?: string
    }
  | { error: string }

/** |u| → abs(u): a bar opens after the start, an operator, "(" or "="; otherwise it closes. */
export function pipesToAbs(s: string): string {
  let out = ''
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch !== '|') { out += ch; continue }
    const prev = out.replace(/\s+$/, '').slice(-1)
    const opens = depth === 0 || prev === '' || /[+\-*/^(=<>,;]/.test(prev)
    if (opens) { out += 'abs('; depth++ } else { out += ')'; depth-- }
  }
  return out
}

/** Extra school notation on top of normalize(): |x|, lg, ln, tg, arctg, ≤, ≥, log_2(x). */
export function prepare(s: string): string {
  return pipesToAbs(s)
    .replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=')
    .replace(/\barctg\b/g, 'atan').replace(/\barcctg\b/g, 'acot')
    .replace(/\barcsin\b/g, 'asin').replace(/\barccos\b/g, 'acos')
    .replace(/\btg\b/g, 'tan').replace(/\bctg\b/g, 'cot')
    .replace(/\blg\s*\(/g, 'log10(').replace(/\bln\s*\(/g, 'log(')
    .replace(/log_?(\d+(?:\.\d+)?)\s*\(([^()]*)\)/g, 'log($2, $1)')
}

/** Compile an expression in x into a fast JS function (NaN on failure). */
export function fnOf(expr: string, v = 'x'): (x: number) => number {
  try {
    const code = compile(toMathjs(expr))
    return (x: number) => {
      try {
        const r = code.evaluate({ [v]: x, pi: Math.PI, e: Math.E })
        return typeof r === 'number' ? r : NaN
      } catch {
        return NaN
      }
    }
  } catch {
    return () => NaN
  }
}

/** nerdamer and mathjs share the syntax we produce (log(x, b), sqrt, abs, sin…). */
export function toMathjs(expr: string): string {
  return expr
}

export function parseNode(expr: string): MathNode | null {
  try {
    return parse(toMathjs(expr))
  } catch {
    return null
  }
}

/** Coefficients [a0, a1, …] if expr is a polynomial in v, else null. */
export function polyCoeffs(expr: string, v = 'x'): number[] | null {
  try {
    const vars = N(expr).variables()
    if (vars.some((x) => x !== v)) return null
    const r = rationalize(toMathjs(expr), {}, true) as unknown as { denominator: MathNode | null; coefficients: number[] }
    if (r.denominator && r.denominator.toString() !== '1') return null
    const c = r.coefficients
    if (!c || !c.length || c.some((x) => !Number.isFinite(x))) return null
    return c
  } catch {
    return null
  }
}

/** Numerator / denominator of a rational expression in one variable. */
export function rationalParts(expr: string): { num: string; den: string } | null {
  try {
    const r = rationalize(toMathjs(expr), {}, true) as unknown as { numerator: MathNode; denominator: MathNode | null }
    return { num: r.numerator.toString(), den: r.denominator ? r.denominator.toString() : '1' }
  } catch {
    return null
  }
}

/** Snap floating values like 2.9999999 to 3 and 0.333333 to a short decimal. */
export function snap(x: number): number {
  const r = Math.round(x)
  if (Math.abs(x - r) < 1e-7) return r
  return Number(x.toFixed(10))
}

/** Pretty number for TeX: integers, simple fractions, or decimals with a comma. */
export function numTex(x: number, digits = 4): string {
  if (!Number.isFinite(x)) return x > 0 ? '+\\infty' : '-\\infty'
  const s = snap(x)
  if (Number.isInteger(s)) return String(s)
  for (const d of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]) {
    const n = Math.round(s * d)
    if (Math.abs(n / d - s) < 1e-9) return `${n < 0 ? '-' : ''}\\frac{${Math.abs(n)}}{${d}}`
  }
  return String(Number(s.toFixed(digits))).replace('.', '{,}')
}

/** Real roots of f on [a, b]: sign changes plus touching zeros, refined by bisection. */
export function numericRoots(f: (x: number) => number, a = -60, b = 60, n = 6000): number[] {
  const roots: number[] = []
  const h = (b - a) / n
  let x0 = a
  let y0 = f(x0)
  const push = (r: number) => {
    const s = snap(r)
    if (!roots.some((q) => Math.abs(q - s) < 1e-6)) roots.push(s)
  }
  for (let i = 1; i <= n; i++) {
    const x1 = a + i * h
    const y1 = f(x1)
    if (Number.isFinite(y0) && Number.isFinite(y1)) {
      if (y0 === 0) push(x0)
      else if (y0 * y1 < 0) {
        let lo = x0, hi = x1, flo = y0
        for (let k = 0; k < 80; k++) {
          const mid = (lo + hi) / 2
          const fm = f(mid)
          if (!Number.isFinite(fm)) break
          if (flo * fm <= 0) hi = mid
          else { lo = mid; flo = fm }
        }
        const r = (lo + hi) / 2
        // skip poles: a real root makes |f| small, a pole makes it huge
        if (Math.abs(f(r)) < 1e-6 * (1 + Math.abs(y0) + Math.abs(y1))) push(r)
      }
    }
    x0 = x1
    y0 = y1
  }
  // touching zeros (even multiplicity): local minima of |f| close to 0
  for (let i = 1; i < n; i++) {
    const xm = a + i * h
    const [l, m, r] = [f(xm - h), f(xm), f(xm + h)].map(Math.abs)
    if (m < l && m <= r && m < 1e-3) {
      let lo = xm - h, hi = xm + h
      for (let k = 0; k < 100; k++) {
        const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3
        if (Math.abs(f(m1)) < Math.abs(f(m2))) hi = m2
        else lo = m1
      }
      const x = (lo + hi) / 2
      if (Math.abs(f(x)) < 1e-9) push(x)
    }
  }
  return roots.sort((p, q) => p - q)
}

/** Exact TeX of a root string from nerdamer, or a rounded number. */
export function rootTex(s: string): string {
  const v = num(s)
  if (Number.isFinite(v) && Number.isInteger(snap(v))) return String(snap(v))
  return tex(s)
}

/** nerdamer solve → list of real root strings (complex dropped). */
export function casRoots(expr: string, v = 'x'): string[] {
  try {
    const out = N.solve(expr, v).toString().trim().replace(/^[{[]|[}\]]$/g, '')
    if (!out.trim()) return []
    const parts: string[] = []
    let depth = 0, cur = ''
    for (const ch of out) {
      if ('([{'.includes(ch)) depth++
      if (')]}'.includes(ch)) depth--
      if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = '' } else cur += ch
    }
    if (cur.trim()) parts.push(cur.trim())
    return parts.filter((p) => !/\bi\b/.test(p) && Number.isFinite(num(p)))
  } catch {
    return []
  }
}

export const eqTex = (l: string, r: string, op = '=') => `${texIn(l)} ${op} ${texIn(r)}`
export { tex, texIn, num, N }
