/**
 * Triangle solver: any three elements (at least one side) → all sides, angles,
 * area, perimeter, heights, medians, R and r — with the rule used at each step.
 */
import { numTex, type Step } from './tools'

export type TriKey = 'a' | 'b' | 'c' | 'A' | 'B' | 'C'
export type Tri = Record<TriKey, number | null>
export type TriResult =
  | { steps: Step[]; t: Record<TriKey, number>; extra: { key: string; tex: string }[]; second?: Record<TriKey, number>; kind: string }
  | { error: string }

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI
const f = (x: number) => numTex(Number(x.toFixed(4)))
const opp: Record<'a' | 'b' | 'c', 'A' | 'B' | 'C'> = { a: 'A', b: 'B', c: 'C' }
const sideOf: Record<'A' | 'B' | 'C', 'a' | 'b' | 'c'> = { A: 'a', B: 'b', C: 'c' }
const greek: Record<'A' | 'B' | 'C', string> = { A: '\\alpha', B: '\\beta', C: '\\gamma' }

function solveCore(t0: Tri, steps: Step[]): { t: Record<TriKey, number>; second?: Record<TriKey, number> } | string {
  const t: Tri = { ...t0 }
  let second: Tri | null = null
  const known = (k: TriKey) => t[k] !== null && Number.isFinite(t[k]!)
  for (let guard = 0; guard < 12; guard++) {
    const angles = (['A', 'B', 'C'] as const).filter(known)
    const sides = (['a', 'b', 'c'] as const).filter(known)
    if (angles.length === 3 && sides.length === 3) break

    // 1. two angles → the third
    if (angles.length === 2) {
      const miss = (['A', 'B', 'C'] as const).find((k) => !known(k))!
      const [p, q] = angles
      t[miss] = 180 - t[p]! - t[q]!
      if (t[miss]! <= 0) return 'tri.err.angles'
      steps.push({ note: 'tri.angleSum', tex: `${greek[miss]} = 180^\\circ - ${f(t[p]!)}^\\circ - ${f(t[q]!)}^\\circ = ${f(t[miss]!)}^\\circ` })
      continue
    }
    // 2. three sides → angles by the law of cosines
    if (sides.length === 3 && angles.length < 3) {
      const [a, b, c] = [t.a!, t.b!, t.c!]
      if (a >= b + c || b >= a + c || c >= a + b) return 'tri.err.inequality'
      for (const K of ['A', 'B', 'C'] as const) {
        if (known(K)) continue
        const s = sideOf[K]
        const [p, q] = (['a', 'b', 'c'] as const).filter((x) => x !== s)
        const cos = (t[p]! ** 2 + t[q]! ** 2 - t[s]! ** 2) / (2 * t[p]! * t[q]!)
        t[K] = deg(Math.acos(Math.max(-1, Math.min(1, cos))))
        steps.push({ note: 'tri.cosAngle', tex: `\\cos ${greek[K]} = \\dfrac{${p}^2 + ${q}^2 - ${s}^2}{2${p}${q}} = \\dfrac{${f(t[p]! ** 2)} + ${f(t[q]! ** 2)} - ${f(t[s]! ** 2)}}{${f(2 * t[p]! * t[q]!)}} = ${f(cos)}\\;\\Rightarrow\\; ${greek[K]} \\approx ${f(t[K]!)}^\\circ` })
        break
      }
      continue
    }
    // 3. two sides and the angle between them → third side
    if (sides.length === 2) {
      const s = (['a', 'b', 'c'] as const).find((x) => !known(x))!
      const K = opp[s]
      if (known(K)) {
        const [p, q] = sides
        const val = Math.sqrt(t[p]! ** 2 + t[q]! ** 2 - 2 * t[p]! * t[q]! * Math.cos(rad(t[K]!)))
        steps.push({ note: 'tri.cosSide', tex: `${s}^2 = ${p}^2 + ${q}^2 - 2${p}${q}\\cos ${greek[K]} = ${f(t[p]! ** 2)} + ${f(t[q]! ** 2)} - ${f(2 * t[p]! * t[q]!)} \\cdot ${f(Math.cos(rad(t[K]!)))} \\;\\Rightarrow\\; ${s} \\approx ${f(val)}` })
        t[s] = val
        continue
      }
    }
    // 4. law of sines with a known pair (side + opposite angle)
    const pair = (['a', 'b', 'c'] as const).find((s) => known(s) && known(opp[s]))
    if (pair) {
      const ratio = t[pair]! / Math.sin(rad(t[opp[pair]]!))
      // unknown side with known angle
      const s2 = (['a', 'b', 'c'] as const).find((s) => !known(s) && known(opp[s]))
      if (s2) {
        t[s2] = ratio * Math.sin(rad(t[opp[s2]]!))
        steps.push({ note: 'tri.sinSide', tex: `\\dfrac{${s2}}{\\sin ${greek[opp[s2]]}} = \\dfrac{${pair}}{\\sin ${greek[opp[pair]]}} \\;\\Rightarrow\\; ${s2} = \\dfrac{${f(t[pair]!)} \\cdot \\sin ${f(t[opp[s2]]!)}^\\circ}{\\sin ${f(t[opp[pair]]!)}^\\circ} \\approx ${f(t[s2]!)}` })
        continue
      }
      // unknown angle with known side (SSA, maybe two triangles)
      const s3 = (['a', 'b', 'c'] as const).find((s) => known(s) && !known(opp[s]))
      if (s3) {
        const sin = t[s3]! / ratio
        if (sin > 1 + 1e-12) return 'tri.err.none'
        const K = opp[s3]
        const ang = deg(Math.asin(Math.min(1, sin)))
        t[K] = ang
        steps.push({ note: 'tri.sinAngle', tex: `\\sin ${greek[K]} = \\dfrac{${s3} \\sin ${greek[opp[pair]]}}{${pair}} = ${f(sin)} \\;\\Rightarrow\\; ${greek[K]} \\approx ${f(ang)}^\\circ` })
        const alt = 180 - ang
        if (Math.abs(alt - ang) > 1e-6 && alt + t[opp[pair]]! < 180 - 1e-9) {
          second = { ...t, [K]: alt }
          steps.push({ note: 'tri.ambiguous', tex: `${greek[K]}' = 180^\\circ - ${f(ang)}^\\circ = ${f(alt)}^\\circ` })
        }
        continue
      }
    }
    return 'tri.err.notEnough'
  }
  const done = (x: Tri) => x as Record<TriKey, number>
  let sec: Record<TriKey, number> | undefined
  if (second) {
    const r = solveCore(second, [])
    if (typeof r !== 'string') sec = r.t
  }
  return { t: done(t), second: sec }
}

