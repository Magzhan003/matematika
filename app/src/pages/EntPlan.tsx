import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formulas } from '../data/formulas'
import { topicById } from '../data/topics'
import type { Lang } from '../i18n'
import { addDays, buildPlan, daysBetween, loadPlan, savePlan, todayIso, type Plan, type PlanDay } from '../lib/entplan'
import { useStore } from '../lib/store'

const icon = { study: '📘', mock: '⏱', full: '🏁', rest: '🌿' } as const
/** The first (simplest) lesson of a topic, to recall the theory before practice. */
const lessonOf = (topic: string) => formulas.filter((f) => f.topic === topic).sort((a, b) => a.grade - b.grade)[0]?.id

/** ЕНТ preparation by days: today's task, the calendar, ticks for finished days. */
export function EntPlan() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'kz' ? 'kz' : 'ru') as Lang
  const store = useStore()
  const [plan, setPlan] = useState<Plan | null>(loadPlan)
  const [exam, setExam] = useState(() => addDays(todayIso(), 30))
  const today = todayIso()
  const update = (p: Plan | null) => { setPlan(p); savePlan(p) }
  const make = () => update(buildPlan(exam, store))
  const toggle = (n: number) => plan && update({ ...plan, done: plan.done.includes(n) ? plan.done.filter((x) => x !== n) : [...plan.done, n] })

  const DayContent = ({ d }: { d: PlanDay }) => (
    <div className="ep-day-body">
      {d.kind === 'study' && d.topics.map((id) => (
        <div key={id} className="ep-topic">
          <b>{topicById(id)?.title[lang]}</b>
          <span className="chips">
            <Link className="chip" to={`/practice/${id}`}>✏️ {t('ep.practice')}</Link>
            {lessonOf(id) && <Link className="chip" to={`/lesson/${lessonOf(id)}`}>📖 {t('ep.lesson')}</Link>}
          </span>
        </div>
      ))}
      {(d.kind === 'mock' || d.kind === 'full') && (
        <>
          <p>{t(d.kind === 'mock' ? 'ep.mockText' : 'ep.fullText')}</p>
          <div><Link className="chip" to="/ent">{icon[d.kind]} {t('ep.toEnt')}</Link></div>
        </>
      )}
      {d.kind === 'rest' && <p>{t('ep.restText')}</p>}
    </div>
  )

  if (!plan) {
    const n = daysBetween(today, exam)
    return (
      <div className="page" style={{ display: 'grid', gap: 14 }}>
        <h1 style={{ margin: 0 }}>📅 {t('ep.title')}</h1>
        <p className="muted" style={{ margin: 0 }}>{t('ep.intro')}</p>
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 4, maxWidth: 260 }}>
            <span className="muted small">{t('ep.examDate')}</span>
            <input className="input" type="date" value={exam} min={addDays(today, 3)} onChange={(e) => setExam(e.target.value)} />
          </label>
          <div className="chips">
            {[14, 30, 60, 90].map((k) => <button key={k} className={`chip ${n === k ? 'on' : ''}`} onClick={() => setExam(addDays(today, k))}>{t('ep.inDays', { n: k })}</button>)}
          </div>
          {!store.diag && <p className="small" style={{ margin: 0 }}>💡 {t('ep.diagHint')} <Link to="/diagnostic">{t('nav.diagnostic')}</Link></p>}
          <div><button className="btn btn-primary" onClick={make} disabled={n < 3}>{t('ep.make', { n })}</button></div>
        </div>
      </div>
    )
  }

  const idx = Math.max(0, Math.min(plan.days.length - 1, daysBetween(plan.days[0].date, today)))
  const cur = plan.days[idx]
  const before = daysBetween(plan.days[0].date, today) < 0
  const done = plan.done.length
  const missed = plan.days.filter((d) => d.date < today && !plan.done.includes(d.n)).length
  return (
    <div className="page" style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0 }}>📅 {t('ep.title')}</h1>
      <div className="card ep-progress">
        <div><b>{t('ep.progress', { done, total: plan.days.length })}</b> · {t('ep.left', { n: Math.max(0, daysBetween(today, plan.exam)) })}{missed > 0 && <span className="ep-missed"> · {t('ep.missed', { n: missed })}</span>}</div>
        <div className="ep-bar"><i style={{ width: `${(done / plan.days.length) * 100}%` }} /></div>
      </div>
      {!before && (
        <section className={`card ep-today ${plan.done.includes(cur.n) ? 'done' : ''}`}>
          <div className="ep-head">
            <h2 style={{ margin: 0 }}>{icon[cur.kind]} {cur.date === today ? t('ep.today') : cur.date} · {t('ep.day', { n: cur.n })}</h2>
            <label className="chip"><input type="checkbox" checked={plan.done.includes(cur.n)} onChange={() => toggle(cur.n)} /> {t('ep.done')}</label>
          </div>
          <p className="muted small" style={{ margin: 0 }}>{t(`ep.kinds.${cur.kind}`)}</p>
          <DayContent d={cur} />
        </section>
      )}
      <section>
        <h2 style={{ fontSize: 18 }}>{t('ep.calendar')}</h2>
        <div className="ep-cal">
          {plan.days.map((d) => (
            <details key={d.n} className={`ep-cell ${d.kind} ${plan.done.includes(d.n) ? 'done' : d.date < today ? 'missed' : ''} ${d.date === today ? 'now' : ''}`}>
              <summary>
                <span className="ep-n">{d.n}</span>
                <span className="ep-date">{d.date.slice(8)}.{d.date.slice(5, 7)}</span>
                <span className="ep-ic">{plan.done.includes(d.n) ? '✓' : icon[d.kind]}</span>
              </summary>
              <div className="ep-pop">
                <div className="muted small">{t(`ep.kinds.${d.kind}`)}</div>
                <DayContent d={d} />
                <label className="chip"><input type="checkbox" checked={plan.done.includes(d.n)} onChange={() => toggle(d.n)} /> {t('ep.done')}</label>
              </div>
            </details>
          ))}
        </div>
      </section>
      <div className="chips">
        <button className="chip" onClick={() => { if (confirm(t('ep.resetAsk'))) update(null) }}>↺ {t('ep.reset')}</button>
        <button className="chip" onClick={() => update({ ...buildPlan(plan.exam, store), done: [] })} title={t('ep.rebuildHint')}>🔄 {t('ep.rebuild')}</button>
      </div>
    </div>
  )
}
