/**
 * Equations in one variable with school methods and named steps:
 * modulus, roots, exponential, logarithmic, trigonometric, fractional,
 * biquadratic, higher-degree polynomials (root guess + Horner), then the
 * basic linear/quadratic solver, then a numeric fallback. Every result
 * carries a check by substitution and a plot.
 */
import type { MathNode } from 'mathjs'
import { solveEquation } from '../solver'
import {
  N, casRoots, eqTex, fnOf, num, numTex, numericRoots, parseNode, polyCoeffs, rationalParts, snap, tex, texIn,
  type CalcResult, type Step,
} from './tools'

type AnyNode = MathNode & { type: string; op?: string; fn?: { name: string }; args?: MathNode[]; content?: MathNode }
const strip = (n: AnyNode): AnyNode => (n.type === 'ParenthesisNode' ? strip(n.content as AnyNode) : n)
/** Does s contain the variable? "2x" counts, "exp" or "max" do not. */
const hasX = (s: string, v: string) => new RegExp(`(?<![A-Za-z_])${v}(?![A-Za-z_])`).test(s)

/**
 * a·F(U) + b = c  →  F(U) = (c − b)/a for F in abs, sqrt, log, sin, cos, tan.
 * Returns the isolated equation, or null when F(U) is not "alone" in a linear way.
 */
