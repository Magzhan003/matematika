import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Level } from '../../data/formulas'
import { pick, rand } from '../../lib/games'
import { Tex } from '../Tex'
import type { GameProps } from './common'

type Target = { tex: string; v: number }
const RANGE: Record<Level, [number, number]> = { easy: [0, 10], medium: [-5, 5], hard: [-5, 5] }

function target(level: Level): Target {
  if (level === 'easy') {
    const kind = rand(0, 3)
    if (kind === 0) { const n = rand(1, 9); return { tex: `${n}{,}5`, v: n + 0.5 } }
    if (kind === 1) { const d = pick([2, 4]); const n = rand(1, d * 10 - 1); return n % d ? { tex: `\\dfrac{${n}}{${d}}`, v: n / d } : { tex: `${n / d}`, v: n / d } }
    if (kind === 2) { const v = rand(1, 99) / 10; return { tex: String(v).replace('.', '{,}'), v } }
    const n = rand(1, 9); const q = pick([[1, 4], [3, 4], [1, 2]]); return { tex: `${n}\\tfrac{${q[0]}}{${q[1]}}`, v: n + q[0] / q[1] }
  }
  if (level === 'medium') {
    const kind = rand(0, 3)
    if (kind === 0) { const v = rand(-49, 49) / 10; return { tex: String(v).replace('.', '{,}'), v } }
    if (kind === 1) { const d = pick([3, 4, 5, 6]); let n = 0; while (!(n % d)) n = rand(-4 * d, 4 * d); return { tex: `${n < 0 ? '-' : ''}\\dfrac{${Math.abs(n)}}{${d}}`, v: n / d } }
    if (kind === 2) { const p = pick([10, 20, 25, 50, 75]); const a = pick([4, 8, 10, 12, 16, 20]); return { tex: `\\dfrac{${p}}{100} \\cdot ${a}`, v: (p * a) / 100 } }
    const n = rand(1, 4); const q = pick([[1, 3], [2, 3], [1, 4], [3, 4]]); return { tex: `-${n}\\tfrac{${q[0]}}{${q[1]}}`, v: -(n + q[0] / q[1]) }
  }
  return pick<Target>([
    { tex: '\\sqrt{2}', v: Math.SQRT2 }, { tex: '\\sqrt{3}', v: Math.sqrt(3) }, { tex: '\\sqrt{10}', v: Math.sqrt(10) },
    { tex: '-\\sqrt{5}', v: -Math.sqrt(5) }, { tex: '\\pi', v: Math.PI }, { tex: '-\\dfrac{\\pi}{2}', v: -Math.PI / 2 },
    { tex: 'e', v: Math.E }, { tex: '\\log_2 8', v: 3 }, { tex: '\\log_3 \\tfrac{1}{9}', v: -2 }, { tex: '2^{-2}', v: 0.25 },
    { tex: '\\sin 30^\\circ', v: 0.5 }, { tex: '\\cos 180^\\circ', v: -1 }, { tex: '1 - \\sqrt{2}', v: 1 - Math.SQRT2 },
    { tex: '\\sqrt{3} + 1', v: Math.sqrt(3) + 1 }, { tex: '\\lg 1000', v: 3 }, { tex: '-\\sqrt{17}', v: -Math.sqrt(17) },
    { tex: '\\dfrac{\\pi}{4}', v: Math.PI / 4 }, { tex: '\\operatorname{tg} 45^\\circ', v: 1 }, { tex: '(-2)^3 : 4', v: -2 },
    { tex: '\\sqrt[3]{20}', v: Math.cbrt(20) }, { tex: '-\\log_2 6', v: -Math.log2(6) }, { tex: '0{,}3 \\cdot 7', v: 2.1 },
  ])
}

const ROUNDS = 10
const fmt = (v: number) => String(Number(v.toFixed(2))).replace('.', ',')

/** Number-line sniper: click where the number is. The closer, the more points. */
export function Sniper({ level, onDone }: GameProps) {
  const { t } = useTranslation()
  const [lo, hi] = RANGE[level]
  const [i, setI] = useState(0)
  const [tg, setTg] = useState(() => target(level))
  const [shot, setShot] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [last, setLast] = useState(0)
  const line = useRef<SVGSVGElement>(null)
  const X = (v: number) => 40 + ((v - lo) / (hi - lo)) * 920

  const fire = (e: React.PointerEvent) => {
    if (shot !== null) return
    const m = line.current!.getScreenCTM()!.inverse()
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m)
    const v = Math.max(lo, Math.min(hi, lo + ((p.x - 40) / 920) * (hi - lo)))
    const err = Math.abs(v - tg.v) / (hi - lo)
    const pts = Math.max(0, Math.round(100 * (1 - err * 10)))
    setShot(v)
    setLast(pts)
    setTotal(total + pts)
  }
  const next = () => {
    if (i + 1 >= ROUNDS) return onDone({ score: total, text: t('games.line.done', { n: total }), xp: Math.round(total / 30) })
    setI(i + 1)
    setTg(target(level))
    setShot(null)
  }
  const ticks = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k)

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="game-stats">
        <span>{t('test.question', { n: i + 1, total: ROUNDS })}</span>
        <span>{t('games.score')}: <b>{total}</b></span>
      </div>
      <div className="bar"><div style={{ width: `${(i / ROUNDS) * 100}%` }} /></div>
      <div className="truth-card"><Tex className="flash-tex" tex={tg.tex} /></div>
      <p className="muted small" style={{ margin: 0 }}>{t('games.line.ask')}</p>
      <svg ref={line} className="numline" viewBox="0 0 1000 120" onPointerDown={fire} role="img" aria-label={t('games.line.ask')}>
        <rect x="0" y="0" width="1000" height="120" className="numline-hit" />
        <line x1="20" y1="60" x2="980" y2="60" className="numline-axis" />
        {ticks.map((v) => (
          <g key={v}>
            <line x1={X(v)} y1={48} x2={X(v)} y2={72} className="numline-tick" />
            <text x={X(v)} y={98} textAnchor="middle" className="numline-label">{v}</text>
            {v < hi && <line x1={X(v + 0.5)} y1={54} x2={X(v + 0.5)} y2={66} className="numline-tick small" />}
          </g>
        ))}
        {shot !== null && (
          <>
            <line x1={X(shot)} y1={60} x2={X(tg.v)} y2={60} className="numline-gap" />
            <circle cx={X(shot)} cy={60} r={9} className="numline-shot" />
            <path d={`M ${X(tg.v)} 38 l -8 -14 h 16 z`} className="numline-true" />
            <text x={X(tg.v)} y={18} textAnchor="middle" className="numline-value">{fmt(tg.v)}</text>
          </>
        )}
      </svg>
      {shot !== null && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={last >= 70 ? 'answer' : 'answer wrong'}>
            {t('games.line.result', { pts: last, v: fmt(tg.v), you: fmt(shot) })}
          </span>
          <button className="btn btn-primary" onClick={next}>{i + 1 >= ROUNDS ? t('test.finish') : t('test.next')} →</button>
        </div>
      )}
    </div>
  )
}
