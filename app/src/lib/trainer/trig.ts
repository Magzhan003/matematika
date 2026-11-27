/** Trigonometric transformations and equations (types of the trainer, ch. IV §1–2). */
import { frac, l, pi, pick, q, ri, roots, S, sadd, smul, stex, sval, value, type Surd, type TGen } from './kit'

const DEG = Math.PI / 180
const H = S([1, 2]), R2 = S([0, 1], [1, 2]), R3 = S([0, 1], [0, 1], [1, 2]), ONE = S([1, 1]), ZERO = S()
/** Exact sin of an angle that is a multiple of 30° or 45°. */
function sinS(deg: number): Surd {
  const d = ((deg % 360) + 360) % 360
  const sign = d > 180 ? -1 : 1
  const ref = d > 180 ? d - 180 : d
  const r = ref > 90 ? 180 - ref : ref
  const base: Record<number, Surd> = { 0: ZERO, 30: H, 45: R2, 60: R3, 90: ONE }
  if (!(r in base)) throw new Error(`no exact value for ${deg}`)
  return smul(base[r], sign)
}
const cosS = (deg: number) => sinS(90 - deg)
function tgS(deg: number): Surd {
  const d = ((deg % 180) + 180) % 180
  const t: Record<number, Surd> = { 0: ZERO, 30: S([0, 1], [0, 1], [1, 3]), 45: ONE, 60: S([0, 1], [0, 1], [1, 1]), 120: S([0, 1], [0, 1], [-1, 1]), 135: S([-1, 1]), 150: S([0, 1], [0, 1], [-1, 3]) }
  if (!(d in t)) throw new Error(`no tg for ${deg}`)
  return t[d]
}
const angleTex = (deg: number, rad: boolean) => (rad ? pi(deg, 180) : `${String(deg).replace('.', '{,}')}^\\circ`)
const FN: Record<string, (d: number) => Surd> = { sin: sinS, cos: cosS, tg: tgS }
const fnTex = (f: string) => (f === 'tg' ? '\\mathrm{tg}\\,' : `\\${f} `)

const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]
const QUAD = [
  { kz: '$\\frac{\\pi}{2} < \\alpha < \\pi$', s: 1, c: -1, at: (b: number) => Math.PI - b },
  { kz: '$\\pi < \\alpha < \\frac{3\\pi}{2}$', s: -1, c: -1, at: (b: number) => Math.PI + b },
  { kz: '$\\frac{3\\pi}{2} < \\alpha < 2\\pi$', s: -1, c: 1, at: (b: number) => 2 * Math.PI - b },
  { kz: '$0 < \\alpha < \\frac{\\pi}{2}$', s: 1, c: 1, at: (b: number) => b },
]

