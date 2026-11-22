// Tools at a cost, one job: every tool the thief carries, what it costs,
// and how long it lasts. A tool is a choice, never a free win — that is
// what criterion 2 means by "tools at a cost".
import { TOOLS } from './config.js';

export function createTools() {
  let smokeLeft = TOOLS.smoke;
  let disguiseLeft = TOOLS.disguise;
  let disguiseTime = 0;
  const smokes = [];

  function useSmoke(x, y) {
    if (smokeLeft <= 0) return false;
    smokeLeft -= 1;
    smokes.push({ x, y, radius: 95, timeLeft: TOOLS.smokeSeconds });
    return true;
  }

  function useDisguise() {
    if (disguiseLeft <= 0) return false;
    disguiseLeft -= 1;
    disguiseTime = TOOLS.disguiseSeconds;
    return true;
  }

  function step(dt) {
    if (disguiseTime > 0) disguiseTime -= dt;
    for (let i = smokes.length - 1; i >= 0; i -= 1) {
      smokes[i].timeLeft -= dt;
      if (smokes[i].timeLeft <= 0) smokes.splice(i, 1);
    }
  }

  function disguised() {
    return disguiseTime > 0;
  }

  return {
    useSmoke, useDisguise, step, disguised, smokes,
    get smokeLeft() { return smokeLeft; },
    get disguiseLeft() { return disguiseLeft; },
    get disguiseTime() { return disguiseTime; },
  };
}
