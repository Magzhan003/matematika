/**
 * Generators for topics of the school program that had no tasks yet:
 * adjacent/parallel angles, functions, reduction/addition/double-angle/sum-to-product formulas,
 * inverse trig, trig inequalities, antiderivatives, table integrals, pyramids, complex numbers.
 * Every numeric answer is re-checked in scripts/check-extra-gens.ts.
 */
import { frac, gcd, mk, mkT, nz, pick, ri, type Gen, type L, type Problem, type Rng } from './core'

type Body = Omit<Problem, 'gen' | 'topic' | 'level'>
const G = (id: string, topic: string, level: Gen['level'], grade: number, make: (r: Rng) => Body): Gen => ({
  id, topic, level, grade, make: (r) => ({ gen: id, topic, level, ...make(r) }),
})
const calc: L = { ru: 'Вычисли', kz: 'Есепте' }
const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15]] as const
/** Reduced fractions only (3/5, not 9/15) — for trig values. */
const primitive = triples.filter(([a, b]) => gcd(a, b) === 1)

/** Exact values that trig tasks can have: TeX and number. */
const EXACT: [string, number][] = [
  ['0', 0], ['\\dfrac{1}{2}', 0.5], ['-\\dfrac{1}{2}', -0.5], ['\\dfrac{\\sqrt2}{2}', Math.SQRT1_2], ['-\\dfrac{\\sqrt2}{2}', -Math.SQRT1_2],
  ['\\dfrac{\\sqrt3}{2}', Math.sqrt(3) / 2], ['-\\dfrac{\\sqrt3}{2}', -Math.sqrt(3) / 2], ['1', 1], ['-1', -1],
  ['\\sqrt3', Math.sqrt(3)], ['-\\sqrt3', -Math.sqrt(3)], ['\\dfrac{\\sqrt3}{3}', Math.sqrt(3) / 3], ['-\\dfrac{\\sqrt3}{3}', -Math.sqrt(3) / 3],
]
const exactTex = (v: number) => EXACT.find(([, x]) => Math.abs(x - v) < 1e-9)?.[0] ?? String(v)
const rad = (d: number) => (d * Math.PI) / 180
const FN = { sin: '\\sin', cos: '\\cos', tg: '\\operatorname{tg}' } as const
const fnVal = (f: keyof typeof FN, d: number) => (f === 'sin' ? Math.sin(rad(d)) : f === 'cos' ? Math.cos(rad(d)) : Math.tan(rad(d)))
const par = (x: number) => (x < 0 ? `- ${Math.abs(x)}` : `+ ${x}`)
const clean =(v: number) => (Math.abs(v) < 1e-12 ? 0 : v)

