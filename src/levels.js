export const CORE_LEVELS = [
  {
    name: 'Primeiros passos', subtitle: 'Todo caminho começa com um movimento.',
    hint: 'Deite, gire e levante. O bloco precisa entrar em pé no portal.',
    start: [1, 2],
    map: [
      '.......',
      '.####..',
      '.######',
      '.###.##',
      '..###O#',
      '..#####',
    ],
  },
  {
    name: 'Entre dois mundos', subtitle: 'Às vezes, você precisa criar o caminho.',
    hint: 'Fique em pé no botão verde para alternar a ponte. Depois atravesse.',
    start: [1, 2],
    map: [
      '..........',
      '.####.####',
      '.##S#.####',
      '.####BB###',
      '.####.##O#',
      '.####.####',
      '..........',
    ],
  },
  {
    name: 'Equilíbrio delicado', subtitle: 'Um pouco de cuidado leva você mais longe.',
    hint: 'O piso de cobre é frágil: atravesse deitado. Em pé, ele quebra.',
    start: [1, 3],
    map: [
      '..........',
      '.####.####',
      '.####.####',
      '.####FF###',
      '.####.##O#',
      '.####.####',
      '..........',
    ],
  },
  {
    name: 'Queda calculada', subtitle: 'O caminho continua alguns metros abaixo.',
    hint: 'Role pela saída azul. Caia deitado exatamente no alvo A para liberar a passagem inferior.',
    start: [1, 2], requiredUnlocks: 1,
    layers: [
      { height: 4.2, name: 'Partida', map: [
        '............', '.####.......', '.###D.......', '.####.......', '.####.......',
        '............', '............', '............',
      ] },
      { height: 0, name: 'Pouso A', gateRequires: 1, targets: [{ id: 'A', x: 5, z: 2, pose: 'x', unlock: 1 }], map: [
        '............', '............', '.....LL#G###', '.....###G###', '.....###G###',
        '.....###G###', '.....###G#O#', '.....###G###',
      ] },
    ],
  },
  {
    name: 'O que existe abaixo', subtitle: 'Cada resposta revela uma nova pergunta.',
    hint: 'As marcas despertam sob o peso inteiro. A ordem está gravada junto à passagem.',
    start: [1, 2], requiredUnlocks: 3,
    layers: [
      { height: 3.2, name: 'O primeiro sinal', exitRequires: 3, clue: 'Primeiro um traço. Depois, dois. Fique em pé nas marcas I e II, nessa ordem.', runes: [{x:2,z:4,bit:1,requires:0,symbol:'I'},{x:5,z:1,bit:2,requires:1,symbol:'II'}], map: [
        '............', '.####R......', '.###H#......', '.#####......', '.#R###......', '.#####......',
        '............', '............', '............', '............', '............',
      ] },
      { height: 0, name: 'O eco da pedra', exitRequires: 12, clue: 'Aqui o eco responde: desperte I e depois II em pé. A abertura só cede aos dois sinais.', runes: [{x:8,z:0,bit:4,requires:0,symbol:'I'},{x:3,z:4,bit:8,requires:4,symbol:'II'}], gateRequires: 1, targets: [{ id: 'A', x: 4, z: 2, pose: 'up', unlock: 1 }], map: [
        '...##G##R...', '...##G###...', '...#LG###...', '...##GH##...', '...R#G###...', '............',
        '............', '............', '............', '............', '............',
      ] },
      { height: -3.2, name: 'A última dobra', clue: 'O caminho está aberto. Agora encontre o portal de pé.', gateRequires: 3, targets: [{ id: 'B', x: 6, z: 3, pose: 'up', unlock: 2 }], map: [
        '............', '............', '............', '.####GL#....', '.####G##....', '.####G##....',
        '.####G##....', '.##O#G##....', '.####G##....', '............', '............',
      ] },
    ],
  },
];


