/**
 * Shapes solver: every figure is a list of quantities and the formulas between them.
 * The student fills in whatever is known; formulas with exactly one unknown are solved one by one
 * (numerically, so every formula works "in any direction"), until nothing new can be found.
 */
import type { L } from '../../data/topics'

export type ShapeVar = { k: string; tex: string; label: L; angle?: boolean }
export type ShapeRel = { tex: string; vars: string[]; f: (v: Record<string, number>) => number }
export type Shape = { id: string; title: L; icon: string; solid?: boolean; vars: ShapeVar[]; rels: ShapeRel[] }
export type ShapeStep = { tex: string; found: string }
export type ShapeResult = { values: Record<string, number>; given: string[]; steps: ShapeStep[]; missing: string[]; conflict?: string }

const PI = Math.PI
const rad = (d: number) => (d * PI) / 180
const V = (k: string, tex: string, ru: string, kz: string, angle = false): ShapeVar => ({ k, tex, label: { ru, kz }, angle })
const R = (tex: string, vars: string[], f: ShapeRel['f']): ShapeRel => ({ tex, vars, f })

const side = V('a', 'a', 'Сторона', 'Қабырға')
const P = V('P', 'P', 'Периметр', 'Периметр')
const S = V('S', 'S', 'Площадь', 'Аудан')

