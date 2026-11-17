import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Level } from '../../data/formulas'
import { pick, rand, shuffle } from '../../lib/games'
import { Graph } from '../calc/Graph'
import { Tex } from '../Tex'
import type { GameProps } from './common'

type F = { expr: string; tex: string }
const nz = (a: number, b: number) => { let v = 0; while (v === 0) v = rand(a, b); return v }
const sgn = (v: number) => (v < 0 ? `- ${-v}` : `+ ${v}`)
const coef = (k: number) => (k === 1 ? '' : k === -1 ? '-' : String(k))

/** Function families: each makes a random member from parameters. */
const families: Record<string, { level: Level; make: (p?: number[]) => { f: F; p: number[] } }> = {
  linear: {
    level: 'easy',
    make: (p = [nz(-3, 3), rand(-4, 4)]) => {
      const [k, b] = p
      return { p, f: { expr: `${k}*x + ${b}`, tex: `y = ${coef(k)}x ${b ? sgn(b) : ''}` } }
    },
  },
  constant: {
    level: 'easy',
    make: (p = [nz(-4, 4)]) => ({ p, f: { expr: `${p[0]} + 0*x`, tex: `y = ${p[0]}` } }),
  },
  parabola: {
    level: 'medium',
    make: (p = [pick([-1, 1, 2, -2]), rand(-3, 3), rand(-3, 3)]) => {
      const [a, m, n] = p
      const inner = m === 0 ? 'x' : `(x ${sgn(-m)})`
      return { p, f: { expr: `${a}*(x - (${m}))^2 + (${n})`, tex: `y = ${coef(a)}${inner}^2 ${n ? sgn(n) : ''}` } }
    },
  },
  hyperbola: {
    level: 'medium',
    make: (p = [pick([-4, -2, -1, 1, 2, 4])]) => ({ p, f: { expr: `${p[0]}/x`, tex: `y = \\dfrac{${p[0]}}{x}` } }),
  },
  abs: {
    level: 'medium',
    make: (p = [rand(-3, 3), rand(-2, 2)]) => {
      const [m, n] = p
      return { p, f: { expr: `abs(x - (${m})) + (${n})`, tex: `y = |x ${m ? sgn(-m) : ''}| ${n ? sgn(n) : ''}` } }
    },
  },
  sqrt: {
    level: 'hard',
    make: (p = [rand(-3, 2), rand(-2, 2)]) => {
      const [m, n] = p
      return { p, f: { expr: `sqrt(x - (${m})) + (${n})`, tex: `y = \\sqrt{x ${m ? sgn(-m) : ''}} ${n ? sgn(n) : ''}` } }
    },
  },
  exp: {
    level: 'hard',
    make: (p = [pick([2, 3, 0.5]), rand(-2, 1)]) => {
      const [a, n] = p
      const base = a === 0.5 ? '\\left(\\tfrac{1}{2}\\right)' : String(a)
      return { p, f: { expr: `${a}^x + (${n})`, tex: `y = ${base}^x ${n ? sgn(n) : ''}` } }
    },
  },
  log: {
    level: 'hard',
    make: (p = [rand(-2, 1), rand(-2, 2)]) => {
      const [m, n] = p
      return { p, f: { expr: `log(x - (${m}), 2) + (${n})`, tex: `y = \\log_2(x ${m ? sgn(-m) : ''}) ${n ? sgn(n) : ''}` } }
    },
  },
  sin: {
    level: 'hard',
    make: (p = [pick([1, 2, -1]), pick([1, 2])]) => {
      const [A, k] = p
      return { p, f: { expr: `${A}*sin(${k}*x)`, tex: `y = ${coef(A)}\\sin ${k === 1 ? 'x' : `${k}x`}` } }
    },
  },
  cos: {
    level: 'hard',
    make: (p = [pick([1, 2, -1]), pick([1, 2])]) => {
      const [A, k] = p
      return { p, f: { expr: `${A}*cos(${k}*x)`, tex: `y = ${coef(A)}\\cos ${k === 1 ? 'x' : `${k}x`}` } }
    },
  },
}
const rank: Record<Level, number> = { easy: 0, medium: 1, hard: 2 }

/** A question: the graph of one function and 4 formulas (same family and a neighbour family). */
function question(level: Level) {
  const names = Object.keys(families).filter((n) => rank[families[n].level] <= rank[level] && n !== 'constant')
  const own = names.filter((n) => families[n].level === level)
  const fam = pick(Math.random() < 0.7 && own.length ? own : names)
  const right = families[fam].make()
  const opts: F[] = [right.f]
  // distractors: change one parameter (sign or value), sometimes another family
  for (let i = 0; opts.length < 4 && i < 60; i++) {
    let f: F
    if (i > 20 || Math.random() < 0.25) {
      f = families[pick(names)].make().f
    } else {
      const p = [...right.p]
      const j = rand(0, p.length - 1)
      p[j] = Math.random() < 0.5 && p[j] !== 0 ? -p[j] : p[j] + pick([-2, -1, 1, 2])
      if (fam === 'hyperbola' && p[0] === 0) continue
      if (fam === 'exp' && p[0] <= 0) continue
      if (fam === 'parabola' && p[0] === 0) continue
      f = families[fam].make(p).f
    }
    if (!opts.some((o) => o.tex === f.tex)) opts.push(f)
  }
  const options = shuffle(opts)
  return { right: right.f, options, correct: options.indexOf(right.f) }
}

const ROUNDS = 10

export function GraphGuess({ level, onDone }: GameProps) {
  const { t } = useTranslation()
  const [i, setI] = useState(0)
  const [q, setQ] = useState(() => question(level))
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const started = useRef(Date.now())
  const fns = useMemo(() => [q.right.expr], [q])

  const choose = (k: number) => {
    if (picked !== null) return
    setPicked(k)
    if (k === q.correct) setScore(score + 1)
  }
  const next = () => {
    if (i + 1 >= ROUNDS) {
      const sec = Math.round((Date.now() - started.current) / 1000)
      return onDone({ score, text: t('games.graph.done', { n: score, total: ROUNDS, sec }), xp: score * 3 })
    }
    setI(i + 1)
    setQ(question(level))
    setPicked(null)
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="game-stats">
        <span>{t('test.question', { n: i + 1, total: ROUNDS })}</span>
        <span>{t('games.score')}: <b>{score}</b></span>
      </div>
      <div className="bar"><div style={{ width: `${(i / ROUNDS) * 100}%` }} /></div>
      <p style={{ margin: 0, fontWeight: 600 }}>{t('games.graph.ask')}</p>
      <Graph key={i} fns={fns} height={280} fixedView={[-6, 6, -5, 5]} quiz />
      <div className="graph-options">
        {q.options.map((o, k) => {
          const st = picked === null ? '' : k === q.correct ? 'right' : k === picked ? 'wrong' : ''
          return (
            <button key={k} className={`option ${st}`} disabled={picked !== null} onClick={() => choose(k)}>
              <b className="opt-letter">{'ABCD'[k]}</b> <Tex tex={o.tex} />
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={picked === q.correct ? 'answer' : 'answer wrong'}>{picked === q.correct ? t('test.correct') : t('games.graph.wrong')}</span>
          <button className="btn btn-primary" onClick={next}>{i + 1 >= ROUNDS ? t('test.finish') : t('test.next')} →</button>
        </div>
      )}
    </div>
  )
}
