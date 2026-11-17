import type { CSSProperties } from 'react'

const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` })
const ink = { fill: 'var(--ink)' }
const label = { ...ink, fontSize: 17, fontWeight: 700, fontFamily: 'KaTeX_Math, serif', fontStyle: 'italic' } as const
const plain = { ...ink, fontSize: 15, fontWeight: 700 } as const
const stroke = (color: string, w = 2): CSSProperties => ({ stroke: color, strokeWidth: w, fill: 'none' })

/** Two lines and their intersection point = the solution of a system. */
function TwoLines() {
  const l1 = [[20, 190], [280, 40]], l2 = [[20, 60], [280, 180]]
  const [[x1, y1], [x2, y2]] = l1, [[x3, y3], [x4, y4]] = l2
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / den
  const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / den
  return (
    <svg viewBox="0 0 300 220" role="img" aria-label="(x; y)">
      <line x1="10" y1="200" x2="290" y2="200" style={stroke('var(--muted)')} />
      <line x1="20" y1="10" x2="20" y2="210" style={stroke('var(--muted)')} />
      <line className="fade-in" x1={x1} y1={y1} x2={x2} y2={y2} style={{ ...d(0.2), ...stroke('var(--accent)', 4) }} />
      <line className="fade-in" x1={x3} y1={y3} x2={x4} y2={y4} style={{ ...d(0.6), ...stroke('var(--good)', 4) }} />
      <circle className="fade-in" cx={px} cy={py} r="8" style={{ ...d(1.1), fill: 'var(--bad)' }} />
      <text className="fade-in" x={px + 12} y={py - 10} style={{ ...d(1.1), ...label }}>(x; y)</text>
    </svg>
  )
}

/** Upward parabola: negative between the roots (shaded), positive outside. */
function ParabolaBand() {
  const P = (t: number) => [40 + 220 * t, 20 + 2 * t * (1 - t) * 300] as const
  const t1 = (1 - Math.sqrt(1 / 3)) / 2, t2 = 1 - t1
  const curve = Array.from({ length: 61 }, (_, i) => P(i / 60).join(',')).join(' ')
  const band = [...Array.from({ length: 41 }, (_, i) => P(t1 + ((t2 - t1) * i) / 40).join(','))].join(' ')
  const [ax] = P(t1), [bx] = P(t2)
  return (
    <svg viewBox="0 0 300 200" role="img" aria-label="x1 < x < x2">
      <polygon className="fade-in" points={band} style={{ ...d(0.6), fill: 'var(--bad-soft)', stroke: 'none' }} />
      <line x1="10" y1="120" x2="290" y2="120" style={stroke('var(--muted)', 2)} />
      <polyline points={curve} style={stroke('var(--accent)', 4)} />
      <circle cx={ax} cy="120" r="6" style={{ fill: 'var(--card)', stroke: 'var(--ink)', strokeWidth: 2 }} />
      <circle cx={bx} cy="120" r="6" style={{ fill: 'var(--card)', stroke: 'var(--ink)', strokeWidth: 2 }} />
      <text x={ax - 8} y="142" style={label}>x₁</text>
      <text x={bx - 8} y="142" style={label}>x₂</text>
      <text className="fade-in" x="40" y="100" style={{ ...d(0.9), ...plain, fill: 'var(--good)', fontSize: 24 }}>+</text>
      <text className="fade-in" x="146" y="160" style={{ ...d(1.1), ...plain, fill: 'var(--bad)', fontSize: 24 }}>−</text>
      <text className="fade-in" x="250" y="100" style={{ ...d(1.3), ...plain, fill: 'var(--good)', fontSize: 24 }}>+</text>
    </svg>
  )
}

/** Marks 5, 3, 4, 5, 3 and the mean level 4. */
function MeanBars() {
  const xs = [5, 3, 4, 5, 3]
  return (
    <svg viewBox="0 0 300 200" role="img" aria-label="mean = 4">
      <line x1="20" y1="170" x2="290" y2="170" style={stroke('var(--muted)')} />
      {xs.map((v, i) => (
        <g key={i} className="fade-in" style={d(0.1 + i * 0.15)}>
          <rect x={35 + i * 52} y={170 - v * 25} width="36" height={v * 25} rx="4" style={{ fill: v > 4 ? 'var(--accent)' : 'var(--accent-soft)', stroke: 'var(--accent)', strokeWidth: 2 }} />
          <text x={53 + i * 52} y="190" textAnchor="middle" style={plain}>{v}</text>
        </g>
      ))}
      <line className="fade-in" x1="25" y1="70" x2="290" y2="70" style={{ ...d(1.0), stroke: 'var(--bad)', strokeWidth: 3, strokeDasharray: '8 5' }} />
      <text className="fade-in" x="200" y="60" style={{ ...d(1.0), ...label, fill: 'var(--bad)' }}>x̄ = 4</text>
    </svg>
  )
}

/** An arc as long as the radius: the angle is 1 radian. */
function Radian() {
  const c = 110, r = 80
  const ex = c + r * Math.cos(1), ey = c - r * Math.sin(1)
  return (
    <svg viewBox="0 0 260 220" role="img" aria-label="1 rad">
      <circle cx={c} cy={c} r={r} style={stroke('var(--ink)', 2)} />
      <path d={`M${c},${c} L${c + 28},${c} A28,28 0 0 0 ${c + 28 * Math.cos(1)},${c - 28 * Math.sin(1)} Z`} style={{ fill: 'var(--accent)', opacity: 0.5 }} />
      <line x1={c} y1={c} x2={c + r} y2={c} style={stroke('var(--good)', 4)} />
      <line x1={c} y1={c} x2={ex} y2={ey} style={stroke('var(--good)', 4)} />
      <path className="fade-in" d={`M${c + r},${c} A${r},${r} 0 0 0 ${ex},${ey}`} style={{ ...d(0.4), ...stroke('var(--bad)', 6) }} />
      <text x={c + 38} y={c + 18} style={{ ...label, fill: 'var(--good)' }}>r</text>
      <text className="fade-in" x={c + r * Math.cos(0.5) + 8} y={c - r * Math.sin(0.5)} style={{ ...d(0.4), ...label, fill: 'var(--bad)' }}>r</text>
      <text className="fade-in" x={c + 32} y={c - 10} style={{ ...d(0.8), ...plain, fontSize: 13 }}>1</text>
    </svg>
  )
}

export const thirdPictures = { twoLines: TwoLines, parabolaBand: ParabolaBand, meanBars: MeanBars, radian: Radian }
