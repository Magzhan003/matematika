import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'paper' | 'cosmos'

type Progress = {
  xp: number
  viewed: string[]
  solved: number
  streak: number
  lastDay: string
  lessonsDone: string[]
  /** Best test result in percent, keyed by "section:level". */
  tests: Record<string, number>
  /** Game records keyed by "game:level". */
  games: Record<string, number>
}

const EMPTY: Progress = { xp: 0, viewed: [], solved: 0, streak: 0, lastDay: '', lessonsDone: [], tests: {}, games: {} }
export const XP_PER_LEVEL = 100

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ }
}

const today = () => new Date().toISOString().slice(0, 10)
const yesterday = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10)

type Ctx = Progress & {
  level: number
  levelXp: number
  theme: Theme
  setTheme: (t: Theme) => void
  markViewed: (id: string) => void
  addSolved: () => void
  completeLesson: (id: string) => void
  saveTest: (key: string, percent: number, correct: number) => void
  saveGame: (key: string, score: number, lowerIsBetter: boolean, xp: number) => void
  reset: () => void
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Progress>(() => {
    const saved = read('progress', EMPTY)
    const d = today()
    if (saved.lastDay === d) return saved
    const streak = saved.lastDay === yesterday() ? saved.streak + 1 : 1
    return { ...saved, streak, lastDay: d }
  })
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return localStorage.getItem('theme') === 'cosmos' ? 'cosmos' : 'paper' } catch { return 'paper' }
  })

  useEffect(() => write('progress', p), [p])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch { /* storage unavailable */ }
  }, [theme])

  const markViewed = useCallback((id: string) => {
    setP((s) => (s.viewed.includes(id) ? s : { ...s, viewed: [...s.viewed, id], xp: s.xp + 5 }))
  }, [])
  const addSolved = useCallback(() => setP((s) => ({ ...s, solved: s.solved + 1, xp: s.xp + 10 })), [])
  const completeLesson = useCallback((id: string) => {
    setP((s) => (s.lessonsDone.includes(id) ? s : { ...s, lessonsDone: [...s.lessonsDone, id], xp: s.xp + 20 }))
  }, [])
  const saveTest = useCallback((key: string, percent: number, correct: number) => {
    setP((s) => ({ ...s, xp: s.xp + correct * 2, tests: { ...s.tests, [key]: Math.max(s.tests[key] ?? 0, percent) } }))
  }, [])
  const saveGame = useCallback((key: string, score: number, lowerIsBetter: boolean, xp: number) => {
    setP((s) => {
      const prev = s.games[key]
      const better = prev === undefined || (lowerIsBetter ? score < prev : score > prev)
      return { ...s, xp: s.xp + xp, games: better ? { ...s.games, [key]: score } : s.games }
    })
  }, [])
  const reset = useCallback(() => setP({ ...EMPTY, streak: 1, lastDay: today() }), [])

  const value: Ctx = {
    ...p,
    level: Math.floor(p.xp / XP_PER_LEVEL) + 1,
    levelXp: p.xp % XP_PER_LEVEL,
    theme,
    setTheme: setThemeState,
    markViewed,
    addSolved,
    completeLesson,
    saveTest,
    saveGame,
    reset,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('useStore outside StoreProvider')
  return c
}
