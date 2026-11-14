import * as THREE from "three";

export function createRoom(canvas: HTMLCanvasElement) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch {
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#c3c7ad");
  scene.fog = new THREE.FogExp2("#c3c7ad", 0.027);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const stone = new THREE.MeshStandardMaterial({ color: "#c0aa88", roughness: 0.89 });
  const plaster = new THREE.MeshStandardMaterial({ color: "#a8a18b", roughness: 0.94 });
  const walnut = new THREE.MeshStandardMaterial({ color: "#68503a", roughness: 0.82 });
  const frame = new THREE.MeshStandardMaterial({ color: "#2c3027", roughness: 0.63 });
  const lawn = new THREE.MeshStandardMaterial({ color: "#60673e", roughness: 1 });
  const fabric = new THREE.MeshStandardMaterial({ color: "#bfb7a5", roughness: 0.92 });
  const foliage = new THREE.MeshStandardMaterial({ color: "#75804b", roughness: 1, flatShading: true });
  const glass = new THREE.MeshStandardMaterial({
    color: "#cde8d8", transparent: true, opacity: 0.15, roughness: 0.2, depthWrite: false,
  });

  const boxGeometry = new THREE.BoxGeometry();
  function box(material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) {
    const mesh = new THREE.Mesh(boxGeometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = material !== glass;
    mesh.receiveShadow = material !== glass;
    scene.add(mesh);
    return mesh;
  }

  box(lawn, 0, -0.34, -4, 70, 0.3, 70);
  box(stone, 0, -0.1, 0, 11.5, 0.2, 29);
  box(plaster, -5.15, 1.7, 1, 0.42, 3.4, 15);
  box(plaster, 0, 3.45, 1, 10.75, 0.26, 15.8);
  box(stone, -3.75, 1.7, 8.65, 3.2, 3.4, 0.52);
  box(stone, 3.7, 1.7, 8.65, 3.3, 3.4, 0.52);
  box(walnut, 0, 3.04, 8.65, 4.2, 0.74, 0.6);
  box(plaster, -3.33, 1.7, -6.55, 4, 3.4, 0.52);
  box(walnut, 2.78, 3.1, -6.55, 5.2, 0.6, 0.52);

  box(glass, 5.15, 1.7, 0.9, 0.07, 3.4, 15);
  for (let index = 0; index <= 6; index++) {
    box(frame, 5.15, 1.7, -6.6 + index * 2.5, 0.19, 3.4, 0.12);
  }
  box(frame, 5.15, 0.06, 0.9, 0.24, 0.12, 15);
  box(frame, 5.15, 3.32, 0.9, 0.24, 0.12, 15);
  for (let index = 0; index < 18; index++) {
    box(walnut, -4.9, 1.7, 0.65 + index * 0.42, 0.14, 3.4, 0.09);
  }
  for (let index = 0; index < 8; index++) {
    box(stone, 0, -0.09, 11.3 + index * 1.3, 2.55, 0.16, 1.19);
  }

  box(walnut, 3.15, 0.17, 2, 2.95, 0.34, 1.18);
  box(fabric, 3.15, 0.42, 2, 2.78, 0.24, 1.06);
  box(fabric, 3.15, 0.76, 2.39, 2.78, 0.44, 0.29);
  box(stone, 3.15, 0.34, 0.67, 1.57, 0.15, 0.67);
  box(frame, 3.15, 0.16, 0.67, 0.85, 0.22, 0.47);
  box(walnut, -3.55, 0.48, -3.6, 2.45, 0.96, 2.5);
  box(stone, -3.55, 1.01, -3.6, 2.55, 0.12, 2.6);
  box(stone, 0.9, 0.38, -13.8, 5, 0.76, 0.55);
  box(plaster, -4.7, 1.15, -11.6, 0.32, 2.3, 5);

  const crownGeometry = new THREE.IcosahedronGeometry(1, 1);
  const trees = [[7, -1, 3.7], [8.8, -5, 3.1], [7.4, -11, 4.1], [-2.5, -12.9, 3.7], [4.45, -13, 3.2], [-7, 10, 3.1]];
  trees.forEach(([x, z, height], index) => {
    box(walnut, x, height * 0.37, z, 0.18, height * 0.74, 0.18);
    for (let branch = 0; branch < 5; branch++) {
      const crown = new THREE.Mesh(crownGeometry, foliage);
      const angle = branch * 2.4 + index;
      crown.position.set(x + Math.cos(angle) * 0.62, height * (0.75 + branch * 0.05), z + Math.sin(angle) * 0.64);
      crown.rotation.set(0.3 * branch, angle, 0.2);
      crown.scale.set(0.83, 0.76, 0.88);
      crown.castShadow = true;
      scene.add(crown);
    }
  });

  scene.add(new THREE.HemisphereLight("#e1e8d8", "#77674f", 2.3));
  const sun = new THREE.DirectionalLight("#ffe2b6", 3.25);
  sun.position.set(10, 12, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, far: 55 });
  sun.shadow.normalBias = 0.045;
  sun.shadow.bias = -0.0003;
  sun.shadow.needsUpdate = true;
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.08, 90);
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.65, 1.75, 15),
    new THREE.Vector3(0, 1.62, 9),
    new THREE.Vector3(0.45, 1.61, 4.9),
    new THREE.Vector3(1.15, 1.62, 0),
    new THREE.Vector3(2.05, 1.65, -5.8),
    new THREE.Vector3(2.8, 1.8, -10.8),
  ]);
  const view = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.8, 1.68, 5.4),
    new THREE.Vector3(2.8, 1.66, 0.8),
    new THREE.Vector3(4.5, 1.62, -1.2),
    new THREE.Vector3(3.75, 1.65, -7.5),
    new THREE.Vector3(2.7, 1.7, -13),
    new THREE.Vector3(-1.8, 2.05, -13.3),
  ]);
  const target = new THREE.Vector3();
  let progress = 0;
  function draw(value: number): void {
    progress = value;
    path.getPointAt(value, camera.position);
    view.getPoint(value, target);
    camera.lookAt(target);
    renderer.render(scene, camera);
  }

  return {
    draw,
    resize() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.fov = camera.aspect < 1 ? 74 : 58;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, camera.aspect < 1 ? 1.35 : 1.7));
      renderer.setSize(width, height, false);
      draw(progress);
    },
    dispose() {
      boxGeometry.dispose();
      crownGeometry.dispose();
      [stone, plaster, walnut, frame, lawn, fabric, foliage, glass].forEach((material) => material.dispose());
      sun.shadow.dispose();
      renderer.dispose();
    },
  };
}
