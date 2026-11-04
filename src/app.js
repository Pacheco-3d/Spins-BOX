import { LEVELS, initialState, step, solve, decksOf } from './engine.js';
import { readProgress, saveProgress, nextDifficulty, LEGACY_LEVEL_IDS } from './journey.js';
import { Quaternion } from 'three';
import { GameRenderer } from './renderer.js';
import { rollingTransform } from './motion.js';
import { worldForLevel } from './theme.js';

const $ = id => document.getElementById(id);
const canvas = $('board');
let view;
try { view = new GameRenderer(canvas); canvas.dataset.renderer = 'webgl'; }
catch { canvas.dataset.renderer = 'unavailable'; }
const orientation = new Quaternion();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;try{storage=localStorage;}catch{}
const levelIds=LEVELS.map(l=>l.id);
let savedLevel=readProgress(storage,LEVELS.length,levelIds);
let levelIndex = savedLevel, state = initialState(LEVELS[savedLevel]), history = [], moves = 0;
let animation = null, finished = false;
let advanceTimer=0;
let hintCount=0;
const difficultyNames=LEVELS.map(l=>l.chapter);
let notificationTimer, sound = false, audio;
let records = {};
try { records = JSON.parse(localStorage.getItem('spins-box-records') || '{}') || {}; } catch {}
for(const [index,id]of LEGACY_LEVEL_IDS.entries())if(Number.isInteger(records[index])&&!Number.isInteger(records[id]))records[id]=records[index];
const directions = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
const labels = { up: '↑ cima', down: '↓ baixo', left: '← esquerda', right: '→ direita' };
const level = () => LEVELS[levelIndex];
function ping(frequency = 180, length = .08, type = 'sine') {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * .6, audio.currentTime + length);
    gain.gain.setValueAtTime(.05, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + length);
  } catch { /* Audio is optional; gameplay remains available. */ }
}

