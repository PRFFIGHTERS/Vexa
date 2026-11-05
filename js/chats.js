function chatsForTab(tab){
  const all = DB.chatsOf(State.me.id);
  switch(tab){
    case 'personal': return all.filter(c => c.type === 'personal');
    case 'group':    return all.filter(c => c.type === 'group');
    case 'channel':  return all.filter(c => c.type === 'channel');
    case 'unread':   return all.filter(c => (c.unread||0) > 0);
    case 'saved':    return all.filter(c => c.type === 'saved');
    default: return all;
  }
}
function chatTitle(chat){
  if (!chat) return '—';
  if (chat.type === 'saved') return LANG === 'ru' ? 'Избранное' : 'Saved messages';
  if (chat.type === 'personal'){
    const other = (chat.members||[]).find(id => String(id) !== String(State.me.id));
    const u = DB.findUserById(other);
    return u ? displayName(u) : '—';
  }
  return chat.title || '—';
}
function chatAvatarUser(chat){
  if (!chat) return null;
  if (chat.type === 'personal'){
    const other = (chat.members||[]).find(id => String(id) !== String(State.me.id));
    return DB.findUserById(other);
  }
  return null;
}
function chatPreview(chat){
  const msgs = DB.getMessages(chat.id);
  if (!msgs.length) return '';
  const last = msgs[msgs.length-1];
  if (last.deleted) return t('msg.deleted');
  const sender = DB.findUserById(last.senderId);
  const prefix = (chat.type === 'group' || chat.type === 'channel') && sender ? displayName(sender).split(' ')[0] + ': ' : '';
  if (last.attachments && last.attachments.length){
    const att = last.attachments[0];
    if ((att.type||'').startsWith('image/')) return prefix + (LANG==='ru'?'Фото':'Photo');
    if ((att.type||'').startsWith('video/')) return prefix + (LANG==='ru'?'Видео':'Video');
    return prefix + (att.name||'file');
  }
  return prefix + (last.text || '').slice(0, 60);
}

function renderChats(){
  if (!State.me) return;
  const list = document.getElementById('chatList');
  if (!list) return;
  list.innerHTML = '';
  const chats = chatsForTab(State.activeTab).sort((a,b) => {
    const am = DB.getMessages(a.id), bm = DB.getMessages(b.id);
    const at = am.length ? am[am.length-1].createdAt : a.createdAt;
    const bt = bm.length ? bm[bm.length-1].createdAt : b.createdAt;
    return bt - at;
  });
  if (!chats.length){
    list.innerHTML = `
      <div class="chat-empty">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <h3>${esc(State.activeTab === 'all' ? t('empty.chats') : t('empty.cat'))}</h3>
        <p>${esc(State.activeTab === 'all' ? t('empty.chats_sub') : t('empty.cat_sub'))}</p>
        ${State.activeTab === 'all' ? `<button class="btn btn-sm" id="emptyNewBtn">${esc(t('empty.start'))}</button>` : ''}
      </div>`;
    document.getElementById('emptyNewBtn')?.addEventListener('click', openActionSheet);
    return;
  }
  chats.forEach(c => {
    const row = el(`
      <div class="chat-row" data-id="${c.id}">
        <div class="avatar av-54"></div>
        <div class="chat-meta">
          <div class="chat-name"><span class="title"></span>${c.pinned ? ' 📌' : ''}</div>
          <div class="chat-preview"></div>
        </div>
        <div class="chat-side">
          <div class="chat-time"></div>
          ${(c.unread||0) > 0 ? `<div class="badge${c.muted ? ' muted' : ''}">${c.unread}</div>` : (c.muted ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" stroke-width="2"><path d="M13.7 21a2 2 0 01-3.4 0M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M2 2l20 20"/></svg>' : '')}
        </div>
      </div>`);
    const av = row.querySelector('.avatar');
    const otherU = chatAvatarUser(c);
    if (c.type === 'saved'){ av.style.background = 'linear-gradient(135deg,#2ECC71,#27AE60)'; av.textContent = '★'; }
    else if (c.avatar) av.innerHTML = `<img src="${esc(c.avatar)}" alt=""/>`;
    else if (otherU && otherU.avatar) av.innerHTML = `<img src="${esc(otherU.avatar)}" alt=""/>`;
    else if (otherU) av.textContent = initials(otherU);
    else av.textContent = ((c.title||'?')[0] || '?').toUpperCase();
    row.querySelector('.title').textContent = chatTitle(c);
    row.querySelector('.chat-preview').textContent = chatPreview(c);
    const msgs = DB.getMessages(c.id);
    const last = msgs[msgs.length-1];
    row.querySelector('.chat-time').textContent = last ? fmtTime(last.createdAt) : '';
    row.onclick = () => openChat(c.id);
    row.oncontextmenu = e => { e.preventDefault(); openChatContext(e, c.id); };
    list.appendChild(row);
  });
}
document.querySelectorAll('#tabs .tab').forEach(tb => {
  tb.onclick = () => {
    document.querySelectorAll('#tabs .tab').forEach(x => x.classList.remove('on'));
    tb.classList.add('on');
    State.activeTab = tb.dataset.tab;
    renderChats();
  };
});
