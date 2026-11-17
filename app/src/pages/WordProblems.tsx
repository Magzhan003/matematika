import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Steps } from '../components/Steps'
import { Tex } from '../components/Tex'
import type { Lang } from '../i18n'
import { fnOf } from '../lib/calc/tools'
import { tex, texIn } from '../lib/mathcore'
import { solveFormula } from '../lib/solver'
import { useStore } from '../lib/store'
import { scenarios, solveNumeric, subst, type Scenario } from '../lib/wordproblems'

const show = (v: number) => String(Number(v.toFixed(4))).replace('.', ',')
const showTex = (v: number) => String(Number(v.toFixed(4))).replace('.', '{,}')
const parse = (s: string) => Number(s.replace(',', '.').trim())
const evalNum = (expr: string) => fnOf(expr, 'zz')(0)
/** v1 -> v_1, 2.5 -> 2{,}5 */
const pretty = (s: string) => s.replace(/\b([a-zA-Z])(\d)\b/g, '$1_{$2}').replace(/(\d)\.(\d)/g, '$1{,}$2')
const show2 = (expr: string) => pretty(texIn(expr))
/** exact value (fractions stay fractions), decimals as a fallback */
const exact = (expr: string) => {
  try {
    return pretty(tex(expr))
  } catch {
    return showTex(evalNum(expr))
  }
}

