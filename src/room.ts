import * as THREE from "three";

const FRAME_COUNT = 300;
const CACHE_RADIUS = 9;
const LOAD_LIMIT = 5;

export async function createRoom(canvas: HTMLCanvasElement) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, powerPreference: "high-performance" });
  } catch {
    return;
  }

  const width = document.documentElement.clientWidth;
  const quality = width >= 960 && width * devicePixelRatio >= 2200
    && renderer.capabilities.maxTextureSize >= 3840 ? "uhd" : "hd";

  function load(frame: number): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = new URL(`../assets/tour/frames/${quality}/${String(frame + 1).padStart(3, "0")}.jpg`, import.meta.url).href;
    return image.decode().then(() => image);
  }

  let first: HTMLImageElement;
  try {
    first = await load(0);
  } catch {
    renderer.dispose();
    return;
  }

  const texture = new THREE.Texture(first);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  scene.add(new THREE.Mesh(geometry, material));

  const cache = new Map([[0, first]]);
  const pending = new Set<number>();
  const failed = new Set<number>();
  let target = 0;
  let displayed = -1;
  let direction = 1;
  let disposed = false;

  function showNearest(): void {
    let nearest = displayed;
    let distance = Infinity;
    for (const index of cache.keys()) {
      if (Math.abs(index - target) >= distance) continue;
      nearest = index;
      distance = Math.abs(index - target);
    }
    const image = cache.get(nearest);
    if (!image || nearest === displayed) return;
    displayed = nearest;
    texture.image = image;
    texture.needsUpdate = true;
    canvas.dataset.frame = String(nearest + 1);
    renderer.render(scene, camera);
  }

  function preload(): void {
    const queue = [target];
    for (let distance = 1; distance <= CACHE_RADIUS; distance++) {
      queue.push(target + distance * direction, target - distance * direction);
    }
    for (const index of queue) {
      if (pending.size >= LOAD_LIMIT) break;
      if (index < 0 || index >= FRAME_COUNT || cache.has(index) || pending.has(index) || failed.has(index)) continue;
      pending.add(index);
      void load(index).then((image) => {
        if (disposed || Math.abs(target - index) > CACHE_RADIUS) return;
        cache.set(index, image);
        showNearest();
      }).catch(() => failed.add(index)).finally(() => {
        pending.delete(index);
        if (!disposed) preload();
      });
    }
  }

  return {
    draw(progress: number) {
      const index = Math.round(THREE.MathUtils.clamp(progress, 0, 1) * (FRAME_COUNT - 1));
      if (index !== target) direction = Math.sign(index - target);
      target = index;
      for (const key of cache.keys()) {
        if (Math.abs(key - target) > CACHE_RADIUS && key !== displayed) cache.delete(key);
      }
      showNearest();
      preload();
    },
    resize() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const ratio = (width / height) / (first.width / first.height);
      texture.repeat.set(Math.min(1, ratio), Math.min(1, 1 / ratio));
      texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
      renderer.setPixelRatio(Math.min(devicePixelRatio, quality === "uhd" ? Infinity : 1.25, 3840 / width, 2160 / height));
      renderer.setSize(width, height, false);
      showNearest();
      renderer.render(scene, camera);
      preload();
    },
    dispose() {
      disposed = true;
      cache.clear();
      texture.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      delete canvas.dataset.frame;
    },
  };
}
