/** Arithmetic and geometric progressions (types of the trainer, ch. V). */
import { frac, l, pick, q, ri, value, type TGen } from './kit'

const apTerm = (a1: number, d: number, n: number) => a1 + (n - 1) * d
const apSum = (a1: number, d: number, n: number) => { let s = 0; for (let i = 1; i <= n; i++) s += apTerm(a1, d, i); return s }
const nz = (r: () => number, a: number, b: number) => { let x = 0; while (!x) x = ri(r, a, b); return x }

export const progressionGens: TGen[] = [
  {
    id: 'ap-term', make: (r) => {
      const a1 = ri(r, -20, 20), d = nz(r, -7, 7), n = ri(r, 8, 40), an = apTerm(a1, d, n)
      return q(r, 'ap-term', l(`Арифметикалық прогрессияда $a_1 = ${a1}$, $d = ${d}$. $a_{${n}}$ мүшесін табыңыз.`, `В арифметической прогрессии $a_1 = ${a1}$, $d = ${d}$. Найдите $a_{${n}}$.`),
        String(an), [a1 + n * d, a1 + (n - 2) * d, an + 1, a1 * n].map(String),
        l(`$a_n = a_1 + (n - 1)d = ${a1} + ${n - 1}\\cdot${d < 0 ? `(${d})` : d} = ${an}$.`), [value(apSum(a1, d, n) - apSum(a1, d, n - 1), an)])
    },
  },
  {
    id: 'ap-two-terms', make: (r) => {
      const a1 = ri(r, -15, 15), d = nz(r, -6, 6), m = ri(r, 2, 6), k = ri(r, m + 2, 12), n = ri(r, 13, 30)
      const am = apTerm(a1, d, m), ak = apTerm(a1, d, k), an = apTerm(a1, d, n)
      return q(r, 'ap-two-terms', l(`Арифметикалық прогрессияда $a_{${m}} = ${am}$, $a_{${k}} = ${ak}$. $a_{${n}}$ мүшесін табыңыз.`, `В арифметической прогрессии $a_{${m}} = ${am}$, $a_{${k}} = ${ak}$. Найдите $a_{${n}}$.`),
        String(an), [an + d, an - d, ak + (n - k) * (ak - am), d * n].filter((x) => x !== an).map(String).concat([String(-an || 1)]),
        l(`$d = \\frac{${ak} - ${am < 0 ? `(${am})` : am}}{${k} - ${m}} = ${d}$; $a_{${n}} = a_{${k}} + ${n - k}d = ${an}$.`), [value(ak + (n - k) * ((ak - am) / (k - m)), an)])
    },
  },
  {
    id: 'ap-sum', make: (r) => {
      const a1 = ri(r, -10, 15), d = nz(r, -4, 6), n = ri(r, 6, 25), S = apSum(a1, d, n)
      return q(r, 'ap-sum', l(`Арифметикалық прогрессияда $a_1 = ${a1}$, $d = ${d}$. Алғашқы ${n} мүшесінің қосындысын табыңыз.`, `В арифметической прогрессии $a_1 = ${a1}$, $d = ${d}$. Найдите сумму первых ${n} членов.`),
        String(S), [apSum(a1, d, n - 1), apSum(a1, d, n + 1), (a1 + apTerm(a1, d, n)) * n, S + d].filter((x) => x !== S).map(String),
        l(`$S_n = \\frac{2a_1 + (n - 1)d}{2}\\cdot n = \\frac{${2 * a1} + ${n - 1}\\cdot${d < 0 ? `(${d})` : d}}{2}\\cdot${n} = ${S}$.`), [value(((2 * a1 + (n - 1) * d) / 2) * n, S)])
    },
  },
  {
    id: 'ap-which-n', make: (r) => {
      const a1 = ri(r, -20, 30), d = nz(r, -6, 6), n = ri(r, 7, 45), an = apTerm(a1, d, n)
      let found = 0
      for (let i = 1; i < 200; i++) if (apTerm(a1, d, i) === an) { found = i; break }
      return q(r, 'ap-which-n', l(`Арифметикалық прогрессияда $a_1 = ${a1}$, $d = ${d}$. ${an} саны прогрессияның нешінші мүшесі?`, `В арифметической прогрессии $a_1 = ${a1}$, $d = ${d}$. Каким по счёту членом прогрессии является число ${an}?`),
        String(n), [n - 1, n + 1, Math.abs(Math.round((an - a1) / d)) || n + 2, n + 2].filter((x) => x !== n && x > 0).map(String).concat([String(2 * n)]),
        l(`$${a1} + (n - 1)\\cdot${d < 0 ? `(${d})` : d} = ${an}$ → $n - 1 = ${n - 1}$ → $n = ${n}$.`), [value(found, n)])
    },
  },
  {
    id: 'gp-term', make: (r) => {
      const b1 = nz(r, -6, 8), qq = pick(r, [2, 3, -2, -3, 2]), n = ri(r, 3, qq === 3 || qq === -3 ? 6 : 8)
      const bn = b1 * qq ** (n - 1)
      return q(r, 'gp-term', l(`Геометриялық прогрессияда $b_1 = ${b1}$, $q = ${qq}$. $b_{${n}}$ мүшесін табыңыз.`, `В геометрической прогрессии $b_1 = ${b1}$, $q = ${qq}$. Найдите $b_{${n}}$.`),
        String(bn), [b1 * qq ** n, b1 * qq ** (n - 2), -bn, b1 + (n - 1) * qq].filter((x) => x !== bn).map(String),
        l(`$b_n = b_1 q^{n-1} = ${b1}\\cdot${qq < 0 ? `(${qq})` : qq}^{${n - 1}} = ${bn}$.`), [value(Array.from({ length: n - 1 }).reduce<number>((s) => s * qq, b1), bn)])
    },
  },
  {
    id: 'gp-sum', make: (r) => {
      const b1 = ri(r, 1, 6), qq = pick(r, [2, 3, -2]), n = ri(r, 3, qq === 3 ? 5 : 7)
      const S = (b1 * (qq ** n - 1)) / (qq - 1)
      let brute = 0, t = b1; for (let i = 0; i < n; i++) { brute += t; t *= qq }
      return q(r, 'gp-sum', l(`Геометриялық прогрессияда $b_1 = ${b1}$, $q = ${qq}$. Алғашқы ${n} мүшесінің қосындысын табыңыз.`, `В геометрической прогрессии $b_1 = ${b1}$, $q = ${qq}$. Найдите сумму первых ${n} членов.`),
        String(S), [(b1 * (qq ** (n + 1) - 1)) / (qq - 1), (b1 * (qq ** (n - 1) - 1)) / (qq - 1), b1 * qq ** (n - 1), S + b1].filter((x) => x !== S).map(String),
        l(`$S_n = \\frac{b_1(q^n - 1)}{q - 1} = \\frac{${b1}(${qq < 0 ? `(${qq})` : qq}^{${n}} - 1)}{${qq - 1}} = ${S}$.`), [value(brute, S)])
    },
  },
  {
    id: 'gp-infinite', make: (r) => {
      const [qn, qd] = pick(r, [[1, 2], [-1, 2], [1, 3], [-1, 3], [2, 3], [1, 4], [3, 4], [-1, 4]] as const)
      const k = ri(r, 1, 6), b1 = k * qd
      const Sn = b1 * qd, Sd = qd - qn
      let brute = 0, t = b1; for (let i = 0; i < 400; i++) { brute += t; t *= qn / qd }
      return q(r, 'gp-infinite', l(`Шексіз кемімелі геометриялық прогрессияда $b_1 = ${b1}$, $q = ${frac(qn, qd)}$. Оның қосындысын табыңыз.`, `Найдите сумму бесконечно убывающей геометрической прогрессии, если $b_1 = ${b1}$, $q = ${frac(qn, qd)}$.`),
        frac(Sn, Sd), [frac(b1 * qd, qd + qn), frac(b1 * qn, qd - qn), String(b1 * 2), frac(Sn + qd, Sd)],
        l(`$S = \\frac{b_1}{1 - q} = \\frac{${b1}}{1 - ${frac(qn, qd)}} = ${frac(Sn, Sd)}$.`), [value(brute, Sn / Sd)])
    },
  },
  {
    id: 'gp-two-terms', make: (r) => {
      const b1 = ri(r, 1, 5), qq = pick(r, [2, 3]), m = ri(r, 1, 3), k = m + 2, n = k + ri(r, 1, 2)
      const bm = b1 * qq ** (m - 1), bk = b1 * qq ** (k - 1), bn = b1 * qq ** (n - 1)
      return q(r, 'gp-two-terms', l(`Оң мүшелі геометриялық прогрессияда $b_{${m}} = ${bm}$, $b_{${k}} = ${bk}$. $b_{${n}}$ мүшесін табыңыз.`, `В геометрической прогрессии с положительными членами $b_{${m}} = ${bm}$, $b_{${k}} = ${bk}$. Найдите $b_{${n}}$.`),
        String(bn), [bn * qq, bn / qq, bk + (bk - bm) * (n - k), bk * (bk / bm)].filter((x) => x !== bn && Number.isInteger(x)).map(String).concat([String(bn + qq)]),
        l(`$q^2 = \\frac{${bk}}{${bm}} = ${qq * qq}$ → $q = ${qq}$; $b_{${n}} = ${bk}\\cdot${qq}^{${n - k}} = ${bn}$.`), [value(bk * Math.sqrt(bk / bm) ** (n - k), bn)])
    },
  },
  {
    id: 'middle-term', make: (r) => {
      if (r() < 0.5) {
        const a = ri(r, -20, 20), d = nz(r, -9, 9), b = a + 2 * d, x = a + d
        return q(r, 'middle-ap', l(`$${a}$; $x$; $${b}$ сандары арифметикалық прогрессия құрайды. $x$-ті табыңыз.`, `Числа $${a}$; $x$; $${b}$ образуют арифметическую прогрессию. Найдите $x$.`),
          String(x), [b - a, x + 1, a + b, -x].filter((v) => v !== x).map(String).concat([String(2 * x + 1)]),
          l(`$x = \\frac{${a} + ${b < 0 ? `(${b})` : b}}{2} = ${x}$.`), [value((a + b) / 2, x)])
      }
      const u = ri(r, 1, 6), v = ri(r, 1, 6), k = ri(r, 1, 3), a = u * u * k, b = v * v * k, x = u * v * k
      if (u === v) throw new Error('same')
      return q(r, 'middle-gp', l(`$${a}$; $x$; $${b}$ сандары оң мүшелі геометриялық прогрессия құрайды. $x$-ті табыңыз.`, `Числа $${a}$; $x$; $${b}$ образуют геометрическую прогрессию с положительными членами. Найдите $x$.`),
        String(x), [(a + b) / 2, a * b, x + 1, Math.abs(b - a)].filter((v2) => v2 !== x && Number.isInteger(v2)).map(String).concat([String(2 * x)]),
        l(`$x = \\sqrt{${a}\\cdot${b}} = \\sqrt{${a * b}} = ${x}$.`), [value(Math.sqrt(a * b), x)])
    },
  },
  {
    id: 'multiples-sum', make: (r) => {
      const k = pick(r, [3, 4, 5, 6, 7, 9, 11, 12, 13]), two = r() < 0.6
      const lo = two ? 10 : 1, hi = two ? 99 : 50
      const xs: number[] = []; for (let x = lo; x <= hi; x++) if (x % k === 0) xs.push(x)
      const S = xs.reduce((s, x) => s + x, 0)
      const first = xs[0], last = xs[xs.length - 1], n = xs.length
      return q(r, 'multiples-sum', l(two ? `${k}-ке бөлінетін барлық екі таңбалы сандардың қосындысын табыңыз.` : `${k}-ке бөлінетін ${hi}-ден аспайтын барлық натурал сандардың қосындысын табыңыз.`,
        two ? `Найдите сумму всех двузначных чисел, кратных ${k}.` : `Найдите сумму всех натуральных чисел, не превосходящих ${hi} и кратных ${k}.`),
        String(S), [S - first, S + last + k, n * last, S - last].filter((x) => x !== S).map(String),
        l(`$a_1 = ${first}$, $a_n = ${last}$, $n = ${n}$; $S = \\frac{${first} + ${last}}{2}\\cdot${n} = ${S}$.`), [value(((first + last) / 2) * n, S)])
    },
  },
]
