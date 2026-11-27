// main.js — the game itself: state machine, loop, scoring, saving.
// States: menu, help, playing, stageclear, gameover, win.
// The loop runs on a fixed step so a seeded run always plays the same way.

import { FARMER, PLAYER, STAGES, SCORE, STORAGE_KEY } from './config.js';
import { makeRng, hashSeed } from './random.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import { World } from './world.js';
import { Turkey, Farmer, Dog } from './entities.js';
import { checkObstacles, checkTreats } from './obstacles.js';
import { Renderer } from './render.js';
import { setupShots } from './shots.js';

export function loadBest() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { score: 0, level: 0 };
    const parsed = JSON.parse(raw);
    return { score: parsed.score || 0, level: parsed.level || 0 };
  } catch (e) {
    return { score: 0, level: 0 };
  }
}

export function saveBest(best) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(best));
  } catch (e) {
    // Private mode or no storage: the game still plays, it just forgets.
  }
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.sound = new SoundEngine();
    this.input = new Input();
    this.best = loadBest();
    this.state = 'menu';
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.time = 0;
    this.flashText = '';
    this.flashTimer = 0;
    this.muted = false;
    this.rng = makeRng(hashSeed('turkey-run'));
    this.world = new World(this.rng);
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.dog = new Dog();
    this.last = 0;
    this.input.onFirstGesture = () => {
      this.sound.unlock();
      this.sound.startMusic();
    };
    this.bindButtons();
    this.loop = this.loop.bind(this);
  }

  bindButtons() {
    const buttons = document.querySelectorAll('[data-btn]');
    buttons.forEach((button) => {
      const name = button.getAttribute('data-btn');
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (name === 'start' || name === 'restart') {
          this.input.tapButton('enter');
        } else if (name === 'help' || name === 'mute') {
          this.input.tapButton(name);
        } else {
          this.input.pressButton(name);
        }
      });
      button.addEventListener('pointerup', () => {
        if (name !== 'start' && name !== 'restart' && name !== 'help' && name !== 'mute' && name !== 'back') {
          this.input.releaseButton(name);
        }
      });
      button.addEventListener('pointerleave', () => {
        if (name !== 'start' && name !== 'restart' && name !== 'help' && name !== 'mute' && name !== 'back') {
          this.input.releaseButton(name);
        }
      });
    });
  }

  start() {
    window.requestAnimationFrame(this.loop);
  }

  resetRun() {
    this.rng = makeRng(hashSeed('turkey-run'));
    this.world = new World(this.rng);
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.flashText = '';
    this.flashTimer = 0;
  }

  startGame() {
    this.resetRun();
    this.state = 'playing';
    this.sound.gobble();
  }

  loseLife() {
    this.lives -= 1;
    this.turkey.hurt(PLAYER.invincibleSeconds);
    this.farmer.pressure += FARMER.hitPenalty;
    this.sound.hit();
    if (this.lives <= 0) {
      this.state = 'gameover';
      this.sound.stopMusic();
      this.sound.lose();
      if (this.score > this.best.score) {
        this.best = { score: Math.floor(this.score), level: this.level };
        saveBest(this.best);
      }
    }
  }

  update(dt) {
    this.time += dt;
    if (this.input.pressedMute) {
      this.muted = !this.muted;
      this.sound.setMuted(this.muted);
      document.getElementById('mute-btn').textContent = this.muted ? 'Suara: Mati' : 'Suara: Nyala';
    }
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) this.flashText = '';
    }

    if (this.state === 'menu') {
      this.world.update(dt, false);
      if (this.input.pressedEnter) this.startGame();
      else if (this.input.pressedHelp) this.state = 'help';
    } else if (this.state === 'help') {
      if (this.input.pressedEnter || this.input.pressedHelp) this.state = 'menu';
    } else if (this.state === 'playing') {
      const result = this.world.update(dt, true);
      this.turkey.update(dt, this.input, this.sound);
      this.world.scroll(dt);
      this.farmer.update(dt, FARMER.baseRisePerSecond, this.turkey.dashTime > 0);
      this.dog.update(dt, this.world.obstacles, this.sound);
      this.turkey.farmerClose = this.farmer.pressure > 65;

      // Distance points.
      this.score += SCORE.metre * this.world.speed * dt * 0.06;

      // Puddles slow the turkey and let the farmer close in.
      const hit = checkObstacles(this.turkey, this.world.obstacles);
      if (hit && this.turkey.invincible <= 0) {
        if (hit.type === 'puddle') {
          this.turkey.slowed = 0.7;
          this.farmer.pressure += FARMER.slowPenalty * dt;
        } else {
          this.loseLife();
        }
      }

      const treat = checkTreats(this.turkey, this.world.treats, this.sound);
      if (treat.points > 0) {
        this.score += treat.points;
        if (treat.kind === 'corn') this.farmer.pressure -= FARMER.cornRelief;
        if (treat.kind === 'pumpkin') this.flashText = 'LABU! +50';
        if (treat.kind === 'corn') this.flashText = 'Jagung! Petani menjauh';
        this.flashTimer = 1.1;
      }
      if (this.turkey.dashTime > 0) {
        this.farmer.pressure -= FARMER.dashRelief * dt;
      }

      if (this.farmer.caught) {
        this.farmer.reset();
        this.flashText = 'KETANGKAP SEBENTAR!';
        this.flashTimer = 1.2;
        this.loseLife();
      }

      if (result === 'stage') {
        this.score += SCORE.stageBonus;
        this.level += 1;
        this.sound.stageClear();
        if (this.world.finished) {
          this.state = 'win';
          this.sound.stopMusic();
          this.sound.win();
          if (this.score > this.best.score) {
            this.best = { score: Math.floor(this.score), level: this.level };
            saveBest(this.best);
          }
        } else {
          this.state = 'stageclear';
        }
      }
    } else if (this.state === 'stageclear') {
      this.world.update(dt, false);
      if (this.input.pressedEnter) this.state = 'playing';
    } else if (this.state === 'gameover' || this.state === 'win') {
      this.world.update(dt, false);
      if (this.input.pressedEnter) {
        this.startGame();
        this.sound.unlock();
        this.sound.startMusic();
      }
    }
    this.input.endFrame();
  }

  draw() {
    const renderer = this.renderer;
    const world = this.world;
    renderer.drawBackground(world, this.time);
    if (this.state === 'menu') {
      renderer.drawTurkey(this.turkey);
      renderer.drawMenu(this.best);
    } else if (this.state === 'help') {
      renderer.drawHelp();
    } else if (this.state === 'playing' || this.state === 'stageclear') {
      renderer.drawObstacles(world);
      renderer.drawFarmer(this.farmer);
      renderer.drawTurkey(this.turkey);
      renderer.drawHud(this, world);
      if (this.state === 'stageclear') {
        renderer.drawStageClear(STAGES[this.level - 2].name, Math.floor(this.score));
      }
    } else if (this.state === 'gameover') {
      renderer.drawGameOver(Math.floor(this.score), Math.floor(this.best.score));
    } else if (this.state === 'win') {
      renderer.drawTurkey(this.turkey);
      renderer.drawWin(Math.floor(this.score), Math.floor(this.best.score));
    }
    this.updateButtons();
  }

  updateButtons() {
    const pad = document.getElementById('touch-pad');
    const menuButtons = document.getElementById('menu-buttons');
    if (!pad || !menuButtons) return;
    const playing = this.state === 'playing';
    pad.style.display = playing ? 'block' : 'none';
    menuButtons.style.display = this.state === 'menu' ? 'flex' : 'none';
    const over = document.getElementById('over-buttons');
    if (over) {
      over.style.display = this.state === 'gameover' || this.state === 'win' ? 'flex' : 'none';
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.last) / 1000 || 0.016);
    this.last = timestamp;
    this.update(dt);
    this.draw();
    window.requestAnimationFrame(this.loop);
  }
}

// Boot: the page is static, so the game starts when the module loads.
const params = new URLSearchParams(window.location.search);
const game = new Game(document.getElementById('game'));
window.__game = game;
if (setupShots(game, params)) {
  // Screenshot mode: one deterministic frame, no loop.
} else {
  game.start();
}
