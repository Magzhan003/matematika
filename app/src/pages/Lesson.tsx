import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Picture, type PictureId } from '../components/Pictures'
import { Quiz } from '../components/Quiz'
import { Tex } from '../components/Tex'
import { formulaById, type L } from '../data/formulas'
import { lessons } from '../data/lessons'
import type { Lang } from '../i18n'
import { lessonCheck } from '../lib/quiz'
import { useStore } from '../lib/store'

type Slide = { kind: string; text?: L; lines?: string[]; picture?: PictureId; check?: boolean }

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

  const slides = useMemo<Slide[]>(() => {
    if (!f) return []
    const example: Slide = {
      kind: 'example',
      text: f.example.task,
      lines: [...f.example.steps, `\\Rightarrow\\; ${f.example.answer}`],
    }
    const check: Slide = { kind: 'check', check: true }
    const custom = lessons[f.id]
    if (!custom) {
      return [{ kind: 'formula', text: f.explain, lines: [f.tex] }, example, check]
    }
    const by = (k: string) => custom.filter((s) => s.kind === k)
    return [...by('hook'), ...by('picture'), ...by('derive'), example, ...by('back'), ...by('trap'), check]
  }, [f])

  const [slide, setSlide] = useState(0)
  const [shown, setShown] = useState(1)
  const [finished, setFinished] = useState(false)
  const [earned, setEarned] = useState(false)
  const questions = useMemo(() => (f ? lessonCheck(f) : []), [f, round])

  if (!f) {
    return (
      <div className="page">
        <p>{t('lessons.notFound')}</p>
        <Link className="btn" to="/lessons">{t('lessons.toLessons')}</Link>
      </div>
    )
  }

  const s = slides[slide]
  const lines = s.lines ?? []
  const firstTime = !lessonsDone.includes(f.id)

  const next = () => {
    if (shown < lines.length) return setShown(shown + 1)
    if (slide + 1 < slides.length) {
      setSlide(slide + 1)
      setShown(1)
    }
  }
  const prev = () => {
    if (slide === 0) return
    setSlide(slide - 1)
    setShown(slides[slide - 1].lines?.length ?? 1)
  }
  const restart = () => {
    setSlide(0)
    setShown(1)
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
        <div className="dots" aria-hidden="true">
          {slides.map((_, i) => <span key={i} className={i <= slide ? 'on' : ''} />)}
        </div>
      </div>

      {finished ? (
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
      ) : (
        <div className="card lesson-stage" key={slide}>
          <span className="lesson-kind">{t(`lessons.${s.kind}`)}</span>
          {s.text && <p className="lesson-text fade-in">{s.text[lang]}</p>}
          {s.picture && <Picture id={s.picture} />}
          {lines.length > 0 && (
            <div className="board">
              {lines.slice(0, shown).map((l, i) => (
                <div className="board-line" key={i}><Tex tex={l} /></div>
              ))}
            </div>
          )}
          {s.check && (
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
        </div>
      )}

      {!finished && !s.check && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button className="btn" onClick={prev} disabled={slide === 0} style={{ opacity: slide === 0 ? 0.4 : 1 }}>
            ← {t('lessons.prev')}
          </button>
          <button className="btn btn-primary" onClick={next}>{t('lessons.next')} →</button>
        </div>
      )}
    </div>
  )
}
