/**
 * "Find my mistake": a student types a solution line by line, every line is compared with the task (the first line).
 *  - equations: the set of roots must stay the same (a lost root is a mistake, an extra one is a warning — it needs a check);
 *  - inequalities: the set of solutions must stay the same (compared on a fine grid);
 *  - expressions: the value must stay the same at any x (identity transformations);
 *  - number lines like "D = 25 − 24 = 1": every part must be equal;
 *  - the answer "x = 2, x = 3" / "нет корней" must give exactly the roots of the task.
 * For a wrong line it finds a concrete x that shows the difference and guesses the typical slip (sign, brackets, flipped inequality).
 */
import { normalize, texIn } from '../mathcore'
import { rewrite } from './smart'
import { fnOf, numTex, numericRoots, prepare, snap } from './tools'

export type LineStatus = 'task' | 'ok' | 'warn' | 'bad' | 'follow' | 'skip'
export type LineCheck = { raw: string; tex: string; status: LineStatus; reason?: string; params?: Record<string, string> }

type Kind =
  | { k: 'eq'; L: string; R: string }
  | { k: 'ineq'; L: string; op: string; R: string }
  | { k: 'expr'; e: string }
  | { k: 'answer'; roots: number[] }
  | { k: 'arith'; parts: string[] }
  | { k: 'skip' }

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6 * (1 + Math.abs(a) + Math.abs(b))
const hasV = (s: string, v: string) => new RegExp(`(?<![A-Za-z_])${v}(?![A-Za-z_])`).test(s)
const prep = (s: string) => prepare(normalize(rewrite(s)))
const EMPTY = /^(нет корней|корней нет|нет решений|решений нет|түбір(лер)? жоқ|шешімі жоқ|∅|\\varnothing|no roots)\.?$/i

function classify(raw: string, v: string): Kind {
  const s0 = raw.trim().replace(/^(=>|⇒|→|⟹)\s*/, '').replace(/[.]$/, '')
  if (!s0) return { k: 'skip' }
  if (EMPTY.test(s0)) return { k: 'answer', roots: [] }
  if (/±|\\pm|\bn\b|[а-яёәіңғүұқөһ]{3,}/i.test(s0) && !/или|немесе/.test(s0)) return { k: 'skip' }
  // an answer: x = 2, x = 3 · x1 = 2; x2 = 3 · x = 2 или x = 3
  const pieces = s0.split(/\s*(?:;|,(?!\d)|\s(?:или|немесе|or)\s)\s*/).filter(Boolean)
  const ansRe = new RegExp(`^${v}\\s*(?:_?\\{?\\d\\}?|[₁₂₃₄])?\\s*=\\s*(.+)$`)
  if (pieces.length && pieces.every((p) => ansRe.test(p) && !hasV(p.replace(ansRe, '$1'), v))) {
    const roots = pieces.map((p) => fnOf(prep(p.replace(ansRe, '$1')), v)(0))
    if (roots.every(Number.isFinite)) return { k: 'answer', roots }
  }
  const s = prep(s0)
  const ineq = /^(.*?)(<=|>=|<|>)(.*)$/.exec(s)
  if (ineq && !/<|>/.test(ineq[3])) return hasV(s, v) ? { k: 'ineq', L: ineq[1], op: ineq[2], R: ineq[3] } : { k: 'skip' }
  const parts = s.split('=').map((p) => p.trim())
  if (parts.length === 1) return hasV(s, v) || /\d/.test(s) ? { k: 'expr', e: s } : { k: 'skip' }
  if (parts.some((p) => !p)) return { k: 'skip' }
  if (!hasV(s, v)) {
    // "D = 25 - 24 = 1": a letter on the left is just a name
    const nums = /^[A-Za-z](_?\w+)?$/.test(parts[0]) ? parts.slice(1) : parts
    return nums.length >= 2 ? { k: 'arith', parts: nums } : { k: 'skip' }
  }
  // substitution "t = x^2" — a new letter, not checked
  if (/^[A-Za-z]$/.test(parts[0]) && parts[0] !== v) return { k: 'skip' }
  if (parts.length !== 2) return { k: 'skip' }
  return { k: 'eq', L: parts[0], R: parts[1] }
}

