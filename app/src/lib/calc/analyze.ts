/**
 * Function analysis like the big solvers: domain, zeros, y-intercept, parity,
 * derivative, critical points, monotonicity, extrema, asymptotes and a graph.
 */
import { N, casRoots, fnOf, num, numTex, numericRoots, rationalParts, snap, tex, texIn, type Plot } from './tools'

export type Row = { key: string; tex: string }
export type Analysis = { rows: Row[]; plot: Plot; derivative: string } | { error: string }

const R_ = '\\mathbb{R}'
const fmtX = (x: number) => numTex(x)

/** Conditions written from the formula: denominators ≠ 0, roots ≥ 0, logarithms > 0. */
export function domainConditions(expr: string): string[] {
  const conds: string[] = []
  const scan = (name: string, op: string) => {
    const re = new RegExp(`${name}\\(`, 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(expr))) {
      let depth = 0, i = m.index + name.length, arg = ''
      for (; i < expr.length; i++) {
        const ch = expr[i]
        if (ch === '(') { depth++; if (depth === 1) continue }
        if (ch === ')') { depth--; if (depth === 0) break }
        if (depth === 1 && ch === ',' && name === 'log') break
        arg += ch
      }
      conds.push(`${texIn(arg)} ${op} 0`)
    }
  }
  scan('sqrt', '\\ge')
  scan('log10', '>')
  scan('log', '>')
  const parts = rationalParts(expr)
  if (parts && parts.den !== '1' && /x/.test(parts.den)) conds.unshift(`${texIn(parts.den)} \\ne 0`)
  return [...new Set(conds)]
}

/** Domain from a fine numeric scan: list of [a, b] intervals with open/closed ends. */
function domainScan(f: (x: number) => number): { tex: string; ok: (x: number) => boolean; segs: [number, number][] } {
  const A = -40, B = 40, n = 16000, h = (B - A) / n
  const ok = (x: number) => Number.isFinite(f(x))
  const segs: [number, number][] = []
  let start: number | null = null
  for (let i = 0; i <= n; i++) {
    const x = A + i * h
    if (ok(x) && start === null) start = x
    if ((!ok(x) || i === n) && start !== null) {
      segs.push([start, ok(x) ? x : x - h])
      start = null
    }
  }
  if (segs.length === 1 && Math.abs(segs[0][0] - A) < 1e-9 && Math.abs(segs[0][1] - B) < 1e-9) {
    // whole line, maybe minus isolated points (poles fall between grid points)
    return { tex: R_, ok, segs: [[-Infinity, Infinity]] }
  }
  const refine = (a: number, b: number) => {
    // boundary between good a and bad b
    for (let k = 0; k < 60; k++) {
      const m = (a + b) / 2
      if (ok(m)) a = m
      else b = m
    }
    return snap(a)
  }
  const exact: [number, number][] = []
  const parts = segs.map(([a, b]) => {
    const pa = Math.abs(a - A) < 1e-9 ? -Infinity : refine(a, a - h)
    const pb = Math.abs(b - B) < 1e-9 ? Infinity : refine(b, b + h)
    exact.push([pa, pb])
    const left = pa === -Infinity ? '(-\\infty' : `${ok(pa) ? '[' : '('}${fmtX(pa)}`
    const right = pb === Infinity ? '+\\infty)' : `${fmtX(pb)}${ok(pb) ? ']' : ')'}`
    return `${left};\\ ${right}`
  })
  return { tex: parts.join(' \\cup '), ok, segs: exact }
}

const ivTex = (a: number, b: number, ok: (x: number) => boolean) =>
  `${a === -Infinity ? '(-\\infty' : `${ok(a) ? '[' : '('}${fmtX(a)}`};\\ ${b === Infinity ? '+\\infty)' : `${fmtX(b)}${ok(b) ? ']' : ')'}`}`

