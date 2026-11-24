import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { beep, FullscreenButton } from '../components/class/tools'
import { ProblemVisual } from '../components/ProblemVisual'
import { Tex } from '../components/Tex'
import { curriculum, currentQuarter } from '../data/curriculum'
import type { Formula } from '../data/formulas'
import { topicById } from '../data/topics'
import type { Lang } from '../i18n'
import type { Problem } from '../lib/bank'
import { buildScenario, type Stage } from '../lib/scenario'

const icons: Record<Stage['key'], string> = { org: '👋', warmup: '🧠', recall: '🔁', new: '💡', practice: '✏️', check: '📝', reflect: '🪞' }
const fmt = (s: number) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

function Task({ p, lang, show }: { p: Problem; lang: Lang; show: boolean }) {
  return (
    <li>
      <span className="pr-body">{p.text[lang]} {p.tex && <Tex tex={p.tex} />}<ProblemVisual p={p} /></span>
      {show && <div className="scn-ans">→ <Tex tex={p.answer} /></div>}
    </li>
  )
}

function FormulaBlock({ f, lang, steps }: { f: Formula; lang: Lang; steps?: number }) {
  return (
    <div className="scn-formula">
      <div className="scn-formula-title">{f.title[lang]}</div>
      <Tex tex={f.tex} block />
      {steps !== undefined && (
        <>
          <p className="scn-explain">{f.explain[lang]}</p>
          <div className="scn-example"><b>{f.example.task[lang]}</b>
            {f.example.steps.slice(0, steps).map((s, i) => <Tex key={i} tex={s} block />)}
            {steps >= f.example.steps.length && <div className="scn-ans">→ <Tex tex={f.example.answer} /></div>}
          </div>
        </>
      )}
    </div>
  )
}

/** The content of one stage — the same in the printed plan and on the screen. */
function StageBody({ st, lang, show, steps, prevTitle, topicTitle }: { st: Stage; lang: Lang; show: boolean; steps: number; prevTitle?: string; topicTitle: string }) {
  const { t } = useTranslation()
  switch (st.key) {
    case 'org': return <div className="scn-org"><div className="scn-topic">{topicTitle}</div><p>{t('scn.goal')}</p></div>
    case 'warmup': return <>{prevTitle && <p className="muted">{t('scn.prev', { topic: prevTitle })}</p>}<ol className="scn-tasks">{st.problems!.map((p, i) => <Task key={i} p={p} lang={lang} show={show} />)}</ol></>
    case 'recall': return st.formulas!.length ? <div className="scn-grid">{st.formulas!.map((f) => <FormulaBlock key={f.id} f={f} lang={lang} />)}</div> : <p className="muted">{t('scn.noFormulas')}</p>
    case 'new': return st.formulas!.length ? <>{st.formulas!.map((f) => <div key={f.id}><FormulaBlock f={f} lang={lang} steps={steps} /><Link className="no-print small" to={`/lesson/${f.id}`}>📖 {t('scn.fullLesson')}</Link></div>)}</> : <p className="muted">{t('scn.noFormulas')}</p>
    case 'practice': return <ol className="scn-tasks">{st.problems!.map((p, i) => <Task key={i} p={p} lang={lang} show={show} />)}</ol>
    case 'check': return <div className="scn-grid">{st.variants!.map((v, k) => <div key={k}><b>{t('teach.variant', { n: k + 1 })}</b><ol className="scn-tasks">{v.map((p, i) => <Task key={i} p={p} lang={lang} show={show} />)}</ol></div>)}</div>
    case 'reflect': return (
      <div className="scn-grid">
        <div><b>{t('scn.reflectTitle')}</b><ul className="scn-reflect">{(t('scn.reflectQ', { returnObjects: true }) as string[]).map((q) => <li key={q}>{q}</li>)}</ul><div className="scn-smile">👍 🙂 🤔</div></div>
        <div><b>{t('scn.homework')}</b><ol className="scn-tasks">{st.homework!.map((p, i) => <Task key={i} p={p} lang={lang} show={show} />)}</ol></div>
      </div>
    )
  }
}

