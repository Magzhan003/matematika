/**
 * Formula catalogue structure: section → topic (subtopic) → formulas.
 * Topic order here is the display order inside each section.
 */
export type L = { ru: string; kz: string }

export type Section =
  | 'arithmetic' | 'algebra' | 'functions' | 'progressions' | 'trigonometry' | 'logarithms'
  | 'calculus' | 'combinatorics' | 'planimetry' | 'coordinates' | 'stereometry'

export type Topic = { id: string; section: Section; title: L }

export const sections: Section[] = [
  'arithmetic', 'algebra', 'functions', 'progressions', 'trigonometry', 'logarithms',
  'calculus', 'combinatorics', 'planimetry', 'coordinates', 'stereometry',
]

export const geometrySections: Section[] = ['planimetry', 'coordinates', 'stereometry']

const T = (id: string, section: Section, ru: string, kz: string): Topic => ({ id, section, title: { ru, kz } })

export const topics: Topic[] = [
  T('fractions', 'arithmetic', 'Дроби', 'Бөлшектер'),
  T('percents', 'arithmetic', 'Проценты', 'Пайыздар'),
  T('proportions', 'arithmetic', 'Пропорции и масштаб', 'Пропорция және масштаб'),
  T('divisibility', 'arithmetic', 'Делимость', 'Бөлінгіштік'),
  T('word-problems', 'arithmetic', 'Текстовые задачи', 'Мәтінді есептер'),
  T('literacy', 'arithmetic', 'Математическая грамотность', 'Математикалық сауаттылық'),

  T('powers', 'algebra', 'Степени', 'Дәрежелер'),
  T('roots', 'algebra', 'Корни', 'Түбірлер'),
  T('short-mult', 'algebra', 'Формулы сокращённого умножения', 'Қысқаша көбейту формулалары'),
  T('linear-eq', 'algebra', 'Линейные уравнения и системы', 'Сызықтық теңдеулер және жүйелер'),
  T('quadratic', 'algebra', 'Квадратные уравнения', 'Квадрат теңдеулер'),
  T('inequalities', 'algebra', 'Неравенства и модуль', 'Теңсіздіктер және модуль'),
  T('complex', 'algebra', 'Комплексные числа', 'Комплекс сандар'),

  T('linear-fn', 'functions', 'Линейная функция', 'Сызықтық функция'),
  T('quadratic-fn', 'functions', 'Квадратичная функция', 'Квадраттық функция'),
  T('other-fn', 'functions', 'Другие функции и графики', 'Басқа функциялар және графиктер'),

  T('arith-prog', 'progressions', 'Арифметическая прогрессия', 'Арифметикалық прогрессия'),
  T('geom-prog', 'progressions', 'Геометрическая прогрессия', 'Геометриялық прогрессия'),

  T('trig-basics', 'trigonometry', 'Определения и значения', 'Анықтамалар және мәндер'),
  T('trig-identities', 'trigonometry', 'Основные тождества', 'Негізгі тепе-теңдіктер'),
  T('trig-reduction', 'trigonometry', 'Формулы приведения', 'Келтіру формулалары'),
  T('trig-addition', 'trigonometry', 'Формулы сложения', 'Қосу формулалары'),
  T('trig-double', 'trigonometry', 'Двойной и половинный угол', 'Екі еселенген және жарты бұрыш'),
  T('trig-sum-product', 'trigonometry', 'Сумма и произведение функций', 'Функциялардың қосындысы мен көбейтіндісі'),
  T('inverse-trig', 'trigonometry', 'Обратные тригонометрические функции', 'Кері тригонометриялық функциялар'),
  T('trig-equations', 'trigonometry', 'Тригонометрические уравнения', 'Тригонометриялық теңдеулер'),
  T('trig-inequalities', 'trigonometry', 'Тригонометрические неравенства', 'Тригонометриялық теңсіздіктер'),

  T('exp-fn', 'logarithms', 'Показательная функция и уравнения', 'Көрсеткіштік функция және теңдеулер'),
  T('log-props', 'logarithms', 'Свойства логарифмов', 'Логарифмдердің қасиеттері'),
  T('log-eq', 'logarithms', 'Логарифмические уравнения и неравенства', 'Логарифмдік теңдеулер және теңсіздіктер'),

  T('derivative-table', 'calculus', 'Таблица производных', 'Туындылар кестесі'),
  T('derivative-rules', 'calculus', 'Правила дифференцирования', 'Дифференциалдау ережелері'),
  T('derivative-apply', 'calculus', 'Применение производной', 'Туындыны қолдану'),
  T('antiderivatives', 'calculus', 'Первообразные', 'Алғашқы функциялар'),
  T('integrals', 'calculus', 'Интеграл и площадь', 'Интеграл және аудан'),
  T('integrals-table', 'calculus', 'Таблица интегралов (справочник)', 'Интегралдар кестесі (анықтамалық)'),

  T('combinatorics', 'combinatorics', 'Комбинаторика', 'Комбинаторика'),
  T('probability', 'combinatorics', 'Вероятность', 'Ықтималдық'),
  T('statistics', 'combinatorics', 'Статистика', 'Статистика'),

  T('angles-lines', 'planimetry', 'Углы и параллельные прямые', 'Бұрыштар және параллель түзулер'),
  T('triangles', 'planimetry', 'Треугольники', 'Үшбұрыштар'),
  T('triangle-area', 'planimetry', 'Площадь треугольника', 'Үшбұрыштың ауданы'),
  T('right-triangle', 'planimetry', 'Прямоугольный треугольник', 'Тікбұрышты үшбұрыш'),
  T('quadrilaterals', 'planimetry', 'Четырёхугольники', 'Төртбұрыштар'),
  T('polygons', 'planimetry', 'Многоугольники', 'Көпбұрыштар'),
  T('circle', 'planimetry', 'Окружность и круг', 'Шеңбер және дөңгелек'),

  T('coord-plane', 'coordinates', 'Метод координат', 'Координаталар әдісі'),
  T('vectors', 'coordinates', 'Векторы', 'Векторлар'),

  T('prisms', 'stereometry', 'Призма и параллелепипед', 'Призма және параллелепипед'),
  T('pyramids', 'stereometry', 'Пирамида', 'Пирамида'),
  T('bodies-rotation', 'stereometry', 'Тела вращения', 'Айналу денелері'),
]

