import * as THREE from "three";

const viewpoints = [
  { file: "hero.jpg", x: 0.55 },
  { file: "tour-entree.webp", x: 0.52 },
  { file: "tour-woonruimte.webp", x: 0.54 },
  { file: "tour-tuin.webp", x: 0.52 },
];

export async function createRoom(canvas: HTMLCanvasElement) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, powerPreference: "low-power" });
  } catch {
    return;
  }

  const loader = new THREE.TextureLoader();
  const images = await Promise.allSettled(viewpoints.map(async ({ file }) => {
    const texture = await loader.loadAsync(new URL(`../assets/${file}`, import.meta.url).href);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }));
  const textures = images.flatMap((image) => image.status === "fulfilled" ? [image.value] : []);
  if (textures.length !== viewpoints.length) {
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  const geometry = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    first: { value: textures[0] },
    second: { value: textures[1] },
    firstCrop: { value: new THREE.Vector4() },
    secondCrop: { value: new THREE.Vector4() },
    blend: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    vertexShader: `
      varying vec2 screen;
      void main() {
        screen = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 screen;
      uniform sampler2D first;
      uniform sampler2D second;
      uniform vec4 firstCrop;
      uniform vec4 secondCrop;
      uniform float blend;
      void main() {
        vec3 a = texture2D(first, (screen - 0.5) * firstCrop.xy + firstCrop.zw).rgb;
        vec3 b = texture2D(second, (screen - 0.5) * secondCrop.xy + secondCrop.zw).rgb;
        gl_FragColor = vec4(mix(a, b, blend), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  scene.add(new THREE.Mesh(geometry, material));

  let aspect = 1;
  let progress = 0;
  function crop(index: number, zoom: number, target: THREE.Vector4): void {
    const image = textures[index].image;
    const ratio = aspect / (image.width / image.height);
    const width = Math.min(1, ratio) / zoom;
    const height = Math.min(1, 1 / ratio) / zoom;
    const center = THREE.MathUtils.clamp(viewpoints[index].x, width / 2, 1 - width / 2);
    target.set(width, height, center, 0.5);
  }

  function draw(value: number): void {
    progress = value;
    const position = THREE.MathUtils.clamp(value, 0, 1) * viewpoints.length;
    const index = Math.min(viewpoints.length - 1, Math.floor(position));
    const next = Math.min(viewpoints.length - 1, index + 1);
    const step = position - index;
    uniforms.first.value = textures[index];
    uniforms.second.value = textures[next];
    crop(index, 1 + step * 0.27, uniforms.firstCrop.value);
    crop(next, 1, uniforms.secondCrop.value);
    uniforms.blend.value = index === next ? 0 : THREE.MathUtils.smoothstep(step, 0.67, 0.99);
    renderer.render(scene, camera);
  }

  return {
    draw,
    resize() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      aspect = width / height;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, height, false);
      draw(progress);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    },
  };
}
