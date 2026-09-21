(() => {
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      document.body.dataset.theme = button.dataset.themeChoice;
      document.querySelectorAll("[data-theme-choice]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
    });
  });
})();
