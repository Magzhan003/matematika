import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errKey, listWorks, mySubmissions, submitWork, useCloud, type SubmissionRow, type WorkRow } from '../lib/cloud'
import { decodeWork } from '../lib/workcode'
import { Solve } from './Work'

/** The same student always gets the same variant of a work, and neighbours usually get different ones. */
const variantFor = (studentId: string, workId: string, variants: number) =>
  [...(studentId + workId)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % Math.max(1, variants)

/** Student (online): works given to the class — solve, the result goes to the teacher's journal. */
export function MyTasks() {
  const { t } = useTranslation()
  const { profile } = useCloud()
  const [works, setWorks] = useState<WorkRow[]>([])
  const [subs, setSubs] = useState<SubmissionRow[]>([])
  const [err, setErr] = useState(''), [loading, setLoading] = useState(true)
  const [active, setActive] = useState<WorkRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { const [w, s] = await Promise.all([listWorks(), mySubmissions()]); setWorks(w); setSubs(s); setErr('') } catch (e) { setErr(t(errKey(e))) }
    setLoading(false)
  }, [t])
  useEffect(() => { load() }, [load])

  if (active && profile) {
    const w = decodeWork(active.code)
    const v = variantFor(profile.id, active.id, active.variants)
    if (w) return <Solve work={w} variant={v} name={profile.full_name} onExit={() => { setActive(null); load() }} send={(ok, minutes) => submitWork(active.id, profile.id, v, ok, minutes)} />
  }

  const todo = works.filter((w) => w.open && !subs.some((s) => s.work_id === w.id))
  const done = works.filter((w) => subs.some((s) => s.work_id === w.id))
  return (
    <div className="page" style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
      <h1 style={{ margin: 0 }}>{t('cl.myTasks')}</h1>
      {err && <p className="login-err">{err}</p>}
      {loading && <p className="muted">⏳ {t('cl.loading')}</p>}
      {!loading && !works.length && !err && <p className="muted">{t('cl.noTasks')}</p>}
      {todo.map((w) => (
        <div key={w.id} className="card jr-item">
          <div style={{ display: 'grid', gap: 2 }}><b>{w.title || t('jr.untitled')}</b><span className="muted small">{w.created_at.slice(0, 10)} · {t('teach.variant', { n: variantFor(profile?.id ?? '', w.id, w.variants) + 1 })}</span></div>
          <button className="btn btn-primary" onClick={() => setActive(w)} disabled={!decodeWork(w.code)}>✏️ {t('cl.solve')}</button>
        </div>
      ))}
      {done.length > 0 && <h2 style={{ fontSize: 18, margin: '8px 0 0' }}>{t('cl.doneTasks')}</h2>}
      {done.map((w) => {
        const s = subs.find((x) => x.work_id === w.id)!
        const right = s.ok.filter(Boolean).length
        return (
          <div key={w.id} className="card jr-item">
            <div style={{ display: 'grid', gap: 2 }}><b>{w.title || t('jr.untitled')}</b><span className="muted small">{s.created_at.slice(0, 10)}</span></div>
            <b>{right} / {s.ok.length} · {Math.round((right / s.ok.length) * 100)}%</b>
          </div>
        )
      })}
      <div><button className="chip" onClick={load}>🔄 {t('cl.refresh')}</button></div>
    </div>
  )
}
