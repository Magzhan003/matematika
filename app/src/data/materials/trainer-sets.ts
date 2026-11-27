/**
 * ЕНТ practice sets on the task types of the Rustyumova trainer: numbers and wording are new, each variant is
 * generated from its number, answers are checked by scripts/check-trainer.ts.
 */
import { calculusGens } from '../../lib/trainer/calculus'
import { equationGens } from '../../lib/trainer/equations'
import { expGens, logGens } from '../../lib/trainer/explog'
import { planimetryGens, stereoGens, vectorGens } from '../../lib/trainer/geometry'
import { irrationalGens } from '../../lib/trainer/irrational'
import { makeSet, type TGen } from '../../lib/trainer/kit'
import { progressionGens } from '../../lib/trainer/progressions'
import { trigEqGens, trigFormGens } from '../../lib/trainer/trig'
import { wordGens } from '../../lib/trainer/word'
import { l, type L, type Material } from './types'

const SIZE = 20
const set = (id: string, title: L, ch: string, pages: string, topics: string[], gens: TGen[], subject: Material['subject'] = 'algebra'): Material => ({
  id, title, grade: 'ent', subject, kind: 'test', topics, minutes: 40, scale: [18, 14, 10],
  source: l(`Рустюмова тренажеріндегі есеп түрлері бойынша (${ch}, ${pages} б.); сандары мен шарттары жаңа, әр нұсқа жаңадан құрылады.`,
    `По типам задач тренажёра Рустюмовой (${ch}, с. ${pages}); числа и условия новые, каждый вариант составляется заново.`),
  gen: (seed: number) => makeSet(gens, seed, SIZE),
  mcq: makeSet(gens, 1, SIZE),
  gens: gens.length,
})

export const trainerSets: Material[] = [
  set('tr-equations', l('Рационал теңдеулер және теңдеулер жүйесі', 'Рациональные уравнения и системы'), 'I тарау §3–4 / гл. I §3–4', '32–58', ['linear-eq', 'quadratic'], equationGens),
  set('tr-irrational', l('Иррационал өрнектер, теңдеулер, теңсіздіктер', 'Иррациональные выражения, уравнения, неравенства'), 'II тарау / гл. II', '90–129', ['roots'], irrationalGens),
  set('tr-exp', l('Көрсеткіштік теңдеулер мен теңсіздіктер', 'Показательные уравнения и неравенства'), 'III тарау §1–2 / гл. III §1–2', '130–150', ['exp-fn'], expGens),
  set('tr-log', l('Логарифмдер: өрнектер, теңдеулер, теңсіздіктер', 'Логарифмы: выражения, уравнения, неравенства'), 'III тарау §3–5 / гл. III §3–5', '151–192', ['log-props', 'log-eq'], logGens),
  set('tr-trig-forms', l('Тригонометриялық түрлендірулер', 'Тригонометрические преобразования'), 'IV тарау §1 / гл. IV §1', '208–228', ['trig-identities', 'trig-reduction', 'trig-addition', 'trig-double', 'trig-basics'], trigFormGens),
  set('tr-trig-eq', l('Тригонометриялық теңдеулер', 'Тригонометрические уравнения'), 'IV тарау §2 / гл. IV §2', '229–240', ['trig-equations'], trigEqGens),
  set('tr-progressions', l('Арифметикалық және геометриялық прогрессиялар', 'Арифметическая и геометрическая прогрессии'), 'V тарау / гл. V', '250–278', ['arith-prog', 'geom-prog'], progressionGens),
  set('tr-word', l('Мәтіндік есептер', 'Текстовые задачи'), 'VI тарау / гл. VI', '279–305', ['word-problems', 'percents', 'proportions'], wordGens),
  set('tr-calculus', l('Анализ бастамалары: туынды, жанама, экстремум, интеграл', 'Начала анализа: производная, касательная, экстремум, интеграл'), 'VII тарау / гл. VII', '306–364', ['derivative-rules', 'derivative-table', 'derivative-apply', 'antiderivatives', 'integrals'], calculusGens),
  set('tr-planimetry', l('Планиметрия: үшбұрыштар, төртбұрыштар, шеңбер', 'Планиметрия: треугольники, четырёхугольники, окружность'), 'VIII тарау / гл. VIII', '365–409', ['triangles', 'right-triangle', 'triangle-area', 'quadrilaterals', 'polygons', 'circle'], planimetryGens, 'geometry'),
  set('tr-stereometry', l('Стереометрия: көпжақтар және айналу денелері', 'Стереометрия: многогранники и тела вращения'), 'IX тарау / гл. IX', '410–458', ['prisms', 'pyramids', 'bodies-rotation'], stereoGens, 'geometry'),
  set('tr-vectors', l('Координаттар және векторлар', 'Координаты и векторы'), 'X тарау / гл. X', '459–487', ['coord-plane', 'vectors'], vectorGens, 'geometry'),
]
