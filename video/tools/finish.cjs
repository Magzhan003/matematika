/* Final step: even loudness (−16 LUFS, peaks ≤ −1.5 dB, the usual level for YouTube) and readable names.
 * node tools/finish.cjs  ->  ../Видеоуроки/<name>.mp4  (video stream is copied, only the sound is processed) */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DEST = path.resolve(ROOT, '..', 'Видеоуроки')
const names = {
  'fractions-add-kz': '5 сынып — Жай бөлшектерді қосу (ҚАЗ)',
  'fractions-add-ru': '5 класс — Сложение дробей (РУС)',
  'fractions-mistake-short-kz': 'Шортс — Бөлшектерді қосу, жиі қате (ҚАЗ)',
  'fractions-mistake-short-ru': 'Шортс — Сложение дробей, частая ошибка (РУС)',
}
fs.mkdirSync(DEST, { recursive: true })
for (const [id, name] of Object.entries(names)) {
  const src = path.join(ROOT, 'out', `${id}.mp4`)
  if (!fs.existsSync(src)) { console.log(`skip ${id}: not recorded yet`); continue }
  const out = path.join(DEST, `${name}.mp4`)
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out], { stdio: 'inherit' })
  console.log(r.status === 0 ? `ok: ${name}` : `FAILED: ${id}`)
}
