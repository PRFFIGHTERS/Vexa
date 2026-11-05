function openViewer(src){
  const v = document.getElementById('imgViewer');
  v.querySelectorAll('img').forEach(i => i.remove());
  const img = document.createElement('img');
  img.src = src;
  v.appendChild(img);
  v.classList.add('open');
}
document.getElementById('viewerClose').onclick = () => document.getElementById('imgViewer').classList.remove('open');
document.getElementById('imgViewer').addEventListener('click', e => {
  if (e.target.id === 'imgViewer') document.getElementById('imgViewer').classList.remove('open');
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){
    closeContext(); closeModal(); closeActionSheet();
    if (State.pageStack.length) closeTopPage();
    else if (document.getElementById('chatOverlay').classList.contains('open')) closeChat();
  }
});
