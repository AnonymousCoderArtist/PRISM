import * as maplibregl from "maplibre-gl";
import * as THREE from "three";
import type { CustomLayerInterface } from "maplibre-gl";
import { loadModel, getPlaceholder, getYawOffset } from "../../models/ModelLoader";
import type { PrismResource, ResourceKind } from "../../resources/resourceTypes";
import { animateModel, createAnimState, type AnimState } from "../../resources/ResourceAnimation";

type Managed = {
  id: string;
  kind: ResourceKind;
  outer: THREE.Group;
  inner: THREE.Group;
  lng: number;
  lat: number;
  targetLng: number;
  targetLat: number;
  startLng: number;
  startLat: number;
  heading: number;
  targetHeading: number;
  startHeading: number;
  lerpT: number;
  animState: AnimState;
  dataRef: PrismResource;
};

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function lerpAngle(a: number, b: number, t: number): number {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}
function ease(t: number): number { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

export class Resource3DLayer implements CustomLayerInterface {
  id = "prism-resources-3d";
  type = "custom" as const;
  renderingMode = "3d" as const;

  private map!: maplibregl.Map;
  private scene!: THREE.Scene;
  private camera!: THREE.Camera;
  private renderer!: THREE.WebGLRenderer;
  private managed = new Map<string, Managed>();
  private pending = new Map<string, PrismResource>();
  private selectedId: string | null = null;
  private onSelect?: (id: string | null) => void;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private raf = 0;
  private lastTs = 0;
  private disposed = false;
  private moveSpeed = 0.035;

  private baseScaleFactor = 32;
  private heliBoost = 1.35;
  private boatBoost = 1.15;

  constructor(opts?: { onSelect?: (id: string | null) => void }) {
    this.onSelect = opts?.onSelect;
  }

  onAdd(map: maplibregl.Map, gl: WebGLRenderingContext): void {
    this.map = map;
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();
    const amb = new THREE.AmbientLight(0xffffff, 1.02);
    const dir = new THREE.DirectionalLight(0xffffff, 0.95);
    dir.position.set(120, 180, 80);
    this.scene.add(amb);
    this.scene.add(dir);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x080820, 0.62);
    this.scene.add(hemi);

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
      alpha: true,
    });
    this.renderer.autoClear = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const canvas = map.getCanvas();
    const handleClick = (e: MouseEvent) => this.pick(e);
    canvas.addEventListener("click", handleClick);
    (this as unknown as { _clickHandler: unknown })._clickHandler = handleClick;

    for (const [, r] of this.pending) this.ensureModel(r);
    this.pending.clear();

    this.lastTs = performance.now();
    const loop = (ts: number) => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      this.tick(dt);
      this.map.triggerRepaint();
    };
    this.raf = requestAnimationFrame(loop);
  }

  onRemove(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    try {
      const canvas = this.map?.getCanvas();
      const h = (this as unknown as { _clickHandler?: (e: MouseEvent) => void })._clickHandler;
      if (canvas && h) canvas.removeEventListener("click", h);
    } catch {  }
    this.managed.forEach(m => this.scene.remove(m.outer));
    this.managed.clear();
    this.renderer?.dispose();
  }

  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, matrix: unknown): void {
    const raw: number[] = Array.isArray(matrix)
      ? (matrix as number[])
      : ((matrix as { defaultProjectionData?: { mainMatrix: number[] } })?.defaultProjectionData?.mainMatrix as number[]) ?? (matrix as number[]);
    const m = new THREE.Matrix4().fromArray(raw as number[]);
    this.camera.projectionMatrix = m;
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
  }

  setResources(resources: PrismResource[]): void {
    if (!this.scene) {
      resources.forEach(r => this.pending.set(r.id, r));
      return;
    }
    const incomingIds = new Set(resources.map(r => r.id));
    for (const id of Array.from(this.managed.keys())) {
      if (!incomingIds.has(id)) {
        const mg = this.managed.get(id)!;
        this.scene.remove(mg.outer);
        this.managed.delete(id);
      }
    }
    for (const r of resources) {
      const existing = this.managed.get(r.id);
      if (!existing) {
        this.ensureModel(r);
      } else {
        if (r.lng !== existing.targetLng || r.lat !== existing.targetLat) {
          existing.startLng = existing.lng;
          existing.startLat = existing.lat;
          existing.targetLng = r.lng;
          existing.targetLat = r.lat;
          existing.lerpT = 0;
        }
        if (r.heading !== existing.targetHeading) {
          existing.startHeading = existing.heading;
          existing.targetHeading = r.heading;
        }
        existing.dataRef = r;
      }
    }
  }

  setSelected(id: string | null): void {
    this.selectedId = id;
    void this.selectedId;
    for (const mg of this.managed.values()) {
      const s = mg.id === id ? 1.18 : 1.0;
      mg.inner.scale.setScalar(s);
    }
  }

  private mercatorTranslate(lng: number, lat: number, altMeters: number): { x: number; y: number; z: number; scale: number } {
    const mc = (maplibregl as unknown as { MercatorCoordinate: { fromLngLat: (c: [number, number], alt: number) => { x: number; y: number; z: number; meterInMercatorCoordinateUnits: () => number } } }).MercatorCoordinate.fromLngLat([lng, lat], altMeters);
    return { x: mc.x, y: mc.y, z: mc.z, scale: mc.meterInMercatorCoordinateUnits() };
  }

  private altitudeForKind(kind: ResourceKind): number {
    if (kind === "helicopter") return 22;
    if (kind === "boat") return 1.4;
    if (kind === "rescue_vehicle") return 3.2;
    return 3.0;
  }

  private async ensureModel(r: PrismResource): Promise<void> {
    const outer = new THREE.Group();
    let inner: THREE.Group;
    try {
      inner = await loadModel(r.kind);
    } catch {
      inner = getPlaceholder(r.kind);
    }
    inner.name = `inner-${r.id}`;
    inner.rotation.set(Math.PI / 2, 0, 0);
    const yawOffset = getYawOffset(r.kind);
    inner.userData.yawOffset = yawOffset;

    outer.add(inner);
    this.applyMercator(outer, inner, r.lng, r.lat, r.heading, r.kind);
    this.scene.add(outer);

    const mg: Managed = {
      id: r.id,
      kind: r.kind,
      outer,
      inner,
      lng: r.lng,
      lat: r.lat,
      targetLng: r.lng,
      targetLat: r.lat,
      startLng: r.lng,
      startLat: r.lat,
      heading: r.heading,
      targetHeading: r.heading,
      startHeading: r.heading,
      lerpT: 1,
      animState: createAnimState(r.kind),
      dataRef: r,
    };
    this.managed.set(r.id, mg);
  }

  private applyMercator(outer: THREE.Group, inner: THREE.Group, lng: number, lat: number, heading: number, kind: ResourceKind): void {
    const alt = this.altitudeForKind(kind);
    const { x, y, z, scale } = this.mercatorTranslate(lng, lat, alt);
    outer.position.set(x, y, z);
    const zoom = this.map ? this.map.getZoom() : 11.3;
    const base = scale * this.baseScaleFactor;
    const refZoom = 11.3;
    const zoomFactor = Math.pow(2, zoom - refZoom);
    let s = base / Math.max(0.12, zoomFactor);
    s = Math.max(base * 0.28, Math.min(base * 4.2, s));
    if (kind === "helicopter") s *= this.heliBoost;
    if (kind === "boat") s *= this.boatBoost;
    if (kind === "rescue_vehicle") s *= 1.05;
    outer.scale.set(s, s, s);
    const yawOffset: number = (inner.userData.yawOffset as number) ?? 0;
    inner.rotation.z = THREE.MathUtils.degToRad(heading) + yawOffset;
    inner.position.z = 0;
    inner.position.y = 0;
  }

  private tick(dt: number): void {
    for (const mg of this.managed.values()) {
      let moved = false;
      if (mg.lerpT < 1) {
        mg.lerpT = Math.min(1, mg.lerpT + this.moveSpeed * 60 * dt);
        const t = ease(mg.lerpT);
        const nlng = lerp(mg.startLng, mg.targetLng, t);
        const nlat = lerp(mg.startLat, mg.targetLat, t);
        const dLng = nlng - mg.lng;
        const dLat = nlat - mg.lat;
        if (Math.abs(dLng) > 1e-8 || Math.abs(dLat) > 1e-8) {
          const motionDeg = (Math.atan2(dLng, dLat) * 180) / Math.PI;
          mg.heading = lerpAngle(mg.heading, motionDeg, 0.22);
          mg.targetHeading = motionDeg;
          mg.startHeading = mg.heading;
        } else {
          mg.heading = lerpAngle(mg.startHeading, mg.targetHeading, t);
        }
        mg.lng = nlng;
        mg.lat = nlat;
        moved = true;
      } else if (mg.heading !== mg.targetHeading) {
        mg.heading = lerpAngle(mg.heading, mg.targetHeading, Math.min(1, dt * 4));
        moved = true;
      }
      if (moved || true) {
        this.applyMercator(mg.outer, mg.inner, mg.lng, mg.lat, mg.heading, mg.kind);
      }
      animateModel(mg.inner, mg.kind, dt, mg.animState);
    }
  }

  private pick(e: MouseEvent): void {
    if (!this.managed.size) return;
    const rect = this.map.getCanvas().getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const objs: THREE.Object3D[] = [];
    for (const m of this.managed.values()) objs.push(m.outer);
    const hits = this.raycaster.intersectObjects(objs, true);
    if (hits.length) {
      let best: string | null = null;
      let bestDist = Infinity;
      for (const mg of this.managed.values()) {
        const p = mg.outer.position.clone().project(this.camera as THREE.Camera & { projectionMatrix: THREE.Matrix4 });
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < bestDist && d < 0.08) { bestDist = d; best = mg.id; }
      }
      if (best) {
        this.setSelected(best);
        this.onSelect?.(best);
        e.stopPropagation();
      }
    }
  }

  hitTestLngLat(lng: number, lat: number, zoom: number): string | null {
    let best: string | null = null;
    let bd = Infinity;
    const thresh = zoom >= 13 ? 0.003 : zoom >= 11 ? 0.005 : 0.008;
    for (const mg of this.managed.values()) {
      const d = Math.hypot(mg.lng - lng, mg.lat - lat);
      if (d < bd && d < thresh) { bd = d; best = mg.id; }
    }
    return best;
  }
}
