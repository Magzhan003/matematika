import { ex2ArithAlg } from './arith-alg'
import { ex2CalcProb } from './calc-prob'
import { ex2FuncTrig } from './func-trig'
import { ex2Geometry } from './geometry'
import type { Example2 } from './core'

export type { Example2 } from './core'

/** Second, simpler example for each formula, by formula id. */
export const examples2: Record<string, Example2> = Object.fromEntries([...ex2ArithAlg, ...ex2FuncTrig, ...ex2CalcProb, ...ex2Geometry])
