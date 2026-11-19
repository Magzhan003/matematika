/** Second, simpler example for every formula: small numbers, everyday situations, short steps. */
export type Example2 = { task: { ru: string; kz: string }; steps: string[]; answer: string }

export const X = (id: string, task: [ru: string, kz: string], steps: string[], answer: string): [string, Example2] =>
  [id, { task: { ru: task[0], kz: task[1] }, steps, answer }]
