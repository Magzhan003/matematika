import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Tex } from '../Tex'

/** Live geometry: drag the points, every length, angle and area is recalculated at once. */

export type LabId = 'triangle' | 'circle' | 'polygon' | 'coord' | 'vectors' | 'lines'
export const labIds: LabId[] = ['triangle', 'circle', 'polygon', 'coord', 'vectors', 'lines']

/** Which lab fits a lesson topic (used on the "try it yourself" slide). */
export const labForTopic: Record<string, LabId> = {
  triangles: 'triangle', 'triangle-area': 'triangle', 'right-triangle': 'triangle',
  circle: 'circle', polygons: 'polygon', 'coord-plane': 'coord', vectors: 'vectors', 'angles-lines': 'lines',
}

type P = { x: number; y: number }
const W = 14, H = 10, S = 32 // grid: 14 × 10 units, 32 px per unit
const sx = (x: number) => x * S
const sy = (y: number) => (H - y) * S
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y)
const deg = (r: number) => (r * 180) / Math.PI
const angleAt = (v: P, a: P, b: P) => {
  const u = { x: a.x - v.x, y: a.y - v.y }, w = { x: b.x - v.x, y: b.y - v.y }
  const c = (u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y) || 1)
  return deg(Math.acos(Math.max(-1, Math.min(1, c))))
}
const fmt = (v: number, d = 2) => String(Number(v.toFixed(d))).replace('.', '{,}')
const txt = (v: number, d = 1) => String(Number(v.toFixed(d))).replace('.', ',')
const mid = (a: P, b: P): P => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const pts = (...ps: P[]) => ps.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')

/** Foot of the perpendicular from p to the line ab. */
function foot(p: P, a: P, b: P): P {
  const dx = b.x - a.x, dy = b.y - a.y
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)
  return { x: a.x + t * dx, y: a.y + t * dy }
}

/** SVG board with a grid and draggable points. `move` may correct a point (snap, keep on a circle…). */
function Board({ points, setPoints, move, children, axes = false, labels = true }: {
  points: Record<string, P>
  setPoints: (p: Record<string, P>) => void
  move?: (key: string, p: P) => P
  children: ReactNode
  axes?: boolean
  labels?: boolean
}) {
  const svg = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<string | null>(null)
  const toUnits = (e: React.PointerEvent): P => {
    const m = svg.current!.getScreenCTM()!.inverse()
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m)
    return { x: Math.max(0, Math.min(W, pt.x / S)), y: Math.max(0, Math.min(H, H - pt.y / S)) }
  }
  const snap = (p: P): P => ({ x: Math.round(p.x), y: Math.round(p.y) })
  return (
    <svg
      ref={svg}
      className="geo-board"
      viewBox={`-6 -6 ${W * S + 12} ${H * S + 12}`}
      onPointerMove={(e) => {
        if (!drag) return
        const raw = toUnits(e)
        setPoints({ ...points, [drag]: move ? move(drag, raw) : snap(raw) })
      }}
      onPointerUp={() => setDrag(null)}
      onPointerLeave={() => setDrag(null)}
    >
      {Array.from({ length: W + 1 }, (_, i) => <line key={`v${i}`} className="geo-grid" x1={sx(i)} y1={0} x2={sx(i)} y2={H * S} />)}
      {Array.from({ length: H + 1 }, (_, i) => <line key={`h${i}`} className="geo-grid" x1={0} y1={sy(i)} x2={W * S} y2={sy(i)} />)}
      {axes && (
        <>
          <line className="geo-axis" x1={0} y1={sy(5)} x2={W * S} y2={sy(5)} />
          <line className="geo-axis" x1={sx(7)} y1={0} x2={sx(7)} y2={H * S} />
          {[-6, -4, -2, 2, 4, 6].map((v) => <text key={`x${v}`} className="geo-tick" x={sx(7 + v)} y={sy(5) + 14} textAnchor="middle">{v}</text>)}
          {[-4, -2, 2, 4].map((v) => <text key={`y${v}`} className="geo-tick" x={sx(7) - 6} y={sy(5 + v) + 4} textAnchor="end">{v}</text>)}
        </>
      )}
      {children}
      {Object.entries(points).map(([k, p]) => (
        <g key={k} className={`geo-handle ${drag === k ? 'on' : ''}`} onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); setDrag(k) }}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={16} className="geo-hit" />
          <circle cx={sx(p.x)} cy={sy(p.y)} r={6} className="geo-dot" />
          {labels && <text x={sx(p.x) + 9} y={sy(p.y) - 9} className="geo-label">{k}</text>}
        </g>
      ))}
    </svg>
  )
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <div className="geo-facts">
      {rows.map(([k, v], i) => (
        <div key={i} className="geo-fact"><span className="muted small">{k}</span><Tex tex={v} /></div>
      ))}
    </div>
  )
}

