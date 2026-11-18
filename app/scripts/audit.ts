/**
 * Content audit: npx tsx scripts/audit.ts
 *  1) every TeX string renders in KaTeX;
 *  2) numeric chains in the worked examples agree (3^2 + 4^2 = 25, x = 3600/100 -> x = 36);
 *  3) formulas written as identities (one "=") hold at random points;
 *  4) every formula with a calculator can produce a number question.
 * Prints suspicious places for a human to look at.
 */
import katex from 'katex'
import { parse } from 'mathjs'
import { formulas } from '../src/data/formulas'
import { lessons } from '../src/data/lessons'
import { choices, findMistake, gens, seeded } from '../src/lib/bank'
import { numberQuestion } from '../src/lib/quiz'

const known = new Set(['sin', 'cos', 'tan', 'cot', 'log', 'log10', 'sqrt', 'nthRoot', 'pi', 'abs', 'alpha', 'beta', 'gamma', 'phi', 'e', 'exp', 'factorial', 'asin', 'acos', 'atan', 'deg'])

/** Find the {...} group starting at i (s[i] === '{'); returns [content, indexAfter]. */
function group(s: string, i: number): [string, number] {
  let depth = 0
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++
    else if (s[j] === '}' && --depth === 0) return [s.slice(i + 1, j), j + 1]
  }
  throw new Error('brace')
}

