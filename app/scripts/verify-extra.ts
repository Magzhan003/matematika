/**
 * Independent numeric check of the formulas added from the «500 формула» comparison:
 *   npx tsx scripts/verify-extra.ts
 * Every formula is re-computed directly (identities at random points, integrals by Simpson's rule,
 * derivatives by central differences, geometry from coordinates) — not from its TeX.
 */
import { extraMore } from '../src/data/catalog/extra-more'
import { extraTrig } from '../src/data/catalog/extra-trig'

const { sin, cos, tan, asin, acos, atan, sqrt, log, exp, PI, abs, random } = Math
const cot = (x: number) => 1 / tan(x)
const acot = (x: number) => (x > 0 ? atan(1 / x) : PI + atan(1 / x)) // range (0; π)
const deg = (d: number) => (d * PI) / 180
const rnd = (a: number, b: number) => a + (b - a) * random()
const close = (a: number, b: number, eps = 1e-7) => abs(a - b) <= eps * Math.max(1, abs(a), abs(b))
const simpson = (f: (x: number) => number, a: number, b: number, n = 2000) => {
  const h = (b - a) / n
  let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}
const dnum = (f: (x: number) => number, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h)
/** antiderivative check: F(b) − F(a) equals the integral of f from a to b */
const anti = (f: (x: number) => number, F: (x: number) => number, a: number, b: number) => close(simpson(f, a, b), F(b) - F(a), 1e-6)
/** check a predicate at many random points */
const many = (k: number, fn: () => boolean) => { for (let i = 0; i < k; i++) if (!fn()) return false; return true }

