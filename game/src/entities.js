// entities.js — the living things: the turkey, the farmer, the farm dogs.
// Each one owns its own position, motion and mood; main.js decides what
// happens when they meet. All art is drawn by render.js from these states.

import { TURKEY, FARMER, VIEW } from './config.js';

export class Turkey {
  constructor() {
    this.x = TURKEY.x;
    this.y = VIEW.groundY;
    this.groundY = VIEW.groundY;
    this.width = TURKEY.width;
    this.height = TURKEY.height;
    this.vy = 0;
    this.onGround = true;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.invincible = 0;
    this.slowed = 0;
    this.runCycle = 0;
    this.wingFlap = 0;
  }

  get jumping() {
    return !this.onGround;
  }

  update(dt, input, sound) {
    const speed = TURKEY.moveSpeed * (this.slowed > 0 ? 0.45 : 1);
    if (input.left) this.x -= speed * dt;
    if (input.right) this.x += speed * dt;
    if (input.up) this.y -= speed * 0.8 * dt;
    if (input.down) this.y += speed * 0.8 * dt;
    this.x = Math.max(60, Math.min(1150, this.x));
    this.y = Math.max(TURKEY.minY, Math.min(this.groundY, this.y));

    // Jump: only from the ground, with a flap of the wings.
    if (input.pressedJump && this.onGround) {
      this.vy = TURKEY.jumpVelocity;
      this.onGround = false;
      this.wingFlap = 0.35;
      if (sound) sound.jump();
    }
    if (!this.onGround) {
      this.vy += TURKEY.gravity * dt;
      this.y += this.vy * dt;
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.onGround = true;
      }
    }

    // Dash: a short burst forward, then a cooldown.
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (input.pressedDash && this.dashCooldown <= 0 && this.dashTime <= 0) {
      this.dashTime = TURKEY.dashTime;
      this.dashCooldown = TURKEY.dashCooldown;
      if (sound) sound.dash();
    }
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      this.x += TURKEY.dashSpeed * dt;
      if (this.x > 1150) this.x = 1150;
    }

    this.invincible = Math.max(0, this.invincible - dt);
    this.slowed = Math.max(0, this.slowed - dt);
    this.wingFlap = Math.max(0, this.wingFlap - dt);
    this.runCycle += dt * (this.dashTime > 0 ? 26 : 14);
  }

  // Called when the turkey is hit: bounce back a little, flash invincible.
  hurt(seconds) {
    this.invincible = seconds;
    this.x = Math.max(60, this.x - 46);
  }
}

export class Farmer {
  constructor() {
    this.pressure = 12;
    this.x = -40;
    this.runCycle = 0;
    this.angry = false;
  }

  // Pressure 0..100. The farmer's drawing position follows it: the higher
  // the pressure, the closer he looms at the left edge of the screen.
  update(dt, rising, turkeyDashing) {
    this.pressure += rising * dt;
    if (turkeyDashing) this.pressure -= 3 * dt;
    this.pressure = Math.max(0, Math.min(100, this.pressure));
    this.x = -70 + (this.pressure / 100) * 150;
    this.angry = this.pressure > 65;
    this.runCycle += dt * (8 + this.pressure / 8);
  }

  get caught() {
    return this.pressure >= 100;
  }

  reset() {
    this.pressure = FARMER.resetAfterCatch;
  }
}

export class Dog {
  constructor() {
    this.barkTimer = 0;
  }

  // Dogs announce themselves before they lunge, so the player gets a warning.
  update(dt, obstacles, sound) {
    this.barkTimer -= dt;
    if (this.barkTimer > 0) return;
    for (const o of obstacles) {
      if (o.kind === 'dog' && o.x > 700 && o.x < 1100) {
        this.barkTimer = 1.4;
        if (sound) sound.bark();
        return;
      }
    }
  }
}
