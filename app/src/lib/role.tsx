/**
 * Who is using the app on this device: a student or the teacher.
 * The student role is remembered; the teacher role lasts only until the browser is closed
 * (sessionStorage), so the next class does not find the teacher's tools open.
 * The teacher PIN and the recovery code are stored only as salted SHA-256 hashes.
 * This keeps students out of the teacher's tools by accident — it is not protection against
 * someone who edits the browser storage, since everything lives on this computer.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cloud, useCloud } from './cloud'

export type Role = 'student' | 'teacher'
type Hashed = { salt: string; hash: string }

const ROLE = 'role', PIN = 'teacher-pin', RECOVERY = 'teacher-recovery', FAILS = 'teacher-pin-fails'

/** Pages only the teacher sees (tests and answers, the journal with marks, printing for the class). */
export const teacherOnly = ['/teacher', '/journal', '/portfolio', '/summative', '/scenario', '/worksheets', '/classroom', '/classes']
/** Pages only for an online student account. */
export const studentOnly = ['/tasks']
export const isTeacherPath = (path: string) => teacherOnly.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`))

const get = (s: Storage, k: string) => { try { return s.getItem(k) } catch { return null } }
const set = (s: Storage, k: string, v: string | null) => { try { if (v === null) s.removeItem(k); else s.setItem(k, v) } catch { /* storage blocked */ } }

async function sha256(text: string): Promise<string> {
  const subtle = (globalThis.crypto as Crypto | undefined)?.subtle as SubtleCrypto | undefined
  if (subtle) {
    const buf = await subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // fallback without WebCrypto: FNV-1a, repeated (still never stores the PIN itself)
  let h = 0x811c9dc5
  for (let round = 0; round < 1000; round++) for (const c of `${round}:${text}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16)
}
const randomHex = (n: number) => {
  const a = new Uint8Array(n)
  if (typeof (globalThis.crypto as Crypto | undefined)?.getRandomValues === 'function') crypto.getRandomValues(a); else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256)
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('')
}
async function makeHash(secret: string): Promise<Hashed> { const salt = randomHex(8); return { salt, hash: await sha256(`${salt}:${secret}`) } }
async function matches(stored: string | null, secret: string): Promise<boolean> {
  if (!stored) return false
  try { const h = JSON.parse(stored) as Hashed; return (await sha256(`${h.salt}:${secret}`)) === h.hash } catch { return false }
}
/** Recovery code like «K7QM-2XPA-9TRD»: no 0/O, 1/I to avoid mistakes when copying by hand. */
function recoveryCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const a = new Uint8Array(12)
  if (typeof (globalThis.crypto as Crypto | undefined)?.getRandomValues === 'function') crypto.getRandomValues(a); else for (let i = 0; i < 12; i++) a[i] = Math.floor(Math.random() * 256)
  const s = [...a].map((b) => abc[b % abc.length]).join('')
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`
}
const normCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

export const pinValid = (pin: string) => /^\d{4,6}$/.test(pin)

type Ctx = {
  role: Role | null
  hasPin: boolean
  enterStudent: () => void
  /** Creates the PIN (first time) and returns the recovery code to write down; sign in with enterTeacher after. */
  createPin: (pin: string) => Promise<string>
  /** Checks the PIN; after 5 wrong tries the next try is possible in 30 s. */
  enterTeacher: (pin: string) => Promise<'ok' | 'wrong' | 'wait'>
  /** A new PIN with the recovery code; returns a new recovery code or null. */
  resetPin: (code: string, pin: string) => Promise<string | null>
  logout: () => void
  waitSeconds: () => number
}
const RoleCtx = createContext<Ctx | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() =>
    get(sessionStorage, ROLE) === 'teacher' ? 'teacher' : get(localStorage, ROLE) === 'student' ? 'student' : null)
  const [hasPin, setHasPin] = useState(() => !!get(localStorage, PIN))

  const enterStudent = useCallback(() => { set(sessionStorage, ROLE, null); set(localStorage, ROLE, 'student'); setRole('student') }, [])
  const asTeacher = () => { set(sessionStorage, ROLE, 'teacher'); setRole('teacher') }

  const createPin = useCallback(async (pin: string) => {
    if (get(localStorage, PIN)) throw new Error('PIN already set')
    const code = recoveryCode()
    set(localStorage, PIN, JSON.stringify(await makeHash(pin)))
    set(localStorage, RECOVERY, JSON.stringify(await makeHash(normCode(code))))
    // no login yet: the page first shows the recovery code, then signs in with the new PIN
    setHasPin(true)
    return code
  }, [])

  const waitSeconds = useCallback(() => {
    try { const f = JSON.parse(get(localStorage, FAILS) ?? 'null') as { n: number; at: number } | null; return f && f.n >= 5 ? Math.max(0, Math.ceil((f.at + 30000 - Date.now()) / 1000)) : 0 } catch { return 0 }
  }, [])

  const enterTeacher = useCallback(async (pin: string) => {
    if (waitSeconds() > 0) return 'wait' as const
    if (await matches(get(localStorage, PIN), pin)) { set(localStorage, FAILS, null); asTeacher(); return 'ok' as const }
    let f = { n: 0, at: 0 }
    try { f = JSON.parse(get(localStorage, FAILS) ?? '{"n":0,"at":0}') } catch { /* reset */ }
    // after a pause the counter starts again
    if (f.n >= 5) f = { n: 0, at: 0 }
    set(localStorage, FAILS, JSON.stringify({ n: f.n + 1, at: Date.now() }))
    return 'wrong' as const
  }, [waitSeconds])

  const resetPin = useCallback(async (code: string, pin: string) => {
    if (!(await matches(get(localStorage, RECOVERY), normCode(code)))) return null
    const next = recoveryCode()
    set(localStorage, PIN, JSON.stringify(await makeHash(pin)))
    set(localStorage, RECOVERY, JSON.stringify(await makeHash(normCode(next))))
    set(localStorage, FAILS, null)
    return next
  }, [])

  const logout = useCallback(() => { set(sessionStorage, ROLE, null); set(localStorage, ROLE, null); setRole(null) }, [])

  // online mode: the role comes from the account's profile, signing out ends the session
  const c = useCloud()
  if (cloud) {
    const onlineRole = c.profile?.role ?? null
    return <RoleCtx.Provider value={{ role: onlineRole, hasPin, enterStudent, createPin, enterTeacher, resetPin, logout: () => { c.signOut() }, waitSeconds }}>{children}</RoleCtx.Provider>
  }
  return <RoleCtx.Provider value={{ role, hasPin, enterStudent, createPin, enterTeacher, resetPin, logout, waitSeconds }}>{children}</RoleCtx.Provider>
}

export function useRole() {
  const c = useContext(RoleCtx)
  if (!c) throw new Error('useRole outside RoleProvider')
  return c
}