export function solveTriangle(input: Tri): TriResult {
  const given = (Object.keys(input) as TriKey[]).filter((k) => input[k] !== null)
  if (given.length < 3) return { error: 'tri.err.notEnough' }
  if (!(['a', 'b', 'c'] as const).some((k) => input[k] !== null)) return { error: 'tri.err.noSide' }
  for (const k of given) if (!(input[k]! > 0)) return { error: 'tri.err.positive' }
  const angSum = (['A', 'B', 'C'] as const).reduce((s, k) => s + (input[k] ?? 0), 0)
  if (angSum >= 180 + 1e-9) return { error: 'tri.err.angles' }

  const steps: Step[] = []
  const r = solveCore(input, steps)
  if (typeof r === 'string') return { error: r }
  const { a, b, c, A, B, C } = r.t
  if (a >= b + c - 1e-9 || b >= a + c - 1e-9 || c >= a + b - 1e-9) return { error: 'tri.err.inequality' }

  const P = a + b + c, p = P / 2
  const S = 0.5 * a * b * Math.sin(rad(C))
  const R = a / (2 * Math.sin(rad(A)))
  const rr = S / p
  steps.push({ note: 'tri.area', tex: `S = \\dfrac{1}{2}ab\\sin\\gamma = \\dfrac{1}{2} \\cdot ${f(a)} \\cdot ${f(b)} \\cdot \\sin ${f(C)}^\\circ \\approx ${f(S)}` })
  const extra = [
    { key: 'tri.perimeter', tex: `P = a + b + c \\approx ${f(P)}` },
    { key: 'tri.areaShort', tex: `S \\approx ${f(S)}` },
    { key: 'tri.heights', tex: `h_a = \\dfrac{2S}{a} \\approx ${f((2 * S) / a)},\\ h_b \\approx ${f((2 * S) / b)},\\ h_c \\approx ${f((2 * S) / c)}` },
    { key: 'tri.medians', tex: `m_a \\approx ${f(0.5 * Math.sqrt(2 * b * b + 2 * c * c - a * a))},\\ m_b \\approx ${f(0.5 * Math.sqrt(2 * a * a + 2 * c * c - b * b))},\\ m_c \\approx ${f(0.5 * Math.sqrt(2 * a * a + 2 * b * b - c * c))}` },
    { key: 'tri.R', tex: `R = \\dfrac{a}{2\\sin\\alpha} \\approx ${f(R)}` },
    { key: 'tri.r', tex: `r = \\dfrac{S}{p} \\approx ${f(rr)}` },
  ]
  const maxA = Math.max(A, B, C)
  const kindAngle = Math.abs(maxA - 90) < 1e-6 ? 'right' : maxA > 90 ? 'obtuse' : 'acute'
  const eq = (x: number, y: number) => Math.abs(x - y) < 1e-6 * (1 + x)
  const kindSide = eq(a, b) && eq(b, c) ? 'equilateral' : eq(a, b) || eq(b, c) || eq(a, c) ? 'isosceles' : 'scalene'
  return { steps, t: r.t, extra, second: r.second, kind: `${kindAngle}.${kindSide}` }
}