const rootsOf = (L: string, R: string, v: string) => numericRoots(fnOf(`(${L})-(${R})`, v), -60, 60, 12000).map(snap)
const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.some((y) => near(x, y)))
const list = (xs: number[]) => xs.map((x) => numTex(x)).join(';\\ ')
const opTest = (op: string, y: number) => (op === '<' ? y < -1e-9 : op === '>' ? y > 1e-9 : op === '<=' ? y <= 1e-9 : y >= -1e-9)
const GRID = (() => { const g: number[] = []; for (let i = -400; i <= 400; i++) g.push(i / 8); return g })()

type Ref = { kind: Kind; roots: number[]; pred: ((x: number) => boolean) | null; F: ((x: number) => number) | null }

function makeRef(k: Kind, v: string): Ref | null {
  if (k.k === 'eq') return { kind: k, roots: rootsOf(k.L, k.R, v), pred: null, F: null }
  if (k.k === 'ineq') {
    const f = fnOf(`(${k.L})-(${k.R})`, v)
    return { kind: k, roots: [], pred: (x) => { const y = f(x); return Number.isFinite(y) && opTest(k.op, y) }, F: null }
  }
  if (k.k === 'expr') return { kind: k, roots: [], pred: null, F: fnOf(k.e, v) }
  return null
}

export function checkSolution(text: string, v = 'x'): LineCheck[] {
  const lines = text.split(/\n/).map((s) => s.trim()).filter(Boolean)
  const out: LineCheck[] = []
  let task: Ref | null = null
  let prev: Ref | null = null
  let hadBad = false
  const texOf = (k: Kind, raw: string) => {
    try {
      if (k.k === 'eq') return `${texSafe(k.L)} = ${texSafe(k.R)}`
      if (k.k === 'ineq') return `${texSafe(k.L)} ${({ '<': '<', '>': '>', '<=': '\\le', '>=': '\\ge' } as Record<string, string>)[k.op]} ${texSafe(k.R)}`
      if (k.k === 'expr') return texSafe(k.e)
      if (k.k === 'arith') return prep(raw).split('=').map((p) => texSafe(p.trim())).join(' = ')
      if (k.k === 'answer') return k.roots.length ? k.roots.map((r) => `${v} = ${numTex(r)}`).join(';\\ ') : '\\varnothing'
    } catch { /* fall through */ }
    return `\\text{${raw.replace(/[\\{}]/g, '')}}`
  }

  for (const raw of lines) {
    const k = classify(raw, v)
    const tex = texOf(k, raw)
    if (!task) {
      const ref = makeRef(k, v)
      if (!ref) { out.push({ raw, tex, status: 'skip', reason: 'chk.skip' }); continue }
      task = prev = ref
      out.push({ raw, tex, status: 'task' })
      continue
    }
    let res = judge(k, task.kind, task.roots, task.pred, task.F, v)
    // a wrong line that follows correctly from the previous (already wrong) line is a consequence, not a new mistake
    if (hadBad && res.status === 'bad' && prev && prev !== task) {
      const r2 = judge(k, prev.kind, prev.roots, prev.pred, prev.F, v)
      if (r2.status === 'ok' && res.status === 'bad') res = { status: 'follow', reason: 'chk.follows' }
    }
    out.push({ raw, tex, ...res })
    if (res.status === 'bad') hadBad = true
    const ref = makeRef(k, v)
    if (ref) prev = ref
  }
  return out
}

function texSafe(s: string): string {
  try {
    return texIn(s)
  } catch {
    return s
  }
}

