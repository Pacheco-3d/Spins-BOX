const CARDINALS=['up','right','down','left'];
const quarterTurn=azimuth=>((Math.round(azimuth/(Math.PI/2))%4)+4)%4;

// Choose the board axis that best follows the requested on-screen direction.
export function worldDirection(input,azimuth=0) {
  const index=CARDINALS.indexOf(input);
  if(index<0)throw new Error(`Direção inválida: ${input}`);
  return CARDINALS[(index-quarterTurn(azimuth)+4)%4];
}
export function inputDirection(world,azimuth=0) {
  const index=CARDINALS.indexOf(world);
  if(index<0)throw new Error(`Direção inválida: ${world}`);
  return CARDINALS[(index+quarterTurn(azimuth))%4];
}
