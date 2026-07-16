import * as THREE from 'three';

let scene, camera, renderer;

// Concentric Orbit Showcase Models
let coreGroup;
let gemMesh, ring1Mesh, ring2Mesh, ring3Mesh;
let ring1Group, ring2Group, ring3Group;

// Interaction states
let targetScroll = 0;
let currentScroll = 0;
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

// Scroll Flight Path Map (Apple-style camera sweeps and focal zooms)
const pathPoints = [
  { scroll: 0.00, cam: new THREE.Vector3(0, 0, 62), look: new THREE.Vector3(12, 0, 0) },   // Hero: Centered-right offset
  { scroll: 0.25, cam: new THREE.Vector3(-14, 4, 18), look: new THREE.Vector3(0, 0, 0) },  // Skills: Zooms inside rings, close to gem
  { scroll: 0.50, cam: new THREE.Vector3(18, -4, 25), look: new THREE.Vector3(-6, 2, 0) }, // Experience: Diagonal side view
  { scroll: 0.75, cam: new THREE.Vector3(0, -18, 22), look: new THREE.Vector3(0, 0, 0) },  // Certifications: Looking up from bottom
  { scroll: 1.00, cam: new THREE.Vector3(0, 0, 62), look: new THREE.Vector3(0, 0, 0) }     // Contact: Centered broad view
];

const currentCamPos = new THREE.Vector3(0, 0, 62);
const currentLookAt = new THREE.Vector3(12, 0, 0);

// Color Themes
const themes = {
  all: { primary: 0x3455eb, secondary: 0x7b9aff }, 
  microsoft: { primary: 0x0078d4, secondary: 0x00a1e0 }, 
  oracle: { primary: 0xff3b30, secondary: 0xff9500 }, 
  salesforce: { primary: 0x00a1e0, secondary: 0x52b788 }, 
  'ai-data': { primary: 0xae30ff, secondary: 0xff30a2 }, 
  other: { primary: 0x10b981, secondary: 0xf58200 } 
};

let currentPrimaryColor = new THREE.Color(themes.all.primary);
let currentSecondaryColor = new THREE.Color(themes.all.secondary);
let targetPrimaryColor = new THREE.Color(themes.all.primary);
let targetSecondaryColor = new THREE.Color(themes.all.secondary);

export function initThree(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Scene (Pure black background, no fog for vector-sharp render)
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 500);
  camera.position.copy(currentCamPos);

  // Renderer (Crisp WebGL, ACES Filmic Tone Mapping for realistic metal reflections)
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  // Main Orbit Group
  coreGroup = new THREE.Group();
  scene.add(coreGroup);

  // 1. Central Core Element: Faceted Gemstone (AI Core)
  const gemGeo = new THREE.OctahedronGeometry(4.2, 0);
  const gemMat = new THREE.MeshStandardMaterial({
    color: currentPrimaryColor,
    roughness: 0.12,
    metalness: 0.9,
    flatShading: true
  });
  gemMesh = new THREE.Mesh(gemGeo, gemMat);
  coreGroup.add(gemMesh);

  // 2. Concentric Orbit Rings Groups (allows nested tilting and rotation)
  ring1Group = new THREE.Group();
  ring2Group = new THREE.Group();
  ring3Group = new THREE.Group();
  coreGroup.add(ring1Group, ring2Group, ring3Group);

  // Inner Ring (Torus)
  const ring1Geo = new THREE.TorusGeometry(9.5, 0.12, 12, 100);
  const ring1Mat = new THREE.MeshStandardMaterial({
    color: currentPrimaryColor,
    roughness: 0.08,
    metalness: 0.92
  });
  ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
  ring1Group.add(ring1Mesh);
  
  // Middle Ring
  const ring2Geo = new THREE.TorusGeometry(13.8, 0.12, 12, 100);
  const ring2Mat = new THREE.MeshStandardMaterial({
    color: currentSecondaryColor,
    roughness: 0.08,
    metalness: 0.92
  });
  ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2Group.add(ring2Mesh);

  // Outer Ring
  const ring3Geo = new THREE.TorusGeometry(18.2, 0.12, 12, 100);
  const ring3Mat = new THREE.MeshStandardMaterial({
    color: currentPrimaryColor,
    roughness: 0.08,
    metalness: 0.92
  });
  ring3Mesh = new THREE.Mesh(ring3Geo, ring3Mat);
  ring3Group.add(ring3Mesh);

  // Set initial crossed tilt angles for orbits
  ring1Group.rotation.x = Math.PI / 4.5;
  ring1Group.rotation.y = Math.PI / 6;

  ring2Group.rotation.x = -Math.PI / 3.8;
  ring2Group.rotation.z = Math.PI / 4;

  ring3Group.rotation.y = Math.PI / 2.2;
  ring3Group.rotation.x = Math.PI / 5.5;

  // Studio Lighting (Dual directional lighting + ambient fill for premium metallic sheen)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.18);
  scene.add(ambientLight);

  // Main directional light (Left-Front-Top)
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
  dirLight1.position.set(25, 45, 50);
  scene.add(dirLight1);

  // Rim light (Opposing bottom-right)
  const dirLight2 = new THREE.DirectionalLight(0x7b9aff, 1.4);
  dirLight2.position.set(-25, -45, -50);
  scene.add(dirLight2);

  // Inner Core Point light (Self-illumination reflecting on rings)
  const coreLight = new THREE.PointLight(0xffffff, 1.5, 45);
  coreLight.position.set(0, 0, 0);
  scene.add(coreLight);

  // Listeners
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousemove', onMouseMove);

  // Start loop
  animate();
}

