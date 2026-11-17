import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formulaById } from '../../data/formulas'
import type { Lang } from '../../i18n'
import { formulaPool } from '../../lib/games'
import { LevelBadge } from '../FormulaCard'
import { Tex } from '../Tex'
import type { GameProps } from './common'

/** Recall the formula by its name; "repeat" cards go back to the end of the deck. */
export function Flashcards({ level, onDone }: GameProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const initial = useMemo(() => formulaPool(level).slice(0, 10).map((f) => f.id), [level])
  const [deck, setDeck] = useState(initial)
  const [flipped, setFlipped] = useState(false)
  const [repeated, setRepeated] = useState<string[]>([])

  const f = formulaById(deck[0])!

  const know = () => {
    const rest = deck.slice(1)
    setFlipped(false)
    if (!rest.length) {
      const first = initial.length - repeated.length
      onDone({ score: first, text: t('games.cards.done', { n: first, total: initial.length }), xp: 10 + first })
      return
    }
    setDeck(rest)
  }
  const repeat = () => {
    setFlipped(false)
    if (!repeated.includes(f.id)) setRepeated([...repeated, f.id])
    setDeck([...deck.slice(1), f.id])
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="game-stats">
        <span>{t('games.cards.left', { n: deck.length })}</span>
        <LevelBadge level={f.level} />
      </div>
      <button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} key={f.id + flipped}>
        <strong style={{ fontSize: 20 }}>{f.title[lang]}</strong>
        {flipped ? (
          <>
            <Tex className="flash-tex" tex={f.tex} />
            <span className="muted">{f.explain[lang]}</span>
          </>
        ) : (
          <span className="muted">{t('games.cards.recall')} · {t('games.cards.flip')} ↻</span>
        )}
      </button>
      {flipped ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={repeat}>↺ {t('games.cards.repeat')}</button>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={know}>✓ {t('games.cards.know')}</button>
        </div>
      ) : (
        <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setFlipped(true)}>{t('games.cards.flip')}</button>
      )}
    </div>
  )
}