export const topicById = (id: string) => topics.find((t) => t.id === id)

/** Topics for the formulas written before the catalogue had subtopics. */
export const formulaTopic: Record<string, string> = {
  percent: 'percents', mean: 'word-problems', motion: 'word-problems', 'fractions-add': 'fractions', proportion: 'proportions',
  'power-product': 'powers', 'power-quotient': 'powers', 'power-power': 'powers', 'negative-power': 'powers',
  'square-sum': 'short-mult', 'square-difference': 'short-mult', 'difference-squares': 'short-mult', 'cube-sum': 'short-mult',
  'sqrt-product': 'roots', linear: 'linear-eq', discriminant: 'quadratic', vieta: 'quadratic',
  'log-definition': 'log-props', 'log-product': 'log-props', 'log-quotient-power': 'log-props', 'log-base-change': 'log-props',
  'linear-function': 'linear-fn', 'parabola-vertex': 'quadratic-fn',
  'arithmetic-progression': 'arith-prog', 'arithmetic-sum': 'arith-prog', 'geometric-progression': 'geom-prog', 'geometric-sum': 'geom-prog',
  'trig-identity': 'trig-identities', 'tan-definition': 'trig-basics', 'double-angle': 'trig-double', 'sum-angles': 'trig-addition',
  'derivative-power': 'derivative-table', 'derivative-rules': 'derivative-rules', 'chain-rule': 'derivative-rules',
  'integral-power': 'antiderivatives', 'newton-leibniz': 'integrals',
  probability: 'probability', permutations: 'combinatorics', combinations: 'combinatorics',
  rectangle: 'quadrilaterals', circle: 'circle', 'triangle-area': 'triangle-area', pythagoras: 'right-triangle',
  trapezoid: 'quadrilaterals', heron: 'triangle-area', 'cosine-law': 'triangles', 'triangle-angles': 'triangles',
  'polygon-angles': 'polygons', 'parallelogram-area': 'quadrilaterals', 'rhombus-area': 'quadrilaterals',
  'inscribed-angle': 'circle', 'similarity-area': 'triangles', 'triangle-area-sine': 'triangle-area', 'sine-law': 'triangles', sector: 'circle',
  distance: 'coord-plane', midpoint: 'coord-plane', 'circle-equation': 'coord-plane', 'vector-length': 'vectors', 'dot-product': 'vectors',
  cube: 'prisms', box: 'prisms', prism: 'prisms', pyramid: 'pyramids',
  cone: 'bodies-rotation', cylinder: 'bodies-rotation', sphere: 'bodies-rotation', 'cylinder-surface': 'bodies-rotation', 'sphere-surface': 'bodies-rotation',
}
