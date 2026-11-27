import { Fragment } from 'react'
import { Tex } from './Tex'

/** Text with inline TeX between `$…$` and **bold** parts (used by the ready-made materials). */
export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\$[^$]+\$)/g)
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith('$') && p.endsWith('$') && p.length > 1) return <Tex key={i} tex={p.slice(1, -1)} />
        return <Fragment key={i}>{p.split(/(\*\*[^*]+\*\*)/g).map((s, k) => (s.startsWith('**') ? <b key={k}>{s.slice(2, -2)}</b> : s))}</Fragment>
      })}
    </span>
  )
}
