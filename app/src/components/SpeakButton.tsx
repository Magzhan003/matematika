import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { speak, speechSupported, texToSpeech, voiceFor, type SpeechLang } from '../lib/speech'

/** A piece of what to read: plain text or a formula in TeX. */
export type SpeakPart = string | { tex: string }

/** 🔊 button: reads the text and formulas aloud; a second press stops. */
export function SpeakButton({ parts, className = '' }: { parts: SpeakPart[]; className?: string }) {
  const { t, i18n } = useTranslation()
  const lang: SpeechLang = i18n.language === 'kz' ? 'kz' : 'ru'
  const [on, setOn] = useState(false)
  const [, setVoices] = useState(0)
  const stop = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (!speechSupported()) return
    const upd = () => setVoices((n) => n + 1)
    speechSynthesis.addEventListener?.('voiceschanged', upd)
    return () => { speechSynthesis.removeEventListener?.('voiceschanged', upd); stop.current?.() }
  }, [])
  if (!speechSupported()) return null
  const { exact } = voiceFor(lang)
  const text = parts.map((p) => (typeof p === 'string' ? p : texToSpeech(p.tex, lang))).filter(Boolean).join('. ').replace(/\.\s*\./g, '.')
  const title = lang === 'kz' && !exact ? t('speak.noKz') : on ? t('speak.stop') : t('speak.read')
  return (
    <button type="button" className={`speak-btn ${on ? 'on' : ''} ${className}`} title={title} aria-label={title} aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation()
        if (on) { stop.current?.(); setOn(false); return }
        setOn(true)
        stop.current = speak(text, lang, () => setOn(false))
      }}>
      {on ? '⏹' : '🔊'}{lang === 'kz' && !exact && <sup>ru</sup>}
    </button>
  )
}
