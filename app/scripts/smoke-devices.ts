/**
 * Real Supabase: the devices table works (migration 003). Usage:
 * npx tsx scripts/smoke-devices.ts <supabase-url> <publishable-key> <teacher-login> <teacher-password>
 */
import { createClient } from '@supabase/supabase-js'

const [url, key, login, pass] = process.argv.slice(2)
const c = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
let bad = 0
const ok = (m: string) => console.log('  ✓', m)
const fail = (m: string, e?: unknown) => { bad++; console.log('  ✗', m, e ? String((e as { message?: string }).message ?? e) : '') }

async function main() {
  const anon = await createClient(url, key, { auth: { persistSession: false } }).from('devices').select('*')
  anon.error || !anon.data?.length ? ok('visitor sees no devices') : fail('visitor sees devices')
  const si = await c.auth.signInWithPassword({ email: `${login}@teachers.invalid`, password: pass })
  if (si.error) { fail('sign in', si.error); return }
  const uid = si.data.user.id
  const up = await c.from('devices').upsert({ user_id: uid, device_id: 'd-smoketest-01', label: 'Test · Script', last_seen: new Date().toISOString() })
  up.error ? fail('heartbeat', up.error) : ok('heartbeat saved')
  const list = await c.from('devices').select('device_id, label, last_seen').gt('last_seen', new Date(Date.now() - 300000).toISOString())
  list.data?.some((d) => d.device_id === 'd-smoketest-01') ? ok(`active devices listed (${list.data.length})`) : fail('list', list.error ?? list.data)
  const name = await c.from('profiles').update({ full_name: 'Тестовый учитель (владелец)' }).eq('id', uid)
  name.error ? fail('change own name', name.error) : ok('own name can be changed')
  const over = await c.from('device_overuse').select('*')
  over.error ? ok('overuse list is closed for users') : fail('overuse list is open!', over.data)
  const del = await c.from('devices').delete().eq('device_id', 'd-smoketest-01')
  del.error ? fail('clean up', del.error) : ok('test device removed')
}
main().then(() => { console.log(bad ? `${bad} problems` : 'devices check passed'); process.exit(bad ? 1 : 0) })
