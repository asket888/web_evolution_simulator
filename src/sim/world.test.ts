import { describe, expect, it } from 'vitest'
import type { Brain } from './brain.ts'
import { Organism, Predator } from './creature.ts'
import { child, evolve } from './evolution.ts'
import { Food } from './food.ts'
import { pathDist } from './geometry.ts'
import { Random } from './random.ts'
import { defaultSettings, type Settings } from './settings.ts'
import { World } from './world.ts'

const s: Settings = { ...defaultSettings }
const random = new Random(1)
const zeroBrain = (inodes: number): Brain => ({
  wih: Array.from({ length: s.hnodes }, () => Array(inodes).fill(0)),
  who: Array.from({ length: s.onodes }, () => Array(s.hnodes).fill(0)),
})

function org(x: number, y: number): Organism {
  const o = new Organism(s, random, zeroBrain(s.org_inodes), 'org')
  o.x = o.xTail = x
  o.y = o.yTail = y
  return o
}

function pred(xTail: number, yTail: number, x: number, y: number): Predator {
  const p = new Predator(s, random, zeroBrain(s.pred_inodes), 'pred')
  Object.assign(p, { xTail, yTail, x, y })
  return p
}

/** A world with exactly the given creatures and food, everything else empty. */
function world(organisms: Organism[], predators: Predator[] = [], foods: Food[] = []): World {
  const w = new World({ ...s, org_num: 0, pred_num: 0, food_num: 0 })
  w.organisms = organisms
  w.predators = predators
  w.foods = foods
  return w
}

function food(x: number, y: number): Food {
  const f = new Food(s, random)
  f.x = x
  f.y = y
  return f
}

describe('geometry', () => {
  const mover = { xTail: -1, yTail: 0, x: 1, y: 0 }
  it.each([
    ['flew through the target', { x: 0, y: 0 }, 0],
    ['flew past 0.1 away', { x: 0, y: 0.1 }, 0.1],
    ['stopped 0.12 before the target', { x: 1.12, y: 0 }, 0.12],
    ['target behind the start', { x: -1.5, y: 0 }, 0.5],
  ])('path distance: %s', (_, target, expected) => {
    expect(pathDist(mover, target)).toBeCloseTo(expected)
  })
})

describe('herbivores', () => {
  it('eat food lying on the path travelled during the tick', () => {
    const o = org(0, 0)
    Object.assign(o, { xTail: -1, x: 1 })
    const f = food(0, 0.1)
    const fitness = o.fitness
    world([o], [], [f]).step()
    expect(o.fitness).toBeCloseTo(fitness + s.food_energy - s.org_hunger_penalty)
  })

  it('dead herbivores do not eat', () => {
    const o = org(0, 0)
    o.fitness = -1
    const f = food(0, 0)
    world([o], [], [f]).step()
    expect(o.fitness).toBeLessThan(0)
  })

  it('lose energy for touching another herbivore (current positions)', () => {
    const a = org(0, 0)
    const b = org(0.05, 0)
    const w = world([a, b])
    w.step()
    expect(a.fitness).toBeCloseTo(s.org_start_fitness - s.org_org_penalty - s.org_hunger_penalty)
  })

  it('sense a predator as a threat that grows when it comes closer', () => {
    const o = org(0, 0)
    o.xToPredator = 4
    const far = o.inputs()[6]
    o.xToPredator = 1
    const near = o.inputs()[6]
    expect(far).toBeCloseTo(0.2)
    expect(near).toBeCloseTo(0.8)
    o.xToPredator = 0
    expect(o.inputs()[6]).toBe(0)
  })
})

describe('creatures', () => {
  it('stop when the edge of the body touches a wall, lose the velocity into it and pay the wall penalty', () => {
    const o = org(3.8, 0)
    o.xVelocity = 0.9
    o.brain.who[0][0] = 0 // no thrust
    o.think(s)
    expect(o.x).toBeCloseTo(s.x_max + 1 - s.org_radius)
    expect(o.xVelocity).toBe(0)
    expect(o.fitness).toBeCloseTo(s.org_start_fitness - s.org_hunger_penalty - s.org_wall_penalty)
  })

  it('keep the sign when the speed is clamped', () => {
    const p = pred(0, 0, 0, 0)
    p.xVelocity = -5 // no thrust (zero brain): -5 * momentum is still far beyond the limit
    p.think(s)
    expect(p.xVelocity).toBe(-s.pred_max_velocity)
  })

  it('dead bodies drift by inertia and slow down', () => {
    const o = org(0, 0)
    o.fitness = 0
    o.xVelocity = 0.6
    const xs: number[] = []
    for (let i = 0; i < 6; i++) {
      o.think(s)
      xs.push(o.x)
    }
    expect(xs[5]).toBeGreaterThan(xs[0])
    expect(xs[5] - xs[4]).toBeLessThan(xs[1] - xs[0])
    expect(xs[5]).toBeLessThan((0.6 * s.corpse_momentum) / (1 - s.corpse_momentum) + 1e-9)
  })
})