/** A small TeX -> mathjs converter for school formulas; throws on anything it does not know. */
export function texToExpr(src: string): string {
  let s = src
    .replace(/\\left|\\right|\\displaystyle|\\,|\\;|\\!|\\quad|\\qquad|~/g, ' ')
    .replace(/\{,\}/g, '.')
    .replace(/−/g, '-')
    .replace(/\\cdot|\\times/g, '*')
    .replace(/\\operatorname\{tg\}|\\tg\b/g, '\\tan').replace(/\\operatorname\{ctg\}|\\ctg\b/g, '\\cot')
    .replace(/\^\s*\{?\\circ\}?/g, '*pi/180')
    .replace(/\\%/g, '*0.01')
    .replace(/\\pi/g, ' pi ')
    .replace(/\\alpha/g, ' alpha ').replace(/\\beta/g, ' beta ').replace(/\\gamma/g, ' gamma ').replace(/\\varphi|\\phi/g, ' phi ')
  // fractions and roots (recursive through repeated passes)
  for (let pass = 0; pass < 12; pass++) {
    const m = s.match(/\\[dt]?frac\s*\{|\\sqrt\s*\[|\\sqrt\s*\{/)
    if (!m) break
    const i = m.index!
    if (m[0].includes('frac')) {
      const [a, j] = group(s, i + m[0].length - 1)
      const [b, k] = group(s, j)
      s = s.slice(0, i) + `((${a})/(${b}))` + s.slice(k)
    } else if (m[0].includes('[')) {
      const close = s.indexOf(']', i)
      const n = s.slice(i + m[0].length, close)
      const [a, k] = group(s, close + 1)
      s = s.slice(0, i) + `nthRoot((${a}),(${n}))` + s.slice(k)
    } else {
      const [a, k] = group(s, i + m[0].length - 1)
      s = s.slice(0, i) + `sqrt(${a})` + s.slice(k)
    }
  }
  s = s
    .replace(/\\log_\{?([0-9a-z.]+)\}?\s*\(([^()]*)\)/g, 'log(($2),($1))')
    .replace(/\\log_\{?([0-9a-z.]+)\}?\s*([0-9.]+(?:\^\{?[0-9.]+\}?)?|[a-z])/g, 'log(($2),($1))')
    .replace(/\\lg\s*\(([^()]*)\)/g, 'log10($1)').replace(/\\lg\s*([0-9.]+(?:\^\{?[0-9.]+\}?)?|[a-z])/g, 'log10($1)')
    .replace(/\\ln\s*\(([^()]*)\)/g, 'log($1)').replace(/\\ln\s*([0-9.]+|[a-z])/g, 'log($1)')
    .replace(/\\(sin|cos|tan|cot)\s*\^\s*\{?2\}?\s*(\([^()]*\)|[0-9.]+(?:\*pi\/180)?(?:\s*(?:alpha|beta|gamma|phi|[a-z]))?|alpha|beta|gamma|phi|[a-z])/g, '($1($2))^2')
    .replace(/\\(sin|cos|tan|cot)\s*(\([^()]*\)|[0-9.]+(?:\*pi\/180)?(?:\s*(?:alpha|beta|gamma|phi|[a-z]))?|alpha|beta|gamma|phi|[a-z])/g, '$1($2)')
    .replace(/\^\s*\{([^{}]*)\}/g, '^($1)')
    .replace(/_\{([^{}]*)\}/g, '_$1')
    .replace(/\|([^|]+)\|/g, 'abs($1)')
    .replace(/[{}]/g, (c) => (c === '{' ? '(' : ')'))
  if (/\\/.test(s)) throw new Error('unknown command')
  // implicit products of letters: "ab" -> "a*b" (keep known names and subscripted names)
  s = s.replace(/[A-Za-z][A-Za-z0-9_]*/g, (w) => (known.has(w) || w.includes('_') || w.length === 1 ? w : w.split('').join('*')))
  return s
}

const ev = (expr: string, scope: Record<string, number> = {}): number => {
  const v = parse(expr).evaluate({ ...scope })
  if (typeof v !== 'number') throw new Error('not a number')
  return v
}
const close = (a: number, b: number, rel = 1e-6) => Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * rel)

const problems: string[] = []
let rendered = 0, chainsChecked = 0, identities = 0, identitySkipped = 0

for (const f of formulas) {
  // 1) KaTeX
  for (const t of [f.tex, ...f.example.steps, f.example.answer]) {
    try {
      katex.renderToString(t, { throwOnError: true })
      rendered++
    } catch (e) {
      problems.push(`[katex] ${f.id}: ${(e as Error).message.slice(0, 80)} in ${t}`)
    }
  }

  // 2) numeric chains in the example
  // one line may hold several equalities: "x = 4,\qquad y = 2"
  const lines = [...f.example.steps, f.example.answer]
    .map((l) => l.replace(/^\s*\\Rightarrow\s*/, ''))
    .filter((l) => !l.includes(':')) // lists like "C_4^k: 1, 4, 6, 4, 1"
    .flatMap((l) => l.split(/,\s*\\(?:qquad|quad|;|\s)|,\\ /))
  type Chain = { label: string; values: { v: number; approx: boolean; src: string }[] }
  const chains: Chain[] = []
  let cur: Chain | null = null
  for (const line of lines) {
    // skip lists ("C: 1, 4, 6"), mixed numbers (2\dfrac{3}{5}) and anything with conditions
    if (/:|\d\s*\\[dt]?frac/.test(line)) { cur = null; continue }
    if (/[;]|\\text|\\Leftrightarrow|\\pm|\\in|\\ne|\\le|\\ge|<|>|\\infty|\\int|'/.test(line)) { cur = null; continue }
    const parts = line.split(/=|\\approx/)
    const approxAt = new Set<number>()
    let idx = 0
    for (const m of line.matchAll(/=|\\approx/g)) { idx++; if (m[0] === '\\approx') approxAt.add(idx) }
    const label = parts[0].trim()
    const isLabel = /^[A-Za-z](_\{?[0-9a-z]+\}?)?$/.test(label) || /^\\(alpha|beta|gamma)$/.test(label)
    if (label === '' && cur) {
      // continues the previous chain
    } else if (isLabel) {
      cur = chains.find((c) => c.label === label) ?? null
      if (!cur) { cur = { label, values: [] }; chains.push(cur) }
    } else if (parts.length === 1 && cur) {
      // a bare answer continues the last chain
    } else {
      cur = { label: '', values: [] }
      chains.push(cur)
    }
    parts.forEach((part, k) => {
      if (k === 0 && (isLabel || label === '')) return
      if (/[a-zA-Z]/.test(part.replace(/\\(dfrac|frac|tfrac|sqrt|cdot|times|pi|left|right|circ|sin|cos|operatorname|log|lg|ln|tg|ctg|quad|qquad)/g, '').replace(/\{tg\}|\{ctg\}/g, ''))) return
      try {
        const v = ev(texToExpr(part))
        if (Number.isFinite(v)) cur!.values.push({ v, approx: approxAt.has(k), src: part.trim() })
      } catch { /* not numeric */ }
    })
  }
  for (const c of chains) {
    if (c.values.length < 2) continue
    chainsChecked++
    const exact = c.values.filter((x) => !x.approx)
    const ref = exact[0] ?? c.values[0]
    for (const x of c.values) {
      const ok = x.approx ? close(x.v, ref.v, 0.02) || Math.abs(x.v - ref.v) < 0.051 : close(x.v, ref.v, 1e-6)
      if (!ok) problems.push(`[example] ${f.id}: ${ref.src} = ${ref.v} but ${x.src} = ${x.v}`)
    }
  }

  // 3) identities: exactly one "=", no conditions
  // only true identities (algebra, trigonometry, logarithms), not definitions "X = …"
  const main = f.tex.split(/,\\quad|,\\qquad|\\qquad|\\quad|;\\/)[0]
  // relations between different quantities (not identities): they cannot hold at random points
  const relations = ['vieta', 'joint-work', 'trig-right-triangle', 'universal-substitution']
  const definition = relations.includes(f.id) || /^\s*[A-Za-z](_\{?[\w+-]+\}?)?(\^\{?2\}?)?\s*=/.test(main)
  if (['algebra', 'trigonometry', 'logarithms', 'arithmetic'].includes(f.section) && !definition && (main.match(/=/g) ?? []).length === 1 && !/\\Leftrightarrow|\\Rightarrow|\\text|\\int|'|\\lim|\\sum|\\ldots|\\dots|!|\\parallel|\\perp|\\nearrow|\\overline|\\vec|\\angle|C_|A_|P_|\\triangle|\\infty|\\le|\\ge|<|>|\\pm/.test(main)) {
    try {
      const [L, R] = main.split('=').map(texToExpr)
      let tested = 0, bad = 0
      for (let k = 0; k < 6; k++) {
        const scope: Record<string, number> = {}
        for (const name of new Set([...(L + ' ' + R).matchAll(/[A-Za-z][A-Za-z0-9_]*/g)].map((m) => m[0]))) {
          if (!known.has(name) || ['alpha', 'beta', 'gamma', 'phi'].includes(name)) scope[name] = 0.3 + Math.random() * 1.1
          if (name === 'k' || name === 'n') scope[name] = Math.floor(Math.random() * 5) - 2 // integer parameters
        }
        try {
          const a = ev(L, scope), b = ev(R, scope)
          if (!Number.isFinite(a) || !Number.isFinite(b)) continue
          tested++
          if (!close(a, b, 1e-6)) bad++
        } catch { /* skip point */ }
      }
      if (tested >= 3) {
        identities++
        if (bad === tested) problems.push(`[formula?] ${f.id}: both sides differ at random points (may be a definition, not an identity): ${main}`)
      } else identitySkipped++
    } catch { identitySkipped++ }
  }

  // 4) calculator formulas can make a number question
  if (f.calc) {
    let ok = false
    for (let k = 0; k < 5 && !ok; k++) ok = numberQuestion(f) !== null
    if (!ok) problems.push(`[calc] ${f.id}: could not make a number question from ${f.calc.eq}`)
  }
}

// problem bank: answers, options and typical mistakes
let bankProblems = 0, mistakesSeen = 0
const withMistakes = new Set<string>()
for (const g of gens) {
  const r = seeded(7)
  for (let k = 0; k < 200; k++) {
    const p = g.make(r)
    bankProblems++
    const ch = choices(p, r)
    if (ch.options.length < 4) problems.push(`[bank] ${g.id}: only ${ch.options.length} options`)
    for (const m of p.mistakes ?? []) {
      if (m.tex === p.answer) continue
      if (m.values && p.values && m.values.length === p.values.length && m.values.every((v, i) => Math.abs(v - p.values![i]) < 1e-9)) continue
      mistakesSeen++
      withMistakes.add(g.id)
      try { katex.renderToString(m.tex, { throwOnError: true }) } catch { problems.push(`[mistake] ${g.id}: bad TeX ${m.tex}`) }
      if (!findMistake(p, { picked: m.tex })) problems.push(`[mistake] ${g.id}: option ${m.tex} not recognised`)
      if (m.values && p.values && m.values.length === 1 && !findMistake(p, { typed: String(m.values[0]) })) problems.push(`[mistake] ${g.id}: typed ${m.values[0]} not recognised`)
      if (!ch.options.includes(m.tex) && ch.options.length === 5 && (p.mistakes ?? []).length <= 4) problems.push(`[mistake] ${g.id}: ${m.tex} missing in options`)
    }
  }
}

// lesson slides: every board line renders
for (const [id, slides] of Object.entries(lessons)) {
  if (!formulas.some((f) => f.id === id)) problems.push(`[lesson] ${id}: no formula with this id`)
  for (const s of slides) for (const t of s.lines ?? []) {
    try {
      katex.renderToString(t, { throwOnError: true })
      rendered++
    } catch (e) {
      problems.push(`[katex] lesson ${id}: ${(e as Error).message.slice(0, 80)} in ${t}`)
    }
  }
}

console.log(`formulas ${formulas.length} | TeX rendered ${rendered} | example chains checked ${chainsChecked} | identities tested ${identities} (skipped ${identitySkipped})`)
console.log(`bank: ${bankProblems} problems from ${gens.length} generators | typical mistakes checked ${mistakesSeen} | generators with mistakes ${withMistakes.size}`)
console.log(problems.length ? [...new Set(problems)].slice(0, 60).join('\n') : 'no problems found')
