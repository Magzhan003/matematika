import {
  N, cleanRoot, fmtPlain, neg, normalize, num, paren, polyTex, quadCoeffs, rootsWithApprox, splitList, tex, texIn,
  isInt, approxTex, type SolveResult, type Step,
} from './mathcore'

export type { SolveResult, Step } from './mathcore'
export type Action = 'auto' | 'simplify' | 'factor' | 'expand' | 'diff' | 'integrate'

/* ---------------- equations ---------------- */

export function solveEquation(L: string, R: string): SolveResult {
  const expr = `(${L})-(${R})`
  const vars = N(expr).variables()
  if (!vars.length) return { error: 'calc.err.noSolution' }
  const v = vars.includes('x') ? 'x' : vars[0]
  const steps: Step[] = [{ note: 'steps.original', tex: `${texIn(L)} = ${texIn(R)}` }]
  const q = vars.length === 1 ? quadCoeffs(expr, v) : null

  if (q && q.deg === 1) {
    const { b, c } = q // b·v + c = 0
    if (R.trim() !== '0') steps.push({ note: 'steps.moveAll', tex: `${polyTex([b, c], v)} = 0` })
    const rhs = neg(c)
    const lhs = b === '1' ? v : b === '-1' ? `-${v}` : `${paren(b)}${v}`
    steps.push({ note: 'steps.isolate', params: { v }, tex: `${lhs} = ${tex(rhs)}` })
    const root = N(`(${rhs})/(${b})`).toString()
    if (b !== '1') {
      steps.push({ note: 'steps.divide', params: { a: fmtPlain(b) }, tex: `${v} = \\dfrac{${tex(rhs)}}{${tex(b)}}` })
    }
    return { steps, answer: `${v} = ${tex(root)}`, approx: rootsWithApprox([root]) }
  }

  if (q && q.deg === 2) {
    const { a, b, c } = q
    const std = `${polyTex([a, b, c], v)} = 0`
    if (std.replace(/\s/g, '') !== steps[0].tex.replace(/\s/g, '')) steps.push({ note: 'steps.standard', tex: std })
    steps.push({ note: 'steps.coeffs', tex: `a = ${tex(a)},\\; b = ${tex(b)},\\; c = ${tex(c)}` })
    const D = N(`(${b})^2-4*(${a})*(${c})`).toString()
    steps.push({
      note: 'steps.discriminant',
      tex: `D = b^2 - 4ac = ${paren(b)}^2 - 4 \\cdot ${paren(a)} \\cdot ${paren(c)} = ${tex(D)}`,
    })
    const Dv = num(D)
    if (Dv < 0) {
      steps.push({ note: 'steps.noRoots', tex: `D = ${tex(D)} < 0` })
      return { steps, answer: '\\varnothing' }
    }
    if (Dv === 0) {
      const root = N(`-(${b})/(2*(${a}))`).toString()
      steps.push({ note: 'steps.oneRoot', tex: `${v} = -\\dfrac{b}{2a} = ${tex(root)}` })
      return { steps, answer: `${v} = ${tex(root)}`, approx: rootsWithApprox([root]) }
    }
    const twoA = N(`2*(${a})`).toString()
    const sq = N(`sqrt(${D})`).toString()
    const simpleRoot = isInt(sq) ? ` = \\dfrac{${tex(neg(b))} \\pm ${tex(sq)}}{${tex(twoA)}}` : ''
    steps.push({
      note: 'steps.roots',
      tex: `${v}_{1,2} = \\dfrac{-b \\pm \\sqrt{D}}{2a} = \\dfrac{${tex(neg(b))} \\pm \\sqrt{${tex(D)}}}{${tex(twoA)}}${simpleRoot}`,
    })
    const r1 = N(`(${neg(b)}+${sq})/(${twoA})`).toString()
    const r2 = N(`(${neg(b)}-${sq})/(${twoA})`).toString()
    return { steps, answer: `${v}_1 = ${tex(r1)},\\; ${v}_2 = ${tex(r2)}`, approx: rootsWithApprox([r1, r2]) }
  }

  const roots = splitList(N.solve(expr, v).toString()).map(cleanRoot)
  if (!roots.length) return { error: 'calc.err.noSolution' }
  steps.push({ note: 'steps.solveGeneral', params: { v }, tex: `${texIn(expr)} = 0` })
  return {
    steps,
    answer: roots.map((r) => `${v} = ${tex(r)}`).join(';\\; '),
    approx: rootsWithApprox(roots),
  }
}

function solveSystem(eqs: string[]): SolveResult {
  const res = N.solveSystem(eqs).toString()
  const pairs = [...res.matchAll(/(\w+)\s*=>\s*([^,}\]]+)/g)].map((m) => [m[1], m[2].trim()])
  if (!pairs.length) {
    for (const m of res.matchAll(/\[\s*(\w+)\s*,\s*([^\]]+)\]/g)) pairs.push([m[1], m[2].trim()])
  }
  if (!pairs.length) return { error: 'calc.err.noSolution' }
  const sys = eqs.map((q) => q.split('=').map((s) => texIn(s.trim())).join(' = ')).join(' \\\\ ')
  return {
    steps: [{ note: 'steps.system', tex: `\\begin{cases} ${sys} \\end{cases}` }],
    answer: pairs.map(([k, val]) => `${k} = ${tex(val)}`).join(',\\; '),
  }
}

