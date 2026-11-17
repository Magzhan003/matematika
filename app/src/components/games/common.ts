import { useEffect, useState } from 'react'
import type { Level } from '../../data/formulas'

export type GameResult = { score: number; text: string; xp: number }
export type GameProps = { level: Level; onDone: (r: GameResult) => void }

/** Seconds left; calls onEnd once when it reaches zero. */
export function useCountdown(seconds: number, onEnd: () => void) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    const started = Date.now()
    const id = setInterval(() => {
      const rest = Math.max(0, seconds - Math.floor((Date.now() - started) / 1000))
      setLeft(rest)
      if (rest === 0) clearInterval(id)
    }, 200)
    return () => clearInterval(id)
  }, [seconds])
  useEffect(() => {
    if (left === 0) onEnd()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])
  return left
}
