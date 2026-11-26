import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClassList } from '../components/class/tools'
import { ProblemVisual } from '../components/ProblemVisual'
import { Tex } from '../components/Tex'
import { curriculum, currentQuarter } from '../data/curriculum'
import { topicById } from '../data/topics'
import type { Lang } from '../i18n'
import { seeded } from '../lib/bank'
import { descriptors, makeVariants, markRanges, planTasks, poolFor, skillLevel } from '../lib/summative'

type Kind = 'sor' | 'soch'

/** «2 балла», «5 баллов»; in Kazakh the word does not change. */
const ptsWord = (n: number, lang: Lang) => {
  if (lang === 'kz') return `${n} балл`
  const m10 = n % 10, m100 = n % 100
  return `${n} ${m10 === 1 && m100 !== 11 ? 'балл' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'балла' : 'баллов'}`
}

/** Summative assessment for a section (СОР) or a quarter (СОЧ): variants, scoring scheme, mark scale, class sheet. */
export function Summative() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'kz' ? 'kz' : 'ru') as Lang
  const [grade, setGrade] = useState(7)
  const [q, setQ] = useState<number>(currentQuarter())
  const [kind, setKind] = useState<Kind>('sor')
  const quarterTopics = curriculum[grade][q - 1]
  const [picked, setPicked] = useState<string[]>([])
  const topics = kind === 'soch' ? quarterTopics : picked.filter((id) => quarterTopics.includes(id)).length ? picked.filter((id) => quarterTopics.includes(id)) : [quarterTopics[0]]
  const [total, setTotal] = useState(10)
  const [minutes, setMinutes] = useState(20)
  const [variants, setVariants] = useState(2)
  const [seed, setSeed] = useState(() => 1000 + Math.floor(Math.random() * 9000))
  const [parts, setParts] = useState({ scheme: true, scale: true, sheet: true })
  const [names] = useClassList()

  const setKindAll = (k: Kind) => { setKind(k); setTotal(k === 'sor' ? 10 : 20); setMinutes(k === 'sor' ? 20 : 40) }
  const tasks = useMemo(() => planTasks(topics, grade, total, seeded(seed)), [topics.join(','), grade, total, seed]) // eslint-disable-line react-hooks/exhaustive-deps
  const vars = useMemo(() => makeVariants(tasks, variants, seed), [tasks, variants, seed])
  const titleTopics = topics.map((id) => `«${topicById(id)?.title[lang] ?? id}»`).join(', ')
  const heading = kind === 'sor' ? t('sum.sorTitle', { topics: titleTopics }) : t('sum.sochTitle', { n: q })
  const ranges = markRanges(total)
  const rows = names.length ? names : Array.from({ length: 25 }, () => '')

  const head = (v: number) => (
    <div className="sheet-head sum-head">
      <div><b>{heading}</b><div className="small">{t('grade.n', { n: grade })} · {t('teach.variant', { n: v + 1 })}</div></div>
      <div className="small sum-meta">{t('sum.time', { n: minutes })}<br />{t('sum.total')}: {total}</div>
    </div>
  )

  return (
    <div className="page">
      <div className="no-print" style={{ display: 'grid', gap: 14 }}>
        <h1>{t('sum.title')}</h1>
        <p className="muted" style={{ margin: 0 }}>{t('sum.intro')}</p>
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <div className="chips">
            {(['sor', 'soch'] as Kind[]).map((k) => <button key={k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKindAll(k)}>{t(`sum.kinds.${k}`)}</button>)}
          </div>
          <div className="chips">{[5, 6, 7, 8, 9, 10, 11].map((g) => <button key={g} className={`chip ${grade === g ? 'on' : ''}`} onClick={() => { setGrade(g); setPicked([]) }}>{t('grade.n', { n: g })}</button>)}</div>
          <div className="chips">{[1, 2, 3, 4].map((x) => <button key={x} className={`chip ${q === x ? 'on' : ''}`} onClick={() => { setQ(x); setPicked([]) }}>{t('prog.quarter', { n: x })}</button>)}</div>
          <div>
            <div className="muted small" style={{ marginBottom: 6 }}>{kind === 'sor' ? t('sum.pickSection') : t('sum.quarterTopics')}</div>
            <div className="chips">
              {quarterTopics.map((id) => (
                <button key={id} className={`chip ${topics.includes(id) ? 'on' : ''}`} disabled={kind === 'soch'}
                  onClick={() => setPicked(topics.includes(id) ? topics.filter((x) => x !== id) : [...topics, id])}>
                  {topicById(id)?.title[lang]} <span className="muted small">· {poolFor([id], grade).length}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="chips" style={{ alignItems: 'center' }}>
            <span className="muted small">{t('sum.total')}:</span>
            {(kind === 'sor' ? [8, 10, 12, 15] : [15, 20, 25, 30]).map((n) => <button key={n} className={`chip ${total === n ? 'on' : ''}`} onClick={() => setTotal(n)}>{n}</button>)}
            <span className="muted small" style={{ marginLeft: 12 }}>{t('sum.minutes')}:</span>
            {(kind === 'sor' ? [15, 20, 25] : [40, 45]).map((n) => <button key={n} className={`chip ${minutes === n ? 'on' : ''}`} onClick={() => setMinutes(n)}>{n}</button>)}
            <span className="muted small" style={{ marginLeft: 12 }}>{t('teach.variants')}:</span>
            {[1, 2, 3, 4].map((n) => <button key={n} className={`chip ${variants === n ? 'on' : ''}`} onClick={() => setVariants(n)}>{n}</button>)}
          </div>
          <div className="chips">
            {(['scheme', 'scale', 'sheet'] as const).map((k) => (
              <label key={k} className="chip"><input type="checkbox" checked={parts[k]} onChange={(e) => setParts({ ...parts, [k]: e.target.checked })} /> {t(`sum.parts.${k}`)}</label>
            ))}
          </div>
          <div className="chips">
            <button className="btn" onClick={() => window.print()} disabled={!tasks.length}>🖨 {t('teach.print')}</button>
            <button className="chip" onClick={() => setSeed(1000 + Math.floor(Math.random() * 9000))}>🎲 {t('teach.newNumbers')}</button>
          </div>
          <p className="muted small" style={{ margin: 0 }}>⚠ {t('sum.note')}</p>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="print-area ws-area">
          {vars.map((vr, v) => (
            <section className="sheet" key={`v${v}`}>
              {head(v)}
              <div className="sheet-fields">{t('teach.name')} ______________________ {t('teach.class')} ______ {t('teach.date')} ________</div>
              <ol className="sheet-list sum-list">
                {vr.problems.map((p, i) => (
                  <li key={i} className="with-space">
                    <span className="pr-body">{p.text[lang]} {p.tex && <Tex tex={p.tex} />}<ProblemVisual p={p} /></span>
                    <span className="sum-pts">[{ptsWord(tasks[i].points, lang)}]</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          {parts.scheme && vars.map((vr, v) => (
            <section className="sheet" key={`s${v}`}>
              <div className="sheet-head"><b>{t('sum.scheme')}</b><span className="small">{heading} · {t('teach.variant', { n: v + 1 })}</span></div>
              <table className="sum-table">
                <thead><tr><th>№</th><th>{t('sum.criterion')}</th><th>{t('sum.level')}</th><th>{t('sum.descriptor')}</th><th>{t('sum.point')}</th><th>{t('teach.answers')}</th></tr></thead>
                {vr.problems.map((p, i) => {
                    const tp = topicById(p.topic)
                    const ds = descriptors(tasks[i].points, tp?.title ?? { ru: p.topic, kz: p.topic })
                    return (
                      <tbody key={i} className="sum-task">
                        {ds.map((d, k) => (
                          <tr key={k} className={k === 0 ? 'first' : ''}>
                            {k === 0 && <td rowSpan={ds.length}><b>{i + 1}</b></td>}
                            {k === 0 && <td rowSpan={ds.length}>{t('sum.applies', { topic: tp?.title[lang] ?? p.topic })}</td>}
                            {k === 0 && <td rowSpan={ds.length}>{skillLevel[p.level][lang]}</td>}
                            <td>{d[lang]}</td>
                            <td className="c">1</td>
                            {k === 0 && <td rowSpan={ds.length}><Tex tex={p.answer} /></td>}
                          </tr>
                        ))}
                      </tbody>
                    )
                  })}
                <tbody className="sum-task"><tr className="sum-total"><td colSpan={4}>{t('sum.totalRow')}</td><td className="c">{total}</td><td /></tr></tbody>
              </table>
            </section>
          ))}

          {(parts.scale || parts.sheet) && (
            <section className="sheet">
              <div className="sheet-head"><b>{parts.sheet ? t('sum.sheetTitle') : t('sum.scale')}</b><span className="small">{heading} · {t('grade.n', { n: grade })} · {t('teach.code')}: {seed}</span></div>
              {parts.scale && (
                <table className="sum-table sum-scale">
                  <thead><tr><th>{t('sum.mark')}</th>{ranges.map((x) => <th key={x.mark}>«{x.mark}»</th>)}</tr></thead>
                  <tbody>
                    <tr><td>{t('sum.points')}</td>{ranges.map((x) => <td key={x.mark} className="c">{x.from}–{x.to}</td>)}</tr>
                    <tr><td>%</td>{['85–100', '65–84', '40–64', '0–39'].map((s) => <td key={s} className="c">{s}</td>)}</tr>
                  </tbody>
                </table>
              )}
              {parts.sheet && (
                <table className="sum-table sum-class">
                  <thead>
                    <tr><th>№</th><th>{t('sum.student')}</th>{tasks.map((x, i) => <th key={i} className="c">{i + 1}<div className="small">({x.points})</div></th>)}<th className="c">Σ<div className="small">({total})</div></th><th className="c">%</th><th className="c">{t('sum.mark')}</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((n, i) => <tr key={i}><td className="c">{i + 1}</td><td>{n}</td>{tasks.map((_, k) => <td key={k} />)}<td /><td /><td /></tr>)}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
