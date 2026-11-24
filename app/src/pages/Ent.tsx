import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MistakeHint } from '../components/MistakeHint'
import { ProblemVisual } from '../components/ProblemVisual'
import { Solution } from '../components/ProblemCard'
import { Tex } from '../components/Tex'
import { sections, topicById, type Section } from '../data/topics'
import type { Lang } from '../i18n'
import { choices, gens, gensFor, sectionOfGen, type Problem } from '../lib/bank'
import { useStore } from '../lib/store'

type Preset = { id: string; n: number; min: number | null; section?: Section; topic?: string }
const presets: Preset[] = [
  { id: 'mini', n: 10, min: 15 },
  { id: 'standard', n: 20, min: 35 },
  { id: 'full', n: 40, min: 70 },
]
const literacy: Preset = { id: 'literacy', n: 10, min: 25, topic: 'literacy' }

/** Mixed exam: about 30 % easy, 50 % medium, 20 % hard, spread over all sections. */
function buildExam(n: number, section?: Section, topic?: string): Problem[] {
  // the general exam keeps math literacy as a separate test
  const pool = topic ? gens.filter((g) => g.topic === topic) : section ? gensFor({ sections: [section] }) : gens.filter((g) => g.topic !== 'literacy')
  const quota = { easy: Math.round(n * 0.3), hard: Math.round(n * 0.2), medium: 0 }
  quota.medium = n - quota.easy - quota.hard
  const out: Problem[] = []
  for (const lv of ['easy', 'medium', 'hard'] as const) {
    const list = pool.filter((g) => g.level === lv)
    const src = list.length ? list : pool
    const order = [...src].sort(() => Math.random() - 0.5)
    for (let i = 0; i < quota[lv]; i++) out.push(order[i % order.length].make(Math.random))
  }
  return out.sort(() => Math.random() - 0.5)
}

