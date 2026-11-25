import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LevelBadge } from '../components/FormulaCard'
import { curriculum, currentQuarter } from '../data/curriculum'
import { formulas } from '../data/formulas'
import { topicById } from '../data/topics'
import type { Lang } from '../i18n'
import { gens } from '../lib/bank'
import { masteryOf } from '../lib/mastery'
import { useRole } from '../lib/role'
import { useStore } from '../lib/store'

/** School program by grade and quarter: today's lessons for a student or a teacher. */
export function Program() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const store = useStore()
  const { role } = useRole()
  const [grade, setGrade] = useState(store.diag?.grade ?? 7)
  const [q, setQ] = useState<number>(currentQuarter())
  const ids = curriculum[grade][q - 1]

  return (
    <div className="page" style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0 }}>{t('prog.title')}</h1>
      <p className="muted" style={{ margin: 0 }}>{t('prog.intro')}</p>
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="chips">
          {[5, 6, 7, 8, 9, 10, 11].map((g) => (
            <button key={g} className={`chip ${grade === g ? 'on' : ''}`} onClick={() => setGrade(g)}>{t('grade.n', { n: g })}</button>
          ))}
        </div>
        <div className="chips">
          {[1, 2, 3, 4].map((x) => (
            <button key={x} className={`chip ${q === x ? 'on' : ''}`} onClick={() => setQ(x)}>
              {t('prog.quarter', { n: x })}{x === currentQuarter() ? ` · ${t('prog.now')}` : ''}
            </button>
          ))}
        </div>
      </div>

      {ids.map((id) => {
        const tp = topicById(id)
        if (!tp) return null
        const list = formulas.filter((f) => f.topic === id && f.grade <= grade).sort((a, b) => a.grade - b.grade)
        const m = masteryOf(tp, store)
        const hasTasks = gens.some((g) => g.topic === id)
        return (
          <section key={id} className="card prog-topic" style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{tp.title[lang]}</h2>
              <span className={`map-status st-${m.status}`}>{t(`map.status.${m.status}`)}{m.value !== null ? ` · ${Math.round(m.value * 100)}%` : ''}</span>
            </div>
            {list.length > 0 ? (
              <ol className="prog-lessons">
                {list.map((f) => (
                  <li key={f.id}>
                    <Link to={`/lesson/${f.id}`}>{store.lessonsDone.includes(f.id) ? '✓ ' : ''}{f.title[lang]}</Link>
                    {' '}<LevelBadge level={f.level} />
                    {f.grade < grade && <span className="muted small"> · {t('prog.repeat', { n: f.grade })}</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted" style={{ margin: 0 }}>{t('prog.onlyTasks')}</p>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {hasTasks && <Link className="btn btn-sm btn-primary" to={`/practice/${id}`}>💪 {t('map.train')}</Link>}
              {hasTasks && role === 'teacher' && <Link className="btn btn-sm" to={`/teacher?topics=${id}`}>🖨 {t('prog.makeTest')}</Link>}
            </div>
          </section>
        )
      })}
      {role === 'teacher' && ids.some((id) => gens.some((g) => g.topic === id)) && (
        <div><Link className="btn" to={`/teacher?topics=${ids.filter((id) => gens.some((g) => g.topic === id)).join(',')}`}>🖨 {t('prog.quarterTest')}</Link></div>
      )}
      <p className="muted small" style={{ margin: 0 }}>{t('prog.note')}</p>
    </div>
  )
}
