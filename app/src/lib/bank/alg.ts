/** Generators: arithmetic, algebra, functions, progressions, trigonometry, logarithms, calculus, combinatorics. */
import { numTex } from '../calc/tools'
import { frac, gcd, mk, mkT, nz, pick, poly, polyIn, ri, type Gen, type L, type Problem, type Rng } from './core'

const T = {
  calc: { ru: 'Вычисли', kz: 'Есепте' },
  eq: { ru: 'Реши уравнение', kz: 'Теңдеуді шеш' },
  ineq: { ru: 'Реши неравенство', kz: 'Теңсіздікті шеш' },
  sys: { ru: 'Реши систему уравнений', kz: 'Теңдеулер жүйесін шеш' },
  simplify: { ru: 'Упрости выражение', kz: 'Өрнекті ықшамда' },
  factor: { ru: 'Разложи на множители', kz: 'Көбейткіштерге жікте' },
  expand: { ru: 'Раскрой скобки', kz: 'Жақшаны аш' },
  deriv: { ru: 'Найди производную', kz: 'Туындыны тап' },
} satisfies Record<string, L>

type Body = Omit<Problem, 'gen' | 'topic' | 'level'>
const G = (id: string, topic: string, level: Gen['level'], grade: number, make: (r: Rng) => Body): Gen => ({
  id, topic, level, grade, make: (r) => ({ gen: id, topic, level, ...make(r) }),
})
const n = numTex
const par = (x: number) => (x < 0 ? `(${x})` : String(x))
const sortRoots = (a: number[]) => [...a].sort((p, q) => p - q)
const rootsTex = (rs: number[]) => (rs.length === 1 ? `x = ${n(rs[0])}` : sortRoots(rs).map((r, i) => `x_{${i + 1}} = ${n(r)}`).join(';\\ '))

