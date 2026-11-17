import { gens, seeded, type Gen, type Problem } from './bank'

/**
 * Short codes that work without a server:
 *  - work code: seed + the list of task types (generator indices) -> every variant can be rebuilt;
 *  - result code: seed + variant + which tasks were right + minutes, with a checksum.
 * Generator indices must stay stable: new generators are only appended to the bank.
 */

const SALT = 'lyam-200'
const b36 = (n: number, len: number) => Math.max(0, Math.floor(n)).toString(36).padStart(len, '0').slice(-len)
const unb = (s: string) => parseInt(s, 36)

function hash(s: string) {
  let h = 2166136261
  for (const ch of s + SALT) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const sum2 = (body: string) => b36(hash(body) % 1296, 2)

/** Upper case, groups of four: AB12-CD34-… */
const pretty = (s: string) => s.toUpperCase().match(/.{1,4}/g)!.join('-')
const raw = (s: string) => s.toLowerCase().replace(/[^0-9a-z]/g, '')

export function encodeWork(seed: number, types: Gen[]): string {
  const body = 'w' + b36(seed, 4) + types.map((g) => b36(gens.indexOf(g), 2)).join('')
  return pretty(body + sum2(body))
}

export type Work = { seed: number; types: Gen[] }

export function decodeWork(code: string): Work | null {
  const s = raw(code)
  if (s[0] !== 'w' || s.length < 9 || (s.length - 7) % 2) return null
  const body = s.slice(0, -2)
  if (sum2(body) !== s.slice(-2)) return null
  const seed = unb(body.slice(1, 5))
  const types: Gen[] = []
  for (let i = 5; i < body.length; i += 2) {
    const g = gens[unb(body.slice(i, i + 2))]
    if (!g) return null
    types.push(g)
  }
  return types.length ? { seed, types } : null
}

/** The same problems as on the printed sheet of this variant (variant is 0-based). */
export function variantProblems(w: Work, variant: number): Problem[] {
  const r = seeded(w.seed * 10 + variant + 1)
  return w.types.map((g) => g.make(r))
}

export type Result = { seed: number; variant: number; ok: boolean[]; minutes: number }

export function encodeResult(res: Result): string {
  const mask = res.ok.reduce((m, ok, i) => m + (ok ? 2 ** i : 0), 0)
  const body = 'r' + b36(res.seed, 4) + b36(res.variant, 1) + b36(res.ok.length, 1) + b36(mask, 5) + b36(Math.min(res.minutes, 1295), 2)
  return pretty(body + sum2(body))
}

export function decodeResult(code: string): Result | null {
  const s = raw(code)
  if (s[0] !== 'r' || s.length !== 16) return null
  const body = s.slice(0, -2)
  if (sum2(body) !== s.slice(-2)) return null
  const n = unb(body[6])
  const mask = unb(body.slice(7, 12))
  return {
    seed: unb(body.slice(1, 5)),
    variant: unb(body[5]),
    ok: Array.from({ length: n }, (_, i) => Math.floor(mask / 2 ** i) % 2 === 1),
    minutes: unb(body.slice(12, 14)),
  }
}
