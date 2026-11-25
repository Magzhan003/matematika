/**
 * Online mode (Supabase). It is on only when the site is built with VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY; otherwise everything works offline as before.
 * The anon key is public by design: what each user may see is decided by the rules in supabase/schema.sql.
 */
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { decodeWork, encodeResult } from './workcode'
import { load, store, type Entry } from './journal'

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const cloud: SupabaseClient | null = URL_ && KEY ? createClient(URL_, KEY, { auth: { persistSession: true, storageKey: 'mat-auth', detectSessionInUrl: true, flowType: 'pkce' } }) : null
export const isOnline = () => cloud !== null

/** Students have no e-mail: the login becomes an address in the reserved «.invalid» zone (mail never goes there). */
export const STUDENT_DOMAIN = '@students.invalid'
export const loginToEmail = (login: string) => `${login.trim().toLowerCase()}${STUDENT_DOMAIN}`

export type Profile = { id: string; role: 'teacher' | 'student'; full_name: string; login: string | null; class_id: string | null }
export type ClassRow = { id: string; name: string; grade: number | null; created_at: string }
export type StudentRow = { id: string; full_name: string; login: string }
export type WorkRow = { id: string; class_id: string; title: string; code: string; variants: number; open: boolean; created_at: string }
export type SubmissionRow = { id: string; work_id: string; student_id: string; variant: number; ok: boolean[]; minutes: number; created_at: string }

type Ctx = {
  ready: boolean
  session: Session | null
  profile: Profile | null
  /** The user came from the «reset password» letter and must set a new one. */
  recovery: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
  clearRecovery: () => void
}
const CloudCtx = createContext<Ctx>({ ready: true, session: null, profile: null, recovery: false, refreshProfile: async () => {}, signOut: async () => {}, clearRecovery: () => {} })

export function CloudProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!cloud)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recovery, setRecovery] = useState(false)

  const fetchProfile = useCallback(async (s: Session | null) => {
    if (!cloud || !s) { setProfile(null); return }
    const { data } = await cloud.from('profiles').select('id, role, full_name, login, class_id').eq('id', s.user.id).maybeSingle()
    setProfile((data as Profile | null) ?? null)
  }, [])

  useEffect(() => {
    if (!cloud) return
    let alive = true
    cloud.auth.getSession().then(async ({ data }) => { if (!alive) return; setSession(data.session); await fetchProfile(data.session); setReady(true) })
    const { data: sub } = cloud.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      // profile request outside the auth callback (Supabase advises not to await inside it)
      setTimeout(() => { fetchProfile(s) }, 0)
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    // the next person at this computer must not see the previous student's progress
    try { localStorage.removeItem('progress') } catch { /* storage blocked */ }
    await cloud?.auth.signOut()
    setProfile(null); setSession(null)
  }, [])

  return (
    <CloudCtx.Provider value={{ ready, session, profile, recovery, refreshProfile: () => fetchProfile(session), signOut, clearRecovery: () => setRecovery(false) }}>
      {children}
    </CloudCtx.Provider>
  )
}
export const useCloud = () => useContext(CloudCtx)

/** Supabase error → a short message key for the UI. */
export function errKey(e: unknown): string {
  const m = String((e as { message?: string })?.message ?? e ?? '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'cl.err.credentials'
  if (m.includes('email not confirmed')) return 'cl.err.confirm'
  if (m.includes('already registered') || m.includes('already been registered')) return 'cl.err.exists'
  if (m.includes('login taken') || m.includes('duplicate')) return 'cl.err.loginTaken'
  if (m.includes('password') && (m.includes('short') || m.includes('at least'))) return 'cl.err.shortPassword'
  if (m.includes('rate limit') || m.includes('too many')) return 'cl.err.rate'
  if (m.includes('failed to fetch') || m.includes('network')) return 'cl.err.network'
  return 'cl.err.other'
}
const need = () => { if (!cloud) throw new Error('offline'); return cloud }
// the callers cast the result to the row type they asked for
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check = (r: { data: any; error: unknown }): any => { if (r.error) throw r.error; return r.data }

// ---------- auth ----------
export async function signInStudent(login: string, password: string) { check(await need().auth.signInWithPassword({ email: loginToEmail(login), password })) }
export async function signInTeacher(email: string, password: string) { check(await need().auth.signInWithPassword({ email: email.trim(), password })) }
export async function signUpTeacher(name: string, email: string, password: string) {
  const r = check(await need().auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() }, emailRedirectTo: location.origin + location.pathname } }))
  return { needsConfirm: !r.session }
}
export async function sendReset(email: string) { check(await need().auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + location.pathname })) }
export async function setNewPassword(password: string) { check(await need().auth.updateUser({ password })) }

