import type { CSSProperties } from 'react'

const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` })
const ink = { fill: 'var(--ink)' }
const label = { ...ink, fontSize: 18, fontWeight: 700, fontFamily: 'KaTeX_Math, serif', fontStyle: 'italic' } as const
const line = (color: string, w = 2): CSSProperties => ({ stroke: color, strokeWidth: w, fill: 'none' })

/** Sector between math angles t0 < t1 (degrees, counter-clockwise, y up). */
function sector(cx: number, cy: number, r: number, t0: number, t1: number) {
  const p = (t: number) => `${cx + r * Math.cos((t * Math.PI) / 180)},${cy - r * Math.sin((t * Math.PI) / 180)}`
  const large = t1 - t0 > 180 ? 1 : 0
  return `M${cx},${cy} L${p(t0)} A${r},${r} 0 ${large} 0 ${p(t1)} Z`
}

/** 10×10 grid with 15 cells filled: 15% of the whole. */
function PercentGrid() {
  const cells = Array.from({ length: 100 }, (_, i) => i)
  return (
    <svg viewBox="0 0 240 240" role="img" aria-label="15 / 100">
      {cells.map((i) => (
        <rect
          key={i}
          className={i < 15 ? 'fade-in' : undefined}
          style={{ ...(i < 15 ? d(0.1 + i * 0.06) : {}), fill: i < 15 ? 'var(--accent)' : 'var(--card)', stroke: 'var(--line)', strokeWidth: 1.5 }}
          x={10 + (i % 10) * 22} y={10 + Math.floor(i / 10) * 22} width="22" height="22"
        />
      ))}
    </svg>
  )
}

/** A balance: three boxes x and six sweets on the left, 21 on the right. */
function Balance() {
  const box = (x: number) => (
    <g key={x}>
      <rect x={x} y="62" width="30" height="30" rx="4" style={{ fill: 'var(--accent-soft)', stroke: 'var(--accent)', strokeWidth: 2 }} />
      <text x={x + 15} y="83" textAnchor="middle" style={label}>x</text>
    </g>
  )
  return (
    <svg viewBox="25 35 375 150" role="img" aria-label="3x + 6 = 21">
      <polygon points="210,110 190,180 230,180" style={{ fill: 'var(--space)' }} />
      <line x1="60" y1="110" x2="360" y2="110" style={line('var(--ink)', 5)} />
      <path d="M40,100 Q110,130 180,100" style={line('var(--muted)', 3)} />
      <path d="M240,100 Q310,130 380,100" style={line('var(--muted)', 3)} />
      {[45, 80, 115].map(box)}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} className="fade-in" cx={153 + (i % 2) * 14} cy={66 + Math.floor(i / 2) * 13} r="6" style={{ ...d(0.2 + i * 0.1), fill: 'var(--bad)' }} />
      ))}
      <circle cx="310" cy="72" r="28" style={{ fill: 'var(--bad-soft)', stroke: 'var(--bad)', strokeWidth: 2 }} />
      <text x="310" y="80" textAnchor="middle" style={{ ...ink, fontSize: 22, fontWeight: 700 }}>21</text>
    </svg>
  )
}

/** Square of side a + b = a² + ab + ab + b². */
function SquareSum() {
  const a = 120, b = 60, o = 30
  const part = (x: number, y: number, w: number, h: number, fill: string, text: string, delay: number) => (
    <g className="fade-in" style={d(delay)}>
      <rect x={x} y={y} width={w} height={h} style={{ fill, stroke: 'var(--ink)', strokeWidth: 2 }} />
      <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" style={{ ...label, fontSize: 22 }}>{text}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="(a+b)² = a² + 2ab + b²">
      {part(o, o, a, a, 'var(--accent-soft)', 'a²', 0.1)}
      {part(o + a, o, b, a, 'var(--bad-soft)', 'ab', 0.5)}
      {part(o, o + a, a, b, 'var(--bad-soft)', 'ab', 0.8)}
      {part(o + a, o + a, b, b, 'var(--good-soft)', 'b²', 1.1)}
      <text x={o + a / 2} y={o - 8} textAnchor="middle" style={label}>a</text>
      <text x={o + a + b / 2} y={o - 8} textAnchor="middle" style={label}>b</text>
      <text x={o - 14} y={o + a / 2 + 6} textAnchor="middle" style={label}>a</text>
      <text x={o - 14} y={o + a + b / 2 + 6} textAnchor="middle" style={label}>b</text>
    </svg>
  )
}

/** The three angles of a triangle laid side by side make a straight angle. */
function TriangleAngles() {
  const colors = ['var(--accent)', 'var(--good)', 'var(--bad)']
  const fan = { cx: 330, cy: 170 }
  return (
    <svg viewBox="20 35 415 170" role="img" aria-label="α + β + γ = 180°">
      <path d={sector(40, 170, 34, 0, 59.7)} style={{ fill: colors[0], opacity: 0.6 }} />
      <path d={sector(200, 170, 34, 126.9, 180)} style={{ fill: colors[1], opacity: 0.6 }} />
      <path d={sector(110, 50, 34, 239.7, 306.9)} style={{ fill: colors[2], opacity: 0.6 }} />
      <polygon points="40,170 200,170 110,50" style={line('var(--ink)', 3)} />
      <text x="80" y="160" style={label}>α</text>
      <text x="160" y="160" style={label}>β</text>
      <text x="104" y="98" style={label}>γ</text>
      <text className="fade-in" x="232" y="135" style={{ ...d(0.3), ...ink, fontSize: 28 }}>→</text>
      <line x1="250" y1={fan.cy} x2="420" y2={fan.cy} style={line('var(--ink)', 3)} />
      <path className="fade-in" d={sector(fan.cx, fan.cy, 60, 120.3, 180)} style={{ ...d(0.5), fill: colors[0], opacity: 0.6 }} />
      <path className="fade-in" d={sector(fan.cx, fan.cy, 60, 53.1, 120.3)} style={{ ...d(0.9), fill: colors[2], opacity: 0.6 }} />
      <path className="fade-in" d={sector(fan.cx, fan.cy, 60, 0, 53.1)} style={{ ...d(1.3), fill: colors[1], opacity: 0.6 }} />
      <text x="282" y="150" style={label}>α</text>
      <text x="322" y="128" style={label}>γ</text>
      <text x="362" y="155" style={label}>β</text>
      <text className="fade-in" x={fan.cx} y="196" textAnchor="middle" style={{ ...d(1.6), ...ink, fontSize: 18, fontWeight: 700 }}>180°</text>
    </svg>
  )
}

/** A triangle inside an a × h rectangle takes exactly half of it. */
function TriangleArea() {
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label="S = ½ a h">
      <rect x="40" y="40" width="240" height="120" style={{ fill: 'none', stroke: 'var(--muted)', strokeWidth: 2, strokeDasharray: '6 5' }} />
      <polygon className="fade-in" points="40,40 130,40 40,160" style={{ ...d(0.6), fill: 'var(--accent-soft)' }} />
      <polygon className="fade-in" points="130,40 280,40 280,160" style={{ ...d(0.9), fill: 'var(--good-soft)' }} />
      <polygon points="40,160 130,160 130,40" style={{ fill: 'var(--accent)', opacity: 0.55 }} />
      <polygon points="130,160 280,160 130,40" style={{ fill: 'var(--good)', opacity: 0.55 }} />
      <polygon points="40,160 280,160 130,40" style={line('var(--ink)', 3)} />
      <line x1="130" y1="40" x2="130" y2="160" style={{ stroke: 'var(--bad)', strokeWidth: 3, strokeDasharray: '5 4' }} />
      <text x="138" y="110" style={label}>h</text>
      <text x="160" y="185" textAnchor="middle" style={label}>a</text>
    </svg>
  )
}

/** Gauss: 1 + 100 = 2 + 99 = 3 + 98 = 101. */
function GaussPairs() {
  const xs: [string, number][] = [['1', 40], ['2', 90], ['3', 140], ['…', 260], ['98', 380], ['99', 430], ['100', 480]]
  const pairs: [number, number, number][] = [[40, 480, 34], [90, 430, 72], [140, 380, 108]]
  return (
    <svg viewBox="0 0 520 170" role="img" aria-label="1 + 100 = 101">
      {pairs.map(([x1, x2, top], i) => (
        <g key={x1} className="fade-in" style={d(0.3 + i * 0.5)}>
          <path d={`M${x1},132 Q${(x1 + x2) / 2},${2 * top - 132} ${x2},132`} style={line('var(--accent)', 3)} />
          <text x={(x1 + x2) / 2} y={top - 6} textAnchor="middle" style={{ ...ink, fontSize: 16, fontWeight: 700 }}>101</text>
        </g>
      ))}
      {xs.map(([s, x]) => (
        <text key={s} x={x} y="155" textAnchor="middle" style={{ ...ink, fontSize: 22, fontWeight: 700 }}>{s}</text>
      ))}
    </svg>
  )
}

/** Unit circle: the point of angle α is (cos α; sin α), hypotenuse 1. */
function UnitCircle() {
  const c = 130, r = 100, a = (40 * Math.PI) / 180
  const px = c + r * Math.cos(a), py = c - r * Math.sin(a)
  return (
    <svg viewBox="0 0 260 260" role="img" aria-label="sin²α + cos²α = 1">
      <line x1="15" y1={c} x2="245" y2={c} style={line('var(--muted)')} />
      <line x1={c} y1="15" x2={c} y2="245" style={line('var(--muted)')} />
      <circle cx={c} cy={c} r={r} style={line('var(--ink)', 2)} />
      <path d={sector(c, c, 26, 0, 40)} style={{ fill: 'var(--accent)', opacity: 0.5 }} />
      <line className="fade-in" x1={c} y1={c} x2={px} y2={py} style={{ ...d(0.2), ...line('var(--ink)', 3) }} />
      <line className="fade-in" x1={c} y1={c} x2={px} y2={c} style={{ ...d(0.6), ...line('var(--good)', 4) }} />
      <line className="fade-in" x1={px} y1={c} x2={px} y2={py} style={{ ...d(1.0), ...line('var(--bad)', 4) }} />
      <circle cx={px} cy={py} r="5" style={{ fill: 'var(--ink)' }} />
      <text x={c + 34} y={c - 8} style={{ ...label, fontSize: 15 }}>α</text>
      <text x={c + 26} y={c - 46} style={label}>1</text>
      <text x={(c + px) / 2} y={c + 22} textAnchor="middle" style={{ ...label, fontSize: 15, fill: 'var(--good)' }}>cos α</text>
      <text x={px + 6} y={(c + py) / 2 + 5} style={{ ...label, fontSize: 15, fill: 'var(--bad)' }}>sin α</text>
    </svg>
  )
}

/** Six faces of a die; the even ones are highlighted. */
function Dice() {
  const pips: Record<number, [number, number][]> = {
    1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  }
  return (
    <svg viewBox="0 0 430 80" role="img" aria-label="2, 4, 6">
      {[1, 2, 3, 4, 5, 6].map((n, i) => {
        const x = 10 + i * 70, even = n % 2 === 0
        return (
          <g key={n} className="fade-in" style={d(0.1 + i * 0.15)}>
            <rect x={x} y="10" width="60" height="60" rx="10"
              style={{ fill: even ? 'var(--accent-soft)' : 'var(--card)', stroke: even ? 'var(--accent)' : 'var(--line)', strokeWidth: even ? 3 : 2 }} />
            {pips[n].map(([dx, dy], j) => (
              <circle key={j} cx={x + 30 + dx * 15} cy={40 + dy * 15} r="5" style={{ fill: 'var(--ink)' }} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

export const morePictures = {
  percentGrid: PercentGrid,
  balance: Balance,
  squareSum: SquareSum,
  triangleAngles: TriangleAngles,
  triangleArea: TriangleArea,
  gauss: GaussPairs,
  unitCircle: UnitCircle,
  dice: Dice,
}