// The campaign is authored in learning steps: introduce, practice, combine, discover.
const core = (index,id,chapter,strategy) => ({...structuredClone(CORE_LEVELS[index]),id,chapter,strategy});
const stage = (id,name,start,map,hint,strategy,extra={}) => ({id,name,start,map,hint,strategy,...extra});
const below = (id,name,start,layers,hint,strategy,requiredUnlocks=1) => ({id,name,start,layers,hint,strategy,requiredUnlocks});
const garden=structuredClone(CORE_LEVELS[4]);
garden.layers[0].exitRequires=0;delete garden.layers[0].runes;
garden.layers[0].map=['............','.#####......','.###H#......','.#####......','..F###......','..####......','............','............','............','............','............'];
garden.layers[1].exitRequires=1;garden.layers[1].runes=[{x:8,z:0,bit:1,requires:0,symbol:'I'}];garden.layers[1].clue='Uma única marca guarda a próxima passagem. O cobre pede passos deitados.';
garden.layers[1].map=['....#G##R...','...##GF##...','...#LG###...','...##GH##...','...F#G###...','............','............','............','............','............','............'];
garden.layers[2].map=['............','............','............','.####GL#....','.####G##....','.####G##....','.FFFFGFF....','.####G##....','..O##G##....','............','............'];
const finale=structuredClone(CORE_LEVELS[4]);
finale.layers[0].map=['............','.####R......','.###H#......','.#####......','.#R###......','..###.......','............','............','............','............','............'];
finale.layers[1].map=['....#G##R...','...##GF##...','...#LG###...','...##GH##...','...R#G###...','............','............','............','............','............','............'];
finale.layers[2].exitRequires=16;finale.layers[2].runes=[{x:2,z:4,bit:16,requires:0,symbol:'I'}];finale.layers[2].clue='Ainda há um último sinal. Desperte a marca antes de buscar o portal.';
finale.layers[2].map=['............','............','............','.####GL#....','.#R##G##....','.####G##....','.####G##....','.####G##....','..##OG##....','............','............'];

