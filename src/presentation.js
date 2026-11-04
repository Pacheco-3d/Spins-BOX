export const smooth = value => { const t = Math.max(0, Math.min(1,value)); return t*t*(3-2*t); };

// Future floors are never exposed by a camera orbit or by a normal roll.
// Reveal aligns the incoming floor before the block can descend onto it.
export function stagePresentation(state, animation, count) {
  const current = state.layer || 0;
  const result = Array.from({length:count},(_,index)=>({visible:index===current,offset:[0,0,0]}));
  if (!animation || !['reveal','land','focus'].includes(animation.phase)) return result;
  const from = animation.from.layer || 0, to = animation.to.layer || 0, t = smooth(animation.progress || 0);
  result.forEach(floor=>floor.visible=false);
  result[from].visible = animation.phase!=='focus' || t<1;
  result[to].visible = true;
  if(animation.phase==='reveal'&&t<1) result[to].offset = [5*(1-t),-1.5*(1-t),2.5*(1-t)];
  if(animation.phase==='focus') result[from].offset = [-4*t,2*t,-3*t];
  return result;
}
