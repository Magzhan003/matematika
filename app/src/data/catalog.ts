import { algebra } from './catalog/algebra'
import { arithmetic } from './catalog/arithmetic'
import { combinatorics } from './catalog/combinatorics'
import { functionsAndProgressions } from './catalog/functions'
import { logsCalculus } from './catalog/logs-calculus'
import { more } from './catalog/more'
import { planimetry1 } from './catalog/planimetry1'
import { planimetry2 } from './catalog/planimetry2'
import { space } from './catalog/space'
import { trig1 } from './catalog/trig1'
import { trig2 } from './catalog/trig2'
import { extraMore } from './catalog/extra-more'
import { extraTrig } from './catalog/extra-trig'

/** The full school catalogue added on top of the original formulas. */
export const catalog = [
  ...arithmetic, ...algebra, ...functionsAndProgressions, ...trig1, ...trig2,
  ...logsCalculus, ...combinatorics, ...planimetry1, ...planimetry2, ...space, ...more,
  ...extraTrig, ...extraMore,
]
