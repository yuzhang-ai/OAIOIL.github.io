(() => {
  const picker = document.querySelector('.edition-picker');
  if (!picker) return;
  const trigger = picker.querySelector('summary');
  document.addEventListener('pointerdown', (event) => {
    if (picker.open && !picker.contains(event.target)) picker.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && picker.open) {
      picker.open = false;
      trigger.focus();
    }
  });
  picker.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !picker.contains(event.relatedTarget)) picker.open = false;
  });
})();
