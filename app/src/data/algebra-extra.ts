import type { Formula } from './formulas'

const r = String.raw

export const algebraExtra: Formula[] = [
  // ---------- арифметика ----------
  {
    id: 'mean', branch: 'algebra', section: 'arithmetic', grade: 5, level: 'easy',
    title: { ru: 'Среднее арифметическое', kz: 'Арифметикалық орта' },
    tex: r`\bar{x} = \dfrac{x_1 + x_2 + \dots + x_n}{n}`,
    explain: {
      ru: 'Среднее арифметическое — сумма чисел, делённая на их количество.',
      kz: 'Арифметикалық орта — сандардың қосындысын олардың санына бөлгенге тең.',
    },
    example: {
      task: { ru: 'Найди среднее чисел 4, 7, 10.', kz: '4, 7, 10 сандарының арифметикалық ортасын тап.' },
      steps: [r`\bar{x} = \dfrac{4 + 7 + 10}{3} = \dfrac{21}{3}`],
      answer: r`\bar{x} = 7`,
    },
  },
  {
    id: 'motion', branch: 'algebra', section: 'arithmetic', grade: 5, level: 'easy',
    title: { ru: 'Путь, скорость, время', kz: 'Жол, жылдамдық, уақыт' },
    tex: r`s = v \cdot t`,
    explain: {
      ru: 'Путь равен скорости, умноженной на время. Отсюда v = s : t и t = s : v.',
      kz: 'Жол жылдамдық пен уақыттың көбейтіндісіне тең. Осыдан v = s : t және t = s : v.',
    },
    example: {
      task: { ru: 'Велосипедист едет 3 ч со скоростью 15 км/ч. Какой путь он проедет?', kz: 'Велосипедші 3 сағат бойы 15 км/сағ жылдамдықпен жүрді. Ол қанша жол жүрді?' },
      steps: [r`s = 15 \cdot 3`],
      answer: r`s = 45\ \text{км}`,
    },
    calc: {
      eq: 's = v*t', positive: true,
      vars: [
        { name: 's', tex: 's', label: { ru: 'путь', kz: 'жол' } },
        { name: 'v', tex: 'v', label: { ru: 'скорость', kz: 'жылдамдық' } },
        { name: 't', tex: 't', label: { ru: 'время', kz: 'уақыт' } },
      ],
    },
  },
  {
    id: 'fractions-add', branch: 'algebra', section: 'arithmetic', grade: 6, level: 'easy',
    title: { ru: 'Сложение дробей', kz: 'Бөлшектерді қосу' },
    tex: r`\dfrac{a}{b} + \dfrac{c}{d} = \dfrac{ad + bc}{bd}`,
    explain: {
      ru: 'Приведи дроби к общему знаменателю, затем сложи числители.',
      kz: 'Бөлшектерді ортақ бөлімге келтіріп, алымдарын қос.',
    },
    example: {
      task: { ru: 'Вычисли 1/2 + 1/3.', kz: '1/2 + 1/3 мәнін есепте.' },
      steps: [r`\dfrac{1}{2} + \dfrac{1}{3} = \dfrac{1\cdot 3 + 1\cdot 2}{2\cdot 3}`],
      answer: r`\dfrac{5}{6}`,
    },
  },
  {
    id: 'proportion', branch: 'algebra', section: 'arithmetic', grade: 6, level: 'easy',
    title: { ru: 'Основное свойство пропорции', kz: 'Пропорцияның негізгі қасиеті' },
    tex: r`\dfrac{a}{b} = \dfrac{c}{d} \;\Rightarrow\; ad = bc`,
    explain: {
      ru: 'Произведение крайних членов пропорции равно произведению средних.',
      kz: 'Пропорцияның шеткі мүшелерінің көбейтіндісі ортаңғы мүшелерінің көбейтіндісіне тең.',
    },
    example: {
      task: { ru: 'Реши пропорцию x/4 = 6/8.', kz: 'x/4 = 6/8 пропорциясын шеш.' },
      steps: [r`8x = 4 \cdot 6`, r`x = \dfrac{24}{8}`],
      answer: r`x = 3`,
    },
    calc: {
      eq: 'a*d = b*c',
      vars: [
        { name: 'a', tex: 'a', label: { ru: 'крайний', kz: 'шеткі' } },
        { name: 'b', tex: 'b', label: { ru: 'средний', kz: 'ортаңғы' } },
        { name: 'c', tex: 'c', label: { ru: 'средний', kz: 'ортаңғы' } },
        { name: 'd', tex: 'd', label: { ru: 'крайний', kz: 'шеткі' } },
      ],
    },
  },

  // ---------- алгебра ----------
  {
    id: 'power-quotient', branch: 'algebra', section: 'algebra', grade: 7, level: 'easy',
    title: { ru: 'Деление степеней', kz: 'Дәрежелерді бөлу' },
    tex: r`\dfrac{a^m}{a^n} = a^{m-n}`,
    explain: {
      ru: 'При делении степеней с одинаковым основанием показатели вычитаются.',
      kz: 'Негіздері бірдей дәрежелерді бөлгенде дәреже көрсеткіштері азайтылады.',
    },
    example: {
      task: { ru: 'Вычисли 3⁵ : 3³.', kz: '3⁵ : 3³ мәнін есепте.' },
      steps: [r`\dfrac{3^5}{3^3} = 3^{5-3} = 3^2`],
      answer: '9',
    },
  },
  {
    id: 'power-power', branch: 'algebra', section: 'algebra', grade: 7, level: 'easy',
    title: { ru: 'Возведение степени в степень', kz: 'Дәрежені дәрежеге шығару' },
    tex: r`(a^m)^n = a^{mn}`,
    explain: {
      ru: 'При возведении степени в степень показатели перемножаются.',
      kz: 'Дәрежені дәрежеге шығарғанда көрсеткіштер көбейтіледі.',
    },
    example: {
      task: { ru: 'Вычисли (2³)².', kz: '(2³)² мәнін есепте.' },
      steps: [r`(2^3)^2 = 2^{3\cdot 2} = 2^6`],
      answer: '64',
    },
  },
  {
    id: 'square-difference', branch: 'algebra', section: 'algebra', grade: 7, level: 'easy',
    title: { ru: 'Квадрат разности', kz: 'Айырманың квадраты' },
    tex: r`(a-b)^2 = a^2 - 2ab + b^2`,
    explain: {
      ru: 'Квадрат первого числа минус удвоенное произведение чисел плюс квадрат второго.',
      kz: 'Бірінші санның квадратынан сандардың екі еселенген көбейтіндісін азайтып, екінші санның квадратын қосамыз.',
    },
    example: {
      task: { ru: 'Вычисли 99² без калькулятора.', kz: '99²-ты калькуляторсыз есепте.' },
      steps: [r`99^2 = (100-1)^2`, r`= 10000 - 200 + 1`],
      answer: '9801',
    },
  },
  {
    id: 'cube-sum', branch: 'algebra', section: 'algebra', grade: 7, level: 'medium',
    title: { ru: 'Сумма и разность кубов', kz: 'Кубтардың қосындысы мен айырмасы' },
    tex: r`a^3 \pm b^3 = (a \pm b)(a^2 \mp ab + b^2)`,
    explain: {
      ru: 'Сумма (разность) кубов раскладывается на сумму (разность) чисел и «неполный квадрат».',
      kz: 'Кубтардың қосындысы (айырмасы) сандардың қосындысы (айырмасы) мен «толымсыз квадраттың» көбейтіндісіне жіктеледі.',
    },
    example: {
      task: { ru: 'Разложи на множители x³ + 8.', kz: 'x³ + 8 өрнегін көбейткіштерге жікте.' },
      steps: [r`x^3 + 8 = x^3 + 2^3`],
      answer: r`(x+2)(x^2 - 2x + 4)`,
    },
  },
  {
    id: 'negative-power', branch: 'algebra', section: 'algebra', grade: 8, level: 'medium',
    title: { ru: 'Степень с отрицательным и нулевым показателем', kz: 'Теріс және нөлдік көрсеткішті дәреже' },
    tex: r`a^{-n} = \dfrac{1}{a^n},\qquad a^0 = 1\ (a \ne 0)`,
    explain: {
      ru: 'Отрицательный показатель означает обратное число. Любое число, кроме 0, в нулевой степени равно 1.',
      kz: 'Теріс көрсеткіш кері санды білдіреді. Нөлден басқа кез келген санның нөлдік дәрежесі 1-ге тең.',
    },
    example: {
      task: { ru: 'Вычисли 2⁻³.', kz: '2⁻³ мәнін есепте.' },
      steps: [r`2^{-3} = \dfrac{1}{2^3}`],
      answer: r`\dfrac{1}{8}`,
    },
  },
  {
    id: 'sqrt-product', branch: 'algebra', section: 'algebra', grade: 8, level: 'medium',
    title: { ru: 'Корень из произведения', kz: 'Көбейтіндінің түбірі' },
    tex: r`\sqrt{ab} = \sqrt{a}\cdot\sqrt{b},\quad a, b \ge 0`,
    explain: {
      ru: 'Корень из произведения равен произведению корней. Так выносят множитель из-под корня.',
      kz: 'Көбейтіндінің түбірі түбірлердің көбейтіндісіне тең. Осылай түбір астынан көбейткішті шығарады.',
    },
    example: {
      task: { ru: 'Упрости √50.', kz: '√50 өрнегін ықшамда.' },
      steps: [r`\sqrt{50} = \sqrt{25 \cdot 2} = \sqrt{25}\cdot\sqrt{2}`],
      answer: r`5\sqrt{2}`,
    },
  },
  {
    id: 'log-definition', branch: 'algebra', section: 'algebra', grade: 10, level: 'medium',
    title: { ru: 'Определение логарифма', kz: 'Логарифмнің анықтамасы' },
    tex: r`\log_a b = c \;\Leftrightarrow\; a^c = b`,
    explain: {
      ru: 'Логарифм — это показатель степени, в которую надо возвести a, чтобы получить b (a > 0, a ≠ 1, b > 0).',
      kz: 'Логарифм — b санын алу үшін a негізін шығару керек дәреже көрсеткіші (a > 0, a ≠ 1, b > 0).',
    },
    example: {
      task: { ru: 'Вычисли log₂32.', kz: 'log₂32 мәнін есепте.' },
      steps: [r`2^c = 32 = 2^5`],
      answer: r`\log_2 32 = 5`,
    },
  },
  {
    id: 'log-quotient-power', branch: 'algebra', section: 'algebra', grade: 10, level: 'hard',
    title: { ru: 'Логарифм частного и степени', kz: 'Бөліндінің және дәреженің логарифмі' },
    tex: r`\log_a \dfrac{x}{y} = \log_a x - \log_a y,\qquad \log_a x^k = k\log_a x`,
    explain: {
      ru: 'Логарифм частного равен разности логарифмов, а показатель степени выносится множителем.',
      kz: 'Бөліндінің логарифмі логарифмдердің айырмасына тең, ал дәреже көрсеткіші көбейткіш ретінде алдыға шығады.',
    },
    example: {
      task: { ru: 'Вычисли log₃54 − log₃2.', kz: 'log₃54 − log₃2 мәнін есепте.' },
      steps: [r`\log_3 54 - \log_3 2 = \log_3 27`, r`= \log_3 3^3 = 3\log_3 3`],
      answer: '3',
    },
  },
  {
    id: 'log-base-change', branch: 'algebra', section: 'algebra', grade: 11, level: 'hard',
    title: { ru: 'Переход к новому основанию', kz: 'Жаңа негізге көшу' },
    tex: r`\log_a b = \dfrac{\log_c b}{\log_c a}`,
    explain: {
      ru: 'Позволяет записать логарифм через логарифмы с любым удобным основанием c.',
      kz: 'Логарифмді кез келген ыңғайлы c негізді логарифмдер арқылы жазуға мүмкіндік береді.',
    },
    example: {
      task: { ru: 'Вычисли log₄8.', kz: 'log₄8 мәнін есепте.' },
      steps: [r`\log_4 8 = \dfrac{\log_2 8}{\log_2 4} = \dfrac{3}{2}`],
      answer: r`\dfrac{3}{2}`,
    },
  },

  // ---------- функции ----------
  {
    id: 'linear-function', branch: 'algebra', section: 'functions', grade: 7, level: 'easy',
    title: { ru: 'Линейная функция', kz: 'Сызықтық функция' },
    tex: r`y = kx + b`,
    explain: {
      ru: 'График — прямая. k — угловой коэффициент (наклон), b — точка пересечения с осью y.',
      kz: 'Графигі — түзу. k — бұрыштық коэффициент (көлбеулік), b — y осімен қиылысу нүктесі.',
    },
    example: {
      task: { ru: 'y = 2x + 1. Найди y при x = 3.', kz: 'y = 2x + 1. x = 3 болғанда y-ті тап.' },
      steps: [r`y = 2 \cdot 3 + 1`],
      answer: r`y = 7`,
    },
    calc: {
      eq: 'y = k*x + b',
      vars: [
        { name: 'y', tex: 'y', label: { ru: 'значение', kz: 'мәні' } },
        { name: 'k', tex: 'k', label: { ru: 'наклон', kz: 'көлбеулік' } },
        { name: 'x', tex: 'x', label: { ru: 'аргумент', kz: 'аргумент' } },
        { name: 'b', tex: 'b', label: { ru: 'сдвиг', kz: 'ығысу' } },
      ],
    },
  },
  {
    id: 'parabola-vertex', branch: 'algebra', section: 'functions', grade: 9, level: 'medium',
    title: { ru: 'Вершина параболы', kz: 'Параболаның төбесі' },
    tex: r`x_0 = -\dfrac{b}{2a},\qquad y_0 = y(x_0)`,
    explain: {
      ru: 'Вершина параболы y = ax² + bx + c. Если a > 0 — ветви вверх, если a < 0 — вниз.',
      kz: 'y = ax² + bx + c параболасының төбесі. a > 0 болса — тармақтары жоғары, a < 0 болса — төмен.',
    },
    example: {
      task: { ru: 'Найди вершину параболы y = x² − 4x + 3.', kz: 'y = x² − 4x + 3 параболасының төбесін тап.' },
      steps: [r`x_0 = -\dfrac{-4}{2 \cdot 1} = 2`, r`y_0 = 2^2 - 4\cdot 2 + 3 = -1`],
      answer: r`(2;\ -1)`,
    },
  },

  // ---------- прогрессии ----------
  {
    id: 'arithmetic-sum', branch: 'algebra', section: 'progressions', grade: 9, level: 'medium',
    title: { ru: 'Сумма арифметической прогрессии', kz: 'Арифметикалық прогрессияның қосындысы' },
    tex: r`S_n = \dfrac{(a_1 + a_n)\,n}{2}`,
    explain: {
      ru: 'Сумма первых n членов: полусумма первого и последнего члена, умноженная на их количество.',
      kz: 'Алғашқы n мүшесінің қосындысы: бірінші және соңғы мүшелердің жарты қосындысы олардың санына көбейтіледі.',
    },
    example: {
      task: { ru: 'Найди сумму 1 + 2 + … + 100.', kz: '1 + 2 + … + 100 қосындысын тап.' },
      steps: [r`S_{100} = \dfrac{(1 + 100)\cdot 100}{2}`],
      answer: r`S_{100} = 5050`,
    },
    calc: {
      eq: 'Sn = (a1 + an)*n/2',
      vars: [
        { name: 'Sn', tex: 'S_n', label: { ru: 'сумма', kz: 'қосынды' } },
        { name: 'a1', tex: 'a_1', label: { ru: 'первый член', kz: 'бірінші мүше' } },
        { name: 'an', tex: 'a_n', label: { ru: 'последний член', kz: 'соңғы мүше' } },
        { name: 'n', tex: 'n', label: { ru: 'количество', kz: 'саны' } },
      ],
    },
  },
  {
    id: 'geometric-sum', branch: 'algebra', section: 'progressions', grade: 9, level: 'medium',
    title: { ru: 'Сумма геометрической прогрессии', kz: 'Геометриялық прогрессияның қосындысы' },
    tex: r`S_n = \dfrac{b_1\,(q^n - 1)}{q - 1},\quad q \ne 1`,
    explain: {
      ru: 'Сумма первых n членов геометрической прогрессии.',
      kz: 'Геометриялық прогрессияның алғашқы n мүшесінің қосындысы.',
    },
    example: {
      task: { ru: 'b₁ = 1, q = 2. Найди S₅.', kz: 'b₁ = 1, q = 2. S₅-ті тап.' },
      steps: [r`S_5 = \dfrac{1\cdot(2^5 - 1)}{2 - 1}`],
      answer: r`S_5 = 31`,
    },
  },

  // ---------- тригонометрия ----------
  {
    id: 'tan-definition', branch: 'algebra', section: 'trigonometry', grade: 9, level: 'easy',
    title: { ru: 'Тангенс и котангенс', kz: 'Тангенс және котангенс' },
    tex: r`\operatorname{tg}\alpha = \dfrac{\sin\alpha}{\cos\alpha},\qquad \operatorname{ctg}\alpha = \dfrac{\cos\alpha}{\sin\alpha}`,
    explain: {
      ru: 'Тангенс — отношение синуса к косинусу, котангенс — наоборот.',
      kz: 'Тангенс — синустың косинусқа қатынасы, котангенс — керісінше.',
    },
    example: {
      task: { ru: 'sin α = 3/5, cos α = 4/5. Найди tg α.', kz: 'sin α = 3/5, cos α = 4/5. tg α-ны тап.' },
      steps: [r`\operatorname{tg}\alpha = \dfrac{3/5}{4/5}`],
      answer: r`\operatorname{tg}\alpha = \dfrac{3}{4}`,
    },
  },
  {
    id: 'double-angle', branch: 'algebra', section: 'trigonometry', grade: 10, level: 'hard',
    title: { ru: 'Формулы двойного угла', kz: 'Екі еселенген бұрыштың формулалары' },
    tex: r`\sin 2\alpha = 2\sin\alpha\cos\alpha,\qquad \cos 2\alpha = \cos^2\alpha - \sin^2\alpha`,
    explain: {
      ru: 'Выражают синус и косинус угла 2α через синус и косинус угла α.',
      kz: '2α бұрышының синусы мен косинусын α бұрышының синусы мен косинусы арқылы өрнектейді.',
    },
    example: {
      task: { ru: 'sin α = 3/5, cos α = 4/5. Найди sin 2α.', kz: 'sin α = 3/5, cos α = 4/5. sin 2α-ны тап.' },
      steps: [r`\sin 2\alpha = 2 \cdot \dfrac{3}{5} \cdot \dfrac{4}{5}`],
      answer: r`\dfrac{24}{25}`,
    },
  },
  {
    id: 'sum-angles', branch: 'algebra', section: 'trigonometry', grade: 10, level: 'hard',
    title: { ru: 'Синус суммы и разности', kz: 'Қосынды мен айырманың синусы' },
    tex: r`\sin(\alpha \pm \beta) = \sin\alpha\cos\beta \pm \cos\alpha\sin\beta`,
    explain: {
      ru: 'Позволяет найти синус «неудобного» угла через известные углы 30°, 45°, 60°.',
      kz: '«Ыңғайсыз» бұрыштың синусын белгілі 30°, 45°, 60° бұрыштары арқылы табуға мүмкіндік береді.',
    },
    example: {
      task: { ru: 'Вычисли sin 75°.', kz: 'sin 75° мәнін есепте.' },
      steps: [
        r`\sin 75^\circ = \sin(45^\circ + 30^\circ)`,
        r`= \dfrac{\sqrt2}{2}\cdot\dfrac{\sqrt3}{2} + \dfrac{\sqrt2}{2}\cdot\dfrac{1}{2}`,
      ],
      answer: r`\dfrac{\sqrt6 + \sqrt2}{4}`,
    },
  },

  // ---------- начала анализа ----------
  {
    id: 'derivative-rules', branch: 'algebra', section: 'calculus', grade: 10, level: 'hard',
    title: { ru: 'Правила дифференцирования', kz: 'Дифференциалдау ережелері' },
    tex: r`(u \pm v)' = u' \pm v',\qquad (uv)' = u'v + uv'`,
    explain: {
      ru: 'Производная суммы равна сумме производных; производная произведения — по правилу «штрих на первый плюс штрих на второй».',
      kz: 'Қосындының туындысы туындылардың қосындысына тең; көбейтіндінің туындысы — «біріншісінің туындысы плюс екіншісінің туындысы» ережесімен.',
    },
    example: {
      task: { ru: 'Найди (x² · sin x)′.', kz: '(x² · sin x)′ туындысын тап.' },
      steps: [r`(x^2 \sin x)' = (x^2)'\sin x + x^2(\sin x)'`],
      answer: r`2x\sin x + x^2\cos x`,
    },
  },
  {
    id: 'chain-rule', branch: 'algebra', section: 'calculus', grade: 11, level: 'hard',
    title: { ru: 'Производная сложной функции', kz: 'Күрделі функцияның туындысы' },
    tex: r`\big(f(g(x))\big)' = f'(g(x)) \cdot g'(x)`,
    explain: {
      ru: 'Производная внешней функции, умноженная на производную внутренней.',
      kz: 'Сыртқы функцияның туындысы ішкі функцияның туындысына көбейтіледі.',
    },
    example: {
      task: { ru: 'Найди ((3x + 1)⁵)′.', kz: '((3x + 1)⁵)′ туындысын тап.' },
      steps: [r`\big((3x+1)^5\big)' = 5(3x+1)^4 \cdot 3`],
      answer: r`15(3x+1)^4`,
    },
  },
  {
    id: 'newton-leibniz', branch: 'algebra', section: 'calculus', grade: 11, level: 'hard',
    title: { ru: 'Формула Ньютона — Лейбница', kz: 'Ньютон — Лейбниц формуласы' },
    tex: r`\int_a^b f(x)\,dx = F(b) - F(a)`,
    explain: {
      ru: 'Определённый интеграл равен разности значений первообразной. Геометрически — площадь под графиком.',
      kz: 'Анықталған интеграл алғашқы функция мәндерінің айырмасына тең. Геометриялық мағынасы — график астындағы аудан.',
    },
    example: {
      task: { ru: 'Вычисли ∫₀³ x² dx.', kz: '∫₀³ x² dx интегралын есепте.' },
      steps: [r`\int_0^3 x^2\,dx = \dfrac{x^3}{3}\Big|_0^3 = \dfrac{27}{3} - 0`],
      answer: '9',
    },
  },

  // ---------- комбинаторика и вероятность ----------
  {
    id: 'probability', branch: 'algebra', section: 'combinatorics', grade: 9, level: 'easy',
    title: { ru: 'Классическая вероятность', kz: 'Классикалық ықтималдық' },
    tex: r`P(A) = \dfrac{m}{n}`,
    explain: {
      ru: 'Вероятность — число благоприятных исходов m, делённое на число всех исходов n.',
      kz: 'Ықтималдық — қолайлы нәтижелер саны m-нің барлық нәтижелер саны n-ге қатынасы.',
    },
    example: {
      task: { ru: 'Какова вероятность выбросить чётное число на игральном кубике?', kz: 'Ойын сүйегін лақтырғанда жұп сан түсу ықтималдығы қандай?' },
      steps: [r`m = 3\ (2,\ 4,\ 6),\quad n = 6`, r`P = \dfrac{3}{6}`],
      answer: r`P = \dfrac{1}{2}`,
    },
    calc: {
      eq: 'P = m/n',
      vars: [
        { name: 'P', tex: 'P', label: { ru: 'вероятность', kz: 'ықтималдық' } },
        { name: 'm', tex: 'm', label: { ru: 'благоприятные', kz: 'қолайлы' } },
        { name: 'n', tex: 'n', label: { ru: 'все исходы', kz: 'барлық нәтиже' } },
      ],
    },
  },
  {
    id: 'permutations', branch: 'algebra', section: 'combinatorics', grade: 9, level: 'medium',
    title: { ru: 'Перестановки', kz: 'Алмастырулар' },
    tex: r`P_n = n! = 1 \cdot 2 \cdot \ldots \cdot n`,
    explain: {
      ru: 'Число способов расставить n разных предметов по порядку.',
      kz: 'n түрлі затты ретімен орналастыру тәсілдерінің саны.',
    },
    example: {
      task: { ru: 'Сколькими способами можно рассадить 4 ученика на 4 стула?', kz: '4 оқушыны 4 орындыққа неше тәсілмен отырғызуға болады?' },
      steps: [r`P_4 = 4! = 1 \cdot 2 \cdot 3 \cdot 4`],
      answer: '24',
    },
  },
  {
    id: 'combinations', branch: 'algebra', section: 'combinatorics', grade: 10, level: 'hard',
    title: { ru: 'Сочетания', kz: 'Терулер' },
    tex: r`C_n^k = \dfrac{n!}{k!\,(n-k)!}`,
    explain: {
      ru: 'Число способов выбрать k предметов из n, когда порядок не важен.',
      kz: 'Рет маңызды болмағанда n заттан k затты таңдау тәсілдерінің саны.',
    },
    example: {
      task: { ru: 'Сколькими способами выбрать 2 дежурных из 5 учеников?', kz: '5 оқушының ішінен 2 кезекшіні неше тәсілмен таңдауға болады?' },
      steps: [r`C_5^2 = \dfrac{5!}{2!\cdot 3!} = \dfrac{120}{2 \cdot 6}`],
      answer: '10',
    },
  },
]
