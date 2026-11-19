import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lang } from '../../i18n'
import { fmt, shapes, solveShape, type ShapeResult } from '../../lib/calc/shapes'
import { useStore } from '../../lib/store'
import { Tex } from '../Tex'

const W = 340, H = 230
const plain = (x?: number) => (x === undefined ? '' : fmt(x).replace('{,}', ','))

/** Label on a drawing: the letter and, when known, its value. */
function Lbl({ x, y, name, v, anchor = 'middle', found }: { x: number; y: number; name: string; v?: number; anchor?: 'start' | 'middle' | 'end'; found?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={`shp-lbl ${found ? 'found' : ''}`}>
      {name}{v !== undefined ? ` = ${plain(v)}` : ''}
    </text>
  )
}

/** Drawing to scale (2D) or a sketch (3D) with the known values written on it. */
function Drawing({ id, v, found }: { id: string; v: Record<string, number>; found: Set<string> }) {
  const F = (k: string) => found.has(k)
  const fit = (w: number, h: number) => {
    const s = Math.min((W - 90) / w, (H - 60) / h)
    return { s, ox: (W - w * s) / 2, oy: (H - h * s) / 2 }
  }
  const line = 'shp-line', thin = 'shp-thin', dash = 'shp-dash'
  switch (id) {
    case 'square': {
      const a = v.a ?? 1, { s, ox, oy } = fit(a, a), A = a * s
      return (<g>
        <rect x={ox} y={oy} width={A} height={A} className={line} />
        <line x1={ox} y1={oy + A} x2={ox + A} y2={oy} className={dash} />
        <circle cx={ox + A / 2} cy={oy + A / 2} r={A / 2} className={thin} />
        <Lbl x={ox + A / 2} y={oy + A + 18} name="a" v={v.a} found={F('a')} />
        <Lbl x={ox + A / 2 + 8} y={oy + A / 2 - 6} name="d" v={v.d} anchor="start" found={F('d')} />
      </g>)
    }
    case 'rect': {
      const a = v.a ?? 3, b = v.b ?? 2, { s, ox, oy } = fit(a, b)
      return (<g>
        <rect x={ox} y={oy} width={a * s} height={b * s} className={line} />
        <line x1={ox} y1={oy + b * s} x2={ox + a * s} y2={oy} className={dash} />
        <Lbl x={ox + (a * s) / 2} y={oy + b * s + 18} name="a" v={v.a} found={F('a')} />
        <Lbl x={ox - 8} y={oy + (b * s) / 2} name="b" v={v.b} anchor="end" found={F('b')} />
        <Lbl x={ox + (a * s) / 2 + 6} y={oy + (b * s) / 2 - 8} name="d" v={v.d} anchor="start" found={F('d')} />
      </g>)
    }
    case 'circle': {
      const r = 80
      return (<g>
        <circle cx={W / 2} cy={H / 2} r={r} className={line} />
        <line x1={W / 2} y1={H / 2} x2={W / 2 + r} y2={H / 2} className={line} />
        <circle cx={W / 2} cy={H / 2} r={3} className="shp-dot" />
        <Lbl x={W / 2 + r / 2} y={H / 2 - 8} name="r" v={v.r} found={F('r')} />
        <Lbl x={W / 2} y={H / 2 + r + 18} name="C" v={v.C} found={F('C')} />
      </g>)
    }
    case 'rtri': {
      const a = v.a ?? 3, b = v.b ?? 4, { s, ox, oy } = fit(b, a)
      const C = [ox, oy + a * s], B = [ox + b * s, oy + a * s], A = [ox, oy]
      return (<g>
        <polygon points={`${A} ${C} ${B}`} className={line} />
        <path d={`M ${C[0]} ${C[1] - 12} h 12 v 12`} className={thin} />
        <Lbl x={ox - 8} y={oy + (a * s) / 2} name="a" v={v.a} anchor="end" found={F('a')} />
        <Lbl x={ox + (b * s) / 2} y={oy + a * s + 18} name="b" v={v.b} found={F('b')} />
        <Lbl x={ox + (b * s) / 2 + 8} y={oy + (a * s) / 2 - 6} name="c" v={v.c} anchor="start" found={F('c')} />
        <Lbl x={B[0] - 36} y={B[1] - 8} name="α" v={v.al} anchor="end" found={F('al')} />
        <Lbl x={A[0] + 8} y={A[1] + 30} name="β" v={v.be} anchor="start" found={F('be')} />
      </g>)
    }
    case 'trap': {
      const a = v.a ?? 10, b = v.b ?? 5, h = v.h ?? 4, { s, ox, oy } = fit(Math.max(a, b), h), d = ((a - b) / 2) * s
      return (<g>
        <polygon points={`${ox},${oy + h * s} ${ox + a * s},${oy + h * s} ${ox + a * s - d},${oy} ${ox + d},${oy}`} className={line} />
        <line x1={ox + d} y1={oy} x2={ox + d} y2={oy + h * s} className={dash} />
        <line x1={ox + d / 2} y1={oy + (h * s) / 2} x2={ox + a * s - d / 2} y2={oy + (h * s) / 2} className={thin} />
        <Lbl x={ox + (a * s) / 2} y={oy + h * s + 18} name="a" v={v.a} found={F('a')} />
        <Lbl x={ox + (a * s) / 2} y={oy - 8} name="b" v={v.b} found={F('b')} />
        <Lbl x={ox + d + 6} y={oy + (h * s) / 2 + 18} name="h" v={v.h} anchor="start" found={F('h')} />
        <Lbl x={ox + a * s - d / 2 + 8} y={oy + (h * s) / 2 - 10} name="c" v={v.c} anchor="start" found={F('c')} />
      </g>)
    }
    case 'para': {
      const a = v.a ?? 5, b = v.b ?? 3, al = ((v.al ?? 60) * Math.PI) / 180, dx = b * Math.cos(al), h = b * Math.sin(al)
      const { s, ox, oy } = fit(a + Math.abs(dx), h)
      return (<g>
        <polygon points={`${ox},${oy + h * s} ${ox + a * s},${oy + h * s} ${ox + (a + dx) * s},${oy} ${ox + dx * s},${oy}`} className={line} />
        <line x1={ox + dx * s} y1={oy} x2={ox + dx * s} y2={oy + h * s} className={dash} />
        <Lbl x={ox + (a * s) / 2} y={oy + h * s + 18} name="a" v={v.a} found={F('a')} />
        <Lbl x={ox + (dx * s) / 2 - 8} y={oy + (h * s) / 2} name="b" v={v.b} anchor="end" found={F('b')} />
        <Lbl x={ox + dx * s + 6} y={oy + (h * s) / 2} name="h" v={v.h} anchor="start" found={F('h')} />
        <Lbl x={ox + 26} y={oy + h * s - 8} name="α" v={v.al} anchor="start" found={F('al')} />
      </g>)
    }
    case 'rhomb': {
      const d1 = v.d1 ?? 8, d2 = v.d2 ?? 6, { s, ox, oy } = fit(d1, d2), cx = ox + (d1 * s) / 2, cy = oy + (d2 * s) / 2
      return (<g>
        <polygon points={`${ox},${cy} ${cx},${oy} ${ox + d1 * s},${cy} ${cx},${oy + d2 * s}`} className={line} />
        <line x1={ox} y1={cy} x2={ox + d1 * s} y2={cy} className={dash} />
        <line x1={cx} y1={oy} x2={cx} y2={oy + d2 * s} className={dash} />
        <Lbl x={cx + (d1 * s) / 4} y={cy - 6} name="d₁" v={v.d1} found={F('d1')} />
        <Lbl x={cx + 6} y={cy + (d2 * s) / 4} name="d₂" v={v.d2} anchor="start" found={F('d2')} />
        <Lbl x={ox + (d1 * s) / 4 - 10} y={oy + (d2 * s) / 4 - 4} name="a" v={v.a} anchor="end" found={F('a')} />
      </g>)
    }
    case 'cube':
    case 'box': {
      const a = id === 'cube' ? (v.a ?? 1) : (v.a ?? 4), b = id === 'cube' ? a : (v.b ?? 3), c = id === 'cube' ? a : (v.c ?? 2)
      const k = 0.45, dx = b * k * 0.8, dy = b * k * 0.55, { s, ox, oy } = fit(a + dx, c + dy)
      const X = (x: number) => ox + x * s, Y = (y: number) => oy + y * s
      const f = [[0, dy], [a, dy], [a, dy + c], [0, dy + c]], bk = f.map(([x, y]) => [x + dx, y - dy])
      const P = (p: number[]) => `${X(p[0])},${Y(p[1])}`
      return (<g>
        <polygon points={f.map(P).join(' ')} className={line} />
        <polyline points={[f[0], bk[0], bk[1], f[1]].map(P).join(' ')} className={line} />
        <polyline points={[bk[1], bk[2], f[2]].map(P).join(' ')} className={line} />
        <polyline points={[f[3], bk[3], bk[0]].map(P).join(' ')} className={dash} />
        <line x1={X(bk[3][0])} y1={Y(bk[3][1])} x2={X(bk[2][0])} y2={Y(bk[2][1])} className={dash} />
        <line x1={X(f[3][0])} y1={Y(f[3][1])} x2={X(bk[1][0])} y2={Y(bk[1][1])} className={thin} />
        <Lbl x={X(a / 2)} y={Y(dy + c) + 18} name="a" v={v.a} found={F('a')} />
        {id === 'box' && <Lbl x={X(a + dx / 2) + 8} y={Y(dy + c - dy / 2) + 4} name="b" v={v.b} anchor="start" found={F('b')} />}
        {id === 'box' && <Lbl x={X(0) - 8} y={Y(dy + c / 2)} name="c" v={v.c} anchor="end" found={F('c')} />}
        <Lbl x={X(a / 2 + dx / 2)} y={Y(dy + c / 2) - 6} name="d" v={v.d} found={F('d')} />
      </g>)
    }
    case 'cyl':
    case 'cone': {
      const r = v.r ?? 2, h = v.h ?? 4, { s, ox, oy } = fit(2 * r, h + r * 0.6), R = r * s, cx = ox + R, top = oy + r * 0.3 * s, bot = top + h * s, e = R * 0.3
      return (<g>
        <ellipse cx={cx} cy={bot} rx={R} ry={e} className={id === 'cyl' ? line : line} />
        {id === 'cyl' && <ellipse cx={cx} cy={top} rx={R} ry={e} className={line} />}
        {id === 'cyl'
          ? <><line x1={cx - R} y1={top} x2={cx - R} y2={bot} className={line} /><line x1={cx + R} y1={top} x2={cx + R} y2={bot} className={line} /></>
          : <><line x1={cx - R} y1={bot} x2={cx} y2={top} className={line} /><line x1={cx + R} y1={bot} x2={cx} y2={top} className={line} /></>}
        <line x1={cx} y1={top} x2={cx} y2={bot} className={dash} />
        <line x1={cx} y1={bot} x2={cx + R} y2={bot} className={thin} />
        <Lbl x={cx + R / 2} y={bot + e + 16} name="r" v={v.r} found={F('r')} />
        <Lbl x={cx - 6} y={(top + bot) / 2} name="h" v={v.h} anchor="end" found={F('h')} />
        {id === 'cone' && <Lbl x={cx + R / 2 + 8} y={(top + bot) / 2} name="l" v={v.l} anchor="start" found={F('l')} />}
      </g>)
    }
    case 'sphere': {
      const r = 85
      return (<g>
        <circle cx={W / 2} cy={H / 2} r={r} className={line} />
        <ellipse cx={W / 2} cy={H / 2} rx={r} ry={r * 0.28} className={dash} />
        <line x1={W / 2} y1={H / 2} x2={W / 2 + r} y2={H / 2} className={line} />
        <Lbl x={W / 2 + r / 2} y={H / 2 - 8} name="R" v={v.R} found={F('R')} />
      </g>)
    }
    case 'pyr': {
      const a = v.a ?? 4, h = v.h ?? 4, dx = a * 0.45, dy = a * 0.3, { s, ox, oy } = fit(a + dx, h + dy)
      const X = (x: number) => ox + x * s, Y = (y: number) => oy + y * s
      const b0 = [0, h + dy], b1 = [a, h + dy], b2 = [a + dx, h], b3 = [dx, h], top = [(a + dx) / 2, 0], c = [(a + dx) / 2, h + dy / 2]
      const P = (p: number[]) => `${X(p[0])},${Y(p[1])}`
      return (<g>
        <polyline points={[b3, b0, b1, b2].map(P).join(' ')} className={line} />
        <polyline points={[b2, b3].map(P).join(' ')} className={dash} />
        {[b0, b1, b2].map((p, i) => <line key={i} x1={X(p[0])} y1={Y(p[1])} x2={X(top[0])} y2={Y(top[1])} className={line} />)}
        <line x1={X(b3[0])} y1={Y(b3[1])} x2={X(top[0])} y2={Y(top[1])} className={dash} />
        <line x1={X(c[0])} y1={Y(c[1])} x2={X(top[0])} y2={Y(top[1])} className={dash} />
        <Lbl x={X(a / 2)} y={Y(h + dy) + 18} name="a" v={v.a} found={F('a')} />
        <Lbl x={X(c[0]) + 6} y={Y((c[1] + top[1]) / 2)} name="h" v={v.h} anchor="start" found={F('h')} />
        <Lbl x={X(b1[0]) + 4} y={Y((b1[1] + top[1]) / 2)} name="b" v={v.b} anchor="start" found={F('b')} />
      </g>)
    }
  }
  return null
}

