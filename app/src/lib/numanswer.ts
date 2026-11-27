/** Numbers in worksheet answers: written in TeX by the author, typed by a student. */

/** Value of an answer written in TeX: 5, -1{,}8, \frac{1}{4}, -1\tfrac{3}{4}. */
export function texValue(tex: string): number | null {
  const s = tex.replace(/\{,\}/g, '.').replace(/\s/g, '')
  const neg = s.startsWith('-') ? -1 : 1
  const b = s.replace(/^-/, '')
  let m = b.match(/^(\d+)\\[td]?frac\{(\d+)\}\{(\d+)\}$/)
  if (m) return neg * (Number(m[1]) + Number(m[2]) / Number(m[3]))
  m = b.match(/^\\[td]?frac\{(\d+)\}\{(\d+)\}$/)
  if (m) return neg * (Number(m[1]) / Number(m[2]))
  return /^\d+(\.\d+)?$/.test(b) ? neg * Number(b) : null
}

/** Value of what a student typed: 5, -1,8, 1/4, -1 3/4 (also with the − sign). */
export function typedValue(raw: string): number | null {
  const s = raw.trim().replace(/[−–]/g, '-').replace(',', '.').replace(/\s+/g, ' ')
  const neg = s.startsWith('-') ? -1 : 1
  const b = s.replace(/^-\s*/, '')
  let m = b.match(/^(\d+) (\d+)\/(\d+)$/)
  if (m && Number(m[3])) return neg * (Number(m[1]) + Number(m[2]) / Number(m[3]))
  m = b.match(/^(\d+)\/(\d+)$/)
  if (m && Number(m[2])) return neg * (Number(m[1]) / Number(m[2]))
  return /^\d+(\.\d+)?$/.test(b) ? neg * Number(b) : null
}
