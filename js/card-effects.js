(() => {
  const app = window.ResumeSite;
  const reducedMotion = Boolean(app?.prefersReducedMotion);
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const toolStates = new WeakMap();

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      if (reducedMotion) return;
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate3d(${x * 0.12}px, ${y * 0.18}px, 0)`;
    });
    element.addEventListener("pointerleave", () => { element.style.transform = ""; });
  });

  function stop(state) {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function render(card, state) {
    state.raf = 0;
    state.x += (state.targetX - state.x) * 0.16;
    state.y += (state.targetY - state.y) * 0.16;
    state.rotateX += (state.targetRotateX - state.rotateX) * 0.16;
    state.rotateY += (state.targetRotateY - state.rotateY) * 0.16;
    card.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) perspective(900px) rotateX(${state.rotateX.toFixed(2)}deg) rotateY(${state.rotateY.toFixed(2)}deg)`;

    const settled = Math.abs(state.x - state.targetX) < 0.04
      && Math.abs(state.y - state.targetY) < 0.04
      && Math.abs(state.rotateX - state.targetRotateX) < 0.04
      && Math.abs(state.rotateY - state.targetRotateY) < 0.04;
    if (settled) {
      state.x = state.targetX;
      state.y = state.targetY;
      state.rotateX = state.targetRotateX;
      state.rotateY = state.targetRotateY;
      const resting = [state.targetX, state.targetY, state.targetRotateX, state.targetRotateY]
        .every((value) => Math.abs(value) < 0.04);
      if (resting) card.style.transform = "";
      return;
    }
    state.raf = requestAnimationFrame(() => render(card, state));
  }

  function schedule(card, state) {
    if (!state.raf) state.raf = requestAnimationFrame(() => render(card, state));
  }

  document.querySelectorAll(".tool-card[data-tilt]").forEach((card) => {
    const state = {
      x: 0, y: 0, rotateX: 0, rotateY: 0,
      targetX: 0, targetY: 0, targetRotateX: 0, targetRotateY: 0,
      rect: null, raf: 0
    };
    toolStates.set(card, state);

    card.addEventListener("pointerenter", () => {
      if (reducedMotion || coarsePointer.matches) return;
      const transform = card.style.transform;
      card.style.transform = "";
      state.rect = card.getBoundingClientRect();
      card.style.transform = transform;
    });

    card.addEventListener("pointermove", (event) => {
      if (reducedMotion || coarsePointer.matches) return;
      const rect = state.rect || card.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      state.targetX = (px - 0.5) * 5;
      state.targetY = (py - 0.5) * 5;
      state.targetRotateY = (px - 0.5) * 2;
      state.targetRotateX = (0.5 - py) * 2;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      schedule(card, state);
    });

    card.addEventListener("pointerleave", () => {
      if (reducedMotion || coarsePointer.matches) return;
      state.rect = null;
      state.targetX = 0;
      state.targetY = 0;
      state.targetRotateX = 0;
      state.targetRotateY = 0;
      schedule(card, state);
    });
  });

  window.addEventListener("resize", () => {
    document.querySelectorAll(".tool-card[data-tilt]").forEach((card) => {
      const state = toolStates.get(card);
      if (state) state.rect = null;
    });
  }, { passive: true });
})();
