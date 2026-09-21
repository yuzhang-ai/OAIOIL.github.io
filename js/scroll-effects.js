(() => {
  const app = window.ResumeSite;
  const clamp = app.clamp;
  const prefersReducedMotion = app.prefersReducedMotion;

  const heroScroll = document.querySelector(".hero-scroll");
  const heroStage = document.querySelector(".hero-stage");
  const heroMask = document.querySelector(".hero-mask");
  const heroCopy = document.querySelector(".hero-copy");
  const heroSignature = document.querySelector(".hero-signature");
  const stackSection = document.querySelector(".stack-section");
  const stackCards = Array.from(document.querySelectorAll(".stack-card"));
  const sectionTitles = Array.from(document.querySelectorAll(".section-title"));
  const compactLayout = window.matchMedia("(max-width: 900px)");

  function resetHeroMask() {
    heroStage?.style.setProperty("--hero-inset-top", "0%");
    heroStage?.style.setProperty("--hero-inset-bottom", "0%");
    heroStage?.style.setProperty("--hero-side", "0%");
    heroStage?.style.setProperty("--hero-radius", "0px");
    heroStage?.style.setProperty("--hero-scale", "1");
    heroStage?.style.setProperty("--hero-subject-x", "0%");
    heroStage?.style.setProperty("--hero-subject-y", "0%");
    heroStage?.style.setProperty("--hero-subject-scale", "1");
    heroStage?.style.setProperty("--hero-mask-light", "1");
    heroStage?.style.setProperty("--marquee-opacity", "0");
    heroStage?.style.setProperty("--hero-copy-opacity", "1");
    heroSignature?.style.setProperty("--signature-progress", "0");

    if (heroCopy) {
      heroCopy.classList.remove("is-faded");
      heroCopy.style.transform = "";
      heroCopy.style.opacity = "";
    }
  }

  function updateHeroMask() {
    if (!heroScroll || !heroStage || !heroMask || prefersReducedMotion) return;
    if (compactLayout.matches) {
      resetHeroMask();
      return;
    }

    const rect = heroScroll.getBoundingClientRect();
    const scrollable = Math.max(1, rect.height - window.innerHeight);
    const progress = clamp(-rect.top / scrollable);
    const eased = 1 - Math.pow(1 - progress, 3);

    heroStage.style.setProperty("--hero-inset-top", `${eased * 15}%`);
    heroStage.style.setProperty("--hero-inset-bottom", `${eased * 12}%`);
    heroStage.style.setProperty("--hero-side", `${eased * 20}%`);
    heroStage.style.setProperty("--hero-radius", `${eased * 38}px`);
    heroStage.style.setProperty("--hero-scale", `${1 - eased * 0.03}`);
    heroStage.style.setProperty("--hero-subject-x", `${eased * -12}%`);
    heroStage.style.setProperty("--hero-subject-y", `${eased * 1.5}%`);
    heroStage.style.setProperty("--hero-subject-scale", `${1 - eased * 0.3}`);
    heroStage.style.setProperty("--hero-mask-light", String(clamp((progress - 0.04) / 0.5)));
    heroStage.style.setProperty("--marquee-opacity", String(clamp((progress - 0.22) / 0.34)));
    const copyOpacity = clamp(1 - (progress - 0.01) / 0.2);
    heroStage.style.setProperty("--hero-copy-opacity", String(copyOpacity));
    heroSignature?.style.setProperty("--signature-progress", String(clamp((progress - 0.055) / 0.3)));

    if (heroCopy) {
      heroCopy.classList.toggle("is-faded", copyOpacity <= 0.01);
      heroCopy.style.transform = `translateY(${-progress * 30}px)`;
      heroCopy.style.opacity = String(copyOpacity);
    }
  }

  function updateSectionTitles() {
    sectionTitles.forEach((title) => {
      const rect = title.getBoundingClientRect();
      const start = window.innerHeight * 0.9;
      const end = window.innerHeight * 0.78;
      const progress = clamp((start - rect.top) / (start - end));
      title.style.setProperty("--title-progress", progress.toFixed(3));
    });
  }

  function renderStackCards(stackProgress) {
    stackCards.forEach((card, index) => {
      const targetGap = index * 34;
      card.style.zIndex = String(index + 1);

      if (index === 0) {
        card.style.transform = `translateY(${targetGap}px) scale(1) rotate(0deg)`;
        return;
      }

      const cardProgress = clamp((stackProgress - (index - 1) * 0.2) / 0.2);
      const entryY = window.innerHeight * 0.54 + index * 46;
      const eased = cardProgress;
      const y = entryY + (targetGap - entryY) * eased;
      const scale = 0.985 + eased * 0.015;
      const rotate = (index % 2 === 0 ? -1 : 1) * (1 - eased) * 0.42;
      card.style.transform = `translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`;
    });
  }

  function updateStackCards() {
    if (!stackSection || !stackCards.length) return;
    if (compactLayout.matches) {
      stackCards.forEach((card) => {
        card.style.zIndex = "";
        card.style.transform = "";
      });
      return;
    }

    const sectionRect = stackSection.getBoundingClientRect();
    const travel = Math.max(1, window.innerHeight * 1.8);
    renderStackCards(clamp(-sectionRect.top / travel));
  }

  function updateScrollEffects() {
    updateHeroMask();
    updateSectionTitles();
    updateStackCards();
  }

  app.updateScrollEffects = updateScrollEffects;
  app.renderStackCards = renderStackCards;

  window.addEventListener("scroll", updateScrollEffects, { passive: true });
  compactLayout.addEventListener?.("change", updateScrollEffects);
  updateScrollEffects();
})();
