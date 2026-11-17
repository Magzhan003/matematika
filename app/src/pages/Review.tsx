import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ProblemCard } from '../components/ProblemCard'
import { Tex } from '../components/Tex'
import { formulaById } from '../data/formulas'
import type { Lang } from '../i18n'
import { genById } from '../lib/bank'
import { INTERVALS, todayKey, useStore } from '../lib/store'

/** Recall card for a formula: think, reveal, grade yourself. */
function FormulaRecall({ fid, onDone }: { fid: string; onDone: (ok: boolean) => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const f = formulaById(fid)
  const [shown, setShown] = useState(false)
  if (!f) return null
  return (
    <div className="card problem" style={{ display: 'grid', gap: 12, textAlign: 'center' }}>
      <div className="muted small">{t('rev.recall')}</div>
      <strong style={{ fontSize: 20 }}>{f.title[lang]}</strong>
      {shown ? (
        <>
          <div className="problem-tex"><Tex tex={f.tex} /></div>
          <span className="muted">{f.explain[lang]}</span>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn" onClick={() => onDone(false)}>↺ {t('rev.forgot')}</button>
            <button className="btn btn-primary" onClick={() => onDone(true)}>✓ {t('rev.remember')}</button>
          </div>
        </>
      ) : (
        <div><button className="btn btn-primary" onClick={() => setShown(true)}>{t('games.cards.flip')}</button></div>
      )}
    </div>
  )
}

export function Review() {
  const { t } = useTranslation()
  const { dueKeys, review, recordAnswers } = useStore()
  // freeze the list for this session so answering does not reshuffle it
  const [queue] = useState(() => [...dueKeys].sort(() => Math.random() - 0.5))
  const [idx, setIdx] = useState(0)
  const [ok, setOk] = useState(0)
  const [answered, setAnswered] = useState(false)
  const key = queue[idx]
  const problem = useMemo(() => (key?.startsWith('g:') ? genById(key.slice(2))?.make(Math.random) : undefined), [key])

  const upcoming = Object.values(review).filter((v) => v.due > todayKey()).length
  const done = (good: boolean) => {
    recordAnswers([{ key, ok: good }], true)
    if (good) setOk((n) => n + 1)
    setAnswered(true)
  }
  const next = () => { setAnswered(false); setIdx(idx + 1) }

  return (
    <div className="page" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>{t('rev.title')}</h1>
      <p className="muted" style={{ margin: 0 }}>{t('rev.intro', { list: INTERVALS.join(', ') })}</p>

      {!queue.length ? (
        <div className="space-panel" style={{ display: 'grid', gap: 10, justifyItems: 'start' }}>
          <strong style={{ fontSize: 20 }}>✓ {t('rev.nothing')}</strong>
          <span className="muted">{t('rev.upcoming', { n: upcoming })}</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" to="/ent">{t('nav.ent')}</Link>
            <Link className="btn" to="/lessons">{t('nav.lessons')}</Link>
          </div>
        </div>
      ) : idx >= queue.length ? (
        <div className="space-panel" style={{ display: 'grid', gap: 10, justifyItems: 'start' }}>
          <strong style={{ fontSize: 20 }}>{t('rev.finished', { ok, n: queue.length })}</strong>
          <span className="muted">{t('rev.comeBack')}</span>
          <Link className="btn btn-primary" to="/">{t('nav.home')}</Link>
        </div>
      ) : (
        <>
          <div className="game-stats"><span>{t('rev.progress', { i: idx + 1, n: queue.length })}</span><span>✓ {ok}</span></div>
          <div className="bar"><div style={{ width: `${(idx / queue.length) * 100}%` }} /></div>
          {key.startsWith('f:') ? (
            <FormulaRecall key={key} fid={key.slice(2)} onDone={(g) => { done(g); next() }} />
          ) : problem ? (
            <ProblemCard key={key + idx} p={problem} onResult={done} />
          ) : (
            <button className="btn" onClick={next}>{t('test.next')}</button>
          )}
          {answered && key.startsWith('g:') && <div><button className="btn btn-primary" onClick={next}>{t('test.next')} →</button></div>}
        </>
      )}
    </div>
  )
}
