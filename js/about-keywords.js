(() => {
  document.querySelectorAll(".letter-lab").forEach((lab) => {
    const items = Array.from(lab.querySelectorAll("[data-keyword]"));
    let activeItem = null;

    const setActive = (nextItem) => {
      if (!nextItem || nextItem === activeItem) return;

      items.forEach((item) => item.classList.remove("is-active"));
      activeItem = nextItem;
      lab.classList.add("has-active");
      activeItem.classList.add("is-active");
    };

    const clearActive = () => {
      items.forEach((item) => item.classList.remove("is-active"));
      activeItem = null;
      lab.classList.remove("has-active");
    };

    const emitPulse = (item, hold = false) => {
      const source = item.querySelector(".letter-glyph") || item;
      const rect = source.getBoundingClientRect();
      document.dispatchEvent(new CustomEvent("about-material-pulse", {
        detail: {
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
          hold
        }
      }));
    };

    lab.addEventListener("pointermove", (event) => {
      const nearest = items.reduce((best, item) => {
        const rect = item.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const distance = dx * dx + dy * dy;
        return !best || distance < best.distance ? { item, distance } : best;
      }, null);

      setActive(nearest?.item);
    });

    lab.addEventListener("pointerleave", clearActive);

    items.forEach((item) => {
      item.addEventListener("focusin", () => {
        setActive(item);
        emitPulse(item, true);
      });
      item.addEventListener("focusout", () => {
        clearActive();
        document.dispatchEvent(new CustomEvent("about-material-release"));
      });
      item.addEventListener("click", () => {
        setActive(item);
        emitPulse(item);
      });
    });
  });
})();
