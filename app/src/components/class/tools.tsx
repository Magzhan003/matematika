import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/* ---------------- shared helpers ---------------- */

const LIST_KEY = 'class-list'
export function useClassList(): [string[], (s: string) => void, string] {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(LIST_KEY) ?? '' } catch { return '' }
  })
  const save = (s: string) => {
    setText(s)
    try { localStorage.setItem(LIST_KEY, s) } catch { /* storage blocked */ }
  }
  const names = text.split(/\n|,|;/).map((s) => s.trim()).filter(Boolean)
  return [names, save, text]
}

/** A short beep (or three) made with WebAudio — no sound files needed. */
export function beep(times = 3) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = 880
      o.connect(g); g.connect(ctx.destination)
      const t0 = ctx.currentTime + i * 0.35
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25)
      o.start(t0); o.stop(t0 + 0.3)
    }
  } catch { /* no audio */ }
}

export function FullscreenButton({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const { t } = useTranslation()
  return (
    <button className="btn btn-sm" onClick={() => {
      if (document.fullscreenElement) document.exitFullscreen()
      else target.current?.requestFullscreen?.()
    }}>⛶ {t('cls.full')}</button>
  )
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/* ---------------- timer / stopwatch ---------------- */

export function TimerTool() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer')
  const [total, setTotal] = useState(300)
  const [left, setLeft] = useState(300)
  const [run, setRun] = useState(false)
  const [custom, setCustom] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const last = useRef(0)

  useEffect(() => {
    if (!run) return
    last.current = performance.now()
    const id = setInterval(() => {
      const now = performance.now(), dt = (now - last.current) / 1000
      last.current = now
      setLeft((v) => {
        if (mode === 'stopwatch') return v + dt
        const n = v - dt
        if (n <= 0) { setRun(false); beep(); return 0 }
        return n
      })
    }, 200)
    return () => clearInterval(id)
  }, [run, mode])

  const set = (sec: number) => { setTotal(sec); setLeft(sec); setRun(false) }
  const frac = mode === 'timer' && total ? left / total : 1
  const color = mode === 'stopwatch' ? 'var(--accent)' : frac > 0.5 ? '#1d8a63' : frac > 0.2 ? '#d97706' : '#e03e3e'
  const R = 120, C = 2 * Math.PI * R

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="chips">
        <button className={`chip ${mode === 'timer' ? 'on' : ''}`} onClick={() => { setMode('timer'); set(total || 300) }}>⏳ {t('cls.timer')}</button>
        <button className={`chip ${mode === 'stopwatch' ? 'on' : ''}`} onClick={() => { setMode('stopwatch'); setLeft(0); setRun(false) }}>⏱ {t('cls.stopwatch')}</button>
      </div>
      {mode === 'timer' && (
        <div className="chips">
          {[1, 2, 3, 5, 7, 10, 15].map((m) => <button key={m} className={`chip ${total === m * 60 ? 'on' : ''}`} onClick={() => set(m * 60)}>{m} {t('cls.min')}</button>)}
          <form style={{ display: 'flex', gap: 6 }} onSubmit={(e) => { e.preventDefault(); const v = Number(custom.replace(',', '.')); if (v > 0) set(Math.round(v * 60)) }}>
            <input className="input" style={{ width: 90, height: 34 }} inputMode="decimal" placeholder={t('cls.minutes')} value={custom} onChange={(e) => setCustom(e.target.value)} />
            <button className="btn btn-sm" type="submit">OK</button>
          </form>
        </div>
      )}
      <div ref={box} className="cls-stage">
        <svg viewBox="0 0 300 300" className="cls-ring">
          <circle cx="150" cy="150" r={R} className="cls-ring-bg" />
          <circle cx="150" cy="150" r={R} fill="none" stroke={color} strokeWidth="18" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 150 150)" style={{ transition: 'stroke-dashoffset .2s linear' }} />
          <text x="150" y="165" textAnchor="middle" className="cls-time" fill={color}>{fmt(mode === 'timer' ? Math.ceil(left) : left)}</text>
        </svg>
        <div className="chips" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => { if (mode === 'timer' && left <= 0) setLeft(total); setRun(!run) }}>{run ? `⏸ ${t('cls.pause')}` : `▶ ${t('cls.start')}`}</button>
          <button className="btn" onClick={() => { setRun(false); setLeft(mode === 'timer' ? total : 0) }}>↺ {t('cls.reset')}</button>
          <FullscreenButton target={box} />
        </div>
      </div>
    </div>
  )
}

/* ---------------- random student and groups ---------------- */

