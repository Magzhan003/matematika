import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Tex } from '../components/Tex'
import { topicById } from '../data/topics'
import type { Lang } from '../i18n'
import { gens, seeded, type Problem } from '../lib/bank'
import { allWorks, portfolioOf, studentNames, type Portfolio as P } from '../lib/journal'
import { useCloudJournal } from '../lib/cloud'

const level = (s: { ok: number; n: number }) => { const p = s.ok / s.n; return p >= 0.8 ? 'good' : p >= 0.5 ? 'mid' : 'weak' }

/** Review tasks for the weakest topics: two easy ones per topic, the same every time for this student. */
function reviewTasks(p: P): { topic: string; tasks: Problem[] }[] {
  const r = seeded([...p.name].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0)
  return p.topics.filter((s) => level(s) !== 'good').slice(0, 3).map((s) => {
    const gs = gens.filter((g) => g.topic === s.topic)
    const easy = gs.filter((g) => g.level !== 'hard')
    const src = easy.length ? easy : gs
    return { topic: s.topic, tasks: src.length ? [0, 1].map((i) => src[i % src.length].make(r)) : [] }
  })
}

function Sheet({ p, lang, cls }: { p: P; lang: Lang; cls: string }) {
  const { t } = useTranslation()
  const avg = p.works.length ? Math.round(p.works.reduce((s, w) => s + w.percent, 0) / p.works.length) : 0
  const trend = p.works.length >= 2 ? p.works[p.works.length - 1].percent - p.works[0].percent : 0
  const review = reviewTasks(p)
  return (
    <section className="sheet pf-sheet">
      <div className="sheet-head"><b>{t('pf.sheetTitle')}: {p.name}</b><span className="small">{cls && `${t('teach.class')} ${cls} · `}{new Date().toISOString().slice(0, 10)}</span></div>
      <div className="pf-stats">
        <div><b>{p.works.length}</b><span>{t('pf.works')}</span></div>
        <div><b>{avg}%</b><span>{t('pf.avg')}</span></div>
        <div><b>{p.topics.filter((s) => level(s) === 'good').length} / {p.topics.length}</b><span>{t('pf.topicsGood')}</span></div>
        <div><b>{trend > 0 ? `↗ +${trend}` : trend < 0 ? `↘ ${trend}` : '→ 0'}%</b><span>{t('pf.trend')}</span></div>
      </div>
      <h3>{t('pf.worksTitle')}</h3>
      <table className="sum-table">
        <thead><tr><th>{t('teach.date').replace(':', '')}</th><th>{t('pf.work')}</th><th className="c">{t('pf.right')}</th><th className="c">%</th><th className="c">{t('sum.mark')}</th></tr></thead>
        <tbody>{p.works.map((w, i) => <tr key={i}><td>{w.date}</td><td>{w.title}</td><td className="c">{w.done} / {w.total}</td><td className="c">{w.percent}</td><td className="c"><b>{w.mark}</b></td></tr>)}</tbody>
      </table>
      <h3>{t('pf.topicsTitle')}</h3>
      <div className="pf-topics">
        {p.topics.map((s) => (
          <div key={s.topic} className={`pf-topic ${level(s)}`}>
            <span>{level(s) === 'good' ? '✅' : level(s) === 'mid' ? '🟡' : '🔧'} {topicById(s.topic)?.title[lang] ?? s.topic}</span>
            <span className="pf-bar"><i style={{ width: `${(s.ok / s.n) * 100}%` }} /></span>
            <span className="small">{s.ok} / {s.n}</span>
          </div>
        ))}
      </div>
      {review.length > 0 && (
        <>
          <h3>📚 {t('pf.reviewTitle')}</h3>
          <ol className="pf-review">
            {review.flatMap((x) => x.tasks.map((q, i) => (
              <li key={`${x.topic}${i}`}><span className="muted small">{topicById(x.topic)?.title[lang]}: </span>{q.text[lang]} {q.tex && <Tex tex={q.tex} />}</li>
            )))}
          </ol>
          <div className="pf-key small">{t('teach.answers')}: {review.flatMap((x) => x.tasks).map((q, i) => <span key={i}> {i + 1}) <Tex tex={q.answer} />;</span>)}</div>
        </>
      )}
      <div className="pf-sign small">{t('pf.teacher')} ____________________ &nbsp;&nbsp; {t('pf.parent')} ____________________</div>
    </section>
  )
}

/** Student portfolio from the results journal: all works, marks, topics to review — one printed page per student. */
export function Portfolio() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'kz' ? 'kz' : 'ru') as Lang
  // online: answers are loaded from the database first (version changes after loading)
  const { version } = useCloudJournal()
  const works = useMemo(() => allWorks(), [version]) // eslint-disable-line react-hooks/exhaustive-deps
  const names = useMemo(() => studentNames(works), [works])
  const [who, setWho] = useState<string>('')
  const [cls, setCls] = useState('')
  const list = (who === '*' ? names : who ? [who] : []).map((n) => portfolioOf(n, works)).filter((p) => p.works.length)

  return (
    <div className="page">
      <div className="no-print" style={{ display: 'grid', gap: 14 }}>
        <h1 style={{ margin: 0 }}>{t('pf.title')}</h1>
        <p className="muted" style={{ margin: 0 }}>{t('pf.intro')}</p>
        {!names.length ? (
          <div className="card" style={{ display: 'grid', gap: 8 }}>
            <b>{t('pf.emptyTitle')}</b>
            <p style={{ margin: 0 }}>{t('pf.emptyText')}</p>
            <div className="chips"><Link className="chip" to="/teacher">🖨 {t('nav.teacher')}</Link><Link className="chip" to="/journal">📋 {t('nav.journal')}</Link></div>
          </div>
        ) : (
          <div className="card" style={{ display: 'grid', gap: 12 }}>
            <div className="chips">
              <button className={`chip ${who === '*' ? 'on' : ''}`} onClick={() => setWho('*')}>👥 {t('pf.all', { n: names.length })}</button>
              {names.map((n) => <button key={n} className={`chip ${who === n ? 'on' : ''}`} onClick={() => setWho(n)}>{n}</button>)}
            </div>
            <label style={{ display: 'grid', gap: 4, maxWidth: 200 }}>
              <span className="muted small">{t('teach.class')}</span>
              <input className="input" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="7 «А»" />
            </label>
            <div><button className="btn btn-primary" disabled={!list.length} onClick={() => window.print()}>🖨 {t('pf.print', { n: list.length })}</button></div>
          </div>
        )}
      </div>
      <div className="pf-list">{list.map((p) => <Sheet key={p.name} p={p} lang={lang} cls={cls} />)}</div>
    </div>
  )
}