function notify(text) {
  clearTimeout(notificationTimer); $('notification').textContent = text; $('notification').classList.add('show');
  notificationTimer = setTimeout(() => $('notification').classList.remove('show'), 3600);
}
function updateUI() {
  const multi = !!level().layers;
  document.querySelector('.game-panel').classList.toggle('multilevel', multi);
  const layer = state.layer || 0;
  const deck=decksOf(level())[layer],runes=!!deck.runes?.length;
  $('deck-status').textContent = `${difficultyNames[levelIndex]}${multi ? ` · PLANO ${layer+1}`:''}`;
  $('render-mode').textContent = multi ? decksOf(level())[layer].name.toUpperCase() : '3D · METAL & PEDRA';
  $('mission-title').innerHTML = runes ? 'A pedra<br>guarda sinais.' : multi ? 'Caia no<br>lugar certo.' : 'O encaixe<br>perfeito.';
  $('mission-text').innerHTML = runes ? 'Desperte as <strong>marcas</strong>.<br>Descubra a passagem.<br>Observe a ordem gravada.' : multi ? 'Acerte o <strong>alvo azul</strong><br>na posição indicada.<br>O pouso libera o caminho.' : 'Leve o bloco até o portal.<br>O detalhe? Ele precisa<br>chegar <strong>em pé.</strong>';
  $('stage-number').textContent = String(levelIndex + 1).padStart(2, '0');
  $('stage-name').textContent = level().name;
  $('moves').textContent = String(moves).padStart(2, '0');
  $('best').textContent = Number.isInteger(records[level().id]) ? String(records[level().id]).padStart(2, '0') : '—';
  $('undo').disabled = !history.length || !!animation || !!advanceTimer;
  $('restart').disabled=!!advanceTimer;
  $('hint-text').textContent = level().hint;
  const track=document.createElement('span');track.className='journey-track';track.setAttribute('aria-hidden','true');
  const fill=document.createElement('span');fill.style.width=`${(levelIndex+1)/LEVELS.length*100}%`;track.append(fill);
  const count=document.createElement('span');count.className='journey-count';count.textContent=`${String(levelIndex+1).padStart(2,'0')} / ${LEVELS.length}`;
  $('level-progress').replaceChildren(track,count);
  $('level-progress').setAttribute('aria-label',`Dificuldade ${levelIndex+1}: ${difficultyNames[levelIndex]}. Avance concluindo o desafio.`);
}
function load(index) {
  clearTimeout(advanceTimer);advanceTimer=0;$('advance-message').hidden=true;
  levelIndex = Math.min(index,savedLevel); state = initialState(level()); history = []; moves = 0; animation = null; finished = false;hintCount=0;
  $('overlay').hidden = true; $('notification').classList.remove('show'); clearTimeout(notificationTimer);
  orientation.identity(); view?.setWorld(levelIndex);view?.setLevel(level());document.documentElement.dataset.world=worldForLevel(levelIndex).name;updateUI(); fit();
}
function undo() {
  if (animation || advanceTimer || !history.length) return;
  const previous = history.pop(); state = previous.state; orientation.copy(previous.orientation); moves--; finished = false; $('overlay').hidden = true;
  updateUI(); draw(); ping(220);
}
function move(direction) {
  if (animation || finished) return;
  if (!view || view.contextLost) { notify('O 3D precisa de WebGL 2. Ative a aceleração gráfica do navegador.'); return; }
  const outcome = step(level(), state, direction);
  history.push({ state: { ...state }, orientation: orientation.clone() }); moves++;
  animation = { orientation: orientation.clone(), from: { ...state }, to: outcome.state, direction, outcome, start: performance.now(), duration: reducedMotion ? 1 : 340, phase: 'roll' };
  updateUI(); ping(150 + moves % 3 * 15);
  requestAnimationFrame(tick);
}
function moveInput(input){move(view?.worldDirection(input)||input);}
function finish(outcome) {
  finished = true;
  const win = outcome.status === 'win', last = levelIndex === LEVELS.length - 1;
  if (win) {
    savedLevel=Math.max(savedLevel,nextDifficulty(levelIndex,'win',LEVELS.length));saveProgress(storage,savedLevel,levelIds);
    if (!Number.isInteger(records[level().id]) || moves < records[level().id]) records[level().id] = moves;
    try { localStorage.setItem('spins-box-records', JSON.stringify(records)); } catch {}
    ping(650, .35, 'triangle');
  } else ping(90, .3, 'triangle');
  if(win&&!last){
    $('advance-text').textContent=levelIndex===19?'Você chegou a um novo mundo. Os próximos desafios vão mais longe.':'Você avançou para o próximo nível.';
    $('advance-message').hidden=false;$('overlay').hidden=true;
    const nextIndex=levelIndex+1;
    const advance=()=>{if($('help-dialog').open){advanceTimer=setTimeout(advance,250);return;}advanceTimer=0;load(nextIndex);};
    advanceTimer=setTimeout(advance,1600);updateUI();return;
  }
  $('result-icon').textContent = win ? '✦' : '↶';
  $('result-eyebrow').textContent = win ? last ? 'JORNADA COMPLETA' : 'CAMINHO ENCONTRADO' : 'UM NOVO PONTO DE VISTA';
  $('result-title').textContent = win ? last ? 'Você encontrou o equilíbrio.' : 'O encaixe perfeito.' : 'Mais um giro?';
  $('result-text').textContent = win ? `Fase concluída em ${moves} movimentos.${last ? `\n${LEVELS.length} descobertas. Uma nova perspectiva.` : '\nO próximo caminho espera por você.'}` : outcome.reason === 'fragile' ? 'O cobre pede passos deitados.\nDesfaça o giro e experimente outra posição.' : outcome.reason === 'alignment' ? 'O alvo pede outro encaixe.\nDesfaça a queda e prepare a posição indicada.' : 'Um giro a mais também ensina.\nDesfaça o movimento e tente outro caminho.';
  $('result-action').textContent = win ? last ? 'Recomeçar a jornada  ↗' : 'Próxima dificuldade  →' : 'Desfazer movimento  ↶';
  $('result-action').onclick = win ? () => {if(last){savedLevel=0;saveProgress(storage,0,levelIds);}load(last ? 0 : levelIndex + 1);} : undo;
  $('result-secondary').textContent = win ? 'Jogar esta fase novamente' : 'Reiniciar fase';
  $('result-secondary').onclick = () => load(levelIndex);
  $('overlay').hidden = false; updateUI(); $('result-action').focus({ preventScroll: true });
}
function tick(now) {
  if (!animation) return;
  const a = animation, progress = Math.min(1, (now - a.start) / a.duration);
  a.progress = progress; draw();
  if (progress < 1) { requestAnimationFrame(tick); return; }
  if (a.phase === 'roll') {
    orientation.copy(rollingTransform(a.from, a.orientation, a.direction, 1).quaternion);
    if (a.outcome.status === 'land') {
      state = { ...a.to, layer: a.from.layer, elevation: a.from.elevation, unlocked: a.from.unlocked };
      a.phase = 'reveal'; a.start = now; a.duration = reducedMotion ? 1 : 1000; a.progress = 0;
      $('deck-status').textContent = 'ALGO SE MOVE NAS PROFUNDEZAS…';
      requestAnimationFrame(tick); return;
    }
    state = a.to;
    if (a.outcome.status === 'win' || a.outcome.status === 'fall') {
      a.phase = 'drop'; a.start = now; a.duration = reducedMotion ? 1 : 470;
      a.progress = 0; requestAnimationFrame(tick); return;
    }
    if (a.from.bridge !== state.bridge) { notify(state.bridge ? 'A ponte está aberta. Seu caminho continua.' : 'A ponte foi recolhida.'); ping(420, .2); }
    if(a.outcome.event==='rune'){notify('Uma marca despertou. A pedra responde.');ping(510,.2,'triangle');}
    if(a.outcome.event==='runeOrder')notify('Um sinal anterior ainda precisa despertar. Observe a ordem gravada.');
    if(a.outcome.event==='sealed'){const runes=decksOf(level())[state.layer||0].runes||[];notify(`A passagem espera ${runes.length===1?'a marca':'as marcas'} ${runes.map(r=>r.symbol).join(' → ')}. Fique em pé para despertar.`);}
    animation = null; updateUI(); draw();
  } else if(a.phase==='reveal') {
    a.phase='land';a.start=now;a.progress=0;a.duration=reducedMotion?1:Math.max(600,Math.sqrt(a.outcome.drop)*340);
    $('deck-status').textContent=`DESCENDO PARA O PLANO ${a.to.layer+1}…`;requestAnimationFrame(tick);
  } else if (a.phase === 'land') {
    state = a.to; a.phase='focus';a.start=now;a.progress=0;a.duration=reducedMotion?1:750;updateUI();draw();ping(480,.22,'triangle');requestAnimationFrame(tick);
  } else if(a.phase==='focus') {
    animation=null;hintCount=0;updateUI();draw();
    notify(a.outcome.target ? `Alvo ${a.outcome.target} acertado! Plano ${state.layer + 1} desbloqueado.` : 'O bloco encontrou apoio. A passagem continua selada: desfaça para preparar o pouso no alvo.');
  } else { animation = null; draw(true); finish(a.outcome); }
}

