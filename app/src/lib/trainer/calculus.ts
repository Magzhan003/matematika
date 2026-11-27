/** Derivative, tangent, extremum, greatest value, antiderivative and integral (types of the trainer, ch. VII). */
import { poly } from '../bank/core'
import { frac, l, q, ri, roots, value, type TGen } from './kit'

const P = (c: number[]) => (x: number) => c.reduce((s, k) => s * x + k, 0)
const D = (f: (x: number) => number, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h)
const simpson = (f: (x: number) => number, a: number, b: number, n = 2000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3 }
const nz = (r: () => number, a: number, b: number) => { let x = 0; while (!x) x = ri(r, a, b); return x }
const deriv = (c: number[]) => c.slice(0, -1).map((k, i) => k * (c.length - 1 - i))

export const calculusGens: TGen[] = [
  {
    id: 'derivative-at', make: (r) => {
      const c = [ri(r, -3, 4), ri(r, -6, 6), ri(r, -9, 9), ri(r, -9, 9)]
      if (!c[0]) c[0] = 2
      const x0 = ri(r, -3, 3), d = deriv(c), v = P(d)(x0)
      return q(r, 'derivative-at', l(`$f(x) = ${poly(c)}$ болса, $f'(${x0})$ мәнін табыңыз.`, `Найдите $f'(${x0})$, если $f(x) = ${poly(c)}$.`),
        String(v), [P(c)(x0), v + c[2] * 0 + 1, P(d.map((k, i) => (i === 0 ? k / 3 : k)))(x0), -v, v - 2].filter((x) => x !== v).map(String),
        l(`$f'(x) = ${poly(d)}$; $f'(${x0}) = ${v}$.`), [value(D(P(c), x0), v)])
    },
  },
  {
    id: 'derivative-chain', make: (r) => {
      const a = nz(r, -3, 4), b = ri(r, -5, 5), n = ri(r, 2, 4), x0 = ri(r, -2, 2)
      const v = n * a * (a * x0 + b) ** (n - 1)
      if (Math.abs(v) > 5000) throw new Error('too big')
      const inner = `${a === 1 ? '' : a === -1 ? '-' : a}x${b ? (b > 0 ? ` + ${b}` : ` - ${-b}`) : ''}`
      return q(r, 'derivative-chain', l(`$f(x) = (${inner})^{${n}}$ болса, $f'(${x0})$ мәнін табыңыз.`, `Найдите $f'(${x0})$, если $f(x) = (${inner})^{${n}}$.`),
        String(v), [n * (a * x0 + b) ** (n - 1), (a * x0 + b) ** n, v * 2, -v].filter((x) => x !== v).map(String).concat([String(v + a)]),
        l(`$f'(x) = ${n}(${inner})^{${n - 1}}\\cdot ${a < 0 ? `(${a})` : a}$; $f'(${x0}) = ${v}$.`), [value(D((x) => (a * x + b) ** n, x0), v)])
    },
  },
  {
    id: 'tangent', make: (r) => {
      const p = ri(r, -6, 6), c0 = ri(r, -8, 8), x0 = ri(r, -3, 4)
      const k = 2 * x0 + p, y0 = x0 * x0 + p * x0 + c0, m = y0 - k * x0
      const askK = r() < 0.4
      const line = `y = ${k === 0 ? '' : `${k === 1 ? '' : k === -1 ? '-' : k}x`}${m ? (k === 0 ? m : ` ${m > 0 ? '+' : '-'} ${Math.abs(m)}`) : k === 0 ? '0' : ''}`
      const f = (x: number) => x * x + p * x + c0
      if (askK) {
        return q(r, 'tangent-k', l(`$y = ${poly([1, p, c0])}$ функциясының графигіне абсциссасы $x_0 = ${x0}$ нүктеде жүргізілген жанаманың бұрыштық коэффициентін табыңыз.`, `Найдите угловой коэффициент касательной к графику $y = ${poly([1, p, c0])}$ в точке с абсциссой $x_0 = ${x0}$.`),
          String(k), [y0, k + 1, -k, 2 * x0].filter((x) => x !== k).map(String).concat([String(k - 2)]),
          l(`$k = y'(${x0}) = 2\\cdot${x0 < 0 ? `(${x0})` : x0} ${p < 0 ? '-' : '+'} ${Math.abs(p)} = ${k}$.`), [value(D(f, x0), k)])
      }
      const wrongLine = (kk: number, mm: number) => `y = ${kk === 0 ? '' : `${kk === 1 ? '' : kk === -1 ? '-' : kk}x`}${mm ? (kk === 0 ? mm : ` ${mm > 0 ? '+' : '-'} ${Math.abs(mm)}`) : kk === 0 ? '0' : ''}`
      return q(r, 'tangent-line', l(`$y = ${poly([1, p, c0])}$ функциясының графигіне абсциссасы $x_0 = ${x0}$ нүктеде жүргізілген жанаманың теңдеуін жазыңыз.`, `Запишите уравнение касательной к графику $y = ${poly([1, p, c0])}$ в точке с абсциссой $x_0 = ${x0}$.`),
        line, [wrongLine(k, y0), wrongLine(k, m + 2 * k), wrongLine(-k, y0 + k * x0), wrongLine(k + 1, m - x0), wrongLine(y0, k)],
        l(`$y(${x0}) = ${y0}$, $y'(${x0}) = ${k}$; $y = ${y0} + ${k < 0 ? `(${k})` : k}(x ${x0 < 0 ? '+' : '-'} ${Math.abs(x0)})$ → $${line}$.`),
        [value(f(x0), k * x0 + m), value(D(f, x0), k)])
    },
  },
  {
    id: 'extremum', make: (r) => {
      const a = ri(r, 1, 4), c0 = ri(r, -10, 10)
      const c = [1, 0, -3 * a * a, c0], f = P(c)
      const kind = ri(r, 0, 2)
      const dl = l(`$f'(x) = 3x^2 - ${3 * a * a} = 0$ → $x = \\pm${a}$; $f'$ таңбасы: $+,\\ -,\\ +$ → $x = -${a}$ максимум, $x = ${a}$ минимум.`, `$f'(x) = 3x^2 - ${3 * a * a} = 0$ → $x = \\pm${a}$; знаки $f'$: $+,\\ -,\\ +$ → $x = -${a}$ — максимум, $x = ${a}$ — минимум.`)
      const chk = [roots(P(deriv(c)), [a, -a]), value(Math.sign(D(P(deriv(c)), a)), 1)]
      if (kind === 0) return q(r, 'extremum-min', l(`$f(x) = ${poly(c)}$ функциясының минимум нүктесін табыңыз.`, `Найдите точку минимума функции $f(x) = ${poly(c)}$.`), String(a), [-a, 3 * a, a * a, 0].map(String), dl, chk)
      if (kind === 1) return q(r, 'extremum-max', l(`$f(x) = ${poly(c)}$ функциясының максимум нүктесін табыңыз.`, `Найдите точку максимума функции $f(x) = ${poly(c)}$.`), String(-a), [a, -3 * a, a * a, 0].map(String), dl, chk)
      const ymax = f(-a)
      return q(r, 'extremum-value', l(`$f(x) = ${poly(c)}$ функциясының максимумын (максимум нүктесіндегі мәнін) табыңыз.`, `Найдите максимум функции $f(x) = ${poly(c)}$ (значение в точке максимума).`),
        String(ymax), [f(a), -a, ymax + a, c0].filter((x) => x !== ymax).map(String).concat([String(ymax - 1)]), dl, [...chk, value(f(-a), ymax)])
    },
  },
  {
    id: 'segment-max', make: (r) => {
      const a = ri(r, 1, 3), c0 = ri(r, -8, 8), lo = -a - ri(r, 0, 2), hi = a + ri(r, 1, 2)
      const c = [1, 0, -3 * a * a, c0], f = P(c)
      const cand = [lo, -a, a, hi].filter((x) => x >= lo && x <= hi).map(f)
      const askMax = r() < 0.5, v = askMax ? Math.max(...cand) : Math.min(...cand)
      let best = askMax ? -Infinity : Infinity
      for (let i = 0; i <= 20000; i++) { const y = f(lo + ((hi - lo) * i) / 20000); best = askMax ? Math.max(best, y) : Math.min(best, y) }
      return q(r, 'segment-max', l(`$f(x) = ${poly(c)}$ функциясының $[${lo}; ${hi}]$ кесіндісіндегі ең ${askMax ? 'үлкен' : 'кіші'} мәнін табыңыз.`, `Найдите ${askMax ? 'наибольшее' : 'наименьшее'} значение функции $f(x) = ${poly(c)}$ на отрезке $[${lo}; ${hi}]$.`),
        String(v), [...cand.filter((x) => x !== v), v + 1, -v].map(String),
        l(`Кризистік нүктелер $x = \\pm${a}$. $f(${lo}) = ${f(lo)}$, $f(${-a}) = ${f(-a)}$, $f(${a}) = ${f(a)}$, $f(${hi}) = ${f(hi)}$ → ${askMax ? 'ең үлкені' : 'ең кішісі'} $${v}$.`, `Критические точки $x = \\pm${a}$. $f(${lo}) = ${f(lo)}$, $f(${-a}) = ${f(-a)}$, $f(${a}) = ${f(a)}$, $f(${hi}) = ${f(hi)}$ → ${askMax ? 'наибольшее' : 'наименьшее'} $${v}$.`),
        [value(best, v)])
    },
  },
  {
    id: 'decreasing', make: (r) => {
      const r1 = ri(r, -5, 3), w = 2 * ri(r, 1, 3), r2 = r1 + w
      const s = (r1 + r2) / 2 // f'(x) = 3(x − r1)(x − r2) → f = x³ − 3s·x² + 3r1r2·x + c0
      const c0 = ri(r, -5, 5), c = [1, -3 * s, 3 * r1 * r2, c0]
      const count = r2 - r1 + 1
      const ints = Array.from({ length: 41 }, (_, i) => i - 20).filter((x) => P(deriv(c))(x) <= 0)
      return q(r, 'decreasing', l(`$f(x) = ${poly(c)}$ функциясының кему аралығына неше бүтін сан тиісті?`, `Сколько целых чисел принадлежит промежутку убывания функции $f(x) = ${poly(c)}$?`),
        String(count), [count - 1, count + 1, w, count + 2].filter((x) => x !== count).map(String),
        l(`$f'(x) = 3(x ${r1 < 0 ? '+' : '-'} ${Math.abs(r1)})(x ${r2 < 0 ? '+' : '-'} ${Math.abs(r2)}) \\le 0$ → $[${r1}; ${r2}]$, бүтін сандар: ${count}.`, `$f'(x) = 3(x ${r1 < 0 ? '+' : '-'} ${Math.abs(r1)})(x ${r2 < 0 ? '+' : '-'} ${Math.abs(r2)}) \\le 0$ → $[${r1}; ${r2}]$, целых чисел: ${count}.`),
        [value(ints.length, count)])
    },
  },
  {
    id: 'antiderivative', make: (r) => {
      const a = ri(r, 1, 4), b = ri(r, -6, 6), x0 = ri(r, -2, 2), y0 = ri(r, -9, 9), x1 = ri(r, -3, 3)
      // f(x) = 3a·x² + 2b·x, F(x) = a·x³ + b·x² + C, F(x0) = y0
      const C = y0 - (a * x0 ** 3 + b * x0 * x0)
      const F = (x: number) => a * x ** 3 + b * x * x + C
      const v = F(x1)
      return q(r, 'antiderivative', l(`$f(x) = ${poly([3 * a, 2 * b, 0])}$ функциясының графигі $(${x0}; ${y0})$ нүктесі арқылы өтетін алғашқы функциясы $F(x)$ болса, $F(${x1})$ мәнін табыңыз.`, `$F(x)$ — первообразная функции $f(x) = ${poly([3 * a, 2 * b, 0])}$, график которой проходит через точку $(${x0}; ${y0})$. Найдите $F(${x1})$.`),
        String(v), [v - C, v + 1, 6 * a * x1 + 2 * b, a * x1 ** 3 + b * x1 * x1 + y0].filter((x) => x !== v).map(String).concat([String(-v)]),
        l(`$F(x) = ${poly([a, b, 0, 0])} + C$; $F(${x0}) = ${y0}$ → $C = ${C}$; $F(${x1}) = ${v}$.`), [value(F(x0), y0), value(simpson((x) => 3 * a * x * x + 2 * b * x, x0, x1) + y0, v)])
    },
  },
  {
    id: 'integral', make: (r) => {
      const a2 = 3 * ri(r, 0, 2), a1 = 2 * ri(r, -3, 3), a0 = ri(r, -5, 6)
      if (!a2 && !a1) throw new Error('constant')
      const lo = ri(r, -2, 1), hi = lo + ri(r, 1, 3)
      const F = (x: number) => (a2 / 3) * x ** 3 + (a1 / 2) * x * x + a0 * x
      const v = F(hi) - F(lo)
      const fn = poly([a2, a1, a0])
      return q(r, 'integral', l(`Интегралды есептеңіз: $\\displaystyle\\int_{${lo}}^{${hi}} (${fn})\\,dx$.`, `Вычислите интеграл: $\\displaystyle\\int_{${lo}}^{${hi}} (${fn})\\,dx$.`),
        String(v), [F(hi), F(lo) - F(hi), v + a0, P([a2, a1, a0])(hi) - P([a2, a1, a0])(lo)].filter((x) => x !== v && Number.isInteger(x)).map(String).concat([String(v + 2), String(2 * v + 1)]),
        l(`$F(x) = ${poly([a2 / 3, a1 / 2, a0, 0])}$; $F(${hi}) - F(${lo}) = ${F(hi)} - ${F(lo) < 0 ? `(${F(lo)})` : F(lo)} = ${v}$.`), [value(simpson(P([a2, a1, a0]), lo, hi), v)])
    },
  },
  {
    id: 'parabola-area', make: (r) => {
      const m = ri(r, 1, 4), k = m * m
      const area = frac(4 * m * m * m, 3)
      return q(r, 'parabola-area', l(`$y = ${k} - x^2$ параболасы мен $Ox$ осімен шектелген фигураның ауданын табыңыз.`, `Найдите площадь фигуры, ограниченной параболой $y = ${k} - x^2$ и осью $Ox$.`),
        area, [frac(2 * m * m * m, 3), frac(8 * m * m * m, 3), String(2 * m * k), frac(4 * m * m, 3)],
        l(`$\\int_{-${m}}^{${m}} (${k} - x^2)\\,dx = 2\\left(${k * m} - \\frac{${m ** 3}}{3}\\right) = ${area}$.`), [value(simpson((x) => k - x * x, -m, m), (4 * m ** 3) / 3)])
    },
  },
  {
    id: 'motion', make: (r) => {
      const a = ri(r, 1, 3), b = ri(r, -6, 4), c = ri(r, -5, 8), t0 = ri(r, 1, 5)
      const s = (t: number) => a * t ** 3 + b * t * t + c * t
      const askAcc = r() < 0.4
      const v = askAcc ? 6 * a * t0 + 2 * b : 3 * a * t0 * t0 + 2 * b * t0 + c
      const sTex = poly([a, b, c, 0]).replace(/x/g, 't')
      return q(r, askAcc ? 'motion-a' : 'motion-v', l(`Нүкте $s(t) = ${sTex}$ заңымен қозғалады ($s$ — метр, $t$ — секунд). $t = ${t0}$ с мезеттегі ${askAcc ? 'үдеуін (м/с²)' : 'жылдамдығын (м/с)'} табыңыз.`, `Точка движется по закону $s(t) = ${sTex}$ ($s$ — в метрах, $t$ — в секундах). Найдите ${askAcc ? 'ускорение (м/с²)' : 'скорость (м/с)'} в момент $t = ${t0}$ с.`),
        String(v), [s(t0), askAcc ? 3 * a * t0 * t0 + 2 * b * t0 + c : 6 * a * t0 + 2 * b, v + 1, -v].filter((x) => x !== v).map(String).concat([String(v * 2)]),
        askAcc ? l(`$v = s' = ${poly([3 * a, 2 * b, c]).replace(/x/g, 't')}$, $a = v' = ${poly([6 * a, 2 * b]).replace(/x/g, 't')}$; $a(${t0}) = ${v}$.`) : l(`$v(t) = s'(t) = ${poly([3 * a, 2 * b, c]).replace(/x/g, 't')}$; $v(${t0}) = ${v}$.`),
        [value(askAcc ? (s(t0 + 1e-3) - 2 * s(t0) + s(t0 - 1e-3)) / 1e-6 : D(s, t0), v)])
    },
  },
]
