import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { analyzeFunction, type Analysis } from '../../lib/calc/analyze'
import { prepare } from '../../lib/calc/tools'
import { normalize } from '../../lib/mathcore'
import { useStore } from '../../lib/store'
import { Tex } from '../Tex'
import { Graph } from './Graph'

const samples = ['x^3 - 3x', '(x^2 + 1)/(x - 1)', 'sqrt(4 - x^2)', 'x^4 - 2x^2', '(2x + 1)/(x - 3)', 'ln(x)']

export function AnalyzeTab() {
  const { t } = useTranslation()
  const { addSolved } = useStore()
  const [input, setInput] = useState('x^3 - 3x')
  const [res, setRes] = useState<Analysis | null>(null)
  const run = (s: string) => {
    const r = analyzeFunction(prepare(normalize(s)))
    setRes(r)
    if (!('error' in r)) addSolved()
  }
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <form className="calc-screen" onSubmit={(e) => { e.preventDefault(); run(input) }} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: 'var(--space-ink)', whiteSpace: 'nowrap', fontSize: 18 }}>f(x) =</span>
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('cx.an.placeholder')} spellCheck={false} aria-label="f(x)" />
        <button className="btn btn-primary" style={{ height: 52 }} type="submit">{t('cx.an.run')}</button>
      </form>
      <div className="chips">
        {samples.map((s) => <button key={s} className="chip ex-chip" onClick={() => { setInput(s); run(s) }}>{s}</button>)}
      </div>
      {res && ('error' in res ? <p className="error" role="alert">{t(res.error)}</p> : (
        <>
          <div className="analysis">
            {res.rows.map((r, i) => (
              <div key={i} className="an-row">
                <span className="an-key">{t(r.key)}</span>
                <Tex className="step-tex" tex={r.tex} />
              </div>
            ))}
          </div>
          <Graph fns={res.plot.fns} points={res.plot.points} height={360} />
        </>
      ))}
    </div>
  )
}
