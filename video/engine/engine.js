/* Scene engine for math video lessons.
 * render(t) is a pure function of time: every frame can be drawn independently, so the recorder
 * just steps t = i / fps. Elements keep a list of timed events (show, write, hide, move, color…). */
;(() => {
  const C = {
    paper: '#fbfaf5', grid: '#dde6f2', margin: '#f2b8b5', ink: '#2c2c2a', muted: '#8a8a84',
    blue: '#1d70b8', orange: '#d97706', green: '#1d8a63', red: '#e03e3e', card: '#ffffff', space: '#26215c',
  }
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
  const ease = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
  const P = (t, a, d) => (d <= 0 ? (t >= a ? 1 : 0) : clamp((t - a) / d))
  let stage, lang, fmt, W, H
  const all = []
  let segEls = null

  class El {
    constructor(node, o = {}) {
      this.node = node
      this.ev = []
      this.keep = !!o.keep
      this.x = o.x ?? 0
      this.y = o.y ?? 0
      this.anchor = o.anchor ?? 'center'
      node.style.position = 'absolute'
      node.style.left = this.x + 'px'
      node.style.top = this.y + 'px'
      node.style.opacity = 0
      // anchor right away, so that box() measures the element where it will really be
      node.style.transform = this.anchor === 'left' ? 'translate(0,-50%)' : 'translate(-50%,-50%)'
      stage.appendChild(node)
      all.push(this)
      if (segEls) segEls.push(this)
    }
    show(t, d = 0.45) { this.ev.push({ k: 'op', t, d, v: 1 }); return this }
    hide(t, d = 0.4) { this.ev.push({ k: 'op', t, d, v: 0 }); return this }
    write(t, d = 1) { this.ev.push({ k: 'op', t, d: 0.01, v: 1 }); this.ev.push({ k: 'wr', t, d }); this.hasWrite = true; return this }
    move(t, dx, dy, d = 0.6) { this.ev.push({ k: 'mv', t, d, dx, dy }); return this }
    pulse(t, d = 0.7) { this.ev.push({ k: 'pu', t, d }); return this }
    color(t, c) { this.ev.push({ k: 'col', t, c }); return this }
    state(t) {
      let op = 0, wr = this.hasWrite ? 0 : 1, dx = 0, dy = 0, sc = 1, col = null
      for (const e of this.ev) {
        if (t < e.t) continue
        const p = ease(P(t, e.t, e.d))
        if (e.k === 'op') op = op + (e.v - op) * p
        else if (e.k === 'wr') wr = Math.max(wr, P(t, e.t, e.d))
        else if (e.k === 'mv') { dx += e.dx * p; dy += e.dy * p }
        else if (e.k === 'pu') sc *= 1 + 0.12 * Math.sin(Math.PI * P(t, e.t, e.d))
        else if (e.k === 'col') col = e.c
      }
      return { op, wr, dx, dy, sc, col }
    }
    render(t) {
      const s = this.state(t)
      const n = this.node
      n.style.opacity = s.op
      n.style.visibility = s.op < 0.003 ? 'hidden' : 'visible'
      const a = this.anchor === 'left' ? 'translate(0,-50%)' : 'translate(-50%,-50%)'
      n.style.transform = `translate(${s.dx}px,${s.dy}px) ${a} scale(${s.sc})`
      // "writing": reveal from left to right
      n.style.clipPath = s.wr >= 1 ? 'none' : `inset(-30% ${(1 - s.wr) * 100}% -30% -5%)`
      if (s.col) n.style.color = s.col
      if (this.extra) this.extra(t, s)
    }
    /** box of the element in stage coordinates (after layout, without animation) */
    box() {
      const r = this.node.getBoundingClientRect(), sr = stage.getBoundingClientRect()
      return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height }
    }
  }

  const loc = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] : v)
  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = (w, h) => { const s = document.createElementNS(svgNS, 'svg'); s.setAttribute('width', w); s.setAttribute('height', h); s.setAttribute('viewBox', `0 0 ${w} ${h}`); return s }

  const E = {
    C,
    tex(latex, o = {}) {
      const d = document.createElement('div')
      d.className = 'tex'
      d.style.fontSize = (o.size ?? 80) + 'px'
      d.style.color = o.color ?? C.ink
      katex.render(latex, d, { throwOnError: false, displayMode: false })
      return new El(d, o)
    },
    text(str, o = {}) {
      const d = document.createElement('div')
      d.className = 'txt'
      d.textContent = loc(str)
      d.style.fontSize = (o.size ?? 44) + 'px'
      d.style.fontWeight = o.weight ?? 600
      d.style.color = o.color ?? C.ink
      if (o.maxWidth) { d.style.maxWidth = o.maxWidth + 'px'; d.style.whiteSpace = 'normal'; d.style.textAlign = 'center' }
      return new El(d, o)
    },
    card(o) {
      const d = document.createElement('div')
      d.className = 'card'
      d.style.width = o.w + 'px'
      d.style.height = o.h + 'px'
      return new El(d, o)
    },
    /** fraction circle: parts can be re-cut, fills are given as shares of the whole */
    pie(o) {
      const r = o.r, size = 2 * r + 12
      const s = svg(size, size)
      const el = new El(s, o)
      el.cuts = [{ t: -1, n: o.parts, d: 0 }]
      el.fills = []
      el.halves = []
      el.recut = (t, n, d = 1) => { el.cuts.push({ t, n, d }); return el }
      el.fill = (t, a0, a1, color, d = 0.6) => { el.fills.push({ t, a0, a1, color, d }); return el }
      el.half = (t, d = 0.8) => { el.halves.push({ t, d }); return el }
      const c = size / 2
      const pt = (a, rr = r) => [c + rr * Math.sin(2 * Math.PI * a), c - rr * Math.cos(2 * Math.PI * a)]
      el.extra = (t) => {
        let html = `<circle cx="${c}" cy="${c}" r="${r}" fill="#fff" stroke="${C.ink}" stroke-width="4"/>`
        for (const f of el.fills) {
          const p = ease(P(t, f.t, f.d))
          if (p <= 0) continue
          const [x0, y0] = pt(f.a0), [x1, y1] = pt(f.a1)
          const large = f.a1 - f.a0 > 0.5 ? 1 : 0
          html += `<path d="M${c},${c} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z" fill="${f.color}" opacity="${0.85 * p}"/>`
        }
        el.cuts.forEach((cu, i) => {
          const next = el.cuts[i + 1]
          const on = ease(P(t, cu.t, cu.d)) * (next ? 1 - ease(P(t, next.t, next.d * 0.6)) : 1)
          if (on <= 0) return
          for (let k = 0; k < cu.n; k++) {
            const [x, y] = pt(k / cu.n)
            html += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="${C.ink}" stroke-width="${i ? 3 : 4}" opacity="${on}" ${i ? 'stroke-dasharray="10 6"' : ''}/>`
          }
        })
        for (const h of el.halves) {
          const p = ease(P(t, h.t, h.d))
          if (p <= 0) continue
          const [x0, y0] = pt(0, r + 4), [x1, y1] = pt(0.5, r + 4)
          html += `<line x1="${x0}" y1="${y0}" x2="${x0 + (x1 - x0) * p}" y2="${y0 + (y1 - y0) * p}" stroke="${C.red}" stroke-width="6" stroke-dasharray="14 8"/>`
        }
        s.innerHTML = html
      }
      return el
    },
    /** red X over another element */
    cross(target, t, d = 0.6) {
      const b = target.box(), pad = 18
      const s = svg(b.w + 2 * pad, b.h + 2 * pad)
      const el = new El(s, { x: b.x + b.w / 2, y: b.y + b.h / 2 })
      el.show(t, 0.05)
      el.extra = (tt) => {
        const p1 = ease(P(tt, t, d / 2)), p2 = ease(P(tt, t + d / 2, d / 2))
        const w = b.w + pad, h = b.h + pad
        s.innerHTML = `<line x1="${pad / 2}" y1="${pad / 2}" x2="${pad / 2 + w * p1}" y2="${pad / 2 + h * p1}" stroke="${C.red}" stroke-width="10" stroke-linecap="round"/>` +
          `<line x1="${pad / 2 + w}" y1="${pad / 2}" x2="${pad / 2 + w - w * p2}" y2="${pad / 2 + h * p2}" stroke="${C.red}" stroke-width="10" stroke-linecap="round"/>`
      }
      return el
    },
    /** hand-drawn style ring around an element (or around its last part: 'last' = right 35%) */
    ring(target, t, part, d = 0.7) {
      const b0 = target.box()
      // part: share of the width taken from the right end ('last' = 0.3)
      const share = part === 'last' ? 0.3 : typeof part === 'number' ? part : 1
      const b = share < 1 ? { x: b0.x + b0.w * (1 - share), y: b0.y, w: b0.w * share, h: b0.h } : b0
      const pad = 16, w = b.w + 2 * pad, h = b.h + 2 * pad
      const s = svg(w + 10, h + 10)
      const el = new El(s, { x: b.x + b.w / 2, y: b.y + b.h / 2 })
      el.show(t, 0.05)
      const len = 2 * (w + h)
      el.extra = (tt) => {
        const p = ease(P(tt, t, d))
        s.innerHTML = `<rect x="5" y="5" width="${w}" height="${h}" rx="${h / 2.6}" fill="none" stroke="${C.orange}" stroke-width="7" stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - p)}"/>`
      }
      return el
    },
    countdown(o, t, n) {
      const d = document.createElement('div')
      d.className = 'txt countdown'
      d.style.fontSize = (o.size ?? 140) + 'px'
      const el = new El(d, o)
      el.show(t, 0.2).hide(t + n - 0.1, 0.2)
      el.extra = (tt) => { d.textContent = `⏸ ${Math.max(1, n - Math.floor(tt - t))}` }
      return el
    },
  }

  /** Build the whole video from EPISODE and TIMING. */
  window.init = (episode, timing, l, f) => {
    lang = l
    fmt = f
    ;[W, H] = fmt === 'tall' ? [1080, 1920] : [1920, 1080]
    document.body.className = fmt
    stage = document.getElementById('stage')
    stage.style.width = W + 'px'
    stage.style.height = H + 'px'
    // header: brand + episode title
    E.text('∑ Математика', { x: fmt === 'tall' ? 70 : 70, y: 56, size: 30, weight: 800, anchor: 'left', color: C.space, keep: true }).show(0, 0.3)
    E.text(`${loc(episode.title)} · ${loc(episode.tag)}`, { x: fmt === 'tall' ? 70 : 340, y: fmt === 'tall' ? 100 : 56, size: fmt === 'tall' ? 26 : 28, weight: 600, anchor: 'left', color: C.muted, keep: true }).show(0, 0.3)
    episode.segments.forEach((seg, si) => {
      const sents = timing.sentences.filter((s) => s.seg === si)
      const S = {
        at: (i, frac = 0) => sents[i].start + frac * sents[i].dur,
        after: (i) => sents[i].start + sents[i].dur,
        start: timing.segs[si].start,
        end: timing.segs[si].end,
      }
      segEls = []
      seg.build(S, E)
      for (const el of segEls) if (!el.keep) el.hide(S.end - 0.45, 0.4)
      segEls = null
    })
    // subtitles: the current sentence
    const sub = document.createElement('div')
    sub.id = 'sub'
    stage.appendChild(sub)
    window.__subs = timing.sentences
    // outro card
    const outroT = timing.total - timing.outro
    const card = E.card({ x: W / 2, y: H / 2, w: fmt === 'tall' ? 900 : 1200, h: fmt === 'tall' ? 700 : 520, keep: true })
    card.node.classList.add('outro')
    card.node.innerHTML = `<div class="logo">∑</div><div class="oname">Математика</div><div class="osub">${lang === 'kz' ? '5–11 сынып · формулалар · сабақтар · ҰБТ' : '5–11 класс · формулы · уроки · ЕНТ'}</div>`
    card.show(outroT, 0.5)
    window.DURATION = timing.total
  }

  window.render = (t) => {
    for (const el of all) el.render(t)
    const sub = document.getElementById('sub')
    const cur = window.__subs.find((s) => t >= s.start && t < s.start + s.dur + 0.25)
    sub.textContent = cur ? cur.text : ''
    sub.style.opacity = cur ? 1 : 0
  }
})()
