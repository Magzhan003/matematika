import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exportProgress, useStore } from '../lib/store'

/** Save all progress to a file and load it back (another phone, another browser, after cleaning). */
export function Backup() {
  const { t } = useTranslation()
  const { importProgress } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const save = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([exportProgress()], { type: 'application/json' }))
    a.download = `matematika-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg({ ok: true, text: t('backup.saved') })
  }

  const load = async (f: File) => {
    try {
      const data = JSON.parse(await f.text())
      if (!window.confirm(t('backup.confirm'))) return
      setMsg(importProgress(data) ? { ok: true, text: t('backup.loaded') } : { ok: false, text: t('backup.bad') })
    } catch {
      setMsg({ ok: false, text: t('backup.bad') })
    } finally {
      if (file.current) file.current.value = ''
    }
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 10 }}>
      <h2 style={{ margin: 0 }}>💾 {t('backup.title')}</h2>
      <p className="muted" style={{ margin: 0 }}>{t('backup.intro')}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={save}>⬇ {t('backup.save')}</button>
        <button className="btn" onClick={() => file.current?.click()}>⬆ {t('backup.load')}</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
      </div>
      {msg && <div className={msg.ok ? 'answer' : 'answer wrong'} role="status">{msg.text}</div>}
    </div>
  )
}
