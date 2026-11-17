import type { L } from '../data/topics'
import { fnOf } from './calc/tools'

/**
 * Word-problem constructor: a few classic school situations. The student types the numbers
 * from any textbook problem (or takes random ones), leaves one value unknown and gets
 * a short note, a table, the equation, the solution and the check.
 */

export type WVar = { name: string; tex: string; label: L; unit: L }
export type Scenario = {
  id: string
  group: 'motion' | 'work' | 'mixture' | 'price'
  icon: string
  title: L
  eq: string
  vars: WVar[]
  /** default unknown */
  ask: string
  /** problem text, {name} is replaced by the value or by "?" */
  text: L
  table?: { head: L[]; rows: { label: L; cells: string[] }[] }
  gen: (r: () => number) => Record<string, number>
}

const l = (ru: string, kz: string): L => ({ ru, kz })
const ri = (r: () => number, a: number, b: number) => a + Math.floor(r() * (b - a + 1))
const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)]

const km = l('км', 'км'), kmh = l('км/ч', 'км/сағ'), h = l('ч', 'сағ'), day = l('дн.', 'күн'), kg = l('кг', 'кг'), pc = l('%', '%'), tg = l('тг', 'тг')
const V = (name: string, tex: string, label: L, unit: L): WVar => ({ name, tex, label, unit })

const speed1 = V('v1', 'v_1', l('скорость первого', 'біріншісінің жылдамдығы'), kmh)
const speed2 = V('v2', 'v_2', l('скорость второго', 'екіншісінің жылдамдығы'), kmh)
const time = V('t', 't', l('время', 'уақыт'), h)
const way = V('s', 's', l('расстояние', 'қашықтық'), km)
const motionTable = (sum: string, sumLabel: L) => ({
  head: [l('Скорость', 'Жылдамдық'), l('Время', 'Уақыт'), l('Расстояние', 'Қашықтық')],
  rows: [
    { label: l('1-й', '1-сі'), cells: ['v1', 't', 'v1*t'] },
    { label: l('2-й', '2-сі'), cells: ['v2', 't', 'v2*t'] },
    { label: sumLabel, cells: [sum, 't', 's'] },
  ],
})

