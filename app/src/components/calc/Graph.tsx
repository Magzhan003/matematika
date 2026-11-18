import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fnOf } from '../../lib/calc/tools'

export type GraphPoint = { x: number; y: number; label?: string }
type View = { x0: number; x1: number; y0: number; y1: number }

const COLORS = ['--accent', '--geometry', '--bad', '--space-2', '--good-ink', '--accent-ink']
const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888'

function niceStep(range: number) {
  const raw = range / 8
  const p = 10 ** Math.floor(Math.log10(raw))
  for (const m of [1, 2, 5, 10]) if (raw <= m * p) return m * p
  return 10 * p
}

/** Initial view: around the marked points, y range from the middle 90 % of values. */
function autoView(fs: ((x: number) => number)[], points: GraphPoint[]): View {
  let x0 = -10, x1 = 10
  if (points.length) {
    const xs = points.map((p) => p.x).filter(Number.isFinite)
    const lo = Math.min(...xs), hi = Math.max(...xs)
    const pad = Math.max(3, (hi - lo) * 0.4)
    x0 = Math.min(-1, lo - pad)
    x1 = Math.max(1, hi + pad)
  }
  const ys: number[] = []
  for (const f of fs) for (let i = 0; i <= 400; i++) {
    const y = f(x0 + ((x1 - x0) * i) / 400)
    if (Number.isFinite(y)) ys.push(y)
  }
  for (const p of points) if (Number.isFinite(p.y)) ys.push(p.y)
  ys.sort((a, b) => a - b)
  let y0 = ys.length ? ys[Math.floor(ys.length * 0.05)] : -6
  let y1 = ys.length ? ys[Math.ceil(ys.length * 0.95) - 1] : 6
  if (!(y1 - y0 > 1e-9)) { y0 -= 3; y1 += 3 }
  const pad = (y1 - y0) * 0.15
  y0 = Math.min(y0 - pad, -1)
  y1 = Math.max(y1 + pad, 1)
  return { x0, x1, y0, y1 }
}

