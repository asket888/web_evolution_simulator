import { useEffect, useRef } from 'react'
import { Random } from './sim/random'

const ARENA = 8 // the aquarium is 8x8 like in the Python version

/** Placeholder aquarium until the simulation core is ported: a few herbivores, predators and food. */
function App() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const size = ctx.canvas.width
    const scale = size / ARENA
    const random = new Random(333)
    const dot = (color: string, radius: number) => {
      ctx.beginPath()
      ctx.arc(random.uniform(0, size), random.uniform(0, size), radius * scale, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    }

    ctx.fillStyle = '#e8f4fb'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 15; i++) dot('#5b5bd6', 0.03)
    for (let i = 0; i < 30; i++) dot('#3fb950', 0.05)
    for (let i = 0; i < 4; i++) dot('#e5484d', 0.07)
  }, [])

  return (
    <main className="app">
      <h1>Evolution simulator</h1>
      <canvas ref={canvas} className="aquarium" width={480} height={480} />
      <p>Herbivores and predators that learn to survive. The simulation is coming soon.</p>
    </main>
  )
}

export default App
