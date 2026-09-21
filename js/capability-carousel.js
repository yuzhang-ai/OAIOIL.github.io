// Geometry adapted from Amicro CardCarousel (MIT), SYED SUBHAN UDDIN.
// See assets/AMICRO-LICENSE.txt and docs/REFINEMENT_EXECUTION.md for source revision.
(() => {
  const carousel = document.querySelector(".capability-orbit");
  const cards = Array.from(document.querySelectorAll("[data-carousel-card]"));
  const previous = document.querySelector(".carousel-button--prev");
  const next = document.querySelector(".carousel-button--next");
  const compactLayout = window.matchMedia("(max-width: 900px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!carousel || !cards.length) return;

  let activeIndex = Math.floor(cards.length / 2);
  let dragStartX = 0;
  let isDragging = false;
  let pressedCard = -1;

  function render() {
    if (compactLayout.matches) {
      cards.forEach((card) => {
        card.style.opacity = "";
        card.style.transform = "";
        card.style.zIndex = "";
        card.removeAttribute("aria-current");
      });
      return;
    }

    const spacing = Math.min(350, Math.max(305, carousel.clientWidth * 0.29));
    cards.forEach((card, index) => {
      const difference = index - activeIndex;
      const active = difference === 0;
      const scale = active ? 1.05 : 0.65;
      const opacity = active ? 1 : Math.max(0.32, 0.76 - Math.abs(difference) * 0.14);
      card.style.transform = `translate(-50%, -50%) translateX(${difference * spacing}px) translateY(${difference * 24}px) rotateZ(${difference * 20}deg) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(cards.length - Math.abs(difference));
      card.setAttribute("aria-current", String(active));
    });
  }

  function setActive(index) {
    activeIndex = Math.max(0, Math.min(cards.length - 1, index));
    render();
    previous?.toggleAttribute("disabled", activeIndex === 0);
    next?.toggleAttribute("disabled", activeIndex === cards.length - 1);
  }

  previous?.addEventListener("click", () => setActive(activeIndex - 1));
  next?.addEventListener("click", () => setActive(activeIndex + 1));

  carousel.addEventListener("keydown", (event) => {
    if (compactLayout.matches) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActive(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActive(activeIndex + 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setActive(cards.length - 1);
    }
  });

  carousel.addEventListener("pointerdown", (event) => {
    if (compactLayout.matches || event.pointerType === "touch") return;
    isDragging = true;
    pressedCard = cards.indexOf(event.target.closest("[data-carousel-card]"));
    dragStartX = event.clientX;
    carousel.classList.add("is-dragging");
    carousel.setPointerCapture(event.pointerId);
  });

  carousel.addEventListener("pointerup", (event) => {
    if (!isDragging) return;
    const distance = event.clientX - dragStartX;
    if (Math.abs(distance) > 48) setActive(activeIndex + (distance > 0 ? -1 : 1));
    else if (pressedCard >= 0) setActive(pressedCard);
    isDragging = false;
    pressedCard = -1;
    carousel.classList.remove("is-dragging");
    carousel.releasePointerCapture(event.pointerId);
  });

  carousel.addEventListener("pointercancel", () => {
    isDragging = false;
    carousel.classList.remove("is-dragging");
  });

  compactLayout.addEventListener?.("change", render);
  reducedMotion.addEventListener?.("change", render);
  window.addEventListener("resize", render, { passive: true });
  render();
})();