export function analyzeFunction(expr: string): Analysis {
  const f = fnOf(expr)
  const probe = [-3.1, -1.7, 0.3, 1.9, 4.2].map(f)
  if (!probe.some(Number.isFinite)) return { error: 'calc.err.parse' }
  const vars = N(expr).variables()
  if (vars.some((v) => v !== 'x')) return { error: 'calc.err.onlyX' }
  const rows: Row[] = []

  // domain
  const conds = domainConditions(expr)
  const dom = domainScan(f)
  const poles = (() => {
    const p = rationalParts(expr)
    return p && p.den !== '1' ? casRoots(p.den).map(num).map(snap) : []
  })()
  let domTex = dom.tex
  if (domTex === R_ && poles.length) domTex = `${R_} \\setminus \\{${poles.map(fmtX).join(';\\ ')}\\}`
  rows.push({ key: 'an.domain', tex: `${conds.length ? `${conds.join(',\\ ')}\\;\\Rightarrow\\; ` : ''}D(f) = ${domTex}` })

  // zeros and y-intercept
  // keep each exact root next to its value, then sort the pairs
  const exactPairs = casRoots(expr).map((s) => ({ x: snap(num(s)), t: s }))
  const zeroPairs = (exactPairs.length ? exactPairs : numericRoots(f, -40, 40, 16000).map((x) => ({ x: snap(x), t: '' })))
    .filter((p) => dom.ok(p.x))
    .filter((p, i, a) => a.findIndex((q) => Math.abs(q.x - p.x) < 1e-9) === i)
    .sort((a, b) => a.x - b.x)
  const zeros = zeroPairs.map((p) => p.x)
  rows.push({
    key: 'an.zeros',
    tex: zeroPairs.length
      ? zeroPairs.map((p, i) => `x_{${i + 1}} = ${p.t && !Number.isInteger(p.x) ? tex(p.t) : fmtX(p.x)}`).join(';\\ ')
      : '\\varnothing',
  })
  if (dom.ok(0)) rows.push({ key: 'an.yint', tex: `f(0) = ${fmtX(f(0))}\\;\\Rightarrow\\; (0;\\ ${fmtX(f(0))})` })

  // parity
  const pts = [0.37, 1.3, 2.71, 3.9]
  const even = pts.every((x) => dom.ok(x) === dom.ok(-x) && (!dom.ok(x) || Math.abs(f(-x) - f(x)) < 1e-9 * (1 + Math.abs(f(x)))))
  const odd = pts.every((x) => dom.ok(x) === dom.ok(-x) && (!dom.ok(x) || Math.abs(f(-x) + f(x)) < 1e-9 * (1 + Math.abs(f(x)))))
  rows.push({ key: even ? 'an.even' : odd ? 'an.odd' : 'an.neither', tex: even ? 'f(-x) = f(x)' : odd ? 'f(-x) = -f(x)' : 'f(-x) \\ne \\pm f(x)' })

  // derivative, critical points, monotonicity, extrema
  let d = ''
  try {
    d = N.simplify(N.diff(expr, 'x').toString()).toString()
  } catch { /* no derivative */ }
  if (d) {
    rows.push({ key: 'an.derivative', tex: `f'(x) = ${tex(d)}` })
    const fd = fnOf(d)
    const crit = numericRoots(fd, -40, 40, 16000).filter((x) => dom.ok(x))
    // monotonicity inside every piece of the domain, split by critical points and poles
    const ivs: { tex: string; s: number }[] = []
    for (const [a, b] of dom.segs) {
      const inner = [...crit, ...poles].filter((x) => x > a && x < b).sort((p, q) => p - q)
      const cuts = [a, ...inner, b]
      for (let i = 0; i + 1 < cuts.length; i++) {
        const l = cuts[i], r = cuts[i + 1]
        const mid = l === -Infinity && r === Infinity ? 0.5 : l === -Infinity ? r - 1 : r === Infinity ? l + 1 : (l + r) / 2
        const s = fd(mid)
        if (Number.isFinite(s)) ivs.push({ tex: ivTex(l, r, (x) => dom.ok(x) && !inner.includes(x) && (x === a || x === b)), s })
      }
    }
    const up = ivs.filter((iv) => iv.s > 0).map((iv) => iv.tex)
    const down = ivs.filter((iv) => iv.s < 0).map((iv) => iv.tex)
    if (up.length) rows.push({ key: 'an.increasing', tex: up.join(' \\cup ') })
    if (down.length) rows.push({ key: 'an.decreasing', tex: down.join(' \\cup ') })
    const ext: string[] = []
    const points: Plot['points'] = zeros.map((z) => ({ x: z, y: 0 }))
    for (const c of crit) {
      const l = fd(c - 1e-4), r = fd(c + 1e-4)
      if (l > 0 && r < 0) { ext.push(`x_{\\max} = ${fmtX(c)},\\ f_{\\max} = ${fmtX(f(c))}`); points.push({ x: c, y: f(c), label: 'max' }) }
      if (l < 0 && r > 0) { ext.push(`x_{\\min} = ${fmtX(c)},\\ f_{\\min} = ${fmtX(f(c))}`); points.push({ x: c, y: f(c), label: 'min' }) }
    }
    rows.push({ key: 'an.extrema', tex: ext.length ? ext.join(';\\quad ') : '\\varnothing' })

    // asymptotes
    const asym: string[] = []
    for (const p of poles) if (Math.abs(f(p + 1e-6)) > 1e4 || Math.abs(f(p - 1e-6)) > 1e4) asym.push(`x = ${fmtX(p)}`)
    const far = [1e5, 1e6, 1e7].map(f)
    const conv = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-4 * (1 + Math.abs(b))
    const left = [-1e5, -1e6, -1e7].map(f)
    const hor = (v: number[]) => conv(v[1], v[2]) && conv(v[0], v[2]) ? `y = ${fmtX(snap(Number(v[2].toFixed(5))))}` : null
    const hl = hor(left)
    if (hl && !hor(far)) asym.push(`${hl}\\ (x \\to -\\infty)`)
    if (hor(far)) asym.push(hor(far)! + (hl && hl !== hor(far) ? '\\ (x \\to +\\infty)' : ''))
    if (hl && hor(far) && hl !== hor(far)) asym.push(`${hl}\\ (x \\to -\\infty)`)
    if (!hor(far)) {
      // oblique: k = lim f/x, b = lim (f − kx); k is rounded so b converges
      const k = snap(Number((f(1e7) / 1e7).toFixed(4)))
      const b1 = f(1e5) - k * 1e5, b2 = f(1e6) - k * 1e6
      if (Math.abs(k) > 1e-3 && conv(f(1e6) / 1e6, f(1e7) / 1e7) && conv(b1, b2)) {
        const b = snap(Number(b2.toFixed(4)))
        const kx = k === 1 ? 'x' : k === -1 ? '-x' : `${fmtX(k)}x`
        asym.push(`y = ${kx}${b === 0 ? '' : ` ${b > 0 ? '+' : '-'} ${fmtX(Math.abs(b))}`}`)
      }
    }
    rows.push({ key: 'an.asymptotes', tex: asym.length ? asym.join(';\\quad ') : '\\varnothing' })
    return { rows, plot: { fns: [expr], points }, derivative: d }
  }
  return { rows, plot: { fns: [expr], points: zeros.map((z) => ({ x: z, y: 0 })) }, derivative: d }
}
