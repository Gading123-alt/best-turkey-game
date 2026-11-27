// world.js — the farm the turkey runs through: stages, spawning, distance.
// Spawning is seeded, so the same seed grows the same farm every time.
// Obstacles and treats are plain objects; obstacles.js owns their behaviour.

import { STAGES, STAGE_LENGTH_METRES } from './config.js';
import { pick, range } from './random.js';

const LANES = [400, 480, 560];

export class World {
  constructor(rng) {
    this.rng = rng;
    this.stageIndex = 0;
    this.distance = 0;
    this.speed = STAGES[0].speed;
    this.spawnTimer = 0.6;
    this.obstacles = [];
    this.treats = [];
    this.leaves = [];
    for (let i = 0; i < 26; i += 1) {
      this.leaves.push({
        x: this.rng() * 1280,
        y: this.rng() * 500,
        size: 5 + this.rng() * 7,
        sway: this.rng() * 6.28,
        fall: 14 + this.rng() * 22,
        color: pick(this.rng, ['#e07a2f', '#d9a441', '#b5533c', '#c98f3d']),
      });
    }
  }

  get stage() {
    // After the last stage the farm keeps its final look behind the win screen.
    return STAGES[Math.min(this.stageIndex, STAGES.length - 1)];
  }

  get stageProgress() {
    return Math.min(1, this.distance / STAGE_LENGTH_METRES);
  }

  get finished() {
    return this.stageIndex >= STAGES.length;
  }

  // One step of the world. Returns 'stage' when a stage is completed.
  update(dt, playing) {
    for (const leaf of this.leaves) {
      leaf.y += leaf.fall * dt;
      leaf.sway += dt * 2;
      leaf.x += Math.sin(leaf.sway) * 12 * dt;
      if (leaf.y > 720) {
        leaf.y = -10;
        leaf.x = this.rng() * 1280;
      }
    }
    if (!playing) return null;
    this.distance += this.speed * dt * 0.06;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.stage.spawnEvery * (0.85 + this.rng() * 0.3);
      this.spawnRow();
    }
    if (this.distance >= STAGE_LENGTH_METRES) {
      this.distance = 0;
      this.stageIndex += 1;
      this.obstacles = [];
      this.treats = [];
      if (!this.finished) {
        this.speed = STAGES[this.stageIndex].speed;
      }
      return 'stage';
    }
    return null;
  }

  spawnRow() {
    const stage = this.stage;
    const kind = pick(this.rng, stage.obstacles);
    const lane = pick(this.rng, LANES);
    const x = 1300 + this.rng() * 120;
    if (kind === 'dog') {
      this.obstacles.push({ kind, x, y: lane - 10, w: 78, h: 52, speed: 130, bob: 0 });
    } else if (kind === 'knife') {
      this.obstacles.push({ kind, x, y: -90, w: 26, h: 84, speed: 0, fall: 520, bob: 0 });
    } else if (kind === 'oven') {
      this.obstacles.push({ kind, x, y: 560, w: 96, h: 60, speed: 0, flame: 0, bob: 0 });
    } else if (kind === 'fence') {
      this.obstacles.push({ kind, x, y: 556, w: 70, h: 64, speed: 0, bob: 0 });
    } else if (kind === 'hay') {
      this.obstacles.push({ kind, x, y: 540, w: 84, h: 80, speed: 0, bob: 0 });
    } else if (kind === 'puddle') {
      this.obstacles.push({ kind, x, y: 600, w: 110, h: 22, speed: 0, bob: 0 });
    } else if (kind === 'scarecrow') {
      this.obstacles.push({ kind, x, y: 520, w: 56, h: 100, speed: 0, bob: 0 });
    }
    // A treat often trails an obstacle, so dodging pays.
    if (this.rng() < 0.62) {
      const treatKind = pick(this.rng, stage.collectibles);
      const treatLane = pick(this.rng, LANES);
      this.treats.push({
        kind: treatKind,
        x: x + 130 + this.rng() * 90,
        y: treatLane,
        w: 40,
        h: 40,
        bob: this.rng() * 6.28,
        taken: false,
      });
    }
  }

  // Move everything left with the scrolling world.
  scroll(dt, turkeyX) {
    const dx = this.speed * dt;
    for (const o of this.obstacles) {
      // Dogs run toward the turkey, so they close in faster than the scroll.
      o.x -= dx + (o.kind === 'dog' ? o.speed * dt : 0);
      if (o.kind === 'knife') {
        o.y += o.fall * dt;
        if (o.y > 640) o.y = -90;
      }
      if (o.kind === 'oven') o.flame += dt * 9;
      o.bob += dt * 6;
    }
    for (const t of this.treats) {
      t.x -= dx;
      t.bob += dt * 4;
    }
    this.obstacles = this.obstacles.filter((o) => o.x > -160);
    this.treats = this.treats.filter((t) => t.x > -80 && !t.taken);
    return turkeyX;
  }
}
