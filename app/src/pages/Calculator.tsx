import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { AnalyzeTab } from '../components/calc/AnalyzeTab'
import { GraphTab } from '../components/calc/GraphTab'
import { SolverTab } from '../components/calc/SolverTab'
import { StatsTab } from '../components/calc/StatsTab'
import { TriangleTab } from '../components/calc/TriangleTab'
import { Steps } from '../components/Steps'
import { Tex } from '../components/Tex'
import { formulaById, formulas } from '../data/formulas'
import type { Lang } from '../i18n'
import { solveFormula, type SolveResult } from '../lib/solver'
import { useStore } from '../lib/store'

const tabs = ['solve', 'graph', 'analyze', 'triangle', 'stats', 'formula'] as const
type Tab = (typeof tabs)[number]
const icons: Record<Tab, string> = { solve: '✎', graph: '📈', analyze: '𝑓', triangle: '△', stats: 'Σ', formula: '⚙' }
const calcFormulas = formulas.filter((f) => f.calc)

/** Formula calculator: fill the known values, leave the unknown empty. */
function FormulaTab({ fid, pick }: { fid: string | null; pick: (id: string) => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const { addSolved } = useStore()
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<SolveResult | null>(null)
  const formula = formulaById(fid ?? '') ?? calcFormulas[0]
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card card-dashed" style={{ display: 'grid', gap: 12 }}>
        <label className="small muted" htmlFor="formula-pick">{t('calc.pickFormula')}</label>
        <select id="formula-pick" className="input" style={{ width: '100%' }} value={formula.id}
          onChange={(e) => { setValues({}); setResult(null); pick(e.target.value) }}>
          {calcFormulas.map((f) => <option key={f.id} value={f.id}>{f.title[lang]}</option>)}
        </select>
        <div className="calc-screen" style={{ color: 'var(--space-ink)', fontSize: 22, textAlign: 'center' }}><Tex tex={formula.tex} /></div>
        <p className="muted small" style={{ margin: 0 }}>{t('calc.leaveEmpty')}</p>
        <form style={{ display: 'grid', gap: 10 }} onSubmit={(e) => {
          e.preventDefault()
          const c = formula.calc!
          const r = solveFormula(c.eq, c.vars, values, c.positive)
          setResult(r)
          if (!('error' in r)) addSolved()
        }}>
          {formula.calc!.vars.map((v) => (
            <div className="var-row" key={v.name}>
              <label htmlFor={`v-${v.name}`}><Tex tex={v.tex} /> <span className="muted small">{v.label[lang]}</span></label>
              <input id={`v-${v.name}`} className="input" inputMode="decimal" value={values[v.name] ?? ''} placeholder="?"
                onChange={(e) => { setValues({ ...values, [v.name]: e.target.value }); if (result && 'error' in result) setResult(null) }} />
            </div>
          ))}
          <div><button className="btn btn-primary" type="submit">{t('calc.find')}</button></div>
        </form>
      </div>
      {result && <Steps result={result} />}
    </div>
  )
}

export function Calculator() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const fid = params.get('f')
  const tab: Tab = fid ? 'formula' : ((tabs as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'solve')
  const go = (t2: Tab) => setParams(t2 === 'formula' ? { f: calcFormulas[0].id } : t2 === 'solve' ? {} : { tab: t2 }, { replace: true })

  return (
    <div className="page">
      <h1>{t('calc.title')}</h1>
      <div className="calc-tabs" role="tablist">
        {tabs.map((x) => (
          <button key={x} role="tab" aria-selected={tab === x} className={`calc-tab ${tab === x ? 'on' : ''}`} onClick={() => go(x)}>
            <span aria-hidden="true">{icons[x]}</span> {t(`cx.tabs.${x}`)}
          </button>
        ))}
      </div>
      {tab === 'solve' && <SolverTab />}
      {tab === 'graph' && <GraphTab />}
      {tab === 'analyze' && <AnalyzeTab />}
      {tab === 'triangle' && <TriangleTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'formula' && <FormulaTab key={fid} fid={fid} pick={(id) => setParams({ f: id }, { replace: true })} />}
    </div>
  )
}
