// The alarm meter, one job: turn being seen into a fair, readable
// escalation — calm, suspicious, alarm, caught — and back down again.
// Nothing here moves a guard; it only names the state the world acts on.
import { ALARM } from './config.js';

export const STATE_CALM = 'CALM';
export const STATE_SUSPICIOUS = 'SUSPICIOUS';
export const STATE_ALARM = 'ALARM';

export function createAlarm() {
  let value = 0;

  function state() {
    if (value >= ALARM.alarm) return STATE_ALARM;
    if (value >= ALARM.suspicious) return STATE_SUSPICIOUS;
    return STATE_CALM;
  }

  function step(dt, seen) {
    if (seen) value += ALARM.risePerSecond * dt;
    else value -= ALARM.fallPerSecond * dt;
    if (value < 0) value = 0;
    if (value > ALARM.caught) value = ALARM.caught;
    return { value, state: state(), caught: value >= ALARM.caught };
  }

  function add(amount) {
    value = Math.min(ALARM.caught, value + amount);
    return { value, state: state() };
  }

  function set(amount) {
    value = Math.max(0, Math.min(ALARM.caught, amount));
    return { value, state: state() };
  }

  return { step, add, set, get value() { return value; }, state };
}
