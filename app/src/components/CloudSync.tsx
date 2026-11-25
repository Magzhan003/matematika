import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadProgress, saveProgress, useCloud } from '../lib/cloud'
import { useStore } from '../lib/store'

/**
 * Keeps the progress in the account: on sign-in it takes the account's progress (a new account starts
 * clean — never the previous user's progress from this computer), then saves changes 2 s after the last one.
 * Shows a small badge while saving or when the connection is lost.
 */
export function CloudSync() {
  const { t } = useTranslation()
  const { profile } = useCloud()
  const { snapshot, replaceProgress } = useStore()
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle')
  const loadedFor = useRef<string | null>(null)
  const lastSaved = useRef('')

  // sign-in: load
  useEffect(() => {
    if (!profile) { loadedFor.current = null; return }
    if (loadedFor.current === profile.id) return
    let alive = true
    loadProgress(profile.id).then((data) => {
      if (!alive) return
      replaceProgress(data ? (data as never) : { name: profile.full_name } as never)
      loadedFor.current = profile.id
      lastSaved.current = ''
    }).catch(() => setState('error'))
    return () => { alive = false }
  }, [profile, replaceProgress])

  // changes: save (debounced); `retry` re-runs it after an error
  const json = JSON.stringify(snapshot)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!profile || loadedFor.current !== profile.id || json === lastSaved.current) return
    const id = setTimeout(() => {
      setState('saving')
      saveProgress(profile.id, JSON.parse(json)).then(() => { lastSaved.current = json; setState('idle') }).catch(() => setState('error'))
    }, 2000)
    return () => clearTimeout(id)
  }, [json, profile, retry])

  // after an error: try again when the connection comes back, and every 15 s
  useEffect(() => {
    if (state !== 'error') return
    const again = () => setRetry((x) => x + 1)
    const id = setInterval(again, 15000)
    window.addEventListener('online', again)
    return () => { clearInterval(id); window.removeEventListener('online', again) }
  }, [state])

  if (state === 'idle') return null
  return <div className={`cloud-badge ${state}`} role="status">{state === 'saving' ? `☁️ ${t('cl.saving')}` : `⚠️ ${t('cl.offline')}`}</div>
}
