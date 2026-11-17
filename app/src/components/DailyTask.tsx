import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { problemOfDay } from '../lib/bank'
import { todayKey, useStore } from '../lib/store'
import { ProblemCard } from './ProblemCard'

/** The same problem for everyone on a given day; +15 XP for solving it. */
export function DailyTask() {
  const { t } = useTranslation()
  const { daily, markDaily, recordAnswers } = useStore()
  const p = useMemo(() => problemOfDay(), [])
  const done = daily.includes(todayKey())
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <h2 style={{ margin: 0 }}>🎯 {t('daily.title')}</h2>
        <span className="muted small">{t('daily.count', { n: daily.length })}</span>
      </div>
      {done && <div className="answer">✓ {t('daily.done')}</div>}
      <ProblemCard p={p} onResult={(ok) => { if (ok) markDaily(15); else recordAnswers([{ key: `g:${p.gen}`, ok: false }]) }} />
    </div>
  )
}
