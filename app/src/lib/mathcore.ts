import nerdamer from 'nerdamer'

/* Minimal typed view of the nerdamer API we use. */
export type NExpr = {
  toString(): string
  toTeX(): string
  text(mode?: string): string
  valueOf(): number | string
  evaluate(): NExpr
  variables(): string[]
}
type Nerd = ((e: string, subs?: Record<string, string>) => NExpr) & {
  solve(e: string, v: string): NExpr
  solveSystem(e: string[]): NExpr
  convertToTeX(e: string): string
  diff(e: string, v: string): NExpr
  integrate(e: string, v: string): NExpr
  factor(e: string): NExpr
  simplify(e: string): NExpr
}
export const N = nerdamer as unknown as Nerd

export type Step = { note?: string; params?: Record<string, string>; tex: string }
export type SolveResult = { steps: Step[]; answer: string; approx?: string } | { error: string }

/** Turn school notation into something nerdamer understands. */
export function normalize(s: string): string {
  return s
    .replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/√/g, 'sqrt').replace(/π/g, 'pi')
    .replace(/[×·]/g, '*').replace(/[÷:]/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/(\d),(\d)/g, '$1.$2')
    .trim()
}

/** Make TeX read like a school textbook: 25π, 2√2, no "2.0". */
function tidy(t: string): string {
  return t
    .replace(/(\d+)\.0+(?!\d)/g, '$1')
    .replace(/(\d) \\cdot (?=[a-zA-Z]|\\(?:pi|sqrt|alpha|beta|sin|cos|tan|log|ln)\b)/g, '$1 ')
    .replace(/\\frac\{-([^{}]+)\}/g, '-\\frac{$1}')
    .replace(/\\mathrm\{log\}/g, '\\ln')
    .replace(/\\mathrm\{log10\}/g, '\\lg')
}

/** TeX of a computed (simplified) result. */
export function tex(s: string): string {
  try {
    return tidy(N(s).toTeX())
  } catch {
    return s
  }
}

/** TeX of user input, keeping its structure. */
export function texIn(s: string): string {
  try {
    return tidy(N.convertToTeX(s))
  } catch {
    return s
  }
}

export function num(s: string): number {
  try {
    // valueOf() gives a plain number; text('decimals') leaves rationals like 3/4 untouched.
    return Number(N(s).evaluate().valueOf())
  } catch {
    return NaN
  }
}

export const isInt = (s: string) => /^-?\d+(\.0+)?$/.test(s.trim())

export function approxTex(v: number): string {
  return String(Number(v.toFixed(4))).replace('.', '{,}')
}

/** "{3, 2}" or "[1, -1]" → ["3", "2"], splitting only on top-level commas. */
export function splitList(s: string): string[] {
  const inner = s.trim().replace(/^[{[]/, '').replace(/[}\]]$/, '')
  if (!inner.trim()) return []
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of inner) {
    if (ch === '(' || ch === '[' || ch === '{') depth++
    if (ch === ')' || ch === ']' || ch === '}') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

/** Replace roots like log(8)/log(2) with 3 when they are whole numbers. */
export function cleanRoot(r: string): string {
  const v = num(r)
  if (!isInt(r) && Number.isFinite(v) && Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v))
  return r
}

export const neg =(s: string) => N(`-(${s})`).toString()
export const paren = (s: string) => (num(s) < 0 ? `\\left(${tex(s)}\\right)` : tex(s))
export const fmtPlain = (s: string) =>
  isInt(s) ? String(Math.round(num(s))) : approxTex(num(s)).replace('{,}', ',')

export function rootsWithApprox(roots: string[]): string | undefined {
  if (roots.every(isInt)) return undefined
  const vals = roots.map(num)
  if (!vals.every(Number.isFinite)) return undefined
  return vals.map(approxTex).join(';\\; ')
}

/** If expr is a polynomial of degree ≤ 2 in v, returns its exact coefficients. */
export function quadCoeffs(expr: string, v: string): { a: string; b: string; c: string; deg: number } | null {
  const at = (k: string) => N(expr, { [v]: k }).evaluate().toString()
  try {
    const f0 = at('0')
    const f1 = at('1')
    const fm = at('-1')
    const c = f0
    const a = N(`((${f1})+(${fm}))/2-(${f0})`).toString()
    const b = N(`((${f1})-(${fm}))/2`).toString()
    const [av, bv, cv] = [num(a), num(b), num(c)]
    if (![av, bv, cv].every(Number.isFinite)) return null
    for (const k of [2, 3, -2, 0.5, 7]) {
      const real = num(at(String(k)))
      const fit = av * k * k + bv * k + cv
      if (!Number.isFinite(real) || Math.abs(real - fit) > 1e-7 * (1 + Math.abs(real))) return null
    }
    return { a, b, c, deg: av !== 0 ? 2 : bv !== 0 ? 1 : 0 }
  } catch {
    return null
  }
}

export function polyTex(cs: string[], v: string): string {
  const deg = cs.length - 1
  let out = ''
  cs.forEach((c, i) => {
    const p = deg - i
    const cv = num(c)
    if (cv === 0) return
    const negative = cv < 0
    const abs = negative ? neg(c) : c
    const mon = p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`
    const coef = p > 0 && abs === '1' ? '' : tex(abs)
    out += out ? (negative ? ' - ' : ' + ') + coef + mon : (negative ? '-' : '') + coef + mon
  })
  return out || '0'
}
