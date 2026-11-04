import { Quaternion, Vector3 } from 'three';

export function dimensions(state) {
  return [state.pose === 'x' ? 2 : 1, state.pose === 'up' ? 2 : 1, state.pose === 'z' ? 2 : 1];
}

export function centerOf(state) {
  const [w, h, d] = dimensions(state);
  return new Vector3(state.x + w / 2, (state.elevation || 0) + h / 2, state.z + d / 2);
}

// Rotate the entire rigid body around the contact edge, never its center.
// The quaternion is accumulated so that each face keeps its identity across rolls.
export function rollingTransform(state, orientation, direction, progress) {
  const [w, , d] = dimensions(state);
  const axis = new Vector3(), pivot = centerOf(state); pivot.y = state.elevation || 0;
  switch (direction) {
    case 'right': axis.z = -1; pivot.x = state.x + w; break;
    case 'left': axis.z = 1; pivot.x = state.x; break;
    case 'down': axis.x = 1; pivot.z = state.z + d; break;
    case 'up': axis.x = -1; pivot.z = state.z; break;
    default: throw new Error(`Direção inválida: ${direction}`);
  }
  const rotation = new Quaternion().setFromAxisAngle(axis, Math.max(0, Math.min(1, progress)) * Math.PI / 2);
  return {
    position: centerOf(state).sub(pivot).applyQuaternion(rotation).add(pivot),
    quaternion: rotation.multiply(orientation).normalize(),
    pivot,
  };
}

export function landingPosition(destination, drop, progress) {
  const position = centerOf(destination), t = Math.max(0, Math.min(1, progress));
  position.y += drop * (1 - t * t);
  return position;
}
