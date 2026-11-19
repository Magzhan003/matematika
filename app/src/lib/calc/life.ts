/**
 * Everyday math: discounts, a bank deposit, a loan, fuel, a recipe for more people, splitting a bill.
 * Each calculator has a few fields and returns school-style steps (TeX) and the answer.
 */
import type { L } from '../../data/topics'
import type { Step } from './tools'

export type LifeField = { k: string; label: L; def: number; unit?: string; options?: { v: number; label: L }[] }
export type LifeOut = { steps: Step[]; answer: string } | { error: string }
export type LifeCalc = { id: string; icon: string; title: L; fields: LifeField[]; run: (v: Record<string, number>) => LifeOut }

/** 1 234 567,89 — spaces between thousands, a comma, at most 2 decimals */
export const money = (x: number) => {
  const r = Math.round(x * 100) / 100
  const [i, d] = Math.abs(r).toFixed(2).replace(/\.00$/, '').split('.')
  return `${r < 0 ? '-' : ''}${i.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,')}${d ? `{,}${d}` : ''}`
}
const n = (x: number) => String(Math.round(x * 1000) / 1000).replace('.', '{,}')
const F = (k: string, ru: string, kz: string, def: number, unit?: string, options?: LifeField['options']): LifeField => ({ k, label: { ru, kz }, def, unit, options })

