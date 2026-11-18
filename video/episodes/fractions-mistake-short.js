// Short (vertical 1080×1920): the most common mistake when adding fractions.
window.EPISODE = {
  id: 'fractions-mistake-short',
  fmt: 'tall',
  title: { kz: 'Бөлшектерді қосу', ru: 'Сложение дробей' },
  tag: { kz: 'жиі қате', ru: 'частая ошибка' },
  segments: [
    {
      say: {
        kz: ['Бөлшектерді қосқанда көп оқушы осы қатені жібереді.', 'Екіден бір қосу үштен бір — бестен екі емес!'],
        ru: ['Эту ошибку при сложении дробей делают очень многие.', 'Одна вторая плюс одна третья — это не две пятых!'],
      },
      build(S, E) {
        E.text({ kz: '⚠ Жиі қате', ru: '⚠ Частая ошибка' }, { x: 540, y: 300, size: 76, weight: 800, color: E.C.red }).show(S.at(0))
        const bad = E.tex('\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{2}{5}', { x: 540, y: 700, size: 110, color: E.C.red }).write(S.at(0, 0.3), 1.2)
        E.cross(bad, S.at(1, 0.4))
      },
    },
    {
      say: {
        kz: ['Бестен екі жартыдан да аз, ал біз жартыға тағы қостық.'],
        ru: ['Две пятых меньше половины, а мы к половине ещё добавили.'],
      },
      build(S, E) {
        E.text({ kz: 'Неге қате?', ru: 'Почему ошибка?' }, { x: 540, y: 300, size: 70, weight: 800 }).show(S.at(0))
        E.pie({ x: 300, y: 720, r: 190, parts: 2 }).show(S.at(0)).fill(S.at(0, 0.05), 0, 1 / 2, E.C.blue)
        E.pie({ x: 780, y: 720, r: 190, parts: 5 }).show(S.at(0, 0.15)).fill(S.at(0, 0.2), 0, 2 / 5, E.C.muted).half(S.at(0, 0.45))
        E.tex('\\dfrac{2}{5} < \\dfrac{1}{2}', { x: 540, y: 1080, size: 100, color: E.C.red }).write(S.at(0, 0.3), 1)
      },
    },
    {
      say: {
        kz: ['Дұрысы: ортақ бөлім — алты. Алтыдан үш қосу алтыдан екі — алтыдан бес.', 'Есіңде сақта: бөлімдерді қоспаймыз! Толық сабақ — арнада.'],
        ru: ['Правильно так: общий знаменатель — шесть. Три шестых плюс две шестых — пять шестых.', 'Запомни: знаменатели не складывают! Полный урок — на канале.'],
      },
      build(S, E) {
        E.text({ kz: '✓ Дұрысы', ru: '✓ Правильно' }, { x: 540, y: 300, size: 76, weight: 800, color: E.C.green }).show(S.at(0))
        const ok = E.tex('\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{3}{6} + \\dfrac{2}{6} = \\dfrac{5}{6}', { x: 540, y: 560, size: 74, color: E.C.green }).write(S.at(0, 0.2), 1.8)
        E.ring(ok, S.at(0, 0.85), 0.2)
        E.pie({ x: 540, y: 930, r: 190, parts: 6 }).show(S.at(0, 0.4)).fill(S.at(0, 0.5), 0, 3 / 6, E.C.blue).fill(S.at(0, 0.7), 3 / 6, 5 / 6, E.C.orange)
        E.card({ x: 540, y: 1300, w: 900, h: 200 }).show(S.at(1))
        E.text({ kz: 'Бөлімдерді ҚОСПАЙМЫЗ!', ru: 'Знаменатели НЕ складывают!' }, { x: 540, y: 1270, size: 58, weight: 800, color: E.C.red }).show(S.at(1, 0.1))
        E.text({ kz: '▶ Толық сабақ — арнада', ru: '▶ Полный урок — на канале' }, { x: 540, y: 1345, size: 40, weight: 700, color: E.C.blue }).show(S.at(1, 0.5))
      },
    },
  ],
}