/* ---------------- expressions ---------------- */

function solveExpression(e: string, action: Action): SolveResult {
  const vars = N(e).variables()
  const v = vars.includes('x') ? 'x' : vars[0]
  const steps: Step[] = []

  if ((action === 'diff' || action === 'integrate') && !v) return { error: 'calc.err.noSolution' }

  if (action === 'diff') {
    const res = N.diff(e, v).toString()
    steps.push({ note: 'steps.diff', params: { v }, tex: `\\left(${texIn(e)}\\right)' = ${tex(res)}` })
    return { steps, answer: tex(res) }
  }
  if (action === 'integrate') {
    const res = N.integrate(e, v).toString()
    steps.push({ note: 'steps.integrate', params: { v }, tex: `\\int ${texIn(e)}\\,d${v} = ${tex(res)} + C` })
    return { steps, answer: `${tex(res)} + C` }
  }
  if (action === 'factor') {
    const res = N.factor(e).toString()
    steps.push({ note: 'steps.factor', tex: `${texIn(e)} = ${tex(res)}` })
    return { steps, answer: tex(res) }
  }
  if (action === 'expand') {
    const res = N(`expand(${e})`).toString()
    steps.push({ note: 'steps.expand', tex: `${texIn(e)} = ${tex(res)}` })
    return { steps, answer: tex(res) }
  }

  if (!vars.length) {
    const exact = N(e).evaluate().toString()
    steps.push({ note: 'steps.evaluate', tex: `${texIn(e)} = ${tex(exact)}` })
    const val = num(exact)
    return { steps, answer: tex(exact), approx: isInt(exact) || !Number.isFinite(val) ? undefined : approxTex(val) }
  }

  const simp = N.simplify(e).toString()
  steps.push({ note: 'steps.simplify', tex: `${texIn(e)} = ${tex(simp)}` })
  if (action === 'auto') {
    try {
      const fac = N.factor(simp).toString()
      if (fac.replace(/\s/g, '') !== simp.replace(/\s/g, '')) {
        steps.push({ note: 'steps.factor', tex: `${tex(simp)} = ${tex(fac)}` })
        return { steps, answer: tex(fac) }
      }
    } catch {
      /* factoring is optional */
    }
  }
  return { steps, answer: tex(simp) }
}

/* ---------------- public API ---------------- */

export function solve(raw: string, action: Action = 'auto'): SolveResult {
  const input = normalize(raw)
  if (!input) return { error: 'calc.err.empty' }
  try {
    const parts = input.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1 && parts.every((p) => p.includes('='))) return solveSystem(parts)
    if (input.includes('=')) {
      const [L, R, extra] = input.split('=')
      if (extra !== undefined || !L.trim() || !R.trim()) return { error: 'calc.err.parse' }
      return solveEquation(L.trim(), R.trim())
    }
    return solveExpression(input, action)
  } catch {
    return { error: 'calc.err.parse' }
  }
}

/** Live preview of what the user is typing. */
export function preview(raw: string): string {
  const input = normalize(raw)
  if (!input) return ''
  return input
    .split(/[;\n]/)
    .map((p) => p.split('=').map((s) => (s.trim() ? texIn(s.trim()) : '')).join(' = '))
    .join(';\\quad ')
}

export function solveFormula(
  eq: string,
  vars: { name: string; tex: string }[],
  values: Record<string, string>,
  positive = false,
): SolveResult {
  const empty = vars.filter((v) => !values[v.name]?.trim())
  if (empty.length !== 1) return { error: 'calc.err.oneEmpty' }
  const unknown = empty[0]
  const known: Record<string, string> = {}
  for (const v of vars) {
    if (v === unknown) continue
    const s = normalize(values[v.name])
    if (!Number.isFinite(num(s))) return { error: 'calc.err.number' }
    known[v.name] = s
  }
  try {
    const [L, R] = eq.split('=').map((s) => s.trim())
    const steps: Step[] = [
      {
        note: 'steps.substitute',
        tex: vars.filter((v) => v !== unknown).map((v) => `${v.tex} = ${tex(known[v.name])}`).join(',\\; '),
      },
    ]
    const l = N(L, known).toString()
    const r = N(R, known).toString()
    steps.push({ tex: `${tex(l)} = ${tex(r)}` })
    const roots = splitList(N.solve(`(${l})-(${r})`, unknown.name).toString()).map(cleanRoot).filter((x) => {
      const val = num(x)
      return Number.isFinite(val) && (!positive || val > 0)
    })
    if (!roots.length) return { error: 'calc.err.noSolution' }
    return {
      steps,
      answer: roots.map((x) => `${unknown.tex} = ${tex(x)}`).join(';\\; '),
      approx: rootsWithApprox(roots),
    }
  } catch {
    return { error: 'calc.err.parse' }
  }
}
