import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClass, createStudent, deleteClass, deleteStudent, errKey, listClasses, listStudents, resetStudentPassword, useCloud, type ClassRow, type StudentRow } from '../lib/cloud'

const LAT: Record<string, string> = {
  а: 'a', ә: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', ң: 'n',
  о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ұ: 'u', ү: 'u', ф: 'f', х: 'h', һ: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', і: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
const translit = (s: string) => [...s.toLowerCase()].map((c) => LAT[c] ?? c).join('').replace(/[^a-z0-9]+/g, '')
/** «7 «А»» → «7a»; the login is «7a-aigerim». */
const classSlug = (name: string) => translit(name).slice(0, 6) || 'cls'
/** 8 characters without look-alikes (no 0/o, 1/l/i). */
function newPassword() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789'
  const a = new Uint8Array(8)
  crypto.getRandomValues(a)
  return [...a].map((b) => abc[b % abc.length]).join('')
}
type Card = { name: string; login: string; password: string }

/** Teacher: classes and student accounts (logins and passwords to print). */
export function Classes() {
  const { t } = useTranslation()
  const { profile } = useCloud()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [cur, setCur] = useState<string>('')
  const [students, setStudents] = useState<StudentRow[]>([])
  const [newName, setNewName] = useState(''), [newGrade, setNewGrade] = useState(7)
  const [names, setNames] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [busy, setBusy] = useState(''), [err, setErr] = useState('')

  const loadClasses = useCallback(async () => {
    try { const cs = await listClasses(); setClasses(cs); setCur((c) => c || cs[0]?.id || '') } catch (e) { setErr(t(errKey(e))) }
  }, [t])
  const loadStudents = useCallback(async (id: string) => {
    if (!id) { setStudents([]); return }
    try { setStudents(await listStudents(id)) } catch (e) { setErr(t(errKey(e))) }
  }, [t])
  useEffect(() => { loadClasses() }, [loadClasses])
  useEffect(() => { loadStudents(cur) }, [cur, loadStudents])
  const klass = classes.find((c) => c.id === cur)

  const addClass = async () => {
    if (!profile || !newName.trim()) return
    setBusy('class'); setErr('')
    try { const { id } = await createClass(profile.id, newName, newGrade); setNewName(''); await loadClasses(); setCur(id) } catch (e) { setErr(t(errKey(e))) }
    setBusy('')
  }

  const addStudents = async () => {
    if (!klass) return
    const list = names.split(/\n|;/).map((s) => s.trim()).filter(Boolean)
    if (!list.length) return
    setBusy('students'); setErr('')
    const made: Card[] = [], failed: string[] = []
    const base = classSlug(klass.name)
    for (const full of list) {
      const first = translit(full.split(/\s+/)[0]) || 'student'
      let done = false
      // the login may already be taken (a namesake): add a number
      for (let k = 0; k < 6 && !done; k++) {
        const login = `${base}-${first}${k ? k + 1 : ''}`.slice(0, 32)
        const password = newPassword()
        try { await createStudent(klass.id, full, login, password); made.push({ name: full, login, password }); done = true }
        catch (e) { if (errKey(e) !== 'cl.err.loginTaken') { failed.push(`${full}: ${t(errKey(e))}`); break } }
      }
      if (!done && !failed.some((f) => f.startsWith(full))) failed.push(`${full}: ${t('cl.err.loginTaken')}`)
    }
    setCards(made); setNames(failed.map((f) => f.split(':')[0]).join('\n'))
    if (failed.length) setErr(failed.join('; '))
    await loadStudents(klass.id)
    setBusy('')
  }

  const reset = async (s: StudentRow) => {
    if (!window.confirm(t('cl.resetAsk', { name: s.full_name }))) return
    const password = newPassword()
    try { await resetStudentPassword(s.id, password); setCards([{ name: s.full_name, login: s.login, password }]) } catch (e) { setErr(t(errKey(e))) }
  }
  const remove = async (s: StudentRow) => {
    if (!window.confirm(t('cl.deleteAsk', { name: s.full_name }))) return
    try { await deleteStudent(s.id); await loadStudents(cur) } catch (e) { setErr(t(errKey(e))) }
  }
  const removeClass = async () => {
    if (!klass || students.length || !window.confirm(t('cl.deleteClassAsk', { name: klass.name }))) return
    try { await deleteClass(klass.id); setCur(''); await loadClasses() } catch (e) { setErr(t(errKey(e))) }
  }
  const site = location.origin + location.pathname

  return (
    <div className="page">
      <div className="no-print" style={{ display: 'grid', gap: 14 }}>
        <h1 style={{ margin: 0 }}>{t('cl.classesTitle')}</h1>
        <p className="muted" style={{ margin: 0 }}>{t('cl.classesIntro')}</p>
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <div className="chips">{classes.map((c) => <button key={c.id} className={`chip ${cur === c.id ? 'on' : ''}`} onClick={() => { setCur(c.id); setCards([]) }}>{c.name}</button>)}</div>
          <div className="chips" style={{ alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: 4 }}><span className="muted small">{t('cl.newClass')}</span><input className="input" value={newName} maxLength={40} onChange={(e) => setNewName(e.target.value)} placeholder="7 «А»" /></label>
            <label style={{ display: 'grid', gap: 4 }}><span className="muted small">{t('cl.grade')}</span>
              <select className="input" value={newGrade} onChange={(e) => setNewGrade(Number(e.target.value))}>{[5, 6, 7, 8, 9, 10, 11].map((g) => <option key={g} value={g}>{g}</option>)}</select>
            </label>
            <button className="btn btn-primary" onClick={addClass} disabled={!newName.trim() || busy === 'class'}>➕ {t('cl.addClass')}</button>
          </div>
        </div>
        {err && <p className="login-err" role="alert">{err}</p>}
        {klass && (
          <section className="card" style={{ display: 'grid', gap: 12 }}>
            <div className="ep-head"><h2 style={{ margin: 0 }}>{klass.name} <span className="muted small">· {t('cl.studentsN', { n: students.length })}</span></h2>
              {!students.length && <button className="chip" onClick={removeClass}>🗑 {t('cl.deleteClass')}</button>}</div>
            {students.length > 0 && (
              <table className="sum-table cl-table">
                <thead><tr><th>№</th><th>{t('sum.student')}</th><th>{t('cl.login')}</th><th /></tr></thead>
                <tbody>{students.map((s, i) => (
                  <tr key={s.id}><td className="c">{i + 1}</td><td>{s.full_name}</td><td><code>{s.login}</code></td>
                    <td className="cl-actions"><button className="chip" onClick={() => reset(s)}>🔑 {t('cl.newPw')}</button><button className="chip" onClick={() => remove(s)} aria-label={t('cl.delete')}>🗑</button></td></tr>
                ))}</tbody>
              </table>
            )}
            <label style={{ display: 'grid', gap: 4 }}>
              <span className="muted small">{t('cl.addStudentsHint')}</span>
              <textarea className="input" rows={5} value={names} onChange={(e) => setNames(e.target.value)} placeholder={'Айгерим Сапарова\nАрман Ахметов\n…'} />
            </label>
            <div><button className="btn btn-primary" onClick={addStudents} disabled={!names.trim() || busy === 'students'}>{busy === 'students' ? `⏳ ${t('cl.creating')}` : `➕ ${t('cl.addStudents')}`}</button></div>
          </section>
        )}
        {cards.length > 0 && (
          <div className="card cl-cards-note">
            <b>⚠️ {t('cl.cardsWarn')}</b>
            <div><button className="btn btn-primary" onClick={() => window.print()}>🖨 {t('cl.printCards', { n: cards.length })}</button></div>
          </div>
        )}
      </div>
      {cards.length > 0 && (
        <section className="sheet cl-cards">
          {cards.map((c) => (
            <div key={c.login} className="cl-card">
              <b>{c.name}</b>
              <div className="small">{t('cl.site')}: {site}</div>
              <div>{t('cl.login')}: <code>{c.login}</code></div>
              <div>{t('cl.password')}: <code>{c.password}</code></div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
