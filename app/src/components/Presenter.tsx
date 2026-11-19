import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Whiteboard } from './Whiteboard'

type Saved = { title: string; url: string }
type Shown = {
  kind: 'frame' | 'image' | 'video' | 'pdf' | 'pptx' | 'docx' | 'youtube' | 'message'
  src: string
  title: string
  /** link for "open in a new tab" */
  original?: string
  /** a file from the computer (not a link from the internet) */
  file?: boolean
  data?: ArrayBuffer
  ytId?: string
  message?: string
}
const KEY = 'presenter-links'

/** YouTube video id from any YouTube link (watch, youtu.be, embed, shorts), or null. */
export function youtubeId(raw: string): string | null {
  try {
    const s = raw.trim()
    const u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s)
    const host = u.hostname.replace(/^(www|m)\./, '')
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
    if (!host.endsWith('youtube.com') && !host.endsWith('youtube-nocookie.com')) return null
    if (u.searchParams.get('v')) return u.searchParams.get('v')
    const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]+)/)
    return m ? m[2] : null
  } catch {
    return null
  }
}

/**
 * Make a saved web page (for example an HTML presentation exported from an AI tool) work inside the window:
 * - inside a frame the page cannot use the browser storage, so it gets a temporary one;
 * - many such pages choose what to show by the address, which must start with "/" (inside the frame it does not).
 */
export function patchHtml(html: string): string {
  const shim = '<script>(function(){try{window.localStorage.getItem("x")}catch(e){var mk=function(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}};'
    + 'try{Object.defineProperty(window,"localStorage",{value:mk(),configurable:true});Object.defineProperty(window,"sessionStorage",{value:mk(),configurable:true})}catch(e2){}}'
    + 'window.__pp=function(){var p=location.pathname;return p.charAt(0)==="/"?p:"/"}})()</script>'
  const body = html
    .replace(/\b(?:window|self|globalThis|document)\.location\.pathname\b(?!\s*=(?!=))/g, '__pp()')
    .replace(/(?<![\w$.])location\.pathname\b(?!\s*=(?!=))/g, '__pp()')
  return /<head[^>]*>/i.test(body) ? body.replace(/<head[^>]*>/i, (m) => m + shim) : shim + body
}

/** Turn a share link into a link that can be shown inside the page. */
export function toEmbed(raw: string): string {
  let url = raw.trim()
  // an <iframe …> code copied from "Embed" / "Встроить"
  const m = url.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
  if (m) url = m[1]
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    // Google Slides / Docs / Sheets / Drive
    let g = u.pathname.match(/^\/presentation\/d\/([^/]+)/)
    if (host === 'docs.google.com' && g) return `https://docs.google.com/presentation/d/${g[1]}/embed?start=false&loop=false&delayms=60000`
    g = u.pathname.match(/^\/(document|spreadsheets)\/d\/([^/]+)/)
    if (host === 'docs.google.com' && g) return `https://docs.google.com/${g[1]}/d/${g[2]}/preview`
    g = u.pathname.match(/^\/file\/d\/([^/]+)/)
    if (host === 'drive.google.com' && g) return `https://drive.google.com/file/d/${g[1]}/preview`
    // YouTube
    const yt = youtubeId(url)
    if (yt) return `https://www.youtube.com/embed/${yt}`
    // Canva: …/design/ID/view → …?embed
    if (host.endsWith('canva.com') && /\/design\//.test(u.pathname)) return `https://www.canva.com${u.pathname.replace(/\/(edit|view)$/, '')}/view?embed`
    return u.toString()
  } catch {
    return url
  }
}

/**
 * Presentation window: show slides, documents, videos (links) or files from the computer
 * (PowerPoint, Word, PDF, HTML presentations, pictures, video) right inside the app, and draw over them.
 */
