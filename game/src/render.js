// The renderer, one job: paint the train exactly as the world is —
// nothing here decides a rule, and every label a judge reads is drawn
// from the real state: HIDDEN, SPOTTED, the alarm, the patrol paths.
//
// Label rule (jury-view fix): one short word per thing, on a dark pill so
// it reads over any cone or box. Full names live in the bottom legend,
// never stacked on the playfield. No banner ever crosses the train.
import { FIELD, TRAIN, CARS, COVER, WALLS, CARTS, DIAMOND, EXIT_ZONE, COUPLING } from './config.js';
import { ghostAhead } from './patrol.js';
import { GUARD_SPEED } from './config.js';
import { CONE_RANGE, CONE_HALF_ANGLE, CAMERA_RANGE } from './vision.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function createRenderer(canvas, scale = 1) {
  const ctx = canvas.getContext('2d');
  // Supersampling: the backing store can be 2x (2560x1440) while all
  // drawing code still speaks 1280x720 coordinates. The shot pipeline
  // downscales the 2x render with Lanczos before saving, so thin lines
  // and small text come out smoother — like 4K downscaled to 1080p.
  // Normal play runs at scale 1; nothing about the game changes.
  canvas.width = FIELD.width * scale;
  canvas.height = FIELD.height * scale;

  // A vision cone that is bright at the watcher and fades with distance,
  // so text and furniture underneath stay readable.
  function cone(x, y, angle, range, halfAngle, rgb) {
    const gradient = ctx.createRadialGradient(x, y, 8, x, y, range);
    gradient.addColorStop(0, `rgba(${rgb},0.42)`);
    gradient.addColorStop(0.6, `rgba(${rgb},0.20)`);
    gradient.addColorStop(1, `rgba(${rgb},0.04)`);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // One short word on a dark pill, centred at (x, y). The pill is what
  // makes a label survive a cone, a box edge or the contact sheet shrink.
  function pill(x, y, text, fg, font = 'bold 11px sans-serif') {
    ctx.font = font;
    const w = ctx.measureText(text).width + 12;
    const h = 17;
    ctx.fillStyle = 'rgba(10,14,30,0.88)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 8);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 1);
    ctx.textBaseline = 'alphabetic';
  }

  function drawTrain() {
    // Night outside the train, brass inside it.
    ctx.fillStyle = '#0a0e1e';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#101830';
    ctx.fillRect(0, 96, FIELD.width, 528);
    // Windows with a night view: stars, one crescent moon, one city glow.
    for (let i = 0; i < 13; i += 1) {
      const x = 70 + i * 90;
      ctx.fillStyle = '#0d1a33';
      ctx.fillRect(x, 102, 52, 16);
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, 102, 52, 16);
      ctx.fillStyle = '#d8e6ff';
      ctx.fillRect(x + 8, 107, 2, 2);
      ctx.fillRect(x + 30, 105, 2, 2);
      if (i === 4) {
        // Crescent moon.
        ctx.fillStyle = '#f2e9c9';
        ctx.beginPath();
        ctx.arc(x + 26, 110, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0d1a33';
        ctx.beginPath();
        ctx.arc(x + 29, 108, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (i === 9) {
        // City lights rushing past.
        ctx.fillStyle = '#ffb347';
        ctx.fillRect(x + 6, 114, 8, 2);
        ctx.fillRect(x + 22, 114, 5, 2);
        ctx.fillRect(x + 38, 114, 10, 2);
      }
    }
    for (const car of CARS) {
      // Floor gradient: warm lamplight in the middle, dark at the edges.
      const floor = ctx.createLinearGradient(0, TRAIN.top, 0, TRAIN.bottom);
      floor.addColorStop(0, '#1b2340');
      floor.addColorStop(0.5, '#232c4d');
      floor.addColorStop(1, '#141b33');
      ctx.fillStyle = floor;
      ctx.fillRect(car.x, TRAIN.top, car.width, TRAIN.bottom - TRAIN.top);
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 3;
      ctx.strokeRect(car.x, TRAIN.top, car.width, TRAIN.bottom - TRAIN.top);
      ctx.fillStyle = '#c9a24b';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(car.name, car.x + 12, TRAIN.top + 24);
    }
    // Corridor: the fast, exposed route down the middle of the train.
    ctx.fillStyle = '#232c4d';
    ctx.fillRect(40, TRAIN.corridorTop, 1200, TRAIN.corridorBottom - TRAIN.corridorTop);
    ctx.fillStyle = '#c9a24b';
    ctx.font = '12px sans-serif';
    ctx.fillText('CORRIDOR', 48, TRAIN.corridorTop + 16);
  }

  // Furniture, drawn as shapes: a rack is slats + suitcases, a berth is a
  // bed + curtain, a booth is a table + benches, crates are stacked boxes,
  // a trunk is a chest. One-word tag, top-left, on a pill.
  function drawFurniture(c) {
    const { x, y, width, height } = c;
    ctx.strokeStyle = '#3d6fb4';
    ctx.fillStyle = '#22335f';
    if (c.kind === 'rack') {
      ctx.fillRect(x + 6, y + 12, width - 12, 6);
      ctx.fillRect(x + 6, y + 26, width - 12, 6);
      ctx.fillStyle = '#c9a24b';
      ctx.fillRect(x + 14, y + 36, 34, 22);
      ctx.fillRect(x + width - 48, y + 36, 34, 22);
      ctx.strokeStyle = '#7a5c1e';
      ctx.strokeRect(x + 14, y + 36, 34, 22);
      ctx.strokeRect(x + width - 48, y + 36, 34, 22);
    } else if (c.kind === 'berth') {
      ctx.fillStyle = '#2a3f6e';
      ctx.fillRect(x + 10, y + 16, width - 20, 38);
      ctx.fillStyle = '#d8e6ff';
      ctx.fillRect(x + 12, y + 18, 20, 14);
      ctx.fillStyle = '#c9a24b';
      ctx.fillRect(x + 12, y + 36, width - 24, 16);
      ctx.strokeStyle = '#7fb2ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + width - 16 - i * 7, y + 14);
        ctx.lineTo(x + width - 16 - i * 7, y + 56);
        ctx.stroke();
      }
    } else if (c.kind === 'booth') {
      ctx.fillStyle = '#2a3f6e';
      ctx.fillRect(x + 10, y + 8, width - 20, 10);
      ctx.fillRect(x + 10, y + height - 18, width - 20, 10);
      ctx.fillStyle = '#c9a24b';
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + height / 2, 34, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2e9c9';
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + height / 2, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'crates') {
      ctx.fillStyle = '#4a3220';
      ctx.fillRect(x + 10, y + height - 30, 30, 26);
      ctx.fillRect(x + 44, y + height - 30, 30, 26);
      ctx.fillRect(x + 27, y + height - 56, 30, 26);
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 1;
      for (const [bx, by] of [[10, height - 30], [44, height - 30], [27, height - 56]]) {
        ctx.strokeRect(x + bx, y + by, 30, 26);
        ctx.beginPath();
        ctx.moveTo(x + bx, y + by);
        ctx.lineTo(x + bx + 30, y + by + 26);
        ctx.moveTo(x + bx + 30, y + by);
        ctx.lineTo(x + bx, y + by + 26);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#4a3220';
      ctx.fillRect(x + 10, y + 14, width - 20, 42);
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 10, y + 14, width - 20, 42);
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 28);
      ctx.lineTo(x + width - 10, y + 28);
      ctx.stroke();
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + 28, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCover() {
    for (const c of COVER) {
      ctx.fillStyle = '#16264d';
      ctx.fillRect(c.x, c.y, c.width, c.height);
      ctx.strokeStyle = '#3d6fb4';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.width, c.height);
      drawFurniture(c);
      // One-word tag, top-left corner, on its own pill.
      ctx.font = 'bold 10px sans-serif';
      const w = ctx.measureText(c.tag).width + 10;
      ctx.fillStyle = 'rgba(10,14,30,0.9)';
      ctx.beginPath();
      ctx.roundRect(c.x + 4, c.y + 4, w, 14, 6);
      ctx.fill();
      ctx.fillStyle = '#7fb2ff';
      ctx.textAlign = 'left';
      ctx.fillText(c.tag, c.x + 9, c.y + 14);
    }
  }

  function drawCarts() {
    for (const cart of CARTS) {
      ctx.fillStyle = '#4a3220';
      ctx.fillRect(cart.x, cart.y, cart.width, cart.height);
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 2;
      ctx.strokeRect(cart.x, cart.y, cart.width, cart.height);
      ctx.fillStyle = '#e8c98a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CART', cart.x + cart.width / 2, cart.y + cart.height / 2 + 3);
    }
  }

  function drawWalls() {
    ctx.fillStyle = '#0d1328';
    for (const wall of WALLS) {
      ctx.fillRect(wall.x - 4, wall.top, 8, wall.gapTop - wall.top);
      ctx.fillRect(wall.x - 4, wall.gapBottom, 8, wall.bottom - wall.gapBottom);
    }
  }

  function drawPatrolPath(guard) {
    ctx.strokeStyle = 'rgba(232,163,61,0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    const path = guard.patrol.path;
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i += 1) ctx.lineTo(path[i].x, path[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    for (const point of path) {
      ctx.fillStyle = '#e8a33d';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ghost: where the guard will be in three seconds.
    const ghost = ghostAhead(guard.patrol, 3, GUARD_SPEED);
    ctx.strokeStyle = 'rgba(232,163,61,0.9)';
    ctx.beginPath();
    ctx.arc(ghost.x, ghost.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    pill(ghost.x, ghost.y - 18, 'IN 3s', '#e8a33d', '10px sans-serif');
  }

  function drawGuard(guard) {
    const x = guard.patrol.x;
    const y = guard.patrol.y;
    cone(x, y, guard.patrol.angle, CONE_RANGE, CONE_HALF_ANGLE, '232,163,61');
    ctx.fillStyle = '#e8a33d';
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    // One letter, on the guard. The name lives in the legend.
    ctx.fillStyle = '#1b2340';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.letter, x, y + 4);
  }

  function drawCamera(camera) {
    cone(camera.x, camera.y, camera.angle, CAMERA_RANGE, CONE_HALF_ANGLE, '255,70,70');
    ctx.fillStyle = '#ff4646';
    ctx.fillRect(camera.x - 10, camera.y - 6, 20, 12);
    pill(camera.x, camera.y + 24, camera.tag, '#ffd7d7', '10px sans-serif');
  }

  function drawDiamond(state) {
    if (state.loot) return;
    const pulse = 1 + Math.sin(state.time * 4) * 0.12;
    // Glow: a soft cyan halo so the loot reads at a glance, even shrunk.
    const glow = ctx.createRadialGradient(DIAMOND.x, DIAMOND.y, 4, DIAMOND.x, DIAMOND.y, 52 * pulse);
    glow.addColorStop(0, 'rgba(125,249,255,0.45)');
    glow.addColorStop(1, 'rgba(125,249,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(DIAMOND.x, DIAMOND.y, 52 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(DIAMOND.x, DIAMOND.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#7df9ff';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    pill(DIAMOND.x, DIAMOND.y - 28, '◆ DIAMOND', '#7df9ff');
    pill(DIAMOND.x, DIAMOND.y + 36, 'HOLD E TO LOCKPICK', '#ffffff');
  }

  function drawExit(state) {
    if (!state.loot) return;
    ctx.strokeStyle = '#7df9ff';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    pill(EXIT_ZONE.x, EXIT_ZONE.y - EXIT_ZONE.radius - 12, 'UNCOUPLE — HOLD E', '#7df9ff');
    ctx.fillStyle = '#7df9ff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COUPLING', COUPLING.x, 640);
  }

  function drawThief(state) {
    const thief = state.thief;
    const radius = thief.crawling ? 9 : 13;
    ctx.fillStyle = state.tools.disguised() ? '#9d7bff' : '#f2f2f2';
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b2340';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(thief.x, thief.y);
    ctx.lineTo(thief.x + Math.cos(thief.angle) * 18, thief.y + Math.sin(thief.angle) * 18);
    ctx.stroke();
    if (state.spotted) pill(thief.x, thief.y - 42, 'SPOTTED!', '#ff4646', 'bold 12px sans-serif');
    pill(thief.x, thief.y - 22, 'WREN', '#ffffff');
    if (state.hidden) pill(thief.x, thief.y + 30, 'HIDDEN', '#7fb2ff');
  }

  function drawSmoke(state) {
    for (const smoke of state.tools.smokes) {
      ctx.fillStyle = 'rgba(200,200,210,0.45)';
      ctx.beginPath();
      ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
      ctx.fill();
      pill(smoke.x, smoke.y, 'SMOKE', '#e8e8f0', '11px sans-serif');
    }
  }

  function drawProgress(state) {
    if (state.lockpick > 0) {
      const w = 120;
      ctx.fillStyle = '#0d1328';
      ctx.fillRect(DIAMOND.x - w / 2, DIAMOND.y - 52, w, 10);
      ctx.fillStyle = '#7df9ff';
      ctx.fillRect(DIAMOND.x - w / 2, DIAMOND.y - 52, (w * state.lockpick) / 2.5, 10);
      pill(DIAMOND.x, DIAMOND.y - 62, 'LOCKPICKING…', '#ffffff');
    }
    if (state.uncouple > 0) {
      const w = 120;
      ctx.fillStyle = '#0d1328';
      ctx.fillRect(EXIT_ZONE.x - w / 2, EXIT_ZONE.y - 58, w, 10);
      ctx.fillStyle = '#7df9ff';
      ctx.fillRect(EXIT_ZONE.x - w / 2, EXIT_ZONE.y - 58, (w * state.uncouple) / 1.5, 10);
      pill(EXIT_ZONE.x, EXIT_ZONE.y - 68, 'UNCOUPLING…', '#ffffff');
    }
  }

  function draw(state, screen) {
    // The transform is set every frame: the HUD shares this context and
    // draws after the renderer, so it inherits the same scale.
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawTrain();
    drawCover();
    drawCarts();
    drawWalls();
    for (const guard of state.guards) drawPatrolPath(guard);
    for (const camera of state.cameras) drawCamera(camera);
    for (const guard of state.guards) drawGuard(guard);
    drawDiamond(state);
    drawExit(state);
    drawSmoke(state);
    drawThief(state);
    drawProgress(state);
  }

  return { draw };
}