export function Graph({ fns, points = [], height = 320, labels, fixedView, quiz = false }: {
  fns: string[]; points?: GraphPoint[]; height?: number; labels?: string[]
  /** keep this view while the functions change (sliders in lessons) */
  fixedView?: [number, number, number, number]
  /** hide the formulas (graph-guessing game) */
  quiz?: boolean
}) {
  const { t } = useTranslation()
  const canvas = useRef<HTMLCanvasElement>(null)
  const funcs = useMemo(() => fns.filter(Boolean).map((f) => fnOf(f)), [fns])
  const fv = fixedView?.join(',')
  const initial = useMemo(() => {
    if (fixedView) {
      const [x0, x1, y0, y1] = fixedView
      return { x0, x1, y0, y1 }
    }
    return autoView(funcs, points)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, fv ? [fv] : [funcs, points])
  const [view, setView] = useState<View>(initial)
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef<{ x: number; y: number; v: View } | null>(null)

  useEffect(() => setView(initial), [initial])

  const draw = useCallback(() => {
    const c = canvas.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    const W = c.clientWidth, H = height
    c.width = W * dpr
    c.height = H * dpr
    const g = c.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    const { x0, x1, y0, y1 } = view
    const X = (x: number) => ((x - x0) / (x1 - x0)) * W
    const Y = (y: number) => H - ((y - y0) / (y1 - y0)) * H
    g.fillStyle = css('--card')
    g.fillRect(0, 0, W, H)

    // grid + labels
    const sx = niceStep(x1 - x0), sy = niceStep(y1 - y0)
    g.font = '11px system-ui, sans-serif'
    g.strokeStyle = css('--grid')
    g.lineWidth = 1
    g.fillStyle = css('--muted')
    for (let x = Math.ceil(x0 / sx) * sx; x <= x1; x += sx) {
      g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), H); g.stroke()
      if (Math.abs(x) > 1e-9) g.fillText(String(Number(x.toFixed(6))).replace('.', ','), X(x) + 2, Math.min(H - 4, Math.max(12, Y(0) + 12)))
    }
    for (let y = Math.ceil(y0 / sy) * sy; y <= y1; y += sy) {
      g.beginPath(); g.moveTo(0, Y(y)); g.lineTo(W, Y(y)); g.stroke()
      if (Math.abs(y) > 1e-9) g.fillText(String(Number(y.toFixed(6))).replace('.', ','), Math.min(W - 30, Math.max(2, X(0) + 4)), Y(y) - 2)
    }
    // axes
    g.strokeStyle = css('--ink')
    g.lineWidth = 1.5
    g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.moveTo(X(0), 0); g.lineTo(X(0), H); g.stroke()

    // functions, breaking the line at gaps and jumps (poles)
    funcs.forEach((f, k) => {
      g.strokeStyle = css(COLORS[k % COLORS.length])
      g.lineWidth = 2.5
      g.beginPath()
      let pen = false, prevY = 0
      const n = Math.max(400, W * 2)
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n
        const y = f(x)
        if (!Number.isFinite(y) || (pen && Math.abs(Y(y) - prevY) > H * 1.5)) { pen = false; if (!Number.isFinite(y)) continue }
        const py = Math.max(-H, Math.min(2 * H, Y(y)))
        if (pen) g.lineTo(X(x), py)
        else { g.moveTo(X(x), py); pen = true }
        prevY = Y(y)
      }
      g.stroke()
    })

    // marked points
    for (const p of points) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue
      g.fillStyle = css('--bad')
      g.beginPath(); g.arc(X(p.x), Y(p.y), 5, 0, Math.PI * 2); g.fill()
      g.fillStyle = css('--ink')
      g.font = 'bold 11px system-ui, sans-serif'
      const lbl = `(${Number(p.x.toFixed(2))}; ${Number(p.y.toFixed(2))})`.replace(/\./g, ',')
      g.fillText(p.label ? `${p.label} ${lbl}` : lbl, X(p.x) + 7, Y(p.y) - 7)
    }

    // hover readout on the first function
    if (hover && funcs[0]) {
      const y = funcs[0](hover.x)
      if (Number.isFinite(y)) {
        g.fillStyle = css(COLORS[0])
        g.beginPath(); g.arc(X(hover.x), Y(y), 4, 0, Math.PI * 2); g.fill()
        g.fillStyle = css('--ink')
        g.font = '12px system-ui, sans-serif'
        g.fillText(`x = ${hover.x.toFixed(2)}, y = ${y.toFixed(2)}`.replace(/\./g, ','), 8, 16)
      }
    }
  }, [view, funcs, points, hover, height])

  useEffect(() => {
    draw()
    const onResize = () => draw()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  // wheel zoom needs a non-passive listener
  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = c.getBoundingClientRect()
      const k = e.deltaY > 0 ? 1.15 : 1 / 1.15
      setView((v) => {
        const mx = v.x0 + ((e.clientX - rect.left) / rect.width) * (v.x1 - v.x0)
        const my = v.y1 - ((e.clientY - rect.top) / rect.height) * (v.y1 - v.y0)
        return { x0: mx + (v.x0 - mx) * k, x1: mx + (v.x1 - mx) * k, y0: my + (v.y0 - my) * k, y1: my + (v.y1 - my) * k }
      })
    }
    c.addEventListener('wheel', onWheel, { passive: false })
    return () => c.removeEventListener('wheel', onWheel)
  }, [])

  const zoom = (k: number) => setView((v) => {
    const cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2
    return { x0: cx + (v.x0 - cx) * k, x1: cx + (v.x1 - cx) * k, y0: cy + (v.y0 - cy) * k, y1: cy + (v.y1 - cy) * k }
  })

  return (
    <div className="graph">
      <canvas
        ref={canvas}
        style={{ width: '100%', height, touchAction: 'none', cursor: drag.current ? 'grabbing' : 'grab', borderRadius: 12, display: 'block' }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, y: e.clientY, v: view }
        }}
        onPointerMove={(e) => {
          const c = canvas.current!
          const rect = c.getBoundingClientRect()
          const d = drag.current
          if (d) {
            const dx = ((e.clientX - d.x) / rect.width) * (d.v.x1 - d.v.x0)
            const dy = ((e.clientY - d.y) / rect.height) * (d.v.y1 - d.v.y0)
            setView({ x0: d.v.x0 - dx, x1: d.v.x1 - dx, y0: d.v.y0 + dy, y1: d.v.y1 + dy })
          } else {
            setHover({ x: view.x0 + ((e.clientX - rect.left) / rect.width) * (view.x1 - view.x0), y: 0 })
          }
        }}
        onPointerUp={() => { drag.current = null }}
        onPointerLeave={() => { drag.current = null; setHover(null) }}
        role="img"
        aria-label={quiz ? 'graph' : fns.join(', ')}
      />
      <div className="graph-tools">
        {!quiz && fns.filter(Boolean).map((f, k) => (
          <span key={k} className="graph-legend"><i style={{ background: `var(${COLORS[k % COLORS.length]})` }} />y = {labels?.[k] ?? f}</span>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" onClick={() => zoom(1 / 1.4)} aria-label="zoom in">+</button>
          <button className="btn btn-sm" onClick={() => zoom(1.4)} aria-label="zoom out">−</button>
          <button className="btn btn-sm" onClick={() => setView(initial)}>{t('cx.gr.reset')}</button>
        </span>
      </div>
    </div>
  )
}
