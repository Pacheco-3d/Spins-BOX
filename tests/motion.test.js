import test from 'node:test';
import assert from 'node:assert/strict';
import { Quaternion, Vector3 } from 'three';
import { dimensions, centerOf, rollingTransform } from '../src/motion.js';
import { roll } from '../src/engine.js';

const epsilon = 1e-8;
function close(a,b) { assert.ok(Math.abs(a-b)<epsilon, `${a} differs from ${b}`); }
function bounds(position,quaternion) {
  const vertices=[];
  for(const x of [-.5,.5])for(const y of [-1,1])for(const z of [-.5,.5])vertices.push(new Vector3(x,y,z).applyQuaternion(quaternion).add(position));
  return ['x','y','z'].map(axis=>[Math.min(...vertices.map(v=>v[axis])),Math.max(...vertices.map(v=>v[axis]))]);
}

test('3D endpoint agrees with the logical grid in all poses and directions',()=>{
  for(const pose of ['up','x','z'])for(const direction of ['up','down','left','right']) {
    const state={x:4,z:5,pose};
    const orientation=new Quaternion();
    if(pose==='x')orientation.setFromAxisAngle(new Vector3(0,0,1),-Math.PI/2);
    if(pose==='z')orientation.setFromAxisAngle(new Vector3(1,0,0),Math.PI/2);
    const result=rollingTransform(state,orientation,direction,1),next=roll(state,direction);
    const [w,h,d]=dimensions(next),actual=bounds(result.position,result.quaternion);
    [[next.x,next.x+w],[0,h],[next.z,next.z+d]].forEach((range,i)=>range.forEach((n,j)=>close(n,actual[i][j])));
    close(result.position.distanceTo(centerOf(next)),0);
  }
});
test('every intermediate rotation keeps the contact edge fixed and avoids sinking into the floor',()=>{
  for(const pose of ['up','x','z'])for(const direction of ['up','down','left','right']) {
    const state={x:3,z:4,pose};let q=new Quaternion();
    if(pose==='x')q.setFromAxisAngle(new Vector3(0,0,1),-Math.PI/2);
    if(pose==='z')q.setFromAxisAngle(new Vector3(1,0,0),Math.PI/2);
    const original=rollingTransform(state,q,direction,0);
    for(let i=0;i<=20;i++) {
      const result=rollingTransform(state,q,direction,i/20);
      close(result.pivot.distanceTo(original.pivot),0);
      assert.ok(bounds(result.position,result.quaternion)[1][0]>=-epsilon);
      close(result.position.distanceTo(result.pivot),centerOf(state).distanceTo(result.pivot));
    }
  }
});
test('long-axis rolls rotate the physical faces even when the grid pose is unchanged',()=>{
  const state={x:3,z:4,pose:'x'};
  const q=new Quaternion().setFromAxisAngle(new Vector3(0,0,1),-Math.PI/2);
  const result=rollingTransform(state,q,'down',1);
  assert.equal(roll(state,'down').pose,'x');
  close(q.angleTo(result.quaternion),Math.PI/2);
});
test('accumulated quaternions preserve rigid dimensions over 100 rolls',()=>{
  let state={x:20,z:20,pose:'up'},q=new Quaternion();
  const directions=['right','up','right','down','left','down','right'];
  for(let i=0;i<100;i++) {
    const direction=directions[i%directions.length],result=rollingTransform(state,q,direction,1);
    q=result.quaternion;state=roll(state,direction);
    close(q.length(),1);
    const actual=bounds(result.position,q),dims=dimensions(state);
    actual.forEach((range,axis)=>close(range[1]-range[0],dims[axis]));
  }
});
test('reversing a roll returns the same position and physical face orientation',()=>{
  const state={x:5,z:5,pose:'up'},q=new Quaternion();
  for(const [a,b]of [['right','left'],['down','up']]) {
    const first=rollingTransform(state,q,a,1),second=rollingTransform(roll(state,a),first.quaternion,b,1);
    close(second.position.distanceTo(centerOf(state)),0);close(second.quaternion.angleTo(q),0);
  }
});