function Toggle({ on, set, label, color }: { on: boolean; set: (v: boolean) => void; label: string; color: string }) {
  return (
    <label className="check-row geo-toggle">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      <i style={{ background: color }} /> {label}
    </label>
  )
}

function TriangleLab() {
  const { t } = useTranslation()
  const [p, setP] = useState<Record<string, P>>({ A: { x: 2, y: 2 }, B: { x: 10, y: 2 }, C: { x: 5, y: 8 } })
  const [show, setShow] = useState({ h: false, m: false, l: false, out: false, inn: false })
  const { A, B, C } = p
  const a = dist(B, C), b = dist(C, A), c = dist(A, B)
  const al = angleAt(A, B, C), be = angleAt(B, C, A), ga = angleAt(C, A, B)
  const area = Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2
  const per = a + b + c
  const flat = area < 1e-9
  // circumcenter and incenter
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y))
  const O = flat ? A : {
    x: ((A.x ** 2 + A.y ** 2) * (B.y - C.y) + (B.x ** 2 + B.y ** 2) * (C.y - A.y) + (C.x ** 2 + C.y ** 2) * (A.y - B.y)) / d,
    y: ((A.x ** 2 + A.y ** 2) * (C.x - B.x) + (B.x ** 2 + B.y ** 2) * (A.x - C.x) + (C.x ** 2 + C.y ** 2) * (B.x - A.x)) / d,
  }
  const I = { x: (a * A.x + b * B.x + c * C.x) / per, y: (a * A.y + b * B.y + c * C.y) / per }
  const R = dist(O, A), r = (2 * area) / per
  const right = [al, be, ga].findIndex((x) => Math.abs(x - 90) < 0.01)
  const kind = flat ? t('geo.flat') : right >= 0 ? t('geo.right') : Math.max(al, be, ga) > 90 ? t('geo.obtuse') : t('geo.acute')
  const sides: [P, P, P][] = [[A, B, C], [B, C, A], [C, A, B]]
  const set = (k: keyof typeof show) => (v: boolean) => setShow({ ...show, [k]: v })

  // Pythagoras check for a right triangle: legs around the right angle, hypotenuse opposite it
  const pyth = (() => {
    if (right < 0) return null
    const sq = [a * a, b * b, c * c]
    const hyp = sq[right]
    const legs = sq.filter((_, i) => i !== right)
    return `${fmt(legs[0], 1)} + ${fmt(legs[1], 1)} = ${fmt(hyp, 1)}`
  })()

  return (
    <div className="geo-lab">
      <Board points={p} setPoints={setP}>
        {!flat && show.out && <circle cx={sx(O.x)} cy={sy(O.y)} r={R * S} className="geo-line c-out" />}
        {!flat && show.inn && <circle cx={sx(I.x)} cy={sy(I.y)} r={r * S} className="geo-line c-in" />}
        <polygon points={pts(A, B, C)} className="geo-shape" />
        {!flat && sides.map(([v, x, y], i) => {
          const f = foot(v, x, y), m = mid(x, y)
          const lv = dist(v, x), lw = dist(v, y)
          const L = { x: (lw * x.x + lv * y.x) / (lv + lw), y: (lw * x.y + lv * y.y) / (lv + lw) }
          return (
            <g key={i}>
              {show.h && <><line className="geo-line c-h" x1={sx(v.x)} y1={sy(v.y)} x2={sx(f.x)} y2={sy(f.y)} /><line className="geo-line c-h dash" x1={sx(x.x)} y1={sy(x.y)} x2={sx(f.x)} y2={sy(f.y)} /></>}
              {show.m && <line className="geo-line c-m" x1={sx(v.x)} y1={sy(v.y)} x2={sx(m.x)} y2={sy(m.y)} />}
              {show.l && <line className="geo-line c-l" x1={sx(v.x)} y1={sy(v.y)} x2={sx(L.x)} y2={sy(L.y)} />}
            </g>
          )
        })}
        {!flat && ([[A, al], [B, be], [C, ga]] as [P, number][]).map(([v, x], i) => {
          const g = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 }
          const k = Math.min(0.8, 1.35 / (dist(v, g) || 1))
          return <text key={i} className="geo-angle" x={sx(v.x + (g.x - v.x) * k)} y={sy(v.y + (g.y - v.y) * k) + 4} textAnchor="middle">{txt(x)}°</text>
        })}
        {sides.map(([, x, y], i) => {
          const m = mid(x, y)
          return <text key={`s${i}`} className="geo-side" x={sx(m.x)} y={sy(m.y) - 6} textAnchor="middle">{txt(dist(x, y))}</text>
        })}
      </Board>
      <div className="geo-side-panel">
        <div className="geo-kind">{kind}</div>
        <Facts rows={[
          [t('geo.sides'), `a = ${fmt(a)},\\; b = ${fmt(b)},\\; c = ${fmt(c)}`],
          [t('geo.angles'), `${fmt(al, 1)}^\\circ + ${fmt(be, 1)}^\\circ + ${fmt(ga, 1)}^\\circ = ${fmt(al + be + ga, 1)}^\\circ`],
          [t('geo.perimeter'), `P = ${fmt(per)}`],
          [t('geo.area'), `S = ${fmt(area)}`],
          ...(pyth ? [[t('geo.pyth'), pyth] as [string, string]] : []),
          ...(show.out && !flat ? [[t('geo.R'), `R = \\dfrac{abc}{4S} = ${fmt(R)}`] as [string, string]] : []),
          ...(show.inn && !flat ? [[t('geo.r'), `r = \\dfrac{2S}{P} = ${fmt(r)}`] as [string, string]] : []),
        ]} />
        <div className="geo-toggles">
          <Toggle on={show.h} set={set('h')} label={t('geo.heights')} color="var(--bad)" />
          <Toggle on={show.m} set={set('m')} label={t('geo.medians')} color="var(--geometry)" />
          <Toggle on={show.l} set={set('l')} label={t('geo.bisectors')} color="#4c6ef5" />
          <Toggle on={show.out} set={set('out')} label={t('geo.circum')} color="#ae3ec9" />
          <Toggle on={show.inn} set={set('inn')} label={t('geo.incircle')} color="var(--accent)" />
        </div>
        <p className="muted small" style={{ margin: 0 }}>{t('geo.triangleTip')}</p>
      </div>
    </div>
  )
}