export const BASE_LEVELS = [
  core(0,'primeiros-passos','APRENDER','Antes de buscar o portal, use a área larga para ficar em pé.'),
  stage('canto-certo','O canto certo',[1,1],[
    '........','.#####..','.######.','.##.###.','.####O#.','..#####.','........',
  ],'Virar deitado muda o quadrado onde você vai se levantar.','Use o espaço de baixo para mudar a orientação antes de voltar ao canto.'),
  stage('volta-ilha','A volta da ilha',[1,3],[
    '........','.####O#.','.##..##.','.###.##.','.######.','..#####.','........',
  ],'O vazio no centro é um convite para contornar.','Você pode seguir pelo contorno inferior. Não precisa atravessar o buraco.'),
  stage('espaco-virar','Espaço para virar',[2,4],[
    '.........','..####...','.#####O..','.###.###.','.#######.','..#####..','.........',
  ],'Alguns caminhos ficam mais fáceis depois de um pequeno desvio.','A área larga na parte de baixo permite trocar o sentido do bloco.'),
  stage('primeira-ponte','A primeira ponte',[1,2],[
    '...........','.####..###.','.##S#..###.','.####BB#O#.','.####..###.','..###..###.','...........',
  ],'O botão verde responde ao bloco em pé e alterna a ponte.','Primeiro fique em pé no botão; depois procure uma travessia deitada.'),
  core(1,'entre-mundos','CONECTAR','O botão precisa do peso inteiro. Uma vez aberta, a ponte fica aberta até você acionar o botão novamente.'),
  stage('passos-leves','Passos leves',[1,2],[
    '..........','.####.###.','.####.###.','.####FF##.','.####.#O#.','..###.###.','..........',
  ],'O cobre suporta o bloco deitado. Em pé, ele cede.','Prepare a orientação antes da faixa de cobre: atravesse com os dois quadrados apoiados.'),
  core(2,'equilibrio-delicado','CONECTAR','O bloco deve atravessar o cobre deitado. Você pode se levantar novamente sobre pedra.'),
  stage('ponte-cobre','A ponte de cobre',[1,2],[
    '............','.####..####.','.##S#BB####.','.####..FFFF.','.####..####.','.####..##O#.','............',
  ],'Agora a ponte e o piso frágil trabalham juntos.','Abra a ponte, atravesse e use a pedra para preparar o giro sobre o cobre.'),
  stage('primeira-marca','O primeiro sinal',[1,2],[
    '.........','.######..','.##R###..','.###.###.','.#####O#.','..######.','.........',
  ],'A marca gravada desperta quando o bloco fica em pé sobre ela.','Visite a marca I antes de ir ao portal. Ela permanece acesa.',{runes:[{x:3,z:2,bit:1,requires:0,symbol:'I'}],exitRequires:1,clue:'Uma marca acesa abre o portal. Fique em pé sobre I.'}),
  stage('duas-marcas','O diálogo das marcas',[1,2],[
    '........','.###R#..','.#####..','.##.###.','.R####..','..###O..','........',
  ],'I chama II. As marcas mostram a ordem do pequeno ritual.','Se II não responder, desperte I primeiro. Uma marca acesa não apaga.',{runes:[{x:1,z:4,bit:1,requires:0,symbol:'I'},{x:4,z:1,bit:2,requires:1,symbol:'II'}],exitRequires:3,clue:'Desperte I e depois II em pé. O portal se abre aos dois sinais.'}),
  core(3,'queda-calculada','DESCOBRIR','Saia pela seta azul deitado, alinhado com o alvo A. O novo plano aparece durante a descida.'),
  below('porta-chao','A porta no chão',[1,2],[
    {height:3.2,name:'Abertura',map:['..........','.#####....','.###H#....','.#####....','..####....','..........','..........']},
    {height:0,name:'Uma nova margem',gateRequires:1,targets:[{id:'A',x:4,z:2,pose:'up',unlock:1}],map:['...##G###.','...##G###.','...#LG###.','...##G###.','...##G##O.','....#G###.','..........']},
  ],'Uma abertura de um quadrado recebe o bloco em pé.','Deitado você atravessa a abertura; em pé você desce. O alvo já está alinhado.'),
  below('outra-margem','A outra margem',[1,1],[
    {height:3.6,name:'A saída',map:['........','..###...','.####...','.####...','.##D#...','........','........','........','........','........']},
    {height:0,name:'Pouso deitado',gateRequires:1,targets:[{id:'A',x:3,z:5,pose:'z',unlock:1}],map:['........','........','........','........','........','.##L###.','.##L###.','.GGGGGG.','.######.','.####O#.']},
  ],'O alvo comprido pede um pouso deitado na direção da seta.','Prepare o bloco em pé na saída. O giro para a frente o deita sobre o alvo.'),
  below('eco-amigo','Um eco responde',[1,2],[
    {height:3.2,name:'A voz',exitRequires:1,clue:'A marca I abre a passagem. Visite-a em pé.',runes:[{x:2,z:4,bit:1,requires:0,symbol:'I'}],map:['..........','.#####....','.###H#....','.#####....','..R###....','..........','..........']},
    {height:0,name:'O eco',gateRequires:1,exitRequires:2,clue:'O novo plano tem sua própria marca. Desperte I para abrir o portal.',runes:[{x:8,z:0,bit:2,requires:0,symbol:'I'}],targets:[{id:'A',x:4,z:2,pose:'up',unlock:1}],map:['...##G##R.','...##G###.','...#LG###.','...##G###.','...##G#O#.','....#G###.','..........']},
  ],'Cada plano guarda uma marca. A resposta de cima não resolve o caminho de baixo.','Não há pressa: acenda a marca do plano atual antes de procurar a saída.'),
  stage('dobra-suave','A dobra suave',[2,4],[
    '...........','..#####....','.######O...','.###FF###..','.########..','..#######..','...####....','...........',
  ],'Nem sempre o caminho mais direto deixa o bloco na posição certa.','O contorno de pedra permite contornar o cobre e preparar o encaixe final.'),
  stage('memoria-pedra','A memória da pedra',[1,2],[
    '............','.####..##R#.','.#R##..####.','.####BB####.','.##S#..FFFF.','.####..##O#.','............',
  ],'Marcas, ponte e cobre: uma ideia conhecida de cada vez.','Acenda I, abra a ponte no botão e visite II do outro lado. Prepare a travessia sobre o cobre.',{runes:[{x:2,z:2,bit:1,requires:0,symbol:'I'},{x:9,z:1,bit:2,requires:1,symbol:'II'}],exitRequires:3,clue:'A ponte liga as duas marcas. Visite I antes de II e chegue deitado ao cobre.'}),
  core(4,'o-que-existe-abaixo','DECIFRAR','Em cada plano, desperte I e II nessa ordem. Só então entre na abertura em pé.'),
  {...garden,id:'jardim-suspenso',name:'O jardim suspenso',chapter:'DECIFRAR',hint:'Os caminhos conhecidos ganham novas dobras. Desça, leia a marca e cuide do cobre.',strategy:'A primeira abertura já está pronta. No plano seguinte, a marca I abre a segunda descida.'},
  {...finale,id:'ultima-constelacao',name:'A última constelação',chapter:'DECIFRAR',hint:'Um último sinal em cada descoberta. Tudo que você aprendeu cabe neste caminho.',strategy:'Resolva o ritual de cada plano. No último, ainda há uma marca I antes do portal.'},
].map((level,index)=>({...level,chapter:level.chapter||(['APRENDER','CONECTAR','DESCOBRIR','DECIFRAR'][Math.min(3,Math.floor(index/5))])}));

