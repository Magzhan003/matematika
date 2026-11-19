/**
 * Inequalities in one variable: linear ones by moving terms (with the sign flip
 * rule), everything else by the interval method with a sign chart.
 */
import type { MathNode } from 'mathjs'
import { domainConditions } from './analyze'
import { arcTex, piTex } from './equations'
import {
  N, casRoots, fnOf, num, numTex, numericRoots, parseNode, polyCoeffs, rationalParts, snap, tex, texIn,
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

/** Does f(x) op 0 hold at x (undefined points never do)? */
function sat(fx: (x: number) => number, op: Op) {
  return (x: number) => {
    const y0 = fx(x)
    if (!Number.isFinite(y0)) return false
    const y = Math.abs(y0) < 1e-9 ? 0 : y0
    return op === '<' ? y < 0 : op === '>' ? y > 0 : op === '<=' ? y <= 0 : y >= 0
  }
}

/** Ends of the domain (where the function stops being defined): 0 for √x or log x. */
function domainEdges(fx: (x: number) => number, a = -60, b = 60, n = 12000): number[] {
  const out: number[] = []
  const h = (b - a) / n
  let prev = Number.isFinite(fx(a))
  for (let i = 1; i <= n; i++) {
    const x = a + i * h
    const cur = Number.isFinite(fx(x))
    if (cur !== prev) {
      let lo = x - h, hi = x
      for (let k = 0; k < 60; k++) {
        const m = (lo + hi) / 2
        if (Number.isFinite(fx(m)) === prev) lo = m
        else hi = m
      }
      const e = snap(Number.isFinite(fx(lo)) && !Number.isFinite(fx(hi)) ? lo : hi)
      // a single bad point (a hole) is not an end of the domain
      if (!out.some((q) => Math.abs(q - e) < 1e-6)) out.push(e)
    }
    prev = cur
  }
  return out
}

/** Zeros, poles and domain ends of f = numer/denom, merged in order. */
function ineqPoints(numer: string, denom: string, f: string, v: string) {
  const zeros = points([numer], v, false)
  const poles = points([denom], v, true)
  const fx = fnOf(f, v)
  const edges: Pt[] = domainEdges(fx)
    .filter((x) => ![...zeros, ...poles].some((p) => Math.abs(p.x - x) < 1e-6))
    .map((x) => ({ x, tex: numTex(x), den: false }))
  // merge equal points; a point that zeroes the denominator is always excluded
  const uniq: Pt[] = []
  for (const p of [...zeros, ...poles, ...edges].sort((p1, q1) => p1.x - q1.x)) {
    const last = uniq[uniq.length - 1]
    if (last && Math.abs(last.x - p.x) < 1e-9) last.den = last.den || p.den
    else uniq.push({ ...p })
  }
  return { zeros, poles, edges, uniq }
}

const testPoints = (pts: Pt[]) => {
  const xs = pts.map((p) => p.x)
  return xs.length ? [xs[0] - 1, ...xs.slice(1).map((x, i) => (x + xs[i]) / 2), xs[xs.length - 1] + 1] : [0]
}

/* ---------------- trigonometric: sin(kx + b) > a and the like ---------------- */

type AnyNode = MathNode & { type: string; op?: string; fn?: { name: string }; args?: MathNode[]; content?: MathNode }
const strip = (n: AnyNode): AnyNode => (n.type === 'ParenthesisNode' ? strip(n.content as AnyNode) : n)
const hasV = (s: string, v: string) => new RegExp(`(?<![A-Za-z_])${v}(?![A-Za-z_])`).test(s)
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9

/** [b, k] when U = k·x + b (also with π inside, like x − π/3), checked at several points. */
function linearNum(U: string, v: string): number[] | null {
  const g = fnOf(U, v)
  const b = g(0), k = g(1) - b
  if (!Number.isFinite(b) || !Number.isFinite(k) || Math.abs(k) < 1e-12) return null
  for (const x of [-3, 2, 5.5]) if (Math.abs(g(x) - (k * x + b)) > 1e-9 * (1 + Math.abs(g(x)))) return null
  return [snap(b), snap(k)]
}

function trigIneq(L: string, op: Op, R: string, v: string): CalcResult | null {
  if (hasV(R, v)) return hasV(L, v) ? null : trigIneq(R, flip[op], L, v)
  let n = parseNode(L) ? strip(parseNode(L) as AnyNode) : null
  let coef = 1
  if (n?.type === 'OperatorNode' && n.op === '*' && !hasV(n.args![0].toString(), v)) { coef = num(n.args![0].toString()); n = strip(n.args![1] as AnyNode) }
  else if (n?.type === 'OperatorNode' && n.op === '-' && n.args!.length === 1) { coef = -1; n = strip(n.args![0] as AnyNode) }
  if (!n || n.type !== 'FunctionNode' || !['sin', 'cos', 'tan'].includes(n.fn!.name)) return null
  const fn = n.fn!.name as 'sin' | 'cos' | 'tan'
  const U = n.args![0].toString()
  const lin = polyCoeffs(U, v) ?? linearNum(U, v)
  if (!lin || lin.length !== 2 || !Number.isFinite(coef) || coef === 0) return null
  const a = num(R) / coef
  if (!Number.isFinite(a)) return null
  const o = coef < 0 ? flip[op] : op
  const fT = fn === 'tan' ? '\\operatorname{tg}' : `\\${fn}`
  const tName = near(lin[1], 1) && near(lin[0], 0) ? v : 't'
  const steps: Step[] = [{ note: 'ineq.original', tex: `${texIn(L)} ${opTex[op]} ${texIn(R)}` }]
  if (tName === 't') steps.push({ note: 'ineq.trigSub', tex: `t = ${texIn(U)}:\\quad ${fT}\\,t ${opTex[o]} ${numTex(a)}` })
  else if (coef !== 1) steps.push({ note: 'ineq.isolate', tex: `${fT}\\,${v} ${opTex[o]} ${numTex(a)}` })

  const P = fn === 'tan' ? Math.PI : 2 * Math.PI
  const T = (x: number, sym: string) => piTex(x) ?? sym
  const big = '\\mathbb{R}'
  // [lo, hi] on one turn of the circle, with the brackets; or a whole/empty/point answer
  type Iv = { lo: number; hi: number; loT: string; hiT: string; lc: boolean; rc: boolean }
  let iv: Iv | null = null
  let special: 'all' | 'none' | { except: number } | { only: number } | null = null
  const strictOp = o === '<' || o === '>'
  if (fn === 'tan') {
    const g = Math.atan(a), gT = arcTex('tan', a)
    iv = o === '>' || o === '>='
      ? { lo: g, hi: Math.PI / 2, loT: gT, hiT: '\\frac{\\pi}{2}', lc: !strictOp, rc: false }
      : { lo: -Math.PI / 2, hi: g, loT: '-\\frac{\\pi}{2}', hiT: gT, lc: false, rc: !strictOp }
  } else {
    const top = 1, bot = -1
    const up = o === '>' || o === '>='
    const peak = fn === 'sin' ? Math.PI / 2 : 0
    const low = fn === 'sin' ? -Math.PI / 2 : Math.PI
    if (up) {
      if (a > top || (o === '>' && near(a, top))) special = 'none'
      else if (o === '>=' && near(a, top)) special = { only: peak }
      else if (a < bot || (o === '>=' && near(a, bot))) special = 'all'
      else if (o === '>' && near(a, bot)) special = { except: low }
    } else {
      if (a < bot || (o === '<' && near(a, bot))) special = 'none'
      else if (o === '<=' && near(a, bot)) special = { only: low }
      else if (a > top || (o === '<=' && near(a, top))) special = 'all'
      else if (o === '<' && near(a, top)) special = { except: peak }
    }
    if (!special) {
      if (fn === 'sin') {
        const s = Math.asin(a), sT = arcTex('sin', a)
        iv = up
          ? { lo: s, hi: Math.PI - s, loT: sT, hiT: T(Math.PI - s, `\\pi - ${sT}`), lc: !strictOp, rc: !strictOp }
          : { lo: -Math.PI - s, hi: s, loT: T(-Math.PI - s, `-\\pi - ${sT}`), hiT: sT, lc: !strictOp, rc: !strictOp }
      } else {
        const c = Math.acos(a), cT = arcTex('cos', a)
        iv = up
          ? { lo: -c, hi: c, loT: T(-c, `-${cT}`), hiT: cT, lc: !strictOp, rc: !strictOp }
          : { lo: c, hi: 2 * Math.PI - c, loT: cT, hiT: T(2 * Math.PI - c, `2\\pi - ${cT}`), lc: !strictOp, rc: !strictOp }
      }
    }
  }

  const [b0, k] = lin
  const per = (p: number) => { const t = piTex(p) ?? numTex(p); return t === '\\pi' ? '\\pi n' : `${t}\\,n` }
  const plus = (t: string, p: number) => (t === '0' ? per(p) : `${t} + ${per(p)}`)
  // x = (t − b)/k, keeping exact π-fractions when possible
  const toX = (t: number, tT: string) => {
    if (tName !== 't') return tT
    const x = (t - b0) / k
    return piTex(x) ?? numTex(x)
  }
  const Px = Math.abs(P / k)
  let answer: string
  if (special === 'none') answer = '\\varnothing'
  else if (special === 'all') answer = `${v} \\in ${big}`
  else if (special && 'only' in special) answer = `${v} = ${plus(toX(special.only, piTex(special.only)!), Px)},\\ n \\in \\mathbb{Z}`
  else if (special && 'except' in special) answer = `${v} \\ne ${plus(toX(special.except, piTex(special.except)!), Px)},\\ n \\in \\mathbb{Z}`
  else {
    const i = iv!
    steps.push({ note: 'ineq.trigCircle', params: { f: fn === 'tan' ? 'tg' : fn }, tex: `${tName} \\in ${i.lc ? '[' : '('}${i.loT};\\ ${i.hiT}${i.rc ? ']' : ')'}` })
    steps.push({ note: 'ineq.trigPeriod', tex: `${tName} \\in ${i.lc ? '[' : '('}${plus(i.loT, P)};\\ ${plus(i.hiT, P)}${i.rc ? ']' : ')'},\\ n \\in \\mathbb{Z}` })
    let lo = toX(i.lo, i.loT), hi = toX(i.hi, i.hiT), lc = i.lc, rc = i.rc
    if (tName === 't' && k < 0) { [lo, hi] = [hi, lo]; [lc, rc] = [rc, lc] }
    answer = `${v} \\in ${lc ? '[' : '('}${plus(lo, Px)};\\ ${plus(hi, Px)}${rc ? ']' : ')'},\\ n \\in \\mathbb{Z}`
    if (tName === 't') steps.push({ note: 'ineq.trigSolveX', tex: answer })
  }
  return { steps, answer, plot: { fns: [L, R] }, kind: 'inequality' }
}

/* ---------------- systems of inequalities ---------------- */

export function solveInequalitySystem(parts: [string, Op, string][]): CalcResult {
  const v0 = parts.map(([L, , R]) => N(`(${L})-(${R})`).variables()).flat()
  const vars = [...new Set(v0)]
  if (vars.length !== 1) return { error: 'calc.err.noSolution' }
  const v = vars[0]
  const steps: Step[] = [{ note: 'ineq.system', tex: `\\begin{cases} ${parts.map(([L, op, R]) => `${texIn(L)} ${opTex[op]} ${texIn(R)}`).join(' \\\\ ')} \\end{cases}` }]
  const all: Pt[] = []
  const checks: ((x: number) => boolean)[] = []
  for (const [L, op, R] of parts) {
    const one = solveInequality(L, op, R)
    if ('error' in one || /mathbb\{Z\}/.test(one.answer)) return { error: 'calc.err.noSolution' }
    steps.push({ note: 'ineq.each', tex: `${texIn(L)} ${opTex[op]} ${texIn(R)} \\;\\Rightarrow\\; ${one.answer.replace(new RegExp(`^${v} \\\\in `), '')}` })
    const f = `(${L})-(${R})`
    const rp = rationalParts(f)
    const pts = ineqPoints(rp ? rp.num : f, rp ? rp.den : '1', f, v).uniq
    all.push(...pts)
    checks.push(sat(fnOf(f, v), op))
  }
  const uniq: Pt[] = []
  for (const p of all.sort((p1, q1) => p1.x - q1.x)) {
    const last = uniq[uniq.length - 1]
    if (last && Math.abs(last.x - p.x) < 1e-9) last.den = last.den || p.den
    else uniq.push({ ...p })
  }
  const ok = (x: number) => checks.every((c) => c(x))
  const take = testPoints(uniq).map(ok)
  const closed = uniq.map((p) => ok(p.x))
  const ans = intervalsTex(uniq, take, closed)
  steps.push({ note: 'ineq.intersect', tex: ans })
  return { steps, answer: ans === '\\varnothing' ? '\\varnothing' : `${v} \\in ${ans}`, kind: 'inequality' }
}

export function solveInequality(L: string, op: Op, R: string): CalcResult {
  const f = `(${L})-(${R})`
  const vars = N(f).variables()
  if (vars.length !== 1) return { error: 'calc.err.noSolution' }
  const v = vars[0]
  const trig = trigIneq(L, op, R, v)
  if (trig) return trig
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

  const { zeros, poles, edges, uniq } = ineqPoints(numer, denom, f, v)
  const conds = domainConditions(f)
  if (edges.length && conds.length) steps.push({ note: 'ineq.domain', tex: conds.join(',\\quad ') })
  if (zeros.length) steps.push({ note: 'ineq.zeros', tex: `${texIn(numer)} = 0:\\quad ${zeros.map((z) => `${v} = ${z.tex}`).join(',\\ ')}` })
  if (poles.length) steps.push({ note: 'ineq.poles', tex: `${texIn(denom)} \\ne 0:\\quad ${poles.map((z) => `${v} \\ne ${z.tex}`).join(',\\ ')}` })

  // test a point inside every interval
  const tests = testPoints(uniq)
  const vals = tests.map(fx)
  const signs = vals.map((y) => (y > 0 ? '+' : '-')) as ('+' | '-')[]
  const ok = sat(fx, op)
  const take = tests.map(ok)
  // a point belongs to the answer when the inequality holds at it (zeros of ≤/≥, domain ends like x ≥ 0 for √x)
  const closed = uniq.map((p) => !p.den && ok(p.x))

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
