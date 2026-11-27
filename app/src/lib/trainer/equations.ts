/** Rational equations and systems (types of the trainer, ch. I §3–4). */
import { poly } from '../bank/core'
import { frac, l, pick, q, ri, roots, sgn, value, type TGen } from './kit'

const SOLVE = l('Теңдеуді шешіңіз.', 'Решите уравнение.')
const NONE = l('түбірі жоқ', 'корней нет')
const nz = (r: () => number, a: number, b: number) => { let x = 0; while (!x) x = ri(r, a, b); return x }
const P = (c: number[]) => (x: number) => c.reduce((s, k) => s * x + k, 0)

export const equationGens: TGen[] = [
  {
    id: 'biquad', make: (r) => {
      const a = ri(r, 1, 6)
      if (r() < 0.6) {
        let b = ri(r, 1, 6); while (b === a) b = ri(r, 1, 6)
        const c = [1, 0, -(a * a + b * b), 0, a * a * b * b]
        const askMax = r() < 0.5
        const right = askMax ? Math.max(a, b) : a * a * b * b
        return q(r, 'biquad', l(`$${poly(c)} = 0$ теңдеуінің ${askMax ? 'ең үлкен түбірін' : 'түбірлерінің көбейтіндісін'} табыңыз.`, `Найдите ${askMax ? 'наибольший корень' : 'произведение корней'} уравнения $${poly(c)} = 0$.`),
          String(right), (askMax ? [Math.max(a, b) ** 2, Math.min(a, b), -Math.max(a, b), a * a + b * b, a + b] : [-a * a * b * b, a * a + b * b, a * b, 2 * a * b, a * b * 4]).map(String),
          l(`$t = x^2$: $t^2 - ${a * a + b * b}t + ${a * a * b * b} = 0$, $t_1 = ${a * a}$, $t_2 = ${b * b}$ → $x = \\pm${a};\\ \\pm${b}$.`, `$t = x^2$: $t^2 - ${a * a + b * b}t + ${a * a * b * b} = 0$, $t_1 = ${a * a}$, $t_2 = ${b * b}$ → $x = \\pm${a};\\ \\pm${b}$.`),
          [roots(P(c), [a, -a, b, -b])])
      }
      const c0 = ri(r, 1, 9)
      const c = [1, 0, -(a * a - c0), 0, -a * a * c0]
      return q(r, 'biquad-neg', l(`$${poly(c)} = 0$ теңдеуінің неше түбірі бар?`, `Сколько корней имеет уравнение $${poly(c)} = 0$?`),
        '2', ['4', '1', '0', '3'],
        l(`$t = x^2 \\ge 0$: $t_1 = ${a * a}$, $t_2 = -${c0} < 0$ жарамсыз → $x = \\pm${a}$, екі түбір.`, `$t = x^2 \\ge 0$: $t_1 = ${a * a}$, $t_2 = -${c0} < 0$ не подходит → $x = \\pm${a}$, два корня.`),
        [roots(P(c), [a, -a])])
    },
  },
  {
    id: 'group-cubic', make: (r) => {
      const p = nz(r, -6, 6), qq = ri(r, 1, 5)
      if (Math.abs(p) === qq) throw new Error('repeated root')
      const c = [1, p, -qq * qq, -p * qq * qq]
      const askSum = r() < 0.5
      const right = askSum ? -p : Math.max(-p, qq)
      return q(r, 'group-cubic', l(`$${poly(c)} = 0$ теңдеуінің ${askSum ? 'түбірлерінің қосындысын' : 'ең үлкен түбірін'} табыңыз.`, `Найдите ${askSum ? 'сумму корней' : 'наибольший корень'} уравнения $${poly(c)} = 0$.`),
        String(right), (askSum ? [p, -p + qq, -p - qq, qq * qq, 2 * qq - p] : [Math.min(-p, -qq), p, qq * qq, -p * qq, qq + 1]).map(String),
        l(`$x^2(x ${sgn(p)}) - ${qq * qq}(x ${sgn(p)}) = (x ${sgn(p)})(x - ${qq})(x + ${qq}) = 0$ → $x = ${-p};\\ ${qq};\\ ${-qq}$.`),
        [roots(P(c), [-p, qq, -qq])])
    },
  },
  {
    id: 'substitute', make: (r) => {
      const k = nz(r, -5, 5), u = ri(r, -6, 6), v = ri(r, -6, 6)
      const xs = [u, -k - u, v, -k - v]
      if (new Set(xs).size < 4) throw new Error('repeated roots')
      const t1 = u * (k + u), t2 = v * (k + v)
      const S1 = t1 + t2, P1 = t1 * t2
      if (!P1) throw new Error('zero free term')
      const inner = poly([1, k, 0])
      const askSum = r() < 0.5
      const right = askSum ? -2 * k : xs.reduce((a, b) => a * b, 1)
      const f = (x: number) => { const t = x * x + k * x; return t * t - S1 * t + P1 }
      return q(r, 'substitute', l(`$(${inner})^2 ${S1 ? `${S1 > 0 ? '-' : '+'} ${Math.abs(S1)}(${inner})` : ''} ${sgn(P1)} = 0$ теңдеуінің барлық түбірлерінің ${askSum ? 'қосындысын' : 'көбейтіндісін'} табыңыз.`,
        `Найдите ${askSum ? 'сумму' : 'произведение'} всех корней уравнения $(${inner})^2 ${S1 ? `${S1 > 0 ? '-' : '+'} ${Math.abs(S1)}(${inner})` : ''} ${sgn(P1)} = 0$.`),
        String(right), (askSum ? [-k, 2 * k, k, S1, -S1] : [P1, -P1, t1 + t2, -right, right + 1]).map(String),
        l(`$t = ${inner}$: $t^2 ${S1 ? `${S1 > 0 ? '-' : '+'} ${Math.abs(S1)}t` : ''} ${sgn(P1)} = 0$, $t = ${t1}$ немесе $t = ${t2}$ → $x = ${xs.join(';\\ ')}$.`, `$t = ${inner}$: $t^2 ${S1 ? `${S1 > 0 ? '-' : '+'} ${Math.abs(S1)}t` : ''} ${sgn(P1)} = 0$, $t = ${t1}$ или $t = ${t2}$ → $x = ${xs.join(';\\ ')}$.`),
        [roots(f, xs)])
    },
  },
  {
    id: 'rational', make: (r) => {
      const a = ri(r, 1, 6), c = ri(r, 1, 9)
      let d = ri(r, 1, 9); while (d === c) d = ri(r, 1, 9)
      const none = r() < 0.25
      let x0 = none ? pick(r, [a, -a]) : ri(r, -9, 9)
      if (!none) while (Math.abs(x0) === a) x0 = ri(r, -9, 9)
      const e = (c - d) * x0 + a * (c + d)
      const rhs = e === 0 ? '0' : `${e < 0 ? '-' : ''}\\frac{${Math.abs(e)}}{x^2 - ${a * a}}`
      const eq = `\\frac{${c}}{x - ${a}} - \\frac{${d}}{x + ${a}} = ${rhs}`
      const f = (x: number) => c / (x - a) - d / (x + a) - e / (x * x - a * a)
      const lin = `${c}(x + ${a}) - ${d}(x - ${a}) = ${e}`
      return q(r, 'rational', l(`${SOLVE.kz} $${eq}$`, `${SOLVE.ru} $${eq}$`),
        none ? NONE : String(x0), none ? [String(x0), String(-x0), String(c + d), String(a + 1)] : [NONE, String(-x0), String(x0 + 1), String(x0 - 1), String(a)],
        none ? l(`$x \\ne \\pm${a}$. $${lin}$ → $x = ${x0}$ — бөгде түбір. Жауабы: түбірі жоқ.`, `$x \\ne \\pm${a}$. $${lin}$ → $x = ${x0}$ — посторонний корень. Ответ: корней нет.`)
          : l(`$x \\ne \\pm${a}$. $${lin}$ → $x = ${x0}$.`),
        [roots(f, none ? [] : [x0])])
    },
  },
  {
    id: 'reciprocal', make: (r) => {
      const m = ri(r, 2, 4), n = ri(r, 2, 4)
      let A = m * n, B = -(n * (m * m + 1) - m * (n * n + 1)), C = -(m * m + 1) * (n * n + 1) + 2 * m * n
      const g = [A, B, C].reduce((s, k) => (k ? gcdI(s, Math.abs(k)) : s), A)
      A /= g; B /= g; C /= g
      const c = [A, B, C, B, A]
      return q(r, 'reciprocal', l(`$${poly(c)} = 0$ теңдеуінің ең үлкен түбірін табыңыз.`, `Найдите наибольший корень уравнения $${poly(c)} = 0$.`),
        String(m), [frac(1, m), String(-n), String(n === m ? m + 1 : n), frac(-1, n), String(m * n)],
        l(`$x^2$-қа бөліп, $t = x + \\frac1x$ белгілейміз: $t = ${frac(m * m + 1, m)}$ немесе $t = ${frac(-(n * n + 1), n)}$ → $x = ${m};\\ ${frac(1, m)};\\ ${-n};\\ ${frac(-1, n)}$.`,
          `Делим на $x^2$ и полагаем $t = x + \\frac1x$: $t = ${frac(m * m + 1, m)}$ или $t = ${frac(-(n * n + 1), n)}$ → $x = ${m};\\ ${frac(1, m)};\\ ${-n};\\ ${frac(-1, n)}$.`),
        [roots(P(c), [m, 1 / m, -n, -1 / n])])
    },
  },
  {
    id: 'x-plus-c-over-x', make: (r) => {
      const r1 = nz(r, -8, 8)
      let r2 = nz(r, -8, 8); while (r2 === r1) r2 = nz(r, -8, 8)
      const c = r1 * r2, s = r1 + r2
      const eq = `x ${c < 0 ? '-' : '+'} \\frac{${Math.abs(c)}}{x} = ${s}`
      return q(r, 'x-plus-c-over-x', l(`$${eq}$ теңдеуінің үлкен түбірін табыңыз.`, `Найдите больший корень уравнения $${eq}$.`),
        String(Math.max(r1, r2)), [String(Math.min(r1, r2)), String(-Math.max(r1, r2)), String(s), String(c), String(Math.max(r1, r2) + 1)],
        l(`$x \\ne 0$: $${poly([1, -s, c])} = 0$ → $x = ${r1};\\ ${r2}$.`),
        [roots((x) => x + c / x - s, [r1, r2])])
    },
  },
  {
    id: 'full-square', make: (r) => {
      const m = ri(r, 1, 5), n = ri(r, 1, 7)
      const t = `${m * m === 1 ? '' : m * m}x^2 + kx + ${n * n}`
      return q(r, 'full-square', l(`$k$-ның қандай теріс мәнінде $${t}$ үшмүшесі толық квадрат болады?`, `При каком отрицательном значении $k$ трёхчлен $${t}$ является полным квадратом?`),
        String(-2 * m * n), [String(2 * m * n), String(-m * n), String(-4 * m * n), String(-(m * m + n * n))],
        l(`$D = k^2 - 4\\cdot${m * m}\\cdot${n * n} = 0$ → $k = \\pm${2 * m * n}$; теріс мәні $${-2 * m * n}$.`, `$D = k^2 - 4\\cdot${m * m}\\cdot${n * n} = 0$ → $k = \\pm${2 * m * n}$; отрицательное $${-2 * m * n}$.`),
        [value((-2 * m * n) ** 2 - 4 * m * m * n * n, 0)])
    },
  },
  {
    id: 'graphs-meet', make: (r) => {
      const k = ri(r, -6, 6), p = ri(r, -9, 9)
      const want = ri(r, 0, 2)
      // choose b so that x² + p = kx + b has `want` solutions: x² − kx + (p − b) = 0, D = k² − 4(p − b)
      let b: number
      if (want === 1) {
        if (k % 2) throw new Error('need even k')
        b = p - (k * k) / 4
      } else if (want === 2) {
        b = p - Math.floor((k * k) / 4) + ri(r, 1, 6)
      } else {
        b = p - Math.floor((k * k) / 4) - ri(r, 1, 6)
      }
      const D = k * k - 4 * (p - b)
      const got = D > 0 ? 2 : D === 0 ? 1 : 0
      const line = `y = ${k === 0 ? '' : `${k === 1 ? '' : k === -1 ? '-' : k}x`}${k === 0 ? b : b ? ` ${sgn(b)}` : ''}`
      return q(r, 'graphs-meet', l(`$y = x^2 ${p ? sgn(p) : ''}$ және $${line}$ функцияларының графиктерінің неше ортақ нүктесі бар?`, `Сколько общих точек имеют графики функций $y = x^2 ${p ? sgn(p) : ''}$ и $${line}$?`),
        String(want), ['0', '1', '2', '3'].filter((x) => x !== String(want)),
        l(`$x^2 ${p ? sgn(p) : ''} = ${line.slice(4)}$ → $${poly([1, -k, p - b])} = 0$, $D = ${D}$ → ${want} нүкте.`, `$x^2 ${p ? sgn(p) : ''} = ${line.slice(4)}$ → $${poly([1, -k, p - b])} = 0$, $D = ${D}$ → точек: ${want}.`),
        [value(got, want)])
    },
  },
  {
    id: 'linear-system', make: (r) => {
      const x0 = ri(r, -6, 6), y0 = ri(r, -6, 6)
      const a1 = nz(r, -5, 5), b1 = nz(r, -5, 5), a2 = nz(r, -5, 5), b2 = nz(r, -5, 5)
      const det = a1 * b2 - a2 * b1
      if (!det) throw new Error('degenerate')
      const c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0
      const row = (a: number, b: number, c: number) => `${poly([a, 0]).replace(/x$/, 'x')} ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y = ${c}`
      const askProd = r() < 0.5
      const right = askProd ? x0 * y0 : x0 + y0
      const sx = (c1 * b2 - c2 * b1) / det, sy = (a1 * c2 - a2 * c1) / det
      return q(r, 'linear-system', l(`$\\begin{cases} ${row(a1, b1, c1)} \\\\ ${row(a2, b2, c2)} \\end{cases}$ жүйесінің шешімі $(x_0; y_0)$ болса, $${askProd ? 'x_0 \\cdot y_0' : 'x_0 + y_0'}$ мәнін табыңыз.`,
        `Если $(x_0; y_0)$ — решение системы $\\begin{cases} ${row(a1, b1, c1)} \\\\ ${row(a2, b2, c2)} \\end{cases}$, найдите $${askProd ? 'x_0 \\cdot y_0' : 'x_0 + y_0'}$.`),
        String(right), (askProd ? [x0 + y0, -right, x0 - y0, right + 1, right - 1] : [x0 * y0, x0 - y0, -right, right + 1, right - 1]).map(String),
        l(`Шешімі: $x_0 = ${x0}$, $y_0 = ${y0}$.`, `Решение: $x_0 = ${x0}$, $y_0 = ${y0}$.`),
        [value(askProd ? sx * sy : sx + sy, right)])
    },
  },
  {
    id: 'symmetric-system', make: (r) => {
      const r1 = ri(r, -7, 7)
      let r2 = ri(r, -7, 7); while (r2 === r1) r2 = ri(r, -7, 7)
      const s = r1 + r2, p = r1 * r2
      return q(r, 'symmetric-system', l(`$\\begin{cases} x + y = ${s} \\\\ xy = ${p} \\end{cases}$ болса, $x^2 + y^2$ мәнін табыңыз.`, `Найдите $x^2 + y^2$, если $\\begin{cases} x + y = ${s} \\\\ xy = ${p} \\end{cases}$`),
        String(s * s - 2 * p), [s * s + 2 * p, s * s, s * s - p, 2 * p, s * s - 4 * p].map(String),
        l(`$x^2 + y^2 = (x + y)^2 - 2xy = ${br2(s)}^2 - 2\\cdot${br2(p)} = ${s * s - 2 * p}$.`),
        [value(r1 * r1 + r2 * r2, s * s - 2 * p)])
    },
  },
]

function gcdI(a: number, b: number): number { return b ? gcdI(b, a % b) : Math.abs(a) }
const br2 = (k: number) => (k < 0 ? `(${k})` : String(k))
