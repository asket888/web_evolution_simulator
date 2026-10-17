import type { Organism, Predator } from './creature.ts'

export interface GenerationStats {
  generation: number // 1-based
  best: number // herbivore fitness
  avg: number
  worst: number
  survived: number // herbivores alive at the end of the generation
  count: number
  killed: number // killed by predators
  died: number // starved or lost energy on walls / collisions
  bodiesEaten: number
  predSurvived: number
  predCount: number
  predAvg: number
}

export function generationStats(generation: number, organisms: Organism[], predators: Predator[]): GenerationStats {
  const fitness = organisms.map((o) => o.fitness)
  const dead = fitness.filter((f) => f <= 0).length
  const killed = organisms.filter((o) => o.killed).length
  return {
    generation,
    best: Math.max(...fitness),
    avg: fitness.reduce((s, f) => s + f, 0) / fitness.length,
    worst: Math.min(...fitness),
    survived: fitness.length - dead,
    count: fitness.length,
    killed,
    died: dead - killed,
    bodiesEaten: organisms.filter((o) => o.eaten).length,
    predSurvived: predators.filter((p) => p.fitness > 0).length,
    predCount: predators.length,
    predAvg: predators.length ? predators.reduce((s, p) => s + p.fitness, 0) / predators.length : 0,
  }
}
