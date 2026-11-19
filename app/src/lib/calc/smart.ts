/**
 * "Smart line": school notation and everyday questions typed as plain text.
 *  - rewrite(): 0,(3) → 1/3, 2 1/2 → 5/2, sin 30° → sin(30·π/180), lg 1000 → lg(1000), log_3 81 → log_3(81);
 *  - smartSolve(): problems that are not formulas at all — percents, unit conversion, НОД/НОК, C, A, P.
 */
import { numTex, type CalcResult, type Step } from './tools'

const NUM = String.raw`\d+(?:[.,]\d+)?`
const toN = (s: string) => Number(s.replace(',', '.'))
/** a number for TeX with a decimal comma (no fractions: 12,5 stays 12,5) */
const dec = (x: number) => {
  const r = Math.round(x * 1e6) / 1e6
  return String(r).replace('.', '{,}').replace(/^-/, '-')
}
const gcd2 = (a: number, b: number): number => (b ? gcd2(b, a % b) : Math.abs(a))

/* ---------------- text rewrites ---------------- */

export function rewrite(raw: string): string {
  let s = raw
  // periodic decimals: 0,(3) → (1/3), 1,2(36) → (68/55)
  s = s.replace(/(\d+)[.,](\d*)\((\d+)\)/g, (_, i: string, d: string, r: string) => {
    const m = d.length, k = r.length
    const den = 10 ** m * (10 ** k - 1)
    const numer = Number(i) * den + (Number(d + r) - Number(d || '0'))
    const g = gcd2(numer, den)
    return `(${numer / g}/${den / g})`
  })
  // mixed numbers: 2 1/2 → (5/2)
  s = s.replace(/(?<![\d.,/^])(\d+)\s+(\d+)\s*\/\s*(\d+)(?![\d.,])/g, (_, w: string, n: string, d: string) => `((${w}*${d}+${n})/${d})`)
  // school powers of functions: sin^2(x) → sin(x)^2, sin²x → sin(x)^2
  s = s.replace(/(?<![a-z])(sin|cos|tg|ctg|tan|cot)\s*(?:\^\s*(\d+)|([²³]))\s*(\(([^()]*)\)|\d+(?:[.,]\d+)?\s*°|\d*[a-z](?![a-z(])|\d+(?:[.,]\d+)?(?![\w(]))/gi,
    (_, f: string, p: string | undefined, sup: string | undefined, arg: string, inner: string | undefined) => `${f}(${inner ?? arg})^${p ?? (sup === '²' ? '2' : '3')}`)
  // "sin 30°", "lg 1000", "cos x" → with brackets
  s = s.replace(/(?<![a-z])(sin|cos|tg|ctg|tan|cot|lg|ln|arcsin|arccos|arctg)\s+(\d+(?:[.,]\d+)?\s*°|\d*[a-z](?![a-z(])|\d+(?:[.,]\d+)?(?![\w(]))/gi, '$1($2)')
  // log_3 81, log2 8 → log_3(81)
  s = s.replace(/(?<![a-z])log_?(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?|[a-z](?![a-z(]))/gi, 'log_$1($2)')
  // degrees: 30° → (30*pi/180)
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*°/g, (_, a: string) => `(${a.replace(',', '.')}*pi/180)`)
  return s
}

/* ---------------- percents ---------------- */

function percentOf(p: number, a: number): CalcResult {
  const r = (a * p) / 100
  return {
    steps: [
      { note: 'smart.percentOf', tex: `${dec(p)}\\% = \\dfrac{${dec(p)}}{100}` },
      { tex: `${dec(a)} \\cdot \\dfrac{${dec(p)}}{100} = ${dec(r)}` },
    ],
    answer: dec(r),
    kind: 'percent',
  }
}

function percentChange(a: number, sign: 1 | -1, p: number): CalcResult {
  const k = 1 + (sign * p) / 100
  const part = (a * p) / 100
  return {
    steps: [
      { note: 'smart.percentPart', tex: `${dec(a)} \\cdot \\dfrac{${dec(p)}}{100} = ${dec(part)}` },
      { note: sign > 0 ? 'smart.percentAdd' : 'smart.percentSub', tex: `${dec(a)} ${sign > 0 ? '+' : '-'} ${dec(part)} = ${dec(a + sign * part)}` },
      { note: 'smart.percentFactor', tex: `${dec(a)} \\cdot ${dec(k)} = ${dec(a * k)}` },
    ],
    answer: dec(a * k),
    kind: 'percent',
  }
}

function percentRatio(b: number, a: number): CalcResult {
  const r = (b / a) * 100
  return {
    steps: [{ note: 'smart.percentRatio', tex: `\\dfrac{${dec(b)}}{${dec(a)}} \\cdot 100\\% = ${dec(Math.round(r * 100) / 100)}\\%` }],
    answer: `${dec(Math.round(r * 100) / 100)}\\%`,
    kind: 'percent',
  }
}

function percentWhole(b: number, p: number): CalcResult {
  const r = (b * 100) / p
  return {
    steps: [{ note: 'smart.percentWhole', tex: `\\dfrac{${dec(b)} \\cdot 100}{${dec(p)}} = ${dec(r)}` }],
    answer: dec(r),
    kind: 'percent',
  }
}

/* ---------------- units ---------------- */

type Unit = { dim: string; k: number; tex: string }
const U: Record<string, Unit> = {}
const add = (dim: string, k: number, names: string[]) => names.forEach((n) => (U[n] = { dim, k, tex: names[0] }))
add('len', 0.001, ['мм', 'mm']); add('len', 0.01, ['см', 'cm']); add('len', 0.1, ['дм', 'dm']); add('len', 1, ['м', 'm']); add('len', 1000, ['км', 'km'])
add('area', 1e-6, ['мм²', 'мм2', 'mm2']); add('area', 1e-4, ['см²', 'см2', 'cm2']); add('area', 0.01, ['дм²', 'дм2', 'dm2']); add('area', 1, ['м²', 'м2', 'm2'])
add('area', 100, ['а', 'ар', 'сотка', 'соток', 'сотки']); add('area', 10000, ['га', 'ha']); add('area', 1e6, ['км²', 'км2', 'km2'])
add('vol', 1e-6, ['мл', 'см³', 'см3', 'ml', 'cm3']); add('vol', 1e-3, ['л', 'дм³', 'дм3', 'l']); add('vol', 1, ['м³', 'м3', 'm3'])
add('mass', 1e-6, ['мг', 'mg']); add('mass', 0.001, ['г', 'g']); add('mass', 1, ['кг', 'kg']); add('mass', 100, ['ц']); add('mass', 1000, ['т', 't'])
add('time', 1, ['с', 'сек', 's']); add('time', 60, ['мин', 'min']); add('time', 3600, ['ч', 'сағ', 'h']); add('time', 86400, ['сут', 'тәулік', 'дней', 'дн', 'күн'])
add('speed', 1000 / 3600, ['км/ч', 'км/сағ', 'km/h']); add('speed', 1, ['м/с', 'm/s'])
const unitRe = Object.keys(U).sort((a, b) => b.length - a.length).map((u) => u.replace(/[/]/g, '\\/')).join('|')

function convert(x: number, from: string, to: string): CalcResult | null {
  const a = U[from], b = U[to]
  if (!a || !b || a.dim !== b.dim) return null
  const f = a.k / b.k
  const T = (u: string) => `\\text{${u}}`
  const r = x * f
  return {
    steps: [
      { note: 'smart.unitRule', tex: f >= 1 ? `1\\ ${T(from)} = ${dec(f)}\\ ${T(to)}` : `1\\ ${T(to)} = ${dec(1 / f)}\\ ${T(from)}` },
      { note: f >= 1 ? 'smart.unitMul' : 'smart.unitDiv', tex: f >= 1 ? `${dec(x)} \\cdot ${dec(f)} = ${dec(r)}` : `${dec(x)} : ${dec(1 / f)} = ${dec(r)}` },
    ],
    answer: `${dec(x)}\\ ${T(from)} = ${dec(r)}\\ ${T(to)}`,
    kind: 'units',
  }
}

/* ---------------- НОД / НОК, combinatorics ---------------- */

function factorize(n: number): Map<number, number> {
  const m = new Map<number, number>()
  let x = n
  for (let p = 2; p * p <= x; p++) while (x % p === 0) { m.set(p, (m.get(p) ?? 0) + 1); x /= p }
  if (x > 1) m.set(x, (m.get(x) ?? 0) + 1)
  return m
}
const factTex = (m: Map<number, number>) => [...m].map(([p, e]) => (e > 1 ? `${p}^{${e}}` : String(p))).join(' \\cdot ') || '1'

function gcdLcm(kind: 'gcd' | 'lcm', nums: number[]): CalcResult {
  const fs = nums.map(factorize)
  const primes = [...new Set(fs.flatMap((m) => [...m.keys()]))].sort((a, b) => a - b)
  const res = new Map<number, number>()
  for (const p of primes) {
    const es = fs.map((m) => m.get(p) ?? 0)
    const e = kind === 'gcd' ? Math.min(...es) : Math.max(...es)
    if (e > 0) res.set(p, e)
  }
  const value = [...res].reduce((acc, [p, e]) => acc * p ** e, 1)
  const name = kind === 'gcd' ? '\\text{НОД}' : '\\text{НОК}'
  return {
    steps: [
      { note: 'smart.factorize', tex: nums.map((n, i) => `${n} = ${factTex(fs[i])}`).join(',\\quad ') },
      { note: kind === 'gcd' ? 'smart.gcdRule' : 'smart.lcmRule', tex: `${name}(${nums.join(';\\ ')}) = ${factTex(res)} = ${value}` },
    ],
    answer: String(value),
    kind: 'numbers',
  }
}

const fact = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r }

function combin(kind: 'C' | 'A' | 'P', n: number, k: number): CalcResult | null {
  if (n > 170 || k > n || n < 0 || k < 0) return null
  if (kind === 'P') {
    const v = fact(n)
    return { steps: [{ note: 'smart.perm', tex: `P_{${n}} = ${n}! = ${n <= 8 ? Array.from({ length: n }, (_, i) => i + 1).join(' \\cdot ') + ' = ' : ''}${v}` }], answer: String(v), kind: 'combinatorics' }
  }
  let v = 1
  for (let i = 0; i < k; i++) v *= n - i
  if (kind === 'A') {
    return { steps: [{ note: 'smart.place', tex: `A_{${n}}^{${k}} = \\dfrac{${n}!}{(${n} - ${k})!} = ${Array.from({ length: k }, (_, i) => n - i).join(' \\cdot ') || '1'} = ${v}` }], answer: String(v), kind: 'combinatorics' }
  }
  const c = Math.round(v / fact(k))
  return {
    steps: [
      { note: 'smart.comb', tex: `C_{${n}}^{${k}} = \\dfrac{${n}!}{${k}! \\cdot (${n} - ${k})!}` },
      { tex: `= \\dfrac{${Array.from({ length: k }, (_, i) => n - i).join(' \\cdot ') || '1'}}{${k}!} = \\dfrac{${v}}{${fact(k)}} = ${c}` },
    ],
    answer: String(c),
    kind: 'combinatorics',
  }
}

/* ---------------- entry ---------------- */

export function smartSolve(raw: string): CalcResult | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[−–]/g, '-').replace(/\?$/, '').trim()
  let m: RegExpExecArray | null

  // 15% от 200 · 15% of 200 · 200-дің 15%-ы
  if ((m = new RegExp(`^(${NUM}) ?% ?(от|из|of|числа)? ?(${NUM})$`).exec(s))) return percentOf(toN(m[1]), toN(m[3]))
  if ((m = new RegExp(`^(${NUM}) ?-? ?(дің|тің|нің|ның|дың|тың) (${NUM}) ?% ?-?(ы|і)?$`).exec(s))) return percentOf(toN(m[3]), toN(m[1]))
  // 200 + 15% · 5000 - 20%
  if ((m = new RegExp(`^(${NUM}) ?([+-]) ?(${NUM}) ?%$`).exec(s))) return percentChange(toN(m[1]), m[2] === '+' ? 1 : -1, toN(m[3]))
  // 30 от 120 в % · сколько процентов 30 от 120 · 120-дің 30-ы неше пайыз
  if ((m = new RegExp(`^(${NUM}) (от|из|of) (${NUM}) ?(в|in)? ?%$`).exec(s))) return percentRatio(toN(m[1]), toN(m[3]))
  if ((m = new RegExp(`^(сколько процентов|какой процент) (составляет )?(${NUM}) (от|из) (${NUM})$`).exec(s))) return percentRatio(toN(m[3]), toN(m[5]))
  if ((m = new RegExp(`^(${NUM}) ?-? ?(дің|тің|нің|ның|дың|тың) (${NUM}) ?-?(ы|і)? неше пайыз$`).exec(s))) return percentRatio(toN(m[3]), toN(m[1]))
  // 60 это 20% → whole number
  if ((m = new RegExp(`^(${NUM}) (это|бұл|is) (${NUM}) ?%( числа)?$`).exec(s))) return percentWhole(toN(m[1]), toN(m[3]))

  // units: 5 км в м · 2,5 ч в мин · 3 га в м²
  if ((m = new RegExp(`^(${NUM}) ?(${unitRe}) ?(в|во|in|to|->|→|=|-?ге|-?ке|-?қа|-?ке|-?на) ?(${unitRe})$`).exec(s))) {
    const r = convert(toN(m[1]), m[2], m[4])
    if (r) return r
  }

  // НОД / НОК (ЕҮОБ / ЕКОЕ, gcd / lcm)
  if ((m = /^(нод|еүоб|gcd|нок|екое|lcm) ?\(([\d ,;]+)\)$/.exec(s))) {
    const nums = m[2].split(/[,; ]+/).filter(Boolean).map(Number).filter((x) => x > 0)
    if (nums.length >= 2 && nums.every((x) => Number.isInteger(x) && x < 1e9)) return gcdLcm(/нод|еүоб|gcd/.test(m[1]) ? 'gcd' : 'lcm', nums)
  }
  // C(5,2), C_5^2, A(5,2), P(5)
  if ((m = /^([caсаpр])\s*(?:\(\s*(\d+)\s*(?:[,;]\s*(\d+)\s*)?\)|_\{?(\d+)\}?\^\{?(\d+)\}?|_\{?(\d+)\}?)$/.exec(s))) {
    const letter = m[1]
    const kind = /[cс]/.test(letter) ? 'C' : /[aа]/.test(letter) ? 'A' : 'P'
    const n = Number(m[2] ?? m[4] ?? m[6])
    const k = Number(m[3] ?? m[5] ?? 0)
    if (kind === 'P' || m[3] !== undefined || m[5] !== undefined) {
      const r = combin(kind, n, k)
      if (r) return r
    }
  }
  return null
}

/** After an exact calculation: show decimals for decimal input, and a plain number instead of log/sin when it is one. */
export function niceNumber(raw: string, exactTex: string, value: number): { answer: string; approx?: string } | null {
  if (!Number.isFinite(value)) return null
  const plain = numTex(value)
  const symbolic = /\\(log|ln|lg|sin|cos|tan|cot|operatorname|arc)/.test(exactTex)
  if (symbolic && !/\{,\}/.test(plain)) return { answer: plain }
  if (/\d[.,]\d/.test(raw) && !/\\(sqrt|pi)/.test(exactTex)) {
    const r = Math.round(value * 1e6) / 1e6
    if (Math.abs(r - value) < 1e-9) return { answer: dec(r) }
  }
  return null
}
export const _test = { dec, factorize }
export type { Step }
