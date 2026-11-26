import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tex } from '../components/Tex'
import { f2, solids, type Face, type NetShape, type SolidId, type V3 } from '../lib/solids'

const W = 420, H = 360

/** Rotate (yaw around y, then pitch around x) and project with a light perspective. */
function project(p: V3, yaw: number, pitch: number, scale: number): [number, number, number] {
  const [x0, y0, z0] = p
  const x1 = x0 * Math.cos(yaw) + z0 * Math.sin(yaw), z1 = -x0 * Math.sin(yaw) + z0 * Math.cos(yaw)
  const y2 = y0 * Math.cos(pitch) - z1 * Math.sin(pitch), z2 = y0 * Math.sin(pitch) + z1 * Math.cos(pitch)
  const k = 30 / (30 - z2)
  return [W / 2 + x1 * scale * k, H / 2 - y2 * scale * k, z2]
}
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const centroid = (pts: V3[]): V3 => pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0] as V3)

function Drawing({ faces, yaw, pitch, scale }: { faces: Face[]; yaw: number; pitch: number; scale: number }) {
  const rot = (p: V3): V3 => { const [x, y, z] = project(p, yaw, pitch, 1); return [(x - W / 2), -(y - H / 2), z] }
  const items = faces.map((f, i) => {
    const c = centroid(f.pts)
    let n = cross(sub(f.pts[1], f.pts[0]), sub(f.pts[2], f.pts[0]))
    if (dot(n, c) < 0) n = [-n[0], -n[1], -n[2]] // outward
    // normal after rotation: rotate the point c + n and c
    const a = rot(c), b = rot([c[0] + n[0], c[1] + n[1], c[2] + n[2]])
    const front = b[2] - a[2] > 0
    const pts2 = f.pts.map((p) => project(p, yaw, pitch, scale))
    const depth = pts2.reduce((s, p) => s + p[2], 0) / pts2.length
    return { f, i, front, pts2, depth }
  })
  const sorted = [...items].sort((p, q) => p.depth - q.depth)
  const path = (pts: [number, number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + 'Z'
  return (
    <g>
      {/* hidden edges first, dashed */}
      {items.filter((it) => !it.front && !it.f.smooth).map((it) => <path key={`h${it.i}`} d={path(it.pts2)} className="sol-hidden" />)}
      {sorted.filter((it) => it.front).map((it) => (
        <path key={it.i} d={path(it.pts2)} className={it.f.smooth ? 'sol-face smooth' : it.f.base ? 'sol-face base' : 'sol-face'} />
      ))}
    </g>
  )
}

function Net({ shapes }: { shapes: NetShape[] }) {
  if (!shapes.length) return null
  // bounding box → fit into 360 × 300
  const xs: number[] = [], ys: number[] = []
  for (const s of shapes) {
    if (s.kind === 'poly') s.pts.forEach(([x, y]) => { xs.push(x); ys.push(y) })
    else { xs.push(s.c[0] - s.r, s.c[0] + s.r); ys.push(s.c[1] - s.r, s.c[1] + s.r) }
  }
  const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0
  const k = Math.min(340 / w, 280 / h), T = (x: number, y: number) => `${(10 + (x - x0) * k).toFixed(1)},${(10 + (y - y0) * k).toFixed(1)}`
  return (
    <svg viewBox={`0 0 ${20 + w * k} ${20 + h * k}`} className="sol-net">
      {shapes.map((s, i) => {
        if (s.kind === 'poly') return <polygon key={i} points={s.pts.map(([x, y]) => T(x, y)).join(' ')} className="sol-net-part" />
        if (s.kind === 'circle') return <circle key={i} cx={10 + (s.c[0] - x0) * k} cy={10 + (s.c[1] - y0) * k} r={s.r * k} className="sol-net-part" />
        const p = (a: number) => T(s.c[0] + s.r * Math.cos(a), s.c[1] + s.r * Math.sin(a))
        const large = s.a1 - s.a0 > Math.PI ? 1 : 0
        return <path key={i} d={`M${T(s.c[0], s.c[1])} L${p(s.a0)} A${s.r * k},${s.r * k} 0 ${large} 1 ${p(s.a1)} Z`} className="sol-net-part" />
      })}
    </svg>
  )
}

/** 3D solids: rotate with the mouse or a finger, change the sizes, see V and S, unfold the net. */
export function Solids() {
  const { t } = useTranslation()
  const [id, setId] = useState<SolidId>('cube')
  const solid = solids.find((s) => s.id === id)!
  const [vals, setVals] = useState<Record<string, number>>({})
  const p = useMemo(() => Object.fromEntries(solid.params.map((q) => [q.k, vals[`${id}.${q.k}`] ?? q.def])), [solid, vals, id])
  const [yaw, setYaw] = useState(0.6), [pitch, setPitch] = useState(0.35)
  const [spin, setSpin] = useState(true)
  const [showNet, setShowNet] = useState(false)
  const drag = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!spin) return
    let raf = 0
    const loop = () => { setYaw((y) => y + 0.008); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [spin])

  const size = Math.max(...solid.params.map((q) => p[q.k] * (q.k === 'r' ? 2 : 1)))
  const scale = 190 / Math.max(size, 1) / 1.25
  const [vT, vV] = solid.volume(p), [sT, sV] = solid.surface(p)

  return (
    <div className="page">
      <h1>{t('sol.title')}</h1>
      <p className="muted">{t('sol.hint')}</p>
      <div className="chips" style={{ marginBottom: 12 }}>
        {solids.map((s) => <button key={s.id} className={`chip ${s.id === id ? 'on' : ''}`} onClick={() => { setId(s.id); setShowNet(false) }}>{s.icon} {t(`sol.names.${s.id}`)}</button>)}
      </div>
      <div className="shp-grid">
        <div className="card sol-view">
          <svg viewBox={`0 0 ${W} ${H}`} style={{ touchAction: 'none', cursor: 'grab' }}
            onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY }; setSpin(false) }}
            onPointerMove={(e) => {
              if (!drag.current) return
              const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
              drag.current = { x: e.clientX, y: e.clientY }
              setYaw((y) => y + dx * 0.01); setPitch((q) => Math.max(-1.4, Math.min(1.4, q + dy * 0.01)))
            }}
            onPointerUp={() => { drag.current = null }}>
            <Drawing faces={solid.faces(p)} yaw={yaw} pitch={pitch} scale={scale} />
          </svg>
          <div className="chips" style={{ justifyContent: 'center' }}>
            <button className={`chip ${spin ? 'on' : ''}`} onClick={() => setSpin(!spin)}>⟳ {t('sol.spin')}</button>
            {solid.id !== 'sphere' && <button className={`chip ${showNet ? 'on' : ''}`} onClick={() => setShowNet(!showNet)}>✂ {t('sol.net')}</button>}
          </div>
        </div>
        <div className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          {solid.params.map((q) => (
            <label key={q.k} className="slider-row">
              <b style={{ width: 22 }}><Tex tex={q.tex} /></b>
              <input type="range" min={q.min} max={q.max} step={0.5} value={p[q.k]} onChange={(e) => setVals({ ...vals, [`${id}.${q.k}`]: Number(e.target.value) })} />
              <span style={{ width: 40, textAlign: 'right' }}>{String(p[q.k]).replace('.', ',')}</span>
            </label>
          ))}
          <div className="sol-formula"><span className="muted small">{t('sol.volume')}</span><Tex tex={`${vT} \\approx ${String(f2(vV)).replace('.', '{,}')}`} block /></div>
          <div className="sol-formula"><span className="muted small">{t('sol.surface')}</span><Tex tex={`${sT} \\approx ${String(f2(sV)).replace('.', '{,}')}`} block /></div>
          {showNet && solid.id !== 'sphere' && (
            <div><div className="muted small" style={{ marginBottom: 6 }}>{t('sol.netTitle')}</div><Net shapes={solid.net(p)} /></div>
          )}
        </div>
      </div>
    </div>
  )
}
