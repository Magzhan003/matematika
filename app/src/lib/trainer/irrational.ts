/** Irrational expressions, equations, inequalities and systems (types of the trainer, ch. II). */
import { l, pick, q, ri, roots, value, type TGen } from './kit'

/** k√b in TeX (k may be 1, −1, 0). */
const kr = (k: number, b: number) => (k === 0 ? '0' : `${k === 1 ? '' : k === -1 ? '-' : k}\\sqrt{${b}}`)
const lin = (k: number, b: number) => `${k === 1 ? '' : k === -1 ? '-' : k}x${b ? (b > 0 ? ` + ${b}` : ` - ${-b}`) : ''}`

export const irrationalGens: TGen[] = [
  {
    id: 'combine-roots', make: (r) => {
      const b = pick(r, [2, 3, 5, 6, 7])
      const ms = [ri(r, 2, 6), ri(r, 1, 5), ri(r, 2, 4)], cs = [1, pick(r, [1, -1, 2]), pick(r, [-1, 1, -2])]
      const ans = cs.reduce((s, c, i) => s + c * ms[i], 0)
      if (!ans || new Set(ms).size < 3) throw new Error('trivial')
      const ex = ms.map((m, i) => `${i === 0 ? '' : cs[i] < 0 ? ' - ' : ' + '}${Math.abs(cs[i]) === 1 ? '' : Math.abs(cs[i])}\\sqrt{${m * m * b}}`).join('')
      return q(r, 'combine-roots', l(`Өрнекті ықшамдаңыз: $${ex}$.`, `Упростите выражение: $${ex}$.`),
        kr(ans, b), [kr(-ans, b), kr(ans + 1, b), kr(ms.reduce((s, m) => s + m, 0), b), `\\sqrt{${Math.abs(cs.reduce((s, c, i) => s + c * ms[i] * ms[i] * b, 0)) || 1}}`, kr(ans, b * 2)],
        l(`$${ms.map((m) => `\\sqrt{${m * m * b}} = ${m}\\sqrt{${b}}`).join(';\\ ')}$ → $${kr(ans, b)}$.`),
        [value(cs.reduce((s, c, i) => s + c * Math.sqrt(ms[i] * ms[i] * b), 0), ans * Math.sqrt(b))])
    },
  },
  {
    id: 'rationalize', make: (r) => {
      const a = pick(r, [2, 3, 5, 6, 7, 10, 11]), b = pick(r, [2, 3, 5, 6, 7].filter((x) => x < a))
      if (b === undefined) throw new Error('need b < a')
      const k = ri(r, 1, 4), c = k * (a - b)
      const right = `${k === 1 ? '' : k}(\\sqrt{${a}} + \\sqrt{${b}})`
      return q(r, 'rationalize', l(`Бөлімін иррационалдықтан арылтыңыз: $\\dfrac{${c}}{\\sqrt{${a}} - \\sqrt{${b}}}$.`, `Избавьтесь от иррациональности в знаменателе: $\\dfrac{${c}}{\\sqrt{${a}} - \\sqrt{${b}}}$.`),
        right, [`${k === 1 ? '' : k}(\\sqrt{${a}} - \\sqrt{${b}})`, `${c}(\\sqrt{${a}} + \\sqrt{${b}})`, `\\frac{${c}}{${a - b}}`, `${k + 1}(\\sqrt{${a}} + \\sqrt{${b}})`],
        l(`Алымы мен бөлімін $\\sqrt{${a}} + \\sqrt{${b}}$-ге көбейтеміз: $\\frac{${c}(\\sqrt{${a}} + \\sqrt{${b}})}{${a} - ${b}} = ${right}$.`, `Домножаем на $\\sqrt{${a}} + \\sqrt{${b}}$: $\\frac{${c}(\\sqrt{${a}} + \\sqrt{${b}})}{${a} - ${b}} = ${right}$.`),
        [value(c / (Math.sqrt(a) - Math.sqrt(b)), k * (Math.sqrt(a) + Math.sqrt(b)))])
    },
  },
  {
    id: 'square-of-sum', make: (r) => {
      const a = ri(r, 2, 12), b = ri(r, 2, 12)
      if (a === b || Number.isInteger(Math.sqrt(a * b))) throw new Error('want a root')
      const minus = r() < 0.5
      const ex = `(\\sqrt{${a}} ${minus ? '-' : '+'} \\sqrt{${b}})^2 ${minus ? '+' : '-'} 2\\sqrt{${a * b}}`
      return q(r, 'square-of-sum', l(`Өрнектің мәнін табыңыз: $${ex}$.`, `Найдите значение выражения: $${ex}$.`),
        String(a + b), [String(a - b), String((a + b) ** 2), `${a + b} + 4\\sqrt{${a * b}}`, String(a * b)],
        l(`$(\\sqrt{${a}} ${minus ? '-' : '+'} \\sqrt{${b}})^2 = ${a + b} ${minus ? '-' : '+'} 2\\sqrt{${a * b}}$ → $${a + b}$.`),
        [value((Math.sqrt(a) + (minus ? -1 : 1) * Math.sqrt(b)) ** 2 + (minus ? 2 : -2) * Math.sqrt(a * b), a + b)])
    },
  },
  {
    id: 'cube-roots', make: (r) => {
      const [a, b, c] = pick(r, [[2, 4, 2], [3, 9, 3], [4, 16, 4], [5, 25, 5], [2, 32, 4], [9, 24, 6], [4, 54, 6], [12, 18, 6], [3, 72, 6], [25, 40, 10]] as const)
      return q(r, 'cube-roots', l(`Өрнектің мәнін табыңыз: $\\sqrt[3]{${a}}\\cdot\\sqrt[3]{${b}}$.`, `Найдите значение выражения: $\\sqrt[3]{${a}}\\cdot\\sqrt[3]{${b}}$.`),
        String(c), [String(c * c), `\\sqrt[3]{${a + b}}`, String(c + 1), `\\sqrt{${a * b}}`],
        l(`$\\sqrt[3]{${a}\\cdot${b}} = \\sqrt[3]{${a * b}} = ${c}$.`), [value(Math.cbrt(a) * Math.cbrt(b), c)])
    },
  },
  {
    id: 'sqrt-linear', make: (r) => {
      const a = ri(r, 1, 5), c = ri(r, 1, 7), x0 = ri(r, -6, 9), b = c * c - a * x0
      return q(r, 'sqrt-linear', l(`$\\sqrt{${lin(a, b)}} = ${c}$ теңдеуін шешіңіз.`, `Решите уравнение $\\sqrt{${lin(a, b)}} = ${c}$.`),
        String(x0), [x0 + 1, (c - b) / a, -x0, c * c, x0 - 1].filter((v) => Number.isInteger(v)).map(String),
        l(`$${lin(a, b)} = ${c * c}$ → $x = ${x0}$.`), [roots((x) => (a * x + b >= 0 ? Math.sqrt(a * x + b) - c : NaN), [x0])])
    },
  },
  {
    id: 'sqrt-equals-line', make: (r) => {
      const qq = ri(r, -3, 4), x0 = ri(r, qq + 2, qq + 7), x1 = 2 * qq + 1 - x0
      const p = qq * qq - x0 * x1
      const f = (x: number) => (x + p >= 0 ? Math.sqrt(x + p) - (x - qq) : NaN)
      const rhs = qq ? `x ${qq > 0 ? '-' : '+'} ${Math.abs(qq)}` : 'x'
      const left = p ? `x ${p > 0 ? '+' : '-'} ${Math.abs(p)}` : 'x'
      return q(r, 'sqrt-equals-line', l(`$\\sqrt{${left}} = ${rhs}$ теңдеуін шешіңіз.`, `Решите уравнение $\\sqrt{${left}} = ${rhs}$.`),
        String(x0), [String(x1), `${Math.min(x0, x1)};\\ ${Math.max(x0, x1)}`, l('түбірі жоқ', 'корней нет'), String(x0 + 1)],
        l(`Квадраттаймыз: $${left} = (${rhs})^2$ → $x = ${x0}$ немесе $x = ${x1}$. Тексеру: $x = ${x1}$ болғанда оң жағы теріс → бөгде түбір. Жауабы: $${x0}$.`, `Возводим в квадрат: $${left} = (${rhs})^2$ → $x = ${x0}$ или $x = ${x1}$. Проверка: при $x = ${x1}$ правая часть отрицательна → посторонний корень. Ответ: $${x0}$.`),
        [roots(f, [x0])])
    },
  },
  {
    id: 'sqrt-substitution', make: (r) => {
      const t1 = ri(r, 1, 6), t2 = -ri(r, 1, 7)
      const p = -(t1 + t2), c = t1 * t2 // x + p√x + c = 0 with t = √x
      const mid = p ? ` ${p > 0 ? '+' : '-'} ${Math.abs(p) === 1 ? '' : Math.abs(p)}\\sqrt{x}` : ''
      const eq = `x${mid} - ${-c} = 0`
      return q(r, 'sqrt-substitution', l(`$${eq}$ теңдеуін шешіңіз.`, `Решите уравнение $${eq}$.`),
        String(t1 * t1), [String(t1), String(t2 * t2), `${t1 * t1};\\ ${t2 * t2}`, String(t1 * t1 + 1)],
        l(`$t = \\sqrt{x} \\ge 0$: $t^2${mid.replace('\\sqrt{x}', 't')} - ${-c} = 0$ → $t = ${t1}$ ($t = ${t2} < 0$ жарамсыз) → $x = ${t1 * t1}$.`, `$t = \\sqrt{x} \\ge 0$: $t^2${mid.replace('\\sqrt{x}', 't')} - ${-c} = 0$ → $t = ${t1}$ ($t = ${t2} < 0$ не подходит) → $x = ${t1 * t1}$.`),
        [roots((x) => (x >= 0 ? x + p * Math.sqrt(x) + c : NaN), [t1 * t1])])
    },
  },
  {
    id: 'sqrt-inequality', make: (r) => {
      const a = ri(r, -6, 8), b = ri(r, 2, 5)
      const inq = `\\sqrt{${lin(1, -a)}} < ${b}`
      const count = b * b
      const ints = Array.from({ length: 141 }, (_, i) => i - 40).filter((x) => x - a >= 0 && Math.sqrt(x - a) < b)
      return q(r, 'sqrt-inequality', l(`$${inq}$ теңсіздігінің бүтін шешімдерінің санын табыңыз.`, `Найдите количество целых решений неравенства $${inq}$.`),
        String(count), [count + 1, count - 1, b, 2 * b].map(String),
        l(`$0 \\le ${lin(1, -a)} < ${b * b}$ → $${a} \\le x < ${a + b * b}$ → бүтін шешімдері ${count}.`, `$0 \\le ${lin(1, -a)} < ${b * b}$ → $${a} \\le x < ${a + b * b}$ → целых решений ${count}.`),
        [value(ints.length, count)])
    },
  },
  {
    id: 'domain-count', make: (r) => {
      const a = ri(r, -6, 3), b = ri(r, a + 2, a + 9)
      const count = b - a + 1
      const fn = `y = \\sqrt{${lin(1, -a)}} + \\sqrt{${b} - x}`.replace('- -', '+ ')
      const ints = Array.from({ length: 61 }, (_, i) => i - 30).filter((x) => x - a >= 0 && b - x >= 0)
      return q(r, 'domain-count', l(`$${fn}$ функциясының анықталу облысындағы бүтін сандар санын табыңыз.`, `Сколько целых чисел входит в область определения функции $${fn}$?`),
        String(count), [count - 1, count + 1, b - a - 1, b + a].filter((x) => x > 0).map(String).concat([String(2 * count)]),
        l(`$x \\ge ${a}$ және $x \\le ${b}$ → $[${a}; ${b}]$, бүтін сандар: ${count}.`, `$x \\ge ${a}$ и $x \\le ${b}$ → $[${a}; ${b}]$, целых чисел: ${count}.`),
        [value(ints.length, count)])
    },
  },
  {
    id: 'sqrt-system', make: (r) => {
      const u = ri(r, 1, 6), v = ri(r, 1, 6)
      if (u === v) throw new Error('same')
      const s = u + v, x2 = u * u + v * v
      return q(r, 'sqrt-system', l(`$\\begin{cases} \\sqrt{x} + \\sqrt{y} = ${s} \\\\ x + y = ${x2} \\end{cases}$ жүйесінің шешімі $(x_0; y_0)$ болса, $x_0 y_0$ мәнін табыңыз.`, `Если $(x_0; y_0)$ — решение системы $\\begin{cases} \\sqrt{x} + \\sqrt{y} = ${s} \\\\ x + y = ${x2} \\end{cases}$, найдите $x_0 y_0$.`),
        String(u * u * v * v), [u * v, x2, (s * s - x2) / 2, u * u * v * v + 1].map(String),
        l(`$a = \\sqrt{x}$, $b = \\sqrt{y}$: $a + b = ${s}$, $a^2 + b^2 = ${x2}$ → $ab = \\frac{${s * s} - ${x2}}{2} = ${u * v}$ → $xy = (ab)^2 = ${u * u * v * v}$.`),
        [value(u * u * v * v, ((s * s - x2) / 2) ** 2)])
    },
  },
]
