/** Checks for СОР/СОЧ: npx tsx scripts/check-summative.ts */
import { curriculum } from '../src/data/curriculum'
import { seeded } from '../src/lib/bank'
import { makeVariants, markRanges, planTasks, poolFor } from '../src/lib/summative'

let bad = 0
const fail = (m: string) => { console.log('✗', m); bad++ }
// mark ranges cover 0..total without gaps or overlaps, and the bands are right
for (let total = 5; total <= 40; total++) {
  const rs = markRanges(total).slice().reverse()
  let next = 0
  for (const x of rs) { if (x.from !== next) fail(`total ${total}: gap at ${next}`); next = x.to + 1 }
  if (next !== total + 1) fail(`total ${total}: ends at ${next - 1}`)
  for (let p = 0; p <= total; p++) {
    const pct = (p / total) * 100, want = pct >= 85 ? 5 : pct >= 65 ? 4 : pct >= 40 ? 3 : 2
    const got = markRanges(total).find((x) => p >= x.from && p <= x.to)!.mark
    if (got !== want) fail(`total ${total}, ${p} points: ${got} instead of ${want}`)
  }
}
// every grade and quarter: СОЧ for the whole quarter and a СОР for each topic reach the exact total
let plans = 0
for (const g of [5, 6, 7, 8, 9, 10, 11]) for (let q = 0; q < 4; q++) {
  const ids = curriculum[g][q]
  for (const [ids2, total] of [[ids, 20], [ids, 25], ...ids.map((id) => [[id], 10] as const)] as [string[], number][]) {
    if (!poolFor(ids2, g).length) { fail(`${g} кл. ${q + 1} ч.: no tasks for ${ids2.join(', ')}`); continue }
    const t = planTasks(ids2, g, total, seeded(g * 100 + q))
    const sum = t.reduce((s, x) => s + x.points, 0)
    if (sum !== total) fail(`${g} кл. ${q + 1} ч. ${ids2.join(',')}: ${sum} points instead of ${total}`)
    if (t.some((x) => x.points < 1 || x.points > 5)) fail(`${g}/${q + 1}: points out of range`)
    const vs = makeVariants(t, 2, 42)
    if (vs[0].problems.length !== t.length) fail('variant length')
    plans++
  }
}
console.log(`${plans} plans checked`)
console.log(bad ? `${bad} problems found` : 'all summative checks passed')
process.exit(bad ? 1 : 0)
