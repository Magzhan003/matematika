import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { olympiad, type Band, type OTask, type OTopic } from '../data/olympiad'
import { useStore } from '../lib/store'

const bands: Band[] = ['5-6', '7-8', '9-11']
const topics: OTopic[] = ['logic', 'numbers', 'combi', 'algebra', 'geometry', 'text']
const KEY = 'olymp-solved'

function loadSolved(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

/** Read the first number in the typed answer: 15, -2, 0,99, 1/6, 99/100. */
export function parseAnswer(s: string): number | null {
  const m = s.replace(/\s+/g, '').replace(/,/g, '.').replace(/[−–]/g, '-').match(/-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?/)
  if (!m) return null
  const [a, b] = m[0].split('/')
  const v = b === undefined ? Number(a) : Number(a) / Number(b)
  return Number.isFinite(v) ? v : null
}

function TaskCard({ task, solved, onSolved }: { task: OTask; solved: boolean; onSolved: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'kz' ? 'kz' : 'ru'
  const [shown, setShown] = useState(0)
  const [sol, setSol] = useState(false)
  const [input, setInput] = useState('')
  const [verdict, setVerdict] = useState<'ok' | 'no' | 'nan' | null>(null)
  const check = () => {
    const v = parseAnswer(input)
    if (v === null || task.value === undefined) { setVerdict('nan'); return }
    const ok = Math.abs(v - task.value) < (Number.isInteger(task.value) ? 1e-9 : 0.006)
    setVerdict(ok ? 'ok' : 'no')
    if (ok) { setSol(true); if (!solved) onSolved() }
  }
  return (
    <article className={`card oly-card ${solved ? 'done' : ''}`} data-id={task.id}>
      <div className="oly-head">
        <span className="chip">{task.band} {t('oly.grade')}</span>
        <span className="chip">{t(`oly.topics.${task.topic}`)}</span>
        <span className="oly-stars" title={t('oly.difficulty')}>{'★'.repeat(task.stars)}{'☆'.repeat(3 - task.stars)}</span>
        {solved && <span className="oly-done">✓ {t('oly.solved')}</span>}
      </div>
      <p className="oly-text">{task.text[lang]}</p>
      {task.value !== undefined ? (
        <div className="oly-answer">
          <input value={input} onChange={(e) => { setInput(e.target.value); setVerdict(null) }} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder={t('oly.yourAnswer')} aria-label={t('oly.yourAnswer')} />
          <button className="btn" onClick={check} disabled={!input.trim()}>{t('oly.check')}</button>
          {verdict && <span className={`oly-verdict ${verdict}`}>{t(`oly.verdict.${verdict}`)}</span>}
        </div>
      ) : <p className="muted small">✍ {t('oly.proof')}</p>}
      {task.hints.slice(0, shown).map((h, i) => (
        <div key={i} className="oly-hint"><b>💡 {t('oly.hint')} {i + 1}.</b> {h[lang]}</div>
      ))}
      <div className="chips">
        {shown < task.hints.length && <button className="chip" onClick={() => setShown(shown + 1)}>💡 {shown ? t('oly.moreHint') : t('oly.showHint')}</button>}
        <button className={`chip ${sol ? 'on' : ''}`} onClick={() => setSol(!sol)}>📖 {sol ? t('oly.hideSolution') : t('oly.showSolution')}</button>
      </div>
      {sol && (
        <div className="oly-solution">
          <div><b>{t('oly.answer')}:</b> {task.answer[lang]}</div>
          <div>{task.solution[lang]}</div>
        </div>
      )}
    </article>
  )
}

/** Olympiad problems for grades 5–11: filters, hints one by one, answer check, solution. */
export function Olympiad() {
  const { t } = useTranslation()
  const { addSolved } = useStore()
  const [band, setBand] = useState<Band | 'all'>('all')
  const [topic, setTopic] = useState<OTopic | 'all'>('all')
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0)
  const [hideSolved, setHideSolved] = useState(false)
  const [solved, setSolved] = useState<string[]>(loadSolved)
  const list = useMemo(() => olympiad.filter((x) =>
    (band === 'all' || x.band === band) && (topic === 'all' || x.topic === topic) && (!stars || x.stars === stars) && (!hideSolved || !solved.includes(x.id))),
  [band, topic, stars, hideSolved, solved])
  const markSolved = (id: string) => {
    const next = [...new Set([...solved, id])]
    setSolved(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode */ }
    addSolved()
  }
  const total = olympiad.filter((x) => x.value !== undefined).length
  return (
    <div className="page">
      <h1>🏆 {t('oly.title')}</h1>
      <p className="muted">{t('oly.intro')}</p>
      <div className="card oly-filters">
        <div className="chips">
          <button className={`chip ${band === 'all' ? 'on' : ''}`} onClick={() => setBand('all')}>{t('oly.all')}</button>
          {bands.map((b) => <button key={b} className={`chip ${band === b ? 'on' : ''}`} onClick={() => setBand(b)}>{b} {t('oly.grade')}</button>)}
        </div>
        <div className="chips">
          <button className={`chip ${topic === 'all' ? 'on' : ''}`} onClick={() => setTopic('all')}>{t('oly.allTopics')}</button>
          {topics.map((x) => <button key={x} className={`chip ${topic === x ? 'on' : ''}`} onClick={() => setTopic(x)}>{t(`oly.topics.${x}`)}</button>)}
        </div>
        <div className="chips">
          {([0, 1, 2, 3] as const).map((s) => <button key={s} className={`chip ${stars === s ? 'on' : ''}`} onClick={() => setStars(s)}>{s ? '★'.repeat(s) : t('oly.anyLevel')}</button>)}
          <label className="chip"><input type="checkbox" checked={hideSolved} onChange={(e) => setHideSolved(e.target.checked)} /> {t('oly.hideSolved')}</label>
        </div>
        <div className="muted small">{t('oly.progress', { n: solved.length, total })} · {t('oly.shown', { n: list.length })}</div>
      </div>
      <div className="oly-list">
        {list.map((x) => <TaskCard key={x.id} task={x} solved={solved.includes(x.id)} onSolved={() => markSolved(x.id)} />)}
        {!list.length && <p className="muted">{t('oly.empty')}</p>}
      </div>
    </div>
  )
}
