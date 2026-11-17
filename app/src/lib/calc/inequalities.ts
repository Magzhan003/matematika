/**
 * Inequalities in one variable: linear ones by moving terms (with the sign flip
 * rule), everything else by the interval method with a sign chart.
 */
import {
  N, casRoots, fnOf, num, numTex, numericRoots, polyCoeffs, rationalParts, snap, tex, texIn,
  type CalcResult, type SignChart, type Step,
} from './tools'

export type Op = '<' | '>' | '<=' | '>='
const opTex: Record<Op, string> = { '<': '<', '>': '>', '<=': '\\le', '>=': '\\ge' }
const flip: Record<Op, Op> = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }

type Pt = { x: number; tex: string; den: boolean }

function points(exprs: string[], v: string, den: boolean): Pt[] {
  const out: Pt[] = []
  for (const e of exprs) {
    if (!new RegExp(`(?<![A-Za-z_])${v}(?![A-Za-z_])`).test(e)) continue
    let exact = casRoots(e, v)
    let xs = exact.map(num)
    if (!exact.length) {
      xs = numericRoots(fnOf(e, v))
      exact = []
    }
    xs.forEach((x, i) => out.push({ x: snap(x), tex: exact[i] ? (Number.isInteger(snap(x)) ? String(snap(x)) : tex(exact[i])) : numTex(x), den }))
  }
  return out
}

/** Union of intervals in Russian/Kazakh school notation: (−∞; 2) ∪ [3; +∞). */
function intervalsTex(pts: Pt[], take: boolean[], closed: boolean[]): string {
  // Pieces in order: I0, P0, I1, P1, …, In. Runs of included pieces become one interval.
  type Piece = { kind: 'I' | 'P'; i: number; on: boolean }
  const pieces: Piece[] = []
  for (let i = 0; i <= pts.length; i++) {
    pieces.push({ kind: 'I', i, on: take[i] })
    if (i < pts.length) pieces.push({ kind: 'P', i, on: closed[i] })
  }
  const parts: string[] = []
  for (let s = 0; s < pieces.length; s++) {
    if (!pieces[s].on) continue
    let e = s
    while (e + 1 < pieces.length && pieces[e + 1].on) e++
    const a = pieces[s], b = pieces[e]
    if (a === b && a.kind === 'P') parts.push(`\\{${pts[a.i].tex}\\}`)
    else {
      const left = a.kind === 'P' ? `[${pts[a.i].tex}` : a.i === 0 ? '(-\\infty' : `(${pts[a.i - 1].tex}`
      const right = b.kind === 'P' ? `${pts[b.i].tex}]` : b.i === pts.length ? '+\\infty)' : `${pts[b.i].tex})`
      parts.push(`${left};\\ ${right}`)
    }
    s = e
  }
  return parts.length ? parts.join(' \\cup ') : '\\varnothing'
}

