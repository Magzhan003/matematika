import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { statistics, type StatsResult } from '../../lib/calc/stats'
import { useStore } from '../../lib/store'
import { Tex } from '../Tex'

/** Frequency bar chart. */
function Bars({ freq }: { freq: { x: number; n: number }[] }) {
  const max = Math.max(...freq.map((f) => f.n))
  const W = Math.max(280, freq.length * 44), H = 160
  const bw = W / freq.length
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', maxWidth: 640 }} role="img" aria-label="frequency">
      {freq.map((f, i) => {
        const h = (f.n / max) * (H - 20)
        return (
          <g key={i}>
            <rect x={i * bw + 6} y={H - h} width={bw - 12} height={h} rx="4" style={{ fill: f.n === max && max > 1 ? 'var(--accent)' : 'var(--accent-soft)', stroke: 'var(--accent)' }} />
            <text x={i * bw + bw / 2} y={H - h - 4} textAnchor="middle" style={{ fill: 'var(--ink)', fontSize: 12, fontWeight: 700 }}>{f.n}</text>
            <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" style={{ fill: 'var(--muted)', fontSize: 12 }}>{String(f.x).replace('.', ',')}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function StatsTab() {
  const { t } = useTranslation()
  const { addSolved } = useStore()
  const [input, setInput] = useState('5, 3, 8, 3, 9, 4, 7, 3, 6')
  const [res, setRes] = useState<StatsResult | null>(null)
  const run = () => {
    const r = statistics(input)
    setRes(r)
    if (!('error' in r)) addSolved()
  }
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <form className="calc-screen" onSubmit={(e) => { e.preventDefault(); run() }} style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('cx.st.placeholder')} aria-label={t('cx.st.placeholder')} />
        <button className="btn btn-primary" style={{ height: 52 }} type="submit">{t('cx.st.run')}</button>
      </form>
      {res && ('error' in res ? <p className="error" role="alert">{t(res.error)}</p> : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 130px), 1fr))' }}>
            {res.summary.map((s) => (
              <div key={s.key} className="space-panel" style={{ padding: '10px 14px' }}>
                <div className="muted small">{t(s.key)}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}><Tex tex={s.tex} /></div>
              </div>
            ))}
          </div>
          <div className="steps">
            {res.steps.map((s, i) => (
              <div className="step" key={i}>
                <div style={{ minWidth: 0 }}>
                  {s.note && <div className="step-note">{t(s.note)}</div>}
                  <Tex className="step-tex" tex={s.tex} block />
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="muted small" style={{ marginBottom: 6 }}>{t('cx.st.freq')}</div>
            <Bars freq={res.freq} />
          </div>
        </>
      ))}
    </div>
  )
}
