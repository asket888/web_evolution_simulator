import { randomBrain } from './brain.ts'
import { Organism, Predator } from './creature.ts'
import { evolve } from './evolution.ts'
import { Food } from './food.ts'
import { dist, pathDist } from './geometry.ts'
import { Random } from './random.ts'
import type { Settings } from './settings.ts'
import { generationStats, type GenerationStats } from './stats.ts'

/**
 * The aquarium: food, herbivores and predators. Call `step()` once per tick; after `settings.ticks` ticks the
 * generation ends, its stats are added to `history` and the next generation is bred. Same order of actions in a tick
 * as in the Python version (simulation.py).
 */
export class World {
  readonly settings: Settings
  readonly random: Random
  foods: Food[]
  organisms: Organism[]
  predators: Predator[]
  generation = 1 // current generation, 1-based
  tick = 0 // ticks done in the current generation
  readonly history: GenerationStats[] = []

  constructor(settings: Settings) {
    this.settings = settings
    this.random = new Random(settings.seed)
    const s = settings
    this.foods = Array.from({ length: s.food_num }, () => new Food(s, this.random))
    this.organisms = Array.from(
      { length: s.org_num },
      (_, i) => new Organism(s, this.random, randomBrain(this.random, s.org_inodes, s.hnodes, s.onodes), `gen[x]-org[${i}]`),
    )
    this.predators = s.pred_create
      ? Array.from(
          { length: s.pred_num },
          (_, i) => new Predator(s, this.random, randomBrain(this.random, s.pred_inodes, s.hnodes, s.onodes), `gen[x]-pred[${i}]`),
        )
      : []
  }

  /** One tick. Returns the stats of the generation if this tick finished it, otherwise null. */
  step(): GenerationStats | null {
    this.shuffleOrganisms()
    this.herbivoresLookAndEat()
    this.predatorsLookHuntAndEat()
    for (const food of this.foods) food.respawn(this.settings, this.random)
    for (const org of this.organisms) org.think(this.settings)
    for (const pred of this.predators) pred.think(this.settings)

    this.tick++
    return this.tick >= this.settings.ticks ? this.endGeneration() : null
  }

  /** Runs the rest of the current generation and returns its stats. */
  runGeneration(): GenerationStats {
    for (;;) {
      const stats = this.step()
      if (stats) return stats
    }
  }

  private herbivoresLookAndEat(): void {
    const s = this.settings
    for (const org of this.organisms) {
      // closest food; eat food within reach of the path travelled this tick
      let closest = s.org_vision_dist
      for (const food of this.foods) {
        // dead organisms do not eat; eaten food (waiting for respawn at the end of the tick) is not a target
        if (!org.alive || food.energy === 0) continue
        const d = dist(org, food)
        if (d < closest) {
          closest = d
          org.xToFood = food.x - org.x
          org.yToFood = food.y - org.y
        }
        if (pathDist(org, food) <= s.org_eat_dist) {
          org.fitness += food.energy
          food.energy = 0
        }
      }

      // closest living predator (no predator visible -> zero input)
      org.xToPredator = 0
      org.yToPredator = 0
      closest = s.org_vision_dist
      for (const pred of this.predators) {
        if (!org.alive || !pred.alive) continue
        const d = dist(org, pred)
        if (d < closest) {
          closest = d
          org.xToPredator = pred.x - org.x
          org.yToPredator = pred.y - org.y
        }
      }

      // closest other herbivore; touching costs energy (eaten bodies are gone)
      closest = s.org_vision_dist
      for (const other of this.organisms) {
        if (other === org || other.eaten) continue
        const d = dist(org, other)
        if (d < closest) {
          closest = d
          org.xToNeighbour = other.x - org.x
          org.yToNeighbour = other.y - org.y
        }
        if (d <= s.org_org_dist) org.fitness -= s.org_org_penalty
      }
    }
  }

  private predatorsLookHuntAndEat(): void {
    const s = this.settings
    for (const pred of this.predators) {
      // look around: closest prey and closest body (nothing visible -> zero input)
      pred.xToFood = pred.yToFood = pred.xToBody = pred.yToBody = 0
      let closestPrey = s.pred_vision_dist
      let closestBody = s.pred_vision_dist
      for (const org of this.organisms) {
        if (!pred.alive || org.eaten) continue
        const d = dist(pred, org)
        if (org.alive && d < closestPrey) {
          closestPrey = d
          pred.xToFood = org.x - pred.x
          pred.yToFood = org.y - pred.y
        }
        if (!org.alive && d < closestBody) {
          closestBody = d
          pred.xToBody = org.x - pred.x
          pred.yToBody = org.y - pred.y
        }
      }

      // a body in sight has priority: the predator does not hunt (no kills, prey is not a target);
      // 'closer' mode: only when the body is closer than any living prey
      let hunting = closestBody >= s.pred_vision_dist
      if (s.pred_body_priority === 'closer') hunting = hunting || closestPrey < closestBody
      if (!hunting) pred.xToFood = pred.yToFood = 0

      // contact along the predator's path: kill a living herbivore (only when hunting, no energy yet) or eat a body -
      // the same energy whether it was killed or died by itself
      for (const org of this.organisms) {
        if (!pred.alive || org.eaten) continue
        const d = pathDist(pred, org)
        if (org.alive) {
          if (hunting && d <= s.pred_eat_dist) {
            org.fitness = 0
            org.killed = true
          }
        } else if (org.edible && d <= s.pred_body_eat_dist) {
          pred.fitness += s.pred_carrion_energy
          org.eaten = true
        }
      }

      // closest other predator; touching costs energy
      let closest = s.pred_vision_dist
      for (const other of this.predators) {
        if (other === pred) continue
        const d = dist(pred, other)
        if (d < closest) {
          closest = d
          pred.xToNeighbour = other.x - pred.x
          pred.yToNeighbour = other.y - pred.y
        }
        if (d <= s.pred_pred_dist) pred.fitness -= s.pred_pred_penalty
      }
    }
  }

  private endGeneration(): GenerationStats {
    const s = this.settings
    const stats = generationStats(this.generation, this.organisms, this.predators)
    this.history.push(stats)

    const gen = this.generation
    this.organisms = evolve(
      this.organisms, s.elitism_org, s, this.random,
      (brain, name) => new Organism(s, this.random, brain, name),
      (i) => `gen[${gen}]-org[${i}]`,
    )
    this.predators = evolve(
      this.predators, s.elitism_pred, s, this.random,
      (brain, name) => new Predator(s, this.random, brain, name),
      (i) => `gen[${gen}]-pred[${i}]`,
    )
    this.generation++
    this.tick = 0
    return stats
  }

  /** Fisher-Yates shuffle: herbivores act in a random order every tick (who reaches food first). */
  private shuffleOrganisms(): void {
    const a = this.organisms
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.random.int(i + 1)
      ;[a[i], a[j]] = [a[j], a[i]]
    }
  }
}
