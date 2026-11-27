// shots.js — deterministic screenshot scenes for ?shot=.
// Each scene sets the game to a fixed, seeded state and draws exactly one
// frame, so the screenshots are real renders of the game's own code and
// look the same every time they are taken.
//   ?shot=start  — title menu
//   ?shot=play   — mid-run in the cornfield, HUD on
//   ?shot=chase  — kitchen stage, farmer closing in, knives falling
//   ?shot=win    — escape screen

import { makeRng, hashSeed } from './random.js';
import { World } from './world.js';
import { Turkey } from './entities.js';

function seedRun(game, stageIndex, steps) {
  game.rng = makeRng(hashSeed(`turkey-shot-${stageIndex}`));
  game.world = new World(game.rng);
  game.world.stageIndex = stageIndex;
  game.world.speed = game.world.stage.speed;
  game.turkey = new Turkey();
  game.state = 'playing';
  game.score = 1240 + stageIndex * 860;
  game.lives = 2;
  game.level = stageIndex + 1;
  game.time = 4;
  // Run the world forward a fixed number of steps so obstacles and treats
  // are on screen, exactly the same every time.
  for (let i = 0; i < steps; i += 1) {
    game.world.update(0.016, true);
    game.world.scroll(0.016);
  }
  game.world.update(0.016, false);
}

export function setupShots(game, params) {
  const shot = params.get('shot');
  if (!shot) return false;

  if (shot === 'start') {
    game.state = 'menu';
    game.time = 2;
    game.draw();
  } else if (shot === 'play') {
    seedRun(game, 1, 260);
    game.farmer.pressure = 34;
    game.draw();
  } else if (shot === 'chase') {
    seedRun(game, 2, 300);
    game.farmer.pressure = 78;
    game.farmer.angry = true;
    game.turkey.farmerClose = true;
    game.flashText = 'AWAS! PISAU JATUH!';
    game.draw();
  } else if (shot === 'win') {
    game.state = 'win';
    game.score = 5420;
    game.time = 2;
    game.draw();
  } else {
    return false;
  }
  document.title = `Turkey Run — shot ${shot}`;
  return true;
}