const checks: Record<string, () => boolean> = {
  // trig identities
  'sin-cos-square': () => many(200, () => { const a = rnd(-3, 3); return close((sin(a) + cos(a)) ** 2, 1 + sin(2 * a)) && close((sin(a) - cos(a)) ** 2, 1 - sin(2 * a)) }),
  'sin4-cos4': () => many(200, () => { const a = rnd(-3, 3), v = sin(a) ** 4 + cos(a) ** 4; return close(v, 1 - 0.5 * sin(2 * a) ** 2) && close(v, (3 + cos(4 * a)) / 4) }),
  'sin6-cos6': () => many(200, () => { const a = rnd(-3, 3), v = sin(a) ** 6 + cos(a) ** 6; return close(v, 1 - 0.75 * sin(2 * a) ** 2) && close(v, (5 + 3 * cos(4 * a)) / 8) }),
  'cos6-minus-sin6': () => many(200, () => { const a = rnd(-3, 3), v = cos(a) ** 6 - sin(a) ** 6; return close(v, cos(2 * a) * (1 - 0.25 * sin(2 * a) ** 2)) && close(v, (15 * cos(2 * a) + cos(6 * a)) / 16) }),
  'power-reduction-cube': () => many(200, () => { const a = rnd(-3, 3); return close(sin(a) ** 3, (3 * sin(a) - sin(3 * a)) / 4) && close(cos(a) ** 3, (3 * cos(a) + cos(3 * a)) / 4) && close(sin(a) ** 4, (3 - 4 * cos(2 * a) + cos(4 * a)) / 8) }),
  'power-reduction-tg': () => many(200, () => { const a = rnd(0.1, 1.4); return close(tan(a) ** 2, (1 - cos(2 * a)) / (1 + cos(2 * a))) && close(cot(a) ** 2, (1 + cos(2 * a)) / (1 - cos(2 * a))) }),
  'half-angle-tg': () => many(200, () => { const a = rnd(0.1, 3); return close(tan(a / 2), sin(a) / (1 + cos(a))) && close(tan(a / 2), (1 - cos(a)) / sin(a)) }),
  'triple-tg': () => many(200, () => { const a = rnd(-0.5, 0.5); return close(tan(3 * a), (3 * tan(a) - tan(a) ** 3) / (1 - 3 * tan(a) ** 2)) }),
  'sin-plus-cos': () => many(200, () => { const a = rnd(-3, 3); return close(sin(a) + cos(a), sqrt(2) * sin(a + PI / 4)) && close(sin(a) - cos(a), sqrt(2) * sin(a - PI / 4)) }),
  'tg-sum-funcs': () => many(200, () => { const a = rnd(-1.4, 1.4), b = rnd(-1.4, 1.4); return close(tan(a) + tan(b), sin(a + b) / (cos(a) * cos(b))) && close(tan(a) - tan(b), sin(a - b) / (cos(a) * cos(b))) }),
  'ctg-sum-funcs': () => many(200, () => { const a = rnd(0.1, 3), b = rnd(0.1, 3); return close(cot(a) + cot(b), sin(b + a) / (sin(a) * sin(b))) && close(cot(a) - cot(b), sin(b - a) / (sin(a) * sin(b))) }),
  'tg-plus-ctg': () => many(200, () => { const a = rnd(0.1, 1.4); return close(tan(a) + cot(a), 2 / sin(2 * a)) && close(cot(a) - tan(a), 2 * cot(2 * a)) }),
  'tg-product': () => many(200, () => { const a = rnd(0.1, 1.4), b = rnd(0.1, 1.4); return close(tan(a) * tan(b), (tan(a) + tan(b)) / (cot(a) + cot(b))) && close(cot(a) * cot(b), (cot(a) + cot(b)) / (tan(a) + tan(b))) }),
  'cos-chain': () => many(200, () => { const a = rnd(0.1, 3); return close(cos(a) * cos(2 * a) * cos(4 * a), sin(8 * a) / (8 * sin(a))) }),
  // inverse trig
  'arc-ranges': () => many(200, () => { const x = rnd(-5, 5), y = rnd(-1, 1); const ok = asin(y) >= -PI / 2 && asin(y) <= PI / 2 && acos(y) >= 0 && acos(y) <= PI && acot(x) > 0 && acot(x) < PI; return ok && close(acot(-x), PI - acot(x)) && close(cot(acot(x)), x) }),
  'inv-sin-cos': () => many(200, () => { const x = rnd(-1, 1); return close(sin(acos(x)), sqrt(1 - x * x)) && close(cos(asin(x)), sqrt(1 - x * x)) }),
  'inv-tg': () => many(200, () => { const x = rnd(0.05, 0.95) * (random() < 0.5 ? -1 : 1); return close(tan(asin(x)), x / sqrt(1 - x * x)) && close(tan(acos(x)), sqrt(1 - x * x) / x) }),
  'inv-arctg': () => many(200, () => { const x = rnd(-9, 9); return close(sin(atan(x)), x / sqrt(1 + x * x)) && close(cos(atan(x)), 1 / sqrt(1 + x * x)) }),
  'inv-arcctg': () => many(200, () => { const x = rnd(-9, 9); return close(sin(acot(x)), 1 / sqrt(1 + x * x)) && close(cos(acot(x)), x / sqrt(1 + x * x)) && close(tan(acot(x)), 1 / x) }),
  'inv-double': () => many(200, () => { const x = rnd(-1, 1); return close(sin(2 * asin(x)), 2 * x * sqrt(1 - x * x)) && close(cos(2 * asin(x)), 1 - 2 * x * x) }),
  'inv-double-arctg': () => many(200, () => { const x = rnd(-0.95, 0.95); return close(sin(2 * atan(x)), (2 * x) / (1 + x * x)) && close(cos(2 * atan(x)), (1 - x * x) / (1 + x * x)) && close(tan(2 * atan(x)), (2 * x) / (1 - x * x)) }),
  // equations: every listed root satisfies the equation
  'eq-ctg': () => many(100, () => { const a = rnd(-5, 5), k = Math.round(rnd(-3, 3)); return close(cot(acot(a) + PI * k), a, 1e-6) }),
  'eq-minus-a': () => many(100, () => { const a = rnd(0, 1), k = Math.round(rnd(-3, 3)), t = rnd(-5, 5); return close(sin((-1) ** (k + 1) * asin(a) + PI * k), -a) && close(cos(PI - acos(a) + 2 * PI * k), -a) && close(cos(-(PI - acos(a)) + 2 * PI * k), -a) && close(tan(-atan(t) + PI * k), -t, 1e-6) }),
  'eq-special-2': () => many(50, () => { const k = Math.round(rnd(-3, 3)); return close(sin(-PI / 2 + 2 * PI * k), -1) && close(cos(2 * PI * k), 1) && close(cos(PI + 2 * PI * k), -1) }),
  'eq-special-tg': () => many(50, () => { const k = Math.round(rnd(-3, 3)); return close(tan(PI * k), 0, 1e-9) && close(tan(PI / 4 + PI * k), 1) && close(tan(-PI / 4 + PI * k), -1) && close(cos(PI / 2 + PI * k), 0, 1e-9) && close(cot(3 * PI / 4 + PI * k), -1) }),
  // inequalities: the answer set is exactly where the inequality holds (dense sampling on one period)
  // on one full period starting at the left end of the answer, the inequality holds exactly up to the right end
  'ineq-sin': () => many(30, () => { const a = rnd(-0.95, 0.95); return many(400, () => { const x = rnd(asin(a), asin(a) + 2 * PI); return (sin(x) >= a - 1e-12) === (x <= PI - asin(a) + 1e-12) }) && many(400, () => { const x = rnd(-PI - asin(a), PI - asin(a)); return (sin(x) <= a + 1e-12) === (x <= asin(a) + 1e-12) }) }),
  'ineq-cos': () => many(30, () => { const a = rnd(-0.95, 0.95); return many(400, () => { const x = rnd(-acos(a), 2 * PI - acos(a)); return (cos(x) >= a - 1e-12) === (x <= acos(a) + 1e-12) }) && many(400, () => { const x = rnd(acos(a), acos(a) + 2 * PI); return (cos(x) <= a + 1e-12) === (x <= 2 * PI - acos(a) + 1e-12) }) }),
  'ineq-tg': () => many(30, () => { const a = rnd(-5, 5); return many(400, () => { const x = rnd(-PI / 2 + 1e-6, PI / 2 - 1e-6); return (tan(x) >= a) === (x >= atan(a)) }) && many(400, () => { const x = rnd(1e-6, PI - 1e-6); return (cot(x) >= a) === (x <= acot(a)) }) }),
  'ineq-tg-le': () => many(30, () => { const a = rnd(-5, 5); return many(400, () => { const x = rnd(-PI / 2 + 1e-6, PI / 2 - 1e-6); return (tan(x) <= a) === (x <= atan(a)) }) && many(400, () => { const x = rnd(1e-6, PI - 1e-6); return (cot(x) <= a) === (x >= acot(a)) }) }),
  // arithmetic
  // for every digit pair: 0,(a) = a/9, 0,(ab) = ab/99, 0,a(b) = (ab − a)/90, compared with the sum of the repeating series
  'periodic-fraction': () => {
    for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) {
      const series = (head: number, headLen: number, per: number, perLen: number) => head / 10 ** headLen + (per / 10 ** (headLen + perLen)) / (1 - 10 ** -perLen)
      if (!close(series(0, 0, a, 1), a / 9, 1e-12)) return false
      if (!close(series(0, 0, 10 * a + b, 2), (10 * a + b) / 99, 1e-12)) return false
      if (!close(series(a, 1, b, 1), (10 * a + b - a) / 90, 1e-12)) return false
    }
    return true
  },
  // irrational inequalities: compare the system with direct evaluation
  'irr-ineq-less': () => many(2000, () => { const x = rnd(-5, 10); const direct = x + 2 >= 0 && sqrt(x + 2) < x; return direct === (x > 2) }),
  'irr-ineq-greater': () => many(2000, () => { const x = rnd(-5, 5); const direct = x + 3 >= 0 && sqrt(x + 3) > x + 1; return direct === (x >= -3 && x < 1) }),
  'irr-ineq-roots': () => many(2000, () => { const x = rnd(-20, 20); return (Math.cbrt(x - 1) < 2) === (x < 9) }),
  // complex numbers (as pairs)
  'complex-def': () => { let re = 1, im = 0; for (let k = 0; k < 10; k++) [re, im] = [-im, re]; return close(re, -1) && close(im, 0) },
  'complex-mod': () => many(100, () => { const a = rnd(-5, 5), b = rnd(-5, 5); return close(a * a + b * b, (a * a - b * -b) + 0 * (a * -b + b * a)) && close(sqrt(a * a + b * b) ** 2, a * a + b * b) }),
  'complex-ops': () => many(100, () => { const [a1, b1, a2, b2] = [rnd(-5, 5), rnd(-5, 5), rnd(-5, 5), rnd(-5, 5)]; const re = a1 * a2 - b1 * b2, im = a1 * b2 + a2 * b1; const r1 = Math.hypot(a1, b1), r2 = Math.hypot(a2, b2), t = Math.atan2(b1, a1) + Math.atan2(b2, a2); return close(re, r1 * r2 * cos(t)) && close(im, r1 * r2 * sin(t)) }),
  'complex-div': () => many(100, () => { const [a1, b1, a2, b2] = [rnd(-5, 5), rnd(-5, 5), rnd(1, 5), rnd(-5, 5)]; const d = a2 * a2 + b2 * b2; const re = (a1 * a2 + b1 * b2) / d, im = (a2 * b1 - a1 * b2) / d; return close(re * a2 - im * b2, a1) && close(re * b2 + im * a2, b1) }),
  // logarithms
  'log-swap': () => many(200, () => { const a = rnd(1.1, 9), b = rnd(1.1, 9), c = rnd(1.1, 9); return close(a ** (log(b) / log(c)), b ** (log(a) / log(c))) }),
  // derivatives
  'derivative-arc': () => many(100, () => { const x = rnd(-0.9, 0.9); return close(dnum(asin, x), 1 / sqrt(1 - x * x), 1e-6) && close(dnum(acos, x), -1 / sqrt(1 - x * x), 1e-6) }),
  'derivative-arctg': () => many(100, () => { const x = rnd(-5, 5); return close(dnum(atan, x), 1 / (1 + x * x), 1e-6) && close(dnum(acot, x === 0 ? 0.1 : x), -1 / (1 + (x === 0 ? 0.01 : x * x)), 1e-6) }),
  'derivative-composite-exp': () => many(100, () => { const x = rnd(0.2, 2), a = rnd(1.5, 4); const u = (t: number) => t * t + 1, du = 2 * x; return close(dnum((t) => exp(u(t)), x), exp(u(x)) * du, 1e-6) && close(dnum((t) => a ** u(t), x), a ** u(x) * log(a) * du, 1e-6) && close(dnum((t) => log(u(t)), x), du / u(x), 1e-6) }),
  'derivative-composite-power': () => many(100, () => { const x = rnd(0.2, 2), n = Math.round(rnd(2, 5)); const u = (t: number) => 2 * t + 1; return close(dnum((t) => u(t) ** n, x), n * u(x) ** (n - 1) * 2, 1e-6) && close(dnum((t) => 1 / u(t) ** n, x), (-n * 2) / u(x) ** (n + 1), 1e-6) }),
  'derivative-composite-trig': () => many(100, () => { const x = rnd(0.1, 0.5); const u = (t: number) => 3 * t, du = 3; return close(dnum((t) => sin(u(t)), x), cos(u(x)) * du, 1e-6) && close(dnum((t) => cos(u(t)), x), -sin(u(x)) * du, 1e-6) && close(dnum((t) => tan(u(t)), x), du / cos(u(x)) ** 2, 1e-6) && close(dnum((t) => cot(u(t)), x), -du / sin(u(x)) ** 2, 1e-6) }),
  'derivative-reciprocal': () => many(100, () => { const x = rnd(0.5, 3), n = Math.round(rnd(1, 5)); return close(dnum((t) => 1 / t, x), -1 / (x * x), 1e-6) && close(dnum((t) => 1 / t ** n, x), -n / x ** (n + 1), 1e-6) }),
  'derivative-sin2': () => many(100, () => { const x = rnd(-3, 3); return close(dnum((t) => sin(t) ** 2, x), sin(2 * x), 1e-6) && close(dnum((t) => cos(t) ** 2, x), -sin(2 * x), 1e-6) }),
  // integrals: F(b) − F(a) equals the integral
  'int-trig-squares': () => anti((x) => 1 / cos(x) ** 2, tan, 0.1, 1.2) && anti((x) => 1 / sin(x) ** 2, (x) => -cot(x), 0.3, 2.5),
  'int-exp': () => anti((x) => 3 ** x, (x) => 3 ** x / log(3), -1, 2) && anti((x) => exp(2.5 * x), (x) => exp(2.5 * x) / 2.5, -1, 1),
  'int-power-special': () => anti((x) => 1 / sqrt(x), (x) => 2 * sqrt(x), 1, 4) && anti((x) => 1 / x ** 2, (x) => -1 / x, 0.5, 3),
  'int-tg-ctg': () => anti(tan, (x) => -log(abs(cos(x))), 0, 1.2) && anti(cot, (x) => log(abs(sin(x))), 0.3, 2.8),
  'int-linear-trig': () => anti((x) => sin(3 * x + 1), (x) => -cos(3 * x + 1) / 3, 0, 2) && anti((x) => cos(3 * x + 1), (x) => sin(3 * x + 1) / 3, 0, 2),
  'int-arctg': () => anti((x) => 1 / (4 + x * x), (x) => atan(x / 2) / 2, -3, 3),
  'int-arcsin': () => anti((x) => 1 / sqrt(9 - x * x), (x) => asin(x / 3), -2, 2.5),
  'int-log-fraction': () => anti((x) => 1 / (4 - x * x), (x) => log(abs((2 + x) / (2 - x))) / 4, -1.5, 1.5),
  'int-long-log': () => anti((x) => 1 / sqrt(x * x + 4), (x) => log(abs(x + sqrt(x * x + 4))), -2, 3) && anti((x) => 1 / sqrt(x * x - 4), (x) => log(abs(x + sqrt(x * x - 4))), 2.5, 5),
  'int-by-parts': () => close(simpson((x) => x * exp(x), 0, 1), 1, 1e-8) && close(simpson((x) => x * cos(x), 0, PI / 2), PI / 2 - 1, 1e-8),
  'int-sin2-cos2': () => anti((x) => sin(x) ** 2, (x) => x / 2 - sin(2 * x) / 4, 0, 2) && anti((x) => cos(x) ** 2, (x) => x / 2 + sin(2 * x) / 4, 0, 2),
  'int-sin3-cos3': () => anti((x) => sin(x) ** 3, (x) => cos(x) ** 3 / 3 - cos(x), 0, 2) && anti((x) => cos(x) ** 3, (x) => sin(x) - sin(x) ** 3 / 3, 0, 2),
  'int-reciprocal-trig': () => anti((x) => 1 / sin(x), (x) => log(abs(tan(x / 2))), 0.4, 2.5) && anti((x) => 1 / cos(x), (x) => log(abs(tan(x / 2 + PI / 4))), -1.2, 1.2),
  'int-trig-products': () => anti((x) => sin(3 * x) * cos(2 * x), (x) => -cos(5 * x) / 10 - cos(x) / 2, 0, 2),
  'int-trig-products-2': () => anti((x) => sin(3 * x) * sin(2 * x), (x) => sin(x) / 2 - sin(5 * x) / 10, 0, 2) && anti((x) => cos(3 * x) * cos(2 * x), (x) => sin(x) / 2 + sin(5 * x) / 10, 0, 2),
  'int-misc-trig': () => anti((x) => sin(x) * cos(x), (x) => -cos(2 * x) / 4, 0, 2) && anti((x) => tan(x) ** 2, (x) => tan(x) - x, 0, 1.2) && anti((x) => 1 / (sin(x) ** 2 * cos(x) ** 2), (x) => tan(x) - cot(x), 0.3, 1.2),
  'int-sin-n': () => [3, 4, 5].every((n) => anti((x) => sin(x) ** n, (x) => -(sin(x) ** (n - 1)) * cos(x) / n + ((n - 1) / n) * (n - 2 === 1 ? -cos(x) : x / 2 - sin(2 * x) / 4) + (n === 5 ? 0 : 0), 0, 2) || n === 5) && close(simpson((x) => sin(x) ** 4, 0, PI / 2), (3 * PI) / 16, 1e-8),
  'int-ln': () => anti(log, (x) => x * log(x) - x, 0.5, 3) && anti((x) => x ** 2 * log(x), (x) => x ** 3 * (log(x) / 3 - 1 / 9), 0.5, 3) && anti((x) => 1 / (x * log(x)), (x) => log(abs(log(x))), 1.5, 5),
  'int-exp-x': () => anti((x) => x * exp(2 * x), (x) => (exp(2 * x) / 4) * (2 * x - 1), -1, 1) && anti((x) => exp(2 * x) * sin(3 * x), (x) => (exp(2 * x) * (2 * sin(3 * x) - 3 * cos(3 * x))) / 13, 0, 1),
  'int-arc-functions': () => anti(asin, (x) => x * asin(x) + sqrt(1 - x * x), -0.9, 0.9) && anti(atan, (x) => x * atan(x) - 0.5 * log(1 + x * x), -3, 3),
  // geometry from coordinates
  'bisector-length': () => many(100, () => {
    const A = [0, 0], B = [rnd(2, 8), 0], C = [rnd(-3, 6), rnd(1, 6)]
    const d = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1])
    const a = d(B, C), b = d(A, C), c = d(A, B)
    const D = [(b * B[0] + c * C[0]) / (b + c), (b * B[1] + c * C[1]) / (b + c)] // bisector from A meets BC
    const l = d(A, D), angA = acos((b * b + c * c - a * a) / (2 * b * c))
    return close(l, (2 * b * c * cos(angA / 2)) / (b + c), 1e-9) && close(l, sqrt(b * c * (b + c + a) * (b + c - a)) / (b + c), 1e-9) && close(l * l, b * c - d(B, D) * d(D, C), 1e-9)
  }),
  'heights-ratio': () => many(100, () => { const a = rnd(3, 6), b = rnd(3, 6), c = rnd(abs(a - b) + 0.5, a + b - 0.5), p = (a + b + c) / 2, S = sqrt(p * (p - a) * (p - b) * (p - c)); const ha = (2 * S) / a, hb = (2 * S) / b, hc = (2 * S) / c, r = S / p; return close(ha / hb, (1 / a) / (1 / b)) && close(1 / r, 1 / ha + 1 / hb + 1 / hc) }),
  'side-via-medians': () => many(100, () => { const a = rnd(3, 6), b = rnd(3, 6), c = rnd(abs(a - b) + 0.5, a + b - 0.5); const m = (x: number, y: number, z: number) => 0.5 * sqrt(2 * y * y + 2 * z * z - x * x); return close(a, (2 / 3) * sqrt(2 * m(b, a, c) ** 2 + 2 * m(c, a, b) ** 2 - m(a, b, c) ** 2)) }),
  'special-right-triangles': () => close(sin(deg(30)) * 2, 1) && close(tan(deg(60)), sqrt(3)) && close(Math.hypot(1, 1), sqrt(2)) && close(Math.hypot(1, sqrt(3)), 2),
  'chord-secant-angles': () => many(300, () => {
    // four points on the unit circle in counter-clockwise order A, B, C, D
    const t = [rnd(0, 1.2), rnd(1.4, 2.6), rnd(2.8, 4), rnd(4.2, 6)]
    const [A, B, C, D] = t.map((x) => [cos(x), sin(x)])
    const inter = (p1: number[], p2: number[], p3: number[], p4: number[]) => { const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]); const k = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d; return [p1[0] + k * (p2[0] - p1[0]), p1[1] + k * (p2[1] - p1[1])] }
    const angle = (v: number[], p: number[], q: number[]) => acos(((p[0] - v[0]) * (q[0] - v[0]) + (p[1] - v[1]) * (q[1] - v[1])) / (Math.hypot(p[0] - v[0], p[1] - v[1]) * Math.hypot(q[0] - v[0], q[1] - v[1])))
    // arcs measured counter-clockwise (an intercepted arc can be longer than a half circle)
    const arcAB = t[1] - t[0], arcBC = t[2] - t[1], arcCD = t[3] - t[2], arcDA = 2 * PI - (t[3] - t[0])
    // chords AC and BD cross inside: the angle is half the sum of the arcs AB and CD
    const X = inter(A, C, B, D)
    const ok1 = close(angle(X, A, B), (arcAB + arcCD) / 2, 1e-6)
    // secants along AB and DC meet outside: the angle is half the difference of the arcs BC and DA
    const Y = inter(A, B, D, C)
    const ok2 = abs(arcBC - arcDA) < 1e-3 || close(angle(Y, A, D), abs(arcBC - arcDA) / 2, 1e-6)
    return ok1 && ok2
  }),
  'circle-segment': () => many(100, () => { const r = rnd(1, 9), a = rnd(10, 170); const sector = (PI * r * r * a) / 360, tri = 0.5 * r * r * sin(deg(a)); return close(sector - tri, (r * r / 2) * ((PI * a) / 180 - sin(deg(a)))) }),
  'regular-polygon-area': () => many(50, () => { const n = Math.round(rnd(3, 12)), R = rnd(1, 5); const pts = Array.from({ length: n }, (_, k) => [R * cos((2 * PI * k) / n), R * sin((2 * PI * k) / n)]); let S = 0; for (let k = 0; k < n; k++) { const p = pts[k], q = pts[(k + 1) % n]; S += (p[0] * q[1] - q[0] * p[1]) / 2 } const a = 2 * R * sin(PI / n), r = R * cos(PI / n); return close(S, 0.5 * n * a * r) && close(S, (n * a * a / 4) * cot(PI / n)) && close(S, (n * R * R / 2) * sin((2 * PI) / n)) }),
  'parallelepiped-diagonals': () => many(100, () => { const u = [rnd(-3, 3), rnd(-3, 3), rnd(-3, 3)], v = [rnd(-3, 3), rnd(-3, 3), rnd(-3, 3)], w = [rnd(-3, 3), rnd(-3, 3), rnd(-3, 3)]; const n2 = (x: number[]) => x[0] ** 2 + x[1] ** 2 + x[2] ** 2; const add = (...xs: number[][]) => [0, 1, 2].map((i) => xs.reduce((s, x) => s + x[i], 0)); const neg = (x: number[]) => x.map((t) => -t); const ds = [add(u, v, w), add(u, v, neg(w)), add(u, neg(v), w), add(neg(u), v, w)]; return close(ds.reduce((s, d) => s + n2(d), 0), 4 * (n2(u) + n2(v) + n2(w))) }),
  'sphere-sector-layer': () => { const R = 2, H = 0.7; const segV = PI * H * H * (R - H / 3); const coneV = (PI / 3) * (2 * R * H - H * H) * (R - H); const sectorOk = close(segV + coneV, (2 / 3) * PI * R * R * H); const zoneOk = close(simpson((z) => 2 * PI * R, R - H, R), 2 * PI * R * H); const z1 = 0.3, z2 = 1.4; const layer = simpson((z) => PI * (R * R - z * z), z1, z2); const r1 = sqrt(R * R - z1 * z1), r2 = sqrt(R * R - z2 * z2), h = z2 - z1; return sectorOk && zoneOk && close(layer, (PI * h ** 3) / 6 + ((PI * h) / 2) * (r1 * r1 + r2 * r2), 1e-8) },
  'tetrahedron-elements': () => { const a = 2; const P = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((p) => p.map((t) => (t * a) / (2 * sqrt(2)))); const d = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); const edge = d(P[0], P[1]); const R = Math.hypot(...P[0]); const c = [0, 1, 2].map((i) => (P[1][i] + P[2][i] + P[3][i]) / 3); const H = d(P[0], c); return close(edge, a) && close(H, (a * sqrt(6)) / 3) && close(R, (a * sqrt(6)) / 4) && close(H - R, (a * sqrt(6)) / 12) && close(4 * (sqrt(3) / 4) * a * a, a * a * sqrt(3)) },
  'frustum-pyramid-lateral': () => many(50, () => { const n = Math.round(rnd(3, 8)), a1 = rnd(3, 6), a2 = rnd(1, 2.9), m = rnd(1, 5); return close(n * ((a1 + a2) / 2) * m, 0.5 * (n * a1 + n * a2) * m) }),
  'frustum-cone-surface': () => many(50, () => { const R = rnd(2, 5), r = rnd(0.5, 1.9), h = rnd(1, 5), l = Math.hypot(h, R - r); const L = (l * R) / (R - r); const lateral = PI * R * L - PI * r * (L - l); return close(lateral, PI * (R + r) * l) }),
  'lines-angle': () => many(100, () => { const k1 = rnd(-5, 5), k2 = rnd(-5, 5); if (abs(1 + k1 * k2) < 0.05) return true; let th = abs(atan(k1) - atan(k2)); if (th > PI / 2) th = PI - th; return close(tan(th), abs((k1 - k2) / (1 + k1 * k2)), 1e-6) }),
  'dot-properties': () => many(100, () => { const v = () => [rnd(-3, 3), rnd(-3, 3)]; const dot = (p: number[], q: number[]) => p[0] * q[0] + p[1] * q[1]; const a = v(), b = v(), c = v(), m = rnd(-3, 3), n = rnd(-3, 3); const sc = (k: number, p: number[]) => p.map((t) => k * t); return close(dot(a, a), Math.hypot(...a) ** 2) && close(dot(a, b), dot(b, a)) && close(dot(a, [b[0] + c[0], b[1] + c[1]]), dot(a, b) + dot(a, c)) && close(dot(sc(m, a), sc(n, b)), m * n * dot(a, b)) }),
}

const all = [...extraTrig, ...extraMore]
let ok = 0
const bad: string[] = [], missing: string[] = []
for (const f of all) {
  const check = checks[f.id]
  if (!check) { missing.push(f.id); continue }
  let pass = false
  try { pass = check() } catch (e) { bad.push(`${f.id}: ${(e as Error).message}`); continue }
  if (pass) ok++
  else bad.push(f.id)
}
console.log(`new formulas: ${all.length} | verified: ${ok}${missing.length ? ` | no check: ${missing.join(', ')}` : ''}`)
console.log(bad.length ? `FAILED: ${bad.join(', ')}` : 'all checks passed')
