import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { MistakeHint } from '../components/MistakeHint'
import { ProblemVisual } from '../components/ProblemVisual'
import { Solution } from '../components/ProblemCard'
import { Tex } from '../components/Tex'
import type { Lang } from '../i18n'
import { checkTyped, choices, type Problem } from '../lib/bank'
import { useStore } from '../lib/store'
import { decodeWork, encodeResult, variantProblems, type Work as W } from '../lib/workcode'

type Answer = { text: string; pick: number | null }

/** Student side of a class work: enter the teacher's code, solve your variant, get a result code. */
export function Work() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const [code, setCode] = useState(params.get('c') ?? '')
  const [name, setName] = useState('')
  const [variant, setVariant] = useState(0)
  const [error, setError] = useState('')
  const [work, setWork] = useState<W | null>(null)

  if (work) return <Solve work={work} variant={variant} name={name.trim()} onExit={() => setWork(null)} />

  const start = (e: React.FormEvent) => {
    e.preventDefault()
    const w = decodeWork(code)
    if (!w) return setError(t('work.badCode'))
    if (!name.trim()) return setError(t('work.needName'))
    setError('')
    setWork(w)
  }

  return (
    <div className="page" style={{ display: 'grid', gap: 14, maxWidth: 640 }}>
      <h1 style={{ margin: 0 }}>{t('work.title')}</h1>
      <p className="muted" style={{ margin: 0 }}>{t('work.intro')}</p>
      <form className="card" style={{ display: 'grid', gap: 12 }} onSubmit={start}>
        <label className="field">
          <span className="muted small">{t('work.code')}</span>
          <input className="input code-input" value={code} placeholder="WABC-D123-…" autoCapitalize="characters" onChange={(e) => { setCode(e.target.value); setError('') }} />
        </label>
        <label className="field">
          <span className="muted small">{t('work.name')}</span>
          <input className="input" value={name} onChange={(e) => { setName(e.target.value); setError('') }} />
        </label>
        <div className="field">
          <span className="muted small">{t('work.variant')}</span>
          <div className="chips">
            {[0, 1, 2, 3].map((v) => (
              <button type="button" key={v} className={`chip ${variant === v ? 'on' : ''}`} onClick={() => setVariant(v)}>{t('teach.variant', { n: v + 1 })}</button>
            ))}
          </div>
        </div>
        {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
        <div><button className="btn btn-primary" type="submit">{t('work.start')}</button></div>
      </form>
    </div>
  )
}