function isolate(L: string, R: string, v: string): [string, string] | null {
  const f = `(${L})-(${R})`
  const m = /(abs|sqrt|log10|log|sin|cos|tan)\(/.exec(f)
  if (!m) return null
  let depth = 0, end = -1
  for (let i = m.index + m[1].length; i < f.length; i++) {
    if (f[i] === '(') depth++
    if (f[i] === ')' && --depth === 0) { end = i; break }
  }
  if (end < 0) return null
  const call = f.slice(m.index, end + 1)
  const rest = f.slice(0, m.index) + 'tt' + f.slice(end + 1)
  if (hasX(rest, v)) return null
  const c = polyCoeffs(rest, 'tt')
  if (!c || c.length !== 2 || Math.abs(c[1]) < 1e-12) return null
  const value = N(`-(${snap(c[0])})/(${snap(c[1])})`).toString()
  if (call === L.trim() && !hasX(R, v)) return null // already isolated
  return [call, value]
}
const nodeOf = (s: string) => {
  const n = parseNode(s)
  return n ? strip(n as AnyNode) : null
}

type Partial = { steps: Step[]; roots: number[]; answer?: string; exact?: string[] }

/** Roots and steps from the basic linear/quadratic solver, as numbers too. */
function basic(L: string, R: string, v: string): Partial | null {
  const r = solveEquation(L, R)
  if ('error' in r) return null
  const f = `(${L})-(${R})`
  const exact = casRoots(f, v)
  const roots = exact.length ? exact.map(num).map(snap) : numericRoots(fnOf(f, v))
  // CAS answers with complex roots or 10-digit decimals are replaced by clean real roots.
  const clean = !/\bi\b|\d{8,}/.test(r.answer)
  return { steps: r.steps, roots, answer: clean ? r.answer : rootsAnswer(v, roots), exact: clean ? exact : undefined }
}

/** x/π as a school fraction of π: \frac{2\pi}{3}, -\frac{\pi}{6}, 2\pi … */
export function piTex(x: number): string | null {
  const r = x / Math.PI
  for (let d = 1; d <= 12; d++) {
    const n = Math.round(r * d)
    if (Math.abs(n / d - r) < 1e-9) {
      if (n === 0) return '0'
      const sign = n < 0 ? '-' : ''
      const a = Math.abs(n)
      const top = `${a === 1 ? '' : a}\\pi`
      return d === 1 ? `${sign}${top}` : `${sign}\\frac{${top}}{${d}}`
    }
  }
  return null
}

const rootsAnswer = (v: string, roots: number[], exact?: string[]) => {
  if (!roots.length) return '\\varnothing'
  const texs = exact && exact.length === roots.length ? exact.map((e) => tex(e)) : roots.map((r) => numTex(r))
  if (roots.length === 1) return `${v} = ${texs[0]}`
  return texs.map((t, i) => `${v}_{${i + 1}} = ${t}`).join(';\\; ')
}

/** abs(U) = c   or   abs(U) = V */
function absEq(L: string, R: string, v: string): Partial | null {
  let A = nodeOf(L), other = R
  if (!(A?.type === 'FunctionNode' && A.fn?.name === 'abs')) {
    A = nodeOf(R)
    other = L
    if (!(A?.type === 'FunctionNode' && A.fn?.name === 'abs')) return null
  }
  const U = A.args![0].toString()
  const steps: Step[] = []
  if (!hasX(other, v)) {
    const c = num(other)
    if (c < 0) {
      steps.push({ note: 'eq.absNeg', tex: `|${texIn(U)}| \\ge 0 > ${numTex(c)}` })
      return { steps, roots: [], answer: '\\varnothing' }
    }
    steps.push({ note: 'eq.absSplit', tex: `\\left[\\begin{array}{l} ${texIn(U)} = ${numTex(c)} \\\\ ${texIn(U)} = ${numTex(-c)} \\end{array}\\right.` })
    const roots: number[] = []
    for (const side of c === 0 ? [0] : [c, -c]) {
      const sub = basic(U, String(side), v)
      if (!sub) return null
      steps.push({ note: 'eq.case', params: { eq: '' }, tex: `${texIn(U)} = ${numTex(side)}\\;\\Rightarrow\\; ${sub.answer}` })
      for (const r of sub.roots) if (!roots.some((q) => Math.abs(q - r) < 1e-9)) roots.push(r)
    }
    roots.sort((a, b) => a - b)
    return { steps, roots, answer: rootsAnswer(v, roots) }
  }
  // |U| = V: V ≥ 0 and U = ±V
  steps.push({ note: 'eq.absCond', tex: `${texIn(other)} \\ge 0,\\qquad \\left[\\begin{array}{l} ${texIn(U)} = ${texIn(other)} \\\\ ${texIn(U)} = -\\left(${texIn(other)}\\right) \\end{array}\\right.` })
  const cand: number[] = []
  for (const rhs of [other, `-(${other})`]) {
    const sub = basic(U, rhs, v)
    if (sub) cand.push(...sub.roots)
  }
  const V = fnOf(other, v)
  const roots = [...new Set(cand.map(snap))].filter((r) => V(r) >= -1e-9).sort((a, b) => a - b)
  for (const r of [...new Set(cand.map(snap))]) {
    steps.push({ note: 'eq.check', tex: `${v} = ${numTex(r)}:\\quad ${texIn(other)} = ${numTex(V(r))} ${V(r) >= -1e-9 ? '\\ge 0\\ \\checkmark' : '< 0\\ \\times'}` })
  }
  return { steps, roots, answer: rootsAnswer(v, roots) }
}

/** sqrt(U) = V: square both sides, then check every root. */
function sqrtEq(L: string, R: string, v: string): Partial | null {
  let S = nodeOf(L), other = R
  if (!(S?.type === 'FunctionNode' && S.fn?.name === 'sqrt')) {
    S = nodeOf(R)
    other = L
    if (!(S?.type === 'FunctionNode' && S.fn?.name === 'sqrt')) return null
  }
  const U = S.args![0].toString()
  if (/sqrt/.test(U) || /sqrt/.test(other)) return null
  const steps: Step[] = [
    { note: 'eq.sqrtCond', tex: `${texIn(other)} \\ge 0` },
  ]
  const sq = N(`expand((${other})^2)`).toString()
  steps.push({ note: 'eq.square', tex: `${texIn(U)} = ${tex(sq)}` })
  const sub = basic(U, sq, v)
  if (!sub) return null
  steps.push(...sub.steps.slice(1))
  const fU = fnOf(U, v), fV = fnOf(other, v)
  const roots: number[] = []
  for (const r of sub.roots) {
    const ok = fU(r) >= -1e-9 && fV(r) >= -1e-9 && Math.abs(Math.sqrt(Math.max(0, fU(r))) - fV(r)) < 1e-6
    steps.push({ note: 'eq.check', tex: `${v} = ${numTex(r)}:\\quad \\sqrt{${numTex(fU(r))}} ${ok ? '=' : '\\ne'} ${numTex(fV(r))}\\ ${ok ? '\\checkmark' : '\\times'}` })
    if (ok) roots.push(r)
  }
  return { steps, roots, answer: rootsAnswer(v, roots) }
}

const isPow = (n: AnyNode | null, v: string) =>
  n && n.type === 'OperatorNode' && n.op === '^' && !hasX(n.args![0].toString(), v) && hasX(n.args![1].toString(), v)

function commonBase(a: number, b: number): [number, number, number] | null {
  for (const g of [2, 3, 5, 6, 7, 10, Math.E]) {
    const p = Math.log(a) / Math.log(g), q = Math.log(b) / Math.log(g)
    if (Math.abs(p - Math.round(p)) < 1e-9 && Math.abs(q - Math.round(q)) < 1e-9 && Math.round(p) > 0 && Math.round(q) > 0) {
      return [g, Math.round(p), Math.round(q)]
    }
  }
  return null
}

/** a^U = c   or   a^U = b^V */
function expEq(L: string, R: string, v: string): Partial | null {
  let P = nodeOf(L), other = R
  if (!isPow(P, v)) {
    P = nodeOf(R)
    other = L
    if (!isPow(P, v)) return null
  }
  const aS = P!.args![0].toString(), U = P!.args![1].toString()
  const a = num(aS)
  if (!(a > 0) || a === 1) return null
  const steps: Step[] = []
  const Q = nodeOf(other)
  let lhs: string, rhs: string
  if (!hasX(other, v)) {
    const c = num(other)
    if (!(c > 0)) {
      steps.push({ note: 'eq.expPositive', tex: `${texIn(aS)}^{${texIn(U)}} > 0,\\quad ${numTex(c)} \\le 0` })
      return { steps, roots: [], answer: '\\varnothing' }
    }
    const k = Math.log(c) / Math.log(a)
    const kt = numTex(k)
    const nice = !/,/.test(kt)
    if (nice) {
      steps.push({ note: 'eq.sameBase', tex: `${texIn(aS)}^{${texIn(U)}} = ${texIn(aS)}^{${kt}}` })
      lhs = U
      rhs = String(snap(k))
    } else {
      steps.push({ note: 'eq.takeLog', tex: `${texIn(U)} = \\log_{${texIn(aS)}} ${texIn(other)}` })
      lhs = U
      rhs = `log(${other})/log(${aS})`
    }
  } else if (isPow(Q, v)) {
    const bS = Q!.args![0].toString(), V = Q!.args![1].toString()
    const b = num(bS)
    if (Math.abs(a - b) < 1e-12) {
      lhs = U
      rhs = V
    } else {
      const cb = commonBase(a, b)
      if (!cb) return null
      const [g, p, q] = cb
      const gT = g === Math.E ? 'e' : String(g)
      steps.push({ note: 'eq.sameBase', tex: `${gT}^{${p === 1 ? '' : p}\\left(${texIn(U)}\\right)} = ${gT}^{${q === 1 ? '' : q}\\left(${texIn(V)}\\right)}` })
      lhs = `${p}*(${U})`
      rhs = `${q}*(${V})`
    }
  } else return null
  const logForm = /^log\(/.test(rhs)
  if (!logForm) steps.push({ note: 'eq.expEqual', tex: eqTex(lhs, rhs) })
  const sub = basic(lhs, rhs, v)
  if (!sub) return null
  if (logForm) {
    // keep the exact logarithm instead of a long decimal
    const lg = `\\log_{${texIn(aS)}} ${texIn(other)}`
    const lin = polyCoeffs(lhs, v)
    let answer = rootsAnswer(v, sub.roots)
    if (lhs.trim() === v) answer = `${v} = ${lg}`
    else if (lin && lin.length === 2) {
      // k·x + b = log_a c  →  x = (log_a c − b)/k
      const [b, k] = lin.map(snap)
      const shifted = b === 0 ? lg : `${lg} ${b > 0 ? '-' : '+'} ${numTex(Math.abs(b))}`
      answer = `${v} = ${k === 1 ? shifted : `\\dfrac{${shifted}}{${numTex(k)}}`}`
      steps.push({ note: 'eq.expSolveX', tex: answer })
    }
    return { steps, roots: sub.roots, answer }
  }
  steps.push(...sub.steps.slice(1))
  return { steps, roots: sub.roots, answer: sub.answer, exact: sub.exact }
}

/** log_a(U) = c   or   log_a(U) = log_a(V) */
function logInfo(n: AnyNode | null): { U: string; base: string } | null {
  if (!n || n.type !== 'FunctionNode') return null
  const f = n.fn?.name
  if (f === 'log10' && n.args!.length === 1) return { U: n.args![0].toString(), base: '10' }
  if (f === 'log' && n.args!.length === 1) return { U: n.args![0].toString(), base: 'e' }
  if (f === 'log' && n.args!.length === 2) return { U: n.args![0].toString(), base: n.args![1].toString() }
  return null
}

function logEq(L: string, R: string, v: string): Partial | null {
  let A = logInfo(nodeOf(L)), other = R
  if (!A) {
    A = logInfo(nodeOf(R))
    other = L
    if (!A) return null
  }
  const steps: Step[] = []
  const B = logInfo(nodeOf(other))
  let lhs: string, rhs: string
  const conds: string[] = [A.U]
  if (B && hasX(B.U, v)) {
    if (Math.abs(num(A.base) - num(B.base)) > 1e-12) return null
    conds.push(B.U)
    lhs = A.U
    rhs = B.U
  } else if (!hasX(other, v)) {
    lhs = A.U
    rhs = N(`(${A.base})^(${other})`).toString()
    steps.push({ note: 'eq.logDef', tex: `${texIn(A.U)} = ${A.base === 'e' ? 'e' : texIn(A.base)}^{${texIn(other)}} = ${tex(rhs)}` })
  } else return null
  steps.unshift({ note: 'eq.logDomain', tex: conds.map((c) => `${texIn(c)} > 0`).join(',\\quad ') })
  if (B) steps.push({ note: 'eq.logEqual', tex: eqTex(lhs, rhs) })
  const sub = basic(lhs, rhs, v)
  if (!sub) return null
  steps.push(...sub.steps.slice(1))
  const fs = conds.map((c) => fnOf(c, v))
  const roots = sub.roots.filter((r) => fs.every((f) => f(r) > 0))
  for (const r of sub.roots) {
    const ok = fs.every((f) => f(r) > 0)
    steps.push({ note: 'eq.check', tex: `${v} = ${numTex(r)}:\\quad ${conds.map((c, i) => `${texIn(c)} = ${numTex(fs[i](r))}`).join(',\\ ')}\\ ${ok ? '> 0\\ \\checkmark' : '\\le 0\\ \\times'}` })
  }
  return { steps, roots, answer: rootsAnswer(v, roots) }
}

/* ---------------- trigonometric equations ---------------- */

const SQ2 = Math.SQRT2 / 2, SQ3 = Math.sqrt(3) / 2
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9
export function arcTex(f: 'sin' | 'cos' | 'tan', a: number): string {
  const sgn = a < 0 ? -1 : 1
  const x = Math.abs(a)
  if (f === 'sin') {
    const t = near(x, 0) ? '0' : near(x, 0.5) ? '\\frac{\\pi}{6}' : near(x, SQ2) ? '\\frac{\\pi}{4}' : near(x, SQ3) ? '\\frac{\\pi}{3}' : near(x, 1) ? '\\frac{\\pi}{2}' : `\\arcsin ${numTex(x)}`
    return sgn < 0 && t !== '0' ? `-${t}` : t
  }
  if (f === 'tan') {
    const t = near(x, 0) ? '0' : near(x, 1) ? '\\frac{\\pi}{4}' : near(x, Math.sqrt(3)) ? '\\frac{\\pi}{3}' : near(x, Math.sqrt(3) / 3) ? '\\frac{\\pi}{6}' : `\\operatorname{arctg} ${numTex(x)}`
    return sgn < 0 && t !== '0' ? `-${t}` : t
  }
  const pos: [number, string][] = [[0, '\\frac{\\pi}{2}'], [0.5, '\\frac{\\pi}{3}'], [SQ2, '\\frac{\\pi}{4}'], [SQ3, '\\frac{\\pi}{6}'], [1, '0']]
  const neg: [number, string][] = [[0.5, '\\frac{2\\pi}{3}'], [SQ2, '\\frac{3\\pi}{4}'], [SQ3, '\\frac{5\\pi}{6}'], [1, '\\pi']]
  const hit = (sgn > 0 || near(x, 0) ? pos : neg).find(([k]) => near(k, x))
  return hit ? hit[1] : `\\arccos\\left(${numTex(a)}\\right)`
}

function trigEq(L: string, R: string, v: string): Partial | null {
  if (hasX(R, v)) return null
  let n = nodeOf(L)
  let coef = 1
  if (n?.type === 'OperatorNode' && n.op === '*' && !hasX(n.args![0].toString(), v)) {
    coef = num(n.args![0].toString())
    n = strip(n.args![1] as AnyNode)
  }
  if (!n || n.type !== 'FunctionNode' || !['sin', 'cos', 'tan'].includes(n.fn!.name)) return null
  const f = n.fn!.name as 'sin' | 'cos' | 'tan'
  const U = n.args![0].toString()
  const lin = polyCoeffs(U, v)
  if (!lin || lin.length !== 2) return null
  const a = num(R) / coef
  if (!Number.isFinite(a)) return null
  const fT = f === 'tan' ? '\\operatorname{tg}' : `\\${f}`
  const steps: Step[] = []
  if (coef !== 1) steps.push({ note: 'eq.trigIsolate', tex: `${fT}\\left(${texIn(U)}\\right) = ${numTex(a)}` })
  if (f !== 'tan' && Math.abs(a) > 1 + 1e-12) {
    steps.push({ note: 'eq.trigNoRoots', tex: `|${fT}\\,u| \\le 1,\\quad |${numTex(a)}| > 1` })
    return { steps, roots: [], answer: '\\varnothing' }
  }
  const arc = arcTex(f, a)
  let gen: string
  if (f === 'sin') {
    gen = near(a, 0) ? '\\pi n' : near(a, 1) ? '\\frac{\\pi}{2} + 2\\pi n' : near(a, -1) ? '-\\frac{\\pi}{2} + 2\\pi n' : `(-1)^n ${arc} + \\pi n`
    steps.push({ note: 'eq.trigFormula', params: { f: 'sin' }, tex: `${fT}\\,u = a \\;\\Rightarrow\\; u = (-1)^n \\arcsin a + \\pi n` })
  } else if (f === 'cos') {
    gen = near(a, 0) ? '\\frac{\\pi}{2} + \\pi n' : near(a, 1) ? '2\\pi n' : near(a, -1) ? '\\pi + 2\\pi n' : `\\pm ${arc} + 2\\pi n`
    steps.push({ note: 'eq.trigFormula', params: { f: 'cos' }, tex: `\\cos u = a \\;\\Rightarrow\\; u = \\pm\\arccos a + 2\\pi n` })
  } else {
    gen = `${arc === '0' ? '' : `${arc} + `}\\pi n`
    steps.push({ note: 'eq.trigFormula', params: { f: 'tg' }, tex: `\\operatorname{tg} u = a \\;\\Rightarrow\\; u = \\operatorname{arctg} a + \\pi n` })
  }
  steps.push({ note: 'eq.trigApply', tex: `${texIn(U)} = ${gen},\\quad n \\in \\mathbb{Z}` })
  const [b0, k] = lin
  let answer: string
  if (near(k, 1) && near(b0, 0)) answer = `${v} = ${gen},\\ n \\in \\mathbb{Z}`
  else {
    // Divide every term by k when the angle is a table value: x = ±π/3 + πn instead of a big fraction.
    const arcNum = f === 'sin' ? Math.asin(a) : f === 'cos' ? Math.acos(a) : Math.atan(a)
    const arcK = piTex(arcNum / k)
    const shift = near(b0, 0) ? '' : ` ${-b0 / k > 0 ? '+' : '-'} ${numTex(Math.abs(b0 / k))}`
    const per = (p: number) => {
      const t = piTex(p / k)
      return t === '\\pi' ? '\\pi n' : `${t}\\,n`
    }
    let body: string | null = null
    if (arcK !== null && !/arc/.test(arc)) {
      if (f === 'sin') {
        body = near(a, 0) ? per(Math.PI) : near(Math.abs(a), 1) ? `${arcK} + ${per(2 * Math.PI)}` : `(-1)^n ${arcK} + ${per(Math.PI)}`
      } else if (f === 'cos') {
        body = near(a, 0) || near(Math.abs(a), 1)
          ? `${arcK === '0' ? '' : `${arcK} + `}${per(near(a, 0) ? Math.PI : 2 * Math.PI)}`
          : `\\pm ${arcK} + ${per(2 * Math.PI)}`
      } else body = `${arcK === '0' ? '' : `${arcK} + `}${per(Math.PI)}`
    }
    if (body) answer = `${v} = ${body}${shift},\\ n \\in \\mathbb{Z}`
    else {
      const shifted = near(b0, 0) ? gen : `${gen} ${b0 > 0 ? '-' : '+'} ${numTex(Math.abs(b0))}`
      answer = near(k, 1) ? `${v} = ${shifted},\\ n \\in \\mathbb{Z}` : `${v} = \\dfrac{${shifted}}{${numTex(k)}},\\ n \\in \\mathbb{Z}`
    }
    steps.push({ note: 'eq.trigSolveX', tex: answer })
  }
  const roots = numericRoots(fnOf(`(${L})-(${R})`, v), -2 * Math.PI, 2 * Math.PI, 4000)
  // school form: (-1)^n · (−π/6) is written as (−1)^{n+1} π/6
  const fix = (t: string) => t.replace(/\(-1\)\^n -/g, '(-1)^{n+1} ')
  return { steps: steps.map((s) => ({ ...s, tex: fix(s.tex) })), roots, answer: fix(answer) }
}

/** a·sin²x + b·sin x + c = 0 (also cos, tg): t = sin x, solve for t, then each sin x = t. */
function trigSubst(L: string, R: string, v: string): Partial | null {
  const f = `(${L})-(${R})`
  // the one trig call that depends on x: sin(x), cos(2x)…; calls without x (sin 30°) are just numbers
  const calls = [...new Set([...f.matchAll(/(sin|cos|tan)\(([^()]+)\)/g)].filter((m) => hasX(m[2], v)).map((m) => m[0]))]
  if (calls.length !== 1) return null
  const call = calls[0]
  const fn = call.slice(0, 3) as 'sin' | 'cos' | 'tan'
  const arg = call.slice(4, -1)
  const inT = f.split(call).join('(tt)')
  if (hasX(inT, v)) return null
  // a polynomial in t of degree 1…4, checked numerically (the 5th difference vanishes)
  const g = fnOf(inT, 'tt')
  const ys = [-2, -1, 0, 1, 2, 3].map(g)
  if (!ys.every(Number.isFinite)) return null
  let d = ys.slice()
  const diffs: number[][] = []
  for (let k = 0; k < 5; k++) { const prev = d; d = prev.slice(1).map((y, i) => y - prev[i]); diffs.push(d) }
  if (Math.abs(diffs[4][0]) > 1e-7 * (1 + Math.max(...ys.map(Math.abs))) || diffs[0].every((y) => Math.abs(y) < 1e-12)) return null
  const fT = fn === 'tan' ? '\\operatorname{tg}' : `\\${fn}`
  const argT = arg.trim() === v ? v : `\\left(${texIn(arg)}\\right)`
  const c = polyCoeffs(inT, 'tt')
  const tPoly = c ? texIn(polyStr(c.map(snap).slice().reverse(), 't')) : texIn(inT.split('tt').join('t'))
  const steps: Step[] = [
    { note: 'eq.trigSubst', params: { f: `${fn === 'tan' ? 'tg' : fn} ${arg.trim() === v ? v : `(${arg})`}` }, tex: `t = ${fT}\\,${argT}:\\quad ${tPoly} = 0` },
  ]
  const ts = numericRoots(g, -50, 50, 20000).map(snap)
  if (!ts.length) {
    steps.push({ note: 'eq.trigNoRoots', tex: `${tPoly} = 0:\\ \\varnothing` })
    return { steps, roots: [], answer: '\\varnothing' }
  }
  steps.push({ note: 'eq.trigSubstRoots', tex: ts.map((t, i) => `t_{${i + 1}} = ${numTex(t)}`).join(',\\quad ') })
  const answers: string[] = []
  for (const t of ts) {
    if (fn !== 'tan' && Math.abs(t) > 1 + 1e-12) {
      steps.push({ note: 'eq.trigSubstReject', tex: `${fT}\\,${argT} = ${numTex(t)}:\\quad |${numTex(t)}| > 1` })
      continue
    }
    const sub = trigEq(call, String(t), v)
    if (!sub || !sub.answer || sub.answer === '\\varnothing') continue
    steps.push({ note: 'eq.trigSubstBack', tex: `${fT}\\,${argT} = ${numTex(t)} \\;\\Rightarrow\\; ${sub.answer}` })
    answers.push(sub.answer.replace(/,\\ n \\in \\mathbb\{Z\}$/, ''))
  }
  const roots = numericRoots(fnOf(f, v), -2 * Math.PI, 2 * Math.PI, 4000)
  const answer = answers.length ? `${answers.join(';\\quad ')},\\ n \\in \\mathbb{Z}` : '\\varnothing'
  return { steps, roots, answer }
}

/** P(x)/Q(x) = 0 with excluded points. */
function rationalEq(L: string, R: string, v: string): Partial | null {
  const f = `(${L})-(${R})`
  if (!/\//.test(f)) return null
  const parts = rationalParts(f)
  if (!parts || parts.den === '1' || !hasX(parts.den, v)) return null
  const steps: Step[] = []
  const bad = casRoots(parts.den, v).map(num).map(snap)
  steps.push({ note: 'eq.ratDomain', tex: `${texIn(parts.den)} \\ne 0${bad.length ? `\\;\\Rightarrow\\; ${v} \\ne ${bad.map((b) => numTex(b)).join(',\\ ')}` : ''}` })
  steps.push({ note: 'eq.ratCombine', tex: `\\dfrac{${texIn(parts.num)}}{${texIn(parts.den)}} = 0` })
  steps.push({ note: 'eq.ratNumerator', tex: `${texIn(parts.num)} = 0` })
  const sub = solvePartial(parts.num, '0', v, true)
  if (!sub) return null
  steps.push(...sub.steps.slice(1))
  const roots = sub.roots.filter((r) => !bad.some((b) => Math.abs(b - r) < 1e-9))
  const removed = sub.roots.filter((r) => !roots.includes(r))
  if (removed.length) steps.push({ note: 'eq.ratExclude', tex: removed.map((r) => `${v} = ${numTex(r)}\\ \\times`).join(',\\quad ') })
  return { steps, roots, answer: rootsAnswer(v, roots) }
}

/** Synthetic division of coefficients (high → low) by (x − r). */
function horner(c: number[], r: number): number[] {
  const out: number[] = []
  let acc = 0
  for (const k of c) {
    acc = acc * r + k
    out.push(acc)
  }
  out.pop()
  return out
}

/** Coefficients (highest power first) → "2*x^3-x+5". */
const polyStr = (c: number[], v: string) =>
  c
    .map((k, i) => {
      const p = c.length - 1 - i
      const kk = snap(k)
      if (Math.abs(kk) < 1e-12) return ''
      if (p === 0) return String(kk)
      const mono = p > 1 ? `${v}^${p}` : v
      if (kk === 1) return mono
      if (kk === -1) return `-${mono}`
      return `${kk}*${mono}`
    })
    .filter(Boolean)
    .join('+')
    .replace(/\+-/g, '-') || '0'

function divisors(n: number): number[] {
  n = Math.abs(Math.round(n))
  if (n === 0) return [0]
  const d: number[] = []
  for (let i = 1; i <= Math.min(n, 1000); i++) if (n % i === 0) d.push(i)
  return d
}

/** Polynomials of degree ≥ 3: x factored out, biquadratic, root guessing + Horner. */
function polyEq(L: string, R: string, v: string): Partial | null {
  const lo = polyCoeffs(`(${L})-(${R})`, v)
  if (!lo) return null
  while (lo.length > 1 && Math.abs(lo[lo.length - 1]) < 1e-12) lo.pop()
  const deg = lo.length - 1
  if (deg < 3) return null
  const hi = [...lo].reverse()
  const steps: Step[] = [{ note: 'eq.polyStandard', tex: `${tex(polyStr(hi, v))} = 0` }]

  // biquadratic: a x^4 + b x^2 + c
  if (deg === 4 && Math.abs(lo[1]) < 1e-12 && Math.abs(lo[3]) < 1e-12) {
    const [c, , b, , a] = lo
    const tEq = polyStr([a, b, c], 't')
    steps.push({ note: 'eq.biquad', tex: `t = ${v}^2 \\ge 0:\\quad ${tex(tEq)} = 0` })
    const sub = basic(tEq, '0', 't')
    if (!sub) return null
    steps.push(...sub.steps.slice(1))
    const roots: number[] = []
    for (const t of sub.roots) {
      if (t < -1e-12) steps.push({ note: 'eq.biquadNeg', tex: `t = ${numTex(t)} < 0\\ \\times` })
      else if (Math.abs(t) < 1e-12) { roots.push(0); steps.push({ tex: `${v}^2 = 0 \\;\\Rightarrow\\; ${v} = 0` }) }
      else {
        roots.push(-Math.sqrt(t), Math.sqrt(t))
        steps.push({ tex: `${v}^2 = ${numTex(t)} \\;\\Rightarrow\\; ${v} = \\pm ${tex(`sqrt(${snap(t)})`)}` })
      }
    }
    roots.sort((p, q) => p - q)
    const exact = roots.map((r) => N(`sqrt(${snap(r * r)})*${Math.sign(r) || 1}`).toString())
    return { steps, roots, answer: rootsAnswer(v, roots, exact) }
  }

  // x^m common factor
  if (Math.abs(lo[0]) < 1e-12) {
    let m = 0
    while (Math.abs(lo[m]) < 1e-12) m++
    const rest = lo.slice(m).reverse()
    steps.push({ note: 'eq.factorX', tex: `${v}${m > 1 ? `^${m}` : ''}\\left(${tex(polyStr(rest, v))}\\right) = 0` })
    const sub = solvePartial(polyStr(rest, v), '0', v, true)
    if (!sub) return null
    steps.push(...sub.steps.slice(1))
    const roots = [0, ...sub.roots].filter((r, i, a) => a.findIndex((q) => Math.abs(q - r) < 1e-9) === i).sort((p, q) => p - q)
    return { steps, roots, answer: rootsAnswer(v, roots) }
  }

  // rational root theorem
  if (hi.every((k) => Number.isInteger(snap(k)))) {
    const cands: number[] = []
    for (const p of divisors(lo[0])) for (const q of divisors(hi[0])) for (const s of [1, -1]) cands.push((s * p) / q)
    const P = (x: number) => hi.reduce((acc, k) => acc * x + k, 0)
    const r = cands.sort((a, b) => Math.abs(a) - Math.abs(b)).find((x) => Math.abs(P(x)) < 1e-9)
    if (r !== undefined) {
      const q = horner(hi, r)
      steps.push({ note: 'eq.rootGuess', params: { r: String(snap(r)) }, tex: `P(${numTex(r)}) = 0` })
      steps.push({ note: 'eq.horner', tex: `${tex(polyStr(hi, v))} = \\left(${v} ${r < 0 ? '+' : '-'} ${numTex(Math.abs(r))}\\right)\\left(${tex(polyStr(q, v))}\\right)` })
      const sub = solvePartial(polyStr(q, v), '0', v, true)
      const roots = [r, ...(sub?.roots ?? [])].map(snap).filter((x, i, a) => a.findIndex((y) => Math.abs(y - x) < 1e-9) === i).sort((p2, q2) => p2 - q2)
      if (sub) steps.push(...sub.steps.slice(1))
      return { steps, roots, answer: rootsAnswer(v, roots) }
    }
  }
  return null
}

/** Pick a method; `noRational` avoids loops when called from rationalEq. */
function solvePartial(L: string, R: string, v: string, inner = false): Partial | null {
  const start: Step = { note: 'steps.original', tex: eqTex(L, R) }
  const iso = isolate(L, R, v)
  if (iso) {
    const sub = solvePartial(iso[0], iso[1], v, inner)
    if (sub) return { ...sub, steps: [start, { note: 'eq.isolate', tex: eqTex(iso[0], iso[1]) }, ...sub.steps.slice(1)] }
  }
  const methods = [absEq, sqrtEq, expEq, logEq, trigEq, trigSubst, ...(inner ? [] : [rationalEq]), polyEq]
  for (const m of methods) {
    try {
      const r = m(L, R, v)
      if (r) return { ...r, steps: [start, ...r.steps] }
    } catch { /* try the next method */ }
  }
  const b = basic(L, R, v)
  if (b && b.roots.length) return b
  const roots = numericRoots(fnOf(`(${L})-(${R})`, v))
  if (roots.length) {
    return { steps: [start, { note: 'eq.numeric', tex: `f(${v}) = ${texIn(`(${L})-(${R})`)}` }], roots, answer: rootsAnswer(v, roots) }
  }
  return b
}

export function verifySteps(L: string, R: string, v: string, roots: number[]): Step[] {
  const fl = fnOf(L, v), fr = fnOf(R, v)
  return roots.slice(0, 4).map((r) => {
    const a = fl(r), b = fr(r)
    const ok = Math.abs(a - b) < 1e-6 * (1 + Math.abs(a))
    return { tex: `${v} = ${numTex(r)}:\\quad ${numTex(a)} ${ok ? '=' : '\\ne'} ${numTex(b)}\\ ${ok ? '\\checkmark' : '\\times'}` }
  })
}

export function solveEquationPlus(L: string, R: string): CalcResult {
  const vars = N(`(${L})-(${R})`).variables()
  if (vars.length !== 1) {
    const r = solveEquation(L, R)
    return r
  }
  const v = vars[0]
  const p = solvePartial(L, R, v)
  if (!p) return { error: 'calc.err.noSolution' }
  const roots = p.roots
  const ans = p.answer ?? rootsAnswer(v, roots)
  // ≈ only helps when the exact answer has roots, logs, π or fractions — not for general trig solutions
  const approx = /\\(sqrt|log|ln|frac|pi)/.test(ans) && !/mathbb/.test(ans) && roots.length && roots.length < 7
    ? roots.map((r) => String(Number(r.toFixed(4))).replace('.', '{,}')).join(';\\; ')
    : undefined
  return {
    steps: p.steps,
    answer: ans,
    approx: approx || undefined,
    verify: verifySteps(L, R, v, roots),
    plot: { fns: v === 'x' ? [L, R] : [], points: v === 'x' ? roots.map((r) => ({ x: r, y: fnOf(L, v)(r) })) : [] },
    kind: 'equation',
  }
}