export function Presenter({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [saved, setSaved] = useState<Saved[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
  })
  const [shown, setShown] = useState<Shown | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [over, setOver] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const view = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(saved)) } catch { /* storage blocked */ }
  }, [saved])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !drawing) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawing, onClose])
  // free the memory of the previous file when another one is shown
  useEffect(() => () => { if (shown?.src.startsWith('blob:')) URL.revokeObjectURL(shown.src) }, [shown])

  const openLink = (raw: string, title?: string) => {
    if (!raw.trim()) return
    const id = youtubeId(raw)
    // YouTube refuses to play inside a page opened as a file from the computer (error 153)
    if (id && location.protocol === 'file:') {
      const watch = `https://www.youtube.com/watch?v=${id}`
      setShown({ kind: 'youtube', src: watch, title: title ?? raw.trim(), original: watch, ytId: id })
    } else {
      setShown({ kind: 'frame', src: toEmbed(raw), title: title ?? raw.trim(), original: raw.trim() })
    }
    if (!saved.some((s) => s.url === raw.trim())) setSaved([{ title: title ?? shortTitle(raw), url: raw.trim() }, ...saved].slice(0, 20))
    setInput('')
  }
  const openFile = async (f: File) => {
    const ext = f.name.toLowerCase().split('.').pop() ?? ''
    try {
      if (ext === 'ppt' || ext === 'doc') return setShown({ kind: 'message', src: '', title: f.name, message: t('pres.oldFormat'), file: true })
      if (ext === 'pptx' || ext === 'docx') return setShown({ kind: ext, src: '', title: f.name, data: await f.arrayBuffer(), file: true })
      if (ext === 'html' || ext === 'htm' || f.type === 'text/html') {
        const src = URL.createObjectURL(new Blob([patchHtml(await f.text())], { type: 'text/html' }))
        return setShown({ kind: 'frame', src, title: f.name, original: src, file: true })
      }
      const src = URL.createObjectURL(f)
      const kind: Shown['kind'] = f.type.startsWith('image/') ? 'image' : f.type.startsWith('video/') ? 'video' : f.type === 'application/pdf' || ext === 'pdf' ? 'pdf' : 'frame'
      setShown({ kind, src, title: f.name, file: true })
    } catch {
      setShown({ kind: 'message', src: '', title: f.name, message: t('pres.failed'), file: true })
    }
  }
  const failed = () => setShown((s) => s && { ...s, kind: 'message', message: t('pres.failed') })

  /** A separate small window over the presentation area (for YouTube when the site is opened as a file). */
  const openPopup = (url: string) => {
    const r = view.current?.getBoundingClientRect()
    const dx = window.outerWidth - window.innerWidth, dy = window.outerHeight - window.innerHeight
    const w = Math.round(r?.width ?? 960), h = Math.round(r?.height ?? 540)
    const left = Math.round(window.screenX + dx / 2 + (r?.left ?? 0)), top = Math.round(window.screenY + dy + (r?.top ?? 0))
    window.open(url, 'math-video', `popup=yes,width=${w},height=${h},left=${left},top=${top}`)
  }

  return (
    <div className="pres" role="dialog" aria-label={t('pres.title')}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) openFile(f)
        else openLink(e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'))
      }}>
      <div className="pres-bar">
        <b className="pres-name">📺 {t('pres.title')}</b>
        <form className="pres-form" onSubmit={(e) => { e.preventDefault(); openLink(input) }}>
          <input className="input" value={input} placeholder={t('pres.placeholder')} onChange={(e) => setInput(e.target.value)} aria-label={t('pres.placeholder')} />
          <button className="btn btn-primary btn-sm" type="submit" disabled={!input.trim()}>{t('pres.show')}</button>
        </form>
        <button className="btn btn-sm" onClick={() => file.current?.click()}>📁 {t('pres.file')}</button>
        <input ref={file} type="file" hidden accept="application/pdf,image/*,video/*,.pptx,.docx,.ppt,.doc,.html,.htm"
          onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
          onChange={(e) => e.target.files?.[0] && openFile(e.target.files[0])} />
        {shown && shown.kind !== 'message' && <button className={`btn btn-sm ${drawing ? 'btn-primary' : ''}`} onClick={() => setDrawing(true)}>✏️ {t('pres.draw')}</button>}
        {shown?.original && <a className="btn btn-sm" href={shown.original} target="_blank" rel="noreferrer">↗ {t('pres.newTab')}</a>}
        <button className="btn btn-sm" onClick={onClose} aria-label={t('wb.close')}>✕</button>
      </div>

      {saved.length > 0 && (
        <div className="pres-saved">
          {saved.map((s) => (
            <span key={s.url} className="chip pres-chip">
              <button className="link-btn" onClick={() => openLink(s.url, s.title)} title={s.url}>{s.title}</button>
              <button className="pres-del" aria-label={t('pres.remove')} onClick={() => setSaved(saved.filter((x) => x.url !== s.url))}>×</button>
            </span>
          ))}
        </div>
      )}

      <div className={`pres-view ${over ? 'over' : ''}`} ref={view}>
        {!shown && (
          <div className="pres-empty">
            <div style={{ fontSize: 56 }}>📺</div>
            <h2 style={{ margin: 0 }}>{t('pres.emptyTitle')}</h2>
            <p>{t('pres.emptyText')}</p>
            <ul>
              <li>{t('pres.hintFiles')}</li>
              <li>{t('pres.hintSlides')}</li>
              <li>{t('pres.hintCanva')}</li>
              <li>{t('pres.hintPpt')}</li>
            </ul>
          </div>
        )}
        {shown?.kind === 'frame' && <iframe key={shown.src} src={shown.src} title={shown.title} allow="autoplay; fullscreen; clipboard-write" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
        {shown?.kind === 'pdf' && <iframe key={shown.src} src={shown.src} title={shown.title} />}
        {shown?.kind === 'image' && <img src={shown.src} alt={shown.title} />}
        {shown?.kind === 'video' && <video src={shown.src} controls />}
        {shown?.kind === 'pptx' && shown.data && <PptxView key={shown.title + shown.data.byteLength} data={shown.data} onFail={failed} />}
        {shown?.kind === 'docx' && shown.data && <DocxView key={shown.title + shown.data.byteLength} data={shown.data} onFail={failed} />}
        {shown?.kind === 'message' && (
          <div className="pres-empty">
            <div style={{ fontSize: 48 }}>📄</div>
            <h2 style={{ margin: 0, wordBreak: 'break-word' }}>{shown.title}</h2>
            <p>{shown.message}</p>
          </div>
        )}
        {shown?.kind === 'youtube' && (
          <div className="pres-empty pres-yt">
            <button className="pres-yt-thumb" onClick={() => openPopup(shown.src)} aria-label={t('pres.ytOpen')}>
              <img src={`https://i.ytimg.com/vi/${shown.ytId}/hqdefault.jpg`} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="pres-yt-play">▶</span>
            </button>
            <h2 style={{ margin: '12px 0 4px' }}>{t('pres.ytTitle')}</h2>
            <p style={{ margin: '0 0 12px' }}>{t('pres.ytFile')}</p>
            <button className="btn btn-primary" onClick={() => openPopup(shown.src)}>▶ {t('pres.ytOpen')}</button>
            <p className="muted small" style={{ marginBottom: 0 }}>{t('pres.ytTip')}</p>
          </div>
        )}
      </div>
      {shown?.kind === 'frame' && !shown.file && <p className="pres-note">{t('pres.blocked')}</p>}
      {drawing && <Whiteboard transparent onClose={() => setDrawing(false)} />}
    </div>
  )
}

