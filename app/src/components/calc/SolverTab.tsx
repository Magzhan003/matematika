import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { solveAny, similarProblem, type Action, type CalcResult } from '../../lib/calc'
import { prepare } from '../../lib/calc/tools'
import { normalize } from '../../lib/mathcore'
import { preview } from '../../lib/solver'
import { useStore } from '../../lib/store'
import { Tex } from '../Tex'
import { ResultView } from './ResultView'

const actions: Action[] = ['auto', 'diff', 'diff2', 'integrate', 'simplify', 'factor', 'expand']

const keyGroups: Record<string, [string, string][]> = {
  basic: [['7', '7'], ['8', '8'], ['9', '9'], ['÷', '/'], ['(', '('], [')', ')'], ['4', '4'], ['5', '5'], ['6', '6'], ['×', '*'], ['x²', '^2'], ['xⁿ', '^'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['−', '-'], ['√', 'sqrt('], ['π', 'pi'], ['0', '0'], [',', '.'], ['x', 'x'], ['+', '+'], ['|x|', '|'], ['⌫', '⌫']],
  fx: [['sin', 'sin('], ['cos', 'cos('], ['tg', 'tg('], ['ctg', 'ctg('], ['arcsin', 'arcsin('], ['arccos', 'arccos('], ['arctg', 'arctg('],
    ['ln', 'ln('], ['lg', 'lg('], ['log₂', 'log_2('], ['eˣ', 'e^('], ['∛', 'cbrt('], ['|x|', '|'], ['⌫', '⌫']],
  cmp: [['=', '='], ['<', '<'], ['>', '>'], ['≤', '<='], ['≥', '>='], [';', '; '], ['(', '('], [')', ')'], ['⌫', '⌫']],
  vars: [['x', 'x'], ['y', 'y'], ['z', 'z'], ['t', 't'], ['a', 'a'], ['b', 'b'], ['k', 'k'], ['n', 'n'], ['⌫', '⌫']],
}

type Ex = { s: string; a?: Action }
const examples: Record<string, Ex[]> = {
  eq: [
    { s: 'x^2 - 5x + 6 = 0' }, { s: '|x - 3| = 2x' }, { s: 'sqrt(x + 2) = x' }, { s: '2^(x+1) = 16' }, { s: 'log_2(x - 1) = 3' },
    { s: 'sin(x) = 1/2' }, { s: 'cos(2x) = -1/2' }, { s: 'x^3 - 6x^2 + 11x - 6 = 0' }, { s: 'x^4 - 5x^2 + 4 = 0' }, { s: '1/x + 1/(x-1) = 5/6' },
  ],
  ineq: [{ s: 'x^2 - 5x + 6 < 0' }, { s: '(x - 1)/(x + 2) <= 0' }, { s: '-3x + 6 >= 0' }, { s: 'x^3 >= 4x' }],
  sys: [{ s: '2x + 3y = 13; 3x - y = 3' }, { s: 'x + y + z = 6; x - y + z = 2; 2x + y - z = 1' }, { s: 'x^2 + y^2 = 25; x + y = 7' }],
  deriv: [{ s: 'x^3 * sin(x)', a: 'diff' }, { s: '(x^2 + 1)/(x - 1)', a: 'diff' }, { s: 'sqrt(x^2 + 9)', a: 'diff' }, { s: 'ln(x) * e^x', a: 'diff' }, { s: 'x^2', a: 'integrate' }],
  expr: [{ s: '(a + b)^3', a: 'expand' }, { s: 'x^2 - 9', a: 'factor' }, { s: '(x^2 - 1)/(x - 1)', a: 'simplify' }, { s: '2^10 + sqrt(144)' }],
}

export function SolverTab() {
  const { t } = useTranslation()
  const { addSolved } = useStore()
  const [input, setInput] = useState('')
  const [action, setAction] = useState<Action>('auto')
  const [result, setResult] = useState<CalcResult | null>(null)
  const [group, setGroup] = useState<keyof typeof keyGroups>('basic')
  const [exGroup, setExGroup] = useState<keyof typeof examples>('eq')
  const inputRef = useRef<HTMLInputElement>(null)
  const live = useMemo(() => {
    try {
      return preview(prepare(normalize(input)).replace(/<=/g, '≤').replace(/>=/g, '≥'))
    } catch {
      return ''
    }
  }, [input])

  const run = (s: string, a: Action) => {
    const r = solveAny(s, a)
    setResult(r)
    if (!('error' in r)) addSolved()
  }

  const insert = (s: string) => {
    const el = inputRef.current
    if (s === '⌫') {
      const end = el?.selectionStart ?? input.length
      setInput(input.slice(0, Math.max(0, end - 1)) + input.slice(end))
      return
    }
    if (!el) return setInput((v) => v + s)
    const start = el.selectionStart ?? input.length
    const end = el.selectionEnd ?? input.length
    setInput(input.slice(0, start) + s + input.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + s.length, start + s.length)
    })
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <form className="calc-screen" onSubmit={(e) => { e.preventDefault(); run(input, action) }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            className="input"
            value={input}
            placeholder={t('calc.placeholder')}
            onChange={(e) => { setInput(e.target.value); if (result && 'error' in result) setResult(null) }}
            aria-label={t('calc.placeholder')}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="btn btn-primary" style={{ height: 52 }} type="submit">{t('calc.solve')}</button>
        </div>
        <div className="calc-preview">{live && <Tex tex={live.replace(/<=/g, '\\le').replace(/>=/g, '\\ge')} />}</div>
        <div className="key-groups">
          {(Object.keys(keyGroups) as (keyof typeof keyGroups)[]).map((g) => (
            <button type="button" key={g} className={`key-tab ${group === g ? 'on' : ''}`} onClick={() => setGroup(g)}>{t(`cx.keys.${g}`)}</button>
          ))}
        </div>
        <div className="keys keys-wide">
          {keyGroups[group].map(([label, ins], i) => (
            <button type="button" className={`key ${ins === '⌫' ? 'key-del' : ''}`} key={label + i} onClick={() => insert(ins)}>{label}</button>
          ))}
        </div>
      </form>

      <div className="chips">
        {actions.map((a) => (
          <button key={a} className={`chip ${action === a ? 'on' : ''}`} onClick={() => setAction(a)}>
            {a === 'diff2' ? t('cx.actions.diff2') : t(`calc.action.${a}`)}
          </button>
        ))}
      </div>
      <p className="muted small" style={{ margin: 0 }}>{t('cx.hint')}</p>

      <div className="card card-dashed" style={{ display: 'grid', gap: 10 }}>
        <div className="chips">
          {(Object.keys(examples) as (keyof typeof examples)[]).map((g) => (
            <button key={g} className={`chip ${exGroup === g ? 'on' : ''}`} onClick={() => setExGroup(g)}>{t(`cx.ex.${g}`)}</button>
          ))}
        </div>
        <div className="chips">
          {examples[exGroup].map((ex) => (
            <button key={ex.s} className="chip ex-chip" onClick={() => { setInput(ex.s); setAction(ex.a ?? 'auto'); run(ex.s, ex.a ?? 'auto') }}>
              {ex.a === 'diff' ? `(${ex.s})′` : ex.a === 'integrate' ? `∫ ${ex.s} dx` : ex.s}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <ResultView
          result={result}
          onSimilar={input.trim() ? () => { const s = similarProblem(input); setInput(s); run(s, action) } : undefined}
        />
      )}
    </div>
  )
}
