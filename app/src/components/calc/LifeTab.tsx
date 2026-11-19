import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lang } from '../../i18n'
import { lifeCalcs, type LifeOut } from '../../lib/calc/life'
import { Tex } from '../Tex'

/** Everyday math: pick a situation, change the numbers, see how it is counted. */
export function LifeTab() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const [id, setId] = useState(lifeCalcs[0].id)
  const calc = lifeCalcs.find((c) => c.id === id)!
  const [vals, setVals] = useState<Record<string, Record<string, string>>>({})
  const cur = vals[id] ?? Object.fromEntries(calc.fields.map((f) => [f.k, String(f.def)]))
  const nums = Object.fromEntries(calc.fields.map((f) => [f.k, Number((cur[f.k] ?? '').replace(',', '.').replace(/\s/g, ''))]))
  const out: LifeOut = calc.run(nums)

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="chips">
        {lifeCalcs.map((c) => (
          <button key={c.id} className={`chip ${c.id === id ? 'on' : ''}`} onClick={() => setId(c.id)}>
            <span aria-hidden="true">{c.icon}</span> {c.title[lang]}
          </button>
        ))}
      </div>
      <div className="card" style={{ display: 'grid', gap: 8 }}>
        {calc.fields.map((f) => (
          <div className="var-row" key={f.k}>
            <label htmlFor={`life-${f.k}`}>{f.label[lang]} {f.unit && <span className="muted small">({f.unit})</span>}</label>
            {f.options ? (
              <select id={`life-${f.k}`} className="input" value={cur[f.k]} onChange={(e) => setVals({ ...vals, [id]: { ...cur, [f.k]: e.target.value } })}>
                {f.options.map((o) => <option key={o.v} value={o.v}>{o.label[lang]}</option>)}
              </select>
            ) : (
              <input id={`life-${f.k}`} className="input" inputMode="decimal" value={cur[f.k]}
                onChange={(e) => setVals({ ...vals, [id]: { ...cur, [f.k]: e.target.value } })} />
            )}
          </div>
        ))}
      </div>
      {'error' in out ? <p className="error" role="alert">{t(out.error)}</p> : (
        <>
          <div className="steps">
            {out.steps.map((s, i) => (
              <div className="step" key={i}>
                <div style={{ minWidth: 0 }}>
                  {s.note && <div className="step-note">{t(s.note, s.params ?? {})}</div>}
                  <Tex className="step-tex" tex={s.tex} block />
                </div>
              </div>
            ))}
          </div>
          <div className="answer big-answer">{t('steps.answer')}: <Tex className="step-tex" tex={out.answer} /></div>
        </>
      )}
      <p className="muted small" style={{ margin: 0 }}>{t('life.note')}</p>
    </div>
  )
}
