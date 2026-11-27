// config.js — every tunable number and stage definition for Turkey Run.
// One job: constants. No game logic lives here, so tuning never touches code.

export const VIEW = { width: 1280, height: 720, groundY: 620, topY: 340 };

export const TURKEY = {
  x: 230,
  width: 74,
  height: 64,
  minY: 380,
  maxY: 600,
  moveSpeed: 340,
  jumpVelocity: -720,
  gravity: 2100,
  dashSpeed: 620,
  dashTime: 0.28,
  dashCooldown: 1.1,
};

// Farmer pressure: 0 = far behind, 100 = caught. Rises slowly on its own,
// jumps up on every stumble, falls when the turkey grabs corn or dashes.
export const FARMER = {
  width: 86,
  height: 118,
  baseRisePerSecond: 1.6,
  hitPenalty: 26,
  slowPenalty: 10,
  cornRelief: 7,
  dashRelief: 4,
  resetAfterCatch: 30,
};

export const PLAYER = { lives: 3, invincibleSeconds: 1.6 };

// Each stage is one stretch of the escape: 900 metres, then the next stage.
export const STAGES = [
  {
    name: 'Farmyard',
    subtitle: 'Kabur dari kandang!',
    sky: ['#f7b267', '#e07a5f', '#8d5a3b'],
    ground: '#7a5230',
    grass: '#c98f3d',
    spawnEvery: 1.15,
    speed: 300,
    obstacles: ['fence', 'hay', 'puddle'],
    collectibles: ['corn', 'corn', 'feather'],
  },
  {
    name: 'Cornfield',
    subtitle: 'Lewati ladang jagung!',
    sky: ['#f4a259', '#d97b29', '#6b4423'],
    ground: '#6e4a26',
    grass: '#e0a458',
    spawnEvery: 0.95,
    speed: 360,
    obstacles: ['fence', 'hay', 'dog', 'scarecrow'],
    collectibles: ['corn', 'corn', 'feather', 'pumpkin'],
  },
  {
    name: 'Kitchen Dash',
    subtitle: 'Hindari pisau dan oven!',
    sky: ['#e07a5f', '#b5533c', '#4a2c2a'],
    ground: '#5d3a2e',
    grass: '#a8653f',
    spawnEvery: 0.8,
    speed: 420,
    obstacles: ['knife', 'oven', 'dog', 'fence'],
    collectibles: ['corn', 'feather', 'pumpkin'],
  },
];

export const STAGE_LENGTH_METRES = 900;

export const SCORE = {
  metre: 1,
  corn: 10,
  feather: 25,
  pumpkin: 50,
  stageBonus: 200,
};

export const STORAGE_KEY = 'turkey-run-best-v1';
