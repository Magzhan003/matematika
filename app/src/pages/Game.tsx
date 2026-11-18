import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router-dom'
import { LevelBadge } from '../components/FormulaCard'
import { Balance } from '../components/games/Balance'
import { Boss } from '../components/games/Boss'
import { Duel } from '../components/games/Duel'
import { Flashcards } from '../components/games/Flashcards'
import { GraphGuess } from '../components/games/GraphGuess'
import { Sniper } from '../components/games/Sniper'
import { Memory } from '../components/games/Memory'
import { Sprint } from '../components/games/Sprint'
import { TruthOrError } from '../components/games/TruthOrError'
import type { GameProps, GameResult } from '../components/games/common'
import type { Level } from '../data/formulas'
import { gameIds, levels, lowerIsBetter, type GameId } from '../lib/games'
import { useStore } from '../lib/store'

const components: Record<GameId, (p: GameProps) => React.ReactNode> = {
  memory: Memory, cards: Flashcards, truth: TruthOrError, sprint: Sprint,
  balance: Balance, graph: GraphGuess, line: Sniper, boss: Boss, duel: Duel,
}

export function Game() {
  const { id, level } = useParams()
  if (!gameIds.includes(id as GameId) || !levels.includes(level as Level)) return <Navigate to="/games" replace />
  return <GameView key={`${id}/${level}`} id={id as GameId} level={level as Level} />
}

function GameView({ id, level }: { id: GameId; level: Level }) {
  const { t } = useTranslation()
  const { games, saveGame } = useStore()
  const key = `${id}:${level}`
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<(GameResult & { record: boolean }) | null>(null)

  const onDone = useCallback((r: GameResult) => {
    const prev = games[key]
    const record = prev === undefined || (lowerIsBetter[id] ? r.score < prev : r.score > prev)
    saveGame(key, r.score, lowerIsBetter[id], r.xp)
    setResult({ ...r, record })
  }, [games, key, id, saveGame])

  const Play = components[id]
  const back = <Link className="btn" to={`/games?level=${level}`}>{t('games.back')}</Link>

  return (
    <div className="page" style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
      <div>
        <Link to={`/games?level=${level}`} className="muted small">← {t('games.back')}</Link>
        <h1 style={{ margin: '4px 0 0', fontSize: 24, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {t(`games.${id}.name`)} <LevelBadge level={level} />
        </h1>
      </div>

      {result ? (
        <div className="space-panel" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
          {result.record && <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 20 }}>🏆 {t('games.newRecord')}</span>}
          <h2 style={{ margin: 0 }}>{result.text}</h2>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{t('lessons.xp', { n: result.xp })}</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => { setResult(null); setRound((r) => r + 1) }}>{t('games.again')}</button>
            {back}
          </div>
        </div>
      ) : (
        <Play key={round} level={level} onDone={onDone} />
      )}
    </div>
  )
}
