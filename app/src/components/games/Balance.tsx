import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Level } from '../../data/formulas'
import { rand } from '../../lib/games'
import { Tex } from '../Tex'
import { useCountdown, type GameProps } from './common'

/** One side of the scale: a·x + b (all numbers are non-negative). */
type Side = { x: number; n: number }
type Eq = { L: Side; R: Side; root: number }

/** Equations with a positive integer root; the unknown ends up on the left. */
function makeEq(level: Level): Eq {
  const root = rand(1, level === 'easy' ? 9 : 12)
  if (level === 'easy') {
    if (Math.random() < 0.5) { const b = rand(1, 12); return { L: { x: 1, n: b }, R: { x: 0, n: root + b }, root } }
    const a = rand(2, 5); return { L: { x: a, n: 0 }, R: { x: 0, n: a * root }, root }
  }
  if (level === 'medium') {
    const a = rand(2, 5), b = rand(1, 15)
    return { L: { x: a, n: b }, R: { x: 0, n: a * root + b }, root }
  }
  const c = rand(1, 4), a = c + rand(1, 4), b = rand(0, 10)
  const d = (a - c) * root + b
  return { L: { x: a, n: b }, R: { x: c, n: d }, root }
}

const sideTex = (s: Side) => {
  const xs = s.x === 0 ? '' : s.x === 1 ? 'x' : `${s.x}x`
  if (!xs) return String(s.n)
  return s.n ? `${xs} + ${s.n}` : xs
}

/** Weights of one pan: boxes with x, then 10-, 5- and 1-weights. */
function Pan({ s }: { s: Side }) {
  const w: number[] = []
  let n = s.n
  for (const k of [10, 5, 1]) while (n >= k) { w.push(k); n -= k }
  return (
    <div className="pan">
      <div className="pan-items">
        {Array.from({ length: s.x }, (_, i) => <span key={`x${i}`} className="bx">x</span>)}
        {w.map((k, i) => <span key={i} className={`wt w${k}`}>{k}</span>)}
      </div>
      <div className="pan-plate" />
    </div>
  )
}

/** Balance scale: do the same thing to both pans until x stands alone. */
export function Balance({ level, onDone }: GameProps) {
  const { t } = useTranslation()
  const [eq, setEq] = useState(() => makeEq(level))
  const [moves, setMoves] = useState(0)
  const [solved, setSolved] = useState(0)
  const [flash, setFlash] = useState('')
  const [log, setLog] = useState<string[]>([])
  const solvedRef = useRef(0)
  const left = useCountdown(150, () =>
    onDone({ score: solvedRef.current, text: t('games.balance.done', { n: solvedRef.current }), xp: Math.min(40, solvedRef.current * 5) }),
  )

  const { L, R } = eq
  const done = L.x === 1 && L.n === 0 && R.x === 0
  const apply = (next: Eq, note: string) => {
    setEq(next)
    setMoves(moves + 1)
    setLog([...log, note])
    if (next.L.x === 1 && next.L.n === 0 && next.R.x === 0) {
      solvedRef.current += 1
      setSolved(solvedRef.current)
      setFlash(t('games.balance.solved', { x: next.R.n }))
      setTimeout(() => { setEq(makeEq(level)); setLog([]); setFlash('') }, 1300)
    }
  }
  const minN = Math.min(L.n, R.n)
  const minX = Math.min(L.x, R.x)
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
  const g = [L.x, L.n, R.x, R.n].filter(Boolean).reduce(gcd, 0)
  const divisors = g > 1 ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((k) => g % k === 0) : []

  // remove the same number of units (1, 5, all common) or the same x from both pans
  const actions: { label: string; ok: boolean; run: () => void }[] = [
    { label: '− 1', ok: minN >= 1, run: () => apply({ ...eq, L: { ...L, n: L.n - 1 }, R: { ...R, n: R.n - 1 } }, '-1') },
    { label: '− 5', ok: minN >= 5, run: () => apply({ ...eq, L: { ...L, n: L.n - 5 }, R: { ...R, n: R.n - 5 } }, '-5') },
    { label: `− ${minN}`, ok: minN > 5, run: () => apply({ ...eq, L: { ...L, n: L.n - minN }, R: { ...R, n: R.n - minN } }, `-${minN}`) },
    { label: '− x', ok: minX >= 1, run: () => apply({ ...eq, L: { ...L, x: L.x - 1 }, R: { ...R, x: R.x - 1 } }, '-x') },
    ...divisors.map((k) => ({
      label: `÷ ${k}`, ok: true,
      run: () => apply({ ...eq, L: { x: L.x / k, n: L.n / k }, R: { x: R.x / k, n: R.n / k } }, `:${k}`),
    })),
  ]

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="game-stats">
        <span>{t('games.balance.solvedN')}: <b>{solved}</b></span>
        <span className="muted small">{t('games.moves')}: {moves}</span>
        <span className={left <= 15 ? 'timer low' : 'timer'}>⏱ {left}</span>
      </div>
      <div className="bar"><div style={{ width: `${(left / 150) * 100}%` }} /></div>
      <div className={`truth-card ${flash ? 'ok' : ''}`}>
        <Tex className="flash-tex" tex={flash ? `x = ${R.n}` : `${sideTex(L)} = ${sideTex(R)}`} />
      </div>
      <div className="scale" aria-hidden="true">
        <div className="scale-beam" />
        <div className="scale-pans"><Pan s={L} /><Pan s={R} /></div>
        <div className="scale-post" />
      </div>
      {flash ? (
        <div className="answer">{flash}</div>
      ) : (
        <div className="balance-actions">
          {actions.filter((a) => a.ok).map((a) => (
            <button key={a.label} className="btn" disabled={done} onClick={a.run}>{a.label} <span className="muted small">{t('games.balance.both')}</span></button>
          ))}
        </div>
      )}
      <p className="muted small" style={{ margin: 0 }}>{t('games.balance.hint')}</p>
    </div>
  )
}