function CircleLab() {
  const { t } = useTranslation()
  const O = { x: 7, y: 5 }, R = 4
  const onCircle = (a: number): P => ({ x: O.x + R * Math.cos(a), y: O.y + R * Math.sin(a) })
  const [p, setP] = useState<Record<string, P>>({ A: onCircle(-0.3), B: onCircle(1.6), C: onCircle(3.8) })
  const move = (_: string, q: P) => {
    const a = Math.atan2(q.y - O.y, q.x - O.x)
    const st = Math.PI / 36 // 5° steps
    return onCircle(Math.round(a / st) * st)
  }
  const { A, B, C } = p
  const ang = (q: P) => Math.atan2(q.y - O.y, q.x - O.x)
  // central angle of the arc AB that does not contain C
  let from = ang(A), to = ang(B)
  const ccw = (x: number) => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  if (ccw(ang(C) - from) < ccw(to - from)) [from, to] = [to, from]
  const central = deg(ccw(to - from))
  const inscribed = angleAt(C, A, B)
  const large = central > 180 ? 1 : 0
  // y is flipped, so going counter-clockwise in math coordinates is sweep-flag 0 in SVG
  const F = onCircle(from), T = onCircle(to)
  const arc = `M ${sx(F.x)} ${sy(F.y)} A ${R * S} ${R * S} 0 ${large} 0 ${sx(T.x)} ${sy(T.y)}`
  const sector = `M ${sx(O.x)} ${sy(O.y)} L ${sx(F.x)} ${sy(F.y)} A ${R * S} ${R * S} 0 ${large} 0 ${sx(T.x)} ${sy(T.y)} Z`
  return (
    <div className="geo-lab">
      <Board points={p} setPoints={setP} move={move}>
        <circle cx={sx(O.x)} cy={sy(O.y)} r={R * S} className="geo-line c-base" />
        <path d={sector} className="geo-sector" />
        <path d={arc} className="geo-line c-arc" />
        <polyline points={pts(A, O, B)} className="geo-line c-h" />
        <polyline points={pts(A, C, B)} className="geo-line c-m" />
        <circle cx={sx(O.x)} cy={sy(O.y)} r={4} className="geo-dot" />
        <text x={sx(O.x) + 8} y={sy(O.y) + 16} className="geo-label">O</text>
      </Board>
      <div className="geo-side-panel">
        <Facts rows={[
          [t('geo.central'), `\\angle AOB = ${fmt(central, 1)}^\\circ`],
          [t('geo.inscribed'), `\\angle ACB = ${fmt(inscribed, 1)}^\\circ`],
          [t('geo.half'), `${fmt(inscribed, 1)}^\\circ \\cdot 2 = ${fmt(inscribed * 2, 1)}^\\circ`],
          [t('geo.arc'), `l = \\dfrac{\\pi R \\alpha}{180^\\circ} = \\dfrac{\\pi \\cdot ${R} \\cdot ${fmt(central, 0)}}{180} \\approx ${fmt((Math.PI * R * central) / 180)}`],
          [t('geo.sector'), `S = \\dfrac{\\pi R^2 \\alpha}{360^\\circ} \\approx ${fmt((Math.PI * R * R * central) / 360)}`],
        ]} />
        <p className="muted small" style={{ margin: 0 }}>{t('geo.circleTip')}</p>
      </div>
    </div>
  )
}

