/**
 * Simulation parameters. Names and default values are the same as in the Python version (settings.py),
 * so both versions can be compared one to one.
 */
export interface Settings {
  // evolution
  gens: number // number of generations
  org_num: number // number of herbivores
  food_num: number // number of food particles
  pred_num: number // number of predators
  elitism_org: number // share of herbivores that survive unchanged and become parents
  elitism_pred: number // share of predators that survive unchanged and become parents
  mutate: number // probability to mutate each weight of a child
  mutate_sigma: number // std of gaussian noise added to a mutated weight

  // food
  food_energy: number // energy of one food particle

  // herbivores
  org_radius: number // body radius: touches walls with its edge (also the drawn size)
  org_vision_dist: number
  org_momentum: number // velocity kept from the previous tick
  org_thrust: number // how much the network output changes velocity per tick
  org_max_velocity: number
  org_start_fitness: number // start energy
  org_eat_dist: number // reach for food (from the path travelled during a tick)
  org_org_dist: number // touching distance between herbivores
  org_org_penalty: number // energy lost per tick for touching another herbivore
  org_hunger_penalty: number // energy lost every tick
  org_wall_penalty: number // energy lost per tick at a wall

  // predators
  pred_create: boolean
  pred_radius: number
  pred_vision_dist: number
  pred_momentum: number
  pred_thrust: number
  pred_max_velocity: number
  pred_start_fitness: number
  pred_eat_dist: number // reach to kill a living herbivore (from the path)
  pred_body_eat_dist: number // reach to eat a dead body (from the path)
  pred_carrion_energy: number // energy for eating a body (killed or died by itself)
  pred_body_priority: 'always' | 'closer' // no hunting while a body is in sight / only if it is closer than any prey
  pred_pred_dist: number
  pred_pred_penalty: number
  pred_hunger_penalty: number
  pred_wall_penalty: number

  // simulation
  seed: number
  ticks: number // time steps in a generation
  corpse_momentum: number // dead bodies drift by inertia and slow down by this factor per tick
  x_min: number
  x_max: number
  y_min: number
  y_max: number

  // neural network
  org_inodes: number // herbivore inputs: velocity, food, neighbour, predator threat (x, y each)
  pred_inodes: number // predator inputs: velocity, prey, neighbour, body (x, y each)
  hnodes: number
  onodes: number
}

export const defaultSettings: Settings = {
  gens: 100,
  org_num: 30,
  food_num: 15,
  pred_num: 4,
  elitism_org: 0.35,
  elitism_pred: 0.5,
  mutate: 0.1,
  mutate_sigma: 0.5,

  food_energy: 2,

  org_radius: 0.07,
  org_vision_dist: 5,
  org_momentum: 0.9,
  org_thrust: 0.2,
  org_max_velocity: 1.0,
  org_start_fitness: 5,
  org_eat_dist: 0.15,
  org_org_dist: 0.1,
  org_org_penalty: 0.06,
  org_hunger_penalty: 0.07,
  org_wall_penalty: 0.03,

  pred_create: true,
  pred_radius: 0.1,
  pred_vision_dist: 10,
  pred_momentum: 0.8125,
  pred_thrust: 0.3,
  pred_max_velocity: 0.8,
  pred_start_fitness: 7,
  pred_eat_dist: 0.1,
  pred_body_eat_dist: 0.2,
  pred_carrion_energy: 6,
  pred_body_priority: 'always',
  pred_pred_dist: 0.2,
  pred_pred_penalty: 0.2,
  pred_hunger_penalty: 0.07,
  pred_wall_penalty: 0.03,

  seed: 333,
  ticks: 100,
  corpse_momentum: 0.7,
  x_min: -3,
  x_max: 3,
  y_min: -3,
  y_max: 3,

  org_inodes: 8,
  pred_inodes: 8,
  hnodes: 5,
  onodes: 2,
}
