/* ============================================================
   DS hub: the "giant futuristic laboratory" 3D scene.
   Pure progressive enhancement over the real <a> links in
   index.html. If this file errors, fails to load Three.js, or
   canBoot3D is false, the static glowing-card grid underneath
   is the entire experience and nothing here ever runs.
   ============================================================ */

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch (e) {
    return false;
  }
}

const canBoot3D =
  typeof prefersReducedMotion !== "undefined" &&
  !prefersReducedMotion &&
  window.matchMedia("(pointer: fine)").matches &&
  canUseWebGL();

const ROOMS = [
  { key: "videoart", color: 0xd1414c, pos: [-4.5, -1.8, -10] },
  { key: "web", color: 0x3d8ef0, pos: [4.8, -1.4, -11] },
  { key: "lab", color: 0x4ade80, pos: [-5.2, -2.2, -13] },
  { key: "creative", color: 0xec4899, pos: [5.4, -1.6, -9.5] },
];

if (canBoot3D) {
  import("three")
    .then((THREE) => initHubScene(THREE))
    .catch((err) => {
      console.error("DS hub: Three.js failed to load, static grid remains", err);
    });
}

function initHubScene(THREE) {
  const canvas = document.getElementById("labCanvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08090b, 0.065);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  const basePos = { x: 0, y: 0.3, z: 4 };
  camera.position.set(basePos.x, basePos.y, basePos.z);
  camera.lookAt(0, -0.6, -10);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x08090b, 1);

  scene.add(new THREE.AmbientLight(0xffffff, 0.12));

  const roomMeshes = [];
  const roomLights = [];

  ROOMS.forEach((room) => {
    const group = new THREE.Group();
    group.position.set(room.pos[0], room.pos[1], room.pos[2]);

    const geometry = new THREE.BoxGeometry(3.4, 3.4, 3.4);
    const material = new THREE.MeshPhysicalMaterial({
      color: room.color,
      transparent: true,
      opacity: 0.14,
      roughness: 0.3,
      metalness: 0.05,
      emissive: room.color,
      emissiveIntensity: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    const light = new THREE.PointLight(room.color, 3, 9, 2);
    light.position.set(0, 0, 0);
    group.add(light);

    scene.add(group);
    roomMeshes.push(group);
    roomLights.push(light);
  });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);

  if (typeof gsap !== "undefined") {
    roomLights.forEach((light, i) => {
      gsap.to(light, {
        intensity: 4.4,
        repeat: -1,
        yoyo: true,
        duration: 2.6 + i * 0.4,
        ease: "sine.inOut",
      });
    });
  }

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    camera.position.x = basePos.x + Math.sin(t * 0.12) * 0.7;
    camera.position.y = basePos.y + Math.cos(t * 0.09) * 0.3;
    camera.lookAt(0, -0.6, -10);
    roomMeshes.forEach((group, i) => {
      group.rotation.y = t * 0.05 * (i % 2 === 0 ? 1 : -1);
    });
    renderer.render(scene, camera);
  }
  animate();
}
