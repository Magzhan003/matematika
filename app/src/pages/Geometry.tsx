import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { GeoLab, labIds, type LabId } from '../components/geo/GeoLab'

const icons: Record<LabId, string> = { triangle: '△', circle: '◯', polygon: '⬡', coord: '⌗', vectors: '↗', lines: '⫽' }

/** Live geometry: interactive drawings where the student drags points and sees the rules at work. */
export function Geometry() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const id = (labIds as string[]).includes(params.get('lab') ?? '') ? (params.get('lab') as LabId) : 'triangle'
  return (
    <div className="page" style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0 }}>{t('geo.title')}</h1>
      <p className="muted" style={{ margin: 0 }}>{t('geo.intro')}</p>
      <div className="calc-tabs" role="tablist">
        {labIds.map((x) => (
          <button key={x} role="tab" aria-selected={id === x} className={`calc-tab ${id === x ? 'on' : ''}`} onClick={() => setParams({ lab: x }, { replace: true })}>
            <span aria-hidden="true">{icons[x]}</span> {t(`geo.labs.${x}`)}
          </button>
        ))}
      </div>
      <div className="card"><GeoLab key={id} id={id} /></div>
    </div>
  )
}
