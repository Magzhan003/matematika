import { useTranslation } from 'react-i18next'
import { findMistake, type Problem } from '../lib/bank'

/** "What went wrong": shown when a wrong answer matches a typical mistake of this task type. */
export function MistakeHint({ p, picked, typed }: { p: Problem; picked?: string; typed?: string }) {
  const { t } = useTranslation()
  const m = findMistake(p, { picked, typed })
  if (!m) return null
  return (
    <div className="mistake-box" role="note">
      <b>🔎 {t('mist.title')}:</b> {t(`mist.${m.why}`)}
    </div>
  )
}