export const lifeCalcs: LifeCalc[] = [
  {
    id: 'discount', icon: '🏷', title: { ru: 'Скидка', kz: 'Жеңілдік' },
    fields: [F('price', 'Цена', 'Бағасы', 12000, 'тг'), F('p', 'Скидка', 'Жеңілдік', 25, '%'), F('p2', 'Ещё скидка (если есть)', 'Тағы жеңілдік (болса)', 0, '%')],
    run: ({ price, p, p2 }) => {
      if (!(price > 0) || p < 0 || p >= 100 || p2 < 0 || p2 >= 100) return { error: 'life.err' }
      const after = price * (1 - p / 100)
      const steps: Step[] = [
        { note: 'life.discPart', tex: `${money(price)} \\cdot \\dfrac{${n(p)}}{100} = ${money(price - after)}\\ \\text{тг}` },
        { note: 'life.discNew', tex: `${money(price)} - ${money(price - after)} = ${money(after)}\\ \\text{тг}` },
      ]
      let fin = after
      if (p2 > 0) {
        fin = after * (1 - p2 / 100)
        steps.push({ note: 'life.discSecond', tex: `${money(after)} \\cdot ${n(1 - p2 / 100)} = ${money(fin)}\\ \\text{тг}` })
        const total = (1 - fin / price) * 100
        steps.push({ note: 'life.discNotSum', params: { a: String(p), b: String(p2), c: n(total).replace('{,}', ',') }, tex: `1 - ${n(1 - p / 100)} \\cdot ${n(1 - p2 / 100)} = ${n(total / 100)} = ${n(total)}\\%` })
      }
      return { steps, answer: `${money(fin)}\\ \\text{тг}\\quad (\\text{−}${money(price - fin)}\\ \\text{тг})` }
    },
  },
  {
    id: 'deposit', icon: '🏦', title: { ru: 'Вклад в банке', kz: 'Банктегі салым' },
    fields: [
      F('sum', 'Сумма', 'Сомасы', 100000, 'тг'), F('rate', 'Ставка в год', 'Жылдық мөлшерлеме', 14, '%'), F('years', 'Срок', 'Мерзімі', 3, 'лет / жыл'),
      F('cap', 'Проценты начисляют', 'Пайыз есептеледі', 12, '', [{ v: 12, label: { ru: 'каждый месяц (капитализация)', kz: 'ай сайын (капиталдандыру)' } }, { v: 1, label: { ru: 'раз в год', kz: 'жылына бір рет' } }, { v: 0, label: { ru: 'без капитализации', kz: 'капиталдандырусыз' } }]),
    ],
    run: ({ sum, rate, years, cap }) => {
      if (!(sum > 0) || !(rate >= 0) || !(years > 0)) return { error: 'life.err' }
      let fin: number
      const steps: Step[] = []
      if (cap === 0) {
        fin = sum * (1 + (rate / 100) * years)
        steps.push({ note: 'life.depSimple', tex: `S = ${money(sum)} \\cdot \\left(1 + \\dfrac{${n(rate)}}{100} \\cdot ${n(years)}\\right) = ${money(fin)}` })
      } else {
        const k = cap, i = rate / 100 / k, m = Math.round(years * k)
        fin = sum * (1 + i) ** m
        steps.push({ note: k === 12 ? 'life.depMonthly' : 'life.depYearly', tex: `S = P\\left(1 + \\dfrac{r}{${k}}\\right)^{${k} t}` })
        steps.push({ tex: `S = ${money(sum)} \\cdot \\left(1 + \\dfrac{${n(rate / 100)}}{${k}}\\right)^{${m}} = ${money(fin)}` })
      }
      steps.push({ note: 'life.depProfit', tex: `${money(fin)} - ${money(sum)} = ${money(fin - sum)}\\ \\text{тг}` })
      return { steps, answer: `${money(fin)}\\ \\text{тг}` }
    },
  },
  {
    id: 'loan', icon: '💳', title: { ru: 'Кредит (рассрочка)', kz: 'Несие (бөліп төлеу)' },
    fields: [F('sum', 'Сумма', 'Сомасы', 300000, 'тг'), F('rate', 'Ставка в год', 'Жылдық мөлшерлеме', 20, '%'), F('months', 'Срок', 'Мерзімі', 12, 'мес / ай')],
    run: ({ sum, rate, months }) => {
      if (!(sum > 0) || !(rate >= 0) || !(months >= 1)) return { error: 'life.err' }
      const m = Math.round(months), i = rate / 100 / 12
      const pay = i === 0 ? sum / m : (sum * i) / (1 - (1 + i) ** -m)
      const steps: Step[] = [
        { note: 'life.loanRate', tex: `i = \\dfrac{${n(rate)}\\%}{12} = ${n(i)}` },
        { note: 'life.loanFormula', tex: `A = \\dfrac{S \\cdot i}{1 - (1 + i)^{-n}} = \\dfrac{${money(sum)} \\cdot ${n(i)}}{1 - ${n(1 + i)}^{-${m}}} = ${money(pay)}` },
        { note: 'life.loanTotal', tex: `${money(pay)} \\cdot ${m} = ${money(pay * m)}\\ \\text{тг}` },
        { note: 'life.loanOver', tex: `${money(pay * m)} - ${money(sum)} = ${money(pay * m - sum)}\\ \\text{тг}` },
      ]
      return { steps, answer: `${money(pay)}\\ \\text{тг}/\\text{мес}` }
    },
  },
  {
    id: 'fuel', icon: '⛽', title: { ru: 'Бензин на поездку', kz: 'Сапарға бензин' },
    fields: [F('dist', 'Расстояние', 'Қашықтық', 450, 'км'), F('use', 'Расход', 'Шығын', 8, 'л / 100 км'), F('price', 'Цена литра', 'Литр бағасы', 250, 'тг')],
    run: ({ dist, use, price }) => {
      if (!(dist > 0) || !(use > 0) || !(price >= 0)) return { error: 'life.err' }
      const l = (dist * use) / 100
      return {
        steps: [
          { note: 'life.fuelLiters', tex: `\\dfrac{${n(dist)}}{100} \\cdot ${n(use)} = ${n(l)}\\ \\text{л}` },
          { note: 'life.fuelCost', tex: `${n(l)} \\cdot ${money(price)} = ${money(l * price)}\\ \\text{тг}` },
        ],
        answer: `${n(l)}\\ \\text{л},\\ ${money(l * price)}\\ \\text{тг}`,
      }
    },
  },
  {
    id: 'recipe', icon: '🍲', title: { ru: 'Рецепт на другое число порций', kz: 'Рецептті басқа порцияға' },
    fields: [F('amount', 'Сколько нужно по рецепту', 'Рецепт бойынша қанша', 300, 'г'), F('from', 'Порций в рецепте', 'Рецептегі порция', 4), F('to', 'Нужно порций', 'Керек порция', 10)],
    run: ({ amount, from, to }) => {
      if (!(amount > 0) || !(from > 0) || !(to > 0)) return { error: 'life.err' }
      const x = (amount * to) / from
      return {
        steps: [
          { note: 'life.recipeProp', tex: `\\dfrac{${n(amount)}}{${n(from)}} = \\dfrac{x}{${n(to)}}` },
          { note: 'life.recipeX', tex: `x = \\dfrac{${n(amount)} \\cdot ${n(to)}}{${n(from)}} = ${n(x)}` },
        ],
        answer: n(x),
      }
    },
  },
  {
    id: 'bill', icon: '🧾', title: { ru: 'Счёт на компанию', kz: 'Топқа шот' },
    fields: [F('total', 'Счёт', 'Шот', 18500, 'тг'), F('people', 'Человек', 'Адам', 5), F('tip', 'Чаевые / обслуживание', 'Шайпұл / қызмет', 10, '%')],
    run: ({ total, people, tip }) => {
      if (!(total > 0) || !(people >= 1) || tip < 0) return { error: 'life.err' }
      const all = total * (1 + tip / 100), each = all / Math.round(people)
      return {
        steps: [
          { note: 'life.billTip', tex: `${money(total)} \\cdot ${n(1 + tip / 100)} = ${money(all)}\\ \\text{тг}` },
          { note: 'life.billEach', tex: `${money(all)} : ${Math.round(people)} = ${money(each)}\\ \\text{тг}` },
        ],
        answer: `${money(each)}\\ \\text{тг}`,
      }
    },
  },
]
