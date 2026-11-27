import { q1 } from './alg10-q1'
import { q2 } from './alg10-q2'
import { q3 } from './alg10-q3'
import { q4 } from './alg10-q4'
import { jointWork } from './joint-work'
import { rational } from './rational'
import { scaleTest } from './scale'
import { triangleLines } from './triangle-lines'
import { l, type L, type Material } from './types'
import { vieta } from './vieta'

export * from './types'

/** Algebra 10 (natural-math stream): all section and quarter summative works of the year. */
export const alg10Summative: Material = {
  id: 'alg10-bzb-tzb',
  title: l('Алгебра және анализ бастамалары — БЖБ және ТЖБ (1–4 тоқсан)', 'Алгебра и начала анализа — СОР и СОЧ (1–4 четверть)'),
  grade: 10, subject: 'algebra', kind: 'summative', author: 'Алдангаров Жүсіп',
  topics: ['other-fn', 'trig-basics', 'inverse-trig', 'trig-equations', 'trig-inequalities', 'probability', 'combinatorics', 'polynomials', 'derivative-rules', 'derivative-apply', 'statistics'],
  book: l('«Алгебра және анализ бастамалары», 10-сынып, ЖМБ, 1–2-бөлім, «Мектеп» баспасы', '«Алгебра и начала анализа», 10 класс, ЕМН, части 1–2, издательство «Мектеп»'),
  intro: l('Барлық тапсырма оқулықтағы жаттығулардың типі бойынша құрастырылды, бірақ сандары мен шарттары өзгертілген. 11 БЖБ, 4 ТЖБ (әрқайсысы 20 балл, 40 минут). Деңгейлер: А — білу мен түсіну, В — қолдану, С — жоғары деңгей дағдылары. Әр жұмыстан кейін мұғалімге арналған жауаптар кілті және ата-анаға арналған рубрика берілген.',
    'Все задания составлены по типам упражнений учебника, но с изменёнными числами и условиями. 11 СОР, 4 СОЧ (по 20 баллов, 40 минут). Уровни: А — знание и понимание, В — применение, С — навыки высокого порядка. К каждой работе — ключ ответов для учителя и рубрика для родителей.'),
  works: [...q1, ...q2, ...q3, ...q4],
}

export const materials: Material[] = [rational, triangleLines, vieta, scaleTest, jointWork, alg10Summative]
export const materialById = (id: string) => materials.find((m) => m.id === id)
export const materialsForTopic = (topic: string) => materials.filter((m) => m.topics.includes(topic))

/**
 * Extra practice: «Математикадан ҰБТ-ға дайындалуға арналған тренажер» (И.П. Рустюмова, С.Т. Рустюмова, 2013).
 * The book is under copyright, so only chapter titles and page numbers are kept here — the problems stay in the book.
 */
export const trainerBook = l('Рустюмова И.П., Рустюмова С.Т. «Математикадан ҰБТ-ға дайындалуға арналған тренажер». Алматы, 2013',
  'Рустюмова И.П., Рустюмова С.Т. «Тренажёр для подготовки к ЕНТ по математике». Алматы, 2013')
