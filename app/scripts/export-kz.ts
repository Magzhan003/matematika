/**
 * All Russian/Kazakh text pairs in one table for proofreading:
 *   npx tsx scripts/export-kz.ts  ->  ../Казахские тексты для проверки.csv  (opens in Excel)
 * Columns: №, раздел, где, русский, казахский, исправление (empty — for the teacher).
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// i18n.ts touches the DOM when it loads; a tiny stub is enough here
;(globalThis as Record<string, unknown>).document = { documentElement: {} }

type Row = [string, string, string, string]
const rows: Row[] = []
const hasLetters = (s: string) => /[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(s)
const add = (part: string, where: string, ru: string, kz: string) => {
  if (hasLetters(ru) || hasLetters(kz)) rows.push([part, where, ru, kz])
}

/** Walk two parallel objects (ru and kz trees). */
function walkPair(part: string, ru: unknown, kz: unknown, path: string) {
  if (typeof ru === 'string') return add(part, path, ru, typeof kz === 'string' ? kz : '⚠ нет перевода')
  if (Array.isArray(ru)) return ru.forEach((x, i) => walkPair(part, x, (kz as unknown[] | undefined)?.[i], `${path}[${i}]`))
  if (ru && typeof ru === 'object') {
    for (const [k, v] of Object.entries(ru)) walkPair(part, v, (kz as Record<string, unknown> | undefined)?.[k], path ? `${path}.${k}` : k)
  }
}

/** Find every {ru, kz} pair inside a data structure. */
function walkL(part: string, x: unknown, path: string) {
  if (!x || typeof x !== 'object') return
  const o = x as Record<string, unknown>
  if (typeof o.ru === 'string' && typeof o.kz === 'string' && Object.keys(o).length === 2) return add(part, path, o.ru, o.kz)
  if (Array.isArray(x)) return x.forEach((v, i) => walkL(part, v, `${path}[${i}]`))
  for (const [k, v] of Object.entries(o)) if (typeof v === 'object') walkL(part, v, path ? `${path}.${k}` : k)
}

const { default: i18n } = await import('../src/i18n')
const { topics } = await import('../src/data/topics')
const { formulas } = await import('../src/data/formulas')
const { lessons } = await import('../src/data/lessons')
const { topicLife, plots } = await import('../src/data/lesson-extras')
const { gens, seeded } = await import('../src/lib/bank')
const { scenarios } = await import('../src/lib/wordproblems')

walkPair('1. Интерфейс', i18n.getResourceBundle('ru', 'translation'), i18n.getResourceBundle('kz', 'translation'), '')
for (const t of topics) add('2. Темы', t.id, t.title.ru, t.title.kz)
for (const f of formulas) {
  add('3. Формулы', `${f.id} · название`, f.title.ru, f.title.kz)
  add('3. Формулы', `${f.id} · объяснение`, f.explain.ru, f.explain.kz)
  add('3. Формулы', `${f.id} · пример`, f.example.task.ru, f.example.task.kz)
  for (const v of f.calc?.vars ?? []) add('3. Формулы', `${f.id} · буква ${v.name}`, v.label.ru, v.label.kz)
}
for (const [id, slides] of Object.entries(lessons)) slides.forEach((s, i) => add('4. Уроки', `${id} · слайд ${i + 1} (${s.kind})`, s.text.ru, s.text.kz))
for (const [id, l] of Object.entries(topicLife)) add('5. Где пригодится', id, l.ru, l.kz)
for (const [id, p] of Object.entries(plots)) add('5. Графики в уроках', id, p.note.ru, p.note.kz)
for (const g of gens) {
  const p = g.make(seeded(1))
  add('6. Банк задач (пример текста)', g.id, p.text.ru, p.text.kz)
}
for (const s of scenarios) walkL('7. Текстовые задачи', s, s.id)

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
const head = ['№', 'Раздел', 'Где', 'Русский', 'Казахский', 'Исправление']
const csv = '﻿' + [head, ...rows.map((r, i) => [String(i + 1), ...r, ''])].map((r) => r.map(esc).join(';')).join('\r\n')
const out = resolve(import.meta.dirname, '../../Казахские тексты для проверки.csv')
writeFileSync(out, csv)
const missing = rows.filter((r) => r[3].startsWith('⚠')).length
console.log(`rows ${rows.length}, missing translations ${missing} -> ${out}`)