function PolygonLab() {
  const { t } = useTranslation()
  const [n, setN] = useState(6)
  const [diag, setDiag] = useState(false)
  const c = { x: 7, y: 5 }, R = 4.2
  const v = Array.from({ length: n }, (_, i) => ({ x: c.x + R * Math.cos(Math.PI / 2 + (2 * Math.PI * i) / n), y: c.y + R * Math.sin(Math.PI / 2 + (2 * Math.PI * i) / n) }))
  const side = 2 * R * Math.sin(Math.PI / n)
  return (
    <div className="geo-lab">
      <Board points={{}} setPoints={() => {}}>
        {diag && v.map((p, i) => v.map((q, j) => (j > i + 1 && !(i === 0 && j === n - 1) ? <line key={`${i}-${j}`} className="geo-line c-l thin" x1={sx(p.x)} y1={sy(p.y)} x2={sx(q.x)} y2={sy(q.y)} /> : null)))}
        <polygon points={pts(...v)} className="geo-shape" />
        {v.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} className="geo-dot" />)}
      </Board>
      <div className="geo-side-panel">
        <label className="slider-row try-slider"><span className="try-name"><Tex tex="n" /></span>
          <input type="range" min={3} max={12} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="n" /><b className="try-val">{n}</b></label>
        <Facts rows={[
          [t('geo.angleSum'), `(n - 2) \\cdot 180^\\circ = (${n} - 2) \\cdot 180^\\circ = ${(n - 2) * 180}^\\circ`],
          [t('geo.oneAngle'), `\\dfrac{${(n - 2) * 180}^\\circ}{${n}} = ${fmt(((n - 2) * 180) / n, 2)}^\\circ`],
          [t('geo.exterior'), `\\dfrac{360^\\circ}{${n}} = ${fmt(360 / n, 2)}^\\circ`],
          [t('geo.diagonals'), `\\dfrac{n(n-3)}{2} = \\dfrac{${n} \\cdot ${n - 3}}{2} = ${(n * (n - 3)) / 2}`],
          [t('geo.sideR'), `a = 2R\\sin\\dfrac{180^\\circ}{n} \\approx ${fmt(side)}\\; (R = ${fmt(R, 1)})`],
        ]} />
        <Toggle on={diag} set={setDiag} label={t('geo.showDiagonals')} color="#4c6ef5" />
      </div>
    </div>
  )
}