/** Lesson scenario: stages with minutes; a printable plan and a full-screen mode with a stage timer. */
export function Scenario() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'kz' ? 'kz' : 'ru') as Lang
  const [grade, setGrade] = useState(7)
  const [q, setQ] = useState<number>(currentQuarter())
  const ids = curriculum[grade][q - 1]
  const [topic, setTopic] = useState<string>('')
  const tp = ids.includes(topic) ? topic : ids[0]
  const [len, setLen] = useState<40 | 45>(40)
  const [seed, setSeed] = useState(() => 1000 + Math.floor(Math.random() * 9000))
  const sc = useMemo(() => buildScenario(tp, grade, len, seed), [tp, grade, len, seed])
  const [run, setRun] = useState(false)
  const [k, setK] = useState(0)
  const [left, setLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const [show, setShow] = useState(false)
  const [steps, setSteps] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const st = sc.stages[k]
  const title = (id: string | null) => (id ? topicById(id)?.title[lang] ?? id : '')

  const go = (n: number) => { const x = Math.max(0, Math.min(sc.stages.length - 1, n)); setK(x); setLeft(sc.stages[x].minutes * 60); setShow(false); setSteps(0) }
  useEffect(() => {
    if (!run || paused) return
    const id = setInterval(() => setLeft((v) => v - 1), 1000)
    return () => clearInterval(id)
  }, [run, paused, k])
  useEffect(() => { if (run && left === 0) beep(2) }, [left, run])
  useEffect(() => {
    if (!run) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(k + 1)
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(k - 1)
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p) }
      if (e.key === 'Escape') setRun(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (run) {
    const maxSteps = Math.max(0, ...(st.formulas ?? []).map((f) => f.example.steps.length))
    return (
      <div className="page">
        <div className="scn-stage" ref={box}>
          <div className="scn-bar">{sc.stages.map((s, i) => <button key={s.key} className={`scn-dot ${i === k ? 'on' : i < k ? 'done' : ''}`} onClick={() => go(i)} title={t(`scn.stages.${s.key}`)}>{icons[s.key]}</button>)}</div>
          <div className="scn-top">
            <h2>{icons[st.key]} {t(`scn.stages.${st.key}`)} <span className="muted small">· {st.minutes} {t('cls.min')}</span></h2>
            <div className={`scn-clock ${left <= 0 ? 'over' : left <= 60 ? 'soon' : ''}`}>{left < 0 ? '+' : ''}{fmt(Math.abs(left))}</div>
          </div>
          <div className="scn-body"><StageBody st={st} lang={lang} show={show} steps={st.key === 'new' ? steps : 0} prevTitle={title(sc.prevTopic)} topicTitle={title(tp)} /></div>
          <div className="chips scn-controls">
            <button className="btn btn-sm" onClick={() => go(k - 1)} disabled={k === 0}>← {t('scn.back')}</button>
            {st.key === 'new' && steps < maxSteps && <button className="btn btn-sm" onClick={() => setSteps(steps + 1)}>👣 {t('scn.nextStep')}</button>}
            {(st.problems || st.variants || st.homework) && <button className="chip" onClick={() => setShow(!show)}>{show ? t('scn.hideAnswers') : t('scn.showAnswers')}</button>}
            <button className="chip" onClick={() => setPaused(!paused)}>{paused ? '▶' : '⏸'}</button>
            <FullscreenButton target={box} />
            <button className="btn btn-sm" onClick={() => (k + 1 < sc.stages.length ? go(k + 1) : setRun(false))}>{k + 1 < sc.stages.length ? `${t('scn.next')} →` : t('scn.finish')}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="no-print" style={{ display: 'grid', gap: 14 }}>
        <h1>🗓 {t('scn.title')}</h1>
        <p className="muted" style={{ margin: 0 }}>{t('scn.intro')}</p>
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <div className="chips">{[5, 6, 7, 8, 9, 10, 11].map((g) => <button key={g} className={`chip ${grade === g ? 'on' : ''}`} onClick={() => setGrade(g)}>{t('grade.n', { n: g })}</button>)}</div>
          <div className="chips">{[1, 2, 3, 4].map((x) => <button key={x} className={`chip ${q === x ? 'on' : ''}`} onClick={() => setQ(x)}>{t('prog.quarter', { n: x })}</button>)}</div>
          <div className="chips">{ids.map((id) => <button key={id} className={`chip ${tp === id ? 'on' : ''}`} onClick={() => setTopic(id)}>{title(id)}</button>)}</div>
          <div className="chips" style={{ alignItems: 'center' }}>
            <span className="muted small">{t('scn.length')}:</span>
            {([40, 45] as const).map((n) => <button key={n} className={`chip ${len === n ? 'on' : ''}`} onClick={() => setLen(n)}>{n} {t('cls.min')}</button>)}
          </div>
          <div className="chips">
            <button className="btn" onClick={() => { setRun(true); go(0) }}>▶ {t('scn.start')}</button>
            <button className="chip" onClick={() => window.print()}>🖨 {t('scn.printPlan')}</button>
            <button className="chip" onClick={() => setSeed(1000 + Math.floor(Math.random() * 9000))}>🎲 {t('teach.newNumbers')}</button>
          </div>
        </div>
      </div>
      <section className="sheet scn-plan">
        <div className="sheet-head"><b>{t('scn.planTitle')}: {title(tp)}</b><span className="small">{t('grade.n', { n: grade })} · {sc.total} {t('cls.min')}</span></div>
        {sc.stages.map((s, i) => (
          <div key={s.key} className="scn-plan-stage">
            <div className="scn-plan-head"><b>{i + 1}. {icons[s.key]} {t(`scn.stages.${s.key}`)}</b><span>{s.minutes} {t('cls.min')}</span></div>
            <p className="muted small">{t(`scn.hint.${s.key}`)}</p>
            <StageBody st={s} lang={lang} show steps={99} prevTitle={title(sc.prevTopic)} topicTitle={title(tp)} />
          </div>
        ))}
      </section>
    </div>
  )
}