export const shapes: Shape[] = [
  {
    id: 'square', icon: '◻', title: { ru: 'Квадрат', kz: 'Шаршы' },
    vars: [side, V('d', 'd', 'Диагональ', 'Диагональ'), P, S, V('r', 'r', 'Радиус вписанной окружности', 'Іштей сызылған шеңбер радиусы'), V('R', 'R', 'Радиус описанной окружности', 'Сырттай сызылған шеңбер радиусы')],
    rels: [
      R('P = 4a', ['P', 'a'], (v) => v.P - 4 * v.a), R('S = a^2', ['S', 'a'], (v) => v.S - v.a ** 2),
      R('d = a\\sqrt2', ['d', 'a'], (v) => v.d - v.a * Math.SQRT2), R('r = \\dfrac{a}{2}', ['r', 'a'], (v) => v.r - v.a / 2),
      R('R = \\dfrac{d}{2}', ['R', 'd'], (v) => v.R - v.d / 2),
    ],
  },
  {
    id: 'rect', icon: '▭', title: { ru: 'Прямоугольник', kz: 'Тіктөртбұрыш' },
    vars: [V('a', 'a', 'Длина', 'Ұзындығы'), V('b', 'b', 'Ширина', 'Ені'), V('d', 'd', 'Диагональ', 'Диагональ'), P, S],
    rels: [
      R('P = 2(a + b)', ['P', 'a', 'b'], (v) => v.P - 2 * (v.a + v.b)), R('S = ab', ['S', 'a', 'b'], (v) => v.S - v.a * v.b),
      R('d^2 = a^2 + b^2', ['d', 'a', 'b'], (v) => v.d ** 2 - v.a ** 2 - v.b ** 2),
    ],
  },
  {
    id: 'circle', icon: '◯', title: { ru: 'Круг и окружность', kz: 'Дөңгелек және шеңбер' },
    vars: [V('r', 'r', 'Радиус', 'Радиус'), V('d', 'd', 'Диаметр', 'Диаметр'), V('C', 'C', 'Длина окружности', 'Шеңбер ұзындығы'), S],
    rels: [
      R('d = 2r', ['d', 'r'], (v) => v.d - 2 * v.r), R('C = 2\\pi r', ['C', 'r'], (v) => v.C - 2 * PI * v.r),
      R('S = \\pi r^2', ['S', 'r'], (v) => v.S - PI * v.r ** 2),
    ],
  },
  {
    id: 'rtri', icon: '◺', title: { ru: 'Прямоугольный треугольник', kz: 'Тікбұрышты үшбұрыш' },
    vars: [
      V('a', 'a', 'Катет', 'Катет'), V('b', 'b', 'Катет', 'Катет'), V('c', 'c', 'Гипотенуза', 'Гипотенуза'),
      V('al', '\\alpha', 'Угол против a, °', 'a-ға қарсы бұрыш, °', true), V('be', '\\beta', 'Угол против b, °', 'b-ға қарсы бұрыш, °', true),
      V('h', 'h', 'Высота к гипотенузе', 'Гипотенузаға биіктік'), S, P,
    ],
    rels: [
      R('c^2 = a^2 + b^2', ['c', 'a', 'b'], (v) => v.c ** 2 - v.a ** 2 - v.b ** 2), R('\\alpha + \\beta = 90^\\circ', ['al', 'be'], (v) => v.al + v.be - 90),
      R('\\sin\\alpha = \\dfrac{a}{c}', ['al', 'a', 'c'], (v) => Math.sin(rad(v.al)) - v.a / v.c), R('\\operatorname{tg}\\alpha = \\dfrac{a}{b}', ['al', 'a', 'b'], (v) => Math.tan(rad(v.al)) - v.a / v.b),
      R('\\sin\\beta = \\dfrac{b}{c}', ['be', 'b', 'c'], (v) => Math.sin(rad(v.be)) - v.b / v.c),
      R('S = \\dfrac{ab}{2}', ['S', 'a', 'b'], (v) => v.S - (v.a * v.b) / 2), R('h = \\dfrac{ab}{c}', ['h', 'a', 'b', 'c'], (v) => v.h - (v.a * v.b) / v.c),
      R('P = a + b + c', ['P', 'a', 'b', 'c'], (v) => v.P - v.a - v.b - v.c),
    ],
  },
  {
    id: 'trap', icon: '⏢', title: { ru: 'Равнобедренная трапеция', kz: 'Тең бүйірлі трапеция' },
    vars: [
      V('a', 'a', 'Нижнее основание', 'Үлкен табаны'), V('b', 'b', 'Верхнее основание', 'Кіші табаны'), V('c', 'c', 'Боковая сторона', 'Бүйір қабырғасы'),
      V('h', 'h', 'Высота', 'Биіктігі'), V('m', 'm', 'Средняя линия', 'Орта сызығы'), S, P,
    ],
    rels: [
      R('m = \\dfrac{a + b}{2}', ['m', 'a', 'b'], (v) => v.m - (v.a + v.b) / 2), R('S = m \\cdot h', ['S', 'm', 'h'], (v) => v.S - v.m * v.h),
      R('c^2 = h^2 + \\left(\\dfrac{a - b}{2}\\right)^2', ['c', 'h', 'a', 'b'], (v) => v.c ** 2 - v.h ** 2 - ((v.a - v.b) / 2) ** 2),
      R('P = a + b + 2c', ['P', 'a', 'b', 'c'], (v) => v.P - v.a - v.b - 2 * v.c),
    ],
  },
  {
    id: 'para', icon: '▱', title: { ru: 'Параллелограмм', kz: 'Параллелограмм' },
    vars: [V('a', 'a', 'Сторона', 'Қабырға'), V('b', 'b', 'Сторона', 'Қабырға'), V('h', 'h_a', 'Высота к a', 'a-ға биіктік'), V('al', '\\alpha', 'Угол, °', 'Бұрыш, °', true), S, P],
    rels: [
      R('S = a \\cdot h_a', ['S', 'a', 'h'], (v) => v.S - v.a * v.h), R('h_a = b \\sin\\alpha', ['h', 'b', 'al'], (v) => v.h - v.b * Math.sin(rad(v.al))),
      R('P = 2(a + b)', ['P', 'a', 'b'], (v) => v.P - 2 * (v.a + v.b)),
    ],
  },
  {
    id: 'rhomb', icon: '◇', title: { ru: 'Ромб', kz: 'Ромб' },
    vars: [side, V('d1', 'd_1', 'Диагональ', 'Диагональ'), V('d2', 'd_2', 'Диагональ', 'Диагональ'), V('h', 'h', 'Высота', 'Биіктігі'), V('al', '\\alpha', 'Угол, °', 'Бұрыш, °', true), S, P],
    rels: [
      R('S = \\dfrac{d_1 d_2}{2}', ['S', 'd1', 'd2'], (v) => v.S - (v.d1 * v.d2) / 2), R('4a^2 = d_1^2 + d_2^2', ['a', 'd1', 'd2'], (v) => 4 * v.a ** 2 - v.d1 ** 2 - v.d2 ** 2),
      R('P = 4a', ['P', 'a'], (v) => v.P - 4 * v.a), R('S = a \\cdot h', ['S', 'a', 'h'], (v) => v.S - v.a * v.h),
      R('S = a^2 \\sin\\alpha', ['S', 'a', 'al'], (v) => v.S - v.a ** 2 * Math.sin(rad(v.al))),
    ],
  },
  {
    id: 'cube', icon: '🧊', solid: true, title: { ru: 'Куб', kz: 'Куб' },
    vars: [V('a', 'a', 'Ребро', 'Қыры'), V('d', 'd', 'Диагональ куба', 'Куб диагоналі'), V('S', 'S', 'Площадь поверхности', 'Бет ауданы'), V('V', 'V', 'Объём', 'Көлемі')],
    rels: [
      R('V = a^3', ['V', 'a'], (v) => v.V - v.a ** 3), R('S = 6a^2', ['S', 'a'], (v) => v.S - 6 * v.a ** 2), R('d = a\\sqrt3', ['d', 'a'], (v) => v.d - v.a * Math.sqrt(3)),
    ],
  },
  {
    id: 'box', icon: '📦', solid: true, title: { ru: 'Прямоугольный параллелепипед', kz: 'Тікбұрышты параллелепипед' },
    vars: [V('a', 'a', 'Длина', 'Ұзындығы'), V('b', 'b', 'Ширина', 'Ені'), V('c', 'c', 'Высота', 'Биіктігі'), V('d', 'd', 'Диагональ', 'Диагоналі'), V('S', 'S', 'Площадь поверхности', 'Бет ауданы'), V('V', 'V', 'Объём', 'Көлемі')],
    rels: [
      R('V = abc', ['V', 'a', 'b', 'c'], (v) => v.V - v.a * v.b * v.c), R('S = 2(ab + bc + ac)', ['S', 'a', 'b', 'c'], (v) => v.S - 2 * (v.a * v.b + v.b * v.c + v.a * v.c)),
      R('d^2 = a^2 + b^2 + c^2', ['d', 'a', 'b', 'c'], (v) => v.d ** 2 - v.a ** 2 - v.b ** 2 - v.c ** 2),
    ],
  },
  {
    id: 'cyl', icon: '🥫', solid: true, title: { ru: 'Цилиндр', kz: 'Цилиндр' },
    vars: [V('r', 'r', 'Радиус', 'Радиус'), V('h', 'h', 'Высота', 'Биіктігі'), V('Sb', 'S_{\\text{бок}}', 'Боковая поверхность', 'Бүйір беті'), V('S', 'S', 'Полная поверхность', 'Толық беті'), V('V', 'V', 'Объём', 'Көлемі')],
    rels: [
      R('S_{\\text{бок}} = 2\\pi r h', ['Sb', 'r', 'h'], (v) => v.Sb - 2 * PI * v.r * v.h), R('S = S_{\\text{бок}} + 2\\pi r^2', ['S', 'Sb', 'r'], (v) => v.S - v.Sb - 2 * PI * v.r ** 2),
      R('V = \\pi r^2 h', ['V', 'r', 'h'], (v) => v.V - PI * v.r ** 2 * v.h),
    ],
  },
  {
    id: 'cone', icon: '🍦', solid: true, title: { ru: 'Конус', kz: 'Конус' },
    vars: [V('r', 'r', 'Радиус', 'Радиус'), V('h', 'h', 'Высота', 'Биіктігі'), V('l', 'l', 'Образующая', 'Жасаушы'), V('Sb', 'S_{\\text{бок}}', 'Боковая поверхность', 'Бүйір беті'), V('S', 'S', 'Полная поверхность', 'Толық беті'), V('V', 'V', 'Объём', 'Көлемі')],
    rels: [
      R('l^2 = r^2 + h^2', ['l', 'r', 'h'], (v) => v.l ** 2 - v.r ** 2 - v.h ** 2), R('S_{\\text{бок}} = \\pi r l', ['Sb', 'r', 'l'], (v) => v.Sb - PI * v.r * v.l),
      R('S = S_{\\text{бок}} + \\pi r^2', ['S', 'Sb', 'r'], (v) => v.S - v.Sb - PI * v.r ** 2), R('V = \\dfrac{1}{3}\\pi r^2 h', ['V', 'r', 'h'], (v) => v.V - (PI * v.r ** 2 * v.h) / 3),
    ],
  },
  {
    id: 'sphere', icon: '⚽', solid: true, title: { ru: 'Шар', kz: 'Шар' },
    vars: [V('R', 'R', 'Радиус', 'Радиус'), V('d', 'd', 'Диаметр', 'Диаметр'), V('S', 'S', 'Площадь сферы', 'Сфера ауданы'), V('V', 'V', 'Объём', 'Көлемі')],
    rels: [
      R('d = 2R', ['d', 'R'], (v) => v.d - 2 * v.R), R('S = 4\\pi R^2', ['S', 'R'], (v) => v.S - 4 * PI * v.R ** 2), R('V = \\dfrac{4}{3}\\pi R^3', ['V', 'R'], (v) => v.V - (4 / 3) * PI * v.R ** 3),
    ],
  },
  {
    id: 'pyr', icon: '🔺', solid: true, title: { ru: 'Правильная четырёхугольная пирамида', kz: 'Дұрыс төртбұрышты пирамида' },
    vars: [
      V('a', 'a', 'Сторона основания', 'Табан қабырғасы'), V('h', 'h', 'Высота', 'Биіктігі'), V('m', 'm', 'Апофема', 'Апофема'), V('b', 'b', 'Боковое ребро', 'Бүйір қыры'),
      V('Sb', 'S_{\\text{бок}}', 'Боковая поверхность', 'Бүйір беті'), V('S', 'S', 'Полная поверхность', 'Толық беті'), V('V', 'V', 'Объём', 'Көлемі'),
    ],
    rels: [
      R('m^2 = h^2 + \\left(\\dfrac{a}{2}\\right)^2', ['m', 'h', 'a'], (v) => v.m ** 2 - v.h ** 2 - (v.a / 2) ** 2),
      R('b^2 = h^2 + \\dfrac{a^2}{2}', ['b', 'h', 'a'], (v) => v.b ** 2 - v.h ** 2 - v.a ** 2 / 2),
      R('S_{\\text{бок}} = 2am', ['Sb', 'a', 'm'], (v) => v.Sb - 2 * v.a * v.m), R('S = S_{\\text{бок}} + a^2', ['S', 'Sb', 'a'], (v) => v.S - v.Sb - v.a ** 2),
      R('V = \\dfrac{1}{3}a^2 h', ['V', 'a', 'h'], (v) => v.V - (v.a ** 2 * v.h) / 3),
    ],
  },
]

