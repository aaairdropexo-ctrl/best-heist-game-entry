// Patrol paths, one job: walk a guard along its waypoints, turn at each
// one, and remember which way it faces. The path itself is drawn, so a
// player can learn a patrol before moving — that is criterion 2, visible.
export function createPatrol(path, speed) {
  let leg = 0;
  let x = path[0].x;
  let y = path[0].y;
  let angle = 0;

  function step(dt) {
    const target = path[(leg + 1) % path.length];
    const dx = target.x - x;
    const dy = target.y - y;
    const dist = Math.hypot(dx, dy);
    const move = speed * dt;
    if (dist <= move) {
      x = target.x;
      y = target.y;
      leg = (leg + 1) % path.length;
    } else {
      x += (dx / dist) * move;
      y += (dy / dist) * move;
      angle = Math.atan2(dy, dx);
    }
    return { x, y, angle };
  }

  function placeAt(index, progress) {
    const from = path[index % path.length];
    const to = path[(index + 1) % path.length];
    x = from.x + (to.x - from.x) * progress;
    y = from.y + (to.y - from.y) * progress;
    leg = index % path.length;
    angle = Math.atan2(to.y - from.y, to.x - from.x);
    return { x, y, angle };
  }

  // A chase moves the guard off its path, straight at the thief.
  function setPosition(nx, ny, nAngle) {
    x = nx;
    y = ny;
    angle = nAngle;
    return { x, y, angle };
  }

  return { step, placeAt, setPosition, path, get x() { return x; }, get y() { return y; }, get angle() { return angle; } };
}

// Where this guard will be in `seconds`, for the ghost marker the renderer
// draws ahead of it: the player sees the next three seconds of the patrol.
export function ghostAhead(patrol, seconds, speed) {
  let x = patrol.x;
  let y = patrol.y;
  let remaining = speed * seconds;
  let leg = 0;
  // Find the leg the guard is on by nearest waypoint, then walk forward.
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < patrol.path.length; i += 1) {
    const d = Math.hypot(patrol.path[i].x - x, patrol.path[i].y - y);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  let from = { x, y };
  let to = patrol.path[(best + 1) % patrol.path.length];
  void leg;
  while (remaining > 0) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= remaining) {
      remaining -= dist;
      from = to;
      const next = patrol.path[(patrol.path.indexOf(to) + 1) % patrol.path.length];
      to = next;
    } else {
      x = from.x + (dx / dist) * remaining;
      y = from.y + (dy / dist) * remaining;
      remaining = 0;
    }
  }
  return { x, y };
}
