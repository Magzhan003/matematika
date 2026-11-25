import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { pinValid, useRole } from '../lib/role'
import { useStore } from '../lib/store'

type Step = 'choose' | 'student' | 'pin' | 'create' | 'code' | 'reset'

/** Entry screen: «I am a student» (optional name) or «I am the teacher» (PIN; first time — create it). */
export function Login() {
  const { t, i18n } = useTranslation()
  const { hasPin, enterStudent, createPin, enterTeacher, resetPin, waitSeconds } = useRole()
  const { name, setName } = useStore()
  const [step, setStep] = useState<Step>('choose')
  const [nm, setNm] = useState(name)
  const [pin, setPin] = useState(''), [pin2, setPin2] = useState(''), [code, setCode] = useState('')
  const [shownCode, setShownCode] = useState('')
  const [err, setErr] = useState('')
  const [wait, setWait] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!wait) return
    const id = setInterval(() => setWait(waitSeconds()), 1000)
    return () => clearInterval(id)
  }, [wait, waitSeconds])

  const go = (s: Step) => { setStep(s); setErr(''); setPin(''); setPin2(''); setCode('') }
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 6)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setErr('')
    if (step === 'student') { setName(nm.trim()); enterStudent(); return }
    if (step === 'pin') {
      setBusy(true)
      const r = await enterTeacher(pin)
      setBusy(false)
      if (r === 'wrong') { setErr(t('login.wrongPin')); setPin('') }
      if (r === 'wait') { setWait(waitSeconds()); setErr('') }
      if (r !== 'ok' && waitSeconds() > 0) setWait(waitSeconds())
      return
    }
    if (step === 'create' || step === 'reset') {
      if (!pinValid(pin)) { setErr(t('login.pinRule')); return }
      if (pin !== pin2) { setErr(t('login.pinMismatch')); return }
      setBusy(true)
      const c = step === 'create' ? await createPin(pin) : await resetPin(code, pin)
      setBusy(false)
      if (!c) { setErr(t('login.badCode')); return }
      setShownCode(c); setStep('code')
      return
    }
    if (step === 'code') await enterTeacher(pin)
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-head">
          <span className="logo-mark">∑</span>
          <div><b className="login-title">{t('app.name')}</b><div className="muted small">{t('login.subtitle')}</div></div>
          <div className="seg login-lang" role="group" aria-label="Language">
            <button type="button" className={i18n.language === 'ru' ? 'on' : ''} onClick={() => i18n.changeLanguage('ru')}>РУ</button>
            <button type="button" className={i18n.language === 'kz' ? 'on' : ''} onClick={() => i18n.changeLanguage('kz')}>ҚАЗ</button>
          </div>
        </div>

        {step === 'choose' && (
          <div className="login-roles">
            <button className="login-role" onClick={() => go('student')}><span>🎓</span><b>{t('login.student')}</b><small>{t('login.studentHint')}</small></button>
            <button className="login-role" onClick={() => go(hasPin ? 'pin' : 'create')}><span>👩‍🏫</span><b>{t('login.teacher')}</b><small>{hasPin ? t('login.teacherHint') : t('login.teacherFirst')}</small></button>
          </div>
        )}

        {step !== 'choose' && (
          <form className="login-form" onSubmit={submit}>
            {step === 'student' && (
              <>
                <h2>🎓 {t('login.student')}</h2>
                <label><span>{t('login.yourName')}</span>
                  <input className="input" autoFocus value={nm} maxLength={60} onChange={(e) => setNm(e.target.value)} placeholder={t('rep.namePh')} />
                </label>
                <button className="btn btn-primary">{t('login.enter')}</button>
              </>
            )}
            {step === 'pin' && (
              <>
                <h2>👩‍🏫 {t('login.teacher')}</h2>
                <label><span>{t('login.pin')}</span>
                  <input className="input login-pin" autoFocus type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(e) => setPin(digits(e.target.value))} disabled={wait > 0} />
                </label>
                {wait > 0 && <p className="login-err">{t('login.wait', { n: wait })}</p>}
                <button className="btn btn-primary" disabled={pin.length < 4 || wait > 0 || busy}>{t('login.enter')}</button>
                <button type="button" className="login-link" onClick={() => go('reset')}>{t('login.forgot')}</button>
              </>
            )}
            {(step === 'create' || step === 'reset') && (
              <>
                <h2>{step === 'create' ? `🔐 ${t('login.createTitle')}` : `🔑 ${t('login.resetTitle')}`}</h2>
                <p className="muted small">{step === 'create' ? t('login.createHint') : t('login.resetHint')}</p>
                {step === 'reset' && <label><span>{t('login.code')}</span><input className="input login-code" autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX" /></label>}
                <label><span>{t('login.newPin')}</span><input className="input login-pin" autoFocus={step === 'create'} type="password" inputMode="numeric" autoComplete="new-password" value={pin} onChange={(e) => setPin(digits(e.target.value))} /></label>
                <label><span>{t('login.repeatPin')}</span><input className="input login-pin" type="password" inputMode="numeric" autoComplete="new-password" value={pin2} onChange={(e) => setPin2(digits(e.target.value))} /></label>
                <button className="btn btn-primary" disabled={busy}>{t('login.save')}</button>
              </>
            )}
            {step === 'code' && (
              <>
                <h2>📝 {t('login.codeTitle')}</h2>
                <p>{t('login.codeHint')}</p>
                <div className="login-shown-code" aria-label={t('login.code')}>{shownCode}</div>
                <button className="btn btn-primary">{t('login.codeDone')}</button>
              </>
            )}
            {err && <p className="login-err" role="alert">{err}</p>}
            {step !== 'code' && <button type="button" className="login-link" onClick={() => go('choose')}>← {t('login.back')}</button>}
          </form>
        )}
        <p className="muted small login-note">🔒 {t('login.note')}</p>
      </div>
    </div>
  )
}
