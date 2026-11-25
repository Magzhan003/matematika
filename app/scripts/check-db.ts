/**
 * Runs supabase/schema.sql on a real Postgres (PGlite) with a minimal copy of Supabase's `auth`
 * (users, identities, auth.uid(), roles anon/authenticated) and checks who can see and change what.
 * npx tsx scripts/check-db.ts
 */
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync } from 'node:fs'

const db = new PGlite({ extensions: { pgcrypto } })
let bad = 0, ok = 0
const pass = (m: string) => { ok++; console.log('  ✓', m) }
const fail = (m: string) => { bad++; console.log('  ✗', m) }

const bootstrap = `
create role anon nologin; create role authenticated nologin;
create schema auth; create schema extensions;
create table auth.users (
  instance_id uuid, id uuid primary key, aud text, role text, email text unique, encrypted_password text,
  email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz,
  confirmation_token text, recovery_token text, email_change_token_new text, email_change text);
create table auth.identities (
  id uuid primary key, user_id uuid references auth.users (id) on delete cascade, provider_id text, identity_data jsonb, provider text,
  last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz,
  email text generated always as (lower(identity_data ->> 'email')) stored);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth, extensions to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
`

async function as(id: string | null) {
  await db.exec('reset role')
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [id ?? ''])
  await db.exec(id ? 'set role authenticated' : 'set role anon')
}
async function admin() { await db.exec('reset role'); await db.query(`select set_config('request.jwt.claim.sub', '', false)`) }
async function rows<T = Record<string, unknown>>(sql: string, args: unknown[] = []) { return (await db.query<T>(sql, args)).rows }
async function denied(label: string, sql: string, args: unknown[] = []) {
  try {
    const r = await db.query(sql, args)
    // an UPDATE/DELETE hidden by RLS does not fail — it just touches no rows
    if ((r.affectedRows ?? 0) === 0 && /^\s*(update|delete)/i.test(sql)) return pass(`${label} (0 rows)`)
    fail(`${label} — was allowed`)
  } catch (e) { pass(`${label} (${(e as Error).message.split('\n')[0].slice(0, 60)})`) }
}
async function allowed(label: string, sql: string, args: unknown[] = []) {
  try { await db.query(sql, args); pass(label) } catch (e) { fail(`${label} — ${(e as Error).message}`) }
}
const expect = (label: string, cond: boolean, got?: unknown) => (cond ? pass(label) : fail(`${label} — got ${JSON.stringify(got)}`))

