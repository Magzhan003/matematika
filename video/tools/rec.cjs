/* Record an episode: node tools/rec.cjs episodes/x.js kz [--shots 2,14,30]
 * Frames are drawn by render(t) and piped as JPEG into ffmpeg together with the narration.
 * --shots only saves still frames (for checking the layout before a full render). */
const { chromium } = require('playwright')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const [epFile, lang, flag, list] = process.argv.slice(2)
const ROOT = path.resolve(__dirname, '..')
const src = fs.readFileSync(path.resolve(epFile), 'utf8')
const id = /id:\s*'([^']+)'/.exec(src)[1]
const fmt = /fmt:\s*'([^']+)'/.exec(src)[1]
const [W, H] = fmt === 'tall' ? [1080, 1920] : [1920, 1080]
const timing = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', `${id}-${lang}.timing.json`), 'utf8'))
const audio = path.join('C:\\Users\\user\\vtmp', `${id}-${lang}`, 'narration.wav')
const fps = 30

;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: W, height: H } })
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.goto('file:///' + path.join(ROOT, 'engine', 'stage.html').replace(/\\/g, '/'))
  await p.addScriptTag({ content: src })
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(([t, l, f]) => window.init(window.EPISODE, t, l, f), [timing, lang, fmt])
  if (errors.length) { console.error('page errors:', errors); process.exit(1) }

  if (flag === '--shots') {
    const dir = path.join(ROOT, 'out', 'shots')
    fs.mkdirSync(dir, { recursive: true })
    const times = list ? list.split(',').map(Number) : timing.sentences.map((s) => s.start + s.dur * 0.95)
    for (const t of times) {
      await p.evaluate((tt) => window.render(tt), t)
      await p.screenshot({ path: path.join(dir, `${id}-${lang}-${String(Math.round(t * 10)).padStart(5, '0')}.png`) })
    }
    console.log(`shots: ${times.length} -> ${dir}`)
    await b.close()
    return
  }

  const N = Math.ceil(timing.total * fps)
  const out = path.join(ROOT, 'out', `${id}-${lang}.mp4`)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'inherit'] })
  const t0 = Date.now()
  for (let i = 0; i < N; i++) {
    await p.evaluate((t) => window.render(t), i / fps)
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 })
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if (i % 600 === 0) console.log(`${id}-${lang}: frame ${i}/${N} (${Math.round((Date.now() - t0) / 1000)} s)`)
  }
  ff.stdin.end()
  await new Promise((r) => ff.on('close', r))
  console.log(`done: ${out} (${Math.round((Date.now() - t0) / 1000)} s)`)
  await b.close()
})().catch((e) => { console.error('FAIL', e); process.exit(1) })