/** Figures: fill in what you know — everything else is found step by step and drawn. */
export function ShapesTab() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { addSolved } = useStore()
  const [id, setId] = useState(shapes[0].id)
  const [input, setInput] = useState<Record<string, string>>({})
  const [res, setRes] = useState<ShapeResult | null>(null)
  const shape = shapes.find((s) => s.id === id)!
  const found = useMemo(() => new Set(res?.steps.map((s) => s.found) ?? []), [res])

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="chips">
        {shapes.map((s) => (
          <button key={s.id} className={`chip ${s.id === id ? 'on' : ''}`} onClick={() => { setId(s.id); setInput({}); setRes(null) }}>
            <span aria-hidden="true">{s.icon}</span> {s.title[lang]}
          </button>
        ))}
      </div>
      <div className="shp-grid">
        <form className="card" style={{ display: 'grid', gap: 8 }} onSubmit={(e) => {
          e.preventDefault()
          const r = solveShape(shape, input)
          setRes(r)
          if (r.steps.length) addSolved()
        }}>
          <p className="muted small" style={{ margin: 0 }}>{t('shp.hint')}</p>
          {shape.vars.map((v) => (
            <div className="var-row" key={v.k}>
              <label htmlFor={`shp-${v.k}`}><Tex tex={v.tex} /> <span className="muted small">{v.label[lang]}</span></label>
              <input id={`shp-${v.k}`} className={`input ${res && found.has(v.k) ? 'shp-found' : ''}`} inputMode="decimal"
                value={input[v.k] ?? (res && found.has(v.k) ? plain(res.values[v.k]) : '')} placeholder="?"
                onChange={(e) => {
                  // typing again starts a new task from the values the student entered
                  const base = res ? Object.fromEntries(res.given.map((k) => [k, input[k] ?? ''])) : input
                  setInput({ ...base, [v.k]: e.target.value }); setRes(null)
                }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit">{t('calc.find')}</button>
            <button className="btn" type="button" onClick={() => { setInput({}); setRes(null) }}>{t('wb.clear')}</button>
          </div>
        </form>
        <div className="card shp-draw">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={shape.title[lang]}>
            <Drawing id={id} v={res?.values ?? {}} found={found} />
          </svg>
        </div>
      </div>

      {res && (
        <div style={{ display: 'grid', gap: 10 }}>
          {res.conflict && <p className="error" role="alert">{t('shp.conflict')} <Tex tex={res.conflict} /></p>}
          {!res.steps.length && !res.conflict && <p className="error" role="alert">{t('shp.notEnough')}</p>}
          {res.steps.length > 0 && (
            <div className="steps">
              {res.steps.map((s, i) => (
                <div className="step" key={i}>
                  <div style={{ minWidth: 0 }}>
                    <div className="step-note">{shape.vars.find((v) => v.k === s.found)!.label[lang]}</div>
                    <Tex className="step-tex" tex={s.tex} block />
                  </div>
                </div>
              ))}
            </div>
          )}
          {res.steps.length > 0 && res.missing.length > 0 && (
            <p className="muted small" style={{ margin: 0 }}>{t('shp.missing')}: {res.missing.map((k) => shape.vars.find((v) => v.k === k)!.label[lang]).join(', ')}</p>
          )}
        </div>
      )}
    </div>
  )
}
