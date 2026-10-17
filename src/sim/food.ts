import type { Random } from './random.ts'
import type { Settings } from './settings.ts'

export class Food {
  x: number
  y: number
  energy: number

  constructor(settings: Settings, random: Random) {
    this.x = random.uniform(settings.x_min - 1, settings.x_max + 1)
    this.y = random.uniform(settings.y_min - 1, settings.y_max + 1)
    this.energy = settings.food_energy
  }

  /** Eaten food reappears at a random place (called at the end of every tick). */
  respawn(settings: Settings, random: Random): void {
    if (this.energy === 0) {
      this.x = random.uniform(settings.x_min - 1, settings.x_max + 1)
      this.y = random.uniform(settings.y_min - 1, settings.y_max + 1)
      this.energy = settings.food_energy
    }
  }
}
