/**
 * Independent check of the new generators (src/lib/bank/extra.ts): npx tsx scripts/check-extra-gens.ts
 * The statement TeX and the answer TeX are evaluated with mathjs and compared with the stored value;
 * integrals are checked by numeric integration, word problems by the numbers in the text.
 */
import katex from 'katex'
import { create, all } from 'mathjs'
import { extraGens } from '../src/lib/bank/extra'
import { choices, findMistake, seeded } from '../src/lib/bank'
import { ruMore, kzMore } from '../src/i18n-more'

const math = create(all)
const texToJs = (t: string) => {
  let s = t.replace(/\\left|\\right|\\,|\\Big\|.*$/g, '').replace(/[a-zA-Z|]+\(x\) = |\|z\| = |[xkC] = /, '')
  for (let k = 0; k < 4; k++) s = s.replace(/\\[dt]frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\\sqrt(\d)/g, 'sqrt($1)')
    .replace(/(\d+)\^\\circ/g, '($1 deg)').replace(/\\operatorname\{tg\}/g, 'tan').replace(/\\operatorname\{arctg\}/g, 'atan')
    .replace(/\\arcsin/g, 'asin').replace(/\\arccos/g, 'acos').replace(/\\sin/g, 'sin').replace(/\\cos/g, 'cos')
    .replace(/\\cdot/g, '*').replace(/\\pi/g, 'pi').replace(/\{|\}/g, '')
  // function without parentheses: sin (75 deg) is fine, asin 1 needs (1)
  s = s.replace(/\b(asin|acos|atan|sin|cos|tan)\s+([^\s()+*/-][^\s+*/-]*)/g, '$1($2)')
  return s
}
const ev = (t: string) => math.evaluate(texToJs(t))
const close = (a: unknown, b: unknown) => {
  const A = math.complex(a as never), B = math.complex(b as never)
  return Math.abs(A.re - B.re) < 1e-7 && Math.abs(A.im - B.im) < 1e-7
}
const simpson = (f: (x: number) => number, a: number, b: number, n = 2000) => {
  const h = (b - a) / n; let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}
const INT: Record<string, () => number> = {
  '\\int_0^{\\pi} \\sin x\\,dx': () => simpson(Math.sin, 0, Math.PI),
  '\\int_0^{\\pi/2} \\cos x\\,dx': () => simpson(Math.cos, 0, Math.PI / 2),
  '\\int_0^{\\pi/2} \\sin x\\,dx': () => simpson(Math.sin, 0, Math.PI / 2),
  '\\int_1^{e} \\dfrac{dx}{x}': () => simpson((x) => 1 / x, 1, Math.E),
  '\\int_0^{1} e^{x}\\,dx': () => simpson(Math.exp, 0, 1),
  '\\int_0^{1} 3x^2\\,dx': () => simpson((x) => 3 * x * x, 0, 1),
  '\\int_0^{2} x^3\\,dx': () => simpson((x) => x ** 3, 0, 2),
  '\\int_1^{4} \\dfrac{dx}{2\\sqrt{x}}': () => simpson((x) => 1 / (2 * Math.sqrt(x)), 1, 4),
  '\\int_0^{\\pi/4} \\dfrac{dx}{\\cos^2 x}': () => simpson((x) => 1 / Math.cos(x) ** 2, 0, Math.PI / 4),
}
const nums = (s: string) => (s.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)

