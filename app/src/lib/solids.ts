/**
 * 3D solids for the stereometry page: faces (as 3D polygons) built from the sizes, volume and surface formulas,
 * and a 2D net (развёртка). Curved surfaces are cut into thin faces marked "smooth" (no edges drawn).
 */
export type V3 = [number, number, number]
export type Face = { pts: V3[]; smooth?: boolean; base?: boolean }
export type SolidId = 'cube' | 'box' | 'prism' | 'pyramid' | 'tetra' | 'cylinder' | 'cone' | 'sphere'
export type Param = { k: string; tex: string; min: number; max: number; def: number }
export type NetShape = { kind: 'poly'; pts: [number, number][] } | { kind: 'circle'; c: [number, number]; r: number } | { kind: 'sector'; c: [number, number]; r: number; a0: number; a1: number }

export type Solid = {
  id: SolidId
  icon: string
  params: Param[]
  faces: (p: Record<string, number>) => Face[]
  /** [TeX formula, value] */
  volume: (p: Record<string, number>) => [string, number]
  surface: (p: Record<string, number>) => [string, number]
  net: (p: Record<string, number>) => NetShape[]
}

const PI = Math.PI
const N = 36
const ring = (r: number, y: number, n = N): V3[] => Array.from({ length: n }, (_, i) => [r * Math.cos((2 * PI * i) / n), y, r * Math.sin((2 * PI * i) / n)])

function prismFaces(base: [number, number][], h: number): Face[] {
  const bot = base.map(([x, z]): V3 => [x, -h / 2, z]), top = base.map(([x, z]): V3 => [x, h / 2, z])
  const sides = base.map((_, i): Face => { const j = (i + 1) % base.length; return { pts: [bot[i], bot[j], top[j], top[i]] } })
  return [{ pts: bot, base: true }, { pts: [...top].reverse(), base: true }, ...sides]
}
const box = (a: number, b: number, c: number) => prismFaces([[-a / 2, -b / 2], [a / 2, -b / 2], [a / 2, b / 2], [-a / 2, b / 2]], c)
const triangle = (a: number): [number, number][] => { const r = a / Math.sqrt(3); return [0, 1, 2].map((i) => [r * Math.cos(PI / 2 + (2 * PI * i) / 3), r * Math.sin(PI / 2 + (2 * PI * i) / 3)]) }
const f2 = (x: number) => Math.round(x * 100) / 100

