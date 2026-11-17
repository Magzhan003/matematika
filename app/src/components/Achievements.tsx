import { useTranslation } from 'react-i18next'
import { useStore } from '../lib/store'

type A = { id: string; icon: string; got: boolean; progress: string }

/** Badges computed from the saved progress. */
export function Achievements() {
  const { t } = useTranslation()
  const s = useStore()
  const best = s.ent.reduce((m, e) => Math.max(m, Math.round((e.score / e.total) * 100)), 0)
  const passed = Object.values(s.tests).filter((p) => p >= 70).length
  const list: A[] = [
    { id: 'first', icon: '🌱', got: s.solved >= 1, progress: `${Math.min(s.solved, 1)}/1` },
    { id: 'solver', icon: '🧮', got: s.solved >= 50, progress: `${Math.min(s.solved, 50)}/50` },
    { id: 'lessons', icon: '📘', got: s.lessonsDone.length >= 10, progress: `${Math.min(s.lessonsDone.length, 10)}/10` },
    { id: 'formulas', icon: '📚', got: s.viewed.length >= 50, progress: `${Math.min(s.viewed.length, 50)}/50` },
    { id: 'streak', icon: '🔥', got: s.streak >= 7, progress: `${Math.min(s.streak, 7)}/7` },
    { id: 'daily', icon: '🎯', got: s.daily.length >= 7, progress: `${Math.min(s.daily.length, 7)}/7` },
    { id: 'tests', icon: '🏅', got: passed >= 3, progress: `${Math.min(passed, 3)}/3` },
    { id: 'ent', icon: '🎓', got: s.ent.length >= 1, progress: `${Math.min(s.ent.length, 1)}/1` },
    { id: 'ent80', icon: '🏆', got: best >= 80, progress: `${best}%/80%` },
    { id: 'games', icon: '🎮', got: Object.keys(s.games).length >= 4, progress: `${Math.min(Object.keys(s.games).length, 4)}/4` },
  ]
  const got = list.filter((a) => a.got).length
  return (
    <div className="card" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{t('ach.title')}</h2>
        <span className="muted">{got}/{list.length}</span>
      </div>
      <div className="ach-grid">
        {list.map((a) => (
          <div key={a.id} className={`ach ${a.got ? 'got' : ''}`} title={t(`ach.${a.id}.desc`)}>
            <span className="ach-icon">{a.icon}</span>
            <strong>{t(`ach.${a.id}.name`)}</strong>
            <span className="muted small">{t(`ach.${a.id}.desc`)}</span>
            <span className="small">{a.got ? '✓' : a.progress}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
