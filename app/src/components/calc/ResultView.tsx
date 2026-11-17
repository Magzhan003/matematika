import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CalcResult } from '../../lib/calc/tools'
import { Tex } from '../Tex'
import { Graph } from './Graph'
import { SignChart } from './SignChart'

/** Steps, sign chart, answer, check by substitution and a graph for any solver result. */
export function ResultView({ result, onSimilar }: { result: CalcResult; onSimilar?: () => void }) {
  const { t } = useTranslation()
  const [brief, setBrief] = useState(false)
  if ('error' in result) return <p className="error" role="alert">{t(result.error)}</p>

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="chips">
        <button className={`chip ${!brief ? 'on' : ''}`} onClick={() => setBrief(false)}>{t('cx.allSteps')}</button>
        <button className={`chip ${brief ? 'on' : ''}`} onClick={() => setBrief(true)}>{t('cx.onlyAnswer')}</button>
        {onSimilar && <button className="chip" style={{ marginLeft: 'auto' }} onClick={onSimilar}>↻ {t('cx.similar')}</button>}
      </div>

      {!brief && (
        <div className="steps">
          {result.steps.map((s, i) => (
            <div className="step" key={i}>
              <div style={{ minWidth: 0 }}>
                {s.note && <div className="step-note">{t(s.note, s.params ?? {})}</div>}
                <Tex className="step-tex" tex={s.tex} block />
              </div>
            </div>
          ))}
        </div>
      )}

      {result.signChart && (
        <div className="card">
          <div className="muted small" style={{ marginBottom: 6 }}>{t('cx.signChart')}</div>
          <SignChart chart={result.signChart} />
        </div>
      )}

      <div className="answer big-answer">
        {t('steps.answer')}: <Tex className="step-tex" tex={result.answer} />
        {result.approx && (
          <span className="small" style={{ fontWeight: 400 }}>
            ({t('steps.approx')}: <Tex tex={result.approx} />)
          </span>
        )}
      </div>

      {!brief && result.verify && result.verify.length > 0 && (
        <div className="card verify">
          <div className="muted small" style={{ marginBottom: 6 }}>✓ {t('cx.verify')}</div>
          {result.verify.map((v, i) => <Tex key={i} className="step-tex" tex={v.tex} block />)}
        </div>
      )}

      {result.plot && result.plot.fns.length > 0 && (
        <div>
          <div className="muted small" style={{ marginBottom: 6 }}>{t('cx.graph')}</div>
          <Graph fns={result.plot.fns} points={result.plot.points} height={280} />
        </div>
      )}
    </div>
  )
}
