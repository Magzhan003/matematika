import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lang } from '../i18n'
import { checkTyped, choices, type Problem } from '../lib/bank'
import { solveAny } from '../lib/calc'
import { MistakeHint } from './MistakeHint'
import { ProblemVisual } from './ProblemVisual'
import { Tex } from './Tex'

/** Full solution: the step-by-step solver when the problem has an input for it, else the short steps. */
export function Solution({ p }: { p: Problem }) {
  const { t } = useTranslation()
  const solved = useMemo(() => (p.solve ? solveAny(p.solve, p.solveAction ?? 'auto') : null), [p])
  type S = { note?: string; params?: Record<string, string>; tex: string }
  const steps: S[] = solved && !('error' in solved) ? solved.steps : (p.steps ?? []).map((s) => ({ tex: s }))
  return (
    <div className="steps">
      {steps.map((s, i) => (
        <div className="step" key={i}>
          <div style={{ minWidth: 0 }}>
            {s.note && <div className="step-note">{t(s.note, s.params ?? {})}</div>}
            <Tex className="step-tex" tex={s.tex} block />
          </div>
        </div>
      ))}
      <div className="answer">{t('steps.answer')}: <Tex className="step-tex" tex={p.answer} /></div>
    </div>
  )
}

type Props = {
  p: Problem
  /** typed answers when possible, or always multiple choice */
  mode?: 'auto' | 'choice'
  onResult?: (ok: boolean) => void
}

/** One problem: answer (typed or chosen), hint, check, solution. */
export function ProblemCard({ p, mode = 'auto', onResult }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const typed = mode === 'auto' && Boolean(p.values?.length)
  const ch = useMemo(() => choices(p), [p])
  const [input, setInput] = useState('')
  const [picked, setPicked] = useState<number | null>(null)
  const [verdict, setVerdict] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [hint, setHint] = useState(false)
  const [solution, setSolution] = useState(false)

  const check = () => {
    let ok: boolean | null
    if (typed) {
      ok = checkTyped(p, input)
      if (ok === null) return setError(t('test.enterNumber'))
    } else {
      if (picked === null) return setError(t('test.pickOne'))
      ok = picked === ch.correct
    }
    setError('')
    setVerdict(ok)
    onResult?.(ok)
  }

  const hintTex = p.steps?.[0]
  return (
    <div className="card problem" style={{ display: 'grid', gap: 12 }}>
      <div className="problem-text">{p.text[lang]}</div>
      {p.tex && <div className="problem-tex"><Tex tex={p.tex} /></div>}
      <ProblemVisual p={p} />

      {typed ? (
        <form onSubmit={(e) => { e.preventDefault(); if (verdict === null) check() }}>
          <input className="input" value={input} disabled={verdict !== null} placeholder={t('pc.placeholder')}
            onChange={(e) => { setInput(e.target.value); setError('') }} aria-label={t('pc.placeholder')} />
          <span className="muted small">{p.values!.length > 1 ? t('pc.several') : t('test.roundHint')}</span>
        </form>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {ch.options.map((o, i) => {
            const state = verdict !== null ? (i === ch.correct ? 'right' : i === picked ? 'wrong' : '') : picked === i ? 'picked' : ''
            return (
              <button key={i} className={`option ${state}`} disabled={verdict !== null} onClick={() => { setPicked(i); setError('') }}>
                <b className="opt-letter">{'ABCDE'[i]}</b> <Tex tex={o} />
              </button>
            )
          })}
        </div>
      )}

      {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
      {hint && verdict === null && (
        <div className="hint-box">💡 {hintTex ? <Tex tex={hintTex} /> : t('pc.hintGeneric')}</div>
      )}
      {verdict !== null && (
        <div className={verdict ? 'answer' : 'answer wrong'}>
          {verdict ? t('test.correct') : t('pc.wrong')} {!verdict && <Tex tex={p.answer} />}
        </div>
      )}
      {verdict === false && <MistakeHint p={p} typed={typed ? input : undefined} picked={!typed && picked !== null ? ch.options[picked] : undefined} />}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {verdict === null && <button className="btn btn-primary" onClick={check}>{t('test.check')}</button>}
        {verdict === null && !hint && <button className="btn" onClick={() => setHint(true)}>💡 {t('pc.hint')}</button>}
        <button className="btn" onClick={() => setSolution(!solution)}>{solution ? t('pc.hideSolution') : t('pc.showSolution')}</button>
      </div>
      {solution && <Solution p={p} />}
    </div>
  )
}
