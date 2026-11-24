/** Teacher's journal storage: class works (by work code) and students' result codes, kept in localStorage. */
import { decodeResult, decodeWork, type Result } from './workcode'

export type Row = { name: string; code: string }
/** One saved class work: its code (to rebuild the tasks), title, date and the students' results. */
export type Entry = { code: string; title: string; created: string; rows: Row[] }

export const CODE = /r[0-9a-z]{3}-?[0-9a-z]{4}-?[0-9a-z]{4}-?[0-9a-z]{4}/i
export const keyOf = (seed: number) => `journal:${seed}`
export const today = () => new Date().toISOString().slice(0, 10)

export function load(seed: number): Entry | null {
  try {
    const raw = localStorage.getItem(keyOf(seed))
    if (!raw) return null
    const v = JSON.parse(raw)
    // the first version kept only the list of results
    return Array.isArray(v) ? { code: '', title: '', created: '', rows: v } : v
  } catch {
    return null
  }
}
export function store(seed: number, e: Entry) {
  try { localStorage.setItem(keyOf(seed), JSON.stringify(e)) } catch { /* storage unavailable */ }
}
export function allWorks(): { seed: number; e: Entry }[] {
  const out: { seed: number; e: Entry }[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!
      if (!k.startsWith('journal:')) continue
      const seed = Number(k.slice(8))
      const e = load(seed)
      if (e) out.push({ seed, e })
    }
  } catch { /* storage unavailable */ }
  return out.sort((a, b) => (b.e.created || '').localeCompare(a.e.created || ''))
}

/** 5-point school mark from the percentage (85 / 65 / 40). */
export const mark = (p: number) => (p >= 85 ? 5 : p >= 65 ? 4 : p >= 40 ? 3 : 2)
export const results = (rows: Row[]) => rows.map((r) => ({ ...r, res: decodeResult(r.code) as Result })).filter((r) => r.res)
export const avgPercent = (e: Entry) => {
  const rs = results(e.rows)
  if (!rs.length) return null
  return Math.round(rs.reduce((s, r) => s + r.res.ok.filter(Boolean).length / r.res.ok.length, 0) / rs.length * 100)
}

export const normName = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

export type WorkResult = { title: string; date: string; percent: number; mark: number; done: number; total: number }
export type TopicStat = { topic: string; ok: number; n: number }
export type Portfolio = { name: string; works: WorkResult[]; topics: TopicStat[] }

/** Everything one student did in the journal: each work's result and right/total by topic. */
export function portfolioOf(name: string, works = allWorks()): Portfolio {
  const key = normName(name)
  const res: WorkResult[] = []
  const tp = new Map<string, TopicStat>()
  let shownName = name.trim()
  for (const { seed, e } of works) {
    const w = e.code ? decodeWork(e.code) : null
    for (const r of results(e.rows)) {
      if (normName(r.name) !== key || r.res.seed !== seed) continue
      shownName = r.name.trim()
      const done = r.res.ok.filter(Boolean).length, total = r.res.ok.length
      const percent = Math.round((done / total) * 100)
      res.push({ title: e.title || e.code, date: e.created, percent, mark: mark(percent), done, total })
      if (w) r.res.ok.forEach((ok, i) => {
        const id = w.types[i]?.topic
        if (!id) return
        const s = tp.get(id) ?? { topic: id, ok: 0, n: 0 }
        s.n++; if (ok) s.ok++
        tp.set(id, s)
      })
    }
  }
  return { name: shownName, works: res.sort((a, b) => (a.date || '').localeCompare(b.date || '')), topics: [...tp.values()].sort((a, b) => a.ok / a.n - b.ok / b.n) }
}

/** Every student name found in the journal (as first written), sorted. */
export function studentNames(works = allWorks()): string[] {
  const m = new Map<string, string>()
  for (const { e } of works) for (const r of e.rows) if (r.name.trim() && !m.has(normName(r.name))) m.set(normName(r.name), r.name.trim())
  return [...m.values()].sort((a, b) => a.localeCompare(b, 'ru'))
}
