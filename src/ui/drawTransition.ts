import type { GenerationStats } from '../sim/stats.ts'

/** Fog over the aquarium between generations: blur, dim and the number of the next generation. */
export interface Transition {
  from: HTMLCanvasElement // the last frame of the finished generation
  finished: GenerationStats
  duration: number // ms
  elapsed: number // ms
}

const MAX_BLUR = 6 // px
const MAX_FOG = 0.75

/**
 * The first half shows the last frame of the finished generation fading into fog, the second half shows the new
 * generation coming out of it (`drawNew` draws the current world).
 */
export function drawTransition(ctx: CanvasRenderingContext2D, t: Transition, drawNew: () => void): void {
  const progress = Math.min(t.elapsed / t.duration, 1)
  const fog = Math.sin(Math.PI * progress) // 0 -> 1 -> 0

  const size = ctx.canvas.width
  ctx.save()
  ctx.filter = `blur(${(MAX_BLUR * fog).toFixed(1)}px)`
  if (progress < 0.5) ctx.drawImage(t.from, 0, 0)
  else drawNew()
  ctx.restore()

  drawFog(ctx, MAX_FOG * fog)
  drawTitle(ctx, size, Math.min(1, fog * 1.5), `Generation ${t.finished.generation + 1}`, summary(t.finished))
}

/** Fast-forward: the world keeps changing under the fog, the title shows the running generation number. */
export function drawFastForward(ctx: CanvasRenderingContext2D, generation: number, left: number): void {
  drawFog(ctx, MAX_FOG)
  drawTitle(ctx, ctx.canvas.width, 1, `Generation ${generation}`, `fast-forward: ${left} left`)
}

function summary(g: GenerationStats): string {
  const herbivores = `herbivores ${g.survived}/${g.count}`
  return `Generation ${g.generation}: ${g.predCount ? `${herbivores} · predators ${g.predSurvived}/${g.predCount}` : herbivores}`
}

function drawFog(ctx: CanvasRenderingContext2D, alpha: number): void {
  ctx.fillStyle = `rgba(232, 244, 251, ${alpha.toFixed(3)})`
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

function drawTitle(ctx: CanvasRenderingContext2D, size: number, alpha: number, title: string, subtitle: string): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#1c2024'
  ctx.font = `600 ${Math.round(size * 0.085)}px system-ui, 'Segoe UI', Roboto, sans-serif`
  ctx.fillText(title, size / 2, size * 0.46)
  ctx.fillStyle = '#57606a'
  ctx.font = `${Math.round(size * 0.035)}px system-ui, 'Segoe UI', Roboto, sans-serif`
  ctx.fillText(subtitle, size / 2, size * 0.56)
  ctx.restore()
}
