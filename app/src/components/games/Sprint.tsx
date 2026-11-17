import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sprintProblem } from '../../lib/games'
import { num, normalize } from '../../lib/mathcore'
import { Tex } from '../Tex'
import { useCountdown, type GameProps } from './common'

/** 60 seconds of mental arithmetic. */
export function Sprint({ level, onDone }: GameProps) {
  const { t } = useTranslation()
  const [p, setP] = useState(() => sprintProblem(level))
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [shake, setShake] = useState(false)
  const scoreRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const left = useCountdown(60, () =>
    onDone({ score: scoreRef.current, text: t('games.sprint.done', { n: scoreRef.current }), xp: Math.min(30, scoreRef.current) }),
  )

  const next = () => {
    setP(sprintProblem(level))
    setInput('')
    inputRef.current?.focus()
  }
  const submit = () => {
    if (!input.trim() || left === 0) return
    if (Math.abs(num(normalize(input)) - p.answer) < 1e-9) {
      scoreRef.current += 1
      setScore(scoreRef.current)
      next()
    } else {
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 400)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="game-stats">
        <span>{t('games.score')}: <b>{score}</b></span>
        <span className={left <= 10 ? 'timer low' : 'timer'}>⏱ {left}</span>
      </div>
      <div className="bar"><div style={{ width: `${(left / 60) * 100}%` }} /></div>
      <div className={`truth-card ${shake ? 'bad shake' : ''}`}>
        <Tex className="flash-tex" tex={p.tex.includes('?') ? p.tex : `${p.tex} = \\;?`} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit() }} style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          className="input"
          style={{ fontSize: 22, height: 56, textAlign: 'center' }}
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label={t('games.sprint.hint')}
        />
        <button type="submit" className="btn btn-primary" style={{ height: 56 }}>↵</button>
      </form>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="muted small">{t('games.sprint.hint')}</span>
        <button className="btn btn-sm" onClick={next}>{t('games.sprint.skip')}</button>
      </div>
    </div>
  )
}
