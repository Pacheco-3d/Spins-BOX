const WORLDS=[
  {name:'brasa',low:[.055,.018,.028],high:[.55,.115,.033],haze:[.13,.037,.009],fog:'#582c23'},
  {name:'aurora',low:[.008,.018,.055],high:[.09,.19,.44],haze:[.015,.085,.14],fog:'#172f4d'},
];
export function worldForLevel(index){return WORLDS[Math.floor(Math.max(0,index)/20)%WORLDS.length];}
