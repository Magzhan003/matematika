import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lang } from '../../i18n'
import { formulaPool, shuffle } from '../../lib/games'
import { Tex } from '../Tex'
import type { GameProps } from './common'

/** Shrinks the font until the formula fits the card width. */
function FitTex({ tex }: { tex: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.closest('.memory-card') as HTMLElement | null
    if (!el || !box) return
    for (let size = 12; size >= 7; size--) {
      el.style.fontSize = `${size}px`
      if (el.scrollWidth <= box.clientWidth - 8) break
    }
  }, [tex])
  return <span ref={ref} className="memory-tex" style={{ display: 'block' }}><Tex tex={tex} /></span>
}

type Card = { key: string; fid: string; face: 'title' | 'tex'; title: { ru: string; kz: string }; tex: string }

/** Match the name of a formula with the formula itself. */
export function Memory({ level, onDone }: GameProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const cards = useMemo<Card[]>(() => {
    const chosen = formulaPool(level).slice(0, 6)
    return shuffle(
      chosen.flatMap((f) => [
        { key: f.id + ':t', fid: f.id, face: 'title' as const, title: f.title, tex: f.tex },
        { key: f.id + ':f', fid: f.id, face: 'tex' as const, title: f.title, tex: f.tex },
      ]),
    )
  }, [level])
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const started = useRef(Date.now())
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (open.length !== 2) return
    const [a, b] = open
    if (cards[a].fid === cards[b].fid) {
      setMatched((m) => [...m, cards[a].fid])
      setOpen([])
    } else {
      const id = setTimeout(() => setOpen([]), 900)
      return () => clearTimeout(id)
    }
  }, [open, cards])

  useEffect(() => {
    if (matched.length && matched.length === cards.length / 2) {
      const sec = Math.round((Date.now() - started.current) / 1000)
      const id = setTimeout(() => onDone({ score: moves, text: t('games.memory.done', { moves, sec }), xp: 15 }), 500)
      return () => clearTimeout(id)
    }
  }, [matched, cards.length, moves, onDone, t])

  const click = (i: number) => {
    if (open.length === 2 || open.includes(i) || matched.includes(cards[i].fid)) return
    if (open.length === 1) setMoves((m) => m + 1)
    setOpen([...open, i])
  }
  const sec = Math.round((Date.now() - started.current) / 1000)

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="game-stats">
        <span>{t('games.moves')}: <b>{moves}</b></span>
        <span>{t('games.time')}: <b>{t('games.sec', { n: sec })}</b></span>
      </div>
      <div className="memory-grid">
        {cards.map((c, i) => {
          const shown = open.includes(i) || matched.includes(c.fid)
          const cls = matched.includes(c.fid) ? 'memory-card matched' : shown ? 'memory-card open' : 'memory-card'
          return (
            <button key={c.key} className={cls} onClick={() => click(i)} aria-label={shown ? c.title[lang] : '?'}>
              {shown ? (
                c.face === 'title' ? (
                  <span className="memory-title">{c.title[lang]}</span>
                ) : (
                  // Two-part formulas ("A,\qquad B") are stacked so they fit a small card.
                  <span style={{ display: 'grid', gap: 4 }}>
                    {c.tex.split(/,\s*\\q?quad\s*/).map((part, k) => <FitTex key={k} tex={part} />)}
                  </span>
                )
              ) : (
                <span className="memory-back">∑</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
