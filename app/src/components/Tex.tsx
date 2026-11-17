import katex from 'katex'
import { useMemo } from 'react'

export function Tex({ tex, block = false, className }: { tex: string; block?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, displayMode: block, strict: 'ignore' }),
    [tex, block],
  )
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
