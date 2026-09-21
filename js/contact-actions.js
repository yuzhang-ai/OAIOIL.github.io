(() => {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy || "";

      try {
        await navigator.clipboard.writeText(value);
        button.dataset.copied = "true";
        window.setTimeout(() => {
          delete button.dataset.copied;
        }, 900);
      } catch {
        button.dataset.copied = "false";
      }
    });
  });

  const qrLinks = document.querySelector(".contact-links");
  const qrToggle = document.querySelector("[data-qr-toggle]");
  const qrPanel = document.querySelector("#wechat-qr-panel");
  const qrClose = document.querySelector("[data-qr-close]");

  const setQrOpen = (isOpen) => {
    qrLinks?.classList.toggle("is-qr-open", isOpen);
    qrToggle?.setAttribute("aria-expanded", String(isOpen));
    qrPanel?.setAttribute("aria-hidden", String(!isOpen));
  };

  qrToggle?.addEventListener("click", () => {
    const isOpen = qrLinks?.classList.contains("is-qr-open") || false;
    setQrOpen(!isOpen);
  });

  qrClose?.addEventListener("click", () => {
    setQrOpen(false);
  });
})();
