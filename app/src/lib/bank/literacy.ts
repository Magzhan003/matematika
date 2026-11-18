/**
 * Math literacy (ЕНТ «Математическая грамотность»): everyday situations, tables, charts, logic.
 * All tasks belong to the topic "literacy".
 */
import { numTex } from '../calc/tools'
import { mk, mkT, pick, ri, type Gen, type L, type Problem, type Rng } from './core'

type Body = Omit<Problem, 'gen' | 'topic' | 'level'>
const G = (id: string, level: Gen['level'], grade: number, make: (r: Rng) => Body): Gen => ({
  id, topic: 'literacy', level, grade, make: (r) => ({ gen: id, topic: 'literacy', level, ...make(r) }),
})
const l = (ru: string, kz: string): L => ({ ru, kz })
const n = numTex
const months: L[] = [l('Сентябрь', 'Қыркүйек'), l('Октябрь', 'Қазан'), l('Ноябрь', 'Қараша'), l('Декабрь', 'Желтоқсан'), l('Январь', 'Қаңтар')]
const hm = (min: number) => `${Math.floor(min / 60) % 24}{:}${String(min % 60).padStart(2, '0')}`

export const literacyGens: Gen[] = [
  G('lit-sequence', 'easy', 5, (r) => {
    const kind = ri(r, 0, 3)
    let seq: number[]
    let next: number
    if (kind === 0) { const a = ri(r, 1, 9), d = ri(r, 3, 12); seq = [0, 1, 2, 3].map((i) => a + i * d); next = a + 4 * d }
    else if (kind === 1) { const a = ri(r, 1, 4), q = pick(r, [2, 3]); seq = [0, 1, 2, 3].map((i) => a * q ** i); next = a * q ** 4 }
    else if (kind === 2) { const k = ri(r, 1, 6); seq = [0, 1, 2, 3].map((i) => (k + i) ** 2); next = (k + 4) ** 2 }
    else { const a = ri(r, 1, 5), x = ri(r, 2, 5), y = ri(r, 6, 9); seq = [a, a + x, a + x + y, a + 2 * x + y, a + 2 * x + 2 * y]; next = a + 3 * x + 2 * y }
    const naive = seq[seq.length - 1] * 2 - seq[seq.length - 2]
    return {
      text: l(`Найди закономерность и продолжи ряд: ${seq.join('; ')}; …`, `Заңдылықты тауып, қатарды жалғастыр: ${seq.join('; ')}; …`),
      tex: '', answer: String(next), values: [next], steps: [`${seq.join(',\\ ')},\\ \\boxed{${next}}`],
      mistakes: naive !== next ? [mk(naive, 'litPattern')] : [],
    }
  }),
  G('lit-table', 'medium', 6, (r) => {
    const a = months.map(() => ri(r, 8, 40) * 5), b = months.map(() => ri(r, 8, 40) * 5)
    const kind = ri(r, 0, 2)
    const head = [l('Месяц', 'Ай'), l('Магазин A', 'A дүкені'), l('Магазин B', 'B дүкені')]
    const rows = months.map((m, i) => [m, a[i], b[i]])
    if (kind === 0) {
      const v = Math.max(...a) - Math.min(...a)
      return { text: l('В таблице — продажи двух магазинов (шт.). На сколько продажи магазина A в самый удачный месяц больше, чем в самый неудачный?', 'Кестеде екі дүкеннің сатылымы берілген (дана). A дүкенінің ең сәтті айдағы сатылымы ең сәтсіз айдағыдан қаншаға көп?'), tex: '', answer: String(v), values: [v], visual: { kind: 'table', head, rows }, steps: [`${Math.max(...a)} - ${Math.min(...a)} = ${v}`], mistakes: [mk(Math.max(...b) - Math.min(...b), 'litReadTable')] }
    }
    if (kind === 1) {
      const sa = a.reduce((s, x) => s + x, 0), sb = b.reduce((s, x) => s + x, 0), v = Math.abs(sa - sb)
      return { text: l('В таблице — продажи двух магазинов (шт.). На сколько всего за пять месяцев один магазин продал больше другого?', 'Кестеде екі дүкеннің сатылымы берілген (дана). Бес айда бір дүкен екіншісінен барлығы қаншаға көп сатты?'), tex: '', answer: String(v), values: [v], visual: { kind: 'table', head, rows }, steps: [`${sa} - ${sb} = ${sa - sb}`] }
    }
    const i = ri(r, 0, 4), v = a[i] + b[i]
    return { text: l(`В таблице — продажи двух магазинов (шт.). Сколько всего продали оба магазина за ${months[i].ru.toLowerCase()}?`, `Кестеде екі дүкеннің сатылымы берілген (дана). ${months[i].kz} айында екі дүкен барлығы қанша сатты?`), tex: '', answer: String(v), values: [v], visual: { kind: 'table', head, rows }, steps: [`${a[i]} + ${b[i]} = ${v}`] }
  }),
  G('lit-bars', 'easy', 5, (r) => {
    const total = pick(r, [20, 25, 40, 50])
    // a believable class: most get "4", few get "2"
    const c5 = ri(r, 2, total / 4), c3 = ri(r, 2, total / 5), c2 = ri(r, 0, total / 10), c4 = total - c5 - c3 - c2
    const values = [c5, c4, c3, c2]
    const sum = values.reduce((s, x) => s + x, 0)
    const kind = ri(r, 0, 2)
    const visual = { kind: 'bars' as const, title: l('Оценки за контрольную', 'Бақылау жұмысының бағалары'), labels: ['5', '4', '3', '2'], values, unit: l('учеников', 'оқушы') }
    if (kind === 0) return { text: l('На диаграмме — оценки класса за контрольную. Сколько учеников писали контрольную?', 'Диаграммада сыныптың бақылау жұмысының бағалары берілген. Бақылау жұмысын неше оқушы жазды?'), tex: '', answer: String(sum), values: [sum], visual, steps: [`${values.join(' + ')} = ${sum}`] }
    if (kind === 1) {
      const p = (values[0] / sum) * 100
      return { text: l('На диаграмме — оценки класса за контрольную. Сколько процентов учеников получили «5»?', 'Диаграммада сыныптың бақылау жұмысының бағалары берілген. Оқушылардың неше пайызы «5» алды?'), tex: '', answer: `${n(p)}\\%`, values: [p], visual, steps: [`\\dfrac{${values[0]}}{${sum}} \\cdot 100\\% = ${n(p)}\\%`], mistakes: [mk(values[0], 'litPercentOf', `${values[0]}\\%`)] }
    }
    const v = values[1] + values[0]
    return { text: l('На диаграмме — оценки класса за контрольную. Сколько учеников получили «4» или «5»?', 'Диаграммада сыныптың бақылау жұмысының бағалары берілген. Неше оқушы «4» немесе «5» алды?'), tex: '', answer: String(v), values: [v], visual, steps: [`${values[0]} + ${values[1]} = ${v}`] }
  }),
  G('lit-tariff', 'medium', 7, (r) => {
    const fee = ri(r, 10, 30) * 100, free = pick(r, [100, 200, 300]), c1 = pick(r, [5, 8, 10]), c2 = pick(r, [12, 15, 20]), m = ri(r, 2, 8) * 50
    const A = fee + Math.max(0, m - free) * c1, B = m * c2, v = Math.abs(A - B)
    const naive = Math.abs(fee + m * c1 - B)
    return {
      text: l(`Тариф A: абонентская плата ${fee} тг в месяц, ${free} минут бесплатно, далее ${c1} тг/мин. Тариф B: без абонентской платы, ${c2} тг/мин. Айгерим говорит ${m} минут в месяц. Сколько тенге в месяц она сэкономит, выбрав более выгодный тариф?`, `A тарифі: айына ${fee} тг абоненттік төлем, ${free} минут тегін, одан әрі ${c1} тг/мин. B тарифі: абоненттік төлемсіз, ${c2} тг/мин. Айгерім айына ${m} минут сөйлеседі. Тиімді тарифті таңдаса, айына неше теңге үнемдейді?`),
      tex: '', answer: String(v), values: [v],
      visual: { kind: 'table', head: [l('Тариф', 'Тариф'), l('Плата в месяц', 'Айлық төлем'), l('Бесплатно', 'Тегін'), l('Минута', 'Минут')], rows: [['A', `${fee} тг`, `${free} мин`, `${c1} тг`], ['B', '0', '—', `${c2} тг`]] },
      steps: [`A = ${fee} + ${Math.max(0, m - free)} \\cdot ${c1} = ${A}`, `B = ${m} \\cdot ${c2} = ${B}`, `|${A} - ${B}| = ${v}`],
      mistakes: naive !== v ? [mk(naive, 'litTariffFree')] : [],
    }
  }),
  G('lit-bestbuy', 'medium', 6, (r) => {
    const per = [ri(r, 8, 14) * 100, ri(r, 8, 14) * 100, ri(r, 8, 14) * 100] // price per kg
    const w = [0.5, 1, 2].sort(() => r() - 0.5)
    const price = per.map((p, i) => p * w[i])
    const best = Math.min(...per)
    const cheapest = price.indexOf(Math.min(...price))
    return {
      text: l('В магазине продаётся рис в трёх упаковках. Сколько тенге стоит 1 кг риса в самой выгодной упаковке?', 'Дүкенде күріш үш түрлі қаптамада сатылады. Ең тиімді қаптамада 1 кг күріш неше теңге тұрады?'),
      tex: '', answer: String(best), values: [best],
      visual: { kind: 'table', head: [l('Упаковка', 'Қаптама'), l('Масса', 'Массасы'), l('Цена', 'Бағасы')], rows: ['A', 'B', 'C'].map((x, i) => [x, `${String(w[i]).replace('.', ',')} кг`, `${price[i]} тг`]) },
      steps: per.map((p, i) => `${'ABC'[i]}:\\ ${price[i]} : ${n(w[i])} = ${p}`),
      mistakes: per[cheapest] !== best ? [mk(per[cheapest], 'litPerUnit')] : [],
    }
  }),
  G('lit-time', 'easy', 5, (r) => {
    const start = ri(r, 6 * 12, 14 * 12) * 5, dur = ri(r, 1 * 12 + 1, 5 * 12) * 5
    const end = start + dur
    const carry = (start % 60) + (dur % 60) >= 60
    const naive = carry ? end - 60 : end + 60
    return {
      text: l(`Поезд отправился в ${hm(start).replace('{:}', ':')} и был в пути ${Math.floor(dur / 60)} ч ${dur % 60} мин. Во сколько он прибыл?`, `Пойыз ${hm(start).replace('{:}', ':')}-де жолға шығып, ${Math.floor(dur / 60)} сағ ${dur % 60} мин жүрді. Ол сағат нешеде келді?`),
      tex: '', answer: hm(end), steps: [`${hm(start)} + ${hm(dur)} = ${hm(end)}`],
      wrong: [hm(end + 10), hm(end - 10), hm(end + 30)],
      mistakes: [mkT(hm(naive), carry ? 'litTimeCarry' : 'litTimeHour')],
    }
  }),
  G('lit-units', 'easy', 6, (r) => {
    const kind = ri(r, 0, 2)
    if (kind === 0) {
      const v = pick(r, [36, 54, 72, 90, 108]), ms = v / 3.6
      return { text: l(`Автомобиль едет со скоростью ${v} км/ч. Сколько это метров в секунду?`, `Көлік ${v} км/сағ жылдамдықпен жүріп келеді. Бұл секундына неше метр?`), tex: '', answer: String(ms), values: [ms], steps: [`${v} \\cdot \\dfrac{1000}{3600} = ${ms}`], mistakes: [mk(v * 3.6, 'litUnits')] }
    }
    if (kind === 1) {
      const k = ri(r, 2, 9)
      return { text: l(`Площадь стола ${k} м². Сколько это квадратных сантиметров?`, `Үстелдің ауданы ${k} м². Бұл неше шаршы сантиметр?`), tex: '', answer: String(k * 10000), values: [k * 10000], steps: [`1\\text{ м}^2 = 100 \\cdot 100 = 10\\,000\\text{ см}^2`], mistakes: [mk(k * 100, 'litArea')] }
    }
    const h = pick(r, [1.5, 2.5, 3.25, 0.75, 1.2])
    return { text: l(`Фильм длится ${String(h).replace('.', ',')} ч. Сколько это минут?`, `Фильм ${String(h).replace('.', ',')} сағатқа созылады. Бұл неше минут?`), tex: '', answer: String(h * 60), values: [h * 60], steps: [`${n(h)} \\cdot 60 = ${h * 60}`], mistakes: [mk(Math.floor(h) * 60 + Math.round((h % 1) * 100), 'litDecimalTime')] }
  }),
  G('lit-scale', 'medium', 6, (r) => {
    const N = pick(r, [10000, 25000, 50000, 100000, 200000]), d = ri(r, 2, 12)
    const km = (d * N) / 100000
    return {
      text: l(`Масштаб карты 1 : ${N}. Расстояние между сёлами на карте ${d} см. Каково расстояние на местности в километрах?`, `Карта масштабы 1 : ${N}. Картада ауылдардың арақашықтығы ${d} см. Жердегі арақашықтық неше километр?`),
      tex: '', answer: n(km), values: [km], steps: [`${d} \\cdot ${N} = ${d * N}\\text{ см} = ${n(km)}\\text{ км}`], mistakes: [mk((d * N) / 1000, 'litScale')],
    }
  }),
  G('lit-shop', 'medium', 7, (r) => {
    const P = ri(r, 5, 30) * 100, p = pick(r, [10, 20, 25, 30, 40])
    const A = 3 * P * (1 - p / 100), B = 2 * P, v = Math.abs(A - B)
    return {
      text: l(`Футболка стоит ${P} тг. В магазине A на неё скидка ${p}%, в магазине B — акция «3 по цене 2». Нужно купить 3 футболки. На сколько тенге покупка в одном магазине дороже, чем в другом?`, `Футболка ${P} тг тұрады. A дүкенінде оған ${p}% жеңілдік, B дүкенінде «3-еуі 2-нің бағасына» акциясы бар. 3 футболка сатып алу керек. Бір дүкендегі сатып алу екіншісінен неше теңгеге қымбат?`),
      tex: '', answer: n(v), values: [v], steps: [`A = 3 \\cdot ${P} \\cdot ${n(1 - p / 100)} = ${n(A)}`, `B = 2 \\cdot ${P} = ${B}`, `|${n(A)} - ${B}| = ${n(v)}`],
      mistakes: [mk(Math.abs(P * (1 - p / 100) * 1 - (2 * P) / 3), 'litWholeBuy')],
    }
  }),
  G('lit-handshake', 'medium', 8, (r) => {
    const k = ri(r, 5, 12), v = (k * (k - 1)) / 2, chess = r() < 0.5
    return {
      text: chess
        ? l(`В шахматном турнире ${k} участников, каждый сыграл с каждым по одной партии. Сколько всего было партий?`, `Шахмат турнирінде ${k} қатысушы бар, әрқайсысы әрқайсысымен бір партиядан ойнады. Барлығы неше партия болды?`)
        : l(`На встрече ${k} друзей каждый пожал руку каждому. Сколько всего было рукопожатий?`, `Кездесуде ${k} дос бар, әрқайсысы әрқайсысымен қол алысты. Барлығы неше рет қол алысты?`),
      tex: '', answer: String(v), values: [v], steps: [`\\dfrac{${k} \\cdot ${k - 1}}{2} = ${v}`], mistakes: [mk(k * (k - 1), 'litDouble')],
    }
  }),
  G('lit-clock', 'medium', 7, (r) => {
    const h = ri(r, 1, 11), half = r() < 0.5
    const raw = Math.abs(30 * h + (half ? 15 : 0) - (half ? 180 : 0))
    const v = Math.min(raw, 360 - raw)
    const naiveRaw = Math.abs(30 * h - (half ? 180 : 0)), naive = Math.min(naiveRaw, 360 - naiveRaw)
    return {
      text: l(`Какой угол (в градусах) образуют часовая и минутная стрелки в ${h}:${half ? '30' : '00'}?`, `Сағат ${h}:${half ? '30' : '00'} болғанда сағат пен минут тілдері қандай бұрыш (градуспен) жасайды?`),
      tex: '', answer: `${v}^\\circ`, values: [v], steps: half ? [`${h} \\cdot 30^\\circ + 15^\\circ = ${30 * h + 15}^\\circ`, `|${30 * h + 15}^\\circ - 180^\\circ| = ${v}^\\circ`] : [`${h} \\cdot 30^\\circ = ${30 * h}^\\circ`],
      mistakes: half && naive !== v ? [mk(naive, 'litClock', `${naive}^\\circ`)] : [],
    }
  }),
  G('lit-ages', 'medium', 7, (r) => {
    const S = ri(r, 4, 12), x = ri(r, 2, 15), k = pick(r, [2, 3]), F = k * (S + x) - x
    return {
      text: l(`Отцу ${F} лет, сыну ${S}. Через сколько лет отец будет ${k === 2 ? 'вдвое' : 'втрое'} старше сына?`, `Әкесі ${F} жаста, ұлы ${S} жаста. Неше жылдан кейін әкесі ұлынан ${k === 2 ? 'екі' : 'үш'} есе үлкен болады?`),
      tex: '', answer: String(x), values: [x], steps: [`${F} + x = ${k}(${S} + x)`, `x = ${x}`], mistakes: k === 3 ? [mk(F - 3 * S, 'litAges')] : [],
    }
  }),
  G('lit-fuel', 'medium', 7, (r) => {
    const c = pick(r, [6, 7, 8, 9, 10]), d = ri(r, 2, 9) * 100, p = pick(r, [200, 220, 250, 280])
    const v = (c * d * p) / 100
    return {
      text: l(`Машина расходует ${c} л бензина на 100 км. Бензин стоит ${p} тг за литр. Сколько тенге будет стоить поездка на ${d} км?`, `Көлік 100 км-ге ${c} л бензин жұмсайды. Бензиннің литрі ${p} тг. ${d} км жол жүру неше теңге тұрады?`),
      tex: '', answer: String(v), values: [v], steps: [`\\dfrac{${c} \\cdot ${d}}{100} = ${(c * d) / 100}\\text{ л}`, `${(c * d) / 100} \\cdot ${p} = ${v}`], mistakes: [mk(c * d * p, 'litPer100')],
    }
  }),
  G('lit-avg-speed', 'hard', 8, (r) => {
    const [v1, v2] = pick(r, [[30, 60], [40, 60], [60, 90], [20, 30], [45, 90], [6, 12], [10, 15], [60, 40]])
    const v = (2 * v1 * v2) / (v1 + v2)
    return {
      text: l(`Велосипедист ехал из города в посёлок со скоростью ${v1} км/ч, а обратно — со скоростью ${v2} км/ч. Найди среднюю скорость на всём пути.`, `Велосипедші қаладан ауылға ${v1} км/сағ, ал кері қарай ${v2} км/сағ жылдамдықпен жүрді. Бүкіл жолдағы орташа жылдамдықты тап.`),
      tex: '', answer: n(v), values: [v], steps: [`v =\\dfrac{2 \\cdot ${v1} \\cdot ${v2}}{${v1} + ${v2}} = ${n(v)}`], mistakes: [mk((v1 + v2) / 2, 'litAvgSpeed')],
    }
  }),
]
