/**
 * Derivative with named rules for every step (sum, constant factor, product,
 * quotient, power, chain rule and the table of derivatives).
 */
import type { MathNode } from 'mathjs'
import { N, parseNode, tex, texIn, type CalcResult, type Step } from './tools'

type AnyNode = MathNode & {
  type: string
  op?: string
  fn?: { name: string } | string
  args?: MathNode[]
  name?: string
  content?: MathNode
}

const strip = (n: AnyNode): AnyNode => (n.type === 'ParenthesisNode' ? strip(n.content as AnyNode) : n)
const has = (n: MathNode, v: string) => n.filter((k) => (k as AnyNode).type === 'SymbolNode' && (k as AnyNode).name === v).length > 0
const s = (n: MathNode) => n.toString()
const T = (n: MathNode) => texIn(s(n))
const D = (n: MathNode) => `\\left(${T(n)}\\right)'`
const fname = (n: AnyNode) => (typeof n.fn === 'string' ? n.fn : n.fn?.name ?? '')

/** f(x) whose derivative is in the table when the argument is exactly x. */
const table: Record<string, (u: string) => string> = {
  sin: (u) => `\\cos ${u}`,
  cos: (u) => `-\\sin ${u}`,
  tan: (u) => `\\dfrac{1}{\\cos^2 ${u}}`,
  cot: (u) => `-\\dfrac{1}{\\sin^2 ${u}}`,
  sqrt: (u) => `\\dfrac{1}{2\\sqrt{${u}}}`,
  exp: (u) => `e^{${u}}`,
  log: (u) => `\\dfrac{1}{${u}}`,
  log10: (u) => `\\dfrac{1}{${u}\\ln 10}`,
  asin: (u) => `\\dfrac{1}{\\sqrt{1 - ${u}^2}}`,
  acos: (u) => `-\\dfrac{1}{\\sqrt{1 - ${u}^2}}`,
  atan: (u) => `\\dfrac{1}{1 + ${u}^2}`,
}

/** True when the derivative is a single table entry or x^n (no further steps needed). */
function isBasic(n: AnyNode, v: string): boolean {
  n = strip(n)
  if (!has(n, v)) return true
  if (n.type === 'SymbolNode') return true
  if (n.type === 'OperatorNode' && n.op === '^') {
    const [b, e] = n.args!.map((a) => strip(a as AnyNode))
    return b.type === 'SymbolNode' && !has(e, v)
  }
  if (n.type === 'OperatorNode' && n.op === '*' && n.args!.length === 2) {
    const [a, b] = n.args!.map((x) => strip(x as AnyNode))
    return !has(a, v) && isBasic(b, v)
  }
  if (n.type === 'FunctionNode' && n.args!.length === 1) return strip(n.args![0] as AnyNode).type === 'SymbolNode'
  return false
}

