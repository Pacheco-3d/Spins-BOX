// Coordinates refer to the minimum x/z occupied by the block.
// up: 1×2×1, x: 2×1×1, z: 1×1×2.
import { LEVELS } from './levels.js';
export { LEVELS, CORE_LEVELS } from './levels.js';

export function decksOf(level) { return level.layers || [{ ...level, height: 0 }]; }
export function initialState(level) {
  const state = { x: level.start[0], z: level.start[1], pose: 'up', bridge: false };
  const result=level.layers ? {...state,layer:0,elevation:level.layers[0].height,unlocked:0} : state;
  return decksOf(level).some(d=>d.runes) ? {...result,sigils:0} : result;
}
export function cells(state) {
  return state.pose === 'x' ? [[state.x, state.z], [state.x + 1, state.z]]
    : state.pose === 'z' ? [[state.x, state.z], [state.x, state.z + 1]] : [[state.x, state.z]];
}
export function tileAt(level, x, z, layer = 0) { return decksOf(level)[layer]?.map[z]?.[x] || '.'; }
export function gateOpen(deck, state) { return ((state.unlocked || 0) & (deck.gateRequires || 0)) === (deck.gateRequires || 0); }
function supported(level, state, x, z, layer = state.layer || 0) {
  const tile = tileAt(level, x, z, layer);
  return tile !== '.' && (tile !== 'B' || state.bridge) && (tile !== 'G' || gateOpen(decksOf(level)[layer], state));
}

function landing(level, state, next) {
  const occupied = cells(next), decks = decksOf(level);
  for (let index = (state.layer || 0) + 1; index < decks.length; index++) {
    const deck = decks[index];
    if (deck.height >= (state.elevation || 0)) continue;
    const support = occupied.map(([x, z]) => supported(level, state, x, z, index));
    if (!support.some(Boolean)) continue;
    // Any contact stops the descent. Only an exact target unlocks its passage.
    const target = deck.targets?.find(t => t.x === next.x && t.z === next.z && t.pose === next.pose);
    const tile = tileAt(level, next.x, next.z, index);
    if (next.pose === 'up' && tile === 'F') return { state: next, status: 'fall', reason: 'fragile' };
    const aligned = support.every(Boolean) && target;
    const result = { ...next, layer: index, elevation: deck.height, unlocked: (state.unlocked || 0) | (aligned ? target.unlock : 0) };
    return { state: result, status: 'land', ...(aligned ? {target:target.id} : {event:'offTarget'}), drop: state.elevation - deck.height };
  }
  return { state: next, status: 'fall', reason: 'edge' };
}
export function roll(state, direction) {
  const s = { ...state };
  if (direction === 'right') {
    if (s.pose === 'up') { s.x++; s.pose = 'x'; }
    else if (s.pose === 'x') { s.x += 2; s.pose = 'up'; }
    else s.x++;
  } else if (direction === 'left') {
    if (s.pose === 'up') { s.x -= 2; s.pose = 'x'; }
    else if (s.pose === 'x') { s.x--; s.pose = 'up'; }
    else s.x--;
  } else if (direction === 'down') {
    if (s.pose === 'up') { s.z++; s.pose = 'z'; }
    else if (s.pose === 'z') { s.z += 2; s.pose = 'up'; }
    else s.z++;
  } else if (direction === 'up') {
    if (s.pose === 'up') { s.z -= 2; s.pose = 'z'; }
    else if (s.pose === 'z') { s.z--; s.pose = 'up'; }
    else s.z--;
  } else throw new Error(`Direção inválida: ${direction}`);
  return s;
}
export function step(level, state, direction) {
  const next = roll(state, direction);
  const occupied = cells(next);
  const support = occupied.map(([x, z]) => supported(level, state, x, z));
  if (!support.some(Boolean) && level.layers) return landing(level, state, next);
  const tile = tileAt(level, next.x, next.z, state.layer || 0);
  const deck = decksOf(level)[state.layer || 0];
  const exitReady = ((next.sigils || 0) & (deck.exitRequires || 0)) === (deck.exitRequires || 0);
  if (next.pose === 'up' && tile === 'H' && exitReady) return landing(level, state, next);
  const fragile = next.pose === 'up' && tile === 'F';
  if (!support.some(Boolean) || fragile) return { state: next, status: 'fall', reason: fragile ? 'fragile' : 'edge' };
  if (next.pose === 'up' && tile === 'S') next.bridge = !state.bridge;
  let event;
  if (next.pose === 'up' && (tile === 'H'||tile==='O') && !exitReady) event = 'sealed';
  const rune = next.pose === 'up' && deck.runes?.find(r => r.x === next.x && r.z === next.z);
  if (rune && !((next.sigils || 0) & rune.bit)) {
    if (((next.sigils || 0) & rune.requires) === rune.requires) { next.sigils = (next.sigils || 0) | rune.bit; event = 'rune'; }
    else event = 'runeOrder';
  }
  const unlocked = ((next.unlocked || 0) & (level.requiredUnlocks || 0)) === (level.requiredUnlocks || 0);
  return { state: next, status: next.pose === 'up' && tile === 'O' && unlocked && exitReady ? 'win' : 'playing', ...(event ? {event} : {}) };
}

// Breadth-first search provides a shortest safe route, also used to validate levels.
export function solve(level, start = initialState(level)) {
  const key = s => `${s.x},${s.z},${s.pose},${s.bridge},${s.layer || 0},${s.unlocked || 0},${s.sigils || 0}`;
  const queue = [{ state: start, route: [] }], seen = new Set([key(start)]);
  for (let i = 0; i < queue.length; i++) {
    const { state, route } = queue[i];
    for (const direction of ['up', 'right', 'down', 'left']) {
      const next = step(level, state, direction);
      if (next.status === 'fall') continue;
      const path = [...route, direction];
      if (next.status === 'win') return path;
      if (!seen.has(key(next.state))) { seen.add(key(next.state)); queue.push({ state: next.state, route: path }); }
    }
  }
  return null;
}