describe('predators', () => {
  it('kill a living herbivore on their path, get no energy, the body stays', () => {
    const p = pred(-1, 0, 1, 0)
    const o = org(0, 0.05)
    const energy = p.fitness
    world([o], [p]).step()
    expect(o.killed).toBe(true)
    expect(o.alive).toBe(false)
    expect(o.eaten).toBe(false)
    expect(p.fitness).toBeCloseTo(energy - s.pred_hunger_penalty)
  })

  it('cannot eat a body in the same tick it was killed, but eat it on the next approach', () => {
    const p = pred(-1, 0, 1, 0)
    const o = org(0, 0.05)
    const w = world([o], [p])
    w.step()
    expect(o.eaten).toBe(false)
    expect(o.edible).toBe(true)
    // the predator comes back along the same line
    Object.assign(p, { xTail: 1, yTail: 0, x: -1, y: 0, xVelocity: 0, yVelocity: 0 })
    Object.assign(o, { x: 0, y: 0.05, xTail: 0, yTail: 0.05, xVelocity: 0, yVelocity: 0 })
    const energy = p.fitness
    w.step()
    expect(o.eaten).toBe(true)
    expect(p.fitness).toBeCloseTo(energy + s.pred_carrion_energy - s.pred_hunger_penalty)
  })

  it('eat a herbivore that died by itself for the same energy', () => {
    const o = org(0, 0.15)
    o.fitness = 0.01
    o.think(s) // starves this tick, edible from the next one
    const p = pred(-1, 0, 1, 0)
    const energy = p.fitness
    world([o], [p]).step()
    expect(o.eaten).toBe(true)
    expect(p.fitness).toBeCloseTo(energy + s.pred_carrion_energy - s.pred_hunger_penalty)
  })

  it('do not hunt while a body is in sight', () => {
    const body = org(3, 3)
    body.fitness = -1
    body.edible = true
    const prey = org(0, 0.05)
    const p = pred(-1, 0, 1, 0)
    world([body, prey], [p]).step()
    expect(prey.killed).toBe(false)
    expect(p.xToFood).toBe(0) // prey is not a target
    expect(p.xToBody).toBeCloseTo(2) // but the body is
  })

  it('dead predators do not hunt', () => {
    const p = pred(-1, 0, 1, 0)
    p.fitness = 0
    const o = org(0, 0)
    world([o], [p]).step()
    expect(o.killed).toBe(false)
  })
})

describe('evolution', () => {
  it('crossover takes every hidden neuron whole from one parent', () => {
    const a = zeroBrain(s.org_inodes)
    const b: Brain = {
      wih: a.wih.map((row) => row.map(() => 1)),
      who: a.who.map((row) => row.map(() => 1)),
    }
    const kid = child(a, b, { ...s, mutate: 0 }, new Random(3))
    kid.wih.forEach((row, n) => {
      expect(new Set(row).size).toBe(1)
      expect(kid.who.every((out) => out[n] === row[0])).toBe(true)
    })
  })

  it('keeps the best creatures unchanged and refills the population', () => {
    const r = new Random(5)
    const old = Array.from({ length: 10 }, (_, i) => {
      const o = org(0, 0)
      o.fitness = i
      return o
    })
    const next = evolve(old, 0.3, s, r, (brain, name) => new Organism(s, r, brain, name), (i) => `child${i}`)
    expect(next).toHaveLength(10)
    expect(next.slice(0, 3).map((o) => o.brain)).toEqual([old[9].brain, old[8].brain, old[7].brain])
    expect(next[3].name).toBe('child0')
  })
})

describe('world', () => {
  it('the same seed gives the same run', () => {
    const run = () => {
      const w = new World({ ...s, seed: 7 })
      return [w.runGeneration(), w.runGeneration()]
    }
    expect(run()).toEqual(run())
  })

  it('a generation lasts settings.ticks ticks and breeds a full new population', () => {
    const w = new World(s)
    let ticks = 0
    while (!w.step()) ticks++
    expect(ticks + 1).toBe(s.ticks)
    expect(w.generation).toBe(2)
    expect(w.organisms).toHaveLength(s.org_num)
    expect(w.predators).toHaveLength(s.pred_num)
    expect(w.history).toHaveLength(1)
  })
})