export const solids: Solid[] = [
  {
    id: 'cube', icon: '🧊', params: [{ k: 'a', tex: 'a', min: 1, max: 10, def: 4 }],
    faces: ({ a }) => box(a, a, a),
    volume: ({ a }) => ['V = a^3', a ** 3], surface: ({ a }) => ['S = 6a^2', 6 * a * a],
    net: ({ a }) => [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]].map(([i, j]) => ({ kind: 'poly', pts: [[i * a, j * a], [(i + 1) * a, j * a], [(i + 1) * a, (j + 1) * a], [i * a, (j + 1) * a]] })),
  },
  {
    id: 'box', icon: '📦', params: [{ k: 'a', tex: 'a', min: 1, max: 10, def: 6 }, { k: 'b', tex: 'b', min: 1, max: 10, def: 3 }, { k: 'c', tex: 'c', min: 1, max: 10, def: 4 }],
    faces: ({ a, b, c }) => box(a, b, c),
    volume: ({ a, b, c }) => ['V = abc', a * b * c], surface: ({ a, b, c }) => ['S = 2(ab + bc + ac)', 2 * (a * b + b * c + a * c)],
    net: ({ a, b, c }) => {
      const R = (x: number, y: number, w: number, h: number): NetShape => ({ kind: 'poly', pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] })
      return [R(b, 0, a, b), R(0, b, b, c), R(b, b, a, c), R(b + a, b, b, c), R(2 * b + a, b, a, c), R(b, b + c, a, b)]
    },
  },
  {
    id: 'prism', icon: '🔷', params: [{ k: 'a', tex: 'a', min: 1, max: 10, def: 4 }, { k: 'h', tex: 'h', min: 1, max: 10, def: 6 }],
    faces: ({ a, h }) => prismFaces(triangle(a), h),
    volume: ({ a, h }) => ['V = \\dfrac{\\sqrt3}{4}a^2 h', (Math.sqrt(3) / 4) * a * a * h],
    surface: ({ a, h }) => ['S = 3ah + 2 \\cdot \\dfrac{\\sqrt3}{4}a^2', 3 * a * h + (Math.sqrt(3) / 2) * a * a],
    net: ({ a, h }) => {
      const t = (Math.sqrt(3) / 2) * a
      return [0, 1, 2].map((i): NetShape => ({ kind: 'poly', pts: [[i * a, t], [(i + 1) * a, t], [(i + 1) * a, t + h], [i * a, t + h]] }))
        .concat([{ kind: 'poly', pts: [[a, t], [2 * a, t], [1.5 * a, 0]] }, { kind: 'poly', pts: [[a, t + h], [2 * a, t + h], [1.5 * a, 2 * t + h]] }])
    },
  },
  {
    id: 'pyramid', icon: '🔺', params: [{ k: 'a', tex: 'a', min: 1, max: 10, def: 6 }, { k: 'h', tex: 'h', min: 1, max: 10, def: 5 }],
    faces: ({ a, h }) => {
      const b: V3[] = [[-a / 2, -h / 2, -a / 2], [a / 2, -h / 2, -a / 2], [a / 2, -h / 2, a / 2], [-a / 2, -h / 2, a / 2]]
      const top: V3 = [0, h / 2, 0]
      return [{ pts: b, base: true }, ...b.map((_, i): Face => ({ pts: [b[i], b[(i + 1) % 4], top] }))]
    },
    volume: ({ a, h }) => ['V = \\dfrac{1}{3}a^2 h', (a * a * h) / 3],
    surface: ({ a, h }) => ['S = a^2 + 2am,\\ m = \\sqrt{h^2 + \\tfrac{a^2}{4}}', a * a + 2 * a * Math.sqrt(h * h + (a * a) / 4)],
    net: ({ a, h }) => {
      const m = Math.sqrt(h * h + (a * a) / 4)
      const sq: NetShape = { kind: 'poly', pts: [[m, m], [m + a, m], [m + a, m + a], [m, m + a]] }
      return [sq, { kind: 'poly', pts: [[m, m], [m + a, m], [m + a / 2, 0]] }, { kind: 'poly', pts: [[m + a, m], [m + a, m + a], [2 * m + a, m + a / 2]] },
        { kind: 'poly', pts: [[m, m + a], [m + a, m + a], [m + a / 2, 2 * m + a]] }, { kind: 'poly', pts: [[m, m], [m, m + a], [0, m + a / 2]] }]
    },
  },
  {
    id: 'tetra', icon: '🔻', params: [{ k: 'a', tex: 'a', min: 1, max: 10, def: 6 }],
    faces: ({ a }) => {
      const H = a * Math.sqrt(2 / 3)
      const b = triangle(a).map(([x, z]): V3 => [x, -H / 3, z])
      const top: V3 = [0, (2 * H) / 3, 0]
      return [{ pts: b, base: true }, ...b.map((_, i): Face => ({ pts: [b[i], b[(i + 1) % 3], top] }))]
    },
    volume: ({ a }) => ['V = \\dfrac{a^3\\sqrt2}{12}', (a ** 3 * Math.SQRT2) / 12],
    surface: ({ a }) => ['S = a^2\\sqrt3', a * a * Math.sqrt(3)],
    net: ({ a }) => {
      const t = (Math.sqrt(3) / 2) * a
      return [{ kind: 'poly', pts: [[0, t], [a, t], [a / 2, 0]] }, { kind: 'poly', pts: [[a, t], [2 * a, t], [1.5 * a, 0]] }, { kind: 'poly', pts: [[a / 2, 0], [1.5 * a, 0], [a, t]] }, { kind: 'poly', pts: [[a / 2, 2 * t], [1.5 * a, 2 * t], [a, t]] }]
    },
  },
  {
    id: 'cylinder', icon: '🥫', params: [{ k: 'r', tex: 'r', min: 1, max: 6, def: 3 }, { k: 'h', tex: 'h', min: 1, max: 10, def: 6 }],
    faces: ({ r, h }) => {
      const bot = ring(r, -h / 2), top = ring(r, h / 2)
      const sides = bot.map((_, i): Face => { const j = (i + 1) % N; return { pts: [bot[i], bot[j], top[j], top[i]], smooth: true } })
      return [{ pts: bot, base: true }, { pts: [...top].reverse(), base: true }, ...sides]
    },
    volume: ({ r, h }) => ['V = \\pi r^2 h', PI * r * r * h], surface: ({ r, h }) => ['S = 2\\pi r(r + h)', 2 * PI * r * (r + h)],
    net: ({ r, h }) => {
      const w = 2 * PI * r
      return [{ kind: 'poly', pts: [[0, 2 * r], [w, 2 * r], [w, 2 * r + h], [0, 2 * r + h]] }, { kind: 'circle', c: [w / 2, r], r }, { kind: 'circle', c: [w / 2, 3 * r + h], r }]
    },
  },
  {
    id: 'cone', icon: '🍦', params: [{ k: 'r', tex: 'r', min: 1, max: 6, def: 3 }, { k: 'h', tex: 'h', min: 1, max: 10, def: 6 }],
    faces: ({ r, h }) => {
      const bot = ring(r, -h / 2), top: V3 = [0, h / 2, 0]
      return [{ pts: bot, base: true }, ...bot.map((_, i): Face => ({ pts: [bot[i], bot[(i + 1) % N], top], smooth: true }))]
    },
    volume: ({ r, h }) => ['V = \\dfrac{1}{3}\\pi r^2 h', (PI * r * r * h) / 3],
    surface: ({ r, h }) => ['S = \\pi r(r + l),\\ l = \\sqrt{r^2 + h^2}', PI * r * (r + Math.sqrt(r * r + h * h))],
    net: ({ r, h }) => {
      const l = Math.sqrt(r * r + h * h), ang = (2 * PI * r) / l
      return [{ kind: 'sector', c: [l, l], r: l, a0: PI / 2 - ang / 2, a1: PI / 2 + ang / 2 }, { kind: 'circle', c: [l, 2 * l + r], r }]
    },
  },
  {
    id: 'sphere', icon: '⚽', params: [{ k: 'r', tex: 'R', min: 1, max: 6, def: 4 }],
    faces: ({ r }) => {
      const out: Face[] = [], la = 12, lo = 24
      for (let i = 0; i < la; i++) for (let j = 0; j < lo; j++) {
        const p = (a: number, b: number): V3 => {
          const th = (PI * a) / la - PI / 2, ph = (2 * PI * b) / lo
          return [r * Math.cos(th) * Math.cos(ph), r * Math.sin(th), r * Math.cos(th) * Math.sin(ph)]
        }
        out.push({ pts: [p(i, j), p(i, j + 1), p(i + 1, j + 1), p(i + 1, j)], smooth: true })
      }
      return out
    },
    volume: ({ r }) => ['V = \\dfrac{4}{3}\\pi R^3', (4 / 3) * PI * r ** 3], surface: ({ r }) => ['S = 4\\pi R^2', 4 * PI * r * r],
    net: () => [],
  },
]

export { f2 }
