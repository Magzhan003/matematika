import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Math keyboard that floats over any page: it types into the last text field you used —
 * the calculator, test answers, the "find my mistake" box, or a text block on the whiteboard.
 * Keys keep the focus in that field (pointerdown is prevented), so the whiteboard text is not closed.
 */
const GROUPS: Record<string, string[]> = {
  basic: ['²', '³', 'ⁿ', '√', '∛', 'π', '°', '±', '·', '×', '÷', '−', '=', '≠', '≈', '<', '>', '≤', '≥', '∞', '(', ')', '|', '%'],
  powers: ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁻', 'ⁿ', '₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', 'ₙ', '½', '⅓', '¼', '⅔', '¾', '⅕'],
  greek: ['α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'ρ', 'σ', 'φ', 'ω', 'Δ', 'Σ', 'Ω'],
  geo: ['∠', '△', '⊥', '∥', '°', '′', '″', '⌒', '≅', '∼', '→', '↔', '⊙', '□', '▱'],
  sets: ['∈', '∉', '⊂', '∪', '∩', '∅', 'ℕ', 'ℤ', 'ℚ', 'ℝ', '⇒', '⇔', '∀', '∃', '{', '}', '[', ']', ';'],
  calc: ['sin', 'cos', 'tg', 'ctg', 'arcsin', 'arccos', 'arctg', 'log', 'ln', 'lg', 'lim', '∫', '∑', '′', 'Δx', 'dx', '→', 'f(x)'],
}

type Field = HTMLInputElement | HTMLTextAreaElement
const isField = (el: Element | null): el is Field =>
  !!el && ((el.tagName === 'TEXTAREA') || (el.tagName === 'INPUT' && ['text', 'search', '', 'number', 'tel', 'url'].includes((el as HTMLInputElement).type)))
  && !(el as Field).readOnly && !(el as Field).disabled

/** Change a React-controlled field the way typing does, so its onChange runs. */
function typeInto(el: Field, fn: (v: string, a: number, b: number) => [string, number]) {
  const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? a
  const [value, caret] = fn(el.value, a, b)
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.focus()
  try { el.setSelectionRange(caret, caret) } catch { /* number fields have no caret */ }
}

export function MathKeyboard({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [group, setGroup] = useState<keyof typeof GROUPS>('basic')
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [hasField, setHasField] = useState(false)
  const target = useRef<Field | null>(null)
  const box = useRef<HTMLDivElement>(null)

  // remember the last text field the user clicked
  useEffect(() => {
    const pick = (e: FocusEvent) => {
      const el = e.target as Element
      if (isField(el) && !box.current?.contains(el)) { target.current = el; setHasField(true) }
    }
    if (isField(document.activeElement)) { target.current = document.activeElement; setHasField(true) }
    document.addEventListener('focusin', pick)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isField(document.activeElement)) onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('focusin', pick); window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const live = () => {
    const el = target.current
    if (el && document.contains(el) && isField(el)) return el
    target.current = null
    setHasField(false)
    return null
  }
  const press = (key: string) => {
    const el = live()
    if (!el) return
    if (key === '⌫') return typeInto(el, (v, a, b) => (a !== b ? [v.slice(0, a) + v.slice(b), a] : [v.slice(0, Math.max(0, a - 1)) + v.slice(a), Math.max(0, a - 1)]))
    if (key === '←' || key === '→') {
      const a = el.selectionStart ?? 0
      const c = Math.max(0, Math.min(el.value.length, a + (key === '←' ? -1 : 1)))
      el.focus(); el.setSelectionRange(c, c)
      return
    }
    // functions get a bracket in formula fields, plain words on the whiteboard
    const text = key === '␣' ? ' ' : /^(sin|cos|tg|ctg|arcsin|arccos|arctg|log|ln|lg)$/.test(key) && el.tagName === 'INPUT' ? `${key}(` : key
    typeInto(el, (v, a, b) => [v.slice(0, a) + text + v.slice(b), a + text.length])
  }

  // drag by the header
  const drag = (e: React.PointerEvent) => {
    e.preventDefault()
    const r = box.current!.getBoundingClientRect()
    const dx = e.clientX - r.left, dy = e.clientY - r.top
    const move = (ev: PointerEvent) => setPos({
      x: Math.max(0, Math.min(window.innerWidth - r.width, ev.clientX - dx)),
      y: Math.max(0, Math.min(window.innerHeight - 60, ev.clientY - dy)),
    })
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div ref={box} className="mkbd no-print" role="dialog" aria-label={t('kbd.title')}
      style={pos ? { left: pos.x, top: pos.y, bottom: 'auto', transform: 'none' } : undefined}
      onPointerDown={(e) => { if ((e.target as HTMLElement).tagName !== 'SELECT') e.preventDefault() }}>
      <div className="mkbd-head" onPointerDown={drag}>
        <b>⌨ {t('kbd.title')}</b>
        <span className="muted small mkbd-hint">{hasField ? t('kbd.typing') : t('kbd.pick')}</span>
        <button className="mkbd-close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} aria-label={t('wb.close')}>✕</button>
      </div>
      <div className="mkbd-tabs">
        {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
          <button key={g} className={`key-tab ${g === group ? 'on' : ''}`} onClick={() => setGroup(g)}>{t(`kbd.${g}`)}</button>
        ))}
      </div>
      <div className="mkbd-keys">
        {GROUPS[group].map((k, i) => (
          <button key={k + i} className={`key ${k.length > 2 ? 'key-word' : ''}`} disabled={!hasField} onClick={() => press(k)} title={k}>
            {/* tiny raised/lowered signs are shown on a letter so they are easy to see: x², a₁ */}
            {/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻ⁿ]/.test(k) ? `x${k}` : /[₀₁₂₃₄₅₆₇₈₉ₙ]/.test(k) ? `a${k}` : k}
          </button>
        ))}
        <button className="key" disabled={!hasField} onClick={() => press('←')} aria-label="←">←</button>
        <button className="key" disabled={!hasField} onClick={() => press('→')} aria-label="→">→</button>
        <button className="key key-wide" disabled={!hasField} onClick={() => press('␣')}>{t('kbd.space')}</button>
        <button className="key key-del" disabled={!hasField} onClick={() => press('⌫')} aria-label="⌫">⌫</button>
      </div>
    </div>
  )
}
