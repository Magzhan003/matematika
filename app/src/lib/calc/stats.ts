/** Descriptive statistics of a list of numbers with formulas filled in. */
import { numTex, snap, type Step } from './tools'

export type StatsResult =
  | { steps: Step[]; sorted: number[]; freq: { x: number; n: number }[]; summary: { key: string; tex: string }[] }
  | { error: string }

const f = (x: number) => numTex(Number(x.toFixed(4)))

export function parseNumbers(s: string): number[] {
  return s
    .replace(/(\d),(\d)/g, '$1.$2')
    .split(/[\s;]+|,\s*/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(Number)
}

export function statistics(input: string): StatsResult {
  const xs = parseNumbers(input)
  if (!xs.length || xs.some((x) => !Number.isFinite(x))) return { error: 'stats.err.numbers' }
  const n = xs.length
  const sorted = [...xs].sort((a, b) => a - b)
  const sum = xs.reduce((s, x) => s + x, 0)
  const mean = sum / n
  const mid = Math.floor(n / 2)
  const median = n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  const counts = new Map<number, number>()
  for (const x of sorted) counts.set(x, (counts.get(x) ?? 0) + 1)
  const freq = [...counts].map(([x, k]) => ({ x, n: k }))
  const top = Math.max(...freq.map((q) => q.n))
  const modes = top > 1 ? freq.filter((q) => q.n === top).map((q) => q.x) : []
  const range = sorted[n - 1] - sorted[0]
  const variance = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / n
  const sigma = Math.sqrt(variance)

  const list = sorted.map((x) => f(x)).join(';\\ ')
  const steps: Step[] = [
    { note: 'stats.sorted', tex: list },
    { note: 'stats.mean', tex: `\\bar{x} = \\dfrac{${n <= 8 ? xs.map((x) => f(x)).join(' + ') : `${f(sum)}`}}{${n}} = ${f(mean)}` },
    {
      note: 'stats.median',
      tex: n % 2 ? `Me = x_{${mid + 1}} = ${f(median)}` : `Me = \\dfrac{x_{${mid}} + x_{${mid + 1}}}{2} = \\dfrac{${f(sorted[mid - 1])} + ${f(sorted[mid])}}{2} = ${f(median)}`,
    },
    { note: 'stats.mode', tex: modes.length ? `Mo = ${modes.map((m) => f(m)).join(';\\ ')}\\ (${top}\\times)` : 'Mo = \\varnothing' },
    { note: 'stats.range', tex: `R = x_{\\max} - x_{\\min} = ${f(sorted[n - 1])} - ${f(sorted[0])} = ${f(range)}` },
    { note: 'stats.variance', tex: `D = \\dfrac{\\sum (x_i - \\bar{x})^2}{n} = ${f(variance)},\\qquad \\sigma = \\sqrt{D} \\approx ${f(sigma)}` },
  ]
  const summary = [
    { key: 'stats.n', tex: String(n) },
    { key: 'stats.sum', tex: f(sum) },
    { key: 'stats.meanShort', tex: f(snap(mean)) },
    { key: 'stats.medianShort', tex: f(median) },
    { key: 'stats.modeShort', tex: modes.length ? modes.map((m) => f(m)).join(';\\ ') : '—' },
    { key: 'stats.rangeShort', tex: f(range) },
    { key: 'stats.sigma', tex: f(sigma) },
  ]
  return { steps, sorted, freq, summary }
}
