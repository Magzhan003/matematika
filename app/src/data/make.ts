import type { CalcVar, Formula, Level } from './formulas'

type Pair = [ru: string, kz: string]
const l = ([ru, kz]: Pair) => ({ ru, kz })

/**
 * Compact constructor for catalogue formulas. Section and branch are filled in
 * from the topic when the final list is built (see formulas.ts).
 */
export function F(
  id: string, topic: string, grade: number, level: Level,
  title: Pair, tex: string, explain: Pair,
  task: Pair, steps: string[], answer: string,
  calc?: { eq: string; vars: [name: string, tex: string, ru: string, kz: string][]; positive?: boolean },
): Formula {
  return {
    id, topic, grade, level, branch: 'algebra', section: 'algebra',
    title: l(title), tex, explain: l(explain),
    example: { task: l(task), steps, answer },
    calc: calc && {
      eq: calc.eq, positive: calc.positive,
      vars: calc.vars.map(([name, t, ru, kz]): CalcVar => ({ name, tex: t, label: { ru, kz } })),
    },
  }
}
