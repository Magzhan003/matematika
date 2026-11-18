import { useTranslation } from 'react-i18next'
import type { Lang } from '../i18n'
import type { Problem } from '../lib/bank'

type Cell = string | number | { ru: string; kz: string }

/** Table or bar chart that is part of a task statement (math literacy). */
export function ProblemVisual({ p }: { p: Problem }) {
  const { i18n } = useTranslation()
  const lang = i18n.language as Lang
  const v = p.visual
  if (!v) return null
  const txt = (c: Cell) => (typeof c === 'object' ? c[lang] : String(c))

  if (v.kind === 'table') {
    return (
      <div className="table-wrap pv-table">
        <table className="journal">
          <thead><tr>{v.head.map((h, i) => <th key={i}>{txt(h)}</th>)}</tr></thead>
          <tbody>{v.rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k}>{txt(c)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    )
  }

  // vertical bar chart with values on top
  const max = Math.max(...v.values, 1)
  const W = 320, H = 170, pad = 28, bw = (W - pad * 2) / v.values.length
  return (
    <figure className="pv-bars">
      <figcaption className="small"><b>{v.title[lang]}</b>{v.unit && <span className="muted"> ({v.unit[lang]})</span>}</figcaption>
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={v.title[lang]}>
        <line x1={pad - 6} y1={H} x2={W - pad + 6} y2={H} className="pv-axis" />
        {v.values.map((val, i) => {
          const h = (val / max) * (H - 26)
          const x = pad + i * bw + bw * 0.18
          return (
            <g key={i}>
              <rect x={x} y={H - h} width={bw * 0.64} height={h} rx={4} className="pv-bar" />
              <text x={x + bw * 0.32} y={H - h - 6} textAnchor="middle" className="pv-val">{val}</text>
              <text x={x + bw * 0.32} y={H + 18} textAnchor="middle" className="pv-label">{txt(v.labels[i])}</text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
