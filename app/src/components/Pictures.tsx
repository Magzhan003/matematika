import type { CSSProperties } from 'react'
import { extraPictures } from './PicturesExtra'
import { thirdPictures } from './PicturesThird'
import { morePictures } from './PicturesMore'

const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` })
const ink = { fill: 'var(--ink)' }
const label = { ...ink, fontSize: 18, fontWeight: 700, fontFamily: 'KaTeX_Math, serif', fontStyle: 'italic' } as const

/** Squares on the sides of a 3-4-5 right triangle: 9 + 16 = 25. */
function Pythagoras() {
  return (
    <svg viewBox="0 -50 400 350" role="img" aria-label="3² + 4² = 5²">
      <polygon className="fade-in" style={{ ...d(0.2), fill: 'var(--accent-soft)', stroke: 'var(--accent)', strokeWidth: 2 }} points="140,80 140,170 50,170 50,80" />
      <polygon className="fade-in" style={{ ...d(0.6), fill: 'var(--good-soft)', stroke: 'var(--good)', strokeWidth: 2 }} points="140,170 260,170 260,290 140,290" />
      <polygon className="fade-in" style={{ ...d(1.0), fill: 'var(--bad-soft)', stroke: 'var(--bad)', strokeWidth: 2 }} points="140,80 260,170 350,50 230,-40" />
      <polygon points="140,80 140,170 260,170" style={{ fill: 'var(--card)', stroke: 'var(--ink)', strokeWidth: 3 }} />
      <polyline points="140,155 155,155 155,170" style={{ fill: 'none', stroke: 'var(--ink)', strokeWidth: 2 }} />
      <text x="120" y="130" style={label}>a</text>
      <text x="195" y="192" style={label}>b</text>
      <text x="205" y="115" style={label}>c</text>
      <text className="fade-in" x="95" y="132" textAnchor="middle" style={{ ...d(0.2), ...ink, fontSize: 26, fontWeight: 700 }}>9</text>
      <text className="fade-in" x="200" y="240" textAnchor="middle" style={{ ...d(0.6), ...ink, fontSize: 26, fontWeight: 700 }}>16</text>
      <text className="fade-in" x="245" y="72" textAnchor="middle" style={{ ...d(1.0), ...ink, fontSize: 26, fontWeight: 700 }}>25</text>
    </svg>
  )
}

/** A circle cut into 8 sectors and laid out as an almost-rectangle πr × r. */
function CircleSectors() {
  const cx = 100, cy = 110, r = 70, n = 8
  const sectors = Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
    const p = (a: number) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
    return `M${cx},${cy} L${p(a0)} A${r},${r} 0 0 1 ${p(a1)} Z`
  })
  const x0 = 250, w = 55, top = 75, bottom = 145
  const tris: string[] = []
  for (let i = 0; i < 4; i++) {
    tris.push(`${x0 + i * w},${bottom} ${x0 + (i + 1) * w},${bottom} ${x0 + i * w + w / 2},${top}`)
    tris.push(`${x0 + i * w + w / 2},${top} ${x0 + (i + 1) * w + w / 2},${top} ${x0 + (i + 1) * w},${bottom}`)
  }
  const fill = (i: number) => (i % 2 ? 'var(--accent-soft)' : 'var(--good-soft)')
  return (
    <svg viewBox="0 0 520 200" role="img" aria-label="S = πr · r">
      {sectors.map((p, i) => (
        <path key={i} d={p} style={{ fill: fill(i), stroke: 'var(--ink)', strokeWidth: 1.5 }} />
      ))}
      <line x1={cx} y1={cy} x2={cx + r} y2={cy} style={{ stroke: 'var(--bad)', strokeWidth: 3 }} />
      <text x={cx + 30} y={cy - 8} style={label}>r</text>
      <text className="fade-in" x="192" y="118" textAnchor="middle" style={{ ...d(0.3), ...ink, fontSize: 28 }}>→</text>
      {tris.map((p, i) => (
        <polygon key={i} className="fade-in" points={p} style={{ ...d(0.4 + i * 0.12), fill: fill(i), stroke: 'var(--ink)', strokeWidth: 1.5 }} />
      ))}
      <line x1={x0 - 10} y1={top} x2={x0 - 10} y2={bottom} style={{ stroke: 'var(--bad)', strokeWidth: 3 }} />
      <text x={x0 - 28} y={(top + bottom) / 2 + 6} style={label}>r</text>
      <line x1={x0} y1={bottom + 18} x2={x0 + 4 * w + w / 2} y2={bottom + 18} style={{ stroke: 'var(--bad)', strokeWidth: 3 }} />
      <text x={x0 + 2.25 * w} y={bottom + 44} textAnchor="middle" style={label}>πr</text>
    </svg>
  )
}

/** Three parabolas: two roots, one root, no roots. */
function Parabolas() {
  const cases = [
    { x: 90, vy: 150, roots: [60, 120], text: 'D > 0' },
    { x: 270, vy: 120, roots: [270], text: 'D = 0' },
    { x: 450, vy: 90, roots: [], text: 'D < 0' },
  ]
  return (
    <svg viewBox="0 0 540 200" role="img" aria-label="D > 0, D = 0, D < 0">
      <line x1="10" y1="120" x2="530" y2="120" style={{ stroke: 'var(--muted)', strokeWidth: 2 }} />
      {cases.map((c, i) => (
        <g key={c.text} className="fade-in" style={d(0.3 + i * 0.5)}>
          <path d={`M${c.x - 60},30 Q${c.x},${2 * c.vy - 30} ${c.x + 60},30`} style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 4 }} />
          {c.roots.map((rx) => (
            <circle key={rx} cx={rx} cy="120" r="7" style={{ fill: 'var(--bad)' }} />
          ))}
          <text x={c.x} y="190" textAnchor="middle" style={{ ...ink, fontSize: 20, fontWeight: 700 }}>{c.text}</text>
        </g>
      ))}
    </svg>
  )
}

export const pictures = { pythagoras: Pythagoras, circle: CircleSectors, parabolas: Parabolas, ...morePictures, ...extraPictures, ...thirdPictures }
export type PictureId = keyof typeof pictures

export function Picture({ id }: { id: PictureId }) {
  const P = pictures[id]
  return (
    <div className="picture"><P /></div>
  )
}