export function solveInequality(L: string, op: Op, R: string): CalcResult {
  const f = `(${L})-(${R})`
  const vars = N(f).variables()
  if (vars.length !== 1) return { error: 'calc.err.noSolution' }
  const v = vars[0]
  const steps: Step[] = [{ note: 'ineq.original', tex: `${texIn(L)} ${opTex[op]} ${texIn(R)}` }]
  const fx = fnOf(f, v)

  // ---- linear: a·x + b op 0
  const c = polyCoeffs(f, v)
  if (c && c.length === 2 && Math.abs(c[1]) > 1e-12) {
    const [b, a] = c.map(snap)
    steps.push({ note: 'ineq.isolate', tex: `${numTex(a)}${v} ${opTex[op]} ${numTex(-b)}` })
    const o = a < 0 ? flip[op] : op
    const x0 = -b / a
    steps.push({ note: a < 0 ? 'ineq.divideFlip' : 'ineq.divide', params: { a: String(a).replace('.', ',') }, tex: `${v} ${opTex[o]} ${numTex(x0)}` })
    const inc = o === '<=' || o === '>='
    const ans = o === '<' || o === '<=' ? `(-\\infty;\\ ${numTex(x0)}${inc ? ']' : ')'}` : `${inc ? '[' : '('}${numTex(x0)};\\ +\\infty)`
    return {
      steps,
      answer: `${v} \\in ${ans}`,
      signChart: (() => {
        const signs: ('+' | '-')[] = a > 0 ? ['-', '+'] : ['+', '-']
        const want = op === '>' || op === '>=' ? '+' : '-'
        return { points: [{ x: x0, tex: numTex(x0), hollow: !inc }], signs, take: signs.map((s) => s === want) }
      })(),
      plot: { fns: [L, R] },
      kind: 'inequality',
    }
  }

  // ---- interval method
  const parts = rationalParts(f)
  const isRational = Boolean(parts && (polyCoeffs(parts.num, v) || !/[a-z]{2,}\(/.test(parts.num)))
  const numer = isRational ? parts!.num : f
  const denom = isRational ? parts!.den : '1'
  steps.push({ note: 'ineq.moveAll', tex: `${denom === '1' ? texIn(numer) : `\\dfrac{${texIn(numer)}}{${texIn(denom)}}`} ${opTex[op]} 0` })

  const zeros = points([numer], v, false)
  const poles = points([denom], v, true)
  // merge equal points; a point that zeroes the denominator is always excluded
  const uniq: Pt[] = []
  for (const p of [...zeros, ...poles].sort((p1, q1) => p1.x - q1.x)) {
    const last = uniq[uniq.length - 1]
    if (last && Math.abs(last.x - p.x) < 1e-9) last.den = last.den || p.den
    else uniq.push({ ...p })
  }
  if (zeros.length) steps.push({ note: 'ineq.zeros', tex: `${texIn(numer)} = 0:\\quad ${zeros.map((z) => `${v} = ${z.tex}`).join(',\\ ')}` })
  if (poles.length) steps.push({ note: 'ineq.poles', tex: `${texIn(denom)} \\ne 0:\\quad ${poles.map((z) => `${v} \\ne ${z.tex}`).join(',\\ ')}` })

  // test a point inside every interval
  const xs = uniq.map((p) => p.x)
  const tests = xs.length
    ? [xs[0] - 1, ...xs.slice(1).map((x, i) => (x + xs[i]) / 2), xs[xs.length - 1] + 1]
    : [0]
  const vals = tests.map(fx)
  const signs = vals.map((y) => (y > 0 ? '+' : '-')) as ('+' | '-')[]
  const want = op === '>' || op === '>=' ? '+' : '-'
  const take = vals.map((y, i) => Number.isFinite(y) && signs[i] === want)
  const strict = op === '<' || op === '>'
  const closed = uniq.map((p) => !strict && !p.den && Number.isFinite(fx(p.x)))

  const ivTex = (i: number) => {
    const l = i === 0 ? '-\\infty' : uniq[i - 1].tex
    const r = i === uniq.length ? '+\\infty' : uniq[i].tex
    return `(${l};\\ ${r})`
  }
  steps.push({ note: 'ineq.signs', tex: tests.map((_, i) => `${ivTex(i)}:\\ ${Number.isFinite(vals[i]) ? signs[i] : '\\times'}`).join(',\\quad ') })

  const chart: SignChart = { points: uniq.map((p, i) => ({ x: p.x, tex: p.tex, hollow: !closed[i] })), signs, take }
  const ans = intervalsTex(uniq, take, closed)
  return {
    steps,
    answer: ans === '\\varnothing' ? '\\varnothing' : `${v} \\in ${ans}`,
    signChart: chart,
    plot: { fns: [R.trim() === '0' ? L : f], points: uniq.filter((p) => !p.den).map((p) => ({ x: p.x, y: 0 })) },
    kind: 'inequality',
  }
}

/** Split "L op R" into parts (≤ ≥ already converted to <= >=). */
export function splitInequality(s: string): [string, Op, string] | null {
  const m = /^(.*?)(<=|>=|<|>)(.*)$/.exec(s)
  if (!m || /<|>/.test(m[3])) return null
  return [m[1].trim(), m[2] as Op, m[3].trim()]
}
