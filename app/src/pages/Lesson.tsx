import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { LevelBadge } from '../components/FormulaCard'
import { DrawBoard } from '../components/lesson/Board'
import { hasTry, TryIt } from '../components/lesson/TryIt'
import { Picture, type PictureId } from '../components/Pictures'
import { ProblemCard } from '../components/ProblemCard'
import { Quiz } from '../components/Quiz'
import { Tex } from '../components/Tex'
import { topicLife } from '../data/lesson-extras'
import { formulaById, formulas, type Formula, type L, type Level } from '../data/formulas'
import { lessons } from '../data/lessons'
import { topicById } from '../data/topics'
import type { Lang } from '../i18n'
import { gensFor, pickGens, type Problem } from '../lib/bank'
import { lessonCheck } from '../lib/quiz'
import { useStore } from '../lib/store'

type Kind = 'goal' | 'hook' | 'picture' | 'derive' | 'formula' | 'try' | 'example' | 'example2' | 'checkpoint' | 'back' | 'trap' | 'summary' | 'check'
type Slide = { kind: Kind; text?: L; lines?: string[]; picture?: PictureId; legend?: boolean }

const ownKinds: Kind[] = ['goal', 'try', 'checkpoint', 'summary']
const rank: Record<Level, number> = { easy: 0, medium: 1, hard: 2 }

/** Formulas of the same topic, from simple to hard. */
const topicMates = (f: Formula) =>
  formulas.filter((o) => o.topic === f.topic).sort((a, b) => a.grade - b.grade || rank[a.level] - rank[b.level])

/** Generators for practice: the topic at this level, else the whole topic, else the section. */
function practicePool(f: Formula) {
  const exact = gensFor({ topics: [f.topic!], level: f.level })
  if (exact.length) return exact
  const topic = gensFor({ topics: [f.topic!] })
  return topic.length ? topic : gensFor({ sections: [f.section], level: f.level })
}

/** Text-to-speech in the lesson language, if the device has such a voice. */
function useSpeech(lang: Lang) {
  const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => synth?.getVoices() ?? [])
  const [speaking, setSpeaking] = useState(false)
  useEffect(() => {
    if (!synth) return
    const h = () => setVoices(synth.getVoices())
    synth.addEventListener('voiceschanged', h)
    return () => {
      synth.removeEventListener('voiceschanged', h)
      synth.cancel()
    }
  }, [synth])
  const code = lang === 'kz' ? 'kk' : 'ru'
  const voice = voices.find((v) => v.lang.toLowerCase().startsWith(code))
  const stop = () => {
    synth?.cancel()
    setSpeaking(false)
  }
  const speak = (text: string) => {
    if (!synth || !voice || !text.trim()) return
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    u.lang = voice.lang
    u.rate = 0.95
    u.onend = u.onerror = () => setSpeaking(false)
    setSpeaking(true)
    synth.speak(u)
  }
  return { available: Boolean(voice), speaking, speak, stop }
}

/** What every letter of the formula means. */
function Legend({ f }: { f: Formula }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  if (!f.calc) return null
  return (
    <div className="legend">
      <div className="muted small">{t('ls.legend')}</div>
      {f.calc.vars.map((v) => (
        <div key={v.name} className="legend-row"><Tex tex={v.tex} /> <span>— {v.label[lang]}</span></div>
      ))}
    </div>
  )
}

function GoalSlide({ f, kinds }: { f: Formula; kinds: Kind[] }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const topic = topicById(f.topic!)
  const mates = topicMates(f)
  const before = mates.slice(0, mates.findIndex((o) => o.id === f.id)).slice(-3)
  const life = topicLife[f.topic!]
  return (
    <div className="goal fade-in">
      <div className="goal-meta">
        <span className="badge badge-line">{t('grade.n', { n: f.grade })}</span>
        <LevelBadge level={f.level} />
        {topic && <span className="muted small">{topic.title[lang]}</span>}
      </div>
      <div>
        <h3>🎯 {t('ls.youLearn')}</h3>
        <ul className="goal-list">
          <li>{t('ls.learnWhat', { title: f.title[lang] })}</li>
          {hasTry(f) && <li>{t('ls.learnTry')}</li>}
          <li>{t('ls.learnSolve')}</li>
        </ul>
      </div>
      {life && (
        <div className="life-box">
          <b>🌍 {t('ls.life')}</b>
          <p>{life[lang]}</p>
        </div>
      )}
      {before.length > 0 && (
        <div>
          <h3>🔁 {t('ls.before')}</h3>
          <div className="chips">
            {before.map((o) => <Link key={o.id} className="chip" to={`/lesson/${o.id}`}>{o.title[lang]}</Link>)}
          </div>
        </div>
      )}
      <div>
        <h3>🗺 {t('ls.plan')}</h3>
        <ol className="plan-steps">
          {kinds.filter((k) => k !== 'goal').map((k, i) => <li key={i}>{t(ownKinds.includes(k) ? `ls.${k}` : `lessons.${k}`)}</li>)}
        </ol>
      </div>
      <p className="muted small" style={{ margin: 0 }}>{t('ls.boardTip')}</p>
    </div>
  )
}

