import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lang } from '../../i18n'
import { choices, gensFor, pickGens, type Problem } from '../../lib/bank'
import { useStore } from '../../lib/store'
import { Solution } from '../ProblemCard'
import { Tex } from '../Tex'
import type { GameProps } from './common'

const bosses = [
  { face: '👾', hp: 60 }, { face: '🐲', hp: 90 }, { face: '🤖', hp: 120 }, { face: '🦖', hp: 150 }, { face: '👹', hp: 200 },
]
const HEARTS = 3

/** Boss battle: every right answer hits the boss, a wrong one or a timeout costs a heart. */
export function Boss({ level, onDone }: GameProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { recordAnswers } = useStore()
  const pool = useMemo(() => gensFor({ level }), [level])
  const newProblem = () => pickGens(pool, 1)[0].make(Math.random)
  const limit = level === 'easy' ? 30 : level === 'medium' ? 45 : 60

  const [p, setP] = useState<Problem>(newProblem)
  const ch = useMemo(() => choices(p), [p])
  const [boss, setBoss] = useState(0)
  const [hp, setHp] = useState(bosses[0].hp)
  const [hearts, setHearts] = useState(HEARTS)
  const [picked, setPicked] = useState<number | null>(null)
  const [hit, setHit] = useState('')
  const [left, setLeft] = useState(limit)
  const [showSol, setShowSol] = useState(false)
  const right = useRef(0)
  const startedAt = useRef(Date.now())

  // per-question timer
  useEffect(() => {
    if (picked !== null) return
    startedAt.current = Date.now()
    setLeft(limit)
    const id = setInterval(() => {
      const rest = Math.max(0, limit - Math.floor((Date.now() - startedAt.current) / 1000))
      setLeft(rest)
      if (rest === 0) { clearInterval(id); answer(-1) }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, picked === null])

  const finish = (beaten: number) =>
    onDone({ score: right.current, text: t('games.boss.done', { n: right.current, b: beaten }), xp: Math.min(60, right.current * 4 + beaten * 5) })

  function answer(k: number) {
    if (picked !== null) return
    setPicked(k)
    const ok = k === ch.correct
    recordAnswers([{ key: `g:${p.gen}`, ok }])
    if (ok) {
      right.current += 1
      const dmg = 15 + Math.round((left / limit) * 15) // faster answer — stronger hit
      setHit(`−${dmg}`)
      setHp((h) => Math.max(0, h - dmg))
    } else {
      setHit('💥')
      setHearts((h) => h - 1)
    }
  }

  const next = () => {
    if (hearts <= 0) return finish(boss)
    if (hp <= 0) {
      if (boss + 1 >= bosses.length) return finish(boss + 1)
      setBoss(boss + 1)
      setHp(bosses[boss + 1].hp)
    }
    setP(newProblem())
    setPicked(null)
    setHit('')
    setShowSol(false)
  }

  const B = bosses[boss]
  const ok = picked !== null && picked === ch.correct
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="boss-arena">
        <div className="boss-hearts" aria-label={t('games.boss.lives', { n: hearts })}>
          {Array.from({ length: HEARTS }, (_, i) => <span key={i}>{i < hearts ? '❤️' : '🤍'}</span>)}
        </div>
        <div className={`boss-face ${hit && ok ? 'hurt' : ''} ${hit && !ok ? 'attack' : ''}`}>
          {hp <= 0 ? '💫' : B.face}
          {hit && <span className={`boss-hit ${ok ? '' : 'me'}`}>{hit}</span>}
        </div>
        <div className="boss-name">{t('games.boss.boss', { n: boss + 1, total: bosses.length })}</div>
        <div className="bar boss-hp"><div style={{ width: `${(hp / B.hp) * 100}%` }} /></div>
        <div className="muted small">{hp} / {B.hp} HP</div>
      </div>

      <div className="game-stats">
        <span>{t('games.boss.right')}: <b>{right.current}</b></span>
        {picked === null && <span className={left <= 10 ? 'timer low' : 'timer'}>⏱ {left}</span>}
      </div>

      <div className="card problem" style={{ display: 'grid', gap: 10 }}>
        <div className="problem-text">{p.text[lang]}</div>
        {p.tex && <div className="problem-tex"><Tex tex={p.tex} /></div>}
        <div className="work-options">
          {ch.options.map((o, k) => {
            const st = picked === null ? '' : k === ch.correct ? 'right' : k === picked ? 'wrong' : ''
            return (
              <button key={k} className={`option ${st}`} disabled={picked !== null} onClick={() => answer(k)}>
                <b className="opt-letter">{'ABCDE'[k]}</b> <Tex tex={o} />
              </button>
            )
          })}
        </div>
        {picked !== null && (
          <>
            <div className={ok ? 'answer' : 'answer wrong'}>
              {ok ? (hp <= 0 ? t('games.boss.defeated') : t('test.correct')) : picked === -1 ? t('games.boss.timeout') : t('pc.wrong')} {!ok && <Tex tex={p.answer} />}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={next}>
                {hearts <= 0 || (hp <= 0 && boss + 1 >= bosses.length) ? t('test.finish') : t('test.next')} →
              </button>
              {!ok && <button className="btn" onClick={() => setShowSol(!showSol)}>{showSol ? t('pc.hideSolution') : t('pc.showSolution')}</button>}
            </div>
            {showSol && <Solution p={p} />}
          </>
        )}
      </div>
    </div>
  )
}