// ---------- progress ----------
export async function loadProgress(userId: string): Promise<Record<string, unknown> | null> {
  const r = await need().from('progress').select('data').eq('user_id', userId).maybeSingle()
  return (check(r) as { data: Record<string, unknown> } | null)?.data ?? null
}
export async function saveProgress(userId: string, data: unknown) {
  check(await need().from('progress').upsert({ user_id: userId, data, updated_at: new Date().toISOString() }))
}

// ---------- teacher: classes and students ----------
export async function listClasses(): Promise<ClassRow[]> {
  return check(await need().from('classes').select('id, name, grade, created_at').order('created_at')) as ClassRow[]
}
export async function createClass(teacherId: string, name: string, grade: number | null) {
  return check(await need().from('classes').insert({ teacher_id: teacherId, name: name.trim(), grade }).select('id').single()) as { id: string }
}
export async function deleteClass(id: string) { check(await need().from('classes').delete().eq('id', id)) }
export async function listStudents(classId: string): Promise<StudentRow[]> {
  return check(await need().from('profiles').select('id, full_name, login').eq('class_id', classId).eq('role', 'student').order('full_name')) as StudentRow[]
}
export async function createStudent(classId: string, name: string, login: string, password: string) {
  return check(await need().rpc('create_student', { p_class: classId, p_name: name, p_login: login, p_password: password })) as string
}
export async function resetStudentPassword(id: string, password: string) { check(await need().rpc('reset_student_password', { p_student: id, p_password: password })) }
export async function deleteStudent(id: string) { check(await need().rpc('delete_student', { p_student: id })) }

// ---------- works ----------
export async function giveWork(teacherId: string, classId: string, title: string, code: string, variants: number) {
  check(await need().from('works').insert({ teacher_id: teacherId, class_id: classId, title: title.slice(0, 120), code, variants }))
}
export async function listWorks(): Promise<WorkRow[]> {
  return check(await need().from('works').select('id, class_id, title, code, variants, open, created_at').order('created_at', { ascending: false })) as WorkRow[]
}
export async function setWorkOpen(id: string, open: boolean) { check(await need().from('works').update({ open }).eq('id', id)) }
export async function mySubmissions(): Promise<SubmissionRow[]> {
  return check(await need().from('submissions').select('id, work_id, student_id, variant, ok, minutes, created_at')) as SubmissionRow[]
}
export async function submitWork(workId: string, studentId: string, variant: number, ok: boolean[], minutes: number) {
  check(await need().from('submissions').insert({ work_id: workId, student_id: studentId, variant, ok, minutes }))
}

/**
 * Teacher pages (journal, portfolio): load answers from the database on opening.
 * Returns a version number (changes after each load) and the teacher's works from the database.
 */
export function useCloudJournal(): { version: number; works: WorkRow[]; reload: () => void } {
  const { profile } = useCloud()
  const [version, setVersion] = useState(0)
  const [works, setWorks] = useState<WorkRow[]>([])
  const [ask, setAsk] = useState(0)
  useEffect(() => {
    if (!cloud || profile?.role !== 'teacher') return
    let alive = true
    Promise.all([pullJournal(), listWorks()]).then(([, w]) => { if (alive) { setWorks(w); setVersion((x) => x + 1) } }).catch(() => {})
    return () => { alive = false }
  }, [profile, ask])
  return { version, works, reload: () => setAsk((x) => x + 1) }
}

/**
 * Teacher: copy works and answers from the database into the local journal format,
 * so the journal, the portfolio and the CSV export work exactly as with result codes.
 */
export async function pullJournal(): Promise<number> {
  const db = need()
  const [works, subs, people] = await Promise.all([
    listWorks(),
    check(await db.from('submissions').select('work_id, student_id, variant, ok, minutes')) as Pick<SubmissionRow, 'work_id' | 'student_id' | 'variant' | 'ok' | 'minutes'>[],
    check(await db.from('profiles').select('id, full_name, login').eq('role', 'student')) as StudentRow[],
  ])
  const nameOf = new Map(people.map((p) => [p.id, p.full_name || p.login]))
  let n = 0
  for (const w of works) {
    const dw = decodeWork(w.code)
    if (!dw) continue
    const old = load(dw.seed)
    const rows = [...(old?.rows ?? [])]
    for (const s of subs.filter((x) => x.work_id === w.id)) {
      const code = encodeResult({ seed: dw.seed, variant: s.variant, ok: s.ok, minutes: s.minutes })
      if (!rows.some((r) => r.code === code)) { rows.push({ name: nameOf.get(s.student_id) ?? '—', code }); n++ }
    }
    const e: Entry = { code: w.code, title: old?.title || w.title, created: old?.created || w.created_at.slice(0, 10), rows }
    store(dw.seed, e)
  }
  return n
}
