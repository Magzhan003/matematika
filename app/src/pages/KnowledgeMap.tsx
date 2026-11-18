import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formulas } from '../data/formulas'
import { sections, topicById } from '../data/topics'
import type { Lang } from '../i18n'
import { allMastery, prereqs, topicGrade, type Mastery, type Status } from '../lib/mastery'
import { useStore } from '../lib/store'

const statuses: Status[] = ['mastered', 'learning', 'weak', 'unknown']

/** Knowledge map: every topic coloured by how well it is known, with what it needs first. */
export function KnowledgeMap() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const store = useStore()
  const [grade, setGrade] = useState(store.diag?.grade ?? 11)
  const [sel, setSel] = useState<string | null>(null)
  const all = useMemo(() => allMastery(store), [store])
  const byId = new Map(all.map((m) => [m.topic.id, m]))
  const shown = all.filter((m) => topicGrade(m.topic.id) <= grade)
  const count = (s: Status) => shown.filter((m) => m.status === s).length
  const cur = sel ? byId.get(sel) : null

  const Node = ({ m }: { m: Mastery }) => (
    <button className={`map-node st-${m.status} ${sel === m.topic.id ? 'on' : ''}`} onClick={() => setSel(m.topic.id)}>
      <span className="map-name">{m.topic.title[lang]}</span>
      <span className="map-meta">
        <span>{t('grade.n', { n: topicGrade(m.topic.id) })}</span>
        <b>{m.value === null ? '?' : `${Math.round(m.value * 100)}%`}</b>
      </span>
      <span className="map-bar"><i style={{ width: `${(m.value ?? 0) * 100}%` }} /></span>
    </button>
  )

  const detail = cur && (() => {
    const pre = (prereqs[cur.topic.id] ?? []).map((id) => byId.get(id)!).filter(Boolean)
    const next = formulas.filter((f) => f.topic === cur.topic.id && !store.lessonsDone.includes(f.id)).sort((a, b) => a.grade - b.grade)[0]
    const opens = Object.entries(prereqs).filter(([, v]) => v.includes(cur.topic.id)).map(([k]) => topicById(k)!).filter(Boolean)
    return (
      <div className="card map-detail" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
          <h2 style={{ margin: 0 }}>{cur.topic.title[lang]}</h2>
          <button className="btn btn-sm" onClick={() => setSel(null)} aria-label={t('map.close')}>✕</button>
        </div>
        <div className={`map-status st-${cur.status}`}>{t(`map.status.${cur.status}`)} · {cur.value === null ? '—' : `${Math.round(cur.value * 100)}%`}</div>
        <span className="muted small">{t('map.details', { a: cur.answered, l: cur.lessons, lt: cur.lessonsTotal })}</span>
        {pre.length > 0 && (
          <div>
            <div className="muted small">{t('map.needs')}</div>
            <div className="chips">{pre.map((p) => <button key={p.topic.id} className={`chip st-chip st-${p.status}`} onClick={() => setSel(p.topic.id)}>{p.topic.title[lang]}</button>)}</div>
          </div>
        )}
        {opens.length > 0 && (
          <div>
            <div className="muted small">{t('map.opens')}</div>
            <div className="chips">{opens.map((o) => <button key={o.id} className="chip" onClick={() => setSel(o.id)}>{o.title[lang]}</button>)}</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to={`/practice/${cur.topic.id}`}>💪 {t('map.train')}</Link>
          {next && <Link className="btn" to={`/lesson/${next.id}`}>▶ {t('map.lesson')}: {next.title[lang]}</Link>}
          <Link className="btn" to={`/formulas?s=${cur.topic.section}&t=${cur.topic.id}`}>📘 {t('nav.formulas')}</Link>
        </div>
      </div>
    )
  })()

  return (
    <div className="page" style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0 }}>{t('map.title')}</h1>
      <p className="muted" style={{ margin: 0 }}>{t('map.intro')}</p>
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <label className="field">
          <span className="muted small">{t('cs.grade')}: <b>{grade}</b></span>
          <input type="range" min={5} max={11} value={grade} onChange={(e) => setGrade(Number(e.target.value))} />
        </label>
        <div className="map-legend">
          {statuses.map((s) => <span key={s} className={`map-key st-${s}`}>{t(`map.status.${s}`)}: <b>{count(s)}</b></span>)}
        </div>
        {!store.diag && <Link to="/diagnostic" className="small">🧭 {t('map.noDiag')}</Link>}
      </div>
      {detail}
      {sections.map((s) => {
        const list = shown.filter((m) => m.topic.section === s).sort((a, b) => topicGrade(a.topic.id) - topicGrade(b.topic.id))
        if (!list.length) return null
        return (
          <section key={s} style={{ display: 'grid', gap: 8 }}>
            <h3 style={{ margin: 0 }}>{t(`section.${s}`)}</h3>
            <div className="map-row">{list.map((m) => <Node key={m.topic.id} m={m} />)}</div>
          </section>
        )
      })}
    </div>
  )
}
