// Packs dist-single/ into one self-contained HTML file: ../Математика.html
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist-single')
const out = resolve(root, '..', 'Математика.html')

let html = readFileSync(join(dist, 'index.html'), 'utf8')
const read = (href) => readFileSync(join(dist, href.replace(/^\.?\//, '')), 'utf8')

// <link rel="stylesheet" href="./assets/x.css"> → <style>…</style>
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => `<style>${read(href)}</style>`)

// <script type="module" src="./assets/x.js"></script> → inline module
html = html.replace(/<script([^>]*)\ssrc="([^"]+)"[^>]*><\/script>/g, (_, attrs, src) => {
  const code = read(src).replace(/<\/script/gi, '<\\/script')
  return `<script type="module">${code}</script>`
})

// Drop modulepreload links and inline the favicon.
html = html.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '')
html = html.replace(/<link([^>]*)rel="icon"([^>]*)href="([^"]+)"([^>]*)>/, (m, a, b, href, c) => {
  const p = join(dist, href.replace(/^\.?\//, ''))
  if (!existsSync(p)) return ''
  return `<link${a}rel="icon"${b}href="data:image/svg+xml;base64,${readFileSync(p).toString('base64')}"${c}>`
})

const leftovers = html.match(/(src|href)="\.?\/?assets\/[^"]+"/g)
if (leftovers) throw new Error('Not inlined: ' + leftovers.join(', '))

writeFileSync(out, html)
console.log(`OK: ${out} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`)
