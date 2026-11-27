// obstacles.js — what every hazard and treat does when the turkey meets it.
// Pure rules, no drawing: render.js draws what these objects describe.
// A hit costs a life; a puddle only slows the turkey down.

import { SCORE } from './config.js';

// Axis-aligned box overlap.
export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// The turkey's hit box is a little smaller than its drawing, so near misses
// feel fair instead of punishing.
export function turkeyBox(turkey) {
  return {
    x: turkey.x + 8,
    y: turkey.y + 8,
    w: turkey.width - 16,
    h: turkey.height - 12,
  };
}

// Check every obstacle against the turkey. Returns the first harmful hit,
// or 'puddle' when the turkey is wading (a slow-down, not a hit).
export function checkObstacles(turkey, obstacles) {
  const box = turkeyBox(turkey);
  const jumping = turkey.vy < 0 || turkey.y < turkey.groundY - 4;
  for (const o of obstacles) {
    if (o.kind === 'puddle') {
      if (overlaps(box, o)) return { type: 'puddle', obstacle: o };
      continue;
    }
    if (o.kind === 'fence' || o.kind === 'hay') {
      // Jumping clean over a low obstacle is a dodge, not a hit.
      if (jumping && box.y + box.h < o.y + 18) continue;
    }
    if (o.kind === 'knife') {
      // A falling knife only hurts while it is in the turkey's height band.
      if (o.y < 300) continue;
    }
    if (overlaps(box, o)) return { type: 'hit', obstacle: o };
  }
  return null;
}

// Check every treat against the turkey. Returns the points earned, if any.
export function checkTreats(turkey, treats, sound) {
  const box = turkeyBox(turkey);
  let points = 0;
  let kind = null;
  for (const t of treats) {
    if (t.taken) continue;
    const treatBox = { x: t.x, y: t.y - 20, w: t.w, h: t.h };
    if (overlaps(box, treatBox)) {
      t.taken = true;
      points += SCORE[t.kind] || 10;
      kind = t.kind;
      if (sound) {
        if (t.kind === 'pumpkin') sound.pumpkin();
        else sound.pickup();
      }
    }
  }
  return { points, kind };
}

export const TREAT_INFO = {
  corn: { label: 'Jagung +10', color: '#f2c14e' },
  feather: { label: 'Bulu +25', color: '#e8b4b8' },
  pumpkin: { label: 'Labu +50', color: '#e07a2f' },
};
