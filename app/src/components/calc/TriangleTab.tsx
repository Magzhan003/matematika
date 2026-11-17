import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { solveTriangle, type Tri, type TriKey, type TriResult } from '../../lib/calc/triangle'
import { useStore } from '../../lib/store'
import { Tex } from '../Tex'

const keys: TriKey[] = ['a', 'b', 'c', 'A', 'B', 'C']
const label: Record<TriKey, string> = { a: 'a', b: 'b', c: 'c', A: '\\alpha', B: '\\beta', C: '\\gamma' }
const fmt = (x: number) => String(Number(x.toFixed(3))).replace('.', '{,}')
const fmtPlain = (x: number) => String(Number(x.toFixed(3))).replace('.', ',')

/** The solved triangle drawn to scale: A at the origin, AB along the x axis. */
function TriangleSvg({ t }: { t: Record<TriKey, number> }) {
  const { a, b, c, A } = t
  const P = [[0, 0], [c, 0], [b * Math.cos((A * Math.PI) / 180), b * Math.sin((A * Math.PI) / 180)]]
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), maxY = Math.max(...ys)
  const W = 320, H = 220, pad = 30
  const k = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY || 1))
  const pt = (p: number[]) => [pad + (p[0] - minX) * k, H - pad - p[1] * k]
  const [pA, pB, pC] = P.map(pt)
  const mid = (u: number[], v: number[]) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2]
  const lbl = { fill: 'var(--ink)', fontSize: 14, fontWeight: 700 } as const
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 420 }} role="img" aria-label="triangle">
      <polygon points={[pA, pB, pC].map((p) => p.join(',')).join(' ')} style={{ fill: 'var(--accent-soft)', stroke: 'var(--ink)', strokeWidth: 2.5 }} />
      <text x={pA[0] - 16} y={pA[1] + 16} style={lbl}>A</text>
      <text x={pB[0] + 6} y={pB[1] + 16} style={lbl}>B</text>
      <text x={pC[0] - 4} y={pC[1] - 8} style={lbl}>C</text>
      {[[pB, pC, `a = ${fmtPlain(a)}`], [pA, pC, `b = ${fmtPlain(b)}`], [pA, pB, `c = ${fmtPlain(c)}`]].map(([u, v, s], i) => {
        const m = mid(u as number[], v as number[])
        return <text key={i} x={m[0] + (i === 1 ? -60 : 6)} y={m[1] + (i === 2 ? 18 : -4)} style={{ fill: 'var(--muted)', fontSize: 12 }}>{s as string}</text>
      })}
    </svg>
  )
}

export function TriangleTab() {
  const { t } = useTranslation()
  const { addSolved } = useStore()
  const [vals, setVals] = useState<Record<TriKey, string>>({ a: '', b: '7', c: '5', A: '60', B: '', C: '' })
  const [res, setRes] = useState<TriResult | null>(null)

  const run = () => {
    const input = Object.fromEntries(keys.map((k) => {
      const s = vals[k].replace(',', '.').trim()
      return [k, s === '' ? null : Number(s)]
    })) as Tri
    const r = solveTriangle(input)
    setRes(r)
    if (!('error' in r)) addSolved()
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <p className="muted small" style={{ margin: 0 }}>{t('cx.tri.hint')}</p>
      <form className="card tri-form" onSubmit={(e) => { e.preventDefault(); run() }}>
        {(['sides', 'angles'] as const).map((grp) => (
          <div key={grp} style={{ display: 'grid', gap: 8 }}>
            <span className="muted small">{t(`cx.tri.${grp}`)}</span>
            <div className="tri-inputs">
              {(grp === 'sides' ? keys.slice(0, 3) : keys.slice(3)).map((k) => (
                <label key={k} className="tri-input">
                  <Tex tex={label[k]} />
                  <input className="input" inputMode="decimal" value={vals[k]} placeholder="?" onChange={(e) => setVals({ ...vals, [k]: e.target.value })} aria-label={k} />
                </label>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" type="submit">{t('cx.tri.run')}</button>
          <button className="btn" type="button" onClick={() => { setVals({ a: '', b: '', c: '', A: '', B: '', C: '' }); setRes(null) }}>{t('cx.tri.clear')}</button>
        </div>
      </form>

      {res && ('error' in res ? <p className="error" role="alert">{t(res.error)}</p> : (
        <>
          <div className="steps">
            {res.steps.map((s, i) => (
              <div className="step" key={i}>
                <div style={{ minWidth: 0 }}>
                  {s.note && <div className="step-note">{t(s.note, s.params ?? {})}</div>}
                  <Tex className="step-tex" tex={s.tex} block />
                </div>
              </div>
            ))}
          </div>
          <div className="tri-result">
            <TriangleSvg t={res.t} />
            <div className="analysis" style={{ flex: 1 }}>
              <div className="an-row"><span className="an-key">{t('cx.tri.type')}</span><span>{res.kind.split('.').map((k) => t(`tri.${k}`)).join(', ')}</span></div>
              <div className="an-row"><span className="an-key">{t('cx.tri.sides')}</span><Tex tex={`a = ${fmt(res.t.a)},\\ b = ${fmt(res.t.b)},\\ c = ${fmt(res.t.c)}`} /></div>
              <div className="an-row"><span className="an-key">{t('cx.tri.angles')}</span><Tex tex={`\\alpha = ${fmt(res.t.A)}^\\circ,\\ \\beta = ${fmt(res.t.B)}^\\circ,\\ \\gamma = ${fmt(res.t.C)}^\\circ`} /></div>
              {res.extra.map((x) => (
                <div className="an-row" key={x.key}><span className="an-key">{t(x.key)}</span><Tex tex={x.tex} /></div>
              ))}
            </div>
          </div>
          {res.second && (
            <div className="card">
              <div className="muted small">{t('cx.tri.second')}</div>
              <Tex tex={`a = ${fmt(res.second.a)},\\ b = ${fmt(res.second.b)},\\ c = ${fmt(res.second.c)};\\quad \\alpha = ${fmt(res.second.A)}^\\circ,\\ \\beta = ${fmt(res.second.B)}^\\circ,\\ \\gamma = ${fmt(res.second.C)}^\\circ`} />
            </div>
          )}
        </>
      ))}
    </div>
  )
}
