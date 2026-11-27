/**
 * Ready-made materials: every formula renders, every question is well-formed, the points of each summative work
 * add up, figures exist, and every worksheet answer is recomputed from its expression.
 * Usage: npx tsx scripts/check-materials.ts
 */
import { existsSync } from 'node:fs'
import katex from 'katex'
import { materials, type L } from '../src/data/materials'
import { texValue, typedValue } from '../src/lib/numanswer'

let bad = 0
const fail = (where: string, msg: string) => { bad++; console.log('  ✗', where, '—', msg) }

/** Every `$…$` piece must be valid TeX; the `$` count must be even. */
function checkText(where: string, s: string) {
  if ((s.match(/\$/g) ?? []).length % 2) { fail(where, `odd number of $: ${s.slice(0, 60)}`); return }
  for (const m of s.matchAll(/\$([^$]+)\$/g)) {
    try { katex.renderToString(m[1], { throwOnError: true, strict: 'ignore' }) } catch (e) { fail(where, `TeX: ${m[1].slice(0, 60)} → ${(e as Error).message.slice(0, 80)}`) }
  }
}
const checkL = (where: string, x?: L) => { if (!x) return; checkText(`${where} kz`, x.kz); checkText(`${where} ru`, x.ru); if (!x.kz.trim() !== !x.ru.trim()) fail(where, 'one language is empty') }

/** Numeric value of a worksheet expression written in TeX. */
function evalTex(tex: string): number {
  const js = tex
    .replace(/\\left|\\right/g, '')
    .replace(/(\d+)\\tfrac\{(\d+)\}\{(\d+)\}/g, '($1+$2/$3)')
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '($1/$2)')
    .replace(/\{,\}/g, '.').replace(/\\cdot/g, '*').replace(/:/g, '/').replace(/=\s*$/, '')
  if (/[^0-9+\-*/(). ]/.test(js)) throw new Error(`cannot evaluate ${js}`)
  return Function(`return (${js})`)() as number
}

let questions = 0, works = 0, tasks = 0
for (const m of materials) {
  checkL(`${m.id} title`, m.title); checkL(`${m.id} intro`, m.intro)
  m.theory?.forEach((b, i) => { checkL(`${m.id} theory ${i}`, b.title); b.rows?.forEach((r, k) => { checkL(`${m.id} theory ${i}.${k}`, r.name); checkL(`${m.id} theory ${i}.${k}`, r.text) }); b.paras?.forEach((p, k) => checkL(`${m.id} para ${i}.${k}`, p)); checkL(`${m.id} tip ${i}`, b.tip) })
  m.mcq?.forEach((q, i) => {
    questions++
    const w = `${m.id} q${i + 1}`
    checkL(w, q.q); checkL(`${w} sol`, q.sol); q.opts.forEach((o, k) => checkL(`${w} opt ${k}`, o))
    if (q.opts.length !== 4) fail(w, `${q.opts.length} options`)
    if (!(q.ans >= 0 && q.ans < q.opts.length)) fail(w, `bad answer index ${q.ans}`)
    if (new Set(q.opts.map((o) => o.kz)).size !== q.opts.length) fail(w, 'repeated options')
  })
  if (m.scale && m.mcq && !(m.scale[0] <= m.mcq.length && m.scale[0] > m.scale[1] && m.scale[1] > m.scale[2])) fail(m.id, 'bad mark scale')
  m.free?.tasks.forEach((x, i) => {
    tasks++
    const w = `${m.id} task ${i + 1}`
    checkText(w, `$${x.q}$`); checkText(`${w} ans`, `$${x.ans}$`)
    const want = texValue(x.ans)
    if (want === null) { fail(w, `answer not understood: ${x.ans}`); return }
    try { const got = evalTex(x.q); if (Math.abs(got - want) > 1e-9) fail(w, `expression = ${got}, answer says ${want}`) } catch (e) { fail(w, (e as Error).message) }
  })
  m.works?.forEach((wk) => {
    works++
    const w = `${m.id} ${wk.id}`
    checkL(`${w} title`, wk.title); checkL(`${w} topic`, wk.topic)
    wk.goals?.forEach((g) => checkL(`${w} goal`, g)); wk.criteria?.forEach((c) => checkL(`${w} crit`, c))
    wk.tasks.forEach((t, i) => { checkL(`${w} task ${i + 1}`, t.text); t.parts?.forEach((p) => checkL(`${w} task ${i + 1} part`, p)); if (t.fig && !existsSync(`src/assets/materials/${t.fig}.webp`)) fail(w, `no figure ${t.fig}`) })
    wk.descriptors.forEach((d) => { checkL(`${w} desc`, d.crit); d.rows.forEach((r) => checkL(`${w} desc row`, r.text)) })
    wk.key.forEach((k, i) => checkL(`${w} key ${i}`, k))
    wk.keyFigs?.forEach((f) => { if (!existsSync(`src/assets/materials/${f}.webp`)) fail(w, `no figure ${f}`) })
    wk.rubric?.forEach((r) => [r.crit, r.low, r.mid, r.high].forEach((x) => checkL(`${w} rubric`, x)))
    const sum = wk.descriptors.reduce((s, d) => s + d.rows.reduce((a, r) => a + r.pts, 0), 0)
    if (sum !== wk.points) fail(w, `descriptors give ${sum} points, work says ${wk.points}`)
    const taskPts = wk.tasks.reduce((s, t) => s + (t.pts ?? 0), 0)
    if (wk.kind === 'tzb' && taskPts !== wk.points) fail(w, `task points ${taskPts} ≠ ${wk.points}`)
  })
}

// the typed-answer parser understands the usual ways to write numbers
const typed: [string, number][] = [['5', 5], ['-1,8', -1.8], ['−1.8', -1.8], ['3/4', 0.75], ['-1 3/4', -1.75], [' - 2 2/5 ', -2.4]]
for (const [s, v] of typed) if (typedValue(s) !== v) fail('typedValue', `${s} → ${typedValue(s)}, expected ${v}`)
if (typedValue('abc') !== null || typedValue('1/0') !== null) fail('typedValue', 'accepts nonsense')

console.log(`${materials.length} materials, ${questions} questions, ${tasks} worksheet tasks, ${works} summative works`)
console.log(bad ? `${bad} problems` : 'all materials check out')
process.exit(bad ? 1 : 0)
