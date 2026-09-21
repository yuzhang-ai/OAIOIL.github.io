(() => {
  const compact = matchMedia('(max-width: 900px)');
  const cards = [...document.querySelectorAll('#tools .tool-card')];
  const entries = cards.map((card, index) => {
    const detail = card.querySelectorAll('p')[1];
    const small = card.querySelector('small');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool-disclosure';
    detail.id = `tool-detail-${index}`;
    button.setAttribute('aria-controls', detail.id);
    button.setAttribute('aria-label', `查看 ${card.querySelector('h3').textContent} 的分工`);
    card.insertBefore(button, detail);
    const entry = {card, detail, small, button, group: Math.floor(index / 4)};
    button.addEventListener('click', () => {
      const opening = button.getAttribute('aria-expanded') !== 'true';
      entries.filter(e => e.group === entry.group).forEach(e => setOpen(e, false));
      setOpen(entry, opening);
    });
    return entry;
  });
  function setOpen(entry, open) {
    entry.button.setAttribute('aria-expanded', String(open));
    entry.button.textContent = open ? '收起 −' : '查看分工 ＋';
    entry.detail.hidden = compact.matches && !open;
    entry.small.hidden = compact.matches && !open;
  }
  function sync() { entries.forEach(e => setOpen(e, false)); }
  compact.addEventListener('change', sync);
  sync();

  const track = document.querySelector('.work-stack');
  const pages = [...track.querySelectorAll('.stack-card')];
  track.setAttribute('aria-label', '核心经历，左右滑动翻阅');
  const controls = document.createElement('div');
  controls.className = 'work-mobile-controls';
  const prev = document.createElement('button'), next = document.createElement('button'), count = document.createElement('span');
  prev.type = next.type = 'button';
  prev.textContent = '←'; next.textContent = '→';
  prev.setAttribute('aria-label', '上一段经历'); next.setAttribute('aria-label', '下一段经历');
  count.setAttribute('aria-live', 'polite');
  controls.append(prev, count, next); track.after(controls);
  let active = 0;
  function update(index) {
    active = index; count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
    prev.disabled = index === 0; next.disabled = index === pages.length - 1;
  }
  function go(step) {
    const target = pages[Math.max(0, Math.min(pages.length - 1, active + step))];
    track.scrollTo({left: track.scrollLeft + target.getBoundingClientRect().left - track.getBoundingClientRect().left,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(items => {
      if (!compact.matches) return;
      items.forEach(item => { if (item.intersectionRatio > .6) update(pages.indexOf(item.target)); });
    }, {root: track, threshold: .6});
    pages.forEach(page => observer.observe(page));
  }
  update(0);
})();
