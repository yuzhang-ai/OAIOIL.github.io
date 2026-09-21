(() => {
  const app = window.ResumeSite;
  const prefersReducedMotion = Boolean(app?.prefersReducedMotion);
  const canvas = document.getElementById("atmosphere");
  const ctx = canvas?.getContext("2d", { alpha: true });

  let width = 0;
  let height = 0;
  let dpr = 1;
  let pointer = { x: 0.5, y: 0.5 };

  function resizeCanvas() {
    if (!canvas || !ctx) return;

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawAtmosphere() {
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(
      width * (0.24 + pointer.x * 0.08),
      height * (0.18 + pointer.y * 0.08),
      0,
      width * 0.5,
      height * 0.45,
      Math.max(width, height) * 0.8
    );
    glow.addColorStop(0, "rgba(148, 245, 196, 0.32)");
    glow.addColorStop(0.46, "rgba(141, 121, 255, 0.17)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    if (!prefersReducedMotion) requestAnimationFrame(drawAtmosphere);
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    app?.updateScrollEffects?.();
  });

  window.addEventListener("pointermove", (event) => {
    pointer = {
      x: event.clientX / Math.max(1, width),
      y: event.clientY / Math.max(1, height)
    };
  }, { passive: true });

  resizeCanvas();
  drawAtmosphere();
})();
