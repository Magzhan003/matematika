/** Every topic of the program gets a full lesson scenario: npx tsx scripts/check-scenario.ts */
import { curriculum } from '../src/data/curriculum'
import { buildScenario } from '../src/lib/scenario'
let bad = 0, n = 0
const fail = (m: string) => { console.log('✗', m); bad++ }
for (const g of [5, 6, 7, 8, 9, 10, 11]) for (const id of new Set(curriculum[g].flat())) for (const len of [40, 45] as const) {
  const s = buildScenario(id, g, len, 7); n++
  if (s.total !== len) fail(`${g} ${id}: ${s.total} min`)
  const st = Object.fromEntries(s.stages.map((x) => [x.key, x]))
  if (!st.practice.problems!.length) fail(`${g} ${id}: no practice`)
  if (st.check.variants!.some((v) => v.length < 3)) fail(`${g} ${id}: check has ${st.check.variants!.map((v) => v.length)}`)
  if (st.warmup.problems!.length < 3) fail(`${g} ${id}: warm-up ${st.warmup.problems!.length}`)
  if (!st.new.formulas!.length) console.log(`  (no formula cards) ${g} ${id}`)
}
console.log(`${n} scenarios checked`); console.log(bad ? `${bad} problems found` : 'all scenarios complete'); process.exit(bad ? 1 : 0)