export function Ent() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { saveEnt, recordAnswers, ent } = useStore()
  const [phase, setPhase] = useState<'setup' | 'run' | 'result'>('setup')
  const [preset, setPreset] = useState<Preset>(presets[1])
  const [topicSec, setTopicSec] = useState<Section>('algebra')
  const [exam, setExam] = useState<Problem[]>([])
  const [opts, setOpts] = useState<{ options: string[]; correct: number }[]>([])
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [flags, setFlags] = useState<boolean[]>([])
  const [cur, setCur] = useState(0)
  const [endAt, setEndAt] = useState<number | null>(null)
  const [startAt, setStartAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [open, setOpen] = useState<number | null>(null)

  const start = (p: Preset) => {
    const ex = buildExam(p.n, p.section, p.topic)
    setPreset(p)
    setExam(ex)
    setOpts(ex.map((q) => choices(q)))
    setAnswers(ex.map(() => null))
    setFlags(ex.map(() => false))
    setCur(0)
    setStartAt(Date.now())
    setEndAt(p.min ? Date.now() + p.min * 60000 : null)
    setOpen(null)
    setPhase('run')
  }

  const finish = () => {
    const score = answers.filter((a, i) => a === opts[i].correct).length
    saveEnt(score, exam.length, Math.round((Date.now() - startAt) / 1000))
    recordAnswers(exam.map((q, i) => ({ key: `g:${q.gen}`, ok: answers[i] === opts[i].correct })))
    setPhase('result')
  }

  useEffect(() => {
    if (phase !== 'run' || !endAt) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [phase, endAt])
  useEffect(() => {
    if (phase === 'run' && endAt && now >= endAt) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now])

  const score = useMemo(() => answers.filter((a, i) => opts[i] && a === opts[i].correct).length, [answers, opts])

  if (phase === 'setup') {
    return (
      <div className="page" style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>{t('ent.title')}</h1>
        <Link className="card ep-link" to="/ent-plan">📅 <b>{t('ep.title')}</b> <span className="muted small">— {t('ep.linkHint')}</span></Link>
        <p className="muted" style={{ margin: 0 }}>{t('ent.intro')}</p>
        <div className="grid">
          {presets.map((p, i) => (
            <button key={p.id} className={`tile topic-tile ${i === 1 ? 'dark' : ''}`} onClick={() => start(p)}>
              <span className="tile-icon">⏱</span>
              <strong style={{ fontSize: 19 }}>{t(`ent.presets.${p.id}`)}</strong>
              <span className="muted small">{t('ent.presetInfo', { n: p.n, min: p.min })}</span>
            </button>
          ))}
        </div>
        <button className="card literacy-card" onClick={() => start(literacy)}>
          <span style={{ fontSize: 28 }}>📊</span>
          <span style={{ display: 'grid', gap: 4, textAlign: 'left' }}>
            <strong style={{ fontSize: 18 }}>{t('ent.presets.literacy')}</strong>
            <span className="muted small">{t('ent.literacyDesc', { n: literacy.n, min: literacy.min })}</span>
          </span>
        </button>
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <strong>{t('ent.byTopic')}</strong>
          <div className="chips">
            {sections.filter((s) => gens.some((g) => sectionOfGen(g) === s)).map((s) => (
              <button key={s} className={`chip ${topicSec === s ? 'on' : ''}`} onClick={() => setTopicSec(s)}>{t(`section.${s}`)}</button>
            ))}
          </div>
          <div><button className="btn btn-primary" onClick={() => start({ id: 'topic', n: 10, min: null, section: topicSec })}>{t('ent.startTopic')}</button></div>
        </div>
        {ent.length > 0 && (
          <div className="card">
            <strong>{t('ent.history')}</strong>
            <div className="ent-history">
              {[...ent].reverse().slice(0, 8).map((e, i) => (
                <div key={i} className="an-row"><span className="an-key">{e.date}</span><span>{e.score} / {e.total} · {Math.round((e.score / e.total) * 100)}% · {Math.round(e.sec / 60)} {t('ent.minShort')}</span></div>
              ))}
            </div>
          </div>
        )}
        <p className="muted small" style={{ margin: 0 }}>{t('ent.disclaimer')}</p>
      </div>
    )
  }

  if (phase === 'run') {
    const q = exam[cur], o = opts[cur]
    const left = endAt ? Math.max(0, Math.round((endAt - now) / 1000)) : null
    const answered = answers.filter((a) => a !== null).length
    return (
      <div className="page" style={{ display: 'grid', gap: 14 }}>
        <div className="ent-bar">
          <strong>{preset.section ? t(`section.${preset.section}`) : t(`ent.presets.${preset.id}`)}</strong>
          <span className="muted">{t('ent.answered', { a: answered, n: exam.length })}</span>
          {left !== null && <span className={`timer ${left < 120 ? 'low' : ''}`}>⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>}
          <button className="btn btn-sm" onClick={() => { if (answered === exam.length || window.confirm(t('ent.confirmFinish', { n: exam.length - answered }))) finish() }}>{t('ent.finish')}</button>
        </div>
        <div className="ent-grid">
          {exam.map((_, i) => (
            <button key={i} className={`ent-num ${i === cur ? 'cur' : ''} ${answers[i] !== null ? 'done' : ''} ${flags[i] ? 'flag' : ''}`} onClick={() => setCur(i)}>{i + 1}</button>
          ))}
        </div>
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <div className="muted small">{t('test.question', { n: cur + 1, total: exam.length })} · {topicById(q.topic)?.title[lang]}</div>
          <div className="problem-text">{q.text[lang]}</div>
          {q.tex && <div className="problem-tex"><Tex tex={q.tex} /></div>}
          <ProblemVisual p={q} />
          <div style={{ display: 'grid', gap: 8 }}>
            {o.options.map((x, i) => (
              <button key={i} className={`option ${answers[cur] === i ? 'picked' : ''}`} onClick={() => setAnswers(answers.map((a, k) => (k === cur ? (a === i ? null : i) : a)))}>
                <b className="opt-letter">{'ABCDE'[i]}</b> <Tex tex={x} />
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" disabled={cur === 0} onClick={() => setCur(cur - 1)}>← {t('lessons.prev')}</button>
            <button className="btn" onClick={() => setFlags(flags.map((f, k) => (k === cur ? !f : f)))}>{flags[cur] ? '🚩 ' : ''}{t('ent.flag')}</button>
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} disabled={cur === exam.length - 1} onClick={() => setCur(cur + 1)}>{t('lessons.next')} →</button>
          </div>
        </div>
      </div>
    )
  }

  // ---- results
  const per = new Map<string, { ok: number; all: number }>()
  exam.forEach((q, i) => {
    const s = topicById(q.topic)?.section ?? 'algebra'
    const v = per.get(s) ?? { ok: 0, all: 0 }
    v.all++
    if (answers[i] === opts[i].correct) v.ok++
    per.set(s, v)
  })
  const pct = Math.round((score / exam.length) * 100)
  const spent = Math.round((Date.now() - startAt) / 60000)
  return (
    <div className="page" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>{t('ent.result')}</h1>
      <div className="space-panel" style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>{score} / {exam.length}</div>
        <div className="bar"><div style={{ width: `${pct}%` }} /></div>
        <span>{pct}% · {t('ent.spent', { n: spent })} · {pct >= 80 ? t('ent.great') : pct >= 50 ? t('ent.good') : t('ent.weak')}</span>
      </div>
      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <strong>{t('ent.bySection')}</strong>
        {[...per].sort((a, b) => a[1].ok / a[1].all - b[1].ok / b[1].all).map(([s, v]) => (
          <div key={s}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t(`section.${s}`)}</span><span className="muted small">{v.ok}/{v.all}</span></div>
            <div className="bar"><div style={{ width: `${(v.ok / v.all) * 100}%`, background: v.ok / v.all < 0.5 ? 'var(--bad)' : undefined }} /></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <strong>{t('ent.review')}</strong>
        {exam.map((q, i) => {
          const ok = answers[i] === opts[i].correct
          return (
            <div key={i} className={`card ent-item ${ok ? 'ok' : 'bad'}`}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <b>{i + 1}.</b>
                <span style={{ flex: 1 }}>{q.text[lang]} {q.tex && <Tex tex={q.tex} />}</span>
                <span>{ok ? '✓' : '✗'}</span>
              </div>
              {!ok && (
                <div className="small" style={{ marginTop: 6 }}>
                  {t('ent.yours')}: {answers[i] === null ? '—' : <Tex tex={opts[i].options[answers[i]!]} />} · {t('ent.right')}: <Tex tex={q.answer} />
                  <button className="btn btn-sm" style={{ marginLeft: 8 }} onClick={() => setOpen(open === i ? null : i)}>{open === i ? t('pc.hideSolution') : t('pc.showSolution')}</button>
                </div>
              )}
              {!ok && answers[i] !== null && <div style={{ marginTop: 8 }}><MistakeHint p={q} picked={opts[i].options[answers[i]!]} /></div>}
              {open === i && <div style={{ marginTop: 10 }}><Solution p={q} /></div>}
            </div>
          )
        })}
      </div>
      <p className="muted small" style={{ margin: 0 }}>{t('ent.toReview')}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={() => start(preset)}>{t('ent.again')}</button>
        <button className="btn" onClick={() => setPhase('setup')}>{t('ent.back')}</button>
      </div>
    </div>
  )
}
