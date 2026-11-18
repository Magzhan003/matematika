import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ProblemVisual } from '../components/ProblemVisual'
import { Tex } from '../components/Tex'
import { sections, topics } from '../data/topics'
import type { Lang } from '../i18n'
import { choices, gens, type Problem } from '../lib/bank'
import { topicGrade } from '../lib/mastery'
import { useStore } from '../lib/store'

const MAX = 24

/** One easy-or-medium problem for every topic up to the chosen grade (at most MAX, spread over sections). */
function buildDiag(grade: number): Problem[] {
  const tps = topics.filter((t) => gens.some((g) => g.topic === t.id) && topicGrade(t.id) <= grade)
  let chosen = tps
  if (tps.length > MAX) {
    // keep every k-th topic of each section so that all sections stay
    const step = tps.length / MAX
    chosen = Array.from({ length: MAX }, (_, i) => tps[Math.floor(i * step)])
  }
  return chosen
    .sort((a, b) => sections.indexOf(a.section) - sections.indexOf(b.section) || topicGrade(a.id) - topicGrade(b.id))
    .map((t) => {
      const own = gens.filter((g) => g.topic === t.id)
      const fit = own.filter((g) => g.level !== 'hard' && g.grade <= grade)
      const list = fit.length ? fit : own
      return list[Math.floor(Math.random() * list.length)].make(Math.random)
    })
}

/** Diagnostic test: find out what the student knows and build a personal plan. */
export function Diagnostic() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { saveDiag, recordAnswers, diag } = useStore()
  const [grade, setGrade] = useState<number | null>(null)
  const problems = useMemo(() => (grade ? buildDiag(grade) : []), [grade])
  const opts = useMemo(() => problems.map((p) => choices(p)), [problems])
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [picked, setPicked] = useState<number | null>(null)

  if (grade === null) {
    return (
      <div className="page" style={{ display: 'grid', gap: 14, maxWidth: 720 }}>
        <h1 style={{ margin: 0 }}>{t('dg.title')}</h1>
        <p style={{ margin: 0 }}>{t('dg.intro')}</p>
        <ul className="goal-list">
          <li>{t('dg.rule1')}</li>
          <li>{t('dg.rule2')}</li>
          <li>{t('dg.rule3')}</li>
        </ul>
        {diag && <p className="muted small" style={{ margin: 0 }}>{t('dg.last', { date: diag.date })}</p>}
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <b>{t('dg.grade')}</b>
          <div className="chips">
            {[5, 6, 7, 8, 9, 10, 11].map((g) => (
              <button key={g} className="chip" onClick={() => setGrade(g)}>{t('grade.n', { n: g })}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const done = answers.length === problems.length && problems.length > 0
  if (done) {
    // topic -> share of right answers
    const byTopic: Record<string, number[]> = {}
    problems.forEach((p, k) => (byTopic[p.topic] ??= []).push(answers[k] ? 1 : 0))
    const scores = Object.fromEntries(Object.entries(byTopic).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]))
    const strong = topics.filter((tp) => scores[tp.id] === 1)
    const weak = topics.filter((tp) => scores[tp.id] !== undefined && scores[tp.id] < 1)
    const right = answers.filter(Boolean).length
    return (
      <div className="page" style={{ display: 'grid', gap: 14, maxWidth: 820 }}>
        <div className="space-panel" style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0 }}>{t('dg.result', { r: right, n: problems.length })}</h2>
          <span className="muted">{t('dg.saved')}</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" to="/">{t('dg.toPlan')}</Link>
            <Link className="btn" to="/map">{t('dg.toMap')}</Link>
          </div>
        </div>
        {weak.length > 0 && (
          <div className="card" style={{ display: 'grid', gap: 8 }}>
            <h3 style={{ margin: 0 }}>🔧 {t('dg.weak')}</h3>
            <div className="chips">{weak.map((tp) => <Link key={tp.id} className="chip bad-chip" to={`/practice/${tp.id}`}>{tp.title[lang]}</Link>)}</div>
          </div>
        )}
        {strong.length > 0 && (
          <div className="card" style={{ display: 'grid', gap: 8 }}>
            <h3 style={{ margin: 0 }}>✅ {t('dg.strong')}</h3>
            <div className="chips">{strong.map((tp) => <span key={tp.id} className="chip good-chip">{tp.title[lang]}</span>)}</div>
          </div>
        )}
      </div>
    )
  }

  const p = problems[i]
  const answer = (k: number | null) => {
    const ok = k !== null && k === opts[i].correct
    const next = [...answers, ok]
    setAnswers(next)
    setPicked(null)
    if (!ok) recordAnswers([{ key: `g:${p.gen}`, ok: false }])
    if (i + 1 < problems.length) setI(i + 1)
    else {
      const byTopic: Record<string, number[]> = {}
      problems.forEach((q, n) => (byTopic[q.topic] ??= []).push(next[n] ? 1 : 0))
      saveDiag(Object.fromEntries(Object.entries(byTopic).map(([k2, v]) => [k2, v.reduce((a, b) => a + b, 0) / v.length])), grade)
    }
  }

  return (
    <div className="page" style={{ display: 'grid', gap: 12, maxWidth: 760 }}>
      <div className="game-stats">
        <b>{t('dg.title')} · {t('grade.n', { n: grade })}</b>
        <span className="muted">{t('test.question', { n: i + 1, total: problems.length })}</span>
      </div>
      <div className="bar"><div style={{ width: `${(i / problems.length) * 100}%` }} /></div>
      <div className="card problem" style={{ display: 'grid', gap: 10 }}>
        <div className="problem-text">{p.text[lang]}</div>
        {p.tex && <div className="problem-tex"><Tex tex={p.tex} /></div>}
        <ProblemVisual p={p} />
        <div className="work-options">
          {opts[i].options.map((o, k) => (
            <button key={k} className={`option ${picked === k ? 'picked' : ''}`} onClick={() => setPicked(k)}>
              <b className="opt-letter">{'ABCDE'[k]}</b> <Tex tex={o} />
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={picked === null} onClick={() => answer(picked)}>{t('test.next')} →</button>
          <button className="btn" onClick={() => answer(null)}>🤷 {t('dg.dontKnow')}</button>
        </div>
      </div>
      <p className="muted small" style={{ margin: 0 }}>{t('dg.noFeedback')}</p>
    </div>
  )
}
