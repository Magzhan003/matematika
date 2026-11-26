import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { formulas } from '../data/formulas'
import type { Lang } from '../i18n'
import { focusTopics } from '../lib/mastery'
import { todayKey, useStore } from '../lib/store'

/** Personal plan for today: built from the diagnostic test, answers and lessons. */
export function MyPlan() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const store = useStore()
  const { diag, stats, dueKeys, daily, lessonsDone } = store
  const known = diag || Object.keys(stats).length >= 10

  if (!known) {
    return (
      <Link to="/diagnostic" className="tile dark" style={{ display: 'grid', gap: 6 }}>
        <span className="plan-icon"><Icon name="compass" size={24} /></span>
        <strong style={{ fontSize: 19 }}>{t('plan.startTitle')}</strong>
        <span className="muted small">{t('plan.startDesc')}</span>
      </Link>
    )
  }

  const focus = focusTopics(store, diag?.grade, 3)
  const main = focus[0]
  const lesson = main && formulas
    .filter((f) => f.topic === main.topic.id && !lessonsDone.includes(f.id))
    .sort((a, b) => a.grade - b.grade)[0]
  const items: { done: boolean; to: string; text: string; min: number }[] = []
  if (dueKeys.length) items.push({ done: false, to: '/review', text: t('plan.review', { n: dueKeys.length }), min: 5 })
  if (lesson) items.push({ done: false, to: `/lesson/${lesson.id}`, text: t('plan.lesson', { title: lesson.title[lang] }), min: 7 })
  if (main) items.push({ done: false, to: `/practice/${main.topic.id}`, text: t('plan.practice', { topic: main.topic.title[lang] }), min: 5 })
  items.push({ done: daily.includes(todayKey()), to: '/#daily', text: t('plan.daily'), min: 2 })
  const minutes = items.filter((x) => !x.done).reduce((a, b) => a + b.min, 0)

  return (
    <div className="card plan" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <h2 style={{ margin: 0 }}>🗓 {t('plan.title')}</h2>
        <span className="muted small">{t('plan.minutes', { n: minutes })}</span>
      </div>
      <ol className="plan-list">
        {items.map((it, k) => (
          <li key={k} className={it.done ? 'done' : ''}>
            {it.to.startsWith('/#') ? <a href={`#${it.to.slice(2)}`} onClick={(e) => { e.preventDefault(); document.getElementById(it.to.slice(2))?.scrollIntoView({ behavior: 'smooth' }) }}>{it.text}</a>
              : <Link to={it.to}>{it.text}</Link>}
            {it.done && <span> ✓</span>}
          </li>
        ))}
      </ol>
      {focus.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          <span className="muted small">{t('plan.focus')}</span>
          <div className="chips">
            {focus.map((m) => (
              <Link key={m.topic.id} className="chip" to={`/practice/${m.topic.id}`}>
                {m.topic.title[lang]} · {m.value === null ? '?' : `${Math.round(m.value * 100)}%`}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} className="small">
        <Link to="/map">🗺 {t('plan.map')}</Link>
        <Link to="/diagnostic">{t('plan.again')}</Link>
      </div>
    </div>
  )
}
