/**
 * Summative assessment (СОР — for a section, СОЧ — for a quarter): tasks with points,
 * a scoring scheme with descriptors (one point per descriptor line) and the points → mark scale.
 */
import type { Level } from '../data/formulas'
import { gens, seeded, type Gen, type Problem, type Rng } from './bank'

export type L = { ru: string; kz: string }
export type SumTask = { gen: Gen; points: number }
export type SumVariant = { problems: Problem[] }

const basePoints: Record<Level, number> = { easy: 2, medium: 3, hard: 4 }

/** Generators for the chosen topics that fit the grade (or any grade if the topic has nothing lower). */
export function poolFor(topics: string[], grade: number): Gen[] {
  return topics.flatMap((id) => {
    const all = gens.filter((g) => g.topic === id)
    const fit = all.filter((g) => g.grade <= grade)
    return fit.length ? fit : all
  })
}

/**
 * Choose task types so that the total is exactly `total` points:
 * topics take turns, levels go from easy to hard (as in a real СОР: knowledge → application → higher skills).
 */
export function planTasks(topics: string[], grade: number, total: number, r: Rng): SumTask[] {
  const byTopic = topics.map((id) => poolFor([id], grade)).filter((l) => l.length)
  if (!byTopic.length) return []
  const order: Level[] = ['easy', 'easy', 'medium', 'medium', 'hard', 'medium', 'easy', 'hard']
  const used = new Map<string, number>()
  const tasks: SumTask[] = []
  let sum = 0, i = 0
  while (sum < total && i < 60) {
    const list = byTopic[i % byTopic.length]
    const want = order[Math.floor(i / byTopic.length) % order.length]
    // the wanted level if the topic has it, otherwise the closest one; prefer types used less often
    const rank = (g: Gen) => Math.abs(['easy', 'medium', 'hard'].indexOf(g.level) - ['easy', 'medium', 'hard'].indexOf(want)) * 10 + (used.get(g.id) ?? 0) * 3 + r()
    const g = [...list].sort((a, b) => rank(a) - rank(b))[0]
    used.set(g.id, (used.get(g.id) ?? 0) + 1)
    const pts = Math.min(basePoints[g.level], total - sum)
    tasks.push({ gen: g, points: pts })
    sum += pts
    i++
  }
  // a 1-point tail is fine for an easy task; otherwise give the point to the previous task
  const last = tasks[tasks.length - 1]
  if (last && last.points === 1 && last.gen.level !== 'easy' && tasks.length > 1) {
    tasks.pop(); tasks[tasks.length - 1].points += 1
  }
  // easy → hard, as on a real sheet
  const rk: Record<Level, number> = { easy: 0, medium: 1, hard: 2 }
  return tasks.sort((a, b) => rk[a.gen.level] - rk[b.gen.level])
}

/** Parallel variants: the same task types and points, different numbers. */
export function makeVariants(tasks: SumTask[], count: number, seed: number): SumVariant[] {
  return Array.from({ length: count }, (_, v) => {
    const r = seeded(seed * 10 + v + 1)
    const seen = new Set<string>()
    // the same type may be used twice — then the numbers must differ
    const problems = tasks.map((t) => {
      let p = t.gen.make(r)
      for (let k = 0; k < 20 && seen.has(p.text.ru + p.tex); k++) p = t.gen.make(r)
      seen.add(p.text.ru + p.tex)
      return p
    })
    return { problems }
  })
}

/** Descriptor lines (one point each) for a task worth `points`. */
export function descriptors(points: number, topic: L): L[] {
  const all: L[] = [
    { ru: `применяет правило (формулу) по теме «${topic.ru}»`, kz: `«${topic.kz}» тақырыбы бойынша ережені (формуланы) қолданады` },
    { ru: 'выполняет вычисления (преобразования)', kz: 'есептеулерді (түрлендірулерді) орындайды' },
    { ru: 'записывает промежуточный результат (уравнение, формулу с данными)', kz: 'аралық нәтижені (теңдеуді, деректері бар формуланы) жазады' },
    { ru: 'обосновывает решение (проверка, пояснение шага)', kz: 'шешімін негіздейді (тексеру, қадамды түсіндіру)' },
    { ru: 'записывает верный ответ', kz: 'дұрыс жауабын жазады' },
  ]
  if (points <= 1) return [{ ru: 'находит верный ответ', kz: 'дұрыс жауабын табады' }]
  if (points === 2) return [all[0], all[4]]
  if (points === 3) return [all[0], all[1], all[4]]
  if (points === 4) return [all[0], all[2], all[1], all[4]]
  return [all[0], all[2], all[1], all[3], all[4]]
}

export const skillLevel: Record<Level, L> = {
  easy: { ru: 'Знание и понимание', kz: 'Білу және түсіну' },
  medium: { ru: 'Применение', kz: 'Қолдану' },
  hard: { ru: 'Навыки высокого порядка', kz: 'Жоғары деңгей дағдылары' },
}

/** Points → mark (percent bands used for summative results in Kazakhstan schools). */
export const markBands = [
  { min: 85, max: 100, mark: 5 },
  { min: 65, max: 84, mark: 4 },
  { min: 40, max: 64, mark: 3 },
  { min: 0, max: 39, mark: 2 },
] as const
/** The mark for a score — taken from the same point ranges that are printed for the teacher. */
export function markFor(points: number, total: number): number {
  return markRanges(total).find((x) => points >= x.from && points <= x.to)?.mark ?? 2
}
/** Point ranges for each mark, e.g. 15 points → «5»: 13–15. */
export function markRanges(total: number) {
  return markBands.map((b) => {
    const from = Math.ceil((b.min / 100) * total - 1e-9)
    const to = b.max === 100 ? total : Math.ceil(((b.max + 1) / 100) * total - 1e-9) - 1
    return { mark: b.mark, from: Math.max(0, from), to: Math.max(from, to) }
  })
}
