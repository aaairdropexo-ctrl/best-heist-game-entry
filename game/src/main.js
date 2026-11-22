// Boot and the one loop: input every frame, the world in fixed 1/60 s
// steps, and the renderer plus HUD painting what is there. Four screens:
// title, play, paused, over — and win, the getaway.
//
// ?seed=N fixes the patrol phase. ?shot=cover|patrol|alarm|getaway|over
// (with &seed=N) stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER, EVENT_WIN, EVENT_LOOT, EVENT_SPOTTED } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_INTERACT, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { createHud } from './hud.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
// ?ss=N renders the canvas at N× the 1280x720 field (2 = 2560x1440).
// Default 1: normal play is untouched. The shot pipeline uses ss=2 and
// Lanczos-downscales before saving, so the submitted files stay 1280x720.
const ssParam = Number.parseInt(params.get('ss') ?? '1', 10);
const ss = Number.isInteger(ssParam) ? Math.min(4, Math.max(1, ssParam)) : 1;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas, ss);
const hud = createHud(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen);
    hud.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Steal the diamond, then uncouple the vault car.');
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(won ? `Getaway! Score ${world.state.score}.` : `Caught. Score ${world.state.score}.`);
  }

  // One take per frame: the same bitmask feeds the screen actions and the
  // world, so a smoke bomb pressed on a frame is never eaten by the menu.
  function handleActions(actions) {
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step(actions) {
    if (screen === SCREEN_TITLE) return;
    // E is a hold-to-channel key: held state, not the one-shot keydown.
    const held = input.interactHeld() ? ACTION_INTERACT : 0;
    const events = world.step(STEP, input.direction(), actions | held, false);
    if (events & EVENT_WIN) endGame(true);
    else if (events & EVENT_OVER) endGame(false);
    else if (events & EVENT_LOOT) announce('Diamond taken! Reach the coupling and hold E to uncouple.');
    else if (events & EVENT_SPOTTED) announce(`Spotted by ${world.state.seenBy}! Break line of sight!`);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      // One-shot tools fire on the first sub-step only; the held E key
      // rides every sub-step, because the lockpick is a channel.
      let first = true;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(first ? actions : 0);
        first = false;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen);
    hud.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('The Midnight Express. Press Space or click to board the train.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