/** What Supabase Auth does on sign-up by e-mail: a row in auth.users (the trigger makes the teacher profile). */
async function signUpTeacher(email: string, name: string) {
  await admin()
  const [{ id }] = await rows<{ id: string }>(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role)
    values (gen_random_uuid(), $1, '{"provider":"email"}', jsonb_build_object('full_name', $2::text), 'authenticated', 'authenticated') returning id`, [email, name])
  return id
}

async function main() {
  await db.exec(bootstrap)
  await db.exec(readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8'))
  console.log('schema applied')

  console.log('teachers')
  const tA = await signUpTeacher('a@school.kz', 'Учитель А'), tB = await signUpTeacher('b@school.kz', 'Учитель Б')
  await admin()
  expect('sign-up makes a teacher profile', (await rows(`select role from profiles where id = $1`, [tA]))[0]?.role === 'teacher')

  await as(tA)
  const [{ id: c7 }] = await rows<{ id: string }>(`insert into classes (teacher_id, name, grade) values ($1, '7 А', 7) returning id`, [tA])
  await as(tB)
  const [{ id: c8 }] = await rows<{ id: string }>(`insert into classes (teacher_id, name, grade) values ($1, '8 Б', 8) returning id`, [tB])
  await denied('teacher B cannot create a class for teacher A', `insert into classes (teacher_id, name) values ($1, 'x')`, [tA])
  expect('teacher B does not see class of A', (await rows(`select * from classes where id = $1`, [c7])).length === 0)

  console.log('students')
  await as(tA)
  const [{ s1 }] = await rows<{ s1: string }>(`select create_student($1, 'Айгерим', '7a-aigerim', 'pass123') as s1`, [c7])
  const [{ s2 }] = await rows<{ s2: string }>(`select create_student($1, 'Арман', '7a-arman', 'qwe456') as s2`, [c7])
  await denied('login must be unique', `select create_student($1, 'X', '7a-aigerim', 'pass123')`, [c7])
  await denied('bad login rejected', `select create_student($1, 'X', 'Ая', 'pass123')`, [c7])
  await denied('short password rejected', `select create_student($1, 'X', '7a-xx1', '123')`, [c7])
  await as(tB)
  await denied('teacher B cannot add a student to class of A', `select create_student($1, 'X', '7a-x', 'pass123')`, [c7])
  const [{ s8 }] = await rows<{ s8: string }>(`select create_student($1, 'Дана', '8b-dana', 'pass789') as s8`, [c8])
  await admin()
  const [u] = await rows<{ email: string; okpw: boolean; conf: boolean; tok: string }>(
    `select email, encrypted_password = extensions.crypt('pass123', encrypted_password) as okpw, email_confirmed_at is not null as conf, confirmation_token as tok from auth.users where id = $1`, [s1])
  expect('student account: login e-mail, password hash, confirmed, tokens not null', u.email === '7a-aigerim@students.invalid' && u.okpw && u.conf && u.tok === '', u)
  expect('student identity row exists', (await rows(`select 1 from auth.identities where user_id = $1 and provider = 'email'`, [s1])).length === 1)
  expect('no teacher profile made for a student by the trigger', (await rows(`select role from profiles where id = $1`, [s1]))[0]?.role === 'student')

  console.log('what a student can do')
  await as(s1)
  expect('student sees only own profile', (await rows(`select id from profiles`)).length === 1)
  expect('student sees own class', (await rows(`select id from classes`)).map((r) => r.id).join() === c7)
  await denied('student cannot create a student', `select create_student($1, 'X', '7a-hack', 'pass123')`, [c7])
  await denied('student cannot create a class', `insert into classes (teacher_id, name) values ($1, 'x')`, [s1])
  await denied('student cannot change own role', `update profiles set role = 'teacher' where id = $1`, [s1])
  await denied('student cannot move to another class', `update profiles set class_id = $2 where id = $1`, [s1, c8])
  await allowed('student can change own name', `update profiles set full_name = 'Айгерим С.' where id = $1`, [s1])
  await denied('student cannot rename a classmate', `update profiles set full_name = 'x' where id = $1`, [s2])
  await allowed('student saves own progress', `insert into progress (user_id, data) values ($1, '{"xp": 50}')`, [s1])
  await allowed('student updates own progress', `update progress set data = '{"xp": 70}' where user_id = $1`, [s1])
  await denied('student cannot write progress of a classmate', `insert into progress (user_id, data) values ($1, '{"xp": 999}')`, [s2])
  await denied('student cannot reset passwords', `select reset_student_password($1, 'hacked1')`, [s2])
  await denied('student cannot delete students', `select delete_student($1)`, [s2])
  await as(s2)
  expect('classmate cannot read my progress', (await rows(`select * from progress where user_id = $1`, [s1])).length === 0)

  console.log('works and answers')
  await as(tA)
  expect('teacher A sees own students', (await rows(`select id from profiles where role = 'student'`)).length === 2)
  expect('teacher A reads progress of own student', (await rows<{ data: { xp: number } }>(`select data from progress where user_id = $1`, [s1]))[0]?.data.xp === 70)
  const [{ id: w1 }] = await rows<{ id: string }>(`insert into works (teacher_id, class_id, title, code) values ($1, $2, 'СОР 1', 'W00X-D0M3-72V2') returning id`, [tA, c7])
  const [{ id: wClosed }] = await rows<{ id: string }>(`insert into works (teacher_id, class_id, title, code, open) values ($1, $2, 'Закрыта', 'W00X-D0M3-72V3', false) returning id`, [tA, c7])
  await denied('teacher A cannot give a work to class of B', `insert into works (teacher_id, class_id, code) values ($1, $2, 'W00X-D0M3-72V2')`, [tA, c8])
  await as(tB)
  expect('teacher B does not see students of A', (await rows(`select id from profiles where id in ($1, $2)`, [s1, s2])).length === 0)
  expect('teacher B cannot read progress of A’s student', (await rows(`select * from progress where user_id = $1`, [s1])).length === 0)
  await denied('teacher B cannot give a work to class of A', `insert into works (teacher_id, class_id, code) values ($1, $2, 'W00X-D0M3-72V2')`, [tB, c7])
  await denied('teacher B cannot reset password of A’s student', `select reset_student_password($1, 'hacked1')`, [s1])
  await denied('teacher B cannot delete A’s student', `select delete_student($1)`, [s1])

  await as(s1)
  expect('student sees works of own class', (await rows(`select id from works`)).length === 2)
  await allowed('student answers an open work', `insert into submissions (work_id, student_id, variant, ok, minutes) values ($1, $2, 0, '{true,false,true}', 12)`, [w1, s1])
  await denied('student cannot answer twice', `insert into submissions (work_id, student_id, variant, ok) values ($1, $2, 0, '{true,true,true}')`, [w1, s1])
  await denied('student cannot answer a closed work', `insert into submissions (work_id, student_id, variant, ok) values ($1, $2, 0, '{true}')`, [wClosed, s1])
  await denied('student cannot answer for a classmate', `insert into submissions (work_id, student_id, variant, ok) values ($1, $2, 0, '{true}')`, [w1, s2])
  await denied('student cannot change own answer', `update submissions set ok = '{true,true,true}' where student_id = $1`, [s1])
  await denied('student cannot change the work', `update works set open = false where id = $1`, [w1])
  await as(s8)
  expect('student of another class does not see the work', (await rows(`select id from works where id = $1`, [w1])).length === 0)
  await denied('student of another class cannot answer', `insert into submissions (work_id, student_id, variant, ok) values ($1, $2, 0, '{true}')`, [w1, s8])
  await as(s2)
  expect('classmate does not see my answer', (await rows(`select * from submissions`)).length === 0)
  await as(tA)
  expect('teacher A sees the answer', (await rows(`select * from submissions where work_id = $1`, [w1])).length === 1)
  await as(tB)
  expect('teacher B does not see the answer', (await rows(`select * from submissions`)).length === 0)

  console.log('teacher manages students')
  await as(tA)
  await allowed('teacher A resets a password', `select reset_student_password($1, 'newpass1')`, [s1])
  await admin()
  expect('new password works', (await rows<{ ok: boolean }>(`select encrypted_password = extensions.crypt('newpass1', encrypted_password) as ok from auth.users where id = $1`, [s1]))[0].ok)
  await as(tA)
  await allowed('teacher A deletes a student', `select delete_student($1)`, [s2])
  await admin()
  expect('deleted student is gone everywhere', (await rows(`select 1 from auth.users where id = $1 union all select 1 from profiles where id = $1`, [s2])).length === 0)

  console.log('administrator creates teacher logins (sold accounts)')
  await admin()
  const [{ tid }] = await rows<{ tid: string }>(`select admin_create_teacher('u-k7qm2x', 'Secret123', 'Учитель 001') as tid`)
  const [tp] = await rows<{ role: string; login: string; full_name: string }>(`select role, login, full_name from profiles where id = $1`, [tid])
  expect('admin teacher: teacher profile with login', tp?.role === 'teacher' && tp.login === 'u-k7qm2x' && tp.full_name === 'Учитель 001', tp)
  const [tu] = await rows<{ email: string; ok: boolean }>(`select email, encrypted_password = extensions.crypt('Secret123', encrypted_password) as ok from auth.users where id = $1`, [tid])
  expect('admin teacher: login e-mail and password hash', tu.email === 'u-k7qm2x@teachers.invalid' && tu.ok, tu)
  await denied('admin: login must be unique', `select admin_create_teacher('u-k7qm2x', 'Secret123')`)
  await denied('admin: short password rejected', `select admin_create_teacher('u-short', '123')`)
  await allowed('admin resets a teacher password', `select admin_reset_teacher('u-k7qm2x', 'NewSecret9')`)
  expect('new teacher password works', (await rows<{ ok: boolean }>(`select encrypted_password = extensions.crypt('NewSecret9', encrypted_password) as ok from auth.users where id = $1`, [tid]))[0].ok)
  await as(tid)
  await allowed('sold teacher can create a class', `insert into classes (teacher_id, name) values ($1, '5 А')`, [tid])
  await denied('teacher cannot create teacher logins', `select admin_create_teacher('u-hack1', 'Secret123')`)
  await denied('teacher cannot reset other teachers', `select admin_reset_teacher('u-k7qm2x', 'Hacked123')`)
  await as(s1)
  await denied('student cannot create teacher logins', `select admin_create_teacher('u-hack2', 'Secret123')`)

  console.log('anonymous visitor (public key only)')
  await denied('anon cannot create teacher logins', `select admin_create_teacher('u-hack3', 'Secret123')`)
  await as(null)
  for (const t of ['profiles', 'classes', 'progress', 'works', 'submissions']) await denied(`anon cannot read ${t}`, `select * from ${t}`)
  await denied('anon cannot create students', `select create_student($1, 'X', 'anon-x', 'pass123')`, [c7])

  console.log(`\n${ok} checks passed, ${bad} failed`)
  process.exit(bad ? 1 : 0)
}
main().catch((e) => { console.error(e); process.exit(1) })
