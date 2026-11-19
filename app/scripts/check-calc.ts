/**
 * Calculator check: npx tsx scripts/check-calc.ts
 *  1) every example button of the solver tab gives an answer (no error, no 20-digit fractions);
 *  2) known problems give the known answer (the answer TeX must contain the expected text);
 *  3) every step note has a text in Russian and Kazakh.
 */
import { readFileSync } from 'node:fs'
import { solveAny } from '../src/lib/calc'

// i18n.ts touches document at start-up; a tiny stand-in is enough here
;(globalThis as unknown as { document: unknown }).document = { documentElement: {} }
const { default: i18n } = await import('../src/i18n')

const problems: string[] = []

// 1) examples
const src = readFileSync(new URL('../src/components/calc/SolverTab.tsx', import.meta.url), 'utf8')
const block = src.slice(src.indexOf('const examples'), src.indexOf('export function SolverTab'))
const items = [...block.matchAll(/\{ s: '([^']+)'(?:, a: '(\w+)')? \}/g)]
const notes = new Set<string>()
for (const m of items) {
  const r = solveAny(m[1], (m[2] ?? 'auto') as never)
  if ('error' in r) problems.push(`[example] ${m[1]}: ${r.error}`)
  else {
    if (/\d{9,}/.test(r.answer)) problems.push(`[example] ${m[1]}: long number in ${r.answer}`)
    r.steps.forEach((s) => s.note && notes.add(s.note))
  }
}

// 2) known answers
const known: [string, string][] = [
  ['15% от 200', '30'], ['200 + 15%', '230'], ['5000 - 20%', '4000'], ['30 от 120 в %', '25'], ['60 это 20%', '300'], ['200-дің 15%-ы', '30'],
  ['5 км в м', '5000'], ['2,5 ч в мин', '150'], ['72 км/ч в м/с', '20'], ['1500 г в кг', '1{,}5'],
  ['НОД(12, 18)', '6'], ['НОК(4; 6; 10)', '60'], ['C(5, 2)', '10'], ['A(5, 2)', '20'], ['P(4)', '24'],
  ['0,(3)', '\\frac{1}{3}'], ['1,2(36)', '\\frac{68}{55}'], ['2 1/2 + 1/3', '\\frac{17}{6}'], ['1,5 + 2,25', '3{,}75'],
  ['sin 30°', '\\frac{1}{2}'], ['cos 60° + sin 30°', '1'], ['lg 1000', '3'], ['log_3 81', '4'], ['sqrt(8)', '2 \\sqrt{2}'],
  ['|x - 1| < 3', '(-2;\\ 4)'], ['sqrt(x) < 3', '[0;\\ 9)'], ['log_2(x) <= 3', '(0;\\ 8]'], ['sqrt(x-1) >= 2', '[5;\\ +\\infty)'],
  ['sin x > 1/2', '(\\frac{\\pi}{6} + 2\\pi\\,n;\\ \\frac{5\\pi}{6} + 2\\pi\\,n)'], ['cos x <= 0', '[\\frac{\\pi}{2} + 2\\pi\\,n;\\ \\frac{3\\pi}{2} + 2\\pi\\,n]'],
  ['cos 2x <= 0', '[\\frac{\\pi}{4} + \\pi n;\\ \\frac{3\\pi}{4} + \\pi n]'], ['tg x >= 1', '[\\frac{\\pi}{4} + \\pi n;\\ \\frac{\\pi}{2} + \\pi n)'],
  ['sin(x - pi/3) >= 0', '[\\frac{\\pi}{3} + 2\\pi\\,n;\\ \\frac{4\\pi}{3} + 2\\pi\\,n]'], ['cos(x) > -1', '\\ne \\pi + 2\\pi\\,n'],
  ['x^2 - 5x + 6 > 0; x < 4', '(-\\infty;\\ 2) \\cup (3;\\ 4)'], ['x > 1; x < 0', '\\varnothing'],
  ['2sin²x - sin x - 1 = 0', '(-1)^{n+1} \\frac{\\pi}{6} + \\pi n;\\quad x = \\frac{\\pi}{2} + 2\\pi n'],
  ['sin(x) = -1/2', '(-1)^{n+1} \\frac{\\pi}{6} + \\pi n'], ['cos²x - cos x = 0', '2\\pi n'],
  ['x^2 - 5x + 6 = 0', 'x_2 = 2'], ['2x + 3y = 13; 3x - y = 3', 'x = 2,\\; y = 3'],
]
for (const [q, want] of known) {
  const r = solveAny(q)
  if ('error' in r) problems.push(`[known] ${q}: ${r.error}`)
  else {
    if (!r.answer.includes(want)) problems.push(`[known] ${q}: got ${r.answer}, want …${want}…`)
    r.steps.forEach((s) => s.note && notes.add(s.note))
  }
}

// 3) step notes are translated
for (const n of notes) {
  for (const lang of ['ru', 'kz']) {
    if (typeof i18n.getResource(lang, 'translation', n) !== 'string') problems.push(`[i18n] ${lang}: no text for step note ${n}`)
  }
}

console.log(`examples ${items.length} | known answers ${known.length} | step notes ${notes.size}`)
console.log(problems.length ? problems.join('\n') : 'all checks passed')
if (problems.length) process.exit(1)
