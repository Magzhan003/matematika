/** Generators: planimetry, coordinates and vectors, stereometry. */
import { mk, mkT, pick, ri, type Gen, type Problem, type Rng } from './core'

type Body = Omit<Problem, 'gen' | 'topic' | 'level'>
const G = (id: string, topic: string, level: Gen['level'], grade: number, make: (r: Rng) => Body): Gen => ({
  id, topic, level, grade, make: (r) => ({ gen: id, topic, level, ...make(r) }),
})
const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20]]
const piT = (k: number) => (k === 1 ? '\\pi' : `${k}\\pi`)

export const geoGens: Gen[] = [
  G('pyth-hyp', 'right-triangle', 'easy', 8, (r) => {
    const [a, b, c] = pick(r, triples)
    return { text: { ru: `Катеты прямоугольного треугольника равны ${a} и ${b}. Найди гипотенузу.`, kz: `Тікбұрышты үшбұрыштың катеттері ${a} және ${b}. Гипотенузаны тап.` }, tex: '', answer: String(c), values: [c], steps: [`c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${c * c}} = ${c}`], mistakes: [mk(a + b, 'pythSum')] }
  }),
  G('pyth-leg', 'right-triangle', 'medium', 8, (r) => {
    const [a, b, c] = pick(r, triples)
    return { text: { ru: `Гипотенуза прямоугольного треугольника равна ${c}, один из катетов — ${a}. Найди другой катет.`, kz: `Тікбұрышты үшбұрыштың гипотенузасы ${c}, бір катеті ${a}. Екінші катетті тап.` }, tex: '', answer: String(b), values: [b], steps: [`b = \\sqrt{${c}^2 - ${a}^2} = \\sqrt{${b * b}} = ${b}`], mistakes: [mk(c - a, 'pythLeg')] }
  }),
  G('tri-angle', 'triangles', 'easy', 7, (r) => {
    const a = ri(r, 3, 9) * 10, b = ri(r, 2, 16 - a / 10) * 10 - (r() < 0.5 ? 5 : 0), c = 180 - a - b
    return { text: { ru: `Два угла треугольника равны ${a}° и ${b}°. Найди третий угол (в градусах).`, kz: `Үшбұрыштың екі бұрышы ${a}° және ${b}°. Үшінші бұрышын тап (градуспен).` }, tex: '', answer: `${c}^\\circ`, values: [c], steps: [`180^\\circ - ${a}^\\circ - ${b}^\\circ = ${c}^\\circ`], mistakes: [mk(360 - a - b, 'triAngle', `${360 - a - b}^\\circ`)] }
  }),
  G('tri-area', 'triangle-area', 'easy', 8, (r) => {
    const a = ri(r, 2, 12) * 2, h = ri(r, 2, 12), s = (a * h) / 2
    return { text: { ru: `Сторона треугольника равна ${a}, а высота, проведённая к ней, — ${h}. Найди площадь.`, kz: `Үшбұрыштың қабырғасы ${a}, ал оған түсірілген биіктік ${h}. Ауданын тап.` }, tex: '', answer: String(s), values: [s], steps: [`S = \\dfrac{1}{2} \\cdot ${a} \\cdot ${h} = ${s}`], mistakes: [mk(a * h, 'triHalf')] }
  }),
  G('rect', 'quadrilaterals', 'easy', 5, (r) => {
    const a = ri(r, 2, 15), b = ri(r, 2, 15), area = r() < 0.5
    return area
      ? { text: { ru: `Стороны прямоугольника ${a} см и ${b} см. Найди его площадь (в см²).`, kz: `Тіктөртбұрыштың қабырғалары ${a} см және ${b} см. Ауданын тап (см²).` }, tex: '', answer: String(a * b), values: [a * b], steps: [`S = ${a} \\cdot ${b} = ${a * b}`], mistakes: [mk(2 * (a + b), 'rectMix')] }
      : { text: { ru: `Стороны прямоугольника ${a} см и ${b} см. Найди его периметр (в см).`, kz: `Тіктөртбұрыштың қабырғалары ${a} см және ${b} см. Периметрін тап (см).` }, tex: '', answer: String(2 * (a + b)), values: [2 * (a + b)], steps: [`P = 2(${a} + ${b}) = ${2 * (a + b)}`], mistakes: [mk(a * b, 'rectMix'), mk(a + b, 'rectHalf')] }
  }),
  G('trapezoid', 'quadrilaterals', 'medium', 8, (r) => {
    const a = ri(r, 4, 15), b = ri(r, 2, 12), h = ri(r, 1, 6) * 2, s = ((a + b) / 2) * h
    return { text: { ru: `Основания трапеции ${a} и ${b}, высота ${h}. Найди площадь.`, kz: `Трапецияның табандары ${a} және ${b}, биіктігі ${h}. Ауданын тап.` }, tex: '', answer: String(s), values: [s], steps: [`S = \\dfrac{${a} + ${b}}{2} \\cdot ${h} = ${s}`], mistakes: [mk((a + b) * h, 'trapHalf')] }
  }),
  G('circle', 'circle', 'easy', 6, (r) => {
    const rad = ri(r, 2, 12), area = r() < 0.5
    return area
      ? { text: { ru: `Радиус круга равен ${rad}. Найди его площадь.`, kz: `Дөңгелектің радиусы ${rad}. Ауданын тап.` }, tex: '', answer: piT(rad * rad), values: [rad * rad * Math.PI], steps: [`S = \\pi \\cdot ${rad}^2 = ${piT(rad * rad)}`], wrong: [piT(2 * rad), piT(rad), piT(4 * rad * rad)], mistakes: [mkT(piT(2 * rad), 'circleMix', [2 * rad * Math.PI])] }
      : { text: { ru: `Радиус окружности равен ${rad}. Найди её длину.`, kz: `Шеңбердің радиусы ${rad}. Ұзындығын тап.` }, tex: '', answer: piT(2 * rad), values: [2 * rad * Math.PI], steps: [`C = 2\\pi \\cdot ${rad} = ${piT(2 * rad)}`], wrong: [piT(rad * rad), piT(rad), piT(4 * rad)], mistakes: [mkT(piT(rad * rad), 'circleMix', [rad * rad * Math.PI])] }
  }),
  G('polygon', 'polygons', 'medium', 9, (r) => {
    const k = pick(r, [3, 4, 5, 6, 8, 9, 10, 12]), a = ((k - 2) * 180) / k
    return { text: { ru: `Найди угол правильного ${k}-угольника (в градусах).`, kz: `Дұрыс ${k}-бұрыштың бұрышын тап (градуспен).` }, tex: '', answer: `${a}^\\circ`, values: [a], steps: [`\\dfrac{(${k} - 2) \\cdot 180^\\circ}{${k}} = ${a}^\\circ`], mistakes: [mk((k - 2) * 180, 'polySum', `${(k - 2) * 180}^\\circ`)] }
  }),
  G('distance', 'coord-plane', 'medium', 9, (r) => {
    const [a, b, c] = pick(r, triples.slice(0, 4)), x1 = ri(r, -5, 5), y1 = ri(r, -5, 5)
    const x2 = x1 + (r() < 0.5 ? a : -a), y2 = y1 + (r() < 0.5 ? b : -b)
    return { text: { ru: `Найди расстояние между точками A(${x1}; ${y1}) и B(${x2}; ${y2}).`, kz: `A(${x1}; ${y1}) және B(${x2}; ${y2}) нүктелерінің арақашықтығын тап.` }, tex: '', answer: String(c), values: [c], steps: [`AB = \\sqrt{${a}^2 + ${b}^2} = ${c}`], mistakes: [mk(c * c, 'distNoRoot'), mk(a + b, 'pythSum')] }
  }),
  G('midpoint', 'coord-plane', 'easy', 9, (r) => {
    const mx = ri(r, -6, 6), my = ri(r, -6, 6), dx = ri(r, 1, 6), dy = ri(r, 1, 6)
    return { text: { ru: `Найди координаты середины отрезка AB, если A(${mx - dx}; ${my + dy}), B(${mx + dx}; ${my - dy}).`, kz: `A(${mx - dx}; ${my + dy}), B(${mx + dx}; ${my - dy}) болса, AB кесіндісінің ортасының координаталарын тап.` }, tex: '', answer: `(${mx};\\ ${my})`, values: [mx, my], steps: [`\\left(\\dfrac{${mx - dx} + ${mx + dx}}{2};\\ \\dfrac{${my + dy} + ${my - dy}}{2}\\right) = (${mx};\\ ${my})`], wrong: [`(${my};\\ ${mx})`, `(${2 * mx};\\ ${2 * my})`, `(${mx + dx};\\ ${my})`, `(${mx};\\ ${my + 1})`, `(${-mx};\\ ${1 - my})`] }
  }),
  G('vector-len', 'vectors', 'easy', 9, (r) => {
    const [a, b, c] = pick(r, triples.slice(0, 4)), sx = r() < 0.5 ? -1 : 1
    return { text: { ru: `Найди длину вектора a(${sx * a}; ${b}).`, kz: `a(${sx * a}; ${b}) векторының ұзындығын тап.` }, tex: '', answer: String(c), values: [c], steps: [`|\\vec a| = \\sqrt{${a * a} + ${b * b}} = ${c}`], mistakes: [mk(c * c, 'distNoRoot')] }
  }),
  G('dot', 'vectors', 'medium', 9, (r) => {
    const x1 = ri(r, -5, 5), y1 = ri(r, -5, 5), x2 = ri(r, -5, 5), y2 = ri(r, -5, 5), v = x1 * x2 + y1 * y2
    return { text: { ru: `Найди скалярное произведение векторов a(${x1}; ${y1}) и b(${x2}; ${y2}).`, kz: `a(${x1}; ${y1}) және b(${x2}; ${y2}) векторларының скаляр көбейтіндісін тап.` }, tex: '', answer: String(v), values: [v], steps: [`${x1} \\cdot ${x2 < 0 ? `(${x2})` : x2} + ${y1} \\cdot ${y2 < 0 ? `(${y2})` : y2} = ${v}`] }
  }),
  G('box', 'prisms', 'easy', 5, (r) => {
    const a = ri(r, 2, 10), b = ri(r, 2, 10), c = ri(r, 2, 10)
    return { text: { ru: `Измерения прямоугольного параллелепипеда ${a}, ${b} и ${c}. Найди его объём.`, kz: `Тікбұрышты параллелепипедтің өлшемдері ${a}, ${b} және ${c}. Көлемін тап.` }, tex: '', answer: String(a * b * c), values: [a * b * c], steps: [`V = ${a} \\cdot ${b} \\cdot ${c} = ${a * b * c}`] }
  }),
  G('cylinder', 'bodies-rotation', 'medium', 11, (r) => {
    const rad = ri(r, 1, 6), h = ri(r, 2, 10), k = rad * rad * h
    return { text: { ru: `Радиус основания цилиндра ${rad}, высота ${h}. Найди объём.`, kz: `Цилиндр табанының радиусы ${rad}, биіктігі ${h}. Көлемін тап.` }, tex: '', answer: piT(k), values: [k * Math.PI], steps: [`V = \\pi \\cdot ${rad}^2 \\cdot ${h} = ${piT(k)}`], wrong: [piT(2 * rad * h), piT(rad * h), piT(k * 2)], mistakes: [mkT(piT(2 * rad * h), 'cylLateral', [2 * rad * h * Math.PI])] }
  }),
  G('cone', 'bodies-rotation', 'medium', 11, (r) => {
    const rad = ri(r, 1, 6), h = ri(r, 1, 4) * 3, k = (rad * rad * h) / 3
    return { text: { ru: `Радиус основания конуса ${rad}, высота ${h}. Найди объём.`, kz: `Конус табанының радиусы ${rad}, биіктігі ${h}. Көлемін тап.` }, tex: '', answer: piT(k), values: [k * Math.PI], steps: [`V = \\dfrac{1}{3}\\pi \\cdot ${rad}^2 \\cdot ${h} = ${piT(k)}`], wrong: [piT(k * 3), piT(rad * h), piT(k / 2 || 1), piT(k * 2), piT(k + 1)], mistakes: [mkT(piT(k * 3), 'coneThird', [k * 3 * Math.PI])] }
  }),
  G('sphere', 'bodies-rotation', 'hard', 11, (r) => {
    const R = pick(r, [3, 6]), k = (4 * R ** 3) / 3
    return { text: { ru: `Радиус шара равен ${R}. Найди его объём.`, kz: `Шардың радиусы ${R}. Көлемін тап.` }, tex: '', answer: piT(k), values: [k * Math.PI], steps: [`V = \\dfrac{4}{3}\\pi \\cdot ${R}^3 = ${piT(k)}`], wrong: [piT(4 * R * R), piT(R ** 3), piT(k / 4)], mistakes: [mkT(piT(4 * R * R), 'sphereArea', [4 * R * R * Math.PI])] }
  }),
]
