import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formulaById } from '../data/formulas'
import type { Lang } from '../i18n'
import { checkNumber, type Question } from '../lib/quiz'
import { useStore } from '../lib/store'
import { Tex } from './Tex'

type Props = { questions: Question[]; onFinish: (correct: number) => void }

export function Quiz({ questions, onFinish }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [verdict, setVerdict] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [score, setScore] = useState(0)
  const { recordAnswers } = useStore()

  const q = questions[idx]
  const title = formulaById(q.fid)?.title[lang] ?? ''
  const answered = verdict !== null

  const check = () => {
    let ok: boolean | null
    if (q.kind === 'choice') {
      if (picked === null) return setError(t('test.pickOne'))
      ok = picked === q.correct
    } else {
      ok = checkNumber(q, input)
      if (ok === null) return setError(t('test.enterNumber'))
    }
    setError('')
    setVerdict(ok)
    recordAnswers([{ key: `f:${q.fid}`, ok: Boolean(ok) }])
    if (ok) setScore((s) => s + 1)
  }

  const next = () => {
    if (idx + 1 >= questions.length) return onFinish(score)
    setIdx(idx + 1)
    setPicked(null)
    setInput('')
    setVerdict(null)
    setError('')
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <span className="muted small">{t('test.question', { n: idx + 1, total: questions.length })}</span>
        <span className="badge lv-easy">✓ {score}</span>
      </div>
      <div className="bar"><div style={{ width: `${(idx / questions.length) * 100}%` }} /></div>

      {q.kind === 'choice' ? (
        <>
          <strong>{t('test.choose', { t: title })}</strong>
          <div style={{ display: 'grid', gap: 8 }}>
            {q.options.map((o, i) => {
              const state = answered ? (i === q.correct ? 'right' : i === picked ? 'wrong' : '') : picked === i ? 'picked' : ''
              return (
                <button
                  key={i}
                  className={`option ${state}`}
                  disabled={answered}
                  onClick={() => { setPicked(i); setError('') }}
                >
                  <Tex tex={o} />
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <strong>{t('test.compute', { t: title })}</strong>
          <div className="calc-screen" style={{ color: 'var(--space-ink)', fontSize: 20, textAlign: 'center' }}>
            <Tex tex={`${q.given}.\\qquad ${q.unknownTex} = \\;?`} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (!answered) check() }}>
            <input
              className="input"
              inputMode="decimal"
              placeholder={t('test.enterNumber')}
              value={input}
              disabled={answered}
              onChange={(e) => { setInput(e.target.value); setError('') }}
              aria-label={t('test.enterNumber')}
            />
          </form>
          <span className="muted small">{t('test.roundHint')}</span>
        </>
      )}

      {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}

      {answered && (
        <div className={verdict ? 'answer' : 'answer wrong'}>
          {verdict ? t('test.correct') : q.kind === 'choice' ? t('test.wrongChoice') : t('test.wrong')}
          {!verdict && q.kind === 'number' && <Tex className="step-tex" tex={q.answerTex} />}
        </div>
      )}

      <div>
        {answered ? (
          <button className="btn btn-primary" onClick={next}>
            {idx + 1 >= questions.length ? t('test.finish') : t('test.next')}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={check}>{t('test.check')}</button>
        )}
      </div>
    </div>
  )
}
