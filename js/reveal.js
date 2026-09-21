(() => {
  const app = window.ResumeSite;

  function revealHero() {
    document.querySelectorAll(".hero-stage .reveal").forEach((item) => {
      item.classList.add("is-visible");
    });
  }

  app.revealHero = revealHero;

  const revealItems = Array.from(document.querySelectorAll(".reveal"));

  if (!("IntersectionObserver" in window) || app.prefersReducedMotion) {
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

  revealItems.forEach((item) => {
    // Stagger within a local group, not by the element's global page index.
    const siblings = item.matches('.tool-card')
      ? Array.from(item.parentElement.querySelectorAll('.tool-card')) : [];
    const delay = siblings.length ? (siblings.indexOf(item) % 4) * 65 : 0;
    item.style.transitionDelay = `${delay}ms`;
    item.style.setProperty('--entry-delay', `${delay}ms`);
    revealObserver.observe(item);
  });
})();
