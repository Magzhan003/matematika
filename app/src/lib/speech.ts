/**
 * Read-aloud: formulas (TeX) are turned into words and spoken with the browser's speech synthesis.
 * Works offline with the system voices (Windows has Russian ones); Kazakh voices exist in Microsoft Edge
 * (online). Without a Kazakh voice the Russian one reads the Kazakh text.
 */
export type SpeechLang = 'ru' | 'kz'

const W = {
  ru: {
    frac: (a: string, b: string) => ` ${a} делить на ${b} `, sqrt: (x: string) => ` корень из ${x} `, root: (n: string, x: string) => ` корень степени ${n} из ${x} `,
    sq: ' в квадрате ', cube: ' в кубе ', pow: (n: string) => ` в степени ${n} `, deg: ' градусов ', abs: (x: string) => ` модуль ${x} `,
    words: {
      '\\ne': ' не равно ', '\\neq': ' не равно ', '\\le': ' меньше или равно ', '\\leq': ' меньше или равно ', '\\ge': ' больше или равно ', '\\geq': ' больше или равно ',
      '\\cdot': ' умножить на ', '\\times': ' умножить на ', '\\div': ' делить на ', '\\pm': ' плюс или минус ', '\\mp': ' минус или плюс ',
      '\\Rightarrow': ', значит, ', '\\Leftrightarrow': ' равносильно ', '\\to': ' стремится к ', '\\infty': ' бесконечность ', '\\approx': ' приблизительно равно ',
      '\\pi': ' пи ', '\\alpha': ' альфа ', '\\beta': ' бета ', '\\gamma': ' гамма ', '\\varphi': ' фи ', '\\phi': ' фи ', '\\Delta': ' дельта ', '\\lambda': ' лямбда ',
      '\\angle': ' угол ', '\\triangle': ' треугольник ', '\\parallel': ' параллельно ', '\\perp': ' перпендикулярно ', '\\in': ' принадлежит ', '\\cup': ' объединение ', '\\cap': ' пересечение ',
      '\\sin': ' синус ', '\\cos': ' косинус ', '\\operatorname{tg}': ' тангенс ', '\\operatorname{ctg}': ' котангенс ', '\\tan': ' тангенс ', '\\cot': ' котангенс ',
      '\\arcsin': ' арксинус ', '\\arccos': ' арккосинус ', '\\operatorname{arctg}': ' арктангенс ',
      '\\log': ' логарифм ', '\\ln': ' натуральный логарифм ', '\\lg': ' десятичный логарифм ', '\\int': ' интеграл ', '\\sum': ' сумма ', '\\lim': ' предел ',
      '\\mathbb{Z}': ' целые числа ', '\\mathbb{R}': ' действительные числа ', '\\mathbb{N}': ' натуральные числа ',
    } as Record<string, string>,
    sym: { '=': ' равно ', '+': ' плюс ', '-': ' минус ', '−': ' минус ', '<': ' меньше ', '>': ' больше ', '/': ' делить на ', '%': ' процентов ', '!': ' факториал ', '≈': ' приблизительно равно ' } as Record<string, string>,
    letters: { a: 'а', b: 'бэ', c: 'цэ', d: 'дэ', e: 'е', f: 'эф', g: 'жэ', h: 'аш', k: 'ка', l: 'эль', m: 'эм', n: 'эн', p: 'пэ', q: 'ку', r: 'эр', s: 'эс', t: 'тэ', u: 'у', v: 'вэ', x: 'икс', y: 'игрек', z: 'зэт', A: 'а', B: 'бэ', C: 'цэ', D: 'дэ', S: 'эс', V: 'вэ', P: 'пэ', R: 'эр', H: 'аш', M: 'эм', N: 'эн', K: 'ка', F: 'эф' } as Record<string, string>,
  },
  kz: {
    frac: (a: string, b: string) => ` ${a} бөлінген ${b} `, sqrt: (x: string) => ` ${x} түбірі `, root: (n: string, x: string) => ` ${x} санының ${n} дәрежелі түбірі `,
    sq: ' квадраты ', cube: ' кубы ', pow: (n: string) => ` ${n} дәрежесі `, deg: ' градус ', abs: (x: string) => ` ${x} модулі `,
    words: {
      '\\ne': ' тең емес ', '\\neq': ' тең емес ', '\\le': ' кіші немесе тең ', '\\leq': ' кіші немесе тең ', '\\ge': ' үлкен немесе тең ', '\\geq': ' үлкен немесе тең ',
      '\\cdot': ' көбейту ', '\\times': ' көбейту ', '\\div': ' бөлу ', '\\pm': ' плюс немесе минус ', '\\mp': ' минус немесе плюс ',
      '\\Rightarrow': ', демек, ', '\\Leftrightarrow': ' мәндес ', '\\to': ' ұмтылады ', '\\infty': ' шексіздік ', '\\approx': ' шамамен тең ',
      '\\pi': ' пи ', '\\alpha': ' альфа ', '\\beta': ' бета ', '\\gamma': ' гамма ', '\\varphi': ' фи ', '\\phi': ' фи ', '\\Delta': ' дельта ', '\\lambda': ' лямбда ',
      '\\angle': ' бұрыш ', '\\triangle': ' үшбұрыш ', '\\parallel': ' параллель ', '\\perp': ' перпендикуляр ', '\\in': ' тиісті ', '\\cup': ' бірігуі ', '\\cap': ' қиылысуы ',
      '\\sin': ' синус ', '\\cos': ' косинус ', '\\operatorname{tg}': ' тангенс ', '\\operatorname{ctg}': ' котангенс ', '\\tan': ' тангенс ', '\\cot': ' котангенс ',
      '\\arcsin': ' арксинус ', '\\arccos': ' арккосинус ', '\\operatorname{arctg}': ' арктангенс ',
      '\\log': ' логарифм ', '\\ln': ' натурал логарифм ', '\\lg': ' ондық логарифм ', '\\int': ' интеграл ', '\\sum': ' қосынды ', '\\lim': ' шек ',
      '\\mathbb{Z}': ' бүтін сандар ', '\\mathbb{R}': ' нақты сандар ', '\\mathbb{N}': ' натурал сандар ',
    } as Record<string, string>,
    sym: { '=': ' тең ', '+': ' қосу ', '-': ' алу ', '−': ' алу ', '<': ' кіші ', '>': ' үлкен ', '/': ' бөлу ', '%': ' пайыз ', '!': ' факториал ', '≈': ' шамамен тең ' } as Record<string, string>,
    letters: { a: 'а', b: 'бэ', c: 'цэ', d: 'дэ', e: 'е', f: 'эф', g: 'жэ', h: 'аш', k: 'ка', l: 'эль', m: 'эм', n: 'эн', p: 'пэ', q: 'ку', r: 'эр', s: 'эс', t: 'тэ', u: 'у', v: 'вэ', x: 'икс', y: 'игрек', z: 'зэт', A: 'а', B: 'бэ', C: 'цэ', D: 'дэ', S: 'эс', V: 'вэ', P: 'пэ', R: 'эр', H: 'аш', M: 'эм', N: 'эн', K: 'ка', F: 'эф' } as Record<string, string>,
  },
}

