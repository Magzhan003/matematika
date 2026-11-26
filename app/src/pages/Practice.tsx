import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { LevelBadge } from '../components/FormulaCard'
import { ProblemCard } from '../components/ProblemCard'
import { formulas, type Level } from '../data/formulas'
import { topicById } from '../data/topics'
import type { Lang } from '../i18n'
import { gens, gensFor } from '../lib/bank'
import { masteryOf, prereqs } from '../lib/mastery'
import { useStore } from '../lib/store'

const rank: Record<Level, number> = { easy: 0, medium: 1, hard: 2 }

/** Topic training: 5 problems whose difficulty follows how well the topic is known. */
export function Practice() {
  const { topic = '' } = useParams()
  return <PracticeView key={topic} id={topic} />
}

function PracticeView({ id }: { id: string }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const store = useStore()
  const { recordAnswers, addSolved, lessonsDone } = store
  const tp = topicById(id)
  const [round, setRound] = useState(0)
  const m = tp ? masteryOf(tp, store) : null

  const set = useMemo(() => {
    if (!tp) return []
    const own = gens.filter((g) => g.topic === id)
    const pool = own.length ? own : gensFor({ sections: [tp.section] })
    // weaker topic -> easier tasks first
    const v = m?.value ?? 0.4
    const levels: Level[] = v < 0.5 ? ['easy', 'easy', 'easy', 'medium', 'medium'] : v < 0.8 ? ['easy', 'medium', 'medium', 'medium', 'hard'] : ['medium', 'medium', 'hard', 'hard', 'hard']
    return levels.map((lv) => {
      const fit = pool.filter((g) => g.level === lv)
      const near = fit.length ? fit : [...pool].sort((a, b) => Math.abs(rank[a.level] - rank[lv]) - Math.abs(rank[b.level] - rank[lv])).slice(0, 3)
      return near[Math.floor(Math.random() * near.length)].make(Math.random)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, round])

  if (!tp) return <div className="page"><p>{t('lessons.notFound')}</p></div>
  const lessons = formulas.filter((f) => f.topic === id).sort((a, b) => a.grade - b.grade)
  const pre = (prereqs[id] ?? []).map((p) => topicById(p)).filter(Boolean).map((p) => masteryOf(p!, store))

  return (
    <div className="page" style={{ display: 'grid', gap: 14, maxWidth: 820 }}>
      <div>
        <Link to="/map" className="muted small">← {t('map.title')}</Link>
        <h1 style={{ margin: '4px 0 0', fontSize: 24 }}>{tp.title[lang]}</h1>
      </div>
      {m && (
        <div className="card" style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>{t(`map.status.${m.status}`)}</span>
            <b>{m.value === null ? '—' : `${Math.round(m.value * 100)}%`}</b>
          </div>
          <div className="bar"><div style={{ width: `${(m.value ?? 0) * 100}%` }} /></div>
          <span className="muted small">{t('map.details', { a: m.answered, l: m.lessons, lt: m.lessonsTotal })}</span>
        </div>
      )}
      {pre.some((x) => x.status === 'weak') && (
        <div className="hint-box">
          ⚠️ {t('pr.preWeak')}{' '}
          {pre.filter((x) => x.status === 'weak').map((x) => <Link key={x.topic.id} to={`/practice/${x.topic.id}`}>{x.topic.title[lang]} </Link>)}
        </div>
      )}
      <p className="muted" style={{ margin: 0 }}>{t('pr.intro')}</p>
      {set.map((p, i) => (
        <div key={`${round}-${i}`} style={{ display: 'grid', gap: 6 }}>
          <div className="muted small">{t('ls.task', { n: i + 1 })} · <LevelBadge level={p.level} /></div>
          <ProblemCard p={p} onResult={(ok) => { recordAnswers([{ key: `g:${p.gen}`, ok }]); if (ok) addSolved() }} />
        </div>
      ))}
      <div><button className="btn" onClick={() => setRound(round + 1)}>🎲 {t('ls.morePractice')}</button></div>
      {lessons.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 8px' }}>{t('pr.lessons')}</h3>
          <div className="chips">
            {lessons.map((f) => (
              <Link key={f.id} className="chip" to={`/lesson/${f.id}`}>{lessonsDone.includes(f.id) ? '✓ ' : ''}{f.title[lang]}</Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
