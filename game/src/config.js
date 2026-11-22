// The Midnight Express — train layout, tuning and labels.
// One job: every number and name the rest of the game shares, so a
// balance change is a one-line edit here and never a hunt through code.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'midnight-express-best';

// The train is three cars in one frame, left to right: sleeper, dining, vault.
export const CARS = [
  { name: 'SLEEPER CAR', x: 40, width: 400 },
  { name: 'DINING CAR', x: 460, width: 380 },
  { name: 'VAULT CAR', x: 860, width: 380 },
];
export const TRAIN = { top: 120, bottom: 600, corridorTop: 340, corridorBottom: 400 };
export const COUPLING = { x: 850, width: 20, label: 'UNCOUPLE HERE' };

// The thief, Wren, starts in the sleeper car; the diamond waits in the vault.
export const THIEF_START = { x: 96, y: 370 };
export const DIAMOND = { x: 1180, y: 370, radius: 14 };
export const EXIT_ZONE = { x: 850, y: 370, radius: 34 };

export const PLAYER = { radius: 13, speed: 175, crawlSpeed: 88, hideRadius: 7 };
export const GUARD_SPEED = 62;
export const CAMERA_SWEEP = 0.55;

// Alarm bands: calm, suspicious, alarm, caught. The player always gets a
// warning band before anything ends the run — a caught moment must be fair.
export const ALARM = { suspicious: 35, alarm: 70, caught: 100, risePerSecond: 42, fallPerSecond: 16 };
export const TOOLS = { smoke: 2, disguise: 1, smokeSeconds: 4, disguiseSeconds: 6, lockpickSeconds: 2.5, uncoupleSeconds: 1.5 };

// Cover: luggage racks, seats and curtains. Inside one, the thief reads HIDDEN.
// Each piece is drawn as furniture, not an empty box; its tag is one word.
export const COVER = [
  { x: 120, y: 150, width: 120, height: 70, kind: 'rack', tag: 'RACK' },
  { x: 300, y: 150, width: 120, height: 70, kind: 'rack', tag: 'RACK' },
  { x: 120, y: 470, width: 120, height: 70, kind: 'berth', tag: 'BERTH' },
  { x: 300, y: 470, width: 120, height: 70, kind: 'berth', tag: 'BERTH' },
  { x: 520, y: 150, width: 150, height: 70, kind: 'booth', tag: 'BOOTH' },
  { x: 700, y: 470, width: 150, height: 70, kind: 'booth', tag: 'BOOTH' },
  { x: 900, y: 150, width: 130, height: 70, kind: 'crates', tag: 'CRATES' },
  { x: 1080, y: 470, width: 130, height: 70, kind: 'crates', tag: 'CRATES' },
  { x: 900, y: 470, width: 80, height: 70, kind: 'trunk', tag: 'TRUNK' },
];

// Compartment walls: vertical dividers with a door gap on the corridor line.
// A wall blocks a vision cone; the gap is the risk point of every crossing.
export const WALLS = [
  { x: 250, top: 120, bottom: 330, gapTop: 330, gapBottom: 410 },
  { x: 250, top: 410, bottom: 600, gapTop: 330, gapBottom: 410 },
  { x: 620, top: 120, bottom: 330, gapTop: 330, gapBottom: 410 },
  { x: 620, top: 410, bottom: 600, gapTop: 330, gapBottom: 410 },
  { x: 1040, top: 120, bottom: 330, gapTop: 330, gapBottom: 410 },
  { x: 1040, top: 410, bottom: 600, gapTop: 330, gapBottom: 410 },
];

export const GUARDS = [
  {
    name: 'CONDUCTOR ALDOUS', letter: 'A', car: 'SLEEPER CAR', colour: '#e8a33d',
    path: [{ x: 180, y: 180 }, { x: 180, y: 540 }, { x: 380, y: 540 }, { x: 380, y: 180 }],
  },
  {
    name: 'NIGHT PORTER', letter: 'P', car: 'DINING CAR', colour: '#e8a33d',
    path: [{ x: 500, y: 370 }, { x: 800, y: 370 }, { x: 800, y: 180 }, { x: 500, y: 180 }],
  },
  {
    name: 'VAULT GUARD', letter: 'V', car: 'VAULT CAR', colour: '#e8a33d',
    path: [{ x: 920, y: 180 }, { x: 920, y: 540 }, { x: 1140, y: 540 }, { x: 1140, y: 180 }],
  },
];

export const CAMERAS = [
  { name: 'CCTV 1', tag: 'C1', x: 640, y: 210, baseAngle: Math.PI / 2, sweep: 0.7 },
  { name: 'CCTV 2', tag: 'C2', x: 1050, y: 210, baseAngle: Math.PI / 2, sweep: 0.7 },
];

// Luggage carts parked in the corridor: the fast route is not a freeway.
// Each cart forces a detour through the compartments, where the cones are.
export const CARTS = [
  { x: 520, y: 348, width: 64, height: 46, label: 'LUGGAGE CART' },
  { x: 940, y: 348, width: 64, height: 46, label: 'LUGGAGE CART' },
];
