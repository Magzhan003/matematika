/**
 * Algebra 7 generators: statement = answer for random values of the letters (mathjs), numeric values agree,
 * TeX renders, options and typical mistakes are fine. npx tsx scripts/check-alg7.ts
 */
import katex from 'katex'
import { create, all } from 'mathjs'
import { alg7Gens } from '../src/lib/bank/alg7'
import { choices, findMistake, seeded } from '../src/lib/bank'
import { ruMore, kzMore } from '../src/i18n-more'

const math = create(all)
let bad = 0, checked = 0
const fail = (id: string, m: string) => { if (bad < 30) console.log('✗', id, m); bad++ }
const letters = ['x', 'y', 'a', 'b', 'c', 'm']
/** TeX answer → mathjs: fractions, powers, implicit products («6x^{3}y^{4}» → 6*x^(3)*y^(4)). */
function texToMath(t: string): string {
  let s = t.replace(/^\s*[a-z]\s*=\s*/, '').replace(/\{,\}/g, '.').replace(/\\cdot/g, '*')
  for (let k = 0; k < 4; k++) s = s.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
  s = s.replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/\s+/g, '')
  // implicit multiplication: 2x, xy, x(, )(, )x, 2(
  for (let k = 0; k < 3; k++) s = s.replace(/(\d|[a-z)])(?=[a-z(])/g, '$1*')
  return s
}
for (const g of alg7Gens) {
  const r = seeded(5)
  for (let k = 0; k < 300; k++) {
    const p = g.make(r)
    for (const t of [p.tex, p.answer, ...(p.steps ?? []), ...(p.wrong ?? []), ...(p.mistakes ?? []).map((m) => m.tex)]) {
      if (!t) continue
      try { katex.renderToString(t, { throwOnError: true }) } catch { fail(g.id, `bad TeX: ${t}`) }
    }
    if (!p.verify) { fail(g.id, 'no verify'); continue }
    const [lhs, rhs] = p.verify
    try {
      for (let s = 0; s < 4; s++) {
        const scope = Object.fromEntries(letters.map((l) => [l, 0.37 + 1.13 * s + letters.indexOf(l) * 0.29]))
        const A = math.evaluate(lhs, scope) as number, B = math.evaluate(rhs, scope) as number
        if (Math.abs(A - B) > 1e-6 * Math.max(1, Math.abs(A))) { fail(g.id, `${lhs} ≠ ${rhs} (${A} vs ${B})`); break }
      }
      if (p.values?.length === 1 && Math.abs((math.evaluate(rhs) as number) - p.values[0]) > 1e-6 * Math.max(1, Math.abs(p.values[0]))) fail(g.id, `value ${p.values[0]} ≠ ${rhs}`)
    } catch (e) { fail(g.id, `${(e as Error).message}: ${lhs} | ${rhs}`) }
    // the answer as the student sees it (TeX) must equal verify's answer too
    if (!/;\\ |\\%/.test(p.answer)) {
      try {
        const js = texToMath(p.answer)
        for (let s = 0; s < 3; s++) {
          const scope = Object.fromEntries(letters.map((l) => [l, 0.41 + 0.97 * s + letters.indexOf(l) * 0.31]))
          const A = math.evaluate(js, scope) as number, B = math.evaluate(rhs, scope) as number
          if (Math.abs(A - B) > 1e-6 * Math.max(1, Math.abs(B))) { fail(g.id, `answer TeX ${p.answer} → ${js} = ${A}, verify ${rhs} = ${B}`); break }
        }
      } catch (e) { fail(g.id, `cannot read answer ${p.answer}: ${(e as Error).message}`) }
    }
    const ch = choices(p, r)
    if (ch.options.length < 4) fail(g.id, `only ${ch.options.length} options: ${p.answer}`)
    if (new Set(ch.options).size !== ch.options.length) fail(g.id, 'duplicate options')
    for (const m of p.mistakes ?? []) {
      if (!(ruMore.mist as Record<string, string>)[m.why] || !(kzMore.mist as Record<string, string>)[m.why]) fail(g.id, `no text for mistake ${m.why}`)
      if (m.tex === p.answer) continue
      if (!findMistake(p, { picked: m.tex })) fail(g.id, `mistake not found ${m.tex}`)
    }
    checked++
  }
}
console.log(`${alg7Gens.length} generators, ${checked} problems checked`)
console.log(bad ? `${bad} problems found` : 'all algebra-7 tasks correct')
process.exit(bad ? 1 : 0)
