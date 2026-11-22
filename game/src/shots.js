// Screenshot scenes, one job: stage the four frames the dossier shows,
// each one a real state of the real game — never a drawing, never a
// composite. The cover must hold every K1 element in one frame.
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_OVER } from './render.js';

function placeGuards(world, legs) {
  world.state.guards.forEach((guard, i) => {
    guard.patrol.placeAt(legs[i][0], legs[i][1]);
  });
}

export function stageShot(name, world) {
  world.reset();
  const state = world.state;
  if (name === 'patrol') {
    // Real patrol gameplay, not a menu: Wren crawling through the sleeper
    // car while the conductor's patrol sweeps past, alarm calm, routes open.
    state.time = 8;
    state.thief.x = 300;
    state.thief.y = 370;
    state.thief.angle = 0;
    state.thief.crawling = true;
    placeGuards(world, [[0, 0.5], [1, 0.5], [3, 0.5]]);
    state.cameras[0].angle = Math.PI / 2 - 0.3;
    state.cameras[1].angle = Math.PI / 2 + 0.4;
    state.alarm.set(0);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'alarm') {
    // Near-miss: Wren hidden in a dining booth, a cone sweeping past the
    // edge of cover, alarm at 68 — one breath from being caught.
    state.time = 18;
    state.thief.x = 595;
    state.thief.y = 185;
    state.thief.angle = Math.PI;
    placeGuards(world, [[2, 0.5], [1, 0.85], [0, 0.6]]);
    state.cameras[0].angle = Math.PI / 2 + 0.5;
    state.cameras[1].angle = Math.PI / 2 - 0.4;
    state.alarm.set(68);
    state.hidden = true;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'getaway') {
    // Payoff: diamond taken, Wren at the coupling, vault car uncoupled.
    state.time = 96;
    state.loot = true;
    state.score = 1240;
    state.thief.x = 850;
    state.thief.y = 370;
    state.thief.angle = 0;
    state.uncouple = 1.5;
    state.won = true;
    placeGuards(world, [[3, 0.4], [2, 0.2], [1, 0.7]]);
    state.alarm.set(12);
    return { screen: SCREEN_WIN, best: 1240 };
  }
  if (name === 'over') {
    state.time = 54;
    state.thief.x = 700;
    state.thief.y = 370;
    placeGuards(world, [[1, 0.5], [0, 0.9], [2, 0.3]]);
    state.alarm.set(100);
    state.over = true;
    return { screen: SCREEN_OVER, best: 0 };
  }
  // Cover (default): mid-heist in the dining car. Thief in the corridor,
  // guards and their cones sweeping, both cameras live, the diamond
  // glowing in the vault car, alarm at 45 — every K1 element, one frame.
  // The thief stands clear of every guard, so no label ever overlaps.
  // Guard cones are staged off the booth: the porter looks up, the vault
  // guard looks left, so the booth tag stays readable under the cone.
  state.time = 12;
  state.thief.x = 600;
  state.thief.y = 370;
  state.thief.angle = 0;
  placeGuards(world, [[1, 0.5], [1, 0.5], [3, 0.5]]);
  state.cameras[0].angle = Math.PI / 2 + 0.45;
  state.cameras[1].angle = Math.PI / 2 - 0.35;
  state.alarm.set(45);
  return { screen: SCREEN_PLAY, best: 0 };
}
