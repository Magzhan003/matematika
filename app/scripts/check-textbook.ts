/** Textbook data: 41 paragraphs, every paragraph has working generators. npx tsx scripts/check-textbook.ts */
import { algebra7 } from '../src/data/textbook'
import { genById, seeded } from '../src/lib/bank'
let bad = 0
const ps = algebra7.paragraphs
if (ps.length !== 41) { console.log('✗ paragraphs', ps.length); bad++ }
ps.forEach((p, i) => {
  if (p.n !== i + 1) { console.log('✗ order', p.n); bad++ }
  if (!p.gens.length) { console.log('✗ no tasks §', p.n); bad++ }
  for (const g of p.gens) { const gen = genById(g); if (!gen) { console.log('✗ unknown gen', g, '§', p.n); bad++ } else gen.make(seeded(1)) }
  if (i && p.page.ru <= ps[i - 1].page.ru) { console.log('✗ RU pages not increasing at §', p.n); bad++ }
})
console.log(`${ps.length} paragraphs, ${ps.reduce((s, p) => s + p.gens.length, 0)} task types`)
console.log(bad ? `${bad} problems` : 'textbook data ok'); process.exit(bad ? 1 : 0)
