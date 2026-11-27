/**
 * Ready-made materials (tests, worksheets, summative works) taken from teachers' PDFs.
 * Text may contain inline TeX between `$…$` (rendered by components/MathText).
 */
export type L = { kz: string; ru: string }
export const l = (kz: string, ru: string = kz): L => ({ kz, ru })

/** One multiple-choice question: four options, `ans` is the index of the correct one (0 = A). */
export type MCQ = { q: L; opts: L[]; ans: number; sol?: L }
/** A task with a typed / written answer (worksheets). */
export type FreeTask = { q: string; ans: string; group?: number }
/** A theory row: name and formula / meaning. */
export type TheoryRow = { name: L; text: L }
export type TheoryBlock = { title: L; rows?: TheoryRow[]; paras?: L[]; tip?: L }

/** Summative work (БЖБ / ТЖБ): tasks with levels, descriptors, key, rubric for parents. */
export type SumTask = { level: 'A' | 'B' | 'C'; text: L; parts?: L[]; basis?: string; pts?: number; fig?: string }
export type Descriptor = { crit: L; rows: { n: string; text: L; pts: number }[] }
/** Figure ids are file names in src/assets/materials (without .webp). */
export type RubricRow = { crit: L; low: L; mid: L; high: L }
export type SumWork = {
  id: string; kind: 'bzb' | 'tzb'; n?: number; quarter: number; title: L; topic?: L; goals?: L[]; criteria?: L[]
  skills?: L; minutes: number; points: number; tasks: SumTask[]; descriptors: Descriptor[]; key: L[]; keyFigs?: string[]; rubric?: RubricRow[]
}

export type Grade = number | 'ent'
export type Material = {
  id: string
  title: L
  grade: Grade
  subject: 'algebra' | 'geometry' | 'literacy'
  kind: 'test' | 'worksheet' | 'summative'
  topics: string[]            // site topic ids (data/topics.ts)
  minutes?: number
  author?: string
  intro?: L
  theory?: TheoryBlock[]
  mcq?: MCQ[]
  free?: { groups: L[]; tasks: FreeTask[]; instruction: L }
  works?: SumWork[]
  book?: L                    // textbook the work is based on
  scale?: [number, number, number] // minimum correct answers for «5», «4», «3»
}
