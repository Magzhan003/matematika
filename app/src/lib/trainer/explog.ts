/** Exponential and logarithmic equations, inequalities and expressions (types of the trainer, ch. III). */
import { poly } from '../bank/core'
import { frac, l, pick, q, ri, roots, value, type TGen } from './kit'

const NONE = l('түбірі жоқ', 'корней нет')
const MAXP: Record<number, number> = { 2: 7, 3: 5, 5: 4 }
/** a^m as a number, or a fraction 1/a^|m| for small negative m; null if too big. */
function powTex(a: number, m: number): string | null {
  if (m >= 0) return m <= MAXP[a] ? String(a ** m) : null
  return -m <= 3 ? `\\frac{1}{${a ** -m}}` : null
}
const lg = (b: number, x: number) => Math.log(x) / Math.log(b)
const exp = (k: number, b: number, v = 'x') => `${k === 1 ? '' : k === -1 ? '-' : k}${v}${b ? (b > 0 ? ` + ${b}` : ` - ${-b}`) : ''}`

export const expGens: TGen[] = [
  {
    id: 'exp-simple', make: (r) => {
      const a = pick(r, [2, 3, 5]), k = ri(r, 1, 3), b = ri(r, -3, 3), x0 = ri(r, -3, 4)
      const m = k * x0 + b, rhs = powTex(a, m)
      if (rhs === null) throw new Error('rhs too big')
      return q(r, 'exp-simple', l(`$${a}^{${exp(k, b)}} = ${rhs}$ теңдеуін шешіңіз.`, `Решите уравнение $${a}^{${exp(k, b)}} = ${rhs}$.`),
        String(x0), [x0 + 1, -x0, m, x0 - 1, x0 + 2].map(String),
        l(`$${rhs} = ${a}^{${m}}$ → $${exp(k, b)} = ${m}$ → $x = ${x0}$.`),
        [roots((x) => a ** (k * x + b) - a ** m, [x0], [-20, 20])])
    },
  },
  {
    id: 'exp-fraction-base', make: (r) => {
      const a = pick(r, [2, 3, 5]), b = ri(r, -4, 4), m = ri(r, 1, MAXP[a] - 1)
      const x0 = -m - b
      return q(r, 'exp-fraction-base', l(`$\\left(\\frac{1}{${a}}\\right)^{${exp(1, b)}} = ${a ** m}$ теңдеуін шешіңіз.`, `Решите уравнение $\\left(\\frac{1}{${a}}\\right)^{${exp(1, b)}} = ${a ** m}$.`),
        String(x0), [m - b, -m + b, m + b, x0 + 1, -x0].map(String),
        l(`$\\left(\\frac{1}{${a}}\\right)^{${exp(1, b)}} = ${a}^{-(${exp(1, b)})}$, $${a ** m} = ${a}^{${m}}$ → $-(${exp(1, b)}) = ${m}$ → $x = ${x0}$.`),
        [roots((x) => (1 / a) ** (x + b) - a ** m, [x0], [-20, 20])])
    },
  },
  {
    id: 'exp-common-factor', make: (r) => {
      const a = pick(r, [2, 3, 5]), p = ri(r, 1, 2), x0 = ri(r, 0, 4), minus = r() < 0.4
      const k = minus ? a ** p - 1 : a ** p + 1
      const C = k * a ** x0
      if (C > 3000) throw new Error('too big')
      const eq = `${a}^{x + ${p}} ${minus ? '-' : '+'} ${a}^{x} = ${C}`
      return q(r, 'exp-common-factor', l(`$${eq}$ теңдеуін шешіңіз.`, `Решите уравнение $${eq}$.`),
        String(x0), [x0 + p, x0 + 1, x0 - 1, C / k, p].map(String),
        l(`$${a}^x(${a}^{${p}} ${minus ? '-' : '+'} 1) = ${C}$ → $${a}^x = ${a ** x0}$ → $x = ${x0}$.`),
        [roots((x) => a ** (x + p) + (minus ? -1 : 1) * a ** x - C, [x0], [-20, 20])])
    },
  },
  {
    id: 'exp-quadratic', make: (r) => {
      const a = pick(r, [2, 3]), p = ri(r, 0, 3)
      const two = r() < 0.55
      let qq = ri(r, 0, 3); while (qq === p) qq = ri(r, 0, 3)
      const t1 = a ** p, t2 = two ? a ** qq : -ri(r, 1, 6)
      const S1 = t1 + t2, P1 = t1 * t2
      const sq = r() < 0.5 ? `${a * a}^x` : `${a}^{2x}`
      const mid = S1 === 0 ? '' : ` ${S1 > 0 ? '-' : '+'} ${Math.abs(S1) === 1 ? '' : `${Math.abs(S1)}\\cdot `}${a}^x`
      const eq = `${sq}${mid} ${P1 > 0 ? '+' : '-'} ${Math.abs(P1)} = 0`
      const f = (x: number) => a ** (2 * x) - S1 * a ** x + P1
      if (two) {
        return q(r, 'exp-quadratic', l(`$${eq}$ теңдеуінің түбірлерінің қосындысын табыңыз.`, `Найдите сумму корней уравнения $${eq}$.`),
          String(p + qq), [S1, P1, p * qq, Math.max(p, qq), p + qq + 1].map(String),
          l(`$t = ${a}^x > 0$: $t^2 - ${S1}t + ${P1} = 0$, $t = ${t1}$ немесе $t = ${t2}$ → $x = ${p}$; $x = ${qq}$.`, `$t = ${a}^x > 0$: $t^2 - ${S1}t + ${P1} = 0$, $t = ${t1}$ или $t = ${t2}$ → $x = ${p}$; $x = ${qq}$.`),
          [roots(f, [p, qq], [-20, 20])])
      }
      return q(r, 'exp-quadratic-1', l(`$${eq}$ теңдеуін шешіңіз.`, `Решите уравнение $${eq}$.`),
        String(p), [NONE, String(p + 1), String(-p - 1), String(t1), String(p ? -p : 2)],
        l(`$t = ${a}^x > 0$: $t = ${t1}$ немесе $t = ${t2} < 0$ (жарамсыз) → $x = ${p}$.`, `$t = ${a}^x > 0$: $t = ${t1}$ или $t = ${t2} < 0$ (не подходит) → $x = ${p}$.`),
        [roots(f, [p], [-20, 20])])
    },
  },
  {
    id: 'exp-square-exponent', make: (r) => {
      const a = pick(r, [2, 3, 5])
      const r1 = ri(r, -4, 4)
      let r2 = ri(r, -4, 4); while (r2 === r1) r2 = ri(r, -4, 4)
      const k = r1 + r2, c = -r1 * r2
      const rhs = powTex(a, c)
      if (rhs === null) throw new Error('rhs too big')
      const ex = poly([1, -k, 0])
      return q(r, 'exp-square-exponent', l(`$${a}^{${ex}} = ${rhs}$ теңдеуінің түбірлерінің көбейтіндісін табыңыз.`, `Найдите произведение корней уравнения $${a}^{${ex}} = ${rhs}$.`),
        String(r1 * r2), [k, -k, c, r1 * r2 + 1, r1 * r2 - 1].map(String),
        l(`$${ex} = ${c}$ → $${poly([1, -k, -c])} = 0$ → $x = ${r1};\\ ${r2}$.`),
        [roots((x) => (x * x - k * x) - c, [r1, r2])])
    },
  },
  {
    id: 'exp-inequality', make: (r) => {
      const a = pick(r, [2, 3]), b = ri(r, -4, 4), m = ri(r, 1, MAXP[a] - 2)
      const frac1 = r() < 0.5
      if (frac1) {
        // (1/a)^(x - b) ≤ a^m  ⇔  x ≥ b − m
        const ans = b - m
        const inq = `\\left(\\frac{1}{${a}}\\right)^{${exp(1, -b)}} \\le ${a ** m}`
        const ints = Array.from({ length: 101 }, (_, i) => i - 50).filter((x) => (1 / a) ** (x - b) <= a ** m * (1 + 1e-12))
        return q(r, 'exp-inequality', l(`$${inq}$ теңсіздігінің ең кіші бүтін шешімін табыңыз.`, `Найдите наименьшее целое решение неравенства $${inq}$.`),
          String(ans), [ans + 1, ans - 1, b + m, -ans, m].map(String),
          l(`$${a}^{-(${exp(1, -b)})} \\le ${a}^{${m}}$, негізі $${a} > 1$: $-(${exp(1, -b)}) \\le ${m}$ → $x \\ge ${ans}$.`, `$${a}^{-(${exp(1, -b)})} \\le ${a}^{${m}}$, основание $${a} > 1$: $-(${exp(1, -b)}) \\le ${m}$ → $x \\ge ${ans}$.`),
          [value(Math.min(...ints), ans)])
      }
      // a^(x + b) < a^m  ⇔  x < m − b
      const ans = m - b - 1
      const inq = `${a}^{${exp(1, b)}} < ${a ** m}`
      const ints = Array.from({ length: 101 }, (_, i) => i - 50).filter((x) => a ** (x + b) < a ** m * (1 - 1e-12))
      return q(r, 'exp-inequality', l(`$${inq}$ теңсіздігінің ең үлкен бүтін шешімін табыңыз.`, `Найдите наибольшее целое решение неравенства $${inq}$.`),
        String(ans), [ans + 1, ans - 1, m + b, -ans, m].map(String),
        l(`$${a}^{${exp(1, b)}} < ${a}^{${m}}$ → $${exp(1, b)} < ${m}$ → $x < ${m - b}$; ең үлкен бүтін шешімі $${ans}$.`, `$${a}^{${exp(1, b)}} < ${a}^{${m}}$ → $${exp(1, b)} < ${m}$ → $x < ${m - b}$; наибольшее целое $${ans}$.`),
        [value(Math.max(...ints), ans)])
    },
  },
  {
    id: 'exp-int-count', make: (r) => {
      const a = pick(r, [2, 3, 5])
      const r1 = ri(r, -4, 1), r2 = ri(r, 1, 5)
      if (r1 === r2) throw new Error('same')
      const k = r1 + r2, c = -r1 * r2
      const count = r2 - r1 + 1
      if (!k) throw new Error('k = 0')
      const inq = `${a}^{x^2} \\le ${a}^{${exp(k, c)}}`
      const ints = Array.from({ length: 41 }, (_, i) => i - 20).filter((x) => x * x <= k * x + c)
      return q(r, 'exp-int-count', l(`$${inq}$ теңсіздігінің бүтін шешімдерінің санын табыңыз.`, `Найдите количество целых решений неравенства $${inq}$.`),
        String(count), [count - 1, count + 1, r2 - r1 - 1, 2 * count].map(String),
        l(`$x^2 \\le ${exp(k, c)}$ → $${poly([1, -k, -c])} \\le 0$ → $x \\in [${r1}; ${r2}]$, бүтін шешімдері: ${count}.`, `$x^2 \\le ${exp(k, c)}$ → $${poly([1, -k, -c])} \\le 0$ → $x \\in [${r1}; ${r2}]$, целых решений: ${count}.`),
        [value(ints.length, count)])
    },
  },
]