/** TeX → words, e.g. «x^2 + 5x = 0» → «икс в квадрате плюс 5 икс равно 0». */
export function texToSpeech(tex: string, lang: SpeechLang): string {
  const w = W[lang]
  let s = ` ${tex} `
    // systems and cases first: rows become a pause (before «\ » is treated as a space)
    .replace(/\\begin\{array\}\{[^{}]*\}/g, ' ').replace(/\\(?:begin|end)\{[a-z]*\*?\}/g, ' ').replace(/\\\\(\[[^\]]*\])?/g, '; ').replace(/&/g, ' ').replace(/\\%/g, '%')
    .replace(/\\(left|right|displaystyle|quad|qquad|,|;|!|:|big|Big|bigg|Bigg)\b/g, ' ')
    .replace(/\\(left|right)(?=[(|[\].])/g, ' ').replace(/\\[,;!: ]/g, ' ').replace(/~/g, ' ')
    .replace(/\\(?:text|mathrm|textbf|mathbf)\{([^{}]*)\}/g, ' $1 ')
    .replace(/\\overline\{([^{}]*)\}/g, ' $1 ').replace(/\\vec\{([^{}]*)\}/g, ' вектор $1 ').replace(/\\vec\s?(\w)/g, ' вектор $1 ')  // words that contain braces must go before the brace-based rules
  for (const k of Object.keys(w.words).filter((x) => x.includes('{'))) s = s.split(k).join(w.words[k])
  // innermost first: fractions, roots, powers — repeated while something changes
  for (let i = 0; i < 6; i++) {
    const before = s
    s = s.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => w.frac(a, b))
      .replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, (_, n, x) => w.root(n, x))
      .replace(/\\sqrt\{([^{}]*)\}/g, (_, x) => w.sqrt(x)).replace(/\\sqrt\s?(\d+|\w)/g, (_, x) => w.sqrt(x))
      .replace(/\^\{\\circ\}|\^\\circ/g, w.deg).replace(/°/g, w.deg)
      .replace(/\^\{2\}|\^2|²/g, w.sq).replace(/\^\{3\}|\^3|³/g, w.cube)
      .replace(/\^\{([^{}]*)\}/g, (_, n) => w.pow(n)).replace(/\^(-?\w)/g, (_, n) => w.pow(n))
      .replace(/_\{([^{}]*)\}/g, ' $1 ').replace(/_(\w)/g, ' $1 ')
      .replace(/\|([^|]+)\|/g, (_, x) => w.abs(x))
    if (s === before) break
  }
  for (const k of Object.keys(w.words).sort((a, b) => b.length - a.length)) s = s.split(k).join(w.words[k])
  s = s.replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}]/g, ' ')
  // «-5» at the start or after «(» / «=» is still read as «минус»
  s = s.replace(/[=+\-−<>/%!≈]/g, (c) => w.sym[c] ?? c)
  // «5x» → «5 икс»; single Latin letters → their names
  // what is left in Latin are variables: «4ac» = 4·a·c, «AB» = segment A B — read letter by letter
  s = s.replace(/[a-zA-Z]+/g, (run) => ` ${[...run].map((c) => w.letters[c] ?? c).join(' ')} `)
  s = s.replace(/[()[\]]/g, ' ').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim()
  return s
}

