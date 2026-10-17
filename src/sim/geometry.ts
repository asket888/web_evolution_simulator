export interface Point {
  x: number
  y: number
}

/** Something that moved during the last tick: from (xTail, yTail) to (x, y). */
export interface Mover extends Point {
  xTail: number
  yTail: number
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Closest distance from the target to the path travelled by the mover during the last tick (tail -> position). */
export function pathDist(mover: Mover, target: Point): number {
  const pathX = mover.x - mover.xTail
  const pathY = mover.y - mover.yTail
  const pathLenSq = pathX ** 2 + pathY ** 2
  if (pathLenSq === 0) return dist(mover, target)
  let t = ((target.x - mover.xTail) * pathX + (target.y - mover.yTail) * pathY) / pathLenSq
  t = Math.min(Math.max(t, 0), 1)
  return Math.hypot(target.x - (mover.xTail + t * pathX), target.y - (mover.yTail + t * pathY))
}
