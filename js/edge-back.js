(function edgeBack(){
  const EDGE = 28;
  let startX = 0, startY = 0, active = null, dragging = false, pageEl = null;

  document.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    const t0 = e.touches[0];
    if (t0.clientX > EDGE) return;
    const overlay = document.getElementById('chatOverlay');
    const topPage = State.pageStack[State.pageStack.length-1];
    if (topPage) pageEl = topPage.el;
    else if (overlay.classList.contains('open')) pageEl = overlay;
    else pageEl = null;
    if (!pageEl) return;
    active = true;
    dragging = false;
    startX = t0.clientX;
    startY = t0.clientY;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!active) return;
    const t0 = e.touches[0];
    const dx = t0.clientX - startX;
    const dy = t0.clientY - startY;
    if (!dragging){
      if (Math.abs(dy) > Math.abs(dx) + 4){ active = false; return; }
      if (dx > 6){ dragging = true; pageEl.classList.add('dragging'); }
    }
    if (dragging && dx > 0){
      e.preventDefault();
      pageEl.style.transform = `translateX(${dx}px)`;
    }
  }, { passive: false });

  document.addEventListener('touchend', e => {
    if (!active) return;
    active = false;
    if (!dragging) return;
    pageEl.classList.remove('dragging');
    const cur = parseFloat((pageEl.style.transform.match(/-?\d+(\.\d+)?/) || [0])[0]) || 0;
    const w = window.innerWidth;
    if (cur > w * 0.3){
      pageEl.style.transform = '';
      if (pageEl.id === 'chatOverlay') closeChat();
      else closeTopPage();
    } else {
      pageEl.style.transform = 'translateX(0)';
      pageEl.style.transition = 'transform .25s cubic-bezier(.2,.9,.3,1)';
      setTimeout(() => { pageEl.style.transition = ''; pageEl.style.transform = ''; }, 260);
    }
    pageEl = null; dragging = false;
  });
})();