function updateCameraFlight() {
  const progress = Math.max(0, Math.min(1, currentScroll));

  // Determine segment
  let segment = 0;
  for (let i = 0; i < pathPoints.length - 1; i++) {
    if (progress >= pathPoints[i].scroll && progress <= pathPoints[i + 1].scroll) {
      segment = i;
      break;
    }
  }

  const pA = pathPoints[segment];
  const pB = pathPoints[segment + 1];

  const range = pB.scroll - pA.scroll;
  const ratio = (progress - pA.scroll) / range;

  // Lerp vectors
  const targetPos = new THREE.Vector3().copy(pA.cam).lerp(pB.cam, ratio);
  const targetLook = new THREE.Vector3().copy(pA.look).lerp(pB.look, ratio);

  // Smooth camera easing
  currentCamPos.lerp(targetPos, 0.075);
  currentLookAt.lerp(targetLook, 0.075);

  camera.position.copy(currentCamPos);

  // Subtle mouse parallax camera tilt
  const parallaxFocus = new THREE.Vector3(
    currentLookAt.x + mouse.x * 6,
    currentLookAt.y + mouse.y * 6,
    currentLookAt.z
  );
  camera.lookAt(parallaxFocus);
}

export function updateMouse(x, y) {
  mouse.targetX = (x / window.innerWidth) * 2 - 1;
  mouse.targetY = -(y / window.innerHeight) * 2 + 1;
}

export function updateScroll(percentage) {
  targetScroll = percentage;
}

export function setThemeColor(category) {
  const theme = themes[category] || themes.all;
  targetPrimaryColor.set(theme.primary);
  targetSecondaryColor.set(theme.secondary);
}

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  // Damp mouse inputs
  mouse.x += (mouse.targetX - mouse.x) * 0.05;
  mouse.y += (mouse.targetY - mouse.y) * 0.05;

  // Damp scroll inputs
  currentScroll += (targetScroll - currentScroll) * 0.055;

  // Lerp theme colors
  currentPrimaryColor.lerp(targetPrimaryColor, 0.035);
  currentSecondaryColor.lerp(targetSecondaryColor, 0.035);

  // Apply colors to materials
  if (gemMesh) {
    gemMesh.material.color.copy(currentPrimaryColor);
    ring1Mesh.material.color.copy(currentPrimaryColor);
    ring2Mesh.material.color.copy(currentSecondaryColor);
    ring3Mesh.material.color.copy(currentPrimaryColor);
  }

  // Spin core gemstone
  if (gemMesh) {
    gemMesh.rotation.x = time * 0.2;
    gemMesh.rotation.y = time * 0.35;
  }

  // Spin concentric metallic rings on different axes (mechanical orbits)
  if (ring1Mesh && ring2Mesh && ring3Mesh) {
    ring1Mesh.rotation.z = time * 0.15;
    ring2Mesh.rotation.z = -time * 0.12;
    ring3Mesh.rotation.z = time * 0.08;
  }

  // Subtle mouse reaction rotation on the whole core system
  coreGroup.rotation.y = time * 0.02 + mouse.x * 0.25;
  coreGroup.rotation.x = mouse.y * 0.25;

  // Update camera coordinates based on scrolling progress
  updateCameraFlight();

  // Render direct to screen (No bloom post-processing for vector-sharp quality)
  renderer.render(scene, camera);
}

const clock = new THREE.Clock();

function onMouseMove(event) {
  updateMouse(event.clientX, event.clientY);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
