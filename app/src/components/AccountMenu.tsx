import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cloud, deviceId, DEVICE_LIMIT, errKey, signOutOthers, updateMyName, useCloud, type DeviceRow } from '../lib/cloud'
import { useRole } from '../lib/role'
import { useStore } from '../lib/store'
import { Icon } from './Icon'

const initials = (s: string) => s.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '∑'
/** Minutes since the device last reported (0 = now). */
const minutesAgo = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))

/** «Аккаунт» in the top bar: change your name, see the devices using this account, sign out. */
export function AccountMenu({ devices, overLimit, onDevicesChanged }: { devices: DeviceRow[]; overLimit: boolean; onDevicesChanged: () => void }) {
  const { t } = useTranslation()
  const { role, logout } = useRole()
  const { profile, refreshProfile } = useCloud()
  const { name: localName, setName } = useStore()
  const shown = (cloud ? profile?.full_name : localName) || ''
  const [open, setOpen] = useState(false)
  const [nm, setNm] = useState(shown)
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => { if (open) { setNm(shown); setMsg('') } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  const save = async () => {
    const v = nm.trim()
    if (!v) { setMsg(t('acc.nameEmpty')); return }
    setBusy(true); setMsg('')
    try {
      if (cloud && profile) { await updateMyName(profile.id, v); await refreshProfile() }
      setName(v)
      setMsg('✓ ' + t('acc.saved'))
    } catch (e) { setMsg(t(errKey(e))) }
    setBusy(false)
  }
  const kickOthers = async () => {
    if (!profile || !window.confirm(t('acc.othersAsk'))) return
    setBusy(true)
    try { await signOutOthers(profile.id); onDevicesChanged(); setMsg('✓ ' + t('acc.othersDone')) } catch (e) { setMsg(t(errKey(e))) }
    setBusy(false)
  }
  const me = deviceId()

  return (
    <div className="acc" ref={box}>
      <button className={`acc-btn ${overLimit ? 'warn' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="dialog" title={t('acc.title')}>
        <span className="acc-avatar">{initials(shown)}</span>
        <span className="acc-label">{t('acc.title')}</span>
        {overLimit && <span className="acc-dot" aria-label={t('acc.warnShort')}>!</span>}
      </button>
      {open && (
        <div className="acc-panel" role="dialog" aria-label={t('acc.title')}>
          <div className="acc-head">
            <span className="acc-avatar big">{initials(shown || '∑')}</span>
            <div>
              <b>{shown || t('acc.noName')}</b>
              <div className="muted small">{role === 'teacher' ? t('login.teacher') : t('login.student')}{profile?.login ? ` · ${profile.login}` : ''}</div>
            </div>
          </div>

          <label className="acc-field">
            <span>{t('acc.name')}</span>
            <span className="acc-row">
              <input className="input" value={nm} maxLength={80} onChange={(e) => { setNm(e.target.value); setMsg('') }} onKeyDown={(e) => e.key === 'Enter' && save()} />
              <button className="btn btn-primary btn-sm" onClick={save} disabled={busy || nm.trim() === shown}>{t('login.save')}</button>
            </span>
          </label>

          {cloud && (
            <div className="acc-devices">
              <div className="acc-sub"><Icon name="layers" size={16} /> {t('acc.devices', { n: devices.length })}</div>
              {overLimit && <div className="acc-warn" role="alert"><b>⚠ {t('acc.warnTitle')}</b><span>{t('acc.warnText', { n: devices.length, max: DEVICE_LIMIT })}</span></div>}
              <ul>
                {devices.map((d) => (
                  <li key={d.device_id} className={d.device_id === me ? 'me' : ''}>
                    <span>{d.label || '—'}{d.device_id === me && <em> · {t('acc.thisDevice')}</em>}</span>
                    <span className="muted small">{minutesAgo(d.last_seen) < 1 ? t('acc.now') : t('acc.minAgo', { n: minutesAgo(d.last_seen) })}</span>
                  </li>
                ))}
                {!devices.length && <li className="muted small">{t('cl.loading')}</li>}
              </ul>
              {devices.length > 1 && <button className="btn btn-sm" onClick={kickOthers} disabled={busy}>{t('acc.signOutOthers')}</button>}
            </div>
          )}

          {msg && <p className="acc-msg">{msg}</p>}
          <button className="acc-logout" onClick={() => { if (window.confirm(t('login.logoutAsk'))) logout() }}><Icon name="arrow" size={16} /> {t('login.logout')}</button>
        </div>
      )}
    </div>
  )
}

/** The warning line under the top bar when the account is open on too many devices at once. */
export function DeviceWarning({ count }: { count: number }) {
  const { t } = useTranslation()
  return (
    <div className="device-warning" role="alert">
      <b>⚠ {t('acc.warnTitle')}</b> {t('acc.warnText', { n: count, max: DEVICE_LIMIT })}
    </div>
  )
}
