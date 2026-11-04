import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, initialState, roll, step, cells, solve } from '../src/engine.js';

test('rolling in a direction and back preserves all block orientations', () => {
  for (const pose of ['up','x','z']) for (const [a,b] of [['up','down'],['left','right']]) {
    const state = { x: 4, z: 4, pose, bridge: true };
    assert.deepEqual(roll(roll(state,a),b),state);
  }
});
test('upright block rolls two cells wide, then stands three cells from its start', () => {
  const state={x:0,z:0,pose:'up',bridge:false};
  assert.deepEqual(cells(roll(state,'right')),[[1,0],[2,0]]);
  assert.deepEqual(roll(roll(state,'right'),'right'),{...state,x:3});
});
test('one supported cell keeps the block stable, and it can roll back onto the platform', () => {
  for (const map of [['##.'],['#.#']]) {
    const level={map,start:[0,0]},start=initialState(level),outcome=step(level,start,'right');
    assert.equal(outcome.status,'playing');assert.equal(outcome.state.pose,'x');
    assert.deepEqual(step(level,outcome.state,'left').state,start);
  }
  const level={map:['#','#','.'],start:[0,0]};
  assert.equal(step(level,initialState(level),'down').status,'playing');
});
test('the block falls only after losing all support', () => {
  const level={map:['##..'],start:[0,0]};
  const overhang=step(level,initialState(level),'right');assert.equal(overhang.status,'playing');
  assert.equal(step(level,overhang.state,'right').status,'fall');
  assert.equal(step({map:['#..'],start:[0,0]},initialState(level),'right').status,'fall');
});
test('closed bridges and gates are not support, but an adjacent solid tile is enough', () => {
  const level={map:['#B#'],start:[0,0]};
  assert.equal(step(level,initialState(level),'right').status,'playing');
  assert.equal(step({map:['#B.'],start:[0,0]},initialState(level),'right').status,'fall');
  const gate={start:[0,0],layers:[{height:0,gateRequires:1,map:['#G#']}]};
  assert.equal(step(gate,initialState(gate),'right').status,'playing');
});
test('goal requires the block to stand upright', () => {
  const level={map:['###O#'],start:[0,0]};
  assert.equal(step(level,{x:1,z:0,pose:'x',bridge:false},'right').status,'win');
  assert.equal(step(level,{x:2,z:0,pose:'up',bridge:false},'right').status,'playing');
});
test('switch requires upright pressure; bridges require activation', () => {
  const level={map:['###SBB##'],start:[0,0]};
  const standing=step(level,{x:1,z:0,pose:'x',bridge:false},'right');
  assert.equal(standing.state.bridge,true);
  assert.equal(step(level,standing.state,'right').status,'playing');
  assert.equal(step(level,{...standing.state,bridge:false},'right').status,'fall');
  assert.equal(step(level,{x:2,z:0,pose:'up',bridge:false},'right').state.bridge,false);
  assert.equal(step(level,{x:4,z:0,pose:'x',bridge:true},'left').state.bridge,false);
});
test('fragile tiles support a flat block but break under upright pressure', () => {
  const level={map:['###FF##'],start:[0,0]};
  assert.equal(step(level,{x:2,z:0,pose:'up',bridge:false},'right').status,'playing');
  assert.equal(step(level,{x:1,z:0,pose:'x',bridge:false},'right').reason,'fragile');
});
for (const [i,level] of LEVELS.entries()) test(`level ${i+1} has a complete playable solution`, () => {
  const route=solve(level);assert.ok(route?.length,'A safe solution must exist');
  let state=initialState(level),result;
  for(const direction of route) { result=step(level,state,direction);assert.notEqual(result.status,'fall');state=result.state; }
  assert.equal(result.status,'win');
  console.log(`Fase ${i+1}: ${route.length} movimentos — ${route.join(', ')}`);
});
