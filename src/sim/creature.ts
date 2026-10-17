import { think, type Brain } from './brain.ts'
import type { Random } from './random.ts'
import type { Settings } from './settings.ts'

type Kind = 'org' | 'pred'

/** Body and brain shared by herbivores and predators. Settings are read with the kind prefix ('org' / 'pred'). */
export abstract class Creature {
  readonly kind: Kind
  fitness: number // creature energy
  maxVelocity: number
  readonly momentum: number
  readonly thrust: number

  readonly xMax: number
  readonly yMax: number

  x: number
  y: number
  xTail: number
  yTail: number
  xVelocity = 0
  yVelocity = 0

  xToFood = 0 // food for herbivores, prey for predators
  yToFood = 0
  xToNeighbour = 0 // closest creature of the same kind
  yToNeighbour = 0

  readonly brain: Brain
  readonly name: string

  constructor(settings: Settings, kind: Kind, random: Random, brain: Brain, name: string) {
    this.kind = kind
    this.fitness = settings[`${kind}_start_fitness`]
    this.maxVelocity = settings[`${kind}_max_velocity`]
    this.momentum = settings[`${kind}_momentum`]
    this.thrust = settings[`${kind}_thrust`]

    this.xMax = settings.x_max + 1
    this.yMax = settings.y_max + 1

    this.x = random.uniform(settings.x_min - 1, settings.x_max + 1)
    this.y = random.uniform(settings.y_min - 1, settings.y_max + 1)
    this.xTail = this.x
    this.yTail = this.y

    this.brain = brain
    this.name = name
  }

  get alive(): boolean {
    return this.fitness > 0
  }

  inputs(): number[] {
    return [this.xVelocity, this.yVelocity, this.xToFood, this.yToFood, this.xToNeighbour, this.yToNeighbour]
  }

  think(settings: Settings): void {
    const out = think(this.brain, this.inputs())

    this.fitness -= settings[`${this.kind}_hunger_penalty`]

    this.xTail = this.x
    this.yTail = this.y

    if (this.fitness <= 0) {
      // dead creature: no thrust, the body drifts by inertia and slows down
      this.xVelocity *= settings.corpse_momentum
      this.yVelocity *= settings.corpse_momentum
      this.move()
    } else {
      // network output is a thrust, velocity keeps momentum
      this.xVelocity = clamp(out[0] * this.thrust + this.xVelocity * this.momentum, this.maxVelocity)
      this.yVelocity = clamp(out[1] * this.thrust + this.yVelocity * this.momentum, this.maxVelocity)
      this.move()

      if (Math.abs(this.x) >= this.xMax || Math.abs(this.y) >= this.yMax) {
        this.fitness -= settings[`${this.kind}_wall_penalty`]
      }
    }
  }

  /** Hitting a wall stops the movement into it, so the creature does not stay pressed to it. */
  private move(): void {
    this.x += this.xVelocity
    if (Math.abs(this.x) > this.xMax) {
      this.x = Math.sign(this.x) * this.xMax
      this.xVelocity = 0
    }
    this.y += this.yVelocity
    if (Math.abs(this.y) > this.yMax) {
      this.y = Math.sign(this.y) * this.yMax
      this.yVelocity = 0
    }
  }
}

/** Herbivore: looks for food, avoids other herbivores, walls and predators. */
export class Organism extends Creature {
  readonly vision: number
  edible = false // dead body that predators can eat (from the tick after death)
  killed = false // killed by a predator
  eaten = false // eaten by a predator: the body is gone
  xToPredator = 0 // closest visible predator, 0 when none is visible
  yToPredator = 0

  constructor(settings: Settings, random: Random, brain: Brain, name: string) {
    super(settings, 'org', random, brain, name)
    this.vision = settings.org_vision_dist
  }

  /**
   * The predator is sensed as a threat: direction to it scaled by closeness (0 at the edge of vision, 1 at contact),
   * so a far predator does not distract from food and a close one dominates.
   */
  inputs(): number[] {
    let threatX = 0
    let threatY = 0
    const d = Math.hypot(this.xToPredator, this.yToPredator)
    if (d > 0) {
      const closeness = (1 - d / this.vision) / d
      threatX = this.xToPredator * closeness
      threatY = this.yToPredator * closeness
    }
    return [...super.inputs(), threatX, threatY]
  }

  think(settings: Settings): void {
    super.think(settings)
    // a body becomes edible on the tick after death: a predator that killed it has to come back to eat
    this.edible = this.fitness <= 0 && !this.eaten
  }
}

/** Predator: kills herbivores, eats bodies, avoids other predators and walls. */
export class Predator extends Creature {
  xToBody = 0 // closest dead (not eaten) herbivore, 0 when none is visible
  yToBody = 0

  constructor(settings: Settings, random: Random, brain: Brain, name: string) {
    super(settings, 'pred', random, brain, name)
  }

  inputs(): number[] {
    return [...super.inputs(), this.xToBody, this.yToBody]
  }
}

function clamp(value: number, limit: number): number {
  return Math.min(Math.max(value, -limit), limit)
}