let bad = 0, checked = 0
const fail = (id: string, msg: string) => { if (bad < 40) console.log('✗', id, msg); bad++ }
for (const g of extraGens) {
  const r = seeded(11)
  for (let k = 0; k < 300; k++) {
    const p = g.make(r)
    const v = p.values?.[0]
    for (const t of [p.tex, p.answer, ...(p.steps ?? []), ...(p.wrong ?? []), ...(p.mistakes ?? []).map((m) => m.tex)]) {
      if (!t) continue
      try { katex.renderToString(t, { throwOnError: true }) } catch { fail(g.id, `bad TeX ${t}`) }
    }
    const ch = choices(p, r)
    if (ch.options.length < 4) fail(g.id, `only ${ch.options.length} options`)
    for (const m of p.mistakes ?? []) {
      if (!(ruMore.mist as Record<string, string>)[m.why] || !(kzMore.mist as Record<string, string>)[m.why]) fail(g.id, `no text for mistake ${m.why}`)
      if (m.tex !== p.answer && !findMistake(p, { picked: m.tex })) fail(g.id, `mistake ${m.tex} not found`)
      if (v !== undefined && m.values && Math.abs(m.values[0] - v) < 1e-9) fail(g.id, `mistake equals answer ${m.tex}`)
    }
    const text = p.text.ru
    try {
      switch (g.id) {
        case 'adj-angle': { const [a] = nums(text); if (v !== 180 - a) fail(g.id, text); break }
        case 'vert-angles': { const [s] = nums(text); if (v !== Math.max(180 - s / 2, s / 2)) fail(g.id, text); break }
        case 'parallel-angles': { const [a] = nums(text); if (v !== (text.includes('накрест') ? a : 180 - a)) fail(g.id, text); break }
        case 'hyperbola-k': { const [x, y] = nums(text); if (v !== x * y) fail(g.id, text); break }
        case 'domain-frac': { const f = (x: number) => math.evaluate(texToJs(p.tex.replace('y = ', '')), { x }); if (Number.isFinite(f(v!))) fail(g.id, p.tex); break }
        case 'domain-sqrt': {
          const inner = p.tex.match(/\\sqrt\{(.*)\}/)![1].replace(/(\d)x/, '$1*x')
          const f = (x: number) => math.evaluate(inner, { x }) as number
          if (Math.abs(f(v!)) > 1e-9 || f(v! - 0.01) >= 0) fail(g.id, p.tex); break
        }
        case 'double-angle': {
          const [a, c] = nums(text); const al = Math.asin(a / c)
          const want = text.includes('sin 2α') ? Math.sin(2 * al) : Math.cos(2 * al)
          if (Math.abs(want - v!) > 1e-9 || !close(ev(p.answer), v)) fail(g.id, text); break
        }
        case 'antider': {
          // F'(x) = f(x): differentiate the answer and compare at a few points
          const F = p.answer.replace('F(x) = ', '').replace(' + C', '').replace(/\^\{(\d+)\}/g, '^$1').replace(/(\d)x/g, '$1*x')
          const f = p.tex.replace('f(x) = ', '').replace(/\^\{(\d+)\}/g, '^$1').replace(/(\d)x/g, '$1*x')
          const d = math.derivative(F, 'x')
          for (const x of [-2, 0.5, 3]) if (Math.abs(d.evaluate({ x }) - math.evaluate(f, { x })) > 1e-9) fail(g.id, `${p.tex} → ${p.answer}`)
          break
        }
        case 'antider-point': {
          const [x0, y0] = nums(text.match(/M\((.*)\)/)![1].replace(';', ' '))
          const [a2, b] = nums(p.tex.replace('f(x) = ', '').replace(/ - /, ' -').replace(/ \+ /, ' '))
          if (Math.abs((a2 / 2) * x0 * x0 + b * x0 + v! - y0) > 1e-9) fail(g.id, `${p.tex} ${text}`); break
        }
        case 'int-table': if (Math.abs(INT[p.tex]() - v!) > 1e-6 || !close(ev(p.answer), v)) fail(g.id, p.tex); break
        case 'pyr-volume': { const [a, h] = nums(text); if (Math.abs((a * a * h) / 3 - v!) > 1e-9) fail(g.id, text); break }
        case 'pyr-apothem': { const [s, h] = nums(text.replace('четырёхугольной', '')); if (Math.abs(Math.hypot(s / 2, h) - v!) > 1e-9) fail(g.id, text); break }
        case 'complex-mul': if (!close(ev(p.tex.replace(/(\d)i/g, '$1*i').replace(/([+-] )i/g, '$1 1*i')), ev(p.answer.replace(/(\d)i/g, '$1*i').replace(/([+-] )i/g, '$1 1*i')))) fail(g.id, `${p.tex} ≠ ${p.answer}`); break
        case 'complex-mod': if (!close(math.abs(ev(p.tex.replace('z = ', '').replace(/(\d)i/g, '$1*i'))), v)) fail(g.id, p.tex); break
        case 'trig-ineq': {
          // test points: inside the answer interval the inequality holds, just outside it does not
          const m = p.answer.match(/^(.*?) (<|\\le) x (<|\\le) (.*?),/)!
          const lo = ev(m[1].replace(/2\\pi n|\\pi n/, '0').replace(/\+\s*$/, '') || '0') as number, hi = ev(m[4].replace(/\+ 2\\pi n|\+ \\pi n/, '').replace(/^2\\pi n$/, '0')) as number
          const f = (x: number) => math.evaluate(p.solve!.replace('tg', 'tan'), { x }) as boolean
          for (let i = 1; i < 10; i++) if (!f(lo + ((hi - lo) * i) / 10)) fail(g.id, `${p.tex}: inside fails`)
          if (f(lo - 0.01) || f(hi + 0.01)) fail(g.id, `${p.tex}: outside holds`)
          break
        }
        default: {
          // statement and answer are exact expressions: both must equal the stored value
          if (v === undefined) break
          if (!close(ev(p.tex), v)) fail(g.id, `tex ${p.tex} = ${ev(p.tex)} ≠ ${v}`)
          if (!close(ev(p.answer), v)) fail(g.id, `answer ${p.answer} ≠ ${v}`)
        }
      }
      checked++
    } catch (e) { fail(g.id, `${(e as Error).message} in ${p.tex} | ${p.answer}`) }
  }
}
console.log(`${extraGens.length} generators, ${checked} problems checked`)
console.log(bad ? `${bad} problems found` : 'all new generators correct')
process.exit(bad ? 1 : 0)
