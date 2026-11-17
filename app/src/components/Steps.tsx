import { useTranslation } from 'react-i18next'
import type { SolveResult } from '../lib/solver'
import { Tex } from './Tex'

export function Steps({ result }: { result: SolveResult }) {
  const { t } = useTranslation()
  if ('error' in result) return <p className="error" role="alert">{t(result.error)}</p>
  return (
    <div>
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
      <div className="answer">
        {t('steps.answer')}: <Tex className="step-tex" tex={result.answer} />
        {result.approx && (
          <span className="small" style={{ fontWeight: 400 }}>
            ({t('steps.approx')}: <Tex tex={result.approx} />)
          </span>
        )}
      </div>
    </div>
  )
}