/** Word-problem constructor: type the numbers of any problem, get a table, an equation and the solution. */
export function WordProblems() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const [sc, setSc] = useState<Scenario>(scenarios[0])
  const [unknown, setUnknown] = useState(sc.ask)
  const [vals, setVals] = useState<Record<string, string>>(() => toStrings(sc.gen(Math.random)))
  const [mine, setMine] = useState('')
  const [verdict, setVerdict] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)
  const { addSolved } = useStore()

  function toStrings(v: Record<string, number>) {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, show(x)]))
  }
  const reset = () => { setMine(''); setVerdict(null); setOpen(false) }
  const choose = (s: Scenario) => { setSc(s); setUnknown(s.ask); setVals(toStrings(s.gen(Math.random))); reset() }
  const random = () => { setVals(toStrings(sc.gen(Math.random))); reset() }

  const known = useMemo(() => {
    const k: Record<string, number> = {}
    for (const v of sc.vars) if (v.name !== unknown) k[v.name] = parse(vals[v.name] ?? '')
    return k
  }, [sc, unknown, vals])
  const bad = Object.values(known).some((x) => !Number.isFinite(x) || x <= 0)
  const value = useMemo(() => (bad ? null : solveNumeric(sc.eq, known, unknown)), [bad, sc, known, unknown])
  const u = sc.vars.find((v) => v.name === unknown)!
  const full = value === null ? null : { ...known, [unknown]: value }

  // problem text: {name} -> value with unit, the unknown -> "?"
  const parts = sc.text[lang].split(/(\{[a-z0-9]+\})/i)
  const text = parts.map((p, i) => {
    const m = p.match(/^\{([a-z0-9]+)\}$/i)
    if (!m) return <Fragment key={i}>{p}</Fragment>
    const v = sc.vars.find((x) => x.name === m[1])!
    return v.name === unknown
      ? <b key={i} className="wp-unknown">?</b>
      : <b key={i} className="wp-known">{vals[v.name] || '…'} {v.unit[lang]}</b>
  })

  const steps = useMemo(() => {
    if (bad || value === null) return null
    const r = solveFormula(sc.eq, sc.vars, Object.fromEntries(sc.vars.map((v) => [v.name, v.name === unknown ? '' : String(known[v.name])])), true)
    return 'error' in r ? r : { ...r, steps: r.steps.map((x) => ({ ...x, tex: pretty(x.tex) })) }
  }, [bad, value, sc, unknown, known])

  const cell = (expr: string) => {
    const s = subst(expr, known)
    try {
      return pretty(tex(s))
    } catch {
      return showTex(evalNum(s))
    }
  }

  const check = () => {
    const x = parse(mine)
    if (!Number.isFinite(x) || value === null) return
    const ok = Math.abs(x - value) <= Math.max(0.011, Math.abs(value) * 1e-4)
    setVerdict(ok)
    if (ok) addSolved()
  }

  const [L, R] = sc.eq.split('=')
  return (
    <div className="page" style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0 }}>{t('wp.title')}</h1>
      <p className="muted" style={{ margin: 0 }}>{t('wp.intro')}</p>

      <div className="wp-types">
        {scenarios.map((s) => (
          <button key={s.id} className={`wp-type ${sc.id === s.id ? 'on' : ''}`} onClick={() => choose(s)}>
            <span className="wp-icon" aria-hidden="true">{s.icon}</span>
            <span>{s.title[lang]}</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div className="muted small">{t('wp.fill')}</div>
        <div className="wp-vars">
          {sc.vars.map((v) => (
            <div key={v.name} className={`wp-var ${v.name === unknown ? 'is-unknown' : ''}`}>
              <label htmlFor={`wp-${v.name}`} className="small">{v.label[lang]}, {v.unit[lang]}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input id={`wp-${v.name}`} className="input" inputMode="decimal" disabled={v.name === unknown}
                  value={v.name === unknown ? '?' : vals[v.name] ?? ''} onChange={(e) => { setVals({ ...vals, [v.name]: e.target.value }); reset() }} />
                <button className={`btn btn-sm ${v.name === unknown ? 'btn-primary' : ''}`} title={t('wp.findThis')}
                  onClick={() => { if (v.name !== unknown && full) setVals({ ...vals, [unknown]: show(full[unknown]) }); setUnknown(v.name); reset() }}>
                  ?
                </button>
              </div>
            </div>
          ))}
        </div>
        <div><button className="btn" onClick={random}>🎲 {t('wp.random')}</button></div>
      </div>

      <div className="card wp-problem">
        <div className="lesson-kind">{t('wp.problem')}</div>
        <p className="lesson-text" style={{ margin: 0 }}>{text}</p>
        <p style={{ margin: 0 }}><b>{t('wp.find', { what: u.label[lang] })}</b></p>
        {bad && <p className="error" style={{ margin: 0 }}>{t('wp.needPositive')}</p>}
        {!bad && value === null && <p className="error" style={{ margin: 0 }}>{t('wp.noSolution')}</p>}
        {!bad && value !== null && (
          <>
            <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }} onSubmit={(e) => { e.preventDefault(); check() }}>
              <input className="input" style={{ maxWidth: 200 }} inputMode="decimal" value={mine} placeholder={t('pc.placeholder')}
                onChange={(e) => { setMine(e.target.value); setVerdict(null) }} aria-label={t('pc.placeholder')} />
              <button className="btn btn-primary" type="submit">{t('test.check')}</button>
              <button className="btn" type="button" onClick={() => setOpen(!open)}>{open ? t('pc.hideSolution') : t('pc.showSolution')}</button>
            </form>
            {verdict !== null && (
              <div className={verdict ? 'answer' : 'answer wrong'}>{verdict ? t('test.correct') : t('wp.tryAgain')}</div>
            )}
          </>
        )}
      </div>

      {open && full && (
        <div className="card wp-solution">
          <h3>1. {t('wp.note')}</h3>
          <ul className="wp-note">
            {sc.vars.map((v) => (
              <li key={v.name}>
                <Tex tex={v.tex} /> — {v.label[lang]}: <b>{v.name === unknown ? '?' : `${vals[v.name]} ${v.unit[lang]}`}</b>
              </li>
            ))}
          </ul>

          {sc.table && (
            <>
              <h3>2. {t('wp.table')}</h3>
              <div className="table-wrap">
                <table className="journal wp-table">
                  <thead><tr><th />{sc.table.head.map((hd, i) => <th key={i}>{hd[lang]}</th>)}</tr></thead>
                  <tbody>
                    {sc.table.rows.map((r, i) => (
                      <tr key={i}><td>{r.label[lang]}</td>{r.cells.map((c, k) => <td key={k}><Tex tex={cell(c)} /></td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <h3>{sc.table ? 3 : 2}. {t('wp.equation')}</h3>
          <div className="board"><div className="board-line"><Tex tex={show2(sc.eq)} /></div></div>
          {steps && <Steps result={steps} />}

          <h3>{sc.table ? 4 : 3}. {t('wp.checkTitle')}</h3>
          <div className="answer">
            <Tex tex={`${show2(subst(L, full, false))} = ${exact(subst(L, full))},\\quad ${show2(subst(R, full, false))} = ${exact(subst(R, full))}\\;\\checkmark`} />
          </div>
          <p style={{ margin: 0, fontSize: 18 }}><b>{t('wp.answer')}:</b> {u.label[lang]} — {show(full[unknown])} {u.unit[lang]}</p>
        </div>
      )}
    </div>
  )
}
