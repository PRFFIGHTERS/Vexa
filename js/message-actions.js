function toggleReaction(msgId, emoji){
  const m = DB.getMessage(msgId); if (!m) return;
  if (!m.reactions) m.reactions = {};
  if (!m.reactions[emoji]) m.reactions[emoji] = [];
  const idx = m.reactions[emoji].indexOf(State.me.id);
  if (idx >= 0) m.reactions[emoji].splice(idx, 1);
  else m.reactions[emoji].push(State.me.id);
  if (!m.reactions[emoji].length) delete m.reactions[emoji];
  DB.persist(); renderMessages();
}

function attachSwipeReply(wrap, msgId){
  let startX = 0, startY = 0, dx = 0, active = false, pulled = false, triggered = false;
  wrap.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dx = 0; active = true; pulled = false; triggered = false;
    wrap.classList.remove('dragging');
  }, { passive: true });
  wrap.addEventListener('touchmove', e => {
    if (!active) return;
    const t0 = e.touches[0];
    const mx = t0.clientX - startX;
    const my = t0.clientY - startY;
    if (Math.abs(my) > Math.abs(mx) + 6 && !pulled){ active = false; return; }
    dx = mx;
    if (dx > 0 && !pulled){
      if (Math.abs(my) > 20){ active = false; return; }
    }
    if (dx > 0){
      e.preventDefault();
      wrap.classList.add('dragging');
      const capped = Math.min(80, dx);
      const eased = dx < 60 ? dx * 0.9 : 54 + (capped - 60) * 0.3;
      wrap.style.transform = `translateX(${eased}px)`;
      if (!pulled) { pulled = true; wrap.classList.add('pulled'); }
      if (dx >= 55 && !triggered){ triggered = true; wrap.classList.add('triggered'); }
      else if (dx < 55 && triggered){ triggered = false; wrap.classList.remove('triggered'); }
    }
  }, { passive: false });
  const end = () => {
    if (!active) return;
    wrap.classList.remove('dragging');
    if (triggered){
      wrap.style.transition = 'transform .3s cubic-bezier(.2,.9,.3,1)';
      wrap.style.transform = 'translateX(0)';
      wrap.classList.remove('pulled','triggered');
      setTimeout(() => { wrap.style.transition = ''; wrap.style.transform = ''; }, 320);
      if (navigator.vibrate) navigator.vibrate(15);
      setReply(msgId);
    } else {
      wrap.style.transition = 'transform .3s cubic-bezier(.2,.9,.3,1)';
      wrap.style.transform = 'translateX(0)';
      wrap.classList.remove('pulled','triggered');
      setTimeout(() => { wrap.style.transition = ''; wrap.style.transform = ''; }, 320);
    }
    active = false; pulled = false; triggered = false;
  };
  wrap.addEventListener('touchend', end);
  wrap.addEventListener('touchcancel', end);
}

function attachLongPress(node, msgId){
  let timer = null;
  let moved = false;
  let startX = 0, startY = 0;
  let pressTarget = null;
  const start = e => {
    if (e.touches && e.touches.length > 1) return;
    const t0 = (e.touches && e.touches[0]) || e;
    startX = t0.clientX; startY = t0.clientY;
    moved = false;
    pressTarget = node.querySelector('.msg');
    timer = setTimeout(() => {
      if (moved) return;
      if (navigator.vibrate) navigator.vibrate(20);
      pressTarget?.classList.add('pressing');
      setTimeout(() => pressTarget?.classList.remove('pressing'), 180);
      openMessageActions(msgId);
    }, 480);
  };
  const move = e => {
    const t0 = (e.touches && e.touches[0]) || e;
    const dx = t0.clientX - startX;
    const dy = t0.clientY - startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8){ moved = true; clearTimeout(timer); }
  };
  const end = () => { clearTimeout(timer); };
  node.addEventListener('touchstart', start, { passive: true });
  node.addEventListener('touchmove', move, { passive: true });
  node.addEventListener('touchend', end);
  node.addEventListener('touchcancel', end);
  node.addEventListener('mousedown', start);
  node.addEventListener('mousemove', move);
  node.addEventListener('mouseup', end);
  node.addEventListener('mouseleave', end);
}