/** One positive root of g on (lo, hi): geometric scan for a sign change, then bisection. */
function solveOne(g: (x: number) => number, angle: boolean): number | null {
  const xs: number[] = []
  if (angle) for (let i = 1; i < 1800; i++) xs.push(i / 10)
  else for (let i = 0; i <= 3000; i++) xs.push(1e-6 * 10 ** (i / 250))
  let x0 = xs[0], y0 = g(x0)
  for (let i = 1; i < xs.length; i++) {
    const x1 = xs[i], y1 = g(x1)
    if (Number.isFinite(y0) && Number.isFinite(y1)) {
      if (y0 === 0) return x0
      if (y0 * y1 < 0) {
        let lo = x0, hi = x1, flo = y0
        for (let k = 0; k < 100; k++) {
          const mid = (lo + hi) / 2, fm = g(mid)
          if (flo * fm <= 0) hi = mid
          else { lo = mid; flo = fm }
        }
        const r = (lo + hi) / 2
        if (Math.abs(g(r)) < 1e-6 * (1 + Math.abs(y0) + Math.abs(y1))) return r
      }
    }
    x0 = x1; y0 = y1
  }
  return null
}

export function solveShape(shape: Shape, input: Record<string, string>): ShapeResult {
  const values: Record<string, number> = {}
  for (const v of shape.vars) {
    const s = (input[v.k] ?? '').replace(',', '.').trim()
    if (s !== '' && Number.isFinite(Number(s)) && Number(s) > 0) values[v.k] = Number(s)
  }
  const given = Object.keys(values)
  const steps: ShapeStep[] = []
  let progress = true
  while (progress) {
    progress = false
    for (const rel of shape.rels) {
      const unknown = rel.vars.filter((k) => !(k in values))
      if (unknown.length !== 1) continue
      const k = unknown[0]
      const meta = shape.vars.find((x) => x.k === k)!
      const x = solveOne((t) => rel.f({ ...values, [k]: t }), Boolean(meta.angle))
      if (x === null) continue
      values[k] = x
      steps.push({ tex: `${rel.tex} \\;\\Rightarrow\\; ${meta.tex} ${Number.isInteger(Math.round(x * 1e6) / 1e6) ? '=' : '\\approx'} ${fmt(x)}`, found: k })
      progress = true
    }
  }
  // given data that do not fit together
  let conflict: string | undefined
  for (const rel of shape.rels) {
    if (rel.vars.every((k) => k in values)) {
      const scale = 1 + Math.max(...rel.vars.map((k) => Math.abs(values[k]))) ** 2
      if (Math.abs(rel.f(values)) > 1e-5 * scale) { conflict = rel.tex; break }
    }
  }
  const missing = shape.vars.filter((v) => !(v.k in values)).map((v) => v.k)
  return { values, given, steps, missing, conflict }
}

/** 12, 3,5 or 7,071 — at most three decimals, with a comma */
export const fmt = (x: number) => {
  const r = Math.round(x * 1000) / 1000
  return String(r).replace('.', '{,}')
}
