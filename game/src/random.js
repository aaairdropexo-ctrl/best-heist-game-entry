// A tiny seeded random source, so a screenshot seed always stages the
// same train and the same patrol phase. Nothing here is a game rule.
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
