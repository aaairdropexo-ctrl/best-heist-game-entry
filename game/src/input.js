// Keyboard and mouse input, one job: turn keys into a move direction and
// one-shot actions the world consumes. No game rule lives here.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SMOKE = 4;
export const ACTION_DISGUISE = 8;
export const ACTION_INTERACT = 16;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;

  function keyDown(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    keys.add(event.key.toLowerCase());
    if (event.key === ' ' || event.key === 'Enter') actions |= ACTION_CONFIRM;
    if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') actions |= ACTION_PAUSE;
    if (event.key === '1') actions |= ACTION_SMOKE;
    if (event.key === '2') actions |= ACTION_DISGUISE;
    if (event.key === 'e' || event.key === 'E') actions |= ACTION_INTERACT;
  }
  function keyUp(event) {
    keys.delete(event.key.toLowerCase());
  }
  function pointerDown() {
    actions |= ACTION_CONFIRM;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', pointerDown);

  function direction() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y, crawl: keys.has('shift') };
  }

  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }

  // E is held, not tapped: the lockpick and the uncouple are channels.
  function interactHeld() {
    return keys.has('e');
  }

  return { direction, takeActions, interactHeld };
}
