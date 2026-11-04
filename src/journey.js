export const JOURNEY_KEY = 'spins-box-journey-v3';
export const LEGACY_LEVEL_IDS=['primeiros-passos','entre-mundos','equilibrio-delicado','queda-calculada','o-que-existe-abaixo'];
export function readProgress(storage, count, ids) {
  try {
    const raw=storage.getItem(JOURNEY_KEY);
    if(raw!==null){const value=JSON.parse(raw);if(ids&&typeof value==='string')return Math.max(0,ids.indexOf(value));return Number.isInteger(value)&&value>=0&&value<count?value:0;}
    if(ids){const old=JSON.parse(storage.getItem('spins-box-journey-v2'));if(Number.isInteger(old)&&old>=0&&old<LEGACY_LEVEL_IDS.length)return Math.max(0,ids.indexOf(LEGACY_LEVEL_IDS[old]));}
    return 0;
  } catch { return 0; }
}
export function saveProgress(storage, index, ids) { try { storage.setItem(JOURNEY_KEY,JSON.stringify(ids?ids[index]:index)); } catch {} }
export function nextDifficulty(index, status, count) { return status==='win'?Math.min(index+1,count-1):index; }