function draw(hideBlock = false) { view?.draw(state, orientation, animation, hideBlock); }
function fit() { view?.resize(); draw(finished); }

$('help').onclick=()=>$('help-dialog').showModal();
$('help-close').onclick=()=>$('help-dialog').close();
$('help-dialog').addEventListener('click',event=>{if(event.target===$('help-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
$('camera-left').onclick=()=>view?.orbit(-Math.PI/2);
$('camera-right').onclick=()=>view?.orbit(Math.PI/2);
$('camera-reset').onclick=()=>view?.resetCamera();
canvas.addEventListener('renderer-lost',()=>notify('O 3D foi interrompido. Aguarde a recuperação da aceleração gráfica.'));
canvas.addEventListener('renderer-restored',()=>{notify('3D recuperado.');draw(finished);});
$('restart').onclick=()=>load(levelIndex);$('undo').onclick=undo;
$('sound').onclick=()=>{sound=!sound;$('sound-label').textContent=sound?'Som ligado':'Som desligado';$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Desativar som':'Ativar som');if(sound)ping(440,.15);};
$('hint').onclick=()=>{if(animation||finished)return;hintCount++;const clue=decksOf(level())[state.layer||0].clue||level().strategy;if(clue&&hintCount===1){notify(clue);return;}const route=solve(level(),state);notify(route?.length?`Experimente ${labels[view?.inputDirection(route[0])||route[0]]}. Um giro de cada vez.`:'Desfaça um giro para abrir outra possibilidade. Você pode tentar sem limite.');};
window.addEventListener('keydown',e=>{
  if($('help-dialog').open||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  const key=e.key.length===1?e.key.toLowerCase():e.key;
  if(directions[key]) {
    e.preventDefault();if(e.repeat)return;moveInput(directions[key]);
  } else if(key==='q'||key==='e') { e.preventDefault();view?.orbit((key==='q'?-1:1)*Math.PI/2); } else if(key==='0') { view?.resetCamera(); } else if(key==='r') { e.preventDefault();load(levelIndex); } else if(key==='z') { e.preventDefault();undo(); }
});
let touchStart=null, pointers=new Set();
canvas.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);if(pointers.size>1||e.button!==0){touchStart=null;return;}touchStart=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);if(!touchStart)return;const dx=e.clientX-touchStart[0],dy=e.clientY-touchStart[1];touchStart=null;if(Math.hypot(dx,dy)<25)return;moveInput(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');});
canvas.addEventListener('pointercancel',e=>{touchStart=null;pointers.delete(e.pointerId);});
new ResizeObserver(fit).observe($('canvas-wrap'));
load(savedLevel);
if(!view) { notify('Não foi possível iniciar o 3D. Use um navegador com WebGL 2 e aceleração gráfica ativada.');$('notification').classList.add('renderer-error'); }
