import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { ResourceKind } from "../resources/resourceTypes";
import { RESOURCE_MODELS } from "../resources/resourceRegistry";

const loader = new GLTFLoader();
const cache = new Map<string, THREE.Group>();
const promiseCache = new Map<string, Promise<THREE.Group>>();

// Yaw offsets per kind — GLB forward varies per asset; tuned for Guwahati test
// Three's model forward after rotateX=PI/2 is +Y in mercator world; yaw is Z.
// Offsets measured: ambulance -90, helicopter +90, boat 0, rescue_vehicle 0
const YAW_OFFSET: Record<ResourceKind, number> = {
  ambulance: -Math.PI / 2,
  helicopter: Math.PI,
  boat: 0,
  rescue_vehicle: -Math.PI / 2,
};

export function getYawOffset(kind: ResourceKind): number {
  return YAW_OFFSET[kind] ?? 0;
}

const sharedMatCache = new Map<string, THREE.Material>();
function getSharedMaterial(key: string, make: () => THREE.Material): THREE.Material {
  if (!sharedMatCache.has(key)) sharedMatCache.set(key, make());
  return sharedMatCache.get(key)!;
}

function makePlaceholder(kind: ResourceKind): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = getSharedMaterial(`body-${kind}`, () => new THREE.MeshStandardMaterial({ color: kind === "helicopter" ? 0x06b6d4 : kind === "boat" ? 0x2a6b7a : kind === "rescue_vehicle" ? 0xc0392b : 0xffffff, roughness: 0.85, metalness: 0.08 }));
  const accentMat = getSharedMaterial("accent-red", () => new THREE.MeshStandardMaterial({ color: 0xff3b30 }));
  const darkMat = getSharedMaterial("dark", () => new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.9 }));
  if (kind === "helicopter") {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.4, 3.2, 4, 10), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.6;
    g.add(body);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 3.2, 8), bodyMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-2.8, 0.6, 0);
    g.add(tail);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.12, 0.32), darkMat);
    rotor.position.set(0.2, 1.35, 0);
    rotor.name = "__rotor_main";
    g.add(rotor);
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.12), darkMat);
    tailRotor.position.set(-4.4, 0.9, 0);
    tailRotor.name = "__rotor_tail";
    g.add(tailRotor);
  } else if (kind === "boat") {
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.9, 1.7), bodyMat);
    hull.position.y = 0.2;
    g.add(hull);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 1.2), new THREE.MeshStandardMaterial({ color: 0xe8eceb }));
    cabin.position.set(0.4, 0.95, 0);
    g.add(cabin);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 1.78), accentMat);
    stripe.position.y = 0.35;
    g.add(stripe);
  } else if (kind === "rescue_vehicle") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.1, 1.7), bodyMat);
    base.position.y = 0.65;
    g.add(base);
    const cabin2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 1.5), new THREE.MeshStandardMaterial({ color: 0xeaecee }));
    cabin2.position.set(1.0, 1.35, 0);
    g.add(cabin2);
    const wheels = new THREE.Group();
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.34, 10);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const z of [-0.85, 0.85]) for (const x of [-1.0, 1.0]) {
      const w = new THREE.Mesh(wheelGeo, darkMat);
      w.position.set(x, 0.22, z);
      wheels.add(w);
    }
    g.add(wheels);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.35, 1.55), bodyMat);
    body.position.y = 0.85;
    g.add(body);
    const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.22, 1.62), accentMat);
    stripe2.position.y = 0.82;
    g.add(stripe2);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.06), accentMat);
    cross.position.set(0.35, 1.05, 0.8);
    g.add(cross);
    const wheels2 = new THREE.Group();
    const wGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.28, 10);
    wGeo.rotateZ(Math.PI / 2);
    for (const z of [-0.78, 0.78]) for (const x of [-1.15, 1.15]) {
      const w = new THREE.Mesh(wGeo, darkMat);
      w.position.set(x, 0.26, z);
      wheels2.add(w);
    }
    g.add(wheels2);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: 0.6 }));
    beacon.position.set(1.05, 1.62, 0);
    beacon.name = "__beacon";
    g.add(beacon);
  }
  return g;
}

function cloneGroup(src: THREE.Group): THREE.Group {
  return src.clone(true);
}

export function loadModel(kind: ResourceKind): Promise<THREE.Group> {
  const url = RESOURCE_MODELS[kind];
  if (cache.has(url)) return Promise.resolve(cloneGroup(cache.get(url)!));
  if (promiseCache.has(url)) return promiseCache.get(url)!.then(g => cloneGroup(g));
  const p = new Promise<THREE.Group>((resolve) => {
    loader.load(
      url,
      gltf => {
        const scene = (gltf.scene as THREE.Group) ?? new THREE.Group();
        // Keep original asset scale — don't aggressive normalize; just ensure not gigantic.
        // Compute bounds to center pivot at model base and middle horizontally.
        const box = new THREE.Box3().setFromObject(scene);
        if (!box.isEmpty()) {
          const center = new THREE.Vector3();
          box.getCenter(center);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          // Only normalize if asset is wildly out of expected range (>15m or <0.8m)
          const expected = kind === "helicopter" ? 7 : 5;
          if (maxDim > 15 || maxDim < 0.8) {
            const s = expected / maxDim;
            scene.scale.setScalar(s);
            // recompute after scale
            const box2 = new THREE.Box3().setFromObject(scene);
            const c2 = new THREE.Vector3();
            box2.getCenter(c2);
            scene.position.set(-c2.x, -box2.min.y + 0.02, -c2.z);
          } else {
            scene.position.set(-center.x, -box.min.y + 0.02, -center.z);
          }
        }
        scene.traverse(o => {
          const mesh = o as THREE.Mesh;
          if ((mesh as THREE.Mesh).isMesh) {
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
          if (/rotor/i.test(o.name)) o.name = `__rotor_${o.name}`;
        });
        cache.set(url, scene);
        resolve(cloneGroup(scene));
      },
      undefined,
      () => {
        const ph = makePlaceholder(kind);
        cache.set(url, ph);
        resolve(cloneGroup(ph));
      }
    );
  });
  promiseCache.set(url, p);
  return p;
}

export function preloadAll(): Promise<void> {
  const kinds: ResourceKind[] = ["ambulance", "helicopter", "boat", "rescue_vehicle"];
  return Promise.all(kinds.map(k => loadModel(k).then(() => undefined))).then(() => undefined);
}

export function getPlaceholder(kind: ResourceKind): THREE.Group {
  return makePlaceholder(kind);
}

export function clearCache(): void {
  cache.clear();
  promiseCache.clear();
}
