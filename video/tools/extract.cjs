// Print the narration of an episode as JSON: node extract.cjs episodes/x.js kz
const fs = require('fs')
const vm = require('vm')
const [file, lang] = process.argv.slice(2)
const ctx = { window: {} }
vm.runInNewContext(fs.readFileSync(file, 'utf8'), ctx)
const ep = ctx.window.EPISODE
const out = { id: ep.id, fmt: ep.fmt, sentences: [] }
ep.segments.forEach((seg, si) => {
  seg.say[lang].forEach((text, i) => out.sentences.push({ seg: si, i, text, pause: seg.pauseAfter?.[i] ?? 0 }))
})
process.stdout.write(JSON.stringify(out))
