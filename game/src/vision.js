// Vision cones, one job: decide whether a watcher sees the thief.
// A cone sees only inside its range and half-angle, only when no wall
// stands between watcher and thief, and never through cover or smoke.
import { WALLS } from './config.js';

export const CONE_RANGE = 190;
export const CONE_HALF_ANGLE = 0.62;
export const CAMERA_RANGE = 210;

function segmentHitsWall(x1, y1, x2, y2) {
  for (const wall of WALLS) {
    // Walls are vertical segments; a sight line crossing one is blocked,
    // unless it passes through the door gap on the corridor line.
    const crossed = (x1 < wall.x && x2 > wall.x) || (x1 > wall.x && x2 < wall.x);
    if (!crossed) continue;
    const t = (wall.x - x1) / (x2 - x1);
    const yAt = y1 + (y2 - y1) * t;
    const inGap = yAt >= wall.gapTop && yAt <= wall.gapBottom;
    const inWall = (yAt >= wall.top && yAt <= wall.gapTop) || (yAt >= wall.gapBottom && yAt <= wall.bottom);
    if (inWall && !inGap) return true;
  }
  return false;
}

export function pointInCover(x, y, cover) {
  for (const c of cover) {
    if (x >= c.x && x <= c.x + c.width && y >= c.y && y <= c.y + c.height) return c;
  }
  return null;
}

export function canSee(watcher, target, range, halfAngle, cover, smokes) {
  const dx = target.x - watcher.x;
  const dy = target.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  const angleTo = Math.atan2(dy, dx);
  let diff = angleTo - watcher.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > halfAngle) return false;
  if (segmentHitsWall(watcher.x, watcher.y, target.x, target.y)) return false;
  if (pointInCover(target.x, target.y, cover)) return false;
  for (const smoke of smokes) {
    if (Math.hypot(target.x - smoke.x, target.y - smoke.y) < smoke.radius) return false;
    if (Math.hypot(watcher.x - smoke.x, watcher.y - smoke.y) < smoke.radius) return false;
  }
  return true;
}
