(() => {
  const app = window.ResumeSite || {};
  const root = document.documentElement;
  const body = document.body;
  const loader = document.querySelector(".loader");
  const mark = loader?.querySelector(".loader__mark");
  const loaderO = loader?.querySelector(".loader__o");
  const skip = loader?.querySelector(".loader__skip");
  const replay = document.querySelector(".opening-replay");
  const shouldPlay = root.classList.contains("opening-pending");
  let finished = false;
  let naturalTimer = 0;
  let assetTimer = 0;
  let startFrame = 0;

  function clearTimers() {
    window.clearTimeout(naturalTimer);
    window.clearTimeout(assetTimer);
    window.cancelAnimationFrame(startFrame);
  }

  function removeInterrupts() {
    window.removeEventListener("wheel", interrupt);
    window.removeEventListener("touchmove", interrupt);
    window.removeEventListener("keydown", onKeydown);
    skip?.removeEventListener("click", interrupt);
    loader?.removeEventListener("animationend", onOpeningEnd);
  }

  function onOpeningEnd(event) {
    if (event.target === loader && event.animationName === "opening-reveal") finish();
  }

  function revealPage() {
    body.classList.remove("is-loading", "is-opening");
    root.classList.remove("opening-pending", "opening-started");
    root.dataset.opening = "complete";
    loader?.classList.add("is-hidden");
    loader?.setAttribute("aria-hidden", "true");
    window.clearTimeout(window.__oaioilOpeningFailOpen);
    app.revealHero?.();
    app.updateScrollEffects?.();
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearTimers();
    removeInterrupts();
    try { sessionStorage.setItem("oaioil-opening-v1", "complete"); } catch {}
    revealPage();
  }

  function interrupt(event) {
    if (event?.type === "touchmove" || event?.type === "wheel") event.preventDefault?.();
    finish();
  }

  function onKeydown(event) {
    if (event.key === "Escape") finish();
  }

  function setDockGeometry() {
    const target = document.querySelector(".brand-symbol");
    if (!target || !loaderO || !mark) return;
    const source = loaderO.getBoundingClientRect();
    const destination = target.getBoundingClientRect();
    if (!source.width || !destination.width) return;
    const word = mark.querySelector(".loader__wordmark");
    const targetWord = document.querySelector(".brand-mark strong");
    const scale = destination.width / source.width;
    if (word && targetWord) {
      const textStyle = getComputedStyle(targetWord);
      const textRect = targetWord.getBoundingClientRect();
      word.style.fontFamily = textStyle.fontFamily;
      word.style.fontWeight = textStyle.fontWeight;
      word.style.fontSize = `${parseFloat(textStyle.fontSize) / scale}px`;
      word.style.letterSpacing = textStyle.letterSpacing === "normal" ? "normal" : `${parseFloat(textStyle.letterSpacing) / scale}px`;
      word.style.left = `${(textRect.left - destination.left) / scale}px`;
      word.style.top = `${(textRect.top - destination.top) / scale}px`;
      word.style.lineHeight = `${textRect.height / scale}px`;
      const fullWidth = (textRect.right - destination.left) / scale;
      const formedScale = Math.min(0.6, (window.innerWidth - 64) / fullWidth);
      mark.style.setProperty("--opening-form-scale", String(formedScale));
      mark.style.setProperty("--opening-form-x", `${(window.innerWidth - fullWidth * formedScale) / 2 - source.left}px`);
      mark.style.setProperty("--opening-form-y", `${(window.innerHeight - source.height * formedScale) / 2 - source.top}px`);
    }
    mark.style.setProperty("--opening-dock-x", `${destination.left - source.left}px`);
    mark.style.setProperty("--opening-dock-y", `${destination.top - source.top}px`);
    mark.style.setProperty("--opening-dock-scale", String(destination.width / source.width));
  }

  function addInterrupts() {
    window.addEventListener("wheel", interrupt, { passive: false, once: true });
    window.addEventListener("touchmove", interrupt, { passive: false, once: true });
    window.addEventListener("keydown", onKeydown);
    skip?.addEventListener("click", interrupt, { once: true });
  }

  function play() {
    finished = false;
    clearTimers();
    removeInterrupts();
    loader?.classList.remove("is-hidden");
    loader?.setAttribute("aria-hidden", "false");
    root.classList.add("opening-pending", "opening-started");
    root.dataset.opening = "playing";
    body.classList.add("is-loading");
    body.classList.remove("is-opening");
    setDockGeometry();
    loader?.getBoundingClientRect();
    startFrame = requestAnimationFrame(() => {
      if (finished) return;
      body.classList.add("is-opening");
      // Event-driven completion; timeout only protects missing animation events.
      naturalTimer = window.setTimeout(finish, 4400);
    });
    addInterrupts();
    loader?.addEventListener("animationend", onOpeningEnd);
  }

  function waitForTexture() {
    return new Promise((resolve) => {
      const texture = new Image();
      let done = false;
      const settle = () => {
        if (done) return;
        done = true;
        window.clearTimeout(assetTimer);
        resolve();
      };
      texture.onload = settle;
      texture.onerror = settle;
      assetTimer = window.setTimeout(settle, 850);
      texture.src = "assets/about-stone-gold-v1.webp";
    });
  }

  replay?.addEventListener("click", () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    play();
  });

  if (!loader || !shouldPlay || app.prefersReducedMotion) {
    revealPage();
    return;
  }

  loader.setAttribute("aria-hidden", "false");
  addInterrupts();
  waitForTexture().then(() => {
    if (!root.classList.contains("opening-pending") || root.dataset.opening === "failed-open") return;
    play();
  }).catch(finish);
})();
