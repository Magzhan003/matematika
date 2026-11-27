/** Planimetry, stereometry, coordinates and vectors (types of the trainer, ch. VIII–X). */
import { frac, l, pi, pick, q, ri, value, type TGen } from './kit'

const TRI: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25], [12, 16, 20], [20, 21, 29]]
const BOX: [number, number, number, number][] = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9], [2, 10, 11, 15], [6, 6, 7, 11], [3, 4, 12, 13], [2, 5, 14, 15]]
const cm = l('см'), cm2 = l('см²', 'см²')
const u = (x: string | number, unit = cm) => l(`${x} ${unit.kz}`, `${x} ${unit.ru}`)
/** k√b or an integer, in TeX. */
const surd = (k: number, b: number) => (b === 1 ? String(k) : `${k === 1 ? '' : k}\\sqrt{${b}}`)
const DEG = Math.PI / 180

export const planimetryGens: TGen[] = [
  {
    id: 'right-triangle', make: (r) => {
      const [a, b, c] = pick(r, TRI), kind = ri(r, 0, 3)
      const heron = (x: number, y: number, z: number) => { const p = (x + y + z) / 2; return Math.sqrt(p * (p - x) * (p - y) * (p - z)) }
      const qs = [
        { kz: 'гипотенузасын', ru: 'гипотенузу', ans: String(c), w: [a + b, c + 1, b + 1, Math.abs(b - a) + c].map(String), v: Math.hypot(a, b), e: c },
        { kz: 'ауданын', ru: 'площадь', ans: String((a * b) / 2), w: [a * b, a * c / 2, (a + b + c), (a * b) / 2 + a].map((x) => String(Number(x.toFixed(2))).replace('.', '{,}')), v: heron(a, b, c), e: (a * b) / 2 },
        { kz: 'гипотенузаға түсірілген биіктігін', ru: 'высоту, опущенную на гипотенузу', ans: frac(a * b, c), w: [frac(c, 2), frac(a * b, 2), frac(a + b, 2), frac(a * c, b)], v: (2 * heron(a, b, c)) / c, e: (a * b) / c },
        { kz: 'гипотенузаға жүргізілген медианасын', ru: 'медиану, проведённую к гипотенузе', ans: frac(c, 2), w: [frac(a * b, c), String(c), frac(a + b, 2), frac(c, 3)], v: Math.hypot(a / 2, b / 2), e: c / 2 },
      ][kind]
      return q(r, `right-triangle-${kind}`, l(`Тікбұрышты үшбұрыштың катеттері ${a} см және ${b} см. Оның ${qs.kz} табыңыз.`, `Катеты прямоугольного треугольника равны ${a} см и ${b} см. Найдите его ${qs.ru}.`),
        qs.ans, qs.w,
        l(`Гипотенуза $c = \\sqrt{${a}^2 + ${b}^2} = ${c}$; ${['$c = ' + c + '$', `$S = \\frac{ab}{2} = ${(a * b) / 2}$`, `$h = \\frac{ab}{c} = ${frac(a * b, c)}$`, `$m = \\frac{c}{2} = ${frac(c, 2)}$`][kind]}.`, `Гипотенуза $c = \\sqrt{${a}^2 + ${b}^2} = ${c}$; ${['$c = ' + c + '$', `$S = \\frac{ab}{2} = ${(a * b) / 2}$`, `$h = \\frac{ab}{c} = ${frac(a * b, c)}$`, `$m = \\frac{c}{2} = ${frac(c, 2)}$`][kind]}.`),
        [value(qs.v, qs.e)])
    },
  },
  {
    id: 'area-angle', make: (r) => {
      const a = ri(r, 2, 12), b = ri(r, 2, 12), C = pick(r, [30, 45, 60, 90, 120, 135, 150])
      const sinC: Record<number, [number, number]> = { 30: [1, 2], 150: [1, 2], 90: [1, 1], 45: [2, 2], 135: [2, 2], 60: [3, 2], 120: [3, 2] }
      const [rad, den] = sinC[C]
      const num = a * b
      // S = ab·sinC/2: rational part num/(2·den) with √rad
      const g = (x: number, y: number): number => (y ? g(y, x % y) : x)
      const d = 2 * den, gg = g(num, d), nn = num / gg, dd = d / gg
      const right = rad === 1 ? frac(num, d) : dd === 1 ? surd(nn, rad) : `\\frac{${surd(nn, rad)}}{${dd}}`
      const wrong = [frac(num, 2), rad === 1 ? `\\frac{${num}\\sqrt3}{4}` : frac(num, d), String(num), rad === 1 ? frac(num, 4) : `\\frac{${surd(nn, rad === 2 ? 3 : 2)}}{${dd}}`, surd(num, rad)]
      return q(r, 'area-angle', l(`Үшбұрыштың екі қабырғасы ${a} см және ${b} см, ал олардың арасындағы бұрыш $${C}^\\circ$. Үшбұрыштың ауданын табыңыз (см²).`, `Две стороны треугольника равны ${a} см и ${b} см, а угол между ними $${C}^\\circ$. Найдите площадь треугольника (см²).`),
        right, wrong, l(`$S = \\frac12 ab\\sin C = \\frac12\\cdot${a}\\cdot${b}\\cdot\\sin ${C}^\\circ = ${right}$.`), [value(0.5 * a * b * Math.sin(C * DEG), (num * Math.sqrt(rad)) / d)])
    },
  },
  {
    id: 'cosine-law', make: (r) => {
      const [a, b, C, c] = pick(r, [[3, 8, 60, 7], [5, 8, 60, 7], [8, 15, 60, 13], [7, 15, 60, 13], [5, 21, 60, 19], [3, 5, 120, 7], [7, 8, 120, 13], [5, 16, 120, 19], [6, 10, 120, 14], [16, 21, 60, 19], [9, 15, 120, 21], [6, 16, 60, 14]] as const)
      return q(r, 'cosine-law', l(`Үшбұрыштың екі қабырғасы ${a} см және ${b} см, ал олардың арасындағы бұрыш $${C}^\\circ$. Үшінші қабырғасын табыңыз.`, `Две стороны треугольника равны ${a} см и ${b} см, угол между ними $${C}^\\circ$. Найдите третью сторону.`),
        u(c), [a + b - 1, Math.round(Math.hypot(a, b)) === c ? c + 2 : Math.round(Math.hypot(a, b)), c + 1, c - 2].filter((x) => x !== c).map((x) => u(x)).concat([u(`\\sqrt{${a * a + b * b}}`)].map((x) => l(`$${x.kz.replace(' см', '')}$ см`, `$${x.ru.replace(' см', '')}$ см`))),
        l(`$c^2 = ${a}^2 + ${b}^2 - 2\\cdot${a}\\cdot${b}\\cos ${C}^\\circ = ${c * c}$ → $c = ${c}$ см.`), [value(Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C * DEG)), c)])
    },
  },
  {
    id: 'rhombus', make: (r) => {
      const [x, y, s] = pick(r, TRI), d1 = 2 * x, d2 = 2 * y
      const askSide = r() < 0.5
      return q(r, 'rhombus', l(`Ромбтың диагональдары ${d1} см және ${d2} см. Оның ${askSide ? 'қабырғасын' : 'ауданын (см²)'} табыңыз.`, `Диагонали ромба равны ${d1} см и ${d2} см. Найдите его ${askSide ? 'сторону' : 'площадь (см²)'}.`),
        askSide ? u(s) : u(d1 * d2 / 2, cm2), askSide ? [2 * s, Math.round(Math.hypot(d1, d2)), s + 1, (d1 + d2) / 2].filter((v) => v !== s).map((v) => u(v)) : [d1 * d2, d1 * d2 / 4, 2 * (d1 + d2), d1 * d2 / 2 + d1].map((v) => u(v, cm2)),
        askSide ? l(`Диагональдар қақ бөлінеді және перпендикуляр: $a = \\sqrt{${x}^2 + ${y}^2} = ${s}$ см.`, `Диагонали делятся пополам и перпендикулярны: $a = \\sqrt{${x}^2 + ${y}^2} = ${s}$ см.`) : l(`$S = \\frac{d_1 d_2}{2} = \\frac{${d1}\\cdot${d2}}{2} = ${d1 * d2 / 2}$ см².`),
        [value(askSide ? Math.hypot(d1 / 2, d2 / 2) : 4 * (x * y) / 2, askSide ? s : d1 * d2 / 2)])
    },
  },
  {
    id: 'trapezoid', make: (r) => {
      const [x, h, leg] = pick(r, TRI), small = ri(r, 2, 12), big = small + 2 * x
      const S = ((small + big) / 2) * h
      return q(r, 'trapezoid', l(`Теңбүйірлі трапецияның табандары ${small} см және ${big} см, бүйір қабырғасы ${leg} см. Трапецияның ауданын табыңыз (см²).`, `Основания равнобедренной трапеции равны ${small} см и ${big} см, боковая сторона ${leg} см. Найдите площадь трапеции (см²).`),
        String(S), [((small + big) / 2) * leg, (small + big) * h, small * h + x * h * 2, S + h].filter((v) => v !== S).map((v) => String(v).replace('.', '{,}')),
        l(`Биіктік: $h = \\sqrt{${leg}^2 - ${x}^2} = ${h}$ (мұнда $\\frac{${big} - ${small}}{2} = ${x}$); $S = \\frac{${small} + ${big}}{2}\\cdot${h} = ${S}$.`, `Высота: $h = \\sqrt{${leg}^2 - ${x}^2} = ${h}$ (здесь $\\frac{${big} - ${small}}{2} = ${x}$); $S = \\frac{${small} + ${big}}{2}\\cdot${h} = ${S}$.`),
        [value(small * h + x * h, S)])
    },
  },
  {
    id: 'circle', make: (r) => {
      const kind = ri(r, 0, 2)
      if (kind === 2) {
        const [d, half, R] = pick(r, TRI)
        return q(r, 'chord', l(`Радиусы ${R} см шеңбердің ұзындығы ${2 * half} см хордасы бар. Центрден хордаға дейінгі қашықтықты табыңыз.`, `В окружности радиуса ${R} см проведена хорда длиной ${2 * half} см. Найдите расстояние от центра до хорды.`),
          u(d), [R - half, Math.round(Math.sqrt(R * R + half * half)), d + 1, half].filter((v) => v !== d).map((v) => u(v)),
          l(`Хорданың жартысы ${half}, $d = \\sqrt{${R}^2 - ${half}^2} = ${d}$ см.`, `Половина хорды ${half}, $d = \\sqrt{${R}^2 - ${half}^2} = ${d}$ см.`), [value(Math.sqrt(R * R - half * half), d)])
      }
      const R = ri(r, 2, 12)
      if (kind === 0) {
        return q(r, 'circle-area', l(`Шеңбердің ұзындығы $${pi(2 * R)}$ см. Дөңгелектің ауданын табыңыз (см²).`, `Длина окружности равна $${pi(2 * R)}$ см. Найдите площадь круга (см²).`),
          pi(R * R), [pi(4 * R * R), pi(2 * R * R), pi(R), String(R * R)],
          l(`$2\\pi R = ${pi(2 * R)}$ → $R = ${R}$; $S = \\pi R^2 = ${pi(R * R)}$.`), [value(Math.PI * ((2 * R * Math.PI) / (2 * Math.PI)) ** 2, R * R * Math.PI)])
      }
      const cen = 2 * ri(r, 15, 85)
      return q(r, 'inscribed-angle', l(`Шеңберге іштей сызылған бұрыш $${cen}^\\circ$-қа тең центрлік бұрышпен бір доғаға тіреледі. Іштей сызылған бұрышты табыңыз.`, `Вписанный угол опирается на ту же дугу, что и центральный угол $${cen}^\\circ$. Найдите вписанный угол.`),
        `${cen / 2}^\\circ`, [`${cen}^\\circ`, `${2 * cen}^\\circ`, `${180 - cen / 2}^\\circ`, `${180 - cen}^\\circ`].filter((x) => x !== `${cen / 2}^\\circ`),
        l(`Іштей сызылған бұрыш центрлік бұрыштың жартысына тең: $${cen / 2}^\\circ$.`, `Вписанный угол равен половине центрального: $${cen / 2}^\\circ$.`), [value(cen / 2, cen / 2)])
    },
  },
  {
    id: 'polygon', make: (r) => {
      const n = pick(r, [5, 6, 8, 9, 10, 12, 15, 18, 20]), kind = ri(r, 0, 2)
      const each = (180 * (n - 2)) / n
      if (kind === 0) return q(r, 'polygon-sum', l(`Дөңес ${n}-бұрыштың ішкі бұрыштарының қосындысын табыңыз.`, `Найдите сумму внутренних углов выпуклого ${n}-угольника.`), `${180 * (n - 2)}^\\circ`, [180 * n, 180 * (n - 1), 360, 180 * (n - 3)].map((x) => `${x}^\\circ`), l(`$180^\\circ(n - 2) = 180^\\circ\\cdot${n - 2} = ${180 * (n - 2)}^\\circ$.`), [value(180 * (n - 2), 180 * (n - 2))])
      if (kind === 1) return q(r, 'polygon-angle', l(`Дұрыс ${n}-бұрыштың ішкі бұрышын табыңыз.`, `Найдите внутренний угол правильного ${n}-угольника.`), `${String(each).replace('.', '{,}')}^\\circ`, [360 / n, 180 - each + 10, each + 10, 180 * (n - 2)].map((x) => `${String(Number(x.toFixed(2))).replace('.', '{,}')}^\\circ`), l(`$\\frac{180^\\circ(n - 2)}{n} = ${String(each).replace('.', '{,}')}^\\circ$.`), [value(180 - 360 / n, each)])
      if (!Number.isInteger(each)) throw new Error('want whole angle')
      return q(r, 'polygon-n', l(`Дұрыс көпбұрыштың ішкі бұрышы $${each}^\\circ$. Оның неше қабырғасы бар?`, `Внутренний угол правильного многоугольника равен $${each}^\\circ$. Сколько у него сторон?`), String(n), [n - 1, n + 1, n + 2, 2 * n].map(String), l(`Сыртқы бұрышы $180^\\circ - ${each}^\\circ = ${180 - each}^\\circ$; $n = \\frac{360^\\circ}{${180 - each}^\\circ} = ${n}$.`, `Внешний угол $180^\\circ - ${each}^\\circ = ${180 - each}^\\circ$; $n = \\frac{360^\\circ}{${180 - each}^\\circ} = ${n}$.`), [value(360 / (180 - each), n)])
    },
  },
  {
    id: 'triangle-circles', make: (r) => {
      const [a, b, c] = pick(r, TRI), inner = r() < 0.5
      const v = inner ? (a + b - c) / 2 : c / 2
      return q(r, inner ? 'inradius' : 'circumradius', l(`Катеттері ${a} см және ${b} см тікбұрышты үшбұрышқа ${inner ? 'іштей' : 'сырттай'} сызылған шеңбердің радиусын табыңыз.`, `Найдите радиус окружности, ${inner ? 'вписанной в' : 'описанной около'} прямоугольный треугольник с катетами ${a} см и ${b} см.`),
        u(String(v).replace('.', ',')), [inner ? c / 2 : (a + b - c) / 2, c, v + 1, (a + b) / 4].filter((x) => x !== v).map((x) => u(String(x).replace('.', ','))),
        inner ? l(`$c = ${c}$; $r = \\frac{a + b - c}{2} = \\frac{${a} + ${b} - ${c}}{2} = ${String(v).replace('.', '{,}')}$ см.`) : l(`$c = ${c}$; $R = \\frac{c}{2} = ${String(v).replace('.', '{,}')}$ см.`),
        [value(inner ? (a * b) / (a + b + c) : c / 2, v)])
    },
  },
]

