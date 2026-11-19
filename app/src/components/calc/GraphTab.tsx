import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fnOf, numTex, numericRoots, prepare } from '../../lib/calc/tools'
import { Tex } from '../Tex'
import { normalize } from '../../lib/mathcore'
import { Graph, type GraphPoint } from './Graph'

const PARAMS = ['a', 'b', 'c', 'k', 'm', 'p', 'q']

/** Several functions, sliders for parameters, zeros / extrema / intersections marked. */
export function GraphTab() {
  const { t } = useTranslation()
  const [fns, setFns] = useState<string[]>(['a*x^2 + b*x + c', 'k*x + m'])
  const [vals, setVals] = useState<Record<string, number>>({ a: 1, b: -2, c: -3, k: 1, m: 1 })
  const [tangent, setTangent] = useState(false)
  const [x0, setX0] = useState(1)
  const [table, setTable] = useState(false)

  const used = useMemo(
    () => PARAMS.filter((p) => fns.some((f) => new RegExp(`(?<![A-Za-z_])${p}(?![A-Za-z_(])`).test(f))),
    [fns],
  )
  const ready = useMemo(
    () => fns.map((f) => {
      let s = prepare(normalize(f))
      for (const p of used) s = s.replace(new RegExp(`(?<![A-Za-z_])${p}(?![A-Za-z_(])`, 'g'), `(${vals[p] ?? 1})`)
      return s
    }),
    [fns, used, vals],
  )
  const points = useMemo<GraphPoint[]>(() => {
    const out: GraphPoint[] = []
    const fs = ready.filter(Boolean).map((s) => fnOf(s))
    fs.forEach((f) => {
      for (const x of numericRoots(f, -30, 30, 3000)) out.push({ x, y: 0, label: t('cx.gr.zero') })
      const d = (x: number) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5
      for (const x of numericRoots(d, -30, 30, 3000)) {
        const l = d(x - 1e-3), r = d(x + 1e-3)
        if (l > 0 && r < 0) out.push({ x, y: f(x), label: t('cx.gr.max') })
        if (l < 0 && r > 0) out.push({ x, y: f(x), label: t('cx.gr.min') })
      }
    })
    for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++) {
      const diff = (x: number) => fs[i](x) - fs[j](x)
      for (const x of numericRoots(diff, -30, 30, 3000)) out.push({ x, y: fs[i](x), label: t('cx.gr.inter') })
    }
    // merge points that coincide (e.g. a zero that is also an intersection)
    const merged: GraphPoint[] = []
    for (const p of out.filter((q) => Number.isFinite(q.y))) {
      const same = merged.find((q) => Math.abs(q.x - p.x) < 1e-6 && Math.abs(q.y - p.y) < 1e-6)
      if (same) { if (p.label && !same.label?.includes(p.label)) same.label = `${same.label}, ${p.label}` } else merged.push({ ...p })
    }
    return merged.slice(0, 16)
  }, [ready, t])

  // tangent to y1 at x0: y = f(x0) + f'(x0)(x − x0)
  const tan = useMemo(() => {
    if (!tangent || !ready[0]) return null
    const f = fnOf(ready[0])
    const y0 = f(x0), k = (f(x0 + 1e-5) - f(x0 - 1e-5)) / 2e-5
    if (!Number.isFinite(y0) || !Number.isFinite(k)) return null
    const r = (z: number) => Math.round(z * 1e4) / 1e4
    const b = r(y0 - k * x0)
    return { fn: `${r(k)}*x + (${b})`, y0, k: r(k), b, tex: `y = ${numTex(r(k))}x ${b < 0 ? '-' : '+'} ${numTex(Math.abs(b))}` }
  }, [tangent, ready, x0])
  const xsTable = [-3, -2, -1, 0, 1, 2, 3].map((d) => x0 + d)

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="card" style={{ display: 'grid', gap: 8 }}>
        {fns.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="muted" style={{ whiteSpace: 'nowrap' }}>y{fns.length > 1 ? <sub>{i + 1}</sub> : ''} =</span>
            <input className="input" value={f} spellCheck={false} onChange={(e) => setFns(fns.map((x, k) => (k === i ? e.target.value : x)))} aria-label={`y${i + 1}`} />
            {fns.length > 1 && <button className="btn btn-sm" onClick={() => setFns(fns.filter((_, k) => k !== i))} aria-label={t('cx.gr.remove')}>×</button>}
          </div>
        ))}
        {fns.length < 5 && <div><button className="btn btn-sm" onClick={() => setFns([...fns, ''])}>+ {t('cx.gr.add')}</button></div>}
      </div>

      {used.length > 0 && (
        <div className="card" style={{ display: 'grid', gap: 8 }}>
          <div className="muted small">{t('cx.gr.params')}</div>
          {used.map((p) => (
            <label key={p} className="slider-row">
              <b style={{ width: 18 }}>{p}</b>
              <input type="range" min={-10} max={10} step={0.1} value={vals[p] ?? 1} onChange={(e) => setVals({ ...vals, [p]: Number(e.target.value) })} />
              <span style={{ width: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{String(vals[p] ?? 1).replace('.', ',')}</span>
            </label>
          ))}
        </div>
      )}

      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="check-row"><input type="checkbox" checked={tangent} onChange={(e) => setTangent(e.target.checked)} /> {t('cx.gr.tangent')}</label>
          <label className="check-row"><input type="checkbox" checked={table} onChange={(e) => setTable(e.target.checked)} /> {t('cx.gr.table')}</label>
          {(tangent || table) && (
            <label className="slider-row" style={{ flex: '1 1 220px' }}>
              <b style={{ whiteSpace: 'nowrap' }}>x₀</b>
              <input type="range" min={-10} max={10} step={0.5} value={x0} onChange={(e) => setX0(Number(e.target.value))} />
              <span style={{ width: 44, textAlign: 'right' }}>{String(x0).replace('.', ',')}</span>
            </label>
          )}
        </div>
        {tan && <div className="small"><Tex tex={`f'(${numTex(x0)}) = ${numTex(tan.k)},\\quad ${tan.tex}`} /></div>}
      </div>

      <Graph fns={tan ? [...ready, tan.fn] : ready} points={tan ? [...points, { x: x0, y: tan.y0, label: 'x₀' }] : points} height={380}
        labels={tan ? [...fns, t('cx.gr.tangent')] : fns} />

      {table && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="val-table">
            <tbody>
              <tr><th>x</th>{xsTable.map((x) => <td key={x}>{String(x).replace('.', ',')}</td>)}</tr>
              {ready.map((r, i) => r && (
                <tr key={i}><th>y{ready.length > 1 ? <sub>{i + 1}</sub> : ''}</th>{xsTable.map((x) => { const y = fnOf(r)(x); return <td key={x}>{Number.isFinite(y) ? String(Math.round(y * 1000) / 1000).replace('.', ',') : '—'}</td> })}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small" style={{ margin: 0 }}>{t('cx.gr.hint')}</p>
    </div>
  )
}