export const extraGens: Gen[] = [
  // ---------------- angles and lines (7) ----------------
  G('adj-angle', 'angles-lines', 'easy', 7, (r) => {
    const a = ri(r, 3, 16) * 10 + pick(r, [0, 5])
    return {
      text: { ru: `Один из смежных углов равен ${a}°. Найди другой угол (в градусах).`, kz: `Сыбайлас бұрыштардың бірі ${a}°. Екінші бұрышты тап (градуспен).` },
      tex: '', answer: `${180 - a}^\\circ`, values: [180 - a], steps: [`180^\\circ - ${a}^\\circ = ${180 - a}^\\circ`],
      mistakes: a < 90 ? [mk(90 - a, 'adjSum', `${90 - a}^\\circ`)] : [mk(360 - a, 'adjSum', `${360 - a}^\\circ`)],
    }
  }),
  G('vert-angles', 'angles-lines', 'medium', 7, (r) => {
    const x = ri(r, 2, 8) * 10 + pick(r, [0, 5]), s = 2 * x
    return {
      text: { ru: `Две прямые пересекаются. Сумма двух вертикальных углов равна ${s}°. Найди больший из четырёх образовавшихся углов.`, kz: `Екі түзу қиылысады. Екі вертикаль бұрыштың қосындысы ${s}°. Пайда болған төрт бұрыштың үлкенін тап.` },
      tex: '', answer: `${180 - x}^\\circ`, values: [180 - x], steps: [`${s}^\\circ : 2 = ${x}^\\circ`, `180^\\circ - ${x}^\\circ = ${180 - x}^\\circ`],
      mistakes: [mk(180 - s, 'adjSum', `${180 - s}^\\circ`)],
    }
  }),
  G('parallel-angles', 'angles-lines', 'medium', 7, (r) => {
    // 90° is excluded: then both angles are equal and the task tests nothing
    let a = ri(r, 4, 16) * 10 - pick(r, [0, 5]); if (a === 90) a = 85
    const kind = pick(r, ['cross', 'one'] as const)
    const ans = kind === 'cross' ? a : 180 - a
    return {
      text: kind === 'cross'
        ? { ru: `Две параллельные прямые пересечены секущей. Один из накрест лежащих углов равен ${a}°. Найди другой накрест лежащий угол.`, kz: `Екі параллель түзуді қиюшы қиып өтеді. Айқыш жатқан бұрыштардың бірі ${a}°. Екінші айқыш жатқан бұрышты тап.` }
        : { ru: `Две параллельные прямые пересечены секущей. Один из односторонних углов равен ${a}°. Найди другой односторонний угол.`, kz: `Екі параллель түзуді қиюшы қиып өтеді. Тұстас бұрыштардың бірі ${a}°. Екінші тұстас бұрышты тап.` },
      tex: '', answer: `${ans}^\\circ`, values: [ans], steps: [kind === 'cross' ? `\\angle_1 = \\angle_2 = ${a}^\\circ` : `180^\\circ - ${a}^\\circ = ${ans}^\\circ`],
      mistakes: [mk(kind === 'cross' ? 180 - a : a, 'parallelPair', `${kind === 'cross' ? 180 - a : a}^\\circ`)],
    }
  }),

  // ---------------- functions (8) ----------------
  G('hyperbola-k', 'other-fn', 'easy', 8, (r) => {
    const a = nz(r, -6, 6), b = nz(r, -6, 6)
    return {
      text: { ru: `График функции y = k/x проходит через точку A(${a}; ${b}). Найди k.`, kz: `y = k/x функциясының графигі A(${a}; ${b}) нүктесі арқылы өтеді. k-ны тап.` },
      tex: '', answer: `k = ${a * b}`, values: [a * b], steps: [`${b} = \\dfrac{k}{${a < 0 ? `(${a})` : a}} \\Rightarrow k = ${a * b}`],
    }
  }),
  G('domain-frac', 'other-fn', 'easy', 8, (r) => {
    const a = nz(r, -9, 9), k = ri(r, 1, 5)
    return {
      text: { ru: `При каком значении x функция не определена?`, kz: `x-тің қандай мәнінде функция анықталмаған?` },
      tex: `y = \\dfrac{${k}}{x ${a < 0 ? '+' : '-'} ${Math.abs(a)}}`, answer: `x = ${a}`, values: [a], steps: [`x ${a < 0 ? '+' : '-'} ${Math.abs(a)} = 0 \\Rightarrow x = ${a}`],
      mistakes: [mk(-a, 'signMove', `x = ${-a}`)],
    }
  }),
  G('domain-sqrt', 'other-fn', 'medium', 8, (r) => {
    const k = ri(r, 2, 5), m = ri(r, 1, 6) * k * (r() < 0.5 ? -1 : 1), b = m // k·x − b ≥ 0 → x ≥ b/k
    const x0 = b / k
    return {
      text: { ru: `Найди наименьшее значение x из области определения функции.`, kz: `Функцияның анықталу облысындағы x-тің ең кіші мәнін тап.` },
      tex: `y = \\sqrt{${k}x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}`, answer: `x = ${x0}`, values: [x0], steps: [`${k}x ${b < 0 ? '+' : '-'} ${Math.abs(b)} \\ge 0 \\Rightarrow x \\ge ${x0}`],
      mistakes: [mk(-x0, 'signMove', `x = ${-x0}`)],
    }
  }),

  // ---------------- reduction formulas (10) ----------------
  G('reduction', 'trig-reduction', 'easy', 10, (r) => {
    const f = pick(r, ['sin', 'cos', 'tg'] as const)
    const base = pick(r, f === 'tg' ? [30, 45, 60] : [30, 45, 60])
    const shift = pick(r, f === 'tg' ? [180, 360] : [90, 180, 270, 360])
    const sign = shift === 360 ? -1 : pick(r, [1, -1])
    const d = shift + sign * base
    const v = clean(fnVal(f, d))
    const a = exactTex(v)
    return {
      text: calc, tex: `${FN[f]} ${d}^\\circ`, answer: a, values: [v],
      steps: [`${FN[f]} ${d}^\\circ = ${FN[f]}(${shift}^\\circ ${sign < 0 ? '-' : '+'} ${base}^\\circ) = ${a}`],
      mistakes: v ? [mkT(exactTex(-v), 'reduceSign', [-v])] : [],
      wrong: EXACT.map(([t]) => t).filter((t) => t !== a && t !== exactTex(-v)).sort(() => r() - 0.5).slice(0, 3),
    }
  }),

  // ---------------- addition formulas (10) ----------------
  G('addition-collapse', 'trig-addition', 'medium', 10, (r) => {
    const target = pick(r, [30, 45, 60, 90])
    const b = ri(r, 1, 4) * 5 + (target === 90 ? 5 : 0), plus = r() < 0.5
    const a = plus ? target - b : target + b
    const kind = pick(r, ['sin', 'cos'] as const)
    // sin a cos b ± cos a sin b = sin(a ± b); cos a cos b ∓ sin a sin b = cos(a ± b)
    const tex = kind === 'sin'
      ? `\\sin ${a}^\\circ \\cos ${b}^\\circ ${plus ? '+' : '-'} \\cos ${a}^\\circ \\sin ${b}^\\circ`
      : `\\cos ${a}^\\circ \\cos ${b}^\\circ ${plus ? '-' : '+'} \\sin ${a}^\\circ \\sin ${b}^\\circ`
    const v = clean(fnVal(kind, target)), ans = exactTex(v)
    const other = clean(fnVal(kind === 'sin' ? 'cos' : 'sin', target))
    return {
      text: calc, tex, answer: ans, values: [v],
      steps: [`${FN[kind]}(${a}^\\circ ${plus ? '+' : '-'} ${b}^\\circ) = ${FN[kind]} ${target}^\\circ = ${ans}`],
      mistakes: Math.abs(other - v) > 1e-9 ? [mkT(exactTex(other), 'additionFn', [other])] : [],
      wrong: ['\\dfrac{1}{2}', '\\dfrac{\\sqrt2}{2}', '\\dfrac{\\sqrt3}{2}', '1', '0'].filter((t) => t !== ans).slice(0, 3),
    }
  }),
  G('addition-75', 'trig-addition', 'hard', 10, (r) => {
    const [tex, v, ans, step] = pick(r, [
      ['\\sin 75^\\circ', Math.sin(rad(75)), '\\dfrac{\\sqrt6 + \\sqrt2}{4}', '\\sin(45^\\circ + 30^\\circ) = \\dfrac{\\sqrt2}{2}\\cdot\\dfrac{\\sqrt3}{2} + \\dfrac{\\sqrt2}{2}\\cdot\\dfrac{1}{2}'],
      ['\\cos 75^\\circ', Math.cos(rad(75)), '\\dfrac{\\sqrt6 - \\sqrt2}{4}', '\\cos(45^\\circ + 30^\\circ) = \\dfrac{\\sqrt2}{2}\\cdot\\dfrac{\\sqrt3}{2} - \\dfrac{\\sqrt2}{2}\\cdot\\dfrac{1}{2}'],
      ['\\sin 15^\\circ', Math.sin(rad(15)), '\\dfrac{\\sqrt6 - \\sqrt2}{4}', '\\sin(45^\\circ - 30^\\circ) = \\dfrac{\\sqrt2}{2}\\cdot\\dfrac{\\sqrt3}{2} - \\dfrac{\\sqrt2}{2}\\cdot\\dfrac{1}{2}'],
      ['\\cos 15^\\circ', Math.cos(rad(15)), '\\dfrac{\\sqrt6 + \\sqrt2}{4}', '\\cos(45^\\circ - 30^\\circ) = \\dfrac{\\sqrt2}{2}\\cdot\\dfrac{\\sqrt3}{2} + \\dfrac{\\sqrt2}{2}\\cdot\\dfrac{1}{2}'],
    ] as [string, number, string, string][])
    return {
      text: calc, tex, answer: ans, values: [v], steps: [step, ans],
      wrong: ['\\dfrac{\\sqrt6 + \\sqrt2}{4}', '\\dfrac{\\sqrt6 - \\sqrt2}{4}', '\\dfrac{\\sqrt3 + 1}{2}', '\\dfrac{\\sqrt2 + 1}{2}', '\\dfrac{\\sqrt3}{4}'].filter((x) => x !== ans),
    }
  }),

  // ---------------- double angle (10) ----------------
  G('double-angle', 'trig-double', 'medium', 10, (r) => {
    const [a, b, c] = pick(r, primitive)
    const what = pick(r, ['sin2', 'cos2'] as const)
    const s = a / c, co = b / c
    const v = what === 'sin2' ? 2 * s * co : co * co - s * s
    const ans = what === 'sin2' ? frac(2 * a * b, c * c) : frac(b * b - a * a, c * c)
    return {
      text: { ru: `sin α = ${a}/${c}, угол α острый. Найди ${what === 'sin2' ? 'sin 2α' : 'cos 2α'}.`, kz: `sin α = ${a}/${c}, α — сүйір бұрыш. ${what === 'sin2' ? 'sin 2α' : 'cos 2α'} тап.` },
      tex: '', answer: ans, values: [v],
      steps: [`\\cos\\alpha = \\sqrt{1 - \\tfrac{${a * a}}{${c * c}}} = ${frac(b, c)}`, what === 'sin2' ? `\\sin 2\\alpha = 2\\cdot${frac(a, c)}\\cdot${frac(b, c)} = ${ans}` : `\\cos 2\\alpha = ${frac(b * b, c * c)} - ${frac(a * a, c * c)} = ${ans}`],
      mistakes: what === 'sin2' ? [mkT(frac(2 * a, c), 'doubleAngle', [2 * s])] : [mkT(frac(2 * b, c), 'doubleAngle', [2 * co])],
    }
  }),

  // ---------------- sum to product (10) ----------------
  G('sum-product', 'trig-sum-product', 'hard', 10, (r) => {
    const [tex, ans, v, step] = pick(r, [
      ['\\sin 75^\\circ + \\sin 15^\\circ', '\\dfrac{\\sqrt6}{2}', Math.sqrt(6) / 2, '2\\sin 45^\\circ \\cos 30^\\circ'],
      ['\\cos 75^\\circ + \\cos 15^\\circ', '\\dfrac{\\sqrt6}{2}', Math.sqrt(6) / 2, '2\\cos 45^\\circ \\cos 30^\\circ'],
      ['\\sin 75^\\circ - \\sin 15^\\circ', '\\dfrac{\\sqrt2}{2}', Math.SQRT1_2, '2\\cos 45^\\circ \\sin 30^\\circ'],
      ['\\cos 15^\\circ - \\cos 75^\\circ', '\\dfrac{\\sqrt2}{2}', Math.SQRT1_2, '-2\\sin 45^\\circ \\sin(-30^\\circ)'],
      ['\\sin 105^\\circ + \\sin 15^\\circ', '\\dfrac{\\sqrt6}{2}', Math.sqrt(6) / 2, '2\\sin 60^\\circ \\cos 45^\\circ'],
      ['\\cos 105^\\circ + \\cos 15^\\circ', '\\dfrac{\\sqrt2}{2}', Math.SQRT1_2, '2\\cos 60^\\circ \\cos 45^\\circ'],
    ] as [string, string, number, string][])
    return { text: calc, tex, answer: ans, values: [v], steps: [`${step} = ${ans}`], wrong: ['\\dfrac{\\sqrt6}{2}', '\\dfrac{\\sqrt2}{2}', '\\dfrac{\\sqrt3}{2}', '1', '\\sqrt2'].filter((x) => x !== ans) }
  }),

  // ---------------- inverse trig (10) ----------------
  G('arc-value', 'inverse-trig', 'easy', 10, (r) => {
    // the last two items: a typical wrong answer (outside the range of the arc function) and its value
    const P = Math.PI
    const [tex, ans, v, wrong, wv] = pick(r, [
      ['\\arcsin \\dfrac{1}{2}', '\\dfrac{\\pi}{6}', P / 6, '\\dfrac{\\pi}{3}', P / 3],
      ['\\arccos \\dfrac{1}{2}', '\\dfrac{\\pi}{3}', P / 3, '\\dfrac{\\pi}{6}', P / 6],
      ['\\arccos\\left(-\\dfrac{1}{2}\\right)', '\\dfrac{2\\pi}{3}', (2 * P) / 3, '-\\dfrac{\\pi}{3}', -P / 3],
      ['\\arcsin\\left(-\\dfrac{\\sqrt2}{2}\\right)', '-\\dfrac{\\pi}{4}', -P / 4, '\\dfrac{3\\pi}{4}', (3 * P) / 4],
      ['\\arccos\\left(-\\dfrac{\\sqrt2}{2}\\right)', '\\dfrac{3\\pi}{4}', (3 * P) / 4, '-\\dfrac{\\pi}{4}', -P / 4],
      ['\\operatorname{arctg} \\sqrt3', '\\dfrac{\\pi}{3}', P / 3, '\\dfrac{\\pi}{6}', P / 6],
      ['\\operatorname{arctg}(-1)', '-\\dfrac{\\pi}{4}', -P / 4, '\\dfrac{3\\pi}{4}', (3 * P) / 4],
      ['\\arccos 0', '\\dfrac{\\pi}{2}', P / 2, '0', 0],
      ['\\arcsin 1', '\\dfrac{\\pi}{2}', P / 2, '\\pi', P],
      ['\\arccos(-1)', '\\pi', P, '-\\dfrac{\\pi}{2}', -P / 2],
      ['\\arccos \\dfrac{\\sqrt3}{2}', '\\dfrac{\\pi}{6}', P / 6, '\\dfrac{\\pi}{3}', P / 3],
    ] as [string, string, number, string, number][])
    return {
      text: calc, tex, answer: ans, values: [v], steps: [`${tex} = ${ans}`],
      mistakes: [mkT(wrong, 'arcRange', [wv])],
      wrong: ['\\dfrac{\\pi}{6}', '\\dfrac{\\pi}{4}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{2}', '\\dfrac{2\\pi}{3}', '-\\dfrac{\\pi}{6}'].filter((x) => x !== ans && x !== wrong).sort(() => r() - 0.5).slice(0, 3),
    }
  }),
  G('arc-expr', 'inverse-trig', 'medium', 10, (r) => {
    const [a, b, c] = pick(r, primitive)
    const kind = pick(r, ['sinarccos', 'cosarcsin', 'tgarccos'] as const)
    const tex = kind === 'sinarccos' ? `\\sin\\left(\\arccos \\dfrac{${a}}{${c}}\\right)` : kind === 'cosarcsin' ? `\\cos\\left(\\arcsin \\dfrac{${a}}{${c}}\\right)` : `\\operatorname{tg}\\left(\\arccos \\dfrac{${a}}{${c}}\\right)`
    const v = kind === 'tgarccos' ? b / a : b / c
    const ans = kind === 'tgarccos' ? frac(b, a) : frac(b, c)
    return {
      text: calc, tex, answer: ans, values: [v],
      steps: [`\\alpha = ${kind === 'cosarcsin' ? '\\arcsin' : '\\arccos'} \\dfrac{${a}}{${c}},\\ ${kind === 'cosarcsin' ? '\\cos' : '\\sin'}\\alpha = \\sqrt{1 - \\tfrac{${a * a}}{${c * c}}} = ${frac(b, c)}`, ...(kind === 'tgarccos' ? [`\\operatorname{tg}\\alpha = ${frac(b, c)} : ${frac(a, c)} = ${ans}`] : [])],
      mistakes: [mkT(frac(a, c), 'arcSame', [a / c])],
    }
  }),

  // ---------------- trig inequalities (10) ----------------
  G('trig-ineq', 'trig-inequalities', 'hard', 10, (r) => {
    const opts: [string, string, string][] = [
      ['\\sin x > \\dfrac{1}{2}', '\\dfrac{\\pi}{6} + 2\\pi n < x < \\dfrac{5\\pi}{6} + 2\\pi n', 'sin(x) > 1/2'],
      ['\\sin x < \\dfrac{1}{2}', '-\\dfrac{7\\pi}{6} + 2\\pi n < x < \\dfrac{\\pi}{6} + 2\\pi n', 'sin(x) < 1/2'],
      ['\\cos x > \\dfrac{1}{2}', '-\\dfrac{\\pi}{3} + 2\\pi n < x < \\dfrac{\\pi}{3} + 2\\pi n', 'cos(x) > 1/2'],
      ['\\cos x < 0', '\\dfrac{\\pi}{2} + 2\\pi n < x < \\dfrac{3\\pi}{2} + 2\\pi n', 'cos(x) < 0'],
      ['\\operatorname{tg} x > 1', '\\dfrac{\\pi}{4} + \\pi n < x < \\dfrac{\\pi}{2} + \\pi n', 'tg(x) > 1'],
      ['\\sin x \\ge 0', '2\\pi n \\le x \\le \\pi + 2\\pi n', 'sin(x) >= 0'],
    ]
    const [q, a, s] = pick(r, opts)
    return { text: { ru: 'Реши неравенство', kz: 'Теңсіздікті шеш' }, tex: q, answer: `${a},\\ n \\in \\mathbb{Z}`, solve: s, wrong: opts.filter((o) => o[1] !== a).map((o) => `${o[1]},\\ n \\in \\mathbb{Z}`).sort(() => r() - 0.5).slice(0, 4) }
  }),

  // ---------------- antiderivatives and integrals (11) ----------------
  G('antider', 'antiderivatives', 'easy', 11, (r) => {
    const k = ri(r, 1, 4), a = (k + 1) * ri(r, 1, 3), b = nz(r, -7, 7)
    const coef = a / (k + 1)
    const pw = (c: number, p: number) => `${c === 1 ? '' : c}x${p === 1 ? '' : `^{${p}}`}`
    const ans = `F(x) = ${pw(coef, k + 1)} ${b < 0 ? '-' : '+'} ${Math.abs(b)}x + C`
    return {
      text: { ru: 'Найди общий вид первообразных функции', kz: 'Функцияның алғашқы функцияларының жалпы түрін тап' },
      tex: `f(x) = ${pw(a, k)} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`, answer: ans,
      steps: [`\\int ${pw(a, k)}\\,dx = \\dfrac{${a}x^{${k + 1}}}{${k + 1}} = ${pw(coef, k + 1)}`, ans],
      mistakes: [mkT(`F(x) = ${pw(a, k + 1)} ${b < 0 ? '-' : '+'} ${Math.abs(b)}x + C`, 'integralHalf')],
      wrong: [`F(x) = ${k === 1 ? a : pw(a * k, k - 1)} + C`, `F(x) = ${pw(coef, k + 1)} ${b < 0 ? '-' : '+'} ${Math.abs(b)} + C`, `F(x) = ${pw(coef, k + 1)} ${b < 0 ? '-' : '+'} ${Math.abs(b)}x`],
    }
  }),
  G('antider-point', 'antiderivatives', 'medium', 11, (r) => {
    const a = nz(r, -3, 3), b = ri(r, -5, 5), x0 = ri(r, -2, 3), y0 = ri(r, -10, 10)
    const C = y0 - a * x0 * x0 - b * x0
    return {
      text: { ru: `Для функции f(x) найди первообразную, график которой проходит через точку M(${x0}; ${y0}). В ответ запиши значение C.`, kz: `f(x) функциясы үшін графигі M(${x0}; ${y0}) нүктесі арқылы өтетін алғашқы функцияны тап. Жауапқа C мәнін жаз.` },
      tex: `f(x) = ${2 * a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}`, answer: `C = ${C}`, values: [C],
      steps: [`F(x) = ${a === 1 ? '' : a === -1 ? '-' : a}x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x + C`, `${y0} = ${a * x0 * x0 + b * x0} + C \\Rightarrow C = ${C}`],
    }
  }),
  G('int-table', 'integrals-table', 'medium', 11, (r) => {
    const [tex, ans, v, step] = pick(r, [
      ['\\int_0^{\\pi} \\sin x\\,dx', '2', 2, '-\\cos x\\Big|_0^{\\pi} = 1 + 1'],
      ['\\int_0^{\\pi/2} \\cos x\\,dx', '1', 1, '\\sin x\\Big|_0^{\\pi/2} = 1 - 0'],
      ['\\int_0^{\\pi/2} \\sin x\\,dx', '1', 1, '-\\cos x\\Big|_0^{\\pi/2} = 0 + 1'],
      ['\\int_1^{e} \\dfrac{dx}{x}', '1', 1, '\\ln x\\Big|_1^{e} = 1 - 0'],
      ['\\int_0^{1} e^{x}\\,dx', 'e - 1', Math.E - 1, 'e^{x}\\Big|_0^{1} = e - 1'],
      ['\\int_0^{1} 3x^2\\,dx', '1', 1, 'x^3\\Big|_0^{1} = 1'],
      ['\\int_0^{2} x^3\\,dx', '4', 4, '\\dfrac{x^4}{4}\\Big|_0^{2} = 4'],
      ['\\int_1^{4} \\dfrac{dx}{2\\sqrt{x}}', '1', 1, '\\sqrt{x}\\Big|_1^{4} = 2 - 1'],
      ['\\int_0^{\\pi/4} \\dfrac{dx}{\\cos^2 x}', '1', 1, '\\operatorname{tg} x\\Big|_0^{\\pi/4} = 1'],
    ] as [string, string, number, string][])
    return { text: calc, tex, answer: ans, values: [v], steps: [step] }
  }),

  // ---------------- pyramids (11) ----------------
  G('pyr-volume', 'pyramids', 'easy', 11, (r) => {
    const a = ri(r, 2, 9), h = ri(r, 1, 6) * 3, V = (a * a * h) / 3
    return {
      text: { ru: `Основание пирамиды — квадрат со стороной ${a}, высота пирамиды ${h}. Найди объём пирамиды.`, kz: `Пирамиданың табаны — қабырғасы ${a} шаршы, пирамиданың биіктігі ${h}. Пирамиданың көлемін тап.` },
      tex: '', answer: String(V), values: [V], steps: [`V = \\dfrac{1}{3}\\cdot ${a}^2 \\cdot ${h} = ${V}`], mistakes: [mk(a * a * h, 'pyrThird')],
    }
  }),
  G('pyr-apothem', 'pyramids', 'medium', 11, (r) => {
    const [x, h, c] = pick(r, triples.filter(([p]) => p <= 9))
    return {
      text: { ru: `В правильной четырёхугольной пирамиде сторона основания равна ${2 * x}, высота — ${h}. Найди апофему.`, kz: `Дұрыс төртбұрышты пирамиданың табанының қабырғасы ${2 * x}, биіктігі ${h}. Апофеманы тап.` },
      tex: '', answer: String(c), values: [c], steps: [`\\tfrac{${2 * x}}{2} = ${x}`, `l = \\sqrt{${h}^2 + ${x}^2} = ${c}`],
    }
  }),

  // ---------------- complex numbers (11) ----------------
  G('complex-mul', 'complex', 'easy', 11, (r) => {
    const a = nz(r, -5, 5), b = nz(r, -5, 5), c = nz(r, -5, 5), d = nz(r, -5, 5)
    const z = (re: number, im: number) => `${re}${im < 0 ? ' - ' : ' + '}${Math.abs(im) === 1 ? '' : Math.abs(im)}i`
    const re = a * c - b * d, im = a * d + b * c
    return {
      text: calc, tex: `(${z(a, b)})(${z(c, d)})`, answer: z(re, im),
      steps: [`${a * c} ${par(a * d)}i ${par(b * c)}i ${par(b * d)}i^2`, `i^2 = -1 \\Rightarrow ${z(re, im)}`],
      mistakes: [mkT(z(a * c + b * d, im), 'complexI')],
      wrong: [z(a * c, b * d), z(re, -im), z(a + c, b + d)],
    }
  }),
  G('complex-mod', 'complex', 'easy', 11, (r) => {
    const [a, b, c] = pick(r, triples)
    const sa = pick(r, [1, -1]), sb = pick(r, [1, -1])
    return {
      text: { ru: 'Найди модуль комплексного числа', kz: 'Комплекс санның модулін тап' },
      tex: `z = ${sa * a} ${sb < 0 ? '-' : '+'} ${b}i`, answer: `|z| = ${c}`, values: [c], steps: [`|z| = \\sqrt{${a}^2 + ${b}^2} = ${c}`], mistakes: [mk(a + b, 'pythSum', `|z| = ${a + b}`)],
    }
  }),
]
