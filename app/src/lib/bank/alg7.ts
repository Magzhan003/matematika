/**
 * Algebra 7 by textbook paragraphs (Әбілқасымова А.Е. и др., «Мектеп», 2025): powers, monomials and
 * polynomials, functions, statistics, abbreviated multiplication, algebraic fractions.
 * Every task carries `verify` (statement = answer) — checked in scripts/check-alg7.ts.
 */
import { numTex } from '../calc/tools'
import { frac, gcd, mk, mkT, nz, pick, poly, ri, type Gen, type L, type Problem, type Rng } from './core'

type Body = Omit<Problem, 'gen' | 'topic' | 'level'>
const G = (id: string, topic: string, level: Gen['level'], grade: number, make: (r: Rng) => Body): Gen => ({
  id, topic, level, grade, make: (r) => ({ gen: id, topic, level, ...make(r) }),
})
const T = {
  calc: { ru: 'Вычисли', kz: 'Есепте' },
  simplify: { ru: 'Упрости выражение', kz: 'Өрнекті ықшамда' },
  expand: { ru: 'Раскрой скобки и приведи подобные слагаемые', kz: 'Жақшаны ашып, ұқсас мүшелерді келтір' },
  factor: { ru: 'Разложи на множители', kz: 'Көбейткіштерге жікте' },
  std: { ru: 'Запиши многочлен в стандартном виде', kz: 'Көпмүшені стандарт түрде жаз' },
  sub: { ru: 'Найди разность многочленов', kz: 'Көпмүшелердің айырымын тап' },
  reduce: { ru: 'Сократи дробь', kz: 'Бөлшекті қысқарт' },
} satisfies Record<string, L>
const n = numTex
/** A decimal as it is written in school: 7,2 (TeX «7{,}2» or plain text «7,2»), never as a fraction. */
const dec = (x: number, plain = false) => String(Number(x.toPrecision(10))).replace('.', plain ? ',' : '{,}')
const sg = (k: number) => (k < 0 ? `- ${Math.abs(k)}` : `+ ${k}`)
const one = (k: number, v: string) => (k === 1 ? v : k === -1 ? `-${v}` : `${k}${v}`)
const pw = (v: string, p: number) => (p === 1 ? v : `${v}^{${p}}`)
const lcm = (a: number, b: number) => (a * b) / gcd(a, b)