export const stereoGens: TGen[] = [
  {
    id: 'box', make: (r) => {
      const [a, b, c, d] = pick(r, BOX), kind = ri(r, 0, 2)
      const k = ri(r, 1, 2)
      const [A, B, C, Dg] = [a * k, b * k, c * k, d * k]
      const vals = [Dg, A * B * C, 2 * (A * B + B * C + A * C)]
      const asks = [l('диагоналын', 'диагональ'), l('көлемін', 'объём'), l('толық бетінің ауданын', 'площадь полной поверхности')][kind]
      const v = vals[kind]
      return q(r, `box-${kind}`, l(`Тікбұрышты параллелепипедтің өлшемдері ${A}, ${B} және ${C}. Оның ${asks.kz} табыңыз.`, `Измерения прямоугольного параллелепипеда равны ${A}, ${B} и ${C}. Найдите его ${asks.ru}.`),
        String(v), [kind === 0 ? A + B + C : A * B + B * C + A * C, kind === 2 ? A * B * C : v + 2, v * 2, kind === 0 ? Math.round(Math.hypot(A, B)) : v - A].filter((x) => x !== v).map(String).concat([String(v + 1)]),
        l([`$d = \\sqrt{${A}^2 + ${B}^2 + ${C}^2} = \\sqrt{${Dg * Dg}} = ${Dg}$.`, `$V = ${A}\\cdot${B}\\cdot${C} = ${A * B * C}$.`, `$S = 2(${A}\\cdot${B} + ${B}\\cdot${C} + ${A}\\cdot${C}) = ${vals[2]}$.`][kind]),
        [value([Math.hypot(A, B, C), A * B * C, 2 * (A * B + B * C + A * C)][kind], v)])
    },
  },
  {
    id: 'cube', make: (r) => {
      const a = ri(r, 1, 6), kind = ri(r, 0, 1)
      if (kind === 0) return q(r, 'cube-diagonal', l(`Кубтың қыры ${a}-ке тең. Оның диагоналын табыңыз.`, `Ребро куба равно ${a}. Найдите его диагональ.`), surd(a, 3), [surd(a, 2), String(3 * a), surd(a * 3, 1) === String(3 * a) ? surd(2 * a, 3) : String(3 * a), String(a * a)].concat([surd(a + 1, 3)]), l(`$d = a\\sqrt3 = ${surd(a, 3)}$.`), [value(Math.hypot(a, a, a), a * Math.sqrt(3))])
      return q(r, 'cube-volume', l(`Кубтың диагоналы $${surd(a, 3)}$-ке тең. Кубтың көлемін табыңыз.`, `Диагональ куба равна $${surd(a, 3)}$. Найдите объём куба.`), String(a ** 3), [3 * a, a * a, (a + 1) ** 3, 3 * a ** 3].map(String), l(`$a = \\frac{d}{\\sqrt3} = ${a}$; $V = a^3 = ${a ** 3}$.`), [value((a * Math.sqrt(3) / Math.sqrt(3)) ** 3, a ** 3)])
    },
  },
  {
    id: 'cylinder', make: (r) => {
      const R = ri(r, 1, 6), h = ri(r, 2, 10), askV = r() < 0.5
      const v = askV ? R * R * h : 2 * R * (R + h)
      return q(r, askV ? 'cylinder-v' : 'cylinder-s', l(`Цилиндрдің табанының радиусы ${R}, биіктігі ${h}. Цилиндрдің ${askV ? 'көлемін' : 'толық бетінің ауданын'} табыңыз.`, `Радиус основания цилиндра ${R}, высота ${h}. Найдите ${askV ? 'объём' : 'площадь полной поверхности'} цилиндра.`),
        pi(v), (askV ? [2 * R * h, R * h, R * R * h * 2, R * R * h + R] : [2 * R * h, R * (R + h), 2 * R * h + R * R, 4 * R * (R + h)]).filter((x) => x !== v).map((x) => pi(x)),
        askV ? l(`$V = \\pi R^2 h = \\pi\\cdot${R * R}\\cdot${h} = ${pi(v)}$.`) : l(`$S = 2\\pi R(R + h) = 2\\pi\\cdot${R}\\cdot${R + h} = ${pi(v)}$.`),
        [value(askV ? Math.PI * R * R * h : 2 * Math.PI * R * R + 2 * Math.PI * R * h, v * Math.PI)])
    },
  },
  {
    id: 'cone', make: (r) => {
      const [R, h, lg] = pick(r, TRI.slice(0, 6))
      const askV = r() < 0.5
      if (askV) {
        const v = (R * R * h) / 3
        return q(r, 'cone-v', l(`Конустың табанының радиусы ${R}, жасаушысы ${lg}. Конустың көлемін табыңыз.`, `Радиус основания конуса ${R}, образующая ${lg}. Найдите объём конуса.`),
          pi(R * R * h, 3), [pi(R * R * h), pi(R * R * lg, 3), pi(R * lg), pi(R * h, 3)].filter((x) => x !== pi(R * R * h, 3)),
          l(`$h = \\sqrt{${lg}^2 - ${R}^2} = ${h}$; $V = \\frac13\\pi R^2 h = ${pi(R * R * h, 3)}$.`), [value((Math.PI * R * R * Math.sqrt(lg * lg - R * R)) / 3, v * Math.PI)])
      }
      return q(r, 'cone-side', l(`Конустың табанының радиусы ${R}, биіктігі ${h}. Бүйір бетінің ауданын табыңыз.`, `Радиус основания конуса ${R}, высота ${h}. Найдите площадь боковой поверхности.`),
        pi(R * lg), [pi(R * h), pi(R * (R + lg)), pi(2 * R * lg), pi(R * R)].filter((x) => x !== pi(R * lg)),
        l(`$l = \\sqrt{${R}^2 + ${h}^2} = ${lg}$; $S = \\pi R l = ${pi(R * lg)}$.`), [value(Math.PI * R * Math.hypot(R, h), R * lg * Math.PI)])
    },
  },
  {
    id: 'sphere', make: (r) => {
      const R = ri(r, 1, 6), askV = r() < 0.5
      return q(r, askV ? 'sphere-v' : 'sphere-s', l(`Радиусы ${R} шардың ${askV ? 'көлемін' : 'бетінің ауданын'} табыңыз.`, `Найдите ${askV ? 'объём шара' : 'площадь поверхности сферы'} радиуса ${R}.`),
        askV ? pi(4 * R ** 3, 3) : pi(4 * R * R), askV ? [pi(4 * R * R), pi(R ** 3), pi(4 * R ** 3), pi(2 * R ** 3, 3)] : [pi(2 * R * R), pi(R * R), pi(4 * R ** 3, 3), pi(8 * R * R)],
        askV ? l(`$V = \\frac43\\pi R^3 = ${pi(4 * R ** 3, 3)}$.`) : l(`$S = 4\\pi R^2 = ${pi(4 * R * R)}$.`),
        [value(askV ? (4 / 3) * Math.PI * R ** 3 : 4 * Math.PI * R * R, askV ? (4 * R ** 3 * Math.PI) / 3 : 4 * R * R * Math.PI)])
    },
  },
  {
    id: 'pyramid', make: (r) => {
      const a = 2 * ri(r, 1, 6), h = ri(r, 2, 12)
      const V = (a * a * h) / 3
      if (!Number.isInteger(V)) throw new Error('want whole volume')
      return q(r, 'pyramid', l(`Дұрыс төртбұрышты пирамиданың табан қабырғасы ${a}, биіктігі ${h}. Пирамиданың көлемін табыңыз.`, `Сторона основания правильной четырёхугольной пирамиды ${a}, высота ${h}. Найдите объём пирамиды.`),
        String(V), [a * a * h, (a * h) / 3, (a * a * h) / 2, V + a].filter((x) => x !== V && Number.isInteger(x)).map(String).concat([String(2 * V)]),
        l(`$V = \\frac13 S_{таб} h = \\frac13\\cdot${a * a}\\cdot${h} = ${V}$.`, `$V = \\frac13 S_{осн} h = \\frac13\\cdot${a * a}\\cdot${h} = ${V}$.`), [value((a * a * h) / 3, V)])
    },
  },
]

