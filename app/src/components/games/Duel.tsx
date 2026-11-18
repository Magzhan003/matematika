import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { shuffle, sprintProblem } from '../../lib/games'
import { Tex } from '../Tex'
import type { GameProps } from './common'

const ROUNDS = 10
const KEYS = [['1', '2', '3', '4'], ['7', '8', '9', '0']] // keyboard: left player 1–4, right player 7–0

function round(level: GameProps['level']) {
  const p = sprintProblem(level)
  const set = new Set<number>([p.answer])
  for (const d of [1, -1, 2, 10, -10, 3, 5, -2]) {
    if (set.size >= 4) break
    set.add(p.answer + d)
  }
  const options = shuffle([...set])
  return { tex: p.tex.includes('?') ? p.tex : `${p.tex} = \\;?`, options, correct: options.indexOf(p.answer) }
}

/** Duel on one device: two players, one question; the first right answer wins the round. */
export function Duel({ level, onDone }: GameProps) {
  const { t } = useTranslation()
  const [i, setI] = useState(0)
  const [q, setQ] = useState(() => round(level))
  const [score, setScore] = useState([0, 0])
  const [locked, setLocked] = useState([false, false])
  const [winner, setWinner] = useState<number | null>(null)
  const scoreRef = useRef([0, 0])

  const next = () => {
    if (i + 1 >= ROUNDS) {
      const [a, b] = scoreRef.current
      const text = a === b ? t('games.duel.draw', { a, b }) : t('games.duel.won', { n: a > b ? 1 : 2, a, b })
      return onDone({ score: Math.max(a, b), text, xp: 10 })
    }
    setI(i + 1)
    setQ(round(level))
    setLocked([false, false])
    setWinner(null)
  }

  const press = (player: number, k: number) => {
    if (winner !== null || locked[player]) return
    if (k === q.correct) {
      const s = [...scoreRef.current]
      s[player] += 1
      scoreRef.current = s
      setScore(s)
      setWinner(player)
      setTimeout(next, 1200)
    } else {
      const l = [...locked]
      l[player] = true
      setLocked(l)
      if (l[0] && l[1]) { setWinner(-1); setTimeout(next, 1500) }
    }
  }

  // keyboard for a desktop / interactive board with a keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      for (const pl of [0, 1]) {
        const k = KEYS[pl].indexOf(e.key)
        if (k >= 0) press(pl, k)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const Side = ({ pl }: { pl: number }) => (
    <div className={`duel-side p${pl + 1} ${locked[pl] ? 'locked' : ''} ${winner === pl ? 'win' : ''}`}>
      <div className="duel-head">
        <b>{t('games.duel.player', { n: pl + 1 })}</b>
        <span className="duel-score">{score[pl]}</span>
      </div>
      <div className="duel-buttons">
        {q.options.map((o, k) => (
          <button key={k} className={`duel-btn ${winner !== null && k === q.correct ? 'right' : ''}`} onClick={() => press(pl, k)} disabled={locked[pl] || winner !== null}>
            <span className="duel-key">{KEYS[pl][k]}</span> {o}
          </button>
        ))}
      </div>
      {locked[pl] && winner === null && <div className="muted small">{t('games.duel.wait')}</div>}
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="game-stats">
        <span>{t('test.question', { n: i + 1, total: ROUNDS })}</span>
        <span className="muted small">{t('games.duel.keys')}</span>
      </div>
      <div className="truth-card"><Tex className="flash-tex" tex={q.tex} /></div>
      {winner !== null && (
        <div className="answer" style={{ textAlign: 'center' }}>
          {winner === -1 ? t('games.duel.nobody') : t('games.duel.point', { n: winner + 1 })}
        </div>
      )}
      <div className="duel">
        <Side pl={0} />
        <Side pl={1} />
      </div>
    </div>
  )
}