function Checkpoint({ f, round }: { f: Formula; round: number }) {
  const { t } = useTranslation()
  const { recordAnswers } = useStore()
  const p = useMemo<Problem | null>(() => {
    const g = pickGens(practicePool(f), 1)[0]
    return g ? g.make(Math.random) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, round])
  const [done, setDone] = useState<boolean | null>(null)
  if (!p) return null
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p className="lesson-text fade-in">{t('ls.checkpointIntro')}</p>
      <ProblemCard p={p} onResult={(ok) => { setDone(ok); recordAnswers([{ key: `g:${p.gen}`, ok }]) }} />
      {done !== null && <p className="muted" style={{ margin: 0 }}>{done ? t('ls.cpGood') : t('ls.cpBad')}</p>}
    </div>
  )
}

function Summary({ f, trap }: { f: Formula; trap?: L }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { recordAnswers } = useStore()
  const [added, setAdded] = useState(false)
  const life = topicLife[f.topic!]
  const print = () => {
    document.body.classList.add('print-summary')
    window.addEventListener('afterprint', () => document.body.classList.remove('print-summary'), { once: true })
    window.print()
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="lesson-summary">
        <h3 style={{ margin: 0 }}>📒 {t('ls.summaryOf', { title: f.title[lang] })}</h3>
        <div className="summary-formula"><Tex tex={f.tex} block /></div>
        <Legend f={f} />
        <div><b>{t('ls.rule')}:</b> {f.explain[lang]}</div>
        <div>
          <b>{t('lessons.example')}:</b> {f.example.task[lang]}
          <div className="summary-steps">
            {f.example.steps.map((s, i) => <Tex key={i} tex={s} block />)}
            <Tex tex={`\\Rightarrow\\; ${f.example.answer}`} block />
          </div>
        </div>
        {trap && <div className="trap-box">⚠️ <b>{t('lessons.trap')}:</b> {trap[lang]}</div>}
        {life && <div className="muted"><b>{t('ls.life')}:</b> {life[lang]}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" onClick={print}>🖨 {t('ls.print')}</button>
        <button className="btn" disabled={added} onClick={() => { recordAnswers([{ key: `f:${f.id}`, ok: false }]); setAdded(true) }}>
          {added ? `✓ ${t('ls.added')}` : `🔁 ${t('ls.addReview')}`}
        </button>
      </div>
    </div>
  )
}

/** After the lesson: three practice problems from easy to hard, and where to go next. */
function Practice({ f }: { f: Formula }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { recordAnswers, addSolved } = useStore()
  const [round, setRound] = useState(0)
  const set = useMemo(() => {
    const pool = gensFor({ topics: [f.topic!] })
    const list = pool.length ? pool : practicePool(f)
    return pickGens(list, 3).sort((a, b) => rank[a.level] - rank[b.level]).map((g) => g.make(Math.random))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, round])
  const mates = topicMates(f)
  const idx = mates.findIndex((o) => o.id === f.id)
  const next = mates[idx + 1] ?? formulas[formulas.findIndex((o) => o.id === f.id) + 1]
  const related = mates.filter((o) => o.id !== f.id).slice(0, 8)

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {set.length > 0 && (
        <>
          <h2 style={{ margin: '8px 0 0' }}>💪 {t('ls.practice')}</h2>
          <p className="muted" style={{ margin: 0 }}>{t('ls.practiceIntro')}</p>
          {set.map((p, i) => (
            <div key={`${round}-${i}`} style={{ display: 'grid', gap: 6 }}>
              <div className="muted small">{t('ls.task', { n: i + 1 })} · <LevelBadge level={p.level} /></div>
              <ProblemCard p={p} onResult={(ok) => { recordAnswers([{ key: `g:${p.gen}`, ok }]); if (ok) addSolved() }} />
            </div>
          ))}
          <div><button className="btn" onClick={() => setRound(round + 1)}>🎲 {t('ls.morePractice')}</button></div>
        </>
      )}
      {f.topic === 'word-problems' && (
        <Link className="tile" to="/word" style={{ display: 'grid', gap: 4 }}>
          <b>🧩 {t('nav.word')}</b>
          <span className="muted small">{t('wp.intro')}</span>
        </Link>
      )}
      {next && (
        <Link className="tile dark" to={`/lesson/${next.id}`} style={{ display: 'grid', gap: 4 }}>
          <span className="muted small">{t('ls.nextLesson')}</span>
          <b>{next.title[lang]} →</b>
        </Link>
      )}
      {related.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 8px' }}>{t('ls.related')}</h3>
          <div className="chips">
            {related.map((o) => <Link key={o.id} className="chip" to={`/lesson/${o.id}`}>{o.title[lang]}</Link>)}
          </div>
        </div>
      )}
    </div>
  )
}