function judge(
  k: Kind, task: Kind, taskRoots: number[], taskPred: ((x: number) => boolean) | null, taskF: ((x: number) => number) | null, v: string,
): Omit<LineCheck, 'raw' | 'tex'> {
  if (k.k === 'skip') return { status: 'skip', reason: 'chk.skip' }
  if (k.k === 'arith') {
    const vals = k.parts.map((p) => fnOf(p, v)(0))
    if (!vals.every(Number.isFinite)) return { status: 'skip', reason: 'chk.skip' }
    const bad = vals.findIndex((y) => !near(y, vals[0]))
    return bad < 0 ? { status: 'ok' } : { status: 'bad', reason: 'chk.arith', params: { a: numTex(vals[0]), b: numTex(vals[bad]) } }
  }

  if (task.k === 'eq' && (k.k === 'eq' || k.k === 'answer')) {
    const roots = k.k === 'eq' ? rootsOf(k.L, k.R, v) : k.roots
    const lost = taskRoots.filter((r) => !roots.some((q) => near(q, r)))
    const extra = roots.filter((r) => !taskRoots.some((q) => near(q, r)))
    if (!lost.length && !extra.length) return { status: 'ok' }
    const sign = lost.length && extra.length && sameSet(extra, lost.map((r) => -r)) ? 'chk.hintSign' : undefined
    if (lost.length && !extra.length) return { status: 'bad', reason: 'chk.lost', params: { r: list(lost), hint: '' } }
    if (!lost.length && extra.length) {
      // extra roots in the middle (after squaring, multiplying by x) are allowed but must be removed by a check
      return k.k === 'answer'
        ? { status: 'bad', reason: 'chk.extraAnswer', params: { r: list(extra) } }
        : { status: 'warn', reason: 'chk.extra', params: { r: list(extra) } }
    }
    return { status: 'bad', reason: sign ?? 'chk.changed', params: { was: list(taskRoots) || '\\varnothing', now: list(roots) || '\\varnothing' } }
  }

  if (task.k === 'ineq' && taskPred && (k.k === 'ineq' || k.k === 'answer')) {
    if (k.k === 'answer') return { status: 'skip', reason: 'chk.skip' }
    const f = fnOf(`(${k.L})-(${k.R})`, v)
    const pred = (x: number) => { const y = f(x); return Number.isFinite(y) && opTest(k.op, y) }
    const diff = GRID.find((x) => pred(x) !== taskPred(x))
    if (diff === undefined) return { status: 'ok' }
    // is it the flipped sign? (forgot to turn the sign when dividing by a negative number)
    const flipOp = ({ '<': '>', '>': '<', '<=': '>=', '>=': '<=' } as Record<string, string>)[k.op]
    const flipped = (x: number) => { const y = f(x); return Number.isFinite(y) && opTest(flipOp, y) }
    const isFlip = GRID.every((x) => near(f(x), 0) || flipped(x) === taskPred(x))
    return {
      status: 'bad',
      reason: isFlip ? 'chk.hintFlip' : taskPred(diff) ? 'chk.ineqLost' : 'chk.ineqExtra',
      params: { x: numTex(diff) },
    }
  }

  if (task.k === 'expr' && taskF && k.k === 'expr') {
    const g = fnOf(k.e, v)
    const xs = [-2.5, -1, 0.5, 1.5, 3, 4.25]
    const ok = xs.every((x) => { const a = taskF(x), b = g(x); return (!Number.isFinite(a) && !Number.isFinite(b)) || near(a, b) })
    if (ok) return { status: 'ok' }
    const x = xs.find((t) => !near(taskF(t), g(t)))!
    const neg = xs.every((t) => near(taskF(t), -g(t)))
    return { status: 'bad', reason: neg ? 'chk.hintSign' : 'chk.exprDiff', params: { x: numTex(x), a: numTex(taskF(x)), b: numTex(g(x)) } }
  }
  return { status: 'skip', reason: 'chk.mixed' }
}
