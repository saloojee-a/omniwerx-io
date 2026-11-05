import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

RectAreaLightUniformsLib.init();

/** @param {HTMLElement} viewer */
function initializeBlenderLogo(viewer) {
  const canvas = viewer.querySelector("canvas");
  const modelUrl = viewer.dataset.modelUrl;
  const environmentUrl = viewer.dataset.environmentUrl;
  if (!canvas || !modelUrl || !environmentUrl) return () => {};
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  const scene = new THREE.Scene();
  scene.environmentIntensity = 0.4;
  scene.environmentRotation.y = THREE.MathUtils.degToRad(-18);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
  camera.position.setFromSpherical(
    new THREE.Spherical(1, THREE.MathUtils.degToRad(74), THREE.MathUtils.degToRad(26)),
  );
  camera.lookAt(0, 0, 0);
  const interactionRoot = new THREE.Group();
  const modelRoot = new THREE.Group();
  modelRoot.rotation.x = THREE.MathUtils.degToRad(90);
  interactionRoot.add(modelRoot);
  scene.add(interactionRoot);
  const keyLight = new THREE.RectAreaLight(0xffeee7, 5.5, 1.6, 1.6);
  keyLight.position.set(-1.4, 1.6, 1.8);
  keyLight.lookAt(0, 0, 0);
  scene.add(keyLight);
  const fillLight = new THREE.RectAreaLight(0xb8c8dc, 0.65, 1.2, 1.4);
  fillLight.position.set(1.2, 0.3, 1.1);
  fillLight.lookAt(0, 0, 0);
  scene.add(fillLight);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const maxRotationX = THREE.MathUtils.degToRad(4);
  const maxRotationY = THREE.MathUtils.degToRad(8);
  let animationFrame = 0;
  let disposed = false;
  let environment;
  let model;
  let modelRadius = 0;
  let previousFrameTime = 0;
  let targetRotationX = 0;
  let targetRotationY = 0;
  const render = (time) => {
    animationFrame = 0;
    const delta = previousFrameTime ? Math.min((time - previousFrameTime) / 1000, 0.05) : 1 / 60;
    previousFrameTime = time;
    if (!reduceMotion.matches) {
      interactionRoot.rotation.x = THREE.MathUtils.damp(
        interactionRoot.rotation.x,
        targetRotationX,
        4.25,
        delta,
      );
      interactionRoot.rotation.y = THREE.MathUtils.damp(
        interactionRoot.rotation.y,
        targetRotationY,
        4.25,
        delta,
      );
    }
    renderer.render(scene, camera);
    const isMoving =
      Math.abs(interactionRoot.rotation.x - targetRotationX) > 0.00005 ||
      Math.abs(interactionRoot.rotation.y - targetRotationY) > 0.00005;
    if (!reduceMotion.matches && isMoving) {
      animationFrame = requestAnimationFrame(render);
    } else {
      previousFrameTime = 0;
    }
  };
  const requestRender = () => {
    if (animationFrame || disposed) return;
    animationFrame = requestAnimationFrame(render);
  };
  const frameCamera = () => {
    if (!modelRadius) return;
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const fitFov = Math.min(verticalFov, horizontalFov);
    const distance = (modelRadius / Math.sin(fitFov / 2)) * 0.98;
    camera.position.setLength(distance);
    camera.lookAt(0, 0, 0);
    requestRender();
  };
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  const resize = () => {
    const { width, height } = viewer.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.clearViewOffset();
    frameCamera();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewer);
  resize();
  const updatePointerTarget = (event) => {
    if (!finePointer.matches || reduceMotion.matches) return;
    const bounds = viewer.getBoundingClientRect();
    const pointerX = THREE.MathUtils.clamp(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -1,
      1,
    );
    const pointerY = THREE.MathUtils.clamp(
      ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      -1,
      1,
    );
    targetRotationX = pointerY * maxRotationX;
    targetRotationY = pointerX * maxRotationY;
    requestRender();
  };
  const resetPose = () => {
    targetRotationX = 0;
    targetRotationY = 0;
    requestRender();
  };
  const handlePointerLeave = () => {
    if (finePointer.matches) resetPose();
  };
  const handleMotionPreference = () => {
    resetPose();
    if (!reduceMotion.matches) return;
    interactionRoot.rotation.set(0, 0, 0);
  };
  const handlePointerCapability = () => {
    if (!finePointer.matches) resetPose();
  };
  viewer.addEventListener("pointerenter", updatePointerTarget);
  viewer.addEventListener("pointermove", updatePointerTarget);
  viewer.addEventListener("pointerleave", handlePointerLeave);
  reduceMotion.addEventListener("change", handleMotionPreference);
  finePointer.addEventListener("change", handlePointerCapability);
  new RGBELoader().load(
    environmentUrl,
    (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      environment = texture;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      requestRender();
    },
    void 0,
    () => {},
  );
  gltfLoader.load(
    modelUrl,
    (gltf) => {
      if (disposed) return;
      model = gltf.scene;
      model.updateMatrixWorld(true);
      const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
      modelRadius = sphere.radius;
      model.position.sub(sphere.center);
      modelRoot.add(model);
      frameCamera();
      viewer.dataset.ready = "";
    },
    void 0,
    () => {},
  );
  return () => {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
    viewer.removeEventListener("pointerenter", updatePointerTarget);
    viewer.removeEventListener("pointermove", updatePointerTarget);
    viewer.removeEventListener("pointerleave", handlePointerLeave);
    reduceMotion.removeEventListener("change", handleMotionPreference);
    finePointer.removeEventListener("change", handlePointerCapability);
    environment?.dispose();
    dracoLoader.dispose();
    model?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material.dispose();
    });
    renderer.dispose();
  };
}
export { initializeBlenderLogo };
