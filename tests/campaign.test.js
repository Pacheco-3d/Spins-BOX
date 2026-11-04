import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,initialState,step,solve,cells,decksOf} from '../src/engine.js';
import {JOURNEY_KEY,readProgress,saveProgress,LEGACY_LEVEL_IDS} from '../src/journey.js';
import {BASE_LEVELS,ADVANCED_LEVELS} from '../src/levels.js';
import {worldForLevel} from '../src/theme.js';

test('the campaign preserves the original twenty stages and adds twenty distinct advanced puzzles',()=>{
  assert.equal(LEVELS.length,40);assert.equal(BASE_LEVELS.length,20);assert.equal(ADVANCED_LEVELS.length,20);assert.equal(new Set(LEVELS.map(l=>l.id)).size,40);
  assert.equal(new Set(BASE_LEVELS.map(l=>JSON.stringify(decksOf(l).map(d=>d.map)))).size,20);
  assert.equal(new Set(ADVANCED_LEVELS.map(l=>JSON.stringify({start:l.start,decks:decksOf(l)}))).size,20);
  for(const level of LEVELS){assert.ok(level.hint?.length>20);assert.ok(level.strategy?.length>20);assert.ok(level.chapter);}
  assert.deepEqual([...new Set(BASE_LEVELS.map(l=>l.chapter))],['APRENDER','CONECTAR','DESCOBRIR','DECIFRAR']);
});
test('the second world changes precisely after twenty completed stages and survives checkpoint resume',()=>{
  assert.equal(worldForLevel(0).name,'brasa');assert.equal(worldForLevel(19).name,'brasa');assert.equal(worldForLevel(20).name,'aurora');assert.equal(worldForLevel(39).name,'aurora');
  assert.notDeepEqual(worldForLevel(19).high,worldForLevel(20).high);
  const ids=LEVELS.map(l=>l.id),data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  saveProgress(storage,20,ids);const index=readProgress(storage,ids.length,ids);assert.equal(index,20);assert.equal(worldForLevel(index).name,'aurora');
});
test('advanced puzzles add mandatory ordered objectives and require longer plans on average',()=>{
  const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
  const basic=BASE_LEVELS.map(l=>solve(l).length),advanced=ADVANCED_LEVELS.map(l=>solve(l).length);
  assert.ok(median(advanced)>median(basic)*2);
  for(const level of ADVANCED_LEVELS){assert.ok(decksOf(level).every(d=>d.runes?.length>=3));assert.ok(level.exitRequires||level.layers.every(d=>d.exitRequires));}
});
test('campaign solutions preserve required objectives while allowing supported shortcuts',()=>{
  for(const level of LEVELS){
    let state=initialState(level),landings=0;
    for(const direction of solve(level)){
      const result=step(level,state,direction);assert.notEqual(result.status,'fall');
      const tiles=cells(result.state).map(([x,z])=>decksOf(level)[result.state.layer||0].map[z]?.[x]);
      if(tiles.every(tile=>tile==='B'))assert.equal(result.state.bridge,true,'A closed bridge alone cannot support the block');
      if(result.state.pose==='up')assert.notEqual(tiles[0],'F','An upright block must not survive on fragile floor');
      if(result.status==='land')landings++;state=result.state;
    }
    for(const rune of decksOf(level).flatMap(d=>d.runes||[]))assert.ok(state.sigils&rune.bit,`${level.id} must awaken every rune`);
    if(level.layers)assert.equal(landings,level.layers.length-1);
  }
});
test('single-plane runes lock the portal and respond only after the engraved mark',()=>{
  const level=LEVELS.find(l=>l.id==='primeira-marca'),base=initialState(level);
  const pos={...base,x:4,z:4,pose:'x'};
  assert.equal(step(level,pos,'right').event,'sealed');
  assert.equal(step(level,{...pos,sigils:1},'right').status,'win');
});
test('old earned checkpoints migrate to the equivalent level, and new saves use stable IDs',()=>{
  const ids=LEVELS.map(l=>l.id),data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  for(let index=0;index<LEGACY_LEVEL_IDS.length;index++){
    data.set('spins-box-journey-v2',JSON.stringify(index));
    assert.equal(readProgress(storage,20,ids),ids.indexOf(LEGACY_LEVEL_IDS[index]));
  }
  saveProgress(storage,14,ids);assert.equal(JSON.parse(data.get(JOURNEY_KEY)),ids[14]);assert.equal(readProgress(storage,20,ids),14);
  data.set(JOURNEY_KEY,JSON.stringify('unknown'));assert.equal(readProgress(storage,20,ids),0);
});
