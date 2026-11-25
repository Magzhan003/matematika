import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { errKey, signIn, useCloud } from '../lib/cloud'

const CONTACT = import.meta.env.VITE_SALES_CONTACT as string | undefined
const SYMBOLS = ['∑', 'π', '√', '∫', 'x²', '△', '∞', '÷', 'sin', '%', '∠', 'log']

/**
 * The site's front door: everybody signs in with a login and password —
 * teachers with the access they bought, students with the login from their teacher.
 */
export function CloudLogin() {
  const { t, i18n } = useTranslation()
  const c = useCloud()
  const [login, setLogin] = useState(''), [pw, setPw] = useState(''), [show, setShow] = useState(false)
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [help, setHelp] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || !login.trim() || !pw) return
    setBusy(true); setErr('')
    try { await signIn(login, pw) } catch (x) { setErr(t(errKey(x))) } finally { setBusy(false) }
  }
  const waiting = !c.ready || (c.session && !c.profile)
  const features = t('gate.features', { returnObjects: true }) as string[]

  return (
    <div className="gate">
      <div className="gate-bg" aria-hidden="true">
        {SYMBOLS.map((s, i) => <span key={i} style={{ left: `${(i * 37) % 95}%`, top: `${(i * 53) % 90}%`, animationDelay: `${-i * 1.7}s`, fontSize: `${28 + ((i * 13) % 40)}px` }}>{s}</span>)}
      </div>
      <div className="gate-wrap">
        <section className="gate-hero">
          <div className="gate-brand"><span className="gate-logo">∑</span><b>{t('app.name')}</b></div>
          <h1>{t('gate.title')}</h1>
          <p className="gate-lead">{t('gate.lead')}</p>
          <ul className="gate-features">{features.map((f) => <li key={f}>{f}</li>)}</ul>
        </section>

        <section className="gate-card" aria-labelledby="gate-signin">
          <div className="gate-card-top">
            <h2 id="gate-signin">{t('gate.signIn')}</h2>
            <div className="seg" role="group" aria-label="Language">
              <button type="button" className={i18n.language === 'ru' ? 'on' : ''} onClick={() => i18n.changeLanguage('ru')}>РУ</button>
              <button type="button" className={i18n.language === 'kz' ? 'on' : ''} onClick={() => i18n.changeLanguage('kz')}>ҚАЗ</button>
            </div>
          </div>
          {waiting ? (
            <div className="gate-form">
              <p className="muted">⏳ {t('cl.loading')}</p>
              {c.ready && c.session && <button type="button" className="login-link" onClick={() => c.signOut()}>{t('login.logout')}</button>}
            </div>
          ) : (
            <form className="gate-form" onSubmit={submit}>
              <label>
                <span>{t('cl.login')}</span>
                <input className="input" autoFocus autoCapitalize="none" autoComplete="username" spellCheck={false} value={login}
                  onChange={(e) => { setLogin(e.target.value.replace(/\s/g, '')); setErr('') }} placeholder="u-k7qm2x / 7a-aigerim" />
              </label>
              <label>
                <span>{t('cl.password')}</span>
                <span className="gate-pw">
                  <input className="input" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={(e) => { setPw(e.target.value); setErr('') }} />
                  <button type="button" onClick={() => setShow(!show)} aria-label={show ? t('gate.hide') : t('gate.show')} title={show ? t('gate.hide') : t('gate.show')}>{show ? '🙈' : '👁'}</button>
                </span>
              </label>
              {err && <p className="login-err" role="alert">{err}</p>}
              <button className="btn btn-primary gate-btn" disabled={busy || !login || !pw}>{busy ? `⏳ ${t('cl.loading')}` : t('login.enter')}</button>
              <button type="button" className="login-link" onClick={() => setHelp(!help)}>{t('gate.noAccess')}</button>
              {help && (
                <div className="gate-help">
                  <p>👩‍🏫 {t('gate.helpTeacher')}</p>
                  <p>🎓 {t('gate.helpStudent')}</p>
                  {CONTACT && <a className="btn" href={CONTACT} target="_blank" rel="noreferrer">💬 {t('gate.contact')}</a>}
                </div>
              )}
            </form>
          )}
          <p className="muted small gate-note">🔒 {t('gate.note')}</p>
        </section>
      </div>
    </div>
  )
}
