/**
 * Seeded pseudo-random generator (mulberry32): the same seed gives the same simulation run,
 * like `seed` in the Python version.
 */
export class Random {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Uniform float in [min, max). */
  uniform(min: number, max: number): number {
    return min + (max - min) * this.next()
  }

  /** Normally distributed float (Box-Muller). */
  normal(mean = 0, std = 1): number {
    const u = 1 - this.next() // (0, 1], so the log is finite
    const v = this.next()
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  /** Integer in [0, max). */
  int(max: number): number {
    return Math.floor(this.next() * max)
  }
}
