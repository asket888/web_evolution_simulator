import type { Brain } from './brain.ts'
import type { Creature } from './creature.ts'
import type { Random } from './random.ts'
import type { Settings } from './settings.ts'

/**
 * Next generation: the best `elitism` share survives unchanged (and is the pool of parents),
 * the rest are children of two different random parents from that pool.
 */
export function evolve<T extends Creature>(
  old: T[],
  elitism: number,
  settings: Settings,
  random: Random,
  create: (brain: Brain, name: string) => T,
  childName: (index: number) => string,
): T[] {
  if (old.length === 0) return []
  // stable sort: creatures with equal fitness keep their order (like Python's sorted)
  const sorted = [...old].sort((a, b) => b.fitness - a.fitness)
  const ancestors = Math.max(1, Math.floor(elitism * old.length))

  const next = sorted.slice(0, ancestors).map((best) => create(best.brain, best.name))
  for (let i = 0; next.length < old.length; i++) {
    const [p1, p2] = pickTwo(ancestors, random)
    next.push(create(child(sorted[p1].brain, sorted[p2].brain, settings, random), childName(i)))
  }
  return next
}

/** Two different parent indexes in [0, count), the same one only if there is a single parent. */
function pickTwo(count: number, random: Random): [number, number] {
  const first = random.int(count)
  if (count < 2) return [first, first]
  let second = random.int(count - 1)
  if (second >= first) second++
  return [first, second]
}

/**
 * Crossover: every hidden neuron (its input and output weights) is inherited whole from one of the parents.
 * Mutation: every weight is changed with probability `mutate` by adding gaussian noise.
 */
export function child(a: Brain, b: Brain, settings: Settings, random: Random): Brain {
  const fromA = a.wih.map(() => random.next() < 0.5)
  const mutate = (w: number) => (random.next() < settings.mutate ? w + random.normal(0, settings.mutate_sigma) : w)
  return {
    wih: fromA.map((useA, neuron) => (useA ? a : b).wih[neuron].map(mutate)),
    who: a.who.map((row, out) => row.map((_, neuron) => mutate((fromA[neuron] ? a : b).who[out][neuron]))),
  }
}
