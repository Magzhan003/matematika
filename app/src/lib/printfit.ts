/**
 * Printing: every `.sheet` (one variant, one card, one report…) starts on a new page and fits on ONE A4 page.
 *
 * The sheets are measured at the printed width ahead of time (whenever the page content changes) and each
 * gets two CSS variables that only the print styles use:
 *   --space  the writing space under each task (shrinks from 70px when a variant is long),
 *   --fit    the zoom for the whole sheet (only when even small writing space is not enough).
 * Measuring ahead matters: browsers lay the page out for printing before late `beforeprint` changes apply.
 * Sheets marked `.fit-free` (e.g. a stack of login cards) flow over several pages as before.
 */
const MM = 96 / 25.4
const PAGE_H = 265 * MM // A4 297mm − 2×12mm margins − a safety gap
const SPACE_MAX = 70, SPACE_MIN = 26 // px under each task for the answer
const MIN_ZOOM = 0.45 // smaller is unreadable: then the sheet may take two pages

function measure() {
  const root = document.documentElement
  const sheets = [...document.querySelectorAll<HTMLElement>('.sheet')]
  if (!sheets.length) return
  root.classList.add('print-measure')
  const plan = sheets.map((s) => {
    if (s.classList.contains('fit-free') || !s.getClientRects().length) return null
    const n = s.querySelectorAll('.with-space').length
    return { n, h0: s.scrollHeight } // measured with no writing space (see .print-measure in index.css)
  })
  root.classList.remove('print-measure')
  sheets.forEach((s, i) => {
    const p = plan[i]
    let space = SPACE_MAX, zoom = 1
    if (p) {
      const free = PAGE_H - p.h0
      if (p.n) space = Math.max(SPACE_MIN, Math.min(SPACE_MAX, Math.floor(free / p.n)))
      const total = p.h0 + p.n * space
      if (total > PAGE_H) zoom = PAGE_H / total
      if (zoom < MIN_ZOOM) zoom = 1
    }
    const sp = `${space}px`, z = zoom.toFixed(3)
    if (s.style.getPropertyValue('--space') !== sp) s.style.setProperty('--space', sp)
    if (s.style.getPropertyValue('--fit') !== z) s.style.setProperty('--fit', z)
  })
}

let timer = 0
const later = () => { clearTimeout(timer); timer = window.setTimeout(measure, 250) }

export function installPrintFit() {
  if (typeof window === 'undefined' || !('MutationObserver' in window)) return
  const start = () => {
    // our own style writes change only `style` attributes of sheets: ignore those to avoid a loop
    new MutationObserver((list) => { if (list.some((m) => m.type !== 'attributes' || !(m.target as Element).classList?.contains('sheet'))) later() })
      .observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'style'] })
    window.addEventListener('beforeprint', measure)
    document.fonts?.ready.then(later)
    later()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
}
