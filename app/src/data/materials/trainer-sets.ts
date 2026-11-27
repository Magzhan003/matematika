/**
 * ЕНТ practice sets on the task types of the Rustyumova trainer: numbers and wording are new, each variant is
 * generated from its number, answers are checked by scripts/check-trainer.ts.
 */
import { equationGens } from '../../lib/trainer/equations'
import { expGens, logGens } from '../../lib/trainer/explog'
import { makeSet, type TGen } from '../../lib/trainer/kit'
import { trigEqGens, trigFormGens } from '../../lib/trainer/trig'
import { wordGens } from '../../lib/trainer/word'
import { l, type L, type Material } from './types'

const SIZE = 20
const set = (id: string, title: L, ch: string, pages: string, topics: string[], gens: TGen[]): Material => ({
  id, title, grade: 'ent', subject: 'algebra', kind: 'test', topics, minutes: 40, scale: [18, 14, 10],
  source: l(`Рустюмова тренажеріндегі есеп түрлері бойынша (${ch}, ${pages} б.); сандары мен шарттары жаңа, әр нұсқа жаңадан құрылады.`,
    `По типам задач тренажёра Рустюмовой (${ch}, с. ${pages}); числа и условия новые, каждый вариант составляется заново.`),
  gen: (seed: number) => makeSet(gens, seed, SIZE),
  mcq: makeSet(gens, 1, SIZE),
  gens: gens.length,
})

export const trainerSets: Material[] = [
  set('tr-equations', l('Рационал теңдеулер және теңдеулер жүйесі', 'Рациональные уравнения и системы'), 'I тарау §3–4 / гл. I §3–4', '32–58', ['linear-eq', 'quadratic'], equationGens),
  set('tr-exp', l('Көрсеткіштік теңдеулер мен теңсіздіктер', 'Показательные уравнения и неравенства'), 'III тарау §1–2 / гл. III §1–2', '130–150', ['exp-fn'], expGens),
  set('tr-log', l('Логарифмдер: өрнектер, теңдеулер, теңсіздіктер', 'Логарифмы: выражения, уравнения, неравенства'), 'III тарау §3–5 / гл. III §3–5', '151–192', ['log-props', 'log-eq'], logGens),
  set('tr-trig-forms', l('Тригонометриялық түрлендірулер', 'Тригонометрические преобразования'), 'IV тарау §1 / гл. IV §1', '208–228', ['trig-identities', 'trig-reduction', 'trig-addition', 'trig-double', 'trig-basics'], trigFormGens),
  set('tr-trig-eq', l('Тригонометриялық теңдеулер', 'Тригонометрические уравнения'), 'IV тарау §2 / гл. IV §2', '229–240', ['trig-equations'], trigEqGens),
  set('tr-word', l('Мәтіндік есептер', 'Текстовые задачи'), 'VI тарау / гл. VI', '279–305', ['word-problems', 'percents', 'proportions'], wordGens),
]
