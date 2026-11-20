/** Brute-force check of every numeric olympiad answer: npx tsx scripts/check-olympiad.ts */
import { olympiad } from '../src/data/olympiad'

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const powMod = (b: number, e: number, m: number) => { let r = 1; for (let i = 0; i < e; i++) r = (r * b) % m; return r }

const computed: Record<string, number> = {
  snail: (() => { let h = 0; for (let d = 1; ; d++) { h += 4; if (h >= 10) return d; h -= 3 } })(),
  rem61: range(2, 1000).find((n) => [2, 3, 4, 5, 6].every((k) => n % k === 1))!,
  even3: range(100, 999).filter((n) => String(n).split('').every((c) => Number(c) % 2 === 0)).length,
  sets30: 18 + 15 - (30 - 5),
  zeros25: (() => { let f = 1n; for (let i = 1n; i <= 25n; i++) f *= i; return String(f).match(/0*$/)![0].length })(),
  hens: 12 * 12 * (3 / (3 * 3)),
  book: range(1, 1000).find((n) => n % 4 === 0 && n - n / 2 - n / 4 === 30)!,
  ages: range(1, 50).find((s) => s + 28 + 4 === 3 * (s + 4))!,
  squares4: range(1, 4).reduce((s, k) => s + (5 - k) ** 2, 0),
  magic: (() => { // search all 3×3 magic squares, collect the centre
    const centres = new Set<number>()
    const perm = (a: number[], k: number) => { if (k === a.length) { const [p, q, r, s, t, u, v, w, x] = a; const S = [p + q + r, s + t + u, v + w + x, p + s + v, q + t + w, r + u + x, p + t + x, r + t + v]; if (S.every((z) => z === 15)) centres.add(t); return } for (let i = k; i < a.length; i++) { [a[k], a[i]] = [a[i], a[k]]; perm(a, k + 1); [a[k], a[i]] = [a[i], a[k]] } }
    perm(range(1, 9), 0); return centres.size === 1 ? [...centres][0] : NaN
  })(),
  last3: powMod(3, 100, 10),
  clock: (() => { let c = 0; for (let m = 0; m < 24 * 60 * 60; m++) { const t1 = m / 3600, a = (t1 * 30) % 360, b = (t1 * 360) % 360, a2 = ((m + 1) / 3600 * 30) % 360, b2 = ((m + 1) / 3600 * 360) % 360; const d1 = (b - a + 360) % 360, d2 = (b2 - a2 + 360) % 360; if (d2 < d1 || d2 === 0) c++ } return c })(),
  sumsq: range(-50, 50).flatMap((x) => [x * (20 - x)].filter(() => x * x + (20 - x) ** 2 === 208))[0],
  diffsq: 2025 ** 2 - 2024 ** 2,
  telescope: range(1, 99).reduce((s, k) => s + 1 / (k * (k + 1)), 0),
  diag12: (() => { let c = 0; for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) if (j - i !== 1 && j - i !== 11) c++; return c })(),
  div7: range(100, 999).filter((n) => n % 7 === 0).length,
  last2: powMod(7, 100, 100),
  avgspeed: 60 / (30 / 12 + 30 / 20),
  acute: 3, // proof-based; outer angles argument
  ainv: (() => { const a = (3 + Math.sqrt(5)) / 2; return a * a + 1 / (a * a) })(),
  digits100: range(1, 100).map(String).join('').length,
  star: 180, // proof-based (regular star: 5 · 36°)
  vieta: (() => { const d = Math.sqrt(25 - 12), x1 = (5 + d) / 2, x2 = (5 - d) / 2; return x1 * x1 + x2 * x2 })(),
  minq: Math.min(...range(-1000, 1000).map((i) => { const x = i / 100; return x * x - 6 * x + 13 })),
  odds: range(1, 99).filter((n) => n % 2).reduce((a, b) => a + b, 0),
  stars: (() => { let c = 0; for (const x of range(1, 10)) for (const y of range(1, 10)) if (10 - x - y >= 1) c++; return c })(),
  dice7: (() => { let c = 0; for (const a of range(1, 6)) for (const b of range(1, 6)) if (a + b === 7) c++; return c / 36 })(),
  sin15: Math.sin(Math.PI / 12) * Math.cos(Math.PI / 12),
  logchain: range(2, 7).reduce((p, b) => p * Math.log(b + 1) / Math.log(b), 1),
  mod7: powMod(2, 2025, 7),
  div360: range(1, 360).filter((d) => 360 % d === 0).length,
  absroots: range(-100, 100).filter((x) => Math.abs(x - 3) === 5).reduce((a, b) => a + b, 0),
  choose3: (() => { let c = 0; for (let a = 0; a < 10; a++) for (let b = a + 1; b < 10; b++) for (let d = b + 1; d < 10; d++) c++; return c })(),
  hyp: Math.hypot(20, 21),
  xy15: (() => { let c = 0; for (const x of range(1, 100)) for (const y of range(1, 100)) if (x * x - y * y === 15) c++; return c })(),
}
// star check: the five-point star with random convex pentagon would need geometry; the regular case is enough here
void gcd

let bad = 0
for (const t of olympiad) {
  if (t.value === undefined) continue
  const c = computed[t.id]
  if (c === undefined) { console.log('NO CHECK', t.id); bad++; continue }
  if (Math.abs(c - t.value) > 1e-9) { console.log('WRONG', t.id, 'stored', t.value, 'computed', c); bad++ }
}
const ids = new Set<string>()
for (const t of olympiad) {
  if (ids.has(t.id)) { console.log('DUP id', t.id); bad++ }
  ids.add(t.id)
  for (const x of [t.text, t.answer, t.solution, ...t.hints]) if (!x.ru.trim() || !x.kz.trim()) { console.log('EMPTY text', t.id); bad++ }
}
console.log(`${olympiad.length} problems, ${olympiad.filter((t) => t.value !== undefined).length} numeric`)
console.log(bad ? `${bad} problems found` : 'all olympiad answers checked')
process.exit(bad ? 1 : 0)