export const trigFormGens: TGen[] = [
  {
    id: 'table-combo', make: (r) => {
      const rad = r() < 0.5
      const t1 = pick(r, ['sin', 'cos', 'tg']), t2 = pick(r, ['sin', 'cos', 'tg'])
      const ang = (f: string) => pick(r, f === 'tg' ? [30, 45, 60, 120, 135] : [0, 30, 45, 60, 90, 120, 135, 150, 180])
      const a1 = ang(t1), a2 = ang(t2)
      const k1 = pick(r, [1, 2, 4]), k2 = pick(r, [1, -1, 2, -2])
      const v = sadd(smul(FN[t1](a1), k1), smul(FN[t2](a2), k2))
      const other = t1 === 'sin' ? 'cos' : t1 === 'cos' ? 'sin' : 'tg'
      const wrong = [
        sadd(smul(FN[t1](a1), k1), smul(FN[t2](a2), -k2)),
        sadd(smul(FN[other](t1 === 'tg' ? 90 - a1 + 0 : a1), k1), smul(FN[t2](a2), k2)),
        smul(v, -1), sadd(v, ONE), smul(v, 2),
      ].map(stex)
      const term = (k: number, f: string, a: number, first: boolean) => `${first ? (k < 0 ? '-' : '') : k < 0 ? ' - ' : ' + '}${Math.abs(k) === 1 ? '' : Math.abs(k)}${fnTex(f)}${angleTex(a, rad)}`
      const ex = term(k1, t1, a1, true) + term(k2, t2, a2, false)
      return q(r, 'table-combo', l(`Өрнектің мәнін табыңыз: $${ex}$.`, `Найдите значение выражения: $${ex}$.`),
        stex(v), wrong,
        l(`$${fnTex(t1)}${angleTex(a1, rad)} = ${stex(FN[t1](a1))}$, $${fnTex(t2)}${angleTex(a2, rad)} = ${stex(FN[t2](a2))}$ → $${stex(v)}$.`),
        [value(k1 * f(t1, a1) + k2 * f(t2, a2), sval(v))])
    },
  },
  {
    id: 'triple', make: (r) => {
      const [a, b, c] = pick(r, TRIPLES), Q = pick(r, QUAD)
      const giveSin = r() < 0.5, askTg = r() < 0.4
      const sinV = Q.s * a, cosV = Q.c * b
      const given = giveSin ? `\\sin\\alpha = ${frac(sinV, c)}` : `\\cos\\alpha = ${frac(cosV, c)}`
      const ask = askTg ? '\\mathrm{tg}\\,\\alpha' : giveSin ? '\\cos\\alpha' : '\\sin\\alpha'
      const right = askTg ? frac(sinV, cosV) : giveSin ? frac(cosV, c) : frac(sinV, c)
      const wrong = askTg ? [frac(-sinV, cosV), frac(cosV, sinV), frac(-cosV, sinV), frac(sinV, c)] : giveSin ? [frac(-cosV, c), frac(b, a), frac(cosV, b + c), frac(-sinV, c)] : [frac(-sinV, c), frac(a, b), frac(-cosV, c), frac(sinV, b)]
      const al = Q.at(Math.asin(a / c))
      return q(r, 'triple', l(`$${given}$ және ${Q.kz} болса, $${ask}$ мәнін табыңыз.`, `Найдите $${ask}$, если $${given}$ и ${Q.kz}.`),
        right, wrong,
        l(`$\\sin^2\\alpha + \\cos^2\\alpha = 1$ → $|${giveSin ? '\\cos' : '\\sin'}\\alpha| = \\frac{${giveSin ? b : a}}{${c}}$; таңбасы ширек бойынша. ${askTg ? `$\\mathrm{tg}\\,\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha} = ${right}$.` : ''}`,
          `$\\sin^2\\alpha + \\cos^2\\alpha = 1$ → $|${giveSin ? '\\cos' : '\\sin'}\\alpha| = \\frac{${giveSin ? b : a}}{${c}}$; знак — по четверти. ${askTg ? `$\\mathrm{tg}\\,\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha} = ${right}$.` : ''}`),
        [value(askTg ? Math.tan(al) : giveSin ? Math.cos(al) : Math.sin(al), askTg ? sinV / cosV : giveSin ? cosV / c : sinV / c)])
    },
  },
  {
    id: 'double-from-triple', make: (r) => {
      const [a, b, c] = pick(r, TRIPLES), Q = pick(r, QUAD.slice(0, 3))
      const sinV = Q.s * a, cosV = Q.c * b
      const askSin = r() < 0.5
      const al = Q.at(Math.asin(a / c))
      const right = askSin ? frac(2 * sinV * cosV, c * c) : frac(c * c - 2 * a * a, c * c)
      const wrong = askSin ? [frac(-2 * sinV * cosV, c * c), frac(2 * sinV, c), frac(sinV * cosV, c * c), frac(2 * a * b, c)] : [frac(2 * a * a - c * c, c * c), frac(b * b - a * a + 1, c * c), frac(1 - 2 * a, c), frac(c * c - a * a, c * c)]
      return q(r, 'double-from-triple', l(`$\\sin\\alpha = ${frac(sinV, c)}$ және ${Q.kz} болса, $${askSin ? '\\sin 2\\alpha' : '\\cos 2\\alpha'}$ мәнін табыңыз.`, `Найдите $${askSin ? '\\sin 2\\alpha' : '\\cos 2\\alpha'}$, если $\\sin\\alpha = ${frac(sinV, c)}$ и ${Q.kz}.`),
        right, wrong,
        askSin ? l(`$\\cos\\alpha = ${frac(cosV, c)}$; $\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha = ${right}$.`) : l(`$\\cos 2\\alpha = 1 - 2\\sin^2\\alpha = 1 - \\frac{${2 * a * a}}{${c * c}} = ${right}$.`),
        [value(askSin ? Math.sin(2 * al) : Math.cos(2 * al), askSin ? (2 * sinV * cosV) / (c * c) : (c * c - 2 * a * a) / (c * c))])
    },
  },
  {
    id: 'double-angle-value', make: (r) => {
      const th = pick(r, [15, 75, 22.5, 67.5, 105, 165])
      const kind = ri(r, 0, 3)
      const rad = th === 15 || th === 75 ? r() < 0.5 : false
      const t = rad ? pi(th, 180) : angleTex(th, false)
      const exs = [`\\cos^2 ${t} - \\sin^2 ${t}`, `2\\sin ${t}\\cos ${t}`, `2\\cos^2 ${t} - 1`, `1 - 2\\sin^2 ${t}`]
      const isSin = kind === 1
      const v = isSin ? sinS(2 * th) : cosS(2 * th)
      const wrong = [isSin ? cosS(2 * th) : sinS(2 * th), smul(v, -1), H, R3, R2, ONE].map(stex)
      return q(r, 'double-angle-value', l(`Өрнектің мәнін табыңыз: $${exs[kind]}$.`, `Найдите значение выражения: $${exs[kind]}$.`),
        stex(v), wrong,
        l(`Қос бұрыш формуласы: $${exs[kind]} = ${isSin ? '\\sin' : '\\cos'} ${angleTex(2 * th, false)} = ${stex(v)}$.`, `Формула двойного угла: $${exs[kind]} = ${isSin ? '\\sin' : '\\cos'} ${angleTex(2 * th, false)} = ${stex(v)}$.`),
        [value([Math.cos(th * DEG) ** 2 - Math.sin(th * DEG) ** 2, 2 * Math.sin(th * DEG) * Math.cos(th * DEG), 2 * Math.cos(th * DEG) ** 2 - 1, 1 - 2 * Math.sin(th * DEG) ** 2][kind], sval(v))])
    },
  },
  {
    id: 'addition', make: (r) => {
      const kind = ri(r, 0, 3)
      const T = pick(r, [30, 45, 60, 90, 120, 135, 150])
      let a: number, b: number
      if (kind < 2) { a = 5 * ri(r, 1, T / 5 - 1); b = T - a } else { b = 5 * ri(r, 1, Math.floor((175 - T) / 5)); a = b + T }
      if (a === b || a % 15 === 0 && b % 15 === 0 && r() < 0.7) throw new Error('prefer non-table angles')
      const d = (x: number) => `${x}^\\circ`
      const exs = [`\\sin ${d(a)}\\cos ${d(b)} + \\cos ${d(a)}\\sin ${d(b)}`, `\\cos ${d(a)}\\cos ${d(b)} - \\sin ${d(a)}\\sin ${d(b)}`, `\\sin ${d(a)}\\cos ${d(b)} - \\cos ${d(a)}\\sin ${d(b)}`, `\\cos ${d(a)}\\cos ${d(b)} + \\sin ${d(a)}\\sin ${d(b)}`]
      const isSin = kind === 0 || kind === 2
      const v = isSin ? sinS(T) : cosS(T)
      const wrong = [isSin ? cosS(T) : sinS(T), smul(v, -1), H, R2, R3, ONE, ZERO].map(stex)
      const ex = [Math.sin(a * DEG) * Math.cos(b * DEG) + Math.cos(a * DEG) * Math.sin(b * DEG), Math.cos(a * DEG) * Math.cos(b * DEG) - Math.sin(a * DEG) * Math.sin(b * DEG), Math.sin(a * DEG) * Math.cos(b * DEG) - Math.cos(a * DEG) * Math.sin(b * DEG), Math.cos(a * DEG) * Math.cos(b * DEG) + Math.sin(a * DEG) * Math.sin(b * DEG)][kind]
      return q(r, 'addition', l(`Өрнектің мәнін табыңыз: $${exs[kind]}$.`, `Найдите значение выражения: $${exs[kind]}$.`),
        stex(v), wrong,
        l(`Қосу формуласы: $${isSin ? '\\sin' : '\\cos'}(${d(a)} ${kind < 2 ? '+' : '-'} ${d(b)}) = ${isSin ? '\\sin' : '\\cos'} ${d(T)} = ${stex(v)}$.`, `Формула сложения: $${isSin ? '\\sin' : '\\cos'}(${d(a)} ${kind < 2 ? '+' : '-'} ${d(b)}) = ${isSin ? '\\sin' : '\\cos'} ${d(T)} = ${stex(v)}$.`),
        [value(ex, sval(v))])
    },
  },
  {
    id: 'tg-ratio', make: (r) => {
      const t = pick(r, [2, 3, 4, 5, -2, -3, -4])
      const p = pick(r, [1, 2, 3]), qq = pick(r, [1, -1, 2, -2]), m = pick(r, [1, 2]), n = pick(r, [1, -1, 3, -3])
      const den = m * t + n
      if (!den || p * n === qq * m) throw new Error('degenerate')
      const lin = (a: number, b: number) => `${a === 1 ? '' : a}\\sin\\alpha ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}\\cos\\alpha`
      const right = frac(p * t + qq, den)
      const al = Math.atan(t)
      return q(r, 'tg-ratio', l(`$\\mathrm{tg}\\,\\alpha = ${t}$ болса, $\\dfrac{${lin(p, qq)}}{${lin(m, n)}}$ мәнін табыңыз.`, `Найдите $\\dfrac{${lin(p, qq)}}{${lin(m, n)}}$, если $\\mathrm{tg}\\,\\alpha = ${t}$.`),
        right, [frac(p + qq * t, m + n * t || 7), frac(p * t - qq, den), frac(-(p * t + qq), den), frac(p * t + qq, m * t - n || 9)],
        l(`Алымы мен бөлімін $\\cos\\alpha$-ға бөлеміз: $\\dfrac{${p === 1 ? '' : p}\\mathrm{tg}\\,\\alpha ${qq < 0 ? '-' : '+'} ${Math.abs(qq)}}{${m === 1 ? '' : m}\\mathrm{tg}\\,\\alpha ${n < 0 ? '-' : '+'} ${Math.abs(n)}} = ${right}$.`,
          `Делим числитель и знаменатель на $\\cos\\alpha$: $\\dfrac{${p === 1 ? '' : p}\\mathrm{tg}\\,\\alpha ${qq < 0 ? '-' : '+'} ${Math.abs(qq)}}{${m === 1 ? '' : m}\\mathrm{tg}\\,\\alpha ${n < 0 ? '-' : '+'} ${Math.abs(n)}} = ${right}$.`),
        [value((p * Math.sin(al) + qq * Math.cos(al)) / (m * Math.sin(al) + n * Math.cos(al)), (p * t + qq) / den)])
    },
  },
  {
    id: 'reduction', make: (r) => {
      const shifts = [[1, 2], [1, 1], [3, 2], [2, 1]] as const
      const mk = () => { const [sp, sd] = pick(r, shifts); return { f: pick(r, ['sin', 'cos']), sp, sd, plus: r() < 0.5 } }
      const t1 = mk(), t2 = mk()
      const ev = (t: ReturnType<typeof mk>, al: number) => { const x = (t.sp / t.sd) * Math.PI + (t.plus ? al : -al); return t.f === 'sin' ? Math.sin(x) : Math.cos(x) }
      const E = (al: number) => ev(t1, al) + ev(t2, al)
      const A = Math.round(E(Math.PI / 2) - 0), B = Math.round(E(0))
      // E(α) = A sinα + B cosα (exact for these shifts)
      const term = (t: ReturnType<typeof mk>) => `\\${t.f}\\left(${pi(t.sp, t.sd)} ${t.plus ? '+' : '-'} \\alpha\\right)`
      const fmt = (a: number, b: number) => {
        const mono = (k: number, f: string) => `${Math.abs(k) === 1 ? '' : Math.abs(k)}\\${f}\\alpha`
        let out = a ? `${a < 0 ? '-' : ''}${mono(a, 'sin')}` : ''
        if (b) out += out ? ` ${b < 0 ? '-' : '+'} ${mono(b, 'cos')}` : `${b < 0 ? '-' : ''}${mono(b, 'cos')}`
        return out || '0'
      }
      const right = fmt(A, B)
      const wrong = [fmt(-A, B), fmt(A, -B), fmt(-A, -B), fmt(B, A), fmt(A + B, 0), fmt(0, A + B), '0', '2\\sin\\alpha'].filter((x) => x !== right)
      return q(r, 'reduction', l(`Өрнекті ықшамдаңыз: $${term(t1)} + ${term(t2)}$.`, `Упростите выражение: $${term(t1)} + ${term(t2)}$.`),
        right, wrong,
        l(`Келтіру формулаларымен: $${term(t1)} + ${term(t2)} = ${right}$.`, `По формулам приведения: $${term(t1)} + ${term(t2)} = ${right}$.`),
        [value(E(0.37), A * Math.sin(0.37) + B * Math.cos(0.37)), value(E(1.3), A * Math.sin(1.3) + B * Math.cos(1.3))])
    },
  },
]
const f = (t: string, a: number) => (t === 'sin' ? Math.sin(a * DEG) : t === 'cos' ? Math.cos(a * DEG) : Math.tan(a * DEG))

