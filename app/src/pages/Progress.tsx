import { useTranslation } from 'react-i18next'
import { formulas } from '../data/formulas'
import { useStore } from '../lib/store'

export function Progress() {
  const { t } = useTranslation()
  const { xp, level, streak, viewed, solved, reset } = useStore()

  const stats = [
    { label: t('progress.xp'), value: xp },
    { label: t('progress.level'), value: level },
    { label: t('progress.streak'), value: streak },
    { label: t('progress.viewed'), value: `${viewed.length} / ${formulas.length}` },
    { label: t('progress.solved'), value: solved },
  ]

  return (
    <div className="page" style={{ display: 'grid', gap: 18 }}>
      <h1 style={{ margin: 0 }}>{t('progress.title')}</h1>
      <div className="grid">
        {stats.map((s) => (
          <div key={s.label} className="space-panel">
            <div className="muted small">{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>{t('progress.byBranch')}</h2>
        {(['algebra', 'geometry'] as const).map((b) => {
          const all = formulas.filter((f) => f.branch === b)
          const done = all.filter((f) => viewed.includes(f.id)).length
          return (
            <div key={b} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t(`branch.${b}`)}</span>
                <span className="muted small">{done} / {all.length}</span>
              </div>
              <div className="bar"><div style={{ width: `${(done / all.length) * 100}%`, background: `var(--${b})` }} /></div>
            </div>
          )
        })}
      </div>

      <div>
        <button className="btn btn-sm" onClick={() => { if (window.confirm(t('progress.confirm'))) reset() }}>
          {t('progress.reset')}
        </button>
      </div>
    </div>
  )
}