export const algGens: Gen[] = [
  // ---------------- arithmetic ----------------
  G('frac-add', 'fractions', 'easy', 6, (r) => {
    const b = ri(r, 2, 9), d = pick(r, [2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== b))
    const a = ri(r, 1, b - 1), c = ri(r, 1, d - 1), plus = r() < 0.6
    const num = plus ? a * d + c * b : a * d - c * b
    return { text: T.calc, tex: `\\dfrac{${a}}{${b}} ${plus ? '+' : '-'} \\dfrac{${c}}{${d}}`, answer: frac(num, b * d), values: [num / (b * d)], solve: `${a}/${b}${plus ? '+' : '-'}${c}/${d}`, mistakes: plus ? [mk((a + c) / (b + d), 'fracAdd', frac(a + c, b + d))] : [] }
  }),
  G('frac-mul', 'fractions', 'easy', 6, (r) => {
    const a = ri(r, 1, 9), b = ri(r, 2, 9), c = ri(r, 1, 9), d = ri(r, 2, 9), mul = r() < 0.5
    const [num, den] = mul ? [a * c, b * d] : [a * d, b * c]
    return { text: T.calc, tex: `\\dfrac{${a}}{${b}} ${mul ? '\\cdot' : ':'} \\dfrac{${c}}{${d}}`, answer: frac(num, den), values: [num / den], solve: `${a}/${b}${mul ? '*' : '/'}(${c}/${d})`, mistakes: mul ? [] : [mk((a * c) / (b * d), 'fracDiv', frac(a * c, b * d))] }
  }),
  G('percent-of', 'percents', 'easy', 5, (r) => {
    const p = pick(r, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]), a = ri(r, 2, 40) * 20
    const v = (a * p) / 100
    return { text: { ru: `Найди ${p}% от числа ${a}.`, kz: `${a} санының ${p}%-ын тап.` }, tex: '', answer: n(v), values: [v], steps: [`\\dfrac{${a} \\cdot ${p}}{100} = ${n(v)}`], mistakes: [mk(a * p, 'pct100')] }
  }),
  G('percent-whole', 'percents', 'easy', 6, (r) => {
    const p = pick(r, [10, 20, 25, 40, 50, 75]), whole = ri(r, 2, 40) * 20, x = (whole * p) / 100
    return { text: { ru: `${p}% числа равны ${x}. Найди это число.`, kz: `Санның ${p}%-ы ${x}-ге тең. Сол санды тап.` }, tex: '', answer: n(whole), values: [whole], steps: [`\\dfrac{${x} \\cdot 100}{${p}} = ${whole}`], mistakes: [mk((x * p) / 100, 'pctWhole')] }
  }),
  G('percent-change', 'percents', 'medium', 6, (r) => {
    const a = ri(r, 2, 50) * 100, p = pick(r, [10, 15, 20, 25, 30]), up = r() < 0.5
    const v = a * (1 + (up ? p : -p) / 100)
    return {
      text: { ru: `Цена ${a} тенге ${up ? 'выросла' : 'снизилась'} на ${p}%. Какой стала цена?`, kz: `${a} теңге баға ${p}%-ке ${up ? 'өсті' : 'төмендеді'}. Баға қандай болды?` },
      tex: '', answer: n(v), values: [v], steps: [`${a} \\cdot ${n(1 + (up ? p : -p) / 100)} = ${n(v)}`],
      mistakes: [mk((a * p) / 100, 'pctOnlyChange'), mk(a * (1 + (up ? -p : p) / 100), 'pctWrongWay')],
    }
  }),
  G('proportion', 'proportions', 'easy', 6, (r) => {
    const m = ri(r, 2, 9), a = ri(r, 2, 9), c = ri(r, 2, 9), b = m * c, x = m * a
    return { text: T.eq, tex: `\\dfrac{x}{${a}} = \\dfrac{${b}}{${c}}`, answer: `x = ${x}`, values: [x], solve: `x/${a} = ${b}/${c}`, mistakes: [mk((b * c) / a, 'propCross', `x = ${n((b * c) / a)}`)] }
  }),
  G('gcd', 'divisibility', 'medium', 6, (r) => {
    const g = ri(r, 2, 12), [m, k] = pick(r, [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 7]])
    return { text: { ru: `Найди НОД чисел ${g * m} и ${g * k}.`, kz: `${g * m} және ${g * k} сандарының ЕҮОБ-ын тап.` }, tex: '', answer: String(g), values: [g], mistakes: [mk(g * m * k, 'gcdLcm')] }
  }),
  G('lcm', 'divisibility', 'medium', 6, (r) => {
    const g = ri(r, 2, 6), [m, k] = pick(r, [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]]), l = g * m * k
    return { text: { ru: `Найди НОК чисел ${g * m} и ${g * k}.`, kz: `${g * m} және ${g * k} сандарының ЕКОЕ-сін тап.` }, tex: '', answer: String(l), values: [l], steps: [`\\dfrac{${g * m} \\cdot ${g * k}}{${g}} = ${l}`], mistakes: [mk(g, 'gcdLcm'), mk(g * m * g * k, 'lcmProduct')] }
  }),
  G('motion', 'word-problems', 'easy', 5, (r) => {
    const v = ri(r, 4, 18) * 5, t = ri(r, 2, 6)
    return { text: { ru: `Машина ехала ${t} ч со скоростью ${v} км/ч. Какой путь она проехала (в км)?`, kz: `Көлік ${t} сағат ${v} км/сағ жылдамдықпен жүрді. Ол қанша жол жүрді (км)?` }, tex: '', answer: String(v * t), values: [v * t], steps: [`s = v \\cdot t = ${v} \\cdot ${t} = ${v * t}`] }
  }),
  G('joint-work', 'word-problems', 'medium', 8, (r) => {
    const [a, b, t] = pick(r, [[3, 6, 2], [4, 12, 3], [6, 12, 4], [10, 15, 6], [12, 24, 8], [20, 30, 12], [6, 3, 2], [12, 6, 4]])
    return {
      text: { ru: `Одна бригада выполняет работу за ${a} дней, другая — за ${b}. За сколько дней они выполнят её вместе?`, kz: `Бір бригада жұмысты ${a} күнде, екіншісі ${b} күнде орындайды. Бірге неше күнде орындайды?` },
      tex: '', answer: String(t), values: [t], steps: [`\\dfrac{1}{t} = \\dfrac{1}{${a}} + \\dfrac{1}{${b}} = \\dfrac{1}{${t}}`],
      mistakes: [mk(a + b, 'workSum'), mk((a + b) / 2, 'workSum')],
    }
  }),

  // ---------------- algebra ----------------
  G('lin-eq', 'linear-eq', 'easy', 7, (r) => {
    const a = nz(r, -9, 9), x = ri(r, -10, 10), b = ri(r, -20, 20), c = a * x + b
    const sm = [mk((c + b) / a, 'signMove', `x = ${n((c + b) / a)}`)]
    if (c !== b) sm.push(mk(a / (c - b), 'divideWrong', `x = ${n(a / (c - b))}`))
    return { text: T.eq, tex: `${poly([a, b])} = ${c}`, answer: `x = ${x}`, values: [x], solve: `${polyIn([a, b])} = ${c}`, mistakes: b ? sm : sm.slice(1) }
  }),
  G('lin-eq2', 'linear-eq', 'medium', 7, (r) => {
    const x = ri(r, -9, 9), a = nz(r, -9, 9)
    let c = nz(r, -9, 9)
    if (c === a) c = a + 1 || 2
    const b = ri(r, -15, 15), d = a * x + b - c * x
    return { text: T.eq, tex: `${poly([a, b])} = ${poly([c, d])}`, answer: `x = ${x}`, values: [x], solve: `${polyIn([a, b])} = ${polyIn([c, d])}` }
  }),
  G('system', 'linear-eq', 'medium', 7, (r) => {
    const x = ri(r, -6, 6), y = ri(r, -6, 6)
    const a1 = nz(r, -5, 5), b1 = nz(r, -5, 5)
    let a2 = nz(r, -5, 5), b2 = nz(r, -5, 5)
    if (a1 * b2 === a2 * b1) { a2 += 1; if (a2 === 0) a2 = 2; if (a1 * b2 === a2 * b1) b2 += 1 }
    const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y
    const e = (a: number, b: number) => `${poly([a, 0]).replace(/x$/, 'x')}${b < 0 ? ' - ' : ' + '}${Math.abs(b) === 1 ? '' : Math.abs(b)}y`
    return {
      text: T.sys,
      tex: `\\begin{cases} ${e(a1, b1)} = ${c1} \\\\ ${e(a2, b2)} = ${c2} \\end{cases}`,
      answer: `x = ${x},\\ y = ${y}`, values: [x, y], solve: `${a1}x + ${b1}y = ${c1}; ${a2}x + ${b2}y = ${c2}`,
      wrong: [`x = ${y},\\ y = ${x}`, `x = ${-x},\\ y = ${y}`, `x = ${x},\\ y = ${-y}`, `x = ${x + 1},\\ y = ${y - 1}`].filter((w) => w !== `x = ${x},\\ y = ${y}`),
    }
  }),
  G('quad-eq', 'quadratic', 'medium', 8, (r) => {
    const r1 = ri(r, -9, 9)
    let r2 = ri(r, -9, 9)
    if (r2 === r1) r2 = r1 + ri(r, 1, 4)
    const a = pick(r, [1, 1, 1, 2, -1])
    const c = [a, -a * (r1 + r2), a * r1 * r2]
    return {
      text: T.eq, tex: `${poly(c)} = 0`, answer: rootsTex([r1, r2]), values: sortRoots([r1, r2]), solve: `${polyIn(c)} = 0`,
      wrong: [rootsTex([-r1, -r2]), rootsTex([r1, -r2]), rootsTex([r1 + 1, r2 + 1]), rootsTex([r1 - 1, r2 + 2]), rootsTex([-r1, r2])],
      mistakes: [mkT(rootsTex([-r1, -r2]), 'rootsSign', [-r1, -r2])],
    }
  }),
  G('quad-incomplete', 'quadratic', 'easy', 8, (r) => {
    if (r() < 0.5) {
      const k = ri(r, 1, 9), a = pick(r, [1, 2, 3])
      return { text: T.eq, tex: `${poly([a, 0, -a * k * k])} = 0`, answer: `x = \\pm ${k}`, values: [-k, k], solve: `${polyIn([a, 0, -a * k * k])} = 0`, wrong: [`x = ${k}`, `x = \\pm ${k * k}`, `x = 0;\\ x = ${k}`, `x = \\pm ${k + 1}`, `x = -${k}`], mistakes: [mkT(`x = ${k}`, 'lostRoot', [k])] }
    }
    const b = nz(r, -9, 9)
    return { text: T.eq, tex: `${poly([1, b, 0])} = 0`, answer: rootsTex([0, -b]), values: sortRoots([0, -b]), solve: `${polyIn([1, b, 0])} = 0`, wrong: [rootsTex([0, b]), `x = ${-b}`, rootsTex([1, -b]), rootsTex([0, -b + 1]), `x = 0`] }
  }),
  G('vieta', 'quadratic', 'medium', 8, (r) => {
    const r1 = ri(r, -8, 8), r2 = ri(r, -8, 8), c = [1, -(r1 + r2), r1 * r2]
    return { text: { ru: 'Не решая уравнение, найди сумму его корней.', kz: 'Теңдеуді шешпей, оның түбірлерінің қосындысын тап.' }, tex: `${poly(c)} = 0`, answer: String(r1 + r2), values: [r1 + r2], steps: [`x_1 + x_2 = -p = ${r1 + r2}`], mistakes: [mk(-(r1 + r2), 'vietaSign'), mk(r1 * r2, 'vietaProduct')] }
  }),
  G('biquad', 'quadratic', 'hard', 9, (r) => {
    const a = ri(r, 1, 3), b = ri(r, a + 1, 5), c = [1, 0, -(a * a + b * b), 0, a * a * b * b]
    return { text: T.eq, tex: `${poly(c)} = 0`, answer: `x = \\pm ${a};\\ x = \\pm ${b}`, values: [-b, -a, a, b], solve: `${polyIn(c)} = 0`, wrong: [`x = ${a};\\ x = ${b}`, `x = \\pm ${a * a};\\ x = \\pm ${b * b}`, `x = ${a * a};\\ x = ${b * b}`] }
  }),
  G('factor-trinomial', 'quadratic', 'medium', 8, (r) => {
    const r1 = nz(r, -8, 8), r2 = nz(r, -8, 8), c = [1, -(r1 + r2), r1 * r2]
    const f = (k: number) => `(x ${k > 0 ? '-' : '+'} ${Math.abs(k)})`
    return { text: T.factor, tex: poly(c), answer: `${f(r1)}${f(r2)}`, solve: polyIn(c), solveAction: 'factor', wrong: [`${f(-r1)}${f(-r2)}`, `${f(r1)}${f(-r2)}`, `(x - ${r1 * r2})(x - 1)`, `${f(r1 + 1)}${f(r2 - 1)}`, `${f(-r1)}${f(r2)}`] }
  }),
  G('lin-ineq', 'inequalities', 'easy', 8, (r) => {
    const a = nz(r, -6, 6), x0 = ri(r, -8, 8), b = ri(r, -10, 10), c = a * x0 + b
    const op = pick(r, ['>', '<', '\\ge', '\\le'] as const)
    const flip = { '>': '<', '<': '>', '\\ge': '\\le', '\\le': '\\ge' } as const
    const o = a < 0 ? flip[op] : op
    const iv = (oo: string) => (oo === '>' ? `(${x0};\\ +\\infty)` : oo === '<' ? `(-\\infty;\\ ${x0})` : oo === '\\ge' ? `[${x0};\\ +\\infty)` : `(-\\infty;\\ ${x0}]`)
    const raw = { '>': '>', '<': '<', '\\ge': '>=', '\\le': '<=' }[op]
    return { text: T.ineq, tex: `${poly([a, b])} ${op} ${c}`, answer: `x \\in ${iv(o)}`, solve: `${polyIn([a, b])} ${raw} ${c}`, wrong: [`x \\in ${iv(flip[o])}`, `x \\in ${iv(o).replace(String(x0), String(-x0))}`, `x \\in ${iv(o).replace('(', '[').replace(')', ']')}`, `x \\in ${iv(o).replace(String(x0), String(x0 + 1))}`, `x \\in ${iv(flip[o]).replace(String(x0), String(x0 - 1))}`] }
  }),
  G('quad-ineq', 'inequalities', 'hard', 9, (r) => {
    const r1 = ri(r, -7, 5), r2 = r1 + ri(r, 1, 6), c = [1, -(r1 + r2), r1 * r2], less = r() < 0.5
    const inside = `(${r1};\\ ${r2})`, outside = `(-\\infty;\\ ${r1}) \\cup (${r2};\\ +\\infty)`
    return { text: T.ineq, tex: `${poly(c)} ${less ? '<' : '>'} 0`, answer: `x \\in ${less ? inside : outside}`, solve: `${polyIn(c)} ${less ? '<' : '>'} 0`, wrong: [`x \\in ${less ? outside : inside}`, `x \\in [${r1};\\ ${r2}]`, `x \\in (${-r2};\\ ${-r1})`, `x \\in (-\\infty;\\ ${r1}] \\cup [${r2};\\ +\\infty)`, `x \\in (${r1 - 1};\\ ${r2 + 1})`] }
  }),
  G('abs-eq', 'inequalities', 'easy', 6, (r) => {
    const a = nz(r, -6, 6), b = ri(r, 1, 9)
    return { text: T.eq, tex: `|x ${a < 0 ? '+' : '-'} ${Math.abs(a)}| = ${b}`, answer: rootsTex([a - b, a + b]), values: [a - b, a + b], solve: `|x - (${a})| = ${b}`, wrong: [rootsTex([-a - b, -a + b]), `x = ${a + b}`, rootsTex([b - a, -b - a]), rootsTex([a - b - 1, a + b + 1]), `x = ${a - b}`] }
  }),
  G('powers', 'powers', 'easy', 7, (r) => {
    const a = pick(r, [2, 3]), m = ri(r, 2, 6), k = ri(r, 1, 5), p = ri(r, 1, m + k - 1), e = m + k - p
    const v = a ** e
    return { text: T.calc, tex: `\\dfrac{${a}^{${m}} \\cdot ${a}^{${k}}}{${a}^{${p}}}`, answer: String(v), values: [v], steps: [`${a}^{${m} + ${k} - ${p}} = ${a}^{${e}} = ${v}`], mistakes: m * k - p > 0 ? [mk(a ** (m * k - p), 'powMul')] : [] }
  }),
  G('neg-power', 'powers', 'medium', 8, (r) => {
    const a = pick(r, [2, 3, 4, 5, 10]), k = ri(r, 1, 3)
    return { text: T.calc, tex: `${a}^{-${k}}`, answer: frac(1, a ** k), values: [1 / a ** k], steps: [`\\dfrac{1}{${a}^{${k}}} = ${frac(1, a ** k)}`], wrong: [String(-(a ** k)), String(-a * k), frac(1, a * k)], mistakes: [mk(-(a ** k), 'negPower', String(-(a ** k)))] }
  }),
  G('sqrt-simplify', 'roots', 'medium', 8, (r) => {
    const k = ri(r, 2, 9), m = pick(r, [2, 3, 5, 6, 7])
    return { text: T.simplify, tex: `\\sqrt{${k * k * m}}`, answer: `${k}\\sqrt{${m}}`, values: [k * Math.sqrt(m)], steps: [`\\sqrt{${k * k} \\cdot ${m}} = ${k}\\sqrt{${m}}`], wrong: [`${m}\\sqrt{${k}}`, `${k * m}`, `${k * k}\\sqrt{${m}}`], mistakes: [mkT(`${m}\\sqrt{${k}}`, 'sqrtSwap', [m * Math.sqrt(k)])] }
  }),
  G('sqrt-calc', 'roots', 'easy', 8, (r) => {
    const [a, b, v] = pick(r, [[2, 8, 4], [3, 12, 6], [5, 20, 10], [18, 2, 6], [27, 3, 9], [50, 2, 10], [3, 27, 9], [6, 24, 12]])
    return { text: T.calc, tex: `\\sqrt{${a}} \\cdot \\sqrt{${b}}`, answer: String(v), values: [v], steps: [`\\sqrt{${a} \\cdot ${b}} = \\sqrt{${a * b}} = ${v}`] }
  }),
  G('expand-square', 'short-mult', 'easy', 7, (r) => {
    const a = nz(r, -9, 9)
    return { text: T.expand, tex: `(x ${a < 0 ? '-' : '+'} ${Math.abs(a)})^2`, answer: poly([1, 2 * a, a * a]), solve: `(x + (${a}))^2`, solveAction: 'expand', wrong: [poly([1, 0, a * a]), poly([1, a, a * a]), poly([1, -2 * a, a * a])], mistakes: [mkT(poly([1, 0, a * a]), 'square2ab')] }
  }),
  G('factor-diff', 'short-mult', 'easy', 7, (r) => {
    const k = ri(r, 1, 4), a = ri(r, 1, 9)
    const kx = k === 1 ? 'x' : `${k}x`
    return { text: T.factor, tex: `${k * k === 1 ? '' : k * k}x^{2} - ${a * a}`, answer: `(${kx} - ${a})(${kx} + ${a})`, solve: `${k * k}x^2 - ${a * a}`, solveAction: 'factor', wrong: [`(${kx} - ${a})^2`, `(${kx} + ${a})^2`, `(${kx} - ${a * a})(${kx} + 1)`, `(${kx} - ${a + 1})(${kx} + ${a + 1})`, `(${a} - ${kx})^2`], mistakes: [mkT(`(${kx} - ${a})^2`, 'diffSquares')] }
  }),

  // ---------------- functions ----------------
  G('lin-fn-value', 'linear-fn', 'easy', 7, (r) => {
    const k = nz(r, -6, 6), b = ri(r, -10, 10), x = ri(r, -6, 6), y = k * x + b
    return { text: { ru: `Функция задана формулой y = ${k}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}. Найди y при x = ${x}.`, kz: `Функция y = ${k}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} формуласымен берілген. x = ${x} болғанда y-ті тап.` }, tex: '', answer: String(y), values: [y], steps: [`y = ${k} \\cdot ${par(x)} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${y}`] }
  }),
  G('slope', 'linear-fn', 'medium', 8, (r) => {
    const k = nz(r, -4, 4), x1 = ri(r, -5, 3), x2 = x1 + ri(r, 1, 4), y1 = ri(r, -5, 5), y2 = y1 + k * (x2 - x1)
    return { text: { ru: `Прямая проходит через точки (${x1}; ${y1}) и (${x2}; ${y2}). Найди её угловой коэффициент.`, kz: `Түзу (${x1}; ${y1}) және (${x2}; ${y2}) нүктелері арқылы өтеді. Оның бұрыштық коэффициентін тап.` }, tex: '', answer: String(k), values: [k], steps: [`k = \\dfrac{${y2} - ${par(y1)}}{${x2} - ${par(x1)}} = ${k}`], mistakes: Math.abs(k) === 1 ? [] : [mk(1 / k, 'slopeSwap', frac(1, k))] }
  }),
  G('vertex', 'quadratic-fn', 'medium', 9, (r) => {
    const x0 = ri(r, -5, 5), y0 = ri(r, -9, 9), c = [1, -2 * x0, x0 * x0 + y0]
    return { text: { ru: 'Найди координаты вершины параболы.', kz: 'Парабола төбесінің координаталарын тап.' }, tex: `y = ${poly(c)}`, answer: `(${x0};\\ ${y0})`, values: [x0, y0], steps: [`x_0 = -\\dfrac{b}{2a} = ${x0}`, `y_0 = y(${x0}) = ${y0}`], wrong: [`(${-x0};\\ ${y0})`, `(${x0};\\ ${-y0})`, `(${y0};\\ ${x0})`, `(${x0 + 1};\\ ${y0})`, `(${x0};\\ ${y0 + 2})`], mistakes: x0 ? [mkT(`(${-x0};\\ ${y0})`, 'vertexSign')] : [] }
  }),

  // ---------------- progressions ----------------
  G('arith-nth', 'arith-prog', 'easy', 9, (r) => {
    const a1 = ri(r, -10, 15), d = nz(r, -5, 7), k = ri(r, 5, 20), v = a1 + (k - 1) * d
    return { text: { ru: `В арифметической прогрессии a₁ = ${a1}, d = ${d}. Найди a${k}.`, kz: `Арифметикалық прогрессияда a₁ = ${a1}, d = ${d}. a${k}-ні тап.` }, tex: `a_{${k}} = \\;?`, answer: String(v), values: [v], steps: [`a_{${k}} = ${a1} + ${k - 1} \\cdot ${par(d)} = ${v}`], mistakes: [mk(a1 + k * d, 'progN')] }
  }),
  G('arith-sum', 'arith-prog', 'medium', 9, (r) => {
    const a1 = ri(r, 1, 10), d = ri(r, 1, 5), k = ri(r, 5, 15), an = a1 + (k - 1) * d, s = ((a1 + an) * k) / 2
    return { text: { ru: `Найди сумму первых ${k} членов арифметической прогрессии, если a₁ = ${a1}, d = ${d}.`, kz: `a₁ = ${a1}, d = ${d} болса, арифметикалық прогрессияның алғашқы ${k} мүшесінің қосындысын тап.` }, tex: '', answer: String(s), values: [s], steps: [`a_{${k}} = ${an}`, `S_{${k}} = \\dfrac{(${a1} + ${an}) \\cdot ${k}}{2} = ${s}`], mistakes: [mk((a1 + an) * k, 'sumHalf')] }
  }),
  G('geom-nth', 'geom-prog', 'medium', 9, (r) => {
    const b1 = ri(r, 1, 5), q = pick(r, [2, 3, -2]), k = ri(r, 3, 6), v = b1 * q ** (k - 1)
    return { text: { ru: `В геометрической прогрессии b₁ = ${b1}, q = ${q}. Найди b${k}.`, kz: `Геометриялық прогрессияда b₁ = ${b1}, q = ${q}. b${k}-ні тап.` }, tex: `b_{${k}} = \\;?`, answer: String(v), values: [v], steps: [`b_{${k}} = ${b1} \\cdot ${par(q)}^{${k - 1}} = ${v}`], mistakes: [mk(b1 * q ** k, 'geomN')] }
  }),

  // ---------------- trigonometry ----------------
  G('trig-value', 'trig-basics', 'easy', 9, (r) => {
    const table: [string, number, string, number][] = [
      ['\\sin 30^\\circ', 0.5, '\\dfrac{1}{2}', 0], ['\\sin 45^\\circ', Math.SQRT1_2, '\\dfrac{\\sqrt2}{2}', 0], ['\\sin 60^\\circ', Math.sqrt(3) / 2, '\\dfrac{\\sqrt3}{2}', 0],
      ['\\cos 30^\\circ', Math.sqrt(3) / 2, '\\dfrac{\\sqrt3}{2}', 0], ['\\cos 60^\\circ', 0.5, '\\dfrac{1}{2}', 0], ['\\cos 90^\\circ', 0, '0', 0],
      ['\\operatorname{tg} 45^\\circ', 1, '1', 0], ['\\operatorname{tg} 60^\\circ', Math.sqrt(3), '\\sqrt3', 0], ['\\sin 150^\\circ', 0.5, '\\dfrac{1}{2}', 0],
      ['\\cos 120^\\circ', -0.5, '-\\dfrac{1}{2}', 0], ['\\cos 180^\\circ', -1, '-1', 0], ['\\sin 90^\\circ', 1, '1', 0],
    ]
    const [q, v, a] = pick(r, table)
    const all = ['\\dfrac{1}{2}', '\\dfrac{\\sqrt2}{2}', '\\dfrac{\\sqrt3}{2}', '1', '0', '\\sqrt3', '-\\dfrac{1}{2}', '-1', '\\dfrac{\\sqrt3}{3}']
    return { text: T.calc, tex: q, answer: a, values: [v], wrong: all.filter((x) => x !== a).sort(() => r() - 0.5).slice(0, 4) }
  }),
  G('radians', 'trig-basics', 'easy', 9, (r) => {
    const deg = pick(r, [30, 45, 60, 90, 120, 135, 150, 180, 270, 360])
    const g = gcd(deg, 180), num = deg / g, den = 180 / g
    const t = den === 1 ? `${num === 1 ? '' : num}\\pi` : `\\dfrac{${num === 1 ? '' : num}\\pi}{${den}}`
    return { text: { ru: `Переведи ${deg}° в радианы.`, kz: `${deg}°-ты радианға аудар.` }, tex: '', answer: t, values: [(deg * Math.PI) / 180], steps: [`\\dfrac{\\pi \\cdot ${deg}}{180} = ${t}`] }
  }),
  G('trig-identity', 'trig-identities', 'medium', 9, (r) => {
    const [a, b, c] = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]])
    const sinGiven = r() < 0.5
    return {
      text: { ru: `${sinGiven ? `sin α = ${a}/${c}` : `cos α = ${a}/${c}`}, угол α острый. Найди ${sinGiven ? 'cos α' : 'sin α'}.`, kz: `${sinGiven ? `sin α = ${a}/${c}` : `cos α = ${a}/${c}`}, α — сүйір бұрыш. ${sinGiven ? 'cos α' : 'sin α'}-ны тап.` },
      tex: '', answer: frac(b, c), values: [b / c], steps: [`\\sqrt{1 - \\left(\\tfrac{${a}}{${c}}\\right)^2} = \\sqrt{\\tfrac{${b * b}}{${c * c}}} = ${frac(b, c)}`], wrong: [frac(a, b), frac(c, b), `-${frac(b, c)}`, frac(c - a, c)],
    }
  }),
  G('trig-eq', 'trig-equations', 'medium', 10, (r) => {
    const opts = [
      ['\\sin x = \\dfrac{1}{2}', 'x = (-1)^n \\dfrac{\\pi}{6} + \\pi n', 'sin(x) = 1/2'],
      ['\\cos x = \\dfrac{1}{2}', 'x = \\pm\\dfrac{\\pi}{3} + 2\\pi n', 'cos(x) = 1/2'],
      ['\\operatorname{tg} x = 1', 'x = \\dfrac{\\pi}{4} + \\pi n', 'tg(x) = 1'],
      ['\\sin x = 0', 'x = \\pi n', 'sin(x) = 0'],
      ['\\cos x = 0', 'x = \\dfrac{\\pi}{2} + \\pi n', 'cos(x) = 0'],
      ['\\cos x = -1', 'x = \\pi + 2\\pi n', 'cos(x) = -1'],
    ]
    const [q, a, s] = pick(r, opts)
    return { text: T.eq, tex: q, answer: `${a},\\ n \\in \\mathbb{Z}`, solve: s, wrong: opts.filter((o) => o[1] !== a).map((o) => `${o[1]},\\ n \\in \\mathbb{Z}`).sort(() => r() - 0.5).slice(0, 4) }
  }),

  // ---------------- logarithms ----------------
  G('log-value', 'log-props', 'easy', 10, (r) => {
    const a = pick(r, [2, 3, 5, 10]), k = ri(r, -2, a === 2 ? 6 : 4)
    const N = k >= 0 ? String(a ** k) : `\\dfrac{1}{${a ** -k}}`
    return { text: T.calc, tex: a === 10 ? `\\lg ${N}` : `\\log_{${a}} ${N}`, answer: String(k), values: [k], steps: [`${N} = ${a}^{${k}}`] }
  }),
  G('log-sum', 'log-props', 'medium', 10, (r) => {
    const [a, x, y, k, op] = pick(r, [[2, 2, 8, 4, '+'], [2, 4, 8, 5, '+'], [3, 3, 9, 3, '+'], [6, 4, 9, 2, '+'], [6, 2, 3, 1, '+'], [10, 2, 5, 1, '+'], [10, 4, 25, 2, '+'], [2, 12, 3, 2, '-'], [3, 54, 2, 3, '-'], [5, 50, 2, 2, '-']] as const)
    return { text: T.calc, tex: `\\log_{${a}} ${x} ${op} \\log_{${a}} ${y}`, answer: String(k), values: [k], steps: [`\\log_{${a}} ${op === '+' ? `(${x} \\cdot ${y})` : `\\dfrac{${x}}{${y}}`} = \\log_{${a}} ${op === '+' ? x * y : x / y} = ${k}`], mistakes: [mk(op === '+' ? x * y : x / y, 'logProduct')] }
  }),
  G('exp-eq', 'exp-fn', 'medium', 10, (r) => {
    const a = pick(r, [2, 3, 5]), k = ri(r, 1, a === 2 ? 6 : 3), b = ri(r, -3, 3), x = k - b
    return { text: T.eq, tex: `${a}^{x ${b < 0 ? '-' : '+'} ${Math.abs(b)}} = ${a ** k}`, answer: `x = ${x}`, values: [x], solve: `${a}^(x + (${b})) = ${a ** k}`, mistakes: b ? [mk(k + b, 'signMove', `x = ${k + b}`)] : [] }
  }),
  G('log-eq', 'log-eq', 'medium', 10, (r) => {
    const a = pick(r, [2, 3]), k = ri(r, 1, 4), b = ri(r, -5, 5), x = a ** k - b
    return { text: T.eq, tex: `\\log_{${a}}(x ${b < 0 ? '-' : '+'} ${Math.abs(b)}) = ${k}`, answer: `x = ${x}`, values: [x], solve: `log_${a}(x + (${b})) = ${k}`, mistakes: [mk(a * k - b, 'logPow', `x = ${a * k - b}`)] }
  }),

  // ---------------- calculus ----------------
  G('deriv-point', 'derivative-table', 'medium', 10, (r) => {
    const a = nz(r, -3, 3), b = ri(r, -5, 5), c = ri(r, -6, 6), x0 = ri(r, -3, 3)
    const v = 3 * a * x0 * x0 + 2 * b * x0 + c
    return {
      text: { ru: `Найди значение производной функции в точке x₀ = ${x0}.`, kz: `Функция туындысының x₀ = ${x0} нүктесіндегі мәнін тап.` },
      tex: `f(x) = ${poly([a, b, c, 0])}`, answer: String(v), values: [v],
      steps: [`f'(x) = ${poly([3 * a, 2 * b, c])}`, `f'(${x0}) = ${v}`],
      mistakes: [mk(a * x0 ** 3 + b * x0 ** 2 + c * x0, 'derivFunc')],
    }
  }),
  G('deriv-expr', 'derivative-rules', 'medium', 10, (r) => {
    const a = ri(r, 2, 6), k = ri(r, 2, 5)
    const [f, d, w] = pick(r, [
      [`${a}x^{${k}} + \\sin x`, `${a * k}x^{${k - 1}} + \\cos x`, [`${a * k}x^{${k}} + \\cos x`, `${a * k}x^{${k - 1}} - \\cos x`, `${a}x^{${k - 1}} + \\cos x`]],
      [`${a}x^{${k}} - \\cos x`, `${a * k}x^{${k - 1}} + \\sin x`, [`${a * k}x^{${k - 1}} - \\sin x`, `${a * k}x^{${k + 1}} + \\sin x`, `${a}x^{${k}} + \\sin x`]],
      [`e^{x} + ${a}x^{${k}}`, `e^{x} + ${a * k}x^{${k - 1}}`, [`xe^{x-1} + ${a * k}x^{${k - 1}}`, `e^{x} + ${a}x^{${k - 1}}`, `e^{x} + ${a * k}x^{${k}}`]],
      [`\\ln x + ${a}x`, `\\dfrac{1}{x} + ${a}`, [`\\dfrac{1}{x} + ${a}x`, `\\ln x + ${a}`, `x + ${a}`]],
    ] as [string, string, string[]][])
    const raw = f.replace(/\\sin x/, 'sin(x)').replace(/\\cos x/, 'cos(x)').replace(/\\ln x/, 'ln(x)').replace(/e\^\{x\}/, 'e^x').replace(/\^\{(\d+)\}/g, '^$1')
    return { text: T.deriv, tex: `f(x) = ${f}`, answer: `f'(x) = ${d}`, solve: raw, solveAction: 'diff', wrong: w.map((x) => `f'(x) = ${x}`) }
  }),
  G('integral', 'integrals', 'hard', 11, (r) => {
    const a = ri(r, 1, 4) * 2, b = ri(r, -4, 6), k = ri(r, 1, 4), v = (a * k * k) / 2 + b * k
    return { text: T.calc, tex: `\\int_0^{${k}} (${poly([a, b])})\\,dx`, answer: String(v), values: [v], steps: [`\\left(${poly([a / 2, b, 0])}\\right)\\Big|_0^{${k}} = ${v}`], mistakes: [mk(a * k * k + b * k, 'integralHalf')] }
  }),
  G('extremum', 'derivative-apply', 'hard', 10, (r) => {
    const m = ri(r, -5, 5), c = ri(r, -9, 9), cf = [1, -2 * m, c]
    return { text: { ru: 'Найди точку минимума функции.', kz: 'Функцияның минимум нүктесін тап.' }, tex: `f(x) = ${poly(cf)}`, answer: `x_{\\min} = ${m}`, values: [m], steps: [`f'(x) = ${poly([2, -2 * m])} = 0 \\Rightarrow x = ${m}`, `f' : - \\to +`] }
  }),

  // ---------------- combinatorics & statistics ----------------
  G('factorial', 'combinatorics', 'easy', 9, (r) => {
    const k = ri(r, 3, 7), v = [1, 1, 2, 6, 24, 120, 720, 5040][k]
    return { text: { ru: `Сколькими способами можно расставить ${k} разных книг на полке?`, kz: `${k} түрлі кітапты сөреге неше тәсілмен қоюға болады?` }, tex: '', answer: String(v), values: [v], steps: [`P_{${k}} = ${k}! = ${v}`] }
  }),
  G('combinations', 'combinatorics', 'hard', 10, (r) => {
    const m = ri(r, 5, 10), k = ri(r, 2, 3), v = k === 2 ? (m * (m - 1)) / 2 : (m * (m - 1) * (m - 2)) / 6
    return { text: { ru: `Сколькими способами можно выбрать ${k} учеников из ${m}?`, kz: `${m} оқушының ішінен ${k} оқушыны неше тәсілмен таңдауға болады?` }, tex: '', answer: String(v), values: [v], steps: [`C_{${m}}^{${k}} = \\dfrac{${m}!}{${k}!\\,${m - k}!} = ${v}`], mistakes: [mk(k === 2 ? m * (m - 1) : m * (m - 1) * (m - 2), 'combOrder')] }
  }),
  G('probability', 'probability', 'easy', 9, (r) => {
    const red = ri(r, 1, 9), blue = ri(r, 1, 9)
    return { text: { ru: `В коробке ${red} красных и ${blue} синих шаров. Какова вероятность наугад вынуть красный шар?`, kz: `Қорапта ${red} қызыл және ${blue} көк шар бар. Кездейсоқ қызыл шар алу ықтималдығы қандай?` }, tex: '', answer: frac(red, red + blue), values: [red / (red + blue)], steps: [`P = \\dfrac{${red}}{${red} + ${blue}} = ${frac(red, red + blue)}`], wrong: [frac(blue, red + blue), frac(red, blue), frac(1, red + blue)], mistakes: [mk(red / blue, 'probTotal', frac(red, blue)), mk(blue / (red + blue), 'probOpposite', frac(blue, red + blue))] }
  }),
  G('dice', 'probability', 'medium', 9, (r) => {
    const k = ri(r, 1, 4)
    return { text: { ru: `Бросают игральный кубик. Какова вероятность, что выпадет больше ${k}?`, kz: `Ойын сүйегін лақтырады. ${k}-ден көп ұпай түсу ықтималдығы қандай?` }, tex: '', answer: frac(6 - k, 6), values: [(6 - k) / 6], steps: [`m = ${6 - k},\\ n = 6,\\ P = ${frac(6 - k, 6)}`], wrong: [frac(k, 6), frac(6 - k + 1, 6), frac(1, 6)], mistakes: [mk(k / 6, 'probOpposite', frac(k, 6))] }
  }),
  G('mean', 'statistics', 'easy', 7, (r) => {
    const m = ri(r, 3, 9), xs = [ri(r, 1, 10), ri(r, 1, 10), ri(r, 1, 10), ri(r, 1, 10)]
    const last = 5 * m - xs.reduce((s, x) => s + x, 0)
    const list = [...xs, last]
    return { text: { ru: `Найди среднее арифметическое чисел: ${list.join('; ')}.`, kz: `Сандардың арифметикалық ортасын тап: ${list.join('; ')}.` }, tex: '', answer: String(m), values: [m], steps: [`\\dfrac{${list.map(par).join(' + ')}}{5} = ${m}`], mistakes: [mk(5 * m, 'meanDivide')] }
  }),
  G('median', 'statistics', 'easy', 7, (r) => {
    const xs = Array.from({ length: pick(r, [5, 7]) }, () => ri(r, 1, 20))
    const s = [...xs].sort((a, b) => a - b), med = s[(s.length - 1) / 2]
    return { text: { ru: `Найди медиану ряда: ${xs.join('; ')}.`, kz: `Қатардың медианасын тап: ${xs.join('; ')}.` }, tex: '', answer: String(med), values: [med], steps: [`${s.join(';\\ ')}\\;\\Rightarrow\\; Me = ${med}`], mistakes: [mk(xs[(xs.length - 1) / 2], 'medianSort')] }
  }),
]