// Advanced stages use authored obstacles and longer ordered rituals.
const roman=['I','II','III','IV'];
function advancedSingle(spec,index){
  const width=spec.width||10,height=spec.height||9;
  const map=Array.from({length:height},(_,z)=>Array.from({length:width},(_,x)=>x>0&&x<width-1&&z>0&&z<height-1?'#':'.'));
  for(const[x,z]of spec.holes||[])map[z][x]='.';
  for(const[x,z]of spec.fragile||[])map[z][x]='F';
  if(spec.split){for(let z=1;z<height-1;z++)for(const x of [4,5])map[z][x]='.';for(const x of [4,5])map[spec.cross][x]='B';map[spec.button[1]][spec.button[0]]='S';}
  let mask=0;const runes=spec.marks.map(([x,z],i)=>{const bit=1<<i,r={x,z,bit,requires:mask,symbol:roman[i]};mask|=bit;map[z][x]='R';return r;});
  map[spec.goal[1]][spec.goal[0]]='O';
  return {id:`avancado-${index+1}`,name:spec.name,chapter:'ALÉM DO LIMIAR',theme:1,start:spec.start||[1,2],map:map.map(row=>row.join('')),runes,exitRequires:mask,hint:'As marcas contam uma história mais longa. Leia a ordem antes de escolher o caminho.',strategy:spec.tip||'Prepare cada chegada em pé. As marcas já acesas permanecem ativas enquanto você reorganiza o caminho.',clue:`Desperte ${runes.map(r=>r.symbol).join(' → ')} em pé. ${spec.split?'A ponte precisa ser acionada pelo botão verde.':'O portal espera todas as marcas.'}`};
}
const advancedSpecs=[
 {name:'O outro céu',marks:[[2,6],[7,1],[6,6]],goal:[7,5],holes:[[4,3],[4,4],[5,4]],fragile:[[5,6],[5,7]]},
 {name:'Três vozes',marks:[[7,6],[2,2],[6,2]],goal:[2,6],holes:[[4,2],[4,3],[4,5],[5,5]],start:[2,4]},
 {name:'O peso da memória',marks:[[2,6],[7,1],[6,6]],goal:[7,4],split:true,cross:3,button:[2,3],fragile:[[6,5],[7,5],[8,5]]},
 {name:'Quatro direções',marks:[[2,6],[7,1],[2,2],[7,6]],goal:[5,7],holes:[[4,3],[5,3],[4,5]],fragile:[[5,5],[6,5]]},
 {name:'O silêncio entre ilhas',marks:[[7,6],[2,6],[7,1]],goal:[6,4],split:true,cross:5,button:[3,2],holes:[[7,3],[8,3]]},
 {name:'A sala dos ecos',marks:[[2,2],[7,6],[2,6],[7,1]],goal:[6,5],holes:[[4,3],[5,3],[4,4],[5,4]],start:[1,5]},
 {name:'A dobra do cobre',marks:[[7,1],[2,6],[7,6]],goal:[2,2],fragile:[[3,4],[4,4],[5,4],[6,4]],holes:[[4,2],[4,6]],start:[2,3]},
 {name:'Uma ponte, dois retornos',marks:[[7,6],[2,6],[7,1],[2,2]],goal:[7,4],split:true,cross:2,button:[3,4],fragile:[[6,5],[7,5],[8,5]]},
 {name:'A ordem escondida',marks:[[2,6],[7,1],[7,6],[2,2]],goal:[6,4],holes:[[3,3],[4,3],[5,3],[6,3],[3,5],[4,5]],start:[1,3]},
 {name:'Constelação de pedra',marks:[[7,6],[2,2],[7,1],[2,6]],goal:[5,6],holes:[[4,4],[5,4],[4,5]],fragile:[[3,3],[4,3],[5,3]],start:[1,4]},
];
function advancedDescent(source,index,name){
  const level=structuredClone(source);level.id=`avancado-${index+1}`;level.name=name;level.chapter='PROFUNDEZAS';level.theme=1;
  let globalBit=0;
  level.layers.forEach((deck,layerIndex)=>{
    const map=deck.map.map(row=>[...row]);
    for(const row of map)for(let x=0;x<row.length;x++)if(row[x]==='R')row[x]='#';
    const candidates=[];map.forEach((row,z)=>row.forEach((tile,x)=>{if(tile==='#'&&!(layerIndex===0&&x===level.start[0]&&z===level.start[1]))candidates.push([x,z]);}));
    // Deliberately spread three seals around each plane, rather than changing speed.
    const patterns=[[.85,.08,.5],[.1,.9,.42],[.7,.2,.94],[.32,.87,.04],[.94,.45,.15],[.08,.62,.89],[.18,.72,.95]];
    const fractions=patterns[index%patterns.length];let mask=0;
    deck.runes=fractions.map((fraction,i)=>{const[x,z]=candidates[Math.floor((candidates.length-1)*fraction)];const bit=1<<globalBit++;const rune={x,z,bit,requires:mask,symbol:roman[i]};mask|=bit;map[z][x]='R';return rune;});
    deck.exitRequires=mask;deck.map=map.map(row=>row.join(''));deck.name=`O ${layerIndex+1}º segredo`;
    deck.clue='Cada plano tem três marcas: I → II → III. Desperte-as em pé antes de buscar a saída.';
  });
  level.hint='Três sinais em cada descoberta. O plano seguinte só se revela quando você resolve a passagem.';
  level.strategy='Resolva I, II e III no plano atual. Os sinais de um plano não abrem a passagem do próximo.';
  return level;
}
export const ADVANCED_LEVELS=[
  ...advancedSpecs.map(advancedSingle),
  advancedDescent(BASE_LEVELS[14],10,'O eco profundo'),
  advancedDescent(BASE_LEVELS[17],11,'As três chaves'),
  advancedDescent(BASE_LEVELS[19],12,'A constelação retorna'),
  advancedSingle({name:'A travessia do enigma',marks:[[2,6],[7,1],[2,2],[7,6]],goal:[6,4],split:true,cross:4,button:[3,1],fragile:[[6,3],[7,3],[8,3]]},13),
  advancedDescent(BASE_LEVELS[18],14,'O jardim dos sinais'),
  advancedSingle({name:'O labirinto sereno',marks:[[7,1],[2,6],[7,6],[2,2]],goal:[5,7],holes:[[3,3],[4,3],[5,3],[5,4],[5,5],[4,5]],fragile:[[2,4],[3,4]],start:[1,4]},15),
  advancedDescent(BASE_LEVELS[17],16,'O ritual invertido'),
  advancedSingle({name:'A última ponte',marks:[[7,6],[2,2],[7,1],[2,6]],goal:[6,5],split:true,cross:3,button:[2,5],holes:[[7,3]],fragile:[[6,4],[7,4],[8,4]]},17),
  advancedDescent(BASE_LEVELS[19],18,'Nove marcas no vazio'),
  advancedDescent(BASE_LEVELS[18],19,'Além do equilíbrio'),
];
export const LEVELS=[...BASE_LEVELS,...ADVANCED_LEVELS];
