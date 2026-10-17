import type { GenerationStats } from '../sim/stats.ts'

const WIDTH = 480
const HEIGHT = 160
const PAD = { left: 32, right: 8, top: 8, bottom: 20 }

const LINES: { label: string; color: string; dash?: string; value: (g: GenerationStats) => number }[] = [
  { label: 'Herbivores survived', color: '#3fb950', value: (g) => g.survived / g.count },
  { label: 'Predators survived', color: '#e5484d', value: (g) => (g.predCount ? g.predSurvived / g.predCount : NaN) },
  { label: 'Herbivores killed', color: '#9b1c1f', dash: '4 3', value: (g) => g.killed / g.count },
]

/** Survival of both species and kills by generation, in % of the population. */
export function HistoryChart({ history }: { history: GenerationStats[] }) {
  const n = Math.max(history.length, 2)
  const x = (i: number) => PAD.left + (i / (n - 1)) * (WIDTH - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - v) * (HEIGHT - PAD.top - PAD.bottom)

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Survival by generation">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(v)} y2={y(v)} className="grid" />
            <text x={PAD.left - 4} y={y(v) + 4} textAnchor="end">{v * 100}%</text>
          </g>
        ))}
        <text x={WIDTH - PAD.right} y={HEIGHT - 4} textAnchor="end">generation {history.length}</text>
        {LINES.map((line) => {
          const points = history
            .map((g, i) => [x(i), y(line.value(g))])
            .filter(([, py]) => !Number.isNaN(py))
            .map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`)
            .join(' ')
          return <polyline key={line.label} points={points} fill="none" stroke={line.color} strokeWidth={1.5} strokeDasharray={line.dash} />
        })}
      </svg>
      <figcaption>
        {LINES.map((line) => (
          <span key={line.label} className="legend">
            <i style={{ background: line.color }} /> {line.label}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