function CoordLab() {
  const { t } = useTranslation()
  const [p, setP] = useState<Record<string, P>>({ A: { x: 4, y: 3 }, B: { x: 11, y: 8 } })
  const c = (q: P) => ({ x: q.x - 7, y: q.y - 5 }) // math coordinates (origin in the middle)
  const A = c(p.A), B = c(p.B)
  const M = mid(A, B)
  const d = dist(A, B)
  const dx = B.x - A.x, dy = B.y - A.y
  const k = dx ? dy / dx : null
  const b0 = k === null ? null : A.y - k * A.x
  const n = (v: number) => (v < 0 ? `(${fmt(v)})` : fmt(v))
  return (
    <div className="geo-lab">
      <Board points={p} setPoints={setP} axes>
        {k !== null && b0 !== null ? (
          <line className="geo-line c-l dash" x1={sx(0)} y1={sy(k * -7 + b0 + 5)} x2={sx(14)} y2={sy(k * 7 + b0 + 5)} />
        ) : (
          <line className="geo-line c-l dash" x1={sx(p.A.x)} y1={0} x2={sx(p.A.x)} y2={H * S} />
        )}
        <polyline points={pts(p.A, { x: p.B.x, y: p.A.y }, p.B)} className="geo-line c-h dash" />
        <line className="geo-line c-m" x1={sx(p.A.x)} y1={sy(p.A.y)} x2={sx(p.B.x)} y2={sy(p.B.y)} />
        <circle cx={sx(M.x + 7)} cy={sy(M.y + 5)} r={4} className="geo-dot mid" />
        <text x={sx(M.x + 7) + 8} y={sy(M.y + 5) + 16} className="geo-label">M</text>
      </Board>
      <div className="geo-side-panel">
        <Facts rows={[
          [t('geo.points'), `A(${fmt(A.x)};\\, ${fmt(A.y)}),\\quad B(${fmt(B.x)};\\, ${fmt(B.y)})`],
          [t('geo.distance'), `AB = \\sqrt{(${fmt(B.x)} - ${n(A.x)})^2 + (${fmt(B.y)} - ${n(A.y)})^2} = \\sqrt{${fmt(dx * dx + dy * dy)}} \\approx ${fmt(d)}`],
          [t('geo.midpoint'), `M\\left(\\dfrac{${fmt(A.x)} + ${n(B.x)}}{2};\\, \\dfrac{${fmt(A.y)} + ${n(B.y)}}{2}\\right) = M(${fmt(M.x)};\\, ${fmt(M.y)})`],
          [t('geo.slope'), k === null ? `x = ${fmt(A.x)}` : `k = \\dfrac{${fmt(dy)}}{${fmt(dx)}} = ${fmt(k)}`],
          [t('geo.lineEq'), k === null || b0 === null ? `x = ${fmt(A.x)}` : `y = ${fmt(k)}x ${b0 < 0 ? '-' : '+'} ${fmt(Math.abs(b0))}`],
        ]} />
        <p className="muted small" style={{ margin: 0 }}>{t('geo.coordTip')}</p>
      </div>
    </div>
  )
}