function openMessageActions(msgId){
  const m = DB.getMessage(msgId); if (!m) return;
  const mine = String(m.senderId) === String(State.me.id);
  const bd = document.getElementById('sheetBd');
  const body = document.getElementById('sheetBody');
  const items = [];

  items.push(`
    <button class="sheet-item" data-a="reply">
      <div class="sheet-ico i-reply"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14l-5-5 5-5M4 9h10a6 6 0 016 6v6"/></svg></div>
      <span>Ответить</span>
    </button>`);
  items.push(`
    <button class="sheet-item" data-a="copy">
      <div class="sheet-ico i-copy"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></div>
      <span>Копировать</span>
    </button>`);

  if (mine && !m.deleted){
    items.push(`
      <button class="sheet-item danger" data-a="delme">
        <div class="sheet-ico i-trash"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/></svg></div>
        <span>Удалить</span>
      </button>`);
  }

  body.innerHTML = `
    <div class="sheet-title">Действия</div>
    ${items.join('')}
    <button class="sheet-cancel" data-a="cancel">${esc(t('sheet.cancel'))}</button>`;
  bd.classList.add('open');

  body.querySelectorAll('button[data-a]').forEach(btn => {
    btn.onclick = () => {
      const a = btn.dataset.a;
      closeActionSheet();
      setTimeout(() => {
        if (a === 'reply') setReply(msgId);
        else if (a === 'copy'){ navigator.clipboard?.writeText(m.text || ''); toast(t('toast.copied'), 'ok'); }
        else if (a === 'delme'){
          DB.deleteMessage(msgId, false);
          renderMessages(); renderChats();
          toast(t('toast.msg_deleted_me'), 'ok');
        }
      }, 120);
    };
  });
}

const msgInput = document.getElementById('msgInput');
const btnSend = document.getElementById('btnSend');
const replyBar = document.getElementById('replyBar');
const replyText = document.getElementById('replyText');
msgInput.addEventListener('input', () => {
  btnSend.disabled = !msgInput.value.trim();
  msgInput.style.height = 'auto';
  msgInput.style.height = Math.min(150, msgInput.scrollHeight) + 'px';
});
msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey){
    e.preventDefault(); sendMessage();
  }
});
function setReply(msgId){
  State.replyTo = msgId;
  const m = DB.getMessage(msgId); if (!m) return;
  replyText.textContent = (m.text || '📎').slice(0, 80);
  replyBar.classList.add('on');
  msgInput.focus();
}
document.getElementById('replyCancel').onclick = () => {
  State.replyTo = null; State.editing = null;
  replyBar.classList.remove('on');
};

async function sendMessage(){
  if (!State.activeChat) return;
  const text = msgInput.value.trim(); if (!text) return;
  const chatId = String(State.activeChat.id);
  const replyTo = State.replyTo;

  msgInput.value = ''; msgInput.style.height = 'auto';
  btnSend.disabled = true;
  State.replyTo = null; replyBar.classList.remove('on');

  try {
    const r = await fetch(API + '/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: chatId,
        senderId: String(State.me.id),
        text: text,
        replyTo: replyTo
      })
    });
    const data = await r.json();
    if (!data.ok){ toast(t('toast.server_error'), 'err'); return; }

    if (data.message && data.message.id > (State.lastSeenMsgId||0)){
      State.lastSeenMsgId = data.message.id;
      localStorage.setItem('vexa.lastMsgId', String(State.lastSeenMsgId));
    }

    await syncMessagesFromServer(chatId);
  } catch (e) {
    console.error(e);
    toast(t('toast.no_connection'), 'err');
  }
}
btnSend.onclick = sendMessage;
