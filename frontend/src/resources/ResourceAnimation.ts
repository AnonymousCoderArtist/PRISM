import * as THREE from "three";
import type { ResourceKind } from "./resourceTypes";

export type AnimState = {
  rotorAngle: number;
  beaconPhase: number;
  bobPhase: number;
};

/**
 * Per-model subtle animation — restrained for ops centre.
 * Called every frame with dt (seconds) and updates model internals in-place.
 */
export function animateModel(group: THREE.Group, kind: ResourceKind, dt: number, state: AnimState): void {
  state.beaconPhase += dt;
  state.bobPhase += dt;
  state.rotorAngle += dt * (kind === "helicopter" ? 18 : 0);

  // rotor — parent has rotateX=PI/2 so vertical is Z in local; handle both axes for GLB/plcaholder compatibility
  if (kind === "helicopter") {
    group.traverse(o => {
      if (o.name.includes("__rotor_main") || o.name.includes("__rotor")) {
        o.rotation.y = state.rotorAngle;
        o.rotation.z = state.rotorAngle;
      }
      if (o.name.includes("__rotor_tail")) {
        o.rotation.x = state.rotorAngle * 1.6;
        o.rotation.y = state.rotorAngle * 1.6;
      }
    });
    // hover bob vertical (inner has rotateX=PI/2, so altitude is local Z — we bob Z)
    // keep also Y for fallback placeholders that haven't been rotated yet
    group.position.z = Math.sin(state.bobPhase * 0.9) * 0.06;
    group.position.y = Math.sin(state.bobPhase * 0.9) * 0.02;
  } else if (kind === "boat") {
    // gentle rocking + bob — after rotateX, Z is up, Y is forward
    const roll = Math.sin(state.bobPhase * 0.55) * 0.018;
    const pitch = Math.sin(state.bobPhase * 0.38) * 0.012;
    group.rotation.y = roll; // after X=PI/2, Y acts as roll
    group.rotation.x = Math.PI / 2 + pitch;
    group.position.z = Math.sin(state.bobPhase * 0.72) * 0.045;
  } else if (kind === "ambulance") {
    // beacon pulse
    const beacon = group.getObjectByName("__beacon") as THREE.Mesh | undefined;
    if (beacon) {
      const mat = beacon.material as THREE.MeshStandardMaterial;
      const on = Math.sin(state.beaconPhase * 3.2) > 0;
      mat.emissiveIntensity = on ? 1.1 : 0.18;
      // also toggle visible ping scale for neon flash
      (beacon as THREE.Mesh).scale.setScalar(on ? 1.08 : 0.98);
    }
  } else {
    // rescue_vehicle / ambulance grounded — ensure no lift
    group.position.z = 0;
    group.position.y = 0;
  }
  const shadow = group.getObjectByName("__shadow") as THREE.Mesh | undefined;
  if (shadow) {
    const mat = shadow.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.18 + Math.sin(state.bobPhase * 0.7) * 0.035;
  }
}

export function createAnimState(_kind: ResourceKind): AnimState {
  // randomize phase so fleet doesn't sync
  const rnd = Math.random() * Math.PI * 2;
  return { rotorAngle: rnd, beaconPhase: rnd, bobPhase: rnd * 0.7 };
}