export type TrainerPart = { ch: string; title: L; from: number; to: number; topics: string[] }
const P = (ch: string, kz: string, ru: string, from: number, to: number, topics: string[]): TrainerPart => ({ ch, title: l(kz, ru), from, to, topics })
export const trainer: TrainerPart[] = [
  P('I §1', 'Сандық өрнектерді тепе-тең түрлендіру', 'Тождественные преобразования числовых выражений', 4, 18, ['fractions', 'powers']),
  P('I §2', 'Рационал алгебралық өрнектерді тепе-тең түрлендіру', 'Тождественные преобразования рациональных выражений', 19, 31, ['polynomials', 'short-mult', 'alg-fractions']),
  P('I §3', 'Рационал алгебралық теңдеулерді шешу', 'Решение рациональных уравнений', 32, 44, ['linear-eq', 'quadratic']),
  P('I §4', 'Алгебралық теңдеулер жүйесін шешу', 'Решение систем алгебраических уравнений', 45, 58, ['linear-eq']),
  P('I §5', 'Рационал теңсіздіктерді шешу', 'Решение рациональных неравенств', 59, 74, ['inequalities']),
  P('I §6–7', 'Модуль белгісінің астында айнымалысы бар теңдеулер мен теңсіздіктер', 'Уравнения и неравенства с переменной под знаком модуля', 75, 89, ['linear-eq', 'inequalities']),
  P('II §1', 'Алгебралық иррационал өрнектерді тепе-тең түрлендіру', 'Преобразования иррациональных выражений', 90, 103, ['roots']),
  P('II §2–4', 'Иррационал теңдеулер, жүйелер және теңсіздіктер', 'Иррациональные уравнения, системы и неравенства', 104, 129, ['roots']),
  P('III §1–2', 'Көрсеткіштік теңдеулер мен теңсіздіктер', 'Показательные уравнения и неравенства', 130, 150, ['exp-fn']),
  P('III §3', 'Логарифмдік өрнектерді тепе-тең түрлендіру', 'Преобразования логарифмических выражений', 151, 163, ['log-props']),
  P('III §4–6', 'Логарифмдік теңдеулер, теңсіздіктер және жүйелер', 'Логарифмические уравнения, неравенства и системы', 164, 207, ['log-eq']),
  P('IV §1', 'Тригонометриялық түрлендірулер', 'Тригонометрические преобразования', 208, 228, ['trig-identities', 'trig-reduction', 'trig-addition', 'trig-double', 'trig-sum-product']),
  P('IV §2', 'Тригонометриялық теңдеулерді шешу', 'Решение тригонометрических уравнений', 229, 240, ['trig-equations']),
  P('IV §3', 'Тригонометриялық теңсіздіктерді шешу', 'Решение тригонометрических неравенств', 241, 249, ['trig-inequalities']),
  P('V §1', 'Арифметикалық прогрессия', 'Арифметическая прогрессия', 250, 261, ['arith-prog']),
  P('V §2', 'Геометриялық прогрессия', 'Геометрическая прогрессия', 262, 278, ['geom-prog']),
  P('VI', 'Мәтіндік есептерді шешу', 'Решение текстовых задач', 279, 305, ['word-problems', 'percents', 'proportions']),
  P('VII §1', 'Функция және оның қасиеттері', 'Функция и её свойства', 306, 318, ['other-fn', 'quadratic-fn', 'linear-fn']),
  P('VII §2', 'Функцияларды дифференциалдау', 'Дифференцирование функций', 319, 336, ['derivative-table', 'derivative-rules']),
  P('VII §3–4', 'Туындыны қолданып функцияны зерттеу. Жанаманың теңдеуі', 'Исследование функций с помощью производной. Уравнение касательной', 337, 353, ['derivative-apply']),
  P('VII §5', 'Алғашқы функция және интеграл', 'Первообразная и интеграл', 354, 364, ['antiderivatives', 'integrals', 'integrals-table']),
  P('VIII §1', 'Үшбұрыштар', 'Треугольники', 365, 385, ['triangles', 'right-triangle', 'triangle-area']),
  P('VIII §2', 'Төртбұрыштар', 'Четырёхугольники', 386, 403, ['quadrilaterals', 'polygons']),
  P('VIII §3', 'Шеңбер және дөңгелек', 'Окружность и круг', 404, 409, ['circle']),
  P('IX §1', 'Кеңістіктегі қашықтықтар мен бұрыштар', 'Расстояния и углы в пространстве', 410, 421, ['prisms', 'pyramids']),
  P('IX §2', 'Көпжақтар', 'Многогранники', 422, 433, ['prisms', 'pyramids']),
  P('IX §3', 'Айналу денелері', 'Тела вращения', 434, 458, ['bodies-rotation']),
  P('X §1', 'Декарттық координаттар', 'Декартовы координаты', 459, 469, ['coord-plane']),
  P('X §2', 'Жазықтықтағы және кеңістіктегі векторлар', 'Векторы на плоскости и в пространстве', 470, 487, ['vectors']),
]
export const trainerForTopic = (topic: string) => trainer.filter((p) => p.topics.includes(topic))
