import { algebraExtra } from './algebra-extra'
import { catalog } from './catalog'
import { geometryExtra } from './geometry-extra'
import { formulaTopic, geometrySections, topicById, type L, type Section } from './topics'

export type { L, Section } from './topics'
export { sections } from './topics'
export type Level = 'easy' | 'medium' | 'hard'
export type Branch = 'algebra' | 'geometry'

export type CalcVar = { name: string; tex: string; label: L }

export type Formula = {
  id: string
  branch: Branch
  section: Section
  /** Subtopic id from topics.ts (filled in for every formula of the final list). */
  topic?: string
  grade: number
  level: Level
  title: L
  tex: string
  explain: L
  example: { task: L; steps: string[]; answer: string }
  /** Equation for the formula calculator: one unknown is solved from the others. */
  calc?: { eq: string; vars: CalcVar[]; positive?: boolean }
}

const r = String.raw

const base: Formula[] = [
  // ---------------- АЛГЕБРА ----------------
  {
    id: 'percent', branch: 'algebra', section: 'arithmetic', grade: 5, level: 'easy',
    title: { ru: 'Процент от числа', kz: 'Санның пайызы' },
    tex: r`x = \dfrac{a \cdot p}{100}`,
    explain: {
      ru: 'Чтобы найти p% от числа a, умножь a на p и раздели на 100.',
      kz: 'a санының p%-ын табу үшін a-ны p-ға көбейтіп, 100-ге бөл.',
    },
    example: {
      task: { ru: 'Найди 15% от 240.', kz: '240 санының 15%-ын тап.' },
      steps: [r`x = \dfrac{240 \cdot 15}{100}`, r`x = \dfrac{3600}{100}`],
      answer: r`x = 36`,
    },
    calc: {
      eq: 'x = a*p/100',
      vars: [
        { name: 'x', tex: 'x', label: { ru: 'часть', kz: 'бөлік' } },
        { name: 'a', tex: 'a', label: { ru: 'число', kz: 'сан' } },
        { name: 'p', tex: r`p\,\%`, label: { ru: 'процент', kz: 'пайыз' } },
      ],
    },
  },
  {
    id: 'power-product', branch: 'algebra', section: 'algebra', grade: 7, level: 'easy',
    title: { ru: 'Умножение степеней', kz: 'Дәрежелерді көбейту' },
    tex: r`a^m \cdot a^n = a^{m+n}`,
    explain: {
      ru: 'При умножении степеней с одинаковым основанием показатели складываются.',
      kz: 'Негіздері бірдей дәрежелерді көбейткенде дәреже көрсеткіштері қосылады.',
    },
    example: {
      task: { ru: 'Вычисли 2³ · 2⁴.', kz: '2³ · 2⁴ мәнін есепте.' },
      steps: [r`2^3 \cdot 2^4 = 2^{3+4}`, r`= 2^7`],
      answer: '128',
    },
  },
  {
    id: 'square-sum', branch: 'algebra', section: 'algebra', grade: 7, level: 'easy',
    title: { ru: 'Квадрат суммы', kz: 'Қосындының квадраты' },
    tex: r`(a+b)^2 = a^2 + 2ab + b^2`,
    explain: {
      ru: 'Квадрат суммы равен квадрату первого числа плюс удвоенное произведение чисел плюс квадрат второго.',
      kz: 'Қосындының квадраты бірінші санның квадраты, сандардың екі еселенген көбейтіндісі және екінші санның квадратының қосындысына тең.',
    },
    example: {
      task: { ru: 'Вычисли 102² без калькулятора.', kz: '102²-ты калькуляторсыз есепте.' },
      steps: [r`102^2 = (100+2)^2`, r`= 100^2 + 2\cdot 100\cdot 2 + 2^2`, r`= 10000 + 400 + 4`],
      answer: '10404',
    },
  },
  {
    id: 'difference-squares', branch: 'algebra', section: 'algebra', grade: 7, level: 'easy',
    title: { ru: 'Разность квадратов', kz: 'Квадраттар айырмасы' },
    tex: r`a^2 - b^2 = (a-b)(a+b)`,
    explain: {
      ru: 'Разность квадратов двух чисел равна произведению их разности и суммы.',
      kz: 'Екі санның квадраттарының айырмасы олардың айырмасы мен қосындысының көбейтіндісіне тең.',
    },
    example: {
      task: { ru: 'Вычисли 51² − 49².', kz: '51² − 49² мәнін есепте.' },
      steps: [r`51^2 - 49^2 = (51-49)(51+49)`, r`= 2 \cdot 100`],
      answer: '200',
    },
  },
  {
    id: 'linear', branch: 'algebra', section: 'algebra', grade: 7, level: 'easy',
    title: { ru: 'Линейное уравнение', kz: 'Сызықтық теңдеу' },
    tex: r`ax + b = 0 \;\Rightarrow\; x = -\dfrac{b}{a}`,
    explain: {
      ru: 'Перенеси число в правую часть и раздели на коэффициент при x (a ≠ 0).',
      kz: 'Санды оң жаққа көшіріп, x-тің алдындағы коэффициентке бөл (a ≠ 0).',
    },
    example: {
      task: { ru: 'Реши уравнение 3x + 6 = 0.', kz: '3x + 6 = 0 теңдеуін шеш.' },
      steps: [r`3x = -6`, r`x = -6 : 3`],
      answer: r`x = -2`,
    },
    calc: {
      eq: 'a*x + b = 0',
      vars: [
        { name: 'x', tex: 'x', label: { ru: 'неизвестное', kz: 'белгісіз' } },
        { name: 'a', tex: 'a', label: { ru: 'коэффициент', kz: 'коэффициент' } },
        { name: 'b', tex: 'b', label: { ru: 'свободный член', kz: 'бос мүше' } },
      ],
    },
  },
  {
    id: 'discriminant', branch: 'algebra', section: 'algebra', grade: 8, level: 'medium',
    title: { ru: 'Дискриминант и корни квадратного уравнения', kz: 'Дискриминант және квадрат теңдеудің түбірлері' },
    tex: r`D = b^2 - 4ac,\qquad x_{1,2} = \dfrac{-b \pm \sqrt{D}}{2a}`,
    explain: {
      ru: 'Для уравнения ax² + bx + c = 0 сначала найди дискриминант. Если D > 0 — два корня, D = 0 — один, D < 0 — действительных корней нет.',
      kz: 'ax² + bx + c = 0 теңдеуі үшін алдымен дискриминантты тап. D > 0 болса — екі түбір, D = 0 — бір түбір, D < 0 — нақты түбірлер жоқ.',
    },
    example: {
      task: { ru: 'Реши x² − 5x + 6 = 0.', kz: 'x² − 5x + 6 = 0 теңдеуін шеш.' },
      steps: [r`a = 1,\; b = -5,\; c = 6`, r`D = (-5)^2 - 4\cdot 1\cdot 6 = 1`, r`x_{1,2} = \dfrac{5 \pm 1}{2}`],
      answer: r`x_1 = 3,\; x_2 = 2`,
    },
    calc: {
      eq: 'D = b^2 - 4*a*c',
      vars: [
        { name: 'D', tex: 'D', label: { ru: 'дискриминант', kz: 'дискриминант' } },
        { name: 'a', tex: 'a', label: { ru: 'при x²', kz: 'x² алдындағы' } },
        { name: 'b', tex: 'b', label: { ru: 'при x', kz: 'x алдындағы' } },
        { name: 'c', tex: 'c', label: { ru: 'свободный член', kz: 'бос мүше' } },
      ],
    },
  },
  {
    id: 'vieta', branch: 'algebra', section: 'algebra', grade: 8, level: 'medium',
    title: { ru: 'Теорема Виета', kz: 'Виет теоремасы' },
    tex: r`x_1 + x_2 = -\dfrac{b}{a},\qquad x_1 \cdot x_2 = \dfrac{c}{a}`,
    explain: {
      ru: 'Сумма корней квадратного уравнения равна −b/a, а произведение — c/a. Удобно подбирать корни устно.',
      kz: 'Квадрат теңдеу түбірлерінің қосындысы −b/a-ға, ал көбейтіндісі c/a-ға тең. Түбірлерді ауызша табуға ыңғайлы.',
    },
    example: {
      task: { ru: 'Найди корни x² − 7x + 10 = 0 подбором.', kz: 'x² − 7x + 10 = 0 теңдеуінің түбірлерін іріктеп тап.' },
      steps: [r`x_1 + x_2 = 7,\qquad x_1 \cdot x_2 = 10`, r`2 + 5 = 7,\qquad 2 \cdot 5 = 10`],
      answer: r`x_1 = 2,\; x_2 = 5`,
    },
  },
  {
    id: 'arithmetic-progression', branch: 'algebra', section: 'progressions', grade: 9, level: 'medium',
    title: { ru: 'n-й член арифметической прогрессии', kz: 'Арифметикалық прогрессияның n-ші мүшесі' },
    tex: r`a_n = a_1 + (n-1)\,d`,
    explain: {
      ru: 'Каждый следующий член больше предыдущего на разность d.',
      kz: 'Әрбір келесі мүше алдыңғысынан d айырымына артық.',
    },
    example: {
      task: { ru: 'a₁ = 3, d = 4. Найди a₁₀.', kz: 'a₁ = 3, d = 4. a₁₀-ды тап.' },
      steps: [r`a_{10} = 3 + (10-1)\cdot 4`, r`= 3 + 36`],
      answer: r`a_{10} = 39`,
    },
    calc: {
      eq: 'an = a1 + (n-1)*d',
      vars: [
        { name: 'an', tex: 'a_n', label: { ru: 'n-й член', kz: 'n-ші мүше' } },
        { name: 'a1', tex: 'a_1', label: { ru: 'первый член', kz: 'бірінші мүше' } },
        { name: 'n', tex: 'n', label: { ru: 'номер', kz: 'нөмірі' } },
        { name: 'd', tex: 'd', label: { ru: 'разность', kz: 'айырым' } },
      ],
    },
  },
  {
    id: 'geometric-progression', branch: 'algebra', section: 'progressions', grade: 9, level: 'medium',
    title: { ru: 'n-й член геометрической прогрессии', kz: 'Геометриялық прогрессияның n-ші мүшесі' },
    tex: r`b_n = b_1 \cdot q^{\,n-1}`,
    explain: {
      ru: 'Каждый следующий член в q раз больше предыдущего.',
      kz: 'Әрбір келесі мүше алдыңғысынан q есе артық.',
    },
    example: {
      task: { ru: 'b₁ = 2, q = 3. Найди b₅.', kz: 'b₁ = 2, q = 3. b₅-ті тап.' },
      steps: [r`b_5 = 2 \cdot 3^{4}`, r`= 2 \cdot 81`],
      answer: r`b_5 = 162`,
    },
    calc: {
      eq: 'bn = b1*q^(n-1)',
      vars: [
        { name: 'bn', tex: 'b_n', label: { ru: 'n-й член', kz: 'n-ші мүше' } },
        { name: 'b1', tex: 'b_1', label: { ru: 'первый член', kz: 'бірінші мүше' } },
        { name: 'q', tex: 'q', label: { ru: 'знаменатель', kz: 'еселік' } },
        { name: 'n', tex: 'n', label: { ru: 'номер', kz: 'нөмірі' } },
      ],
    },
  },
  {
    id: 'trig-identity', branch: 'algebra', section: 'trigonometry', grade: 9, level: 'medium',
    title: { ru: 'Основное тригонометрическое тождество', kz: 'Негізгі тригонометриялық тепе-теңдік' },
    tex: r`\sin^2\alpha + \cos^2\alpha = 1`,
    explain: {
      ru: 'Для любого угла α сумма квадратов синуса и косинуса равна 1.',
      kz: 'Кез келген α бұрышы үшін синус пен косинус квадраттарының қосындысы 1-ге тең.',
    },
    example: {
      task: { ru: 'sin α = 3/5, α — острый угол. Найди cos α.', kz: 'sin α = 3/5, α — сүйір бұрыш. cos α-ны тап.' },
      steps: [r`\cos^2\alpha = 1 - \left(\tfrac{3}{5}\right)^2`, r`= 1 - \tfrac{9}{25} = \tfrac{16}{25}`],
      answer: r`\cos\alpha = \tfrac{4}{5}`,
    },
  },
  {
    id: 'log-product', branch: 'algebra', section: 'algebra', grade: 10, level: 'hard',
    title: { ru: 'Логарифм произведения', kz: 'Көбейтіндінің логарифмі' },
    tex: r`\log_a(xy) = \log_a x + \log_a y`,
    explain: {
      ru: 'Логарифм произведения равен сумме логарифмов (a > 0, a ≠ 1, x > 0, y > 0).',
      kz: 'Көбейтіндінің логарифмі логарифмдердің қосындысына тең (a > 0, a ≠ 1, x > 0, y > 0).',
    },
    example: {
      task: { ru: 'Вычисли log₂8 + log₂4.', kz: 'log₂8 + log₂4 мәнін есепте.' },
      steps: [r`\log_2 8 + \log_2 4 = \log_2(8\cdot 4)`, r`= \log_2 32`],
      answer: '5',
    },
  },
  {
    id: 'derivative-power', branch: 'algebra', section: 'calculus', grade: 10, level: 'hard',
    title: { ru: 'Производная степени', kz: 'Дәрежелік функцияның туындысы' },
    tex: r`(x^n)' = n\,x^{n-1}`,
    explain: {
      ru: 'Показатель степени выносится вперёд множителем, а сама степень уменьшается на 1.',
      kz: 'Дәреже көрсеткіші алдыға көбейткіш болып шығады, ал дәреженің өзі 1-ге кемиді.',
    },
    example: {
      task: { ru: 'Найди производную f(x) = 3x⁴.', kz: 'f(x) = 3x⁴ функциясының туындысын тап.' },
      steps: [r`f'(x) = 3 \cdot 4x^{3}`],
      answer: r`f'(x) = 12x^3`,
    },
  },
  {
    id: 'integral-power', branch: 'algebra', section: 'calculus', grade: 11, level: 'hard',
    title: { ru: 'Интеграл степени', kz: 'Дәрежелік функцияның интегралы' },
    tex: r`\int x^n\,dx = \dfrac{x^{n+1}}{n+1} + C,\quad n \ne -1`,
    explain: {
      ru: 'Показатель увеличиваем на 1 и делим на новый показатель. Не забудь +C.',
      kz: 'Көрсеткішті 1-ге арттырып, жаңа көрсеткішке бөлеміз. +C-ны ұмытпа.',
    },
    example: {
      task: { ru: 'Найди ∫ x² dx.', kz: '∫ x² dx интегралын тап.' },
      steps: [r`\int x^2\,dx = \dfrac{x^{2+1}}{2+1} + C`],
      answer: r`\dfrac{x^3}{3} + C`,
    },
  },

  // ---------------- ГЕОМЕТРИЯ ----------------
  {
    id: 'rectangle', branch: 'geometry', section: 'planimetry', grade: 5, level: 'easy',
    title: { ru: 'Площадь и периметр прямоугольника', kz: 'Тіктөртбұрыштың ауданы мен периметрі' },
    tex: r`S = ab,\qquad P = 2(a+b)`,
    explain: {
      ru: 'Площадь — произведение длины и ширины, периметр — сумма всех сторон.',
      kz: 'Аудан — ұзындық пен еннің көбейтіндісі, периметр — барлық қабырғалардың қосындысы.',
    },
    example: {
      task: { ru: 'Стороны 6 см и 4 см. Найди S и P.', kz: 'Қабырғалары 6 см және 4 см. S пен P-ны тап.' },
      steps: [r`S = 6 \cdot 4 = 24\ \text{см}^2`, r`P = 2(6+4) = 20\ \text{см}`],
      answer: r`S = 24\ \text{см}^2,\; P = 20\ \text{см}`,
    },
    calc: {
      eq: 'S = a*b', positive: true,
      vars: [
        { name: 'S', tex: 'S', label: { ru: 'площадь', kz: 'аудан' } },
        { name: 'a', tex: 'a', label: { ru: 'длина', kz: 'ұзындық' } },
        { name: 'b', tex: 'b', label: { ru: 'ширина', kz: 'ен' } },
      ],
    },
  },
  {
    id: 'circle', branch: 'geometry', section: 'planimetry', grade: 6, level: 'easy',
    title: { ru: 'Длина окружности и площадь круга', kz: 'Шеңбердің ұзындығы және дөңгелектің ауданы' },
    tex: r`C = 2\pi r,\qquad S = \pi r^2`,
    explain: {
      ru: 'Длина окружности пропорциональна радиусу, а площадь круга — квадрату радиуса. π ≈ 3,14.',
      kz: 'Шеңбердің ұзындығы радиусқа, ал дөңгелектің ауданы радиустың квадратына пропорционал. π ≈ 3,14.',
    },
    example: {
      task: { ru: 'r = 5. Найди C и S.', kz: 'r = 5. C мен S-ті тап.' },
      steps: [r`C = 2\pi \cdot 5 = 10\pi \approx 31{,}4`, r`S = \pi \cdot 5^2 = 25\pi \approx 78{,}5`],
      answer: r`C = 10\pi,\; S = 25\pi`,
    },
    calc: {
      eq: 'S = pi*r^2', positive: true,
      vars: [
        { name: 'S', tex: 'S', label: { ru: 'площадь', kz: 'аудан' } },
        { name: 'r', tex: 'r', label: { ru: 'радиус', kz: 'радиус' } },
      ],
    },
  },
  {
    id: 'triangle-area', branch: 'geometry', section: 'planimetry', grade: 8, level: 'easy',
    title: { ru: 'Площадь треугольника', kz: 'Үшбұрыштың ауданы' },
    tex: r`S = \dfrac{1}{2}\,a\,h`,
    explain: {
      ru: 'Площадь треугольника равна половине произведения стороны на высоту, проведённую к ней.',
      kz: 'Үшбұрыштың ауданы қабырға мен оған түсірілген биіктік көбейтіндісінің жартысына тең.',
    },
    example: {
      task: { ru: 'a = 10, h = 6. Найди S.', kz: 'a = 10, h = 6. S-ті тап.' },
      steps: [r`S = \dfrac{1}{2} \cdot 10 \cdot 6`],
      answer: r`S = 30`,
    },
    calc: {
      eq: 'S = a*h/2', positive: true,
      vars: [
        { name: 'S', tex: 'S', label: { ru: 'площадь', kz: 'аудан' } },
        { name: 'a', tex: 'a', label: { ru: 'сторона', kz: 'қабырға' } },
        { name: 'h', tex: 'h', label: { ru: 'высота', kz: 'биіктік' } },
      ],
    },
  },
  {
    id: 'pythagoras', branch: 'geometry', section: 'planimetry', grade: 8, level: 'medium',
    title: { ru: 'Теорема Пифагора', kz: 'Пифагор теоремасы' },
    tex: r`c^2 = a^2 + b^2`,
    explain: {
      ru: 'В прямоугольном треугольнике квадрат гипотенузы равен сумме квадратов катетов.',
      kz: 'Тікбұрышты үшбұрышта гипотенузаның квадраты катеттердің квадраттарының қосындысына тең.',
    },
    example: {
      task: { ru: 'Катеты 3 и 4. Найди гипотенузу.', kz: 'Катеттері 3 және 4. Гипотенузаны тап.' },
      steps: [r`c^2 = 3^2 + 4^2 = 25`, r`c = \sqrt{25}`],
      answer: r`c = 5`,
    },
    calc: {
      eq: 'c^2 = a^2 + b^2', positive: true,
      vars: [
        { name: 'c', tex: 'c', label: { ru: 'гипотенуза', kz: 'гипотенуза' } },
        { name: 'a', tex: 'a', label: { ru: 'катет', kz: 'катет' } },
        { name: 'b', tex: 'b', label: { ru: 'катет', kz: 'катет' } },
      ],
    },
  },
  {
    id: 'trapezoid', branch: 'geometry', section: 'planimetry', grade: 8, level: 'medium',
    title: { ru: 'Площадь трапеции', kz: 'Трапецияның ауданы' },
    tex: r`S = \dfrac{a+b}{2}\,h`,
    explain: {
      ru: 'Полусумма оснований, умноженная на высоту.',
      kz: 'Табандарының жарты қосындысы биіктікке көбейтіледі.',
    },
    example: {
      task: { ru: 'a = 8, b = 4, h = 5. Найди S.', kz: 'a = 8, b = 4, h = 5. S-ті тап.' },
      steps: [r`S = \dfrac{8+4}{2} \cdot 5`, r`= 6 \cdot 5`],
      answer: r`S = 30`,
    },
    calc: {
      eq: 'S = (a+b)/2*h', positive: true,
      vars: [
        { name: 'S', tex: 'S', label: { ru: 'площадь', kz: 'аудан' } },
        { name: 'a', tex: 'a', label: { ru: 'основание', kz: 'табан' } },
        { name: 'b', tex: 'b', label: { ru: 'основание', kz: 'табан' } },
        { name: 'h', tex: 'h', label: { ru: 'высота', kz: 'биіктік' } },
      ],
    },
  },
  {
    id: 'heron', branch: 'geometry', section: 'planimetry', grade: 9, level: 'hard',
    title: { ru: 'Формула Герона', kz: 'Герон формуласы' },
    tex: r`S = \sqrt{p(p-a)(p-b)(p-c)},\quad p = \dfrac{a+b+c}{2}`,
    explain: {
      ru: 'Площадь треугольника по трём сторонам; p — полупериметр.',
      kz: 'Үшбұрыштың ауданын үш қабырғасы арқылы табу; p — жарты периметр.',
    },
    example: {
      task: { ru: 'Стороны 13, 14, 15. Найди S.', kz: 'Қабырғалары 13, 14, 15. S-ті тап.' },
      steps: [r`p = \dfrac{13+14+15}{2} = 21`, r`S = \sqrt{21\cdot 8\cdot 7\cdot 6} = \sqrt{7056}`],
      answer: r`S = 84`,
    },
  },
  {
    id: 'cosine-law', branch: 'geometry', section: 'planimetry', grade: 9, level: 'hard',
    title: { ru: 'Теорема косинусов', kz: 'Косинустар теоремасы' },
    tex: r`c^2 = a^2 + b^2 - 2ab\cos\gamma`,
    explain: {
      ru: 'Обобщение теоремы Пифагора для любого треугольника; γ — угол между сторонами a и b.',
      kz: 'Пифагор теоремасының кез келген үшбұрыш үшін жалпылама түрі; γ — a мен b қабырғаларының арасындағы бұрыш.',
    },
    example: {
      task: { ru: 'a = 5, b = 8, γ = 60°. Найди c.', kz: 'a = 5, b = 8, γ = 60°. c-ны тап.' },
      steps: [r`c^2 = 25 + 64 - 2\cdot 5\cdot 8\cdot \tfrac{1}{2}`, r`c^2 = 49`],
      answer: r`c = 7`,
    },
  },
  {
    id: 'cylinder', branch: 'geometry', section: 'stereometry', grade: 11, level: 'medium',
    title: { ru: 'Объём цилиндра', kz: 'Цилиндрдің көлемі' },
    tex: r`V = \pi r^2 h`,
    explain: {
      ru: 'Площадь основания (круга), умноженная на высоту.',
      kz: 'Табанының (дөңгелектің) ауданы биіктікке көбейтіледі.',
    },
    example: {
      task: { ru: 'r = 2, h = 5. Найди V.', kz: 'r = 2, h = 5. V-ны тап.' },
      steps: [r`V = \pi \cdot 2^2 \cdot 5 = 20\pi`],
      answer: r`V \approx 62{,}8`,
    },
    calc: {
      eq: 'V = pi*r^2*h', positive: true,
      vars: [
        { name: 'V', tex: 'V', label: { ru: 'объём', kz: 'көлем' } },
        { name: 'r', tex: 'r', label: { ru: 'радиус', kz: 'радиус' } },
        { name: 'h', tex: 'h', label: { ru: 'высота', kz: 'биіктік' } },
      ],
    },
  },
  {
    id: 'sphere', branch: 'geometry', section: 'stereometry', grade: 11, level: 'hard',
    title: { ru: 'Объём шара', kz: 'Шардың көлемі' },
    tex: r`V = \dfrac{4}{3}\pi R^3`,
    explain: {
      ru: 'Объём шара зависит только от радиуса.',
      kz: 'Шардың көлемі тек радиусқа тәуелді.',
    },
    example: {
      task: { ru: 'R = 3. Найди V.', kz: 'R = 3. V-ны тап.' },
      steps: [r`V = \dfrac{4}{3}\pi \cdot 27 = 36\pi`],
      answer: r`V \approx 113{,}1`,
    },
    calc: {
      eq: 'V = 4/3*pi*R^3', positive: true,
      vars: [
        { name: 'V', tex: 'V', label: { ru: 'объём', kz: 'көлем' } },
        { name: 'R', tex: 'R', label: { ru: 'радиус', kz: 'радиус' } },
      ],
    },
  },
]

/** All formulas with section/branch taken from their topic, ordered from the youngest grade up. */
export const formulas: Formula[] = [...base, ...algebraExtra, ...geometryExtra, ...catalog]
  .map((f) => {
    const topic = f.topic ?? formulaTopic[f.id]
    const section = topicById(topic)?.section ?? f.section
    return { ...f, topic, section, branch: geometrySections.includes(section) ? 'geometry' : 'algebra' } as Formula
  })
  .sort((a, b) => a.grade - b.grade)
export const grades = [5, 6, 7, 8, 9, 10, 11]
export const formulaById = (id: string) => formulas.find((f) => f.id === id)
