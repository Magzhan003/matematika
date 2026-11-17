import type { Formula } from './formulas'

const r = String.raw

export const geometryExtra: Formula[] = [
  // ---------- планиметрия ----------
  {
    id: 'triangle-angles', branch: 'geometry', section: 'planimetry', grade: 7, level: 'easy',
    title: { ru: 'Сумма углов треугольника', kz: 'Үшбұрыш бұрыштарының қосындысы' },
    tex: r`\alpha + \beta + \gamma = 180^\circ`,
    explain: {
      ru: 'Сумма углов любого треугольника равна 180°.',
      kz: 'Кез келген үшбұрыштың бұрыштарының қосындысы 180°-қа тең.',
    },
    example: {
      task: { ru: 'Два угла треугольника 50° и 60°. Найди третий.', kz: 'Үшбұрыштың екі бұрышы 50° және 60°. Үшінші бұрышты тап.' },
      steps: [r`\gamma = 180^\circ - 50^\circ - 60^\circ`],
      answer: r`\gamma = 70^\circ`,
    },
    calc: {
      eq: 'al + be + ga = 180', positive: true,
      vars: [
        { name: 'al', tex: r`\alpha`, label: { ru: 'угол, °', kz: 'бұрыш, °' } },
        { name: 'be', tex: r`\beta`, label: { ru: 'угол, °', kz: 'бұрыш, °' } },
        { name: 'ga', tex: r`\gamma`, label: { ru: 'угол, °', kz: 'бұрыш, °' } },
      ],
    },
  },
  {
    id: 'polygon-angles', branch: 'geometry', section: 'planimetry', grade: 8, level: 'easy',
    title: { ru: 'Сумма углов многоугольника', kz: 'Көпбұрыш бұрыштарының қосындысы' },
    tex: r`S = (n - 2)\cdot 180^\circ`,
    explain: {
      ru: 'Сумма углов выпуклого n-угольника: его можно разрезать на n − 2 треугольника.',
      kz: 'Дөңес n-бұрыштың бұрыштарының қосындысы: оны n − 2 үшбұрышқа бөлуге болады.',
    },
    example: {
      task: { ru: 'Найди сумму углов шестиугольника.', kz: 'Алтыбұрыштың бұрыштарының қосындысын тап.' },
      steps: [r`S = (6 - 2)\cdot 180^\circ`],
      answer: r`S = 720^\circ`,
    },
    calc: {
      eq: 'S = (n - 2)*180', positive: true,
      vars: [
        { name: 'S', tex: 'S', label: { ru: 'сумма углов, °', kz: 'бұрыштар қосындысы, °' } },
        { name: 'n', tex: 'n', label: { ru: 'число сторон', kz: 'қабырғалар саны' } },
      ],
    },
  },
  {
    id: 'parallelogram-area', branch: 'geometry', section: 'planimetry', grade: 8, level: 'easy',
    title: { ru: 'Площадь параллелограмма', kz: 'Параллелограмның ауданы' },
    tex: r`S = a\,h_a`,
    explain: {
      ru: 'Площадь параллелограмма равна стороне, умноженной на высоту, проведённую к ней.',
      kz: 'Параллелограмның ауданы қабырға мен оған түсірілген биіктіктің көбейтіндісіне тең.',
    },
    example: {
      task: { ru: 'a = 7, h = 4. Найди S.', kz: 'a = 7, h = 4. S-ті тап.' },
      steps: [r`S = 7 \cdot 4`],
      answer: r`S = 28`,
    },
    calc: {
      eq: 'S = a*h', positive: true,
      vars: [
        { name: 'S', tex: 'S', label: { ru: 'площадь', kz: 'аудан' } },
        { name: 'a', tex: 'a', label: { ru: 'сторона', kz: 'қабырға' } },
        { name: 'h', tex: 'h_a', label: { ru: 'высота', kz: 'биіктік' } },
      ],
    },
  },
  {
    id: 'rhombus-area', branch: 'geometry', section: 'planimetry', grade: 8, level: 'easy',
    title: { ru: 'Площадь ромба', kz: 'Ромбтың ауданы' },
    tex: r`S = \dfrac{d_1\,d_2}{2}`,
    explain: {
      ru: 'Площадь ромба равна половине произведения его диагоналей.',
      kz: 'Ромбтың ауданы диагональдары көбейтіндісінің жартысына тең.',
    },
    example: {
      task: { ru: 'Диагонали ромба 6 и 8. Найди S.', kz: 'Ромбтың диагональдары 6 және 8. S-ті тап.' },
      steps: [r`S = \dfrac{6 \cdot 8}{2}`],
      answer: r`S = 24`,
    },
    calc: {
      eq: 'S = d1*d2/2', positive: true,
      vars: [
        { name: 'S', tex: 'S', label: { ru: 'площадь', kz: 'аудан' } },
        { name: 'd1', tex: 'd_1', label: { ru: 'диагональ', kz: 'диагональ' } },
        { name: 'd2', tex: 'd_2', label: { ru: 'диагональ', kz: 'диагональ' } },
      ],
    },
  },
  {
    id: 'inscribed-angle', branch: 'geometry', section: 'planimetry', grade: 8, level: 'medium',
    title: { ru: 'Вписанный угол', kz: 'Іштей сызылған бұрыш' },
    tex: r`\beta = \dfrac{\alpha}{2}`,
    explain: {
      ru: 'Вписанный угол β равен половине центрального угла α, опирающегося на ту же дугу.',
      kz: 'Іштей сызылған β бұрышы сол доғаға тірелген α центрлік бұрышының жартысына тең.',
    },
    example: {
      task: { ru: 'Центральный угол 100°. Найди вписанный угол, опирающийся на ту же дугу.', kz: 'Центрлік бұрыш 100°. Сол доғаға тірелген іштей сызылған бұрышты тап.' },
      steps: [r`\beta = \dfrac{100^\circ}{2}`],
      answer: r`\beta = 50^\circ`,
    },
  },
  {
    id: 'similarity-area', branch: 'geometry', section: 'planimetry', grade: 8, level: 'medium',
    title: { ru: 'Площади подобных фигур', kz: 'Ұқсас фигуралардың аудандары' },
    tex: r`\dfrac{S_1}{S_2} = k^2`,
    explain: {
      ru: 'Если фигуры подобны с коэффициентом k, то их площади относятся как k².',
      kz: 'Фигуралар k коэффициентімен ұқсас болса, олардың аудандарының қатынасы k²-қа тең.',
    },
    example: {
      task: { ru: 'k = 3, площадь меньшего треугольника 5. Найди площадь большего.', kz: 'k = 3, кіші үшбұрыштың ауданы 5. Үлкенінің ауданын тап.' },
      steps: [r`S_1 = k^2 \cdot S_2 = 9 \cdot 5`],
      answer: r`S_1 = 45`,
    },
  },
  {
    id: 'triangle-area-sine', branch: 'geometry', section: 'planimetry', grade: 9, level: 'medium',
    title: { ru: 'Площадь треугольника через синус', kz: 'Үшбұрыштың ауданы синус арқылы' },
    tex: r`S = \dfrac{1}{2}\,ab\sin\gamma`,
    explain: {
      ru: 'Площадь треугольника по двум сторонам и углу между ними.',
      kz: 'Екі қабырғасы және олардың арасындағы бұрыш арқылы үшбұрыштың ауданы.',
    },
    example: {
      task: { ru: 'a = 6, b = 8, γ = 30°. Найди S.', kz: 'a = 6, b = 8, γ = 30°. S-ті тап.' },
      steps: [r`S = \dfrac{1}{2}\cdot 6 \cdot 8 \cdot \dfrac{1}{2}`],
      answer: r`S = 12`,
    },
  },
  {
    id: 'sine-law', branch: 'geometry', section: 'planimetry', grade: 9, level: 'hard',
    title: { ru: 'Теорема синусов', kz: 'Синустар теоремасы' },
    tex: r`\dfrac{a}{\sin\alpha} = \dfrac{b}{\sin\beta} = \dfrac{c}{\sin\gamma} = 2R`,
    explain: {
      ru: 'Стороны треугольника пропорциональны синусам противолежащих углов; R — радиус описанной окружности.',
      kz: 'Үшбұрыштың қабырғалары қарсы жатқан бұрыштардың синустарына пропорционал; R — сырттай сызылған шеңбердің радиусы.',
    },
    example: {
      task: { ru: 'a = 10, α = 30°. Найди радиус описанной окружности.', kz: 'a = 10, α = 30°. Сырттай сызылған шеңбердің радиусын тап.' },
      steps: [r`2R = \dfrac{10}{\sin 30^\circ} = \dfrac{10}{1/2} = 20`],
      answer: r`R = 10`,
    },
  },
  {
    id: 'sector', branch: 'geometry', section: 'planimetry', grade: 9, level: 'medium',
    title: { ru: 'Длина дуги и площадь сектора', kz: 'Доғаның ұзындығы және сектордың ауданы' },
    tex: r`l = \dfrac{\pi r \alpha}{180^\circ},\qquad S = \dfrac{\pi r^2 \alpha}{360^\circ}`,
    explain: {
      ru: 'Для дуги и сектора с центральным углом α (в градусах) берём долю α/360° от всего круга.',
      kz: 'Центрлік бұрышы α (градуспен) болатын доға мен сектор үшін бүкіл дөңгелектің α/360° бөлігін аламыз.',
    },
    example: {
      task: { ru: 'r = 6, α = 60°. Найди площадь сектора.', kz: 'r = 6, α = 60°. Сектордың ауданын тап.' },
      steps: [r`S = \dfrac{\pi \cdot 36 \cdot 60^\circ}{360^\circ} = 6\pi`],
      answer: r`S = 6\pi \approx 18{,}8`,
    },
    calc: {
      eq: 'S = pi*r^2*al/360', positive: true,
      vars: [
        { name: 'S', tex: 'S', label: { ru: 'площадь сектора', kz: 'сектор ауданы' } },
        { name: 'r', tex: 'r', label: { ru: 'радиус', kz: 'радиус' } },
        { name: 'al', tex: r`\alpha`, label: { ru: 'угол, °', kz: 'бұрыш, °' } },
      ],
    },
  },

  // ---------- координаты и векторы ----------
  {
    id: 'distance', branch: 'geometry', section: 'coordinates', grade: 9, level: 'medium',
    title: { ru: 'Расстояние между точками', kz: 'Нүктелердің арақашықтығы' },
    tex: r`d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}`,
    explain: {
      ru: 'Расстояние между A(x₁; y₁) и B(x₂; y₂) — это теорема Пифагора на координатной плоскости.',
      kz: 'A(x₁; y₁) және B(x₂; y₂) нүктелерінің арақашықтығы — координаталық жазықтықтағы Пифагор теоремасы.',
    },
    example: {
      task: { ru: 'A(1; 2), B(4; 6). Найди AB.', kz: 'A(1; 2), B(4; 6). AB-ны тап.' },
      steps: [r`d = \sqrt{(4-1)^2 + (6-2)^2} = \sqrt{9 + 16}`],
      answer: r`d = 5`,
    },
  },
  {
    id: 'midpoint', branch: 'geometry', section: 'coordinates', grade: 9, level: 'easy',
    title: { ru: 'Середина отрезка', kz: 'Кесіндінің ортасы' },
    tex: r`x = \dfrac{x_1 + x_2}{2},\qquad y = \dfrac{y_1 + y_2}{2}`,
    explain: {
      ru: 'Координаты середины отрезка — средние арифметические координат его концов.',
      kz: 'Кесінді ортасының координаталары — оның ұштары координаталарының арифметикалық ортасы.',
    },
    example: {
      task: { ru: 'A(2; 8), B(6; −4). Найди середину AB.', kz: 'A(2; 8), B(6; −4). AB кесіндісінің ортасын тап.' },
      steps: [r`x = \dfrac{2 + 6}{2} = 4,\qquad y = \dfrac{8 + (-4)}{2} = 2`],
      answer: r`(4;\ 2)`,
    },
  },
  {
    id: 'circle-equation', branch: 'geometry', section: 'coordinates', grade: 9, level: 'medium',
    title: { ru: 'Уравнение окружности', kz: 'Шеңбердің теңдеуі' },
    tex: r`(x - a)^2 + (y - b)^2 = r^2`,
    explain: {
      ru: 'Окружность с центром в точке (a; b) и радиусом r.',
      kz: 'Центрі (a; b) нүктесінде, радиусы r болатын шеңбер.',
    },
    example: {
      task: { ru: '(x − 3)² + (y + 1)² = 16. Найди центр и радиус.', kz: '(x − 3)² + (y + 1)² = 16. Центрі мен радиусын тап.' },
      steps: [r`a = 3,\quad b = -1,\quad r^2 = 16`],
      answer: r`(3;\ -1),\ r = 4`,
    },
  },
  {
    id: 'vector-length', branch: 'geometry', section: 'coordinates', grade: 9, level: 'medium',
    title: { ru: 'Длина вектора', kz: 'Вектордың ұзындығы' },
    tex: r`|\vec a| = \sqrt{x^2 + y^2}`,
    explain: {
      ru: 'Длина (модуль) вектора с координатами (x; y).',
      kz: '(x; y) координаталы вектордың ұзындығы (модулі).',
    },
    example: {
      task: { ru: 'a(6; 8). Найди |a|.', kz: 'a(6; 8). |a|-ны тап.' },
      steps: [r`|\vec a| = \sqrt{36 + 64} = \sqrt{100}`],
      answer: r`|\vec a| = 10`,
    },
  },
  {
    id: 'dot-product', branch: 'geometry', section: 'coordinates', grade: 9, level: 'hard',
    title: { ru: 'Скалярное произведение', kz: 'Скаляр көбейтінді' },
    tex: r`\vec a \cdot \vec b = |\vec a|\,|\vec b|\cos\varphi = x_1x_2 + y_1y_2`,
    explain: {
      ru: 'Если скалярное произведение равно 0, векторы перпендикулярны.',
      kz: 'Скаляр көбейтінді 0-ге тең болса, векторлар перпендикуляр.',
    },
    example: {
      task: { ru: 'a(2; 3), b(3; −2). Перпендикулярны ли векторы?', kz: 'a(2; 3), b(3; −2). Векторлар перпендикуляр ма?' },
      steps: [r`\vec a \cdot \vec b = 2 \cdot 3 + 3 \cdot (-2) = 0`],
      answer: r`\vec a \perp \vec b`,
    },
  },

  // ---------- стереометрия ----------
  {
    id: 'cube', branch: 'geometry', section: 'stereometry', grade: 5, level: 'easy',
    title: { ru: 'Объём и площадь поверхности куба', kz: 'Кубтың көлемі және бетінің ауданы' },
    tex: r`V = a^3,\qquad S = 6a^2`,
    explain: {
      ru: 'Объём куба — ребро в кубе, площадь поверхности — шесть квадратных граней.',
      kz: 'Кубтың көлемі — қырының кубы, бетінің ауданы — алты шаршы жағының ауданы.',
    },
    example: {
      task: { ru: 'Ребро куба 3 см. Найди V и S.', kz: 'Кубтың қыры 3 см. V мен S-ті тап.' },
      steps: [r`V = 3^3 = 27\ \text{см}^3`, r`S = 6 \cdot 3^2 = 54\ \text{см}^2`],
      answer: r`V = 27,\ S = 54`,
    },
    calc: {
      eq: 'V = a^3', positive: true,
      vars: [
        { name: 'V', tex: 'V', label: { ru: 'объём', kz: 'көлем' } },
        { name: 'a', tex: 'a', label: { ru: 'ребро', kz: 'қыр' } },
      ],
    },
  },
  {
    id: 'box', branch: 'geometry', section: 'stereometry', grade: 5, level: 'easy',
    title: { ru: 'Объём прямоугольного параллелепипеда', kz: 'Тікбұрышты параллелепипедтің көлемі' },
    tex: r`V = abc`,
    explain: {
      ru: 'Объём — произведение длины, ширины и высоты.',
      kz: 'Көлем — ұзындығы, ені және биіктігінің көбейтіндісі.',
    },
    example: {
      task: { ru: 'Размеры коробки 2, 3 и 4 дм. Найди объём.', kz: 'Қораптың өлшемдері 2, 3 және 4 дм. Көлемін тап.' },
      steps: [r`V = 2 \cdot 3 \cdot 4`],
      answer: r`V = 24\ \text{дм}^3`,
    },
    calc: {
      eq: 'V = a*b*c', positive: true,
      vars: [
        { name: 'V', tex: 'V', label: { ru: 'объём', kz: 'көлем' } },
        { name: 'a', tex: 'a', label: { ru: 'длина', kz: 'ұзындық' } },
        { name: 'b', tex: 'b', label: { ru: 'ширина', kz: 'ен' } },
        { name: 'c', tex: 'c', label: { ru: 'высота', kz: 'биіктік' } },
      ],
    },
  },
  {
    id: 'prism', branch: 'geometry', section: 'stereometry', grade: 11, level: 'easy',
    title: { ru: 'Объём призмы', kz: 'Призманың көлемі' },
    tex: r`V = S\,h`,
    explain: {
      ru: 'Площадь основания S, умноженная на высоту h.',
      kz: 'Табанының ауданы S биіктік h-қа көбейтіледі.',
    },
    example: {
      task: { ru: 'S = 12, h = 5. Найди V.', kz: 'S = 12, h = 5. V-ны тап.' },
      steps: [r`V = 12 \cdot 5`],
      answer: r`V = 60`,
    },
    calc: {
      eq: 'V = S*h', positive: true,
      vars: [
        { name: 'V', tex: 'V', label: { ru: 'объём', kz: 'көлем' } },
        { name: 'S', tex: 'S', label: { ru: 'площадь основания', kz: 'табан ауданы' } },
        { name: 'h', tex: 'h', label: { ru: 'высота', kz: 'биіктік' } },
      ],
    },
  },
  {
    id: 'pyramid', branch: 'geometry', section: 'stereometry', grade: 11, level: 'medium',
    title: { ru: 'Объём пирамиды', kz: 'Пирамиданың көлемі' },
    tex: r`V = \dfrac{1}{3}\,S\,h`,
    explain: {
      ru: 'Треть произведения площади основания на высоту.',
      kz: 'Табан ауданы мен биіктігі көбейтіндісінің үштен бірі.',
    },
    example: {
      task: { ru: 'S = 9, h = 10. Найди V.', kz: 'S = 9, h = 10. V-ны тап.' },
      steps: [r`V = \dfrac{1}{3}\cdot 9 \cdot 10`],
      answer: r`V = 30`,
    },
    calc: {
      eq: 'V = S*h/3', positive: true,
      vars: [
        { name: 'V', tex: 'V', label: { ru: 'объём', kz: 'көлем' } },
        { name: 'S', tex: 'S', label: { ru: 'площадь основания', kz: 'табан ауданы' } },
        { name: 'h', tex: 'h', label: { ru: 'высота', kz: 'биіктік' } },
      ],
    },
  },
  {
    id: 'cone', branch: 'geometry', section: 'stereometry', grade: 11, level: 'medium',
    title: { ru: 'Объём конуса', kz: 'Конустың көлемі' },
    tex: r`V = \dfrac{1}{3}\pi r^2 h`,
    explain: {
      ru: 'Конус — как пирамида с круглым основанием, поэтому тоже одна треть.',
      kz: 'Конус — табаны дөңгелек пирамида сияқты, сондықтан бұл да үштен бір.',
    },
    example: {
      task: { ru: 'r = 3, h = 4. Найди V.', kz: 'r = 3, h = 4. V-ны тап.' },
      steps: [r`V = \dfrac{1}{3}\pi \cdot 9 \cdot 4 = 12\pi`],
      answer: r`V = 12\pi \approx 37{,}7`,
    },
    calc: {
      eq: 'V = pi*r^2*h/3', positive: true,
      vars: [
        { name: 'V', tex: 'V', label: { ru: 'объём', kz: 'көлем' } },
        { name: 'r', tex: 'r', label: { ru: 'радиус', kz: 'радиус' } },
        { name: 'h', tex: 'h', label: { ru: 'высота', kz: 'биіктік' } },
      ],
    },
  },
  {
    id: 'cylinder-surface', branch: 'geometry', section: 'stereometry', grade: 11, level: 'medium',
    title: { ru: 'Площадь поверхности цилиндра', kz: 'Цилиндр бетінің ауданы' },
    tex: r`S = 2\pi r\,(r + h)`,
    explain: {
      ru: 'Полная поверхность: два круга-основания плюс боковая поверхность.',
      kz: 'Толық беті: екі дөңгелек табан және бүйір беті.',
    },
    example: {
      task: { ru: 'r = 2, h = 5. Найди S.', kz: 'r = 2, h = 5. S-ті тап.' },
      steps: [r`S = 2\pi \cdot 2 \cdot (2 + 5) = 28\pi`],
      answer: r`S = 28\pi \approx 88`,
    },
    calc: {
      eq: 'S = 2*pi*r*(r + h)', positive: true,
      vars: [
        { name: 'S', tex: 'S', label: { ru: 'площадь', kz: 'аудан' } },
        { name: 'r', tex: 'r', label: { ru: 'радиус', kz: 'радиус' } },
        { name: 'h', tex: 'h', label: { ru: 'высота', kz: 'биіктік' } },
      ],
    },
  },
  {
    id: 'sphere-surface', branch: 'geometry', section: 'stereometry', grade: 11, level: 'medium',
    title: { ru: 'Площадь сферы', kz: 'Сфераның ауданы' },
    tex: r`S = 4\pi R^2`,
    explain: {
      ru: 'Площадь сферы равна четырём площадям её большого круга.',
      kz: 'Сфераның ауданы оның үлкен дөңгелегінің төрт ауданына тең.',
    },
    example: {
      task: { ru: 'R = 5. Найди S.', kz: 'R = 5. S-ті тап.' },
      steps: [r`S = 4\pi \cdot 25 = 100\pi`],
      answer: r`S = 100\pi \approx 314{,}2`,
    },
    calc: {
      eq: 'S = 4*pi*R^2', positive: true,
      vars: [
        { name: 'S', tex: 'S', label: { ru: 'площадь', kz: 'аудан' } },
        { name: 'R', tex: 'R', label: { ru: 'радиус', kz: 'радиус' } },
      ],
    },
  },
]
