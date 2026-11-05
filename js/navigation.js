function openPage({ title, bodyHtml, onMount, onClose, backBtn = true }){
  const container = document.getElementById('pagesContainer');
  const page = el(`
    <div class="page">
      <div class="page-header">
        ${backBtn ? `<button class="icon-btn page-back"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>` : ''}
        <h2>${esc(title)}</h2>
      </div>
      <div class="page-body">${bodyHtml}</div>
    </div>`);
  container.appendChild(page);
  requestAnimationFrame(() => page.classList.add('open'));
  const record = { el: page, onClose };
  State.pageStack.push(record);
  page.querySelector('.page-back')?.addEventListener('click', () => closeTopPage());
  if (onMount) onMount(page);
  return page;
}
function closeTopPage(){
  const rec = State.pageStack.pop();
  if (!rec) return;
  rec.el.classList.remove('open');
  setTimeout(() => { rec.el.remove(); }, 400);
  if (rec.onClose) rec.onClose();
}
function closeAllPages(){ while (State.pageStack.length) closeTopPage(); }

const bottomNav = document.getElementById('bottomNav');
const navIndicator = document.getElementById('navIndicator');
const navButtons = [...bottomNav.querySelectorAll('button')];

function positionIndicator(btn, animate = true){
  if (!btn) return;
  const navRect = bottomNav.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  if (!animate) navIndicator.style.transition = 'none';
  navIndicator.style.left = (btnRect.left - navRect.left) + 'px';
  navIndicator.style.width = btnRect.width + 'px';
  if (!animate){ navIndicator.offsetHeight; navIndicator.style.transition = ''; }
}
function currentNavBtn(){ return navButtons.find(b => b.classList.contains('on')); }

function switchNav(name){
  State.activeNav = name;
  navButtons.forEach(b => b.classList.toggle('on', b.dataset.nav === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-'+name));
  positionIndicator(currentNavBtn());
  if (name === 'contacts') renderContactsList();
  if (name === 'calls') renderCallsList();
  if (name === 'me') updateMePanel();
}

let navDrag = null;
let navJustDragged = false;
bottomNav.addEventListener('pointerdown', e => {
  navDrag = { startX: e.clientX, startBtn: currentNavBtn(), moved: false, pointerId: e.pointerId };
});
bottomNav.addEventListener('pointermove', e => {
  if (!navDrag) return;
  const dx = e.clientX - navDrag.startX;
  if (!navDrag.moved && Math.abs(dx) < 4) return;
  if (!navDrag.moved){
    navDrag.moved = true;
    bottomNav.classList.add('dragging');
    navIndicator.style.transition = 'none';
    try { bottomNav.setPointerCapture(navDrag.pointerId); } catch(_){}
  }
  const navRect = bottomNav.getBoundingClientRect();
  const width = navIndicator.offsetWidth || 80;
  let left = (navDrag.startBtn ? navDrag.startBtn.offsetLeft : 0) + dx;
  left = Math.max(6, Math.min(left, navRect.width - width - 6));
  navIndicator.style.left = left + 'px';
  const centerX = navRect.left + left + width/2;
  let nearest = null, minD = Infinity;
  navButtons.forEach(b => {
    const r = b.getBoundingClientRect();
    const d = Math.abs(r.left + r.width/2 - centerX);
    if (d < minD){ minD = d; nearest = b; }
  });
  navButtons.forEach(b => b.classList.toggle('on', b === nearest));
});
bottomNav.addEventListener('pointerup', e => {
  if (!navDrag) return;
  try { bottomNav.releasePointerCapture(navDrag.pointerId); } catch(_){}
  bottomNav.classList.remove('dragging');
  const wasDrag = navDrag.moved;
  const btn = navButtons.find(b => b.classList.contains('on')) || navDrag.startBtn;
  const targetNav = btn ? btn.dataset.nav : null;
  navDrag = null;
  if (wasDrag){
    navJustDragged = true;
    setTimeout(() => { navJustDragged = false; }, 150);
    if (targetNav) switchNav(targetNav);
  }
});
bottomNav.addEventListener('pointercancel', () => {
  if (!navDrag) return;
  try { bottomNav.releasePointerCapture(navDrag.pointerId); } catch(_){}
  bottomNav.classList.remove('dragging');
  navDrag = null;
  positionIndicator(currentNavBtn());
});
navButtons.forEach(b => {
  b.addEventListener('click', () => {
    if (navDrag || navJustDragged) return;
    switchNav(b.dataset.nav);
  });
});
window.addEventListener('resize', () => positionIndicator(currentNavBtn(), false));

document.getElementById('btnStart').onclick = () => {
  const sid = DB.getSession();
  if (sid && DB.findUserById(sid)) { bootUser(sid); return; }
  showScreen('auth');
};
document.querySelectorAll('#langWelcome button').forEach(b => {
  b.onclick = () => { setLang(b.dataset.lang); toast(t('toast.lang_switched')); };
});
