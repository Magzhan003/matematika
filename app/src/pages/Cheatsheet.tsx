import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tex } from '../components/Tex'
import { formulas, type Level } from '../data/formulas'
import { sections, topics, type Section } from '../data/topics'
import type { Lang } from '../i18n'
import { useStore } from '../lib/store'

const rank: Record<Level, number> = { easy: 0, medium: 1, hard: 2 }

/** Printable cheat sheet: formulas grouped by section and topic, in columns. */
export function Cheatsheet() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { viewed } = useStore()
  const [secs, setSecs] = useState<Section[]>(['algebra'])
  const [grade, setGrade] = useState(11)
  const [examples, setExamples] = useState(false)
  const [onlyViewed, setOnlyViewed] = useState(false)
  const [small, setSmall] = useState(false)
  const [title, setTitle] = useState('')

  const list = formulas.filter((f) => secs.includes(f.section) && f.grade <= grade && (!onlyViewed || viewed.includes(f.id)))
  const groups = sections
    .filter((s) => secs.includes(s))
    .map((s) => ({
      s,
      topics: topics
        .filter((tp) => tp.section === s)
        .map((tp) => ({ tp, fs: list.filter((f) => f.topic === tp.id).sort((a, b) => a.grade - b.grade || rank[a.level] - rank[b.level]) }))
        .filter((g) => g.fs.length),
    }))
    .filter((g) => g.topics.length)

  const toggle = (s: Section) => setSecs(secs.includes(s) ? secs.filter((x) => x !== s) : [...secs, s])

  return (
    <div className="page">
      <div className="no-print" style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>{t('cs.title')}</h1>
        <p className="muted" style={{ margin: 0 }}>{t('cs.intro')}</p>
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <label className="field">
            <span className="muted small">{t('cs.heading')}</span>
            <input className="input" value={title} placeholder={t('cs.defaultHeading')} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <div className="muted small">{t('teach.sections')}</div>
          <div className="chips">
            <button className={`chip ${secs.length === sections.length ? 'on' : ''}`} onClick={() => setSecs(secs.length === sections.length ? [] : [...sections])}>
              {t('cs.all')}
            </button>
            {sections.map((s) => (
              <button key={s} className={`chip ${secs.includes(s) ? 'on' : ''}`} onClick={() => toggle(s)}>{t(`section.${s}`)}</button>
            ))}
          </div>
          <div className="teach-row">
            <label className="field">
              <span className="muted small">{t('cs.grade')}: <b>{grade}</b></span>
              <input type="range" min={5} max={11} value={grade} onChange={(e) => setGrade(Number(e.target.value))} />
            </label>
            <div style={{ display: 'grid', gap: 6 }}>
              <label className="check-row"><input type="checkbox" checked={examples} onChange={(e) => setExamples(e.target.checked)} /> {t('cs.examples')}</label>
              <label className="check-row"><input type="checkbox" checked={onlyViewed} onChange={(e) => setOnlyViewed(e.target.checked)} /> {t('cs.onlyViewed')}</label>
              <label className="check-row"><input type="checkbox" checked={small} onChange={(e) => setSmall(e.target.checked)} /> {t('cs.small')}</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" disabled={!list.length} onClick={() => window.print()}>🖨 {t('teach.print')}</button>
            <span className="muted small">{t('cs.count', { n: list.length })}</span>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="muted">{t('cs.empty')}</p>
      ) : (
        <div className={`cheat ${small ? 'small' : ''}`}>
          <div className="cheat-head">{title.trim() || t('cs.defaultHeading')}</div>
          {groups.map(({ s, topics: tps }) => (
            <section key={s} className="cheat-section">
              <h2>{t(`section.${s}`)}</h2>
              {tps.map(({ tp, fs }) => (
                <div key={tp.id} className="cheat-topic">
                  <h3>{tp.title[lang]}</h3>
                  {fs.map((f) => (
                    <div key={f.id} className="cheat-item">
                      <div className="cheat-name">{f.title[lang]} <span className="cheat-grade">{f.grade}</span></div>
                      <div className="cheat-tex"><Tex tex={f.tex} /></div>
                      {examples && (
                        <div className="cheat-ex">
                          {f.example.task[lang]} <Tex tex={`\\Rightarrow ${f.example.answer}`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
