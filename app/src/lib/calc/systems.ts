/** Linear systems 2×2 and 3×3 by Cramer's rule; other systems by the CAS. */
import { det } from 'mathjs'
import { solve as basicSolve } from '../solver'
import { N, fnOf, numTex, snap, texIn, type CalcResult, type Step } from './tools'

const mat = (m: number[][]) => `\\begin{vmatrix} ${m.map((r) => r.map((x) => numTex(x)).join(' & ')).join(' \\\\ ')} \\end{vmatrix}`

function linearCoeffs(eq: string, vars: string[]): { a: number[]; c: number } | null {
  const [L, R] = eq.split('=')
  const f = `(${L})-(${R})`
  const fs = (vals: number[]) => {
    const scope = Object.fromEntries(vars.map((v, i) => [v, vals[i]]))
    try {
      return Number(N(f, Object.fromEntries(Object.entries(scope).map(([k, x]) => [k, String(x)]))).evaluate().valueOf())
    } catch {
      return NaN
    }
  }
  const zero = vars.map(() => 0)
  const c0 = fs(zero)
  const a = vars.map((_, i) => fs(zero.map((_, j) => (i === j ? 1 : 0))) - c0)
  // linearity check at a random point
  const pt = vars.map(() => Math.round(Math.random() * 7) - 3 + 0.5)
  const pred = c0 + a.reduce((s, k, i) => s + k * pt[i], 0)
  if (![c0, ...a].every(Number.isFinite) || Math.abs(fs(pt) - pred) > 1e-7 * (1 + Math.abs(pred))) return null
  return { a: a.map(snap), c: snap(-c0) }
}

export function solveSystemPlus(eqs: string[]): CalcResult {
  const vars = [...new Set(eqs.flatMap((e) => N(e.replace('=', '-(') + ')').variables()))].sort()
  const n = eqs.length
  const sys = `\\begin{cases} ${eqs.map((e) => e.split('=').map((s) => texIn(s.trim())).join(' = ')).join(' \\\\ ')} \\end{cases}`
  if ((n === 2 || n === 3) && vars.length === n) {
    const rows = eqs.map((e) => linearCoeffs(e, vars))
    if (rows.every(Boolean)) {
      const A = rows.map((r) => r!.a)
      const B = rows.map((r) => r!.c)
      const steps: Step[] = [{ note: 'steps.system', tex: sys }]
      const D = snap(det(A) as number)
      steps.push({ note: 'sys.det', tex: `\\Delta = ${mat(A)} = ${numTex(D)}` })
      if (Math.abs(D) < 1e-12) {
        // Δ = 0: either no solutions (some Δᵢ ≠ 0) or infinitely many (all Δᵢ = 0)
        const Ds = vars.map((_, i) => snap(det(A.map((row, k) => row.map((x, j) => (j === i ? B[k] : x)))) as number))
        const infinite = Ds.every((x) => Math.abs(x) < 1e-12)
        steps.push({ note: infinite ? 'sys.infinite' : 'sys.none', tex: `\\Delta = 0,\\quad ${vars.map((v, i) => `\\Delta_${v} = ${numTex(Ds[i])}`).join(',\\ ')}` })
        let answer = '\\varnothing'
        if (infinite && n === 2) {
          const [a, b] = A[0], c = B[0]
          answer = Math.abs(b) > 1e-12
            ? `${vars[0]} \\in \\mathbb{R},\\ ${vars[1]} = ${N(`(${c} - (${a})*${vars[0]})/(${b})`).toTeX()}`
            : `${vars[0]} = ${numTex(c / a)},\\ ${vars[1]} \\in \\mathbb{R}`
        } else if (infinite) answer = '\\infty'
        return { steps, answer, kind: 'system' }
      }
      const sol: string[] = []
      vars.forEach((v, i) => {
        const Ai = A.map((row, k) => row.map((x, j) => (j === i ? B[k] : x)))
        const Di = snap(det(Ai) as number)
        steps.push({ note: 'sys.detVar', params: { v }, tex: `\\Delta_${v} = ${mat(Ai)} = ${numTex(Di)}` })
        sol.push(`${v} = \\dfrac{\\Delta_${v}}{\\Delta} = \\dfrac{${numTex(Di)}}{${numTex(D)}} = ${numTex(Di / D)}`)
      })
      steps.push({ note: 'sys.cramer', tex: sol.join(',\\quad ') })
      const values = vars.map((_, i) => {
        const Ai = A.map((row, k) => row.map((x, j) => (j === i ? B[k] : x)))
        return snap((det(Ai) as number) / D)
      })
      const verify: Step[] = eqs.map((e) => {
        const [L, R] = e.split('=')
        const scope = Object.fromEntries(vars.map((v, i) => [v, String(values[i])]))
        const l = Number(N(L, scope).evaluate().valueOf()), r = Number(N(R, scope).evaluate().valueOf())
        return { tex: `${texIn(L.trim())} = ${numTex(l)} = ${numTex(r)}\\ ${Math.abs(l - r) < 1e-9 ? '\\checkmark' : '\\times'}` }
      })
      // 2 variables: plot both lines as y = f(x)
      let plot
      if (n === 2 && vars[0] === 'x' && vars[1] === 'y') {
        const fns = A.flatMap((row, k) => (Math.abs(row[1]) > 1e-12 ? [`(${B[k]} - (${row[0]})*x)/(${row[1]})`] : []))
        plot = { fns, points: [{ x: values[0], y: values[1] }] }
      }
      return {
        steps,
        answer: vars.map((v, i) => `${v} = ${numTex(values[i])}`).join(',\\; '),
        verify,
        plot,
        kind: 'system',
      }
    }
  }
  const r = basicSolve(eqs.join(';'))
  return 'error' in r ? r : { ...r, kind: 'system' }
}

export { fnOf }
