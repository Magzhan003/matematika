import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { LevelBadge } from '../components/FormulaCard'
import { Icon } from '../components/Icon'
import type { Level } from '../data/formulas'
import { gameIds, levels, type GameId } from '../lib/games'
import { useStore } from '../lib/store'

const icons: Record<GameId, string> = {
  memory: 'puzzle', cards: 'book', truth: 'search', sprint: 'flame', balance: 'variable', graph: 'chart', line: 'star', boss: 'triangle',
}

export function Games() {
  const { t } = useTranslation()
  const { games } = useStore()
  const [params, setParams] = useSearchParams()
  const level = (levels as string[]).includes(params.get('level') ?? '') ? (params.get('level') as Level) : 'easy'

  return (
    <div className="page" style={{ display: 'grid', gap: 18 }}>
      <h1 style={{ margin: 0 }}>{t('games.title')}</h1>
      <p className="muted" style={{ margin: 0 }}>{t('games.intro')}</p>
      <div className="chips">
        {levels.map((l) => (
          <button key={l} className={`chip ${level === l ? 'on' : ''}`} onClick={() => setParams({ level: l }, { replace: true })}>
            {t(`level.${l}`)}
          </button>
        ))}
      </div>
      <div className="grid">
        {gameIds.map((g, i) => {
          const best = games[`${g}:${level}`]
          return (
            <Link key={g} to={`/game/${g}/${level}`} className={`tile ${i === 0 ? 'dark' : ''}`} style={{ gap: 10 }}>
              <span className="tile-icon"><Icon name={icons[g]} /></span>
              <strong style={{ fontSize: 19 }}>{t(`games.${g}.name`)}</strong>
              <span className="muted small">{t(`games.${g}.desc`)}</span>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                <span className="small">🏆 {best !== undefined ? t('games.best', { n: best }) : t('games.noBest')}</span>
                <LevelBadge level={level} />
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
