import { formulas, type Formula, type Level } from '../data/formulas'

export type GameId = 'memory' | 'cards' | 'truth' | 'sprint' | 'balance' | 'graph' | 'line' | 'boss' | 'duel'
export const gameIds: GameId[] = ['boss', 'duel', 'balance', 'graph', 'line', 'memory', 'cards', 'truth', 'sprint']
export const levels: Level[] = ['easy', 'medium', 'hard']

const rank: Record<Level, number> = { easy: 0, medium: 1, hard: 2 }
export const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
export function shuffle<T>(a: T[]): T[] {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

/** Formulas up to the chosen level; the chosen level itself comes first. */
export function formulaPool(level: Level): Formula[] {
  const pool = formulas.filter((f) => rank[f.level] <= rank[level])
  return [...shuffle(pool.filter((f) => f.level === level)), ...shuffle(pool.filter((f) => f.level !== level))]
}

/** Lower is better for these games (fewest moves). */
export const lowerIsBetter: Record<GameId, boolean> = {
  memory: true, cards: false, truth: false, sprint: false, balance: false, graph: false, line: false, boss: false, duel: false,
}

/* ---------------- "Find the mistake": corrupt a formula ---------------- */

const rules: [RegExp, string][] = [
  [/\+/, '-'],
  [/(?<![\\a-z{(])-(?!\\)/, '+'],
  [/\^2/, '^3'],
  [/\^\{?3\}?/, '^2'],
  [/\\dfrac\{1\}\{2\}/, '\\dfrac{1}{3}'],
  [/\\dfrac\{1\}\{3\}/, '\\dfrac{1}{2}'],
  [/\\dfrac\{4\}\{3\}/, '\\dfrac{3}{4}'],
  [/4ac/, '2ac'],
  [/2ab/, 'ab'],
  [/180\^\\circ/, '360^\\circ'],
  [/\\sin/, '\\cos'],
  [/\\cos/, '\\sin'],
  [/2\\pi/, '\\pi'],
  [/\\pi r\^2/, '2\\pi r^2'],
  [/n-1/, 'n+1'],
  [/m\+n/, 'mn'],
  [/\{mn\}/, '{m+n}'],
  [/n!/, '(n-1)!'],
  [/= 1\b/, '= 0'],
  [/\{100\}/, '{10}'],
  [/\\cdot/, '+'],
  [/\}\{2\}/, '}{4}'],
  [/\\dfrac\{m\}\{n\}/, '\\dfrac{n}{m}'],
  [/ad = bc/, 'ab = cd'],
  [/a\^c = b/, 'b^c = a'],
  [/abc/, 'a + b + c'],
  [/S\\,h/, 'S + h'],
  [/a\\,h_a/, 'a + h_a'],
]

export function corrupt(tex: string): string | null {
  for (const [re, to] of shuffle(rules)) {
    if (re.test(tex)) {
      const out = tex.replace(re, to)
      if (out !== tex) return out
    }
  }
  return null
}

export type TruthQuestion = { fid: string; tex: string; isTrue: boolean; correctTex: string }

export function truthQuestion(level: Level, avoid?: string): TruthQuestion {
  const wantBad = Math.random() < 0.5
  // Only formulas we can actually break may be shown "with a mistake", so right/wrong stays 50/50.
  const pool = formulaPool(level).filter((f) => f.id !== avoid && (!wantBad || corrupt(f.tex)))
  const f = pick(pool.slice(0, Math.max(8, Math.ceil(pool.length / 2))))
  const bad = wantBad ? corrupt(f.tex) : null
  return { fid: f.id, tex: bad ?? f.tex, isTrue: !bad, correctTex: f.tex }
}

/* ---------------- Mental arithmetic sprint ---------------- */

export type SprintProblem = { tex: string; answer: number }

export function sprintProblem(level: Level): SprintProblem {
  if (level === 'easy') {
    return pick([
      () => { const a = rand(10, 99), b = rand(10, 99); return { tex: `${a} + ${b}`, answer: a + b } },
      () => { const a = rand(20, 99), b = rand(10, a); return { tex: `${a} - ${b}`, answer: a - b } },
      () => { const a = rand(2, 10), b = rand(2, 10); return { tex: `${a} \\cdot ${b}`, answer: a * b } },
      () => { const b = rand(2, 10), q = rand(2, 10); return { tex: `${b * q} : ${b}`, answer: q } },
    ])()
  }
  if (level === 'medium') {
    return pick([
      () => { const a = rand(11, 25), b = rand(2, 9); return { tex: `${a} \\cdot ${b}`, answer: a * b } },
      () => { const b = rand(3, 12), q = rand(3, 15); return { tex: `${b * q} : ${b}`, answer: q } },
      () => { const a = rand(2, 15); return { tex: `${a}^2`, answer: a * a } },
      () => { const a = rand(-20, 20), b = rand(-20, 20); return { tex: `${a} + (${b})`, answer: a + b } },
      () => { const a = rand(-9, 9), b = rand(-9, 9); return { tex: `(${a}) \\cdot (${b})`, answer: a * b } },
    ])()
  }
  return pick([
    () => { const p = pick([10, 20, 25, 50]), n = rand(2, 40) * (100 / gcd(p, 100)); return { tex: `${p}\\% \\cdot ${n} = \\dfrac{${p}}{100} \\cdot ${n}`, answer: (n * p) / 100 } },
    () => { const k = rand(2, 10); return { tex: `2^{${k}}`, answer: 2 ** k } },
    () => { const k = rand(2, 20); return { tex: `\\sqrt{${k * k}}`, answer: k } },
    () => { const a = rand(2, 9), x = rand(-9, 9), b = rand(-20, 20); return { tex: `${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${a * x + b}\\quad x = ?`, answer: x } },
    () => { const a = rand(3, 15); return { tex: `${a}^2 - ${a - 1}^2`, answer: 2 * a - 1 } },
  ])()
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a
}
