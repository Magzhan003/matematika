import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { FormulaCard, LevelBadge } from '../components/FormulaCard'
import { formulas, grades, type Branch, type Formula, type Level } from '../data/formulas'
import { geometrySections, sections, topicById, topics, type Section } from '../data/topics'
import type { Lang } from '../i18n'
import { useStore } from '../lib/store'

const levels: Level[] = ['easy', 'medium', 'hard']

/** A short symbol for every section tile. */
export const sectionSymbol: Record<Section, string> = {
  arithmetic: '½', algebra: 'x²', functions: 'ƒ', progressions: 'aₙ', trigonometry: 'sin', logarithms: 'log',
  calculus: '∫', combinatorics: 'n!', planimetry: '△', coordinates: '→', stereometry: '⬡',
}

const gradeRange = (list: Formula[]) => {
  const gs = list.map((f) => f.grade)
  return [Math.min(...gs), Math.max(...gs)]
}

export function Formulas() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { viewed } = useStore()
  const [params, setParams] = useSearchParams()
  const section = (sections as string[]).includes(params.get('s') ?? '') ? (params.get('s') as Section) : null
  const topic = topicById(params.get('t') ?? '') ?? null
  const branch = (params.get('branch') as Branch | null) ?? null
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<Level | null>(null)
  const [grade, setGrade] = useState<number | null>(null)
  const [openId, setOpenId] = useState<string | null>(params.get('open'))

  // When opened from the "formula of the day" link, scroll to that card once.
  useEffect(() => {
    const id = params.get('open')
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const go = (next: Record<string, string>) => {
    setOpenId(null)
    setParams(next)
    window.scrollTo({ top: 0 })
  }

  /** Formulas that pass the level / grade filters. */
  const filtered = useMemo(
    () => formulas.filter((f) => (!level || f.level === level) && (!grade || f.grade === grade)),
    [level, grade],
  )

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return filtered.filter((f) =>
      [f.id, f.title.ru, f.title.kz, f.explain.ru, f.explain.kz, t(`section.${f.section}`), topicById(f.topic!)?.title[lang] ?? '']
        .join(' ').toLowerCase().includes(q),
    )
  }, [query, filtered, t, lang])

  const card = (f: Formula) => (
    <FormulaCard key={f.id} f={f} open={openId === f.id} onToggle={() => setOpenId(openId === f.id ? null : f.id)} />
  )

  const crumbs = (
    <nav className="crumbs" aria-label="breadcrumbs">
      <button onClick={() => go({})}>{t('formulas.title')}</button>
      {section && (
        <>
          <span>›</span>
          <button onClick={() => go({ s: section })} disabled={!topic}>{t(`section.${section}`)}</button>
        </>
      )}
      {topic && (
        <>
          <span>›</span>
          <b>{topic.title[lang]}</b>
        </>
      )}
    </nav>
  )

  let body: React.ReactNode
  if (searchHits) {
    body = searchHits.length ? <div className="f-list">{searchHits.map(card)}</div> : <p className="muted">{t('formulas.empty')}</p>
  } else if (topic) {
    const items = filtered.filter((f) => f.topic === topic.id)
    body = items.length ? <div className="f-list">{items.map(card)}</div> : <p className="muted">{t('formulas.empty')}</p>
  } else if (section) {
    const list = topics.filter((tp) => tp.section === section)
    body = (
      <div className="grid">
        {list.map((tp) => {
          const items = filtered.filter((f) => f.topic === tp.id)
          if (!items.length) return null
          const done = items.filter((f) => viewed.includes(f.id)).length
          const [from, to] = gradeRange(items)
          const lv = levels.filter((l) => items.some((f) => f.level === l))
          return (
            <button key={tp.id} className="tile topic-tile" onClick={() => go({ s: section, t: tp.id })}>
              <strong style={{ fontSize: 17 }}>{tp.title[lang]}</strong>
              <span className="muted small">
                {t('formulas.count', { n: items.length })} · {from === to ? t('grade.n', { n: from }) : t('formulas.grades', { from, to })}
              </span>
              <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{lv.map((l) => <LevelBadge key={l} level={l} />)}</span>
              <div className="bar"><div style={{ width: `${(done / items.length) * 100}%` }} /></div>
            </button>
          )
        })}
      </div>
    )
  } else {
    const groups: [Branch, Section[]][] = [
      ['algebra', sections.filter((s) => !geometrySections.includes(s))],
      ['geometry', geometrySections],
    ]
    body = groups
      .filter(([b]) => !branch || branch === b)
      .map(([b, secs]) => (
        <section key={b} style={{ marginBottom: 24 }}>
          <h2>{t(`branch.${b}`)}</h2>
          <div className="grid">
            {secs.map((s) => {
              const items = filtered.filter((f) => f.section === s)
              if (!items.length) return null
              const nTopics = topics.filter((tp) => tp.section === s && items.some((f) => f.topic === tp.id)).length
              const done = items.filter((f) => viewed.includes(f.id)).length
              return (
                <button key={s} className="tile topic-tile" onClick={() => go({ s })}>
                  <span className="tile-icon section-icon">{sectionSymbol[s]}</span>
                  <strong style={{ fontSize: 18 }}>{t(`section.${s}`)}</strong>
                  <span className="muted small">{t('formulas.count', { n: items.length })} · {t('formulas.topics', { n: nTopics })}</span>
                  <div className="bar"><div style={{ width: `${(done / items.length) * 100}%` }} /></div>
                </button>
              )
            })}
          </div>
        </section>
      ))
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 style={{ margin: 0 }}>{topic ? topic.title[lang] : section ? t(`section.${section}`) : t('formulas.title')}</h1>
        <span className="muted small">{t('formulas.total', { n: formulas.length })}</span>
      </div>
      {(section || topic) && !searchHits && crumbs}

      <div className="card card-dashed" style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '12px 0 20px' }}>
        <input className="input" type="search" placeholder={t('formulas.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips">
          {!section && !topic && !searchHits && ([null, 'algebra', 'geometry'] as const).map((b) => (
            <button key={b ?? 'all'} className={`chip ${branch === b ? 'on' : ''}`} onClick={() => setParams(b ? { branch: b } : {}, { replace: true })}>
              {t(`branch.${b ?? 'all'}`)}
            </button>
          ))}
          {levels.map((l) => (
            <button key={l} className={`chip ${level === l ? 'on' : ''}`} onClick={() => setLevel(level === l ? null : l)}>
              {t(`level.${l}`)}
            </button>
          ))}
          <select className="input" style={{ height: 32, fontSize: 14, borderRadius: 999 }} value={grade ?? ''}
            onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : null)} aria-label={t('grade.all')}>
            <option value="">{t('grade.all')}</option>
            {grades.map((g) => <option key={g} value={g}>{t('grade.n', { n: g })}</option>)}
          </select>
        </div>
        {searchHits && <span className="muted small">{t('formulas.found', { n: searchHits.length })}</span>}
      </div>

      {body}

      {topic && !searchHits && (
        <div style={{ marginTop: 20 }}>
          <Link className="btn btn-sm" to={`/formulas?s=${topic.section}`} onClick={() => setOpenId(null)}>← {t(`section.${topic.section}`)}</Link>
        </div>
      )}
    </div>
  )
}
