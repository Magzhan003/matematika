/**
 * Apply the teacher's corrections from the proofreading table:
 *   npx tsx scripts/import-kz.ts ["../Казахские тексты для проверки.csv"]
 * For every row with a filled "Исправление" column the old Kazakh text is replaced in the source files.
 * Rows whose text is built at run time (bank problems with numbers) are listed as "not found" — fix them by hand.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const file = resolve(process.argv[2] ?? resolve(import.meta.dirname, '../../Казахские тексты для проверки.csv'))

/** Minimal CSV reader for ";"-separated, quoted cells (Excel may save without quotes too). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', q = false
  const sep = text.split('\n')[0].includes(';') ? ';' : ','
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === sep) { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

const files: string[] = []
const walk = (d: string) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx?$/.test(n)) files.push(p)
  }
}
walk(resolve(import.meta.dirname, '../src'))
const src = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]))

const rows = parseCsv(readFileSync(file, 'utf8').replace(/^﻿/, '')).slice(1)
let applied = 0
const notFound: string[] = []
for (const r of rows) {
  const [n, , where, , kz, fix] = r
  if (!fix?.trim() || fix.trim() === kz) continue
  // the text is stored in single quotes inside the sources
  const quoted = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  let hit = false
  for (const [f, text] of src) {
    if (text.includes(quoted(kz))) {
      src.set(f, text.split(quoted(kz)).join(quoted(fix.trim())))
      hit = true
    }
  }
  if (hit) applied++
  else notFound.push(`№${n} ${where}: ${kz.slice(0, 60)}`)
}
for (const [f, text] of src) if (text !== readFileSync(f, 'utf8')) writeFileSync(f, text)
console.log(`corrections applied: ${applied}`)
if (notFound.length) console.log(`not found in the sources (fix by hand):\n${notFound.join('\n')}`)
