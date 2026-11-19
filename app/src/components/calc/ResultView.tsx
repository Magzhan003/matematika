import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CalcResult } from '../../lib/calc/tools'
import { Tex } from '../Tex'
import { Graph } from './Graph'
import { ShowOnBoard } from './ShowOnBoard'
import { SignChart } from './SignChart'

type Mode = 'all' | 'step' | 'answer'

/**
 * Steps, sign chart, answer, check by substitution and a graph for any solver result.
 * Three ways to look at it: all steps, one step at a time (the student tries the next one first), only the answer.
 * Steps with a known rule get a "Why?" button with a short school explanation.
 */
export function ResultView({ result, onSimilar, title }: { result: CalcResult; onSimilar?: () => void; title?: string }) {
  const { t, i18n } = useTranslation()
  const [mode, setMode] = useState<Mode>('all')
  const [shown, setShown] = useState(1)
  const [why, setWhy] = useState<number | null>(null)
  const [board, setBoard] = useState(false)
  if ('error' in result) return <p className="error" role="alert">{t(result.error)}</p>

  const total = result.steps.length
  const visible = mode === 'all' ? total : mode === 'step' ? Math.min(shown, total) : 0
  const answerShown = mode !== 'step' || shown > total
  const pick = (m: Mode) => { setMode(m); setShown(1); setWhy(null) }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {board && <ShowOnBoard result={result} title={title ?? result.steps[0]?.tex ?? ''} onClose={() => setBoard(false)} />}
      <div className="chips">
        <button className={`chip ${mode === 'all' ? 'on' : ''}`} onClick={() => pick('all')}>{t('cx.allSteps')}</button>
        <button className={`chip ${mode === 'step' ? 'on' : ''}`} onClick={() => pick('step')}>{t('cx.byStep')}</button>
        <button className={`chip ${mode === 'answer' ? 'on' : ''}`} onClick={() => pick('answer')}>{t('cx.onlyAnswer')}</button>
        <button className="chip" style={{ marginLeft: 'auto' }} onClick={() => setBoard(true)}>📺 {t('cx.onBoard')}</button>
        {onSimilar && <button className="chip" onClick={onSimilar}>↻ {t('cx.similar')}</button>}
      </div>

      {visible > 0 && (
        <div className="steps">
          {result.steps.slice(0, visible).map((s, i) => {
            const whyKey = s.note ? `why.${s.note}` : ''
            const hasWhy = whyKey !== '' && i18n.exists(whyKey)
            return (
              <div className="step fade-in" key={i}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {s.note && (
                    <div className="step-note">
                      {t(s.note, s.params ?? {})}
                      {hasWhy && (
                        <button className="why-btn" onClick={() => setWhy(why === i ? null : i)} aria-expanded={why === i}>
                          {why === i ? t('cx.gotIt') : `? ${t('cx.why')}`}
                        </button>
                      )}
                    </div>
                  )}
                  <Tex className="step-tex" tex={s.tex} block />
                  {why === i && hasWhy && <p className="why-text">💡 {t(whyKey)}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {mode === 'step' && !answerShown && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShown(shown + 1)}>
            {shown < total ? `${t('cx.nextStep')} →` : `✓ ${t('cx.showAnswer')}`}
          </button>
          <span className="muted small">{t('cx.stepOf', { n: Math.min(shown, total), total })}</span>
        </div>
      )}

      {answerShown && result.signChart && (
        <div className="card">
          <div className="muted small" style={{ marginBottom: 6 }}>{t('cx.signChart')}</div>
          <SignChart chart={result.signChart} />
        </div>
      )}

      {answerShown && (
        <div className="answer big-answer">
          {t('steps.answer')}: <Tex className="step-tex" tex={result.answer} />
          {result.approx && (
            <span className="small" style={{ fontWeight: 400 }}>
              ({t('steps.approx')}: <Tex tex={result.approx} />)
            </span>
          )}
        </div>
      )}

      {mode === 'all' && result.verify && result.verify.length > 0 && (
        <div className="card verify">
          <div className="muted small" style={{ marginBottom: 6 }}>✓ {t('cx.verify')}</div>
          {result.verify.map((v, i) => <Tex key={i} className="step-tex" tex={v.tex} block />)}
        </div>
      )}

      {answerShown && result.plot && result.plot.fns.length > 0 && (
        <div>
          <div className="muted small" style={{ marginBottom: 6 }}>{t('cx.graph')}</div>
          <Graph fns={result.plot.fns} points={result.plot.points} height={280} />
        </div>
      )}
    </div>
  )
}