/** Solving a work. With `send` (online mode) the result goes straight to the teacher instead of a result code. */
export function Solve({ work, variant, name, onExit, send }: { work: W; variant: number; name: string; onExit: () => void; send?: (ok: boolean[], minutes: number) => Promise<void> }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { recordAnswers } = useStore()
  const problems = useMemo(() => variantProblems(work, variant), [work, variant])
  const opts = useMemo(() => problems.map((p) => choices(p)), [problems])
  const [answers, setAnswers] = useState<Answer[]>(() => problems.map(() => ({ text: '', pick: null })))
  const [result, setResult] = useState<{ ok: boolean[]; code: string; minutes: number } | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const started = useRef(Date.now())
  const typed = (p: Problem) => Boolean(p.values?.length)

  const set = (i: number, a: Partial<Answer>) => setAnswers(answers.map((x, k) => (k === i ? { ...x, ...a } : x)))
  const blank = answers.filter((a, i) => (typed(problems[i]) ? !a.text.trim() : a.pick === null)).length

  const [sent, setSent] = useState<'' | 'busy' | 'ok' | 'error'>('')
  const trySend = async (ok: boolean[], minutes: number) => {
    if (!send) return
    setSent('busy')
    try { await send(ok, minutes); setSent('ok') } catch { setSent('error') }
  }
  const submit = () => {
    if (blank && !window.confirm(t('ent.confirmFinish', { n: blank }))) return
    const ok = problems.map((p, i) => (typed(p) ? checkTyped(p, answers[i].text) === true : answers[i].pick === opts[i].correct))
    const minutes = Math.max(1, Math.round((Date.now() - started.current) / 60000))
    recordAnswers(problems.map((p, i) => ({ key: `g:${p.gen}`, ok: ok[i] })))
    setResult({ ok, minutes, code: encodeResult({ seed: work.seed, variant, ok, minutes }) })
    trySend(ok, minutes)
    window.scrollTo({ top: 0 })
  }

  const score = result?.ok.filter(Boolean).length ?? 0
  const message = `${name} — ${result?.code}`

  return (
    <div className="page" style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>{t('work.title')} · {t('teach.variant', { n: variant + 1 })}</h1>
          <span className="muted">{name}</span>
        </div>
        {!result && <span className="muted small">{t('ent.answered', { a: problems.length - blank, n: problems.length })}</span>}
      </div>

      {result && (
        <div className="space-panel" style={{ display: 'grid', gap: 10 }}>
          <h2 style={{ margin: 0 }}>{t('work.score', { s: score, n: problems.length, p: Math.round((score / problems.length) * 100) })}</h2>
          {send ? (
            <>
              {sent === 'busy' && <div>⏳ {t('cl.sending')}</div>}
              {sent === 'ok' && <div><b>✓ {t('cl.sent')}</b></div>}
              {sent === 'error' && <div className="login-err">⚠️ {t('cl.sendFailed')} <button className="btn btn-sm" onClick={() => trySend(result.ok, result.minutes)}>{t('cl.retry')}</button></div>}
              <div><button className="btn" onClick={onExit}>{t('cl.toTasks')}</button></div>
            </>
          ) : (
            <>
              <div>{t('work.sendCode')}</div>
              <div className="result-code">{result.code}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => { navigator.clipboard?.writeText(message).then(() => setCopied(true)).catch(() => {}) }}>
                  {copied ? `✓ ${t('work.copied')}` : `📋 ${t('work.copy')}`}
                </button>
                <button className="btn" onClick={onExit}>{t('work.another')}</button>
              </div>
            </>
          )}
          <div className="muted small">{t('work.reviewNote')}</div>
        </div>
      )}

      <ol className="work-list">
        {problems.map((p, i) => {
          const state = result ? (result.ok[i] ? 'ok' : 'bad') : ''
          return (
            <li key={i} className={`card work-item ent-item ${state}`}>
              <div className="problem-text">{p.text[lang]}</div>
              {p.tex && <div className="problem-tex"><Tex tex={p.tex} /></div>}
              <ProblemVisual p={p} />
              {typed(p) ? (
                <input className="input" value={answers[i].text} disabled={!!result} placeholder={t('pc.placeholder')}
                  onChange={(e) => set(i, { text: e.target.value })} aria-label={`${t('pc.placeholder')} ${i + 1}`} />
              ) : (
                <div className="work-options">
                  {opts[i].options.map((o, k) => {
                    const st = result ? (k === opts[i].correct ? 'right' : k === answers[i].pick ? 'wrong' : '') : answers[i].pick === k ? 'picked' : ''
                    return (
                      <button key={k} className={`option ${st}`} disabled={!!result} onClick={() => set(i, { pick: k })}>
                        <b className="opt-letter">{'ABCDE'[k]}</b> <Tex tex={o} />
                      </button>
                    )
                  })}
                </div>
              )}
              {result && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div className={result.ok[i] ? 'answer' : 'answer wrong'}>
                    {result.ok[i] ? t('test.correct') : t('pc.wrong')} {!result.ok[i] && <Tex tex={p.answer} />}
                  </div>
                  {!result.ok[i] && <MistakeHint p={p} typed={typed(p) ? answers[i].text : undefined} picked={!typed(p) && answers[i].pick !== null ? opts[i].options[answers[i].pick!] : undefined} />}
                  <div><button className="btn btn-sm" onClick={() => setOpen(open === i ? null : i)}>{open === i ? t('pc.hideSolution') : t('pc.showSolution')}</button></div>
                  {open === i && <Solution p={p} />}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {!result && <div><button className="btn btn-primary" onClick={submit}>{t('work.submit')}</button></div>}
    </div>
  )
}