/* ---------------- equations ---------------- */
type V = { tex: string; v: number; th: [number, number] } // value, arcsin/arccos/arctg as p/q of π (first quadrant)
const SIN_V: V[] = [
  { tex: '\\frac{1}{2}', v: 0.5, th: [1, 6] }, { tex: '\\frac{\\sqrt2}{2}', v: Math.SQRT1_2, th: [1, 4] }, { tex: '\\frac{\\sqrt3}{2}', v: Math.sqrt(3) / 2, th: [1, 3] },
]
const TG_V: V[] = [{ tex: '1', v: 1, th: [1, 4] }, { tex: '\\sqrt3', v: Math.sqrt(3), th: [1, 3] }, { tex: '\\frac{\\sqrt3}{3}', v: Math.sqrt(3) / 3, th: [1, 6] }]
const fam = (base: string, per: string) => `${base} + ${per}, \\ n \\in \\mathbb{Z}`
/** Roots of a family a + period·n inside [lo, hi]. */
const famRoots = (a: number, period: number, lo: number, hi: number) => { const out: number[] = []; for (let n = -40; n <= 40; n++) { const x = a + period * n; if (x >= lo - 1e-9 && x <= hi + 1e-9) out.push(x) } return out }

export const trigEqGens: TGen[] = [
  {
    id: 'sin-eq', make: (r) => {
      const V0 = pick(r, SIN_V), neg = r() < 0.4
      const th = pi(V0.th[0], V0.th[1])
      const wrongTh = pi(...pick(r, SIN_V.filter((x) => x !== V0)).th)
      const sgn = neg ? '(-1)^{n+1}' : '(-1)^{n}'
      const right = fam(`x = ${sgn}${th}`, '\\pi n')
      const wrong = [fam(`x = \\pm${th}`, '2\\pi n'), fam(`x = ${sgn}${wrongTh}`, '\\pi n'), fam(`x = ${sgn}${th}`, '2\\pi n'), fam(`x = ${neg ? '-' : ''}${th}`, '\\pi n')]
      const t = (V0.th[0] / V0.th[1]) * Math.PI
      const sols = [...famRoots(neg ? -t : t, 2 * Math.PI, -7, 7), ...famRoots(neg ? Math.PI + t : Math.PI - t, 2 * Math.PI, -7, 7)]
      return q(r, 'sin-eq', l(`$\\sin x = ${neg ? '-' : ''}${V0.tex}$ теңдеуін шешіңіз.`, `Решите уравнение $\\sin x = ${neg ? '-' : ''}${V0.tex}$.`),
        right, wrong, l(`$x = (-1)^n\\arcsin\\left(${neg ? '-' : ''}${V0.tex}\\right) + \\pi n$, $\\arcsin ${V0.tex} = ${th}$.`),
        [roots((x) => Math.sin(x) - (neg ? -V0.v : V0.v), sols, [-7, 7])])
    },
  },
  {
    id: 'cos-kx', make: (r) => {
      const V0 = pick(r, SIN_V), neg = r() < 0.4, k = pick(r, [1, 2, 3])
      // arccos v (first quadrant) = π/2 − arcsin v; for −v: π − that
      const [p0, d0] = V0.th
      let ap = d0 - 2 * p0, ad = 2 * d0 // π/2 − p0/d0·π
      if (neg) { ap = ad - ap }
      const th = pi(ap, ad * k)
      const per = k === 1 ? '2\\pi n' : k === 2 ? '\\pi n' : `\\frac{2\\pi n}{${k}}`
      const perW = k === 1 ? '\\pi n' : k === 2 ? '2\\pi n' : `\\frac{\\pi n}{${k}}`
      const right = fam(`x = \\pm${th}`, per)
      const wrong = [fam(`x = \\pm${th}`, perW), fam(`x = \\pm${pi(ap, ad)}`, per), fam(`x = (-1)^n${th}`, k === 1 ? '\\pi n' : `\\frac{\\pi n}{${k}}`), fam(`x = \\pm${pi(ad - ap, ad * k)}`, per)]
      const t = ((ap / ad) * Math.PI) / k
      const sols = [...famRoots(t, (2 * Math.PI) / k, -5, 5), ...famRoots(-t, (2 * Math.PI) / k, -5, 5)]
      const kx = k === 1 ? 'x' : `${k}x`
      return q(r, 'cos-kx', l(`$\\cos ${kx} = ${neg ? '-' : ''}${V0.tex}$ теңдеуін шешіңіз.`, `Решите уравнение $\\cos ${kx} = ${neg ? '-' : ''}${V0.tex}$.`),
        right, wrong, l(`$${kx} = \\pm${pi(ap, ad)} + 2\\pi n$ → ${right.replace(/^/, '$').replace(/$/, '$')}.`),
        [roots((x) => Math.cos(k * x) - (neg ? -V0.v : V0.v), sols, [-5, 5])])
    },
  },
  {
    id: 'tg-shift', make: (r) => {
      const V0 = pick(r, TG_V), neg = r() < 0.4
      const thp = (neg ? -1 : 1) * V0.th[0] * (12 / V0.th[1]) // in π/12 units
      const ph = pick(r, [2, 3, 4]) * (r() < 0.5 ? 1 : -1) // φ in π/12 units
      const ans = thp - ph // x + φ = θ → x = θ − φ
      const right = fam(`x = ${pi(ans, 12)}`, '\\pi n')
      const wrong = [fam(`x = ${pi(thp + ph, 12)}`, '\\pi n'), fam(`x = ${pi(ans, 12)}`, '2\\pi n'), fam(`x = ${pi(-thp - ph, 12)}`, '\\pi n'), fam(`x = ${pi(6 - thp - ph, 12)}`, '\\pi n')]
      const phT = pi(Math.abs(ph), 12)
      const t = (ans / 12) * Math.PI
      return q(r, 'tg-shift', l(`$\\mathrm{tg}\\left(x ${ph > 0 ? '+' : '-'} ${phT}\\right) = ${neg ? '-' : ''}${V0.tex}$ теңдеуін шешіңіз.`, `Решите уравнение $\\mathrm{tg}\\left(x ${ph > 0 ? '+' : '-'} ${phT}\\right) = ${neg ? '-' : ''}${V0.tex}$.`),
        right, wrong, l(`$x ${ph > 0 ? '+' : '-'} ${phT} = ${pi(thp, 12)} + \\pi n$ → $x = ${pi(ans, 12)} + \\pi n$.`),
        [roots((x) => Math.tan(x + (ph / 12) * Math.PI) - (neg ? -V0.v : V0.v), famRoots(t, Math.PI, -6, 6), [-6, 6])])
    },
  },
  {
    id: 'trig-quadratic', make: (r) => {
      const fn = pick(r, ['sin', 'cos'])
      const u = ri(r, -4, 4)
      let w = ri(r, -4, 4); while (w === u) w = ri(r, -4, 4)
      if (Math.abs(u) > 2 && Math.abs(w) > 2) throw new Error('no valid root')
      // roots of the polynomial in t: u/2 and w/2; solutions on [0; 2π] in π/6 units
      const SOL: Record<string, Record<number, number[]>> = {
        sin: { 0: [0, 6, 12], 1: [1, 5], 2: [3], [-1]: [7, 11], [-2]: [9] },
        cos: { 0: [3, 9], 1: [2, 10], 2: [0, 12], [-1]: [4, 8], [-2]: [6] },
      }
      const xs = [...(SOL[fn][u] ?? []), ...(SOL[fn][w] ?? [])]
      let A = 4, B = -2 * (u + w), C = u * w
      const g = [A, B, C].reduce((s, k) => (k ? gcd2(s, Math.abs(k)) : s), A); A /= g; B /= g; C /= g
      const F = fn === 'sin' ? '\\sin' : '\\cos'
      const eq = `${A === 1 ? '' : A}${F}^2 x${B ? ` ${B < 0 ? '-' : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}${F} x` : ''}${C ? ` ${C < 0 ? '-' : '+'} ${Math.abs(C)}` : ''} = 0`
      const askCount = r() < 0.5
      const sum = xs.reduce((s, x) => s + x, 0)
      const fx = (x: number) => { const t = fn === 'sin' ? Math.sin(x) : Math.cos(x); return A * t * t + B * t + C }
      const valid = [u, w].filter((z) => Math.abs(z) <= 2).map((z) => frac(z, 2))
      const sol = l(`$t = ${F} x$: $t = ${frac(u, 2)}$ немесе $t = ${frac(w, 2)}$; $|t| \\le 1$ → $${F} x = ${valid.join('$ немесе $' + F + ' x = ')}$. $[0; 2\\pi]$ кесіндісіндегі түбірлер: $${xs.sort((a, b) => a - b).map((x) => pi(x, 6)).join(';\\ ')}$.`,
        `$t = ${F} x$: $t = ${frac(u, 2)}$ или $t = ${frac(w, 2)}$; $|t| \\le 1$ → $${F} x = ${valid.join('$ или $' + F + ' x = ')}$. Корни на $[0; 2\\pi]$: $${xs.sort((a, b) => a - b).map((x) => pi(x, 6)).join(';\\ ')}$.`)
      const chk = [roots(fx, xs.map((x) => (x * Math.PI) / 6), [-0.01, 2 * Math.PI + 0.01])]
      if (askCount) {
        return q(r, 'trig-quadratic', l(`$${eq}$ теңдеуінің $[0; 2\\pi]$ кесіндісіндегі түбірлерінің санын табыңыз.`, `Найдите количество корней уравнения $${eq}$ на отрезке $[0; 2\\pi]$.`),
          String(xs.length), [xs.length + 1, xs.length - 1, xs.length + 2, 2 * xs.length, 0].map(String), sol, chk)
      }
      return q(r, 'trig-quadratic-sum', l(`$${eq}$ теңдеуінің $[0; 2\\pi]$ кесіндісіндегі түбірлерінің қосындысын табыңыз.`, `Найдите сумму корней уравнения $${eq}$ на отрезке $[0; 2\\pi]$.`),
        pi(sum, 6), [pi(sum + 6, 6), pi(sum - 3, 6), pi(sum + 2, 6), pi(2 * sum, 6), pi(sum, 12)], sol, chk)
    },
  },
  {
    id: 'zeros-count', make: (r) => {
      const fn = pick(r, ['sin', 'cos']), k = pick(r, [2, 3, 4]), L = pick(r, [1, 2])
      const count = fn === 'sin' ? k * L + 1 : k * L
      const seg = L === 1 ? '[0; \\pi]' : '[0; 2\\pi]'
      const xs = fn === 'sin' ? Array.from({ length: k * L + 1 }, (_, n) => (n * Math.PI) / k) : Array.from({ length: k * L }, (_, n) => Math.PI / (2 * k) + (n * Math.PI) / k)
      return q(r, 'zeros-count', l(`$\\${fn} ${k}x = 0$ теңдеуінің $${seg}$ кесіндісіндегі түбірлерінің санын табыңыз.`, `Найдите количество корней уравнения $\\${fn} ${k}x = 0$ на отрезке $${seg}$.`),
        String(count), [count + 1, count - 1, k, k * L * 2].map(String),
        l(fn === 'sin' ? `$${k}x = \\pi n$ → $x = \\frac{\\pi n}{${k}}$, $n = 0, 1, …, ${k * L}$ → ${count} түбір.` : `$${k}x = \\frac{\\pi}{2} + \\pi n$ → $x = \\frac{\\pi}{${2 * k}} + \\frac{\\pi n}{${k}}$, $n = 0, …, ${k * L - 1}$ → ${count} түбір.`,
          fn === 'sin' ? `$${k}x = \\pi n$ → $x = \\frac{\\pi n}{${k}}$, $n = 0, 1, …, ${k * L}$ → корней: ${count}.` : `$${k}x = \\frac{\\pi}{2} + \\pi n$ → $x = \\frac{\\pi}{${2 * k}} + \\frac{\\pi n}{${k}}$, $n = 0, …, ${k * L - 1}$ → корней: ${count}.`),
        [roots((x) => (fn === 'sin' ? Math.sin(k * x) : Math.cos(k * x)), xs, [-0.001, L * Math.PI + 0.001])])
    },
  },
  {
    id: 'homogeneous', make: (r) => {
      const opts = [
        { ex: '\\sin x - \\cos x', p: 3 }, { ex: '\\sin x + \\cos x', p: -3 }, { ex: '\\sin x - \\sqrt3\\cos x', p: 4 }, { ex: '\\sin x + \\sqrt3\\cos x', p: -4 },
        { ex: '\\sqrt3\\sin x - \\cos x', p: 2 }, { ex: '\\sqrt3\\sin x + \\cos x', p: -2 },
      ] // p: arctg in π/12 units
      const o = pick(r, opts)
      const right = fam(`x = ${pi(o.p, 12)}`, '\\pi n')
      const wrong = [fam(`x = ${pi(o.p, 12)}`, '2\\pi n'), fam(`x = ${pi(-o.p, 12)}`, '\\pi n'), fam(`x = ${pi(Math.sign(o.p) * (6 - Math.abs(o.p)), 12)}`, '\\pi n'), fam(`x = \\pm${pi(Math.abs(o.p), 12)}`, '2\\pi n')]
      const fx = (x: number) => { const s = Math.sin(x), c = Math.cos(x), r3 = Math.sqrt(3); return [s - c, s + c, s - r3 * c, s + r3 * c, r3 * s - c, r3 * s + c][opts.indexOf(o)] }
      return q(r, 'homogeneous', l(`$${o.ex} = 0$ теңдеуін шешіңіз.`, `Решите уравнение $${o.ex} = 0$.`),
        right, wrong, l(`$\\cos x \\ne 0$, теңдеуді $\\cos x$-ке бөлеміз: $\\mathrm{tg}\\,x = ${stex(tgS(o.p * 15))}$ → $x = ${pi(o.p, 12)} + \\pi n$.`, `$\\cos x \\ne 0$, делим уравнение на $\\cos x$: $\\mathrm{tg}\\,x = ${stex(tgS(o.p * 15))}$ → $x = ${pi(o.p, 12)} + \\pi n$.`),
        [roots(fx, famRoots((o.p / 12) * Math.PI, Math.PI, -6, 6), [-6, 6])])
    },
  },
  {
    id: 'product-min-root', make: (r) => {
      // positive roots in (0; 2π] in π/12 units
      const F1 = [{ ex: '\\sin x', xs: [12, 24], f: Math.sin }, { ex: '\\cos x', xs: [6, 18], f: Math.cos }]
      const s2 = Math.SQRT2, s3 = Math.sqrt(3)
      const F2 = [
        { ex: '2\\sin x - 1', xs: [2, 10], f: (x: number) => 2 * Math.sin(x) - 1 }, { ex: '2\\sin x + 1', xs: [14, 22], f: (x: number) => 2 * Math.sin(x) + 1 },
        { ex: '2\\sin x - \\sqrt3', xs: [4, 8], f: (x: number) => 2 * Math.sin(x) - s3 }, { ex: '2\\sin x - \\sqrt2', xs: [3, 9], f: (x: number) => 2 * Math.sin(x) - s2 },
        { ex: '2\\cos x - 1', xs: [4, 20], f: (x: number) => 2 * Math.cos(x) - 1 }, { ex: '2\\cos x + 1', xs: [8, 16], f: (x: number) => 2 * Math.cos(x) + 1 },
        { ex: '2\\cos x - \\sqrt3', xs: [2, 22], f: (x: number) => 2 * Math.cos(x) - s3 }, { ex: '2\\cos x + \\sqrt2', xs: [9, 15], f: (x: number) => 2 * Math.cos(x) + s2 },
      ]
      const a = pick(r, F1), b = pick(r, F2)
      const all = [...new Set([...a.xs, ...b.xs])].sort((x, y) => x - y)
      const m = all[0]
      return q(r, 'product-min-root', l(`$${a.ex}\\,(${b.ex}) = 0$ теңдеуінің ең кіші оң түбірін табыңыз.`, `Найдите наименьший положительный корень уравнения $${a.ex}\\,(${b.ex}) = 0$.`),
        pi(m, 12), [pi(all[1], 12), pi(all[2] ?? 24, 12), pi(m * 2, 12), pi(12 - m, 12), pi(m, 6)],
        l(`$${a.ex} = 0$ немесе $${b.ex} = 0$. Оң түбірлер: $${all.slice(0, 3).map((x) => pi(x, 12)).join(';\\ ')}; …$ → ең кішісі $${pi(m, 12)}$.`, `$${a.ex} = 0$ или $${b.ex} = 0$. Положительные корни: $${all.slice(0, 3).map((x) => pi(x, 12)).join(';\\ ')}; …$ → наименьший $${pi(m, 12)}$.`),
        [roots((x) => a.f(x) * b.f(x), all.map((x) => (x * Math.PI) / 12), [1e-4, 2 * Math.PI + 1e-3])])
    },
  },
]
function gcd2(a: number, b: number): number { return b ? gcd2(b, a % b) : Math.abs(a) }