export const scenarios: Scenario[] = [
  {
    id: 'toward', group: 'motion', icon: '🚗↔🚙', title: l('Движение навстречу', 'Қарсы қозғалыс'),
    eq: 's = (v1 + v2)*t', vars: [way, speed1, speed2, time], ask: 't',
    text: l(
      'Из двух городов, расстояние между которыми {s}, одновременно навстречу друг другу выехали два автомобиля. Скорость первого — {v1}, второго — {v2}. Они встретились через {t}.',
      'Арақашықтығы {s} екі қаладан бір мезгілде бір-біріне қарама-қарсы екі автокөлік шықты. Біріншісінің жылдамдығы — {v1}, екіншісінікі — {v2}. Олар {t} кейін кездесті.',
    ),
    table: motionTable('v1 + v2', l('Сближение', 'Жақындау')),
    gen: (r) => { const v1 = ri(r, 4, 12) * 10, v2 = ri(r, 4, 12) * 10, t = ri(r, 1, 5); return { v1, v2, t, s: (v1 + v2) * t } },
  },
  {
    id: 'apart', group: 'motion', icon: '🚲←→🚲', title: l('В противоположных направлениях', 'Қарама-қарсы бағытта'),
    eq: 's = (v1 + v2)*t', vars: [way, speed1, speed2, time], ask: 's',
    text: l(
      'Из одного посёлка одновременно в противоположных направлениях выехали два велосипедиста. Скорость первого — {v1}, второго — {v2}. Через {t} расстояние между ними стало {s}.',
      'Бір ауылдан бір мезгілде қарама-қарсы бағытта екі велосипедші шықты. Біріншісінің жылдамдығы — {v1}, екіншісінікі — {v2}. {t} кейін олардың арақашықтығы {s} болды.',
    ),
    table: motionTable('v1 + v2', l('Удаление', 'Алыстау')),
    gen: (r) => { const v1 = ri(r, 8, 20), v2 = ri(r, 8, 20), t = ri(r, 2, 5); return { v1, v2, t, s: (v1 + v2) * t } },
  },
  {
    id: 'chase', group: 'motion', icon: '🏍→🚲', title: l('Движение вдогонку', 'Қуып жету'),
    eq: 's = (v1 - v2)*t', vars: [way, speed1, speed2, time], ask: 't',
    text: l(
      'Мотоциклист догоняет велосипедиста. Сейчас между ними {s}. Скорость мотоциклиста — {v1}, велосипедиста — {v2}. Мотоциклист догонит велосипедиста через {t}.',
      'Мотоциклші велосипедшіні қуып келеді. Қазір олардың арасы {s}. Мотоциклшінің жылдамдығы — {v1}, велосипедшінікі — {v2}. Мотоциклші велосипедшіні {t} кейін қуып жетеді.',
    ),
    table: motionTable('v1 - v2', l('Сближение', 'Жақындау')),
    gen: (r) => { const v2 = ri(r, 10, 20), v1 = v2 + ri(r, 2, 6) * 5, t = ri(r, 1, 4); return { v1, v2, t, s: (v1 - v2) * t } },
  },
  {
    id: 'river-down', group: 'motion', icon: '🚤↓🌊', title: l('По течению реки', 'Өзен ағысымен'),
    eq: 's = (v + u)*t',
    vars: [way, V('v', 'v', l('собственная скорость', 'меншікті жылдамдық'), kmh), V('u', 'u', l('скорость течения', 'ағыс жылдамдығы'), kmh), time], ask: 'v',
    text: l(
      'Катер прошёл по течению реки {s} за {t}. Скорость течения — {u}. Собственная скорость катера — {v}.',
      'Катер өзен ағысымен {s} жолды {t} жүзіп өтті. Ағыс жылдамдығы — {u}. Катердің меншікті жылдамдығы — {v}.',
    ),
    table: {
      head: [l('Скорость', 'Жылдамдық'), l('Время', 'Уақыт'), l('Расстояние', 'Қашықтық')],
      rows: [{ label: l('По течению', 'Ағыспен'), cells: ['v + u', 't', 's'] }],
    },
    gen: (r) => { const v = ri(r, 12, 30), u = ri(r, 1, 4), t = ri(r, 2, 5); return { v, u, t, s: (v + u) * t } },
  },
  {
    id: 'river-up', group: 'motion', icon: '🚤↑🌊', title: l('Против течения реки', 'Өзен ағысына қарсы'),
    eq: 's = (v - u)*t',
    vars: [way, V('v', 'v', l('собственная скорость', 'меншікті жылдамдық'), kmh), V('u', 'u', l('скорость течения', 'ағыс жылдамдығы'), kmh), time], ask: 't',
    text: l(
      'Лодка плывёт против течения реки. Её собственная скорость — {v}, скорость течения — {u}. Расстояние {s} она проплывёт за {t}.',
      'Қайық өзен ағысына қарсы жүзіп келеді. Оның меншікті жылдамдығы — {v}, ағыс жылдамдығы — {u}. {s} жолды ол {t} жүзіп өтеді.',
    ),
    table: {
      head: [l('Скорость', 'Жылдамдық'), l('Время', 'Уақыт'), l('Расстояние', 'Қашықтық')],
      rows: [{ label: l('Против течения', 'Ағысқа қарсы'), cells: ['v - u', 't', 's'] }],
    },
    gen: (r) => { const u = ri(r, 1, 4), v = u + ri(r, 4, 16), t = ri(r, 2, 6); return { v, u, t, s: (v - u) * t } },
  },
  {
    id: 'work', group: 'work', icon: '👷+👷', title: l('Совместная работа', 'Бірлескен жұмыс'),
    eq: '1/t = 1/t1 + 1/t2',
    vars: [
      V('t', 't', l('время вместе', 'бірге уақыт'), day),
      V('t1', 't_1', l('время первой бригады', 'бірінші бригада уақыты'), day),
      V('t2', 't_2', l('время второй бригады', 'екінші бригада уақыты'), day),
    ],
    ask: 't',
    text: l(
      'Первая бригада может выполнить заказ за {t1}, вторая — за {t2}. Работая вместе, они выполнят заказ за {t}.',
      'Бірінші бригада тапсырысты {t1}, екіншісі {t2} орындай алады. Бірге жұмыс істесе, олар тапсырысты {t} орындайды.',
    ),
    table: {
      head: [l('Время', 'Уақыт'), l('Производительность (часть работы в день)', 'Өнімділік (күніне жұмыстың бөлігі)')],
      rows: [
        { label: l('1-я бригада', '1-бригада'), cells: ['t1', '1/t1'] },
        { label: l('2-я бригада', '2-бригада'), cells: ['t2', '1/t2'] },
        { label: l('Вместе', 'Бірге'), cells: ['t', '1/t'] },
      ],
    },
    gen: (r) => {
      const [t1, t2] = pick(r, [[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [6, 3], [15, 10], [12, 4], [30, 20], [5, 20], [8, 24]])
      return { t1, t2, t: (t1 * t2) / (t1 + t2) }
    },
  },
  {
    id: 'mixture', group: 'mixture', icon: '🧪+🧪', title: l('Смешивание растворов', 'Ерітінділерді араластыру'),
    eq: 'm1*p1 + m2*p2 = (m1 + m2)*p',
    vars: [
      V('p', 'p', l('концентрация смеси', 'қоспа концентрациясы'), pc),
      V('m1', 'm_1', l('масса 1-го раствора', '1-ерітінді массасы'), kg),
      V('p1', 'p_1', l('концентрация 1-го', '1-сінің концентрациясы'), pc),
      V('m2', 'm_2', l('масса 2-го раствора', '2-ерітінді массасы'), kg),
      V('p2', 'p_2', l('концентрация 2-го', '2-сінің концентрациясы'), pc),
    ],
    ask: 'p',
    text: l(
      'Смешали {m1} раствора соли с концентрацией {p1} и {m2} раствора с концентрацией {p2}. Получился раствор с концентрацией {p}.',
      'Концентрациясы {p1} тұз ерітіндісінің {m1} және концентрациясы {p2} ерітіндінің {m2} араластырылды. Концентрациясы {p} ерітінді шықты.',
    ),
    table: {
      head: [l('Масса раствора', 'Ерітінді массасы'), l('Концентрация, %', 'Концентрация, %'), l('Масса соли', 'Тұз массасы')],
      rows: [
        { label: l('1-й', '1-сі'), cells: ['m1', 'p1', 'm1*p1/100'] },
        { label: l('2-й', '2-сі'), cells: ['m2', 'p2', 'm2*p2/100'] },
        { label: l('Смесь', 'Қоспа'), cells: ['m1 + m2', 'p', '(m1 + m2)*p/100'] },
      ],
    },
    gen: (r) => {
      for (;;) {
        const m1 = ri(r, 1, 10), m2 = ri(r, 1, 10), p1 = ri(r, 1, 9) * 5, p2 = ri(r, 1, 18) * 5
        const p = (m1 * p1 + m2 * p2) / (m1 + m2)
        if (p1 !== p2 && Number.isInteger(p)) return { m1, m2, p1, p2, p }
      }
    },
  },
  {
    id: 'raise', group: 'price', icon: '🏷↑', title: l('Повышение цены', 'Бағаның өсуі'),
    eq: 'b = a*(1 + p/100)',
    vars: [V('b', 'b', l('новая цена', 'жаңа баға'), tg), V('a', 'a', l('старая цена', 'бұрынғы баға'), tg), V('p', 'p', l('процент повышения', 'өсу пайызы'), pc)],
    ask: 'b',
    text: l('Товар стоил {a}. Цена выросла на {p}, и теперь товар стоит {b}.', 'Тауар {a} тұратын. Баға {p} өсіп, енді тауар {b} тұрады.'),
    gen: (r) => { const a = ri(r, 2, 40) * 500, p = ri(r, 1, 8) * 5; return { a, p, b: (a * (100 + p)) / 100 } },
  },
  {
    id: 'discount', group: 'price', icon: '🏷↓', title: l('Скидка', 'Жеңілдік'),
    eq: 'b = a*(1 - p/100)',
    vars: [V('b', 'b', l('цена со скидкой', 'жеңілдікпен баға'), tg), V('a', 'a', l('цена без скидки', 'жеңілдіксіз баға'), tg), V('p', 'p', l('скидка', 'жеңілдік'), pc)],
    ask: 'p',
    text: l('На товар ценой {a} сделали скидку {p}. Цена со скидкой — {b}.', 'Бағасы {a} тауарға {p} жеңілдік жасалды. Жеңілдікпен бағасы — {b}.'),
    gen: (r) => { const a = ri(r, 2, 40) * 500, p = ri(r, 1, 14) * 5; return { a, p, b: (a * (100 - p)) / 100 } },
  },
]

/** Put numbers into an expression (variable names are whole words). */
export const subst = (expr: string, vals: Record<string, number | string>, wrap = true) =>
  expr.replace(/\b[a-z][a-z0-9]*\b/gi, (m) => (m in vals ? (wrap ? `(${vals[m]})` : String(vals[m])) : m))

/** Positive root of the scenario equation for the unknown (scan + bisection). */
export function solveNumeric(eq: string, known: Record<string, number>, unknown: string): number | null {
  const [L, R] = eq.split('=')
  const f = fnOf(`(${subst(L, known)}) - (${subst(R, known)})`, unknown)
  let prevX = 1e-6
  let prev = f(prevX)
  for (let i = 1; i <= 3000; i++) {
    const x = 1e-6 * 10 ** (i / 250) // up to 1e6
    const y = f(x)
    if (Number.isFinite(prev) && Number.isFinite(y) && (prev === 0 || prev * y < 0)) {
      if (prev === 0) return prevX
      let lo = prevX, hi = x
      for (let k = 0; k < 80; k++) {
        const m = (lo + hi) / 2
        if (f(lo) * f(m) <= 0) hi = m
        else lo = m
      }
      const v = (lo + hi) / 2
      return Math.abs(v - Math.round(v)) < 1e-7 ? Math.round(v) : v
    }
    prevX = x
    prev = y
  }
  return null
}
