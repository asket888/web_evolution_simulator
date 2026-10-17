import { describe, expect, it } from 'vitest'
import { Random } from './random'

describe('Random', () => {
  it('gives the same sequence for the same seed', () => {
    const a = new Random(333)
    const b = new Random(333)
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()))
  })

  it('gives different sequences for different seeds', () => {
    expect(new Random(1).next()).not.toEqual(new Random(2).next())
  })

  it('keeps uniform values in range', () => {
    const r = new Random(7)
    for (let i = 0; i < 10_000; i++) {
      const x = r.uniform(-4, 4)
      expect(x).toBeGreaterThanOrEqual(-4)
      expect(x).toBeLessThan(4)
    }
  })

  it('produces normal values with the requested mean and std', () => {
    const r = new Random(42)
    const xs = Array.from({ length: 50_000 }, () => r.normal(1, 0.5))
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length
    const std = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length)
    expect(mean).toBeCloseTo(1, 1)
    expect(std).toBeCloseTo(0.5, 1)
  })
})
