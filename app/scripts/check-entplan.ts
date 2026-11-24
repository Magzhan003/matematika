/** ЕНТ plan: every topic appears, weak ones first, prerequisites before. npx tsx scripts/check-entplan.ts */
import { topicById } from '../src/data/topics'
import { buildPlan, topicOrder } from '../src/lib/entplan'
import { prereqs } from '../src/lib/mastery'

let bad = 0
const fail = (m: string) => { console.log('✗', m); bad++ }
const empty = { stats: {}, lessonsDone: [], diag: null }
// a student weak in trig and quadratics, strong in fractions
const diag = { stats: {}, lessonsDone: [], diag: { topics: { 'trig-equations': 0.1, quadratic: 0.2, fractions: 0.95, percents: 0.9 } } } as never
for (const [name, store] of [['empty', empty], ['diag', diag]] as const) {
  const order = topicOrder(store as never)
  for (let i = 0; i < order.length; i++) for (const p of prereqs[order[i]] ?? []) {
    const j = order.indexOf(p)
    if (j > i) fail(`${name}: ${p} after ${order[i]}`)
  }
  for (const days of [14, 30, 60, 90]) {
    const exam = new Date(); exam.setDate(exam.getDate() + days)
    const plan = buildPlan(exam.toISOString().slice(0, 10), store as never, new Date().toISOString().slice(0, 10))
    if (Math.abs(plan.days.length - days) > 1) fail(`${name} ${days}: ${plan.days.length} days`)
    const seen = new Set(plan.days.flatMap((d) => d.topics))
    if (days >= 60) for (const id of order) if (!seen.has(id)) fail(`${name} ${days}: missing ${id}`)
    if (plan.days.at(-1)!.kind !== 'rest' || plan.days.at(-2)!.kind !== 'full') fail(`${name} ${days}: end ${plan.days.slice(-2).map((d) => d.kind)}`)
    if (plan.days.some((d) => d.kind === 'study' && !d.topics.length)) fail(`${name} ${days}: empty study day`)
    if (plan.days.some((d) => d.topics.some((t) => !topicById(t)))) fail(`${name} ${days}: unknown topic`)
    if (name === 'diag' && days === 30) console.log('first days:', plan.days.slice(0, 5).map((d) => `${d.n}:${d.kind}:${d.topics.join('+')}`).join('  '))
  }
  console.log(name, 'order starts:', order.slice(0, 8).join(', '), `(${order.length} topics)`)
}
console.log(bad ? `${bad} problems` : 'ent plan ok'); process.exit(bad ? 1 : 0)
