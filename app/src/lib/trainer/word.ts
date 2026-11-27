/** Word problems: percents, mixtures, motion, work, numbers (types of the trainer, ch. VI). */
import { l, pick, q, ri, value, type TGen } from './kit'

const lcm = (a: number, b: number) => { const g = (x: number, y: number): number => (y ? g(y, x % y) : x); return (a * b) / g(a, b) }
const pct = (x: number) => String(x).replace('.', ',')

export const wordGens: TGen[] = [
  {
    id: 'percent-twice', make: (r) => {
      const p = pick(r, [10, 20, 25, 30, 50]), qq = pick(r, [10, 20, 25, 30, 50])
      const net = ((100 + p) * (100 - qq) - 10000) / 100 // % change
      const say = (x: number) => (x === 0 ? l('өзгермеді', 'не изменилась') : x > 0 ? l(`${pct(x)}%-ға өсті`, `увеличилась на ${pct(x)}%`) : l(`${pct(-x)}%-ға кеміді`, `уменьшилась на ${pct(-x)}%`))
      const cands = [p - qq, -net, net + (net < 0 ? -1 : 1) * 5, net / 2, (p * qq) / 100, -(p * qq) / 100 - 1].filter((x) => x !== net)
      return q(r, 'percent-twice', l(`Тауардың бағасы алдымен ${p}%-ға қымбаттап, кейін ${qq}%-ға арзандады. Баға бастапқымен салыстырғанда қалай өзгерді?`, `Цену товара сначала повысили на ${p}%, потом снизили на ${qq}%. Как изменилась цена по сравнению с первоначальной?`),
        say(net), cands.map(say),
        l(`$x \\cdot ${pct(1 + p / 100)} \\cdot ${pct(1 - qq / 100)} = ${pct(((100 + p) * (100 - qq)) / 10000)}x$ → ${say(net).kz}.`, `$x \\cdot ${pct(1 + p / 100)} \\cdot ${pct(1 - qq / 100)} = ${pct(((100 + p) * (100 - qq)) / 10000)}x$ → ${say(net).ru}.`),
        [value(100 * (1 + p / 100) * (1 - qq / 100) - 100, net)])
    },
  },
  {
    id: 'mixture', make: (r) => {
      const a = ri(r, 1, 8), b = ri(r, 1, 8), p = 5 * ri(r, 1, 12), qq = 5 * ri(r, 1, 18)
      if (p === qq || (a * p + b * qq) % (a + b)) throw new Error('need a whole percent')
      const c = (a * p + b * qq) / (a + b)
      return q(r, 'mixture', l(`${p}%-дық ерітіндінің ${a} литрін ${qq}%-дық ерітіндінің ${b} литрімен араластырды. Шыққан ерітіндінің концентрациясы қанша пайыз?`, `Смешали ${a} л ${p}%-го раствора и ${b} л ${qq}%-го раствора. Какова концентрация полученного раствора?`),
        `${c}\\%`, [(p + qq) / 2, c + 5, p + qq, c - 5, Math.abs(qq - p)].filter((x) => x > 0 && x !== c).map((x) => `${pct(x)}\\%`),
        l(`Таза зат: $${a}\\cdot${pct(p / 100)} + ${b}\\cdot${pct(qq / 100)} = ${pct((a * p + b * qq) / 100)}$ л; $\\frac{${pct((a * p + b * qq) / 100)}}{${a + b}}\\cdot100\\% = ${c}\\%$.`, `Чистого вещества: $${a}\\cdot${pct(p / 100)} + ${b}\\cdot${pct(qq / 100)} = ${pct((a * p + b * qq) / 100)}$ л; $\\frac{${pct((a * p + b * qq) / 100)}}{${a + b}}\\cdot100\\% = ${c}\\%$.`),
        [value((a * p + b * qq) / (a + b), c)])
    },
  },
  {
    id: 'meeting', make: (r) => {
      const v1 = 5 * ri(r, 8, 18), v2 = 5 * ri(r, 8, 18), t = ri(r, 2, 5)
      const S = (v1 + v2) * t
      return q(r, 'meeting', l(`Арақашықтығы ${S} км екі қаладан бір мезгілде бір-біріне қарсы екі автомобиль шығып, ${t} сағаттан кейін кездесті. Біріншісінің жылдамдығы ${v1} км/сағ. Екіншісінің жылдамдығын табыңыз.`, `Из двух городов, расстояние между которыми ${S} км, одновременно навстречу друг другу выехали два автомобиля и встретились через ${t} ч. Скорость первого ${v1} км/ч. Найдите скорость второго.`),
        l(`${v2} км/сағ`, `${v2} км/ч`), [S / t + v1, S / t, v1 - 5, v2 + 10].filter((x) => x !== v2).map((x) => l(`${x} км/сағ`, `${x} км/ч`)),
        l(`Жақындасу жылдамдығы: $${S} : ${t} = ${S / t}$ км/сағ → $${S / t} - ${v1} = ${v2}$ км/сағ.`, `Скорость сближения: $${S} : ${t} = ${S / t}$ км/ч → $${S / t} - ${v1} = ${v2}$ км/ч.`),
        [value((v1 + v2) * t, S)])
    },
  },
  {
    id: 'river', make: (r) => {
      const c = ri(r, 1, 4), v = ri(r, c + 4, 24)
      const A = v + c, B = v - c, k = ri(r, 1, 3), L = lcm(A, B)
      const d = L * k, t1 = d / A, t2 = d / B
      if (d > 300 || t1 > 12 || t2 > 15) throw new Error('too big')
      return q(r, 'river', l(`Қайық екі айлақ арасындағы ${d} км жолды ағыс бойымен ${t1} сағатта, ағысқа қарсы ${t2} сағатта жүзіп өтті. Өзен ағысының жылдамдығын табыңыз.`, `Лодка проплыла ${d} км между пристанями по течению за ${t1} ч, а против течения — за ${t2} ч. Найдите скорость течения реки.`),
        l(`${c} км/сағ`, `${c} км/ч`), [A - B, v, A, B, c + 1].filter((x) => x !== c).map((x) => l(`${x} км/сағ`, `${x} км/ч`)),
        l(`Ағыс бойымен $${d} : ${t1} = ${A}$, ағысқа қарсы $${d} : ${t2} = ${B}$ км/сағ → ағыс $\\frac{${A} - ${B}}{2} = ${c}$ км/сағ.`, `По течению $${d} : ${t1} = ${A}$, против $${d} : ${t2} = ${B}$ км/ч → течение $\\frac{${A} - ${B}}{2} = ${c}$ км/ч.`),
        [value(d / (v + c), t1), value(d / (v - c), t2)])
    },
  },
  {
    id: 'work-pair', make: (r) => {
      const [a, b] = pick(r, [[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [5, 20], [12, 6], [6, 30], [15, 10], [8, 24], [9, 18], [28, 21], [36, 12]] as const)
      const t = (a * b) / (a + b)
      const who = pick(r, [l('Екі құбыр', 'Две трубы'), l('Екі жұмысшы', 'Два рабочих'), l('Екі принтер', 'Два принтера')])
      return q(r, 'work-pair', l(`${who.kz} жұмысты жеке-жеке ${a} және ${b} сағатта орындайды. Екеуі бірге неше сағатта орындайды?`, `${who.ru} выполняют работу по отдельности за ${a} и ${b} ч. За сколько часов они выполнят её вместе?`),
        String(t), [(a + b) / 2, a + b, Math.abs(a - b), t + 1, Math.min(a, b)].filter((x) => x !== t).map((x) => String(x).replace('.', '{,}')),
        l(`$\\frac{1}{${a}} + \\frac{1}{${b}} = \\frac{1}{${t}}$ → ${t} сағ.`, `$\\frac{1}{${a}} + \\frac{1}{${b}} = \\frac{1}{${t}}$ → ${t} ч.`),
        [value(1 / (1 / a + 1 / b), t)])
    },
  },
  {
    id: 'numbers', make: (r) => {
      if (r() < 0.5) {
        const x = ri(r, 10, 90), y = ri(r, 5, x - 1)
        return q(r, 'numbers-sd', l(`Екі санның қосындысы ${x + y}, ал айырмасы ${x - y}. Үлкен санды табыңыз.`, `Сумма двух чисел равна ${x + y}, а разность ${x - y}. Найдите большее число.`),
          String(x), [y, x + y, (x + y) / 2, x - y, x + 1].filter((v) => v !== x).map((v) => String(v).replace('.', '{,}')),
          l(`$\\frac{${x + y} + ${x - y}}{2} = ${x}$.`), [value(((x + y) + (x - y)) / 2, x)])
      }
      const k = ri(r, 2, 6), y = ri(r, 4, 30), x = k * y
      return q(r, 'numbers-k', l(`Бір сан екіншісінен ${k} есе үлкен, ал олардың қосындысы ${x + y}. Үлкен санды табыңыз.`, `Одно число в ${k} раза больше другого, а их сумма равна ${x + y}. Найдите большее число.`),
        String(x), [y, (x + y) / k, x + y - k, x - y].filter((v) => v !== x && v > 0).map((v) => String(Number(v.toFixed(2))).replace('.', '{,}')).concat([String(x + y)]),
        l(`$y + ${k}y = ${x + y}$ → $y = ${y}$, үлкені $${x}$.`, `$y + ${k}y = ${x + y}$ → $y = ${y}$, большее $${x}$.`), [value(((x + y) / (k + 1)) * k, x)])
    },
  },
  {
    id: 'deposit', make: (r) => {
      const P = 1000 * pick(r, [100, 200, 250, 400, 500]), p = pick(r, [10, 20]), n = pick(r, [2, 3])
      const S = Math.round(P * (1 + p / 100) ** n)
      const simple = P * (1 + (n * p) / 100)
      const fmt = (x: number) => `${x.toLocaleString('ru-RU').replace(/ /g, ' ')} тг`
      return q(r, 'deposit', l(`Банкке ${fmt(P)} жылдық ${p}% күрделі пайызбен салынды. ${n} жылдан кейін шотта қанша ақша болады?`, `В банк положили ${fmt(P)} под ${p}% годовых (сложные проценты). Сколько денег будет на счёте через ${n} года?`),
        l(fmt(S)), [simple, Math.round(P * (1 + p / 100) ** (n - 1)), Math.round(P * (1 + p / 100) ** (n + 1)), S - P].filter((x) => x !== S).map((x) => l(fmt(x))),
        l(`$${P}\\cdot ${pct(1 + p / 100)}^{${n}} = ${S}$ тг.`), [value(P * (1 + p / 100) ** n, S)])
    },
  },
  {
    id: 'ratio-split', make: (r) => {
      const a = ri(r, 1, 5), b = ri(r, 1, 6), c = ri(r, 2, 7)
      if (a === b || b === c || a === c) throw new Error('need different parts')
      const s = a + b + c, k = ri(r, 2, 30), N = s * k, big = Math.max(a, b, c) * k
      return q(r, 'ratio-split', l(`${N} санын ${a} : ${b} : ${c} қатынасындай бөліктерге бөлгенде ең үлкен бөлігі неге тең?`, `Число ${N} разделили на части в отношении ${a} : ${b} : ${c}. Чему равна наибольшая часть?`),
        String(big), [Math.min(a, b, c) * k, N / 3, (N / s) * (s - Math.max(a, b, c)), big + k].filter((x) => x !== big && Number.isInteger(x)).map(String).concat([String(N - big)]),
        l(`Бір бөлік: $${N} : ${s} = ${k}$; ең үлкені $${Math.max(a, b, c)}\\cdot${k} = ${big}$.`, `Одна часть: $${N} : ${s} = ${k}$; наибольшая $${Math.max(a, b, c)}\\cdot${k} = ${big}$.`),
        [value((N * Math.max(a, b, c)) / s, big)])
    },
  },
  {
    id: 'average-speed', make: (r) => {
      const [v1, v2] = pick(r, [[40, 60], [30, 60], [60, 90], [20, 30], [45, 90], [50, 75], [36, 45], [60, 40], [30, 70], [72, 48], [80, 120]] as const)
      const v = (2 * v1 * v2) / (v1 + v2)
      return q(r, 'average-speed', l(`Автомобиль жолдың бірінші жартысын ${v1} км/сағ, екінші жартысын ${v2} км/сағ жылдамдықпен жүрді. Бүкіл жолдағы орташа жылдамдықты табыңыз.`, `Автомобиль проехал первую половину пути со скоростью ${v1} км/ч, а вторую — ${v2} км/ч. Найдите среднюю скорость на всём пути.`),
        l(`${pct(v)} км/сағ`, `${pct(v)} км/ч`), [(v1 + v2) / 2, Math.max(v1, v2) - 5, v + 6, Math.min(v1, v2) + 2].filter((x) => x !== v).map((x) => l(`${pct(x)} км/сағ`, `${pct(x)} км/ч`)),
        l(`$v_{орт} = \\frac{2v_1v_2}{v_1 + v_2} = \\frac{2\\cdot${v1}\\cdot${v2}}{${v1 + v2}} = ${pct(v)}$ км/сағ (арифметикалық орта емес!).`, `$v_{ср} = \\frac{2v_1v_2}{v_1 + v_2} = \\frac{2\\cdot${v1}\\cdot${v2}}{${v1 + v2}} = ${pct(v)}$ км/ч (не среднее арифметическое!).`),
        [value(1 / (0.5 / v1 + 0.5 / v2), v)])
    },
  },
  {
    id: 'percent-of', make: (r) => {
      const p = pick(r, [4, 5, 8, 12, 15, 20, 25, 30, 35, 40, 60, 75]), N = 20 * ri(r, 2, 40)
      const part = (N * p) / 100
      if (!Number.isInteger(part)) throw new Error('need whole part')
      if (r() < 0.5) {
        return q(r, 'percent-whole', l(`Санның ${p}%-ы ${part}-ге тең. Санды табыңыз.`, `${p}% числа равны ${part}. Найдите число.`),
          String(N), [(part * p) / 100, part * p, N / 2, N + part].filter((x) => x !== N && Number.isInteger(x)).map(String).concat([String(N * 2)]),
          l(`$${part} : ${pct(p / 100)} = ${N}$.`), [value((part * 100) / p, N)])
      }
      return q(r, 'percent-part', l(`${part} саны ${N} санының неше пайызын құрайды?`, `Сколько процентов составляет число ${part} от числа ${N}?`),
        `${p}\\%`, [Math.round((N / part) * 10) / 10, p + 5, p * 2, 100 - p].filter((x) => x !== p).map((x) => `${pct(x)}\\%`),
        l(`$\\frac{${part}}{${N}}\\cdot100\\% = ${p}\\%$.`), [value((part / N) * 100, p)])
    },
  },
]