/** Remount on every new lesson id so the player always starts from the first slide. */
export function Lesson() {
  const { id = '' } = useParams()
  return <LessonView key={id} id={id} />
}

function LessonView({ id }: { id: string }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { completeLesson, lessonsDone } = useStore()
  const f = formulaById(id)
  const [round, setRound] = useState(0)
  const custom = f ? lessons[f.id] : undefined

  const slides = useMemo<Slide[]>(() => {
    if (!f) return []
    const example: Slide[] = [{ kind: 'example', text: f.example.task, lines: [...f.example.steps, `\\Rightarrow\\; ${f.example.answer}`] }]
    if (f.example2) example.push({ kind: 'example2', text: f.example2.task, lines: [...f.example2.steps, `\\Rightarrow\\; ${f.example2.answer}`] })
    const tryIt: Slide[] = hasTry(f) ? [{ kind: 'try' }] : []
    const checkpoint: Slide[] = practicePool(f).length ? [{ kind: 'checkpoint' }] : []
    const end: Slide[] = [{ kind: 'summary' }, { kind: 'check' }]
    if (!custom) {
      return [{ kind: 'goal' }, { kind: 'formula', text: f.explain, lines: [f.tex], legend: true }, ...tryIt, ...example, ...checkpoint, ...end]
    }
    const by = (k: Kind) => custom.filter((s) => s.kind === k).map((s): Slide => ({ ...s }))
    const derive = by('derive')
    if (derive.length) derive[derive.length - 1].legend = true
    return [{ kind: 'goal' }, ...by('hook'), ...by('picture'), ...derive, ...tryIt, ...example, ...checkpoint, ...by('back'), ...by('trap'), ...end]
  }, [f, custom])

  const [slide, setSlide] = useState(0)
  const [shown, setShown] = useState(1)
  const [seen, setSeen] = useState(0)
  const [finished, setFinished] = useState(false)
  const [earned, setEarned] = useState(false)
  const [board, setBoard] = useState(false)
  const questions = useMemo(() => (f ? lessonCheck(f) : []), [f, round])
  const speech = useSpeech(lang)

  const s = slides[slide]
  const lines = s?.lines ?? []
  const go = (i: number, show = 1) => {
    speech.stop()
    setSlide(i)
    setShown(show)
    setSeen((m) => Math.max(m, i))
  }
  const next = () => {
    if (shown < lines.length) return setShown(shown + 1)
    if (slide + 1 < slides.length) go(slide + 1)
  }
  const prev = () => {
    if (slide > 0) go(slide - 1, slides[slide - 1].lines?.length ?? 1)
  }

  // ← → keys move through the lesson (not while typing an answer)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (finished || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || s?.kind === 'check') return
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!f) {
    return (
      <div className="page">
        <p>{t('lessons.notFound')}</p>
        <Link className="btn" to="/lessons">{t('lessons.toLessons')}</Link>
      </div>
    )
  }

  const firstTime = !lessonsDone.includes(f.id)
  const trap = custom?.find((x) => x.kind === 'trap')?.text
  const label = (k: Kind) => t(ownKinds.includes(k) ? `ls.${k}` : `lessons.${k}`)
  const speechText = (): string => {
    if (s.kind === 'goal') return `${f.title[lang]}. ${topicLife[f.topic!]?.[lang] ?? ''}`
    if (s.kind === 'summary') return `${f.title[lang]}. ${f.explain[lang]}`
    if (s.kind === 'try') return t('ls.tryIntro')
    return s.text?.[lang] ?? ''
  }
  const restart = () => {
    go(0)
    setFinished(false)
    setRound((r) => r + 1)
  }

  return (
    <div className="page" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Link to="/lessons" className="muted small">← {t('lessons.toLessons')}</Link>
          <h1 style={{ margin: '4px 0 0', fontSize: 24 }}>{f.title[lang]}</h1>
        </div>
        {!finished && (
          <div className="lesson-tools">
            {speech.available && (
              <button className="btn btn-sm" onClick={() => (speech.speaking ? speech.stop() : speech.speak(speechText()))}>
                {speech.speaking ? `⏹ ${t('ls.stop')}` : `🔊 ${t('ls.speak')}`}
              </button>
            )}
            <button className={`btn btn-sm ${board ? 'btn-primary' : ''}`} onClick={() => setBoard(!board)} aria-pressed={board}>
              ✏️ {t('ls.board')}
            </button>
          </div>
        )}
      </div>

      {!finished && (
        <div className="lesson-progress" role="tablist" aria-label={t('ls.plan')}>
          {slides.map((x, i) => (
            <button key={i} role="tab" aria-selected={i === slide} title={label(x.kind)} disabled={i > seen}
              className={`lp-step ${i === slide ? 'cur' : i <= seen ? 'on' : ''}`} onClick={() => go(i, slides[i].lines?.length ?? 1)} />
          ))}
          <span className="muted small lp-label">{slide + 1}/{slides.length} · {label(s.kind)}</span>
        </div>
      )}

      {finished ? (
        <>
          <div className="space-panel" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
            <h2 style={{ margin: 0 }}>{t('lessons.finished')}</h2>
            {earned ? (
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{t('lessons.xp', { n: 20 })}</span>
            ) : (
              <span className="muted">✓ {t('lessons.done')}</span>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" to="/lessons">{t('lessons.toLessons')}</Link>
              <button className="btn" onClick={restart}>{t('lessons.again')}</button>
            </div>
          </div>
          <Practice f={f} />
        </>
      ) : (
        <div className="card lesson-stage" key={slide}>
          <span className="lesson-kind">{label(s.kind)}</span>
          {s.kind === 'goal' && <GoalSlide f={f} kinds={slides.map((x) => x.kind)} />}
          {s.kind === 'try' && (
            <>
              <p className="lesson-text fade-in">{t('ls.tryIntro')}</p>
              <TryIt f={f} />
            </>
          )}
          {s.kind === 'checkpoint' && <Checkpoint f={f} round={round} />}
          {s.kind === 'summary' && <Summary f={f} trap={trap} />}
          {s.text && <p className="lesson-text fade-in">{s.text[lang]}</p>}
          {s.picture && <Picture id={s.picture} />}
          {lines.length > 0 && (
            <div className="board">
              {lines.slice(0, shown).map((l, i) => (
                <div className="board-line" key={i}><Tex tex={l} /></div>
              ))}
              {shown < lines.length && <div className="board-more muted small">{t('ls.moreLines', { n: lines.length - shown })}</div>}
            </div>
          )}
          {s.legend && shown >= lines.length && <Legend f={f} />}
          {s.kind === 'check' && (
            <Quiz
              key={round}
              questions={questions}
              onFinish={() => {
                setEarned(firstTime)
                completeLesson(f.id)
                setFinished(true)
              }}
            />
          )}
          {board && <DrawBoard onClose={() => setBoard(false)} />}
        </div>
      )}

      {!finished && s.kind !== 'check' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button className="btn" onClick={prev} disabled={slide === 0} style={{ opacity: slide === 0 ? 0.4 : 1 }}>
            ← {t('lessons.prev')}
          </button>
          <button className="btn btn-primary" onClick={next}>
            {shown < lines.length ? t('ls.showNext') : t('lessons.next')} →
          </button>
        </div>
      )}
    </div>
  )
}
