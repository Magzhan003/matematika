/** One entry point for the solver tab: detects the problem type and routes it. */
import { normalize } from '../mathcore'
import { solve as basicSolve, type Action as BasicAction } from '../solver'
import { derivativeSteps } from './deriv'
import { solveEquationPlus } from './equations'
import { solveInequality, splitInequality } from './inequalities'
import { solveSystemPlus } from './systems'
import { N, prepare, type CalcResult } from './tools'

export type Action = BasicAction | 'diff2'
export type { CalcResult } from './tools'

export function solveAny(raw: string, action: Action = 'auto'): CalcResult {
  const input = prepare(normalize(raw))
  if (!input) return { error: 'calc.err.empty' }
  try {
    const parts = input.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1 && parts.every((p) => p.includes('='))) return solveSystemPlus(parts)
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
