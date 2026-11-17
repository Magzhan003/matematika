import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formulaById } from '../../data/formulas'
import type { Lang } from '../../i18n'
import { truthQuestion } from '../../lib/games'
import { Tex } from '../Tex'
import { useCountdown, type GameProps } from './common'

/** 60 seconds: is the formula right, or was a sign / power / number changed? */
export function TruthOrError({ level, onDone }: GameProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const [q, setQ] = useState(() => truthQuestion(level))
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<{ ok: boolean; correctTex?: string } | null>(null)
  const scoreRef = useRef(0)
  const ended = useRef(false)

  const left = useCountdown(60, () => {
    ended.current = true
    onDone({ score: scoreRef.current, text: t('games.truth.done', { n: scoreRef.current }), xp: Math.min(30, scoreRef.current) })
  })

  const answer = useCallback((saysTrue: boolean) => {
    if (ended.current || flash) return
    const ok = saysTrue === q.isTrue
    if (ok) {
      scoreRef.current += 1
      setScore(scoreRef.current)
    }
    setFlash({ ok, correctTex: q.isTrue ? undefined : q.correctTex })
    setTimeout(() => {
      setFlash(null)
      setQ((prev) => truthQuestion(level, prev.fid))
    }, ok ? 450 : 1600)
  }, [q, flash, level])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') answer(true)
      if (e.key === 'ArrowRight') answer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer])

  const title = formulaById(q.fid)?.title[lang] ?? ''

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="game-stats">
        <span>{t('games.score')}: <b>{score}</b></span>
        <span className={left <= 10 ? 'timer low' : 'timer'}>⏱ {left}</span>
      </div>
      <div className="bar"><div style={{ width: `${(left / 60) * 100}%` }} /></div>
      <div className={`truth-card ${flash ? (flash.ok ? 'ok' : 'bad') : ''}`}>
        <span className="muted">{title}</span>
        <Tex className="flash-tex" tex={q.tex} />
        {flash && !flash.ok && flash.correctTex && (
          <span className="small">{t('games.truth.was')} <Tex tex={flash.correctTex} /></span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn truth-yes" style={{ flex: 1, justifyContent: 'center', height: 56 }} onClick={() => answer(true)}>← ✓ {t('games.truth.right')}</button>
        <button className="btn truth-no" style={{ flex: 1, justifyContent: 'center', height: 56 }} onClick={() => answer(false)}>✗ {t('games.truth.wrong')} →</button>
      </div>
      <span className="muted small">{t('games.truth.keys')}</span>
    </div>
  )
}