function VectorsLab() {
  const { t } = useTranslation()
  const [p, setP] = useState<Record<string, P>>({ a: { x: 11, y: 6 }, b: { x: 9, y: 9 } })
  const O = { x: 7, y: 5 }
  const a = { x: p.a.x - O.x, y: p.a.y - O.y }, b = { x: p.b.x - O.x, y: p.b.y - O.y }
  const s = { x: a.x + b.x, y: a.y + b.y }
  const la = Math.hypot(a.x, a.y), lb = Math.hypot(b.x, b.y)
  const dot = a.x * b.x + a.y * b.y
  const cos = la && lb ? dot / (la * lb) : 0
  const S2 = { x: O.x + s.x, y: O.y + s.y }
  const arrow = (to: P, cls: string, from: P = O) => <line className={`geo-vec ${cls}`} x1={sx(from.x)} y1={sy(from.y)} x2={sx(to.x)} y2={sy(to.y)} markerEnd={`url(#ar-${cls})`} />
  return (
    <div className="geo-lab">
      <Board points={p} setPoints={setP} axes labels>
        <defs>
          {['va', 'vb', 'vs'].map((c) => (
            <marker key={c} id={`ar-${c}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className={`geo-tip ${c}`} />
            </marker>
          ))}
        </defs>
        <polyline points={pts(p.a, S2, p.b)} className="geo-line c-base dash" />
        {arrow(S2, 'vs')}
        {arrow(p.a, 'va')}
        {arrow(p.b, 'vb')}
      </Board>
      <div className="geo-side-panel">
        <Facts rows={[
          [t('geo.coords'), `\\vec a(${fmt(a.x)};\\, ${fmt(a.y)}),\\quad \\vec b(${fmt(b.x)};\\, ${fmt(b.y)})`],
          [t('geo.sum'), `\\vec a + \\vec b = (${fmt(s.x)};\\, ${fmt(s.y)})`],
          [t('geo.length'), `|\\vec a| = ${fmt(la)},\\quad |\\vec b| = ${fmt(lb)}`],
          [t('geo.dot'), `\\vec a \\cdot \\vec b = ${fmt(a.x)} \\cdot ${fmt(b.x)} + ${fmt(a.y)} \\cdot ${fmt(b.y)} = ${fmt(dot)}`],
          [t('geo.angle'), `\\cos\\varphi = ${fmt(cos, 3)},\\quad \\varphi \\approx ${fmt(deg(Math.acos(Math.max(-1, Math.min(1, cos)))), 1)}^\\circ`],
        ]} />
        <p className="muted small" style={{ margin: 0 }}>{dot === 0 ? t('geo.perp') : t('geo.vecTip')}</p>
      </div>
    </div>
  )
}

function LinesLab() {
  const { t } = useTranslation()
  const [p, setP] = useState<Record<string, P>>({ T: { x: 9, y: 9 } })
  const y1 = 3, y2 = 7
  const T = p.T
  // transversal through the pivot (6, 3) and T, extended over the board
  const P0 = { x: 6, y: y1 }
  const dx = T.x - P0.x, dy = T.y - P0.y || 1e-6
  const at = (y: number) => ({ x: P0.x + (dx * (y - P0.y)) / dy, y })
  const X1 = at(y1), X2 = at(y2)
  const acute = deg(Math.atan2(Math.abs(dy), Math.abs(dx)))
  const obtuse = 180 - acute
  const lean = dx * dy >= 0 // which side the acute angle is on
  const label = (q: P, ox: number, oy: number, v: number, cls: string) => (
    <text className={`geo-angle ${cls}`} x={sx(q.x) + ox} y={sy(q.y) + oy} textAnchor="middle">{txt(v)}°</text>
  )
  const marks = (q: P) => (
    <>
      {label(q, 26, -8, lean ? acute : obtuse, lean ? 'eq1' : 'eq2')}
      {label(q, -26, -8, lean ? obtuse : acute, lean ? 'eq2' : 'eq1')}
      {label(q, -26, 18, lean ? acute : obtuse, lean ? 'eq1' : 'eq2')}
      {label(q, 26, 18, lean ? obtuse : acute, lean ? 'eq2' : 'eq1')}
    </>
  )
  return (
    <div className="geo-lab">
      <Board points={p} setPoints={setP} move={(_, q) => ({ x: Math.round(q.x), y: Math.max(y2 + 1, Math.round(q.y)) })} labels={false}>
        <line className="geo-line c-base" x1={0} y1={sy(y1)} x2={W * S} y2={sy(y1)} />
        <line className="geo-line c-base" x1={0} y1={sy(y2)} x2={W * S} y2={sy(y2)} />
        <line className="geo-line c-m" x1={sx(at(0).x)} y1={sy(0)} x2={sx(at(H).x)} y2={sy(H)} />
        {marks(X1)}
        {marks(X2)}
        <text className="geo-label" x={8} y={sy(y1) - 6}>a</text>
        <text className="geo-label" x={8} y={sy(y2) - 6}>b</text>
      </Board>
      <div className="geo-side-panel">
        <Facts rows={[
          [t('geo.equalPairs'), `${fmt(acute, 1)}^\\circ \\text{ ${t('geo.and')} } ${fmt(obtuse, 1)}^\\circ`],
          [t('geo.coInterior'), `${fmt(acute, 1)}^\\circ + ${fmt(obtuse, 1)}^\\circ = 180^\\circ`],
        ]} />
        <p className="muted small" style={{ margin: 0 }}>{t('geo.linesTip')}</p>
      </div>
    </div>
  )
}

export function GeoLab({ id }: { id: LabId }) {
  if (id === 'triangle') return <TriangleLab />
  if (id === 'circle') return <CircleLab />
  if (id === 'polygon') return <PolygonLab />
  if (id === 'coord') return <CoordLab />
  if (id === 'vectors') return <VectorsLab />
  return <LinesLab />
}
