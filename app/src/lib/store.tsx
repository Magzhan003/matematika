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
  /** ENT mock exams: date, score, number of questions, seconds spent. */
  ent: { date: string; score: number; total: number; sec: number }[]
  /** Spaced repetition: key ("g:gen" or "f:formula") → box 0–4 and the next due day. */
  review: Record<string, { box: number; due: string }>
  /** Days on which the task of the day was solved. */
  daily: string[]
}

const EMPTY: Progress = { xp: 0, viewed: [], solved: 0, streak: 0, lastDay: '', lessonsDone: [], tests: {}, games: {}, ent: [], review: {}, daily: [] }
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
export const dayPlus = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
/** Days until the next repetition for each box (Leitner system). */
export const INTERVALS = [1, 3, 7, 14, 30]
export const todayKey = today

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
  saveEnt: (score: number, total: number, sec: number) => void
  /** Record answers: a mistake sends the item to box 0 (tomorrow); a right answer in review moves it up. */
  recordAnswers: (items: { key: string; ok: boolean }[], fromReview?: boolean) => void
  markDaily: (xp: number) => void
  dueKeys: string[]
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
  const saveEnt = useCallback((score: number, total: number, sec: number) => {
    setP((s) => ({ ...s, xp: s.xp + Math.min(60, score * 2), ent: [...s.ent, { date: today(), score, total, sec }].slice(-30) }))
  }, [])
  const recordAnswers = useCallback((items: { key: string; ok: boolean }[], fromReview = false) => {
    setP((s) => {
      const review = { ...s.review }
      for (const { key, ok } of items) {
        const cur = review[key]
        if (!ok) review[key] = { box: 0, due: dayPlus(INTERVALS[0]) }
        else if (cur && fromReview) {
          const box = cur.box + 1
          if (box >= INTERVALS.length) delete review[key]
          else review[key] = { box, due: dayPlus(INTERVALS[box]) }
        }
      }
      return { ...s, review }
    })
  }, [])
  const markDaily = useCallback((xp: number) => {
    setP((s) => (s.daily.includes(today()) ? s : { ...s, xp: s.xp + xp, daily: [...s.daily, today()].slice(-400) }))
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
    saveEnt,
    recordAnswers,
    markDaily,
    dueKeys: Object.entries(p.review).filter(([, v]) => v.due <= today()).map(([k]) => k),
    reset,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('useStore outside StoreProvider')
  return c
}
