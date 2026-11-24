/**
 * Approximate school year: which topics are studied in each grade and quarter
 * (algebra and geometry together, as in most schools of Kazakhstan).
 * A teacher may follow a different order — this is a guide, not the official plan.
 */
export const curriculum: Record<number, [string[], string[], string[], string[]]> = {
  5: [['divisibility', 'word-problems'], ['fractions'], ['fractions', 'percents'], ['quadrilaterals', 'prisms', 'literacy']],
  6: [['proportions'], ['percents', 'fractions'], ['inequalities', 'word-problems'], ['circle', 'literacy']],
  // algebra as in the textbook (Әбілқасымова и др., 2025): I–II sections — 1st quarter, III–IV — 2nd, V — 3rd, VI — 4th
  7: [['powers', 'polynomials', 'angles-lines'], ['linear-fn', 'other-fn', 'statistics', 'triangles'], ['short-mult', 'word-problems', 'triangles'], ['alg-fractions', 'circle']],
  8: [['roots', 'quadrilaterals', 'polygons'], ['quadratic', 'right-triangle'], ['quadratic-fn', 'other-fn', 'trig-basics', 'triangle-area'], ['inequalities', 'circle']],
  9: [['inequalities', 'triangles', 'vectors'], ['arith-prog', 'geom-prog', 'coord-plane'], ['trig-basics', 'trig-identities', 'triangle-area', 'polygons'], ['combinatorics', 'probability', 'circle']],
  10: [['other-fn', 'powers', 'roots'], ['trig-reduction', 'trig-addition', 'trig-double', 'trig-sum-product'], ['inverse-trig', 'trig-equations', 'trig-inequalities', 'derivative-table', 'derivative-rules'], ['derivative-apply', 'combinatorics', 'probability', 'prisms']],
  11: [['antiderivatives', 'integrals', 'integrals-table'], ['exp-fn', 'log-props'], ['log-eq', 'pyramids', 'bodies-rotation'], ['bodies-rotation', 'complex', 'statistics', 'literacy']],
}

/** School quarter by date: Sep–Oct 1, Nov–Dec 2, Jan–Mar 3, Apr–Aug 4. */
export function currentQuarter(d = new Date()): 1 | 2 | 3 | 4 {
  const m = d.getMonth() + 1
  if (m >= 9 && m <= 10) return 1
  if (m >= 11) return 2
  if (m <= 3) return 3
  return 4
}