export const alg7Gens: Gen[] = [
  // ---------- I. Степень с целым показателем (§ 1–9) ----------
  G('a7-pow-nat', 'powers', 'easy', 7, (r) => {
    const [p, q] = pick(r, [[-2, 1], [2, 1], [-3, 1], [3, 1], [1, 2], [-1, 2], [2, 3], [-2, 3], [-1, 3]] as const)
    const k = q === 1 ? ri(r, 2, 5) : ri(r, 2, 4)
    const v = (p / q) ** k
    const base = q === 1 ? (p < 0 ? `(${p})` : String(p)) : `\\left(${p < 0 ? '-' : ''}\\dfrac{${Math.abs(p)}}{${q}}\\right)`
    const ans = frac(p ** k, q ** k)
    return {
      text: T.calc, tex: `${base}^{${k}}`, answer: ans, values: [v], steps: [`${Array(k).fill(base).join(' \\cdot ')} = ${ans}`],
      mistakes: [mkT(frac(p * k, q), 'powTimes', [(p * k) / q]), ...(p < 0 && k % 2 === 0 ? [mkT(frac(-(p ** k), q ** k), 'powSign', [-v])] : [])],
      verify: [`(${p}/${q})^${k}`, `${p ** k}/${q ** k}`],
    }
  }),
  G('a7-pow-mul', 'powers', 'easy', 7, (r) => {
    const v = pick(r, ['a', 'x', 'b', 'y']), m = ri(r, 2, 9), k = ri(r, 2, 9), c = ri(r, 0, 1) ? ri(r, 2, 6) : 1
    const ans = `${c === 1 ? '' : c}${v}^{${m + k}}`
    return {
      text: T.simplify, tex: `${c === 1 ? '' : c}${v}^{${m}} \\cdot ${v}^{${k}}`, answer: ans, steps: [`${v}^{${m} + ${k}} = ${v}^{${m + k}}`],
      mistakes: m * k !== m + k ? [mkT(`${c === 1 ? '' : c}${v}^{${m * k}}`, 'powMul')] : [],
      wrong: [`${c === 1 ? '' : c}${v}^{${m * k + 1}}`, `${c === 1 ? 2 : 2 * c}${v}^{${m + k}}`, `${c === 1 ? '' : c}${v}^{${Math.abs(m - k) || m + k + 1}}`],
      verify: [`${c}*${v}^${m}*${v}^${k}`, `${c}*${v}^${m + k}`],
    }
  }),
  G('a7-pow-div', 'powers', 'easy', 7, (r) => {
    const v = pick(r, ['a', 'x', 'c', 'm']), k = ri(r, 2, 6), d = ri(r, 1, 6), m = k + d
    return {
      text: T.simplify, tex: `${v}^{${m}} : ${v}^{${k}}`, answer: pw(v, d), steps: [`${v}^{${m} - ${k}} = ${pw(v, d)}`],
      mistakes: m % k === 0 && m / k !== d ? [mkT(pw(v, m / k), 'powDiv')] : [mkT(pw(v, m + k), 'powDiv')],
      wrong: [pw(v, m + k), pw(v, d + 1), `${v}^{${m * k}}`, '1'],
      verify: [`${v}^${m}/${v}^${k}`, `${v}^${d}`],
    }
  }),
  G('a7-pow-zero', 'powers', 'easy', 7, (r) => {
    const a = pick(r, ['7', '(-3)', '\\left(\\dfrac{2}{5}\\right)', '2025']), b = ri(r, 2, 12), c = ri(r, 2, 9)
    const v = b * 1 + 1
    return {
      text: T.calc, tex: `${b} \\cdot ${a}^{0} + (-${c})^{0}`, answer: String(v), values: [v], steps: [`${b} \\cdot 1 + 1 = ${v}`],
      mistakes: [mk(1, 'zeroPow'), mk(0, 'zeroPow')],
      verify: [`${b} * 1 + 1`, String(v)],
    }
  }),
  G('a7-pow-pow', 'powers', 'easy', 7, (r) => {
    const v = pick(r, ['a', 'x', 'y']), m = ri(r, 2, 6), k = ri(r, 2, 5)
    return {
      text: T.simplify, tex: `(${v}^{${m}})^{${k}}`, answer: pw(v, m * k), steps: [`${v}^{${m} \\cdot ${k}} = ${pw(v, m * k)}`],
      mistakes: m + k !== m * k ? [mkT(pw(v, m + k), 'powPow')] : [],
      wrong: [pw(v, m * k + 1), `${v}^{${m ** k}}`, `${k}${v}^{${m}}`],
      verify: [`(${v}^${m})^${k}`, `${v}^${m * k}`],
    }
  }),
  G('a7-pow-prod', 'powers', 'medium', 7, (r) => {
    const c = pick(r, [2, 3, -2, -1, 5]), m = ri(r, 1, 4), q = ri(r, 1, 3), k = ri(r, 2, 3)
    const C = c ** k
    const ans = `${one(C, `${pw('x', m * k)}${pw('y', q * k)}`)}`
    return {
      text: T.simplify, tex: `(${one(c, `${pw('x', m)}${pw('y', q)}`)})^{${k}}`, answer: ans, steps: [`(${c < 0 ? `(${c})` : c})^{${k}} \\cdot (${pw('x', m)})^{${k}} \\cdot (${pw('y', q)})^{${k}} = ${ans}`],
      mistakes: Math.abs(c) > 1 && c * k !== C ? [mkT(one(c * k, `${pw('x', m * k)}${pw('y', q * k)}`), 'powCoef')] : [],
      wrong: [one(C, `${pw('x', m + k)}${pw('y', q + k)}`), one(c, `${pw('x', m * k)}${pw('y', q * k)}`), one(-C, `${pw('x', m * k)}${pw('y', q * k)}`)],
      verify: [`(${c}*x^${m}*y^${q})^${k}`, `${C}*x^${m * k}*y^${q * k}`],
    }
  }),
  G('a7-pow-int', 'powers', 'medium', 7, (r) => {
    const a = pick(r, [2, 3, 5, 10]), m = ri(r, 2, 6), ee = nz(r, -2, 3), kk = m + ee
    const v = a ** ee
    return {
      text: T.calc, tex: `${a}^{-${m}} \\cdot ${a}^{${kk}}`, answer: frac(ee >= 0 ? a ** ee : 1, ee >= 0 ? 1 : a ** -ee), values: [v], steps: [`${a}^{-${m} + ${kk}} = ${a}^{${ee}} = ${frac(ee >= 0 ? a ** ee : 1, ee >= 0 ? 1 : a ** -ee)}`],
      mistakes: [mk(-v, 'negPower', n(-v))],
      verify: [`${a}^(-${m})*${a}^${kk}`, String(v)],
    }
  }),
  G('a7-pow-expr', 'powers', 'medium', 7, (r) => {
    const a = pick(r, [2, 3]), p = ri(r, 2, 3), q = ri(r, 2, 3), s = ri(r, 1, 4), e = p * q - s
    const v = a ** e
    return {
      text: T.calc, tex: `\\dfrac{(${a}^{${p}})^{${q}}}{${a}^{${s}}}`, answer: frac(e >= 0 ? a ** e : 1, e >= 0 ? 1 : a ** -e), values: [v], steps: [`\\dfrac{${a}^{${p * q}}}{${a}^{${s}}} = ${a}^{${e}}`],
      mistakes: p + q - s !== e ? [mk(a ** (p + q - s), 'powPow')] : [],
      verify: [`(${a}^${p})^${q}/${a}^${s}`, String(v)],
    }
  }),
  G('a7-standard', 'powers', 'medium', 7, (r) => {
    const m = ri(r, 11, 99) / 10, e = pick(r, [3, 4, 5, 6, -2, -3, -4]), N = Number((m * 10 ** e).toPrecision(6))
    const mt = dec(m)
    return {
      text: { ru: `Запиши число ${dec(N, true)} в стандартном виде.`, kz: `${dec(N, true)} санын стандарт түрде жаз.` }, tex: '',
      answer: `${mt} \\cdot 10^{${e}}`, steps: [`${dec(N)} = ${mt} \\cdot 10^{${e}}`, `1 \\le ${mt} < 10`],
      mistakes: [mkT(`${dec(Math.round(m * 10))} \\cdot 10^{${e - 1}}`, 'stdForm')],
      wrong: [`${mt} \\cdot 10^{${e + 1}}`, `${mt} \\cdot 10^{${e - 1}}`, `${mt} \\cdot 10^{${-e}}`],
      verify: [String(N), `${m}*10^${e}`],
    }
  }),

  // ---------- II. Многочлены (§ 10–17) ----------
  G('a7-mono-mul', 'polynomials', 'easy', 7, (r) => {
    const a = nz(r, -5, 5), b = nz(r, -4, 4), p = ri(r, 1, 4), q = ri(r, 1, 3)
    const ans = one(a * b, `${pw('x', p + 1)}${pw('y', q + 1)}`)
    return {
      text: { ru: 'Запиши одночлен в стандартном виде', kz: 'Бірмүшені стандарт түрде жаз' }, tex: `${one(a, `${pw('x', p)}y`)} \\cdot (${one(b, `x${pw('y', q)}`)})`, answer: ans,
      steps: [`${a < 0 ? `(${a})` : a} \\cdot ${b < 0 ? `(${b})` : b} \\cdot ${pw('x', p)} \\cdot x \\cdot y \\cdot ${pw('y', q)} = ${ans}`],
      mistakes: [mkT(one(a + b === 0 ? 1 : a + b, `${pw('x', p + 1)}${pw('y', q + 1)}`), 'monoCoef'), mkT(one(a * b, `${pw('x', p)}${pw('y', q)}`), 'powMul')],
      wrong: [one(-a * b, `${pw('x', p + 1)}${pw('y', q + 1)}`)],
      verify: [`${a}*x^${p}*y*(${b}*x*y^${q})`, `${a * b}*x^${p + 1}*y^${q + 1}`],
    }
  }),
  G('a7-mono-deg', 'polynomials', 'easy', 7, (r) => {
    const c = nz(r, -9, 9), p = ri(r, 1, 5), q = ri(r, 1, 4), s = ri(r, 0, 3)
    const d = p + q + s
    return {
      text: { ru: 'Найди степень одночлена', kz: 'Бірмүшенің дәрежесін тап' }, tex: one(c, `${pw('a', p)}${pw('b', q)}${s ? pw('c', s) : ''}`), answer: String(d), values: [d],
      steps: [`${p} + ${q}${s ? ` + ${s}` : ''} = ${d}`],
      mistakes: p * q * (s || 1) !== d ? [mk(p * q * (s || 1), 'monoDeg')] : [],
      verify: [String(p + q + s), String(d)],
    }
  }),
  G('a7-poly-std', 'polynomials', 'easy', 7, (r) => {
    const a = nz(r, -6, 6), b = nz(r, -8, 8), e = nz(r, -8, 8), d = ri(r, -9, 9)
    // the two x² terms must not cancel out
    let cc = nz(r, -6, 6); while (a + cc === 0) cc = nz(r, -6, 6)
    const A = a + cc
    const terms = [`${one(a, 'x^{2}')}`, `${sg(b)}x`, `${sg(cc)}x^{2}`, d ? sg(d) : '', `${sg(e)}x`].filter(Boolean)
    const tex = terms.join(' ').replace(/^\+ /, '').replace(/([+-]) 1x/g, '$1 x')
    return {
      text: T.std, tex, answer: poly([A, b + e, d]), steps: [`(${a} ${sg(cc)})x^{2} + (${b} ${sg(e)})x ${d ? sg(d) : ''} = ${poly([A, b + e, d])}`],
      mistakes: [mkT(poly([a, b + e, d]), 'likeTerms')],
      wrong: [poly([A, b - e, d]), poly([A, b + e, -d]), poly([A + 1, b + e, d])],
      verify: [`${a}*x^2 + ${b}*x + ${cc}*x^2 + ${d} + ${e}*x`, `${A}*x^2 + ${b + e}*x + ${d}`],
    }
  }),
  G('a7-poly-sub', 'polynomials', 'easy', 7, (r) => {
    const p = [nz(r, -5, 5), ri(r, -9, 9), ri(r, -9, 9)], q = [nz(r, -5, 5), nz(r, -9, 9), nz(r, -9, 9)]
    if (p[0] === q[0]) p[0] += 1
    const d = p.map((x, i) => x - q[i])
    const wrongSign = [p[0] - q[0], p[1] + q[1], p[2] + q[2]]
    return {
      text: T.sub, tex: `(${poly(p)}) - (${poly(q)})`, answer: poly(d), steps: [`${poly(p)} ${poly(q.map((x) => -x)).replace(/^(?!-)/, '+ ').replace(/^-/, '- ')} = ${poly(d)}`],
      mistakes: [mkT(poly(wrongSign), 'bracketSign')],
      wrong: [poly(p.map((x, i) => x + q[i])), poly([d[0], d[1], -d[2] || 1]), poly([d[0], -d[1] || 1, d[2]])],
      verify: [`(${p[0]}*x^2 + ${p[1]}*x + ${p[2]}) - (${q[0]}*x^2 + ${q[1]}*x + ${q[2]})`, `${d[0]}*x^2 + ${d[1]}*x + ${d[2]}`],
    }
  }),
  G('a7-poly-mul', 'polynomials', 'medium', 7, (r) => {
    const k = pick(r, [1, 1, 2, 3]), a = nz(r, -7, 7), b = nz(r, -7, 7)
    const res = [k, k * b + a, a * b]
    return {
      text: T.expand, tex: `(${one(k, 'x')} ${sg(a)})(x ${sg(b)})`, answer: poly(res), steps: [`${one(k, 'x^{2}')} ${sg(k * b)}x ${sg(a)}x ${sg(a * b)} = ${poly(res)}`],
      mistakes: k * b + a !== 0 ? [mkT(poly([k, 0, a * b]), 'polyMul')] : [],
      wrong: [poly([k, k * b - a, a * b]), poly([k, res[1], -a * b]), poly([k, a + b, a * b + 1])],
      verify: [`(${k}*x + ${a})*(x + ${b})`, `${res[0]}*x^2 + ${res[1]}*x + ${res[2]}`],
    }
  }),
  G('a7-poly-div', 'polynomials', 'easy', 7, (r) => {
    const k = pick(r, [2, 3, 4, 5, -2, -3]), c = [nz(r, -5, 5), nz(r, -6, 6), ri(r, -6, 6)]
    const top = [c[0] * k, c[1] * k, c[2] * k]
    return {
      text: { ru: 'Раздели многочлен на одночлен', kz: 'Көпмүшені бірмүшеге бөл' }, tex: `(${poly([...top, 0])}) : (${one(k, 'x')})`, answer: poly(c),
      steps: [`\\dfrac{${one(top[0], 'x^{3}')}}{${one(k, 'x')}} ${sg(top[1])}\\dfrac{x^{2}}{${one(k, 'x')}}${top[2] ? ` ${sg(top[2])}\\dfrac{x}{${one(k, 'x')}}` : ''} = ${poly(c)}`],
      mistakes: [mkT(poly([c[0], c[1], c[2], 0]), 'powDiv')],
      wrong: [poly([c[0], -c[1], c[2]]), poly([top[0], top[1], top[2]]), poly([c[0], c[1], c[2] + 1])],
      verify: [`(${top[0]}*x^3 + ${top[1]}*x^2 + ${top[2]}*x) / (${k}*x)`, `${c[0]}*x^2 + ${c[1]}*x + ${c[2]}`],
    }
  }),
  G('a7-factor-common', 'polynomials', 'easy', 7, (r) => {
    let m = ri(r, 1, 7), q = nz(r, -9, 9)
    while (gcd(m, q) !== 1) q += q > 0 ? 1 : -1
    const k = ri(r, 2, 6), v = pick(r, ['x', 'a', 'y'])
    const ans = `${k}${v}(${one(m, v)} ${sg(q)})`
    return {
      text: T.factor, tex: `${one(k * m, `${v}^{2}`)} ${sg(k * q)}${v}`, answer: ans, steps: [`${k}${v} \\cdot ${one(m, v)} ${sg(q)} \\cdot ${k}${v} = ${ans}`],
      mistakes: [mkT(`${k}(${one(m, `${v}^{2}`)} ${sg(q)}${v})`, 'commonFull')],
      wrong: [`${v}(${one(k * m, v)} ${sg(k * q)})`, `${k}${v}(${one(m, v)} ${sg(-q)})`, `${k}${v}(${one(m, `${v}^{2}`)} ${sg(q)})`],
      verify: [`${k * m}*${v}^2 + ${k * q}*${v}`, `${k}*${v}*(${m}*${v} + ${q})`],
    }
  }),
  G('a7-factor-group', 'polynomials', 'medium', 7, (r) => {
    const a = nz(r, -6, 6), b = nz(r, -6, 6)
    // (x + a)(y + b) = xy + bx + ay + ab
    const ans = `(x ${sg(a)})(y ${sg(b)})`
    return {
      text: T.factor, tex: `xy ${sg(b)}x ${sg(a)}y ${sg(a * b)}`.replace(/([+-]) 1([xy])/g, '$1 $2'), answer: ans,
      steps: [`x(y ${sg(b)}) ${sg(a)}(y ${sg(b)}) = ${ans}`],
      mistakes: a !== b ? [mkT(`(x ${sg(b)})(y ${sg(a)})`, 'groupSwap')] : [],
      wrong: [`(x ${sg(-a)})(y ${sg(-b)})`, `(x ${sg(a * b)})(y + 1)`, `(xy ${sg(a)})(1 ${sg(b)})`],
      verify: [`x*y + ${b}*x + ${a}*y + ${a * b}`, `(x + ${a})*(y + ${b})`],
    }
  }),
  G('a7-identity-value', 'polynomials', 'medium', 7, (r) => {
    const a = nz(r, -6, 6), x0 = pick(r, ['17{,}3', '-2{,}75', '1999', '0{,}125'])
    const v = a * a
    return {
      text: { ru: `Упрости выражение и найди его значение при x = ${x0.replace('{,}', ',')}.`, kz: `Өрнекті ықшамдап, x = ${x0.replace('{,}', ',')} болғандағы мәнін тап.` },
      tex: `(x ${sg(a)})^{2} - x(x ${sg(2 * a)})`, answer: String(v), values: [v],
      steps: [`x^{2} ${sg(2 * a)}x ${sg(a * a)} - x^{2} ${sg(-2 * a)}x = ${v}`],
      mistakes: [mk(-v, 'bracketSign')],
      verify: [`(x + ${a})^2 - x*(x + ${2 * a})`, String(v)],
    }
  }),

  // ---------- III. Функция (§ 18–27) ----------
  G('a7-fn-arg', 'linear-fn', 'easy', 7, (r) => {
    const k = nz(r, -5, 5), x = ri(r, -6, 6), b = ri(r, -9, 9), y = k * x + b
    return {
      text: { ru: `Функция задана формулой y = ${k}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}. При каком x значение функции равно ${y}?`, kz: `Функция y = ${k}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} формуласымен берілген. x-тің қандай мәнінде функцияның мәні ${y}-ге тең?` },
      tex: '', answer: `x = ${x}`, values: [x], steps: [`${k}x ${sg(b)} = ${y}`, `x = ${x}`],
      mistakes: k !== 1 && (y + b) % k === 0 && (y + b) / k !== x ? [mk((y + b) / k, 'signMove', `x = ${(y + b) / k}`)] : [],
      verify: [`(${y} - (${b})) / (${k})`, String(x)],
    }
  }),
  G('a7-fn-table', 'linear-fn', 'easy', 7, (r) => {
    const k = nz(r, -4, 4), b = ri(r, -6, 6), xs = [-1, 0, 1, 2, 3], miss = ri(r, 1, 4)
    const ys = xs.map((x) => k * x + b)
    return {
      text: { ru: `Функция задана таблицей и формулой y = ${k}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}. Найди пропущенное значение y.`, kz: `Функция кестемен және y = ${k}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} формуласымен берілген. y-тің жетіспейтін мәнін тап.` },
      tex: '', answer: String(ys[miss]), values: [ys[miss]], steps: [`y(${xs[miss]}) = ${k} \\cdot ${xs[miss] < 0 ? `(${xs[miss]})` : xs[miss]} ${sg(b)} = ${ys[miss]}`],
      visual: { kind: 'table', head: ['x', ...xs], rows: [['y', ...ys.map((y, i) => (i === miss ? '?' : y))]] },
      verify: [`${k}*${xs[miss]} + ${b}`, String(ys[miss])],
    }
  }),
  G('a7-lin-zero', 'linear-fn', 'easy', 7, (r) => {
    const k = nz(r, -5, 5), x = nz(r, -6, 6), b = -k * x
    return {
      text: { ru: `В какой точке график функции y = ${k}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} пересекает ось Ox? Запиши абсциссу точки.`, kz: `y = ${k}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} функциясының графигі Ox осін қай нүктеде қиып өтеді? Нүктенің абсциссасын жаз.` },
      tex: '', answer: `x = ${x}`, values: [x], steps: [`${k}x ${sg(b)} = 0`, `x = ${x}`],
      mistakes: [mk(-x, 'signMove', `x = ${-x}`)],
      verify: [`-(${b}) / (${k})`, String(x)],
    }
  }),
  G('a7-lines-meet', 'linear-fn', 'medium', 7, (r) => {
    const x = ri(r, -4, 4), y = ri(r, -6, 6), k1 = nz(r, -3, 3)
    let k2 = nz(r, -3, 3); if (k2 === k1) k2 = -k1 || 2
    const b1 = y - k1 * x, b2 = y - k2 * x
    const f = (k: number, b: number) => `y = ${one(k, 'x')} ${b ? sg(b) : ''}`.trim()
    return {
      text: { ru: 'Найди координаты точки пересечения графиков функций', kz: 'Функциялар графиктерінің қиылысу нүктесінің координаталарын тап' }, tex: `${f(k1, b1)};\\qquad ${f(k2, b2)}`,
      answer: `(${x};\\ ${y})`, values: [x, y], steps: [`${one(k1, 'x')} ${sg(b1)} = ${one(k2, 'x')} ${sg(b2)}`, `x = ${x},\\ y = ${y}`],
      wrong: [`(${y};\\ ${x})`, `(${-x};\\ ${y})`, `(${x};\\ ${-y || 1})`, `(${x + 1};\\ ${y})`],
      verify: [`${k1}*${x} + ${b1}`, `${k2}*${x} + ${b2}`],
    }
  }),
  G('a7-parab-a', 'quadratic-fn', 'easy', 7, (r) => {
    const a = nz(r, -3, 3), x = nz(r, -3, 3), y = a * x * x
    return {
      text: { ru: `График функции y = ax² проходит через точку A(${x}; ${y}). Найди a.`, kz: `y = ax² функциясының графигі A(${x}; ${y}) нүктесі арқылы өтеді. a-ны тап.` },
      tex: '', answer: `a = ${a}`, values: [a], steps: [`${y} = a \\cdot (${x})^{2}`, `a = ${frac(y, x * x)}`],
      mistakes: Math.abs(x) !== 1 && y % x === 0 ? [mk(y / x, 'parabSquare', `a = ${y / x}`)] : [],
      verify: [`${y} / (${x})^2`, String(a)],
    }
  }),
  G('a7-cubic-val', 'other-fn', 'easy', 7, (r) => {
    const a = pick(r, [1, 2, -1, -2, 3]), x = nz(r, -3, 3), y = a * x ** 3
    return {
      text: { ru: `Функция задана формулой y = ${a === 1 ? '' : a === -1 ? '−' : a}x³. Найди y при x = ${x}.`, kz: `Функция y = ${a === 1 ? '' : a === -1 ? '−' : a}x³ формуласымен берілген. x = ${x} болғанда y-ті тап.` },
      tex: '', answer: String(y), values: [y], steps: [`y = ${a === 1 ? '' : `${a} \\cdot `}(${x})^{3} = ${y}`],
      mistakes: a * 3 * x !== y ? [mk(a * 3 * x, 'cubeTimes3')] : [],
      verify: [`${a}*(${x})^3`, String(y)],
    }
  }),

  // ---------- IV. Элементы статистики (§ 28–30) ----------
  G('a7-stat-range', 'statistics', 'easy', 7, (r) => {
    const xs = Array.from({ length: ri(r, 6, 9) }, () => ri(r, 3, 40))
    const R = Math.max(...xs) - Math.min(...xs)
    return {
      text: { ru: `Найди размах ряда: ${xs.join('; ')}.`, kz: `Қатардың құлашын тап: ${xs.join('; ')}.` }, tex: '', answer: String(R), values: [R],
      steps: [`${Math.max(...xs)} - ${Math.min(...xs)} = ${R}`],
      mistakes: Math.abs(xs[xs.length - 1] - xs[0]) !== R ? [mk(Math.abs(xs[xs.length - 1] - xs[0]), 'rangeSort')] : [],
      verify: [`${Math.max(...xs)} - ${Math.min(...xs)}`, String(R)],
    }
  }),
  G('a7-stat-mode', 'statistics', 'easy', 7, (r) => {
    const mode = ri(r, 2, 9)
    const others = Array.from({ length: 5 }, () => ri(r, 1, 12)).filter((x) => x !== mode)
    const uniq = [...new Set(others)]
    const xs = [...uniq, mode, mode, mode].sort(() => r() - 0.5)
    return {
      text: { ru: `Найди моду ряда: ${xs.join('; ')}.`, kz: `Қатардың модасын тап: ${xs.join('; ')}.` }, tex: '', answer: String(mode), values: [mode],
      steps: [`${mode}\\ \\text{— 3 раза}`],
      verify: [String(mode), String(mode)],
    }
  }),
  G('a7-rel-freq', 'statistics', 'easy', 7, (r) => {
    const N = pick(r, [20, 25, 40, 50]), k = ri(r, 2, N / 2), mark = pick(r, ['5', '4', '3'])
    const p = (k / N) * 100
    return {
      text: { ru: `Контрольную писали ${N} учеников, оценку «${mark}» получили ${k} из них. Найди относительную частоту оценки «${mark}» (в процентах).`, kz: `Бақылау жұмысын ${N} оқушы жазды, оның ${k}-і «${mark}» алды. «${mark}» бағасының салыстырмалы жиілігін тап (пайызбен).` },
      tex: '', answer: `${dec(p)}\\%`, values: [p], steps: [`\\dfrac{${k}}{${N}} \\cdot 100\\% = ${dec(p)}\\%`],
      mistakes: [mk(k, 'relFreq', `${k}\\%`)],
      verify: [`${k}/${N}*100`, String(p)],
    }
  }),

  // ---------- V. Формулы сокращённого умножения (§ 31–36) ----------
  G('a7-diff-sq-num', 'short-mult', 'easy', 7, (r) => {
    const a = ri(r, 31, 99), b = a - pick(r, [2, 4, 6, 10, 20]), v = a * a - b * b
    return {
      text: T.calc, tex: `${a}^{2} - ${b}^{2}`, answer: String(v), values: [v], steps: [`(${a} - ${b})(${a} + ${b}) = ${a - b} \\cdot ${a + b} = ${v}`],
      mistakes: [mk((a - b) ** 2, 'diffSquares')],
      verify: [`${a}^2 - ${b}^2`, String(v)],
    }
  }),
  G('a7-diff-sq-mul', 'short-mult', 'easy', 7, (r) => {
    const k = pick(r, [1, 2, 3, 5]), a = ri(r, 1, 9), v = pick(r, ['x', 'a', 'y'])
    const kv = one(k, v)
    return {
      text: { ru: 'Выполни умножение', kz: 'Көбейтуді орында' }, tex: `(${kv} - ${a})(${kv} + ${a})`, answer: `${one(k * k, `${v}^{2}`)} - ${a * a}`,
      steps: [`(${kv})^{2} - ${a}^{2} = ${one(k * k, `${v}^{2}`)} - ${a * a}`],
      mistakes: [mkT(`${one(k * k, `${v}^{2}`)} + ${a * a}`, 'diffSign')],
      wrong: [`${one(k, `${v}^{2}`)} - ${a * a}`, `${one(k * k, `${v}^{2}`)} - ${2 * a}`, `${one(k * k, `${v}^{2}`)} - ${2 * k * a}${v} - ${a * a}`],
      verify: [`(${k}*${v} - ${a})*(${k}*${v} + ${a})`, `${k * k}*${v}^2 - ${a * a}`],
    }
  }),
  G('a7-sq-num', 'short-mult', 'easy', 7, (r) => {
    const base = pick(r, [10, 20, 30, 50, 100]), d = pick(r, [1, 2, -1, -2, 3]), x = base + d, v = x * x
    return {
      text: { ru: 'Вычисли с помощью формул сокращённого умножения', kz: 'Қысқаша көбейту формулаларының көмегімен есепте' }, tex: `${x}^{2}`, answer: String(v), values: [v],
      steps: [`(${base} ${sg(d)})^{2} = ${base * base} ${sg(2 * base * d)} ${sg(d * d)} = ${v}`],
      mistakes: [mk(base * base + d * Math.abs(d), 'square2ab')],
      verify: [`(${base} + ${d})^2`, String(v)],
    }
  }),
  G('a7-cube-sum', 'short-mult', 'medium', 7, (r) => {
    const a = nz(r, -4, 4), res = [1, 3 * a, 3 * a * a, a ** 3]
    return {
      text: T.expand, tex: `(x ${sg(a)})^{3}`, answer: poly(res), steps: [`x^{3} + 3 \\cdot x^{2} \\cdot ${a < 0 ? `(${a})` : a} + 3 \\cdot x \\cdot ${a < 0 ? `(${a})` : a}^{2} ${sg(a ** 3)}`, poly(res)],
      mistakes: [mkT(poly([1, 0, 0, a ** 3]), 'cubeSum')],
      wrong: [poly([1, a, a * a, a ** 3]), poly([1, 3 * a, -3 * a * a, a ** 3]), poly([1, 3 * a, 3 * a * a, 3 * a])],
      verify: [`(x + ${a})^3`, `x^3 + ${3 * a}*x^2 + ${3 * a * a}*x + ${a ** 3}`],
    }
  }),
  G('a7-cubes-factor', 'short-mult', 'medium', 7, (r) => {
    const a = ri(r, 1, 5), plus = r() < 0.5
    const ans = plus ? `(x + ${a})(x^{2} - ${one(a, 'x')} + ${a * a})` : `(x - ${a})(x^{2} + ${one(a, 'x')} + ${a * a})`
    return {
      text: T.factor, tex: `x^{3} ${plus ? '+' : '-'} ${a ** 3}`, answer: ans,
      steps: [`x^{3} ${plus ? '+' : '-'} ${a}^{3} = ${ans}`],
      mistakes: [mkT(plus ? `(x + ${a})(x^{2} + ${one(a, 'x')} + ${a * a})` : `(x - ${a})(x^{2} - ${one(a, 'x')} + ${a * a})`, 'cubesSign')],
      wrong: [plus ? `(x + ${a})^{3}` : `(x - ${a})^{3}`, plus ? `(x + ${a})(x^{2} - ${one(2 * a, 'x')} + ${a * a})` : `(x - ${a})(x^{2} + ${one(2 * a, 'x')} + ${a * a})`, plus ? `(x - ${a})(x^{2} + ${one(a, 'x')} + ${a * a})` : `(x + ${a})(x^{2} - ${one(a, 'x')} + ${a * a})`],
      verify: [`x^3 ${plus ? '+' : '-'} ${a ** 3}`, plus ? `(x + ${a})*(x^2 - ${a}*x + ${a * a})` : `(x - ${a})*(x^2 + ${a}*x + ${a * a})`],
    }
  }),
  G('a7-fsu-simplify', 'short-mult', 'medium', 7, (r) => {
    const a = ri(r, 1, 7), minus = r() < 0.5
    const ans = minus ? one(4 * a, 'x') : `2x^{2} + ${2 * a * a}`
    return {
      text: T.simplify, tex: `(x + ${a})^{2} ${minus ? '-' : '+'} (x - ${a})^{2}`, answer: ans,
      steps: [`(x^{2} + ${2 * a}x + ${a * a}) ${minus ? '-' : '+'} (x^{2} - ${2 * a}x + ${a * a}) = ${ans}`],
      mistakes: [mkT(minus ? '0' : `2x^{2}`, 'square2ab')],
      wrong: minus ? [`${2 * a}x`, `${4 * a * a}`, `2x^{2} + ${2 * a * a}`] : [one(4 * a, 'x'), `2x^{2} + ${a * a}`, `2x^{2} + ${4 * a}x + ${2 * a * a}`],
      verify: [`(x + ${a})^2 ${minus ? '-' : '+'} (x - ${a})^2`, minus ? `${4 * a}*x` : `2*x^2 + ${2 * a * a}`],
    }
  }),
  G('a7-word-sum', 'word-problems', 'medium', 7, (r) => {
    const kind = pick(r, ['nums', 'age', 'books'] as const)
    if (kind === 'age') {
      const s = ri(r, 6, 14), k = ri(r, 3, 5), S = s * (k + 1)
      return {
        text: { ru: `Отец старше сына в ${k} раза, а вместе им ${S} лет. Сколько лет сыну?`, kz: `Әкесі баласынан ${k} есе үлкен, ал екеуінің жасының қосындысы ${S}. Баласы неше жаста?` },
        tex: '', answer: String(s), values: [s], steps: [`x + ${k}x = ${S}`, `${k + 1}x = ${S},\\ x = ${s}`], mistakes: [mk(S / k, 'wordParts')], verify: [`${S}/${k + 1}`, String(s)],
      }
    }
    const small = ri(r, 12, 60), d = ri(r, 3, 25), S = 2 * small + d
    return kind === 'nums'
      ? { text: { ru: `Сумма двух чисел равна ${S}, а одно из них на ${d} больше другого. Найди большее число.`, kz: `Екі санның қосындысы ${S}, ал біреуі екіншісінен ${d}-ге артық. Үлкен санды тап.` }, tex: '', answer: String(small + d), values: [small + d], steps: [`x + (x + ${d}) = ${S}`, `x = ${small},\\ x + ${d} = ${small + d}`], mistakes: [mk(small, 'wordParts')], verify: [`(${S} + ${d})/2`, String(small + d)] }
      : { text: { ru: `На двух полках ${S} книг. На первой на ${d} книг больше, чем на второй. Сколько книг на второй полке?`, kz: `Екі сөреде ${S} кітап бар. Біріншісінде екіншісіне қарағанда ${d} кітап артық. Екінші сөреде неше кітап бар?` }, tex: '', answer: String(small), values: [small], steps: [`x + (x + ${d}) = ${S}`, `2x = ${S - d},\\ x = ${small}`], mistakes: [mk(small + d, 'wordParts')], verify: [`(${S} - ${d})/2`, String(small)] }
  }),

  // ---------- VI. Алгебраические дроби (§ 37–41) ----------
  G('a7-afrac-domain', 'alg-fractions', 'easy', 7, (r) => {
    const a = nz(r, -9, 9), b = nz(r, -9, 9)
    const B = b === -a ? b + 1 : b
    return {
      text: { ru: 'При каком значении x дробь не имеет смысла?', kz: 'x-тің қандай мәнінде бөлшектің мағынасы болмайды?' }, tex: `\\dfrac{x ${sg(a)}}{x ${sg(-B)}}`, answer: `x = ${B}`, values: [B],
      steps: [`x ${sg(-B)} = 0 \\Rightarrow x = ${B}`],
      mistakes: [mk(-a, 'fracZeroDen', `x = ${-a}`), mk(-B, 'signMove', `x = ${-B}`)],
      // the root of the denominator x − B
      verify: [`-(${-B})`, String(B)],
    }
  }),
  G('a7-afrac-value', 'alg-fractions', 'easy', 7, (r) => {
    const x0 = ri(r, -4, 5), a = ri(r, -9, 9), b = nz(r, -6, 6)
    const den = x0 + b === 0 ? b + 1 : b
    const num = x0 * x0 + a, d = x0 + den
    return {
      text: { ru: `Найди значение дроби при x = ${x0}.`, kz: `x = ${x0} болғандағы бөлшектің мәнін тап.` }, tex: `\\dfrac{x^{2} ${a ? sg(a) : ''}}{x ${sg(den)}}`, answer: frac(num, d), values: [num / d],
      steps: [`\\dfrac{${x0 < 0 ? `(${x0})` : x0}^{2} ${a ? sg(a) : ''}}{${x0} ${sg(den)}} = \\dfrac{${num}}{${d}} = ${frac(num, d)}`],
      mistakes: x0 < 0 ? [mkT(frac(-x0 * x0 + a, d), 'powSign', [(-x0 * x0 + a) / d])] : [],
      verify: [`((${x0})^2 + (${a}))/((${x0}) + (${den}))`, `${num}/${d}`],
    }
  }),
  G('a7-afrac-reduce', 'alg-fractions', 'medium', 7, (r) => {
    const kind = pick(r, ['diff', 'square', 'mono'] as const), a = ri(r, 1, 9)
    if (kind === 'mono') {
      const p = ri(r, 2, 9), q = ri(r, 2, 9), g = gcd(p, q), P = p / g, Q = q / g
      const top = `${P === 1 ? '' : P}x`, bot = `${Q === 1 ? '' : Q}y`
      const ans = `\\dfrac{${top}}{${bot}}`
      return {
        text: T.reduce, tex: `\\dfrac{${p}x^{2}y}{${q}xy^{2}}`, answer: ans, steps: [`\\dfrac{${g}xy \\cdot ${top}}{${g}xy \\cdot ${bot}} = ${ans}`],
        wrong: [`\\dfrac{${bot}}{${top}}`, `${P === 1 ? '' : P}xy`, `\\dfrac{${P === 1 ? '' : P}x^{2}}{${Q === 1 ? '' : Q}y^{2}}`],
        verify: [`(${p}*x^2*y)/(${q}*x*y^2)`, `(${P}*x)/(${Q}*y)`],
      }
    }
    if (kind === 'diff') {
      return {
        text: T.reduce, tex: `\\dfrac{x^{2} - ${a * a}}{x + ${a}}`, answer: `x - ${a}`, steps: [`\\dfrac{(x - ${a})(x + ${a})}{x + ${a}} = x - ${a}`],
        mistakes: [mkT(`x - ${a * a}`, 'fracCancel')],
        wrong: [`x + ${a}`, `x^{2} - ${a}`, `\\dfrac{1}{x - ${a}}`],
        verify: [`(x^2 - ${a * a})/(x + ${a})`, `x - ${a}`],
      }
    }
    return {
      text: T.reduce, tex: `\\dfrac{x^{2} - ${2 * a}x + ${a * a}}{x - ${a}}`, answer: `x - ${a}`, steps: [`\\dfrac{(x - ${a})^{2}}{x - ${a}} = x - ${a}`],
      mistakes: [mkT(`x - ${2 * a}`, 'fracCancel')],
      wrong: [`x + ${a}`, `(x - ${a})^{2}`, `\\dfrac{1}{x - ${a}}`],
      verify: [`(x^2 - ${2 * a}*x + ${a * a})/(x - ${a})`, `x - ${a}`],
    }
  }),
  G('a7-afrac-add', 'alg-fractions', 'medium', 7, (r) => {
    const p = pick(r, [2, 3, 4, 5]), q = pick(r, [3, 4, 6, 7].filter((x) => x !== p)), a = ri(r, 1, 7), b = ri(r, 1, 7)
    const Lm = lcm(p, q), N = a * (Lm / p) + b * (Lm / q), g = gcd(N, Lm)
    const ans = Lm / g === 1 ? `\\dfrac{${N / g}}{x}` : `\\dfrac{${N / g}}{${Lm / g}x}`
    return {
      text: { ru: 'Выполни сложение', kz: 'Қосуды орында' }, tex: `\\dfrac{${a}}{${p}x} + \\dfrac{${b}}{${q}x}`, answer: ans,
      steps: [`\\dfrac{${a} \\cdot ${Lm / p} + ${b} \\cdot ${Lm / q}}{${Lm}x} = \\dfrac{${N}}{${Lm}x}${g > 1 ? ` = ${ans}` : ''}`],
      mistakes: [mkT(`\\dfrac{${a + b}}{${p + q}x}`, 'fracAdd')],
      wrong: [`\\dfrac{${a + b}}{${Lm}x}`, `\\dfrac{${a * b}}{${p * q}x}`, `\\dfrac{${N}}{${Lm}x^{2}}`],
      verify: [`${a}/(${p}*x) + ${b}/(${q}*x)`, `${N / g}/(${Lm / g}*x)`],
    }
  }),
  G('a7-afrac-mul', 'alg-fractions', 'medium', 7, (r) => {
    const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 9), d = ri(r, 2, 9), div = r() < 0.5
    // a x / (b y) · c y² / (d x²) = ac y / (bd x);  a x / (b y) : d x² / (c y²) = the same
    const N = a * c, D = b * d, g = gcd(N, D)
    const ans = `\\dfrac{${N / g === 1 ? '' : N / g}y}{${D / g === 1 ? '' : D / g}x}`
    const second = div ? `\\dfrac{${d}x^{2}}{${c}y^{2}}` : `\\dfrac{${c}y^{2}}{${d}x^{2}}`
    return {
      text: { ru: div ? 'Выполни деление' : 'Выполни умножение', kz: div ? 'Бөлуді орында' : 'Көбейтуді орында' }, tex: `\\dfrac{${a}x}{${b}y} ${div ? ':' : '\\cdot'} ${second}`, answer: ans,
      steps: [`${div ? `\\dfrac{${a}x}{${b}y} \\cdot \\dfrac{${c}y^{2}}{${d}x^{2}} = ` : ''}\\dfrac{${N}xy^{2}}{${D}x^{2}y} = ${ans}`],
      mistakes: div ? [mkT(`\\dfrac{${(a * d) / gcd(a * d, b * c) === 1 ? '' : (a * d) / gcd(a * d, b * c)}x^{3}}{${(b * c) / gcd(a * d, b * c) === 1 ? '' : (b * c) / gcd(a * d, b * c)}y^{3}}`, 'fracDiv')] : [],
      wrong: [`\\dfrac{${D / g === 1 ? '' : D / g}x}{${N / g === 1 ? '' : N / g}y}`, `\\dfrac{${N}y^{2}}{${D}x^{2}}`, `\\dfrac{${N / g === 1 ? '' : N / g}}{${D / g === 1 ? '' : D / g}}`],
      verify: [`(${a}*x)/(${b}*y) ${div ? '/' : '*'} (${div ? `(${d}*x^2)/(${c}*y^2)` : `(${c}*y^2)/(${d}*x^2)`})`, `(${N}*y)/(${D}*x)`],
    }
  }),
  G('a7-afrac-value2', 'alg-fractions', 'hard', 7, (r) => {
    const a = ri(r, 1, 6), x0 = pick(r, [a + 1, a + 2, a + 5, 10, 12, -1 - a])
    const v = x0 - a
    return {
      text: { ru: `Упрости выражение и найди его значение при x = ${x0}.`, kz: `Өрнекті ықшамдап, x = ${x0} болғандағы мәнін тап.` },
      tex: `\\dfrac{x^{2} - ${a * a}}{x} \\cdot \\dfrac{x}{x + ${a}}`, answer: String(v), values: [v],
      steps: [`\\dfrac{(x - ${a})(x + ${a}) \\cdot x}{x \\cdot (x + ${a})} = x - ${a}`, `${x0} - ${a} = ${v}`],
      mistakes: [mk(x0 - a * a, 'fracCancel')],
      verify: [`((${x0})^2 - ${a * a})/(${x0}) * (${x0})/((${x0}) + ${a})`, String(v)],
    }
  }),
]
