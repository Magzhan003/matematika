import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const css = (v: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fallback

type Tool = { color: string; width: number; erase?: boolean }

/**
 * Interactive board: a drawing layer over the lesson slide (like a smart board in class).
 * "Blank board" covers the slide with a dark board for working things out.
 */
export function DrawBoard({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const canvas = useRef<HTMLCanvasElement>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [blank, setBlank] = useState(false)
  const colors = blank
    ? [css('--space-ink', '#eee'), '#ffd166', '#ef476f', '#06d6a0', '#4cc9f0']
    : [css('--ink', '#222'), '#e63946', '#1d70b8', '#1d9e75', css('--accent', '#ef9f27')]
  const [tool, setTool] = useState<Tool>({ color: colors[1], width: 3 })

  // keep the canvas the size of its box; redraw the old picture after a resize
  useEffect(() => {
    const c = canvas.current!
    const fit = () => {
      const r = c.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr)
      if (c.width === w && c.height === h) return
      const old = c.width && c.height ? c.getContext('2d')!.getImageData(0, 0, c.width, c.height) : null
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (old) ctx.putImageData(old, 0, 0)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(c)
    return () => ro.disconnect()
  }, [])

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const line = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const ctx = canvas.current!.getContext('2d')!
    ctx.globalCompositeOperation = tool.erase ? 'destination-out' : 'source-over'
    ctx.strokeStyle = tool.color
    ctx.lineWidth = tool.erase ? 26 : tool.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  const clear = () => {
    const c = canvas.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
  }

  return (
    <div className={`draw-layer ${blank ? 'blank' : ''}`}>
      <canvas
        ref={canvas}
        className="draw-canvas"
        aria-label={t('ls.board')}
        onPointerDown={(e) => {
          canvas.current!.setPointerCapture(e.pointerId)
          last.current = pos(e)
          line(last.current, { x: last.current.x + 0.1, y: last.current.y + 0.1 })
        }}
        onPointerMove={(e) => {
          if (!last.current) return
          const p = pos(e)
          line(last.current, p)
          last.current = p
        }}
        onPointerUp={() => (last.current = null)}
        onPointerCancel={() => (last.current = null)}
      />
      <div className="draw-tools" role="toolbar" aria-label={t('ls.board')}>
        {colors.map((c) => (
          <button key={c} className={`pen ${!tool.erase && tool.color === c ? 'on' : ''}`} style={{ background: c }}
            aria-label={t('ls.pen')} onClick={() => setTool({ color: c, width: tool.width })} />
        ))}
        <button className={`draw-btn ${tool.width > 4 ? 'on' : ''}`} title={t('ls.thick')} onClick={() => setTool({ ...tool, erase: false, width: tool.width > 4 ? 3 : 7 })}>
          {tool.width > 4 ? '●' : '•'}
        </button>
        <button className={`draw-btn ${tool.erase ? 'on' : ''}`} title={t('ls.eraser')} onClick={() => setTool({ ...tool, erase: !tool.erase })}>⌫</button>
        <button className="draw-btn" title={t('ls.clear')} onClick={clear}>🗑</button>
        <button className={`draw-btn ${blank ? 'on' : ''}`} title={t('ls.blank')} onClick={() => { setBlank(!blank); clear(); setTool({ color: blank ? '#e63946' : '#ffd166', width: 3 }) }}>▦</button>
        <button className="draw-btn" title={t('ls.closeBoard')} onClick={onClose}>✕</button>
      </div>
    </div>
  )
}
