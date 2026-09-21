(() => {
  const spread = document.querySelector("[data-portfolio-spread]");
  if (!spread) return;

  const selectors = Array.from(spread.querySelectorAll("[data-portfolio-select]"));
  const pages = Array.from(spread.querySelectorAll("[data-portfolio-page]"));
  const notes = Array.from(spread.querySelectorAll("[data-portfolio-note]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact = window.matchMedia("(max-width: 900px)");
  const pageById = new Map(pages.map((page) => [page.dataset.portfolioPage, page]));
  const fixedIndex = new Map(pages.map((page, index) => [page.dataset.portfolioPage, index]));
  let pageOrder = pages.map((page) => page.dataset.portfolioPage);
  let isAnimating = false;
  let latestIntent = null;
  let transitionTimer = 0;
  let promoteTimer = 0;
  let arrivingPage = null;

  function onPageArrived(event) {
    if (event.target === arrivingPage && event.propertyName === "transform") finishTransition();
  }

  function stopNoteAnimation(note) {
    note.getAnimations().forEach((animation) => animation.cancel());
    note.style.height = "";
    note.style.overflow = "";
    note.style.opacity = "";
  }

  function setNoteVisibility(note, visible) {
    stopNoteAnimation(note);
    if (visible) {
      note.inert = false;
      note.setAttribute("aria-hidden", "false");
      if (!note.hidden) return;
      note.hidden = false;
      if (reducedMotion.matches || compact.matches) return;
      const height = note.scrollHeight;
      note.style.height = "0px";
      note.style.overflow = "hidden";
      note.style.opacity = "0";
      const animation = note.animate(
        [{ height: "0px", opacity: 0 }, { height: `${height}px`, opacity: 1 }],
        { duration: 320, easing: "cubic-bezier(0.22, 0.78, 0.2, 1)" }
      );
      animation.onfinish = () => stopNoteAnimation(note);
      return;
    }
    if (note.hidden) return;
    note.inert = true;
    note.setAttribute("aria-hidden", "true");
    if (reducedMotion.matches || compact.matches) {
      note.hidden = true;
      return;
    }
    const height = note.scrollHeight;
    note.style.height = `${height}px`;
    note.style.overflow = "hidden";
    const animation = note.animate(
      [{ height: `${height}px`, opacity: 1 }, { height: "0px", opacity: 0 }],
      { duration: 220, easing: "ease-out" }
    );
    animation.onfinish = () => {
      note.hidden = true;
      stopNoteAnimation(note);
    };
  }

  function updateAccordion(id) {
    selectors.forEach((selector) => {
      const selected = selector.dataset.portfolioSelect === id;
      selector.classList.toggle("is-current", selected);
      selector.setAttribute("aria-expanded", String(selected));
    });
    notes.forEach((note) => {
      const selected = note.dataset.portfolioNote === id;
      setNoteVisibility(note, selected);
      note.classList.toggle("is-current", selected);
    });
  }

  function renderStack() {
    const states = ["is-front", "is-middle", "is-back"];
    pages.forEach((page) => page.classList.remove(...states));
    pageOrder.forEach((id, index) => pageById.get(id)?.classList.add(states[index]));
  }

  function nextOrder(id, reverse) {
    const currentId = pageOrder[0];
    const remaining = pageOrder.filter((pageId) => pageId !== id && pageId !== currentId);
    return reverse ? [id, currentId, ...remaining] : [id, ...remaining, currentId];
  }

  function finishTransition() {
    if (!isAnimating) return;
    window.clearTimeout(transitionTimer);
    window.clearTimeout(promoteTimer);
    arrivingPage?.removeEventListener("transitionend", onPageArrived);
    arrivingPage = null;
    const outgoing = pages.find((page) => page.classList.contains("is-outgoing"));
    const incoming = pages.find((page) => page.classList.contains("is-rising"));
    outgoing?.classList.remove("is-outgoing");
    incoming?.classList.remove("is-rising", "is-returning", "is-resetting");
    outgoing?.classList.add("is-resetting");
    renderStack();
    // Commit the no-transition reset before restoring normal movement.
    outgoing?.getBoundingClientRect();
    requestAnimationFrame(() => outgoing?.classList.remove("is-resetting"));
    isAnimating = false;

    if (latestIntent && latestIntent !== pageOrder[0]) {
      const nextId = latestIntent;
      latestIntent = null;
      transitionTo(nextId);
    }
  }

  function transitionTo(id) {
    if (!pageById.has(id)) return;
    latestIntent = id;
    if (isAnimating) return;
    updateAccordion(id);
    if (id === pageOrder[0]) {
      latestIntent = null;
      return;
    }

    const outgoingId = pageOrder[0];
    const outgoing = pageById.get(outgoingId);
    const reverse = fixedIndex.get(id) < fixedIndex.get(outgoingId);
    if (reducedMotion.matches) {
      pageOrder = nextOrder(id, reverse);
      renderStack();
      latestIntent = null;
      return;
    }

    isAnimating = true;
    const incoming = pageById.get(id);
    arrivingPage = incoming;
    arrivingPage?.addEventListener("transitionend", onPageArrived);
    if (reverse) {
      incoming?.classList.add("is-rising", "is-resetting");
      incoming?.getBoundingClientRect();
    }
    else outgoing?.classList.add("is-outgoing");
    window.clearTimeout(promoteTimer);
    pageOrder = nextOrder(id, reverse);
    promoteTimer = window.setTimeout(() => {
      if (reverse) {
        incoming?.classList.remove("is-resetting");
        incoming?.classList.add("is-returning");
      }
      renderStack();
    }, compact.matches ? 20 : 100);
    // Both directions start promotion after100ms; never truncate its750ms travel.
    transitionTimer = window.setTimeout(finishTransition, compact.matches ? 450 : 1050);
  }

  selectors.forEach((selector, index) => {
    selector.addEventListener("click", () => transitionTo(selector.dataset.portfolioSelect));
    selector.addEventListener("keydown", (event) => {
      let nextIndex = null;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % selectors.length;
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + selectors.length) % selectors.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = selectors.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      selectors[nextIndex].focus();
    });
  });

  reducedMotion.addEventListener?.("change", () => {
    if (reducedMotion.matches && isAnimating) finishTransition();
  });
  compact.addEventListener?.("change", () => {
    if (isAnimating) finishTransition();
    notes.forEach(stopNoteAnimation);
    updateAccordion(pageOrder[0]);
  });
  renderStack();
})();
