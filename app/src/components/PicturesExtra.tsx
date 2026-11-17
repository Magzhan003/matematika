import type { CSSProperties } from 'react'

const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` })
const ink = { fill: 'var(--ink)' }
const label = { ...ink, fontSize: 17, fontWeight: 700, fontFamily: 'KaTeX_Math, serif', fontStyle: 'italic' } as const
const plain = { ...ink, fontSize: 16, fontWeight: 700 } as const
const stroke = (color: string, w = 2): CSSProperties => ({ stroke: color, strokeWidth: w, fill: 'none' })

/** a² − b²: cut the corner and move the strip — a rectangle (a + b)(a − b). */
function DiffSquares() {
  return (
    <svg viewBox="0 0 410 200" role="img" aria-label="a² − b² = (a + b)(a − b)">
      <rect x="20" y="20" width="140" height="90" style={{ fill: 'var(--accent-soft)', stroke: 'var(--ink)', strokeWidth: 2 }} />
      <rect x="20" y="110" width="90" height="50" style={{ fill: 'var(--good-soft)', stroke: 'var(--ink)', strokeWidth: 2 }} />
      <rect x="110" y="110" width="50" height="50" style={{ fill: 'none', stroke: 'var(--muted)', strokeWidth: 2, strokeDasharray: '5 4' }} />
      <text x="135" y="141" textAnchor="middle" style={{ ...label, fill: 'var(--muted)' }}>b²</text>
      <text x="90" y="14" textAnchor="middle" style={label}>a</text>
      <text x="8" y="95" textAnchor="middle" style={label}>a</text>
      <text className="fade-in" x="178" y="112" style={{ ...d(0.3), ...ink, fontSize: 26 }}>→</text>
      <g className="fade-in" style={d(0.6)}>
        <rect x="210" y="55" width="140" height="90" style={{ fill: 'var(--accent-soft)', stroke: 'var(--ink)', strokeWidth: 2 }} />
        <rect x="350" y="55" width="50" height="90" style={{ fill: 'var(--good-soft)', stroke: 'var(--ink)', strokeWidth: 2 }} />
        <text x="305" y="48" textAnchor="middle" style={label}>a + b</text>
        <text x="305" y="172" textAnchor="middle" style={label}>a − b</text>
      </g>
    </svg>
  )
}

/** 2³ · 2⁴: three twos and four twos make seven twos. */
function PowerTwos() {
  const box = (x: number, y: number, color: string, delay: number) => (
    <g key={`${x}-${y}`} className="fade-in" style={d(delay)}>
      <rect x={x} y={y} width="40" height="40" rx="6" style={{ fill: color, stroke: 'var(--ink)', strokeWidth: 1.5 }} />
      <text x={x + 20} y={y + 27} textAnchor="middle" style={{ ...plain, fontSize: 20 }}>2</text>
    </g>
  )
  const top = [0, 1, 2].map((i) => box(20 + i * 46, 20, 'var(--accent-soft)', 0.1 + i * 0.1))
    .concat([0, 1, 2, 3].map((i) => box(180 + i * 46, 20, 'var(--good-soft)', 0.4 + i * 0.1)))
  const bottom = [0, 1, 2, 3, 4, 5, 6].map((i) => box(40 + i * 46, 100, i < 3 ? 'var(--accent-soft)' : 'var(--good-soft)', 1.0 + i * 0.08))
  return (
    <svg viewBox="0 0 400 160" role="img" aria-label="2³ · 2⁴ = 2⁷">
      {top}
      <text x="160" y="47" textAnchor="middle" style={{ ...plain, fontSize: 22 }}>·</text>
      <text x="80" y="78" textAnchor="middle" style={label}>3</text>
      <text x="249" y="78" textAnchor="middle" style={label}>4</text>
      {bottom}
      <text className="fade-in" x="201" y="158" textAnchor="middle" style={{ ...d(1.6), ...label }}>3 + 4 = 7</text>
    </svg>
  )
}

/** Arithmetic progression as a staircase: every bar is d higher. */
function Staircase() {
  const bars = [0, 1, 2, 3, 4, 5]
  return (
    <svg viewBox="0 0 360 210" role="img" aria-label="a₁, a₁ + d, a₁ + 2d …">
      <line x1="10" y1="180" x2="350" y2="180" style={stroke('var(--muted)')} />
      {bars.map((i) => {
        const h = 30 + i * 22
        return (
          <g key={i} className="fade-in" style={d(0.1 + i * 0.2)}>
            <rect x={25 + i * 55} y={180 - h} width="40" height={h} rx="3" style={{ fill: i === 0 ? 'var(--accent)' : 'var(--accent-soft)', stroke: 'var(--accent)', strokeWidth: 2 }} />
            <text x={45 + i * 55} y="200" textAnchor="middle" style={{ ...label, fontSize: 15 }}>{`a${'₁₂₃₄₅₆'[i]}`}</text>
            {i > 0 && <text x={45 + i * 55} y={180 - h - 6} textAnchor="middle" style={{ ...label, fontSize: 13, fill: 'var(--bad)' }}>+d</text>}
          </g>
        )
      })}
    </svg>
  )
}

/** Geometric progression: a folded sheet doubles its thickness every time. */
function Doubling() {
  const cols = [1, 2, 4, 8, 16]
  return (
    <svg viewBox="0 0 360 200" role="img" aria-label="1, 2, 4, 8, 16">
      <line x1="10" y1="170" x2="350" y2="170" style={stroke('var(--muted)')} />
      {cols.map((n, i) => (
        <g key={n} className="fade-in" style={d(0.1 + i * 0.3)}>
          {Array.from({ length: n }, (_, k) => (
            <rect key={k} x={20 + i * 68} y={164 - k * 8} width="44" height="6" rx="1.5"
              style={{ fill: k % 2 ? 'var(--good-soft)' : 'var(--good)', stroke: 'var(--good)', strokeWidth: 1 }} />
          ))}
          <text x={42 + i * 68} y="190" textAnchor="middle" style={plain}>{n}</text>
          {i > 0 && <text x={8 + i * 68} y="105" textAnchor="middle" style={{ ...label, fontSize: 14, fill: 'var(--bad)' }}>·2</text>}
        </g>
      ))}
    </svg>
  )
}

/** Floor 6 × 4: tiles inside are the area, the edge is the perimeter. */
function TileGrid() {
  const cells = Array.from({ length: 24 }, (_, i) => i)
  return (
    <svg viewBox="0 0 230 170" role="img" aria-label="6 × 4">
      {cells.map((i) => (
        <rect key={i} className="fade-in" x={30 + (i % 6) * 30} y={20 + Math.floor(i / 6) * 30} width="30" height="30"
          style={{ ...d(0.05 * i), fill: (i + Math.floor(i / 6)) % 2 ? 'var(--accent-soft)' : 'var(--card)', stroke: 'var(--line)', strokeWidth: 1.5 }} />
      ))}
      <rect className="fade-in" x="30" y="20" width="180" height="120" style={{ ...d(1.4), ...stroke('var(--bad)', 4) }} />
      <text x="120" y="160" textAnchor="middle" style={label}>a = 6</text>
      <text x="16" y="85" textAnchor="middle" style={label}>4</text>
    </svg>
  )
}

/** A 3 × 2 × 4 box drawn in oblique projection, split into unit cubes. */
function CubeBox() {
  const v = (x1: number, y1: number, x2: number, y2: number, k: string) => <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} style={stroke('var(--ink)', 1.2)} />
  return (
    <svg viewBox="0 0 210 200" role="img" aria-label="V = abc">
      <rect x="40" y="50" width="90" height="120" style={{ fill: 'var(--accent-soft)', stroke: 'var(--ink)', strokeWidth: 2 }} />
      <polygon points="40,50 130,50 160,26 70,26" style={{ fill: 'var(--good-soft)', stroke: 'var(--ink)', strokeWidth: 2 }} />
      <polygon points="130,50 160,26 160,146 130,170" style={{ fill: 'var(--bad-soft)', stroke: 'var(--ink)', strokeWidth: 2 }} />
      {[70, 100].map((x) => v(x, 50, x, 170, 'fv' + x))}
      {[80, 110, 140].map((y) => v(40, y, 130, y, 'fh' + y))}
      {v(55, 38, 145, 38, 'td')}
      {[70, 100].map((x) => v(x, 50, x + 30, 26, 'tw' + x))}
      {v(145, 38, 145, 158, 'rd')}
      {[80, 110, 140].map((y) => v(130, y, 160, y - 24, 'rh' + y))}
      <text x="85" y="190" textAnchor="middle" style={plain}>3</text>
      <text x="25" y="115" textAnchor="middle" style={plain}>4</text>
      <text x="158" y="18" textAnchor="middle" style={plain}>2</text>
    </svg>
  )
}

/** Cylinder as a stack of equal coins: base πr² repeated over the height h. */
function Coins() {
  const layers = [140, 120, 100, 80, 60]
  return (
    <svg viewBox="0 0 240 200" role="img" aria-label="V = πr²h">
      <line x1="40" y1="40" x2="40" y2="160" style={stroke('var(--ink)', 2)} />
      <line x1="180" y1="40" x2="180" y2="160" style={stroke('var(--ink)', 2)} />
      <path d="M40,160 A70,18 0 0 0 180,160" style={stroke('var(--ink)', 2)} />
      {layers.map((y, i) => (
        <path key={y} className="fade-in" d={`M40,${y} A70,18 0 0 0 180,${y}`} style={{ ...d(0.2 + i * 0.2), ...stroke('var(--accent)', 2), strokeDasharray: '4 3' }} />
      ))}
      <ellipse cx="110" cy="40" rx="70" ry="18" style={{ fill: 'var(--accent-soft)', stroke: 'var(--ink)', strokeWidth: 2 }} />
      <line x1="110" y1="40" x2="180" y2="40" style={stroke('var(--bad)', 3)} />
      <text x="142" y="35" style={label}>r</text>
      <line x1="200" y1="40" x2="200" y2="160" style={stroke('var(--bad)', 3)} />
      <text x="210" y="105" style={label}>h</text>
    </svg>
  )
}

/** Distance between A(1; 2) and B(4; 6) on the grid: legs 3 and 4. */
function CoordDistance() {
  const u = 25, ox = 30, oy = 190
  const P = (x: number, y: number) => [ox + x * u, oy - y * u] as const
  const [ax, ay] = P(1, 2), [bx, by] = P(4, 6), [cx, cy] = P(4, 2)
  return (
    <svg viewBox="0 0 210 210" role="img" aria-label="d = 5">
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i}>
          <line x1={ox + i * u} y1={oy} x2={ox + i * u} y2={oy - 7 * u} style={stroke('var(--line)', 1)} />
          <line x1={ox} y1={oy - i * u} x2={ox + 6 * u} y2={oy - i * u} style={stroke('var(--line)', 1)} />
        </g>
      ))}
      <line x1={ox} y1={oy - 7 * u} x2={ox + 6 * u} y2={oy - 7 * u} style={stroke('var(--line)', 1)} />
      <line x1={ox} y1={oy} x2={ox + 6 * u} y2={oy} style={stroke('var(--muted)', 2)} />
      <line x1={ox} y1={oy} x2={ox} y2={oy - 7 * u} style={stroke('var(--muted)', 2)} />
      <line className="fade-in" x1={ax} y1={ay} x2={cx} y2={cy} style={{ ...d(0.3), ...stroke('var(--good)', 4) }} />
      <line className="fade-in" x1={cx} y1={cy} x2={bx} y2={by} style={{ ...d(0.6), ...stroke('var(--bad)', 4) }} />
      <line className="fade-in" x1={ax} y1={ay} x2={bx} y2={by} style={{ ...d(0.9), ...stroke('var(--accent)', 4) }} />
      <circle cx={ax} cy={ay} r="5" style={{ fill: 'var(--ink)' }} />
      <circle cx={bx} cy={by} r="5" style={{ fill: 'var(--ink)' }} />
      <text x={ax - 14} y={ay + 18} style={plain}>A</text>
      <text x={bx + 7} y={by} style={plain}>B</text>
      <text x={(ax + cx) / 2} y={ay + 18} textAnchor="middle" style={{ ...plain, fill: 'var(--good)' }}>3</text>
      <text x={cx + 8} y={(cy + by) / 2 + 5} style={{ ...plain, fill: 'var(--bad)' }}>4</text>
      <text x={(ax + bx) / 2 - 18} y={(ay + by) / 2} style={{ ...label, fill: 'var(--accent)' }}>d</text>
    </svg>
  )
}

/** y = x² and its tangent at x = 1: the slope is 2. */
function Tangent() {
  const u = 40, ox = 150, oy = 175
  const P = (x: number, y: number) => `${ox + x * u},${oy - y * u}`
  const curve = Array.from({ length: 41 }, (_, i) => -2 + i * 0.1).map((x) => P(x, x * x)).join(' ')
  return (
    <svg viewBox="0 0 300 200" role="img" aria-label="(x²)' = 2x">
      <line x1="20" y1={oy} x2="290" y2={oy} style={stroke('var(--muted)')} />
      <line x1={ox} y1="10" x2={ox} y2="195" style={stroke('var(--muted)')} />
      <polyline points={curve} style={stroke('var(--accent)', 3)} />
      <line className="fade-in" x1={ox + 0.1 * u} y1={oy - (2 * 0.1 - 1) * u} x2={ox + 2.4 * u} y2={oy - (2 * 2.4 - 1) * u}
        style={{ ...d(0.5), ...stroke('var(--bad)', 3) }} />
      <circle cx={ox + u} cy={oy - u} r="6" style={{ fill: 'var(--ink)' }} />
      <text x="22" y="100" style={label}>y = x²</text>
      <text className="fade-in" x={ox + 2.0 * u} y={oy - 1.2 * u} style={{ ...d(0.8), ...label, fill: 'var(--bad)' }}>k = 2</text>
      <text x={ox + u - 4} y={oy + 18} style={plain}>1</text>
    </svg>
  )
}

export const extraPictures = {
  diffSquares: DiffSquares,
  powerTwos: PowerTwos,
  staircase: Staircase,
  doubling: Doubling,
  tileGrid: TileGrid,
  cubeBox: CubeBox,
  coins: Coins,
  coordDistance: CoordDistance,
  tangent: Tangent,
}
