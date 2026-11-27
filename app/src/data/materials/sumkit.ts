import { l, type Descriptor, type L, type RubricRow, type SumTask } from './types'

type P = [string, string]
const L2 = ([kz, ru]: P): L => l(kz, ru)

/** A task: level, text, textbook exercise it is based on, sub-items, points (ТЖБ), figure id. */
export const task = (level: SumTask['level'], kz: string, ru: string, basis?: string, parts?: P[], extra?: { pts?: number; fig?: string }): SumTask =>
  ({ level, text: l(kz, ru), basis, parts: parts?.map(L2), ...extra })
/** Descriptors for one criterion; every row is 1 point. Row: [number, kz, ru]. */
export const desc = (kz: string, ru: string, rows: [string, string, string][]): Descriptor =>
  ({ crit: l(kz, ru), rows: rows.map(([n, k, r]) => ({ n, text: l(k, r), pts: 1 })) })
/** Parents' rubric row: criterion, low / middle / high level. */
export const rub = (crit: P, low: P, mid: P, high: P): RubricRow => ({ crit: L2(crit), low: L2(low), mid: L2(mid), high: L2(high) })
export const key = (kz: string, ru: string = kz): L => l(kz, ru)
export const goal = (code: string, kz: string, ru: string): L => l(`${code} – ${kz}`, `${code} – ${ru}`)
export const SKILLS = l('Қолдану. Жоғары деңгей дағдылары.', 'Применение. Навыки высокого порядка.')