/** PowerPoint (.pptx) slides drawn right in the page; arrows or the buttons below change slides. */
function PptxView({ data, onFail }: { data: ArrayBuffer; onFail: () => void }) {
  const { t } = useTranslation()
  const box = useRef<HTMLDivElement>(null)
  const viewer = useRef<{ renderNextSlide(): void; renderPreSlide(): void; destroy(): void } | null>(null)
  const [ready, setReady] = useState(false)
  const loaded = useRef(false)
  useEffect(() => {
    let alive = true
    const el = box.current!
    import('pptx-preview')
      .then(async ({ init }) => {
        if (!alive) return
        const r = el.parentElement!.getBoundingClientRect()
        const w = Math.max(320, Math.min(r.width - 32, ((r.height - 80) * 16) / 9))
        el.innerHTML = ''
        const v = init(el, { width: Math.round(w), height: Math.round((w * 9) / 16), mode: 'slide' })
        viewer.current = v
        await v.preview(data.slice(0))
        loaded.current = true
        if (alive) setReady(true)
      })
      .catch(() => { if (alive) onFail() })
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || !loaded.current) return
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); viewer.current?.renderNextSlide() }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); viewer.current?.renderPreSlide() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      alive = false
      window.removeEventListener('keydown', onKey)
      try { viewer.current?.destroy() } catch { /* already gone */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
  return (
    <div className="pres-office pres-pptx">
      {!ready && <p className="pres-loading">{t('pres.loading')}</p>}
      <div ref={box} />
    </div>
  )
}

/** Word (.docx) document shown as pages. */
function DocxView({ data, onFail }: { data: ArrayBuffer; onFail: () => void }) {
  const { t } = useTranslation()
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    import('docx-preview')
      .then(({ renderAsync }) => (alive ? renderAsync(data.slice(0), box.current!, undefined, { inWrapper: true, breakPages: true }) : null))
      .then(() => { if (alive) setReady(true) })
      .catch(() => { if (alive) onFail() })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
  return (
    <div className="pres-office pres-docx">
      {!ready && <p className="pres-loading">{t('pres.loading')}</p>}
      <div ref={box} />
    </div>
  )
}

function shortTitle(url: string) {
  try {
    const u = new URL(toEmbed(url))
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'docs.google.com') return 'Google ' + (u.pathname.includes('presentation') ? 'Slides' : 'Docs')
    if (host.includes('youtube')) return 'YouTube'
    if (host.includes('canva')) return 'Canva'
    return host
  } catch {
    return url.slice(0, 30)
  }
}
