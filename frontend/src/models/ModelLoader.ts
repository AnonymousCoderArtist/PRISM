import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { ResourceKind } from "../resources/resourceTypes";
import { RESOURCE_MODELS } from "../resources/resourceRegistry";

const loader = new GLTFLoader();
const cache = new Map<string, THREE.Group>();
const promiseCache = new Map<string, Promise<THREE.Group>>();

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
  const bodyMat = getSharedMaterial(`body-${kind}`, () => new THREE.MeshStandardMaterial({
    color: kind === "helicopter" ? 0xe8f4f8 : kind === "boat" ? 0xdbeff5 : kind === "rescue_vehicle" ? 0xc0392b : 0xf8fafa,
    roughness: 0.38, metalness: 0.14,
  }));
  const accentMat = getSharedMaterial("accent-red", () => new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.42 }));
  const darkMat = getSharedMaterial("dark", () => new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.72, metalness: 0.12 }));
  const glassMat = getSharedMaterial("glass", () => new THREE.MeshStandardMaterial({ color: 0x7fb8d8, roughness: 0.18, metalness: 0.22, transparent: true, opacity: 0.42 }));
  if (kind === "helicopter") {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.45, 3.4, 12, 24), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.62;
    g.add(body);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.15, 20, 16), bodyMat);
    nose.scale.set(1, 0.82, 0.82);
    nose.position.set(1.85, 0.62, 0);
    g.add(nose);
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.22, 3.4, 20), bodyMat);
    tailBoom.rotation.z = Math.PI / 2;
    tailBoom.position.set(-2.9, 0.62, 0);
    g.add(tailBoom);
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.05, 0.9), bodyMat);
    tailFin.position.set(-4.45, 1.05, 0);
    g.add(tailFin);
    const skidL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.18), darkMat);
    skidL.position.set(0, -0.38, 0.72);
    g.add(skidL);
    const skidR = skidL.clone();
    skidR.position.set(0, -0.38, -0.72);
    g.add(skidR);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.14, 0.34), darkMat);
    rotor.position.set(0.22, 1.42, 0);
    rotor.name = "__rotor_main";
    g.add(rotor);
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.65, 0.14), darkMat);
    tailRotor.position.set(-4.62, 0.92, 0);
    tailRotor.name = "__rotor_tail";
    g.add(tailRotor);
    const win = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), glassMat);
    win.scale.set(1, 0.62, 1.55);
    win.position.set(1.15, 0.95, 0);
    g.add(win);
  } else if (kind === "boat") {
    const hull = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.95, 1.82, 4, 1, 2), bodyMat);
    hull.position.y = 0.22;
    g.add(hull);
    const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.95, 18, 1, false, -Math.PI / 2, Math.PI), bodyMat);
    bow.rotation.z = Math.PI / 2;
    bow.rotation.x = Math.PI / 2;
    bow.position.set(2.52, 0.22, 0);
    bow.scale.set(1, 0.98, 1);
    g.add(bow);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.14, 1.58), new THREE.MeshStandardMaterial({ color: 0xeef4f6, roughness: 0.55 }));
    deck.position.set(-0.1, 0.72, 0);
    g.add(deck);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.95, 1.32), new THREE.MeshStandardMaterial({ color: 0xf5f8f9, roughness: 0.42 }));
    cabin.position.set(0.45, 1.08, 0);
    g.add(cabin);
    const cabinWin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.42, 1.34), glassMat);
    cabinWin.position.set(0.45, 1.12, 0);
    g.add(cabinWin);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.14, 1.9), accentMat);
    stripe.position.y = 0.38;
    g.add(stripe);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 8, 18, Math.PI), darkMat);
    rail.position.set(-1.1, 0.92, 0);
    rail.rotation.y = Math.PI / 2;
    g.add(rail);
  } else if (kind === "rescue_vehicle") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.18, 1.82, 2, 1, 1), bodyMat);
    base.position.y = 0.68;
    g.add(base);
    const cabin2 = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.02, 1.62), new THREE.MeshStandardMaterial({ color: 0xf1f3f4, roughness: 0.42 }));
    cabin2.position.set(1.05, 1.42, 0);
    g.add(cabin2);
    const wind = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 1.38), glassMat);
    wind.position.set(1.62, 1.42, 0);
    g.add(wind);
    const lightbar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.42), new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: 0.45 }));
    lightbar.position.set(1.05, 1.98, 0);
    lightbar.name = "__beacon";
    g.add(lightbar);
    const wheels = new THREE.Group();
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.38, 24);
    wheelGeo.rotateZ(Math.PI / 2);
    for (const z of [-0.92, 0.92]) for (const x of [-1.08, 1.08]) {
      const w = new THREE.Mesh(wheelGeo, darkMat);
      w.position.set(x, 0.24, z);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x8a8e91, metalness: 0.42, roughness: 0.38 }));
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(w.position);
      wheels.add(w);
      wheels.add(hub);
    }
    g.add(wheels);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.16, 1.86), accentMat);
    stripe.position.y = 0.88;
    g.add(stripe);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.85, 1.45, 1.68, 2, 1, 1), bodyMat);
    body.position.y = 0.88;
    g.add(body);
    const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(3.95, 0.24, 1.74), accentMat);
    stripe2.position.y = 0.86;
    g.add(stripe2);
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.22, 1.52), new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.35 }));
    front.position.set(1.82, 0.88, 0);
    g.add(front);
    const wind2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.68, 1.32), glassMat);
    wind2.position.set(1.62, 1.12, 0);
    g.add(wind2);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.06), accentMat);
    crossH.position.set(0.38, 1.12, 0.85);
    g.add(crossH);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.06), accentMat);
    crossV.position.set(0.38, 1.12, 0.85);
    g.add(crossV);
    const wheels2 = new THREE.Group();
    const wGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 24);
    wGeo.rotateZ(Math.PI / 2);
    for (const z of [-0.84, 0.84]) for (const x of [-1.22, 1.22]) {
      const w = new THREE.Mesh(wGeo, darkMat);
      w.position.set(x, 0.28, z);
      wheels2.add(w);
    }
    g.add(wheels2);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: 0.72 }));
    beacon.position.set(1.08, 1.68, 0);
    beacon.name = "__beacon";
    g.add(beacon);
    const siren = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.28), darkMat);
    siren.position.set(1.72, 1.58, 0);
    g.add(siren);
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
        const box = new THREE.Box3().setFromObject(scene);
        if (!box.isEmpty()) {
          const center = new THREE.Vector3();
          box.getCenter(center);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const expected = kind === "helicopter" ? 7 : kind === "boat" ? 5.2 : 4.6;
          if (maxDim > 18 || maxDim < 0.6) {
            const s = expected / maxDim;
            scene.scale.setScalar(s);
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
            const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
            if (mat) {
              if ((mat as THREE.MeshStandardMaterial).roughness !== undefined) {
                (mat as THREE.MeshStandardMaterial).roughness = Math.min(0.92, ((mat as THREE.MeshStandardMaterial).roughness ?? 0.5) * 0.92 + 0.08);
              }
              mat.needsUpdate = true;
            }
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            if (mat) (mat as THREE.MeshStandardMaterial).side = THREE.FrontSide;
          }
          if (/rotor/i.test(o.name)) o.name = `__rotor_${o.name}`;
        });
        cache.set(url, scene);
        resolve(cloneGroup(scene));
      },
      undefined,
      (err) => {
        console.warn(`[ModelLoader] ${kind} failed ${url}`, err);
        promiseCache.delete(url);
        const ph = makePlaceholder(kind);
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