export const vectorGens: TGen[] = [
  {
    id: 'distance', make: (r) => {
      const [dx, dy, d] = pick(r, TRI), x1 = ri(r, -6, 6), y1 = ri(r, -6, 6), sx = pick(r, [1, -1]), sy = pick(r, [1, -1])
      const x2 = x1 + sx * dx, y2 = y1 + sy * dy
      return q(r, 'distance', l(`$A(${x1}; ${y1})$ және $B(${x2}; ${y2})$ нүктелерінің арақашықтығын табыңыз.`, `Найдите расстояние между точками $A(${x1}; ${y1})$ и $B(${x2}; ${y2})$.`),
        String(d), [dx + dy, d + 1, d * d, Math.abs(dx - dy) + d].filter((x) => x !== d).map(String),
        l(`$AB = \\sqrt{${dx}^2 + ${dy}^2} = ${d}$.`), [value(Math.hypot(x2 - x1, y2 - y1), d)])
    },
  },
  {
    id: 'midpoint', make: (r) => {
      const x1 = ri(r, -9, 9), y1 = ri(r, -9, 9), mx = ri(r, -6, 6), my = ri(r, -6, 6)
      const x2 = 2 * mx - x1, y2 = 2 * my - y1
      return q(r, 'midpoint', l(`$A(${x1}; ${y1})$ және $B(${x2}; ${y2})$ кесіндісінің ортасының координаталарын табыңыз.`, `Найдите координаты середины отрезка с концами $A(${x1}; ${y1})$ и $B(${x2}; ${y2})$.`),
        `(${mx}; ${my})`, [`(${x2 - x1}; ${y2 - y1})`, `(${x1 + x2}; ${y1 + y2})`, `(${my}; ${mx})`, `(${mx}; ${-my})`, `(${mx + 1}; ${my})`],
        l(`$\\left(\\frac{${x1} + ${x2 < 0 ? `(${x2})` : x2}}{2};\\ \\frac{${y1} + ${y2 < 0 ? `(${y2})` : y2}}{2}\\right) = (${mx}; ${my})$.`), [value((x1 + x2) / 2 + (y1 + y2) / 2 * 1000, mx + my * 1000)])
    },
  },
  {
    id: 'dot', make: (r) => {
      const a = [ri(r, -6, 6), ri(r, -6, 6)], b = [ri(r, -6, 6), ri(r, -6, 6)]
      const v = a[0] * b[0] + a[1] * b[1]
      return q(r, 'dot', l(`$\\vec a(${a[0]}; ${a[1]})$ және $\\vec b(${b[0]}; ${b[1]})$ векторларының скаляр көбейтіндісін табыңыз.`, `Найдите скалярное произведение векторов $\\vec a(${a[0]}; ${a[1]})$ и $\\vec b(${b[0]}; ${b[1]})$.`),
        String(v), [a[0] * b[1] + a[1] * b[0], a[0] * b[0] - a[1] * b[1], v + 1, -v, a[0] + b[0] + a[1] + b[1]].filter((x) => x !== v).map(String),
        l(`$\\vec a\\cdot\\vec b = ${a[0]}\\cdot${b[0] < 0 ? `(${b[0]})` : b[0]} + ${a[1]}\\cdot${b[1] < 0 ? `(${b[1]})` : b[1]} = ${v}$.`), [value(Math.hypot(a[0] + b[0], a[1] + b[1]) ** 2 / 2 - Math.hypot(...a) ** 2 / 2 - Math.hypot(...b) ** 2 / 2, v)])
    },
  },
  {
    id: 'perpendicular', make: (r) => {
      const b1 = [1, 2, 3, -2, 4, -4, 6][ri(r, 0, 6)], b2 = pick(r, [2, -2, 3, -3, 4, 6, -6]), y = pick(r, [1, 2, 3, -1, -2, 4])
      // a(x; y) ⟂ b(b1; b2): x·b1 + y·b2 = 0
      if ((y * b2) % b1) throw new Error('want whole x')
      const x = -(y * b2) / b1
      return q(r, 'perpendicular', l(`$x$-тің қандай мәнінде $\\vec a(x; ${y})$ және $\\vec b(${b1}; ${b2})$ векторлары перпендикуляр болады?`, `При каком значении $x$ векторы $\\vec a(x; ${y})$ и $\\vec b(${b1}; ${b2})$ перпендикулярны?`),
        String(x), [-x, (y * b1) / b2, x + 1, b2].filter((v) => v !== x && Number.isInteger(v)).map(String).concat([String(x * 2 + 1)]),
        l(`$\\vec a\\cdot\\vec b = ${b1}x + ${y}\\cdot${b2 < 0 ? `(${b2})` : b2} = 0$ → $x = ${x}$.`), [value(x * b1 + y * b2, 0)])
    },
  },
  {
    id: 'vector-length', make: (r) => {
      const [p, qq, len] = pick(r, TRI), k = pick(r, [1, 2, -1]), m = pick(r, [1, -1])
      // |k·a + m·b| where a(p1; 0) b(0; q1) → simpler: vector (p; q) from 2a − b
      const a = [ri(r, -4, 4), ri(r, -4, 4)]
      const b = [k * a[0] - p, k * a[1] - m * qq]
      // c = k·a − b = (p; m·q)
      return q(r, 'vector-length', l(`$\\vec a(${a[0]}; ${a[1]})$, $\\vec b(${b[0]}; ${b[1]})$. $${k === 1 ? '' : k === -1 ? '-' : k}\\vec a - \\vec b$ векторының ұзындығын табыңыз.`, `Даны $\\vec a(${a[0]}; ${a[1]})$, $\\vec b(${b[0]}; ${b[1]})$. Найдите длину вектора $${k === 1 ? '' : k === -1 ? '-' : k}\\vec a - \\vec b$.`),
        String(len), [p + qq, len + 1, len * len, Math.abs(p - qq) + 1].filter((x) => x !== len).map(String),
        l(`$${k === 1 ? '' : k === -1 ? '-' : k}\\vec a - \\vec b = (${p}; ${m * qq})$, ұзындығы $\\sqrt{${p}^2 + ${qq}^2} = ${len}$.`, `$${k === 1 ? '' : k === -1 ? '-' : k}\\vec a - \\vec b = (${p}; ${m * qq})$, длина $\\sqrt{${p}^2 + ${qq}^2} = ${len}$.`),
        [value(Math.hypot(k * a[0] - b[0], k * a[1] - b[1]), len)])
    },
  },
  {
    id: 'circle-equation', make: (r) => {
      const a = ri(r, -6, 6), b = ri(r, -6, 6), R = ri(r, 1, 8)
      const c = a * a + b * b - R * R
      const t = (k: number, v: string) => (k ? ` ${k > 0 ? '+' : '-'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}${v}` : '')
      const eq = `x^2 + y^2${t(-2 * a, 'x')}${t(-2 * b, 'y')}${c ? ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}` : ''} = 0`
      return q(r, 'circle-equation', l(`$${eq}$ шеңберінің радиусын табыңыз.`, `Найдите радиус окружности $${eq}$.`),
        String(R), [R * R, Math.abs(c) || R + 2, R + 1, Math.abs(a) + Math.abs(b)].filter((x) => x !== R && x > 0).map(String).concat([String(2 * R)]),
        l(`Толық квадрат бөлеміз: $(x ${a > 0 ? '-' : '+'} ${Math.abs(a)})^2 + (y ${b > 0 ? '-' : '+'} ${Math.abs(b)})^2 = ${R * R}$ → $R = ${R}$.`, `Выделяем полные квадраты: $(x ${a > 0 ? '-' : '+'} ${Math.abs(a)})^2 + (y ${b > 0 ? '-' : '+'} ${Math.abs(b)})^2 = ${R * R}$ → $R = ${R}$.`),
        [value(Math.sqrt(a * a + b * b - c), R)])
    },
  },
  {
    id: 'space-distance', make: (r) => {
      const [dx, dy, dz, d] = pick(r, BOX), p = [ri(r, -5, 5), ri(r, -5, 5), ri(r, -5, 5)]
      const s = () => pick(r, [1, -1])
      const qq = [p[0] + s() * dx, p[1] + s() * dy, p[2] + s() * dz]
      return q(r, 'space-distance', l(`Кеңістікте $A(${p.join('; ')})$ және $B(${qq.join('; ')})$ нүктелерінің арақашықтығын табыңыз.`, `Найдите расстояние между точками $A(${p.join('; ')})$ и $B(${qq.join('; ')})$ в пространстве.`),
        String(d), [dx + dy + dz, d * d, d + 1, Math.round(Math.hypot(dx, dy))].filter((x) => x !== d).map(String),
        l(`$AB = \\sqrt{${dx}^2 + ${dy}^2 + ${dz}^2} = ${d}$.`), [value(Math.hypot(qq[0] - p[0], qq[1] - p[1], qq[2] - p[2]), d)])
    },
  },
]
