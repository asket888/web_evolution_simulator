import { useEffect, useRef, useState } from 'react'
import { defaultSettings } from './sim/settings'
import type { GenerationStats } from './sim/stats'
import { World } from './sim/world'
import { drawAquarium } from './ui/drawAquarium'
import { HistoryChart } from './ui/HistoryChart'

const SPEEDS = [
  { label: '¼×', ticksPerFrame: 0.25 },
  { label: '1×', ticksPerFrame: 1 },
  { label: '3×', ticksPerFrame: 3 },
  { label: '10×', ticksPerFrame: 10 },
  { label: '30×', ticksPerFrame: 30 },
]
const SKIP_GENERATIONS = 10
const GENERATIONS_PER_FRAME_WHEN_SKIPPING = 2
const PANEL_UPDATE_EVERY_FRAMES = 6

/** What the panel shows: a snapshot of the world, so React re-renders from state, not from the mutable world. */
interface View {
  generation: number
  tick: number
  ticks: number
  history: GenerationStats[]
  skipLeft: number
}

function snapshot(world: World, skipLeft: number): View {
  return {
    generation: world.generation,
    tick: world.tick,
    ticks: world.settings.ticks,
    history: [...world.history],
    skipLeft,
  }
}

function App() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const world = useRef<World | null>(null)
  const skipLeft = useRef(0)
  const [view, setView] = useState<View | null>(null)
  const [seed, setSeed] = useState(defaultSettings.seed)
  // every 'New world' click creates a new world, even with the same seed
  const [worldKey, setWorldKey] = useState({ seed: defaultSettings.seed, run: 0 })
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)

  // a new world for every "New world" click
  useEffect(() => {
    world.current = new World({ ...defaultSettings, seed: worldKey.seed })
    skipLeft.current = 0
    setView(snapshot(world.current, 0))
  }, [worldKey])

  // animation loop: simulate, draw the aquarium, refresh the panel a few times per second
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    let frame = 0
    let pending = 0 // fractional ticks for slow speeds
    let id = 0

    const loop = () => {
      const w = world.current
      if (w) {
        const skipping = skipLeft.current > 0
        if (skipping) {
          for (let i = 0; i < GENERATIONS_PER_FRAME_WHEN_SKIPPING && skipLeft.current > 0; i++) {
            w.runGeneration()
            skipLeft.current--
          }
        } else if (playing) {
          pending += SPEEDS[speed].ticksPerFrame
          for (; pending >= 1; pending--) w.step()
        }
        drawAquarium(ctx, w)
        if (skipping || ++frame % PANEL_UPDATE_EVERY_FRAMES === 0) setView(snapshot(w, skipLeft.current))
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [playing, speed, worldKey])

  const last = view?.history.at(-1)
  const skipping = (view?.skipLeft ?? 0) > 0

  return (
    <main className="app">
      <h1>Evolution simulator</h1>

      <canvas ref={canvas} className="aquarium" width={480} height={480} />

      {view && (
        <section className="status">
          <span>
            Generation <b>{view.generation}</b>
          </span>
          <span>
            tick {view.tick} / {view.ticks}
          </span>
          {skipping && <span className="skipping">fast-forward: {view.skipLeft} left</span>}
        </section>
      )}

      <section className="controls">
        <button onClick={() => setPlaying((p) => !p)} disabled={skipping}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <div className="speeds" role="group" aria-label="Speed">
          {SPEEDS.map((s, i) => (
            <button key={s.label} className={i === speed ? 'active' : ''} onClick={() => setSpeed(i)}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={() => (skipLeft.current += SKIP_GENERATIONS)}>+{SKIP_GENERATIONS} generations</button>
      </section>

      <section className="controls">
        <label>
          Seed <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
        </label>
        <button onClick={() => setWorldKey((k) => ({ seed, run: k.run + 1 }))}>New world</button>
      </section>

      {last && view && (
        <section className="stats">
          <h2>Generation {last.generation}</h2>
          <p>
            <b className="herbivore">Herbivores</b> survived {last.survived}/{last.count} · killed {last.killed} · died{' '}
            {last.died} · energy best {last.best.toFixed(1)}, avg {last.avg.toFixed(1)}
          </p>
          {last.predCount > 0 && (
            <p>
              <b className="predator">Predators</b> survived {last.predSurvived}/{last.predCount} · bodies eaten{' '}
              {last.bodiesEaten} · energy avg {last.predAvg.toFixed(1)}
            </p>
          )}
          <HistoryChart history={view.history} />
        </section>
      )}
    </main>
  )
}

export default App
