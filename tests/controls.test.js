import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {worldDirection,inputDirection} from '../src/controls.js';

test('arrows match the projected screen direction at all four camera views',()=>{
  const axes={up:[0,0,-1],right:[1,0,0],down:[0,0,1],left:[-1,0,0]};
  for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const camera=new PerspectiveCamera(34,1,.1,100);camera.position.set(Math.sin(yaw)*10,8,Math.cos(yaw)*10);camera.lookAt(0,0,0);camera.updateMatrixWorld();
    const origin=new Vector3().project(camera);
    for(const input of Object.keys(axes)){
      const vector=new Vector3(...axes[worldDirection(input,yaw)]).project(camera).sub(origin);
      if(input==='right')assert.ok(vector.x>0&&Math.abs(vector.y)<1e-8);
      if(input==='left')assert.ok(vector.x<0&&Math.abs(vector.y)<1e-8);
      if(input==='up')assert.ok(vector.y>0&&Math.abs(vector.x)<1e-8);
      if(input==='down')assert.ok(vector.y<0&&Math.abs(vector.x)<1e-8);
    }
  }
});
test('camera-relative hints invert the controls throughout a full orbit',()=>{
  for(let degrees=-720;degrees<=720;degrees+=5){
    const yaw=degrees*Math.PI/180;
    for(const world of ['up','right','down','left'])assert.equal(worldDirection(inputDirection(world,yaw),yaw),world);
  }
});
