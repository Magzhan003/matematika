/**
 * ЕНТ sets on the trainer's task types: for many variants of every set, each question has 4 different options,
 * valid TeX, no NaN/undefined, and its answer passes an independent check — the real roots of the equation found
 * by the calculator's root finder, or a value computed another way. Every task type must actually appear.
 * Usage: npx tsx scripts/check-trainer.ts [variants]
 */
import katex from 'katex'
import { trainerSets } from '../src/data/materials/trainer-sets'
import { numericRoots } from '../src/lib/calc/tools'
import type { TQ } from '../src/lib/trainer/kit'

const N = Number(process.argv[2]) || 300
let bad = 0
const fails = new Map<string, number>()
const fail = (where: string, msg: string) => {
  bad++
  const k = `${where.split(' ')[0]}: ${msg.slice(0, 140)}`
  if (!fails.has(k)) console.log('  ✗', where, '—', msg.slice(0, 300))
  fails.set(k, (fails.get(k) ?? 0) + 1)
}
function tex(where: string, s: string) {
  if (/NaN|undefined|Infinity|\[object/.test(s)) fail(where, `bad text: ${s}`)
  if ((s.match(/\$/g) ?? []).length % 2) fail(where, `odd $: ${s}`)
  for (const m of s.matchAll(/\$([^$]+)\$/g)) {
    try { katex.renderToString(m[1], { throwOnError: true, strict: 'ignore' }) } catch (e) { fail(where, `TeX ${m[1]} → ${(e as Error).message.slice(0, 60)}`) }
  }
}

let total = 0
for (const m of trainerSets) {
  const seen = new Set<string>()
  for (let seed = 1; seed <= N; seed++) {
    const qs = m.gen!(seed) as TQ[]
    if (qs.length !== 20) fail(`${m.id}#${seed}`, `${qs.length} questions`)
    for (const q of qs) {
      total++
      seen.add(q.type)
      const w = `${q.type} ${m.id}#${seed}`
      tex(w, q.q.kz); tex(w, q.q.ru); tex(w, q.sol!.kz); tex(w, q.sol!.ru)
      q.opts.forEach((o) => { tex(w, o.kz); tex(w, o.ru) })
      if (q.opts.length !== 4 || new Set(q.opts.map((o) => o.kz)).size !== 4 || new Set(q.opts.map((o) => o.ru)).size !== 4) fail(w, 'options are not 4 different ones')
      if (!(q.ans >= 0 && q.ans < 4)) fail(w, 'bad answer index')
      for (const v of q.verify) {
        if (v.kind === 'value') {
          if (!(Math.abs(v.got - v.expect) <= 1e-6 * Math.max(1, Math.abs(v.expect)))) fail(w, `value ${v.got} ≠ ${v.expect} | ${q.q.ru}`)
        } else {
          const found = numericRoots(v.f, v.range[0], v.range[1], 24000).sort((a, b) => a - b)
          const want = [...v.roots].sort((a, b) => a - b)
          const same = found.length === want.length && want.every((x, i) => Math.abs(x - found[i]) < 1e-5)
          if (!same) fail(w, `roots ${JSON.stringify(found.map((x) => +x.toFixed(4)))} ≠ ${JSON.stringify(want.map((x) => +x.toFixed(4)))} | ${q.q.ru}`)
        }
      }
    }
  }
  if (seen.size < m.gens!) fail(m.id, `only ${seen.size} question kinds for ${m.gens} task types: ${[...seen].join(', ')}`)
  console.log(`  ${m.id}: ${seen.size} types`)
}
for (const [k, n] of fails) if (n > 1) console.log(`    ${n}× ${k}`)
console.log(`${trainerSets.length} sets × ${N} variants, ${total} questions checked`)
console.log(bad ? `${bad} problems` : 'all trainer sets check out')
process.exit(bad ? 1 : 0)
