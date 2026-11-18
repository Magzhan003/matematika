import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { plots, type Plot } from '../../data/lesson-extras'
import type { Formula } from '../../data/formulas'
import type { Lang } from '../../i18n'
import { tex } from '../../lib/mathcore'
import { ranges } from '../../lib/quiz'
import { solveFormula } from '../../lib/solver'
import { Graph } from '../calc/Graph'
import { GeoLab, labForTopic } from '../geo/GeoLab'
import { Tex } from '../Tex'

/** Does this formula have an interactive "try it yourself" slide? */
export const hasTry = (f: Formula) => Boolean(plots[f.id] || f.calc || labForTopic[f.topic!])

const fmt = (v: number) => String(Number(v.toFixed(4))).replace('.', '{,}')
const sub = (expr: string, vals: Record<string, number>) =>
  expr.replace(/\b[a-zA-Z]\b/g, (m) => (m in vals ? `(${vals[m]})` : m))

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="slider-row try-slider">
      <span className="try-name"><Tex tex={label} /></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
      <b className="try-val"><Tex tex={fmt(value)} /></b>
    </label>
  )
}

/** Graph lab: sliders for the parameters, the graph redraws at once. */
function GraphLab({ plot }: { plot: Plot }) {
  const { i18n } = useTranslation()
  const lang = i18n.language as Lang
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(plot.params.map((p) => [p.name, p.value])))
  const fns = useMemo(() => plot.fns.map((f) => sub(f, vals)), [plot, vals])
  const shown = useMemo(() => {
    try {
      return `y = ${tex(fns[0])}`
    } catch {
      return ''
    }
  }, [fns])
  return (
    <div className="try-lab">
      <div className="try-controls">
        {plot.params.map((p) => (
          <Slider key={p.name} label={p.name} value={vals[p.name]} min={p.min} max={p.max} step={p.step}
            onChange={(v) => setVals({ ...vals, [p.name]: v })} />
        ))}
        {shown && <div className="board try-now"><Tex tex={shown} /></div>}
        <p className="muted small" style={{ margin: 0 }}>{plot.note[lang]}</p>
      </div>
      <Graph fns={fns} height={300} labels={plot.fns} fixedView={plot.view ?? [-8, 8, -7, 7]} />
    </div>
  )
}

/** Formula lab: choose what to find, move the sliders, see the substitution and the result live. */
function FormulaLab({ f }: { f: Formula }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const c = f.calc!
  const range = (name: string): [number, number, number] => {
    const r = ranges[f.id]?.[name]
    if (!r) return [1, 20, 1]
    const [min, max, mul] = r
    return [Math.min(min, max) * mul, Math.max(min, max) * mul * (max === min ? 2 : 1), mul]
  }
  const [unknown, setUnknown] = useState(c.vars[0].name)
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(c.vars.map((v) => {
      const [min, max, step] = range(v.name)
      return [v.name, Math.round((min + (max - min) / 2) / step) * step]
    })),
  )
  const result = useMemo(() => {
    const values = Object.fromEntries(c.vars.map((v) => [v.name, v.name === unknown ? '' : String(vals[v.name])]))
    return solveFormula(c.eq, c.vars, values, c.positive)
  }, [c, unknown, vals])
  const u = c.vars.find((v) => v.name === unknown)!

  return (
    <div className="try-lab">
      <div className="try-controls">
        <div className="muted small">{t('ls.find')}</div>
        <div className="chips">
          {c.vars.map((v) => (
            <button key={v.name} className={`chip ${unknown === v.name ? 'on' : ''}`} onClick={() => setUnknown(v.name)}>
              <Tex tex={v.tex} /> — {v.label[lang]}
            </button>
          ))}
        </div>
        {c.vars.filter((v) => v.name !== unknown).map((v) => {
          const [min, max, step] = range(v.name)
          return (
            <div key={v.name} style={{ display: 'grid', gap: 2 }}>
              <span className="muted small">{v.label[lang]}</span>
              <Slider label={v.tex} value={vals[v.name]} min={min} max={max} step={step} onChange={(x) => setVals({ ...vals, [v.name]: x })} />
            </div>
          )
        })}
      </div>
      <div className="board try-board" aria-live="polite">
        <div className="board-line"><Tex tex={f.tex} /></div>
        {'error' in result ? (
          <div className="muted">{t(result.error)}</div>
        ) : (
          <>
            {result.steps.filter((s) => s.tex.replace(/\s/g, '') !== result.answer.replace(/\s/g, '')).map((s, i) => <div className="board-line" key={i}><Tex tex={s.tex} /></div>)}
            <div className="board-line try-answer">
              <Tex tex={result.answer} />
            </div>
            {result.approx && <div className="board-line"><Tex tex={`\\approx ${result.approx}`} /></div>}
            <div className="muted small">{t('ls.unknownIs', { name: u.label[lang] })}</div>
          </>
        )}
      </div>
    </div>
  )
}

export function TryIt({ f }: { f: Formula }) {
  const plot = plots[f.id]
  if (plot) return <GraphLab plot={plot} />
  if (f.calc) return <FormulaLab f={f} />
  const lab = labForTopic[f.topic!]
  return lab ? <GeoLab id={lab} /> : null
}
