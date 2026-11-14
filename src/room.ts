import * as THREE from "three";

// The anchors follow the walking line through the doorway and around the table.
const shots = [
  { file: "gevel", anchor: [0.54, 0.34], pan: [0.008, -0.004], travel: 0.32 },
  { file: "entree", anchor: [0.51, 0.42], pan: [0.015, -0.003], travel: 0.27 },
  { file: "woonruimte", anchor: [0.60, 0.48], pan: [0.055, -0.006], travel: 0.22 },
  { file: "doorloop", anchor: [0.55, 0.48], pan: [-0.012, -0.004], travel: 0.23 },
  { file: "tuin", anchor: [0.51, 0.40], pan: [0, -0.004], travel: 0.12 },
];

export async function createRoom(canvas: HTMLCanvasElement) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, powerPreference: "high-performance" });
  } catch {
    return;
  }

  const width = document.documentElement.clientWidth;
  const uhd = width >= 960 && width * window.devicePixelRatio >= 2200
    && renderer.capabilities.maxTextureSize >= 3840;
  const loader = new THREE.TextureLoader();
  const images = await Promise.allSettled(shots.map(async ({ file }) => {
    const quality = uhd ? "uhd" : "hd";
    const texture = await loader.loadAsync(new URL(`../assets/tour/${file}-${quality}.webp`, import.meta.url).href);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }));
  const textures = images.flatMap((image) => image.status === "fulfilled" ? [image.value] : []);
  if (textures.length !== shots.length) {
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
    firstView: { value: new THREE.Vector3() },
    secondView: { value: new THREE.Vector3() },
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
      uniform vec3 firstView;
      uniform vec3 secondView;
      uniform float blend;

      vec2 ray(vec4 crop, vec3 view) {
        vec2 uv = (screen - 0.5) * crop.xy + crop.zw;
        vec2 fromAnchor = uv - view.xy;
        // Floor and side walls pass closer to the camera than the vanishing point.
        float nearPlane = smoothstep(0.02, 0.63, length(fromAnchor * vec2(1.4, 1.1)));
        float floorPlane = smoothstep(0.0, 0.35, view.y - uv.y);
        float depth = mix(0.26, 0.98, max(nearPlane, floorPlane));
        return view.xy + fromAnchor / (1.0 + view.z * depth);
      }

      void main() {
        vec3 a = texture2D(first, ray(firstCrop, firstView)).rgb;
        vec3 b = texture2D(second, ray(secondCrop, secondView)).rgb;
        gl_FragColor = vec4(mix(a, b, blend), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const screen = new THREE.Mesh(geometry, material);
  screen.frustumCulled = false;
  scene.add(screen);

  let aspect = 1;
  let progress = 0;

  function setView(index: number, phase: number, crop: THREE.Vector4, view: THREE.Vector3): void {
    const shot = shots[index];
    const image = textures[index].image;
    const ratio = aspect / (image.width / image.height);
    const cropWidth = Math.min(1, ratio) * 0.95;
    const cropHeight = Math.min(1, 1 / ratio) * 0.95;
    const centerX = THREE.MathUtils.clamp(shot.anchor[0] + shot.pan[0] * phase, cropWidth / 2, 1 - cropWidth / 2);
    const centerY = THREE.MathUtils.clamp(0.49 + shot.pan[1] * phase, cropHeight / 2, 1 - cropHeight / 2);
    crop.set(cropWidth, cropHeight, centerX, centerY);
    view.set(shot.anchor[0], shot.anchor[1], phase * shot.travel);
  }

  function draw(value: number): void {
    progress = value;
    const distance = THREE.MathUtils.clamp(value, 0, 1) * shots.length;
    const current = Math.min(shots.length - 1, Math.floor(distance));
    const next = Math.min(shots.length - 1, current + 1);
    const local = distance - current;
    // Both views move during the overlap. The incoming pose matches the next segment's start.
    setView(current, (local + 0.44) / 1.44, uniforms.firstCrop.value, uniforms.firstView.value);
    setView(next, Math.max(0, local - 0.56) / 1.44, uniforms.secondCrop.value, uniforms.secondView.value);
    uniforms.first.value = textures[current];
    uniforms.second.value = textures[next];
    uniforms.blend.value = current === next ? 0 : THREE.MathUtils.smootherstep(local, 0.56, 1);
    renderer.render(scene, camera);
  }

  return {
    draw,
    resize() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      aspect = width / height;
      const pixelRatio = Math.min(
        window.devicePixelRatio,
        uhd ? Math.sqrt(3840 * 2160 / (width * height)) : 1.25,
        3840 / width,
        2160 / height,
      );
      renderer.setPixelRatio(pixelRatio);
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
