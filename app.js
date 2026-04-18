import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.183.2/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/controls/OrbitControls.js";

const canvas = document.querySelector("#cheese-canvas");

if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070b13, 6, 14);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
  camera.position.set(3.5, 2.2, 4.4);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.maxDistance = 8;
  controls.minDistance = 2.8;
  controls.maxPolarAngle = Math.PI * 0.47;

  const ambient = new THREE.AmbientLight(0xa4c7ff, 0.6);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0x9fd9ff, 1.3);
  key.position.set(2, 4, 3);
  scene.add(key);

  const rim = new THREE.PointLight(0xffe3a6, 1.0, 18);
  rim.position.set(-2, 1.8, -3.5);
  scene.add(rim);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 0.24, 64),
    new THREE.MeshStandardMaterial({ color: 0x1a1f28, metalness: 0.3, roughness: 0.55 })
  );
  table.position.y = -0.95;
  scene.add(table);

  const milkMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 64, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xeef3ff,
      transmission: 0.55,
      roughness: 0.2,
      thickness: 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0.25
    })
  );
  milkMesh.position.y = 0.2;
  scene.add(milkMesh);

  const cheeseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.95, 1.1, 64, 1, false, 0, Math.PI * 1.75),
    new THREE.MeshStandardMaterial({
      color: 0xf7c45f,
      metalness: 0.05,
      roughness: 0.48,
      emissive: 0x6b4818,
      emissiveIntensity: 0.06
    })
  );
  cheeseMesh.visible = false;
  cheeseMesh.rotation.y = 0.2;
  scene.add(cheeseMesh);

  const moldRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.08, 24, 100),
    new THREE.MeshStandardMaterial({ color: 0xb9d7ff, metalness: 0.55, roughness: 0.3 })
  );
  moldRing.visible = false;
  moldRing.rotation.x = Math.PI / 2;
  moldRing.position.y = -0.1;
  scene.add(moldRing);

  const particles = new THREE.Group();
  const pGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const pMat = new THREE.MeshBasicMaterial({ color: 0xffe29a });
  for (let i = 0; i < 120; i += 1) {
    const p = new THREE.Mesh(pGeo, pMat);
    p.userData.seed = Math.random() * Math.PI * 2;
    particles.add(p);
  }
  scene.add(particles);

  const smoke = new THREE.Group();
  const sGeo = new THREE.SphereGeometry(0.09, 16, 16);
  const sMat = new THREE.MeshStandardMaterial({ color: 0xa1d4ff, transparent: true, opacity: 0.18 });
  for (let i = 0; i < 30; i += 1) {
    const puff = new THREE.Mesh(sGeo, sMat);
    puff.userData.seed = Math.random() * Math.PI * 2;
    smoke.add(puff);
  }
  scene.add(smoke);

  const stepMeta = {
    milk: {
      title: "ミルク選定",
      description: "牧場ごとの脂肪分と香りを比較し、その日の仕込みに最適なミルクを厳選。",
      metrics: { temp: 62, aroma: 86, umami: 72 },
      targetColor: 0xeef3ff,
      particleIntensity: 0.2,
      smoke: false,
      model: "milk"
    },
    heat: {
      title: "低温加熱",
      description: "高温で飛びやすい香りを守るため、低温帯を維持して甘みを引き出します。",
      metrics: { temp: 91, aroma: 79, umami: 76 },
      targetColor: 0xffd98d,
      particleIntensity: 0.55,
      smoke: true,
      model: "milk"
    },
    curd: {
      title: "凝固・成形",
      description: "カードの粒を壊しすぎない圧力で成形し、口どけと弾力のバランスを調整。",
      metrics: { temp: 78, aroma: 74, umami: 89 },
      targetColor: 0xf8bd57,
      particleIntensity: 0.75,
      smoke: false,
      model: "cheese"
    },
    aging: {
      title: "熟成",
      description: "湿度・塩分・風向きを毎日記録。庄司の経験値で旨味のピークを見極めます。",
      metrics: { temp: 84, aroma: 95, umami: 98 },
      targetColor: 0xe7a234,
      particleIntensity: 1,
      smoke: false,
      model: "cheese"
    }
  };

  const stepTitle = document.querySelector("#step-title");
  const stepDescription = document.querySelector("#step-description");
  const metricTemp = document.querySelector("#metric-temp");
  const metricAroma = document.querySelector("#metric-aroma");
  const metricUmami = document.querySelector("#metric-umami");

  const state = {
    step: "milk",
    color: new THREE.Color(stepMeta.milk.targetColor),
    particleIntensity: stepMeta.milk.particleIntensity
  };

  function applyStep(keyName) {
    const data = stepMeta[keyName];
    if (!data) return;

    state.step = keyName;
    state.particleIntensity = data.particleIntensity;

    if (stepTitle) stepTitle.textContent = data.title;
    if (stepDescription) stepDescription.textContent = data.description;
    if (metricTemp) metricTemp.style.width = `${data.metrics.temp}%`;
    if (metricAroma) metricAroma.style.width = `${data.metrics.aroma}%`;
    if (metricUmami) metricUmami.style.width = `${data.metrics.umami}%`;

    if (data.model === "milk") {
      milkMesh.visible = true;
      cheeseMesh.visible = false;
      moldRing.visible = false;
    } else {
      milkMesh.visible = false;
      cheeseMesh.visible = true;
      moldRing.visible = true;
    }

    smoke.visible = data.smoke;

    document.querySelectorAll(".step-btn").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.step === keyName);
    });

    const nextColor = new THREE.Color(data.targetColor);
    state.color.copy(nextColor);
  }

  document.querySelectorAll(".step-btn").forEach((button) => {
    button.addEventListener("click", () => {
      applyStep(button.dataset.step);
    });
  });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(10, rect.width);
    const height = Math.max(240, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();

    particles.children.forEach((p, i) => {
      const ring = 1.1 + Math.sin(t * 0.4 + i) * 0.08;
      const speed = 0.45 + state.particleIntensity * 0.55;
      const angle = p.userData.seed + t * speed;
      p.position.set(Math.cos(angle) * ring, -0.15 + Math.sin(t + i) * 0.45, Math.sin(angle) * ring);
      p.scale.setScalar(0.45 + state.particleIntensity * 0.85);
      p.visible = i < 26 + Math.round(state.particleIntensity * 70);
    });

    smoke.children.forEach((p, i) => {
      const offset = p.userData.seed + t * 0.85;
      p.position.set(Math.cos(offset) * 0.6, 0.3 + ((t * 0.22 + i * 0.03) % 1.5), Math.sin(offset) * 0.6);
      p.material.opacity = 0.12 + Math.sin(t + i) * 0.05;
    });

    milkMesh.material.color.lerp(state.color, 0.05);
    cheeseMesh.material.color.lerp(state.color, 0.07);

    milkMesh.rotation.y += 0.006;
    cheeseMesh.rotation.y += 0.009;
    moldRing.rotation.z += 0.005;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  applyStep("milk");
  animate();

  window.addEventListener("resize", resize);
}
