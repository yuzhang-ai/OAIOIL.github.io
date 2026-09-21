(() => {
  const app = window.ResumeSite;

  function revealHero() {
    document.querySelectorAll(".hero-stage .reveal").forEach((item) => {
      item.classList.add("is-visible");
    });
  }

  app.revealHero = revealHero;

  const revealItems = Array.from(document.querySelectorAll(".reveal"));

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = item.matches(".section-title, .stack-card")
      ? "0ms"
      : `${Math.min(index * 34, 300)}ms`;
    revealObserver.observe(item);
  });
})();
