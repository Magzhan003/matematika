/**
 * Check of the REAL Supabase project (not a copy): a teacher signs in, creates a class and a student,
 * the student signs in, sees the work, answers; the teacher sees the answer. Everything is deleted afterwards.
 * Usage: npx tsx scripts/smoke-live.ts <supabase-url> <publishable-key> <teacher-login> <teacher-password>
 */
import { createClient } from '@supabase/supabase-js'

const [url, key, tLogin, tPass] = process.argv.slice(2)
if (!tPass) { console.log('usage: smoke-live.ts <url> <key> <teacher-login> <teacher-password>'); process.exit(2) }
const mk = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
let bad = 0
const ok = (m: string) => console.log('  ✓', m)
const fail = (m: string, e?: unknown) => { bad++; console.log('  ✗', m, e ? String((e as { message?: string }).message ?? e) : '') }

async function main() {
  const anon = mk()
  const a = await anon.from('profiles').select('id').limit(1)
  a.error || !a.data?.length ? ok(`visitor without sign-in sees nothing (${a.error ? 'denied' : '0 rows'})`) : fail('visitor sees profiles!')
  const su = await anon.auth.signUp({ email: 'hacker@example.com', password: 'Hacker12345' })
  su.error ? ok('self sign-up is closed') : fail('self sign-up is OPEN')

  const t = mk()
  const si = await t.auth.signInWithPassword({ email: `${tLogin}@teachers.invalid`, password: tPass })
  if (si.error) { fail('teacher sign-in', si.error); return }
  ok('teacher signs in with login + password')
  const { data: prof } = await t.from('profiles').select('role, login').eq('id', si.data.user.id).single()
  prof?.role === 'teacher' ? ok(`teacher profile (${prof.login})`) : fail('teacher profile', prof)

  const cls = await t.from('classes').insert({ teacher_id: si.data.user.id, name: 'ТЕСТ (удалить)', grade: 7 }).select('id').single()
  if (cls.error) { fail('create class', cls.error); return }
  ok('teacher creates a class')
  const sLogin = 'test-' + Math.random().toString(36).slice(2, 8), sPass = 'Pw' + Math.random().toString(36).slice(2, 10)
  const cs = await t.rpc('create_student', { p_class: cls.data.id, p_name: 'Тестовый ученик', p_login: sLogin, p_password: sPass })
  if (cs.error) { fail('create student', cs.error); await t.from('classes').delete().eq('id', cls.data.id); return }
  ok('teacher creates a student account')
  const w = await t.from('works').insert({ teacher_id: si.data.user.id, class_id: cls.data.id, title: 'Тест', code: 'W03C-10L0-M2X3-2M9', variants: 2 }).select('id').single()
  w.error ? fail('give work', w.error) : ok('teacher gives a work to the class')

  const s = mk()
  const ss = await s.auth.signInWithPassword({ email: `${sLogin}@students.invalid`, password: sPass })
  if (ss.error) fail('STUDENT SIGN-IN (account made by create_student)', ss.error)
  else {
    ok('student signs in with the login from the teacher')
    const sw = await s.from('works').select('id')
    sw.data?.length === 1 ? ok('student sees the work of the class') : fail('student works', sw.error ?? sw.data)
    const other = await s.from('profiles').select('id')
    other.data?.length === 1 ? ok('student sees only own profile') : fail('student sees other profiles', other.data?.length)
    const sub = await s.from('submissions').insert({ work_id: w.data!.id, student_id: ss.data.user.id, variant: 0, ok: [true, false], minutes: 3 })
    sub.error ? fail('student answer', sub.error) : ok('student sends the answer')
    const pr = await s.from('progress').upsert({ user_id: ss.data.user.id, data: { xp: 10 } })
    pr.error ? fail('student progress', pr.error) : ok('student progress saved')
    const hack = await s.rpc('admin_create_teacher', { p_login: 'u-hack99', p_password: 'Hacker12345', p_name: '' })
    hack.error ? ok('student cannot create teacher logins') : fail('student created a teacher!')
  }
  const seen = await t.from('submissions').select('id').eq('work_id', w.data?.id ?? '')
  seen.data?.length === 1 ? ok('teacher sees the answer') : fail('teacher answers', seen.error ?? seen.data)
  const hack2 = await t.rpc('admin_create_teacher', { p_login: 'u-hack98', p_password: 'Hacker12345', p_name: '' })
  hack2.error ? ok('teacher cannot create teacher logins') : fail('teacher created a teacher!')

  // clean up
  const ds = await t.rpc('delete_student', { p_student: ss.data?.user?.id ?? (await t.from('profiles').select('id').eq('login', sLogin).single()).data?.id })
  const dc = await t.from('classes').delete().eq('id', cls.data.id)
  ds.error || dc.error ? fail('clean up', ds.error ?? dc.error) : ok('test student and class deleted')
}
main().then(() => { console.log(bad ? `${bad} problems` : 'live check passed'); process.exit(bad ? 1 : 0) }).catch((e) => { console.error(e); process.exit(1) })
