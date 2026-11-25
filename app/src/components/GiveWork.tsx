import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { errKey, giveWork, listClasses, useCloud, type ClassRow } from '../lib/cloud'

/** Online mode: give the generated work to a class — students see it in «Мои задания», answers go to the journal. */
export function GiveWork({ code, title, variants }: { code: string; title: string; variants: number }) {
  const { t } = useTranslation()
  const { profile } = useCloud()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [cls, setCls] = useState('')
  const [state, setState] = useState<'' | 'busy' | 'done' | string>('')
  useEffect(() => { listClasses().then((cs) => { setClasses(cs); setCls(cs[0]?.id ?? '') }).catch(() => {}) }, [])
  useEffect(() => setState(''), [code])

  if (!classes.length) return <p className="small" style={{ margin: 0 }}>👥 {t('cl.noClassesYet')} <Link to="/classes">{t('nav.classes')}</Link></p>
  return (
    <div className="chips" style={{ alignItems: 'center' }}>
      <select className="input" style={{ width: 'auto' }} value={cls} onChange={(e) => { setCls(e.target.value); setState('') }} aria-label={t('cl.forClass')}>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button className="btn btn-primary btn-sm" disabled={!cls || state === 'busy' || state === 'done'}
        onClick={async () => {
          if (!profile) return
          setState('busy')
          try { await giveWork(profile.id, cls, title, code, variants); setState('done') } catch (e) { setState(t(errKey(e))) }
        }}>
        {state === 'done' ? `✓ ${t('cl.given')}` : `📤 ${t('cl.give')}`}
      </button>
      {state && state !== 'busy' && state !== 'done' && <span className="login-err small">{state}</span>}
    </div>
  )
}
