/**
 * Headless balance check: runs the simulation for several seeds and prints death / kill rates by 10-generation blocks.
 * Used to compare the TypeScript port with the Python version (same metrics as the Python experiments).
 *
 *   node scripts/balance.ts            # default settings
 *   node scripts/balance.ts --no-pred  # herbivores only
 *   node scripts/balance.ts --20       # 20 seeds instead of 5
 */
import { defaultSettings } from '../src/sim/settings.ts'
import type { GenerationStats } from '../src/sim/stats.ts'
import { World } from '../src/sim/world.ts'

const seeds = process.argv.includes('--20') ? Array.from({ length: 20 }, (_, i) => i) : [333, 1, 2, 3, 4]
const settings = { ...defaultSettings, pred_create: !process.argv.includes('--no-pred') }

const runs: GenerationStats[][] = seeds.map((seed) => {
  const world = new World({ ...settings, seed })
  for (let g = 0; g < settings.gens; g++) world.runGeneration()
  return world.history
})

const block = (metric: (g: GenerationStats) => number) => {
  const cells: string[] = []
  for (let start = 0; start < settings.gens; start += 10) {
    const values = runs.flatMap((history) => history.slice(start, start + 10).map(metric))
    cells.push(`${Math.round((100 * values.reduce((s, v) => s + v, 0)) / values.length)}%`.padStart(4))
  }
  return cells.join(' ')
}

console.log(`TypeScript, ${seeds.length} seeds, ${settings.gens} generations, predators ${settings.pred_create ? 'on' : 'off'}`)
console.log('  herb dead  ', block((g) => (g.count - g.survived) / g.count))
console.log('  killed     ', block((g) => g.killed / g.count))
console.log('  bodies     ', block((g) => g.bodiesEaten / g.count))
console.log('  pred dead  ', block((g) => (g.predCount ? (g.predCount - g.predSurvived) / g.predCount : 0)))
