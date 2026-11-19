import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Tool = 'pen' | 'marker' | 'line' | 'text' | 'eraser'
type Bg = 'white' | 'grid' | 'dark' | 'clear'
const COLORS_LIGHT = ['#1f2937', '#e03e3e', '#1d70b8', '#1d8a63', '#d97706', '#7c3aed']
const COLORS_DARK = ['#f8fafc', '#ffd166', '#ff6b6b', '#4cc9f0', '#80ed99', '#f4a261']
const SIZES = [3, 6, 12]
const KEY = 'whiteboard'

/**
 * Whiteboard for the classroom: opens from the top bar on any page.
 * Pen, marker, straight line, typed text, eraser, undo, background, save as picture.
 * "clear" background makes it transparent — to write over a presentation or a lesson.
 */
export function Whiteboard({ onClose, transparent = false }: { onClose: () => void; transparent?: boolean }) {
  const { t } = useTranslation()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [bg, setBg] = useState<Bg>(transparent ? 'clear' : 'grid')
  const dark = bg === 'dark'
  const colors = dark ? COLORS_DARK : COLORS_LIGHT
  const [color, setColor] = useState(0)
  const [size, setSize] = useState(0)
  const [text, setText] = useState<{ x: number; y: number; value: string } | null>(null)
  const undo = useRef<ImageData[]>([])
  const drag = useRef<{ x: number; y: number; snap?: ImageData } | null>(null)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  const ctx = () => canvas.current!.getContext('2d')!
  const save = () => {
    try { localStorage.setItem(KEY, canvas.current!.toDataURL('image/png')) } catch { /* storage full or blocked */ }
  }
  const remember = () => {
    const c = canvas.current!
    undo.current.push(ctx().getImageData(0, 0, c.width, c.height))
    if (undo.current.length > 30) undo.current.shift()
  }

  // one big canvas (screen size) so that rotating or resizing the window keeps the drawing
  useEffect(() => {
    const c = canvas.current!
    const w = Math.max(window.screen.width, window.innerWidth), h = Math.max(window.screen.height, window.innerHeight)
    c.width = w * dpr
    c.height = h * dpr
    c.style.width = w + 'px'
    c.style.height = h + 'px'
    const g = ctx()
    g.scale(dpr, dpr)
    g.lineCap = 'round'
    g.lineJoin = 'round'
    try {
      const saved = localStorage.getItem(KEY)
      if (saved) {
        const img = new Image()
        img.onload = () => { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(img, 0, 0); g.restore() }
        img.src = saved
      }
    } catch { /* no storage */ }
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
      if (e.key === 'Escape') onClose()
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const stroke = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const g = ctx()
    g.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    g.globalAlpha = tool === 'marker' ? 0.35 : 1
    g.strokeStyle = colors[color]
    g.lineWidth = tool === 'eraser' ? 36 : tool === 'marker' ? SIZES[size] * 4 : SIZES[size]
    g.beginPath()
    g.moveTo(a.x, a.y)
    g.lineTo(b.x, b.y)
    g.stroke()
    g.globalAlpha = 1
  }
  const doUndo = () => {
    const last = undo.current.pop()
    if (!last) return
    ctx().putImageData(last, 0, 0)
    save()
  }
  const clear = () => {
    if (!window.confirm(t('wb.confirmClear'))) return
    remember()
    const c = canvas.current!
    ctx().clearRect(0, 0, c.width, c.height)
    save()
  }
  const commitText = () => {
    if (text && text.value.trim()) {
      remember()
      const g = ctx()
      g.globalCompositeOperation = 'source-over'
      g.fillStyle = colors[color]
      const fs = [28, 40, 60][size]
      g.font = `600 ${fs}px "Segoe UI", Arial, sans-serif`
      text.value.split('\n').forEach((line, i) => g.fillText(line, text.x, text.y + fs + i * fs * 1.25))
      save()
    }
    setText(null)
  }
  const download = () => {
    const c = canvas.current!
    const out = document.createElement('canvas')
    out.width = window.innerWidth * dpr
    out.height = window.innerHeight * dpr
    const g = out.getContext('2d')!
    g.fillStyle = dark ? '#1f2a24' : '#ffffff'
    g.fillRect(0, 0, out.width, out.height)
    g.drawImage(c, 0, 0)
    const a = document.createElement('a')
    a.href = out.toDataURL('image/png')
    a.download = `doska-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.png`
    a.click()
  }

  return (
    <div className={`wb wb-${bg}`} role="dialog" aria-label={t('wb.title')}>
      <canvas
        ref={canvas}
        className={`wb-canvas tool-${tool}`}
        onPointerDown={(e) => {
          if (tool === 'text') {
            // keep the browser from moving focus to the page, otherwise the new text field closes at once
            e.preventDefault()
            if (text) commitText()
            const p = pos(e)
            setText({ x: p.x, y: p.y, value: '' })
            return
          }
          canvas.current!.setPointerCapture(e.pointerId)
          remember()
          const p = pos(e)
          const c = canvas.current!
          drag.current = { ...p, snap: tool === 'line' ? ctx().getImageData(0, 0, c.width, c.height) : undefined }
          if (tool !== 'line') stroke(p, { x: p.x + 0.1, y: p.y + 0.1 })
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const p = pos(e)
          if (tool === 'line') {
            ctx().putImageData(d.snap!, 0, 0)
            stroke(d, p)
          } else {
            stroke(d, p)
            drag.current = { ...p }
          }
        }}
        onPointerUp={() => { if (drag.current) { drag.current = null; save() } }}
        onPointerCancel={() => { drag.current = null }}
      />
      {text && (
        <textarea
          className="wb-text"
          ref={(el) => { if (el && document.activeElement !== el) setTimeout(() => el.focus(), 0) }}
          style={{ left: text.x, top: text.y, color: colors[color], fontSize: [28, 40, 60][size] }}
          value={text.value}
          placeholder={t('wb.typeHere')}
          onChange={(e) => setText({ ...text, value: e.target.value })}
          onBlur={commitText}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText() } if (e.key === 'Escape') setText(null) }}
        />
      )}
      <div className="wb-bar" role="toolbar">
        <div className="wb-group">
          {(['pen', 'marker', 'line', 'text', 'eraser'] as Tool[]).map((k) => (
            <button key={k} className={`wb-btn ${tool === k ? 'on' : ''}`} onClick={() => setTool(k)} title={t(`wb.tools.${k}`)}>
              {{ pen: '✏️', marker: '🖍', line: '📏', text: 'T', eraser: '🧽' }[k]}
              <span className="wb-label">{t(`wb.tools.${k}`)}</span>
            </button>
          ))}
        </div>
        <div className="wb-group">
          {colors.map((c, i) => (
            <button key={c} className={`wb-color ${color === i ? 'on' : ''}`} style={{ background: c }} onClick={() => { setColor(i); if (tool === 'eraser') setTool('pen') }} aria-label={t('wb.color')} />
          ))}
          {SIZES.map((s, i) => (
            <button key={s} className={`wb-btn wb-size ${size === i ? 'on' : ''}`} onClick={() => setSize(i)} title={t('wb.size')}>
              <i style={{ width: 4 + s, height: 4 + s }} />
            </button>
          ))}
        </div>
        <div className="wb-group">
          <select className="wb-select" value={bg} onChange={(e) => { const v = e.target.value as Bg; setBg(v); setColor(0) }} aria-label={t('wb.background')}>
            {(['grid', 'white', 'dark', 'clear'] as Bg[]).map((b) => <option key={b} value={b}>{t(`wb.bg.${b}`)}</option>)}
          </select>
          <button className="wb-btn" onClick={doUndo} title={t('wb.undo')}>↶<span className="wb-label">{t('wb.undo')}</span></button>
          <button className="wb-btn" onClick={clear} title={t('wb.clear')}>🗑<span className="wb-label">{t('wb.clear')}</span></button>
          <button className="wb-btn" onClick={download} title={t('wb.save')}>💾<span className="wb-label">{t('wb.save')}</span></button>
          <button className="wb-btn wb-close" onClick={onClose} title={t('wb.close')}>✕<span className="wb-label">{t('wb.close')}</span></button>
        </div>
      </div>
    </div>
  )
}
