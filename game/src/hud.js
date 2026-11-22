// The HUD, one job: the bar the judge reads first — alarm meter, loot,
// tools with their costs, the objective, and the legend that makes safe,
// danger and loot obvious at a glance. Plus the title, pause, caught
// and getaway screens, all in plain words.
import { FIELD, TOOLS } from './config.js';
import { SCREEN_TITLE, SCREEN_PAUSED, SCREEN_OVER, SCREEN_WIN } from './render.js';

export function createHud(canvas) {
  const ctx = canvas.getContext('2d');

  function meter(x, y, width, value) {
    ctx.fillStyle = '#0d1328';
    ctx.fillRect(x, y, width, 18);
    const colour = value >= 70 ? '#ff4646' : value >= 35 ? '#ffd23d' : '#7fb2ff';
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, (width * value) / 100, 18);
    ctx.strokeStyle = '#c9a24b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, 18);
  }

  function drawBar(state) {
    ctx.fillStyle = 'rgba(10,14,30,0.92)';
    ctx.fillRect(0, 0, FIELD.width, 84);
    ctx.fillStyle = '#f2d98a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('THE MIDNIGHT EXPRESS', 16, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px sans-serif';
    ctx.fillText('A sleeper-train heist.', 16, 46);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('ALARM', 560, 24);
    meter(630, 10, 220, state.alarm.value);
    ctx.fillStyle = state.alarm.value >= 70 ? '#ff4646' : '#ffffff';
    ctx.font = '13px sans-serif';
    ctx.fillText(`${Math.floor(state.alarm.value)}% — ${state.alarm.state()}`, 860, 24);

    ctx.fillStyle = '#7df9ff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(state.loot ? '◆ DIAMOND TAKEN' : '◇ DIAMOND: IN THE VAULT', 560, 46);

    // Tools, with what each one costs, right where the player looks.
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`SMOKE [1] ×${state.tools.smokeLeft} — costs 1 use`, FIELD.width - 16, 24);
    ctx.fillText(`DISGUISE [2] ×${state.tools.disguiseLeft} — costs 1 use, ${TOOLS.disguiseSeconds}s`, FIELD.width - 16, 46);
    ctx.textAlign = 'left';

    // Objective on its own row, centred — it must never collide with the tools.
    // When the alarm is up, this row IS the warning: no banner ever crosses
    // the train, so the playfield stays clean at jury size.
    const alarmState = state.alarm.state();
    let objective;
    let objectiveColour = '#ffd98a';
    if (alarmState === 'ALARM') {
      objective = 'ALARM! THEY ARE COMING — HIDE OR RUN!';
      objectiveColour = '#ff4646';
    } else if (alarmState === 'SUSPICIOUS') {
      objective = 'SUSPICIOUS ? — BREAK LINE OF SIGHT!';
      objectiveColour = '#ffd23d';
    } else if (state.loot) {
      objective = 'OBJECTIVE: reach the coupling — HOLD E to uncouple the vault car';
    } else {
      objective = 'OBJECTIVE: reach the vault safe — HOLD E to lockpick';
    }
    ctx.fillStyle = objectiveColour;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(objective, FIELD.width / 2, 70);
    ctx.textAlign = 'left';
  }

  function drawLegend() {
    // Two short lines: what the colours mean, then who the crew is and the
    // controls. Full names live here, never stacked on the playfield.
    ctx.fillStyle = 'rgba(10,14,30,0.85)';
    ctx.fillRect(0, FIELD.height - 48, FIELD.width, 48);
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7fb2ff';
    ctx.fillText('■ SAFE: blue cover (racks, berths, booths, crates)', 16, FIELD.height - 30);
    ctx.fillStyle = '#e8a33d';
    ctx.fillText('■ DANGER: amber guard cones', 400, FIELD.height - 30);
    ctx.fillStyle = '#ff4646';
    ctx.fillText('■ DANGER: red camera cones', 640, FIELD.height - 30);
    ctx.fillStyle = '#7df9ff';
    ctx.fillText('◆ LOOT: diamond, far right', 900, FIELD.height - 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('A ALDOUS conductor · P NIGHT PORTER · V VAULT GUARD · C1 C2 cameras', 16, FIELD.height - 12);
    ctx.fillText('WASD move · SHIFT crawl · E hold · 1 smoke · 2 disguise', 640, FIELD.height - 12);
  }

  function drawScreen(state, screen, best) {
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(10,14,30,0.72)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = '#f2d98a';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('THE MIDNIGHT EXPRESS', FIELD.width / 2, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      ctx.fillText('Steal the diamond from the vault car. Read the cones before you move.', FIELD.width / 2, 340);
      ctx.fillText('Three routes per car: corridor (fast, exposed), compartments (cover), crawl (slow, hidden).', FIELD.width / 2, 368);
      ctx.fillText('Press SPACE or click to board the train.', FIELD.width / 2, 410);
    } else if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(10,14,30,0.72)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED — the train waits for no one', FIELD.width / 2, 360);
    } else if (screen === SCREEN_OVER) {
      ctx.fillStyle = 'rgba(10,14,30,0.78)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = '#ff4646';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAUGHT — the conductor has you', FIELD.width / 2, 330);
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      ctx.fillText('The alarm hit 100%. Next time: break line of sight before it fills.', FIELD.width / 2, 368);
      ctx.fillText('Press SPACE to try the heist again.', FIELD.width / 2, 400);
    } else if (screen === SCREEN_WIN) {
      ctx.fillStyle = 'rgba(10,14,30,0.78)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = '#7df9ff';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GETAWAY! The vault car is uncoupled', FIELD.width / 2, 330);
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      ctx.fillText(`The diamond is yours. Score ${state.score}. Best ${best}.`, FIELD.width / 2, 368);
      ctx.fillText('Press SPACE to run it again.', FIELD.width / 2, 400);
    }
  }

  function draw(state, screen, best) {
    drawBar(state);
    drawLegend();
    drawScreen(state, screen, best);
  }

  return { draw };
}
