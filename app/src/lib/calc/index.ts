/** One entry point for the solver tab: detects the problem type and routes it. */
import { approxTex, normalize, tex, texIn } from '../mathcore'
import { solve as basicSolve, type Action as BasicAction } from '../solver'
import { derivativeSteps } from './deriv'
import { solveEquationPlus } from './equations'
import { solveInequality, solveInequalitySystem, splitInequality } from './inequalities'
import { niceNumber, rewrite, smartSolve } from './smart'
import { solveSystemPlus } from './systems'
import { N, fnOf, numTex, prepare, type CalcResult } from './tools'

export type Action = BasicAction | 'diff2'
export type { CalcResult } from './tools'

export function solveAny(raw: string, action: Action = 'auto'): CalcResult {
  if (!raw.trim()) return { error: 'calc.err.empty' }
  // everyday questions first: 15% от 200, 5 км в м, НОД(12; 18), C(5, 2)
  if (action === 'auto') {
    const sm = smartSolve(raw)
    if (sm) return sm
  }
  const input = prepare(normalize(rewrite(raw)))
  if (!input) return { error: 'calc.err.empty' }
  try {
    const parts = input.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1 && parts.every((p) => p.includes('=') && !/[<>]/.test(p))) return solveSystemPlus(parts)
    if (parts.length > 1) {
      const ineqs = parts.map(splitInequality)
      if (ineqs.every(Boolean)) return solveInequalitySystem(ineqs as NonNullable<(typeof ineqs)[number]>[])
    }
    const ineq = splitInequality(input)
    if (ineq) return solveInequality(...ineq)
    if (input.includes('=')) {
      const [L, R, extra] = input.split('=')
      if (extra !== undefined || !L.trim() || !R.trim()) return { error: 'calc.err.parse' }
      return solveEquationPlus(L.trim(), R.trim())
    }
    if (action === 'diff' || action === 'diff2') {
      const vars = N(input).variables()
      return derivativeSteps(input, vars.includes('x') ? 'x' : vars[0] ?? 'x', action === 'diff2' ? 2 : 1)
    }
    const r = basicSolve(input, action)
    if ('error' in r) return r
    const vars = N(input).variables()
    if (!vars.length && action === 'auto') {
      const value = fnOf(input)(0)
      // nerdamer may turn √8 into a 20-digit fraction: keep the exact form 2√2 instead
      if (/\d{9,}/.test(r.answer)) {
        const exact = N(input).toString()
        const ans = /\d{9,}/.test(exact) ? numTex(value) : tex(exact)
        return { ...r, steps: [{ note: 'steps.evaluate', tex: `${texIn(input)} = ${ans}` }], answer: ans, approx: /\{,\}/.test(ans) ? undefined : approxTex(value), kind: 'expression' }
      }
      const nice = niceNumber(raw, r.answer, value)
      if (nice) return { ...r, answer: nice.answer, approx: nice.approx, kind: 'expression' }
    }
    return { ...r, plot: vars.length === 1 && vars[0] === 'x' ? { fns: [input] } : undefined, kind: 'expression' }
  } catch {
    return { error: 'calc.err.parse' }
  }
}

/** "Similar problem": nudge the integers (not exponents or log bases) by 1–3. */
export function similarProblem(raw: string): string {
  return raw.replace(/(?<![\^A-Za-z_\d.,])(\d+)(?![\d.,])/g, (m) => {
    const n = Number(m)
    if (n === 0) return m
    let k = n
    for (let i = 0; i < 6 && k === n; i++) k = Math.max(2, n + Math.round(Math.random() * 6) - 3)
    return String(k)
  })
}
