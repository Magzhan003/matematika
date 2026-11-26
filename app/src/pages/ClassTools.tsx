import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Dictation } from '../components/class/Dictation'
import { NoiseTool, PickerTool, TimerTool } from '../components/class/tools'

const tabs = ['timer', 'picker', 'noise', 'dictation'] as const
type Tab = (typeof tabs)[number]
const icons: Record<Tab, string> = { timer: '⏱', picker: '🎲', noise: '🚦', dictation: '📝' }

/** Classroom tools for the teacher: timer, random student and groups, noise light, math dictation. */
export function ClassTools() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const tab: Tab = (tabs as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'timer'
  return (
    <div className="page">
      <h1>{t('cls.title')}</h1>
      <div className="calc-tabs" role="tablist">
        {tabs.map((x) => (
          <button key={x} role="tab" aria-selected={tab === x} className={`calc-tab ${tab === x ? 'on' : ''}`} onClick={() => setParams({ tab: x }, { replace: true })}>
            <span aria-hidden="true">{icons[x]}</span> {t(`cls.tabs.${x}`)}
          </button>
        ))}
      </div>
      {tab === 'timer' && <TimerTool />}
      {tab === 'picker' && <PickerTool />}
      {tab === 'noise' && <NoiseTool />}
      {tab === 'dictation' && <Dictation />}
    </div>
  )
}