/** A text with $…$ parts (or a plain list of pieces) → one spoken string. */
export const piece = (text: string, lang: SpeechLang) => text.replace(/\$([^$]+)\$/g, (_, t) => texToSpeech(t, lang))

const RATE_KEY = 'speech-rate'
export function speechRate(): number {
  try { return Number(localStorage.getItem(RATE_KEY)) || 0.95 } catch { return 0.95 }
}
export function setSpeechRate(v: number) { try { localStorage.setItem(RATE_KEY, String(v)) } catch { /* storage blocked */ } }

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** The best voice for the language: a Kazakh one if present, otherwise Russian. */
export function voiceFor(lang: SpeechLang): { voice: SpeechSynthesisVoice | null; exact: boolean } {
  if (!speechSupported()) return { voice: null, exact: false }
  const vs = speechSynthesis.getVoices()
  const pick = (pre: string) => vs.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(pre))
    .sort((a, b) => Number(/natural|online/i.test(b.name)) - Number(/natural|online/i.test(a.name)))[0]
  if (lang === 'kz') { const kk = pick('kk'); if (kk) return { voice: kk, exact: true } }
  const ru = pick('ru')
  return { voice: ru ?? null, exact: lang === 'ru' && !!ru }
}

/** Speak the parts one after another; returns a function that stops speaking. */
export function speak(text: string, lang: SpeechLang, onEnd?: () => void): () => void {
  if (!speechSupported()) { onEnd?.(); return () => {} }
  speechSynthesis.cancel()
  const { voice } = voiceFor(lang)
  // long texts are split into sentences: some voices stop after ~200 characters
  const parts = text.split(/(?<=[.!?:;])\s+/).filter((x) => x.trim())
  let stopped = false
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p)
    if (voice) { u.voice = voice; u.lang = voice.lang } else u.lang = lang === 'kz' ? 'kk-KZ' : 'ru-RU'
    u.rate = speechRate()
    if (i === parts.length - 1) u.onend = () => { if (!stopped) onEnd?.() }
    speechSynthesis.speak(u)
  })
  return () => { stopped = true; speechSynthesis.cancel(); onEnd?.() }
}
