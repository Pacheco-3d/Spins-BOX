import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_LEVELS as LEVELS,initialState,step,solve} from '../src/engine.js';
import {stagePresentation} from '../src/presentation.js';
import {JOURNEY_KEY,readProgress,saveProgress,nextDifficulty} from '../src/journey.js';

test('sealed openings support the block until the two runes are awake',()=>{
  const level=LEVELS[4],state={...initialState(level),x:2,z:2,pose:'x'};
  assert.equal(step(level,state,'right').event,'sealed');
  assert.equal(step(level,{...state,sigils:3},'right').status,'land');
});
test('runes need upright pressure and must awaken in their engraved order',()=>{
  const level=LEVELS[4],base=initialState(level);
  const early=step(level,{...base,x:3,z:1,pose:'x'},'right');
  assert.equal(early.event,'runeOrder');assert.equal(early.state.sigils,0);
  const first=step(level,{...base,x:2,z:2,pose:'z'},'down');assert.equal(first.event,'rune');assert.equal(first.state.sigils,1);
  const second=step(level,{...base,x:3,z:1,pose:'x',sigils:1},'right');assert.equal(second.state.sigils,3);
  const flat=step(level,{...base,x:1,z:4},'right');assert.equal(flat.state.sigils,0);
});
test('each floor needs its own solution; an earlier floor cannot open a later seal',()=>{
  const state={...initialState(LEVELS[4]),x:4,z:3,pose:'x',layer:1,elevation:0,unlocked:1,sigils:3};
  assert.equal(step(LEVELS[4],state,'right').event,'sealed');
  assert.equal(step(LEVELS[4],{...state,sigils:15},'right').status,'land');
});
test('the enigmatic route solves all four runes before completing the descent',()=>{
  let state=initialState(LEVELS[4]),runes=0,descents=0;
  const route=solve(LEVELS[4]);assert.ok(route.length>20);
  for(const direction of route){const r=step(LEVELS[4],state,direction);if(r.event==='rune')runes++;if(r.status==='land')descents++;state=r.state;}
  assert.equal(runes,4);assert.equal(descents,2);assert.equal(state.sigils,15);
});
test('only the active floor is visible during play, rolls, and undo',()=>{
  for(const layer of [0,1,2])for(const animation of [null,{phase:'roll'}]) {
    const floors=stagePresentation({layer},animation,3);
    assert.deepEqual(floors.map(f=>f.visible),[0,1,2].map(i=>i===layer));
  }
});
test('the next floor slides into alignment before landing; the third stays hidden',()=>{
  const animation={phase:'reveal',from:{layer:0},to:{layer:1},progress:0};
  let floors=stagePresentation({layer:0},animation,3);assert.deepEqual(floors.map(f=>f.visible),[true,true,false]);assert.ok(floors[1].offset[0]>0);
  floors=stagePresentation({layer:0},{...animation,progress:1},3);assert.deepEqual(floors[1].offset,[0,0,0]);
  floors=stagePresentation({layer:0},{...animation,phase:'land'},3);assert.deepEqual(floors[1].offset,[0,0,0]);assert.equal(floors[2].visible,false);
});
test('after touchdown the old floor retracts and only the new floor remains',()=>{
  const animation={phase:'focus',from:{layer:1},to:{layer:2},progress:1};
  const floors=stagePresentation({layer:2},animation,3);assert.deepEqual(floors.map(f=>f.visible),[false,false,true]);assert.ok(floors[1].offset[0]<0);
});
test('difficulty advances only after victory and resumes the earned checkpoint',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  assert.equal(readProgress(storage,5),0);
  for(const status of ['playing','fall','land'])assert.equal(nextDifficulty(1,status,5),1);
  saveProgress(storage,nextDifficulty(1,'win',5));assert.equal(readProgress(storage,5),2);
  assert.equal(nextDifficulty(4,'win',5),4);
  for(const invalid of ['null','-1','99','"4"','{}','oops']){data.set(JOURNEY_KEY,invalid);assert.equal(readProgress(storage,5),0);}
  assert.doesNotThrow(()=>saveProgress(undefined,1));
});
