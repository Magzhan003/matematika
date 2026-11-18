import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LevelBadge } from '../components/FormulaCard'
import { ProblemVisual } from '../components/ProblemVisual'
import { Tex } from '../components/Tex'
import type { Level } from '../data/formulas'
import { sections, topicById, type Section } from '../data/topics'
import type { Lang } from '../i18n'
import { Link, useSearchParams } from 'react-router-dom'
import { gens, gensFor, pickGens, seeded, type Problem } from '../lib/bank'
import { encodeWork } from '../lib/workcode'

const levels: Level[] = ['easy', 'medium', 'hard']

/** One problem as printed: text + formula, or the answer with a short solution. */
function ProblemView({ p, lang }: { p: Problem; lang: Lang }) {
  return (
    <span className="pr-body">
      {p.text[lang]} {p.tex && <Tex tex={p.tex} />}
      <ProblemVisual p={p} />
    </span>
  )
}

export function Teacher() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const [title, setTitle] = useState('')
  // topics may come from the program page: /teacher?topics=fractions,percents
  const [params] = useSearchParams()
  const initTopics = (params.get('topics') ?? '').split(',').filter((id) => topicById(id))
  const [secs, setSecs] = useState<Section[]>(() => (initTopics.length ? [...new Set(initTopics.map((id) => topicById(id)!.section))] : ['algebra']))
  const [topics, setTopics] = useState<string[]>(initTopics)
  const [level, setLevel] = useState<Level>('medium')
  const [count, setCount] = useState(6)
  const [variants, setVariants] = useState(2)
  const [space, setSpace] = useState(true)
  const [seed, setSeed] = useState<number | null>(null)
  const [codeInput, setCodeInput] = useState('')

  // sections that have generators, and topics inside the chosen sections
  const secWithGens = sections.filter((s) => gens.some((g) => topicById(g.topic)?.section === s))
  const topicList = [...new Set(gensFor({ sections: secs }).map((g) => g.topic))]
  const pool = gensFor({ sections: secs, topics: topics.filter((tp) => topicList.includes(tp)), level })

  // parallel variants: the same task types in the same order, different numbers
  const types = useMemo(
    () => (seed === null || !pool.length ? [] : pickGens(pool, count, seeded(seed))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, count, pool.map((g) => g.id).join(',')],
  )
  const sheets = useMemo(
    () => (seed === null ? [] : Array.from({ length: variants }, (_, v) => {
      const r = seeded(seed * 10 + v + 1)
      return types.map((g) => g.make(r))
    })),
    [seed, variants, types],
  )
  const online = seed !== null && types.length ? encodeWork(seed, types) : ''

  const toggle = <T,>(list: T[], x: T) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x])
  const heading = title.trim() || t('teach.defaultTitle')

  return (
    <div className="page">
      <div className="no-print" style={{ display: 'grid', gap: 14 }}>
        <h1 style={{ margin: 0 }}>{t('teach.title')}</h1>
        <Link to="/program" className="small">📅 {t('prog.title')} — {t('prog.short')}</Link>
        <p className="muted" style={{ margin: 0 }}>{t('teach.intro')}</p>

        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <label className="field">
            <span className="muted small">{t('teach.workTitle')}</span>
            <input className="input" value={title} placeholder={t('teach.defaultTitle')} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <div className="muted small">{t('teach.sections')}</div>
          <div className="chips">
            {secWithGens.map((s) => (
              <button key={s} className={`chip ${secs.includes(s) ? 'on' : ''}`} onClick={() => { setSecs(toggle(secs, s)); setTopics([]) }}>
                {t(`section.${s}`)}
              </button>
            ))}
          </div>

          {topicList.length > 1 && (
            <>
              <div className="muted small">{t('teach.topics')}</div>
              <div className="chips">
                {topicList.map((tp) => (
                  <button key={tp} className={`chip ${topics.includes(tp) ? 'on' : ''}`} onClick={() => setTopics(toggle(topics, tp))}>
                    {topicById(tp)?.title[lang]}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="teach-row">
            <div style={{ display: 'grid', gap: 6 }}>
              <span className="muted small">{t('teach.level')}</span>
              <div className="chips">
                {levels.map((l) => <button key={l} className={`chip ${level === l ? 'on' : ''}`} onClick={() => setLevel(l)}>{t(`level.${l}`)}</button>)}
              </div>
            </div>
            <label className="field">
              <span className="muted small">{t('teach.count')}: <b>{count}</b></span>
              <input type="range" min={3} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </label>
            <label className="field">
              <span className="muted small">{t('teach.variants')}: <b>{variants}</b></span>
              <input type="range" min={1} max={4} value={variants} onChange={(e) => setVariants(Number(e.target.value))} />
            </label>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={space} onChange={(e) => setSpace(e.target.checked)} /> {t('teach.space')}
          </label>

          <div className="muted small">{t('teach.pool', { n: pool.length })}</div>
          {!pool.length && <p className="error" style={{ margin: 0 }}>{t('teach.empty')}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" disabled={!pool.length} onClick={() => setSeed(Math.floor(Math.random() * 900000) + 100000)}>
              {seed === null ? t('teach.make') : t('teach.newNumbers')}
            </button>
            {sheets.length > 0 && <button className="btn" onClick={() => window.print()}>🖨 {t('teach.print')}</button>}
          </div>
          <form style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); const c = Number(codeInput); if (c >= 100000 && c <= 999999) setSeed(c) }}>
            <span className="muted small">{t('teach.code')}</span>
            <input className="input" style={{ width: 120 }} inputMode="numeric" value={codeInput} placeholder="123456" onChange={(e) => setCodeInput(e.target.value)} aria-label={t('teach.code')} />
            <button className="btn btn-sm" type="submit">{t('teach.restore')}</button>
          </form>
        </div>

        {online && (
          <div className="card online-box">
            <div><b>📱 {t('teach.online')}</b></div>
            <div className="result-code">{online}</div>
            <p className="muted small" style={{ margin: 0 }}>{t('teach.onlineHint')}</p>
            <div><Link className="btn btn-sm" to={`/journal?c=${online}`}>📋 {t('teach.journal')}</Link></div>
          </div>
        )}
      </div>

      {sheets.length > 0 && (
        <div className="print-area">
          {sheets.map((ps, v) => (
            <section className="sheet" key={v}>
              <div className="sheet-head">
                <div><b>{heading}</b> · {t('teach.variant', { n: v + 1 })}</div>
                <div className="muted small">{t('teach.code')}: {seed}</div>
              </div>
              <div className="sheet-fields">{t('teach.name')} ______________________ {t('teach.class')} ______ {t('teach.date')} ________</div>
              <ol className="sheet-list">
                {ps.map((p, i) => (
                  <li key={i} className={space ? 'with-space' : ''}>
                    <ProblemView p={p} lang={lang} />
                    <span className="no-print sheet-meta"><LevelBadge level={p.level} /> {topicById(p.topic)?.title[lang]}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          <section className="sheet answers">
            <div className="sheet-head"><b>{t('teach.answers')}</b> · {heading} · {t('teach.code')}: {seed}</div>
            {sheets.map((ps, v) => (
              <div key={v} style={{ marginBottom: 12 }}>
                <b>{t('teach.variant', { n: v + 1 })}</b>
                <ol className="answer-list">
                  {ps.map((p, i) => (
                    <li key={i}>
                      <Tex tex={p.answer} />
                      {p.steps && <span className="muted small"> &nbsp;({p.steps.map((s, k) => <Tex key={k} tex={s} />)})</span>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  )
}
