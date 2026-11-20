import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  RotateCcw,
  RefreshCw,
  ArrowUpFromLine,
} from 'lucide-react';
import { BottleEdition, EDITIONS, EDITION_ORDER, EditionId } from '../data/editions';
import {
  createBottleAlbedoTexture,
  createBraidedCordTexture,
  createContactShadowTexture,
  createMatteRoughnessTexture,
} from '../webgl/bottleTextures';

interface BubiViceBottle3DProps {
  activeEdition: EditionId;
  onSelectEdition: (id: EditionId) => void;
}

const DEFAULT_CAM_POS = new THREE.Vector3(1.15, 1.85, 4.35);
const DEFAULT_TARGET = new THREE.Vector3(0, 1.32, 0);

// Pre-allocated scratch helpers outside render loop
const _pointer = new THREE.Vector2();

export function BubiViceBottle3D({
  activeEdition,
  onSelectEdition,
}: BubiViceBottle3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [lidOpen, setLidOpen] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  // Refs synced to 3D loop without recreating WebGLRenderer
  const stateRef = useRef({
    lidOpen: false,
    exploded: false,
    autoRotate: true,
    editionId: activeEdition,
  });

  const sceneApiRef = useRef<{
    applyEdition: (ed: BottleEdition) => void;
    resetCamera: () => void;
    wake: () => void;
  } | null>(null);

  useEffect(() => {
    stateRef.current.lidOpen = lidOpen;
    sceneApiRef.current?.wake();
  }, [lidOpen]);

  useEffect(() => {
    stateRef.current.exploded = exploded;
    sceneApiRef.current?.wake();
  }, [exploded]);

  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
    sceneApiRef.current?.wake();
  }, [autoRotate]);

  useEffect(() => {
    stateRef.current.editionId = activeEdition;
    sceneApiRef.current?.applyEdition(EDITIONS[activeEdition]);
    sceneApiRef.current?.wake();
  }, [activeEdition]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) {
      stateRef.current.autoRotate = false;
      setAutoRotate(false);
    }

    // Software WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.outline = 'none';

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      34,
      Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
      0.1,
      40
    );
    camera.position.copy(DEFAULT_CAM_POS);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Three-point Vice City studio lighting rig
    const hemiLight = new THREE.HemisphereLight(0xc8d8ff, 0x160d28, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ec, 1.9);
    keyLight.position.set(3.4, 5.2, 4.2);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 16;
      keyLight.shadow.camera.left = -2.2;
      keyLight.shadow.camera.right = 2.2;
      keyLight.shadow.camera.top = 3.2;
      keyLight.shadow.camera.bottom = -1.2;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLeft = new THREE.DirectionalLight(0xff2e93, 1.55);
    rimLeft.position.set(-4.0, 2.6, -2.5);
    scene.add(rimLeft);

    const rimRight = new THREE.DirectionalLight(0x00e5ff, 1.35);
    rimRight.position.set(3.8, 2.0, -2.8);
    scene.add(rimRight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_TARGET);
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.065;
    controls.minDistance = 2.9;
    controls.maxDistance = 6.2;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI * 0.51;
    controls.autoRotate = false; // managed cleanly in loop so software GL paces nicely
    controls.update();

    // --- Build 10-Part Composite 650 ml BUBI VICE Bottle (bottom-center grounded at y=0) ---
    const bottleRoot = new THREE.Group();
    scene.add(bottleRoot);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const roughnessMap = createMatteRoughnessTexture();
    const initialEdition = EDITIONS[stateRef.current.editionId];

    // Pre-generate textures for all 4 editions for instant switching
    const albedoCache: Record<EditionId, THREE.CanvasTexture> = {
      sunset: createBottleAlbedoTexture(EDITIONS.sunset, maxAniso),
      cyan: createBottleAlbedoTexture(EDITIONS.cyan, maxAniso),
      tropics: createBottleAlbedoTexture(EDITIONS.tropics, maxAniso),
      noir: createBottleAlbedoTexture(EDITIONS.noir, maxAniso),
    };
    const cordCache: Record<EditionId, THREE.CanvasTexture> = {
      sunset: createBraidedCordTexture(EDITIONS.sunset.lanyardAccent),
      cyan: createBraidedCordTexture(EDITIONS.cyan.lanyardAccent),
      tropics: createBraidedCordTexture(EDITIONS.tropics.lanyardAccent),
      noir: createBraidedCordTexture(EDITIONS.noir.lanyardAccent),
    };

    const disposables: Array<{ dispose: () => void }> = [
      envTex,
      roughnessMap,
      ...Object.values(albedoCache),
      ...Object.values(cordCache),
    ];

    // 1. Contact Shadow Grounding Plane
    const shadowTex = createContactShadowTexture();
    disposables.push(shadowTex);
    const shadowGeo = new THREE.PlaneGeometry(2.3, 2.3);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.004;
    bottleRoot.add(shadowPlane);
    disposables.push(shadowGeo, shadowMat);

    // Subtle dark architectural plinth disc
    const plinthGeo = new THREE.CylinderGeometry(0.95, 1.02, 0.05, 48);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x120f1e,
      roughness: 0.72,
      metalness: 0.25,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -0.025;
    plinthMesh.receiveShadow = true;
    bottleRoot.add(plinthMesh);
    disposables.push(plinthGeo, plinthMat);

    // 2. Bottom Silicone Bumper Ring
    const bumperGeo = new THREE.CylinderGeometry(0.415, 0.39, 0.075, 48);
    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x16141f,
      roughness: 0.9,
      metalness: 0.04,
    });
    const bumperMesh = new THREE.Mesh(bumperGeo, rubberMat);
    bumperMesh.position.y = 0.038;
    bumperMesh.castShadow = true;
    bottleRoot.add(bumperMesh);
    disposables.push(bumperGeo, rubberMat);

    // 3. Main 650 ml Matte Gradient Stainless Body (LatheGeometry)
    const bodyPoints = [
      new THREE.Vector2(0.0, 0.04),
      new THREE.Vector2(0.39, 0.04),
      new THREE.Vector2(0.425, 0.09),
      new THREE.Vector2(0.43, 0.22),
      new THREE.Vector2(0.43, 1.72),
      new THREE.Vector2(0.42, 1.84),
      new THREE.Vector2(0.365, 1.94),
      new THREE.Vector2(0.325, 2.01),
      new THREE.Vector2(0.325, 2.08),
      new THREE.Vector2(0.0, 2.08),
    ];
    const bodyGeo = new THREE.LatheGeometry(bodyPoints, 64);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      map: albedoCache[stateRef.current.editionId],
      roughnessMap,
      roughness: 0.84,
      metalness: 0.12,
      clearcoat: 0.06,
      clearcoatRoughness: 0.65,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    // Rotate by Math.PI so u=0.5 (BUBI VICE wordmark) faces +Z camera
    bodyMesh.rotation.y = Math.PI;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bottleRoot.add(bodyMesh);
    disposables.push(bodyGeo, bodyMat);

    // 4. Brushed Stainless Steel Neck Collar Ring
    const collarGeo = new THREE.CylinderGeometry(0.342, 0.342, 0.085, 48);
    const steelMat = new THREE.MeshPhysicalMaterial({
      color: 0xd9dee8,
      metalness: 0.94,
      roughness: 0.22,
      anisotropy: 0.75,
    });
    const collarGroup = new THREE.Group();
    collarGroup.position.y = 2.07;
    const collarMesh = new THREE.Mesh(collarGeo, steelMat);
    collarMesh.castShadow = true;
    collarGroup.add(collarMesh);
    bottleRoot.add(collarGroup);
    disposables.push(collarGeo, steelMat);

    // 5. Lower Flip-Top Housing Collar
    const lidBaseGroup = new THREE.Group();
    lidBaseGroup.position.y = 2.12;
    bottleRoot.add(lidBaseGroup);

    const lidPolymerMat = new THREE.MeshStandardMaterial({
      color: 0x171520,
      roughness: 0.56,
      metalness: 0.08,
    });
    const lidLowerGeo = new THREE.CylinderGeometry(0.356, 0.348, 0.27, 48);
    const lidLowerMesh = new THREE.Mesh(lidLowerGeo, lidPolymerMat);
    lidLowerMesh.position.y = 0.135;
    lidLowerMesh.castShadow = true;
    lidBaseGroup.add(lidLowerMesh);
    disposables.push(lidLowerGeo, lidPolymerMat);

    // 6. Push-Button Release Latch (Front +Z, interactive raycast target)
    const buttonBezelGeo = new THREE.BoxGeometry(0.22, 0.21, 0.09);
    const buttonBezelMesh = new THREE.Mesh(buttonBezelGeo, lidPolymerMat);
    buttonBezelMesh.position.set(0, 0.145, 0.34);
    lidBaseGroup.add(buttonBezelMesh);

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialEdition.accentHex),
      roughness: 0.35,
      metalness: 0.25,
      emissive: new THREE.Color(initialEdition.accentHex),
      emissiveIntensity: 0.22,
    });

    const pushButtonGroup = new THREE.Group();
    pushButtonGroup.position.set(0, 0.145, 0.365);
    lidBaseGroup.add(pushButtonGroup);

    const buttonPadGeo = new THREE.BoxGeometry(0.15, 0.15, 0.055);
    const buttonPadMat = new THREE.MeshStandardMaterial({
      color: 0x262335,
      roughness: 0.42,
      metalness: 0.35,
    });
    const buttonPadMesh = new THREE.Mesh(buttonPadGeo, buttonPadMat);
    buttonPadMesh.userData.toggleLid = true;
    pushButtonGroup.add(buttonPadMesh);

    const buttonTrimGeo = new THREE.BoxGeometry(0.11, 0.026, 0.062);
    const buttonTrimMesh = new THREE.Mesh(buttonTrimGeo, accentMat);
    buttonTrimMesh.position.y = 0.02;
    buttonTrimMesh.userData.toggleLid = true;
    pushButtonGroup.add(buttonTrimMesh);
    disposables.push(
      buttonBezelGeo,
      buttonPadGeo,
      buttonPadMat,
      buttonTrimGeo,
      accentMat
    );

    // 7. Internal Drinking Spout & Silicone Seal Ring (visible when cap flips open)
    const spoutGroup = new THREE.Group();
    spoutGroup.position.y = 2.39;
    bottleRoot.add(spoutGroup);

    const spoutNeckGeo = new THREE.CylinderGeometry(0.11, 0.135, 0.16, 32);
    const spoutNeckMesh = new THREE.Mesh(spoutNeckGeo, lidPolymerMat);
    spoutNeckMesh.position.set(0, 0.06, 0.08);
    spoutNeckMesh.rotation.x = 0.18;
    spoutGroup.add(spoutNeckMesh);

    const gasketGeo = new THREE.TorusGeometry(0.32, 0.018, 12, 48);
    const gasketMesh = new THREE.Mesh(gasketGeo, accentMat);
    gasketMesh.rotation.x = Math.PI / 2;
    gasketMesh.position.y = 0.005;
    spoutGroup.add(gasketMesh);
    disposables.push(spoutNeckGeo, gasketGeo);

    // 8. Hinged Flip-Top Cap + Top Carry Arch (pivots around rear hinge at z = -0.34)
    const flipCapPivot = new THREE.Group();
    flipCapPivot.position.set(0, 2.39, -0.34);
    bottleRoot.add(flipCapPivot);

    // Cap dome offset back to center relative to pivot
    const capDomePoints = [
      new THREE.Vector2(0.0, 0.25),
      new THREE.Vector2(0.24, 0.25),
      new THREE.Vector2(0.32, 0.22),
      new THREE.Vector2(0.352, 0.14),
      new THREE.Vector2(0.356, 0.0),
      new THREE.Vector2(0.0, 0.0),
    ];
    const capDomeGeo = new THREE.LatheGeometry(capDomePoints, 48);
    const capDomeMesh = new THREE.Mesh(capDomeGeo, lidPolymerMat);
    capDomeMesh.position.set(0, 0, 0.34);
    capDomeMesh.castShadow = true;
    capDomeMesh.userData.toggleLid = true;
    flipCapPivot.add(capDomeMesh);

    // Top ergonomic carry bail loop on flip-top cap
    const bailGeo = new THREE.TorusGeometry(0.145, 0.026, 12, 32, Math.PI);
    const bailMesh = new THREE.Mesh(bailGeo, lidPolymerMat);
    bailMesh.position.set(0, 0.24, 0.28);
    bailMesh.rotation.x = -0.35;
    bailMesh.castShadow = true;
    bailMesh.userData.toggleLid = true;
    flipCapPivot.add(bailMesh);

    // Rear hinge barrel
    const hingeGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.22, 20);
    const hingeMesh = new THREE.Mesh(hingeGeo, steelMat);
    hingeMesh.rotation.z = Math.PI / 2;
    flipCapPivot.add(hingeMesh);

    // Accent strip ring around cap seam
    const capRingGeo = new THREE.TorusGeometry(0.355, 0.011, 10, 48);
    const capRingMesh = new THREE.Mesh(capRingGeo, accentMat);
    capRingMesh.rotation.x = Math.PI / 2;
    capRingMesh.position.set(0, 0.015, 0.34);
    flipCapPivot.add(capRingMesh);
    disposables.push(capDomeGeo, bailGeo, hingeGeo, capRingGeo);

    // 9. Side Lanyard Lug & Swivel Carabiner Ring (+X side of neck)
    const lanyardGroup = new THREE.Group();
    lanyardGroup.position.set(0, 2.09, 0);
    bottleRoot.add(lanyardGroup);

    const lugGeo = new THREE.TorusGeometry(0.068, 0.016, 12, 24);
    const lugMesh = new THREE.Mesh(lugGeo, steelMat);
    lugMesh.position.set(0.38, 0, 0);
    lugMesh.rotation.y = Math.PI / 2;
    lanyardGroup.add(lugMesh);

    const clipGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.09, 16);
    const clipMesh = new THREE.Mesh(clipGeo, lidPolymerMat);
    clipMesh.position.set(0.45, -0.06, 0);
    clipMesh.rotation.z = 0.22;
    lanyardGroup.add(clipMesh);

    // 10. Braided Paracord Carry Lanyard (TubeGeometry along CatmullRomCurve3)
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.455, -0.1, 0.02),
      new THREE.Vector3(0.55, -0.45, 0.09),
      new THREE.Vector3(0.61, -0.95, 0.11),
      new THREE.Vector3(0.57, -1.38, 0.02),
      new THREE.Vector3(0.49, -1.44, -0.06),
      new THREE.Vector3(0.51, -1.02, -0.11),
      new THREE.Vector3(0.49, -0.48, -0.08),
      new THREE.Vector3(0.45, -0.1, -0.02),
    ]);
    const cordGeo = new THREE.TubeGeometry(cordCurve, 64, 0.024, 12, false);
    const cordMat = new THREE.MeshStandardMaterial({
      map: cordCache[stateRef.current.editionId],
      roughness: 0.88,
      metalness: 0.05,
    });
    const cordMesh = new THREE.Mesh(cordGeo, cordMat);
    cordMesh.castShadow = true;
    lanyardGroup.add(cordMesh);
    disposables.push(lugGeo, clipGeo, cordGeo, cordMat);

    // Raycaster for interactive clicking directly on the push-button / lid
    const raycaster = new THREE.Raycaster();
    const clickTargets = [buttonPadMesh, buttonTrimMesh, capDomeMesh, bailMesh];
    let pointerDownXY = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownXY = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownXY.x,
        e.clientY - pointerDownXY.y
      );
      if (dist > 6) return; // user was orbiting, not clicking

      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_pointer, camera);
      const hits = raycaster.intersectObjects(clickTargets, false);
      if (hits.length > 0) {
        setLidOpen((prev) => !prev);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Animation state (spring/damping values)
    let curLidAngle = 0;
    let curButtonDepth = 0;
    let curExplode = 0;
    let resetCamActive = false;

    // Render-on-demand + Software WebGL afterDraw pacing
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      try {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (gl && typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) return;
            const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (state === gl.UNSIGNALED) {
              frameId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              frameId = window.setTimeout(cb, 80);
            }
          };
          frameId = window.setTimeout(poll, 5);
          return;
        }
      } catch {
        // Fallback pacing
      }
      frameId = window.setTimeout(cb, 80);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        if (disposed) return;
        renderDirty = false;
        const dt = Math.min((now - lastTime) * 0.001, 0.05);
        lastTime = now;

        const { lidOpen: targetLid, exploded: targetExp, autoRotate: spin } =
          stateRef.current;

        // Smooth damping for lid hinge, push button, and exploded view
        const lidTargetAngle = targetLid ? -Math.PI * 0.68 : 0;
        const btnTargetDepth = targetLid ? -0.022 : 0;
        const expTarget = targetExp ? 1 : 0;

        curLidAngle = THREE.MathUtils.damp(curLidAngle, lidTargetAngle, 9, dt);
        curButtonDepth = THREE.MathUtils.damp(
          curButtonDepth,
          btnTargetDepth,
          14,
          dt
        );
        curExplode = THREE.MathUtils.damp(curExplode, expTarget, 7, dt);

        flipCapPivot.rotation.x = curLidAngle;
        pushButtonGroup.position.z = 0.365 + curButtonDepth;

        // Exploded vertical offsets
        bumperMesh.position.y = 0.038 - curExplode * 0.14;
        collarGroup.position.y = 2.07 + curExplode * 0.22;
        lanyardGroup.position.y = 2.09 + curExplode * 0.28;
        lanyardGroup.position.x = curExplode * 0.22;
        lidBaseGroup.position.y = 2.12 + curExplode * 0.56;
        spoutGroup.position.y = 2.39 + curExplode * 0.72;
        flipCapPivot.position.y = 2.39 + curExplode * 0.98;

        // Gentle auto-rotation of the bottle showcase
        if (spin && !isSoftwareGl) {
          bottleRoot.rotation.y += dt * 0.36;
        }

        // Smooth reset camera transition
        if (resetCamActive) {
          camera.position.lerp(DEFAULT_CAM_POS, 1 - Math.exp(-8 * dt));
          controls.target.lerp(DEFAULT_TARGET, 1 - Math.exp(-8 * dt));
          if (camera.position.distanceTo(DEFAULT_CAM_POS) < 0.01) {
            camera.position.copy(DEFAULT_CAM_POS);
            controls.target.copy(DEFAULT_TARGET);
            resetCamActive = false;
          }
        }

        const controlsChanged = controls.update();
        renderer.render(scene, camera);

        const stillAnimating =
          Math.abs(curLidAngle - lidTargetAngle) > 0.002 ||
          Math.abs(curButtonDepth - btnTargetDepth) > 0.0005 ||
          Math.abs(curExplode - expTarget) > 0.002 ||
          resetCamActive ||
          (spin && !isSoftwareGl) ||
          controlsChanged;

        const done = () => {
          renderBusy = false;
          if (renderDirty || stillAnimating) {
            requestRender();
          }
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    const onControlStart = () => {
      resetCamActive = false;
      setAutoRotate(false);
    };
    const onControlChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('change', onControlChange);

    // ResizeObserver for crisp responsive sizing
    const handleResize = () => {
      if (!container || disposed) return;
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    handleResize();

    // Context lost safety
    const onContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
    };
    const onContextRestored = () => {
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      onContextRestored
    );

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    sceneApiRef.current = {
      applyEdition: (ed: BottleEdition) => {
        bodyMat.map = albedoCache[ed.id];
        bodyMat.needsUpdate = true;
        cordMat.map = cordCache[ed.id];
        cordMat.needsUpdate = true;
        accentMat.color.set(ed.accentHex);
        accentMat.emissive.set(ed.accentHex);
        rimLeft.color.set(ed.accentHex);
        rimRight.color.set(ed.secondaryHex);
        requestRender();
      },
      resetCamera: () => {
        resetCamActive = true;
        bottleRoot.rotation.y = 0;
        requestRender();
      },
      wake: () => {
        lastTime = performance.now();
        requestRender();
      },
    };

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('change', onControlChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        onContextRestored
      );
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneApiRef.current = null;
    };
  }, []);

  const currentEdition = EDITIONS[activeEdition];

  return (
    <div className="viewer-3d-shell" aria-label="Visualizador 3D interativo da garrafa BUBI VICE">
      {/* Isolated WebGL mount container */}
      <div ref={mountRef} className="viewer-3d-canvas-mount" />

      {/* Graceful fallback if WebGL fails */}
      {webglFailed && (
        <div className="viewer-3d-fallback">
          <img
            src={currentEdition.image}
            alt={currentEdition.imageAlt}
            referrerPolicy="no-referrer"
            className="viewer-3d-fallback-img"
          />
        </div>
      )}

      {/* Subtle top-left helper cue (zero card clutter, clean text) */}
      <div className="viewer-3d-hint">
        <span>Arraste para girar 360°</span>
        <span aria-hidden="true">·</span>
        <span>Clique na tampa para abrir</span>
      </div>

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion, no backdrop-filter over WebGL) */}
      <div className={`viewer-dock-wrap${dockCollapsed ? ' is-collapsed' : ''}`}>
        <button
          type="button"
          className="viewer-dock-toggle"
          onClick={() => setDockCollapsed((v) => !v)}
          aria-expanded={!dockCollapsed}
        >
          {dockCollapsed ? (
            <>
              <ChevronUp size={14} aria-hidden="true" />
              <span>Controles 3D</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} aria-hidden="true" />
              <span>Ocultar Controles</span>
            </>
          )}
        </button>

        <div className="viewer-dock" role="toolbar" aria-label="Controles do modelo 3D">
          {/* 4 Color Edition Swatches */}
          <div className="dock-swatches" role="radiogroup" aria-label="Edições de cor 3D">
            {EDITION_ORDER.map((id) => {
              const ed = EDITIONS[id];
              const isSelected = activeEdition === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Edição ${ed.name}`}
                  title={ed.name}
                  className={`dock-swatch-btn${isSelected ? ' is-active' : ''}`}
                  onClick={() => onSelectEdition(id)}
                >
                  <span
                    className="dock-swatch-dot"
                    style={{
                      background: `linear-gradient(135deg, ${ed.gradientStops[0]}, ${ed.gradientStops[1]})`,
                    }}
                  />
                </button>
              );
            })}
          </div>

          <span className="dock-divider" aria-hidden="true" />

          {/* Interactive 3D Feature Controls */}
          <button
            type="button"
            className={`dock-action-btn${lidOpen ? ' is-active' : ''}`}
            onClick={() => setLidOpen((v) => !v)}
          >
            <ArrowUpFromLine size={15} aria-hidden="true" />
            <span>{lidOpen ? 'Fechar Tampa' : 'Abrir Tampa'}</span>
          </button>

          <button
            type="button"
            className={`dock-action-btn${exploded ? ' is-active' : ''}`}
            onClick={() => setExploded((v) => !v)}
          >
            <Layers size={15} aria-hidden="true" />
            <span>{exploded ? 'Montar' : 'Explodir'}</span>
          </button>

          <button
            type="button"
            className={`dock-action-btn${autoRotate ? ' is-active' : ''}`}
            onClick={() => setAutoRotate((v) => !v)}
            aria-label="Alternar rotação automática"
            title="Girar 360°"
          >
            <RefreshCw size={15} aria-hidden="true" />
            <span>360°</span>
          </button>

          <button
            type="button"
            className="dock-action-btn"
            onClick={() => {
              setAutoRotate(false);
              sceneApiRef.current?.resetCamera();
            }}
            aria-label="Resetar câmera"
            title="Resetar visualização"
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
