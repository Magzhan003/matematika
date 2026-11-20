import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sections, type Section } from '../../data/topics'
import type { Lang } from '../../i18n'
import { gensFor, makeSet } from '../../lib/bank'
import type { Problem } from '../../lib/bank/core'
import { Tex } from '../Tex'
import { beep, FullscreenButton } from './tools'

type Level = 'easy' | 'medium' | 'hard'
type Phase = 'setup' | 'run' | 'answers'

/**
 * Math dictation: tasks one by one in big letters with a countdown, students write answers on paper;
 * at the end a slide with all answers for self-check.
 */
export function Dictation() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const [secs, setSecs] = useState<Section[]>(['algebra'])
  const [level, setLevel] = useState<Level>('easy')
  const [count, setCount] = useState(8)
  const [per, setPer] = useState(60)
  const [tasks, setTasks] = useState<Problem[]>([])
  const [k, setK] = useState(0)
  const [left, setLeft] = useState(0)
  const [phase, setPhase] = useState<Phase>('setup')
  const [paused, setPaused] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  const available = gensFor({ sections: secs, level }).length
  const start = () => {
    const list = makeSet(gensFor({ sections: secs, level }), count)
    if (!list.length) return
    setTasks(list); setK(0); setLeft(per); setPhase('run'); setPaused(false)
  }
  const next = () => {
    if (k + 1 >= tasks.length) { setPhase('answers'); beep(2); return }
    setK(k + 1); setLeft(per)
  }

  useEffect(() => {
    if (phase !== 'run' || paused) return
    const id = setInterval(() => setLeft((v) => v - 1), 1000)
    return () => clearInterval(id)
  }, [phase, paused, k])
  useEffect(() => {
    if (phase === 'run' && left <= 0) { beep(1); next() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'run' || (e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'ArrowRight') next()
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (phase === 'setup') {
    return (
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <p className="muted" style={{ margin: 0 }}>{t('cls.dictHint')}</p>
        <div>
          <div className="muted small" style={{ marginBottom: 6 }}>{t('cls.sections')}</div>
          <div className="chips">
            {sections.map((s) => (
              <button key={s} className={`chip ${secs.includes(s) ? 'on' : ''}`} onClick={() => setSecs(secs.includes(s) ? secs.filter((x) => x !== s) : [...secs, s])}>{t(`section.${s}`)}</button>
            ))}
          </div>
        </div>
        <div className="chips" style={{ alignItems: 'center' }}>
          <span className="muted small">{t('cls.level')}:</span>
          {(['easy', 'medium', 'hard'] as Level[]).map((l) => <button key={l} className={`chip ${level === l ? 'on' : ''}`} onClick={() => setLevel(l)}>{t(`level.${l}`)}</button>)}
        </div>
        <div className="chips" style={{ alignItems: 'center' }}>
          <span className="muted small">{t('cls.count')}:</span>
          {[5, 8, 10, 12, 15].map((n) => <button key={n} className={`chip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n}</button>)}
        </div>
        <div className="chips" style={{ alignItems: 'center' }}>
          <span className="muted small">{t('cls.perTask')}:</span>
          {[30, 45, 60, 90, 120].map((n) => <button key={n} className={`chip ${per === n ? 'on' : ''}`} onClick={() => setPer(n)}>{n} {t('cls.sec')}</button>)}
        </div>
        <div><button className="btn btn-primary" onClick={start} disabled={!available}>▶ {t('cls.dictStart')}</button>
          {!available && <span className="muted small" style={{ marginLeft: 10 }}>{t('cls.noTasks')}</span>}</div>
      </div>
    )
  }

  const p = tasks[k]
  return (
    <div ref={box} className="cls-stage cls-dict">
      <div className="chips" style={{ justifyContent: 'space-between', width: '100%' }}>
        <b>{phase === 'run' ? `${t('cls.task')} ${k + 1} / ${tasks.length}` : t('cls.answers')}</b>
        <span style={{ display: 'flex', gap: 6 }}>
          <FullscreenButton target={box} />
          <button className="btn btn-sm" onClick={() => setPhase('setup')}>✕</button>
        </span>
      </div>
      {phase === 'run' && p && (
        <>
          <div className="cls-dict-bar"><i style={{ width: `${(left / per) * 100}%` }} /></div>
          <div className="cls-dict-task fade-in" key={k}>
            <div className="cls-dict-num">{k + 1}</div>
            <p>{p.text[lang]}</p>
            {p.tex && <Tex tex={p.tex} block />}
          </div>
          <div className="chips" style={{ justifyContent: 'center' }}>
            <span className="cls-dict-left">{left} {t('cls.sec')}</span>
            <button className="btn" onClick={() => setPaused(!paused)}>{paused ? `▶ ${t('cls.start')}` : `⏸ ${t('cls.pause')}`}</button>
            <button className="btn btn-primary" onClick={next}>{k + 1 < tasks.length ? `${t('cls.next')} →` : `✓ ${t('cls.answers')}`}</button>
          </div>
        </>
      )}
      {phase === 'answers' && (
        <ol className="cls-dict-answers">
          {tasks.map((q, i) => (
            <li key={i}><span className="muted small">{q.text[lang]} {q.tex && <Tex tex={q.tex} />}</span><b> → <Tex tex={q.answer} /></b></li>
          ))}
        </ol>
      )}
    </div>
  )
}
