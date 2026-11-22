// The world, one job: the rules of the heist itself. Movement, patrols,
// cameras, the alarm, the tools, the lockpick, the uncouple — and the
// win and the caught moment. Drawing lives in render.js, never here.
import {
  FIELD, TRAIN, THIEF_START, DIAMOND, EXIT_ZONE, PLAYER, GUARD_SPEED,
  CAMERA_SWEEP, GUARDS, CAMERAS, COVER, WALLS, CARTS, TOOLS,
} from './config.js';
import { createPatrol } from './patrol.js';
import { canSee, pointInCover, CONE_RANGE, CONE_HALF_ANGLE, CAMERA_RANGE } from './vision.js';
import { createAlarm, STATE_ALARM, STATE_SUSPICIOUS } from './alarm.js';
import { createTools } from './tools.js';
import { ACTION_SMOKE, ACTION_DISGUISE, ACTION_INTERACT } from './input.js';

export const EVENT_OVER = 1;
export const EVENT_WIN = 2;
export const EVENT_LOOT = 4;
export const EVENT_SPOTTED = 8;

export function createWorld(random) {
  void random;
  let state;

  function reset() {
    state = {
      time: 0,
      thief: { x: THIEF_START.x, y: THIEF_START.y, angle: 0, crawling: false },
      guards: GUARDS.map((g) => ({ ...g, patrol: createPatrol(g.path, GUARD_SPEED), chasing: false, investigate: null })),
      cameras: CAMERAS.map((c) => ({ ...c, angle: c.baseAngle })),
      alarm: createAlarm(),
      tools: createTools(),
      loot: false,
      lockpick: 0,
      uncouple: 0,
      over: false,
      won: false,
      spotted: false,
      hidden: false,
      seenBy: null,
      score: 0,
    };
  }

  function wallBlocks(x, y, nx, ny) {
    for (const wall of WALLS) {
      const crossed = (x < wall.x && nx >= wall.x) || (x > wall.x && nx <= wall.x);
      if (!crossed) continue;
      const inGap = ny >= wall.gapTop && ny <= wall.gapBottom;
      if (!inGap) return true;
    }
    return false;
  }

  function cartBlocks(x, y) {
    for (const cart of CARTS) {
      if (x > cart.x - PLAYER.radius && x < cart.x + cart.width + PLAYER.radius
        && y > cart.y - PLAYER.radius && y < cart.y + cart.height + PLAYER.radius) return true;
    }
    return false;
  }

  function moveThief(dt, move) {
    const thief = state.thief;
    const speed = move.crawl ? PLAYER.crawlSpeed : PLAYER.speed;
    const nx = thief.x + move.x * speed * dt;
    const ny = thief.y + move.y * speed * dt;
    const clampedX = Math.max(48, Math.min(1232, nx));
    const clampedY = Math.max(128, Math.min(592, ny));
    if (!wallBlocks(thief.x, thief.y, clampedX, thief.y) && !cartBlocks(clampedX, thief.y)) thief.x = clampedX;
    if (!wallBlocks(thief.x, thief.y, thief.x, clampedY) && !cartBlocks(thief.x, clampedY)) thief.y = clampedY;
    thief.crawling = move.crawl;
    if (move.x !== 0 || move.y !== 0) thief.angle = Math.atan2(move.y, move.x);
  }

  function step(dt, move, actions, demo) {
    if (state.over || state.won) return 0;
    state.time += dt;
    let events = 0;

    if (!demo) {
      if (actions & ACTION_SMOKE) state.tools.useSmoke(state.thief.x, state.thief.y);
      if (actions & ACTION_DISGUISE) state.tools.useDisguise();
    }
    state.tools.step(dt);
    moveThief(dt, move);

    // Cameras sweep their cones; guards walk, or chase when the alarm is up.
    const alarmState = state.alarm.state();
    for (const camera of state.cameras) {
      camera.angle = camera.baseAngle + Math.sin(state.time * CAMERA_SWEEP) * camera.sweep;
    }
    for (const guard of state.guards) {
      if (alarmState === STATE_ALARM) {
        guard.chasing = true;
        const dx = state.thief.x - guard.patrol.x;
        const dy = state.thief.y - guard.patrol.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 26) {
          const stepLen = GUARD_SPEED * 1.45 * dt;
          guard.patrol.setPosition(
            guard.patrol.x + (dx / dist) * stepLen,
            guard.patrol.y + (dy / dist) * stepLen,
            Math.atan2(dy, dx),
          );
        }
      } else {
        guard.chasing = false;
        guard.patrol.step(dt);
      }
    }

    // Who sees the thief? Guards, then cameras. Disguise buys distance.
    // Hidden means inside cover. Crawling only slows the thief and shrinks
    // the cone that can catch them — it never hides them in the open.
    const cover = pointInCover(state.thief.x, state.thief.y, COVER);
    state.hidden = cover !== null;
    let seen = false;
    let seenBy = null;
    const disguise = state.tools.disguised();
    for (const guard of state.guards) {
      const range = disguise ? CONE_RANGE * 0.45 : CONE_RANGE;
      if (canSee({ x: guard.patrol.x, y: guard.patrol.y, angle: guard.patrol.angle }, state.thief, range, CONE_HALF_ANGLE, COVER, state.tools.smokes)) {
        seen = true;
        seenBy = guard.name;
        break;
      }
    }
    if (!seen) {
      for (const camera of state.cameras) {
        if (canSee(camera, state.thief, CAMERA_RANGE, CONE_HALF_ANGLE, COVER, state.tools.smokes)) {
          seen = true;
          seenBy = camera.name;
          break;
        }
      }
    }
    if (seen && !state.spotted) events |= EVENT_SPOTTED;
    state.spotted = seen;
    state.seenBy = seenBy;

    const alarm = state.alarm.step(dt, seen);
    if (alarm.caught) {
      state.over = true;
      return EVENT_OVER;
    }

    // Touch while the alarm is screaming is a fair catch too — but only
    // after the warning band, never out of nowhere.
    if (alarmState === STATE_ALARM || alarm.state === STATE_SUSPICIOUS) {
      for (const guard of state.guards) {
        if (Math.hypot(state.thief.x - guard.patrol.x, state.thief.y - guard.patrol.y) < 24) {
          state.over = true;
          return EVENT_OVER;
        }
      }
    }

    // Lockpick the vault safe: stand by the diamond, hold E. It is loud.
    const nearDiamond = Math.hypot(state.thief.x - DIAMOND.x, state.thief.y - DIAMOND.y) < 46;
    if (!state.loot && nearDiamond && (actions & ACTION_INTERACT)) {
      state.lockpick += dt;
      if (state.lockpick >= TOOLS.lockpickSeconds) {
        state.loot = true;
        state.lockpick = 0;
        state.alarm.add(10);
        state.score += 500;
        events |= EVENT_LOOT;
      }
    } else if (!state.loot) {
      state.lockpick = Math.max(0, state.lockpick - dt * 2);
    }

    // Getaway: with the diamond, hold E at the coupling to uncouple the
    // vault car. That is the payoff the whole plan builds toward.
    const nearExit = Math.hypot(state.thief.x - EXIT_ZONE.x, state.thief.y - EXIT_ZONE.y) < EXIT_ZONE.radius + 10;
    if (state.loot && nearExit && (actions & ACTION_INTERACT)) {
      state.uncouple += dt;
      if (state.uncouple >= TOOLS.uncoupleSeconds) {
        state.won = true;
        state.score += 500 + Math.max(0, 500 - Math.floor(state.time) * 2);
        return events | EVENT_WIN;
      }
    } else {
      state.uncouple = Math.max(0, state.uncouple - dt * 2);
    }

    return events;
  }

  reset();
  return {
    get state() { return state; },
    reset, step,
    get thief() { return state.thief; },
  };
}
