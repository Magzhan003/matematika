import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CalcResult } from '../../lib/calc/tools'
import { Tex } from '../Tex'
import { Whiteboard } from '../Whiteboard'

type Ok = Exclude<CalcResult, { error: string }>

/**
 * "On the board": the solution in big letters for the projector, steps appear one by one
 * (or all at once), with a whiteboard to draw over it or next to it.
 */
export function ShowOnBoard({ result, title, onClose }: { result: Ok; title: string; onClose: () => void }) {
  const { t } = useTranslation()
  const [shown, setShown] = useState(1)
  const [scale, setScale] = useState(1.4)
  const [draw, setDraw] = useState(false)
  const [side, setSide] = useState(false)
  const total = result.steps.length
  const all = shown > total

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (draw || tag === 'TEXTAREA' || tag === 'INPUT') return
      if (e.key === 'Escape') { if (side) setSide(false); else onClose() }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); setShown((n) => Math.min(n + 1, total + 1)) }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); setShown((n) => Math.max(1, n - 1)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draw, side, total, onClose])

  return (
    <div className="pres calc-show" role="dialog" aria-label={t('cx.onBoard')}>
      <div className="pres-bar">
        <b className="pres-name">📺 {t('cx.onBoard')}</b>
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm" onClick={() => setShown(all ? 1 : total + 1)}>{all ? t('cx.byStep') : t('cx.allSteps')}</button>
        <button className="btn btn-sm" onClick={() => setScale((s) => Math.max(0.8, s - 0.2))} aria-label="A−">A−</button>
        <button className="btn btn-sm" onClick={() => setScale((s) => Math.min(2.6, s + 0.2))} aria-label="A+">A+</button>
        <button className="btn btn-sm" onClick={() => setDraw(true)}>✏️ {t('pres.draw')}</button>
        <button className={`btn btn-sm ${side ? 'btn-primary' : ''}`} onClick={() => setSide(!side)}>◧ {t('pres.side')}</button>
        <button className="btn btn-sm" onClick={onClose} aria-label={t('wb.close')}>✕</button>
      </div>
      <div className="pres-body">
        <div className="calc-show-body" style={{ ['--show' as string]: scale }}>
          <div className="calc-show-task"><Tex tex={title} /></div>
          <div className="steps">
            {result.steps.slice(0, Math.min(shown, total)).map((s, i) => (
              <div className="step fade-in" key={i}>
                <div style={{ minWidth: 0 }}>
                  {s.note && <div className="step-note">{t(s.note, s.params ?? {})}</div>}
                  <Tex className="step-tex" tex={s.tex} block />
                </div>
              </div>
            ))}
          </div>
          {all ? (
            <div className="answer big-answer fade-in">{t('steps.answer')}: <Tex className="step-tex" tex={result.answer} /></div>
          ) : (
            <button className="btn btn-primary" onClick={() => setShown(shown + 1)}>
              {shown < total ? `${t('cx.nextStep')} →` : `✓ ${t('cx.showAnswer')}`}
            </button>
          )}
        </div>
        {side && (
          <div className="pres-side" style={{ flexBasis: '42%' }}>
            <Whiteboard docked storageKey="whiteboard-calc" onClose={() => setSide(false)} />
          </div>
        )}
      </div>
      {draw && <Whiteboard transparent onClose={() => setDraw(false)} />}
    </div>
  )
}