function explain(node: MathNode, v: string, steps: Step[], depth = 0) {
  const n = strip(node as AnyNode)
  if (depth > 6 || steps.length > 14 || !has(n, v) || n.type === 'SymbolNode') return

  if (n.type === 'OperatorNode' && (n.op === '+' || n.op === '-') && n.args!.length === 2) {
    const [a, b] = n.args!
    steps.push({ note: 'deriv.sum', tex: `${D(n)} = ${D(a)} ${n.op} ${D(b)}` })
    for (const part of [a, b]) if (!isBasic(part as AnyNode, v)) explain(part, v, steps, depth + 1)
    return
  }
  if (n.type === 'OperatorNode' && n.op === '-' && n.args!.length === 1) {
    steps.push({ note: 'deriv.const', tex: `${D(n)} = -${D(n.args![0])}` })
    explain(n.args![0], v, steps, depth + 1)
    return
  }
  if (n.type === 'OperatorNode' && n.op === '*') {
    const [a, b] = n.args!
    if (!has(a, v) || !has(b, v)) {
      const [c, u] = has(a, v) ? [b, a] : [a, b]
      steps.push({ note: 'deriv.const', tex: `${D(n)} = ${T(c)} \\cdot ${D(u)}` })
      if (!isBasic(u as AnyNode, v)) explain(u, v, steps, depth + 1)
      return
    }
    steps.push({ note: 'deriv.product', tex: `${D(n)} = ${D(a)} \\cdot ${T(b)} + ${T(a)} \\cdot ${D(b)}` })
    for (const part of [a, b]) if (!isBasic(part as AnyNode, v)) explain(part, v, steps, depth + 1)
    return
  }
  if (n.type === 'OperatorNode' && n.op === '/') {
    const [a, b] = n.args!
    if (!has(b, v)) {
      steps.push({ note: 'deriv.const', tex: `${D(n)} = \\dfrac{1}{${T(b)}} \\cdot ${D(a)}` })
      if (!isBasic(a as AnyNode, v)) explain(a, v, steps, depth + 1)
      return
    }
    steps.push({ note: 'deriv.quotient', tex: `${D(n)} = \\dfrac{${D(a)} \\cdot ${T(b)} - ${T(a)} \\cdot ${D(b)}}{\\left(${T(b)}\\right)^2}` })
    for (const part of [a, b]) if (!isBasic(part as AnyNode, v)) explain(part, v, steps, depth + 1)
    return
  }
  if (n.type === 'OperatorNode' && n.op === '^') {
    const [b, e] = n.args!.map((x) => strip(x as AnyNode))
    if (!has(e, v)) {
      const k = s(e)
      if (b.type === 'SymbolNode') {
        steps.push({ note: 'deriv.power', tex: `${D(n)} = ${texIn(k)} \\cdot ${v}^{${tex(`${k}-1`)}}` })
      } else {
        steps.push({ note: 'deriv.chain', params: { f: 'u^n' }, tex: `${D(n)} = ${texIn(k)} \\left(${T(b)}\\right)^{${tex(`${k}-1`)}} \\cdot ${D(b)}` })
        explain(b, v, steps, depth + 1)
      }
      return
    }
    if (!has(b, v)) {
      const base = s(b)
      const e1 = base === 'e' ? `e^{${T(e)}}` : `${texIn(base)}^{${T(e)}} \\ln ${texIn(base)}`
      steps.push({ note: 'deriv.exp', tex: `${D(n)} = ${e1} \\cdot ${D(e)}` })
      if (!isBasic(e, v)) explain(e, v, steps, depth + 1)
      return
    }
  }
  if (n.type === 'FunctionNode') {
    const f = fname(n)
    const arg = n.args![0]
    const inner = strip(arg as AnyNode)
    const rule = table[f]
    if (rule && n.args!.length === 1) {
      if (inner.type === 'SymbolNode') {
        steps.push({ note: 'deriv.table', tex: `${D(n)} = ${rule(T(inner))}` })
      } else {
        steps.push({ note: 'deriv.chain', params: { f }, tex: `${D(n)} = ${rule(`\\left(${T(inner)}\\right)`)} \\cdot ${D(inner)}` })
        explain(inner, v, steps, depth + 1)
      }
      return
    }
    if (f === 'log' && n.args!.length === 2) {
      const a = T(n.args![1])
      steps.push({ note: 'deriv.table', tex: `${D(n)} = \\dfrac{1}{\\left(${T(inner)}\\right) \\ln ${a}} \\cdot ${D(inner)}` })
      if (inner.type !== 'SymbolNode') explain(inner, v, steps, depth + 1)
    }
  }
}

export function derivativeSteps(expr: string, v = 'x', order = 1): CalcResult {
  const node = parseNode(expr)
  if (!node) return { error: 'calc.err.parse' }
  const steps: Step[] = []
  if (order === 1) explain(node, v, steps)
  let res: string
  try {
    res = N.diff(expr, v).toString()
    if (order === 2) {
      steps.push({ note: 'deriv.first', tex: `y' = ${tex(res)}` })
      res = N.diff(res, v).toString()
    }
  } catch {
    return { error: 'calc.err.parse' }
  }
  let simple = res
  try {
    simple = N.simplify(res).toString()
  } catch { /* keep */ }
  steps.push({ note: 'deriv.result', tex: `${order === 2 ? "y''" : `\\left(${texIn(expr)}\\right)'`} = ${tex(simple)}` })
  return {
    steps,
    answer: `${order === 2 ? "y''" : "y'"} = ${tex(simple)}`,
    plot: { fns: [expr, simple] },
    kind: 'derivative',
  }
}
