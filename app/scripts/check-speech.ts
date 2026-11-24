/** Read-aloud: every formula and example step turns into words without TeX leftovers. npx tsx scripts/check-speech.ts */
import { formulas } from '../src/data/formulas'
import { texToSpeech } from '../src/lib/speech'

let bad = 0, n = 0
for (const f of formulas) for (const tex of [f.tex, ...f.example.steps, f.example.answer]) for (const lang of ['ru', 'kz'] as const) {
  const s = texToSpeech(tex, lang); n++
  if (/[\\{}^_]|[a-zA-Z]{2,}/.test(s) || !s.trim()) { if (bad < 15) console.log('✗', lang, tex, '→', s); bad++ }
}
// expected readings
const want: [string, string][] = [
  [String.raw`x^2 + 5x - 6 = 0`, 'икс в квадрате плюс 5 икс минус 6 равно 0'],
  [String.raw`D = b^2 - 4ac`, 'дэ равно бэ в квадрате минус 4 а цэ'],
  [String.raw`x_{1,2} = \dfrac{-b \pm \sqrt{D}}{2a}`, 'икс 1, 2 равно минус бэ плюс или минус корень из дэ делить на 2 а'],
  [String.raw`\sin^2\alpha + \cos^2\alpha = 1`, 'синус в квадрате альфа плюс косинус в квадрате альфа равно 1'],
  [String.raw`\angle A = 60^\circ`, 'угол а равно 60 градусов'],
  [String.raw`|x - 3| \le 5`, 'модуль икс минус 3 меньше или равно 5'],
  [String.raw`\sqrt[3]{27} = 3`, 'корень степени 3 из 27 равно 3'],
  [String.raw`M_{90^\circ} = (0;\ 1)`, 'эм 90 градусов равно 0; 1'],
]
for (const [tex, exp] of want) {
  const got = texToSpeech(tex, 'ru')
  if (got !== exp) { console.log('✗', tex, '\n   got: ', got, '\n   want:', exp); bad++ }
}
console.log('kz sample:', texToSpeech(String.raw`x_{1,2} = \dfrac{-b \pm \sqrt{D}}{2a}`, 'kz'))
console.log(`${n} texts`); console.log(bad ? `${bad} problems` : 'all formulas readable'); process.exit(bad ? 1 : 0)
