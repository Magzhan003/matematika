import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { checkSolution, type LineCheck } from '../../lib/calc/check'
import { Tex } from '../Tex'

const EXAMPLES = [
  '2x + 5 = 11\n2x = 11 + 5\n2x = 16\nx = 8',
  '3(x - 2) = 2x + 1\n3x - 2 = 2x + 1\nx = 3',
  'x^2 = 9\nx = 3',
  '-2x > 6\nx > -3',
  'sqrt(x + 2) = x\nx + 2 = x^2\nx^2 - x - 2 = 0\nx = 2, x = -1',
  '(x + 3)^2\nx^2 + 9',
  'x^2 - 5x + 6 = 0\nD = 25 - 24 = 1\nx1 = 3, x2 = 2',
]
const ICON: Record<LineCheck['status'], string> = { task: '📝', ok: '✓', warn: '⚠', bad: '✗', follow: '↳', skip: '·' }

/** A message with $…$ pieces of TeX inside. */
export function TexText({ text }: { text: string }) {
  return <>{text.split('$').map((part, i) => (i % 2 ? <Tex key={i} tex={part} /> : <span key={i}>{part}</span>))}</>
}

/** "Find my mistake": the student writes a solution line by line, every line is checked against the task. */
export function CheckTab() {
  const { t } = useTranslation()
  const [text, setText] = useState(EXAMPLES[0])
  const [res, setRes] = useState<LineCheck[] | null>(null)
  const run = (s: string) => setRes(checkSolution(s))
  const firstBad = res ? res.findIndex((l) => l.status === 'bad') : -1
  const anyWarn = res?.some((l) => l.status === 'warn')

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <p className="muted" style={{ margin: 0 }}>{t('chk.intro')}</p>
      <textarea className="input chk-input" rows={7} value={text} spellCheck={false} placeholder={t('chk.placeholder')}
        onChange={(e) => { setText(e.target.value); setRes(null) }} aria-label={t('chk.placeholder')} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => run(text)}>🔍 {t('chk.run')}</button>
        <button className="btn" onClick={() => { setText(''); setRes(null) }}>{t('wb.clear')}</button>
      </div>
      <div className="card card-dashed" style={{ display: 'grid', gap: 8 }}>
        <div className="muted small">{t('chk.examples')}</div>
        <div className="chips">
          {EXAMPLES.map((ex, i) => (
            <button key={i} className="chip ex-chip" onClick={() => { setText(ex); run(ex) }}>{ex.split('\n')[0]} …</button>
          ))}
        </div>
      </div>

      {res && (
        <>
          <div className={`chk-summary ${firstBad >= 0 ? 'bad' : anyWarn ? 'warn' : 'ok'}`} role="status">
            {firstBad >= 0 ? t('chk.summaryBad', { n: firstBad + 1 }) : anyWarn ? t('chk.summaryWarn') : t('chk.summaryOk')}
          </div>
          <ol className="chk-lines">
            {res.map((l, i) => (
              <li key={i} className={`chk-line ${l.status}`}>
                <span className="chk-icon" aria-hidden="true">{ICON[l.status]}</span>
                <div style={{ minWidth: 0 }}>
                  <Tex className="step-tex" tex={l.tex} />
                  {l.status === 'task' && <div className="chk-msg">{t('chk.task')}</div>}
                  {l.reason && <div className="chk-msg"><TexText text={t(l.reason, { ...(l.params ?? {}), hint: '' })} /></div>}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
