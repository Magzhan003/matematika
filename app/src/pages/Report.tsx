import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formulas } from '../data/formulas'
import type { Lang } from '../i18n'
import { allMastery, focusTopics } from '../lib/mastery'
import { useStore } from '../lib/store'

const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

/** One printable page for parents (or the class teacher): activity, results, weak topics, advice. */
export function Report() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const store = useStore()
  const { name, setName, activity, xp, level, streak, lessonsDone, solved, ent, diag, dueKeys } = store
  const [period, setPeriod] = useState<7 | 30>(7)

  const days = Array.from({ length: period }, (_, i) => day(period - 1 - i))
  const counts = days.map((d) => activity[d] ?? 0)
  const active = counts.filter(Boolean).length
  const answers = counts.reduce((a, b) => a + b, 0)
  const max = Math.max(...counts, 1)
  const mastery = allMastery(store).filter((m) => m.status !== 'unknown')
  const strong = mastery.filter((m) => m.status === 'mastered')
  const weak = mastery.filter((m) => m.status === 'weak')
  const focus = focusTopics(store, diag?.grade, 3)
  const lastEnt = ent.slice(-3).reverse()

  return (
    <div className="page" style={{ display: 'grid', gap: 14 }}>
      <div className="no-print" style={{ display: 'grid', gap: 10 }}>
        <Link to="/progress" className="muted small">← {t('nav.progress')}</Link>
        <h1 style={{ margin: 0 }}>{t('rep.title')}</h1>
        <p className="muted" style={{ margin: 0 }}>{t('rep.intro')}</p>
        <div className="card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <label className="field" style={{ flex: '1 1 220px' }}>
            <span className="muted small">{t('rep.name')}</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('rep.namePh')} />
          </label>
          <div className="chips">
            {([7, 30] as const).map((p) => <button key={p} className={`chip ${period === p ? 'on' : ''}`} onClick={() => setPeriod(p)}>{t('rep.days', { n: p })}</button>)}
          </div>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨 {t('teach.print')}</button>
        </div>
      </div>

      <section className="sheet report">
        <div className="sheet-head">
          <b>{t('rep.sheetTitle')}{name ? `: ${name}` : ''}</b>
          <span className="small">{t('rep.period', { from: days[0], to: days[days.length - 1] })}</span>
        </div>

        <div className="rep-stats">
          <div><b>{active}</b><span>{t('rep.activeDays', { n: period })}</span></div>
          <div><b>{answers}</b><span>{t('rep.answers')}</span></div>
          <div><b>{lessonsDone.length}</b><span>{t('rep.lessons', { n: formulas.length })}</span></div>
          <div><b>{solved}</b><span>{t('progress.solved')}</span></div>
          <div><b>{streak}</b><span>{t('progress.streak')}</span></div>
          <div><b>{level}</b><span>{t('progress.level')} ({xp} XP)</span></div>
        </div>

        <h3>{t('rep.activity')}</h3>
        <div className="rep-chart" aria-label={t('rep.activity')}>
          {counts.map((c, i) => (
            <div key={i} className="rep-col" title={`${days[i]}: ${c}`}>
              <i style={{ height: `${(c / max) * 100}%` }} />
              {period === 7 && <span>{days[i].slice(5).split('-').reverse().join('.')}</span>}
            </div>
          ))}
        </div>

        <div className="rep-two">
          <div>
            <h3>✅ {t('rep.strong')}</h3>
            {strong.length ? <ul>{strong.map((m) => <li key={m.topic.id}>{m.topic.title[lang]} — {Math.round((m.value ?? 0) * 100)}%</li>)}</ul> : <p className="muted">{t('rep.none')}</p>}
          </div>
          <div>
            <h3>🔧 {t('rep.weak')}</h3>
            {weak.length ? <ul>{weak.map((m) => <li key={m.topic.id}>{m.topic.title[lang]} — {Math.round((m.value ?? 0) * 100)}%</li>)}</ul> : <p className="muted">{t('rep.none')}</p>}
          </div>
        </div>

        {lastEnt.length > 0 && (
          <>
            <h3>{t('rep.ent')}</h3>
            <ul>{lastEnt.map((e, i) => <li key={i}>{e.date}: {e.score} / {e.total} ({Math.round((e.score / e.total) * 100)}%)</li>)}</ul>
          </>
        )}
        {diag && <p>{t('rep.diag', { date: diag.date, grade: diag.grade })}</p>}

        <h3>💡 {t('rep.advice')}</h3>
        <ul>
          {active < Math.ceil(period / 2) && <li>{t('rep.adviceRegular')}</li>}
          {focus.length > 0 && <li>{t('rep.adviceFocus', { list: focus.map((m) => m.topic.title[lang]).join(', ') })}</li>}
          {dueKeys.length > 0 && <li>{t('rep.adviceReview', { n: dueKeys.length })}</li>}
          {!diag && <li>{t('rep.adviceDiag')}</li>}
          <li>{t('rep.adviceTalk')}</li>
        </ul>
      </section>
    </div>
  )
}