export const logGens: TGen[] = [
  {
    id: 'log-table', make: (r) => {
      const a1 = pick(r, [2, 3, 5]), k1 = ri(r, -3, MAXP[a1] - 1), a2 = pick(r, [2, 3, 4, 5, 7, 10]), k2 = ri(r, -2, 3)
      const arg = (a: number, k: number) => (k >= 0 ? String(a ** k) : `\\frac{1}{${a ** -k}}`)
      if (a2 ** Math.abs(k2) > 1000 || k1 === 0 || k2 === 0) throw new Error('skip')
      const c = pick(r, [1, 2, -1])
      const ans = k1 + c * k2
      const term2 = c === 1 ? `+ \\log_{${a2}} ${arg(a2, k2)}` : c === 2 ? `+ 2\\log_{${a2}} ${arg(a2, k2)}` : `- \\log_{${a2}} ${arg(a2, k2)}`
      const ex = `\\log_{${a1}} ${arg(a1, k1)} ${term2}`
      const val = lg(a1, a1 ** k1) + c * lg(a2, a2 ** k2)
      return q(r, 'log-table', l(`Өрнектің мәнін табыңыз: $${ex}$.`, `Найдите значение выражения: $${ex}$.`),
        String(ans), [k1 - c * k2, ans + 1, -ans, k1 * k2, ans - 1].map(String),
        l(`$\\log_{${a1}} ${arg(a1, k1)} = ${k1}$, $\\log_{${a2}} ${arg(a2, k2)} = ${k2}$ → $${k1} ${c > 0 ? '+' : '-'} ${Math.abs(c) === 2 ? '2\\cdot' : ''}${br(k2)} = ${ans}$.`),
        [value(val, ans)])
    },
  },
  {
    id: 'log-sum', make: (r) => {
      const [B, x, y] = pick(r, [[6, 4, 9], [6, 2, 18], [6, 3, 12], [10, 4, 25], [10, 2, 50], [10, 5, 20], [12, 9, 16], [12, 8, 18], [15, 9, 25], [14, 7, 28], [20, 16, 25], [18, 12, 27]] as const)
      const k = Math.round(lg(B, x * y))
      const minus = r() < 0.3
      if (minus) {
        // log_B(x·B^k) − log_B(x) form
        const top = x * B ** 1
        return q(r, 'log-diff', l(`Өрнектің мәнін табыңыз: $\\log_{${B}} ${top} - \\log_{${B}} ${x}$.`, `Найдите значение выражения: $\\log_{${B}} ${top} - \\log_{${B}} ${x}$.`),
          '1', ['2', String(top - x), '0', `\\log_{${B}} ${top - x}`],
          l(`$\\log_{${B}} \\frac{${top}}{${x}} = \\log_{${B}} ${B} = 1$.`), [value(lg(B, top) - lg(B, x), 1)])
      }
      return q(r, 'log-sum', l(`Өрнектің мәнін табыңыз: $\\log_{${B}} ${x} + \\log_{${B}} ${y}$.`, `Найдите значение выражения: $\\log_{${B}} ${x} + \\log_{${B}} ${y}$.`),
        String(k), [k + 1, k - 1, x + y, k * 2].map(String).concat([`\\log_{${B}} ${x + y}`]),
        l(`$\\log_{${B}} (${x}\\cdot${y}) = \\log_{${B}} ${x * y} = ${k}$.`), [value(lg(B, x) + lg(B, y), k)])
    },
  },
  {
    id: 'log-power-base', make: (r) => {
      const a = pick(r, [2, 3]), m = ri(r, 2, a === 2 ? 3 : 2), n = ri(r, 1, MAXP[a])
      if (n % m === 0 && r() < 0.6) throw new Error('prefer fractions')
      const ans = frac(n, m)
      return q(r, 'log-power-base', l(`$\\log_{${a ** m}} ${a ** n}$ мәнін табыңыз.`, `Найдите значение $\\log_{${a ** m}} ${a ** n}$.`),
        ans, [frac(m, n), String(n * m), String(n - m), frac(n + 1, m), frac(n, m + 1)],
        l(`$\\log_{${a}^{${m}}} ${a}^{${n}} = \\frac{${n}}{${m}}\\log_{${a}} ${a} = ${ans}$.`), [value(lg(a ** m, a ** n), n / m)])
    },
  },
  {
    id: 'log-chain', make: (r) => {
      const a = pick(r, [2, 3, 5]), b = pick(r, [5, 6, 7, 10, 11, 13].filter((x) => x !== a)), k = ri(r, 2, MAXP[a] - 1)
      return q(r, 'log-chain', l(`Өрнектің мәнін табыңыз: $\\log_{${a}} ${b} \\cdot \\log_{${b}} ${a ** k}$.`, `Найдите значение выражения: $\\log_{${a}} ${b} \\cdot \\log_{${b}} ${a ** k}$.`),
        String(k), [String(k + 1), String(b), frac(1, k), String(a * k), String(k * b)],
        l(`$\\log_{${a}} ${b} \\cdot \\log_{${b}} ${a ** k} = \\log_{${a}} ${a ** k} = ${k}$.`), [value(lg(a, b) * lg(b, a ** k), k)])
    },
  },
  {
    id: 'log-identity', make: (r) => {
      const a = pick(r, [2, 3, 5, 7]), b = pick(r, [3, 4, 5, 6, 7, 9, 10].filter((x) => x !== a))
      const kind = ri(r, 0, 2)
      if (kind === 0) {
        const c = 2
        return q(r, 'log-identity', l(`Өрнектің мәнін табыңыз: $${a}^{${c}\\log_{${a}} ${b}}$.`, `Найдите значение выражения: $${a}^{${c}\\log_{${a}} ${b}}$.`),
          String(b * b), [2 * b, b, a * b, b + 2].map(String), l(`$${a}^{2\\log_{${a}} ${b}} = (${a}^{\\log_{${a}} ${b}})^2 = ${b}^2 = ${b * b}$.`),
          [value(a ** (c * lg(a, b)), b * b)])
      }
      const k = ri(r, 1, 2)
      if (kind === 1) {
        return q(r, 'log-identity', l(`Өрнектің мәнін табыңыз: $${a}^{${k} + \\log_{${a}} ${b}}$.`, `Найдите значение выражения: $${a}^{${k} + \\log_{${a}} ${b}}$.`),
          String(a ** k * b), [a ** k + b, k + b, a * k * b, (a + b) ** k].map(String), l(`$${a}^{${k}}\\cdot ${a}^{\\log_{${a}} ${b}} = ${a ** k}\\cdot${b} = ${a ** k * b}$.`),
          [value(a ** (k + lg(a, b)), a ** k * b)])
      }
      return q(r, 'log-identity', l(`Өрнектің мәнін табыңыз: $${a * a}^{\\log_{${a}} ${b}}$.`, `Найдите значение выражения: $${a * a}^{\\log_{${a}} ${b}}$.`),
        String(b * b), [2 * b, b, a * b, b * b * a].map(String), l(`$${a * a}^{\\log_{${a}} ${b}} = ${a}^{2\\log_{${a}} ${b}} = ${b}^2 = ${b * b}$.`),
        [value((a * a) ** lg(a, b), b * b)])
    },
  },
  {
    id: 'log-linear-eq', make: (r) => {
      const a = pick(r, [2, 3, 5]), m = ri(r, 1, MAXP[a] - 1), k = ri(r, 1, 5), x0 = ri(r, -6, 9)
      const b = a ** m - k * x0
      const inside = exp(k, b)
      return q(r, 'log-linear-eq', l(`$\\log_{${a}}(${inside}) = ${m}$ теңдеуін шешіңіз.`, `Решите уравнение $\\log_{${a}}(${inside}) = ${m}$.`),
        String(x0), [a ** m, x0 + 1, -x0, (a * m - b) / k, x0 - 1].filter((v) => Number.isFinite(v) && Number.isInteger(v)).map(String),
        l(`$${inside} = ${a}^{${m}} = ${a ** m}$ → $x = ${x0}$ (тексеру: $${inside} > 0$ ✓).`, `$${inside} = ${a}^{${m}} = ${a ** m}$ → $x = ${x0}$ (проверка: $${inside} > 0$ ✓).`),
        [roots((x) => (k * x + b > 0 ? lg(a, k * x + b) - m : NaN), [x0], [-60, 60])])
    },
  },
  {
    id: 'log-sum-eq', make: (r) => {
      const a = pick(r, [2, 3]), m = ri(r, 2, a === 2 ? 5 : 3), i = ri(r, 0, m)
      const u = a ** i, w = a ** (m - i)
      if (u === w) throw new Error('need different factors')
      const p = ri(r, -3, 5), x0 = u - p, qq = w - x0, x1 = -p - qq - x0
      const L1 = exp(1, p), L2 = exp(1, qq)
      const f = (x: number) => (x + p > 0 && x + qq > 0 ? lg(a, x + p) + lg(a, x + qq) - m : NaN)
      return q(r, 'log-sum-eq', l(`$\\log_{${a}}(${L1}) + \\log_{${a}}(${L2}) = ${m}$ теңдеуін шешіңіз.`, `Решите уравнение $\\log_{${a}}(${L1}) + \\log_{${a}}(${L2}) = ${m}$.`),
        String(x0), [String(x1), `${Math.min(x0, x1)};\\ ${Math.max(x0, x1)}`, NONE, String(x0 + 1)],
        l(`$(${L1})(${L2}) = ${a ** m}$ → $x = ${x0}$ немесе $x = ${x1}$. $x = ${x1}$ болғанда логарифм анықталмаған → жауабы $${x0}$.`, `$(${L1})(${L2}) = ${a ** m}$ → $x = ${x0}$ или $x = ${x1}$. При $x = ${x1}$ логарифм не определён → ответ $${x0}$.`),
        [roots(f, [x0])])
    },
  },
  {
    id: 'log-quadratic', make: (r) => {
      const a = pick(r, [2, 3]), u = ri(r, -1, 3)
      let v = ri(r, -1, 3); while (v === u) v = ri(r, -1, 3)
      const s = u + v, p = u * v
      const prod = powTex(a, s)
      if (prod === null) throw new Error('too big')
      const L = `\\log_{${a}} x`
      const eq = `\\log_{${a}}^2 x ${s ? `${s > 0 ? '-' : '+'} ${Math.abs(s) === 1 ? '' : Math.abs(s)}${L}` : ''} ${p ? `${p > 0 ? '+' : '-'} ${Math.abs(p)}` : ''} = 0`
      const D = Math.sqrt(s * s - 4 * p)
      return q(r, 'log-quadratic', l(`$${eq}$ теңдеуінің түбірлерінің көбейтіндісін табыңыз.`, `Найдите произведение корней уравнения $${eq}$.`),
        prod, [String(s), String(p), powTex(a, p) ?? String(a * p), String(a ** u + a ** v)].filter((x) => x !== prod).concat([String(-s)]),
        l(`$t = ${L}$: $t^2 - ${br(s)}t + ${br(p)} = 0$ → $t = ${u}$; $t = ${v}$ → $x = ${powTex(a, u)};\\ ${powTex(a, v)}$, көбейтіндісі $${prod}$.`, `$t = ${L}$: $t^2 - ${br(s)}t + ${br(p)} = 0$ → $t = ${u}$; $t = ${v}$ → $x = ${powTex(a, u)};\\ ${powTex(a, v)}$, произведение $${prod}$.`),
        [value(a ** ((s + D) / 2) * a ** ((s - D) / 2), a ** s)])
    },
  },
  {
    id: 'log-int-count', make: (r) => {
      const a = pick(r, [2, 3]), m = ri(r, 1, a === 2 ? 4 : 2), p = ri(r, -5, 6), strict = r() < 0.5, half = r() < 0.5
      const count = strict ? a ** m - 1 : a ** m
      const inside = exp(1, -p)
      const inq = half ? `\\log_{\\frac{1}{${a}}}(${inside}) ${strict ? '>' : '\\ge'} -${m}` : `\\log_{${a}}(${inside}) ${strict ? '<' : '\\le'} ${m}`
      const ok = (x: number) => { if (x - p <= 0) return false; const v = Math.log(x - p) / Math.log(a); return strict ? v < m - 1e-12 : v <= m + 1e-12 }
      const ints = Array.from({ length: 401 }, (_, i) => i - 200).filter(ok)
      return q(r, 'log-int-count', l(`$${inq}$ теңсіздігінің бүтін шешімдерінің санын табыңыз.`, `Найдите количество целых решений неравенства $${inq}$.`),
        String(count), [count + 1, count - 1, a ** m + p, a * m].map(String),
        l(`$0 < ${inside} ${strict ? '<' : '\\le'} ${a}^{${m}}$ → $${p} < x ${strict ? '<' : '\\le'} ${p + a ** m}$, бүтін шешімдері: ${count}.`, `$0 < ${inside} ${strict ? '<' : '\\le'} ${a}^{${m}}$ → $${p} < x ${strict ? '<' : '\\le'} ${p + a ** m}$, целых решений: ${count}.`),
        [value(ints.length, count)])
    },
  },
  {
    id: 'lg-pair', make: (r) => {
      const [x, y, k] = pick(r, [[25, 4, 2], [50, 2, 2], [8, 125, 3], [20, 5, 2], [40, 25, 3], [16, 625, 4], [2, 5, 1], [250, 4, 3], [80, 125, 4]] as const)
      return q(r, 'lg-pair', l(`Өрнектің мәнін табыңыз: $\\lg ${x} + \\lg ${y}$.`, `Найдите значение выражения: $\\lg ${x} + \\lg ${y}$.`),
        String(k), [String(k + 1), String(k - 1 || 10), `\\lg ${x + y}`, String(x * y)],
        l(`$\\lg(${x}\\cdot${y}) = \\lg ${x * y} = ${k}$.`), [value(Math.log10(x) + Math.log10(y), k)])
    },
  },
]

const br = (k: number) => (k < 0 ? `(${k})` : String(k))
