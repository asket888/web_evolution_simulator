import type { Random } from './random.ts'

/** Neural network with one hidden layer: inputs -> tanh hidden layer -> tanh outputs (scaled to [-0.5, 0.5]). */
export interface Brain {
  wih: number[][] // weights input -> hidden, rows are hidden neurons
  who: number[][] // weights hidden -> output, columns are hidden neurons
}

export function randomBrain(random: Random, inodes: number, hnodes: number, onodes: number): Brain {
  const matrix = (rows: number, cols: number) =>
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => random.uniform(-1, 1)))
  return { wih: matrix(hnodes, inodes), who: matrix(onodes, hnodes) }
}

export function think(brain: Brain, inputs: number[]): number[] {
  const hidden = brain.wih.map((row) => Math.tanh(dot(row, inputs)))
  return brain.who.map((row) => Math.tanh(dot(row, hidden)) * 0.5)
}

function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}
