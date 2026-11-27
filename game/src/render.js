// render.js — every pixel of Turkey Run, drawn in code on one canvas.
// Background, turkey, farmer, dogs, obstacles, treats, HUD and all screens.
// Nothing here loads a file: every shape is a canvas path.

import { VIEW } from './config.js';
import { TREAT_INFO } from './obstacles.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawText(ctx, text, x, y, size, color, align, weight) {
  ctx.font = `${weight || 'bold'} ${size}px 'Trebuchet MS', Verdana, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = VIEW.width;
    this.canvas.height = VIEW.height;
  }

  drawBackground(world, time) {
    const ctx = this.ctx;
    const stage = world.stage;
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    sky.addColorStop(0, stage.sky[0]);
    sky.addColorStop(0.55, stage.sky[1]);
    sky.addColorStop(1, stage.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    // Low autumn sun.
    ctx.fillStyle = '#fff3c4';
    ellipse(ctx, 1080, 130, 52, 52);
    ctx.fillStyle = 'rgba(255, 243, 196, 0.35)';
    ellipse(ctx, 1080, 130, 84, 84);

    // Drifting clouds.
    ctx.fillStyle = 'rgba(255, 250, 235, 0.75)';
    for (let i = 0; i < 4; i += 1) {
      const cx = ((i * 340 + time * 12) % 1500) - 120;
      ellipse(ctx, cx, 90 + i * 26, 64, 20);
      ellipse(ctx, cx + 44, 96 + i * 26, 48, 16);
    }

    // The red barn, far behind the run.
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(880, 420, 220, 150);
    ctx.fillStyle = '#7e2d22';
    ctx.beginPath();
    ctx.moveTo(860, 420);
    ctx.lineTo(990, 330);
    ctx.lineTo(1120, 420);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4ead8';
    ctx.fillRect(960, 470, 60, 100);
    ctx.strokeStyle = '#7e2d22';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(960, 520);
    ctx.lineTo(1020, 520);
    ctx.moveTo(990, 470);
    ctx.lineTo(990, 570);
    ctx.stroke();

    // Fence posts marching past, near and far.
    ctx.fillStyle = '#8a6b45';
    const offset = (time * 300) % 90;
    for (let x = -offset; x < VIEW.width; x += 90) {
      ctx.fillRect(x, 540, 10, 66);
    }
    ctx.fillRect(0, 556, VIEW.width, 8);
    ctx.fillRect(0, 584, VIEW.width, 8);

    // Corn stalks at the field's edge on stage two.
    if (world.stageIndex === 1) {
      ctx.strokeStyle = '#5d7a2e';
      ctx.lineWidth = 5;
      for (let x = 40; x < VIEW.width; x += 110) {
        ctx.beginPath();
        ctx.moveTo(x, 620);
        ctx.quadraticCurveTo(x + 14, 520, x + 4, 440);
        ctx.stroke();
        ctx.fillStyle = '#e8b93e';
        ellipse(ctx, x + 8, 470, 10, 20);
      }
    }

    // Ground and grass.
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, VIEW.groundY, VIEW.width, VIEW.height - VIEW.groundY);
    ctx.fillStyle = stage.grass;
    ctx.fillRect(0, VIEW.groundY, VIEW.width, 14);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    const groundOffset = (time * 300) % 70;
    for (let x = -groundOffset; x < VIEW.width; x += 70) {
      ctx.fillRect(x, 660, 34, 6);
    }

    // Falling autumn leaves.
    for (const leaf of world.leaves) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(Math.sin(leaf.sway) * 0.8);
      ctx.fillStyle = leaf.color;
      ellipse(ctx, 0, 0, leaf.size, leaf.size * 0.6);
      ctx.restore();
    }
  }

  drawTurkey(turkey) {
    const ctx = this.ctx;
    if (turkey.invincible > 0 && Math.floor(turkey.invincible * 12) % 2 === 0) return;
    const x = turkey.x;
    const y = turkey.y;
    const legSwing = Math.sin(turkey.runCycle) * 10;
    const flap = turkey.wingFlap > 0 ? -0.9 : Math.sin(turkey.runCycle * 0.5) * 0.15;

    // Legs.
    ctx.strokeStyle = '#e07a2f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 52);
    ctx.lineTo(x - 8 + legSwing, y + 64);
    ctx.moveTo(x + 10, y + 52);
    ctx.lineTo(x + 10 - legSwing, y + 64);
    ctx.stroke();

    // Fanned tail feathers.
    const tailColors = ['#b5533c', '#d97b29', '#e8b93e', '#8a5a2b', '#b5533c'];
    for (let i = 0; i < 5; i += 1) {
      ctx.save();
      ctx.translate(x - 30, y + 26);
      ctx.rotate(-0.7 + i * 0.35);
      ctx.fillStyle = tailColors[i];
      ellipse(ctx, -16, 0, 20, 8);
      ctx.restore();
    }

    // Body.
    ctx.fillStyle = '#6b4423';
    ellipse(ctx, x, y + 26, 34, 28);
    ctx.fillStyle = '#8a5a2b';
    ellipse(ctx, x + 6, y + 30, 26, 20);

    // Wing.
    ctx.save();
    ctx.translate(x - 4, y + 22);
    ctx.rotate(flap);
    ctx.fillStyle = '#5d3a1e';
    ellipse(ctx, -6, 4, 20, 11);
    ctx.restore();

    // Head, beak and wattle.
    ctx.fillStyle = '#6b4423';
    ellipse(ctx, x + 28, y - 6, 15, 14);
    ctx.fillStyle = '#e07a2f';
    ctx.beginPath();
    ctx.moveTo(x + 40, y - 8);
    ctx.lineTo(x + 54, y - 3);
    ctx.lineTo(x + 40, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ellipse(ctx, x + 38, y + 6, 4, 7);
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, x + 32, y - 10, 4, 4);
    ctx.fillStyle = '#1c1c1c';
    ellipse(ctx, x + 33, y - 10, 2, 2);

    // A scared little sweat drop when the farmer is close.
    if (turkey.farmerClose) {
      ctx.fillStyle = '#7ec8e3';
      ellipse(ctx, x + 16, y - 26, 5, 8);
    }
  }

  drawFarmer(farmer) {
    const ctx = this.ctx;
    const x = farmer.x;
    const y = VIEW.groundY;
    const swing = Math.sin(farmer.runCycle) * 8;
    // Legs and overalls.
    ctx.strokeStyle = '#2e4057';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x + 30, y - 58);
    ctx.lineTo(x + 30 + swing, y);
    ctx.moveTo(x + 52, y - 58);
    ctx.lineTo(x + 52 - swing, y);
    ctx.stroke();
    ctx.fillStyle = '#3a5a8c';
    ctx.fillRect(x + 22, y - 96, 44, 42);
    // Shirt and arms reaching forward.
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x + 18, y - 118, 52, 26);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + 62, y - 108);
    ctx.lineTo(x + 92, y - 92);
    ctx.stroke();
    // Head, beard, straw hat.
    ctx.fillStyle = '#f2c9a0';
    ellipse(ctx, x + 44, y - 132, 16, 15);
    ctx.fillStyle = '#e8e0c8';
    ellipse(ctx, x + 44, y - 118, 14, 7);
    ctx.fillStyle = '#d9a441';
    ellipse(ctx, x + 44, y - 146, 26, 7);
    ctx.fillRect(x + 28, y - 162, 32, 18);
    // Pitchfork.
    ctx.strokeStyle = '#8a6b45';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 92, y - 92);
    ctx.lineTo(x + 104, y - 168);
    ctx.stroke();
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 104 + i * 7, y - 168);
      ctx.lineTo(x + 104 + i * 7, y - 188);
      ctx.stroke();
    }
    if (farmer.angry) {
      drawText(ctx, '!', x + 44, y - 196, 34, '#ffdf3d', 'center', '900');
    }
  }

  drawObstacles(world) {
    const ctx = this.ctx;
    for (const o of world.obstacles) {
      if (o.kind === 'fence') {
        ctx.fillStyle = '#8a6b45';
        ctx.fillRect(o.x, o.y, 10, o.h);
        ctx.fillRect(o.x + 30, o.y, 10, o.h);
        ctx.fillRect(o.x + 56, o.y, 10, o.h);
        ctx.fillRect(o.x, o.y + 8, o.w, 8);
        ctx.fillRect(o.x, o.y + 34, o.w, 8);
      } else if (o.kind === 'hay') {
        ctx.fillStyle = '#d9a441';
        ellipse(ctx, o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2);
        ctx.strokeStyle = '#a67c2e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 - 10, o.h / 2 - 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (o.kind === 'puddle') {
        ctx.fillStyle = '#5b7a99';
        ellipse(ctx, o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ellipse(ctx, o.x + o.w / 2 - 18, o.y + o.h / 2 - 3, 22, 4);
      } else if (o.kind === 'scarecrow') {
        ctx.strokeStyle = '#6b4423';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(o.x + 28, o.y + o.h);
        ctx.lineTo(o.x + 28, o.y + 10);
        ctx.moveTo(o.x + 6, o.y + 34);
        ctx.lineTo(o.x + 50, o.y + 34);
        ctx.stroke();
        ctx.fillStyle = '#d9a441';
        ctx.beginPath();
        ctx.moveTo(o.x + 4, o.y + 34);
        ctx.lineTo(o.x + 52, o.y + 34);
        ctx.lineTo(o.x + 28, o.y + 78);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f2c9a0';
        ellipse(ctx, o.x + 28, o.y + 6, 13, 12);
        ctx.fillStyle = '#8a5a2b';
        ctx.fillRect(o.x + 12, o.y - 8, 32, 8);
      } else if (o.kind === 'dog') {
        const bob = Math.sin(o.bob * 2) * 3;
        ctx.fillStyle = '#7a4a21';
        ellipse(ctx, o.x + 40, o.y + 30 + bob, 38, 20);
        ellipse(ctx, o.x + 72, o.y + 16 + bob, 16, 14);
        ctx.fillStyle = '#5d3a1e';
        ctx.beginPath();
        ctx.moveTo(o.x + 82, o.y + 4 + bob);
        ctx.lineTo(o.x + 88, o.y - 8 + bob);
        ctx.lineTo(o.x + 92, o.y + 6 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1c1c1c';
        ellipse(ctx, o.x + 76, o.y + 12 + bob, 3, 3);
        ctx.strokeStyle = '#7a4a21';
        ctx.lineWidth = 5;
        for (const lx of [14, 30, 52, 66]) {
          ctx.beginPath();
          ctx.moveTo(o.x + lx, o.y + 44);
          ctx.lineTo(o.x + lx + (lx % 2 === 0 ? 8 : -8), o.y + 52);
          ctx.stroke();
        }
      } else if (o.kind === 'knife') {
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(o.x + 13, o.y);
        ctx.lineTo(o.x + 26, o.y + 56);
        ctx.lineTo(o.x + 13, o.y + 84);
        ctx.lineTo(o.x, o.y + 56);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5d3a1e';
        ctx.fillRect(o.x + 8, o.y - 22, 10, 24);
      } else if (o.kind === 'oven') {
        ctx.fillStyle = '#3c3c46';
        roundRect(ctx, o.x, o.y, o.w, o.h, 8);
        ctx.fill();
        ctx.fillStyle = '#ff9d00';
        const flame = 10 + Math.sin(o.flame) * 8;
        ctx.beginPath();
        ctx.moveTo(o.x + 14, o.y);
        ctx.quadraticCurveTo(o.x + 26, o.y - 26 - flame, o.x + 38, o.y);
        ctx.quadraticCurveTo(o.x + 56, o.y - 20 - flame, o.x + 70, o.y);
        ctx.quadraticCurveTo(o.x + 82, o.y - 24 - flame, o.x + 88, o.y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#22222a';
        ctx.fillRect(o.x + 18, o.y + 18, 60, 30);
        ctx.fillStyle = '#ffdf3d';
        ellipse(ctx, o.x + 48, o.y + 33, 12, 6);
      }
    }
    for (const t of world.treats) {
      const bobY = Math.sin(t.bob) * 6;
      if (t.kind === 'corn') {
        ctx.fillStyle = '#f2c14e';
        ellipse(ctx, t.x + 20, t.y + bobY, 12, 20);
        ctx.strokeStyle = '#d9a441';
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.moveTo(t.x + 12 + i * 8, t.y - 14 + bobY);
          ctx.lineTo(t.x + 12 + i * 8, t.y + 14 + bobY);
          ctx.stroke();
        }
        ctx.fillStyle = '#5d7a2e';
        ctx.beginPath();
        ctx.moveTo(t.x + 20, t.y + 18 + bobY);
        ctx.lineTo(t.x + 12, t.y + 30 + bobY);
        ctx.lineTo(t.x + 28, t.y + 30 + bobY);
        ctx.closePath();
        ctx.fill();
      } else if (t.kind === 'feather') {
        ctx.fillStyle = '#e8b4b8';
        ctx.beginPath();
        ctx.ellipse(t.x + 20, t.y + bobY, 8, 18, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c98a90';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(t.x + 20, t.y - 16 + bobY);
        ctx.lineTo(t.x + 20, t.y + 16 + bobY);
        ctx.stroke();
      } else if (t.kind === 'pumpkin') {
        ctx.fillStyle = '#e07a2f';
        ellipse(ctx, t.x + 20, t.y + bobY, 20, 17);
        ctx.strokeStyle = '#b5533c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(t.x + 20, t.y + bobY, 11, 17, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#5d7a2e';
        ctx.fillRect(t.x + 17, t.y - 20 + bobY, 6, 8);
      }
    }
  }

  drawHud(state, world) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(20, 16, 10, 0.55)';
    roundRect(ctx, 16, 14, 470, 92, 14);
    ctx.fill();
    drawText(ctx, `SKOR ${Math.floor(state.score)}`, 34, 40, 26, '#ffe9a8', 'left');
    drawText(ctx, `Level ${world.stageIndex + 1} · ${world.stage.name}`, 34, 72, 20, '#ffffff', 'left');
    drawText(ctx, `${Math.floor(world.distance)} m`, 34, 96, 18, '#ffd27a', 'left');
    // Lives as hearts.
    for (let i = 0; i < 3; i += 1) {
      const hx = 420 + i * 26;
      ctx.fillStyle = i < state.lives ? '#ff5a5a' : 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, 52);
      ctx.bezierCurveTo(hx - 10, 40, hx - 22, 50, hx, 66);
      ctx.bezierCurveTo(hx + 22, 50, hx + 10, 40, hx, 52);
      ctx.fill();
    }
    // Farmer pressure bar.
    ctx.fillStyle = 'rgba(20, 16, 10, 0.55)';
    roundRect(ctx, VIEW.width - 316, 14, 300, 92, 14);
    ctx.fill();
    drawText(ctx, 'PETANI MENGEJAR', VIEW.width - 300, 40, 17, '#ffb3a0', 'left');
    ctx.fillStyle = '#3a2c22';
    roundRect(ctx, VIEW.width - 300, 56, 268, 18, 9);
    ctx.fill();
    const pressure = state.farmer.pressure / 100;
    ctx.fillStyle = pressure > 0.65 ? '#ff3b30' : pressure > 0.4 ? '#ff9d00' : '#7ed957';
    roundRect(ctx, VIEW.width - 300, 56, Math.max(18, 268 * pressure), 18, 9);
    ctx.fill();
    drawText(ctx, state.farmer.angry ? 'AWAS! DIA DEKAT!' : 'Jaga jarak!', VIEW.width - 300, 92, 16, '#ffffff', 'left');
    // Stage progress bar.
    ctx.fillStyle = 'rgba(20, 16, 10, 0.55)';
    roundRect(ctx, 440, 118, 400, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#ffd27a';
    roundRect(ctx, 440, 118, Math.max(22, 400 * world.stageProgress), 22, 11);
    ctx.fill();
    drawText(ctx, `${world.stage.name} — ${Math.floor(world.stageProgress * 100)}%`, 640, 129, 15, '#ffffff');
    if (state.flashText) {
      drawText(ctx, state.flashText, VIEW.width / 2, 200, 40, '#ffffff');
    }
  }

  drawPanel(title, lines, accent) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(20, 12, 6, 0.62)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff6e0';
    roundRect(ctx, 340, 110, 600, 500, 22);
    ctx.fill();
    ctx.fillStyle = accent || '#b5533c';
    roundRect(ctx, 340, 110, 600, 84, 22);
    ctx.fill();
    ctx.fillRect(340, 160, 600, 34);
    drawText(ctx, title, 640, 152, 36, '#ffffff');
    let y = 228;
    for (const line of lines) {
      drawText(ctx, line, 640, y, 22, '#4a2c1a');
      y += 36;
    }
  }

  drawMenu(best) {
    this.drawPanel('TURKEY RUN', [
      'Kabur dari Peternakan!',
      '',
      'Petani datang — larilah, kalkun, larilah!',
      'Lompati pagar, hindari anjing dan pisau,',
      'kumpulkan jagung dan labu.',
      '',
      `Skor terbaik: ${best.score} · Level terjauh: ${best.level}`,
      '',
      'Tekan ENTER atau tombol MULAI',
      'H = cara main · M = suara',
    ], '#b5533c');
  }

  drawHelp() {
    this.drawPanel('CARA MAIN', [
      'Gerak: panah / WASD',
      'Lompat: SPASI (lompat pagar & jerami)',
      'Dash: SHIFT / X (lari cepat, petani menjauh)',
      '',
      'Jangan sampai petani menangkapmu!',
      'Jagung -7 tekanan petani · Labu +50 poin',
      '3 nyawa · Tiap stage 900 meter',
      '',
      'Tekan H atau ENTER untuk kembali',
    ], '#5d7a2e');
  }

  drawStageClear(stageName, score) {
    this.drawPanel(`${stageName} Lolos!`, [
      'Kamu berhasil kabur dari stage ini!',
      '',
      `Skor: ${score}`,
      '',
      'Stage berikutnya lebih cepat...',
      'dan lebih berbahaya!',
      '',
      'Tekan ENTER untuk lanjut',
    ], '#5d7a2e');
  }

  drawGameOver(score, best) {
    this.drawPanel('KETANGKAP!', [
      'Petani berhasil menangkapmu...',
      'Makan malam Thanksgiving menunggumu.',
      '',
      `Skor: ${score} · Terbaik: ${best}`,
      '',
      'Jangan menyerah, kalkun!',
      '',
      'Tekan ENTER untuk coba lagi',
    ], '#8c2f26');
  }

  drawWin(score, best) {
    this.drawPanel('KABUR! KAMU SELAMAT!', [
      'Kamu sampai di hutan — Thanksgiving',
      'tahun ini tanpa kalkun panggang!',
      '',
      `Skor akhir: ${score} · Terbaik: ${best}`,
      '',
      'Kamu kalkun paling cepat di peternakan!',
      '',
      'Tekan ENTER untuk main lagi',
    ], '#d9a441');
  }
}
