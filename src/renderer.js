import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { centerOf, rollingTransform, landingPosition } from './motion.js';
import { decksOf, gateOpen } from './engine.js';
import { stagePresentation, smooth } from './presentation.js';
import { worldDirection, inputDirection } from './controls.js';
import { worldForLevel } from './theme.js';

const noise = (x, y, seed = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 17.3) * 43758.5453;
  return n - Math.floor(n);
};

function surfaceMaps(kind, anisotropy) {
  const size = 512;
  const color = document.createElement('canvas'), bump = document.createElement('canvas'), rough = document.createElement('canvas');
  for (const canvas of [color, bump, rough]) canvas.width = canvas.height = size;
  const cc = color.getContext('2d'), bc = bump.getContext('2d'), rc = rough.getContext('2d');
  const image = cc.createImageData(size, size), heights = bc.createImageData(size, size), roughness = rc.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, grain = noise(x, y), broad = Math.sin(x * .032 + Math.sin(y * .017) * 4) * Math.cos(y * .013);
    let rgb, height, r;
    if (kind === 'metal') {
      const brushed = noise(x, Math.floor(y / 5), 1), oxidation = Math.max(0, broad * .5 + noise(Math.floor(x / 22), Math.floor(y / 22), 4) * .3 - .2);
      rgb = [70 + brushed * 20 + oxidation * 110, 76 + brushed * 18 + oxidation * 15, 79 + brushed * 17 - oxidation * 25];
      height = 110 + brushed * 38 + grain * 13; r = 95 + oxidation * 170 + grain * 18;
    } else {
      const marble = Math.pow(Math.abs(Math.sin(x * .018 + y * .008 + broad * 1.3)), 18);
      const value = 196 + broad * 11 + grain * 18 - marble * 26;
      rgb = [value + 7, value + 8, value + 4]; height = 135 + grain * 18 - marble * 12; r = 180 + grain * 35;
    }
    for (let k = 0; k < 3; k++) { image.data[i + k] = rgb[k]; heights.data[i + k] = height; roughness.data[i + k] = r; }
    image.data[i + 3] = heights.data[i + 3] = roughness.data[i + 3] = 255;
  }
  cc.putImageData(image, 0, 0); bc.putImageData(heights, 0, 0); rc.putImageData(roughness, 0, 0);
  if (kind === 'stone') {
    cc.strokeStyle = '#7f867329'; cc.lineWidth = 1;
    for (let n = 0; n < 24; n++) {
      const x = noise(n, 2) * size, y = noise(n, 3) * size;
      cc.beginPath(); cc.moveTo(x, y); cc.lineTo(x + noise(n, 4) * 18, y + noise(n, 5) * 4); cc.stroke();
    }
  }
  const map = new THREE.CanvasTexture(color), bumpMap = new THREE.CanvasTexture(bump), roughnessMap = new THREE.CanvasTexture(rough);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, bumpMap, roughnessMap]) {
    texture.anisotropy = anisotropy; texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }
  return { map, bumpMap, roughnessMap };
}

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.autoClear = false;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2('#582c23', .018);
    this.camera = new THREE.PerspectiveCamera(34, 1, .1, 150);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enablePan = false; this.controls.enableDamping = false;
    this.controls.minPolarAngle = .35; this.controls.maxPolarAngle = Math.PI / 2.3;
    this.controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    this.controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
    this.controls.addEventListener('change', () => this.render());
    this.yaw = 0; this.elevation = .67;
    this.buildLights(); this.buildSky();
    const anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const stoneMaps = surfaceMaps('stone', anisotropy), metalMaps = surfaceMaps('metal', anisotropy);
    this.materials = {
      stone: new THREE.MeshStandardMaterial({ ...stoneMaps, color: '#d0d4cc', roughness: .79, metalness: .04, bumpScale: .035 }),
      metal: new THREE.MeshStandardMaterial({ ...metalMaps, color: '#c1beb7', roughness: .65, metalness: .86, bumpScale: .016, envMapIntensity: 1.3 }),
      trim: new THREE.MeshStandardMaterial({ color: '#9a8a75', roughness: .34, metalness: .88 }),
      dark: new THREE.MeshStandardMaterial({ color: '#263138', roughness: .46, metalness: .78 }),
      fragile: new THREE.MeshStandardMaterial({ ...stoneMaps, color: '#eb9954', roughness: .84, metalness: .08, bumpScale: .04 }),
      bridge: new THREE.MeshStandardMaterial({ ...metalMaps, color: '#a3b9ac', roughness: .62, metalness: .55, bumpScale: .025 }),
      landing: new THREE.MeshStandardMaterial({ ...stoneMaps, color: '#719fa7', roughness: .67, metalness: .16, bumpScale: .02 }),
      launch: new THREE.MeshStandardMaterial({ ...stoneMaps, color: '#b9c7c7', roughness: .72, metalness: .12, bumpScale: .02 }),
      green: new THREE.MeshStandardMaterial({ color: '#98d2a7', roughness: .35, metalness: .35, emissive: '#306b3d', emissiveIntensity: .5 }),
    };
    this.tileGeometry = new RoundedBoxGeometry(.975, .25, .975, 2, .025);
    this.board = new THREE.Group(); this.scene.add(this.board);
    this.block = this.buildBlock(); this.scene.add(this.block);
    this.bridges = []; this.buttons = []; this.lastState = null; this.currentLevel = null;
    this.contextLost = false;
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); this.contextLost = true; canvas.dispatchEvent(new CustomEvent('renderer-lost')); });
    canvas.addEventListener('webglcontextrestored', () => { this.contextLost = false; this.render(); canvas.dispatchEvent(new CustomEvent('renderer-restored')); });
  }

  buildLights() {
    this.scene.add(new THREE.HemisphereLight('#d8e9ff', '#6d3021', 1.5));
    const key = new THREE.DirectionalLight('#fff1ce', 3.2); key.position.set(-3, 13, 7);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -13; key.shadow.camera.right = 13; key.shadow.camera.top = 13; key.shadow.camera.bottom = -13;
    key.shadow.normalBias = .025; key.shadow.bias = -.0003; key.shadow.radius = 3;
    key.shadow.camera.far = 50; this.scene.add(key); this.keyLight = key; this.scene.add(key.target);
    const rim = new THREE.DirectionalLight('#ff9d69', 2.0); rim.position.set(5, 3, -7); this.scene.add(rim);
    const fill = new THREE.DirectionalLight('#c5d9f2', 1.1); fill.position.set(8, 6, 12); this.scene.add(fill);
    const pmrem = new THREE.PMREMGenerator(this.renderer), room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, .04); this.scene.environment = this.environment.texture;
    room.dispose(); pmrem.dispose();
  }

  buildSky() {
    this.skyScene = new THREE.Scene(); this.skyCamera = new THREE.Camera();
    this.skyMaterial = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, uniforms: { uTime: { value: 0 },uLow:{value:new THREE.Vector3()},uHigh:{value:new THREE.Vector3()},uHaze:{value:new THREE.Vector3()} },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
      fragmentShader: `
        varying vec2 vUv; uniform float uTime; uniform vec3 uLow,uHigh,uHaze;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        void main(){
          vec2 uv=vUv;
          vec3 low=uLow, high=uHigh;
          vec3 col=mix(low,high,smoothstep(.0,1.15,uv.y));
          float haze=exp(-pow((uv.y-.51)*4.5,2.))*exp(-pow((uv.x-.5)*1.9,2.));
          col+=uHaze*haze;
          col+=(hash(gl_FragCoord.xy)-.5)*.009;
          float vignette=1.-.4*pow(length((uv-.5)*vec2(1.,.7)),1.4);
          gl_FragColor=vec4(col*vignette,1.);
        }`,
      toneMapped: false,
    });
    this.skyScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), this.skyMaterial));
    this.setWorld(0);
  }

  setWorld(index){
    const world=worldForLevel(index);
    this.skyMaterial.uniforms.uLow.value.fromArray(world.low);this.skyMaterial.uniforms.uHigh.value.fromArray(world.high);this.skyMaterial.uniforms.uHaze.value.fromArray(world.haze);
    this.scene.fog.color.set(world.fog);this.canvas.dataset.world=world.name;
  }

  mesh(geometry, material, parent, position) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    if (position) mesh.position.set(...position);
    parent.add(mesh); return mesh;
  }

  buildBlock() {
    const block = new THREE.Group(); block.name = 'rolling-block';
    this.mesh(new RoundedBoxGeometry(.96, 1.96, .96, 3, .045), this.materials.metal, block);
    const cap = new RoundedBoxGeometry(.97, .055, .97, 2, .02);
    this.mesh(cap, this.materials.trim, block, [0,.91,0]);
    this.mesh(cap, this.materials.dark, block, [0,-.91,0]);
    const rivet = new THREE.SphereGeometry(.024, 8, 6);
    for (const side of [-1,1]) for (const x of [-.37,.37]) for (const y of [-.78,.78]) {
      this.mesh(rivet, this.materials.trim, block, [x,y,side*.479]);
      this.mesh(rivet, this.materials.trim, block, [side*.479,y,x]);
    }
    for (const side of [-1,1]) {
      for(const x of [-.423,.423]) this.mesh(new THREE.BoxGeometry(.016,1.62,.012),this.materials.trim,block,[x,0,side*.481]);
      for(const y of [-.81,.81]) this.mesh(new THREE.BoxGeometry(.86,.018,.012),this.materials.trim,block,[0,y,side*.481]);
      for(const z of [-.423,.423]) this.mesh(new THREE.BoxGeometry(.012,1.62,.016),this.materials.trim,block,[side*.481,0,z]);
      for(const y of [-.81,.81]) this.mesh(new THREE.BoxGeometry(.012,.018,.86),this.materials.trim,block,[side*.481,y,0]);
    }
    // An asymmetric serial plate makes the accumulated face rotation visible.
    const label = document.createElement('canvas');label.width=256;label.height=256;
    const c=label.getContext('2d');c.fillStyle='#30383b';c.fillRect(0,0,256,256);
    c.strokeStyle='#8a9591';c.lineWidth=3;c.strokeRect(10,10,236,236);
    c.fillStyle='#d3c5a7';c.font='bold 30px monospace';c.textAlign='center';c.fillText('SPINS',128,87);
    c.font='64px monospace';c.fillText('01',128,158);c.fillStyle='#8c9b9a';c.font='15px monospace';c.fillText('SOLID / 2×1',128,210);
    const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;
    this.mesh(new THREE.PlaneGeometry(.52,.52),new THREE.MeshStandardMaterial({map:texture,roughness:.63,metalness:.4}),block,[0,.12,.484]);
    for(let i=0;i<5;i++)this.mesh(new THREE.BoxGeometry(.63,.008,.022),this.materials.dark,block,[0,.981,(i-2)*.105]);
    return block;
  }

  label(text,color='#93dcf6') {
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=100;
    const c=canvas.getContext('2d');c.fillStyle='#14212be6';c.fillRect(0,0,640,100);c.strokeStyle=color;c.lineWidth=3;c.strokeRect(2,2,636,96);
    c.fillStyle=color;c.font='bold 56px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(text,320,51);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,toneMapped:false,depthWrite:false}));
    sprite.userData.ownedMaterial=true;sprite.userData.ownedTexture=true;sprite.userData.labelSize=[100,18];this.labels?.push(sprite);return sprite;
  }

  buildLandingPad(parent,deck,target,upperHeight) {
    const w=target.pose==='x'?2:1,d=target.pose==='z'?2:1,x=target.x,z=target.z;
    const points=[[x+.05,.035,z+.05],[x+w-.05,.035,z+.05],[x+w-.05,.035,z+d-.05],[x+.05,.035,z+d-.05],[x+.05,.035,z+.05]].map(p=>new THREE.Vector3(...p));
    const border=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#80dcff',toneMapped:false}));border.userData.ownedMaterial=true;parent.add(border);
    const fill=this.mesh(new THREE.PlaneGeometry(w-.12,d-.12),new THREE.MeshBasicMaterial({color:'#5acfff',transparent:true,opacity:.2,depthWrite:false,toneMapped:false}),parent,[x+w/2,.017,z+d/2]);fill.rotation.x=-Math.PI/2;fill.userData.ownedMaterial=true;fill.castShadow=false;
    const padLabel=this.label(`${target.id} / ${target.pose==='up'?'EM PÉ':'DEITADO'}`);padLabel.position.set(x+w/2,.65,z+d+.35);padLabel.scale.set(1.9,.34,1);parent.add(padLabel);
    const guidePoints=[new THREE.Vector3(x+w+.13,.1,z+.12),new THREE.Vector3(x+w+.13,upperHeight-deck.height-.1,z+.12)];
    const guide=new THREE.Line(new THREE.BufferGeometry().setFromPoints(guidePoints),new THREE.LineDashedMaterial({color:'#8bdfff',dashSize:.12,gapSize:.13,transparent:true,opacity:.5,toneMapped:false}));guide.computeLineDistances();guide.userData.ownedMaterial=true;guide.userData.dropGuide=true;parent.add(guide);
    this.landingPads.push({border,fill,unlock:target.unlock});
  }

  setLevel(level) {
    // Shared materials/geometry survive between levels; dispose only level-owned meshes.
    this.board.traverse(object=>{if(object.geometry && !object.isSprite && object.geometry!==this.tileGeometry)object.geometry.dispose();if(object.userData.ownedTexture)object.material.map?.dispose();if(object.userData.ownedMaterial)object.material.dispose();});
    this.board.clear(); this.bridges=[];this.buttons=[];this.gates=[];this.landingPads=[];this.portals=[];this.labels=[];this.shafts=[];this.runeMarks=[];this.deckGroups=[];this.deckPoints=[];this.lastState=null;this.currentLevel=level;
    const nonempty=[], decks=decksOf(level);
    this.framePoints=[];
    decks.forEach((deck,layerIndex)=>{
    const deckGroup=new THREE.Group();deckGroup.position.y=deck.height;this.board.add(deckGroup);this.deckGroups.push(deckGroup);this.deckPoints.push([]);
    const deckCells=[];
    deck.map.forEach((row,z)=>[...row].forEach((kind,x)=>{
      if(kind==='.')return;
      nonempty.push([x,z,deck.height]);deckCells.push([x,z]);
      for(const px of [x,x+1])for(const pz of [z,z+1])for(const py of [deck.height-.3,deck.height+2.1]){const point=new THREE.Vector3(px,py,pz);this.framePoints.push(point);this.deckPoints[layerIndex].push(point);}
      const group=new THREE.Group();group.position.set(x+.5,0,z+.5);deckGroup.add(group);
      if(kind==='O'||kind==='H') {
        // Leave a genuine 1×1 hole. Recessed walls and rim never obstruct the block.
        for(const side of [-1,1]) {
          this.mesh(new THREE.BoxGeometry(1.03,.42,.045),this.materials.dark,group,[0,-.21,side*.52]);
          this.mesh(new THREE.BoxGeometry(.045,.42,1.03),this.materials.dark,group,[side*.52,-.21,0]);
          this.mesh(new THREE.BoxGeometry(1.02,.025,.035),this.materials.trim,group,[0,.008,side*.515]);
          this.mesh(new THREE.BoxGeometry(.035,.025,1.02),this.materials.trim,group,[side*.515,.008,0]);
        }
        const portalMaterial = new THREE.ShaderMaterial({
          transparent:true,side:THREE.DoubleSide,depthWrite:false,
          uniforms:{uTime:{value:0},uLocked:{value:0},uShaft:{value:kind==='H'?1:0}},
          vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
          fragmentShader:'varying vec2 vUv;uniform float uTime;uniform float uLocked;uniform float uShaft;void main(){vec2 p=vUv-.5;float r=max(abs(p.x),abs(p.y));float ring=exp(-pow((r-.38)*32.,2.));float glow=.12/(.15+length(p)*4.);vec3 base=mix(vec3(.55,.9,.7),vec3(.95,.5,.2),uLocked);base=mix(base,vec3(.2,.75,1.),uShaft);vec3 col=base*(glow+ring*.7);gl_FragColor=vec4(col,.85);}',
          toneMapped:false,
        });
        const portal=this.mesh(new THREE.PlaneGeometry(.98,.98),portalMaterial,group,[0,-.36,0]);portal.rotation.x=-Math.PI/2;portal.userData.ownedMaterial=true;portal.castShadow=false;
        const light=new THREE.PointLight(kind==='H'?'#70d2ff':'#84d1a6',1.4,3);light.position.y=.15;group.add(light);
        if(kind==='O')this.portals.push({portal,light,deck});
        else {
          const below=decks[layerIndex+1]?.targets?.find(t=>t.x===x&&t.z===z);
          const label=this.label(`↓ ${below?.id||''} / EM PÉ`);label.position.set(0,.55,.82);group.add(label);
          const sequence=(deck.runes||[]).map(r=>r.symbol).join(' → ')||'SELADO';
          const lockedLabel=this.label(sequence,'#ddc09b');lockedLabel.position.copy(label.position);group.add(lockedLabel);
          const cap=this.mesh(this.tileGeometry,this.materials.dark,group,[0,-.125,0]);
          this.shafts.push({deck,portal,cap,label,lockedLabel});
        }
      } else {
        const slab=this.mesh(this.tileGeometry,this.materials[kind==='F'?'fragile':kind==='B'||kind==='G'?'bridge':kind==='L'?'landing':kind==='D'?'launch':'stone'],group,[0,-.125,0]);
        if(kind==='R') {
          const rune=deck.runes.find(r=>r.x===x&&r.z===z),canvas=document.createElement('canvas');canvas.width=canvas.height=256;
          const c=canvas.getContext('2d');c.fillStyle='#293238';c.fillRect(0,0,256,256);c.strokeStyle='#bfb49a';c.lineWidth=5;c.beginPath();c.arc(128,128,105,0,Math.PI*2);c.stroke();c.fillStyle='#e3cc9d';c.font='bold 125px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(rune.symbol,128,137);
          const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
          const plaque=this.mesh(new THREE.PlaneGeometry(.7,.7),new THREE.MeshStandardMaterial({map,emissiveMap:map,emissive:'#edc578',emissiveIntensity:0,roughness:.62,metalness:.25}),group,[0,.014,0]);plaque.rotation.x=-Math.PI/2;plaque.userData.ownedMaterial=true;plaque.userData.ownedTexture=true;plaque.castShadow=false;this.runeMarks.push({mesh:plaque,bit:rune.bit});
        }
        if(kind==='G') {
          const ghost=new THREE.LineSegments(new THREE.EdgesGeometry(this.tileGeometry),new THREE.LineBasicMaterial({color:'#ffc38a',transparent:true,opacity:.6,toneMapped:false}));
          ghost.position.y=-.125;ghost.userData.ownedMaterial=true;group.add(ghost);this.gates.push({slab,ghost,deck});
        }
        if(kind==='D') {
          const arrow=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.25,.012,-.2),new THREE.Vector3(.12,.012,0),new THREE.Vector3(-.25,.012,.2)]),new THREE.LineBasicMaterial({color:'#88dff5',toneMapped:false}));arrow.userData.ownedMaterial=true;group.add(arrow);
        }
        if(kind==='B') {
          this.bridges.push(group);
          for(let i=-1;i<=1;i++)this.mesh(new THREE.BoxGeometry(.9,.012,.022),this.materials.trim,group,[0,.008,i*.25]);
        }
        if(kind==='S') {
          const button=this.mesh(new THREE.CylinderGeometry(.27,.29,.045,32),this.materials.green,group,[0,.02,0]);this.buttons.push(button);
          const ring=this.mesh(new THREE.TorusGeometry(.18,.013,8,32),this.materials.trim,group,[0,.047,0]);ring.rotation.x=Math.PI/2;
        }
        if(kind==='F') {
          const pts=[[-.35,.008,-.35],[-.05,.008,-.16],[-.18,.008,.02],[.17,.008,.18],[.1,.008,.4]].map(p=>new THREE.Vector3(...p));
          const crack=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#69412e'}));crack.userData.ownedMaterial=true;group.add(crack);
        }
      }
    }));
    for(const target of deck.targets||[])this.buildLandingPad(deckGroup,deck,target,decks[layerIndex-1]?.height??deck.height);
    if(level.layers&&deckCells.length){
      const lx=Math.min(...deckCells.map(p=>p[0])),lz=Math.min(...deckCells.map(p=>p[1]));
      const label=this.label(`P${String(layerIndex+1).padStart(2,'0')} / ${deck.height>0?'+':''}${deck.height.toFixed(1)} m`,'#e7ccb0');
      label.position.set(lx+1,.55,lz-.6);label.scale.set(2.5,.39,1);deckGroup.add(label);
    }
    });
    const minX=Math.min(...nonempty.map(p=>p[0])),maxX=Math.max(...nonempty.map(p=>p[0]))+1;
    const minZ=Math.min(...nonempty.map(p=>p[1])),maxZ=Math.max(...nonempty.map(p=>p[1]))+1;
    const minY=Math.min(...decks.map(d=>d.height)),maxY=Math.max(...decks.map(d=>d.height));
    this.bounds={minX,maxX,minZ,maxZ,minY,maxY};this.target=new THREE.Vector3((minX+maxX)/2,(minY+maxY)/2+.25,(minZ+maxZ)/2);
    this.yaw=0;this.controls.target.copy(this.target);
    this.keyLight.position.copy(this.target).add(new THREE.Vector3(-5,12,5));this.keyLight.target.position.copy(this.target);
    this.fitCamera();
  }

  frameFor(indices) {
    const points=indices.flatMap(index=>this.deckPoints[index]);
    const box=new THREE.Box3().setFromPoints(points),target=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3());let distance=Math.max(size.x,size.z,size.y,3)*1.3;
    const camera=new THREE.PerspectiveCamera(this.camera.fov,this.camera.aspect,.1,150);
    for(let i=0;i<80;i++) {
      const h=distance*Math.cos(this.elevation);
      camera.position.set(target.x+Math.sin(this.yaw)*h,target.y+Math.sin(this.elevation)*distance,target.z+Math.cos(this.yaw)*h);
      camera.lookAt(target);camera.updateMatrixWorld();
      if(points.every(p=>{const v=p.clone().project(camera);return Math.abs(v.x)<.85&&Math.abs(v.y)<.8;}))break;
      distance*=1.055;
    }
    return {target,position:camera.position.clone(),distance};
  }
  applyFrame(frame) {
    this.target=frame.target.clone();this.camera.position.copy(frame.position);this.controls.target.copy(frame.target);
    this.distance=this.camera.position.distanceTo(frame.target);this.controls.minDistance=this.distance*.7;this.controls.maxDistance=this.distance*1.5;
    this.camera.lookAt(frame.target);this.controls.update();
  }
  fitCamera() {
    if(!this.deckPoints?.length)return;
    this.yaw=0;this.transitionCamera=null;this.viewLayer=this.lastState?.layer||0;
    this.applyFrame(this.frameFor([this.viewLayer]));
  }
  stageView(state,animation) {
    const plan=stagePresentation(state,animation,this.deckGroups.length),decks=decksOf(this.currentLevel);
    plan.forEach((floor,index)=>{const group=this.deckGroups[index];group.visible=floor.visible;group.position.set(floor.offset[0],decks[index].height+floor.offset[1],floor.offset[2]);group.traverse(object=>{if(object.userData.dropGuide)object.visible=!!animation&&['reveal','land'].includes(animation.phase);});});
    this.canvas.dataset.visiblePlanes=plan.flatMap((floor,index)=>floor.visible?[index+1]:[]).join(',');
    const transitioning=animation&&['reveal','land','focus'].includes(animation.phase);
    this.canvas.dataset.sceneStage=transitioning?animation.phase:'playing';this.controls.enabled=!transitioning;
    if(transitioning) {
      if(this.transitionCamera?.animation!==animation) {
        this.yaw=Math.atan2(this.camera.position.x-this.controls.target.x,this.camera.position.z-this.controls.target.z);
        this.transitionCamera={animation,start:{position:this.camera.position.clone(),target:this.controls.target.clone()},pair:this.frameFor([animation.from.layer||0,animation.to.layer||0]),end:this.frameFor([animation.to.layer||0])};
      }
      const transition=this.transitionCamera,t=smooth(animation.progress||0);
      const a=animation.phase==='reveal'?transition.start:transition.pair,b=animation.phase==='focus'?transition.end:transition.pair;
      this.applyFrame({position:a.position.clone().lerp(b.position,animation.phase==='land'?1:t),target:a.target.clone().lerp(b.target,animation.phase==='land'?1:t)});
    } else if(this.viewLayer!==(state.layer||0)||this.transitionCamera) {
      this.viewLayer=state.layer||0;this.applyFrame(this.frameFor([this.viewLayer]));this.transitionCamera=null;
    }
  }

  setCamera(yaw) {
    this.yaw=yaw;
    const horizontal=this.distance*Math.cos(this.elevation);
    this.camera.position.set(this.target.x+Math.sin(yaw)*horizontal,this.target.y+Math.sin(this.elevation)*this.distance,this.target.z+Math.cos(yaw)*horizontal);
    this.controls.target.copy(this.target);this.camera.lookAt(this.target);this.controls.update();this.render();
  }
  orbit(amount) { if(this.transitionCamera)return;const offset=this.camera.position.clone().sub(this.controls.target);this.setCamera(Math.atan2(offset.x,offset.z)+amount); }
  resetCamera(){if(this.transitionCamera)return;this.fitCamera();this.setCamera(0);}
  worldDirection(input){return worldDirection(input,this.controls.getAzimuthalAngle());}
  inputDirection(world){return inputDirection(world,this.controls.getAzimuthalAngle());}

  resize() {
    const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    this.renderer.setSize(rect.width,rect.height,false);this.camera.aspect=rect.width/rect.height;this.camera.updateProjectionMatrix();this.fitCamera();
  }

  draw(state,orientation,animation,hideBlock=false) {
    if(!this.currentLevel)return;
    this.lastState=state;
    this.stageView(state,animation);
    for(const shaft of this.shafts){const open=((state.sigils||0)&(shaft.deck.exitRequires||0))===(shaft.deck.exitRequires||0);shaft.cap.visible=!open;shaft.portal.visible=open;shaft.label.visible=open;shaft.lockedLabel.visible=!open;}
    for(const rune of this.runeMarks){rune.mesh.material.emissiveIntensity=((state.sigils||0)&rune.bit)?1.3:0;}
    for(const bridge of this.bridges)bridge.visible=state.bridge;
    for(const button of this.buttons)button.position.y=state.bridge ? .006 : .02;
    for(const gate of this.gates){const open=gateOpen(gate.deck,state);gate.slab.visible=open;gate.ghost.visible=!open;}
    for(const pad of this.landingPads){const active=!!((state.unlocked||0)&pad.unlock);pad.border.material.color.set(active?'#b8edb0':'#80dcff');pad.fill.material.color.set(active?'#98eab1':'#5acfff');}
    const unlocked=((state.unlocked||0)&(this.currentLevel.requiredUnlocks||0))===(this.currentLevel.requiredUnlocks||0);
    for(const {portal,light,deck}of this.portals){const open=unlocked&&((state.sigils||0)&(deck.exitRequires||0))===(deck.exitRequires||0);portal.material.uniforms.uLocked.value=open?0:1;light.color.set(open?'#84d1a6':'#e1a269');}
    this.block.visible=!hideBlock;
    this.block.position.copy(centerOf(state));this.block.quaternion.copy(orientation);
    if(animation?.phase==='roll') {
      const p=animation.progress||0,t=p*p*(3-2*p);
      const transform=rollingTransform(animation.from,animation.orientation,animation.direction,t);
      this.block.position.copy(transform.position);this.block.quaternion.copy(transform.quaternion);
    } else if(animation?.phase==='land') {
      this.block.position.copy(landingPosition(animation.to,animation.outcome.drop,animation.progress||0));
    } else if(animation?.phase==='drop') {
      const p=animation.progress||0;this.block.position.y-=p*p*6;
      if(animation.outcome.status==='fall') {
        const tilt=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(.7,0,.3).normalize(),p*.7);
        this.block.quaternion.premultiply(tilt);
      }
    }
    this.render();
  }

  render() {
    if(!this.renderer||this.contextLost)return;
    // Keep the landing instructions readable at every zoom and screen size.
    const direction=this.camera.getWorldDirection(new THREE.Vector3());
    for(const label of this.labels||[]) {
      const distance=label.getWorldPosition(new THREE.Vector3()).sub(this.camera.position).dot(direction);
      const unit=2*Math.max(.1,distance)*Math.tan(THREE.MathUtils.degToRad(this.camera.fov)/2)/Math.max(1,this.canvas.clientHeight);
      const [w,h]=label.userData.labelSize;label.scale.set(w*unit,h*unit,1);
    }
    this.renderer.clear();this.renderer.render(this.skyScene,this.skyCamera);
    this.renderer.clearDepth();this.renderer.render(this.scene,this.camera);
  }
}
