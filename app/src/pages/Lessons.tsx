import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LevelBadge } from '../components/FormulaCard'
import { formulas, sections, type Level, type Section } from '../data/formulas'
import { lessons } from '../data/lessons'
import type { Lang } from '../i18n'
import { PASS_PERCENT, poolFor, testKey } from '../lib/quiz'
import { useStore } from '../lib/store'
import { sectionSymbol } from './Formulas'
import { isUnlocked } from './Test'

const levels: Level[] = ['easy', 'medium', 'hard']

export function Lessons() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { lessonsDone, tests } = useStore()
  const [scope, setScope] = useState<Section | 'all'>('all')
  const template = t('lessons.template', { returnObjects: true }) as string[]

  return (
    <div className="page" style={{ display: 'grid', gap: 18 }}>
      <h1 style={{ margin: 0 }}>{t('lessons.title')}</h1>

      <div className="space-panel" style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t('test.tests')}</h2>
        <select className="input" style={{ width: '100%', background: 'var(--space-2)', color: 'var(--space-ink)', borderColor: 'var(--space-2)' }}
          value={scope} onChange={(e) => setScope(e.target.value as Section | 'all')} aria-label={t('test.scope')}>
          <option value="all">{t('test.all')}</option>
          {sections.map((s) => <option key={s} value={s}>{t(`section.${s}`)}</option>)}
        </select>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))' }}>
          {levels.map((l) => {
            const open = isUnlocked(tests, scope, l)
            const best = tests[testKey(scope, l)]
            const empty = !poolFor(scope, l).length
            return (
              <Link
                key={l}
                to={`/test/${scope}/${l}`}
                className={`tile ${open && !empty ? '' : 'lock'}`}
                style={{ gap: 6 }}
                onClick={(e) => { if (!open || empty) e.preventDefault() }}
                aria-disabled={!open || empty}
              >
                <span><LevelBadge level={l} /></span>
                <span className="small">
                  {empty ? t('test.empty') : open ? (best !== undefined ? t('test.best', { p: best }) : t('test.start')) : `🔒 ${t('test.locked', { p: PASS_PERCENT })}`}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="card card-dashed">
        <p style={{ marginTop: 0 }}>{t('lessons.intro')}</p>
        <div className="chips">
          {template.map((s, i) => (
            <span key={s} className="badge badge-line"><b style={{ color: 'var(--accent)' }}>{i + 1}</b> {s}</span>
          ))}
        </div>
      </div>

      {sections.map((s) => {
        const items = formulas.filter((f) => f.section === s)
        if (!items.length) return null
        const sorted = [...items].sort((a, b) => Number(Boolean(lessons[b.id])) - Number(Boolean(lessons[a.id])))
        const doneCount = items.filter((f) => lessonsDone.includes(f.id)).length
        const fullCount = items.filter((f) => lessons[f.id]).length
        return (
          <details key={s} className="section-block">
            <summary>
              <span className="tile-icon section-icon">{sectionSymbol[s]}</span>
              <span style={{ flex: 1 }}>{t(`section.${s}`)}</span>
              <span className="muted small" style={{ fontWeight: 400 }}>
                {fullCount > 0 && `★ ${fullCount} · `}✓ {doneCount}/{items.length}
              </span>
            </summary>
            <div className="grid">
              {sorted.map((f) => {
                const full = Boolean(lessons[f.id])
                const done = lessonsDone.includes(f.id)
                return (
                  <Link key={f.id} to={`/lesson/${f.id}`} className={`tile ${full ? 'dark' : ''}`} style={{ gap: 8 }}>
                    <strong>{done && '✓ '}{f.title[lang]}</strong>
                    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="badge badge-line">{t('grade.n', { n: f.grade })}</span>
                      <LevelBadge level={f.level} />
                    </span>
                    <span className="small muted">{full ? `★ ${t('lessons.full')}` : t('lessons.quick')}</span>
                  </Link>
                )
              })}
            </div>
          </details>
        )
      })}
    </div>
  )
}
