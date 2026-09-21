(() => {
  const app = window.ResumeSite;

  function normalizeWheelInput({ deltaY, event }) {
    if (!event || event.type !== "wheel") return deltaY;

    const rawDelta = Math.abs(event.deltaY);
    const isLineWheel = event.deltaMode === 1;
    const isCoarseWheel = isLineWheel || rawDelta >= 80;

    if (!isCoarseWheel) return deltaY;

    const direction = Math.sign(deltaY) || 1;
    const softened = Math.min(Math.abs(deltaY) * 0.9, window.innerHeight * 0.54);
    return direction * softened;
  }

  if (!app.prefersReducedMotion && window.Lenis) {
    app.lenis = new Lenis({
      duration: 1.00,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 0.96,
      touchMultiplier: 1.45,
      virtualScroll: (input) => {
        input.deltaY = normalizeWheelInput(input);
      }
    });

    app.lenis.on("scroll", () => app.updateScrollEffects?.());

    const rafLenis = (time) => {
      app.lenis.raf(time);
      requestAnimationFrame(rafLenis);
    };

    requestAnimationFrame(rafLenis);
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!app.lenis) return;

      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      if (link.classList.contains("hero-explore")) {
        app.lenis.scrollTo(target, {
          duration: 2.4,
          easing: (t) => t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2
        });
        return;
      }

      app.lenis.scrollTo(target);
    });
  });
})();
