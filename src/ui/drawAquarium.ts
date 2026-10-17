import type { World } from '../sim/world.ts'

const COLORS = {
  water: '#e8f4fb',
  wall: '#9cc3d9',
  food: '#5b5bd6',
  herbivore: '#3fb950',
  herbivoreTail: '#1f7a34',
  body: '#d4a72c',
  predator: '#e5484d',
  predatorTail: '#9b1c1f',
  deadPredator: '#9aa0a6',
}

// creatures are drawn a bit bigger than their touching distance, otherwise they are hard to see on a phone
const RADIUS = { food: 0.04, herbivore: 0.07, predator: 0.1 }

/** Draws the aquarium of the world on a square canvas: walls are at the edge of the canvas. */
export function drawAquarium(ctx: CanvasRenderingContext2D, world: World): void {
  const size = ctx.canvas.width
  const half = world.settings.x_max + 1 // creatures move in [-half, half]
  const scale = size / (2 * half)
  const px = (x: number) => (x + half) * scale
  const py = (y: number) => (half - y) * scale // y grows upwards like in the Python plots

  ctx.fillStyle = COLORS.water
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = COLORS.wall
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, size - 2, size - 2)

  const circle = (x: number, y: number, r: number, color: string) => {
    ctx.beginPath()
    ctx.arc(px(x), py(y), r * scale, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
  }
  const tail = (c: { x: number; y: number; xTail: number; yTail: number }, color: string, width: number) => {
    ctx.beginPath()
    ctx.moveTo(px(c.xTail), py(c.yTail))
    ctx.lineTo(px(c.x), py(c.y))
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.stroke()
  }

  for (const food of world.foods) circle(food.x, food.y, RADIUS.food, COLORS.food)

  for (const org of world.organisms) {
    if (org.eaten) continue
    if (org.alive) {
      tail(org, COLORS.herbivoreTail, 1.5)
      circle(org.x, org.y, RADIUS.herbivore, COLORS.herbivore)
    } else {
      circle(org.x, org.y, RADIUS.herbivore, COLORS.body)
    }
  }

  for (const pred of world.predators) {
    if (pred.alive) {
      tail(pred, COLORS.predatorTail, 2.5)
      circle(pred.x, pred.y, RADIUS.predator, COLORS.predator)
    } else {
      circle(pred.x, pred.y, RADIUS.predator, COLORS.deadPredator)
    }
  }
}
