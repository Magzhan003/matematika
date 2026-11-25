import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { errKey, sendReset, setNewPassword, signInStudent, signInTeacher, signUpTeacher, useCloud } from '../lib/cloud'

type Step = 'choose' | 'student' | 'teacher' | 'signup' | 'forgot' | 'message'

/** Online sign-in: a student with the login from the teacher, the teacher with e-mail (sign-up, password reset). */
export function CloudLogin() {
  const { t, i18n } = useTranslation()
  const c = useCloud()
  const [step, setStep] = useState<Step>('choose')
  const [login, setLogin] = useState(''), [email, setEmail] = useState(''), [name, setName] = useState('')
  const [pw, setPw] = useState(''), [pw2, setPw2] = useState('')
  const [err, setErr] = useState(''), [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const go = (s: Step) => { setStep(s); setErr(''); setPw(''); setPw2('') }

  const run = async (f: () => Promise<void>) => {
    setBusy(true); setErr('')
    try { await f() } catch (e) { setErr(t(errKey(e))) } finally { setBusy(false) }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (step === 'student') return run(() => signInStudent(login, pw))
    if (step === 'teacher') return run(() => signInTeacher(email, pw))
    if (step === 'forgot') return run(async () => { await sendReset(email); setMsg(t('cl.resetSent', { email })); go('message') })
    if (step === 'signup') {
      if (pw.length < 8) return setErr(t('cl.err.shortPassword'))
      if (pw !== pw2) return setErr(t('cl.mismatch'))
      return run(async () => {
        const r = await signUpTeacher(name, email, pw)
        if (r.needsConfirm) { setMsg(t('cl.confirmSent', { email })); go('message') }
      })
    }
  }

  const head = (
    <div className="login-head">
      <span className="logo-mark">∑</span>
      <div><b className="login-title">{t('app.name')}</b><div className="muted small">{t('login.subtitle')}</div></div>
      <div className="seg login-lang" role="group" aria-label="Language">
        <button type="button" className={i18n.language === 'ru' ? 'on' : ''} onClick={() => i18n.changeLanguage('ru')}>РУ</button>
        <button type="button" className={i18n.language === 'kz' ? 'on' : ''} onClick={() => i18n.changeLanguage('kz')}>ҚАЗ</button>
      </div>
    </div>
  )

  // waiting for the session / profile
  if (!c.ready || (c.session && !c.profile && !c.recovery)) {
    return <div className="login"><div className="login-card">{head}<p className="muted">⏳ {t('cl.loading')}</p>
      {c.ready && c.session && <button className="login-link" onClick={() => c.signOut()}>{t('login.logout')}</button>}</div></div>
  }

  // came from the «reset password» letter
  if (c.recovery) {
    return (
      <div className="login"><div className="login-card">{head}
        <form className="login-form" onSubmit={(e) => {
          e.preventDefault()
          if (pw.length < 8) return setErr(t('cl.err.shortPassword'))
          if (pw !== pw2) return setErr(t('cl.mismatch'))
          run(async () => { await setNewPassword(pw); c.clearRecovery() })
        }}>
          <h2>🔑 {t('cl.newPassword')}</h2>
          <label><span>{t('cl.password')}</span><input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></label>
          <label><span>{t('cl.password2')}</span><input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
          <button className="btn btn-primary" disabled={busy}>{t('login.save')}</button>
          {err && <p className="login-err" role="alert">{err}</p>}
        </form>
      </div></div>
    )
  }

  return (
    <div className="login">
      <div className="login-card">
        {head}
        {step === 'choose' && (
          <div className="login-roles">
            <button className="login-role" onClick={() => go('student')}><span>🎓</span><b>{t('login.student')}</b><small>{t('cl.studentHint')}</small></button>
            <button className="login-role" onClick={() => go('teacher')}><span>👩‍🏫</span><b>{t('login.teacher')}</b><small>{t('cl.teacherHint')}</small></button>
          </div>
        )}
        {step === 'message' && (
          <div className="login-form">
            <p className="cl-msg">✉️ {msg}</p>
            <button type="button" className="btn" onClick={() => go('teacher')}>{t('cl.toSignIn')}</button>
          </div>
        )}
        {step !== 'choose' && step !== 'message' && (
          <form className="login-form" onSubmit={submit}>
            {step === 'student' && (
              <>
                <h2>🎓 {t('login.student')}</h2>
                <label><span>{t('cl.login')}</span><input className="input" autoFocus autoCapitalize="none" autoComplete="username" spellCheck={false} value={login} onChange={(e) => setLogin(e.target.value.trim().toLowerCase())} placeholder="7a-aigerim" /></label>
                <label><span>{t('cl.password')}</span><input className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
                <button className="btn btn-primary" disabled={busy || !login || !pw}>{t('login.enter')}</button>
                <p className="muted small" style={{ margin: 0 }}>{t('cl.studentForgot')}</p>
              </>
            )}
            {step === 'teacher' && (
              <>
                <h2>👩‍🏫 {t('login.teacher')}</h2>
                <label><span>{t('cl.email')}</span><input className="input" type="email" autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label><span>{t('cl.password')}</span><input className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
                <button className="btn btn-primary" disabled={busy || !email || !pw}>{t('login.enter')}</button>
                <div className="chips">
                  <button type="button" className="login-link" onClick={() => go('signup')}>{t('cl.toSignUp')}</button>
                  <button type="button" className="login-link" onClick={() => go('forgot')}>{t('cl.forgot')}</button>
                </div>
              </>
            )}
            {step === 'signup' && (
              <>
                <h2>✍️ {t('cl.signUp')}</h2>
                <label><span>{t('cl.fullName')}</span><input className="input" autoFocus autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
                <label><span>{t('cl.email')}</span><input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label><span>{t('cl.password')}</span><input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
                <label><span>{t('cl.password2')}</span><input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
                <p className="muted small" style={{ margin: 0 }}>{t('cl.signUpNote')}</p>
                <button className="btn btn-primary" disabled={busy || !name.trim() || !email || !pw}>{t('cl.signUpBtn')}</button>
              </>
            )}
            {step === 'forgot' && (
              <>
                <h2>🔑 {t('cl.forgot')}</h2>
                <label><span>{t('cl.email')}</span><input className="input" type="email" autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <button className="btn btn-primary" disabled={busy || !email}>{t('cl.sendLink')}</button>
              </>
            )}
            {err && <p className="login-err" role="alert">{err}</p>}
            <button type="button" className="login-link" onClick={() => go(step === 'signup' || step === 'forgot' ? 'teacher' : 'choose')}>← {t('login.back')}</button>
          </form>
        )}
        <p className="muted small login-note">🔒 {t('cl.note')}</p>
      </div>
    </div>
  )
}