export function PickerTool() {
  const { t } = useTranslation()
  const [names, save, text] = useClassList()
  const [edit, setEdit] = useState(names.length === 0)
  const [shown, setShown] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [noRepeat, setNoRepeat] = useState(true)
  const [used, setUsed] = useState<string[]>([])
  const [groups, setGroups] = useState<string[][] | null>(null)
  const [nGroups, setNGroups] = useState(4)
  const box = useRef<HTMLDivElement>(null)

  const pick = () => {
    const pool = noRepeat ? names.filter((n) => !used.includes(n)) : names
    const from = pool.length ? pool : names
    if (!from.length) return
    if (noRepeat && !pool.length) setUsed([])
    setSpinning(true)
    let k = 0
    const steps = 14 + Math.floor(Math.random() * 8)
    const tick = () => {
      setShown(from[Math.floor(Math.random() * from.length)])
      if (++k < steps) setTimeout(tick, 50 + k * 12)
      else {
        const chosen = from[Math.floor(Math.random() * from.length)]
        setShown(chosen)
        setSpinning(false)
        setUsed((u) => [...(pool.length ? u : []), chosen])
      }
    }
    tick()
  }
  const split = () => {
    const a = [...names].sort(() => Math.random() - 0.5)
    const n = Math.max(2, Math.min(nGroups, a.length))
    const g: string[][] = Array.from({ length: n }, () => [])
    a.forEach((name, i) => g[i % n].push(name))
    setGroups(g)
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {edit ? (
        <div className="card" style={{ display: 'grid', gap: 8 }}>
          <label className="muted small" htmlFor="cls-list">{t('cls.listHint')}</label>
          <textarea id="cls-list" className="input" rows={8} value={text} onChange={(e) => save(e.target.value)} placeholder={t('cls.listPlaceholder')} />
          <div><button className="btn btn-primary" onClick={() => setEdit(false)} disabled={!names.length}>✓ {t('cls.saveList')} ({names.length})</button></div>
        </div>
      ) : (
        <div className="chips" style={{ alignItems: 'center' }}>
          <span className="muted small">{t('cls.inList', { n: names.length })}</span>
          <button className="chip" onClick={() => setEdit(true)}>✎ {t('cls.editList')}</button>
          <label className="check-row small"><input type="checkbox" checked={noRepeat} onChange={(e) => { setNoRepeat(e.target.checked); setUsed([]) }} /> {t('cls.noRepeat')}</label>
        </div>
      )}
      <div ref={box} className="cls-stage">
        <div className={`cls-name ${spinning ? 'spin' : ''}`}>{shown ?? '?'}</div>
        <div className="chips" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={pick} disabled={!names.length || spinning}>🎲 {t('cls.pick')}</button>
          <FullscreenButton target={box} />
        </div>
        {noRepeat && used.length > 0 && <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>{t('cls.already')}: {used.join(', ')}</p>}
      </div>
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="chips" style={{ alignItems: 'center' }}>
          <b>👥 {t('cls.groups')}</b>
          {[2, 3, 4, 5, 6].map((n) => <button key={n} className={`chip ${nGroups === n ? 'on' : ''}`} onClick={() => setNGroups(n)}>{n}</button>)}
          <button className="btn btn-sm btn-primary" onClick={split} disabled={names.length < 2}>{t('cls.split')}</button>
        </div>
        {groups && (
          <div className="cls-groups">
            {groups.map((g, i) => (
              <div key={i} className="cls-group">
                <b>{t('cls.group')} {i + 1}</b>
                <ol>{g.map((n) => <li key={n}>{n}</li>)}</ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- noise traffic light ---------------- */

export function NoiseTool() {
  const { t } = useTranslation()
  const [level, setLevel] = useState(0)
  const [limit, setLimit] = useState(55)
  const [on, setOn] = useState(false)
  const [manual, setManual] = useState<'green' | 'yellow' | 'red' | null>(null)
  const [err, setErr] = useState('')
  const stop = useRef<() => void>(() => {})
  const box = useRef<HTMLDivElement>(null)

  const start = async () => {
    setErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const an = ctx.createAnalyser()
      an.fftSize = 1024
      ctx.createMediaStreamSource(stream).connect(an)
      const buf = new Float32Array(an.fftSize)
      let raf = 0, smooth = 0
      const loop = () => {
        an.getFloatTimeDomainData(buf)
        let s = 0
        for (const v of buf) s += v * v
        const db = Math.max(0, Math.min(100, 20 * Math.log10(Math.sqrt(s / buf.length) + 1e-6) + 100))
        smooth = smooth * 0.85 + db * 0.15
        setLevel(smooth)
        raf = requestAnimationFrame(loop)
      }
      loop()
      stop.current = () => { cancelAnimationFrame(raf); stream.getTracks().forEach((tr) => tr.stop()); ctx.close() }
      setOn(true); setManual(null)
    } catch {
      setErr(t('cls.noMic'))
    }
  }
  useEffect(() => () => stop.current(), [])

  const light = manual ?? (!on ? 'green' : level > limit ? 'red' : level > limit - 10 ? 'yellow' : 'green')
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div ref={box} className="cls-stage">
        <div className="cls-light">
          {(['red', 'yellow', 'green'] as const).map((c) => <span key={c} className={`lamp ${c} ${light === c ? 'lit' : ''}`} />)}
        </div>
        <p className="cls-light-text">{t(`cls.light.${light}`)}</p>
        {on && <div className="cls-meter"><i style={{ width: `${level}%`, background: light === 'red' ? '#e03e3e' : light === 'yellow' ? '#d97706' : '#1d8a63' }} /><b style={{ left: `${limit}%` }} /></div>}
        <div className="chips" style={{ justifyContent: 'center' }}>
          {!on ? <button className="btn btn-primary" onClick={start}>🎤 {t('cls.micOn')}</button> : <button className="btn" onClick={() => { stop.current(); setOn(false) }}>⏹ {t('cls.micOff')}</button>}
          <FullscreenButton target={box} />
        </div>
      </div>
      {on && (
        <label className="slider-row"><span className="small">{t('cls.sens')}</span>
          <input type="range" min={30} max={90} value={limit} onChange={(e) => setLimit(Number(e.target.value))} /><span className="small">{limit}</span></label>
      )}
      {err && <p className="error">{err}</p>}
      <div className="chips"><span className="muted small">{t('cls.manual')}:</span>
        {(['green', 'yellow', 'red'] as const).map((c) => <button key={c} className={`chip ${manual === c ? 'on' : ''}`} onClick={() => setManual(manual === c ? null : c)}>{t(`cls.light.${c}`)}</button>)}
      </div>
    </div>
  )
}
