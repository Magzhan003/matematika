import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Quiz } from '../components/Quiz'
import { sections, type Level, type Section } from '../data/formulas'
import { buildTest, PASS_PERCENT, poolFor, testKey } from '../lib/quiz'
import { useStore } from '../lib/store'

const levels: Level[] = ['easy', 'medium', 'hard']

/** A level opens after passing the nearest lower level that actually has questions. */
export function isUnlocked(tests: Record<string, number>, scope: Section | 'all', level: Level) {
  for (let i = levels.indexOf(level) - 1; i >= 0; i--) {
    if (poolFor(scope, levels[i]).some((f) => f.level === levels[i])) {
      return (tests[testKey(scope, levels[i])] ?? 0) >= PASS_PERCENT
    }
  }
  return true
}

/** Remount for every scope/level so a fresh set of questions is built. */
export function Test() {
  const params = useParams()
  return <TestView key={`${params.scope}/${params.level}`} params={params} />
}

function TestView({ params }: { params: Readonly<Partial<Record<string, string>>> }) {
  const { t } = useTranslation()
  const { tests, saveTest } = useStore()
  const scope = (sections as string[]).includes(params.scope ?? '') ? (params.scope as Section) : 'all'
  const level = (levels as string[]).includes(params.level ?? '') ? (params.level as Level) : 'easy'
  const [questions, setQuestions] = useState(() => buildTest(scope, level))
  const [result, setResult] = useState<number | null>(null)
  const [round, setRound] = useState(0)

  const title = `${scope === 'all' ? t('test.all') : t(`section.${scope}`)} · ${t(`level.${level}`)}`
  const back = <Link className="btn" to="/lessons">{t('test.back')}</Link>

  if (!isUnlocked(tests, scope, level)) {
    return (
      <div className="page" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p>🔒 {t('test.locked', { p: PASS_PERCENT })}</p>
        {back}
      </div>
    )
  }
  if (!questions.length) {
    return (
      <div className="page" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p className="muted">{t('test.empty')}</p>
        {back}
      </div>
    )
  }

  const again = () => {
    setQuestions(buildTest(scope, level))
    setResult(null)
    setRound((r) => r + 1)
  }
  const percent = result === null ? 0 : Math.round((result / questions.length) * 100)

  return (
    <div className="page" style={{ display: 'grid', gap: 16 }}>
      <div>
        <Link to="/lessons" className="muted small">← {t('test.back')}</Link>
        <h1 style={{ margin: '4px 0 0', fontSize: 24 }}>{t('test.title')}: {title}</h1>
      </div>

      {result === null ? (
        <Quiz
          key={round}
          questions={questions}
          onFinish={(score) => {
            setResult(score)
            saveTest(testKey(scope, level), Math.round((score / questions.length) * 100), score)
          }}
        />
      ) : (
        <div className="space-panel" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
          <h2 style={{ margin: 0 }}>{t('test.result', { score: result, total: questions.length, p: percent })}</h2>
          <div className="bar" style={{ width: '100%' }}><div style={{ width: `${percent}%` }} /></div>
          <span>{percent >= PASS_PERCENT ? `🎉 ${t('test.passed')}` : t('test.notPassed', { p: PASS_PERCENT })}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{t('lessons.xp', { n: result * 2 })}</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={again}>{t('test.again')}</button>
            {back}
          </div>
        </div>
      )}
    </div>
  )
}
