(() => {
  const section = document.getElementById("about");
  const canvas = document.getElementById("about-gold-fx");
  const image = section?.querySelector(".about-stone-image");
  const app = window.ResumeSite;

  if (!section || !canvas || !image) return;

  const params = new URLSearchParams(window.location.search);
  const forcedMode = params.get("aboutFx");
  const prefersReducedMotion = Boolean(app?.prefersReducedMotion);
  const saveData = Boolean(navigator.connection?.saveData);
  const THREE_URL = "../vendor/three-0.184.0/three.module.min.js";
  const IMAGE_ASPECT = 1536 / 1024;

  let renderer;
  let scene;
  let camera;
  let material;
  let geometry;
  let texture;
  let raf = 0;
  let started = false;
  let disposed = false;
  let visible = false;
  let lowFrameCount = 0;
  let severeFrameCount = 0;
  let qualityReduced = false;
  let lastFrame = 0;
  let renderedOnce = false;
  let pointer = { x: 0.5, y: 0.5, strength: 0, lastMove: 0 };
  let pointerInside = false;
  let heldByFocus = false;
  let resizeObserver;
  let resizeFallback;
  let loadObserver;
  let visibilityObserver;

  function setState(state, reason) {
    section.dataset.aboutEffectState = state;
    section.dataset.aboutEffectReason = reason;
  }

  function stopFrame() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function dispose(state, reason) {
    if (disposed) return;
    disposed = true;
    stopFrame();
    loadObserver?.disconnect();
    visibilityObserver?.disconnect();
    resizeObserver?.disconnect();
    if (resizeFallback) window.removeEventListener("resize", resizeFallback);
    section.removeEventListener("pointermove", handlePointerMove);
    section.removeEventListener("pointerleave", handlePointerLeave);
    document.removeEventListener("about-material-pulse", handleMaterialPulse);
    document.removeEventListener("about-material-release", handleMaterialRelease);
    document.removeEventListener("visibilitychange", handleDocumentVisibility);
    window.removeEventListener("pagehide", handlePageHide);
    image.removeEventListener("error", handleImageError);
    geometry?.dispose();
    material?.dispose();
    texture?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss?.();
    setState(state, reason);
  }

  function supportsWebGL2() {
    try {
      const probe = document.createElement("canvas");
      const context = probe.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
      if (!context) return false;
      context.getExtension("WEBGL_lose_context")?.loseContext();
      return true;
    } catch {
      return false;
    }
  }

  function readPixelRatio() {
    if (window.matchMedia("(max-width: 900px)").matches) return 1;
    return Math.min(window.devicePixelRatio || 1, 1.25);
  }

  function resize() {
    if (!renderer || !material) return;
    const rect = section.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const pixelBudget = window.matchMedia("(max-width: 900px)").matches ? 650000 : 1250000;
    const budgetRatio = Math.sqrt(pixelBudget / Math.max(width * height, 1));
    const requestedRatio = qualityReduced ? 0.65 : readPixelRatio();
    renderer.setPixelRatio(Math.max(0.5, Math.min(requestedRatio, budgetRatio)));
    renderer.setSize(width, height, false);
    material.uniforms.uResolution.value.set(width, height);
  }

  function fragmentShader() {
    return `
      uniform sampler2D uTexture;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uImageAspect;
      uniform vec2 uPointer;
      uniform float uPointerStrength;
      varying vec2 vUv;

      float hash(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 value) {
        vec2 cell = floor(value);
        vec2 local = fract(value);
        local = local * local * (3.0 - 2.0 * local);
        return mix(
          mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
          mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x),
          local.y
        );
      }

      vec2 coverUv(vec2 uv) {
        float canvasAspect = uResolution.x / max(uResolution.y, 1.0);
        if (canvasAspect > uImageAspect) {
          uv.y = (uv.y - 0.5) * (uImageAspect / canvasAspect) + 0.5;
        } else {
          uv.x = (uv.x - 0.5) * (canvasAspect / uImageAspect) + 0.5;
        }
        return uv;
      }

      float goldMask(vec3 color) {
        float maximum = max(color.r, max(color.g, color.b));
        float minimum = min(color.r, min(color.g, color.b));
        float saturation = (maximum - minimum) / max(maximum, 0.001);
        float redBlue = color.r - color.b;
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        float saturatedGold = smoothstep(0.16, 0.35, saturation);
        float warmGold = smoothstep(0.10, 0.22, redBlue);
        float seamBrightness = 1.0 - smoothstep(0.48, 0.76, luminance);
        return saturatedGold * warmGold * seamBrightness;
      }

      void main() {
        vec2 uv = coverUv(vUv);
        vec2 texel = 1.0 / vec2(1536.0, 1024.0);
        float seam = goldMask(texture2D(uTexture, uv).rgb);
        float spread = goldMask(texture2D(uTexture, uv + vec2(texel.x * 1.8, 0.0)).rgb);
        spread = max(spread, goldMask(texture2D(uTexture, uv - vec2(texel.x * 1.8, 0.0)).rgb));
        spread = max(spread, goldMask(texture2D(uTexture, uv + vec2(0.0, texel.y * 1.8)).rgb));
        spread = max(spread, goldMask(texture2D(uTexture, uv - vec2(0.0, texel.y * 1.8)).rgb));
        spread = max(spread, goldMask(texture2D(uTexture, uv + vec2(texel.x * 2.4, texel.y * 2.4)).rgb));
        spread = max(spread, goldMask(texture2D(uTexture, uv + vec2(texel.x * 2.4, -texel.y * 2.4)).rgb));
        spread = max(spread, goldMask(texture2D(uTexture, uv + vec2(-texel.x * 2.4, texel.y * 2.4)).rgb));
        spread = max(spread, goldMask(texture2D(uTexture, uv + vec2(-texel.x * 2.4, -texel.y * 2.4)).rgb));
        seam = max(seam, spread * 0.29);

        float field = fract(uv.x * 1.65 - uv.y * 0.9 + noise(uv * 5.0) * 0.3 + uTime * 0.24);
        float head = exp(-pow((field - 0.84) / 0.055, 2.0));
        float tail = smoothstep(0.23, 0.72, field) * (1.0 - smoothstep(0.72, 0.86, field));
        float localReveal = exp(-dot(vUv - uPointer, vUv - uPointer) / 0.024) * uPointerStrength;
        float intensity = seam * localReveal * (0.32 + tail * 0.68 + head * 1.28);

        vec3 darkGold = vec3(0.21, 0.09, 0.018);
        vec3 warmGold = vec3(0.98, 0.56, 0.12);
        vec3 whiteGold = vec3(1.0, 0.95, 0.73);
        vec3 color = mix(darkGold, warmGold, clamp(0.18 + tail * 0.88, 0.0, 1.0));
        color = mix(color, whiteGold, head * 0.84);
        float alpha = clamp(seam * localReveal * (0.14 + tail * 0.42 + head * 0.84), 0.0, 0.9);

        gl_FragColor = vec4(color, alpha * clamp(intensity + 0.16, 0.0, 1.0));
      }
    `;
  }

  function vertexShader() {
    return `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;
  }

  function hasLocalReveal(time = performance.now()) {
    return pointerInside || heldByFocus || (pointer.strength > 0.005 && time - pointer.lastMove < 900);
  }

  function startFrame(time) {
    if (raf || !visible || document.hidden || disposed) return;
    raf = requestAnimationFrame(render);
    lastFrame = time || performance.now();
  }

  function render(time) {
    raf = 0;
    if (!visible || document.hidden || disposed || !renderer || !material) return;

    const delta = time - lastFrame;
    lastFrame = time;
    if (!qualityReduced && delta > 50) {
      lowFrameCount += 1;
      if (lowFrameCount >= 8) {
        qualityReduced = true;
        lowFrameCount = 0;
        resize();
        setState("degraded", "slow-frame-dpr-reduced");
      }
    } else if (qualityReduced && delta > 65) {
      severeFrameCount += 1;
      if (severeFrameCount >= 10) {
        dispose("static", "slow-frame-static");
        return;
      }
    } else if (!qualityReduced) {
      lowFrameCount = Math.max(0, lowFrameCount - 1);
    } else {
      severeFrameCount = Math.max(0, severeFrameCount - 1);
    }

    pointer.strength = (pointerInside || heldByFocus) ? 1 : Math.max(0, 1 - (time - pointer.lastMove) / 850);
    material.uniforms.uTime.value = time * 0.001;
    material.uniforms.uPointer.value.set(pointer.x, pointer.y);
    material.uniforms.uPointerStrength.value = pointer.strength;
    try {
      renderer.render(scene, camera);
    } catch {
      dispose("fallback", "render-failed");
      return;
    }
    if (!renderedOnce && !disposed) {
      renderedOnce = true;
      setState(qualityReduced ? "degraded" : "active", qualityReduced ? "slow-frame-dpr-reduced" : "webgl2-local-three");
    }
    if (hasLocalReveal(time)) startFrame(time);
  }

  function waitForTexture(THREE) {
    return new Promise((resolve, reject) => {
      let timer;
      let timedOut = false;
      const clearTimer = () => window.clearTimeout(timer);
      new THREE.TextureLoader().load(
        image.currentSrc || image.src,
        (loadedTexture) => {
          if (timedOut || disposed) {
            loadedTexture.dispose();
            return;
          }
          clearTimer();
          resolve(loadedTexture);
        },
        undefined,
        () => {
          clearTimer();
          reject(new Error("texture-load-failed"));
        }
      );
      timer = window.setTimeout(() => {
        timedOut = true;
        reject(new Error("texture-load-timeout"));
      }, 4500);
    });
  }

  async function initialize() {
    if (started || disposed) return;
    started = true;

    if (forcedMode === "off") return setState("static", "forced-off");
    if (prefersReducedMotion) return setState("static", "reduced-motion");
    if (saveData) return setState("static", "save-data");
    if (!supportsWebGL2()) return setState("static", "unsupported-webgl2");

    let timeout;
    try {
      if (forcedMode === "fail") throw new Error("forced-fail");
      const loaded = await Promise.race([
        import(THREE_URL),
        new Promise((_, reject) => {
          timeout = window.setTimeout(() => reject(new Error("three-import-timeout")), 4500);
        })
      ]);
      window.clearTimeout(timeout);
      if (disposed) return;

      const THREE = loaded;
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
        premultipliedAlpha: false
      });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.debug.onShaderError = () => {
        dispose("fallback", "shader-compile-failed");
      };

      texture = await waitForTexture(THREE);
      if (disposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.NoColorSpace;

      scene = new THREE.Scene();
      camera = new THREE.Camera();
      geometry = new THREE.PlaneGeometry(2, 2);
      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTexture: { value: texture },
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uImageAspect: { value: IMAGE_ASPECT },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uPointerStrength: { value: 0 }
        },
        vertexShader: vertexShader(),
        fragmentShader: fragmentShader()
      });
      scene.add(new THREE.Mesh(geometry, material));
      resize();
      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(section);
      } else {
        resizeFallback = resize;
        window.addEventListener("resize", resizeFallback, { passive: true });
      }
      canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        dispose("fallback", "context-lost");
      }, { once: true });
      setState("starting", "webgl2-local-three");
      startFrame(performance.now());
    } catch (error) {
      window.clearTimeout(timeout);
      dispose("fallback", error?.message || "initialization-failed");
    }
  }

  function handlePointerMove(event) {
    if (event.pointerType === "touch") return;
    pointerInside = true;
    heldByFocus = false;
    const rect = section.getBoundingClientRect();
    pointer = {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(rect.width, 1))),
      y: Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / Math.max(rect.height, 1))),
      strength: 1,
      lastMove: performance.now()
    };
    startFrame(performance.now());
  }

  function handlePointerLeave() {
    pointerInside = false;
    pointer.lastMove = performance.now() - 500;
    startFrame(performance.now());
  }

  function handleMaterialPulse(event) {
    if (prefersReducedMotion || disposed) return;
    const detail = event.detail || {};
    heldByFocus = Boolean(detail.hold);
    const rect = section.getBoundingClientRect();
    pointer = {
      x: Math.min(1, Math.max(0, (detail.clientX - rect.left) / Math.max(rect.width, 1))),
      y: Math.min(1, Math.max(0, 1 - (detail.clientY - rect.top) / Math.max(rect.height, 1))),
      strength: 1,
      lastMove: performance.now()
    };
    startFrame(performance.now());
  }

  function handleMaterialRelease() {
    heldByFocus = false;
    pointer.lastMove = performance.now() - 500;
    startFrame(performance.now());
  }

  function handleDocumentVisibility() {
    if (document.hidden) stopFrame();
    else if (visible) startFrame(performance.now());
  }

  function handleImageError() {
    if (!started) setState("fallback", "image-load-failed");
  }

  function handlePageHide() {
    dispose("static", "pagehide");
  }

  if (!("IntersectionObserver" in window)) {
    setState("static", "observer-unsupported");
    return;
  }

  loadObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    loadObserver.disconnect();
    initialize();
  }, { rootMargin: "650px 0px" });

  visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) startFrame(performance.now());
    else stopFrame();
  }, { threshold: 0.01 });

  section.addEventListener("pointermove", handlePointerMove, { passive: true });
  section.addEventListener("pointerleave", handlePointerLeave);
  document.addEventListener("about-material-pulse", handleMaterialPulse);
  document.addEventListener("about-material-release", handleMaterialRelease);
  document.addEventListener("visibilitychange", handleDocumentVisibility);
  window.addEventListener("pagehide", handlePageHide, { once: true });
  image.addEventListener("error", handleImageError, { once: true });

  setState("static", "awaiting-viewport");
  loadObserver.observe(section);
  visibilityObserver.observe(section);
})();
