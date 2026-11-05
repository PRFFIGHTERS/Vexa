/* ============================================================
   AVATAR CROPPER (как в Telegram / WhatsApp)
   ============================================================ */
function openAvatarCropper(file, onSave){
  const reader = new FileReader();
  reader.onload = () => {
    const src = reader.result;
    const bd = document.createElement('div');
    bd.className = 'cropper-bd open';
    bd.innerHTML = `
      <div class="cropper">
        <div class="cropper-title">${LANG==='ru'?'Настройте фото':'Adjust photo'}</div>
        <div class="cropper-stage" id="cropStage">
          <img id="cropImg" src="${src}" draggable="false"/>
        </div>
        <input type="range" class="cropper-zoom" id="cropZoom" min="0.5" max="3" step="0.01" value="1"/>
        <div class="cropper-hint">${LANG==='ru'?'Двигайте пальцем, масштаб — слайдером':'Drag with finger, zoom with slider'}</div>
        <div class="cropper-actions">
          <button class="btn btn-2" id="cropCancel">${LANG==='ru'?'Отмена':'Cancel'}</button>
          <button class="btn" id="cropSave">${LANG==='ru'?'Сохранить':'Save'}</button>
        </div>
      </div>`;
    document.body.appendChild(bd);

    const stage = bd.querySelector('#cropStage');
    const img   = bd.querySelector('#cropImg');
    const zoom  = bd.querySelector('#cropZoom');
    const STAGE = 280;
    let scale = 1, tx = 0, ty = 0;
    let baseW = 0, baseH = 0;

    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio > 1){ baseH = STAGE; baseW = STAGE * ratio; }
      else { baseW = STAGE; baseH = STAGE / ratio; }
      img.style.width  = baseW + 'px';
      img.style.height = baseH + 'px';
      tx = (STAGE - baseW) / 2;
      ty = (STAGE - baseH) / 2;
      apply();
    };

    function apply(){
      img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }

    let dragging = false, sx = 0, sy = 0, otx = 0, oty = 0;
    stage.addEventListener('pointerdown', e => {
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      otx = tx; oty = ty;
      try { stage.setPointerCapture(e.pointerId); } catch(_){}
      e.preventDefault();
    });
    stage.addEventListener('pointermove', e => {
      if (!dragging) return;
      tx = otx + (e.clientX - sx);
      ty = oty + (e.clientY - sy);
      apply();
      e.preventDefault();
    });
    const endDrag = e => {
      dragging = false;
      try { stage.releasePointerCapture(e.pointerId); } catch(_){}
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    zoom.addEventListener('input', () => {
      const nz = parseFloat(zoom.value) || 1;
      const cx = STAGE/2, cy = STAGE/2;
      tx = cx - (cx - tx) * (nz / scale);
      ty = cy - (cy - ty) * (nz / scale);
      scale = nz;
      apply();
    });

    bd.querySelector('#cropCancel').onclick = () => bd.remove();

    bd.querySelector('#cropSave').onclick = () => {
      const OUT = 400;
      const cv = document.createElement('canvas');
      cv.width = OUT; cv.height = OUT;
      const ctx = cv.getContext('2d');
      ctx.save();
      ctx.beginPath();
      ctx.arc(OUT/2, OUT/2, OUT/2, 0, Math.PI*2);
      ctx.clip();
      const k = OUT / STAGE;
      ctx.translate(tx * k, ty * k);
      ctx.scale(scale * k, scale * k);
      try { ctx.drawImage(img, 0, 0, baseW, baseH); } catch(_){}
      ctx.restore();
      const dataURL = cv.toDataURL('image/png');
      cv.toBlob(blob => {
        bd.remove();
        onSave(blob, dataURL);
      }, 'image/png', 0.92);
    };
  };
  reader.readAsDataURL(file);
}
