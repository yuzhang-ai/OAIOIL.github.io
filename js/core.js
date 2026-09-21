(() => {
  const app = window.ResumeSite = window.ResumeSite || {};

  app.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  app.clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  if (!location.hash) {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  app.openingPending = document.documentElement.classList.contains("opening-pending");
  if (app.openingPending) document.body.classList.add("is-loading");
})();
