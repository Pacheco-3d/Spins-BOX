import test from 'node:test';
import assert from 'node:assert/strict';
import { Quaternion, Vector3 } from 'three';
import { CORE_LEVELS as LEVELS, initialState, step, solve, roll, gateOpen } from '../src/engine.js';
import { centerOf, rollingTransform, landingPosition } from '../src/motion.js';

test('exact flat landing moves to the lower plane and unlocks its passage', () => {
  const level = LEVELS[3], original = { ...initialState(level), x: 4 };
  const outcome = step(level, original, 'right');
  assert.equal(outcome.status, 'land');assert.equal(outcome.target, 'A');assert.equal(outcome.drop, 4.2);
  assert.deepEqual(outcome.state, { ...original, x: 5, pose: 'x', layer: 1, elevation: 0, unlocked: 1 });
  assert.equal(original.unlocked, 0, 'a transition must not mutate the previous state');
});
test('landing on an unmarked lower platform stays supported without unlocking the passage', () => {
  const level = LEVELS[3], state = { ...initialState(level), x: 4, z: 3 };
  const result = step(level, state, 'right');
  assert.equal(result.status, 'land');assert.equal(result.event, 'offTarget');assert.equal(result.state.unlocked, 0);assert.equal(result.state.layer,1);
});
test('target A does not unlock for upright arrival and a flat block cannot enter a narrow shaft', () => {
  const resultA = step(LEVELS[3], { ...initialState(LEVELS[3]), x: 3, pose: 'x' }, 'right');
  assert.equal(resultA.status, 'land');assert.equal(resultA.event,'offTarget');assert.equal(resultA.state.unlocked,0);
  const resultB = step(LEVELS[4], { ...initialState(LEVELS[4]), x: 5, z: 3, layer: 1, elevation: 0, unlocked: 1 }, 'right');
  assert.equal(resultB.status, 'playing');assert.equal(resultB.state.layer, 1);assert.equal(resultB.state.unlocked, 1);
});
test('target B accepts an upright drop and preserves the first unlock', () => {
  const level = LEVELS[4], state = { ...initialState(level), x: 4, z: 3, pose: 'x', layer: 1, elevation: 0, unlocked: 1, sigils:15 };
  const result = step(level, state, 'right');
  assert.equal(result.status, 'land');assert.equal(result.target, 'B');
  assert.equal(result.state.pose, 'up');assert.equal(result.state.layer, 2);assert.equal(result.state.elevation, -3.2);assert.equal(result.state.unlocked, 3);
});
test('an upright block descends through a marked opening to the aligned target underneath', () => {
  const level=LEVELS[4],state={...initialState(level),x:2,z:2,pose:'x',sigils:3};
  const result=step(level,state,'right');assert.equal(result.status,'land');assert.equal(result.target,'A');
  assert.equal(result.state.x,4);assert.equal(result.state.z,2);assert.equal(result.state.pose,'up');assert.equal(result.state.elevation,0);
});
test('partial support keeps the block on the upper plane without starting a descent', () => {
  const state = { ...initialState(LEVELS[3]), x: 3 };
  const result=step(LEVELS[3], state, 'right');assert.equal(result.status,'playing');assert.equal(result.state.layer,0);assert.equal(result.state.elevation,4.2);
});
test('an intermediate platform cannot be skipped to reach a deeper target', () => {
  const level = { start:[0,0], layers:[
    {height:8,map:['#...']},
    {height:4,map:['.#..']},
    {height:0,map:['.LL.'],targets:[{id:'A',x:1,z:0,pose:'x',unlock:1}]},
  ] };
  const result=step(level, initialState(level), 'right');assert.equal(result.status,'land');assert.equal(result.state.layer,1);assert.equal(result.state.elevation,4);assert.equal(result.state.unlocked,0);
});
test('partial contact with a lower floor stops the fall while keeping the target locked',()=>{
  const level={start:[0,0],layers:[{height:4,map:['#...']},{height:0,map:['.#..'],targets:[{id:'A',x:1,z:0,pose:'x',unlock:1}]}]};
  const result=step(level,initialState(level),'right');assert.equal(result.status,'land');assert.equal(result.event,'offTarget');assert.equal(result.state.unlocked,0);
});
test('gates are only solid after the required landing flags are set', () => {
  const deck = { height:0, gateRequires:3, map:['###GG#'] }, level = { start:[0,0], layers:[deck] };
  const state = { ...initialState(level), x:2 };
  assert.equal(gateOpen(deck, {unlocked:1}), false);
  assert.equal(step(level, { ...state, unlocked:1 }, 'right').status, 'fall');
  assert.equal(step(level, { ...state, unlocked:3 }, 'right').status, 'playing');
});
test('portal cannot complete the stage until all landing targets are unlocked', () => {
  const level = { start:[0,0], requiredUnlocks:3, layers:[{height:0,map:['###O#']}] };
  const state = { ...initialState(level), x:1, pose:'x' };
  assert.equal(step(level, { ...state, unlocked:1 }, 'right').status, 'playing');
  assert.equal(step(level, { ...state, unlocked:3 }, 'right').status, 'win');
});
test('both multilevel solutions necessarily land on every target in order', () => {
  for(const level of LEVELS.filter(l=>l.layers)) {
    let state=initialState(level);const targets=[];
    for(const direction of solve(level)) {
      const result=step(level,state,direction);
      if(result.status==='land') {assert.ok(result.state.elevation<state.elevation);targets.push(result.target);}
      state=result.state;
    }
    assert.deepEqual(targets,level.layers.flatMap(deck=>(deck.targets||[]).map(t=>t.id)));
    assert.equal(state.unlocked,level.requiredUnlocks);
  }
});
test('rolling on elevated and negative-height platforms uses the actual contact plane', () => {
  for(const elevation of [-4.2,4.2,8.4])for(const direction of ['up','down','left','right']) {
    const state={x:3,z:4,pose:'up',elevation},q=new Quaternion();
    for(const progress of [0,.25,.5,.75,1]) {
      const transform=rollingTransform(state,q,direction,progress);
      assert.equal(transform.pivot.y,elevation);
      for(const x of [-.5,.5])for(const y of [-1,1])for(const z of [-.5,.5]) {
        const v=new Vector3(x,y,z).applyQuaternion(transform.quaternion).add(transform.position);
        assert.ok(v.y>=elevation-1e-8);
      }
    }
    assert.ok(rollingTransform(state,q,direction,1).position.distanceTo(centerOf(roll(state,direction)))<1e-8);
  }
});
test('descent preserves x/z, accelerates downward, and ends exactly on the lower surface', () => {
  const destination={x:5,z:2,pose:'x',elevation:-4.2},center=centerOf(destination),drop=8.4;
  assert.equal(landingPosition(destination,drop,0).y,center.y+drop);
  assert.equal(landingPosition(destination,drop,1).y,center.y);
  let previous=Infinity;
  for(let i=0;i<=20;i++) {
    const p=landingPosition(destination,drop,i/20);
    assert.equal(p.x,center.x);assert.equal(p.z,center.z);assert.ok(p.y<=previous&&p.y>=center.y);previous=p.y;
  }
});
